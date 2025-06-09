<template>
    <!--    <div-->
    <!--        v-for="(node, index) in path"-->
    <!--        :key="node.id"-->
    <!--        v-if="node.message"-->
    <!--        :class="['message', node.message.author.role]"-->
    <!--    >-->
    <div v-if="message.message" :class="['message', message.message.author.role]">
        <div v-html="renderMessageParts(message)"></div>
    </div>
    <button v-if="message.children.length > 1 && nextId != message.children[0]"
            @click="emit('branchChange', {choice: message.children[message.children.findIndex(nextId)-1]})"> <
    </button>
    <button v-if="message.children.length > 1 && nextId != message.children[message.children.length-1]"
            @click="emit('branchChange', {choice: message.children[message.children.findIndex(nextId)+1]})"> >
    </button>
    <!--        &lt;!&ndash; Alternate assistant replies &ndash;&gt;-->
    <!--        <div v-if="showAlternateAssistantReplies(node)">-->
    <!--            <strong>Alternate replies:</strong><br />-->
    <!--            <button-->
    <!--                v-for="(sibling, idx) in getAssistantSiblings(node)"-->
    <!--                :key="sibling.id"-->
    <!--                @click="selectAlternatePath(sibling.id)"-->
    <!--            >-->
    <!--                Option {{ idx + 1 }}-->
    <!--            </button>-->
    <!--        </div>-->

    <!--        &lt;!&ndash; Alternate branches under user &ndash;&gt;-->
    <!--        <div v-if="showAlternateBranches(node)">-->
    <!--            <strong>Replies to this prompt:</strong><br />-->
    <!--            <button-->
    <!--                v-for="(assistant, idx) in getAssistantChildren(node)"-->
    <!--                :key="assistant.id"-->
    <!--                @click="selectAlternatePath(assistant.id)"-->
    <!--            >-->
    <!--                Option {{ idx + 1 }}-->
    <!--            </button>-->
    <!--        </div>-->
    <!--    </div>-->
</template>

<script setup lang="ts">

const props = defineProps<{
    message: any;
    nextId: string | null;
}>();

const emit = defineEmits<{
    (e: 'branchChange', payload: { choice: string }): void;
}>();

function renderMessageParts(message: any) {
    const parts = parseMessageParts(message);
    return parts.map(p => renderPart(p)).join('');
}

function parseMessageParts(message) {
    const content = message.content;

    if (Array.isArray(content?.parts)) {
        return content.parts.map(p => {
            if (typeof p === "string") return {type: "text", text: p};
            if (p.type === "image_url") return {type: "image", url: p.image_url.url};
            if (p.type === "text") return {type: "text", text: p.text};
            return {type: "text", text: JSON.stringify(p)};
        });
    }

    return [{type: "text", text: JSON.stringify(content)}];
}

function renderPart(part) {
    if (part.type === "image") {
        return `<img src="${sanitizeUrl(part.url)}" style="max-width:100%; margin-top:10px;" alt="Image" />`;
    } else {
        return sanitizeText(part.text);
    }
}

function sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeUrl(url) {
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
