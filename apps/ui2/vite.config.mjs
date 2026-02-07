import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@griffin/types': path.resolve(__dirname, '../../libs/types/src/index.ts'),
      '@nestjs/common': path.resolve(__dirname, './src/mocks/nestjs-common.ts'),
      '@prisma/client': path.resolve(__dirname, './src/mocks/prisma-client.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@griffin/types'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
