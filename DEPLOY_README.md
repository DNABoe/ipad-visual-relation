# 🚀 Deploy RelEye to releye.boestad.com

## ⚡ Quick Start (2 Commands)

```bash
# 1. Build and create deployment package
chmod +x deploy-standalone.sh && ./deploy-standalone.sh

# 2. Follow the upload instructions in UPLOAD_INSTRUCTIONS.txt
```

That's it! Your deployment package is ready.

---

## 📚 Documentation

Choose your guide based on your needs:

### 🎯 Just Want to Deploy?
**→ Read:** `QUICKSTART_STANDALONE.md`  
Quick 3-step process to get deployed in minutes.

### 🔍 Want Details & Troubleshooting?
**→ Read:** `STANDALONE_DEPLOYMENT_GUIDE.md`  
Comprehensive guide with architecture explanation and troubleshooting.

### 📖 Want to Understand the Changes?
**→ Read:** `STANDALONE_MIGRATION_COMPLETE.md`  
Full migration summary, what changed and why.

---

## 🎬 Deployment Process

### Step 1: Build
```bash
./deploy-standalone.sh
```

**Output:**
- `releye-deployment.zip` (your deployment package)
- `UPLOAD_INSTRUCTIONS.txt` (detailed upload steps)

### Step 2: Upload

**Via cPanel (Recommended):**
1. Go to spaceship.com cPanel
2. Open File Manager
3. Navigate to `releye.boestad.com` folder
4. Delete old files
5. Upload `releye-deployment.zip`
6. Right-click → Extract
7. Delete the zip file

**Via FTP (Optional):**
```bash
./upload-to-spaceship.sh
```

### Step 3: Verify
Visit https://releye.boestad.com and test:
- ✅ First-time setup appears
- ✅ Can create admin account
- ✅ Login works
- ✅ Data persists after refresh

---

## ✨ What's Different?

### Before (Spark Environment)
- Needed Spark runtime
- Required GitHub login
- Data in GitHub cloud storage

### After (Standalone)
- ✅ No Spark needed
- ✅ No GitHub login needed  
- ✅ Runs on any static hosting
- ✅ Data in browser localStorage
- ✅ **All features retained**

---

## 💾 How Data Works

**Storage:** Browser localStorage (5-10MB per domain)

**Persistence:**
- ✅ Survives page refresh
- ✅ Survives browser restart
- ✅ Works offline after initial load
- ⚠️ Per-browser (use export/import for other devices)
- ⚠️ Lost if browser data cleared (export backups!)

**Multi-Device:**
Users export `.rln` files and import on other devices.

---

## 🎯 Features Retained

Everything works exactly as before:

✅ User authentication (admin/normal)  
✅ Network visualization  
✅ Person & group nodes  
✅ All layout algorithms  
✅ File export/import  
✅ Investigation (with API key)  
✅ Settings & preferences  
✅ Invite system  
✅ Admin dashboard  

---

## 🐛 Quick Troubleshooting

**Blank page?**
- Check browser console (F12)
- Verify all files uploaded
- Clear browser cache

**Can't login?**
- Disable private/incognito mode
- Enable browser storage
- Check localStorage enabled

**First-time setup won't show?**
- F12 → Application → Local Storage
- Delete all `releye-*` keys
- Refresh

---

## 📁 Deployment Files

After running `./deploy-standalone.sh`:

```
your-project/
├── releye-deployment.zip      ← Upload this
├── UPLOAD_INSTRUCTIONS.txt    ← Follow this
├── dist/                      ← Build output
│   ├── index.html
│   └── assets/
└── Documentation:
    ├── QUICKSTART_STANDALONE.md
    ├── STANDALONE_DEPLOYMENT_GUIDE.md
    └── STANDALONE_MIGRATION_COMPLETE.md
```

---

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ https://releye.boestad.com loads
2. ✅ See first-time setup screen
3. ✅ Can create admin account
4. ✅ Login persists after browser restart
5. ✅ Can create and save networks

---

## 🆘 Need Help?

1. Check `QUICKSTART_STANDALONE.md` for quick fixes
2. Check `STANDALONE_DEPLOYMENT_GUIDE.md` for detailed help
3. Review browser console (F12) for errors
4. Verify file structure on server

---

## 🚀 Ready to Deploy?

```bash
# Make scripts executable (first time only)
chmod +x deploy-standalone.sh
chmod +x upload-to-spaceship.sh

# Build the deployment package
./deploy-standalone.sh

# Then upload releye-deployment.zip via cPanel!
```

**Happy deploying!** 🎊
