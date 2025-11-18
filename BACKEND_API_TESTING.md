# Backend API Testing Guide

## ⚠️ Important: Where to Test

The backend API **ONLY works on Spaceship.com** - it does NOT work on GitHub Pages!

### Why the 404 Error?

The screenshot shows a GitHub Pages 404 error. This happens because:

1. **GitHub Pages** only serves static files (HTML, CSS, JS)
2. **Your PHP backend API** runs on Spaceship.com (with PHP and MySQL)
3. These are **two different servers**!

## Correct Testing URLs

### ❌ WRONG - This will give 404:
```
https://yourusername.github.io/releye/api/health
```
This is GitHub Pages - no PHP support!

### ✅ CORRECT - Test on Spaceship:
```
https://releye.boestad.com/api/health
```
This is your Spaceship.com server with PHP!

---

## Step-by-Step: How to Test Your Backend

### Option 1: Test in Browser

1. **Make sure you've uploaded the PHP files to Spaceship**
   - Files should be in: `public_html/api/`

2. **Open your browser and visit:**
   ```
   https://releye.boestad.com/api/health
   ```

3. **Expected Response:**
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

### Option 2: Test with curl (Command Line)

```bash
curl https://releye.boestad.com/api/health
```

### Option 3: Test First-Time Setup Endpoint

```bash
curl https://releye.boestad.com/api/auth/check-first-time
```

Expected response:
```json
{
  "success": true,
  "data": {
    "isFirstTime": true
  }
}
```

---

## Common Issues & Solutions

### 1. "404 Not Found" on Spaceship

**Problem:** API files not uploaded correctly

**Solution:**
- Use Spaceship File Manager or FTP
- Verify files are in `public_html/api/`
- Check that `index.php` exists in the api folder

**Expected file structure:**
```
public_html/
└── api/
    ├── index.php       ✓ Required
    ├── config.php      ✓ Required
    ├── database.php    ✓ Required
    ├── helpers.php     ✓ Required
    └── .htaccess       ✓ Required
```

### 2. "Internal Server Error" (500)

**Problem:** PHP configuration or database connection issue

**Solution:**
1. Check `config.php` has correct database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'lpmjclyqtt_releye_user');
   define('DB_PASS', 'YOUR_PASSWORD_HERE');
   define('DB_NAME', 'lpmjclyqtt_releye');
   ```

2. Check PHP error log in cPanel:
   - cPanel → Metrics → Errors
   - Look for recent PHP errors

### 3. "Database Connection Failed"

**Problem:** MySQL credentials are wrong or database doesn't exist

**Solution:**
1. Go to cPanel → phpMyAdmin
2. Verify database `lpmjclyqtt_releye` exists
3. Verify user has access to this database
4. Check credentials in `config.php` match cPanel

### 4. CORS Errors in Browser Console

**Problem:** Frontend can't connect to backend

**Solution:**
Update `config.php`:
```php
define('CORS_ORIGIN', 'https://releye.boestad.com');
```

Make sure this matches your actual domain!

---

## Testing Checklist

Use this checklist to verify your backend is working:

### Database Setup
- [ ] Database `lpmjclyqtt_releye` exists in phpMyAdmin
- [ ] Tables created: `users`, `invitations`, `activity_log`
- [ ] Database user has permissions

### File Upload
- [ ] All PHP files uploaded to `public_html/api/`
- [ ] `.htaccess` file uploaded (might be hidden!)
- [ ] File permissions are correct (644 for PHP files)

### Configuration
- [ ] `config.php` has correct database credentials
- [ ] `DB_HOST` is set to `localhost`
- [ ] `CORS_ORIGIN` matches your domain
- [ ] `JWT_SECRET` is set to a random string

### API Endpoints Working
- [ ] `/api/health` returns JSON response
- [ ] `/api/auth/check-first-time` returns `isFirstTime: true`
- [ ] No CORS errors in browser console

---

## Testing Individual Endpoints

### 1. Health Check
```bash
curl https://releye.boestad.com/api/health
```

### 2. Check First-Time Setup
```bash
curl https://releye.boestad.com/api/auth/check-first-time
```

### 3. Register Admin (First Time Only)
```bash
curl -X POST https://releye.boestad.com/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "Administrator",
    "password": "your-secure-password"
  }'
```

### 4. Login
```bash
curl -X POST https://releye.boestad.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password"
  }'
```

---

## Quick Diagnostic Script

Save this as `test-api.html` and upload it to your Spaceship `public_html` folder:

```html
<!DOCTYPE html>
<html>
<head>
    <title>RelEye API Test</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
        .success { background: #d4edda; border-color: #28a745; }
        .error { background: #f8d7da; border-color: #dc3545; }
        button { padding: 10px 20px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>RelEye Backend API Test</h1>
    <button onclick="testAPI()">Test All Endpoints</button>
    <div id="results"></div>

    <script>
        async function testAPI() {
            const results = document.getElementById('results');
            results.innerHTML = '<p>Testing...</p>';
            
            const tests = [
                {
                    name: 'Health Check',
                    url: '/api/health',
                    method: 'GET'
                },
                {
                    name: 'Check First-Time Setup',
                    url: '/api/auth/check-first-time',
                    method: 'GET'
                }
            ];
            
            let html = '';
            
            for (const test of tests) {
                try {
                    const response = await fetch(test.url, { method: test.method });
                    const data = await response.json();
                    
                    if (response.ok) {
                        html += `<div class="test success">
                            <strong>✓ ${test.name}</strong><br>
                            Status: ${response.status}<br>
                            Response: <pre>${JSON.stringify(data, null, 2)}</pre>
                        </div>`;
                    } else {
                        html += `<div class="test error">
                            <strong>✗ ${test.name}</strong><br>
                            Status: ${response.status}<br>
                            Error: <pre>${JSON.stringify(data, null, 2)}</pre>
                        </div>`;
                    }
                } catch (error) {
                    html += `<div class="test error">
                        <strong>✗ ${test.name}</strong><br>
                        Error: ${error.message}
                    </div>`;
                }
            }
            
            results.innerHTML = html;
        }
    </script>
</body>
</html>
```

Upload this file and visit: `https://releye.boestad.com/test-api.html`

---

## Still Having Issues?

### Check PHP Error Logs

1. Log into Spaceship cPanel
2. Go to **Metrics** → **Errors**
3. Look for recent errors from `/api/` folder
4. Common errors:
   - "Fatal error" = PHP syntax error
   - "Connection refused" = Database issue
   - "Permission denied" = File permissions issue

### Verify PHP Version

Your API requires **PHP 7.4 or higher**

1. cPanel → **Select PHP Version**
2. Make sure PHP 7.4+ is selected
3. Enable required extensions:
   - mysqli
   - json
   - openssl

### Contact Support

If still stuck, contact Spaceship support with:
- Your domain: releye.boestad.com
- The specific error message
- What you're trying to access (e.g., `/api/health`)

---

## Summary

✅ **DO test here:** `https://releye.boestad.com/api/health`
❌ **DON'T test here:** GitHub Pages (will always 404)

The backend API runs on **Spaceship.com only** - not on GitHub Pages!
