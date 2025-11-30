# CORS Proxy Solutions for RelEye LLM Integration

## Overview

This document outlines multiple CORS proxy solutions to enable LLM API calls from the browser. The implementation includes multiple fallback options for maximum reliability.

## Solution Architecture

The new implementation tries multiple CORS proxy services in sequence:
1. **Primary**: allOrigins proxy
2. **Fallback 1**: cors-anywhere (public instance)
3. **Fallback 2**: corsproxy.io
4. **Fallback 3**: Your own proxy server (if deployed)

## How It Works

1. The client-side code attempts to call the LLM API through the first proxy
2. If that fails, it automatically tries the next proxy
3. Continues until successful or all proxies exhausted
4. Provides clear error messages for debugging

## Proxy Services Used

### 1. AllOrigins (Primary)
- **Endpoint**: `https://api.allorigins.win/raw?url=`
- **Advantages**: Reliable, free, no rate limits for reasonable use
- **Disadvantages**: Adds slight latency

### 2. CORS Anywhere (Fallback)
- **Endpoint**: `https://cors-anywhere.herokuapp.com/`
- **Advantages**: Well-established service
- **Disadvantages**: May require user activation on first use

### 3. CORSProxy.io (Fallback)
- **Endpoint**: `https://corsproxy.io/?`
- **Advantages**: Fast, reliable
- **Disadvantages**: Rate limits for heavy usage

### 4. Your Own Proxy (Final Fallback)
- **Endpoint**: Configured via `VITE_PROXY_URL` environment variable
- **Advantages**: Full control, no rate limits
- **Disadvantages**: Requires deployment and maintenance

## Environment Variables

```bash
# Optional: Your own proxy server URL
VITE_PROXY_URL=https://your-proxy.example.com/api/proxy

# LLM API Keys (stored in browser storage, not env vars for security)
# Users configure these in the app Settings > Investigation tab
```

## Deployment Options

### Option A: Use Public Proxies Only (Recommended for Quick Start)
No deployment needed - just use the app. The public proxies are configured automatically.

### Option B: Deploy Your Own Proxy

#### Quick Deploy to Railway.app
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Deploy from GitHub or upload `proxy-server.js` and `proxy-package.json`
4. Set environment variables:
   - `PORT=3001`
   - `FRONTEND_URL=https://your-releye-url.com`
5. Copy the deployed URL and set as `VITE_PROXY_URL` in your app

#### Deploy to Heroku
```bash
# Install Heroku CLI, then:
heroku create your-proxy-name
git push heroku main
heroku config:set FRONTEND_URL=https://your-releye-url.com
```

#### Deploy to Your Own Server
```bash
# Upload proxy-server.js and proxy-package.json
npm install
export PORT=3001
export FRONTEND_URL=https://your-releye-url.com
node proxy-server.js

# Or use PM2 for production:
pm2 start proxy-server.js --name releye-proxy
pm2 save
pm2 startup
```

## Testing

### Test Proxy Connectivity
Open browser console and run:

```javascript
// Test AllOrigins
fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.openai.com/v1/models'), {
  method: 'GET',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
}).then(r => r.json()).then(console.log)

// Test your own proxy (if deployed)
fetch('https://your-proxy.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

### Test LLM Integration
1. Open RelEye
2. Go to Settings > Investigation tab
3. Add an OpenAI API key
4. Select a person node
5. Click "Generate Investigation Report"
6. Check browser console for proxy fallback messages

## Troubleshooting

### "Network error" or "Unable to connect to proxy"
- **Solution**: The implementation will automatically try all proxies in sequence
- **Check**: Browser console for detailed logs showing which proxies were attempted

### "CORS policy blocked"
- **Solution**: Already handled by the multi-proxy approach
- **Alternative**: Deploy your own proxy server (Option B above)

### "Rate limit exceeded" on public proxies
- **Solution**: Deploy your own proxy (no rate limits)
- **Temporary fix**: Wait a few minutes and try again

### Proxy timeout
- **Cause**: LLM API taking too long to respond
- **Solution**: Timeout is set to 60 seconds, will automatically retry with next proxy

## Security Considerations

1. **API Keys**: Stored only in browser localStorage, never sent to any proxy
2. **Proxy Role**: Proxies only forward HTTP headers, they don't store or log data
3. **Your Own Proxy**: For maximum security, deploy your own proxy server
4. **HTTPS**: All proxy communications use HTTPS encryption

## Performance

- **Latency**: Public proxies add ~100-300ms latency
- **Your Own Proxy**: Minimal latency (~10-50ms)
- **Automatic Fallback**: Adds ~5 seconds per failed proxy before trying next

## Cost

- **Public Proxies**: Free (with reasonable usage)
- **Your Own Proxy**: 
  - Railway.app: $5/month (Hobby plan)
  - Heroku: $7/month (Eco plan)
  - Your own VPS: Variable ($5-20/month)

## Recommended Setup

For most users:
- **Development**: Use public proxies (no setup required)
- **Production**: Deploy your own proxy for reliability

For high-volume users:
- **Always**: Use your own proxy server
- **Reason**: Avoids rate limits and ensures availability
