<template>
    <div v-if="messageNode">
        <div v-if="messageNode.message !== null">
            <div v-html="renderedMessage" :class="['message', messageNode.message.author.role]"/>
        </div>

        <div v-if="messageNode.children.length > 1" class="flex items-center space-x-4 mt-2">
            <button
                @click="emit('branchChange', { choice: messageNode.children[currentIndex - 1] })"
                :disabled="nextId === messageNode.children[0]"
                class="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                aria-label="Previous"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>

            <!-- Current child index / total -->
            <span class="text-gray-700 font-medium select-none">
                {{ currentIndex + 1 }} / {{ messageNode.children.length }}
            </span>
            <button
                @click="emit('branchChange', { choice: messageNode.children[currentIndex + 1] })"
                :disabled="nextId === messageNode.children[messageNode.children.length - 1]"
                class="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                aria-label="Next"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import {marked} from 'marked';
import type {Message, MessageContent, MessageNode} from "@/types.ts";
import {computed, onMounted, ref, watch} from "vue";
import * as fs from "node:fs";
import * as path from "node:path";

const props = defineProps<{
    messageNode: MessageNode | undefined;
    nextId: string | null;
}>();

const renderedMessage = ref('');

// Whenever the message changes, call the async render function
watch(() => props.messageNode?.message, async (newMessage) => {
    renderedMessage.value = newMessage ? await renderMessage(newMessage) : '';
}, {immediate: true});

onMounted(() => {
    // console.log(props.messageNode);
})

const emit = defineEmits<{
    (e: 'branchChange', payload: { choice: string }): void;
}>();

// Assuming `nextId` and `messageNode` are props or reactive variables
// Calculate the current child's index based on nextId
const currentIndex = computed(() => {
    if (!props.messageNode || !props.messageNode.children || !props.nextId) return 0
    return props.messageNode.children.indexOf(props.nextId)
})

async function renderMessage(message: Message): Promise<string> {
    return await renderMessagePart(message.content, message)
}

async function renderMessagePart(content: MessageContent, message: Message): Promise<string> {
    switch (content.content_type) {
        case "multimodal_text": {
            return (await Promise.all(content.parts!.map(async (p: MessageContent) => {
                return await renderMessagePart(p, message);
            }))).join('');
        }
        case "text": {
            return (await Promise.all(content.parts!.map(async (p: string) => {
                return await marked.parse(p);
            }))).join('');
        }
        case "tether_browsing_display": {
            return await marked.parse(content.result!);
        }
        case "image_asset_pointer": {
            let id = content.asset_pointer!.replace("file-service://", "")
            let src
            if (content.metadata!.dalle == null) {
                src = `${id}-${getAttachmentById(message.metadata!.attachments, id)!.name}`
            } else {
                src = findFileWithPrefix("/dalle-generations", id)
            }
            return `<img src="${src}" style="max-height:50vh; max-width:100%; margin-top:10px;" alt="Image" />`;
        }
        default:
            return Promise.resolve(content.content_type)
    }
}

/**
 * Finds the first filename in the given directory that starts with the specified prefix.
 * @param dirPath - The directory path relative to the project root (e.g. "public/images").
 * @param prefix - The prefix to match filenames against.
 * @returns The first filename that starts with the prefix, or undefined if not found.
 */
function findFileWithPrefix(dirPath: string, prefix: string): string | undefined {
  const fullPath = path.resolve(dirPath);

  try {
    const files = fs.readdirSync(fullPath);
    return files.find((file: any) => file.startsWith(prefix));
  } catch (error) {
    console.error(`Failed to read directory: ${fullPath}`, error);
    return undefined;
  }
}

function getAttachmentById(attachments: { id: string; name: string }[], targetId: string) {
    return attachments.find(attachment => attachment.id === targetId);
}

// async function renderPart(contentType: string, part: string): Promise<string> {
//     if (contentType === 'tether_browsing_display')
//         return await marked.parse()
//     if (contentType === "text")
//         return await marked.parse(part);
//     if (contentType === "image") {
//         return `<img src="${sanitizeUrl(part)}" style="max-width:100%; max-height:100%; margin-top:10px;" alt="Image" />`;
//     } else {
//         return ''
//     }
// }

function sanitizeText(text: any) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeUrl(url: any) {
    // Only allow https:// URLs or data:images
    if (/^https:\/\/|^data:image/.test(url)) return url;
    return "";
}
</script>

<style scoped>
.message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
}

.user {
    align-self: flex-end;
}

.assistant {
    align-self: flex-start;
}
</style>
