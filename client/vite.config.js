import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Module ids are POSIX-normalized by Vite, so "/" is the only separator
const vendor = (pkgs) => new RegExp(`node_modules/(${pkgs})/`)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honor an assigned PORT (e.g. from preview tooling); default stays 5173
    port: Number(globalThis.process?.env?.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor code in its own chunks: a LEGION release then
        // invalidates only the app chunk in users' caches, and the entry
        // chunk stays under the bundler's 500 kB advisory.
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: vendor('react|react-dom|scheduler|react-router|react-router-dom') },
            { name: 'vendor-supabase', test: vendor('@supabase') },
          ],
        },
      },
    },
  },
})
