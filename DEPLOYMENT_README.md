# RelEye Backend Deployment Guide for releye.boestad.com

## Overview

This guide provides two deployment methods for the RelEye backend API:

1. **Native Deployment** - Direct installation on Ubuntu/Debian server
2. **Docker Deployment** - Containerized deployment with Docker Compose

Both methods will set up:
- PostgreSQL database for user credentials
- Node.js API server
- Nginx reverse proxy
- SSL certificate with Let's Encrypt
- Automated backups

## Quick Start

Choose one of the following methods:

### Method 1: Native Deployment (Recommended)

```bash
# On your server
chmod +x deploy-backend.sh
sudo ./deploy-backend.sh
```

### Method 2: Docker Deployment

```bash
# On your server
chmod +x deploy-with-docker.sh
sudo ./deploy-with-docker.sh
```

## Detailed Instructions

### Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- SSH access with sudo privileges
- Domain name (releye.boestad.com) pointing to your server
- Ports 80 and 443 open in firewall

### Method 1: Native Deployment

#### Step 1: Prepare Deployment Package

On your local machine:

```bash
chmod +x prepare-deployment-package.sh
./prepare-deployment-package.sh
```

This creates a deployment package with all necessary files.

#### Step 2: Upload to Server

```bash
scp releye-deployment-*.tar.gz user@releye.boestad.com:~/
```

#### Step 3: Deploy on Server

```bash
ssh user@releye.boestad.com
tar -xzf releye-deployment-*.tar.gz
cd releye-deployment-package
sudo ./deploy-backend.sh
```

Follow the prompts to:
- Set database password (12+ characters)
- Configure SSL certificate
- Complete deployment

#### Step 4: Deploy Frontend

On your local machine:

```bash
npm run build
scp -r dist/* user@releye.boestad.com:/var/www/releye/dist/
```

#### Step 5: Test Deployment

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

### Method 2: Docker Deployment

#### Step 1: Upload Files to Server

```bash
scp api-server-example.js api-package.json database-setup.sql \
    Dockerfile.api docker-compose.production.yml \
    deploy-with-docker.sh \
    user@releye.boestad.com:/var/www/releye/
```

#### Step 2: Run Deployment Script

```bash
ssh user@releye.boestad.com
cd /var/www/releye
chmod +x deploy-with-docker.sh
sudo ./deploy-with-docker.sh
```

#### Step 3: Deploy Frontend

Same as Method 1 Step 4.

#### Step 4: Manage Docker Containers

```bash
# View logs
releye-docker logs -f api

# Restart containers
releye-docker restart

# Stop containers
releye-docker stop

# Start containers
releye-docker start

# View status
releye-docker ps
```

## Post-Deployment

### 1. Create First Admin User

Open https://releye.boestad.com in your browser. You should see the First Time Setup screen.

Create an administrator account with:
- Email address
- Full name
- Secure password

### 2. Test Login

- Try logging in with the admin account
- Log out and log in again
- Test from a different browser or device to verify cloud authentication works

### 3. Verify All Features

- Create a new network
- Add nodes and connections
- Save and reload the network
- Create additional user accounts (admin feature)
- Test invite system

## Management and Maintenance

### Service Management (Native Deployment)

```bash
# View API logs
sudo journalctl -u releye-api -f

# Restart API
sudo systemctl restart releye-api

# Check status
sudo systemctl status releye-api

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Docker Management

```bash
# All commands use the releye-docker wrapper
releye-docker logs -f api      # View logs
releye-docker restart api      # Restart API
releye-docker ps               # Check status
releye-docker exec api sh      # Shell into container
```

### Database Management

#### Native Deployment

```bash
# Access database
sudo -u postgres psql -d releye

# Backup database
sudo -u postgres pg_dump releye > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql releye < backup_20240101.sql

# View users
sudo -u postgres psql -d releye -c "SELECT email, name, role FROM users;"
```

#### Docker Deployment

```bash
# Access database
docker exec -it releye-postgres-prod psql -U releye_user -d releye

# Manual backup
releye-backup

# Automated backups run daily at 2 AM
# Located in /var/backups/releye/
```

### Log Management

```bash
# Native: API logs
sudo journalctl -u releye-api -n 100

# Native: Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker: Container logs
releye-docker logs api
releye-docker logs postgres
```

### SSL Certificate Renewal

Certbot automatically renews certificates. To manually renew:

```bash
sudo certbot renew
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

## Updating the Application

### Update Backend

#### Native Deployment

```bash
# Upload new server.js
scp api-server-example.js user@releye.boestad.com:/var/www/releye-api/server.js

# Restart service
ssh user@releye.boestad.com
sudo systemctl restart releye-api
```

#### Docker Deployment

```bash
# Upload new files
scp api-server-example.js api-package.json user@releye.boestad.com:/var/www/releye/

# Rebuild and restart
ssh user@releye.boestad.com
cd /var/www/releye
releye-docker down
releye-docker up -d --build
```

### Update Frontend

```bash
# Build locally
npm run build

# Upload to server
scp -r dist/* user@releye.boestad.com:/var/www/releye/dist/

# Clear browser cache or force reload (Ctrl+Shift+R)
```

## Troubleshooting

### API Not Responding

```bash
# Check if API is running
# Native:
sudo systemctl status releye-api
sudo journalctl -u releye-api -n 50

# Docker:
releye-docker ps
releye-docker logs api
```

### Database Connection Issues

```bash
# Native: Test database
sudo -u postgres psql -d releye -c "SELECT COUNT(*) FROM users;"

# Docker: Test database
docker exec releye-postgres-prod psql -U releye_user -d releye -c "SELECT COUNT(*) FROM users;"

# Check connection string in .env file
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# View errors
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t
```

### CORS Errors

If you see CORS errors in the browser console:

1. Check CORS_ORIGIN in environment file:
   - Native: `/var/www/releye-api/.env`
   - Docker: `/var/www/releye/.env.production`

2. Ensure it matches your domain exactly:
   ```
   CORS_ORIGIN=https://releye.boestad.com
   ```

3. Restart the API service

### "Setup failed to set key" Error

This means the frontend cannot reach the backend API:

1. Test API endpoint:
   ```bash
   curl https://releye.boestad.com/api/health
   ```

2. Check browser console for detailed error messages

3. Verify Nginx proxy configuration is correct

4. Check API logs for errors

## Security Best Practices

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Database Security

- Use a strong password (12+ characters, mixed case, numbers, symbols)
- Database only accepts local connections (configured by default)
- Regular backups to secure location
- Restrict access to .env files (chmod 600)

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images (Docker deployment)
releye-docker pull
releye-docker up -d
```

## Monitoring

### Basic Monitoring

```bash
# System resources
htop

# Disk space
df -h

# Database size
# Native:
sudo -u postgres psql -d releye -c "SELECT pg_size_pretty(pg_database_size('releye'));"

# Docker:
docker exec releye-postgres-prod psql -U releye_user -d releye -c "SELECT pg_size_pretty(pg_database_size('releye'));"

# API status
curl https://releye.boestad.com/api/health
```

### Log Monitoring

Set up log monitoring alerts (optional):

```bash
# Install logwatch
sudo apt install logwatch

# Configure daily email reports
sudo logwatch --output mail --mailto your@email.com --detail high
```

## Performance Tuning

### PostgreSQL Tuning

For better performance with many users:

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Recommended settings:
```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
max_connections = 100
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Nginx Caching

For better frontend performance, Nginx is already configured with:
- Static asset caching (1 year)
- Compression
- Security headers

## Migration from Spark KV to Cloud Storage

If you were previously using Spark's KV storage, all user credentials are now stored in the cloud database. This means:

✅ **Advantages:**
- Works across different browsers and devices
- Survives browser cache clears
- Proper multi-user support
- Centralized user management
- Invite system for new users
- Better security

❌ **Important Notes:**
- Network files still remain in browser local storage (not in cloud)
- Each user has their own local network files
- To share networks, users must download/upload `.releye` files

## Support

### Test Deployment Status

Run the included test script:

```bash
# In deployment package
./test-deployment.sh
```

### Common Issues Quick Reference

| Issue | Solution |
|-------|----------|
| API not responding | Check service status, view logs |
| Database connection failed | Verify DATABASE_URL, restart PostgreSQL |
| CORS error | Check CORS_ORIGIN matches domain |
| SSL error | Run certbot renew |
| Frontend 404 | Check dist/ files uploaded correctly |
| "Setup failed" | API not reachable, check proxy config |

### Get Help

1. Check troubleshooting section above
2. Review logs for specific error messages
3. Test each component individually
4. Verify all environment variables
5. Ensure all services are running

## Architecture Reference

```
┌─────────────────────────────────────┐
│  Browser                            │
│  - Frontend (React)                 │
│  - Network files (localStorage)     │
└──────────────┬──────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────┐
│  Nginx (Port 80/443)                │
│  - SSL termination                  │
│  - Reverse proxy                    │
│  - Static file serving              │
└──────────────┬──────────────────────┘
               │
               ├─► /api/ ──────────────┐
               │                       │
               └─► / (static) ────► dist/
                                      │
                                      ▼
┌─────────────────────────────────────┐
│  Node.js API (Port 3000)            │
│  - Express server                   │
│  - Authentication                   │
│  - User management                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL (Port 5432)             │
│  - User credentials                 │
│  - Invite tokens                    │
│  - Encrypted passwords              │
└─────────────────────────────────────┘
```

## Files Reference

### Native Deployment

```
/var/www/releye-api/
├── server.js                # API server
├── package.json             # Dependencies
├── .env                     # Environment variables
└── node_modules/            # Dependencies

/var/www/releye/
└── dist/                    # Frontend files

/etc/nginx/sites-available/
└── releye                   # Nginx configuration

/etc/systemd/system/
└── releye-api.service       # Systemd service
```

### Docker Deployment

```
/var/www/releye/
├── api-server-example.js
├── api-package.json
├── database-setup.sql
├── Dockerfile.api
├── docker-compose.production.yml
├── .env.production
└── dist/                    # Frontend files
```

## Conclusion

Your RelEye backend should now be deployed and running at https://releye.boestad.com. The application will:

- ✅ Store user credentials in the cloud database
- ✅ Support multiple users with proper authentication
- ✅ Work across different browsers and devices
- ✅ Provide invite system for new users
- ✅ Keep network files stored locally in each user's browser

For any issues, refer to the troubleshooting section or review the logs for specific error messages.
