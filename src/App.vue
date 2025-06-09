<template>
    <head>
        <meta charset="UTF-8"/>
        <title>ChatGPT Local Viewer</title>
    </head>
    <body class="w-full">
    <div class="container">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-item" v-for="chat in conversations" :key="chat.id" @click="curChat = chat">
                {{ chat.title || `Chat ${chat.id}` }}
            </div>
        </aside>
        <main class="chat w-full" id="chat">
            <Chat v-if="curChat != null" :chatMapping="curChat.mapping"/>
        </main>
    </div>
    </body>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import Chat from "@/components/Chat.vue";

const conversations = ref([]);
const curChat = ref(null);

onMounted(() => {
    fetch("/conversations.json")
        .then(res => res.json())
        .then(data => {
            conversations.value = Array.isArray(data) ? data : data.items;
        })
        .catch(err => {
            console.error("Error loading JSON:", err);
        });
})
</script>

<style scoped>
body {
    margin: 0;
    font-family: sans-serif;
}

.sidebar {
    width: 250px;
    overflow-y: auto;
    padding: 10px;
}

.sidebar-item {
    padding: 10px;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}

.sidebar-item:hover {
    background: #ddd;
}

.chat {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.message pre {
    padding: 10px;
    overflow-x: auto;
}
</style>
