# Deploy RelEye to Spaceship.com ONLY (No DigitalOcean Needed!)

This guide shows you how to deploy RelEye entirely on Spaceship.com hosting without any additional services.

## Your Complete Setup (All on Spaceship)

- **Domain**: releye.boestad.com
- **Hosting**: Spaceship.com
- **Frontend**: Static React app (in root or `public_html`)
- **Backend**: PHP API (in `/api` folder)
- **Database**: MySQL `lpmjclyqtt_releye`
- **Total Cost**: Just your Spaceship hosting fee!

## Architecture

```
┌──────────────────────────────────────────┐
│ Users Browser                            │
│ https://releye.boestad.com               │
└────────────────┬─────────────────────────┘
                 │
                 ├─── HTML/CSS/JS (Spaceship /public_html)
                 │
                 └─── API Calls → /api/
                      │
        ┌─────────────▼────────────────┐
        │ PHP Backend API              │
        │ (Spaceship /public_html/api) │
        └─────────────┬────────────────┘
                      │
        ┌─────────────▼────────────────┐
        │ MySQL Database               │
        │ (Spaceship cPanel)           │
        │ lpmjclyqtt_releye            │
        └──────────────────────────────┘
```

## Step-by-Step Deployment

### 1. Setup MySQL Database (5 minutes)

1. **Log into Spaceship cPanel**
   - Go to your Spaceship.com control panel
   - Find and click "phpMyAdmin"

2. **Select Your Database**
   - In phpMyAdmin, click on `lpmjclyqtt_releye` in the left sidebar

3. **Import Database Schema**
   - Click the "SQL" tab at the top
   - Copy the contents from `database-setup-mysql.sql`
   - Paste into the SQL query box
   - Click "Go" button

4. **Verify Setup**
   - You should see tables: `users`, `invitations`, `activity_log`
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

**✅ Database is now ready!**

---

### 2. Upload Backend PHP Files (10 minutes)

1. **Connect via FTP or File Manager**
   - Use Spaceship's File Manager in cPanel, or
   - Use an FTP client (FileZilla, etc.)

2. **Navigate to your website root**
   - Usually `public_html` or `www`

3. **Create API directory**
   - Create folder: `public_html/api`

4. **Upload PHP files**
   - Upload all PHP files from the `php-backend` folder to `public_html/api/`
   - Should include:
     - `index.php`
     - `config.php`
     - `database.php`
     - `.htaccess`

5. **Configure database connection**
   - Edit `public_html/api/config.php`
   - Update with your database credentials:
   ```php
   <?php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'lpmjclyqtt_releye_user');
   define('DB_PASS', 'YOUR_DATABASE_PASSWORD');
   define('DB_NAME', 'lpmjclyqtt_releye');
   define('JWT_SECRET', 'YOUR_RANDOM_SECRET_HERE');
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ?>
   ```

**✅ Backend API is ready!**

---

### 3. Build & Upload Frontend Files (5 minutes)

1. **Build the frontend ON YOUR LOCAL COMPUTER**
   - Open terminal/command prompt on your computer (not on Spaceship!)
   - Navigate to your RelEye project folder
   - Run:
   ```bash
   npm run build
   ```
   - This creates a `dist/` folder with all the built files

2. **Upload the built files to Spaceship**
   - Using File Manager or FTP, upload the **contents** of the `dist/` folder to `public_html/`
   - Important: Upload the files **inside** dist/, not the dist folder itself
   - Files should include:
     - `index.html`
     - `assets/` folder (with all JS/CSS files)
     - `favicon.svg`

3. **Verify file structure**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-xxx.js
   │   └── index-xxx.css
   ├── favicon.svg
   └── api/
       ├── index.php
       ├── config.php
       ├── database.php
       └── .htaccess
   ```

**✅ Frontend is deployed!**

---

### 4. Test Your Deployment

⚠️ **IMPORTANT: Test on Spaceship.com, NOT GitHub Pages!**

The backend API **ONLY** works on `https://releye.boestad.com` (your Spaceship server with PHP).
It will **NOT** work on GitHub Pages or other static hosting - you'll get 404 errors!

1. **Test Backend API**
   - Visit: `https://releye.boestad.com/api/health`
   - Should return: `{"success":true,"data":{"status":"ok","timestamp":...}}`
   - ❌ Don't test on: GitHub Pages or localhost - these won't work!

2. **Test First-Time Setup**
   - Visit: `https://releye.boestad.com/api/auth/first-time`
   - Should return: `{"success":true,"data":{"isFirstTime":true}}`

3. **Test Frontend**
   - Visit: `https://releye.boestad.com`
   - Should see login screen
   - Try logging in with `admin` / `admin123`

**Troubleshooting?** See [BACKEND_API_TESTING.md](BACKEND_API_TESTING.md) for detailed testing guide.

---

## File Structure on Spaceship

```
public_html/
├── index.html                  # Your React app entry point
├── assets/                     # Built JS/CSS files
├── favicon.svg
├── .htaccess                   # Frontend routing rules
└── api/                        # PHP Backend
    ├── index.php               # Main API router
    ├── config.php              # Database config
    ├── database.php            # Database helper
    ├── auth.php                # Auth endpoints
    ├── users.php               # User management
    ├── invitations.php         # Invite system
    ├── health.php              # Health check
    └── .htaccess               # API routing rules
```

---

## Advantages of This Setup

✅ **No Extra Costs** - Everything runs on Spaceship
✅ **Simpler Management** - All in one place
✅ **Better Performance** - Database and API on same server
✅ **Easier Backups** - Everything in one cPanel
✅ **No Server Management** - Spaceship handles it
✅ **SSL Included** - Spaceship provides SSL certificates

---

## Troubleshooting

### "Backend not available"

1. Check API URL in `src/lib/cloudAPI.ts`:
   ```typescript
   const API_BASE_URL = window.location.origin + '/api'
   ```

2. Test API directly:
   ```
   https://releye.boestad.com/api/health.php
   ```

3. Check PHP error logs in cPanel

### "Database connection failed"

1. Verify credentials in `api/config.php`
2. Check database exists in phpMyAdmin
3. Ensure database user has permissions

### "404 Not Found" for API calls

1. Check `.htaccess` file exists in `api/` folder
2. Verify mod_rewrite is enabled (usually is on Spaceship)
3. Check file permissions (644 for PHP files)

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET in config.php
- [ ] Database password is secure
- [ ] .htaccess prevents directory listing
- [ ] SSL certificate is active
- [ ] Regular database backups via cPanel

---

## Cost Comparison

### DigitalOcean Setup:
- Spaceship hosting: $10-20/year
- DigitalOcean droplet: $60/year
- **Total: $70-80/year**

### Spaceship Only Setup:
- Spaceship hosting: $10-20/year
- **Total: $10-20/year**

**You save $60/year!**

---

## Next Steps

1. **On your local computer:**
   - Run `npm run build` to create the `dist/` folder
   
2. **On Spaceship cPanel:**
   - Setup MySQL database (Step 1)
   - Upload PHP backend files to `/api` (Step 2)
   - Upload built frontend files from `dist/` to root (Step 3)
   
3. **Test & Secure:**
   - Visit https://releye.boestad.com
   - Login with admin/admin123
   - **Immediately change the admin password!**

## Important Notes

- ⚠️ **You CANNOT run `npm run build` on Spaceship** - it must be done on your local computer
- 💾 After uploading, keep your local project folder as backup
- 🔄 To update: rebuild locally, then re-upload the `dist/` contents
