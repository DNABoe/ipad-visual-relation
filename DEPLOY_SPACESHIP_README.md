# 🚀 Deploy RelEye to Spaceship.com with MySQL

**The easiest and most automated way to deploy RelEye to releye.boestad.com**

---

## ⚡ Quick Start (15 minutes)

### Prerequisites
- ✅ MySQL database on Spaceship.com: `lpmjclyqtt_releye`
- ✅ MySQL user: `lpmjclyqtt_releye_user`
- ✅ Database password
- ✅ cPanel access to Spaceship.com

### One-Command Deployment

**Mac/Linux:**
```bash
chmod +x deploy-to-spaceship-mysql.sh
./deploy-to-spaceship-mysql.sh
```

**Windows:**
```cmd
deploy-to-spaceship-mysql.bat
```

This creates a ready-to-upload deployment package with everything configured!

---

## 📦 What Gets Deployed

```
releye.boestad.com/
├── Frontend (React App)
│   ├── Login/Authentication
│   ├── Network Visualization
│   ├── File Management
│   └── User Settings
│
├── Backend (PHP API)
│   ├── User Authentication
│   ├── Invitation System
│   └── Activity Logging
│
└── Database (MySQL)
    ├── Users Table
    ├── Invitations Table
    └── Activity Log
```

**Data Storage:**
- ✅ User credentials → MySQL database
- ✅ Network files → Browser (encrypted, local)
- ✅ Works from any device/browser

---

## 📋 Step-by-Step Deployment

### Step 1: Run Deployment Script ⚡

Choose your platform:

**Mac/Linux:**
```bash
chmod +x deploy-to-spaceship-mysql.sh
./deploy-to-spaceship-mysql.sh
```

**Windows:**
```cmd
deploy-to-spaceship-mysql.bat
```

**What it does:**
1. ✅ Installs dependencies
2. ✅ Builds production frontend
3. ✅ Packages backend files
4. ✅ Creates .htaccess files
5. ✅ Generates deployment-package.zip

---

### Step 2: Configure Database Settings 🔧

Edit `deployment-package/api/config.php`:

```php
define('DB_PASS', 'YOUR_ACTUAL_MYSQL_PASSWORD');  // ← Change this!
define('JWT_SECRET', 'RANDOM_32_CHARACTER_STRING');  // ← Change this!
```

**Generate secure JWT secret:**
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use: https://www.grc.com/passwords.htm

---

### Step 3: Setup MySQL Database 🗄️

1. **Login to Spaceship cPanel**
2. **Open phpMyAdmin**
3. **Select database:** `lpmjclyqtt_releye`
4. **Click "SQL" tab**
5. **Copy/paste contents from:** `database-setup-mysql.sql`
6. **Click "Go"**

**Expected result:**
```
✓ Table 'users' created
✓ Table 'invitations' created
✓ Table 'activity_log' created
✓ 1 admin user inserted
```

---

### Step 4: Upload to Server 📤

**Choose ONE method:**

#### Method A: cPanel File Manager (Easiest)

1. Login to Spaceship cPanel
2. Open **File Manager**
3. Navigate to `public_html/`
4. **Delete old files** (backup first!)
5. Upload `deployment-package.zip`
6. Right-click → **Extract**
7. Move all files from `deployment-package/` to `public_html/`
8. Delete the empty `deployment-package/` folder

#### Method B: FTP

1. Connect via FTP client (FileZilla, Cyberduck, etc.)
   - Host: `ftp.releye.boestad.com`
   - Username: Your cPanel username
   - Password: Your cPanel password
2. Navigate to `/public_html/`
3. Upload all files from `deployment-package/*`

#### Method C: Direct Folder Upload

1. Open cPanel File Manager
2. Navigate to `public_html/`
3. Upload the entire `deployment-package` folder
4. Select all files inside it
5. Click **Move** and select `public_html/`

---

### Step 5: Verify Deployment ✅

**Test Backend API:**
```
https://releye.boestad.com/api/health
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "database": "mysql"
  }
}
```

**Test Frontend:**
```
https://releye.boestad.com
```

Should show login page.

**Login:**
- Username: `admin`
- Password: `admin`

**⚠️ IMMEDIATELY CHANGE THIS PASSWORD!**

---

## 🗂️ File Structure on Server

After deployment, your `public_html/` should look like:

```
public_html/
├── .htaccess                   ← Routes & security
├── index.html                  ← App entry point
├── favicon.svg
├── assets/
│   ├── index-[hash].js        ← App code
│   ├── index-[hash].css       ← App styles  
│   └── images/
└── api/
    ├── .htaccess              ← API routing
    ├── index.php              ← Main API router
    ├── config.php             ← Database config (SECURE!)
    ├── database.php           ← Database class
    └── helpers.php            ← Helper functions
```

---

## 🔧 Troubleshooting

### ❌ "Database connection failed"

**Fix:**
1. Check `api/config.php` has correct database password
2. Verify database name is `lpmjclyqtt_releye`
3. Verify user is `lpmjclyqtt_releye_user`
4. Test in phpMyAdmin:
   ```sql
   SHOW GRANTS FOR 'lpmjclyqtt_releye_user'@'localhost';
   ```

### ❌ "404 Not Found" on /api/ calls

**Fix:**
1. Verify `.htaccess` files exist in:
   - `public_html/.htaccess`
   - `public_html/api/.htaccess`
2. Check cPanel that `mod_rewrite` is enabled
3. Check file permissions:
   ```
   api/ → 755
   api/*.php → 644
   ```

### ❌ Blank/white page

**Fix:**
1. Check PHP error logs in cPanel
2. Verify PHP version is 7.4+
3. Temporarily enable errors in `api/config.php`:
   ```php
   ini_set('display_errors', 1);
   ```
4. Check required PHP extensions:
   - mysqli ✓
   - json ✓
   - openssl ✓

### ❌ CORS errors in browser

**Fix:**
1. Verify `api/.htaccess` has CORS headers
2. Check `config.php` has correct CORS_ORIGIN:
   ```php
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### ❌ Can't login with admin/admin

**Fix:**
1. Check database has admin user:
   ```sql
   SELECT * FROM users WHERE role = 'admin';
   ```
2. If empty, re-run `database-setup-mysql.sql`
3. Check password_hash column is not empty

---

## 🔒 Security Best Practices

### After First Deployment:

1. ✅ Change admin password immediately
2. ✅ Set `JWT_SECRET` to random string in `config.php`
3. ✅ Disable error display in production:
   ```php
   ini_set('display_errors', 0);
   ```
4. ✅ Keep database password secure
5. ✅ Set up HTTPS (should already be enabled on Spaceship)

### Regular Maintenance:

1. ✅ Backup database weekly (phpMyAdmin → Export)
2. ✅ Backup files monthly (cPanel File Manager → Compress)
3. ✅ Monitor error logs
4. ✅ Review activity logs:
   ```sql
   SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100;
   ```

---

## 🔄 Updating Your Deployment

When you make code changes:

### Quick Update (Automated):

```bash
# Mac/Linux
./deploy-to-spaceship-mysql.sh

# Windows
deploy-to-spaceship-mysql.bat
```

Then upload the new `deployment-package.zip` to cPanel.

### Manual Update:

**Frontend only:**
```bash
npm run build
# Upload dist/* to public_html/
```

**Backend only:**
```bash
# Upload php-backend/* to public_html/api/
# Keep your config.php with real passwords!
```

---

## 📊 Database Management

### Clean old logs (90+ days):
```sql
DELETE FROM activity_log 
WHERE created_at < (UNIX_TIMESTAMP() - (90 * 24 * 60 * 60)) * 1000;
```

### View user stats:
```sql
SELECT email, name, role, login_count, 
       FROM_UNIXTIME(last_login/1000) as last_login_date
FROM users 
ORDER BY last_login DESC;
```

### Check pending invites:
```sql
SELECT email, role, 
       FROM_UNIXTIME(created_at/1000) as created_date,
       CASE WHEN status = 'accepted' THEN 'Used' ELSE 'Pending' END as status
FROM invitations
ORDER BY created_at DESC;
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **DEPLOY_TO_SPACESHIP_MYSQL.md** | Complete deployment guide |
| **DEPLOYMENT_CHECKLIST.md** | Quick reference checklist |
| **database-setup-mysql.sql** | MySQL database schema |
| **deploy-to-spaceship-mysql.sh** | Automated deployment (Mac/Linux) |
| **deploy-to-spaceship-mysql.bat** | Automated deployment (Windows) |

---

## 🎯 Success Criteria

You're successfully deployed when:

- ✅ API health check returns success
- ✅ Frontend loads at https://releye.boestad.com
- ✅ You can login with admin credentials
- ✅ You've changed the admin password
- ✅ You can create and save a network
- ✅ Network persists after browser refresh
- ✅ You can access from different devices

---

## 🆘 Getting Help

1. **Check the troubleshooting section** above
2. **Review error logs** in cPanel
3. **Test each component:**
   - Database: phpMyAdmin connection
   - Backend: `/api/health` endpoint
   - Frontend: Console errors in browser DevTools
4. **Verify file structure** matches the diagram above

---

## ⏱️ Deployment Time

- **Automated script:** 2 minutes
- **Configure database:** 3 minutes
- **Setup MySQL:** 3 minutes
- **Upload files:** 5 minutes
- **Testing:** 2 minutes

**Total: ~15 minutes** from start to finish! ⚡

---

## 🎉 What You Get

After deployment, you have:

- ✅ Full-featured RelEye at https://releye.boestad.com
- ✅ Multi-user authentication system
- ✅ Secure password storage (PBKDF2)
- ✅ User invitation system
- ✅ Activity logging
- ✅ Encrypted network files (browser storage)
- ✅ Access from any device/browser
- ✅ No Spark environment dependencies
- ✅ Fully standalone deployment

---

## 🚀 Quick Commands Reference

```bash
# Deploy (Mac/Linux)
./deploy-to-spaceship-mysql.sh

# Deploy (Windows)
deploy-to-spaceship-mysql.bat

# Generate JWT secret
openssl rand -base64 32

# Build frontend only
npm run build

# Test API locally (if PHP installed)
cd php-backend && php -S localhost:8000
```

---

**Ready to deploy?** Run the deployment script and follow the checklist!

📖 For detailed instructions, see: `DEPLOY_TO_SPACESHIP_MYSQL.md`
