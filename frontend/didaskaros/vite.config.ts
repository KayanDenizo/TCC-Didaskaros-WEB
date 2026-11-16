import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // abre o navegador na landing qnd roda npm run dev
    open: true,
    // manda o /api pro backend (npm run dev dentro do backend/)
    proxy: { '/api': 'http://localhost:3333' },
  },
})
