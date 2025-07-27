<template>
    <div v-if="messageNode" class="flex flex-col space-y-2 px-4">
        <div
                v-if="messageNode.message !== null"
                :class="[
                    'message max-w-3xl rounded-xl p-4 text-base leading-relaxed prose dark:prose-invert',
                    messageNode.message.author.role === 'user'
                    ? 'self-end bg-green-100 dark:bg-emerald-800 text-black dark:text-white'
                    : 'self-start text-black dark:text-white w-full'
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
import 'highlight.js/styles/github-dark.css'


import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-vue-next'
import type {Message, MessageContent, MessageNode} from '@/types.ts'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
    messageNode: MessageNode | undefined
    getAssetUrl: (filename: string) => string | undefined
    parentChildren: string[]
}>()

const emit = defineEmits<{
    (e: 'branchChange', payload: { choice: string }): void
}>()

const renderedMessage = ref('')

const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
})

md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const code = token.content.trim()
    const lang = token.info.trim().split(/\s+/g)[0] || 'text'
    const validLang = hljs.getLanguage(lang)
    const highlighted = validLang
        ? hljs.highlight(code, { language: lang }).value
        : md.utils.escapeHtml(code)

    return `
    <div class="code-block bg-gray-100 dark:bg-gray-800 rounded text-sm">
      <div class="code-header">
        <span class="code-lang">${lang}</span>
        <button class="copy-btn" onclick="copyToClipboard(this)">📋</button>
      </div>
      <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
    </div>
  `.trim()
}

md.renderer.rules.code_inline = (tokens, idx) => {
    const content = tokens[idx].content
    return `<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">${content}</code>`
}

window.copyToClipboard = (btn: any) => {
    const code = btn.closest('.code-block')?.querySelector('code')
    if (!code) return
    const text = code.innerText
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✅'
        setTimeout(() => (btn.textContent = '📋'), 1500)
    })
}

async function parseMarked(content: string, markdown: boolean): Promise<string> {
    if (!markdown) return sanitizeText(content)
    return md.render(content)
}

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
            return (await Promise.all(content.parts!.map(p => parseMarked(p, message.author.role !== "user")))).join('')
        case 'tether_browsing_display':
            return await parseMarked(content.result!, message.author.role !== "user")
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
    // const div = document.createElement("div")
    // div.textContent = text
    // return div.innerHTML
    return text
}

</script>

<style scoped>
.prose code {
    background-color: #f3f4f6; /* light gray */
    color: #1f2937; /* Tailwind gray-800 */
    padding: 0.15em 0.4em;
    border-radius: 0.25rem;
    font-size: 0.95em;
    border: 1px solid #d1d5db; /* Tailwind gray-300 */
    font-weight: 500;
}

.dark .prose code {
    background-color: #1f2937; /* dark gray */
    color: #f9fafb; /* near white */
    border: 1px solid #4b5563; /* Tailwind gray-600 */
}

code {
    font-family: 'Fira Code', monospace;
}

.chat-nav-btn {
    @apply p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition dark:bg-gray-700 dark:hover:bg-gray-600;
}

:deep(.code-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151; /* Tailwind gray-700 */
}

.dark :deep(.code-header) {
    color: #d1d5db; /* Tailwind gray-300 */
}

:deep(pre) {
    background: transparent !important;
    padding: 0 !important;
    margin: 0;
    overflow-x: auto;
}

:deep(pre code) {
    background: transparent !important;
    display: block;
    padding: 0.5rem;
}

</style>
