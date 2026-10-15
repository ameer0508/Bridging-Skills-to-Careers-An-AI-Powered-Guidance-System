import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';
import { devProxyOrigin } from './devProxyOrigin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'framer-motion',
      'lucide-react',
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      '@tanstack/react-query',
      'axios',
      'zod',
      'react-hook-form',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React and the store shims are needed by every page. Without their own chunk Rollup
            // placed them inside vendor-recharts, so even the sign-in page downloaded the charts.
            if (/\/node_modules\/(react|react-dom|scheduler|use-sync-external-store|react-is)\//.test(id)) {
              return 'vendor-react';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-recharts';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('@tanstack') || id.includes('axios')) {
              return 'vendor-tanstack';
            }
          }
        },

      },
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Same-origin calls from the dev frontend (also when opened by LAN IP) are forwarded with
        // the origin the backend allowlists; any other origin is left for the backend to refuse.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const forwarded = devProxyOrigin(req.headers.origin, req.headers.host);
            if (forwarded && forwarded !== req.headers.origin) proxyReq.setHeader('origin', forwarded);
          });
        },
      },
    },
  },
});
