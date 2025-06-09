import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    build: {
        minify: true,
        rollupOptions: {
            output: {
                entryFileNames: `app.js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name][extname]`
            }
        }
    }
})
