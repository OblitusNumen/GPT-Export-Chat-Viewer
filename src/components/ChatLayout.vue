<template>
    <div class="relative h-screen w-screen overflow-hidden">
        <!-- Restore Button (Absolutely top-left, outside the layout) -->
        <button
            v-if="!showSidebar"
            class="absolute top-4 left-4 z-50 bg-white border border-gray-300 rounded p-2 shadow"
            @click="toggleSidebar"
        >
            ▶
        </button>

        <!-- Main Flex Layout -->
        <div class="h-full w-full flex">
            <!-- Sidebar: Visible when showSidebar is true -->
            <div
                v-if="showSidebar"
                class="w-64 h-full bg-gray-100 border-r border-gray-300 flex flex-col"
            >
                <div class="p-4 border-b border-gray-300 flex justify-between items-center">
                    <span class="font-bold">Chats</span>
                    <button
                        class="text-sm text-gray-600 hover:text-black"
                        @click="toggleSidebar"
                    >
                        ◀
                    </button>
                </div>
                <ul class="flex-1 overflow-y-auto">
                    <li v-for="chat in conversations"
                        :key="chat.id" @click="selectedChat = chat"
                        :class="['p-4 cursor-pointer hover:bg-gray-200',selectedChat?.id === chat.id ? 'bg-gray-300' : '']"
                    >
                        {{ chat.title || `Chat ${chat.id}` }}
                    </li>
                </ul>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 h-full bg-white p-6 overflow-auto">
                <div v-if="selectedChat">
                    <ChatView :chat-mapping="selectedChat.mapping" :current-node-id="selectedChat.current_node"/>
                </div>
                <div v-else class="text-gray-400 text-center mt-32">Select a chat from the sidebar</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import ChatView from '@/components/ChatView.vue'
import type {Conversation} from "@/types.ts";

const showSidebar = ref(true)
const conversations = ref<Conversation[]>([])
const selectedChat = ref<Conversation | null>(null)

const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
}

onMounted(() => {
    fetch('/conversations.json')
        .then(res => res.json())
        .then(data => {
            conversations.value = Array.isArray(data) ? data : data.items
        })
        .catch(console.error)
})
</script>
