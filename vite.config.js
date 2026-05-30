import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mantém o alias "@/" que antes era configurado pelo @base44/vite-plugin.
      // fileURLToPath + import.meta.url é necessário porque "type":"module" no
      // package.json torna __dirname indisponível em ESM.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
