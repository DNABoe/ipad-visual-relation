# RelEye Final Deployment Guide

## 🎯 Overview

This guide explains the complete deployment architecture and what changes have been made to fix the authentication issues.

## 🔧 What Was Fixed

### Authentication Flow Issues
**Problem:** Backend API was responding (200 OK), but all authenticated endpoints returned 401 "No authentication token provided"

**Root Cause:** 
- Frontend wasn't storing JWT tokens after login
- Frontend wasn't sending Authorization headers with subsequent requests

**Solution Applied:**
1. ✅ Backend now returns JWT token in login response
2. ✅ Frontend stores JWT token in localStorage
3. ✅ Frontend includes `Authorization: Bearer <token>` header in all API calls
4. ✅ Logout properly clears the auth token

## 📋 Backend Changes Made

### 1. PHP Backend (`php-backend/index.php`)
- **Login endpoint** now returns the JWT token in response
- Token is generated with 30-day expiration
- Token format: `Bearer <jwt-token>`

### 2. Frontend (`src/lib/cloudAuthService.ts`)
- Added JWT token storage in localStorage (`releye-auth-token`)
- All API calls now include Authorization header when token exists
- Added `logout()` function to clear token
- Token is automatically included in all authenticated requests

### 3. Database Configuration (`php-backend/config.php`)
**YOU MUST UPDATE THESE VALUES:**
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'lpmjclyqtt_releye_user');
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE');  // ⚠️ UPDATE THIS
define('DB_NAME', 'lpmjclyqtt_releye');
define('JWT_SECRET', 'CHANGE_THIS_TO_A_RANDOM_STRING');  // ⚠️ UPDATE THIS
define('CORS_ORIGIN', 'https://releye.boestad.com');
```

## 🚀 Deployment Steps for Spaceship cPanel

### Step 1: Update Backend Configuration

1. Navigate to your `php-backend` folder in cPanel File Manager
2. Edit `config.php` and update:
   - `DB_PASS`: Your actual MySQL database password
   - `JWT_SECRET`: Generate a random string (e.g., use password generator)

### Step 2: Ensure Database Tables Exist

Your MySQL database (`lpmjclyqtt_releye`) needs these tables:

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    can_investigate TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invitations (
    token VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    status ENUM('pending', 'accepted', 'revoked', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Step 3: Upload Backend Files to cPanel

Upload these files to `public_html/api/` directory:
```
public_html/
└── api/
    ├── .htaccess
    ├── index.php
    ├── config.php
    ├── database.php
    └── helpers.php
```

### Step 4: Verify .htaccess Configuration

Ensure `public_html/api/.htaccess` contains:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?endpoint=$1 [QSA,L]

# Allow CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Allow-Credentials "true"
```

### Step 5: Build and Deploy Frontend

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Upload to cPanel:**
   - Upload contents of `dist/` folder to `public_html/`
   - Ensure `index.html` is in the root

3. **Verify frontend points to correct API:**
   - API URL is hardcoded to: `https://releye.boestad.com/api`
   - This is already configured in the code

### Step 6: Test API Endpoints

Visit these URLs in your browser to test:

1. **Health Check:**
   ```
   https://releye.boestad.com/api?endpoint=health
   ```
   Should return: `{"success":true,"data":{"status":"ok",...}}`

2. **First-Time Setup Check:**
   ```
   https://releye.boestad.com/api?endpoint=auth/first-time
   ```
   Should return: `{"success":true,"data":{"isFirstTime":true}}` (if no admin exists)

### Step 7: Reset Database (Optional - First Time Only)

To start fresh with no users:
```
https://releye.boestad.com/api?endpoint=auth/reset-all
```
(POST request - use Postman or curl)

## 🔐 Security Considerations

1. **JWT_SECRET**: Must be a strong random string (32+ characters)
2. **Database Password**: Use a strong password from Spaceship
3. **HTTPS**: Always use HTTPS in production (already configured)
4. **Token Expiration**: Tokens expire after 30 days
5. **Password Hashing**: Uses bcrypt with cost 12

## 🧪 Testing the Fix

### Test Authentication Flow:

1. **Visit the app:** https://releye.boestad.com
2. **First time setup:** Create admin account
3. **Check localStorage:** 
   - Open DevTools → Application → Local Storage
   - Should see `releye-auth-token` with JWT value
   - Should see `releye-current-user-id` with user ID

4. **Test API calls:**
   - Open DevTools → Network tab
   - Perform actions in the app
   - Check API requests - should include `Authorization: Bearer <token>` header
   - Should receive 200 responses (not 401)

5. **Test logout:**
   - Logout from app
   - Check localStorage - both tokens should be cleared
   - Refresh page - should show login screen

## 🐛 Troubleshooting

### Still getting 401 errors?

1. **Check browser console** for errors
2. **Verify JWT token is stored:**
   ```javascript
   // In browser console:
   localStorage.getItem('releye-auth-token')
   ```
3. **Check API requests have Authorization header** in Network tab
4. **Verify backend config.php has correct credentials**

### Can't connect to database?

1. Check database credentials in `config.php`
2. Verify database exists in cPanel MySQL Databases
3. Verify user has privileges on the database
4. Check cPanel Error Logs for PHP errors

### CORS errors?

1. Verify `.htaccess` in `/api` directory has CORS headers
2. Check `CORS_ORIGIN` in `config.php` matches your domain
3. Ensure API is accessible at `/api` endpoint

## 📊 Current Architecture

```
┌─────────────────────────────────────┐
│   https://releye.boestad.com        │
│   (Frontend - Static Files)          │
│   - Deployed via GitHub Pages        │
│   - CNAME points to dnaboe.github.io │
└──────────────┬──────────────────────┘
               │
               │ API Calls with JWT
               │ Authorization: Bearer <token>
               ↓
┌─────────────────────────────────────┐
│   https://releye.boestad.com/api    │
│   (Backend - PHP API)                 │
│   - Hosted on Spaceship cPanel       │
│   - JWT-based authentication         │
└──────────────┬──────────────────────┘
               │
               │ SQL Queries
               ↓
┌─────────────────────────────────────┐
│   MySQL Database                     │
│   - lpmjclyqtt_releye               │
│   - Stores users, invites, activity  │
│   - Hosted on Spaceship              │
└─────────────────────────────────────┘
```

## ✅ What Should Work Now

- ✅ First-time admin setup
- ✅ User login/logout
- ✅ Persistent sessions across page refreshes
- ✅ Cross-browser/cross-device login (with same credentials)
- ✅ User invitations
- ✅ Admin dashboard access
- ✅ API key storage (for investigation feature)
- ✅ 30-day session expiration

## 📝 Next Steps After Deployment

1. **Create admin account** at https://releye.boestad.com
2. **Test login/logout flow**
3. **Invite test user** and verify invitation works
4. **Test investigation feature** with OpenAI API key
5. **Monitor cPanel error logs** for any issues

## 🆘 Need Help?

If you encounter issues:
1. Check browser DevTools Console for errors
2. Check Network tab for failed API requests
3. Check cPanel Error Logs for PHP errors
4. Run the diagnostics page: https://releye.boestad.com/?diagnostics=true

---

**Last Updated:** Authentication fix implemented
**Status:** Ready for deployment
