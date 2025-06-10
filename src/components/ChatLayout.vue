<template>
    <div
        class="relative h-screen w-screen overflow-hidden bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">

        <!-- Floating Theme Button -->
        <button
            class="fixed top-4 right-4 z-50 bg-gray-200 dark:bg-gray-800 text-black dark:text-white border rounded-full p-2 shadow hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            @click="toggleTheme"
        >
            🌓
        </button>

        <!-- Restore Sidebar Button -->
        <button
            v-if="!showSidebar"
            class="absolute top-4 left-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 shadow"
            @click="toggleSidebar"
        >
            ▶
        </button>

        <!-- Main Layout -->
        <div class="h-full w-full flex">
            <!-- Sidebar -->
            <div v-if="showSidebar"
                 class="w-64 h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 flex flex-col">
                <div class="p-4 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
                    <span class="font-bold">Chats</span>
                    <button class="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                            @click="toggleSidebar">◀
                    </button>
                </div>
                <ul class="flex-1 overflow-y-auto">
                    <li
                        v-for="chat in conversations"
                        :key="chat.id"
                        @click="selectedChat = chat"
                        :class="['p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700', selectedChat?.id === chat.id ? 'bg-gray-300 dark:bg-gray-700' : '']"
                    >
                        {{ chat.title || `Chat ${chat.id}` }}
                    </li>
                </ul>
            </div>

            <!-- Main Content -->
            <div class="flex-1 h-full p-6 overflow-auto bg-white dark:bg-gray-900">
                <ChatView v-if="selectedChat"
                          :chat-mapping="selectedChat.mapping"
                          :current-node-id="selectedChat.current_node"
                          :resolve-asset-path="resolveAssetPath"
                />
                <div v-else class="text-gray-400 dark:text-gray-500 text-center mt-32">
                    Select a chat from the sidebar
                </div>

                <!-- Upload Area -->
                <div
                    v-if="!zipLoaded"
                    class="mt-8 border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    @drop.prevent="handleDrop"
                    @dragover.prevent
                    @click="fileInput?.click()"
                >
                    <p>📁 Drag and drop a ZIP file here or click to select</p>
                    <input type="file" accept=".zip" ref="fileInput" class="hidden" @change="handleFileChange"/>
                </div>

                <!-- Floating Button: Change ZIP -->
                <button
                    v-if="zipLoaded"
                    class="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow hover:bg-blue-700 transition"
                    @click="fileInput?.click()"
                >
                    🔄 Change ZIP
                </button>
                <input type="file" accept=".zip" ref="fileInput" class="hidden" @change="handleFileChange"/>

            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import JSZip from 'jszip'
import ChatView from '@/components/ChatView.vue'
import type {Conversation} from '@/types.ts'

const showSidebar = ref(true)
const conversations = ref<Conversation[]>([])
const selectedChat = ref<Conversation | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const zipLoaded = ref(false)

const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
}

// THEME SUPPORT
const theme = ref<'light' | 'dark'>('light')

const applyTheme = () => {
    if (theme.value === 'dark') {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

const detectSystemTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    applyTheme()
}

const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme()
}

// Handle system theme change dynamically
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    theme.value = e.matches ? 'dark' : 'light'
    applyTheme()
})

// ZIP Handling
const handleFileChange = async (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files.length > 0) {
        await loadZip(files[0])
    }
}

const handleDrop = async (e: DragEvent) => {
    if (e.dataTransfer?.files.length) {
        await loadZip(e.dataTransfer.files[0])
    }
}

const assetMap = new Map<string, Blob>() // Store all assets from zip

const resolveAssetPath = (prefix: string): string | undefined => {
    for (const [filename, blob] of assetMap.entries()) {
        if (filename.startsWith(prefix)) {
            return URL.createObjectURL(blob)
        }
    }
    return undefined
}


const loadZip = async (file: File) => {
    try {
        const zip = await JSZip.loadAsync(file)

        // Try to locate conversations.json
        const fileEntry = zip.file('conversations.json')
        if (!fileEntry) {
            alert('conversations.json not found in the ZIP file.')
            return
        }

        // Parse conversations
        const json = await fileEntry.async('string')
        const parsed = JSON.parse(json)
        conversations.value = Array.isArray(parsed) ? parsed : parsed.items
        selectedChat.value = null
        zipLoaded.value = true

        // Load all assets (excluding folders)
        assetMap.clear()
        for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
                const blob = await zipEntry.async('blob')
                const filename = path.split('/').pop()! // Flatten to base filename
                assetMap.set(filename, blob)
            }
        }
    } catch (err) {
        console.error('Failed to load ZIP file:', err)
        alert('Failed to read ZIP file. Make sure it contains a valid conversations.json.')
    }
}

// Initial theme detection
onMounted(() => {
    detectSystemTheme()
})
</script>

<style scoped>
/* optional scoped styles if needed */
</style>
