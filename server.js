import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS para todas las rutas con configuración específica
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://181.58.39.18:5173',
    'http://181.58.39.18:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version']
}));

// Middleware para registrar solicitudes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Configurar proxy para OpenAI
app.use('/api/openai', createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/openai': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request to OpenAI:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    console.log('Proxy response from OpenAI:', proxyRes.statusCode);
  }
}));

// Configurar proxy para Anthropic
app.use('/api/anthropic', createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/anthropic': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request to Anthropic:', req.method, req.url);
    // Asegurarse de que los encabezados de Anthropic estén presentes
    if (req.headers['x-api-key']) {
      proxyReq.setHeader('x-api-key', req.headers['x-api-key']);
    } else if (process.env.VITE_ANTHROPIC_API_KEY) {
      proxyReq.setHeader('x-api-key', process.env.VITE_ANTHROPIC_API_KEY);
    }

    if (req.headers['anthropic-version']) {
      proxyReq.setHeader('anthropic-version', req.headers['anthropic-version']);
    } else {
      proxyReq.setHeader('anthropic-version', '2023-06-01');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Añadir encabezados CORS a la respuesta
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-api-key, anthropic-version';
    console.log('Proxy response from Anthropic:', proxyRes.statusCode);
  }
}));

// Configurar proxy para Gemini
app.use('/api/gemini', createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/gemini': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request to Gemini:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    console.log('Proxy response from Gemini:', proxyRes.statusCode);
  }
}));

// Ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor proxy para APIs de IA funcionando correctamente');
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor proxy ejecutándose en:`);
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Red: http://181.58.39.18:${PORT}`);
  console.log(`  - Todas las interfaces: http://0.0.0.0:${PORT}`);
});
