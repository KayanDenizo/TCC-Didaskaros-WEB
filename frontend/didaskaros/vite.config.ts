import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Abre o navegador na landing page ao rodar npm run dev
    open: true,
    // Encaminha /api para o backend (npm run dev dentro de backend/)
    proxy: { '/api': 'http://localhost:3333' },
  },
})
