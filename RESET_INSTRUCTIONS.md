# Reset All Passwords and User Data

This guide explains how to reset all user credentials and return the application to first-time setup.

## Method 1: Using the Admin Dashboard (Recommended)

1. Log in as an admin user
2. Open Settings (double-click your name in the toolbar or click the settings button)
3. Navigate to the "Admin" tab
4. Click on the "Reset" tab
5. Follow the multi-step confirmation process
6. The application will reset and reload to the first-time admin setup

## Method 2: Using the Backend API Directly

If you can't access the admin dashboard, you can reset via the backend API:

### Using curl:
```bash
curl -X POST https://releye.boestad.com/api/auth/reset-all \
  -H "Content-Type: application/json"
```

### Using browser console:
1. Open https://releye.boestad.com
2. Press F12 to open developer tools
3. Go to the Console tab
4. Paste and run this code:

```javascript
fetch('https://releye.boestad.com/api/auth/reset-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('Reset successful:', data)
  localStorage.clear()
  alert('Database reset complete. Click OK to reload.')
  window.location.reload()
})
.catch(err => console.error('Reset failed:', err))
```

## What Gets Reset

When you reset the application:

✅ **DELETED:**
- All user accounts and credentials
- All login history and permissions
- All pending invitations
- All activity logs
- Local session data

❌ **NOT DELETED:**
- Workspace files (your networks, people, connections)
- Application settings stored in local files
- Any local browser storage for workspace data

## After Reset

After reset, you will see the first-time setup screen where you can:
1. Create a new admin account
2. Set a new admin password
3. Start fresh with the application

## Security Note

The reset endpoint is intentionally left without authentication so that if you get locked out, you can still reset the system. This is safe because:
- It only deletes user credentials (not workspace data)
- The application is designed to run on your own domain
- After reset, you must create a new admin account immediately
