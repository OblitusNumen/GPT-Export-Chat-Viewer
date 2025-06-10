<template>
    <div v-if="messageNode">
        <div v-if="messageNode.message !== null">
            <div
                v-html="renderedMessage"
                :class="['message', messageNode.message.author.role, 'bg-gray-100 dark:bg-gray-700 text-black dark:text-white']"
            />
        </div>

        <div v-if="messageNode.children.length > 1" class="flex items-center space-x-4 mt-2">
            <button
                @click="emit('branchChange', { choice: messageNode.children[currentIndex - 1] })"
                :disabled="nextId === messageNode.children[0]"
                class="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                aria-label="Previous"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <span class="text-gray-700 dark:text-gray-300 font-medium select-none">
        {{ currentIndex + 1 }} / {{ messageNode.children.length }}
      </span>

            <button
                @click="emit('branchChange', { choice: messageNode.children[currentIndex + 1] })"
                :disabled="nextId === messageNode.children[messageNode.children.length - 1]"
                class="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                aria-label="Next"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'
import type { Message, MessageContent, MessageNode } from '@/types.ts'

const props = defineProps<{
    messageNode: MessageNode | undefined
    nextId: string | null
    getAssetUrl: (filename: string) => string | undefined
}>()

const emit = defineEmits<{
    (e: 'branchChange', payload: { choice: string }): void
}>()

const renderedMessage = ref('')

// Compute current child index for navigation
const currentIndex = computed(() => {
    if (!props.messageNode || !props.nextId) return 0
    return props.messageNode.children.indexOf(props.nextId)
})

watch(
    () => props.messageNode?.message,
    async (newMessage) => {
        renderedMessage.value = newMessage ? await renderMessage(newMessage) : ''
    },
    { immediate: true }
)

// ----- Core Message Rendering -----
async function renderMessage(message: Message): Promise<string> {
    return await renderMessagePart(message.content, message)
}

async function renderMessagePart(content: MessageContent, message: Message): Promise<string> {
    switch (content.content_type) {
        case 'multimodal_text':
            return (await Promise.all(content.parts!.map(p => renderMessagePart(p, message)))).join('')

        case 'text':
            return (await Promise.all(content.parts!.map(p => marked.parse(p)))).join('')

        case 'tether_browsing_display':
            return await marked.parse(content.result!)

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

            if (src) {
                return `<img src="${sanitizeUrl(src)}" style="max-height:50vh; max-width:100%; margin-top:10px;" alt="Image" />`
            } else {
                return `<div style="color:red">[Missing image: ${id}]</div>`
            }
        }

        default:
            return Promise.resolve(`<div style="color:gray;">[Unsupported content: ${content.content_type}]</div>`)
    }
}

function getAttachmentById(attachments: { id: string; name: string }[], targetId: string) {
    return attachments.find(attachment => attachment.id === targetId)
}

function sanitizeUrl(url: string): string {
    return /^https:\/\/|^data:image|^blob:/.test(url) ? url : ''
}
</script>

<style scoped>
.message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
    word-break: break-word;
}
.user {
    align-self: flex-end;
    background-color: #d1fae5;
}
.assistant {
    align-self: flex-start;
    background-color: #f3f4f6;
}
.dark .user {
    background-color: #065f46;
}
.dark .assistant {
    background-color: #1f2937;
}
</style>
