# 🚨 DEPLOYMENT HELP - START HERE

## You Have a Black Screen at releye.boestad.com?

### → Read `FIX_BLACK_SCREEN.md` First! ←

It covers the 3 most common issues in order of likelihood.

---

## All Deployment Documentation

### Quick Start (3 minutes)
📄 **`QUICKSTART_DEPLOY.md`** - Fast setup guide

### Comprehensive Guide
📄 **`DEPLOYMENT.md`** - Full deployment documentation with all details

### Step-by-Step Checklist
📄 **`PAGES_DEPLOYMENT_CHECKLIST.md`** - Complete checkbox guide

### Troubleshooting
📄 **`FIX_BLACK_SCREEN.md`** - Solve black screen issues (START HERE IF BROKEN)

---

## Most Common Issues (in order)

1. **GitHub Pages source set to "Deploy from a branch" instead of "GitHub Actions"**
   - Fix: Settings → Pages → Source → Change to "GitHub Actions"

2. **DNS not configured or not propagated**
   - Fix: Add CNAME record at your domain registrar
   - Check: `dig releye.boestad.com`

3. **Workflow failed to build**
   - Fix: Check Actions tab for errors
   - Test: `npm install && npm run build` locally

---

## Files You Need (All Included)

✅ `.github/workflows/deploy.yml` - GitHub Actions workflow  
✅ `CNAME` - Custom domain configuration  
✅ `.nojekyll` - Tells GitHub not to use Jekyll  
✅ `vite.config.ts` - Build configuration  
✅ `public/CNAME` - Copied to build output  
✅ `public/.nojekyll` - Copied to build output  

**All files are already configured. Don't modify unless you know what you're doing.**

---

## Quick Deploy

```bash
# Trigger deployment
git add .
git commit -m "Deploy to releye.boestad.com"
git push origin main

# Watch progress
# Go to Actions tab on GitHub
```

---

## Quick Health Check

```bash
# 1. Check DNS is configured
dig releye.boestad.com

# 2. Build locally to verify no errors
npm install
npm run build

# 3. Preview locally
npm run preview
# Visit http://localhost:4173
```

---

## GitHub Settings Checklist

1. **Actions** → General → "Read and write permissions" ✅
2. **Pages** → Source → **"GitHub Actions"** (NOT branch!) ✅
3. **Pages** → Custom domain → "releye.boestad.com" ✅

---

## Need Help?

1. **Black screen?** → Read `FIX_BLACK_SCREEN.md`
2. **First time deploying?** → Read `QUICKSTART_DEPLOY.md`
3. **Want full details?** → Read `DEPLOYMENT.md`
4. **Want checklist?** → Read `PAGES_DEPLOYMENT_CHECKLIST.md`

---

## Current Status of Your Deployment

To check current status:

1. **DNS**: Run `dig releye.boestad.com`
2. **Workflow**: Check Actions tab on GitHub
3. **Pages**: Settings → Pages (check for green checkmark)
4. **Site**: Visit https://releye.boestad.com

---

**Made by**: D Boestad  
**Version**: Beta 0.5  
**App**: RelEye - Relationship Network Visualization
