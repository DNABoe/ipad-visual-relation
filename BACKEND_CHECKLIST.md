# Backend Setup Checklist

## ⚡ Quick Action Items

### 1. Update Backend Configuration File
**File:** `php-backend/config.php`

**Required Changes:**
```php
// Line 5: Set your actual database password
define('DB_PASS', 'YOUR_ACTUAL_PASSWORD_HERE');

// Line 10: Set a random secret (use a password generator)
define('JWT_SECRET', 'PUT_RANDOM_32_CHARACTER_STRING_HERE');
```

**How to generate JWT_SECRET:**
- Use any password generator to create a 32+ character random string
- Example: `k9mL2pQwX5vR8nY4jT7cZ1aF6bH3sD0e`

---

### 2. Upload Files to cPanel

**Upload Location:** `public_html/api/`

**Files to Upload:**
```
✅ php-backend/.htaccess      → public_html/api/.htaccess
✅ php-backend/index.php       → public_html/api/index.php
✅ php-backend/config.php      → public_html/api/config.php
✅ php-backend/database.php    → public_html/api/database.php
✅ php-backend/helpers.php     → public_html/api/helpers.php
```

---

### 3. Verify Database Setup

**Database Name:** `lpmjclyqtt_releye`
**Database User:** `lpmjclyqtt_releye_user`

**Check in cPanel MySQL:**
1. ✅ Database exists
2. ✅ User has ALL PRIVILEGES on the database
3. ✅ Tables created (users, invitations, activity_log)

**Run this SQL if tables don't exist:**
```sql
-- See database-setup-mysql.sql file for complete SQL
```

---

### 4. Test Backend API

**Test URLs (open in browser):**

1. Health Check:
   ```
   https://releye.boestad.com/api?endpoint=health
   ```
   Expected: `{"success":true,"data":{"status":"ok"}}`

2. First-Time Check:
   ```
   https://releye.boestad.com/api?endpoint=auth/first-time
   ```
   Expected: `{"success":true,"data":{"isFirstTime":true}}`

---

### 5. Build and Deploy Frontend

**Command:**
```bash
npm run build
```

**Upload to cPanel:**
- Upload contents of `dist/` folder to `public_html/`
- Ensure `index.html` is in root

---

## 🔍 What Changed in the Code

### Backend Changes:
1. **`php-backend/index.php`** - Login endpoint now returns JWT token
2. All other PHP files unchanged (already correct)

### Frontend Changes:
1. **`src/lib/cloudAuthService.ts`** - Now stores and sends JWT tokens
2. **`src/lib/userRegistry.ts`** - Clears token on logout

---

## ✅ Quick Verification

After deployment, check:

1. ✅ Visit https://releye.boestad.com
2. ✅ See first-time admin setup screen
3. ✅ Create admin account
4. ✅ Login successful
5. ✅ Open DevTools → Application → Local Storage
6. ✅ See `releye-auth-token` stored
7. ✅ Refresh page - stay logged in
8. ✅ No 401 errors in Network tab

---

## 🆘 If Still Having Issues

**Check these in order:**

1. **Backend config.php:**
   - Database password correct?
   - JWT secret set?

2. **cPanel File Manager:**
   - Files uploaded to `/api/` folder?
   - `.htaccess` file exists?

3. **MySQL Database:**
   - Database exists?
   - User has privileges?
   - Tables created?

4. **Test API directly:**
   - Visit health endpoint in browser
   - Should see JSON response

5. **Browser DevTools:**
   - Console errors?
   - Network tab shows 401?
   - localStorage has token?

---

## 📞 Current Status

**What works:**
- ✅ Backend API responds (200 OK)
- ✅ CORS configured correctly
- ✅ Database connection works

**What was broken:**
- ❌ JWT tokens not being stored
- ❌ Authorization headers not sent

**What's fixed:**
- ✅ Tokens now stored in localStorage
- ✅ All API calls include Authorization header
- ✅ Login returns token in response

---

**YOU ONLY NEED TO:**
1. Update `config.php` with correct DB_PASS and JWT_SECRET
2. Upload PHP files to cPanel
3. Upload frontend build to cPanel
4. Test!
