import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    // Dev-only plugin to add a CSP header that allows Vite HMR/eval during development
    {
      name: 'dev-csp-header',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Only set header for dev server
          res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:5173; connect-src 'self' ws://localhost:5173 http://localhost:3000; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline' http://localhost:5173;");
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
   server: {
    proxy: {
      '/api': 'http://localhost:3000', // Backend server running on port 3000
      '/uploads': 'http://localhost:3000',
    }
  },
})
