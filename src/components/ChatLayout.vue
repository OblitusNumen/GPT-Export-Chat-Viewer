<template>
    <div class="flex h-screen w-screen overflow-hidden">
        <!-- Sidebar -->
        <div v-if="showSidebar" class="w-64 bg-gray-100 border-r border-gray-300 flex flex-col">
            <div class="p-4 border-b border-gray-300 flex justify-between items-center">
                <span class="font-bold">Chats</span>
                <Button icon="pi pi-times" class="p-button-sm p-button-text" @click="toggleSidebar" />
            </div>
            <ul class="flex-1 overflow-y-auto">
                <li
                    v-for="chat in conversations"
                    :key="chat.id"
                    @click="selectedChat = chat"
                    :class="['p-4 cursor-pointer hover:bg-gray-200', { 'bg-gray-300': selectedChat && chat.id === selectedChat.id }]"
                >
                    {{ chat.title || `Chat ${chat.id}` }}
                </li>
            </ul>
        </div>

        <!-- Restore Sidebar Button -->
        <div v-else class="w-12 bg-gray-100 border-r border-gray-300 flex items-center justify-center">
            <Button icon="pi pi-bars" class="p-button-sm p-button-text" @click="toggleSidebar" />
        </div>

        <!-- Main Chat Area -->
        <div class="flex-1 bg-white p-6 overflow-auto">
            <Chat v-if="selectedChat != null" :chatMapping="selectedChat.mapping"/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import Button from 'primevue/button'
import Chat from "@/components/Chat.vue";

const conversations = ref<any[]>([]);
const selectedChat = ref<any>(null);

onMounted(() => {
    fetch("/conversations.json")
        .then(res => res.json())
        .then(data => {
            conversations.value = Array.isArray(data) ? data : data.items;
            console.log(conversations.value);
        })
        .catch(err => {
            console.error("Error loading JSON:", err);
        });
})

const showSidebar = ref(true)

const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
}
</script>

<style scoped>
/* Optional custom styles */
</style>
