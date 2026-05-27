import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // API calls → Restaurant E-Commerce Backend
      // Routes specific API paths to localhost:3001
      // Excludes static assets, HTML, and other frontend resources
      '^/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/menu': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/cart': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/order': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/categories': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/addon': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/menu-ratings': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
