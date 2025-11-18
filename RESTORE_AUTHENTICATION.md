# Authentication Restored - Deployment Guide

## What Was Changed

The temporary authentication bypass has been **REMOVED**. The app now uses proper MySQL backend authentication.

### Changes Made:
1. ✅ **Removed bypass code** from `src/App.tsx`
2. ✅ **Restored proper authentication flow**:
   - First-time admin setup
   - Login with email/password
   - Invite system for new users
   - Session management across browsers/devices
3. ✅ **All user data now stored in MySQL** on releye.boestad.com
4. ✅ **Default admin credentials**: `admin` / `admin` (MUST be changed after first login)

## Database Configuration

Your MySQL database details:
- **Host**: releye.boestad.com (assuming Spaceship hosting)
- **Database Name**: `lpmjclyqtt_releye`
- **Database User**: `lpmjclyqtt_releye_user`
- **Port**: 3306 (default MySQL)

## Deployment Steps

### Step 1: Set Up MySQL Database

1. **Access phpMyAdmin** at Spaceship.com control panel
2. **Select database**: `lpmjclyqtt_releye`
3. **Run the SQL setup script**: `database-setup-mysql.sql`
   - This will create all necessary tables
   - Creates default admin user (username: `admin`, password: `admin`)

### Step 2: Deploy Backend API

The backend API needs to run on your Spaceship hosting. Since Spaceship.com uses cPanel-based hosting:

#### Option A: Node.js Application (if Spaceship supports it)

1. Check if your hosting plan supports Node.js applications
2. If yes, use the cPanel Node.js app manager to:
   - Create a new Node.js application
   - Set entry point to `api-server-mysql.js`
   - Set environment variables (see `.env` section below)

#### Option B: External Server (Recommended for Spaceship)

Since Spaceship.com is primarily a domain registrar with shared hosting, you'll likely need a separate server for the Node.js backend:

1. **Use a cloud provider**: DigitalOcean, AWS, or similar
2. **Deploy the API server** there
3. **Point API requests** from your frontend to this server

### Step 3: Configure Environment Variables

Create a `.env` file for the backend:

```env
# Database Configuration
DB_HOST=releye.boestad.com
DB_USER=lpmjclyqtt_releye_user
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
DB_NAME=lpmjclyqtt_releye
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://releye.boestad.com

# Security
JWT_SECRET=GENERATE_A_LONG_RANDOM_STRING_HERE
```

### Step 4: Deploy Frontend

The frontend is already configured to be deployed to GitHub Pages:

```bash
# Build and deploy
npm run build
# Push to GitHub - GitHub Pages will automatically deploy
```

## Spaceship.com Hosting Notes

Spaceship.com is primarily a domain registrar that offers:
- ✅ Domain registration
- ✅ Domain DNS management
- ✅ Basic shared hosting (PHP/HTML)
- ❌ Node.js application hosting (limited or not available)
- ❌ Direct MySQL remote access (usually restricted)

### Recommended Architecture for Spaceship Hosting:

```
┌─────────────────────────────────────┐
│  Frontend (GitHub Pages)            │
│  https://releye.boestad.com         │
│  - Static React app                 │
│  - Uses custom domain from Spaceship│
└──────────────┬──────────────────────┘
               │
               │ HTTPS API Calls
               │
┌──────────────▼──────────────────────┐
│  Backend API (External Server)      │
│  https://api.releye.boestad.com     │
│  - DigitalOcean/AWS/Heroku          │
│  - Node.js + Express                │
└──────────────┬──────────────────────┘
               │
               │ MySQL Connection
               │
┌──────────────▼──────────────────────┐
│  MySQL Database (Spaceship cPanel)  │
│  lpmjclyqtt_releye                  │
│  - Allow remote connections         │
│  - Whitelist API server IP          │
└─────────────────────────────────────┘
```

## Alternative: All-in-One External Hosting

If you prefer a simpler setup, you can:

1. **Move everything to DigitalOcean/AWS**:
   - Frontend: Static hosting or Nginx
   - Backend: Node.js application
   - Database: MySQL on same server

2. **Keep domain at Spaceship.com**:
   - Update DNS A record to point to your server
   - Configure SSL certificate (Let's Encrypt)

## First Login After Deployment

1. Visit `https://releye.boestad.com`
2. You'll see "Create Administrator Account"
3. **Default credentials** (if using the SQL script):
   - Username: `admin`
   - Password: `admin`
4. **⚠️ IMPORTANT**: Change password immediately in Settings!

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET in environment
- [ ] Use HTTPS for all connections
- [ ] Restrict MySQL remote access to API server IP only
- [ ] Enable firewall on API server
- [ ] Regular database backups
- [ ] Monitor API logs for suspicious activity

## Troubleshooting

### "Backend server is not available"
- Check if API server is running
- Verify CORS settings allow frontend domain
- Check firewall rules

### "Cannot connect to database"
- Verify MySQL credentials
- Check if remote connections are enabled
- Whitelist API server IP in MySQL

### "First-time setup not showing"
- Check if admin user exists in database
- Clear browser cache and refresh
- Check browser console for errors

## Need Help?

If you need assistance with:
- Setting up a DigitalOcean server for the backend
- Configuring Spaceship DNS
- Deploying the complete stack

Please provide:
1. Your hosting plan details
2. Whether Node.js is available on your Spaceship hosting
3. Database password for `lpmjclyqtt_releye_user`
