#!/bin/bash

# =============================================================================
# RelEye - Backend Deployment Script for DigitalOcean/VPS
# =============================================================================
# This script automates the backend API deployment on a fresh Ubuntu server
# 
# Usage:
#   1. Upload this script to your server: scp deploy-backend.sh user@server:/tmp/
#   2. SSH into server: ssh user@server
#   3. Run script: bash /tmp/deploy-backend.sh
#
# Requirements:
#   - Ubuntu 20.04+ or Debian 10+
#   - Root or sudo access
#   - Database password for lpmjclyqtt_releye_user
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Configuration
# =============================================================================
APP_NAME="releye-api"
APP_DIR="/var/www/releye-backend"
NODE_VERSION="18"
DOMAIN="api.releye.boestad.com"
DB_HOST="releye.boestad.com"
DB_NAME="lpmjclyqtt_releye"
DB_USER="lpmjclyqtt_releye_user"

# =============================================================================
# Helper Functions
# =============================================================================
print_step() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# =============================================================================
# Check if running as root
# =============================================================================
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

print_step "RelEye Backend Deployment"
echo "This script will install and configure:"
echo "  • Node.js $NODE_VERSION"
echo "  • PM2 process manager"
echo "  • Nginx reverse proxy"
echo "  • SSL certificate (Let's Encrypt)"
echo "  • RelEye API server"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# =============================================================================
# Step 1: Update System
# =============================================================================
print_step "Step 1: Updating System"

apt-get update
apt-get upgrade -y
print_success "System updated"

# =============================================================================
# Step 2: Install Node.js
# =============================================================================
print_step "Step 2: Installing Node.js $NODE_VERSION"

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    INSTALLED_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$INSTALLED_VERSION" -ge "$NODE_VERSION" ]; then
        print_success "Node.js $(node -v) already installed"
    else
        print_warning "Node.js version too old, updating..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi

print_success "Node.js $(node -v) installed"
print_success "npm $(npm -v) installed"

# =============================================================================
# Step 3: Install PM2
# =============================================================================
print_step "Step 3: Installing PM2"

if command -v pm2 &> /dev/null; then
    print_success "PM2 already installed"
else
    npm install -g pm2
    print_success "PM2 installed"
fi

# =============================================================================
# Step 4: Create Application Directory
# =============================================================================
print_step "Step 4: Setting Up Application Directory"

mkdir -p $APP_DIR
cd $APP_DIR

print_success "Application directory created: $APP_DIR"

# =============================================================================
# Step 5: Get Database Password
# =============================================================================
print_step "Step 5: Database Configuration"

echo "Please enter the database password for $DB_USER:"
read -s DB_PASSWORD
echo ""

# Verify database connection
print_warning "Testing database connection..."
if command -v mysql &> /dev/null; then
    if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        echo "Please ensure:"
        echo "  1. Database password is correct"
        echo "  2. Remote MySQL access is enabled in Spaceship cPanel"
        echo "  3. This server's IP is whitelisted in MySQL remote hosts"
        exit 1
    fi
else
    print_warning "MySQL client not installed, skipping connection test"
fi

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# =============================================================================
# Step 6: Create Backend Files
# =============================================================================
print_step "Step 6: Creating Backend Files"

# Create package.json
cat > package.json << 'EOFPACKAGE'
{
  "name": "releye-backend",
  "version": "1.0.0",
  "description": "RelEye Backend API with MySQL",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mysql2": "^3.6.0",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOFPACKAGE

print_success "package.json created"

# Create .env file
cat > .env << EOFENV
# Database Configuration
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://releye.boestad.com

# Security
JWT_SECRET=$JWT_SECRET

# Session timeout (7 days in milliseconds)
SESSION_TIMEOUT=604800000
EOFENV

print_success ".env file created"

print_warning "Now you need to upload the server.js file"
echo "From your local machine, run:"
echo "  scp api-server-mysql.js root@$(hostname -I | awk '{print $1}'):$APP_DIR/server.js"
echo ""
read -p "Press Enter when you have uploaded server.js..."

# Verify server.js exists
if [ ! -f "server.js" ]; then
    print_error "server.js not found!"
    echo "Please upload api-server-mysql.js to $APP_DIR/server.js"
    exit 1
fi

print_success "server.js found"

# =============================================================================
# Step 7: Install Dependencies
# =============================================================================
print_step "Step 7: Installing Dependencies"

npm install
print_success "Dependencies installed"

# =============================================================================
# Step 8: Start Application with PM2
# =============================================================================
print_step "Step 8: Starting Application"

# Stop if already running
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start application
pm2 start server.js --name $APP_NAME
pm2 save
pm2 startup | tail -n 1 | bash

print_success "Application started with PM2"

# Test if app is responding
sleep 2
if curl -s http://localhost:3000/api/health > /dev/null; then
    print_success "Application is responding on port 3000"
else
    print_error "Application is not responding!"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# =============================================================================
# Step 9: Install and Configure Nginx
# =============================================================================
print_step "Step 9: Installing Nginx"

apt-get install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/$APP_NAME << EOFNGINX
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOFNGINX

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

print_success "Nginx configured and started"

# =============================================================================
# Step 10: Configure Firewall
# =============================================================================
print_step "Step 10: Configuring Firewall"

# Install and configure UFW if not already installed
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
fi

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "Firewall configured"

# =============================================================================
# Step 11: Install SSL Certificate
# =============================================================================
print_step "Step 11: Installing SSL Certificate"

apt-get install -y certbot python3-certbot-nginx

echo ""
echo "To install SSL certificate, run:"
echo "  certbot --nginx -d $DOMAIN"
echo ""
read -p "Install SSL certificate now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN
    print_success "SSL certificate installed"
else
    print_warning "Remember to install SSL certificate later!"
fi

# =============================================================================
# Deployment Complete
# =============================================================================
print_step "Deployment Complete!"

SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}✓ Backend API deployed successfully!${NC}"
echo ""
echo "Server Details:"
echo "  • Server IP: $SERVER_IP"
echo "  • Application: $APP_DIR"
echo "  • Domain: $DOMAIN"
echo "  • API Health: http://$DOMAIN/api/health"
echo ""
echo "Database Configuration:"
echo "  • Host: $DB_HOST"
echo "  • Database: $DB_NAME"
echo "  • User: $DB_USER"
echo ""
echo "Next Steps:"
echo "  1. Configure DNS:"
echo "     Type: A"
echo "     Host: api"
echo "     Value: $SERVER_IP"
echo ""
echo "  2. Test API health:"
echo "     curl http://$DOMAIN/api/health"
echo ""
echo "  3. Update frontend API URL in src/lib/cloudAPI.ts:"
echo "     https://$DOMAIN/api"
echo ""
echo "  4. Monitor application:"
echo "     pm2 status"
echo "     pm2 logs $APP_NAME"
echo "     pm2 monit"
echo ""
echo "Security Notes:"
echo "  • Default admin password: admin/admin"
echo "  • ⚠️  Change immediately after first login!"
echo "  • JWT secret generated and stored in .env"
echo "  • Firewall enabled (ports 22, 80, 443)"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  • Add this server's IP to MySQL remote hosts in Spaceship cPanel"
echo "  • Configure DNS A record for $DOMAIN"
echo "  • Run database setup script in phpMyAdmin"
echo ""
