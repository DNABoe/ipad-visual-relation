# RelEye Deployment Using Only cPanel (No Command Line Needed!)

**This guide is for deploying RelEye entirely through Spaceship.com's cPanel interface.**

---

## What You Need

- ✅ Spaceship.com hosting account
- ✅ Domain: releye.boestad.com
- ✅ Database: lpmjclyqtt_releye (already created)
- ✅ A computer to build the files locally (one-time step)

---

## Part 1: Build Files on Your Computer (One Time)

Before uploading to Spaceship, you need to build the application files on your local computer.

### Option A: You Have Node.js Installed

1. **Open terminal/command prompt** on your computer
2. **Navigate to your RelEye project folder**:
   ```bash
   cd path/to/your/releye-project
   ```
3. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```
4. **Build the application**:
   ```bash
   npm run build
   ```
5. **You now have a `dist/` folder** with these files:
   - `index.html`
   - `assets/` (folder with .js and .css files)
   - `favicon.svg`

### Option B: You Don't Have Node.js

1. **Download and install Node.js** from https://nodejs.org
2. **Follow Option A** above

### Option C: Get Pre-Built Files

Contact the developer to send you a pre-built `dist.zip` file that you can extract and upload directly.

---

## Part 2: Setup Database in cPanel (5 minutes)

1. **Login to Spaceship cPanel**
   - Go to your Spaceship.com account
   - Open cPanel

2. **Open phpMyAdmin**
   - Find "phpMyAdmin" icon in cPanel
   - Click it

3. **Select Your Database**
   - Click `lpmjclyqtt_releye` in the left sidebar

4. **Run Setup SQL**
   - Click "SQL" tab at the top
   - Open file `database-setup-mysql.sql` from your project
   - Copy all the contents
   - Paste into the SQL query box
   - Click "Go"
   - You should see success message

5. **Verify Tables Created**
   - Look in left sidebar under `lpmjclyqtt_releye`
   - You should see: `users`, `invitations`, `activity_log`

**✅ Database ready!**

---

## Part 3: Upload Backend (PHP) Files (10 minutes)

1. **Open File Manager in cPanel**
   - Find "File Manager" icon
   - Click it
   - Navigate to `public_html`

2. **Create API Folder**
   - Click "New Folder" button
   - Name it: `api`
   - Click "Create"

3. **Enter API Folder**
   - Double-click the `api` folder you just created

4. **Upload PHP Files**
   - Click "Upload" button at the top
   - Select these files from your project's `php-backend/` folder:
     - `index.php`
     - `config.php`
     - `database.php`
     - `auth.php`
     - `users.php`
     - `invitations.php`
     - `health.php`
     - `.htaccess`
   - Wait for upload to complete
   - Click "Back to..." to return to File Manager

5. **Edit Database Configuration**
   - In File Manager, right-click `config.php`
   - Select "Edit"
   - Update these lines:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'lpmjclyqtt_releye_user');
   define('DB_PASS', 'YOUR_DATABASE_PASSWORD');  // ⚠️ Get from cPanel
   define('DB_NAME', 'lpmjclyqtt_releye');
   define('JWT_SECRET', 'change-this-to-random-string-abc123xyz');
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```
   - Click "Save Changes"

**To find your database password:**
- Go back to cPanel home
- Find "MySQL Databases"
- Look for user: `lpmjclyqtt_releye_user`
- You may need to reset password here if you don't have it

**✅ Backend uploaded!**

---

## Part 4: Upload Frontend Files (5 minutes)

1. **Open File Manager**
   - Navigate to `public_html` (root folder)

2. **Upload Frontend Files**
   - Click "Upload" button
   - Upload ALL files from inside your `dist/` folder:
     - `index.html`
     - `favicon.svg`
     - The entire `assets/` folder
   
   **Important:** Upload the files **inside** the dist folder, not the folder itself!

3. **Verify File Structure**
   Your `public_html` should now look like:
   ```
   public_html/
   ├── index.html          ← Frontend
   ├── favicon.svg         ← Frontend
   ├── assets/             ← Frontend folder
   │   ├── index-xxx.js
   │   └── index-xxx.css
   └── api/                ← Backend folder
       ├── index.php
       ├── config.php
       └── ...other PHP files
   ```

**✅ Frontend uploaded!**

---

## Part 5: Test Your Site (2 minutes)

1. **Test Backend API**
   - Open browser
   - Visit: `https://releye.boestad.com/api/health.php`
   - You should see: `{"success":true,"data":{"status":"ok"}}`
   - ❌ If you see an error, check your PHP files and config.php

2. **Test Frontend**
   - Visit: `https://releye.boestad.com`
   - You should see a login screen
   - Try logging in:
     - Username: `admin`
     - Password: `admin123`
   - ✅ If it works, you're done!

3. **Change Admin Password Immediately!**
   - After logging in, go to Settings
   - Change the default password
   - This is critical for security!

---

## Troubleshooting

### "Cannot connect to backend"

**Solution 1:** Check API URL
- Open File Manager
- Navigate to `public_html/assets/`
- Find the `.js` file (e.g., `index-abc123.js`)
- Search for "API_BASE_URL"
- It should point to `/api` or `https://releye.boestad.com/api`

**Solution 2:** Check PHP files uploaded
- Make sure all PHP files are in `public_html/api/`
- Test: `https://releye.boestad.com/api/health.php`

### "Database connection failed"

**Solution:**
- Check `api/config.php` has correct database password
- In cPanel, go to "MySQL Databases"
- Verify user `lpmjclyqtt_releye_user` has "All Privileges" on `lpmjclyqtt_releye`

### "Blank page" or "404 errors"

**Solution:**
- Check that `index.html` is in `public_html` (not in a subfolder)
- Check that `assets/` folder is in `public_html`
- Try clearing browser cache (Ctrl+Shift+Del)

### Need to Update the Site

1. Make changes to code on your computer
2. Run `npm run build` again
3. Delete old files in `public_html`
4. Upload new files from `dist/` folder
5. Keep the `api/` folder (don't delete it unless you're updating backend)

---

## You're Done! 🎉

Your RelEye application is now running on:
- **Frontend:** https://releye.boestad.com
- **Backend API:** https://releye.boestad.com/api
- **Database:** Spaceship MySQL
- **Total Setup Time:** ~20 minutes
- **Monthly Cost:** Just your Spaceship hosting!

---

## Quick Reference: Where Things Live

| What | Where on Spaceship | What It Does |
|------|-------------------|--------------|
| Frontend | `public_html/*.html`, `public_html/assets/` | The React app users see |
| Backend | `public_html/api/*.php` | Handles login, users, data |
| Database | phpMyAdmin → `lpmjclyqtt_releye` | Stores users and data |
| Config | `public_html/api/config.php` | Database credentials |

---

## Security Checklist

Before going live:
- [ ] Changed admin password from `admin123`
- [ ] Updated `JWT_SECRET` in `config.php` to a random string
- [ ] Verified SSL certificate is active (https://)
- [ ] Database password is strong
- [ ] Setup cPanel backups (recommended: daily)

---

## Need Help?

Common issues:
1. **White screen:** Check browser console for errors (F12)
2. **Login fails:** Check database was imported correctly
3. **API errors:** Check PHP error logs in cPanel
4. **Can't upload:** Check file permissions in File Manager (should be 644)
