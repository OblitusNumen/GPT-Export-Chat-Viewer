<template>
    <Message v-for="(messageId, index) in curRoute"
             :key="messageId" :message-node="chatMapping[messageId]"
             @branch-change="payload => updRoute(payload.choice)"
             :next-id="findNextNodeId(index)"/>
</template>

<script setup lang="ts">
import {onMounted, onUpdated, ref, watch} from 'vue';
import Message from "@/components/Message.vue";
import type {MessageNode} from "@/types.ts";

const props = defineProps<{
    currentNodeId: string;
    chatMapping: Record<string, MessageNode>;
}>();

const curNodeId = ref<string | null>(null)
const curRoute = ref<string[]>([])

const setCurNode = (value: string) => {
    curNodeId.value = value;
    curRoute.value = chatRoute(value);
}

const chatRoute = (curNodeId: string): string[] => {
    if (curNodeId === null) {
        return [];
    }
    let curMsg = props.chatMapping[curNodeId];
    let chatRoute = [curNodeId];
    while (curMsg.parent !== null) {
        curMsg = props.chatMapping[curMsg.parent];
        chatRoute.unshift(curMsg.id);
    }
    return chatRoute;
}

const leafId = (routeNodeId: string): string => {
    let leaf = routeNodeId;
    while (props.chatMapping[leaf].children.length > 0) leaf = props.chatMapping[leaf].children[0];
    return leaf;
}

const updRoute = (routeNodeId: string) => {
    setCurNode(leafId(routeNodeId));
}

const findNextNodeId = (index: number) => {
    // console.log(index);
    // console.log(curRoute.value.length > (index + 1) ? curRoute.value[index + 1] : null);
    return curRoute.value.length > (index + 1) ? curRoute.value[index + 1] : null
}

watch(() => props.currentNodeId, (newVal) => {
  setCurNode(newVal);
}, { immediate: true });

// onMounted(() => {
//     setCurNode(props.currentNodeId);
// })
</script>

<style scoped>

</style>