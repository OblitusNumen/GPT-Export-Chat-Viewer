<template>
    <div class="mx-auto max-w-[1000px]">
        <div
            class="flex flex-col space-y-4 px-4 py-6 bg-background text-foreground min-h-screen transition-colors">
            <Message
                v-for="(messageId, index) in curRoute"
                :key="messageId"
                :message-node="chatMapping[messageId]"
                @branch-change="payload => updateRoute(payload.choice)"
                :next-id="findNextNodeId(index)"
                :get-asset-url="getAssetUrl"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import Message from '@/components/Message.vue'
import type {MessageNode} from '@/types'

const props = defineProps<{
    currentNodeId: string
    chatMapping: Record<string, MessageNode>
    resolveAssetPath: (prefix: string) => string | undefined
}>()

const curRoute = ref<string[]>([])

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

const findNextNodeId = (index: number): string | null => {
    return curRoute.value[index + 1] || null
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
