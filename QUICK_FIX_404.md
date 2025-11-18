# Quick Fix: 404 Error on Backend API

## The Issue

You're getting a 404 error from **GitHub Pages** when trying to access the API.

## The Solution

**Don't test the API on GitHub Pages!** Test it on Spaceship.com instead.

---

## Why This Happens

The 404 error you see is from **GitHub Pages**, which says:

> "File not found. The site configured at this address does not contain the requested file."

This is **normal and expected** because:

1. **GitHub Pages** = Static hosting only (HTML, CSS, JS)
   - ❌ No PHP support
   - ❌ No database support
   - ❌ Cannot run backend APIs

2. **Spaceship.com** = Full web hosting (PHP + MySQL)
   - ✅ PHP support
   - ✅ MySQL database
   - ✅ Can run backend APIs

---

## Where to Test

### ❌ WRONG URL (GitHub Pages):
```
https://[username].github.io/releye/api/health
```
**Result:** 404 - File not found

### ✅ CORRECT URL (Spaceship):
```
https://releye.boestad.com/api/health
```
**Result:** JSON response from your API

---

## Step-by-Step Fix

### 1. Make Sure You Uploaded PHP Files to Spaceship

**Using cPanel File Manager:**
1. Log into Spaceship cPanel
2. Open File Manager
3. Navigate to `public_html`
4. Verify you have an `api` folder
5. Inside `api`, you should see:
   - index.php
   - config.php
   - database.php
   - helpers.php
   - .htaccess

**Missing these files?** Upload them from the `php-backend` folder in your project.

### 2. Configure the Database Connection

1. In cPanel File Manager, open `public_html/api/config.php`
2. Update these lines:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'lpmjclyqtt_releye_user');  // Your database username
   define('DB_PASS', 'your-password-here');      // Your database password
   define('DB_NAME', 'lpmjclyqtt_releye');       // Your database name
   define('JWT_SECRET', 'random-secret-here');   // Any random string
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```
3. Save the file

### 3. Test the API

Open your browser and visit:
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
    "version": "1.0",
    "database": "mysql"
  }
}
```

**Still Getting 404?** 
- Files aren't uploaded correctly
- Check `public_html/api/` folder exists
- Check `index.php` is inside the api folder

**Getting 500 Error?**
- Database connection is wrong
- Check credentials in `config.php`
- Check database exists in phpMyAdmin

---

## Understanding the Architecture

```
┌─────────────────────────────────────┐
│  Browser visits:                    │
│  https://releye.boestad.com         │
└────────────┬────────────────────────┘
             │
             ├─── Loads HTML/CSS/JS (Frontend)
             │
             └─── Makes API calls to:
                  https://releye.boestad.com/api/
                              │
                              ▼
         ┌────────────────────────────────┐
         │  Spaceship.com Server          │
         │                                │
         │  public_html/                  │
         │  ├── index.html (Frontend)     │
         │  └── api/ (Backend PHP)        │
         │      └── Connects to MySQL     │
         └────────────────────────────────┘
```

**Key Point:** The backend PHP API **must** run on a server with PHP and MySQL support (Spaceship.com). It **cannot** run on GitHub Pages.

---

## What About GitHub Pages?

You have two options:

### Option 1: Host Everything on Spaceship (Simpler)
- Frontend: `https://releye.boestad.com`
- Backend: `https://releye.boestad.com/api/`
- Everything in one place ✅

### Option 2: Frontend on GitHub, Backend on Spaceship
- Frontend: `https://[username].github.io/releye/`
- Backend: `https://releye.boestad.com/api/`
- Frontend still calls Spaceship API ✅

**Both work!** The backend API is **always** on Spaceship.com.

---

## TL;DR

1. **Backend API location:** `https://releye.boestad.com/api/`
2. **Test URL:** `https://releye.boestad.com/api/health`
3. **Don't test on:** GitHub Pages (will always 404)
4. **Upload PHP files to:** Spaceship cPanel → `public_html/api/`
5. **Configure:** `api/config.php` with your database credentials

---

## Need More Help?

- **Detailed testing guide:** [BACKEND_API_TESTING.md](BACKEND_API_TESTING.md)
- **Full deployment guide:** [SPACESHIP_ONLY_DEPLOYMENT.md](SPACESHIP_ONLY_DEPLOYMENT.md)
- **Architecture explanation:** [WHERE_TO_TEST.md](WHERE_TO_TEST.md)
