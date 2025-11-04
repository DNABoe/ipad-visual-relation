# Investigation Feature Setup Guide

The Investigation feature in RelEye uses OpenAI's API to generate professional intelligence reports about people in your network. This guide will help you set it up for both local development and deployed environments.

## Overview

The investigation feature:
- Generates professional intelligence briefs using AI
- Creates formatted PDF reports with intelligence-grade formatting
- Maintains the same look and feel as a professional intelligence report
- Works on both local development and deployed sites

## Requirements

- OpenAI API account (free tier available)
- API key from OpenAI

## Getting an OpenAI API Key

1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Create an account or sign in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (it starts with `sk-proj-...`)
6. **Important**: Save this key securely - you won't be able to see it again!

## Setup for Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```env
   VITE_OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

4. The investigation feature will now work in your local environment

## Setup for Deployed Site (GitHub Pages)

For the investigation feature to work on your deployed site (e.g., releye.boestad.com), you need to add the API key as a GitHub repository secret.

### Step-by-Step Instructions

1. **Go to your GitHub repository**
   - Navigate to `https://github.com/YOUR_USERNAME/YOUR_REPO`

2. **Access Settings**
   - Click on "Settings" tab at the top

3. **Navigate to Secrets**
   - In the left sidebar, expand "Secrets and variables"
   - Click on "Actions"

4. **Add Repository Secret**
   - Click the "New repository secret" button
   - Name: `VITE_OPENAI_API_KEY`
   - Secret: Paste your OpenAI API key (the one starting with `sk-proj-...`)
   - Click "Add secret"

5. **Trigger Deployment**
   - The GitHub Actions workflow will automatically use this secret during builds
   - Push any change to trigger a new deployment, or
   - Go to "Actions" tab → "Deploy to GitHub Pages" → "Run workflow"

6. **Verify**
   - Once deployed, visit your site
   - Open a person card
   - Go to the "Investigate" tab
   - Enter a country and click "Investigate"
   - The report should generate successfully

## Security Considerations

### API Key Security

✅ **What we do:**
- API key is stored as a GitHub secret (encrypted at rest)
- Key is only available during build process
- Key is embedded in the built JavaScript (necessary for client-side calls)
- All API calls are made directly from the browser to OpenAI

⚠️ **What you should know:**
- The API key will be visible in the built JavaScript files
- Anyone with access to your deployed site can extract the key
- This is a limitation of client-side API calls

### Recommended Security Practices

1. **Use Rate Limiting**
   - Set usage limits in your OpenAI account dashboard
   - Monitor usage regularly at [https://platform.openai.com/usage](https://platform.openai.com/usage)

2. **Use API Key Restrictions** (when available)
   - OpenAI may offer domain restrictions in the future
   - Enable them when available to limit key usage to your domain

3. **Monitor Costs**
   - The investigation feature uses `gpt-4o-mini` (cost-effective model)
   - Set up billing alerts in your OpenAI account
   - Typical cost per investigation: ~$0.001-0.005 USD

4. **Consider Backend Proxy** (Advanced)
   - For production environments with many users, consider:
     - Setting up a backend API that proxies requests to OpenAI
     - Implementing rate limiting per user
     - Keeping the API key server-side only
   - This requires additional infrastructure (backend server)

## Alternative: Backend Proxy Setup

If you need higher security for production use:

### Option 1: Vercel/Netlify Functions

Create a serverless function:

```javascript
// api/investigate.js
export default async function handler(req, res) {
  const { name, position, country } = req.body
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [/* your messages */],
    })
  })
  
  const data = await response.json()
  res.json(data)
}
```

Then update `externalLLM.ts` to call your backend instead of OpenAI directly.

### Option 2: Custom Backend Server

Set up a Node.js/Express backend with proper authentication and rate limiting.

## Troubleshooting

### Error: "Failed to generate investigation report"

**Check:**
1. API key is correctly set in `.env` (local) or GitHub secrets (deployed)
2. API key is valid and not expired
3. You have API credits in your OpenAI account
4. Check browser console for detailed error messages

### Error: "API request failed: 401"

**Solution:**
- Your API key is invalid or expired
- Generate a new key at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Update your `.env` file and GitHub secret

### Error: "API request failed: 429"

**Solution:**
- You've exceeded rate limits or quota
- Check your usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)
- Add credits to your account or wait for rate limit reset

### Investigation feature works locally but not deployed

**Check:**
1. GitHub secret `VITE_OPENAI_API_KEY` is set correctly
2. Re-run the deployment workflow after adding the secret
3. Clear browser cache and try again
4. Check browser console for API errors

## Cost Estimation

Using `gpt-4o-mini` model (as of 2024):

- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens
- **Average investigation**: ~1,000 input + 1,500 output tokens
- **Cost per investigation**: ~$0.0015 USD (less than a tenth of a cent)
- **100 investigations/month**: ~$0.15 USD

Very cost-effective for personal and small team use!

## Support

For issues or questions:
- Check the [main README](README.md)
- Review [troubleshooting section](#troubleshooting)
- Contact D Boestad

---

**Note**: The investigation feature is optional. All other RelEye features work perfectly without an OpenAI API key configured.
