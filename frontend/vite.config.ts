import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    cors: true, // ✅ อนุญาตทุก origin หรือใช้ origin: 'http://your-backend.com'
  },
  build: {
    manifest: true, // ✅ เปิดใช้งาน manifest.json สำหรับ production
    modulePreload: {
      polyfill: false, // ✅ ใช้ตัวเลือกที่ถูกต้อง
    },
    rollupOptions: {
      input: 'index.html', // ✅ ให้ใช้ index.html เป็น entry point
    },
  },
})
