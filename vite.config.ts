import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Forward API calls to our Node backend (holds the MiniMax key server-side).
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 8787}`,
        changeOrigin: true,
      },
      // Legacy: direct MiniMax proxy (only used by VITE_AI_PROVIDER=minimax).
      '/minimax': {
        target: 'https://api.minimaxi.chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minimax/, ''),
      },
    },
  },
})
