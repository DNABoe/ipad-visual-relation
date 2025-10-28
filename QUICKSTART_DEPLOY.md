# Quick Start: Deploy to releye.boestad.com

## 3-Minute Setup

### Step 1: Configure GitHub (1 minute)

1. **Enable Actions**  
   Settings → Actions → General → "Read and write permissions" ✅

2. **Enable Pages**  
   Settings → Pages → Source: "Deploy from a branch" → Branch: `gh-pages` / `(root)`

3. **Set Custom Domain**  
   Settings → Pages → Custom domain: `releye.boestad.com`

### Step 2: Configure DNS (1 minute)

At your domain registrar, add **ONE** of these:

**CNAME (easier):**
```
Type: CNAME
Name: releye
Value: [your-github-username].github.io
```

**OR A Records (alternative):**
```
Type: A, Name: releye, Value: 185.199.108.153
Type: A, Name: releye, Value: 185.199.109.153
Type: A, Name: releye, Value: 185.199.110.153
Type: A, Name: releye, Value: 185.199.111.153
```

### Step 3: Deploy (1 minute)

```bash
git add .
git commit -m "Deploy RelEye"
git push origin main
```

### Step 4: Wait & Verify

- **Build**: Watch Actions tab (2-3 min)
- **DNS**: May take 15 min - 48 hours to propagate
- **Visit**: https://releye.boestad.com

## ✅ Done!

Every push to `main` now auto-deploys.

---

**Need details?** See `DEPLOYMENT.md`  
**Checklist?** See `DEPLOYMENT_CHECKLIST.md`  
**Overview?** See `DEPLOYMENT_SUMMARY.md`
