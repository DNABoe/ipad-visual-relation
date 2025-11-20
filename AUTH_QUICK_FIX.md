# 🔧 Authentication Quick Fix Guide

## Problem: Can't see first-time admin setup after reset

### ✅ Quick Solution (Works 95% of the time)

1. **Go to:** https://releye.boestad.com/test-backend.html
2. **Click:** "Complete Reset & Restart" button (bottom of page)
3. **Wait:** 3 seconds for automatic redirect
4. **Result:** You should see the first-time admin setup screen

### 🔍 If that doesn't work, run diagnostics:

Visit: **https://releye.boestad.com/?diagnostics=true**

Look for these results:
- ✅ **Backend API Health** should be green
- ✅ **First-Time Setup Check** should say "ready for first-time setup"
- ⚠️ **Current User Session** should say "No active session"

### 🚨 If diagnostics show problems:

**Problem: Backend API Health is RED**
- Backend server is not running or not accessible
- Check https://releye.boestad.com/api/health in your browser
- Should return JSON with `"status": "ok"`

**Problem: First-Time Setup Check says "Admin already exists"**
- The reset didn't work
- Database still has users
- Run these commands in browser DevTools (F12 → Console):
  ```javascript
  // Force reset the backend
  fetch('https://releye.boestad.com/api/auth/reset-all', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include'
  }).then(r => r.json()).then(console.log)
  
  // Clear local session
  localStorage.clear()
  sessionStorage.clear()
  
  // Go to first-time setup
  location.href = '/?reset=true'
  ```

**Problem: Backend API is unreachable**
- DNS issue or server is down
- Contact your hosting provider (Spaceship.com)
- Verify backend is running and accessible

### 📝 Understanding the URLs

| URL | Purpose |
|-----|---------|
| `https://releye.boestad.com` | Main app |
| `https://releye.boestad.com/?reset=true` | Force first-time setup |
| `https://releye.boestad.com/?diagnostics=true` | Show diagnostics |
| `https://releye.boestad.com/reset.html` | Guided reset wizard |
| `https://releye.boestad.com/test-backend.html` | Backend testing tools |

### 🎯 Expected Flow After Reset

1. Visit any of the reset tools (reset.html or test-backend.html)
2. Click reset button (follows multi-step confirmation)
3. Backend deletes all users from MySQL database
4. LocalStorage and SessionStorage are cleared
5. Redirects to `/?reset=true`
6. App sees `reset=true` parameter
7. App clears any remaining session data
8. App shows **First-Time Admin Setup** screen
9. Create admin account
10. Done! ✅

### ⚠️ What the Reset Does

**DELETES:**
- ✅ All user accounts
- ✅ All passwords
- ✅ All pending invitations
- ✅ All login sessions
- ✅ Browser localStorage/sessionStorage

**KEEPS:**
- ✅ All workspace files (your networks)
- ✅ All network data (people, connections, groups)
- ✅ All settings and preferences in workspace files

### 🔑 Default Admin Account

After reset, create the admin account with:
- **Username:** admin (or any email address)
- **Password:** Your choice (remember it!)
- **Role:** Automatically set to admin

### 📞 Still Having Issues?

1. **Check browser console** (F12 → Console) for red errors
2. **Run diagnostics** and take a screenshot
3. **Verify backend is accessible:**
   - Open https://releye.boestad.com/api/health
   - Should see: `{"success":true,"data":{"status":"ok"}}`
4. **Check you're on the deployed site** (not localhost)
5. **Try a different browser** (Chrome, Firefox, Edge)

### 🧪 Manual Database Reset (Last Resort)

If everything fails, reset the MySQL database directly:

**SSH into your server and run:**
```sql
USE lpmjclyqtt_releye;
DELETE FROM users;
DELETE FROM invites;
```

**Or drop and recreate:**
```sql
DROP DATABASE lpmjclyqtt_releye;
CREATE DATABASE lpmjclyqtt_releye;
```

Then restart the backend server (it will recreate tables).

### 💡 Pro Tips

- Always use the `?diagnostics=true` page to check status first
- The browser console shows detailed logs with `[App]` and `[UserRegistry]` prefixes
- Each reset tool (reset.html, test-backend.html) does the same thing, just different UI
- The `?reset=true` parameter is your friend - it forces first-time setup
- LocalStorage is per-domain - if you test on different domains, they won't share data

---

**Last Updated:** 2024
**Related Files:** 
- `/public/reset.html` - Reset wizard
- `/public/test-backend.html` - Backend testing
- `/src/components/AuthDiagnostic.tsx` - In-app diagnostics
- `AUTH_RESET_GUIDE.md` - Detailed guide
