# Investigation Feature Setup Guide

The Investigation feature in RelEye generates professional intelligence reports about people in your network using AI. This guide covers setup for **ChatGPT (OpenAI)** and **Perplexity AI** - both work outside the Spark runtime!

## Overview

The investigation feature:
- Generates professional intelligence briefs using AI
- Creates formatted PDF reports with intelligence-grade formatting
- Maintains the same look and feel as a professional intelligence report
- Works on both local development and deployed sites
- **NEW:** Works outside Spark runtime with ChatGPT or Perplexity

## AI Provider Options

Choose one or both:

### 1. **ChatGPT (OpenAI)** - Recommended for most users
- Model: GPT-4o-mini (fast & cost-effective)
- Cost: ~$0.001-0.005 per investigation
- Best for: General intelligence reports
- Sign up: [https://platform.openai.com](https://platform.openai.com)

### 2. **Perplexity AI** - Best for real-time information
- Model: Llama 3.1 Sonar with web search
- Provides web-enhanced research
- Best for: Up-to-date information on public figures
- Sign up: [https://www.perplexity.ai](https://www.perplexity.ai)

### 3. **Spark Runtime** (if available)
- Uses built-in `window.spark.llm` API
- No API key needed
- Only works in Spark environment

The app automatically uses the best available option in this order:
1. Perplexity (if configured)
2. OpenAI (if configured)
3. Spark LLM (if in runtime)
4. Static template (fallback)

## Getting API Keys

### Option A: OpenAI (ChatGPT)

1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Create an account or sign in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Give it a name like "RelEye Investigation"
6. Copy the key (starts with `sk-proj-...`)
7. **Important**: Save this key securely - you won't be able to see it again!

### Option B: Perplexity AI

1. Go to [https://www.perplexity.ai](https://www.perplexity.ai)
2. Create an account or sign in
3. Navigate to Settings → API
4. Click "Generate API Key"
5. Copy the key (starts with `pplx-...`)
6. **Important**: Save this key securely!

You can use **one or both** providers. The app will use Perplexity first if both are configured.

## Setup for Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key(s):
   ```env
   # Option 1: Use OpenAI (ChatGPT)
   VITE_OPENAI_API_KEY=sk-proj-your-actual-key-here
   
   # Option 2: Use Perplexity
   VITE_PERPLEXITY_API_KEY=pplx-your-actual-key-here
   
   # You can configure both - Perplexity will be used first
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

4. The investigation feature will now work in your local environment

**Testing:**
- Open any person card
- Go to the "Investigate" tab
- Enter a country and click "Investigate"
- You should see an AI-generated report instead of the static template

## Setup for Deployed Site (GitHub Pages)

For the investigation feature to work on your deployed site (e.g., releye.boestad.com), you need to add the API key(s) as GitHub repository secrets.

### Step-by-Step Instructions

1. **Go to your GitHub repository**
   - Navigate to `https://github.com/YOUR_USERNAME/YOUR_REPO`

2. **Access Settings**
   - Click on "Settings" tab at the top

3. **Navigate to Secrets**
   - In the left sidebar, expand "Secrets and variables"
   - Click on "Actions"

4. **Add Repository Secret(s)**
   
   For OpenAI (ChatGPT):
   - Click the "New repository secret" button
   - Name: `VITE_OPENAI_API_KEY`
   - Secret: Paste your OpenAI API key (starts with `sk-proj-...`)
   - Click "Add secret"
   
   For Perplexity (optional, but recommended):
   - Click the "New repository secret" button again
   - Name: `VITE_PERPLEXITY_API_KEY`
   - Secret: Paste your Perplexity API key (starts with `pplx-...`)
   - Click "Add secret"

5. **Trigger Deployment**
   - The GitHub Actions workflow will automatically use these secrets during builds
   - Push any change to trigger a new deployment, or
   - Go to "Actions" tab → "Deploy to GitHub Pages" → "Run workflow"

6. **Verify**
   - Once deployed, visit your site
   - Open a person card
   - Go to the "Investigate" tab
   - Enter a country and click "Investigate"
   - The report should generate successfully with AI-powered analysis

## Security Considerations

### API Key Security

✅ **What we do:**
- API keys are stored as GitHub secrets (encrypted at rest)
- Keys are only available during build process
- Keys are embedded in the built JavaScript (necessary for client-side calls)
- All API calls are made directly from the browser to OpenAI/Perplexity

⚠️ **What you should know:**
- The API keys will be visible in the built JavaScript files
- Anyone with access to your deployed site can extract the keys
- This is a limitation of client-side API calls
- **This is acceptable for personal/small team use**

### Recommended Security Practices

1. **Use Rate Limiting**
   - **OpenAI**: Set usage limits in your dashboard at [https://platform.openai.com/usage](https://platform.openai.com/usage)
   - **Perplexity**: Monitor usage in your Perplexity account settings
   - Set monthly spending limits on both platforms

2. **Monitor Costs**
   - OpenAI `gpt-4o-mini`: ~$0.001-0.005 per investigation
   - Perplexity: Check their current pricing
   - Set up billing alerts in your account settings
   - Typical monthly cost for personal use: $1-5

3. **Separate Keys for Production**
   - Use different API keys for local development vs. deployed site
   - Easier to revoke if one is compromised
   - Better cost tracking

4. **Regular Key Rotation** (recommended)
   - Rotate API keys every 3-6 months
   - Update both `.env` and GitHub secrets when rotating

### For High-Security or Multi-User Deployments

If you're deploying to a large audience or need enhanced security, consider implementing a backend proxy:

#### Option 1: Vercel/Netlify Serverless Functions

Create a serverless function that keeps API keys server-side:

```javascript
// api/investigate.js (Vercel/Netlify)
export default async function handler(req, res) {
  const { name, position, country } = req.body
  
  // API key stays on server - never exposed to client
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional intelligence analyst.'
        },
        {
          role: 'user',
          content: `Create intelligence brief for: ${name}, ${position}, ${country}`
        }
      ]
    })
  })
  
  const data = await response.json()
  res.json(data)
}
```

Then update `externalLLM.ts` to call your backend instead of OpenAI directly.

Benefits:
- API keys never exposed to clients
- Can implement rate limiting per user
- Better cost control

#### Option 2: Cloudflare Workers

Similar approach using Cloudflare Workers for edge computing with zero cold starts.

#### Option 3: Custom Backend Server

Set up a Node.js/Express backend with authentication and rate limiting.

**Note:** For personal or small team use, the direct client-side approach is perfectly adequate and much simpler to set up.

## Troubleshooting

### Error: "Failed to generate investigation report"

**Check:**
1. API key is correctly set in `.env` (local) or GitHub secrets (deployed)
2. API key is valid and not expired
3. You have API credits in your OpenAI/Perplexity account
4. Check browser console for detailed error messages
5. Verify internet connection is working

**To test which provider is being used:**
Open browser console and look for messages like:
- `[externalLLM] Using OpenAI API...`
- `[externalLLM] Using Perplexity API...`
- `[externalLLM] Using Spark LLM API...`

### Error: "API request failed: 401"

**Solution:**
- Your API key is invalid or expired
- **OpenAI**: Generate a new key at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Perplexity**: Generate a new key in your account settings
- Update your `.env` file and GitHub secrets
- Restart dev server or redeploy

### Error: "API request failed: 429"

**Solution:**
- You've exceeded rate limits or quota
- **OpenAI**: Check usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)
- **Perplexity**: Check your account dashboard
- Add credits to your account or wait for rate limit reset
- Consider switching to the other provider temporarily

### Investigation feature works locally but not deployed

**Check:**
1. GitHub secrets are set correctly (names must match exactly)
   - `VITE_OPENAI_API_KEY` (not `OPENAI_API_KEY`)
   - `VITE_PERPLEXITY_API_KEY` (not `PERPLEXITY_API_KEY`)
2. Re-run the deployment workflow after adding secrets
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for API errors
5. Verify the build logs in GitHub Actions show the environment variables are being loaded

### Investigation returns static template instead of AI response

**This means no API keys are configured. Check:**
1. `.env` file exists in project root (local development)
2. Environment variables are spelled correctly with `VITE_` prefix
3. Dev server was restarted after creating `.env`
4. GitHub secrets are properly configured (deployed)
5. Look for console message: `[externalLLM] No LLM provider available`

### CORS errors when calling API

**Unlikely with OpenAI/Perplexity, but if you see CORS errors:**
- Both OpenAI and Perplexity APIs support direct browser calls
- Check that you're using the correct API endpoint
- Ensure your API key is valid
- Try from an incognito window to rule out browser extensions

### API calls are slow

**Normal behavior:**
- OpenAI: 3-10 seconds for a response
- Perplexity: 5-15 seconds (includes web search)
- Spark LLM: 2-8 seconds

**If consistently slower:**
- Check your internet connection
- Try the other provider
- Perplexity may be slower due to web search feature

## Cost Estimation

### OpenAI (ChatGPT - GPT-4o-mini)

As of January 2025:
- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens
- **Average investigation**: ~1,000 input + 1,500 output tokens
- **Cost per investigation**: ~$0.0015 USD (about 1/10th of a cent)
- **100 investigations/month**: ~$0.15 USD
- **1,000 investigations/month**: ~$1.50 USD

**Very cost-effective for personal and team use!**

### Perplexity AI

Check current pricing at [https://www.perplexity.ai/pricing](https://www.perplexity.ai/pricing)

Perplexity offers:
- Free tier with limited requests
- Pro tier with more requests
- API pricing separate from web interface

Typical costs are competitive with OpenAI, with the added benefit of web-enhanced research.

### Which Provider to Choose?

**Use OpenAI (ChatGPT) if:**
- You want the most cost-effective option
- You need consistent, fast responses
- You're already familiar with OpenAI
- You want proven reliability

**Use Perplexity if:**
- You need up-to-date, web-enhanced information
- You're researching public figures with recent news
- You want citations and sources
- You prefer research-oriented responses

**Use Both:**
- Configure both API keys
- App will prefer Perplexity (web-enhanced)
- Falls back to OpenAI if Perplexity fails
- Best of both worlds!

## Testing Your Setup

### Local Testing

1. Start the dev server: `npm run dev`
2. Create or load a network
3. Add a test person:
   - Name: "John Smith"
   - Position: "CEO"
4. Open their person card
5. Click "Investigate" tab
6. Enter country: "United States"
7. Click "Investigate"
8. Watch browser console for provider messages
9. Report should generate in 5-15 seconds

### Production Testing

1. Deploy to GitHub Pages
2. Visit your deployed site
3. Repeat the same test as above
4. Verify AI-generated content (not static template)

## FAQ

**Q: Do I need both API keys?**
A: No, just one is enough. Configure whichever provider you prefer.

**Q: Can I switch providers later?**
A: Yes! Just update your `.env` and/or GitHub secrets. No code changes needed.

**Q: Will this work without Spark runtime?**
A: **Yes!** That's the whole point. This now works standalone with ChatGPT or Perplexity.

**Q: What if I don't configure any API keys?**
A: The app will use a static template (less detailed but functional).

**Q: Is my API key secure?**
A: For personal use, yes. For production with many users, consider a backend proxy (see Security section).

**Q: What data is sent to the APIs?**
A: Only the person's name, position, and country you specify. No other network data is shared.

**Q: Can I use a different AI model?**
A: Yes! Edit `src/lib/externalLLM.ts` and change the model name in the API calls.

**Q: Does Perplexity always search the web?**
A: Yes, that's its key feature. It provides more current information but may be slightly slower.

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review [main README](README.md)
- Check browser console for error messages
- Verify API key configuration in `.env` or GitHub secrets

---

**Note**: The investigation feature is optional. All other RelEye features work perfectly without any AI configuration.
