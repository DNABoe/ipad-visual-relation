# Quick Start: AI Investigation Setup

Get AI-powered investigation reports working in 5 minutes!

## Step 1: Choose Your AI Provider

Pick one (or both):
- **ChatGPT (OpenAI)**: Fastest, cheapest (~$0.001 per report)
- **Perplexity AI**: Web-enhanced research, more current info

## Step 2: Get API Key

### For ChatGPT:
1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)

### For Perplexity:
1. Visit [https://www.perplexity.ai](https://www.perplexity.ai)
2. Go to Settings → API
3. Click "Generate API Key"
4. Copy the key (starts with `pplx-...`)

## Step 3: Configure Locally

```bash
# Copy example file
cp .env.example .env

# Edit .env and paste your key
# For OpenAI:
VITE_OPENAI_API_KEY=sk-proj-your-key-here

# For Perplexity:
VITE_PERPLEXITY_API_KEY=pplx-your-key-here

# Restart dev server
npm run dev
```

## Step 4: Configure for Deployment

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add one or both:
   - Name: `VITE_OPENAI_API_KEY`, Value: your OpenAI key
   - Name: `VITE_PERPLEXITY_API_KEY`, Value: your Perplexity key
4. Redeploy (push a commit or run workflow manually)

## Step 5: Test

1. Open a person card
2. Go to "Investigate" tab
3. Enter a country
4. Click "Investigate"
5. Get AI report in ~5-10 seconds! 🎉

## Troubleshooting

**Static template instead of AI?**
- Check API key is correct in `.env` or GitHub secrets
- Name must be exactly `VITE_OPENAI_API_KEY` or `VITE_PERPLEXITY_API_KEY`
- Restart dev server after changing `.env`
- Check browser console for error messages

**401 Error?**
- API key is invalid
- Generate a new key and update configuration

**429 Error?**
- Out of credits or hit rate limit
- Add credits to your account
- Wait a few minutes and try again

## Cost

- OpenAI: ~$0.001-0.005 per investigation
- Typical monthly cost: $1-5 for personal use
- Set spending limits in your API dashboard

## Need Help?

See full guide: [INVESTIGATION_SETUP.md](INVESTIGATION_SETUP.md)
