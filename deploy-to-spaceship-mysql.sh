#!/bin/bash

# RelEye Spaceship.com Deployment Script
# This script automates the deployment process for releye.boestad.com

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  RelEye Deployment to Spaceship.com (releye.boestad.com)"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="releye.boestad.com"
API_URL="https://${DOMAIN}/api"
BUILD_DIR="dist"
DEPLOY_DIR="deployment-package"
DEPLOY_ZIP="deployment-package.zip"

# Step 1: Verify prerequisites
echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Please install npm first.${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found. Are you in the project root?${NC}"
    exit 1
fi

if [ ! -d "php-backend" ]; then
    echo -e "${RED}✗ php-backend directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Step 2: Update API configuration
echo -e "${BLUE}[2/6]${NC} Configuring API endpoint..."

# Check if cloudAPI.ts exists and update it
if [ -f "src/lib/cloudAPI.ts" ]; then
    # Create backup
    cp src/lib/cloudAPI.ts src/lib/cloudAPI.ts.backup
    
    # Update API URL
    sed -i.bak "s|const API_BASE_URL = .*|const API_BASE_URL = '${API_URL}'|g" src/lib/cloudAPI.ts
    rm -f src/lib/cloudAPI.ts.bak
    
    echo -e "${GREEN}✓ API endpoint set to: ${API_URL}${NC}"
else
    echo -e "${YELLOW}⚠ cloudAPI.ts not found, skipping...${NC}"
fi

echo ""

# Step 3: Install dependencies
echo -e "${BLUE}[3/6]${NC} Installing dependencies..."

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

echo ""

# Step 4: Build frontend
echo -e "${BLUE}[4/6]${NC} Building production frontend..."

npm run build

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}✗ Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 5: Prepare deployment package
echo -e "${BLUE}[5/6]${NC} Preparing deployment package..."

# Clean up old deployment
rm -rf "$DEPLOY_DIR"
rm -f "$DEPLOY_ZIP"

# Create deployment directory structure
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/api"

# Copy frontend files
echo "  → Copying frontend files..."
cp -r $BUILD_DIR/* "$DEPLOY_DIR/"

# Copy backend files
echo "  → Copying backend files..."
cp php-backend/index.php "$DEPLOY_DIR/api/"
cp php-backend/config.php "$DEPLOY_DIR/api/"
cp php-backend/database.php "$DEPLOY_DIR/api/"
cp php-backend/helpers.php "$DEPLOY_DIR/api/"

# Create .htaccess for frontend
echo "  → Creating .htaccess files..."
cat > "$DEPLOY_DIR/.htaccess" << 'EOF'
# Enable URL rewriting
RewriteEngine On

# API routes
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ api/index.php?endpoint=$1 [QSA,L]

# Frontend routes - send all non-file requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable CORS for API
<FilesMatch "\.(php)$">
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</FilesMatch>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
EOF

# Create .htaccess for API
cat > "$DEPLOY_DIR/api/.htaccess" << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php?endpoint=$1 [QSA,L]

Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ index.php [L]
EOF

# Create deployment instructions
cat > "$DEPLOY_DIR/UPLOAD_INSTRUCTIONS.txt" << EOF
════════════════════════════════════════════════════════════════
  RelEye Deployment Package for ${DOMAIN}
════════════════════════════════════════════════════════════════

This package contains all files needed to deploy RelEye to your
Spaceship.com hosting.

IMPORTANT: Before uploading, configure your database settings!

════════════════════════════════════════════════════════════════
STEP 1: Configure Database Settings
════════════════════════════════════════════════════════════════

Edit the file: api/config.php

Update these values:
  - DB_PASS: Your actual MySQL database password
  - JWT_SECRET: A random secret key (generate one!)

To generate a secure JWT_SECRET:
  Option 1: Run: openssl rand -base64 32
  Option 2: Visit: https://www.grc.com/passwords.htm
  Option 3: Use any random 32+ character string

════════════════════════════════════════════════════════════════
STEP 2: Setup MySQL Database
════════════════════════════════════════════════════════════════

1. Log into Spaceship.com cPanel
2. Open phpMyAdmin
3. Select database: lpmjclyqtt_releye
4. Click "SQL" tab
5. Copy contents from: database-setup-mysql.sql (in project root)
6. Paste and click "Go"

This creates the required tables and default admin user.

════════════════════════════════════════════════════════════════
STEP 3: Upload Files to Server
════════════════════════════════════════════════════════════════

METHOD A: Using File Manager (Easiest)
---------------------------------------
1. Log into Spaceship.com cPanel
2. Open "File Manager"
3. Navigate to: public_html/
4. Delete old files (backup first!)
5. Upload ALL files from this deployment-package folder
6. Make sure structure looks like:
   public_html/
   ├── .htaccess
   ├── index.html
   ├── assets/
   └── api/
       ├── .htaccess
       ├── index.php
       ├── config.php
       └── ...

METHOD B: Using FTP
-------------------
1. Connect to: ftp.${DOMAIN}
2. Upload all files to: /public_html/
3. Verify file structure matches above

METHOD C: Using cPanel File Manager + Zip
------------------------------------------
1. Upload: deployment-package.zip to public_html/
2. Right-click → Extract
3. Move all files from deployment-package/ to public_html/
4. Delete the deployment-package/ folder

════════════════════════════════════════════════════════════════
STEP 4: Test Your Deployment
════════════════════════════════════════════════════════════════

1. Backend API Health Check:
   https://${DOMAIN}/api/health
   
   Should return:
   {"success":true,"data":{"status":"ok",...}}

2. Visit your site:
   https://${DOMAIN}
   
   Should show login page

3. Login with default admin:
   Username: admin
   Password: admin
   
   ⚠️ CHANGE THIS PASSWORD IMMEDIATELY!

════════════════════════════════════════════════════════════════
STEP 5: Post-Deployment Security
════════════════════════════════════════════════════════════════

1. Change admin password (in app settings)
2. Verify JWT_SECRET is set to random value in api/config.php
3. Set display_errors to 0 in api/config.php (for production)

════════════════════════════════════════════════════════════════
Troubleshooting
════════════════════════════════════════════════════════════════

Problem: "Database connection failed"
Solution: Check DB_PASS in api/config.php

Problem: "404 Not Found" on API calls
Solution: Verify .htaccess files are uploaded and mod_rewrite enabled

Problem: Blank page
Solution: Check PHP error logs in cPanel

Problem: CORS errors
Solution: Check CORS_ORIGIN in api/config.php matches your domain

════════════════════════════════════════════════════════════════

For complete documentation, see:
DEPLOY_TO_SPACESHIP_MYSQL.md in the project root

════════════════════════════════════════════════════════════════
EOF

echo -e "${GREEN}✓ Deployment package prepared${NC}"
echo ""

# Step 6: Create zip file
echo -e "${BLUE}[6/6]${NC} Creating deployment archive..."

cd "$DEPLOY_DIR"
zip -r "../$DEPLOY_ZIP" . > /dev/null
cd ..

echo -e "${GREEN}✓ Created ${DEPLOY_ZIP}${NC}"
echo ""

# Summary
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Deployment package ready!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📦 Package location:"
echo "   → ${DEPLOY_DIR}/ (folder)"
echo "   → ${DEPLOY_ZIP} (zip archive)"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. ${YELLOW}IMPORTANT:${NC} Edit api/config.php in deployment-package/"
echo "   - Set DB_PASS to your actual database password"
echo "   - Set JWT_SECRET to a random string"
echo ""
echo "2. Setup MySQL database:"
echo "   - Login to Spaceship cPanel → phpMyAdmin"
echo "   - Select database: lpmjclyqtt_releye"
echo "   - Run SQL from: database-setup-mysql.sql"
echo ""
echo "3. Upload to server:"
echo "   Option A: Upload ${DEPLOY_ZIP} to cPanel and extract"
echo "   Option B: Upload ${DEPLOY_DIR}/* via FTP"
echo "   Option C: Use cPanel File Manager"
echo ""
echo "4. Test deployment:"
echo "   → https://${DOMAIN}/api/health"
echo "   → https://${DOMAIN}"
echo ""
echo "📖 Full instructions:"
echo "   → See ${DEPLOY_DIR}/UPLOAD_INSTRUCTIONS.txt"
echo "   → See DEPLOY_TO_SPACESHIP_MYSQL.md"
echo ""
echo "════════════════════════════════════════════════════════════════"

# Restore config backup if exists
if [ -f "src/lib/cloudAPI.ts.backup" ]; then
    echo ""
    echo -e "${YELLOW}Note: Your original cloudAPI.ts has been modified.${NC}"
    echo -e "${YELLOW}Backup saved as: src/lib/cloudAPI.ts.backup${NC}"
    echo ""
    read -p "Restore original cloudAPI.ts? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv src/lib/cloudAPI.ts.backup src/lib/cloudAPI.ts
        echo -e "${GREEN}✓ Restored original cloudAPI.ts${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Deployment preparation complete!${NC}"
echo ""
