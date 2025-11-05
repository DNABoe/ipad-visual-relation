#!/bin/bash

# RelEye Backend Deployment Script for releye.boestad.com
# This script automates the deployment of the backend API

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="releye.boestad.com"
DB_NAME="releye"
DB_USER="releye_user"
API_DIR="/var/www/releye-api"
FRONTEND_DIR="/var/www/releye"
SERVICE_NAME="releye-api"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}RelEye Backend Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}" 
   exit 1
fi

# Prompt for database password
echo -e "${YELLOW}Enter a secure password for the PostgreSQL database:${NC}"
read -s DB_PASSWORD
echo ""
echo -e "${YELLOW}Confirm password:${NC}"
read -s DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Passwords do not match!${NC}"
    exit 1
fi

if [ ${#DB_PASSWORD} -lt 12 ]; then
    echo -e "${RED}Password must be at least 12 characters long!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Password set${NC}"
echo ""

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Install PostgreSQL
echo -e "${YELLOW}Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL already installed${NC}"
fi
echo ""

# Install Node.js
echo -e "${YELLOW}Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js installed (version: $(node -v))${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed (version: $(node -v))${NC}"
fi
echo ""

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi
echo ""

# Install Certbot
echo -e "${YELLOW}Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi
echo ""

# Create database and user
echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
-- Drop existing database if exists (be careful!)
-- DROP DATABASE IF EXISTS $DB_NAME;
-- DROP USER IF EXISTS $DB_USER;

-- Create database and user
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

echo -e "${GREEN}✓ Database created${NC}"
echo ""

# Create database tables
echo -e "${YELLOW}Creating database tables...${NC}"
sudo -u postgres psql -d $DB_NAME << 'EOF'
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

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

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);
EOF

# Grant permissions
sudo -u postgres psql -d $DB_NAME << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
EOF

echo -e "${GREEN}✓ Database tables created${NC}"
echo ""

# Create API directory
echo -e "${YELLOW}Setting up API server...${NC}"
mkdir -p $API_DIR
cd $API_DIR

# Check if server files exist in current directory
if [ -f "$(dirname "$0")/api-server-example.js" ]; then
    cp "$(dirname "$0")/api-server-example.js" $API_DIR/server.js
    cp "$(dirname "$0")/api-package.json" $API_DIR/package.json
    echo -e "${GREEN}✓ Server files copied${NC}"
else
    echo -e "${RED}Error: api-server-example.js not found!${NC}"
    echo -e "${YELLOW}Please ensure the deployment files are in the current directory.${NC}"
    exit 1
fi

# Install dependencies
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create environment file
cat > $API_DIR/.env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://$DOMAIN
EOF

chmod 600 $API_DIR/.env
chown -R www-data:www-data $API_DIR
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=RelEye Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$API_DIR
Environment="NODE_ENV=production"
EnvironmentFile=$API_DIR/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

sleep 2

if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✓ API service started${NC}"
else
    echo -e "${RED}✗ API service failed to start${NC}"
    echo -e "${YELLOW}Checking logs:${NC}"
    journalctl -u $SERVICE_NAME -n 20 --no-pager
    exit 1
fi
echo ""

# Test API
echo -e "${YELLOW}Testing API...${NC}"
sleep 2
if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
    journalctl -u $SERVICE_NAME -n 20 --no-pager
    exit 1
fi
echo ""

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/releye << 'NGINX_EOF'
server {
    listen 80;
    server_name releye.boestad.com;
    
    # Redirect HTTP to HTTPS (will be updated by certbot)
    location / {
        root /var/www/releye/dist;
        try_files $uri $uri/ /index.html;
    }
    
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/releye /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    systemctl restart nginx
    echo -e "${GREEN}✓ Nginx configured${NC}"
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    exit 1
fi
echo ""

# Create frontend directory
mkdir -p $FRONTEND_DIR/dist
chown -R www-data:www-data $FRONTEND_DIR

# Set up SSL
echo -e "${YELLOW}Setting up SSL certificate...${NC}"
echo -e "${YELLOW}Note: You'll need to enter your email and agree to the terms.${NC}"
echo ""
read -p "Would you like to set up SSL now with Certbot? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN
    echo -e "${GREEN}✓ SSL configured${NC}"
else
    echo -e "${YELLOW}! SSL setup skipped. Run 'sudo certbot --nginx -d $DOMAIN' manually later.${NC}"
fi
echo ""

# Final summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo ""
echo -e "1. ${YELLOW}Build your frontend:${NC}"
echo -e "   npm run build"
echo ""
echo -e "2. ${YELLOW}Upload frontend files to server:${NC}"
echo -e "   scp -r dist/* your_username@$DOMAIN:$FRONTEND_DIR/dist/"
echo ""
echo -e "3. ${YELLOW}Test the API:${NC}"
echo -e "   curl https://$DOMAIN/api/health"
echo ""
echo -e "4. ${YELLOW}Open your browser:${NC}"
echo -e "   https://$DOMAIN"
echo ""
echo -e "${GREEN}Service Management:${NC}"
echo -e "  View logs:       sudo journalctl -u $SERVICE_NAME -f"
echo -e "  Restart API:     sudo systemctl restart $SERVICE_NAME"
echo -e "  Status:          sudo systemctl status $SERVICE_NAME"
echo ""
echo -e "${GREEN}Database:${NC}"
echo -e "  Connect:         sudo -u postgres psql -d $DB_NAME"
echo -e "  Backup:          sudo -u postgres pg_dump $DB_NAME > backup.sql"
echo ""
echo -e "${YELLOW}Important: Save your database password securely!${NC}"
echo ""
