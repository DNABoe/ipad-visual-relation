# Deploy RelEye Backend to releye.boestad.com

## Quick Deployment Guide

This guide will help you deploy the backend API to your server at releye.boestad.com.

## Prerequisites

- SSH access to your server
- Domain name pointing to your server IP (releye.boestad.com)
- Root or sudo access on the server

## Option 1: Automated Deployment Script (Recommended)

### Step 1: Prepare Your Server

SSH into your server:
```bash
ssh your_username@releye.boestad.com
```

### Step 2: Download Deployment Package

On your server, download the deployment package:
```bash
cd ~
# Upload the deployment package from your local machine
# Or clone from git if you have it in a repository
```

### Step 3: Run the Deployment Script

```bash
chmod +x deploy-backend.sh
sudo ./deploy-backend.sh
```

The script will:
- ✅ Install PostgreSQL and Node.js
- ✅ Create the database and tables
- ✅ Install and configure the API server
- ✅ Set up the systemd service
- ✅ Configure Nginx reverse proxy
- ✅ Set up SSL with Let's Encrypt
- ✅ Test all endpoints

### Step 4: Configure Environment

Edit the configuration:
```bash
sudo nano /var/www/releye-api/.env
```

Update these values:
```env
DATABASE_URL=postgresql://releye_user:YOUR_SECURE_PASSWORD@localhost:5432/releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://releye.boestad.com
```

### Step 5: Restart Services

```bash
sudo systemctl restart releye-api
sudo systemctl restart nginx
```

## Option 2: Manual Deployment

If you prefer to deploy manually, follow these steps:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Set Up Database

```bash
# Create database user and database
sudo -u postgres psql << EOF
CREATE DATABASE releye;
CREATE USER releye_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE releye TO releye_user;
ALTER DATABASE releye OWNER TO releye_user;
\q
EOF

# Create tables
sudo -u postgres psql -d releye << 'EOF'
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  password_hash_hash VARCHAR(512) NOT NULL,
  password_hash_salt VARCHAR(512) NOT NULL,
  password_hash_iterations INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  last_login BIGINT,
  login_count INTEGER DEFAULT 0,
  can_investigate BOOLEAN DEFAULT FALSE,
  encrypted_api_key TEXT,
  api_key_salt VARCHAR(512)
);

CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE TABLE IF NOT EXISTS invites (
  invite_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token VARCHAR(512) UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(LOWER(email));
CREATE INDEX idx_invites_expires_at ON invites(expires_at);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO releye_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO releye_user;
EOF
```

### 3. Deploy API Server

```bash
# Create application directory
sudo mkdir -p /var/www/releye-api
cd /var/www/releye-api

# Copy server files (you'll need to upload these from your local machine)
# - api-server-example.js → server.js
# - api-package.json → package.json

# Install dependencies
sudo npm install

# Create environment file
sudo nano .env
```

Add to `.env`:
```env
DATABASE_URL=postgresql://releye_user:YOUR_SECURE_PASSWORD@localhost:5432/releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://releye.boestad.com
```

Set permissions:
```bash
sudo chmod 600 .env
sudo chown -R www-data:www-data /var/www/releye-api
```

### 4. Create Systemd Service

```bash
sudo nano /etc/systemd/system/releye-api.service
```

Add:
```ini
[Unit]
Description=RelEye Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/releye-api
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/releye-api/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable releye-api
sudo systemctl start releye-api
sudo systemctl status releye-api
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/releye
```

Add:
```nginx
server {
    listen 80;
    server_name releye.boestad.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name releye.boestad.com;
    
    # SSL will be configured by certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend (static files)
    location / {
        root /var/www/releye/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/releye /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Set Up SSL

```bash
sudo certbot --nginx -d releye.boestad.com
```

Follow the prompts to configure SSL.

### 7. Deploy Frontend

On your local machine, build the frontend:
```bash
npm run build
```

Upload the `dist` folder to your server:
```bash
scp -r dist/* your_username@releye.boestad.com:/var/www/releye/dist/
```

On the server, set permissions:
```bash
sudo chown -R www-data:www-data /var/www/releye
```

## Testing Your Deployment

### 1. Test API Health

```bash
curl https://releye.boestad.com/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### 2. Test First-Time Setup

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

### 3. Test Frontend

Open https://releye.boestad.com in your browser. You should see the First Time Setup screen.

## Troubleshooting

### API Not Starting

```bash
# Check logs
sudo journalctl -u releye-api -n 50 --no-pager

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart API
sudo systemctl restart releye-api
```

### Database Connection Issues

```bash
# Test database connection
sudo -u postgres psql -d releye -c "SELECT COUNT(*) FROM users;"

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Frontend Can't Reach API

1. Check browser console for CORS errors
2. Verify CORS_ORIGIN in `/var/www/releye-api/.env` matches your domain
3. Test API directly: `https://releye.boestad.com/api/health`
4. Check Nginx proxy configuration

## Maintenance

### View Logs

```bash
# API logs
sudo journalctl -u releye-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Backup Database

```bash
# Create backup
sudo -u postgres pg_dump releye > ~/releye_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
sudo -u postgres psql releye < ~/releye_backup_20240101_120000.sql
```

### Update Backend

```bash
# Upload new server.js file
# Then:
sudo systemctl restart releye-api
```

### Update Frontend

```bash
# Build locally
npm run build

# Upload to server
scp -r dist/* your_username@releye.boestad.com:/var/www/releye/dist/

# Clear Nginx cache (if any)
sudo systemctl reload nginx
```

## Security Checklist

- [ ] Changed default PostgreSQL password to a strong password
- [ ] `.env` file has restricted permissions (600)
- [ ] SSL/HTTPS is properly configured
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Database only accepts local connections
- [ ] Regular backups configured
- [ ] System updates automated
- [ ] Logs are being monitored

## Firewall Configuration (Optional but Recommended)

```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Monitoring (Optional)

Set up basic monitoring:

```bash
# Install monitoring tools
sudo apt install htop iotop

# Check system resources
htop

# Check disk usage
df -h

# Check database size
sudo -u postgres psql -d releye -c "SELECT pg_size_pretty(pg_database_size('releye'));"
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review all logs (API, Nginx, PostgreSQL)
3. Test each component individually
4. Verify all environment variables are correct
5. Ensure all services are running

## Quick Reference Commands

```bash
# Service status
sudo systemctl status releye-api
sudo systemctl status postgresql
sudo systemctl status nginx

# Restart services
sudo systemctl restart releye-api
sudo systemctl restart postgresql
sudo systemctl restart nginx

# View logs
sudo journalctl -u releye-api -f
sudo tail -f /var/log/nginx/error.log

# Test endpoints
curl https://releye.boestad.com/api/health
curl https://releye.boestad.com/api/auth/first-time

# Database access
sudo -u postgres psql -d releye
```
