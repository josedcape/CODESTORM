import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = 3002; // Usar puerto diferente para no conflicto

// Habilitar CORS
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Verificar variables de entorno al inicio
console.log('🔍 Variables de entorno:');
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);

// Proxy manual para OpenAI
app.post('/api/openai/v1/chat/completions', async (req, res) => {
  console.log('🔄 Proxy request to OpenAI');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Verificar que tenemos la API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No OPENAI_API_KEY found');
      return res.status(500).json({ error: 'No API key configured' });
    }
    
    console.log('✅ Using API key:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    
    console.log(`📡 OpenAI response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ OpenAI response successful');
      res.json(data);
    } else {
      console.log('❌ OpenAI error:', JSON.stringify(data, null, 2));
      res.status(response.status).json(data);
    }
    
  } catch (error) {
    console.log('❌ Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy manual para Anthropic
app.post('/api/anthropic/v1/messages', async (req, res) => {
  console.log('🔄 Proxy request to Anthropic');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Verificar que tenemos la API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('❌ No ANTHROPIC_API_KEY found');
      return res.status(500).json({ error: 'No API key configured' });
    }
    
    console.log('✅ Using API key:', process.env.ANTHROPIC_API_KEY.substring(0, 15) + '...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    
    console.log(`📡 Anthropic response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Anthropic response successful');
      res.json(data);
    } else {
      console.log('❌ Anthropic error:', JSON.stringify(data, null, 2));
      res.status(response.status).json(data);
    }
    
  } catch (error) {
    console.log('❌ Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Simple proxy funcionando correctamente');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Simple proxy ejecutándose en http://localhost:${PORT}`);
});
