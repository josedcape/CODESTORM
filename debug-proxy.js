import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3003;

console.log('🔧 Starting debug proxy...');

// Enable CORS
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  console.log('📥 GET / - Test route accessed');
  res.json({ message: 'Debug proxy is working!', timestamp: new Date().toISOString() });
});

// Test API route
app.get('/test', (req, res) => {
  console.log('📥 GET /test - Test API route accessed');
  res.json({
    status: 'ok',
    env: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing'
    }
  });
});

// Anthropic proxy route
app.post('/api/anthropic/v1/messages', async (req, res) => {
  console.log('📥 POST /api/anthropic/v1/messages - Anthropic request received');

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('❌ No ANTHROPIC_API_KEY found');
      return res.status(500).json({ error: 'No API key configured' });
    }

    console.log('✅ API key found, making request to Anthropic...');

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
      console.log('❌ Anthropic error:', data);
      res.status(response.status).json(data);
    }

  } catch (error) {
    console.log('❌ Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Debug proxy running on http://localhost:${PORT}`);
  console.log(`📋 Environment check:`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
