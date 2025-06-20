import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración para desarrollo local
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,  // Usar el puerto que está disponible
    open: false,
    cors: true,
    hmr: {
      port: 24679,  // Puerto diferente para HMR
      host: 'localhost',
      clientPort: 24679
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Proxy Server:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Proxy Server:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env': {}
  }
});
