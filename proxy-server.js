const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages'
};

app.post('/api/proxy', async (req, res) => {
  try {
    const { provider, apiKey, payload } = req.body;

    if (!provider || !apiKey || !payload) {
      return res.status(400).json({
        error: 'Missing required fields: provider, apiKey, payload'
      });
    }

    const endpoint = PROVIDER_ENDPOINTS[provider];
    if (!endpoint) {
      return res.status(400).json({
        error: `Invalid provider: ${provider}. Supported providers: openai, perplexity, claude`
      });
    }

    console.log(`[Proxy] Forwarding request to ${provider}`);

    const headers = {
      'Content-Type': 'application/json'
    };

    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: 60000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] API error from ${provider}:`, errorText);
      return res.status(response.status).json({
        error: `API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`[Proxy] Success response from ${provider}`);

    let content = '';
    if (provider === 'claude') {
      content = data.content?.[0]?.text || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    res.json({ content });

  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: 'Proxy server error',
      message: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`[Proxy] Server running on port ${PORT}`);
  console.log(`[Proxy] Allowed origin: ${process.env.FRONTEND_URL || '*'}`);
});
