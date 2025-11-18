# Backend API Setup Guide

## Current Issue

Your domain `releye.boestad.com` is currently configured with a CNAME record pointing to `dnaboe.github.io` (GitHub Pages). This works great for hosting your frontend static files, but **GitHub Pages cannot host backend APIs**.

### What's Happening

When your frontend tries to make API calls to `https://releye.boestad.com/api/*`, those requests go to GitHub Pages, which:
- Only serves static files (HTML, CSS, JS, images, etc.)
- Cannot execute server-side code
- Returns 404 errors for API endpoints

## Solution Options

You need to deploy your backend API separately. Here are three recommended approaches:

---

## Option 1: Separate Backend Deployment (Recommended)

Deploy your backend API to a dedicated service while keeping your frontend on GitHub Pages.

### Services to Consider:
- **Railway**: Easy deployment, generous free tier
- **Render**: Free tier available, great for Node.js apps
- **Fly.io**: Modern deployment platform
- **Vercel**: Works well for API routes
- **Heroku**: Classic option (paid plans)

### Steps:

1. **Deploy Backend**
   ```bash
   # Example for Railway:
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Get Your Backend URL**
   - After deployment, you'll get a URL like: `your-app.railway.app`

3. **Update Frontend Configuration**
   - Update `/workspaces/spark-template/src/lib/cloudAPI.ts`:
   ```typescript
   const API_BASE_URL = window.location.origin.includes('localhost') 
     ? 'http://localhost:3000/api'
     : 'https://your-app.railway.app/api'  // Update this!
   ```

4. **Configure CORS on Backend**
   - Ensure your backend allows requests from `releye.boestad.com`:
   ```javascript
   app.use(cors({
     origin: ['https://releye.boestad.com', 'http://localhost:5173'],
     credentials: true
   }))
   ```

5. **Deploy Frontend**
   - Push changes to GitHub
   - GitHub Pages will automatically update

### Pros:
✅ Simple DNS setup  
✅ Free hosting for both frontend and backend  
✅ Independent scaling  
✅ Easy to maintain

### Cons:
❌ Two separate deployments to manage  
❌ CORS configuration needed

---

## Option 2: Use API Subdomain

Create a separate subdomain specifically for your API.

### Steps:

1. **Deploy Backend** (Railway, Render, etc.)
   - Get deployment URL

2. **Configure DNS in Spaceship.com**
   - Keep: `releye.boestad.com` → `dnaboe.github.io` (frontend)
   - Add: `api.boestad.com` → `your-backend.railway.app` (backend)

3. **Update Frontend Code**
   ```typescript
   const API_BASE_URL = window.location.origin.includes('localhost') 
     ? 'http://localhost:3000/api'
     : 'https://api.boestad.com/api'
   ```

4. **Configure CORS**
   ```javascript
   app.use(cors({
     origin: ['https://releye.boestad.com', 'http://localhost:5173'],
     credentials: true
   }))
   ```

### Pros:
✅ Clean separation of concerns  
✅ Professional URL structure  
✅ Easy to understand architecture

### Cons:
❌ Requires DNS configuration  
❌ CORS setup needed  
❌ SSL certificate for subdomain

---

## Option 3: Full Stack Hosting

Deploy both frontend and backend to the same service.

### Recommended Services:
- **Vercel**: Excellent Next.js support, API routes
- **Render**: Static site + backend service
- **Railway**: Full stack deployment

### Steps:

1. **Deploy to Service**
   - Deploy entire application (frontend + backend)
   - Service handles routing internally

2. **Update DNS**
   - In Spaceship.com, change CNAME:
   - From: `releye.boestad.com` → `dnaboe.github.io`
   - To: `releye.boestad.com` → `your-app.vercel.app`

3. **Configure Routing**
   - Ensure `/api/*` routes to backend
   - Everything else routes to frontend

### Pros:
✅ Single deployment  
✅ No CORS issues (same origin)  
✅ Simpler configuration

### Cons:
❌ More complex initial setup  
❌ GitHub Pages no longer used  
❌ Potential cost on larger scale

---

## Testing Your Setup

Once deployed, test your API connection:

1. **Visit Diagnostics Page**
   ```
   https://releye.boestad.com?diagnostics=true
   ```

2. **Run All Tests**
   - Click "Run Diagnostics" button
   - Review results

3. **Check for Success**
   - ✅ DNS Configuration should show correct setup
   - ✅ Basic Connectivity should succeed
   - ✅ All API endpoints should respond

---

## Quick Start: Railway Deployment

Here's a quick guide for Railway (most beginner-friendly):

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to your backend directory
cd path/to/your/backend

# 4. Initialize Railway project
railway init

# 5. Deploy
railway up

# 6. Get your URL
railway domain
```

Then update `cloudAPI.ts` with your Railway URL.

---

## Environment Variables

Don't forget to set environment variables on your deployment service:

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://releye.boestad.com
DATABASE_URL=your_database_url
SESSION_SECRET=your_secret_key
```

---

## Need Help?

Run the diagnostics tool to identify specific issues:
```
https://releye.boestad.com?diagnostics=true
```

The tool will tell you:
- ✅ What's working
- ❌ What's broken
- 💡 How to fix it

---

## Common Errors

### "Failed to connect to API server"
**Cause**: Backend is not deployed or URL is wrong  
**Fix**: Deploy backend and update `cloudAPI.ts`

### "CORS policy blocking request"
**Cause**: Backend CORS not configured  
**Fix**: Add frontend origin to CORS allowlist

### "API endpoint returns HTML 404"
**Cause**: DNS points to GitHub Pages  
**Fix**: Deploy backend and update DNS or frontend config

---

## Architecture Diagram

```
Current (Not Working):
User → releye.boestad.com → GitHub Pages → ❌ No API

Option 1 (Recommended):
User → releye.boestad.com → GitHub Pages (Frontend)
     ↘ api calls → your-app.railway.app (Backend)

Option 2 (Subdomain):
User → releye.boestad.com → GitHub Pages (Frontend)
     ↘ api calls → api.boestad.com → Backend Service

Option 3 (Full Stack):
User → releye.boestad.com → Vercel/Render (Frontend + Backend)
```

---

## Next Steps

1. Choose your deployment strategy (Option 1 recommended)
2. Deploy your backend to chosen service
3. Update frontend API configuration
4. Test with diagnostics tool
5. Deploy frontend changes

Good luck! 🚀
