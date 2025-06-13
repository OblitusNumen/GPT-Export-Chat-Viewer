<template>
    <div v-if="messageNode" class="flex flex-col space-y-2 px-4">
        <div
            v-if="messageNode.message !== null"
            :class="[
        'message max-w-3xl rounded-xl p-4 text-base whitespace-pre-wrap leading-relaxed',
        messageNode.message.author.role === 'user'
          ? 'self-end bg-green-100 dark:bg-emerald-800 text-black dark:text-white'
          : 'self-start bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
      ]"
            v-html="renderedMessage"
        />

        <div
            v-if="parentChildren.length > 1"
            class="flex items-center justify-center space-x-4 mt-3"
        >
            <button
                @click="emit('branchChange', { choice: parentChildren[currentIndex - 1] })"
                :disabled="messageNode.id === parentChildren[0]"
                class="chat-nav-btn"
                aria-label="Previous"
            >
                <ChevronLeftIcon/>
            </button>

            <span class="text-gray-600 dark:text-gray-300 font-medium">
                {{ currentIndex + 1 }} / {{ parentChildren.length }}
            </span>

            <button
                @click="emit('branchChange', { choice: parentChildren[currentIndex + 1] })"
                :disabled="messageNode.id === parentChildren[parentChildren.length - 1]"
                class="chat-nav-btn"
                aria-label="Next"
            >
                <ChevronRightIcon/>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import type {Tokens} from 'marked'
import {marked, Renderer} from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-vue-next'
import type {Message, MessageContent, MessageNode} from '@/types.ts'

const props = defineProps<{
    messageNode: MessageNode | undefined
    getAssetUrl: (filename: string) => string | undefined
    parentChildren: string[]
}>()

const emit = defineEmits<{
    (e: 'branchChange', payload: { choice: string }): void
}>()

const renderedMessage = ref('')

const currentIndex = computed(() => {
    if (!props.messageNode) return 0
    return props.parentChildren.indexOf(props.messageNode.id)
})

watch(
    () => props.messageNode?.message,
    async (newMessage) => {
        renderedMessage.value = newMessage ? await renderMessage(newMessage) : ''
    },
    {immediate: true}
)

async function renderMessage(message: Message): Promise<string> {
    return await renderMessagePart(message.content, message)
}

async function renderMessagePart(content: MessageContent, message: Message): Promise<string> {
    switch (content.content_type) {
        case 'multimodal_text':
            return (await Promise.all(content.parts!.map(p => renderMessagePart(p, message)))).join('')
        case 'text':
            return (await Promise.all(content.parts!.map(p => parseMarked(p)))).join('')
        case 'tether_browsing_display':
            return await parseMarked(content.result!)
        case 'image_asset_pointer': {
            const id = content.asset_pointer!.replace(/^file-service:\/\//, '').replace(/^sediment:\/\//, '')
            let src: string | undefined

            if (content.metadata?.dalle == null) {
                const attachment = getAttachmentById(message.metadata!.attachments, id)
                if (attachment) {
                    src = props.getAssetUrl(`${id}-${attachment.name}`)
                }
            } else {
                src = props.getAssetUrl(id)
            }

            return src
                ? `<img src="${sanitizeUrl(src)}" class="max-h-[50vh] w-auto mt-4 rounded-lg shadow" alt="Image" />`
                : `<div class="text-red-500">[Missing image: ${id}]</div>`
        }
        default:
            return `<div class="text-gray-400">[Unsupported content: ${content.content_type}]</div>`
    }
}

function getAttachmentById(attachments: { id: string; name: string }[], targetId: string) {
    return attachments.find(attachment => attachment.id === targetId)
}

function sanitizeUrl(url: string): string {
    return /^https:\/\/|^data:image|^blob:/.test(url) ? url : ''
}

function sanitizeText(text: string): string {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
}

async function parseMarked(content: string): Promise<string> {
    const renderer = new Renderer()

    renderer.code = ({text, lang}: Tokens.Code): string => {
        const validLang = lang && hljs.getLanguage(lang)
        const highlighted = validLang
            ? hljs.highlight(text, {language: lang}).value
            : hljs.highlightAuto(text).value

        return `<pre><code class="hljs ${lang ?? ''}">${highlighted}</code></pre>`
    }

    marked.use({renderer})

    return marked.parse(sanitizeText(content))
}

</script>

<style scoped>
.message * {
    overflow-wrap: break-word;
    word-break: break-word;
}

pre {
    background-color: #0d1117;
    color: #c9d1d9;
    padding: 1em;
    border-radius: 0.5rem;
    margin-top: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.5;
}

code {
    font-family: 'Fira Code', monospace;
}

.chat-nav-btn {
    @apply p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition dark:bg-gray-700 dark:hover:bg-gray-600;
}
</style>
