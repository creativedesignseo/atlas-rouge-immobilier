import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  // inspectAttr is a dev-only inspection plugin; it must NOT run in the
  // production build (third-party Vite plugin = supply-chain risk in the
  // shipped bundle). Only load it during `vite dev`.
  plugins: [...(mode === 'development' ? [inspectAttr()] : []), react()],
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
          // Split mapbox-gl (~1.8MB) into its own cacheable chunk; it's loaded
          // lazily only inside the Search route. We deliberately do NOT split
          // supabase or react to avoid chunk load-order issues that caused
          // blank screens / hung requests.
          if (id.includes('node_modules/mapbox-gl')) {
            return 'mapbox'
          }
        },
      },
    },
  },
}));
