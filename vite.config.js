import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:3005'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Dev uniquement — en prod le frontend appelle directement backendUrl
        '/api': {
          target: 'http://127.0.0.1:3005',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://127.0.0.1:3005',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  }
})
