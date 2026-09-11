import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'grupo-de-estudos-4b504'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Proxy dinâmico para Cloud Functions em dev local — evita bloqueio de CORS
        '/functions-proxy': {
          target: `https://southamerica-east1-${projectId}.cloudfunctions.net`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/functions-proxy/, ''),
          secure: true,
        },
        // Compatibilidade com path anterior
        '/southamerica-east1-grupo-de-estudos-4b504': {
          target: 'https://southamerica-east1-grupo-de-estudos-4b504.cloudfunctions.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/southamerica-east1-grupo-de-estudos-4b504/, ''),
          secure: true,
        },
      },
    },
  }
})
