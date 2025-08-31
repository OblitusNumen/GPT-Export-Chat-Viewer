<template>
    <div class="mx-auto max-w-[1000px]">
        <div
            class="flex flex-col space-y-4 px-4 py-6 bg-background text-foreground min-h-screen transition-colors">
            <Message
                v-for="(messageId) in curRoute"
                :key="messageId"
                :message-node="chatMapping[messageId]"
                @branch-change="payload => updateRoute(payload.choice)"
                :get-asset-url="getAssetUrl"
                :parent-children="chatMapping[messageId].parent === null ? [] : chatMapping[chatMapping[messageId].parent].children"
            />
        </div>
    </div>
    <button
        icon="pi pi-save"
        class="fixed top-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow hover:bg-blue-700 transition"
        @click="saveMarkdown"
    >
        &#x2B73;
    </button>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import Message from '@/components/Message.vue'
import type {MessageContent, MessageNode} from '@/types'

const props = defineProps<{
    currentNodeId: string
    chatMapping: Record<string, MessageNode>
    resolveAssetPath: (prefix: string) => string | undefined
}>()

const curRoute = ref<string[]>([])

function sanitizeMarkdownHtml(input: string): string {
    let safe = input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Then unescape only allowed tags
    // noinspection JSMismatchedCollectionQueryUpdate
    const allowedTags: string[] = [];// = ["b", "i", "em", "strong", "a", "code"];
    for (const tag of allowedTags) {
        const reOpen = new RegExp(`&lt;(${tag})(\\s[^&gt;]*)?&gt;`, "gi");
        const reClose = new RegExp(`&lt;/(${tag})&gt;`, "gi");
        safe = safe.replace(reOpen, "<$1$2>").replace(reClose, "</$1>");
    }

    //preserve spacing
    safe = safe.replace(/ {2}/g, '&nbsp;&nbsp;');
    return `<div style="white-space: pre-wrap;">\n${safe}\n</div>`;
}

function mdFromMessagePart(content: MessageContent, escapeMD: boolean): string | null {
    switch (content.content_type) {
        case 'multimodal_text':
            return content.parts!.map(p => mdFromMessagePart(p, escapeMD)).join('')
        case 'text':
            return (escapeMD ? content.parts!.map(sanitizeMarkdownHtml) : content.parts!).join('')
        default:
            return null
    }
}

function mdFromNode(chatMappingElement: MessageNode): string | null {
    if (chatMappingElement && chatMappingElement.message !== null
        && (chatMappingElement.message.author.role === 'user' || chatMappingElement.message.author.role === 'assistant')) {
        return mdFromMessagePart(chatMappingElement.message.content, chatMappingElement.message.author.role === 'user');
    }
    return null
}

function getMD(): string {
    let route = curRoute.value;
    let md = "";
    for (let i = 0; i < route.length; i++) {
        let message = mdFromNode(props.chatMapping[route[i]])
        if (message === null || message === "")
            continue
        md = md + message;
        if (i < route.length - 1)
            md = md + "\n\n---\n---\n\n\n\n";
    }
    return md;
}

function decodeUnicode(str: string): string {
  return str.replace(/\\u([\dA-Fa-f]{4})/g, (_, g1) =>
    String.fromCharCode(parseInt(g1, 16))
  );
}

function saveMarkdown() {
  let mdText = getMD();
  mdText = decodeUnicode(mdText);
  mdText = mdText.replace(/\\n/g, "\n");

  const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.md";
  link.click();
  URL.revokeObjectURL(url);
}

const getAssetUrl = (prefix: string): string | undefined => {
    return props.resolveAssetPath(prefix)
}

const setCurNode = (nodeId: string) => {
    const route: string[] = []
    let current: MessageNode | null = props.chatMapping[nodeId]
    while (current) {
        route.unshift(current.id)
        current = current.parent ? props.chatMapping[current.parent] : null
    }
    curRoute.value = route
}

const updateRoute = (nodeId: string) => {
    let leaf = nodeId
    while (props.chatMapping[leaf].children.length > 0) {
        leaf = props.chatMapping[leaf].children[0]
    }
    setCurNode(leaf)
}

watch(
    () => props.currentNodeId,
    (newId) => {
        setCurNode(newId)
    },
    {immediate: true}
)
</script>

<style scoped>
/* Apply dark/light theme from Tailwind (theme integration assumed) */
</style>
