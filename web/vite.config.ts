import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy para Cloud Functions em dev local — evita bloqueio de CORS
      '/southamerica-east1-grupo-de-estudos-4b504': {
        target: 'https://southamerica-east1-grupo-de-estudos-4b504.cloudfunctions.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/southamerica-east1-grupo-de-estudos-4b504/, ''),
        secure: true,
      },
    },
  },
})
