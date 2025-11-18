# Complete Spaceship-Only Deployment Guide

## Answer: NO, You Don't Need DigitalOcean!

Your Spaceship.com hosting includes everything you need:
- ✅ Web hosting (for frontend)
- ✅ PHP support (for backend API)
- ✅ MySQL database (for user data)
- ✅ SSL certificate (for HTTPS)

**No additional services required!**

---

## Quick Deployment Steps

### 1. Prepare Database (5 minutes)

1. Log into **Spaceship cPanel** → **phpMyAdmin**
2. Select database `lpmjclyqtt_releye`
3. Click **SQL** tab
4. Copy and paste contents of `database-setup-mysql.sql`
5. Click **Go**

**✅ Database ready with default admin: `admin` / `admin123`**

---

### 2. Upload Backend (10 minutes)

**Via cPanel File Manager:**

1. Go to **cPanel** → **File Manager**
2. Navigate to `public_html` (or your website root)
3. Create new folder: `api`
4. Upload all files from `php-backend/` folder to `public_html/api/`:
   - `index.php`
   - `config.php`
   - `database.php`
   - `helpers.php`
   - `.htaccess`

5. **Edit `public_html/api/config.php`:**
   - Change `DB_PASS` to your actual database password
   - Change `JWT_SECRET` to a random string (at least 32 characters)
   
   Example:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'lpmjclyqtt_releye_user');
   define('DB_PASS', 'your_actual_password_here');
   define('DB_NAME', 'lpmjclyqtt_releye');
   define('JWT_SECRET', 'your_random_secret_min_32_chars_here');
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```

6. **Test API:**
   - Visit: `https://releye.boestad.com/api/health`
   - Should see: `{"success":true,"data":{"status":"ok",...}}`

**✅ Backend API is running!**

---

### 3. Build & Upload Frontend (10 minutes)

**On your local machine:**

1. Build the frontend:
   ```bash
   npm run build
   ```

2. **Upload to Spaceship:**
   - Go to **cPanel** → **File Manager**
   - Navigate to `public_html`
   - Upload ALL files from `dist/` folder
   - Should include:
     - `index.html`
     - `assets/` folder
     - `favicon.svg`

3. **Create `.htaccess` for React routing** (in `public_html`):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_URI} !^/api/
     RewriteRule . /index.html [L]
   </IfModule>
   ```

**✅ Frontend is deployed!**

---

### 4. Final File Structure on Spaceship

```
public_html/
├── index.html              # React app entry
├── assets/                 # Built JS/CSS
│   ├── index-xxx.js
│   └── index-xxx.css
├── favicon.svg
├── .htaccess              # Frontend routing
└── api/                   # PHP Backend
    ├── index.php          # API router
    ├── config.php         # Configuration
    ├── database.php       # Database helper
    ├── helpers.php        # Utility functions
    └── .htaccess         # API routing
```

---

## Test Your Deployment

1. **Test Backend:**
   ```
   https://releye.boestad.com/api/health
   ```
   Should return JSON with `"status":"ok"`

2. **Test Frontend:**
   ```
   https://releye.boestad.com
   ```
   Should show login screen

3. **First Login:**
   - Username: `admin`
   - Password: `admin123`
   - **Immediately change this password!**

---

## Cost Comparison

### Old Way (with DigitalOcean):
- Spaceship hosting: $10-20/year
- DigitalOcean: $60/year
- **Total: $70-80/year** 💸

### New Way (Spaceship only):
- Spaceship hosting: $10-20/year
- **Total: $10-20/year** ✅

**You save $60/year!**

---

## Advantages of PHP Backend

✅ **No Extra Costs** - Uses existing Spaceship hosting
✅ **No Server Management** - Spaceship handles updates
✅ **Better Performance** - Database and API on same server
✅ **Simpler Deployment** - Just upload files
✅ **Built-in Security** - Spaceship manages PHP security
✅ **Automatic Backups** - cPanel includes backup tools
✅ **Easy Monitoring** - Check PHP error logs in cPanel

---

## Troubleshooting

### "Backend not available" Error

**Check API Response:**
```
https://releye.boestad.com/api/health
```

If 404:
- Verify `api/` folder exists
- Check `.htaccess` file in `api/` folder
- Ensure mod_rewrite is enabled

If 500:
- Check PHP error logs in cPanel
- Verify database credentials in `config.php`
- Test database connection in phpMyAdmin

### Database Connection Failed

1. **Verify credentials:**
   - Open `api/config.php`
   - Check `DB_USER`, `DB_PASS`, `DB_NAME` match your database

2. **Test in phpMyAdmin:**
   - Can you access the database?
   - Do tables exist? (`users`, `invitations`, `activity_log`)

3. **Check user permissions:**
   - In cPanel → MySQL Databases
   - Ensure user has ALL PRIVILEGES on database

### Invitation Links Don't Work

1. **Check CORS_ORIGIN in config.php:**
   ```php
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```

2. **Verify invitations table:**
   - Open phpMyAdmin
   - Check `invitations` table exists
   - Look for your invitation record

3. **Check browser console:**
   - Open DevTools → Console
   - Look for CORS or network errors

---

## Security Checklist

After deployment:

- [ ] Changed default admin password (`admin123`)
- [ ] Set strong `JWT_SECRET` in `config.php` (min 32 random characters)
- [ ] Verified database password is strong
- [ ] `.htaccess` prevents directory listing
- [ ] SSL certificate is active (HTTPS working)
- [ ] Test from different browser/computer
- [ ] Regular database backups via cPanel

---

## Updating the Application

### Update Frontend:
```bash
npm run build
# Upload new files from dist/ to public_html/
```

### Update Backend:
- Edit PHP files locally
- Upload via cPanel File Manager
- Changes take effect immediately (no restart needed!)

### Database Changes:
- Run SQL commands in phpMyAdmin
- Always backup first!

---

## Monitoring & Maintenance

### Check PHP Error Logs:
- cPanel → **Errors** → View error logs
- Look for PHP warnings or database errors

### Database Backup:
- cPanel → **phpMyAdmin**
- Select database → **Export** → Download .sql file
- **Do this weekly!**

### Monitor Disk Usage:
- cPanel → **Disk Usage**
- Database grows with users and activity logs

---

## Migration from Old Setup

If you have a DigitalOcean backend running:

1. **Export data from old database:**
   ```bash
   mysqldump -h your-droplet-ip -u user -p releye > backup.sql
   ```

2. **Import to Spaceship:**
   - phpMyAdmin → Import → Select backup.sql

3. **Update frontend:**
   - API automatically points to `/api` (same origin)
   - Rebuild and deploy

4. **Cancel DigitalOcean:**
   - Destroy droplet
   - Save $5/month!

---

## Need Help?

Common issues and solutions:

| Problem | Solution |
|---------|----------|
| API returns 404 | Check `.htaccess` in `api/` folder |
| Database connection failed | Verify credentials in `config.php` |
| CORS errors | Check `CORS_ORIGIN` in `config.php` |
| Can't login | Reset password in phpMyAdmin |
| Blank page | Check browser console for errors |

For advanced debugging:
- Enable error display in `config.php`: `ini_set('display_errors', 1);`
- Check PHP version (should be 7.4+)
- Verify mod_rewrite is enabled

---

## Why This Works Better

**DigitalOcean Setup:**
- Requires Linux knowledge
- Manual security updates
- SSH access management
- PM2 process monitoring
- Nginx configuration
- SSL certificate renewal
- Monthly costs

**Spaceship PHP Setup:**
- Upload files via File Manager
- Automatic security updates
- No SSH needed
- No process management
- No web server config
- Automatic SSL renewal
- No extra cost

**The PHP backend does the same job with less complexity!**

---

## Next Steps

1. ✅ Deploy using this guide
2. ✅ Test at https://releye.boestad.com
3. ✅ Change default admin password
4. ✅ Create backups
5. ✅ (Optional) Cancel DigitalOcean if you have it

You're ready to run RelEye entirely on Spaceship! 🚀
