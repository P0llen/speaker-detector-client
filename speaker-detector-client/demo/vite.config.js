import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const PORT = Number(process.env.DEMO_PORT || process.env.PORT) || 5173
const BACKEND = process.env.DEMO_BACKEND || 'http://localhost:9000'

// Vite config just for the demo app
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      // Allow using the same path aliases used in the lib
      '@components': path.resolve(__dirname, '../src/components'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@lib': path.resolve(__dirname, '../src/lib')
    }
  },
  server: {
    port: PORT,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist')
  }
})
