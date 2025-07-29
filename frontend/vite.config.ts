import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist/public'),
    emptyOutDir: true,
  },
  server: {
    port: 5173, // Use Vite's default port to avoid conflict with backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Updated to match backend port
        changeOrigin: true,
      },
    },
  },
})
