#!/bin/bash

# RelEye Docker-based Deployment Script
# Alternative deployment method using Docker Compose

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}RelEye Docker Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}" 
   exit 1
fi

DOMAIN="releye.boestad.com"
INSTALL_DIR="/var/www/releye"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    apt update
    apt install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Create installation directory
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

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

# Create .env file
echo -e "${YELLOW}Creating environment configuration...${NC}"
cat > .env.production << EOF
DB_PASSWORD=$DB_PASSWORD
EOF

chmod 600 .env.production
echo -e "${GREEN}✓ Environment configured${NC}"

# Copy deployment files
echo -e "${YELLOW}Setting up deployment files...${NC}"
if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}Error: docker-compose.production.yml not found!${NC}"
    echo -e "${YELLOW}Please ensure all deployment files are in $INSTALL_DIR${NC}"
    exit 1
fi

# Start services
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production up -d

echo -e "${GREEN}✓ Containers started${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check if API is responding
if docker compose -f docker-compose.production.yml exec -T api node -e "require('http').get('http://localhost:3000/api/health')" &> /dev/null; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
    echo -e "${YELLOW}Checking logs:${NC}"
    docker compose -f docker-compose.production.yml logs api
    exit 1
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx reverse proxy...${NC}"
cat > /etc/nginx/sites-available/releye << 'NGINX_EOF'
server {
    listen 80;
    server_name releye.boestad.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        root /var/www/releye/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
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

ln -sf /etc/nginx/sites-available/releye /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

if nginx -t; then
    systemctl restart nginx
    echo -e "${GREEN}✓ Nginx configured${NC}"
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    exit 1
fi

# Create frontend directory
mkdir -p $INSTALL_DIR/dist

# Install Certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
fi

# Set up SSL
echo ""
echo -e "${YELLOW}Setting up SSL certificate...${NC}"
read -p "Would you like to set up SSL now with Certbot? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN
    echo -e "${GREEN}✓ SSL configured${NC}"
else
    echo -e "${YELLOW}! SSL setup skipped. Run 'sudo certbot --nginx -d $DOMAIN' manually later.${NC}"
fi

# Create docker management script
cat > /usr/local/bin/releye-docker << 'SCRIPT_EOF'
#!/bin/bash
cd /var/www/releye
docker compose -f docker-compose.production.yml --env-file .env.production "$@"
SCRIPT_EOF

chmod +x /usr/local/bin/releye-docker

# Create backup script
cat > /usr/local/bin/releye-backup << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/releye"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec releye-postgres-prod pg_dump -U releye_user releye > $BACKUP_DIR/releye_$TIMESTAMP.sql
echo "Backup created: $BACKUP_DIR/releye_$TIMESTAMP.sql"
# Keep only last 7 days of backups
find $BACKUP_DIR -name "releye_*.sql" -mtime +7 -delete
BACKUP_EOF

chmod +x /usr/local/bin/releye-backup

# Set up daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/releye-backup") | crontab -

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo ""
echo -e "1. ${YELLOW}Build your frontend:${NC}"
echo -e "   npm run build"
echo ""
echo -e "2. ${YELLOW}Upload frontend files:${NC}"
echo -e "   scp -r dist/* root@$DOMAIN:$INSTALL_DIR/dist/"
echo ""
echo -e "3. ${YELLOW}Test the API:${NC}"
echo -e "   curl http://$DOMAIN/api/health"
echo ""
echo -e "${GREEN}Docker Management Commands:${NC}"
echo -e "  View logs:       releye-docker logs -f api"
echo -e "  Restart:         releye-docker restart"
echo -e "  Stop:            releye-docker stop"
echo -e "  Start:           releye-docker start"
echo -e "  Status:          releye-docker ps"
echo ""
echo -e "${GREEN}Backup:${NC}"
echo -e "  Manual backup:   releye-backup"
echo -e "  Auto backup:     Daily at 2 AM (configured)"
echo ""
echo -e "${YELLOW}Important: Database password is stored in $INSTALL_DIR/.env.production${NC}"
echo ""
