# RelEye - Simple Deployment Guide

## Overview

RelEye now uses a **simplified single-deployment architecture** with no backend server required. All user data is stored via Spark KV (GitHub-backed storage), making deployment as simple as enabling GitHub Pages.

## What Changed

**Before:** Required separate backend API server with PostgreSQL database  
**After:** Single GitHub Pages deployment with Spark KV for user data

## Deployment Steps

### 1. Enable GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Under **Source**, select:
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`
4. Click **Save**

### 2. Configure Custom Domain (Optional)

If using a custom domain like `releye.boestad.com`:

1. In repository settings → Pages → Custom domain
2. Enter your domain: `releye.boestad.com`
3. Enable **Enforce HTTPS** (wait for certificate to provision)
4. In your domain registrar's DNS settings:
   - Add a `CNAME` record pointing to `<your-username>.github.io`
   - Or add `A` records pointing to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

### 3. Verify CNAME File

Ensure `/public/CNAME` contains your domain:
```
releye.boestad.com
```

This file is already included in the repository.

### 4. Wait for Deployment

GitHub Pages typically deploys in 1-5 minutes. You can monitor progress in:
- Repository → Actions tab (if GitHub Actions are enabled)
- Repository → Settings → Pages (shows deployment status)

### 5. Access Your Application

Once deployed, visit:
- Custom domain: https://releye.boestad.com
- Or GitHub Pages URL: https://[your-username].github.io/[repo-name]

## First Time Setup

When you first access the application:

1. You'll see a "First Time Setup" screen
2. Create an administrator account with:
   - Email address
   - Display name
   - Secure password
3. Click "Create Administrator Account"
4. You're ready to start using RelEye!

## How Data is Stored

### User Data (Spark KV / GitHub)
- User accounts and credentials
- Pending invites
- User roles and permissions
- Stored securely via Spark's GitHub-backed KV storage
- Accessible from any device/browser

### Network Data (Browser localStorage)
- Your relationship networks (.enc.releye files)
- All person nodes, connections, and groups
- AES-256 encrypted
- Stored locally in your browser
- Private - never leaves your device

## Multi-User Collaboration

As an administrator, you can invite additional users:

1. Log in as admin
2. Go to Settings → User Management
3. Click "Invite User"
4. Enter email, name, and role (Admin/Editor/Viewer)
5. Share the generated invite link
6. Invited users create their password via the link
7. They can then access shared network files

## Troubleshooting

### "Could not connect to API" or similar errors
- This error message is outdated from the previous architecture
- Ignore it - the app now works without a backend API
- If you see persistent issues, check browser console for details

### Cannot access after deployment
- Verify GitHub Pages is enabled in repository settings
- Check that deployment completed successfully in Actions tab
- Ensure CNAME file exists in `/public/` directory
- Allow 5-10 minutes for DNS propagation if using custom domain

### Lost access to admin account
- Open browser console (F12)
- Run: `localStorage.clear()`
- Refresh the page
- You'll see first-time setup again
- Create a new admin account
- Note: This will clear your current session but not delete user accounts stored in Spark KV

## Architecture Benefits

✅ **No Server Management**: No backend server to configure, maintain, or pay for  
✅ **Automatic Scaling**: GitHub Pages handles all traffic  
✅ **Built-in Security**: Spark KV is managed by GitHub with enterprise-grade security  
✅ **Simple Updates**: Just push to main branch to deploy updates  
✅ **Cost Effective**: Completely free for public repositories  
✅ **Reliable**: GitHub's infrastructure ensures high uptime

## Development

To run locally:

```bash
npm install
npm run dev
```

The development server will start at `http://localhost:5173`

## Security Notes

- Passwords are hashed using PBKDF2 before storage
- Network files are encrypted with AES-256-GCM
- User session tokens stored in browser localStorage
- Spark KV access controlled by GitHub authentication
- All traffic over HTTPS when deployed

## Support

For issues or questions, please open an issue on the GitHub repository.
