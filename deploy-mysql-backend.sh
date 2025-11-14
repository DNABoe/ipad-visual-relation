#!/bin/bash

# RelEye MySQL Backend Deployment Script
# This script automates the deployment of RelEye with MySQL backend

set -e  # Exit on any error

echo "========================================="
echo "RelEye MySQL Backend Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}✓${NC} Running as root"

# Check if on Ubuntu/Debian
if ! [ -f /etc/debian_version ]; then
    echo -e "${RED}This script is designed for Ubuntu/Debian systems${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Ubuntu/Debian detected"

# Get configuration from user
echo ""
echo "Please provide configuration details:"
echo ""

read -p "MySQL root password (will be set): " MYSQL_ROOT_PASSWORD
read -p "MySQL releye_user password: " DB_PASSWORD
read -p "Domain name (e.g., releye.boestad.com): " DOMAIN_NAME
read -p "Admin email for SSL certificate: " ADMIN_EMAIL

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  MySQL root password: ****"
echo "  Database password: ****"
echo "  Admin email: $ADMIN_EMAIL"
echo ""
read -p "Continue with installation? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 1
fi

# Update system
echo ""
echo "========================================="
echo "Step 1: Updating system packages"
echo "========================================="
apt update
apt upgrade -y
echo -e "${GREEN}✓${NC} System updated"

# Install MySQL
echo ""
echo "========================================="
echo "Step 2: Installing MySQL"
echo "========================================="

if ! command -v mysql &> /dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt install -y mysql-server
    
    # Secure MySQL installation
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='';"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS test;"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;"
    
    systemctl enable mysql
    systemctl start mysql
    echo -e "${GREEN}✓${NC} MySQL installed and secured"
else
    echo -e "${YELLOW}!${NC} MySQL already installed"
fi

# Create database and user
echo ""
echo "Creating database and user..."
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS releye CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'releye_user'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON releye.* TO 'releye_user'@'localhost';
FLUSH PRIVILEGES;
EOF
echo -e "${GREEN}✓${NC} Database created"

# Import schema
echo ""
echo "Importing database schema..."
if [ -f "database-setup-mysql.sql" ]; then
    mysql -u releye_user -p"${DB_PASSWORD}" releye < database-setup-mysql.sql
    echo -e "${GREEN}✓${NC} Schema imported"
else
    echo -e "${RED}✗${NC} database-setup-mysql.sql not found!"
    exit 1
fi

# Install Node.js
echo ""
echo "========================================="
echo "Step 3: Installing Node.js"
echo "========================================="

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓${NC} Node.js installed"
else
    echo -e "${YELLOW}!${NC} Node.js already installed"
fi

node --version
npm --version

# Deploy backend API
echo ""
echo "========================================="
echo "Step 4: Deploying Backend API"
echo "========================================="

mkdir -p /var/www/releye-api
cd /var/www/releye-api

# Copy files
if [ -f "../api-server-mysql.js" ]; then
    cp ../api-server-mysql.js server.js
else
    echo -e "${RED}✗${NC} api-server-mysql.js not found!"
    exit 1
fi

if [ -f "../api-package-mysql.json" ]; then
    cp ../api-package-mysql.json package.json
else
    echo -e "${RED}✗${NC} api-package-mysql.json not found!"
    exit 1
fi

# Create .env file
cat > .env <<EOF
DB_HOST=localhost
DB_USER=releye_user
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://${DOMAIN_NAME}
EOF

chmod 600 .env

# Install dependencies
npm install
echo -e "${GREEN}✓${NC} Backend API deployed"

# Create systemd service
echo ""
echo "Creating systemd service..."
cat > /etc/systemd/system/releye-api.service <<EOF
[Unit]
Description=RelEye Backend API Server
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
EOF

# Set permissions
chown -R www-data:www-data /var/www/releye-api

# Start service
systemctl daemon-reload
systemctl enable releye-api
systemctl start releye-api

sleep 2

if systemctl is-active --quiet releye-api; then
    echo -e "${GREEN}✓${NC} API service started"
else
    echo -e "${RED}✗${NC} API service failed to start"
    journalctl -u releye-api -n 50
    exit 1
fi

# Install Nginx
echo ""
echo "========================================="
echo "Step 5: Installing Nginx"
echo "========================================="

if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓${NC} Nginx installed"
else
    echo -e "${YELLOW}!${NC} Nginx already installed"
fi

# Configure Nginx
echo ""
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/releye <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_NAME};
    
    # SSL will be configured by Certbot
    
    location / {
        root /var/www/releye/dist;
        try_files \$uri \$uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    access_log /var/log/nginx/releye-access.log;
    error_log /var/log/nginx/releye-error.log;
}
EOF

ln -sf /etc/nginx/sites-available/releye /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
echo -e "${GREEN}✓${NC} Nginx configured"

# Install Certbot
echo ""
echo "========================================="
echo "Step 6: Installing SSL Certificate"
echo "========================================="

if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

echo ""
echo "Obtaining SSL certificate..."
certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email ${ADMIN_EMAIL}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} SSL certificate installed"
else
    echo -e "${YELLOW}!${NC} SSL certificate installation failed or skipped"
    echo "You can run this manually: sudo certbot --nginx -d ${DOMAIN_NAME}"
fi

# Setup firewall
echo ""
echo "========================================="
echo "Step 7: Configuring Firewall"
echo "========================================="

if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force reload
    echo -e "${GREEN}✓${NC} Firewall configured"
else
    echo -e "${YELLOW}!${NC} UFW not installed, skipping firewall setup"
fi

# Test API
echo ""
echo "========================================="
echo "Step 8: Testing Installation"
echo "========================================="

echo ""
echo "Testing API health..."
sleep 2

RESPONSE=$(curl -s http://localhost:3000/api/health || echo "failed")

if [[ $RESPONSE == *"\"success\":true"* ]]; then
    echo -e "${GREEN}✓${NC} API health check passed"
else
    echo -e "${RED}✗${NC} API health check failed"
    echo "Response: $RESPONSE"
    journalctl -u releye-api -n 20
fi

# Final instructions
echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo -e "${GREEN}✓${NC} MySQL installed and configured"
echo -e "${GREEN}✓${NC} Backend API running on port 3000"
echo -e "${GREEN}✓${NC} Nginx configured as reverse proxy"
echo -e "${GREEN}✓${NC} SSL certificate installed"
echo ""
echo "Next steps:"
echo ""
echo "1. Build your frontend:"
echo "   cd /path/to/your/project"
echo "   npm run build"
echo ""
echo "2. Deploy frontend files:"
echo "   sudo mkdir -p /var/www/releye/dist"
echo "   sudo cp -r dist/* /var/www/releye/dist/"
echo "   sudo chown -R www-data:www-data /var/www/releye"
echo ""
echo "3. Test your application:"
echo "   https://${DOMAIN_NAME}"
echo ""
echo "Useful commands:"
echo "  - View API logs: sudo journalctl -u releye-api -f"
echo "  - Restart API: sudo systemctl restart releye-api"
echo "  - Check status: sudo systemctl status releye-api"
echo "  - Test API: curl https://${DOMAIN_NAME}/api/health"
echo ""
echo "Configuration stored in:"
echo "  - API: /var/www/releye-api/"
echo "  - Nginx: /etc/nginx/sites-available/releye"
echo "  - Service: /etc/systemd/system/releye-api.service"
echo ""
echo -e "${GREEN}Deployment successful!${NC}"
