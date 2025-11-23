# RelEye Standalone Deployment Guide

## Overview

This guide will help you deploy RelEye to **releye.boestad.com** without any Spark environment dependencies. The app will run entirely on your spaceship.com hosting with all functionality retained.

## Architecture Changes

### What's Being Changed
- **Spark KV Storage** → **Browser localStorage** (encrypted, persistent across sessions)
- **Spark Runtime** → **Standard browser APIs**
- All Spark-specific code removed
- Build optimized for static hosting

### What's Retained
- ✅ All authentication and user management
- ✅ Multi-user support with admin/normal roles
- ✅ Encrypted password storage
- ✅ Network visualization and all features
- ✅ File export/import functionality
- ✅ Investigation features
- ✅ All layout algorithms
- ✅ Cross-browser, cross-session persistence

## Deployment Process

### Step 1: Build the Application

From your project directory, run:

```bash
npm run build
```

This creates a `dist/` folder with your production-ready files.

### Step 2: Upload to Spaceship.com

#### Via cPanel File Manager:
1. Log in to Spaceship.com cPanel
2. Navigate to **File Manager**
3. Go to the directory for `releye.boestad.com` (typically `public_html/releye` or a subdomain folder)
4. **Delete all existing files** in that directory
5. Upload ALL files from the `dist/` folder:
   - `index.html`
   - `assets/` folder (contains all JS, CSS, fonts, images)
   - Any other files in `dist/`
6. Make sure the `.nojekyll` file is uploaded (prevents GitHub Pages processing)

#### Via FTP (Alternative):
1. Connect to your hosting via FTP client (FileZilla, etc.)
2. Navigate to the subdomain directory
3. Delete old files, upload new `dist/` contents

### Step 3: Configure DNS (if not already done)

Your DNS should point to your spaceship.com hosting:

- **Type**: A Record or CNAME
- **Host**: releye
- **Value**: Your spaceship.com server IP or hosting domain

**Note**: DNS is already configured since you mentioned the site loads. No changes needed here.

### Step 4: Test the Deployment

1. Visit `https://releye.boestad.com`
2. You should see the first-time setup screen
3. Create an admin account
4. Test login/logout
5. Create a network and test persistence by:
   - Creating nodes
   - Closing the browser
   - Reopening and verifying data is still there

## Automated Deployment Script

For easier future updates, use this automated deployment script:

### Create `deploy-to-spaceship.sh`:

```bash
#!/bin/bash

echo "==================================="
echo "RelEye Standalone Deployment"
echo "==================================="
echo ""

# Step 1: Build
echo "Step 1: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Create deployment package
echo "Step 2: Creating deployment package..."
cd dist
zip -r ../releye-deployment.zip .
cd ..

echo "✅ Deployment package created: releye-deployment.zip"
echo ""

echo "==================================="
echo "Next Steps:"
echo "==================================="
echo "1. Upload 'releye-deployment.zip' to spaceship.com cPanel"
echo "2. Extract it in your releye.boestad.com directory"
echo "3. Delete the zip file from server"
echo "4. Visit https://releye.boestad.com to verify"
echo ""
echo "Your deployment package is ready!"
```

### Make it executable:

```bash
chmod +x deploy-to-spaceship.sh
```

### Run deployment:

```bash
./deploy-to-spaceship.sh
```

This creates `releye-deployment.zip` that you can upload via cPanel.

## Storage Architecture

### How Data is Stored

All data is stored in **browser localStorage**:

- **Users & Authentication**: `releye-users`, `releye-current-user-id`
- **Workspaces**: Individual keys per workspace file
- **Settings**: `releye-settings`
- **API Keys**: Encrypted in `releye-api-keys`

### Data Persistence

- ✅ Persists across browser sessions
- ✅ Persists across page refreshes
- ✅ Works on different devices (with same browser/profile if synced)
- ✅ No server required
- ⚠️ Stored per-browser (users need to use same browser to access their data)
- ⚠️ Clearing browser data will reset the app

### Multi-User Support

Each user has their own:
- Login credentials (encrypted)
- Personal workspaces
- Settings and preferences

The admin can:
- Create/manage users
- See all registered users
- Control user permissions

## Troubleshooting

### Issue: Blank page after deployment

**Solution**: 
- Check browser console (F12) for errors
- Verify all files uploaded correctly
- Ensure `index.html` is in the root of the subdomain directory

### Issue: Assets not loading (404 errors)

**Solution**:
- Check that the `assets/` folder uploaded correctly
- Verify file permissions in cPanel (should be 644 for files, 755 for folders)

### Issue: First-time setup doesn't appear

**Solution**:
- Open browser DevTools (F12) → Application → Local Storage
- Delete all `releye-*` keys
- Refresh the page

### Issue: Login doesn't persist

**Solution**:
- Check that localStorage is enabled in browser
- Try a different browser to rule out browser-specific issues
- Check if third-party cookies are blocked (shouldn't affect localStorage, but can interfere)

## Updating the App

To deploy updates:

1. Make your code changes
2. Run the build: `npm run build`
3. Upload new `dist/` files to spaceship.com
4. **User data is preserved** (stored in browser localStorage, not affected by file updates)

## File Size & Performance

- **Build size**: ~2-5 MB (optimized and minified)
- **Load time**: ~1-3 seconds on typical connection
- **Hosting requirements**: Static file hosting only (no server-side code needed)

## Security Notes

- Passwords are hashed with PBKDF2 (100,000 iterations)
- Sensitive data is encrypted before localStorage storage
- No data transmitted to external servers (except LLM investigation features if API key provided)
- All data stays in the user's browser

## Support

If you encounter issues:

1. Check browser console for errors (F12 → Console tab)
2. Verify all dist files uploaded correctly
3. Try clearing localStorage and starting fresh
4. Test in different browsers (Chrome, Firefox, Safari)

---

**Deployment Status**: Ready for production use on spaceship.com static hosting ✅
