# RelEye Deployment Guide

**Complete deployment instructions for the RelEye relationship network visualization application.**

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Deployment (GitHub Pages)](#frontend-deployment-github-pages)
3. [Backend Deployment (cPanel + PHP)](#backend-deployment-cpanel--php)
4. [Testing & Verification](#testing--verification)
5. [Troubleshooting](#troubleshooting)

---

## Overview

RelEye consists of two parts that must be deployed separately:

### Frontend (React App)
- **Technology**: React + TypeScript + Vite
- **Hosting**: GitHub Pages
- **URL**: https://releye.boestad.com
- **Deployment Method**: Automated via GitHub Actions

### Backend (REST API)
- **Technology**: PHP + MySQL
- **Hosting**: cPanel (Spaceship hosting at Boestad.com)
- **URL**: https://releye.boestad.com/api
- **Deployment Method**: Manual file upload via cPanel

---

## Frontend Deployment (GitHub Pages)

The frontend automatically builds and deploys via GitHub Actions when you push to the `main` branch.

### Prerequisites

✅ GitHub repository with code  
✅ GitHub Pages enabled  
✅ Custom domain configured (releye.boestad.com)  
✅ DNS configured at domain registrar

### Step 1: Configure GitHub Repository Settings

1. **Go to repository Settings → Actions → General**
   - Under "Workflow permissions"
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**
   - Click **Save**

2. **Go to repository Settings → Pages**
   - Under "Build and deployment"
   - Source: Select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Custom domain: Enter **"releye.boestad.com"**
   - Click **Save**

### Step 2: Configure DNS at Domain Registrar

Add the following DNS records at your domain registrar (Boestad.com):

```
Type: CNAME
Host: releye
Value: yourusername.github.io
TTL: 3600 (or default)
```

**Verification:**
```bash
dig releye.boestad.com
# Should show CNAME record pointing to GitHub Pages
```

### Step 3: Verify Required Files Exist

These files should already exist in your repository (DO NOT modify unless necessary):

```
✅ .github/workflows/deploy.yml  # GitHub Actions workflow
✅ CNAME                         # Custom domain file
✅ .nojekyll                     # Disable Jekyll processing
✅ vite.config.ts                # Vite build configuration
✅ package.json                  # Build scripts
```

### Step 4: Deploy

The frontend automatically deploys when you push to main:

```bash
git add .
git commit -m "Deploy updates"
git push origin main
```

**Monitor deployment progress:**
1. Go to your GitHub repository
2. Click the **"Actions"** tab
3. Watch the "Deploy to GitHub Pages" workflow
4. Wait for both "build" and "deploy" jobs to complete (✅ green checkmarks)

**Deployment takes 2-5 minutes.**

### Step 5: Verify Frontend Deployment

Once the workflow completes:

1. Visit https://releye.boestad.com
2. You should see the RelEye login screen (or first-time setup)
3. Check browser console for any errors (F12 → Console tab)

### Build Locally (Optional Testing)

Test the build process before deploying:

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Preview the built app locally
npm run preview
# Visit http://localhost:4173
```

If the local build succeeds, the GitHub Actions build should succeed too.

---

## Backend Deployment (cPanel + PHP)

The backend must be manually uploaded to your cPanel hosting.

### Prerequisites

✅ Access to Spaceship cPanel at Boestad.com  
✅ MySQL database created (lpmjclyqtt_releye)  
✅ Database user created (lpmjclyqtt_releye_user)  
✅ Database password

### Architecture

```
Backend Components:
├── PHP Files (in /public_html/api/)
│   ├── index.php      - Main API router
│   ├── config.php     - Configuration (DB credentials, JWT secret)
│   ├── database.php   - MySQL connection class
│   ├── helpers.php    - Utility functions
│   └── .htaccess      - URL rewriting
│
└── MySQL Database: lpmjclyqtt_releye
    ├── users          - User accounts
    ├── invitations    - Pending user invites
    └── activity_log   - Audit trail
```

### Step 1: Setup MySQL Database

1. **Log into cPanel**
2. **Open phpMyAdmin**
3. **Select database**: `lpmjclyqtt_releye`
4. **Click the "SQL" tab**
5. **Copy and paste the entire contents** of `database-setup-mysql.sql`
6. **Click "Go"**

**Verify tables were created:**

```sql
SHOW TABLES;
```

You should see:
- `users`
- `invitations`
- `activity_log`

**Verify default admin user exists:**

```sql
SELECT user_id, email, name, role FROM users WHERE role = 'admin';
```

Should return one row with email: `admin@releye.local`

### Step 2: Upload Backend Files to cPanel

#### Option A: Using cPanel File Manager (Recommended)

1. **Log into cPanel**
2. **Open "File Manager"**
3. **Navigate to** `/public_html/api/` directory
   - If the `api` folder doesn't exist, create it
4. **Upload ALL files** from the `php-backend/` directory:
   - `index.php`
   - `config.php`
   - `database.php`
   - `helpers.php`
   - `.htaccess`

5. **Set correct file permissions:**
   - Select all PHP files
   - Click "Permissions" (or right-click → Permissions)
   - Set to `644` (rw-r--r--)
   - For the `api` directory itself, set to `755` (rwxr-xr-x)

#### Option B: Using FTP

1. **Connect via FTP:**
   - Host: `ftp.boestad.com`
   - Username: Your cPanel username
   - Password: Your cPanel password

2. **Navigate to** `/public_html/api/`
3. **Upload all files** from `php-backend/` directory
4. **Set permissions** to `644` for files, `755` for directories

### Step 3: Configure Backend

**Edit the file** `/public_html/api/config.php`

You must change THREE things:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'lpmjclyqtt_releye_user');
define('DB_PASS', 'YOUR_ACTUAL_DATABASE_PASSWORD_HERE'); // ← CHANGE THIS!
define('DB_NAME', 'lpmjclyqtt_releye');

// JWT Secret - MUST BE CHANGED to a secure random string
define('JWT_SECRET', 'GENERATE_A_SECURE_RANDOM_STRING_HERE'); // ← CHANGE THIS!

// CORS Configuration
define('CORS_ORIGIN', 'https://releye.boestad.com'); // ← Verify this matches your frontend URL
?>
```

**Generate a secure JWT secret:**

```bash
# On Linux/Mac terminal:
openssl rand -base64 32

# Or use any random string generator (32+ characters recommended)
```

**Example secure configuration:**

```php
define('DB_PASS', 'X9k#mP2$vL8qR@5n');
define('JWT_SECRET', 'aB3dE5fG7hI9jK0lM2nO4pQ6rS8tU1vW3xY5zA7bC9dE');
define('CORS_ORIGIN', 'https://releye.boestad.com');
```

### Step 4: Verify Backend Deployment

Test each endpoint to ensure the backend is working:

#### Test 1: Health Check

```bash
curl https://releye.boestad.com/api/health
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

#### Test 2: First-Time Setup Check

```bash
curl https://releye.boestad.com/api/auth/first-time
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

`isFirstTime` will be `false` because the default admin user exists.

#### Test 3: Login (Using Default Admin)

```bash
curl -X POST https://releye.boestad.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@releye.local",
    "password": "admin"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "userId": "admin-default",
      "email": "admin@releye.local",
      "name": "Administrator",
      "role": "admin"
    }
  }
}
```

If you get this response, **the backend is working correctly!**

---

## Testing & Verification

### End-to-End Test

1. **Open** https://releye.boestad.com
2. **You should see:**
   - Login screen (if admin exists)
   - OR First-time setup screen (if no admin)

3. **Log in** using default admin:
   - Email: `admin@releye.local`
   - Password: `admin`

4. **You should see:**
   - File Manager screen
   - "Create New Network" button
   - Option to load existing files

5. **Create a test network:**
   - Click "Create New Network"
   - Enter filename: `test-network`
   - Enter password: `test123`
   - Click Create

6. **Add test data:**
   - Add a person (click "Add Person" or double-click canvas)
   - Enter name and details
   - Save

7. **Save the network:**
   - Click "Save" in toolbar
   - File should download

8. **Load the network:**
   - Click "Load Network"
   - Select the downloaded file
   - Enter password: `test123`
   - Network should load with your test person

**If all steps work, deployment is successful! ✅**

### Check Browser Console

Open browser DevTools (F12) and check:

1. **Console tab** - Should have no red errors
2. **Network tab** - API calls to `/api/*` should return 200 status
3. **Application tab** → Local Storage - Should see workspace data

---

## Troubleshooting

### Frontend Issues

#### Issue: Black screen or "Cannot GET /" error

**Cause:** GitHub Pages source is set to "branch" instead of "GitHub Actions"

**Solution:**
1. Go to Settings → Pages
2. Source: Change to **"GitHub Actions"**
3. Re-run the deployment workflow (Actions tab → Re-run jobs)

---

#### Issue: GitHub Actions workflow fails

**Cause:** Build errors or permission issues

**Solution:**
1. Check the Actions tab for error details
2. Test build locally: `npm install && npm run build`
3. Verify GitHub Actions has write permissions (Settings → Actions → General)

---

#### Issue: Site loads but shows 404 for API calls

**Cause:** CORS or API URL configuration issue

**Solution:**
1. Check browser console for CORS errors
2. Verify backend `config.php` has correct `CORS_ORIGIN`
3. Ensure backend is actually deployed and accessible

---

### Backend Issues

#### Issue: "Database connection failed"

**Cause:** Incorrect database credentials in `config.php`

**Solution:**
1. Verify credentials in cPanel → MySQL Databases
2. Update `config.php` with correct values:
   - `DB_USER`
   - `DB_PASS`
   - `DB_NAME`
3. Ensure database user has ALL PRIVILEGES on the database

---

#### Issue: "Endpoint not found" or 404 on API routes

**Cause:** `.htaccess` not working or mod_rewrite disabled

**Solution:**
1. Verify `.htaccess` file exists in `/public_html/api/`
2. Check file contents:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php [QSA,L]
   ```
3. Contact hosting support to verify mod_rewrite is enabled

---

#### Issue: CORS errors in browser console

**Cause:** `CORS_ORIGIN` mismatch in `config.php`

**Solution:**
1. Edit `/public_html/api/config.php`
2. Verify `CORS_ORIGIN` exactly matches frontend URL:
   ```php
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```
3. No trailing slash
4. Must match protocol (http vs https)

---

#### Issue: "Invalid credentials" on login

**Cause:** Password hashing mismatch or user doesn't exist

**Solution:**
1. Verify user exists:
   ```sql
   SELECT email, role FROM users;
   ```
2. Try default admin credentials:
   - Email: `admin@releye.local`
   - Password: `admin`
3. If forgotten, reset password in database (see below)

**Reset default admin password:**
```sql
UPDATE users 
SET password_hash = '$2y$12$LKzV0P.KDH3FjP2YqN5rT.EJvKxkJmPxQ.YqJ7XzQ2H.ZqJ7XzQ2H',
    password_salt = 'default_salt'
WHERE email = 'admin@releye.local';
```
This resets the password to `admin`.

---

#### Issue: JWT token errors or "Unauthorized"

**Cause:** `JWT_SECRET` not set or changed after tokens issued

**Solution:**
1. Verify `JWT_SECRET` is set in `config.php` (not the default placeholder)
2. If you changed the secret, all existing tokens are invalidated
3. Users must log in again to get new tokens

---

### DNS and Domain Issues

#### Issue: Domain doesn't resolve to GitHub Pages

**Cause:** DNS not configured or not propagated

**Solution:**
1. Verify CNAME record exists:
   ```bash
   dig releye.boestad.com
   ```
2. Should show CNAME pointing to `yourusername.github.io`
3. DNS propagation can take 24-48 hours
4. Use https://dnschecker.org to check propagation globally

---

#### Issue: "Not Secure" warning or mixed content errors

**Cause:** HTTPS not enabled or forcing HTTPS not configured

**Solution:**
1. GitHub Pages automatically provides HTTPS
2. In Settings → Pages, check **"Enforce HTTPS"**
3. Wait a few minutes for certificate to provision
4. Verify `CORS_ORIGIN` in backend uses `https://`

---

## API Endpoints Reference

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| GET | `/auth/first-time` | Check if admin exists |
| POST | `/auth/login` | User login |
| GET | `/invites/{token}` | Get invite details |
| POST | `/users` | Create user (first-time setup only) |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Admin Only | Description |
|--------|----------|------------|-------------|
| GET | `/auth/verify` | No | Verify JWT token |
| GET | `/users` | Yes | List all users |
| GET | `/users/{userId}` | Yes | Get user by ID |
| PUT | `/users/{userId}` | Yes | Update user |
| DELETE | `/users/{userId}` | Yes | Delete user |
| GET | `/users/email/{email}` | Yes | Get user by email |
| GET | `/invites` | Yes | List all invites |
| POST | `/invites` | Yes | Create invite |
| DELETE | `/invites/{token}` | Yes | Revoke invite |
| POST | `/invites/cleanup` | Yes | Clean expired invites |

---

## Security Notes

### Change Default Admin

The database includes a default admin account for initial setup:
- **Email:** `admin@releye.local`
- **Password:** `admin`

**⚠️ CRITICAL:** This is insecure! Do one of the following:

**Option 1: Delete and create new admin via first-time setup**
```sql
DELETE FROM users WHERE user_id = 'admin-default';
```
Then visit the app and complete first-time setup.

**Option 2: Change the password immediately**
1. Log in with default credentials
2. Use the app to change password
3. Or update directly in database (must hash properly)

### Protect JWT Secret

The `JWT_SECRET` in `config.php` is used to sign authentication tokens.

- Must be a secure random string (32+ characters)
- Never commit to version control
- If compromised, change immediately (invalidates all tokens)

### File Encryption

Network files are encrypted client-side before storage:
- Password-based encryption using Web Crypto API
- Files are encrypted with AES-GCM
- Password is never sent to backend

---

## Maintenance

### View Recent Activity

```sql
SELECT a.*, u.email 
FROM activity_log a 
LEFT JOIN users u ON a.user_id = u.user_id 
ORDER BY a.created_at DESC 
LIMIT 50;
```

### List All Users

```sql
SELECT user_id, email, name, role, login_count,
       FROM_UNIXTIME(last_login/1000) as last_login_date
FROM users 
ORDER BY created_at DESC;
```

### Clean Up Expired Invites

```bash
curl -X POST https://releye.boestad.com/api/invites/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Backup Database

In phpMyAdmin:
1. Select database `lpmjclyqtt_releye`
2. Click "Export" tab
3. Format: SQL
4. Click "Go"
5. Save the `.sql` file

---

## Quick Reference

### Frontend URLs
- **Production:** https://releye.boestad.com
- **Diagnostics:** https://releye.boestad.com/?diagnostics=true
- **Force Reset:** https://releye.boestad.com/?reset=true

### Backend URLs
- **API Base:** https://releye.boestad.com/api
- **Health Check:** https://releye.boestad.com/api/health
- **First-Time Check:** https://releye.boestad.com/api/auth/first-time

### File Locations
- **Frontend Build Output:** `dist/` (auto-generated, not committed)
- **Backend Files:** `/public_html/api/` on cPanel
- **Database Schema:** `database-setup-mysql.sql`
- **Backend Source:** `php-backend/` directory

### Deployment Commands

```bash
# Build frontend locally
npm install
npm run build

# Preview built frontend
npm run preview

# Deploy frontend (automatic)
git push origin main

# Backend deployment is manual via cPanel File Manager or FTP
```

---

## Support

**For deployment issues:**
1. Check this guide's Troubleshooting section
2. Test the API health endpoint
3. Check browser console for errors
4. Visit diagnostics page: `?diagnostics=true`

**For backend logs:**
- Check cPanel error logs
- Enable PHP error logging in `config.php` (development only)

**For DNS issues:**
- Contact Boestad.com hosting support
- Use DNS checker: https://dnschecker.org

---

**Last Updated:** January 2025  
**Frontend:** React 19 + Vite 6 + TypeScript  
**Backend:** PHP 8 + MySQL  
**Hosting:** GitHub Pages + cPanel
