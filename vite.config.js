import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Use the 'empty' protocol for modules we don't need at all
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy all /api and /health requests to Railway backend (avoids CORS in dev)
      '/api': {
        target: 'https://jobboatv1-production-cb89.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://jobboatv1-production-cb89.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      // Fix 'process/' imports (with trailing slash) used by readable-stream
      'process/': 'process',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});
