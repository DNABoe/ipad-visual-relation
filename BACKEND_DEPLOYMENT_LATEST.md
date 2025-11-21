# RelEye Backend Deployment Guide (Latest)

**Last Updated**: January 2025  
**Backend Type**: PHP + MySQL  
**Hosting**: cPanel (Spaceship hosting at Boestad.com)

> **Note:** This is the backend-only guide. For complete deployment including frontend, see `DEPLOYMENT_GUIDE.md`

## Overview

The RelEye backend is a PHP REST API that handles user authentication and management. It uses MySQL for data persistence and is deployed on a cPanel-based hosting environment.

**Current Production URL**: `https://releye.boestad.com/api/`

**Quick Answer: Do I need to build the backend?**

**No.** The backend is PHP, which runs interpreted (no build step). You simply:
1. Upload the PHP files from `php-backend/` to cPanel
2. Configure `config.php` with your database credentials
3. Run the SQL schema to create database tables

The **frontend** (React app) requires building, but that's handled automatically by GitHub Actions.

---

## What You Need to Deploy

### Files to Upload (from `php-backend/` directory)
```
php-backend/
├── index.php      - Main API router (no build needed)
├── config.php     - Configuration (YOU MUST EDIT THIS)
├── database.php   - MySQL connection class
├── helpers.php    - Utility functions
└── .htaccess      - URL rewriting rules
```

**Important:** These are plain PHP files. No build process, no compilation, no npm commands needed.

### Database Schema
- File: `database-setup-mysql.sql` (in project root)
- Run this SQL in phpMyAdmin to create tables

### Where to Upload
- **Destination:** `/public_html/api/` on your cPanel server
- **Method:** cPanel File Manager or FTP

---

## System Architecture

### Components
1. **PHP API** (`php-backend/` directory)
   - `index.php` - Main API router
   - `config.php` - Configuration (database credentials, CORS, JWT secret)
   - `database.php` - MySQL database connection class
   - `helpers.php` - Utility functions (JWT, password hashing, CORS)
   - `.htaccess` - URL rewriting for clean endpoints

2. **MySQL Database** 
   - Database name: `lpmjclyqtt_releye`
   - User: `lpmjclyqtt_releye_user`
   - Three tables: `users`, `invitations`, `activity_log`

3. **Frontend**
   - Production URL: `https://releye.boestad.com`
   - GitHub Pages deployment
   - Connects to backend API for authentication

---

## Prerequisites

Before deploying, ensure you have:
- [x] Access to Spaceship cPanel at Boestad.com
- [x] Database credentials (username, password, database name)
- [x] FTP/File Manager access
- [x] phpMyAdmin access for database setup

---

## Deployment Steps

### TL;DR Quick Steps

```bash
# NO BUILD NEEDED FOR BACKEND!
# Just do these 3 things:

1. Run database-setup-mysql.sql in phpMyAdmin
2. Upload all files from php-backend/ to /public_html/api/
3. Edit /public_html/api/config.php with your credentials
```

### Step 1: Database Setup

1. **Log into cPanel**
   - Navigate to phpMyAdmin

2. **Select the database**: `lpmjclyqtt_releye`

3. **Run the database schema**
   - Click the "SQL" tab
   - Copy the entire contents of `database-setup-mysql.sql`
   - Paste into the SQL query box
   - Click "Go"

4. **Verify tables were created**
   ```sql
   SHOW TABLES;
   ```
   Should show: `users`, `invitations`, `activity_log`

5. **Verify the default admin user** (optional)
   ```sql
   SELECT user_id, email, name, role FROM users WHERE role = 'admin';
   ```

### Step 2: Upload Backend Files

#### Option A: Using cPanel File Manager (Recommended)

1. Log into cPanel
2. Open "File Manager"
3. Navigate to `public_html/api/` directory
4. Upload all files from the `php-backend/` directory:
   - `index.php`
   - `config.php`
   - `database.php`
   - `helpers.php`
   - `.htaccess`

#### Option B: Using FTP

1. Connect to FTP: `ftp.boestad.com`
2. Navigate to `/public_html/api/`
3. Upload all files from `php-backend/` directory
4. Ensure file permissions are set correctly (644 for PHP files)

### Step 3: Configure Backend

1. **Edit `config.php`** (in `/public_html/api/`)

   Update the following values:

   ```php
   // Database configuration
   define('DB_HOST', 'localhost');
   define('DB_USER', 'lpmjclyqtt_releye_user');
   define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE'); // ← CHANGE THIS
   define('DB_NAME', 'lpmjclyqtt_releye');
   
   // JWT Secret - CHANGE THIS to a random string
   define('JWT_SECRET', 'CHANGE_THIS_TO_A_RANDOM_STRING'); // ← CHANGE THIS
   
   // CORS Origin - Your frontend URL
   define('CORS_ORIGIN', 'https://releye.boestad.com');
   ```

2. **Generate a secure JWT secret**
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # Or use any random string generator
   ```

3. **Set correct file permissions**
   - PHP files: `644`
   - Directories: `755`
   - `.htaccess`: `644`

### Step 4: Verify Deployment

1. **Test the health endpoint**
   ```bash
   curl https://releye.boestad.com/api/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "status": "ok",
       "timestamp": 1234567890,
       "version": "1.0.0",
       "database": "mysql"
     }
   }
   ```

2. **Test first-time setup check**
   ```bash
   curl https://releye.boestad.com/api/auth/first-time
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "isFirstTime": false
     }
   }
   ```
   (Will be `true` if no admin user exists)

3. **Test database connection**
   ```bash
   curl https://releye.boestad.com/api/users \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## API Endpoints Reference

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| GET | `/auth/first-time` | Check if admin exists |
| POST | `/auth/login` | User login |
| GET | `/invites/{token}` | Get invite details |

### Protected Endpoints (Auth Required)

| Method | Endpoint | Description | Admin Only |
|--------|----------|-------------|------------|
| GET | `/auth/verify` | Verify auth token | No |
| GET | `/users` | List all users | Yes |
| POST | `/users` | Create new user | No* |
| GET | `/users/{userId}` | Get user by ID | Yes |
| PUT | `/users/{userId}` | Update user | Yes |
| DELETE | `/users/{userId}` | Delete user | Yes |
| GET | `/users/email/{email}` | Get user by email | Yes |
| GET | `/invites` | List all invites | Yes |
| POST | `/invites` | Create new invite | Yes |
| DELETE | `/invites/{token}` | Revoke invite | Yes |
| POST | `/invites/cleanup` | Clean expired invites | Yes |
| POST | `/auth/reset-all` | Reset all data | No* |

*Note: `/users` POST and `/auth/reset-all` are used during first-time setup and don't require auth

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INT NOT NULL DEFAULT 210000,
    encrypted_api_key TEXT,
    api_key_salt TEXT,
    can_investigate BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    last_login BIGINT,
    login_count INT DEFAULT 0,
    status ENUM('active', 'suspended') DEFAULT 'active'
);
```

### Invitations Table
```sql
CREATE TABLE invitations (
    invite_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending'
);
```

### Activity Log Table
```sql
CREATE TABLE activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at BIGINT NOT NULL
);
```

---

## Security Configuration

### Password Hashing
- Algorithm: **bcrypt** (via `password_hash()`)
- Cost factor: **12**
- Additional PBKDF2 hashing on frontend before transmission

### JWT Tokens
- Algorithm: **HS256**
- Expiration: **30 days**
- Secret: Defined in `config.php` (must be changed!)

### CORS Configuration
- Allowed origin: `https://releye.boestad.com`
- Allows `localhost` and `127.0.0.1` for development
- Credentials: Enabled
- Methods: GET, POST, PUT, DELETE, OPTIONS

---

## Troubleshooting

### Issue: "Database connection failed"

**Cause**: Incorrect database credentials in `config.php`

**Solution**:
1. Verify credentials in cPanel → MySQL Databases
2. Update `config.php` with correct values
3. Ensure database user has proper permissions

### Issue: "Endpoint not found" or 404 errors

**Cause**: `.htaccess` not working or mod_rewrite disabled

**Solution**:
1. Verify `.htaccess` file exists in `/public_html/api/`
2. Check file contents match the template
3. Contact hosting support to enable mod_rewrite

### Issue: CORS errors in browser console

**Cause**: CORS_ORIGIN mismatch in `config.php`

**Solution**:
1. Open `config.php`
2. Verify `CORS_ORIGIN` matches your frontend URL exactly
3. For development, the helpers.php allows localhost automatically

### Issue: "Invalid credentials" on login

**Cause**: Password mismatch or user doesn't exist

**Solution**:
1. Verify user exists in database:
   ```sql
   SELECT email, role FROM users;
   ```
2. Try first-time setup flow to create admin
3. Check frontend is sending correct password hash format

### Issue: Cannot access admin endpoints

**Cause**: User role is not 'admin'

**Solution**:
1. Check user role in database:
   ```sql
   SELECT email, role FROM users WHERE email = 'your@email.com';
   ```
2. Update role if needed:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

---

## Default Admin Account

The database setup script creates a default admin account:

- **Email**: `admin@releye.local`
- **Password**: `admin`

**⚠️ IMPORTANT**: This is a placeholder account. Either:
1. Delete it and use the first-time setup flow in the app
2. Change the password immediately after first login

To delete the default admin:
```sql
DELETE FROM users WHERE user_id = 'admin-default';
```

---

## Testing the Deployment

### Test Script

Create a simple test file `test-api.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head><title>API Test</title></head>
<body>
  <h1>RelEye API Test</h1>
  <button onclick="testHealth()">Test Health</button>
  <button onclick="testFirstTime()">Test First-Time</button>
  <pre id="output"></pre>
  
  <script>
    const API_URL = 'https://releye.boestad.com/api';
    const output = document.getElementById('output');
    
    async function testHealth() {
      try {
        const res = await fetch(`${API_URL}/health`);
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        output.textContent = 'Error: ' + err.message;
      }
    }
    
    async function testFirstTime() {
      try {
        const res = await fetch(`${API_URL}/auth/first-time`);
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        output.textContent = 'Error: ' + err.message;
      }
    }
  </script>
</body>
</html>
```

---

## Maintenance

### View Recent Activity
```sql
SELECT a.*, u.email 
FROM activity_log a 
LEFT JOIN users u ON a.user_id = u.user_id 
ORDER BY a.created_at DESC 
LIMIT 50;
```

### List All Users
```sql
SELECT user_id, email, name, role, login_count, 
       FROM_UNIXTIME(last_login/1000) as last_login_date
FROM users 
ORDER BY created_at DESC;
```

### Clean Up Expired Invites
```bash
curl -X POST https://releye.boestad.com/api/invites/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Full Database Reset (⚠️ DANGER)
```sql
-- This deletes ALL data
DELETE FROM activity_log;
DELETE FROM invitations;
DELETE FROM users;

-- Then re-run database-setup-mysql.sql to recreate default admin
```

---

## Files Checklist

Ensure these files are in `/public_html/api/`:

- [x] `index.php` - Main API router
- [x] `config.php` - Configuration (with your credentials)
- [x] `database.php` - Database class
- [x] `helpers.php` - Helper functions
- [x] `.htaccess` - URL rewriting

---

## Next Steps After Deployment

1. ✅ Test the API health endpoint
2. ✅ Open the frontend: `https://releye.boestad.com`
3. ✅ Complete first-time setup (or login with default admin)
4. ✅ Change default admin password
5. ✅ Create additional user accounts as needed
6. ✅ Test creating and loading network files

---

## Support & References

- **Frontend URL**: https://releye.boestad.com
- **API Base URL**: https://releye.boestad.com/api
- **Database Schema**: `database-setup-mysql.sql`
- **Configuration Template**: `php-backend/config.php`

For issues or questions, check the diagnostics page: `https://releye.boestad.com/?diagnostics=true`
