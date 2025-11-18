# RelEye Unified Deployment - Quick Start Checklist

**Deploy everything at releye.boestad.com in ~30 minutes**

---

## ✅ Pre-Deployment

- [ ] Have cPanel login ready
- [ ] Have this project files available
- [ ] Have FTP or File Manager access ready
- [ ] Know your server IP: `203.161.45.23`

---

## 1️⃣ Database (5 minutes)

### Create Database
- [ ] cPanel → MySQL Databases
- [ ] Create database: `releye` → becomes `lpmjclyqtt_releye`
- [ ] Create user: `releye_user` → becomes `lpmjclyqtt_releye_user`
- [ ] Generate strong password → **SAVE IT!**
- [ ] Add user to database with ALL PRIVILEGES

### Import Schema
- [ ] Open phpMyAdmin
- [ ] Select `lpmjclyqtt_releye`
- [ ] Import → Choose `database-setup.sql`
- [ ] Verify 3 tables created: `users`, `invitations`, `activity_log`
- [ ] Browse `users` table → See admin user

---

## 2️⃣ Backend (10 minutes)

### Upload Files
- [ ] File Manager → Navigate to `public_html/releye/`
- [ ] Create folder: `api`
- [ ] Upload to `/api/` folder:
  - [ ] `index.php`
  - [ ] `config.php`
  - [ ] `database.php`
  - [ ] `helpers.php`
  - [ ] `.htaccess`
- [ ] Verify all 5 files visible (enable "Show Hidden Files" for .htaccess)

### Configure
- [ ] Edit `api/config.php`
- [ ] Set `DB_USER`: `lpmjclyqtt_releye_user`
- [ ] Set `DB_PASS`: [paste your password from step 1]
- [ ] Set `DB_NAME`: `lpmjclyqtt_releye`
- [ ] Generate JWT_SECRET (64 random chars): https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
- [ ] Paste JWT_SECRET into config
- [ ] Set `CORS_ORIGIN`: `https://releye.boestad.com`
- [ ] Verify `display_errors`: `0`
- [ ] Save file

### Set Permissions
- [ ] `config.php` → Permissions → 600
- [ ] All other files → Permissions → 644

### Test
- [ ] Visit: `https://releye.boestad.com/api/health`
- [ ] Should see: `{"success": true, ...}`
- [ ] Visit: `https://releye.boestad.com/api/auth/first-time`
- [ ] Should see: `{"isFirstTime": false}`

---

## 3️⃣ Frontend (10 minutes)

### Build Locally
- [ ] On your dev machine: `npm install`
- [ ] Verify `src/lib/cloudAPI.ts` uses relative paths (already done)
- [ ] Run: `npm run build`
- [ ] Verify `dist/` folder created

### Upload
- [ ] File Manager → `public_html/releye/`
- [ ] Upload all files from `dist/` to this folder:
  - [ ] `index.html`
  - [ ] `assets/` folder (entire folder with contents)
  - [ ] Any other files from dist/

### Configure
- [ ] In `public_html/releye/` (root, not /api/), create `.htaccess`:

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteRule ^api/ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
</IfModule>
```

- [ ] Save file

### Set PHP Version
- [ ] cPanel → Software → MultiPHP Manager
- [ ] Select `releye.boestad.com`
- [ ] Choose PHP 8.0 or higher
- [ ] Apply

---

## 4️⃣ DNS (5 minutes)

- [ ] cPanel → Domains → Zone Editor
- [ ] Find `releye.boestad.com`
- [ ] Verify A record exists:
  - Type: `A`
  - Host: `releye`
  - Points to: `203.161.45.23`
- [ ] Delete any CNAME records for `releye` (if pointing to GitHub)
- [ ] Wait 5-30 minutes for DNS propagation

---

## 5️⃣ Final Testing (5 minutes)

### Test Backend
- [ ] Open: `https://releye.boestad.com/api/health`
- [ ] Returns valid JSON ✅

### Test Frontend
- [ ] Open: `https://releye.boestad.com`
- [ ] See login screen ✅
- [ ] Green padlock (HTTPS) ✅
- [ ] Press F12 → Console → No errors ✅

### Test Authentication
- [ ] Login with:
  - Email: `admin@releye.local`
  - Password: `admin`
- [ ] See File Manager screen ✅
- [ ] No console errors ✅

### Test Full Workflow
- [ ] Create new workspace: `test-workspace`
- [ ] Set password
- [ ] Add a person node
- [ ] Save workspace
- [ ] Reload page (F5)
- [ ] Load workspace
- [ ] Data persists ✅

---

## 6️⃣ Security (Immediate!)

- [ ] Log in as admin
- [ ] **CHANGE PASSWORD** to something strong
- [ ] Consider creating new admin user and deleting default
- [ ] Verify `config.php` permissions: 600
- [ ] Verify JWT_SECRET is not default value

---

## 🎯 Directory Structure (Final State)

```
public_html/releye/
├── api/                      ← Backend
│   ├── .htaccess            ✅
│   ├── config.php           ✅ (permissions: 600)
│   ├── database.php         ✅
│   ├── helpers.php          ✅
│   └── index.php            ✅
├── assets/                   ← Frontend assets
│   ├── index-[hash].js      ✅
│   ├── index-[hash].css     ✅
│   └── ...                  ✅
├── .htaccess                 ✅ (SPA routing)
└── index.html                ✅
```

---

## ❌ Troubleshooting Quick Fixes

**API 404:**
- Check `.htaccess` exists in `/api/`
- Try: `https://releye.boestad.com/api/index.php?endpoint=health`

**Database errors:**
- Check credentials in `config.php`
- Test in phpMyAdmin

**White screen:**
- Check browser console (F12)
- Verify `index.html` uploaded
- Check `assets/` folder exists

**Login fails:**
- Check admin user exists in database
- Try password: `admin123`
- Reset password in phpMyAdmin

**500 errors:**
- Check cPanel → Metrics → Errors
- Verify PHP version 8.0+

---

## ✅ Success!

When everything works:
- ✅ Site loads at `https://releye.boestad.com`
- ✅ Can log in
- ✅ Can create/save/load workspaces
- ✅ No console errors
- ✅ Sessions persist

**🎉 Deployment Complete!**

---

## 📖 Full Documentation

For detailed explanations, see:
- `UNIFIED_DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- `SPACESHIP_CPANEL_DEPLOYMENT.md` - Original cPanel guide
- `php-backend/` - Backend source files

---

**Questions?** Check cPanel → Metrics → Errors for detailed error messages
