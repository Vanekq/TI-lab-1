import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Указываем корневую папку
  root: 'src',
  
  // Настройки сервера разработки
  server: {
    port: 34115,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
  
  // Настройки сборки
  build: {
    // Папка для выходных файлов (относительно корня проекта)
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  
  // Оптимизация зависимостей
  optimizeDeps: {
    include: []
  }
})