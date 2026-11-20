import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
  // The Wyndbase devtools load TanStack Query devtools with a dynamic import; pre-bundle it so Vite resolves it.
  optimizeDeps: { include: ['@tanstack/react-query-devtools/production'] },
})
