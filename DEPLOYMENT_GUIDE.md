# RelEye Deployment Guide

Complete guide for deploying RelEye with cloud-based authentication at releye.boestad.com.

## Overview

RelEye consists of two main components:
1. **Frontend Application**: Static React app deployed via GitHub Pages
2. **Backend API**: Node.js/Express server for cloud authentication

## Prerequisites

- Domain: `releye.boestad.com`
- PostgreSQL database (or MongoDB)
- Node.js 18+ server
- SSL certificate for HTTPS
- Git repository

## Part 1: Backend API Deployment

### Step 1: Prepare the Server

SSH into your server at releye.boestad.com:

```bash
ssh user@releye.boestad.com
```

Create a directory for the API:

```bash
mkdir -p /var/www/releye-api
cd /var/www/releye-api
```

### Step 2: Set Up Database

Install PostgreSQL (if not already installed):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Create the database:

```bash
sudo -u postgres psql
CREATE DATABASE releye;
CREATE USER releye_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE releye TO releye_user;
\q
```

Run the schema setup:

```bash
psql -U releye_user -d releye -f database-setup.sql
```

### Step 3: Deploy API Code

Copy these files to your server:
- `api-server-example.js`
- `api-package.json` (rename to `package.json`)
- `api-env.example` (rename to `.env`)

Or clone from Git:

```bash
git clone https://github.com/yourusername/releye.git
cd releye
```

Install dependencies:

```bash
npm install
```

### Step 4: Configure Environment

Edit the `.env` file:

```bash
nano .env
```

Update with your values:

```env
DATABASE_URL=postgresql://releye_user:your_secure_password@localhost:5432/releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://releye.boestad.com
```

### Step 5: Set Up Process Manager

Install PM2 to keep the API running:

```bash
sudo npm install -g pm2
```

Start the API:

```bash
pm2 start api-server-example.js --name releye-api
pm2 save
pm2 startup
```

### Step 6: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/releye-api
```

Add configuration:

```nginx
server {
    listen 80;
    server_name releye.boestad.com;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/releye-frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/releye-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Set Up SSL with Let's Encrypt

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

Obtain SSL certificate:

```bash
sudo certbot --nginx -d releye.boestad.com
```

Certbot will automatically configure HTTPS in Nginx.

### Step 8: Test the API

```bash
curl https://releye.boestad.com/api/health
```

Expected response:
```json
{"success":true,"data":{"status":"ok"}}
```

## Part 2: Frontend Deployment

### Step 1: Build the Frontend

On your local machine:

```bash
cd /path/to/releye
npm install
npm run build
```

### Step 2: Deploy to Server

Copy the `dist` folder to your server:

```bash
rsync -avz dist/ user@releye.boestad.com:/var/www/releye-frontend/
```

Or use GitHub Pages:

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Set custom domain to `releye.boestad.com`
4. Add CNAME file with your domain

### Step 3: Configure DNS

Add DNS records for your domain:

**A Record:**
```
Type: A
Name: releye
Value: [Your server IP]
TTL: 3600
```

**CNAME Record (if using GitHub Pages):**
```
Type: CNAME
Name: releye
Value: yourusername.github.io
TTL: 3600
```

### Step 4: Verify Deployment

Visit `https://releye.boestad.com` in your browser. You should see the RelEye login screen.

## Part 3: First-Time Setup

### Step 1: Create Admin Account

1. Visit `https://releye.boestad.com`
2. You'll see the "First Time Setup" screen
3. Create your administrator account
4. Log in with your new credentials

### Step 2: Verify Cloud Storage

Check browser console (F12) for messages like:
```
[UserRegistry] Cloud storage: AVAILABLE ✓
```

If you see this, cloud authentication is working!

## Troubleshooting

### API Not Responding

Check if the API is running:
```bash
pm2 status
pm2 logs releye-api
```

Restart if needed:
```bash
pm2 restart releye-api
```

### Database Connection Issues

Test database connection:
```bash
psql -U releye_user -d releye -c "SELECT 1;"
```

Check database logs:
```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### CORS Errors

Verify CORS_ORIGIN in `.env` matches your frontend domain exactly:
```env
CORS_ORIGIN=https://releye.boestad.com
```

Restart API after changes:
```bash
pm2 restart releye-api
```

### Fallback to Local Storage

If cloud storage is unavailable, the app will automatically use localStorage. Check console for:
```
[UserRegistry] Cloud storage check failed, using local storage
```

This is expected behavior and ensures the app continues working.

## Monitoring

### View API Logs
```bash
pm2 logs releye-api
```

### Monitor API Performance
```bash
pm2 monit
```

### Database Query Logs

Enable query logging in PostgreSQL:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Add:
```
log_statement = 'all'
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Backup Strategy

### Database Backup

Create a backup script:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U releye_user releye > /backups/releye_$TIMESTAMP.sql
find /backups -name "releye_*.sql" -mtime +7 -delete
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup-script.sh
```

### API Code Backup

Your API code should be version controlled in Git. Tag releases:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Security Checklist

- [ ] Database uses strong password
- [ ] SSL certificate is valid and auto-renews
- [ ] API runs as non-root user
- [ ] Firewall blocks unnecessary ports
- [ ] Database accepts local connections only
- [ ] Regular backups are configured
- [ ] Logs are monitored for suspicious activity
- [ ] Dependencies are kept up to date

## Updates and Maintenance

### Update API Code

```bash
cd /var/www/releye-api
git pull
npm install
pm2 restart releye-api
```

### Update Frontend

```bash
npm run build
rsync -avz dist/ user@releye.boestad.com:/var/www/releye-frontend/
```

Or push to GitHub if using Pages.

### Update Dependencies

```bash
npm update
npm audit fix
```

## Support

For issues or questions:
- Check the [CLOUD_API_SETUP.md](./CLOUD_API_SETUP.md) for API details
- Review logs: `pm2 logs releye-api`
- Verify health endpoint: `curl https://releye.boestad.com/api/health`
