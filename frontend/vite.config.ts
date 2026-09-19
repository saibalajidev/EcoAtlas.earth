import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Allow public tunnel hostnames (Cloudflare Quick Tunnels for demos).
    // For permanent hosting, replace with your real domain.
    allowedHosts: ['cam-bloomberg-plasma-penguin.trycloudflare.com', '.trycloudflare.com'],
    proxy: { '/api': 'http://localhost:8000' }
  },
  build: { chunkSizeWarningLimit: 1200 }
})
