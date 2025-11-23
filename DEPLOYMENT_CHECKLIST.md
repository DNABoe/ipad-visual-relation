# Quick Deployment Checklist for Spaceship.com

## 🚀 Deploy RelEye to releye.boestad.com in 15 minutes

### Prerequisites Check
- [ ] MySQL database created: `lpmjclyqtt_releye`
- [ ] MySQL user created: `lpmjclyqtt_releye_user`
- [ ] Database password available
- [ ] Spaceship cPanel access

---

## Method 1: Automated (Fastest) ⚡

### Step 1: Run deployment script
```bash
chmod +x deploy-to-spaceship-mysql.sh
./deploy-to-spaceship-mysql.sh
```

### Step 2: Configure database
Edit `deployment-package/api/config.php`:
- [ ] Set `DB_PASS` to your MySQL password
- [ ] Set `JWT_SECRET` to random string (run: `openssl rand -base64 32`)

### Step 3: Setup database
1. [ ] Login to Spaceship cPanel → phpMyAdmin
2. [ ] Select database: `lpmjclyqtt_releye`
3. [ ] Click "SQL" tab
4. [ ] Copy/paste from `database-setup-mysql.sql`
5. [ ] Click "Go"
6. [ ] Verify tables created: `users`, `invitations`, `activity_log`

### Step 4: Upload to server
Choose ONE method:

**Option A: cPanel File Manager**
1. [ ] Login to cPanel → File Manager
2. [ ] Navigate to `public_html/`
3. [ ] Upload `deployment-package.zip`
4. [ ] Right-click → Extract
5. [ ] Move files from extracted folder to `public_html/`

**Option B: FTP**
1. [ ] Connect via FTP (FileZilla, Cyberduck, etc.)
2. [ ] Upload `deployment-package/*` to `/public_html/`

### Step 5: Test
- [ ] Visit: https://releye.boestad.com/api/health
  - Should return: `{"success":true,"data":{"status":"ok",...}}`
- [ ] Visit: https://releye.boestad.com
  - Should show login page
- [ ] Login with: admin / admin
- [ ] **IMMEDIATELY change admin password!**

---

## Method 2: Manual (Step-by-step) 📝

### Step 1: Build frontend
```bash
npm install
npm run build
```

### Step 2: Configure backend
Edit `php-backend/config.php`:
- [ ] Set `DB_PASS` = your MySQL password
- [ ] Set `JWT_SECRET` = random string
- [ ] Set `CORS_ORIGIN` = `'https://releye.boestad.com'`

### Step 3: Configure frontend
Edit `src/lib/cloudAPI.ts`:
- [ ] Set `API_BASE_URL` = `'https://releye.boestad.com/api'`

### Step 4: Setup database
1. [ ] cPanel → phpMyAdmin
2. [ ] Select: `lpmjclyqtt_releye`
3. [ ] Run: `database-setup-mysql.sql`

### Step 5: Upload files

**Frontend files** (`dist/*` → `public_html/`):
- [ ] `index.html`
- [ ] `assets/` folder
- [ ] `favicon.svg`
- [ ] `.htaccess` (create - see guide)

**Backend files** (`php-backend/*` → `public_html/api/`):
- [ ] `index.php`
- [ ] `config.php` (with YOUR passwords!)
- [ ] `database.php`
- [ ] `helpers.php`
- [ ] `.htaccess` (create - see guide)

### Step 6: Create .htaccess files

**`public_html/.htaccess`:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ api/index.php?endpoint=$1 [QSA,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

**`public_html/api/.htaccess`:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php?endpoint=$1 [QSA,L]
Header set Access-Control-Allow-Origin "*"
```

### Step 7: Test
- [ ] https://releye.boestad.com/api/health
- [ ] https://releye.boestad.com
- [ ] Login and change password

---

## Troubleshooting 🔧

### Error: "Database connection failed"
✅ Check `api/config.php` has correct:
- `DB_PASS`
- `DB_NAME` = `lpmjclyqtt_releye`
- `DB_USER` = `lpmjclyqtt_releye_user`

### Error: "404 Not Found" on /api/
✅ Verify `.htaccess` files exist
✅ Check cPanel that mod_rewrite is enabled

### Error: Blank/white page
✅ Check PHP error logs in cPanel
✅ Verify PHP version is 7.4+
✅ Temporarily enable errors in `config.php`:
```php
ini_set('display_errors', 1);
```

### Error: "CORS policy" in console
✅ Check `api/.htaccess` has CORS headers
✅ Clear browser cache
✅ Hard refresh (Ctrl+Shift+R)

### Error: Can't login with admin/admin
✅ Check database has admin user:
```sql
SELECT * FROM users WHERE role = 'admin';
```
✅ If empty, re-run `database-setup-mysql.sql`

---

## Post-Deployment ✅

### Security
- [ ] Change admin password (in app)
- [ ] Verify `JWT_SECRET` is random
- [ ] Set `display_errors` to `0` in `config.php`
- [ ] Keep database password secure

### Backups
- [ ] Backup database (phpMyAdmin → Export)
- [ ] Backup files (cPanel → File Manager → Compress)
- [ ] Schedule weekly backups

### Monitoring
- [ ] Test from different browsers
- [ ] Test from mobile devices
- [ ] Create test network
- [ ] Invite test user

---

## File Structure on Server

```
public_html/
├── .htaccess              ← Frontend routing
├── index.html             ← App entry point
├── favicon.svg
├── assets/
│   ├── index-[hash].js    ← App code
│   ├── index-[hash].css   ← App styles
│   └── images/
└── api/
    ├── .htaccess          ← API routing
    ├── index.php          ← API router
    ├── config.php         ← DB credentials (KEEP SECURE!)
    ├── database.php       ← Database class
    └── helpers.php        ← Helper functions
```

---

## URLs to Test

| Test | URL | Expected Result |
|------|-----|-----------------|
| API Health | https://releye.boestad.com/api/health | `{"success":true,...}` |
| First Time | https://releye.boestad.com/api/auth/first-time | `{"success":true,"data":{"isFirstTime":false}}` |
| Frontend | https://releye.boestad.com | Login page appears |
| Login | Use: admin / admin | Dashboard appears |

---

## Default Credentials

**⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN!**

- Username: `admin`
- Password: `admin`

---

## Support Files

- 📖 **Complete Guide:** `DEPLOY_TO_SPACESHIP_MYSQL.md`
- 🗄️ **Database Schema:** `database-setup-mysql.sql`
- 🔧 **Backend Config:** `php-backend/config.php`
- 📦 **Deployment Script:** `deploy-to-spaceship-mysql.sh`

---

## Quick Commands

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Build frontend
npm run build

# Run deployment script
./deploy-to-spaceship-mysql.sh

# Test API locally (if you have PHP)
cd php-backend && php -S localhost:8000
```

---

## Deployment Time Estimate

- Database setup: **3 minutes**
- Configure files: **2 minutes**
- Build frontend: **2 minutes**
- Upload files: **5 minutes**
- Testing: **3 minutes**

**Total: ~15 minutes** ⚡

---

## Success Criteria ✅

You're done when:
- ✅ API health check returns success
- ✅ Frontend loads at releye.boestad.com
- ✅ You can login with admin credentials
- ✅ You've changed the admin password
- ✅ You can create and save a network
- ✅ Network persists after browser refresh

---

**Need help?** See full troubleshooting in `DEPLOY_TO_SPACESHIP_MYSQL.md`
