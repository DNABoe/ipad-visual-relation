# ⚠️ WHERE TO TEST YOUR BACKEND API

## The Problem: 404 on GitHub Pages

If you're seeing a GitHub Pages 404 error when testing `/api/health`, this is **EXPECTED** because:

### GitHub Pages (Static Hosting)
```
❌ https://yourusername.github.io/releye/api/health
   └─ GitHub Pages only serves HTML/CSS/JS
   └─ No PHP support
   └─ No MySQL support
   └─ Result: 404 Not Found
```

### Spaceship.com (Full Hosting)
```
✅ https://releye.boestad.com/api/health
   └─ Spaceship has PHP support
   └─ Spaceship has MySQL support
   └─ Result: JSON response from your API
```

---

## Quick Answer

### Where is your backend API?
**On Spaceship.com:** `https://releye.boestad.com/api/`

### Where is your frontend?
**Either location works:**
- GitHub Pages: `https://yourusername.github.io/releye/`
- Spaceship.com: `https://releye.boestad.com/`

### How do they connect?
Your frontend (wherever it's hosted) makes API calls to `https://releye.boestad.com/api/`

---

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│                    Your Computer                         │
│                                                          │
│  Browser → https://releye.boestad.com                   │
│              │                                           │
│              ├─ Loads: HTML, CSS, JS (Frontend)         │
│              │                                           │
│              └─ JavaScript makes API calls to:          │
│                 https://releye.boestad.com/api/          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Spaceship.com Server                        │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ public_html/                               │         │
│  │ ├── index.html  ◄─── Frontend files       │         │
│  │ ├── assets/                                │         │
│  │ │   └── *.js, *.css                        │         │
│  │ └── api/        ◄─── Backend API (PHP)    │         │
│  │     ├── index.php                          │         │
│  │     ├── config.php                         │         │
│  │     └── database.php                       │         │
│  └────────────────────────────────────────────┘         │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────┐         │
│  │ MySQL Database: lpmjclyqtt_releye         │         │
│  │ ├── users table                            │         │
│  │ ├── invitations table                      │         │
│  │ └── activity_log table                     │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## Testing Commands

### ✅ Correct - Test on Spaceship:

```bash
# Health check
curl https://releye.boestad.com/api/health

# First-time setup check
curl https://releye.boestad.com/api/auth/check-first-time
```

### ❌ Wrong - Testing on GitHub Pages:

```bash
# This will NOT work - GitHub Pages has no PHP!
curl https://yourusername.github.io/releye/api/health
```

---

## Deployment Options Explained

You have TWO options for hosting the frontend:

### Option A: Everything on Spaceship (Recommended)
```
Frontend: https://releye.boestad.com
Backend:  https://releye.boestad.com/api/
```

**Pros:**
- Simple - everything in one place
- No CORS issues
- Easier to manage

### Option B: Frontend on GitHub Pages, Backend on Spaceship
```
Frontend: https://yourusername.github.io/releye/
Backend:  https://releye.boestad.com/api/
```

**Pros:**
- Free frontend hosting
- Automatic deployments via GitHub

**Cons:**
- Need to configure CORS in `config.php`
- Two separate places to manage

---

## Current Recommendation

Based on your setup, use **Option A** (everything on Spaceship):

1. Upload built frontend files to `public_html/`
2. Upload PHP backend to `public_html/api/`
3. Configure database connection in `api/config.php`
4. Visit `https://releye.boestad.com` to use your app
5. Test API at `https://releye.boestad.com/api/health`

This is simpler and everything is in one place!

---

## Next Steps

1. **Have you uploaded the PHP files to Spaceship?**
   - If NO: Follow [SPACESHIP_ONLY_DEPLOYMENT.md](SPACESHIP_ONLY_DEPLOYMENT.md)
   - If YES: Continue to step 2

2. **Test the backend API on Spaceship:**
   ```bash
   curl https://releye.boestad.com/api/health
   ```

3. **If you get 404:** See [BACKEND_API_TESTING.md](BACKEND_API_TESTING.md)

4. **If API works:** Build and upload frontend:
   ```bash
   npm run build
   # Then upload dist/ contents to Spaceship public_html/
   ```

---

## Summary

🎯 **Remember:** 
- Backend API = Spaceship.com ONLY (needs PHP + MySQL)
- Frontend = Can be on Spaceship OR GitHub Pages
- Test backend at: `https://releye.boestad.com/api/health`
- Don't test backend on GitHub Pages (will always 404)
