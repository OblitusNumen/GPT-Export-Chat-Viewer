<template>
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div
            v-if="showSidebar"
            class="w-64 bg-gray-100 p-4 shadow-md transition-all duration-300"
        >
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold">Chats</h2>
                <Button icon="pi pi-times" class="p-button-sm" @click="toggleSidebar"/>
            </div>
            <ul>
                <li
                    v-for="(chat, index) in conversations"
                    :key="chat.id"
                    class="py-2 px-3 hover:bg-gray-200 rounded cursor-pointer"
                    @click="curChat = chat"
                >
                    {{ chat.title || `Chat ${chat.id}` }}
                </li>
            </ul>
        </div>

        <!-- Restore button -->
        <div
            v-else
            class="w-12 flex flex-col items-center justify-start p-2 bg-gray-100 shadow-md"
        >
            <Button icon="pi pi-bars" class="p-button-sm mb-2" @click="toggleSidebar"/>
        </div>

        <!-- Main content -->
        <div class="flex-1 bg-white p-4">
            <Chat v-if="curChat != null" :chatMapping="curChat.mapping"/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import Button from 'primevue/button'
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

const showSidebar = ref(true)

function toggleSidebar() {
    showSidebar.value = !showSidebar.value
}
</script>

<style scoped>
/* Optional custom styles */
</style>
