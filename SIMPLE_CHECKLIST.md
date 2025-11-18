# ✅ Simple Deploy Checklist (For Non-Developers)

**Time needed:** 20-30 minutes  
**Skills needed:** None! Just follow the steps  
**Cost:** Just your Spaceship hosting (no extra fees)

---

## Before You Start

### ✅ You Need:
- [ ] Spaceship.com hosting account with cPanel access
- [ ] Domain: releye.boestad.com (already setup)
- [ ] A computer (Windows, Mac, or Linux)
- [ ] This project downloaded to your computer

### ✅ You DON'T Need:
- ❌ Command line experience
- ❌ Programming knowledge
- ❌ DigitalOcean account
- ❌ Any paid services

---

## Step 1: Prepare Files on Your Computer (5 min)

### Do you have Node.js installed?

**To check:**
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Type: `node --version`
3. Press Enter

**If you see a version number (like v20.0.0):**
- ✅ You have it! Skip to "Build the files"

**If you see "command not found" or an error:**
- 📥 Download Node.js from: https://nodejs.org
- 📦 Install it (just click Next, Next, Finish)
- 🔄 Close and reopen your terminal
- ✅ Try `node --version` again

### Build the files

1. **Open terminal/command prompt**

2. **Go to your project folder:**
   ```bash
   cd path/to/releye-project
   ```
   (Replace `path/to/releye-project` with actual path)

3. **Install required packages** (first time only):
   ```bash
   npm install
   ```
   (This takes 2-3 minutes, wait for it to finish)

4. **Build the website files:**
   ```bash
   npm run build
   ```
   (This takes 30-60 seconds)

5. **Success! You now have a `dist` folder** with these files:
   - index.html
   - assets/ (folder)
   - favicon.svg

---

## Step 2: Setup Database (5 min)

1. **Login to Spaceship cPanel**
   - Go to: https://spaceship.com (or your hosting control panel)
   - Enter your username and password

2. **Find phpMyAdmin**
   - Look for an icon/link called "phpMyAdmin"
   - Click it (opens in new tab)

3. **Select your database**
   - On the left side, click: `lpmjclyqtt_releye`

4. **Click the SQL tab**
   - At the top of the page, click "SQL"

5. **Run the setup SQL**
   - Open file `database-setup-mysql.sql` from your project
   - Select all text (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)
   - Paste into the big text box in phpMyAdmin
   - Click "Go" button at bottom right
   - Wait for "Success" message

6. **Verify it worked**
   - On left side, under `lpmjclyqtt_releye`, you should see:
     - users
     - invitations
     - activity_log

✅ **Database is ready!**

---

## Step 3: Upload Backend Files (10 min)

1. **Open File Manager in cPanel**
   - Go back to cPanel main page
   - Click "File Manager" icon

2. **Go to public_html**
   - Double-click `public_html` folder

3. **Create api folder**
   - Click "+ Folder" button (or "New Folder")
   - Type: `api`
   - Click "Create New Folder"

4. **Enter the api folder**
   - Double-click the `api` folder you just created

5. **Upload PHP files**
   - Click "Upload" button at top
   - Click "Select File" button
   - In your project, go to `php-backend` folder
   - Select ALL .php files and .htaccess file
   - Upload them all
   - Wait for "Complete" message

6. **Go back to api folder**
   - Click "Back to /public_html/api/..."

7. **Edit config.php**
   - Right-click on `config.php`
   - Select "Edit"
   - Click "Edit" again in the popup
   
8. **Update these lines:**
   ```php
   define('DB_PASS', 'YOUR_DATABASE_PASSWORD');
   ```
   Replace `YOUR_DATABASE_PASSWORD` with your actual password
   
   ```php
   define('JWT_SECRET', 'abc123xyz789random');
   ```
   Change to ANY random text (letters and numbers)
   
9. **Save the file**
   - Click "Save Changes" at top right

### 📝 Where to find database password?
- In cPanel, go to "MySQL Databases"
- Find user: `lpmjclyqtt_releye_user`
- If you don't know password, click "Change Password"
- Set a new password and remember it
- Use that password in config.php

✅ **Backend is uploaded!**

---

## Step 4: Upload Website Files (5 min)

1. **In File Manager, go back to public_html**
   - Click the "Up One Level" button
   - Or click "public_html" in the path at top

2. **Delete old index.html (if it exists)**
   - If you see a file called `index.html`, select it
   - Click "Delete"
   - Confirm deletion

3. **Upload website files**
   - Click "Upload" button
   - On your computer, go to the `dist` folder (the one you created in Step 1)
   - Select EVERYTHING inside the `dist` folder:
     - index.html
     - favicon.svg
     - assets folder
   - Drag and drop OR click "Select File"
   - Wait for upload to complete

4. **Check your files**
   - Back in File Manager, you should see:
     - index.html (in public_html)
     - assets/ (folder in public_html)
     - favicon.svg (in public_html)
     - api/ (folder in public_html)

✅ **Website is uploaded!**

---

## Step 5: Test Everything (2 min)

### Test 1: Backend API

1. Open web browser
2. Go to: `https://releye.boestad.com/api/health.php`
3. You should see: `{"success":true,"data":{"status":"ok"}}`

**❌ If you see an error:**
- Check that PHP files are in the `api` folder
- Check that `config.php` has correct database password
- Check cPanel PHP Error Logs

### Test 2: Frontend Website

1. Go to: `https://releye.boestad.com`
2. You should see a login screen

### Test 3: Login

1. Try logging in:
   - **Username:** `admin`
   - **Password:** `admin123`
2. Click "Login"
3. You should see the main application!

✅ **Everything works!**

---

## Step 6: Secure Your Site (IMPORTANT!)

### ⚠️ MUST DO IMMEDIATELY:

1. **Change admin password**
   - Log into RelEye
   - Go to Settings (gear icon)
   - Change password from `admin123` to something strong
   - Use a password manager or write it down safely

2. **Check SSL certificate**
   - Your URL should show `https://` (with padlock)
   - If not, enable SSL in cPanel:
     - Find "SSL/TLS Status"
     - Enable for releye.boestad.com

3. **Setup backups**
   - In cPanel, find "Backup" or "Backup Wizard"
   - Enable automatic daily backups
   - This protects your data

---

## 🎉 You're Done!

Your RelEye application is now live at:
**https://releye.boestad.com**

### What you accomplished:
✅ Built a React application  
✅ Setup a MySQL database  
✅ Deployed backend API  
✅ Uploaded frontend website  
✅ Secured with HTTPS  
✅ Ready for production use!

### Total cost: Just your Spaceship hosting fee!

---

## 🆘 Help! Something Went Wrong

### Problem: "Cannot connect to backend"
**Fix:**
1. Test: https://releye.boestad.com/api/health.php
2. If that's broken, check Step 3 again
3. Verify `config.php` has correct database password

### Problem: "Blank white page"
**Fix:**
1. Check that `index.html` is in `public_html` (not in a subfolder)
2. Check that `assets` folder is in `public_html`
3. Clear your browser cache (Ctrl+Shift+Delete)

### Problem: "Login doesn't work"
**Fix:**
1. Make sure you ran the SQL setup in Step 2
2. In phpMyAdmin, check if `users` table exists
3. Check if there's a user with username `admin`

### Problem: "Database connection error"
**Fix:**
1. Check `config.php` has correct:
   - DB_USER: `lpmjclyqtt_releye_user`
   - DB_NAME: `lpmjclyqtt_releye`
   - DB_PASS: your actual password
2. In cPanel "MySQL Databases", verify user has "ALL PRIVILEGES"

---

## 🔄 How to Update Later

When you want to make changes:

1. **On your computer:**
   - Make code changes
   - Run: `npm run build`
   
2. **On Spaceship:**
   - Delete old files in `public_html` (keep the `api` folder!)
   - Upload new files from `dist` folder

---

## 📚 More Information

- **Full technical guide:** [CPANEL_QUICK_START.md](CPANEL_QUICK_START.md)
- **Choosing deployment method:** [WHICH_GUIDE.md](WHICH_GUIDE.md)
- **Deployment comparison:** [SPACESHIP_ONLY_DEPLOYMENT.md](SPACESHIP_ONLY_DEPLOYMENT.md)
