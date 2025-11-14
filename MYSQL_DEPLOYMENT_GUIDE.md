# RelEye MySQL Backend Deployment Guide

## Overview

This guide will help you deploy the RelEye backend API with MySQL database to **releye.boestad.com**.

The RelEye application architecture:
- ✅ **Frontend**: Static React app served from releye.boestad.com
- ✅ **Backend API**: Node.js + Express server at releye.boestad.com/api
- ✅ **Database**: MySQL storing user credentials and invitations
- ✅ **Encryption**: Network files remain encrypted and stored locally (browser)
- ✅ **Multi-device**: Users can access from any browser/computer

## Prerequisites

- A server running Ubuntu 20.04+ (or similar Linux distribution)
- Domain name: releye.boestad.com pointing to your server
- Root or sudo access to the server
- Basic knowledge of Linux command line

## Architecture Diagram

```
┌─────────────────────────────────────┐
│  Users (Any Browser/Computer)       │
│  - Access https://releye.boestad.com│
│  - Network files stored locally     │
└──────────────┬──────────────────────┘
               │ HTTPS
               │
┌──────────────▼──────────────────────┐
│  Nginx (Web Server)                 │
│  - Serves React frontend            │
│  - Proxies /api to backend          │
│  - Handles SSL/TLS                  │
└──────────────┬──────────────────────┘
               │
               ├─────────────────────┐
               │                     │
        ┌──────▼──────┐      ┌──────▼──────┐
        │  Static     │      │  Node.js    │
        │  Frontend   │      │  API Server │
        │  (React)    │      │  :3000      │
        └─────────────┘      └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │  MySQL      │
                             │  Database   │
                             │  :3306      │
                             └─────────────┘
```

## Step 1: Install MySQL

### 1.1 Install MySQL Server

```bash
# Update package lists
sudo apt update

# Install MySQL Server
sudo apt install mysql-server -y

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Check MySQL is running
sudo systemctl status mysql
```

### 1.2 Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Answer the prompts:
- Set root password: **YES** (choose a strong password)
- Remove anonymous users: **YES**
- Disallow root login remotely: **YES**
- Remove test database: **YES**
- Reload privilege tables: **YES**

### 1.3 Create Database and User

```bash
# Log into MySQL as root
sudo mysql -u root -p
```

Run these SQL commands:

```sql
-- Create the database
CREATE DATABASE releye CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user
CREATE USER 'releye_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON releye.* TO 'releye_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'releye_user';

-- Exit MySQL
EXIT;
```

### 1.4 Import Database Schema

```bash
# Copy the database-setup-mysql.sql file to your server
# Then run:
mysql -u releye_user -p releye < database-setup-mysql.sql
```

Verify the tables were created:

```bash
mysql -u releye_user -p releye -e "SHOW TABLES;"
```

You should see:
- users
- invites
- sessions
- activity_log

## Step 2: Install Node.js

### 2.1 Install Node.js (v18 LTS)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

## Step 3: Deploy Backend API

### 3.1 Create API Directory

```bash
# Create directory for the API
sudo mkdir -p /var/www/releye-api
cd /var/www/releye-api
```

### 3.2 Copy Backend Files

Copy these files from your project to `/var/www/releye-api/`:
- `api-server-mysql.js` → rename to `server.js`
- `api-package-mysql.json` → rename to `package.json`

```bash
# Example if using scp from your local machine:
scp api-server-mysql.js your-server:/var/www/releye-api/server.js
scp api-package-mysql.json your-server:/var/www/releye-api/package.json
```

### 3.3 Install Dependencies

```bash
cd /var/www/releye-api
sudo npm install
```

### 3.4 Create Environment File

```bash
sudo nano /var/www/releye-api/.env
```

Add this content (replace with your actual values):

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=releye_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=releye

# API Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://releye.boestad.com
```

Save and close (Ctrl+X, Y, Enter).

### 3.5 Test the API

```bash
# Test run the API
cd /var/www/releye-api
node server.js
```

You should see:
```
✅ MySQL database connected successfully
✅ RelEye API server running on port 3000
✅ Database: MySQL
✅ CORS Origin: https://releye.boestad.com
✅ Environment: production
```

Press Ctrl+C to stop. If there are errors, check:
- MySQL is running: `sudo systemctl status mysql`
- Database credentials in `.env` are correct
- Database exists: `mysql -u releye_user -p -e "SHOW DATABASES;"`

## Step 4: Set Up API as System Service

### 4.1 Create Systemd Service File

```bash
sudo nano /etc/systemd/system/releye-api.service
```

Add this content:

```ini
[Unit]
Description=RelEye Backend API Server
Documentation=https://github.com/yourusername/releye
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/releye-api
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/releye-api/.env
ExecStart=/usr/bin/node /var/www/releye-api/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=releye-api

[Install]
WantedBy=multi-user.target
```

### 4.2 Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/releye-api
sudo chmod 600 /var/www/releye-api/.env
```

### 4.3 Start the Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start the service
sudo systemctl start releye-api

# Enable auto-start on boot
sudo systemctl enable releye-api

# Check status
sudo systemctl status releye-api
```

You should see "active (running)" in green.

### 4.4 View Logs

```bash
# View real-time logs
sudo journalctl -u releye-api -f

# View last 100 lines
sudo journalctl -u releye-api -n 100
```

## Step 5: Install and Configure Nginx

### 5.1 Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/releye
```

Add this content:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name releye.boestad.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name releye.boestad.com;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/releye.boestad.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/releye.boestad.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Frontend - Serve React Static Files
    location / {
        root /var/www/releye/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API - Proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        
        # Proxy headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    
    # Robots.txt
    location = /robots.txt {
        log_not_found off;
        access_log off;
    }
    
    # Logging
    access_log /var/log/nginx/releye-access.log;
    error_log /var/log/nginx/releye-error.log;
}
```

### 5.3 Enable the Site

```bash
# Test configuration
sudo nginx -t

# If test passes, enable the site
sudo ln -s /etc/nginx/sites-available/releye /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Restart Nginx
sudo systemctl restart nginx
```

## Step 6: Install SSL Certificate

### 6.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d releye.boestad.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service: **YES**
- Share email with EFF: Your choice
- Redirect HTTP to HTTPS: **2** (recommended)

### 6.3 Test SSL Renewal

```bash
sudo certbot renew --dry-run
```

The certificate will auto-renew via cron job.

## Step 7: Deploy Frontend

### 7.1 Build Frontend

On your local machine:

```bash
# Make sure you're in the project root
cd /workspaces/spark-template

# Build for production
npm run build
```

This creates a `dist` folder with the compiled frontend.

### 7.2 Copy Frontend to Server

```bash
# Create directory on server
sudo mkdir -p /var/www/releye/dist

# From your local machine, copy the dist folder:
scp -r dist/* your-server:/tmp/releye-dist/

# On the server, move files:
sudo mv /tmp/releye-dist/* /var/www/releye/dist/
sudo chown -R www-data:www-data /var/www/releye
```

## Step 8: Test Everything

### 8.1 Test API Health

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

### 8.2 Test First-Time Setup

```bash
curl https://releye.boestad.com/api/auth/first-time
```

Expected response:
```json
{
  "success": true,
  "data": {
    "isFirstTime": true
  }
}
```

### 8.3 Test Frontend

1. Open https://releye.boestad.com in your browser
2. You should see the RelEye landing page
3. Click "Generate New Network" or "Load Existing Network"
4. You should be prompted for first-time admin setup (username: admin)

### 8.4 Test Multi-Device

1. Create admin account in Browser 1
2. Open https://releye.boestad.com in Browser 2 (or different computer)
3. You should see the login screen (NOT first-time setup)
4. Login with admin credentials

## Troubleshooting

### Issue: "Unable to connect to server"

**Check API is running:**
```bash
sudo systemctl status releye-api
```

**Check API logs:**
```bash
sudo journalctl -u releye-api -n 100 --no-pager
```

**Test API directly:**
```bash
curl http://localhost:3000/api/health
```

### Issue: "Setup failed to set key"

This means frontend can't reach the backend API.

**Check browser console:**
- Open Developer Tools (F12)
- Look for errors in Console tab
- Look for failed requests in Network tab

**Verify API is accessible:**
```bash
curl https://releye.boestad.com/api/health
```

**Check Nginx configuration:**
```bash
sudo nginx -t
sudo cat /etc/nginx/sites-enabled/releye
```

**Check CORS settings:**
```bash
cat /var/www/releye-api/.env | grep CORS
```

### Issue: Database Connection Failed

**Check MySQL is running:**
```bash
sudo systemctl status mysql
```

**Test database connection:**
```bash
mysql -u releye_user -p releye -e "SELECT 1;"
```

**Check API environment variables:**
```bash
sudo cat /var/www/releye-api/.env
```

**View API logs for database errors:**
```bash
sudo journalctl -u releye-api -n 100 | grep -i mysql
```

### Issue: First-Time Setup Reappears

This means the admin user isn't persisting in the database.

**Check if admin was created:**
```bash
mysql -u releye_user -p releye -e "SELECT * FROM users WHERE role='admin';"
```

**If empty, check API logs during admin creation:**
```bash
sudo journalctl -u releye-api -f
```
Then try creating admin again while watching logs.

### Issue: 502 Bad Gateway

**API is not running:**
```bash
sudo systemctl restart releye-api
sudo systemctl status releye-api
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/releye-error.log
```

## Maintenance

### View API Logs

```bash
# Real-time logs
sudo journalctl -u releye-api -f

# Last 100 lines
sudo journalctl -u releye-api -n 100

# Search for errors
sudo journalctl -u releye-api | grep -i error
```

### Restart Services

```bash
# Restart API
sudo systemctl restart releye-api

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Database Backup

```bash
# Create backup directory
sudo mkdir -p /var/backups/releye

# Backup database
sudo mysqldump -u releye_user -p releye > /var/backups/releye/backup-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip /var/backups/releye/backup-*.sql
```

### Database Restore

```bash
# Restore from backup
mysql -u releye_user -p releye < /var/backups/releye/backup-20240101-120000.sql
```

### Update Backend Code

```bash
cd /var/www/releye-api

# Backup current version
sudo cp server.js server.js.backup

# Update code (copy new server.js)
# ...

# Install any new dependencies
sudo npm install

# Restart service
sudo systemctl restart releye-api

# Check logs
sudo journalctl -u releye-api -f
```

### Update Frontend

```bash
# Build new version locally
npm run build

# Copy to server
scp -r dist/* your-server:/tmp/releye-dist/

# On server
sudo rm -rf /var/www/releye/dist/*
sudo mv /tmp/releye-dist/* /var/www/releye/dist/
sudo chown -R www-data:www-data /var/www/releye

# Clear browser cache when testing
```

### Monitor Server

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check all services
systemctl status nginx releye-api mysql
```

## Security Best Practices

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Secure MySQL

```bash
# Only allow local connections
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Ensure this line exists:
```
bind-address = 127.0.0.1
```

Then restart:
```bash
sudo systemctl restart mysql
```

### 3. Secure Environment Files

```bash
# Restrict .env file permissions
sudo chmod 600 /var/www/releye-api/.env
sudo chown www-data:www-data /var/www/releye-api/.env
```

### 4. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/releye-api
sudo npm update
```

### 5. Monitor Logs

```bash
# Check for suspicious activity
sudo journalctl -u releye-api | grep -i "failed"
sudo tail -f /var/log/nginx/releye-access.log
```

## Performance Optimization

### 1. Enable Nginx Caching

Add to Nginx config (inside `http` block):

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;
```

### 2. Enable Gzip Compression

Add to Nginx config:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 3. MySQL Optimization

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add/modify:
```ini
[mysqld]
max_connections = 100
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
```

Restart:
```bash
sudo systemctl restart mysql
```

## API Endpoints Reference

### Authentication
- `GET /api/health` - Check API health
- `GET /api/auth/first-time` - Check if first-time setup needed
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `POST /api/users` - Create new user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Invitations
- `GET /api/invites` - Get all invites (admin only)
- `GET /api/invites/:token` - Get invite by token
- `POST /api/invites` - Create new invite (admin only)
- `DELETE /api/invites/:token` - Revoke invite (admin only)
- `POST /api/invites/cleanup` - Clean up expired invites

### Activity Log
- `GET /api/activity?limit=100&offset=0` - Get activity log (admin only)

### Admin
- `POST /api/admin/reset` - Reset all data (requires confirmation token)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review logs: `sudo journalctl -u releye-api -n 200`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/releye-error.log`
4. Test each component independently

## Success Checklist

- [ ] MySQL installed and running
- [ ] Database created and schema imported
- [ ] Node.js installed
- [ ] Backend API deployed and running as service
- [ ] Nginx installed and configured
- [ ] SSL certificate installed and working
- [ ] Frontend deployed and accessible
- [ ] API health check returns success
- [ ] First-time setup works
- [ ] Admin can login
- [ ] Login persists across different browsers/computers
- [ ] Network files can be created and loaded
- [ ] Firewall configured
- [ ] Backups configured

Congratulations! Your RelEye application with MySQL backend is now deployed at https://releye.boestad.com! 🎉
