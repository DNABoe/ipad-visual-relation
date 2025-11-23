# Backend Database Issues - Troubleshooting Guide

This document helps diagnose and fix database connection issues at `https://releye.boestad.com/api`.

## Quick Access to Diagnostics

Add these URL parameters to your RelEye app URL:

- **Database Diagnostics**: `https://releye.boestad.com/?db-diagnostics=true`
- **Auth Diagnostics**: `https://releye.boestad.com/?diagnostics=true`

## Common Issues and Solutions

### Issue 1: "isFirstTime: false" but you want first-time setup

**Problem**: The database shows `isFirstTime: false` meaning an admin user already exists, but you want to reset to first-time setup.

**Solutions**:

1. **Via Database Diagnostics Tool** (Easiest)
   - Go to: `https://releye.boestad.com/?db-diagnostics=true`
   - Click "Reset All Data" button
   - This will clear ALL users and invites from the database
   - Page will auto-refresh and show first-time setup

2. **Via MySQL/phpMyAdmin on cPanel** (Manual)
   - Log into Spaceship cPanel
   - Open phpMyAdmin
   - Select the RelEye database
   - Run SQL: `TRUNCATE TABLE users;`
   - Run SQL: `TRUNCATE TABLE invites;`
   - Refresh the RelEye app

### Issue 2: User credentials not persisting between sessions

**Problem**: Every time you open the app in a new browser session, you have to log in again or it shows first-time setup.

**Root Causes**:

1. **Missing or expired JWT token**
   - The backend API issues a JWT token on login
   - This token should be stored in localStorage as `releye-auth-token`
   - Check: Open browser DevTools → Application → Local Storage → Check for `releye-auth-token`

2. **Backend not saving users to database**
   - Check: Run database diagnostics at `?db-diagnostics=true`
   - Look for "User Retrieval" test result
   - Should show count of users in database

3. **Session/cookie issues**
   - Backend uses JWT in Authorization header, not sessions
   - Ensure backend CORS is configured correctly
   - Required CORS headers:
     ```
     Access-Control-Allow-Origin: https://releye.boestad.com
     Access-Control-Allow-Credentials: true
     Access-Control-Allow-Headers: Content-Type, Authorization
     ```

**How to verify the issue**:

1. Open Database Diagnostics: `?db-diagnostics=true`
2. Click "Run Tests"
3. Check these results:
   - **Database Connection**: Should be ✓ success
   - **First-Time Setup**: Shows if admin exists
   - **Token Persistence**: Shows if logged in
   - **User Retrieval**: Shows count of users in database

### Issue 3: Database connection errors

**Problem**: API returns errors like "Cannot connect to database" or timeouts.

**Check on Backend Server** (Spaceship cPanel):

1. **Verify MySQL is running**
   - cPanel → MySQL Databases
   - Ensure database exists and user has permissions

2. **Check backend `.env` file**
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   JWT_SECRET=your_secret_key_here
   FRONTEND_URL=https://releye.boestad.com
   ```

3. **Test database connection from backend**
   - SSH into server (if available)
   - Run: `mysql -u username -p database_name`
   - Should connect without errors

4. **Check database tables exist**
   - phpMyAdmin → Select database
   - Should see tables: `users`, `invites`
   - If missing, run the schema.sql file to create tables

### Issue 4: "No authentication token provided" errors

**Problem**: API returns 401 errors even when logged in.

**Causes**:

1. **Token not being sent to backend**
   - Check browser DevTools → Network → Select API call
   - Look for `Authorization: Bearer <token>` header
   - Should be present on all authenticated requests

2. **Token expired or invalid**
   - JWT tokens have expiration (typically 7 days)
   - Backend should reject expired tokens
   - Solution: Log out and log back in

3. **Token stored incorrectly**
   - Check localStorage for `releye-auth-token`
   - Should be a long string (JWT format: `xxx.yyy.zzz`)

**Fix**:
- Clear token: Delete `releye-auth-token` from localStorage
- Log out and log back in
- Token will be refreshed

### Issue 5: Users not appearing in database

**Problem**: You create a user but it doesn't show up in the Admin Dashboard or database.

**Debug Steps**:

1. **Check backend logs** (if available)
   - Look for SQL INSERT errors
   - Check for validation errors

2. **Verify via phpMyAdmin**
   - cPanel → phpMyAdmin
   - Select database
   - Browse `users` table
   - Count rows: `SELECT COUNT(*) FROM users;`
   - View all: `SELECT userId, email, name, role FROM users;`

3. **Check API response**
   - Browser DevTools → Network
   - Find the "create user" API call
   - Check response - should return user object with userId

4. **Common causes**:
   - Duplicate email (email must be unique)
   - Database constraints failing
   - Backend not connected to correct database
   - Permissions issue on database user

### Issue 6: Backend API not responding

**Problem**: All API calls fail with "Failed to fetch" or timeout.

**Check**:

1. **Backend server is running**
   - If using Node.js backend: Process must be running
   - If using PHP backend: Apache/nginx must be running
   - cPanel usually auto-manages this

2. **API endpoint is accessible**
   - Open in browser: `https://releye.boestad.com/api/health`
   - Should return: `{"success":true,"data":{"status":"ok",...}}`
   - If 404: Backend routing issue
   - If timeout: Server not running

3. **CORS configuration**
   - If API works via direct URL but not from app: CORS issue
   - Backend must allow origin: `https://releye.boestad.com`

4. **.htaccess configuration** (for Apache/cPanel)
   - If using cPanel, ensure `.htaccess` routes `/api/*` to backend
   - Example:
     ```apache
     RewriteEngine On
     RewriteRule ^api/(.*)$ /backend/index.php/$1 [L,QSA]
     ```

## Backend File Structure

Your backend on Spaceship should look like:

```
public_html/
├── api/                    (backend API folder)
│   ├── index.php          (main entry point)
│   ├── .env               (database credentials)
│   ├── schema.sql         (database schema)
│   └── ...other files
├── index.html             (frontend - RelEye app)
├── assets/
└── src/
```

## Database Schema Check

Your MySQL database should have these tables:

### `users` table:
```sql
CREATE TABLE users (
  userId VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'normal') NOT NULL DEFAULT 'normal',
  canInvestigate BOOLEAN DEFAULT FALSE,
  loginCount INT DEFAULT 0,
  createdAt BIGINT NOT NULL,
  lastLogin BIGINT DEFAULT NULL
);
```

### `invites` table:
```sql
CREATE TABLE invites (
  inviteId VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'normal') NOT NULL DEFAULT 'normal',
  token VARCHAR(255) UNIQUE NOT NULL,
  createdAt BIGINT NOT NULL,
  expiresAt BIGINT NOT NULL,
  createdBy VARCHAR(50) NOT NULL
);
```

## How to Reset Everything

If you want to completely start over:

1. **Via App** (Easiest):
   - Go to: `https://releye.boestad.com/?db-diagnostics=true`
   - Click "Reset All Data"
   - Confirm twice
   - Wait for page refresh

2. **Via Database**:
   - phpMyAdmin → Select database
   - SQL: `TRUNCATE TABLE users;`
   - SQL: `TRUNCATE TABLE invites;`

3. **Via Browser**:
   - Clear localStorage: DevTools → Application → Local Storage → Clear
   - Delete `releye-auth-token`
   - Delete `releye-current-user-id`
   - Refresh page

## Monitoring Backend Health

**Regular checks**:

1. Health endpoint: `https://releye.boestad.com/api/health`
   - Should return 200 OK with JSON
   - Shows database type and timestamp

2. First-time check: `https://releye.boestad.com/api/auth/first-time`
   - Shows if admin user exists
   - `isFirstTime: true` = no admin
   - `isFirstTime: false` = admin exists

3. Database diagnostics: `https://releye.boestad.com/?db-diagnostics=true`
   - Comprehensive test suite
   - Shows all database metrics

## Getting Help

If issues persist:

1. **Collect diagnostic info**:
   - Run Database Diagnostics (`?db-diagnostics=true`)
   - Take screenshot of all test results
   - Note any error messages

2. **Check backend logs** (if available):
   - cPanel → Error Logs
   - Look for recent errors
   - Note timestamps and error messages

3. **Verify basics**:
   - Database exists and is accessible
   - Backend .env file has correct credentials
   - Tables exist with correct schema
   - Frontend can reach API endpoint
