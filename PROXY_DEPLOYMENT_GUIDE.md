# LLM Proxy Server - Deployment Guide

## Problem Solved

The RelEye application needs to call external LLM APIs (OpenAI, Perplexity, Claude) from the browser, but these APIs don't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. Public CORS proxy services are unreliable and often blocked.

This simple proxy server solves the problem by:
1. Accepting requests from your RelEye frontend
2. Forwarding them to the LLM provider APIs
3. Returning the responses back to the frontend

## Quick Start

### Option 1: Deploy on the Same Server (Recommended)

If you're already hosting RelEye at `releye.boestad.com`, deploy the proxy on the same server:

1. **Upload files to your server:**
   ```bash
   # Copy these files to your server (e.g., /var/www/releye-proxy/)
   - proxy-server.js
   - proxy-package.json (rename to package.json)
   ```

2. **Install dependencies:**
   ```bash
   cd /var/www/releye-proxy/
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Create .env file or set environment variables
   export PORT=3001
   export FRONTEND_URL=https://releye.boestad.com
   ```

4. **Start the server:**
   ```bash
   # For production with PM2 (recommended):
   npm install -g pm2
   pm2 start proxy-server.js --name releye-proxy
   pm2 save
   pm2 startup

   # Or for testing:
   npm start
   ```

5. **Configure Nginx reverse proxy:**
   Add to your nginx config for releye.boestad.com:
   ```nginx
   location /api/proxy {
       proxy_pass http://localhost:3001/api/proxy;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

6. **Reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Option 2: Deploy on Vercel (Free & Easy)

1. **Create a new directory with the proxy files:**
   ```bash
   mkdir releye-proxy
   cd releye-proxy
   cp proxy-server.js index.js
   cp proxy-package.json package.json
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "index.js"
       }
     ],
     "env": {
       "FRONTEND_URL": "https://releye.boestad.com"
     }
   }
   ```

3. **Deploy:**
   ```bash
   npm install -g vercel
   vercel
   ```

4. **Update your RelEye app:**
   Create `.env` file in your RelEye project:
   ```
   VITE_PROXY_URL=https://your-proxy.vercel.app/api/proxy
   ```

### Option 3: Deploy on Railway (Free Tier Available)

1. **Create account at railway.app**

2. **Create new project → Deploy from GitHub**
   - Or use the CLI: `railway init`

3. **Set environment variable:**
   ```
   FRONTEND_URL=https://releye.boestad.com
   ```

4. **Deploy and get your URL**

5. **Update RelEye `.env`:**
   ```
   VITE_PROXY_URL=https://your-proxy.railway.app/api/proxy
   ```

### Option 4: Deploy on Heroku

1. **Create `Procfile`:**
   ```
   web: node proxy-server.js
   ```

2. **Deploy:**
   ```bash
   heroku create releye-proxy
   heroku config:set FRONTEND_URL=https://releye.boestad.com
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

3. **Update RelEye `.env`:**
   ```
   VITE_PROXY_URL=https://releye-proxy.herokuapp.com/api/proxy
   ```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Your RelEye frontend URL for CORS (default: `*` allows all origins)

## Testing

Once deployed, test with curl:

```bash
curl -X POST https://releye.boestad.com/api/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-your-key-here",
    "payload": {
      "model": "gpt-4o-mini",
      "messages": [{"role": "user", "content": "Say hello"}],
      "temperature": 0.7,
      "max_tokens": 100
    }
  }'
```

## Security Considerations

1. **API Keys**: API keys are sent from the browser to the proxy, then to the LLM provider. They are NOT stored on the proxy server.

2. **CORS**: Set `FRONTEND_URL` to your exact domain to prevent unauthorized access:
   ```
   FRONTEND_URL=https://releye.boestad.com
   ```

3. **Rate Limiting** (recommended for production):
   ```bash
   npm install express-rate-limit
   ```
   
   Add to proxy-server.js:
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/proxy', limiter);
   ```

## Troubleshooting

### "Network error. Unable to connect to the proxy service"
- Check that the proxy server is running
- Verify VITE_PROXY_URL is correct in your .env file
- Check nginx/reverse proxy configuration

### "Access forbidden. Please check your API key permissions"
- Verify your LLM provider API key is correct
- Check API key permissions in the provider dashboard

### CORS errors in browser console
- Set FRONTEND_URL environment variable to your exact domain
- Restart the proxy server after changing environment variables

## Alternative: No Proxy Solution

If you don't want to run a proxy server, you can:

1. **Use only Spark LLM** when running in Spark environment (no external APIs needed)
2. **Static reports only** - The app will show template-based reports without AI analysis
3. **Browser extension** - Install a CORS-allowing browser extension (not recommended for production)

## Monitoring

To monitor the proxy server with PM2:

```bash
pm2 status
pm2 logs releye-proxy
pm2 monit
```

## Updates

To update the proxy server:

```bash
cd /var/www/releye-proxy/
git pull  # or upload new proxy-server.js
pm2 restart releye-proxy
```
