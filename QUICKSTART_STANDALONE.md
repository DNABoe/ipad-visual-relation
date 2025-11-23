# RelEye Standalone - Quick Start Guide

## 🎯 Goal

Deploy RelEye to **releye.boestad.com** without any Spark environment. The entire app runs in the browser with localStorage for data persistence.

## ✅ What's Changed

- ❌ No Spark runtime required
- ❌ No GitHub authentication needed
- ❌ No external backend API
- ✅ Runs entirely in the browser
- ✅ Data stored in browser localStorage
- ✅ Works on any static hosting (spaceship.com)
- ✅ All features fully retained

## 🚀 Quick Deployment (3 Steps)

### Step 1: Build

```bash
chmod +x deploy-standalone.sh
./deploy-standalone.sh
```

This creates `releye-deployment.zip` ready for upload.

### Step 2: Upload to Spaceship.com

**Via cPanel File Manager** (Recommended):

1. Log in to spaceship.com cPanel
2. Open **File Manager**
3. Navigate to `releye.boestad.com` directory (usually `public_html/releye`)
4. **Delete all existing files** in that directory
5. Click **Upload** → select `releye-deployment.zip`
6. Right-click the uploaded zip → **Extract**
7. Delete the zip file from server
8. Done! ✅

**Via FTP** (Optional):

```bash
chmod +x upload-to-spaceship.sh
./upload-to-spaceship.sh
```

### Step 3: Test

Visit https://releye.boestad.com

You should see:
- First-time setup screen
- Create admin account
- Start using the app!

## 📦 What Gets Deployed

```
releye.boestad.com/
├── index.html              # Main HTML file
└── assets/                 # All JavaScript, CSS, fonts
    ├── index-[hash].js     # Application code
    ├── index-[hash].css    # Styles
    └── ...                 # Other assets
```

Total size: ~2-5 MB (minified and optimized)

## 💾 How Data is Stored

All data is stored in **browser localStorage**:

| Data Type | Storage Key | Description |
|-----------|-------------|-------------|
| Users | `releye-users` | All user accounts (encrypted passwords) |
| Current Session | `releye-current-user-id` | Active user ID |
| Invites | `releye-invites` | Pending user invitations |
| Workspaces | `workspace-{filename}` | Individual network files |
| Settings | `releye-settings` | User preferences |

**Important Notes:**
- ✅ Persists across browser sessions
- ✅ Persists across page refreshes
- ⚠️ Per-browser (each browser has its own data)
- ⚠️ Clearing browser data will reset the app

## 🔒 Security

- Passwords hashed with PBKDF2 (100,000 iterations)
- Sensitive data encrypted before storage
- No data sent to external servers (except LLM investigation if API key provided)
- All processing happens client-side

## 🔄 Updating the App

To deploy updates:

1. Make your code changes
2. Run `./deploy-standalone.sh`
3. Upload new files to spaceship.com
4. **User data is preserved** (it's in localStorage, not affected by file updates)

## 🐛 Troubleshooting

### Blank Page After Deployment

**Check:**
- Browser console (F12 → Console tab)
- Are all files uploaded?
- Is `index.html` in the root directory?

**Fix:**
- Re-upload files
- Clear browser cache and refresh

### Assets Not Loading (404 Errors)

**Check:**
- Is the `assets/` folder in the same directory as `index.html`?
- File permissions: 644 for files, 755 for folders

**Fix:**
- Re-extract the zip file
- Verify file structure matches the example above

### Can't Create Account / Login

**Check:**
- Browser console for localStorage errors
- Are you in private/incognito mode? (localStorage won't work)

**Fix:**
- Use regular browser mode
- Check browser settings → ensure cookies/storage enabled
- Try a different browser

### First-Time Setup Doesn't Appear

**Fix:**
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Delete all `releye-*` keys
4. Refresh the page

### Data Not Persisting

**Check:**
- Browser storage settings
- Available disk space
- Third-party cookie blocking

**Fix:**
- Enable storage in browser settings
- Free up disk space
- Whitelist the domain in browser settings

## 📋 File Checklist

After deployment, verify these files exist on the server:

- ✅ `index.html` in root directory
- ✅ `assets/` folder with multiple .js files
- ✅ `assets/` folder with .css files
- ✅ File sizes look reasonable (JS files ~500KB-1MB each)

## 🎨 Features Retained

All features work exactly as before:

✅ User authentication and management  
✅ Admin dashboard  
✅ Network visualization  
✅ Person/group nodes  
✅ Connections and relationships  
✅ Layout algorithms  
✅ File export/import  
✅ Investigation features (with API key)  
✅ Settings and preferences  
✅ Multi-user support  
✅ Invite system  

## 🌐 Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS/Android)

## 💡 Pro Tips

1. **Backup Data**: Users should export their networks regularly as .rln files
2. **Multiple Devices**: Users need to import/export files to sync between devices
3. **Browser Sync**: If using Chrome sync, settings may sync across devices
4. **Development**: Run `npm run dev` for local development with hot reload

## 📞 Support

If you encounter issues:

1. Check browser console (F12 → Console)
2. Review this guide's troubleshooting section
3. Check `STANDALONE_DEPLOYMENT_GUIDE.md` for detailed info
4. Verify file structure on server matches expected layout

## 🎉 Success Indicators

You know it's working when:
- ✅ Site loads at https://releye.boestad.com
- ✅ First-time setup screen appears
- ✅ Can create admin account
- ✅ Login persists after closing browser
- ✅ Can create and save networks
- ✅ Data persists after page refresh

---

**Ready to deploy?** Run `./deploy-standalone.sh` and follow the upload instructions! 🚀
