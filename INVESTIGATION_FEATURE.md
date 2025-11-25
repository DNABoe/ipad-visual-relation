# Investigation Feature Guide

## Overview
The Investigation feature allows you to generate AI-powered intelligence reports about persons in your network using OpenAI's GPT-4o-mini model.

## Setup

### Step 1: Get an OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important:** Save this key securely - you won't be able to see it again!

### Step 2: Add API Key to RelEye
1. Open **Settings** (gear icon in toolbar)
2. Go to the **Investigation** tab
3. Paste your API key in the input field
4. Click **Save API Key**
5. The key will be saved in your encrypted network file

### Step 3: Save Your Network File
**Critical:** The API key is stored in your network file. You must save/download your network file to persist the API key.
- Click the network name in the toolbar to download
- Or use File > Save Network

## Using the Investigation Feature

### Generate a Report
1. Double-click a person card to open Edit Person dialog
2. Go to the **Investigate** tab
3. (Optional) Enter a country to get more contextual analysis
4. Click **Investigate**
5. Wait 30-60 seconds for the report to generate
6. The report will be automatically saved as a PDF attachment

### View/Download Reports
- Reports are saved in the **Notes** tab as attachments
- Double-click the attachment to view
- Right-click > "Save link as..." to download

## Troubleshooting

### Error: "Please configure an API key in Settings"
- You haven't added an API key yet
- Go to Settings > Investigation tab and add your OpenAI API key

### Error: "OpenAI API error: 401"
This means the API key is invalid or unauthorized. Common causes:

1. **Invalid API Key**
   - Make sure you copied the complete key (should start with `sk-`)
   - Check for extra spaces at the beginning or end
   - Verify the key hasn't been revoked in your OpenAI account

2. **Insufficient Credits**
   - Check your OpenAI account has available credits
   - Go to https://platform.openai.com/usage to view usage
   - Add payment method if needed

3. **API Key Not Saved**
   - After entering the API key in Settings, you MUST save your network file
   - The key is stored in the encrypted network file, not in your browser

### Error: "Failed to generate investigation report"
- Check your internet connection
- Verify you have OpenAI API credits
- Try again - sometimes API calls timeout

## Cost Information
- Investigation uses OpenAI's gpt-4o-mini model
- Typical cost per report: $0.001 - $0.005 (very cheap)
- Check current pricing: https://openai.com/api/pricing/

## Security Notes
- API keys are stored in your encrypted network file
- Keys are never sent to any server except OpenAI's API
- Network files use AES-256-GCM encryption
- Keys are only decrypted in your browser when needed

## Alternative: Free Option
If you don't want to use OpenAI:
- The app can generate a static template report without AI
- Just click Investigate without configuring an API key
- The static report provides a professional template but without personalized AI analysis

## API Key Best Practices
1. Never share your API key
2. Rotate keys regularly
3. Set usage limits in OpenAI dashboard
4. Delete keys you're no longer using
5. Use different keys for different projects
