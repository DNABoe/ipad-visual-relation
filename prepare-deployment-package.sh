#!/bin/bash

# Script to prepare deployment package for RelEye backend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Preparing RelEye Deployment Package${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

PACKAGE_DIR="releye-deployment-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create package directory
echo -e "${YELLOW}Creating deployment package...${NC}"
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

# Copy backend files
echo -e "${YELLOW}Copying backend files...${NC}"
cp api-server-example.js $PACKAGE_DIR/
cp api-package.json $PACKAGE_DIR/
cp database-setup.sql $PACKAGE_DIR/
cp deploy-backend.sh $PACKAGE_DIR/
chmod +x $PACKAGE_DIR/deploy-backend.sh

# Copy documentation
echo -e "${YELLOW}Copying documentation...${NC}"
cp DEPLOY_TO_RELEYE.md $PACKAGE_DIR/
cp BACKEND_DEPLOYMENT_GUIDE.md $PACKAGE_DIR/

# Create a README for the package
cat > $PACKAGE_DIR/README.txt << 'EOF'
RelEye Backend Deployment Package
==================================

This package contains everything needed to deploy the RelEye backend API
to your server at releye.boestad.com.

Contents:
---------
1. api-server-example.js    - Backend API server code
2. api-package.json         - Node.js dependencies
3. database-setup.sql       - PostgreSQL database schema
4. deploy-backend.sh        - Automated deployment script
5. DEPLOY_TO_RELEYE.md      - Quick deployment guide
6. BACKEND_DEPLOYMENT_GUIDE.md - Comprehensive deployment guide

Quick Start:
-----------
1. Upload this entire package to your server:
   scp -r releye-deployment-package your_username@releye.boestad.com:~/

2. SSH into your server:
   ssh your_username@releye.boestad.com

3. Run the deployment script:
   cd ~/releye-deployment-package
   chmod +x deploy-backend.sh
   sudo ./deploy-backend.sh

4. Follow the prompts to complete the deployment

For detailed instructions, see DEPLOY_TO_RELEYE.md

Support:
--------
If you encounter issues, check the troubleshooting section in the guides.
EOF

# Create environment template
cat > $PACKAGE_DIR/.env.example << 'EOF'
# Database connection string
DATABASE_URL=postgresql://releye_user:YOUR_PASSWORD_HERE@localhost:5432/releye

# API server port
PORT=3000

# Node environment
NODE_ENV=production

# CORS origin (your domain)
CORS_ORIGIN=https://releye.boestad.com
EOF

# Create a quick deployment checklist
cat > $PACKAGE_DIR/DEPLOYMENT_CHECKLIST.md << 'EOF'
# RelEye Backend Deployment Checklist

## Pre-Deployment
- [ ] Server is running Ubuntu/Debian Linux
- [ ] You have SSH access with sudo privileges
- [ ] Domain (releye.boestad.com) points to server IP
- [ ] Ports 80 and 443 are open in firewall
- [ ] You have a secure password ready for the database (12+ characters)

## Deployment Steps
- [ ] Upload deployment package to server
- [ ] Run deploy-backend.sh script
- [ ] Enter secure database password when prompted
- [ ] Complete SSL setup with Certbot
- [ ] Build frontend locally (npm run build)
- [ ] Upload frontend dist/ folder to server
- [ ] Test API endpoint: curl https://releye.boestad.com/api/health
- [ ] Test frontend: Open https://releye.boestad.com in browser
- [ ] Create first admin user
- [ ] Verify login works

## Post-Deployment
- [ ] Document database password in secure location
- [ ] Set up automated database backups
- [ ] Configure system monitoring
- [ ] Set up log rotation
- [ ] Test from different browsers/devices
- [ ] Create additional user accounts

## Security
- [ ] Changed default database password
- [ ] SSL certificate is installed and working
- [ ] Firewall is configured (only ports 22, 80, 443)
- [ ] .env file has restricted permissions (600)
- [ ] Database only accepts local connections
- [ ] All services start automatically on boot

## Monitoring
- [ ] Check API logs: sudo journalctl -u releye-api -f
- [ ] Check Nginx logs: sudo tail -f /var/log/nginx/error.log
- [ ] Check database: sudo -u postgres psql -d releye -c "SELECT COUNT(*) FROM users;"
- [ ] Monitor disk space: df -h
- [ ] Check service status: sudo systemctl status releye-api

## Troubleshooting Commands
```bash
# Service status
sudo systemctl status releye-api
sudo systemctl status postgresql
sudo systemctl status nginx

# Restart services
sudo systemctl restart releye-api
sudo systemctl restart nginx

# View logs
sudo journalctl -u releye-api -n 50
sudo tail -f /var/log/nginx/error.log

# Test API locally
curl http://localhost:3000/api/health

# Test API publicly
curl https://releye.boestad.com/api/health

# Database access
sudo -u postgres psql -d releye
```
EOF

# Create a quick test script
cat > $PACKAGE_DIR/test-deployment.sh << 'EOF'
#!/bin/bash

echo "Testing RelEye Backend Deployment"
echo "=================================="
echo ""

DOMAIN="releye.boestad.com"

echo "1. Testing API health endpoint..."
if curl -sf https://$DOMAIN/api/health | grep -q "success"; then
    echo "   ✓ API health check passed"
else
    echo "   ✗ API health check failed"
fi

echo ""
echo "2. Testing first-time setup endpoint..."
if curl -sf https://$DOMAIN/api/auth/first-time | grep -q "isFirstTime"; then
    echo "   ✓ First-time setup endpoint working"
else
    echo "   ✗ First-time setup endpoint failed"
fi

echo ""
echo "3. Testing frontend..."
if curl -sf https://$DOMAIN | grep -q "RelEye"; then
    echo "   ✓ Frontend is accessible"
else
    echo "   ✗ Frontend not accessible"
fi

echo ""
echo "4. Checking SSL certificate..."
if curl -sf https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo "   ✓ SSL certificate is valid"
else
    echo "   ✗ SSL certificate issue"
fi

echo ""
echo "Deployment test complete!"
EOF

chmod +x $PACKAGE_DIR/test-deployment.sh

# Create archive
echo -e "${YELLOW}Creating archive...${NC}"
tar -czf releye-deployment-$TIMESTAMP.tar.gz $PACKAGE_DIR
zip -r -q releye-deployment-$TIMESTAMP.zip $PACKAGE_DIR

echo -e "${GREEN}✓ Package created${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Package Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Package location:"
echo "  Directory: $PACKAGE_DIR/"
echo "  Archive:   releye-deployment-$TIMESTAMP.tar.gz"
echo "  ZIP:       releye-deployment-$TIMESTAMP.zip"
echo ""
echo "To deploy:"
echo "  1. Upload to server:"
echo "     scp releye-deployment-$TIMESTAMP.tar.gz user@releye.boestad.com:~/"
echo ""
echo "  2. On server, extract and run:"
echo "     tar -xzf releye-deployment-$TIMESTAMP.tar.gz"
echo "     cd $PACKAGE_DIR"
echo "     sudo ./deploy-backend.sh"
echo ""
