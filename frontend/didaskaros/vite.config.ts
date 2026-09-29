import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Encaminha /api para o backend (npm run dev dentro de backend/)
    proxy: { '/api': 'http://localhost:3333' },
  },
})
