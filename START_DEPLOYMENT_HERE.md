# 🚀 RelEye Deployment - Start Here

## Quick Answer: What Do I Need to Deploy?

### Frontend (React App) ✅ Auto-Deployed
- **What:** The visual interface you see in the browser
- **Where:** GitHub Pages at https://releye.boestad.com
- **How:** Automatically builds and deploys when you push to `main` branch
- **Build needed?** ✅ Yes, but GitHub Actions does it for you automatically

### Backend (PHP API) 📁 Manual Upload
- **What:** The REST API for user authentication
- **Where:** cPanel server at https://releye.boestad.com/api
- **How:** Manually upload PHP files via cPanel File Manager
- **Build needed?** ❌ No! Just upload the files from `php-backend/` folder

---

## Do I Need to Build Anything?

### Frontend: GitHub Actions Builds It For You

When you run `git push origin main`:
1. GitHub Actions automatically runs `npm install`
2. Then runs `npm run build` to create the `dist/` folder
3. Then deploys the `dist/` folder to GitHub Pages

**You don't need to build locally** unless you want to test.

### Backend: No Build Needed

PHP runs interpreted (like Python). Just:
1. Upload the `.php` files
2. They run as-is on the server
3. No build, no compilation, no transpiling

---

## Deployment Checklist

### ☑️ One-Time Setup (Do Once)

#### Frontend Setup
- [ ] Configure GitHub Settings → Pages → Source: "GitHub Actions"
- [ ] Configure DNS CNAME: `releye → yourusername.github.io`
- [ ] Verify CNAME file exists in repo root
- [ ] Verify `.nojekyll` file exists in repo root
- [ ] Verify `.github/workflows/deploy.yml` exists

#### Backend Setup
- [ ] Create MySQL database in cPanel: `lpmjclyqtt_releye`
- [ ] Create database user: `lpmjclyqtt_releye_user`
- [ ] Run `database-setup-mysql.sql` in phpMyAdmin
- [ ] Create `/public_html/api/` folder in cPanel

### ☑️ Every Deployment

#### Frontend Deployment (Automatic)
```bash
git add .
git commit -m "Your changes"
git push origin main
# Wait 2-5 minutes
# Check: https://releye.boestad.com
```

#### Backend Deployment (When API Changes)
1. [ ] Upload files from `php-backend/` to `/public_html/api/`
2. [ ] Edit `config.php` with database password and JWT secret
3. [ ] Test: `curl https://releye.boestad.com/api/health`

**Note:** You only need to redeploy the backend when you change the API code. Frontend changes deploy automatically.

---

## File Structure Explained

```
Your Repository:
├── src/                          ← Frontend source code (React)
├── php-backend/                  ← Backend source code (PHP)
│   ├── index.php                 ← Upload this to cPanel
│   ├── config.php                ← Upload & edit this
│   ├── database.php              ← Upload this
│   ├── helpers.php               ← Upload this
│   └── .htaccess                 ← Upload this
├── database-setup-mysql.sql      ← Run this in phpMyAdmin
├── .github/workflows/deploy.yml  ← Frontend auto-deploy config
└── package.json                  ← Frontend build scripts

What GitHub Builds:
├── dist/                         ← Created by `npm run build`
│   ├── index.html                ← Auto-deployed to GitHub Pages
│   ├── assets/                   ← Auto-deployed to GitHub Pages
│   └── ...                       ← You never touch this folder

What You Upload to cPanel:
└── /public_html/api/             ← On cPanel server
    ├── index.php                 ← From php-backend/
    ├── config.php                ← From php-backend/ (edited)
    ├── database.php              ← From php-backend/
    ├── helpers.php               ← From php-backend/
    └── .htaccess                 ← From php-backend/
```

---

## Common Questions

### Q: Do I need to run `npm run build` before deploying?

**A: No.** GitHub Actions runs it for you automatically. You only need to:
```bash
git push origin main
```

### Q: Where is the `dist/` folder?

**A: Nowhere (on your computer).** GitHub Actions creates it on GitHub's servers during the build process. You don't need it locally.

If you want to test the build locally:
```bash
npm run build        # Creates dist/ folder
npm run preview      # Serves dist/ at http://localhost:4173
```

But for actual deployment, just push to GitHub.

### Q: How do I update the backend?

**A: Only when you change backend code:**
1. Edit files in `php-backend/` folder
2. Upload changed files to cPanel `/public_html/api/`
3. Done

You don't redeploy the backend every time. Only when the API code changes.

### Q: How often do I need to deploy?

- **Frontend:** Every time you push to `main` (automatic)
- **Backend:** Only when you modify files in `php-backend/` folder (manual)

### Q: What if I only changed frontend code?

**A: Just push to GitHub.** Backend stays as-is.

```bash
git add src/
git commit -m "Updated UI"
git push origin main
# Backend is unaffected
```

### Q: What if I only changed backend code?

**A: Just upload to cPanel.** No need to push to GitHub (unless you want to version control it).

1. Edit `php-backend/index.php` (for example)
2. Upload `index.php` to `/public_html/api/`
3. Done

(You should still commit backend changes to Git for version control, but it doesn't trigger a deployment)

### Q: Can I deploy backend via GitHub Actions?

**A: Not currently.** Your cPanel hosting doesn't support automated deployment. You must manually upload via File Manager or FTP.

### Q: Do I need to upload the entire `src/` folder to cPanel?

**A: No!** Never upload `src/` to cPanel. 

- `src/` = Frontend source (React) → Built by Vite → Deployed to GitHub Pages
- `php-backend/` = Backend source (PHP) → Uploaded as-is to cPanel

They're completely separate.

---

## Detailed Guides

- **📘 Complete Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **📙 Backend Only Guide:** `BACKEND_DEPLOYMENT_LATEST.md`
- **📗 Frontend Only Guide:** See "Frontend Deployment" section in `DEPLOYMENT_GUIDE.md`

---

## Quick Deploy Right Now

### First Time Ever
1. Read `DEPLOYMENT_GUIDE.md` sections 1-3 (10 minutes)
2. Follow all steps carefully
3. Test using the verification section

### Already Deployed, Making Updates

**Frontend changes only:**
```bash
git add .
git commit -m "Updated UI/features/etc"
git push origin main
# Visit GitHub Actions tab to watch progress
# Visit https://releye.boestad.com after 2-5 min
```

**Backend changes only:**
1. Open cPanel File Manager
2. Navigate to `/public_html/api/`
3. Upload changed files from `php-backend/`
4. Test: `curl https://releye.boestad.com/api/health`

**Both frontend and backend changed:**
1. Do the frontend push first (above)
2. Then do the backend upload (above)
3. Test both

---

## Health Check URLs

Test these after deployment:

- **Frontend:** https://releye.boestad.com
- **Backend Health:** https://releye.boestad.com/api/health
- **Backend First-Time:** https://releye.boestad.com/api/auth/first-time

All should return valid responses (not 404, not 500).

---

## Still Confused?

**The simplest explanation:**

1. **Frontend** = The app users see = GitHub Pages = Automatic
2. **Backend** = The API that handles logins = cPanel = Manual upload

When you change frontend code → Just `git push`  
When you change backend code → Upload to cPanel  

That's it.
