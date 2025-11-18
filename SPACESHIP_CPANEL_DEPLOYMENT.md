# RelEye Backend Deployment Guide for Spaceship cPanel

**Complete deployment instructions for hosting the RelEye PHP backend API on Spaceship cPanel**

---

## 📋 Table of Contents

1. [Current Setup Overview](#current-setup-overview)
2. [Prerequisites](#prerequisites)
3. [DNS Configuration](#dns-configuration)
4. [Database Setup](#database-setup)
5. [Backend File Upload](#backend-file-upload)
6. [Configuration](#configuration)
7. [Testing & Verification](#testing--verification)
8. [Frontend Configuration](#frontend-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## 🌐 Current Setup Overview

### Domain Structure
- **Main Domain**: `boestad.com`
- **Subdomain**: `releye.boestad.com`
- **Frontend**: Currently hosted on GitHub Pages via CNAME to `dnaboe.github.io`
- **Backend API**: Will be hosted at `releye.boestad.com/api`

### Current DNS Records (from screenshot)
```
ftp.releye          A       203.161.45.23
releye              A       203.161.45.23
webdisk.releye      A       203.161.45.23
www.releye          CNAME   releye.boestad.com
releye              TXT     v=spf1 include:spf.shared.spaceship.host ~all
```

---

## ✅ Prerequisites

Before starting, ensure you have:

- ✓ Spaceship cPanel login credentials
- ✓ Access to the `boestad.com` hosting account
- ✓ MySQL database access via phpMyAdmin
- ✓ FTP or File Manager access
- ✓ The following files from this project:
  - `php-backend/` folder (all files)
  - `database-setup-mysql.sql`

---

## 🔧 DNS Configuration

### Step 1: Update DNS Records

**IMPORTANT**: You need to change how the subdomain is configured.

#### Current Issue
The subdomain has a CNAME record pointing to GitHub Pages:
```
releye  →  CNAME  →  dnaboe.github.io
```

This won't work because you need the subdomain to point to your Spaceship server for the backend API while still serving the frontend.

#### Solution: Use A Record Instead

**In Spaceship cPanel → Zone Editor:**

1. **Delete the existing CNAME** record for `releye` (if it exists separately from the A record shown in screenshot)
2. **Keep/Verify the A record** exists:
   ```
   Type: A
   Host: releye
   Points to: 203.161.45.23
   TTL: 5 minutes (or 300 seconds)
   ```

3. **Update GitHub Pages Settings:**
   - Go to your GitHub repository: `https://github.com/dnaboe/releye`
   - Navigate to: **Settings → Pages**
   - Under "Custom domain", enter: `releye.boestad.com`
   - Save the changes
   - GitHub will create/update the CNAME file in your repo

4. **Wait for DNS propagation** (typically 5-30 minutes with 5 min TTL)

#### Why This Works
- The A record points `releye.boestad.com` to your Spaceship server (203.161.45.23)
- GitHub Pages will respond to requests for `releye.boestad.com` 
- Your Spaceship server will handle `/api/*` requests via .htaccess rules
- Static files (frontend) can be served from the same domain

---

## 🗄️ Database Setup

### Step 1: Access phpMyAdmin

1. Log into **Spaceship cPanel**
2. Scroll to **Databases** section
3. Click **phpMyAdmin**

### Step 2: Verify Database Exists

Based on the PHP configuration, your database should be:
- **Database Name**: `lpmjclyqtt_releye`
- **Username**: `lpmjclyqtt_releye_user`

#### If Database Doesn't Exist:

1. Go back to cPanel
2. Click **MySQL Databases**
3. Create new database: 
   - Name: `releye` (cPanel will prefix it: `lpmjclyqtt_releye`)
4. Create new user:
   - Username: `releye_user` (will become `lpmjclyqtt_releye_user`)
   - Password: **Generate strong password** (save this!)
5. Add user to database with **ALL PRIVILEGES**

### Step 3: Import Database Schema

1. In **phpMyAdmin**, select database `lpmjclyqtt_releye` from left sidebar
2. Click **Import** tab at the top
3. Click **Choose File**
4. Select `database-setup-mysql.sql` from this project
5. Ensure format is set to **SQL**
6. Click **Go** at the bottom
7. Wait for success message

### Step 4: Verify Tables Created

In phpMyAdmin, you should now see three tables:
- ✓ `users` (stores user accounts)
- ✓ `invitations` (stores pending invites)
- ✓ `activity_log` (tracks user actions)

### Step 5: Verify Default Admin User

1. Click on `users` table
2. Click **Browse** tab
3. You should see one user:
   - Email: `admin@releye.local`
   - Role: `admin`
   - User ID: `admin-default`

**⚠️ Default Admin Credentials:**
- Email: `admin@releye.local`
- Password: `admin`
- **CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!**

---

## 📤 Backend File Upload

### Step 1: Access File Manager

1. In **Spaceship cPanel**, find **Files** section
2. Click **File Manager**
3. Navigate to your domain's root directory:
   - Usually: `public_html/releye` or `public_html/`
   - If `releye.boestad.com` is a subdomain with its own root: `public_html/releye/`

### Step 2: Create API Directory

1. Inside your web root (where your frontend files are/will be), create a new folder:
   - **Name**: `api`
   - Full path example: `public_html/releye/api/`

### Step 3: Upload Backend Files

Upload all files from the `php-backend/` folder to the `api/` directory:

```
public_html/releye/
├── api/
│   ├── .htaccess          ← Upload this
│   ├── config.php         ← Upload this (will edit next)
│   ├── database.php       ← Upload this
│   ├── helpers.php        ← Upload this
│   └── index.php          ← Upload this
└── [your frontend files]
```

**Upload Methods:**
- **Option A**: Use File Manager's Upload button (zip recommended for multiple files)
- **Option B**: Use FTP client (FileZilla, etc.) with credentials from cPanel

### Step 4: Set File Permissions

Right-click each file in File Manager and set permissions:
- **PHP files** (`*.php`): 644 (rw-r--r--)
- **.htaccess**: 644 (rw-r--r--)

---

## ⚙️ Configuration

### Step 1: Edit config.php

**In File Manager:**

1. Navigate to `api/config.php`
2. Right-click → **Edit** (or use Code Editor)
3. Update the following values:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');                      // Usually 'localhost' for cPanel
define('DB_USER', 'lpmjclyqtt_releye_user');        // Your database username
define('DB_PASS', 'YOUR_ACTUAL_DATABASE_PASSWORD'); // ⚠️ CHANGE THIS!
define('DB_NAME', 'lpmjclyqtt_releye');             // Your database name
define('DB_CHARSET', 'utf8mb4');

// JWT Secret for token generation (CRITICAL!)
define('JWT_SECRET', 'CHANGE_TO_RANDOM_64_CHAR_STRING'); // ⚠️ CHANGE THIS!

// CORS Origin (Your frontend URL)
define('CORS_ORIGIN', 'https://releye.boestad.com');

// API Version
define('API_VERSION', '1.0.0');

// Error reporting (PRODUCTION SETTINGS)
error_reporting(E_ALL);
ini_set('display_errors', 0);  // NEVER show errors to users
ini_set('log_errors', 1);       // Log errors instead

// Timezone
date_default_timezone_set('UTC');
?>
```

### Step 2: Generate JWT Secret

**⚠️ CRITICAL SECURITY STEP**

The JWT_SECRET is used to sign authentication tokens. It must be:
- At least 32 characters long (64+ recommended)
- Random and unpredictable
- Never shared or committed to version control

**Generate a secure secret:**

**Method 1 - Online** (use a private/incognito window):
```
https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
```

**Method 2 - Command Line** (if you have terminal access):
```bash
openssl rand -base64 48
```

**Method 3 - PHP** (can run this once in browser then delete):
```php
<?php
echo bin2hex(random_bytes(32));
?>
```

**Example Result:**
```php
define('JWT_SECRET', 'a3f8d9c2e1b4f6a8c9d2e5f8b1c4d7e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7');
```

### Step 3: Update CORS Origin

If you're using a different domain or testing on localhost:

```php
// For production
define('CORS_ORIGIN', 'https://releye.boestad.com');

// For local testing, change helpers.php setCORSHeaders() function
// It already allows localhost, but you can add specific ports
```

### Step 4: Save Configuration

1. Click **Save Changes** in File Manager editor
2. Close the editor

---

## 🧪 Testing & Verification

### Step 1: Test API Health Endpoint

**In your browser, visit:**
```
https://releye.boestad.com/api/health
```

**Expected Response:**
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

**If you see this:** ✅ API is working!

**If you see error:** ⚠️ See [Troubleshooting](#troubleshooting)

### Step 2: Test First-Time Setup Check

```
https://releye.boestad.com/api/auth/first-time
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isFirstTime": false
  }
}
```

**Meaning**: There's already an admin user (the default one we created)

### Step 3: Test Database Connection

If health check works but first-time fails, check:
1. Database credentials in `config.php`
2. Database tables were created properly
3. Check PHP error logs in cPanel

### Step 4: Test from Frontend

1. Open your frontend: `https://releye.boestad.com`
2. You should see the login screen
3. Try logging in with default credentials:
   - Email: `admin@releye.local`
   - Password: `admin`
4. If successful: ✅ Full integration working!

---

## 🎨 Frontend Configuration

### Update API URL in Frontend

Your frontend code needs to know where the API is located.

**In `src/lib/cloudAPI.ts`** (or wherever API_BASE_URL is defined):

```typescript
// For production (subdomain API)
const API_BASE_URL = 'https://releye.boestad.com/api'

// Or use relative URL (recommended if frontend and backend on same domain)
const API_BASE_URL = '/api'
```

### Build and Deploy Frontend

1. **Update the API URL** in your code
2. **Build the project:**
   ```bash
   npm run build
   ```
3. **Deploy to GitHub Pages:**
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

4. **Wait a few minutes** for GitHub Pages to rebuild

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to API" or 404 Errors

**Check:**
1. **.htaccess file exists** in `/api/` directory
2. **mod_rewrite is enabled** (should be by default on cPanel)
3. **File permissions** are correct (644 for .htaccess)
4. **URL is correct**: `/api/health` not `/api/index.php/health`

**Test .htaccess:**
Visit: `https://releye.boestad.com/api/index.php?endpoint=health`

If this works but `/api/health` doesn't, .htaccess isn't working.

**Fix:**
- Verify .htaccess was uploaded
- Check cPanel → "MultiPHP INI Editor" → make sure `AllowOverride` is enabled
- Contact Spaceship support to enable `mod_rewrite`

### Problem: Database Connection Errors

**Check:**
1. Database credentials in `config.php` are correct
2. Database user has privileges on the database
3. Database name includes the cPanel prefix (`lpmjclyqtt_`)

**Verify in phpMyAdmin:**
- Can you see the tables?
- Can you run: `SELECT * FROM users;`

**Check PHP error logs:**
- cPanel → **Metrics** → **Errors**
- Look for PDO connection errors

### Problem: CORS Errors in Browser Console

**Symptoms:**
```
Access to fetch at 'https://releye.boestad.com/api/health' from origin 
'https://releye.boestad.com' has been blocked by CORS policy
```

**Fix:**
1. Verify `CORS_ORIGIN` in `config.php` matches your frontend URL exactly
2. Check `helpers.php` `setCORSHeaders()` function is being called
3. Make sure `Access-Control-Allow-Origin` header is being sent

**Test with curl:**
```bash
curl -H "Origin: https://releye.boestad.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://releye.boestad.com/api/health -v
```

Should return headers including:
```
Access-Control-Allow-Origin: https://releye.boestad.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Problem: White Screen / No Response

**Check:**
1. PHP version: Should be **7.4+** (8.0+ recommended)
   - cPanel → **MultiPHP Manager**
   - Select domain → Choose PHP 8.0 or higher
2. PHP extensions enabled:
   - PDO
   - pdo_mysql
   - json
   - openssl

**Enable if missing:**
- cPanel → **MultiPHP INI Editor** → Check extension list

### Problem: Login Fails with Default Admin

**Check:**
1. User exists in database:
   ```sql
   SELECT * FROM users WHERE email = 'admin@releye.local';
   ```
2. Password hash is present
3. Try running database setup script again

**Reset admin password manually:**
```sql
UPDATE users 
SET password_hash = '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU8VpDQpqmui' 
WHERE email = 'admin@releye.local';
```
This sets password to: `admin123`

### Problem: "Database does not exist" Error

**Fix:**
1. In phpMyAdmin, click **Databases** tab
2. Check if `lpmjclyqtt_releye` exists
3. If not, create it via **cPanel → MySQL Databases**
4. Re-import the SQL schema

### Problem: JSON/Syntax Errors

**Check:**
1. Files uploaded correctly (not corrupted)
2. No extra whitespace or BOM characters in PHP files
3. Files are UTF-8 encoded without BOM

**Re-upload if needed:**
- Download fresh copies from the project
- Upload again, overwriting existing files

---

## 🔒 Security Best Practices

### Immediate Actions After Setup

1. **Change Default Admin Password**
   - Log in with `admin@releye.local` / `admin`
   - Go to Settings/Profile
   - Change password to something strong
   - Or create a new admin user and delete the default

2. **Secure config.php**
   - Verify `display_errors` is `0` in production
   - Verify `JWT_SECRET` is unique and random
   - Never commit `config.php` with real credentials

3. **Set Proper Permissions**
   ```
   config.php: 600 (rw-------)  ← Most restrictive
   Other .php: 644 (rw-r--r--)
   .htaccess:  644 (rw-r--r--)
   api/:       755 (rwxr-xr-x)
   ```

4. **Enable HTTPS Only**
   - Your site already uses HTTPS (Let's Encrypt via Spaceship)
   - Verify certificate is valid
   - Consider adding HSTS header:
     ```
     Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
     ```

5. **Limit Database User Privileges**
   - The database user should only have access to `lpmjclyqtt_releye`
   - Remove privileges on other databases if present

6. **Regular Backups**
   - cPanel → **Backup Wizard**
   - Download database backups regularly
   - Keep offline copies

7. **Monitor Error Logs**
   - cPanel → **Metrics** → **Errors**
   - Check for suspicious activity
   - Failed login attempts
   - SQL injection attempts

8. **Keep PHP Updated**
   - Use latest stable PHP version (8.0+)
   - Check cPanel monthly for updates

### Additional Security Headers

Add to `.htaccess` in `/api/` directory:

```apache
# Security Headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Disable PHP execution in uploads (if you add file uploads)
<FilesMatch "\.(php|php3|php4|php5|phtml)$">
    Require all denied
</FilesMatch>
```

---

## 📚 Quick Reference

### Important URLs
- **Frontend**: `https://releye.boestad.com`
- **API Base**: `https://releye.boestad.com/api`
- **Health Check**: `https://releye.boestad.com/api/health`
- **cPanel**: (from Spaceship account page)
- **phpMyAdmin**: cPanel → Databases → phpMyAdmin

### Database Info
- **Host**: `localhost`
- **Name**: `lpmjclyqtt_releye`
- **User**: `lpmjclyqtt_releye_user`
- **Password**: (set during database creation)

### Default Admin
- **Email**: `admin@releye.local`
- **Password**: `admin` (change immediately!)

### File Locations
```
public_html/releye/
├── api/
│   ├── .htaccess
│   ├── config.php     ← Contains DB credentials & JWT secret
│   ├── database.php
│   ├── helpers.php
│   └── index.php
├── index.html         ← Frontend entry point
└── [other frontend files]
```

### Essential cPanel Sections
- **File Manager**: Files → File Manager
- **MySQL Databases**: Databases → MySQL Databases
- **phpMyAdmin**: Databases → phpMyAdmin
- **PHP Version**: Software → MultiPHP Manager
- **Error Logs**: Metrics → Errors
- **DNS Zone Editor**: Domains → Zone Editor

---

## 🎯 Deployment Checklist

Use this checklist to ensure everything is configured correctly:

### DNS & Domain
- [ ] A record for `releye` points to `203.161.45.23`
- [ ] No conflicting CNAME records
- [ ] GitHub Pages configured with custom domain
- [ ] DNS propagation complete (check with `nslookup releye.boestad.com`)

### Database
- [ ] Database `lpmjclyqtt_releye` exists
- [ ] User `lpmjclyqtt_releye_user` exists with password
- [ ] User has ALL PRIVILEGES on database
- [ ] SQL schema imported successfully
- [ ] Three tables visible: users, invitations, activity_log
- [ ] Default admin user exists in users table

### Backend Files
- [ ] All 5 PHP files uploaded to `/api/` directory
- [ ] `.htaccess` file uploaded and visible
- [ ] File permissions set correctly (644 for all)
- [ ] `config.php` edited with correct credentials
- [ ] JWT_SECRET changed to random string
- [ ] CORS_ORIGIN set to production domain
- [ ] `display_errors` set to `0`

### Testing
- [ ] `/api/health` returns valid JSON
- [ ] `/api/auth/first-time` returns `{"isFirstTime": false}`
- [ ] Frontend loads without errors
- [ ] Can log in with default admin credentials
- [ ] Default admin password changed
- [ ] Can create new users
- [ ] Can send invitations
- [ ] Session persists after page refresh

### Security
- [ ] JWT_SECRET is unique and not default value
- [ ] Database password is strong
- [ ] Default admin password changed
- [ ] `config.php` permissions set to 600
- [ ] HTTPS is working (certificate valid)
- [ ] CORS headers working correctly
- [ ] Error display disabled in production
- [ ] PHP version 8.0 or higher

### Documentation
- [ ] Database credentials saved securely (password manager)
- [ ] JWT_SECRET backed up securely
- [ ] Backup schedule established
- [ ] This document saved for reference

---

## 🆘 Getting Help

### Before Contacting Support

1. **Check PHP Error Logs**:
   - cPanel → Metrics → Errors
   - Look for the most recent errors
   - Note the exact error message

2. **Check Browser Console**:
   - Press F12 in browser
   - Go to Console tab
   - Look for red errors
   - Note the failed request URLs

3. **Test with cURL**:
   ```bash
   curl -v https://releye.boestad.com/api/health
   ```
   Copy the entire output

### Spaceship Support

If you need help with:
- Server configuration
- PHP version/extensions
- mod_rewrite issues
- SSL certificate problems

**Contact Spaceship Support** with:
- Your domain: `releye.boestad.com`
- Description of the issue
- Error messages from logs
- Steps you've already tried

### RelEye Application Issues

For issues with the RelEye application itself:
- Check the main README.md
- Review other documentation files in this project
- Check the GitHub repository issues

---

## 📝 Notes

### About File Structure

This deployment assumes:
- Frontend and backend share the same domain
- Backend is in a subdirectory (`/api/`)
- Frontend is at root level
- This is the recommended setup for simplicity

### About Subdomains in cPanel

Spaceship cPanel with the prefix `lpmjclyqtt_` indicates:
- You're using a shared hosting account
- Database and user names are automatically prefixed
- You may have multiple domains/subdomains under one account
- The subdomain `releye.boestad.com` is under the `boestad.com` account

### About GitHub Pages + API

The setup works because:
1. DNS A record points domain to your server
2. Your server has the backend at `/api/`
3. For other paths, you can configure server to serve frontend files
4. OR GitHub Pages can serve frontend while API is on your server
5. CORS allows cross-origin requests between them

**Two Options for Frontend:**

**Option A: Everything on Spaceship**
- Upload frontend build files to `public_html/releye/`
- Backend in `public_html/releye/api/`
- Simpler, everything in one place
- No GitHub Pages needed

**Option B: Frontend on GitHub Pages, API on Spaceship**
- GitHub Pages serves static files
- Spaceship only handles `/api/` requests
- Requires CORS configuration
- Current setup (with A record) supports this

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ You can visit `https://releye.boestad.com` and see the app
✅ You can log in with admin credentials  
✅ You can create new users
✅ You can send invitations
✅ You can open/save workspaces
✅ All features work without console errors
✅ Sessions persist between page reloads
✅ HTTPS is working (green padlock in browser)

**Congratulations!** Your RelEye backend is now live on Spaceship cPanel! 🚀

---

## 📅 Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check error logs for issues
- [ ] Verify backups are running

**Monthly:**
- [ ] Update PHP version if new stable release
- [ ] Review user accounts for inactive users
- [ ] Check disk space usage in cPanel

**Quarterly:**
- [ ] Review and update JWT_SECRET (optional, affects all sessions)
- [ ] Security audit (review user permissions)
- [ ] Test disaster recovery (restore from backup)

### Updating the Backend

When you need to update API code:

1. **Backup current version**:
   - Download current `/api/` folder
   - Export database from phpMyAdmin

2. **Upload new files**:
   - Upload updated PHP files
   - Don't overwrite `config.php` (unless structure changed)

3. **Update database** (if schema changed):
   - Import new SQL migration scripts
   - Or manually run ALTER TABLE statements

4. **Test**:
   - Check `/api/health` endpoint
   - Test authentication
   - Verify all features work

5. **Rollback if needed**:
   - Upload backup files
   - Restore database from backup

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**For**: RelEye Application on Spaceship cPanel  
**Domain**: releye.boestad.com

