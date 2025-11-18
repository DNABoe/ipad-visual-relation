# Backend API Fix - January 2025

## What Was Wrong

The frontend React app was trying to call API endpoints that didn't exist in the PHP backend, causing the "Backend server is not available" error.

### Endpoint Mismatches Fixed:

1. **First-time setup check:**
   - Frontend expected: `/api/auth/first-time`
   - Backend had: `/api/auth/check-first-time`
   - ✅ Fixed: Backend now uses `/api/auth/first-time`

2. **Invitations endpoints:**
   - Frontend expected: `/api/invites`
   - Backend had: `/api/invitations`
   - ✅ Fixed: Backend now uses `/api/invites`

3. **User data format:**
   - Frontend expected: JavaScript timestamps (milliseconds)
   - Backend returned: MySQL DATETIME strings
   - ✅ Fixed: Backend now converts to millisecond timestamps

4. **Response structure:**
   - All API responses now properly formatted with `{success: true, data: {...}}`

## Files Updated

1. **`php-backend/index.php`** - Complete rewrite to match frontend API expectations
2. **`SPACESHIP_ONLY_DEPLOYMENT.md`** - Updated test endpoints

## How to Deploy the Fix

### Option 1: Re-upload the PHP Backend (Recommended)

1. **On your Spaceship cPanel:**
   - Go to File Manager
   - Navigate to `public_html/api/`
   - Delete the old `index.php` file
   
2. **Upload the new file:**
   - Upload the new `php-backend/index.php` from this project
   - Make sure file permissions are set to 644

3. **Test it:**
   - Visit: `https://releye.boestad.com/api/health`
   - Should see: `{"success":true,"data":{"status":"ok",...}}`

### Option 2: Copy-Paste the Code

1. **On your Spaceship cPanel:**
   - Go to File Manager
   - Edit `public_html/api/index.php`
   - Replace ALL content with the content from `php-backend/index.php` in this project
   - Save the file

## Testing After Fix

Visit these URLs in your browser to verify everything works:

1. **Health check:**
   ```
   https://releye.boestad.com/api/health
   ```
   Expected: `{"success":true,"data":{"status":"ok","timestamp":1234567890,"version":"1.0.0","database":"mysql"}}`

2. **First-time setup check:**
   ```
   https://releye.boestad.com/api/auth/first-time
   ```
   Expected: `{"success":true,"data":{"isFirstTime":true}}`

3. **Full application:**
   ```
   https://releye.boestad.com
   ```
   Should now load without the "Backend server is not available" error!

## What the Backend Now Supports

All these endpoints are now working and match what the frontend expects:

### Authentication
- `GET /api/health` - Health check
- `GET /api/auth/first-time` - Check if admin exists
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify authentication token

### User Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Invitations
- `GET /api/invites` - List all invitations (admin only)
- `POST /api/invites` - Create invitation (admin only)
- `GET /api/invites/:token` - Get invitation by token
- `DELETE /api/invites/:token` - Revoke invitation (admin only)
- `POST /api/invites/cleanup` - Clean up expired invites (admin only)

## Important Notes

⚠️ **After deploying this fix:**
1. Clear your browser cache
2. Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Test the application at `https://releye.boestad.com`

💡 **Remember:**
- The backend ONLY works on Spaceship hosting (releye.boestad.com)
- It will NOT work on GitHub Pages or other static hosting
- You need PHP and MySQL on your server (which Spaceship provides)

## Troubleshooting

### Still seeing "Backend not available"?
1. Check that `index.php` was uploaded correctly
2. Check that `.htaccess` exists in the `/api` folder
3. Check PHP error logs in cPanel
4. Verify database credentials in `config.php`

### Getting 404 errors?
1. Make sure `.htaccess` is in the `/api` folder
2. Check that mod_rewrite is enabled (usually is on Spaceship)
3. Verify file permissions (644 for PHP files)

### Database connection errors?
1. Check `config.php` has correct credentials
2. Verify database exists in phpMyAdmin
3. Ensure database user has proper permissions

## Support

If you're still having issues after deploying this fix:
1. Check the browser console for detailed error messages
2. Check PHP error logs in cPanel
3. Verify all files are uploaded correctly
4. Make sure database schema is properly set up

---

**Last Updated:** January 2025  
**Version:** 2.0 - Fixed endpoint compatibility
