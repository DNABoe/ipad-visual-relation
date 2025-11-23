# Deploy RelEye to Spaceship.com with MySQL - Complete Guide

## Overview

This guide will help you deploy RelEye to **releye.boestad.com** on Spaceship.com with MySQL database backend.

**What you'll have:**
- ✅ Full-featured RelEye app at releye.boestad.com
- ✅ Multi-user authentication with MySQL
- ✅ Network files stored locally (encrypted in browser)
- ✅ User credentials stored in MySQL database
- ✅ Access from any device/browser

**Time to deploy:** ~15 minutes

---

## Architecture

```
┌──────────────────────────────────────┐
│ Users (Any Browser)                  │
│ https://releye.boestad.com           │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Spaceship.com Web Hosting          │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Frontend (public_html/)      │ │
│  │ - index.html                 │ │
│  │ - /assets/...                │ │
│  │ - /src/...                   │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Backend (api/)               │ │
│  │ - PHP REST API               │ │
│  │ - Handles auth/invites       │ │
│  └────────┬─────────────────────┘ │
│           │                        │
│  ┌────────▼─────────────────────┐ │
│  │ MySQL Database               │ │
│  │ - lpmjclyqtt_releye          │ │
│  │ - Users, invitations, logs   │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## Prerequisites

✅ You have:
- Spaceship.com hosting account with cPanel access
- MySQL database: `lpmjclyqtt_releye`
- MySQL user: `lpmjclyqtt_releye_user`
- Database password
- FTP/SSH or File Manager access

---

## Step 1: Configure MySQL Database (5 min)

### 1.1 Access phpMyAdmin

1. Log into your Spaceship.com cPanel
2. Click on "phpMyAdmin"
3. Select database `lpmjclyqtt_releye` from the left sidebar

### 1.2 Import Database Schema

1. Click the "SQL" tab at the top
2. Copy the entire contents from `database-setup-mysql.sql` (in this project)
3. Paste into the SQL query box
4. Click "Go" button

**Expected result:**
```
✓ Table 'users' created
✓ Table 'invitations' created  
✓ Table 'activity_log' created
✓ 1 admin user inserted
```

### 1.3 Verify Setup

Check that tables exist:
- `users` - should have 1 admin user
- `invitations` - should be empty
- `activity_log` - should be empty

**Default admin credentials:**
- Username: `admin`
- Password: `admin`
- ⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## Step 2: Configure Backend (3 min)

### 2.1 Update Database Configuration

Edit `php-backend/config.php`:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'lpmjclyqtt_releye_user');
define('DB_PASS', 'YOUR_ACTUAL_DATABASE_PASSWORD');  // ← Change this!
define('DB_NAME', 'lpmjclyqtt_releye');
define('DB_CHARSET', 'utf8mb4');

// JWT Secret for token generation (use random string)
define('JWT_SECRET', 'CHANGE_THIS_TO_A_RANDOM_STRING');  // ← Change this!

// CORS Origin
define('CORS_ORIGIN', 'https://releye.boestad.com');

// API Version
define('API_VERSION', '1.0.0');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);  // 0 for production
ini_set('log_errors', 1);

date_default_timezone_set('UTC');
?>
```

**To generate a secure JWT_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use this website:
# https://www.grc.com/passwords.htm
```

### 2.2 Update Frontend API URL

Edit `src/lib/cloudAPI.ts`:

Find line ~3 and change:

```typescript
const API_BASE_URL = 'https://releye.boestad.com/api'
```

---

## Step 3: Build Frontend (2 min)

```bash
# Install dependencies (if not already done)
npm install

# Build production version
npm run build
```

This creates a `dist/` folder with your optimized frontend files.

---

## Step 4: Deploy to Spaceship.com (5 min)

You have 3 options to upload files:

### Option A: Using File Manager (Easiest)

1. **Log into cPanel → File Manager**

2. **Navigate to public_html/**

3. **Upload Frontend Files:**
   - Upload all contents from `dist/` folder to `public_html/`
   - This includes: `index.html`, `assets/`, etc.

4. **Create API folder:**
   - Create new folder: `public_html/api/`

5. **Upload Backend Files:**
   - Upload all files from `php-backend/` to `public_html/api/`
   - Files to upload:
     - `index.php`
     - `config.php` (with your database password)
     - `database.php`
     - `helpers.php`
     - `.htaccess`

### Option B: Using FTP (Recommended)

1. **Get FTP credentials from Spaceship cPanel**

2. **Connect with FTP client** (FileZilla, Cyberduck, etc.)
   - Host: releye.boestad.com (or ftp.releye.boestad.com)
   - Username: your cPanel username
   - Password: your cPanel password
   - Port: 21

3. **Upload files:**
   ```
   Local → Remote
   dist/* → /public_html/
   php-backend/* → /public_html/api/
   ```

### Option C: Using Automated Script (Fastest)

Run the automated deployment script:

```bash
./deploy-to-spaceship.sh
```

This script will:
1. ✅ Build the frontend
2. ✅ Package all files
3. ✅ Create deployment instructions
4. ✅ Generate deployment-package.zip for easy upload

Then just:
1. Upload `deployment-package.zip` to cPanel File Manager
2. Extract it in the `public_html/` directory
3. Done!

---

## Step 5: Configure .htaccess (Important!)

Make sure `public_html/.htaccess` contains:

```apache
# Enable URL rewriting
RewriteEngine On

# API routes
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ api/index.php?endpoint=$1 [QSA,L]

# Frontend routes - send all non-file requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable CORS for API
<FilesMatch "\.(php)$">
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</FilesMatch>
```

And `public_html/api/.htaccess` contains:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php?endpoint=$1 [QSA,L]

Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ index.php [L]
```

---

## Step 6: Test Your Deployment

### 6.1 Test Backend API

Visit: `https://releye.boestad.com/api/health`

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1234567890,
    "version": "1.0.0",
    "database": "mysql"
  }
}
```

### 6.2 Test First-Time Setup Check

Visit: `https://releye.boestad.com/api/auth/first-time`

Expected response:
```json
{
  "success": true,
  "data": {
    "isFirstTime": false
  }
}
```

### 6.3 Test Frontend

1. Visit: `https://releye.boestad.com`
2. You should see the login page
3. Login with:
   - Username: `admin`
   - Password: `admin`
4. **Immediately change the password!**

---

## Step 7: Post-Deployment Security

### 7.1 Change Admin Password

1. Login as admin
2. Click your profile/settings
3. Change password to something strong

### 7.2 Secure JWT Secret

Make sure you changed `JWT_SECRET` in `config.php` to a random string (see Step 2.1)

### 7.3 Disable Debug Mode

In `php-backend/config.php`, make sure:

```php
error_reporting(E_ALL);
ini_set('display_errors', 0);  // ← Should be 0 in production
ini_set('log_errors', 1);
```

---

## Troubleshooting

### Issue: "Database connection failed"

**Solution:**
1. Check `config.php` has correct database password
2. Verify database name: `lpmjclyqtt_releye`
3. Verify database user: `lpmjclyqtt_releye_user`
4. Make sure user has all privileges on the database

**Test in phpMyAdmin:**
```sql
SHOW GRANTS FOR 'lpmjclyqtt_releye_user'@'localhost';
```

### Issue: "404 Not Found" on API calls

**Solution:**
1. Check `.htaccess` files exist (Step 5)
2. Verify `mod_rewrite` is enabled on your hosting
3. Check file permissions:
   ```
   api/ → 755
   api/*.php → 644
   ```

### Issue: API returns blank/white page

**Solution:**
1. Check PHP error logs in cPanel
2. Verify PHP version is 7.4 or higher
3. Enable error display temporarily:
   ```php
   ini_set('display_errors', 1);
   ```
4. Check that all required PHP extensions are enabled:
   - mysqli
   - json
   - openssl

### Issue: "CORS error" in browser console

**Solution:**
1. Verify `.htaccess` has CORS headers (Step 5)
2. Check `config.php` has correct `CORS_ORIGIN`
3. Clear browser cache
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Can't login with admin credentials

**Solution:**
1. Check database has admin user:
   ```sql
   SELECT * FROM users WHERE role = 'admin';
   ```
2. If no admin user, re-run `database-setup-mysql.sql`
3. Check `password_hash` column is not empty

---

## Updating Your App

When you make changes to the code:

### Update Frontend:
```bash
npm run build
# Upload dist/* to public_html/
```

### Update Backend:
```bash
# Upload php-backend/* to public_html/api/
# (Don't forget to keep your config.php with real passwords!)
```

### Quick Update Script:
```bash
./deploy-to-spaceship.sh
```

---

## File Structure on Server

Your `public_html/` should look like:

```
public_html/
├── .htaccess                 # Frontend routing
├── index.html               # Main app entry
├── favicon.svg
├── assets/
│   ├── index-abc123.js     # App JavaScript (hashed)
│   ├── index-def456.css    # App CSS (hashed)
│   └── images/
└── api/
    ├── .htaccess           # API routing
    ├── index.php           # Main API router
    ├── config.php          # Database credentials
    ├── database.php        # Database class
    └── helpers.php         # Helper functions
```

---

## Backup Strategy

### Backup Database:
1. Go to phpMyAdmin
2. Select `lpmjclyqtt_releye`
3. Click "Export" tab
4. Click "Go" button
5. Save the `.sql` file

### Backup Files:
1. Use cPanel File Manager
2. Select `public_html/`
3. Click "Compress"
4. Download the zip file

**Schedule:** Backup weekly or before making changes.

---

## Performance Tips

1. **Enable Gzip Compression** - Add to `.htaccess`:
   ```apache
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
   </IfModule>
   ```

2. **Enable Browser Caching** - Add to `.htaccess`:
   ```apache
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType text/css "access plus 1 year"
     ExpiresByType application/javascript "access plus 1 year"
     ExpiresByType image/svg+xml "access plus 1 year"
   </IfModule>
   ```

3. **Optimize Images** - Use WebP format for photos if possible

---

## Support & Maintenance

### Database Maintenance:

**Clean old activity logs (older than 90 days):**
```sql
DELETE FROM activity_log WHERE created_at < (UNIX_TIMESTAMP() - (90 * 24 * 60 * 60)) * 1000;
```

**View user statistics:**
```sql
SELECT email, name, role, login_count, FROM_UNIXTIME(last_login/1000) as last_login_date
FROM users 
ORDER BY last_login DESC;
```

**Check pending invitations:**
```sql
SELECT email, role, FROM_UNIXTIME(created_at/1000) as created_date, 
       CASE WHEN used = 1 THEN 'Used' ELSE 'Pending' END as status
FROM invitations
ORDER BY created_at DESC;
```

---

## Next Steps After Deployment

1. ✅ Login and change admin password
2. ✅ Create your first network
3. ✅ Invite team members (if needed)
4. ✅ Configure grid settings
5. ✅ Set up regular backups

---

## Summary

You now have:
- ✅ RelEye running at https://releye.boestad.com
- ✅ MySQL database for user management
- ✅ Encrypted network files in browser
- ✅ Multi-user support with invitations
- ✅ Fully functional on standard web hosting

**Need help?** Check the troubleshooting section or review the error logs in cPanel.
