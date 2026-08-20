import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honor an assigned PORT (e.g. from preview tooling); default stays 5173
    port: Number(globalThis.process?.env?.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
