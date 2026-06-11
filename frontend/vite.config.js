import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true, // Siguron që Hot Reload të punojë saktë brenda Docker-it
      }
    }
})
