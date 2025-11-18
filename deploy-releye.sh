#!/bin/bash

# =============================================================================
# RelEye Complete Deployment Script
# =============================================================================
# This script will help you deploy the complete RelEye application
# including frontend and backend with MySQL database support.
#
# Prerequisites:
# - MySQL database already created at Spaceship.com
# - Database credentials available
# - A server for running Node.js backend (DigitalOcean, AWS, etc.)
# =============================================================================

set -e  # Exit on error

echo "=========================================="
echo "  RelEye Deployment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# Step 1: Verify Prerequisites
# =============================================================================
echo -e "${YELLOW}Step 1: Verifying prerequisites...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18+ required (found: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) installed${NC}"

# =============================================================================
# Step 2: Database Configuration
# =============================================================================
echo ""
echo -e "${YELLOW}Step 2: Database Configuration${NC}"
echo ""
echo "Your database details:"
echo "  Host: releye.boestad.com"
echo "  Database: lpmjclyqtt_releye"
echo "  User: lpmjclyqtt_releye_user"
echo ""

read -p "Do you want to configure database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please enter your database password:"
    read -s DB_PASSWORD
    echo ""
    
    # Create .env file
    cat > .env << EOF
# Database Configuration
DB_HOST=releye.boestad.com
DB_USER=lpmjclyqtt_releye_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=lpmjclyqtt_releye
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://releye.boestad.com

# Security
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Session timeout (7 days)
SESSION_TIMEOUT=604800000
EOF
    
    echo -e "${GREEN}✓ .env file created${NC}"
    
    echo ""
    echo "Testing database connection..."
    
    # Test database connection
    node -e "
    const mysql = require('mysql2/promise');
    (async () => {
        try {
            const connection = await mysql.createConnection({
                host: 'releye.boestad.com',
                user: 'lpmjclyqtt_releye_user',
                password: process.env.DB_PASSWORD || '$DB_PASSWORD',
                database: 'lpmjclyqtt_releye'
            });
            console.log('✓ Database connection successful');
            await connection.end();
            process.exit(0);
        } catch (error) {
            console.error('✗ Database connection failed:', error.message);
            process.exit(1);
        }
    })();
    " 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        echo "Please check your database credentials and try again"
        exit 1
    fi
else
    echo "Skipping database configuration"
    echo "Please manually create .env file using .env.production as template"
fi

# =============================================================================
# Step 3: Install Dependencies
# =============================================================================
echo ""
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo "Dependencies already installed"
fi

# =============================================================================
# Step 4: Build Frontend
# =============================================================================
echo ""
echo -e "${YELLOW}Step 4: Building frontend...${NC}"

npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# =============================================================================
# Step 5: Backend Setup Instructions
# =============================================================================
echo ""
echo -e "${YELLOW}Step 5: Backend Deployment${NC}"
echo ""
echo "The backend API needs to run on a server that supports Node.js."
echo ""
echo "Options:"
echo "  1. DigitalOcean App Platform (easiest)"
echo "  2. AWS Elastic Beanstalk"
echo "  3. Heroku"
echo "  4. Your own VPS with Node.js"
echo ""
echo "Files needed for backend deployment:"
echo "  - api-server-mysql.js"
echo "  - api-package.json (rename to package.json)"
echo "  - .env (with your database credentials)"
echo ""

read -p "Would you like to see DigitalOcean deployment instructions? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "=== DigitalOcean Deployment Instructions ==="
    echo ""
    echo "1. Create a DigitalOcean account at https://www.digitalocean.com"
    echo "2. Create a new App:"
    echo "   - Go to Apps → Create App"
    echo "   - Choose 'Deploy from GitHub' or 'Upload your code'"
    echo "3. Configure app:"
    echo "   - Name: releye-api"
    echo "   - Region: Choose closest to your users"
    echo "   - Environment: Node.js"
    echo "   - HTTP Port: 3000"
    echo "4. Set environment variables:"
    echo "   - Copy all variables from your .env file"
    echo "5. Deploy!"
    echo ""
    echo "After deployment, you'll get a URL like: https://releye-api-xxxxx.ondigitalocean.app"
    echo "Update your frontend API endpoint to use this URL"
    echo ""
fi

# =============================================================================
# Step 6: Frontend Deployment
# =============================================================================
echo ""
echo -e "${YELLOW}Step 6: Frontend Deployment${NC}"
echo ""
echo "Your frontend is ready to deploy to GitHub Pages."
echo ""
echo "To deploy:"
echo "  1. Commit all changes: git add . && git commit -m 'Deploy'"
echo "  2. Push to GitHub: git push origin main"
echo "  3. GitHub Pages will automatically deploy from the built files"
echo ""
echo "Your app will be available at: https://releye.boestad.com"
echo ""

# =============================================================================
# Step 7: Database Setup
# =============================================================================
echo ""
echo -e "${YELLOW}Step 7: Database Setup${NC}"
echo ""
echo "You need to run the database setup script in phpMyAdmin:"
echo ""
echo "1. Log into your Spaceship cPanel"
echo "2. Open phpMyAdmin"
echo "3. Select database: lpmjclyqtt_releye"
echo "4. Click 'Import' tab"
echo "5. Upload file: database-setup-mysql.sql"
echo "6. Click 'Go'"
echo ""
echo "This will:"
echo "  - Create all necessary tables"
echo "  - Create default admin user (username: admin, password: admin)"
echo "  - ⚠️  Remember to change the admin password after first login!"
echo ""

read -p "Have you completed the database setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please complete the database setup before proceeding.${NC}"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=========================================="
echo -e "${GREEN}  Deployment Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. ✅ Frontend built and ready"
echo "2. ⏳ Deploy backend to DigitalOcean/AWS/Heroku"
echo "3. ⏳ Run database setup script in phpMyAdmin"
echo "4. ⏳ Push code to GitHub for frontend deployment"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin"
echo "  ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!"
echo ""
echo "Documentation:"
echo "  - See RESTORE_AUTHENTICATION.md for detailed instructions"
echo "  - See database-setup-mysql.sql for database schema"
echo "  - See .env.production for environment variables reference"
echo ""
echo "Need help? Check the deployment guides in the root directory."
echo ""
