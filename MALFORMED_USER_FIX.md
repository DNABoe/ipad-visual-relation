# Fix for Malformed "admin-default" User

## Problem

After rebuilding the database, you now have a user with:
- `user_id`: "admin-default"  
- `email`: "admin@releye.local"

This is causing issues because:

1. **The app detects a user exists** → So `isFirstTimeSetup()` returns `false`
2. **But the user ID format is wrong** → It should be `user-1234567890-abc123` format
3. **You can't log in** → The login system expects properly formatted users
4. **You're stuck** → Can't access first-time setup, can't log in with the malformed user

## Solution Options

You have two ways to fix this:

### Option 1: Use the Built-in Reset Tool (Recommended)

1. **Go to the diagnostics page:**
   ```
   https://releye.boestad.com/?diagnostics=true
   ```
   Or add `?diagnostics=true` to your local URL

2. **Review the diagnostics** - You should see:
   - ✅ Backend API is responding
   - ⚠️ Admin already exists (isFirstTime: false)
   - 📋 All Users showing "admin-default"

3. **Click "Reset All Data & Start Fresh"**
   - Type exactly: `DELETE EVERYTHING` when prompted
   - This will delete all users and invites from the database
   - The page will reload and show first-time setup

4. **Create your admin account**
   - The first-time setup screen will appear
   - Create your admin account with proper credentials
   - The new user will have the correct ID format: `user-1234567890-abc123`

### Option 2: Manual Database Cleanup

If you prefer to manually fix the database:

1. **Open phpMyAdmin** (server704.shared.spaceship.host:2083)

2. **Navigate to:** `lpmjclytl_releye` database → `users` table

3. **Delete the "admin-default" user row**

4. **Verify the table is empty:**
   ```sql
   SELECT * FROM users
   ```
   Should show: "Showing rows 0 - 0 (1 total, Query took 0.0007 seconds.)"

5. **Clear your browser session:**
   - Open browser console (F12)
   - Run: `localStorage.clear(); sessionStorage.clear();`
   - Or just visit: `?diagnostics=true` and click "Clear Session & Reload"

6. **Reload the app:**
   - Go to `https://releye.boestad.com/`
   - You should now see the first-time setup screen

## Why This Happened

The "admin-default" user was likely created by:
- A test script or SQL initialization
- Direct database insertion without using the app's user creation flow
- An old migration or setup script

The app's proper user creation flow (in `userRegistry.ts` → `createUser()`) generates user IDs like:
```typescript
userId: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
```

This ensures unique, properly formatted user IDs like: `user-1736284958493-k2x9z4a`

## Verification

After fixing, the diagnostics page should show:

✅ **Backend API Health**: Backend API is responding  
✅ **First-Time Setup Check**: No admin exists - ready for first-time setup  
⚠️ **Current User Session**: No active session  
✅ **LocalStorage Status**: Found 0 RelEye keys  
⚠️ **All Users in Database**: Found 0 user(s) in database  

Then you can proceed with first-time setup and create your admin account properly!

## Prevention

Going forward:
- ✅ Always use the app's first-time setup to create the admin
- ✅ Use the app's invite system to add new users
- ❌ Don't manually insert users into the database
- ❌ Don't use test scripts that bypass the app's user creation flow
