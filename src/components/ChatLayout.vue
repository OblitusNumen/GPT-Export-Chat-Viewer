<template>
    <div
        class="relative h-screen w-screen overflow-hidden bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">

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
                <div class="p-4 border-b border-gray-300 dark:border-gray-600">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold">Chats ({{ conversations.length }})</span>
                        <button class="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                                @click="toggleSidebar">◀
                        </button>
                    </div>
                    <div class="relative">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search chats..."
                            class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pr-8"
                        />
                        <button
                            v-if="searchQuery"
                            @click="searchQuery = ''"
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white text-lg leading-none"
                            title="Clear search"
                        >
                            ×
                        </button>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2 text-sm">
                        <div class="flex items-center gap-1">
                            <span class="text-gray-600 dark:text-gray-300">Sort by:</span>
                            <button
                                :class="['px-2 py-1 rounded', sortKey === 'create_time' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200']"
                                @click="sortKey = 'create_time'"
                            >
                                Created
                            </button>
                            <button
                                :class="['px-2 py-1 rounded', sortKey === 'update_time' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200']"
                                @click="sortKey = 'update_time'"
                            >
                                Updated
                            </button>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-gray-600 dark:text-gray-300">Order:</span>
                            <button
                                :class="['px-2 py-1 rounded', sortOrder === 'asc' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200']"
                                @click="sortOrder = 'asc'"
                            >
                                Asc
                            </button>
                            <button
                                :class="['px-2 py-1 rounded', sortOrder === 'desc' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200']"
                                @click="sortOrder = 'desc'"
                            >
                                Desc
                            </button>
                        </div>
                    </div>
                </div>
                <ul class="flex-1 overflow-y-auto">
                    <li
                        v-for="chat in sortedConversations"
                        :key="chat.id"
                        @click="selectedChat = chat"
                        :class="['p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700', selectedChat?.id === chat.id ? 'bg-gray-300 dark:bg-gray-700' : '']"
                    >
                        <span v-html="highlightMatch(chatName(chat))"></span>
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
import {computed, onMounted, ref} from 'vue'
import JSZip from 'jszip'
import ChatView from '@/components/ChatView.vue'
import type {Conversation, ConversationsFile, Message, MessageContent, MessageNode} from '@/types.ts'

const showSidebar = ref(true)
const conversations = ref<Conversation[]>([])
const selectedChat = ref<Conversation | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const zipLoaded = ref(false)

const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
}

const searchQuery = ref('')

const sortKey = ref<'create_time' | 'update_time'>('update_time')
const sortOrder = ref<'asc' | 'desc'>('desc')

const chatName = (chat: Conversation) => {
    return chat.title || `Chat ${chat.id}`
}

const filteredConversations = computed(() => {
    const query = searchQuery.value.toLowerCase()
    return conversations.value.filter(chat =>
        chatName(chat).toLowerCase().includes(query)
    )
})

const sortedConversations = computed(() => {
    return [...filteredConversations.value].sort((a, b) => {
        const timeA = a[sortKey.value] ?? 0
        const timeB = b[sortKey.value] ?? 0
        return sortOrder.value === 'asc' ? timeA - timeB : timeB - timeA
    })
})

// Utility to escape HTML
const escapeHTML = (str: string): string =>
    str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

// Highlight matched text in chat titles
const highlightMatch = (title: string): string => {
    const query = searchQuery.value.trim()
    if (!query) return escapeHTML(title)

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
    return escapeHTML(title).replace(regex, '<mark>$1</mark>')
}

// THEME SUPPORT
const applyTheme = () => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

const detectSystemTheme = () => {
    applyTheme()
}

// Handle system theme change dynamically
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyTheme()
})

// Initial theme detection
onMounted(() => {
    detectSystemTheme()
})

// ZIP Handling
const assetMap = new Map<string, Blob>() // Store all assets from zip

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

        //is grok
        const grokSave = zip.file(new RegExp(/^(.*\/prod-grok-backend\.json)$/i))
        if (grokSave.length == 1) {
            // Parse conversations
            const json = await grokSave[0].async('string')
            const parsed = JSON.parse(json)


            const transformed: ConversationsFile = []
            for (let convo of parsed.conversations) {
                const mapping: Record<string, MessageNode> = {}
                for (let response of convo.responses) {
                    const mc: MessageContent = {
                        content_type: "text",
                        parts: [response.response.message]
                    }
                    let role = response.response.sender;
                    switch (role) {
                        case "human":
                            role = "user"
                    }
                    const message: Message = {
                        id: response.response["_id"],
                        author: {
                            role: role,
                        },
                        create_time: response.response.create_time["$date"]["$numberLong"] / 1000.,
                        update_time: response.response.create_time["$date"]["$numberLong"] / 1000.,
                        content: mc,
                    }
                    const response_parent = response.response["parent_response_id"];
                    const messageNode: MessageNode = {
                        children: [],
                        id: response.response["_id"],
                        message: message,
                        parent: response_parent ? response_parent : null
                    }
                    mapping[messageNode.id] = messageNode
                }
                for (let mappingKey in mapping) {
                    let node = mapping[mappingKey]
                    if (node.parent) {
                        mapping[node.parent].children.push(node.id)
                    }
                }
                let currentNode: MessageNode | null = null
                for (let mappingKey in mapping) {
                    let node = mapping[mappingKey]
                    if (node.children.length == 0 && (!currentNode || node.message?.create_time! > currentNode.message!.create_time)) {
                        currentNode = node
                    }
                }

                const conversationT: Conversation = {
                    id: convo.conversation.id,
                    title: convo.conversation.title,
                    create_time: new Date(convo.conversation.create_time).getTime() / 1000.,
                    update_time: new Date(convo.conversation.modify_time).getTime() / 1000.,
                    mapping: mapping,
                    current_node: currentNode?.id!,
                }
                transformed.push(conversationT)
            }

            conversations.value = transformed.sort((a: Conversation, b: Conversation) => b.update_time - a.update_time)
            selectedChat.value = null
            zipLoaded.value = true
            console.log(conversations.value)
            return
        }

        // Try to locate conversations.json
        const fileEntry = zip.file('conversations.json')
        if (!fileEntry) {
            alert('conversations.json not found in the ZIP file.')
            return
        }

        // Parse conversations
        const json = await fileEntry.async('string')
        const parsed = JSON.parse(json)
        conversations.value = (Array.isArray(parsed) ? parsed : parsed.items).sort((a: Conversation, b: Conversation) => b.update_time - a.update_time)
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
</script>

<style scoped>
/* optional scoped styles if needed */
</style>
