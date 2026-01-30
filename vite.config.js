import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info', // Show server info and errors
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port
    hmr: {
      port: 5173, // Ensure HMR uses same port
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});