import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    watch: {
      // Prevent ENOSPC "file watchers" errors on Linux with low inotify limits
      // by using polling instead of inotify watchers.
      usePolling: true,
      interval: 750,
      ignored: ['**/node_modules/**', '**/dist/**', '**/stitch_ama_web_frontend_view/**'],
    },
    proxy: {
      // API calls → Restaurant E-Commerce Backend
      // All /api/v1/* requests go to http://localhost:3001
      '^/api/v1/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
