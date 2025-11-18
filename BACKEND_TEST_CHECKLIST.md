# Quick Test Checklist - Backend API

Use this checklist to verify your backend is working correctly on Spaceship hosting.

## ✅ Pre-Deployment Checklist

Before uploading files:
- [ ] Database created in phpMyAdmin (`lpmjclyqtt_releye`)
- [ ] Database tables created (run `database-setup-mysql.sql`)
- [ ] `config.php` has correct database credentials
- [ ] `config.php` has strong JWT_SECRET
- [ ] `config.php` CORS_ORIGIN set to `https://releye.boestad.com`

## ✅ File Upload Checklist

Files that MUST be in `public_html/api/`:
- [ ] `index.php` (the new fixed version)
- [ ] `config.php` (with your credentials)
- [ ] `database.php`
- [ ] `helpers.php`
- [ ] `.htaccess`

All files should have 644 permissions.

## ✅ Testing Checklist

### Test 1: Health Check
**URL:** https://releye.boestad.com/api/health

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

**Status:** [ ] Pass [ ] Fail

---

### Test 2: First-Time Setup Check
**URL:** https://releye.boestad.com/api/auth/first-time

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isFirstTime": true
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 3: Frontend Loading
**URL:** https://releye.boestad.com

**Expected:** 
- No "Backend server is not available" error
- Login screen or first-time setup screen appears

**Status:** [ ] Pass [ ] Fail

---

### Test 4: First-Time Setup Flow
**Steps:**
1. Visit https://releye.boestad.com
2. Should see "Create Administrator Account" screen
3. Enter email and password
4. Click "Create Account"

**Expected:**
- Account created successfully
- Redirected to file manager screen

**Status:** [ ] Pass [ ] Fail

---

### Test 5: Login Flow
**Steps:**
1. Visit https://releye.boestad.com
2. Should see login screen
3. Enter admin credentials
4. Click "Login"

**Expected:**
- Login successful
- Redirected to file manager screen

**Status:** [ ] Pass [ ] Fail

---

## 🐛 Common Issues

### Issue: Getting 404 for /api/health
**Fix:**
- Check that `.htaccess` exists in `/api` folder
- Verify mod_rewrite is enabled
- Check file permissions (644)

### Issue: Getting database connection error
**Fix:**
- Verify database credentials in `config.php`
- Check database exists in phpMyAdmin
- Ensure database user has permissions

### Issue: Getting CORS error
**Fix:**
- Check `CORS_ORIGIN` in `config.php` matches your domain
- Clear browser cache
- Try in incognito mode

### Issue: Getting "Invalid token" errors
**Fix:**
- Check `JWT_SECRET` is set in `config.php`
- Make sure it's the same value on all requests
- Try logging out and back in

### Issue: Still seeing "Backend not available"
**Fix:**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache completely
- Check browser console for actual error message
- Verify all PHP files uploaded correctly

---

## 📋 Quick Debug Commands

If you have SSH access to Spaceship, you can test directly:

### Test PHP Syntax
```bash
php -l /home/username/public_html/api/index.php
```

### Test Database Connection
```bash
php -r "require 'database.php'; echo 'Connected: ' . (Database::getInstance() ? 'Yes' : 'No') . PHP_EOL;"
```

### View Error Logs
```bash
tail -f /home/username/logs/error_log
```

---

## 🎯 All Tests Passed?

If all tests pass:
1. ✅ Your backend is working correctly
2. ✅ You can use the application
3. ✅ Time to change the default admin password!
4. ✅ Consider setting up regular database backups in cPanel

---

**Testing Date:** _______________  
**Tested By:** _______________  
**Result:** [ ] All Pass [ ] Some Failures

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
