# RelEye: Complete Unified Deployment Guide for Spaceship cPanel

**Host both frontend and backend at releye.boestad.com - The recommended approach**

## 🎯 Why This Approach is Better

Hosting everything at **one domain** (`releye.boestad.com`) eliminates:
- ❌ CORS complexity and errors
- ❌ Cross-domain session issues
- ❌ SSL certificate complications
- ❌ DNS propagation delays between services
- ❌ GitHub Pages limitations

You get:
- ✅ Single deployment location
- ✅ No CORS configuration needed (same origin)
- ✅ Simpler SSL management (one certificate)
- ✅ Better performance (no external redirects)
- ✅ Full control over both frontend and backend
- ✅ Easier debugging and maintenance

---

## 📋 Architecture Overview

```
releye.boestad.com
├── /                    → Frontend (React app)
│   ├── index.html
│   ├── assets/
│   └── [built files]
│
└── /api/                → Backend (PHP API)
    ├── index.php
    ├── config.php
    ├── database.php
    ├── helpers.php
    └── .htaccess
```

**How it works:**
1. User visits `https://releye.boestad.com` → Serves React frontend
2. Frontend makes API calls to `/api/*` → Same domain, no CORS
3. Backend handles authentication, data storage, user management
4. Everything uses one SSL certificate, one domain

---

## 📦 What You'll Need

### From This Project
1. **Backend files** (in `php-backend/` folder):
   - `index.php`
   - `config.php`
   - `database.php`
   - `helpers.php`
   - `.htaccess`

2. **Database setup** (in project root):
   - `database-setup.sql`

3. **Frontend build** (you'll create this):
   - Built React app from `npm run build`

### From Spaceship cPanel
- cPanel login credentials
- MySQL database access
- File Manager or FTP access
- phpMyAdmin access

---

## 🚀 Step-by-Step Deployment

## Phase 1: Database Setup

### 1.1 Create Database

1. **Log into Spaceship cPanel**
2. Navigate to **Databases → MySQL Databases**
3. **Create a new database**:
   - Database Name: `releye` (will become `lpmjclyqtt_releye`)
   - Click **Create Database**
   - Note the full name: `lpmjclyqtt_releye`

### 1.2 Create Database User

1. In the same **MySQL Databases** section
2. **Add New User**:
   - Username: `releye_user` (will become `lpmjclyqtt_releye_user`)
   - Password: **Generate a strong password** (or create your own)
   - Click **Create User**
   - **⚠️ SAVE THIS PASSWORD** - you'll need it in config.php

### 1.3 Link User to Database

1. Scroll to **Add User To Database**
2. Select:
   - User: `lpmjclyqtt_releye_user`
   - Database: `lpmjclyqtt_releye`
3. Click **Add**
4. On the privileges page, select **ALL PRIVILEGES**
5. Click **Make Changes**

### 1.4 Import Database Schema

1. Open **phpMyAdmin** (Databases → phpMyAdmin)
2. Click on database `lpmjclyqtt_releye` in left sidebar
3. Click **Import** tab
4. Click **Choose File** and select `database-setup.sql` from this project
5. Click **Go** at the bottom
6. Verify three tables were created:
   - `users`
   - `invitations`
   - `activity_log`
7. Click on **users** table → **Browse**
8. You should see one admin user with email `admin@releye.local`

✅ **Database setup complete!**

---

## Phase 2: Backend Deployment

### 2.1 Determine Your Web Root

In cPanel File Manager, your subdomain path will likely be one of:
- `public_html/releye/` (most common for subdomains)
- `public_html/` (if releye is your primary domain)
- `releye.boestad.com/` (some cPanel configurations)

**To find it:**
1. Open **File Manager** in cPanel
2. Navigate to `public_html/`
3. Look for a folder named `releye` or check cPanel → **Domains** for the document root

For this guide, we'll use: `public_html/releye/`

### 2.2 Create API Directory

1. In **File Manager**, navigate to `public_html/releye/`
2. Click **+ Folder** button
3. Name it: `api`
4. You now have: `public_html/releye/api/`

### 2.3 Upload Backend Files

1. Navigate into the `api/` folder
2. Click **Upload** button
3. Upload these 5 files from the `php-backend/` folder:
   - ✅ `index.php`
   - ✅ `config.php`
   - ✅ `database.php`
   - ✅ `helpers.php`
   - ✅ `.htaccess`

**⚠️ Important:** Make sure `.htaccess` is uploaded (it starts with a dot, might be hidden)

To verify it uploaded:
- Click **Settings** (top right in File Manager)
- Check "Show Hidden Files (dotfiles)"
- You should see `.htaccess` in the file list

### 2.4 Configure Backend

1. In File Manager, navigate to `public_html/releye/api/`
2. **Right-click `config.php`** → **Edit** (or use Code Editor)
3. Update the following values:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'lpmjclyqtt_releye_user');           // Your database username
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE');      // ⚠️ PASTE PASSWORD FROM STEP 1.2
define('DB_NAME', 'lpmjclyqtt_releye');                // Your database name
define('DB_CHARSET', 'utf8mb4');

// JWT Secret - CRITICAL SECURITY!
define('JWT_SECRET', 'REPLACE_WITH_RANDOM_64_CHAR_STRING');  // ⚠️ GENERATE BELOW

// CORS Origin - For unified deployment, use your domain
define('CORS_ORIGIN', 'https://releye.boestad.com');

// API Version
define('API_VERSION', '1.0.0');

// Error reporting - PRODUCTION SETTINGS
error_reporting(E_ALL);
ini_set('display_errors', 0);      // Never show errors to users
ini_set('log_errors', 1);          // Log errors to file

// Timezone
date_default_timezone_set('UTC');
?>
```

### 2.5 Generate JWT Secret

**⚠️ CRITICAL SECURITY STEP**

The JWT_SECRET signs authentication tokens. Use one of these methods:

**Method 1 - Online Generator** (use private/incognito window):
```
https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
```

**Method 2 - Command Line** (if available):
```bash
openssl rand -base64 48
```

**Method 3 - PHP Script** (create temporary file, run once, delete):
```php
<?php echo bin2hex(random_bytes(32)); ?>
```

**Example result:**
```
a3f8d9c2e1b4f6a8c9d2e5f8b1c4d7e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7
```

Paste this into your `config.php`:
```php
define('JWT_SECRET', 'a3f8d9c2e1b4f6a8c9d2e5f8b1c4d7e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7');
```

4. **Save Changes** in the editor
5. Close the file

### 2.6 Set File Permissions

1. In File Manager, select `config.php`
2. Click **Permissions** button
3. Set to **600** (only owner can read/write) for security
4. For all other files in `/api/`:
   - Set to **644** (owner read/write, others read-only)

### 2.7 Test Backend API

**Open in your browser:**
```
https://releye.boestad.com/api/health
```

**Expected response:**
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

✅ **If you see this:** Backend is working!

❌ **If you see an error:** Jump to [Troubleshooting](#troubleshooting)

**Also test:**
```
https://releye.boestad.com/api/auth/first-time
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "isFirstTime": false
  }
}
```

This means the default admin user was created successfully.

✅ **Backend deployment complete!**

---

## Phase 3: Frontend Deployment

### 3.1 Build Frontend

On your **local development machine** (or development environment):

1. **Verify API URL** (should already be correct):

Open `src/lib/cloudAPI.ts` and verify:
```typescript
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`
```

This automatically uses `/api` when deployed (same domain).

2. **Install dependencies** (if not already):
```bash
npm install
```

3. **Build the production version**:
```bash
npm run build
```

This creates a `dist/` folder with your built application.

### 3.2 Upload Frontend Files

1. In **cPanel File Manager**, navigate to `public_html/releye/`
2. You should already have an `api/` folder here
3. **Upload all files from the `dist/` folder** to `public_html/releye/`
   - `index.html`
   - `assets/` folder (with all contents)
   - Any other files generated by the build

**Your directory structure should now look like:**
```
public_html/releye/
├── api/                  ← Backend
│   ├── .htaccess
│   ├── config.php
│   ├── database.php
│   ├── helpers.php
│   └── index.php
├── assets/              ← Frontend assets
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── index.html           ← Frontend entry point
```

### 3.3 Configure .htaccess for Frontend

In `public_html/releye/` (the root, NOT the api folder), create or edit `.htaccess`:

1. Click **+ File** → Name it `.htaccess` (if it doesn't exist)
2. Edit the file and add:

```apache
# RelEye Frontend Configuration

# Enable HTTPS redirect
<IfModule mod_rewrite.c>
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Don't rewrite API requests
RewriteRule ^api/ - [L]

# Don't rewrite files or directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Route everything else to index.html (SPA)
RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache Control for Assets
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/html "access plus 0 seconds"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
ExpiresByType image/svg+xml "access plus 1 month"
ExpiresByType image/png "access plus 1 month"
ExpiresByType image/jpeg "access plus 1 month"
ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

3. **Save the file**

This configuration:
- ✅ Forces HTTPS
- ✅ Preserves API routes (doesn't redirect `/api/*`)
- ✅ Enables React Router (SPA routing)
- ✅ Adds security headers
- ✅ Optimizes caching

### 3.4 Verify PHP Version

1. In cPanel, go to **Software → MultiPHP Manager**
2. Select `releye.boestad.com` domain
3. Choose **PHP 8.0** or higher (8.1 recommended)
4. Click **Apply**

✅ **Frontend deployment complete!**

---

## Phase 4: DNS Configuration

### 4.1 Update DNS Records

1. In cPanel, go to **Domains → Zone Editor**
2. Find `releye.boestad.com`
3. **Verify or create an A record**:
   - Type: `A`
   - Host: `releye`
   - Points to: `203.161.45.23` (your server IP)
   - TTL: `5 minutes` (300 seconds)

4. **Remove any CNAME records** for `releye` pointing to GitHub Pages
   - If you see: `releye → CNAME → dnaboe.github.io`
   - Delete it (we're not using GitHub Pages anymore)

### 4.2 Remove GitHub Pages Configuration

Since we're hosting everything on Spaceship now:

1. Go to your GitHub repository: `https://github.com/dnaboe/releye`
2. Navigate to **Settings → Pages**
3. **Disable GitHub Pages**:
   - Set source to "None"
   - Remove the custom domain
4. This step is optional but recommended to avoid confusion

### 4.3 Wait for DNS Propagation

- DNS changes typically take 5-30 minutes
- You can check with: `nslookup releye.boestad.com`
- Should return: `203.161.45.23`

---

## Phase 5: Testing & Verification

### 5.1 Test Backend API

Open in browser:

**Health Check:**
```
https://releye.boestad.com/api/health
```
✅ Should return: `{"success": true, "data": {...}}`

**First-Time Check:**
```
https://releye.boestad.com/api/auth/first-time
```
✅ Should return: `{"success": true, "data": {"isFirstTime": false}}`

### 5.2 Test Frontend

Open in browser:
```
https://releye.boestad.com
```

You should see:
- ✅ RelEye login screen
- ✅ Green padlock (HTTPS working)
- ✅ No console errors (press F12 to check)

### 5.3 Test Authentication

1. On the login screen, enter:
   - **Email**: `admin@releye.local`
   - **Password**: `admin`
2. Click **Login**
3. You should:
   - ✅ See the File Manager screen
   - ✅ Be able to create/load workspaces
   - ✅ Not see any CORS errors in console

### 5.4 Test Full Workflow

1. **Create a new workspace**:
   - Enter filename: `test-workspace`
   - Enter password
   - Click Create
2. **Add some data**:
   - Add a person node
   - Add connections
3. **Save the workspace**
4. **Reload the page**
5. **Load the workspace** you just created
6. ✅ Data should persist

### 5.5 Check Browser Console

Press **F12** → Console tab

You should see:
- ✅ `[CloudAPI]` logs showing API calls
- ✅ All requests to `/api/*` returning 200 status
- ✅ No CORS errors
- ✅ No 404 errors

---

## 🔒 Phase 6: Security Hardening

### 6.1 Change Default Admin Password

**⚠️ DO THIS IMMEDIATELY!**

1. Log in as `admin@releye.local` with password `admin`
2. Once logged in, look for **Settings** or **Profile**
3. Change the password to something strong:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Example: `R3l£ye!2024$SecUr3`

**Or delete the default admin and create a new one:**

In phpMyAdmin:
```sql
-- Delete default admin
DELETE FROM users WHERE email = 'admin@releye.local';

-- You'll then see "First Time Setup" and can create new admin
```

### 6.2 Verify Configuration Security

Check these settings in `public_html/releye/api/config.php`:

```php
// Should be 0 (disabled) in production
ini_set('display_errors', 0);

// Should be a long random string, NOT the default
define('JWT_SECRET', 'your-64-char-random-string');

// Should match your production domain
define('CORS_ORIGIN', 'https://releye.boestad.com');
```

### 6.3 Set Proper File Permissions

In File Manager:

```
config.php:    600 (rw-------)  ← Most restrictive
*.php files:   644 (rw-r--r--)  ← Standard
.htaccess:     644 (rw-r--r--)  ← Standard
```

To change permissions:
1. Select file
2. Click **Permissions**
3. Enter numeric value (e.g., 600)
4. Click **Change Permissions**

### 6.4 Enable Additional Security Headers

In `public_html/releye/api/.htaccess`, verify these headers exist:

```apache
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

### 6.5 Limit Database User Privileges

In cPanel → MySQL Databases:
- Verify `lpmjclyqtt_releye_user` only has access to `lpmjclyqtt_releye`
- Should not have privileges on other databases

### 6.6 Setup Automatic Backups

1. Go to **cPanel → Backup Wizard**
2. Choose **Backup**
3. Select **Full Backup**
4. Configure:
   - Destination: Remote FTP or Download
   - Schedule: Weekly or Monthly
5. **Important**: Also backup your database regularly:
   - phpMyAdmin → Export → `lpmjclyqtt_releye`
   - Save `.sql` file securely

---

## 🎯 Deployment Checklist

### Database Setup
- [ ] Database `lpmjclyqtt_releye` created
- [ ] User `lpmjclyqtt_releye_user` created with strong password
- [ ] User assigned ALL PRIVILEGES on database
- [ ] SQL schema imported successfully
- [ ] Three tables visible: users, invitations, activity_log
- [ ] Default admin user exists in users table

### Backend Files
- [ ] `/api/` directory created in web root
- [ ] All 5 PHP files uploaded to `/api/`
- [ ] `.htaccess` file present in `/api/`
- [ ] `config.php` edited with database credentials
- [ ] JWT_SECRET generated and set (64+ random characters)
- [ ] CORS_ORIGIN set to `https://releye.boestad.com`
- [ ] `display_errors` set to `0`
- [ ] `config.php` permissions set to 600
- [ ] Other PHP files set to 644

### Frontend Files
- [ ] Frontend built with `npm run build`
- [ ] All files from `dist/` uploaded to web root
- [ ] `index.html` at root level
- [ ] `assets/` folder at root level
- [ ] Root `.htaccess` configured for SPA routing
- [ ] Root `.htaccess` preserves `/api/` routes

### DNS & Domain
- [ ] A record for `releye` points to server IP (203.161.45.23)
- [ ] No conflicting CNAME records
- [ ] DNS propagation complete
- [ ] `nslookup releye.boestad.com` returns correct IP

### PHP & Server
- [ ] PHP version 8.0 or higher selected in MultiPHP Manager
- [ ] mod_rewrite enabled (should be by default)
- [ ] SSL certificate valid (check with browser)
- [ ] HTTPS working (green padlock)

### Testing
- [ ] `/api/health` returns valid JSON
- [ ] `/api/auth/first-time` works
- [ ] Frontend loads without errors
- [ ] Can log in with default credentials
- [ ] No CORS errors in console
- [ ] Session persists after refresh
- [ ] Can create workspaces
- [ ] Can save/load workspaces
- [ ] All features functional

### Security
- [ ] Default admin password changed immediately
- [ ] JWT_SECRET is unique random string
- [ ] Database password is strong
- [ ] Error display disabled in production
- [ ] File permissions set correctly
- [ ] Security headers present in responses
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Backup schedule established

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to API" or API returns 404

**Symptoms:**
- Frontend loads but shows connection errors
- `/api/health` returns 404
- Console shows "Failed to fetch"

**Solutions:**

1. **Verify API files exist:**
   - Check File Manager: `public_html/releye/api/` should contain all 5 PHP files
   - Verify `.htaccess` is present in `/api/` folder

2. **Test direct PHP access:**
   - Try: `https://releye.boestad.com/api/index.php?endpoint=health`
   - If this works but `/api/health` doesn't, `.htaccess` isn't working

3. **Check mod_rewrite:**
   - In cPanel: **Software → MultiPHP INI Editor**
   - Select your domain
   - Look for `AllowOverride` setting
   - Should be set to `All` or at least `FileInfo`

4. **Verify .htaccess syntax:**
   - Edit `public_html/releye/api/.htaccess`
   - Make sure it looks like this:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php?endpoint=$1 [QSA,L]
   ```

5. **Check error logs:**
   - cPanel → **Metrics → Errors**
   - Look for recent PHP or Apache errors

### Problem: Database Connection Errors

**Symptoms:**
- API returns "Database connection failed"
- 500 Internal Server Error
- `/api/health` shows database: "error"

**Solutions:**

1. **Verify credentials in config.php:**
   ```php
   define('DB_HOST', 'localhost');  // Should be 'localhost'
   define('DB_USER', 'lpmjclyqtt_releye_user');  // Check spelling
   define('DB_PASS', 'correct_password_here');   // Verify password
   define('DB_NAME', 'lpmjclyqtt_releye');       // Check database name
   ```

2. **Test database connection:**
   - Open phpMyAdmin
   - Select `lpmjclyqtt_releye`
   - Can you see the tables?
   - Try: `SELECT * FROM users;`

3. **Check user privileges:**
   - cPanel → MySQL Databases
   - Scroll to "Current Databases"
   - Verify user has ALL PRIVILEGES on the database

4. **Check PHP PDO extension:**
   - cPanel → **Software → MultiPHP INI Editor**
   - Select your domain
   - Look for `pdo_mysql` extension
   - Should be enabled

### Problem: CORS Errors (if any appear)

**Symptoms:**
- Console shows "blocked by CORS policy"
- Network tab shows OPTIONS requests failing

**Note:** This shouldn't happen with unified deployment (same domain), but if it does:

**Solutions:**

1. **Verify CORS_ORIGIN in config.php:**
   ```php
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```
   Must match your actual domain exactly.

2. **Check helpers.php:**
   - The `setCORSHeaders()` function should set:
   ```php
   header("Access-Control-Allow-Origin: " . CORS_ORIGIN);
   header("Access-Control-Allow-Credentials: true");
   ```

3. **Verify API response headers:**
   ```bash
   curl -H "Origin: https://releye.boestad.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://releye.boestad.com/api/health -v
   ```
   Should show `Access-Control-Allow-Origin` header.

### Problem: White Screen or Blank Page

**Symptoms:**
- Visit site and see nothing
- Just white screen
- No errors visible

**Solutions:**

1. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Look for JavaScript errors
   - Common issue: Missing base tag or incorrect asset paths

2. **Verify index.html uploaded:**
   - Check File Manager
   - `public_html/releye/index.html` should exist

3. **Check assets folder:**
   - Should have: `public_html/releye/assets/`
   - Should contain: `.js`, `.css` files with hash names

4. **View page source:**
   - Right-click → View Page Source
   - Check `<script>` and `<link>` tags
   - Paths should be relative (e.g., `/assets/index-abc123.js`)

5. **Check .htaccess:**
   - Make sure root `.htaccess` isn't blocking index.html

### Problem: Login Fails with Default Credentials

**Symptoms:**
- Username/password "admin@releye.local" / "admin" rejected
- "Invalid credentials" error

**Solutions:**

1. **Verify admin user exists:**
   - Open phpMyAdmin
   - Select `lpmjclyqtt_releye` database
   - Click on `users` table → Browse
   - Should see user with email `admin@releye.local`

2. **Check password hash:**
   - The password_hash field should contain a long string starting with `$2y$`
   - If empty or looks wrong, re-import the SQL schema

3. **Reset admin password manually:**
   ```sql
   UPDATE users 
   SET password_hash = '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU8VpDQpqmui' 
   WHERE email = 'admin@releye.local';
   ```
   This sets password to: `admin123`

4. **Re-import database:**
   - If all else fails, drop tables and re-import `database-setup.sql`

### Problem: 500 Internal Server Error

**Symptoms:**
- API or frontend returns HTTP 500
- Generic "Internal Server Error" message

**Solutions:**

1. **Check PHP error logs:**
   - cPanel → **Metrics → Errors**
   - Look for recent PHP errors
   - Common issues: syntax errors, missing files, permission problems

2. **Enable error display temporarily:**
   - Edit `config.php`
   ```php
   ini_set('display_errors', 1);  // Temporarily enable
   ```
   - Reload page to see actual error
   - **Remember to set back to 0 when done!**

3. **Check file permissions:**
   - PHP files should be readable (644)
   - Directories should be executable (755)

4. **Verify PHP version:**
   - cPanel → **MultiPHP Manager**
   - Should be PHP 8.0 or higher
   - Try switching versions if current doesn't work

### Problem: Session/Authentication Not Persisting

**Symptoms:**
- Log in successfully but logged out on refresh
- "Session expired" messages
- Can't stay logged in

**Solutions:**

1. **Check browser console for JWT errors:**
   - Should see successful login response with token

2. **Verify cookies are being set:**
   - Browser DevTools → Application → Cookies
   - Should see session cookies for your domain

3. **Check CORS credentials:**
   - In `cloudAPI.ts`, verify:
   ```typescript
   credentials: 'include'
   ```

4. **Verify JWT_SECRET hasn't changed:**
   - If you changed JWT_SECRET, all existing sessions are invalidated
   - Users must log in again

### Problem: Assets Not Loading (404 for CSS/JS)

**Symptoms:**
- Site loads but looks broken
- No styling
- Console shows 404 for .css and .js files

**Solutions:**

1. **Verify assets uploaded:**
   - Check `public_html/releye/assets/` folder exists
   - Should contain `.js` and `.css` files

2. **Check asset paths in index.html:**
   - View page source
   - Asset paths should be relative: `/assets/...`
   - Not absolute: `https://example.com/assets/...`

3. **Check .htaccess rewrite rules:**
   - Make sure assets aren't being rewritten
   - Should have:
   ```apache
   RewriteCond %{REQUEST_FILENAME} !-f
   ```

4. **Rebuild frontend:**
   - Sometimes build paths get misconfigured
   - Try: `rm -rf dist && npm run build`
   - Re-upload to server

---

## 📚 Quick Reference

### Important URLs
- **Frontend**: `https://releye.boestad.com`
- **API Base**: `https://releye.boestad.com/api`
- **Health Check**: `https://releye.boestad.com/api/health`
- **cPanel**: [From your Spaceship account]
- **phpMyAdmin**: cPanel → Databases → phpMyAdmin

### Database Credentials
- **Host**: `localhost`
- **Database**: `lpmjclyqtt_releye`
- **User**: `lpmjclyqtt_releye_user`
- **Password**: [The one you set in Step 1.2]

### Default Admin Credentials
- **Email**: `admin@releye.local`
- **Password**: `admin`
- **⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN**

### File Locations (cPanel File Manager)
```
public_html/releye/
├── api/                    ← Backend
│   ├── .htaccess          ← API routing
│   ├── config.php         ← Database + JWT secret
│   ├── database.php       ← Database functions
│   ├── helpers.php        ← Utility functions
│   └── index.php          ← API entry point
├── assets/                ← Frontend assets
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── .htaccess              ← Frontend routing + security
└── index.html             ← Frontend entry point
```

### Essential cPanel Sections
- **File Manager**: Files → File Manager
- **MySQL Databases**: Databases → MySQL Databases
- **phpMyAdmin**: Databases → phpMyAdmin
- **PHP Version**: Software → MultiPHP Manager
- **Error Logs**: Metrics → Errors
- **DNS Zone Editor**: Domains → Zone Editor
- **Backup**: Files → Backup Wizard

### Useful Commands (for testing)

**Test API health:**
```bash
curl https://releye.boestad.com/api/health
```

**Test with headers:**
```bash
curl -H "Origin: https://releye.boestad.com" \
     -H "Content-Type: application/json" \
     https://releye.boestad.com/api/health -v
```

**Check DNS:**
```bash
nslookup releye.boestad.com
```

**Test SSL:**
```bash
openssl s_client -connect releye.boestad.com:443 -servername releye.boestad.com
```

---

## 🔄 Updating Your Deployment

### Updating Frontend

1. **Make changes to code**
2. **Test locally:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **Upload new files:**
   - Delete old files in `public_html/releye/` (except `api/` folder!)
   - Upload new files from `dist/` folder
   - **Don't touch the `/api/` directory**

### Updating Backend

1. **Backup current version:**
   - Download entire `/api/` folder from File Manager
   - Export database from phpMyAdmin

2. **Upload new backend files:**
   - Upload modified PHP files
   - **Don't overwrite `config.php`** (unless structure changed)

3. **Update database** (if schema changed):
   - Run migration SQL scripts in phpMyAdmin

4. **Test:**
   - Visit `/api/health`
   - Test authentication
   - Verify all features work

5. **Rollback if needed:**
   - Upload backup files
   - Restore database

### Updating Configuration

If you need to change `config.php`:

1. **Download current version** (backup)
2. **Edit in File Manager** or locally
3. **Upload new version**
4. **Test immediately** - wrong config breaks everything

---

## 📝 Maintenance Schedule

### Daily
- Monitor error logs if you notice issues

### Weekly
- Check error logs in cPanel → Metrics → Errors
- Verify backups are running

### Monthly
- Update PHP version if new stable release available
- Check disk space usage in cPanel
- Review active user accounts
- Test disaster recovery (restore from backup in test environment)

### Quarterly
- Review and audit user permissions
- Update JWT_SECRET (optional, invalidates all sessions)
- Security audit (check logs for unusual activity)

---

## 🆘 Getting Help

### Check Logs First

1. **PHP Error Logs:**
   - cPanel → **Metrics → Errors**
   - Look for recent errors with timestamps

2. **Browser Console:**
   - Press **F12** → Console tab
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **API Responses:**
   - Use browser DevTools → Network tab
   - Click on failed API request
   - Check Response tab for error messages

### Contact Support

**For Spaceship/cPanel issues:**
- mod_rewrite problems
- PHP configuration
- SSL certificate issues
- Database connection problems

Contact: **Spaceship Support**
- Include: domain name, error message, steps tried

**For RelEye application issues:**
- Review documentation in project folder
- Check error logs for specific error messages
- Verify configuration files are correct

---

## 🎉 Success Criteria

Your deployment is **100% successful** when:

✅ You can visit `https://releye.boestad.com` and see the login screen
✅ HTTPS is working (green padlock in browser)  
✅ You can log in with admin credentials
✅ No errors in browser console
✅ You can create a new workspace
✅ You can add people and connections
✅ You can save the workspace
✅ You can reload the page and load the workspace again
✅ Data persists correctly
✅ Sessions persist (don't get logged out on refresh)
✅ You can create additional users
✅ You can send invitations
✅ All features work as expected

**Congratulations! Your RelEye application is now fully deployed at a single unified domain!** 🚀

---

## 📖 Additional Documentation

For more information, see:
- `PRD.md` - Product requirements and design specifications
- `ARCHITECTURE.md` - Technical architecture details
- `SECURITY.md` - Security best practices
- `database-setup.sql` - Database schema
- `php-backend/` - Backend source code

---

**Document Version**: 2.0  
**Last Updated**: 2024  
**For**: RelEye Application - Unified Deployment on Spaceship cPanel  
**Author**: RelEye Team
