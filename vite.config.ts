import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Solo separar maplibre porque es muy grande y se carga lazy en Search.
          // No separamos supabase ni react para evitar problemas de orden de carga
          // de chunks que han causado pantallas en blanco / requests colgadas.
          if (id.includes('node_modules/maplibre-gl')) {
            return 'maplibre'
          }
        },
      },
    },
  },
});
