import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración para acceso público
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permitir acceso desde cualquier IP
    port: 5173,
    open: false,
    cors: true,
    hmr: {
      port: 5173
    },
    proxy: {
      '/api': {
        target: 'http://181.58.39.18:3001',
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
