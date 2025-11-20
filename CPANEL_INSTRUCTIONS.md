# cPanel Step-by-Step Instructions

## 📁 Part 1: Update Backend Configuration

### Step 1.1: Open config.php in a text editor
1. Navigate to `/workspaces/spark-template/php-backend/config.php`
2. Open in your text editor

### Step 1.2: Update Database Password
Find line 5:
```php
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE');
```

Replace with your actual MySQL password from Spaceship.

### Step 1.3: Generate and Set JWT Secret
Find line 10:
```php
define('JWT_SECRET', 'CHANGE_THIS_TO_A_RANDOM_STRING');
```

Replace with a random 32+ character string. Example:
```php
define('JWT_SECRET', 'x7mK9pLwQ2vN5jR8tY1cZ4aF6bH3sD0e');
```

### Step 1.4: Save config.php

---

## 📤 Part 2: Upload Backend to cPanel

### Step 2.1: Login to Spaceship cPanel
1. Go to Spaceship.com
2. Login to your account
3. Access cPanel for `boestad.com`

### Step 2.2: Open File Manager
1. In cPanel, click **File Manager**
2. Navigate to `public_html/`

### Step 2.3: Create API Directory
1. Click **+ Folder** button
2. Name it: `api`
3. Click **Create New Folder**

### Step 2.4: Upload PHP Files
1. Click on the `api` folder to open it
2. Click **Upload** button
3. Upload these 5 files from your computer:
   ```
   php-backend/.htaccess
   php-backend/index.php
   php-backend/config.php (the one you just edited!)
   php-backend/database.php
   php-backend/helpers.php
   ```

### Step 2.5: Verify Files
In `public_html/api/` you should see:
- ✅ .htaccess
- ✅ index.php
- ✅ config.php
- ✅ database.php
- ✅ helpers.php

---

## 🗄️ Part 3: Setup MySQL Database

### Step 3.1: Access MySQL Databases in cPanel
1. In cPanel home, find **MySQL Databases**
2. Click to open

### Step 3.2: Verify Database Exists
Look for database named: `lpmjclyqtt_releye`

**If it doesn't exist:**
1. Create new database
2. Name it: `lpmjclyqtt_releye`

### Step 3.3: Verify User Exists
Look for user: `lpmjclyqtt_releye_user`

**If it doesn't exist:**
1. Create new user
2. Username: `lpmjclyqtt_releye_user`
3. Generate strong password (save it!)
4. Use this password in `config.php`

### Step 3.4: Assign User to Database
1. Scroll to **Add User To Database**
2. Select user: `lpmjclyqtt_releye_user`
3. Select database: `lpmjclyqtt_releye`
4. Click **Add**
5. Check **ALL PRIVILEGES**
6. Click **Make Changes**

### Step 3.5: Create Tables
1. In cPanel, click **phpMyAdmin**
2. Select database `lpmjclyqtt_releye` from left sidebar
3. Click **SQL** tab at top
4. Copy and paste this SQL:

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

5. Click **Go** button
6. Should see: "3 queries executed successfully"

---

## 🌐 Part 4: Upload Frontend

### Step 4.1: Build Frontend (on your computer)
Open terminal in project folder:
```bash
npm run build
```

Wait for build to complete. You'll see a `dist/` folder created.

### Step 4.2: Upload Frontend Files
1. In cPanel File Manager, go back to `public_html/`
2. **Delete old files** (if any):
   - Delete old `index.html`
   - Delete old `assets/` folder
   - **DO NOT DELETE `api/` folder!**

3. Click **Upload** button
4. Upload ALL files from `dist/` folder:
   - index.html
   - assets/ folder
   - All other files in dist/

### Step 4.3: Verify Frontend Upload
In `public_html/` you should see:
```
public_html/
├── api/              ← Backend (keep this!)
│   ├── .htaccess
│   ├── index.php
│   ├── config.php
│   ├── database.php
│   └── helpers.php
├── assets/           ← Frontend assets
│   ├── index-[hash].js
│   └── index-[hash].css
├── index.html        ← Frontend entry
└── other files...
```

---

## ✅ Part 5: Test Everything

### Step 5.1: Test Backend API
Open in browser:
```
https://releye.boestad.com/api?endpoint=health
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

**If you see this** ✅ - Backend is working!

**If you see error** ❌ - Check:
- Files uploaded to `/api/` folder?
- `config.php` has correct database password?
- Database user has privileges?

### Step 5.2: Test First-Time Setup
Open in browser:
```
https://releye.boestad.com/api?endpoint=auth/first-time
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "isFirstTime": true
  }
}
```

### Step 5.3: Test Frontend
Open in browser:
```
https://releye.boestad.com
```

**Should see:** First-time admin setup screen

**If you see blank page** ❌ - Check browser console for errors

### Step 5.4: Create Admin Account
1. Enter username: `admin`
2. Enter password: `admin123` (or your choice)
3. Click **Create Admin Account**

**Should see:** File Manager screen

### Step 5.5: Verify Authentication
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Click **Local Storage** → `https://releye.boestad.com`
4. Should see:
   - `releye-auth-token` - (long JWT string)
   - `releye-current-user-id` - (user ID)

**If you see these** ✅ - Authentication is working!

### Step 5.6: Test Cross-Browser
1. Open a different browser
2. Go to `https://releye.boestad.com`
3. Login with same credentials
4. Should work!

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to database"
**Fix:**
1. Check `config.php` has correct `DB_PASS`
2. Verify database user has privileges
3. Check database name is `lpmjclyqtt_releye`

### Problem: "404 Not Found" on API
**Fix:**
1. Check files are in `public_html/api/` (not elsewhere)
2. Verify `.htaccess` file exists in `/api/` folder
3. Check file permissions (should be 644)

### Problem: Still getting 401 errors
**Fix:**
1. Clear browser cache completely
2. Check browser DevTools → Application → Clear storage
3. Try again from fresh start

### Problem: Blank page when visiting site
**Fix:**
1. Check browser console for errors
2. Verify `index.html` is in `public_html/` root
3. Verify `assets/` folder uploaded correctly

---

## ✨ Success Checklist

After completing all steps, verify:

- ✅ Backend health endpoint returns JSON
- ✅ Frontend loads without errors
- ✅ Can create admin account
- ✅ Can login
- ✅ Token stored in localStorage
- ✅ Refresh page - stay logged in
- ✅ Can access admin dashboard
- ✅ No 401 errors in Network tab

---

**If all checked** ✅ - **YOU'RE DONE!** 🎉

The authentication should now work properly across browsers and page refreshes!
