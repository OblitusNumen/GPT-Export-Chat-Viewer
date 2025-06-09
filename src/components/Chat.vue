<template>
    <div class="chat">
        <Message v-for="(messageId, index) in chatRoute"
                 :key="messageId" :message="chatMapping[messageId]"
                 @branchChange="payload => updRoute(payload.choice)"
                 :next-id="findNextNodeId(index)"/>
    </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import Message from "@/components/Message.vue";

const props = defineProps<{
    chatMapping: any
}>();

const curNode = ref<string | null>(null)
const curRoute = ref<string[]>([])

const setCurNode = (value: string) => {
    curNode.value = value;
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
    console.log(index);
    console.log(curRoute.value.length > (index + 1) ? curRoute.value[index + 1] : null);
    return curRoute.value.length > (index + 1) ? curRoute.value[index + 1] : null
}

onMounted(() => {
    curNode.value = props.chatMapping.current_node;
})
</script>

<style scoped>

</style>