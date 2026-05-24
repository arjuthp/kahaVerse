import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth calls → Kaha Main V3 (production)
      // Rewrites: /api/v1/auth/... → /auth/...
      '/api/v1/auth': {
        target: 'https://api.kaha.com.np/main/api/v3',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace('/api/v1/auth', '/auth'),
      },
      // Everything else → Restaurant E-Commerce Backend (NestJS port 3001)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
