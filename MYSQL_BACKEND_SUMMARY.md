# RelEye MySQL Backend - Complete Package

## Overview

RelEye now uses **MySQL** as the backend database for user authentication and multi-user management at **releye.boestad.com**.

## What's Included

### 1. Database Schema (`database-setup-mysql.sql`)
Complete MySQL schema with:
- **users table** - Stores user credentials with PBKDF2 hashed passwords
- **invites table** - Manages user invitation tokens
- **sessions table** - Future session management
- **activity_log table** - Audit trail for all actions
- **Auto-cleanup procedures** - Removes expired invites/sessions
- **Event schedulers** - Daily maintenance tasks

### 2. Backend API Server (`api-server-mysql.js`)
Production-ready Node.js Express server with:
- **MySQL connection pooling** for performance
- **RESTful API endpoints** for authentication & user management
- **CORS support** for cross-origin requests
- **Activity logging** for security audits
- **Error handling** with detailed logging
- **Secure password verification** using PBKDF2
- **Input validation** and SQL injection protection

### 3. Package Configuration (`api-package-mysql.json`)
NPM dependencies:
- express (web framework)
- cors (cross-origin resource sharing)
- mysql2 (MySQL client with promises)
- dotenv (environment variable management)

### 4. Environment Template (`api-env-mysql.example`)
Configuration template for:
- MySQL connection details
- Server port and environment
- CORS origin settings
- Optional rate limiting

### 5. Deployment Script (`deploy-mysql-backend.sh`)
Automated deployment script that:
- Installs and configures MySQL
- Sets up database and user
- Deploys Node.js backend
- Configures Nginx reverse proxy
- Installs SSL certificate with Let's Encrypt
- Sets up firewall rules
- Creates systemd service

### 6. Documentation

#### `MYSQL_DEPLOYMENT_GUIDE.md`
Complete 18,000+ word guide covering:
- Step-by-step installation instructions
- MySQL setup and security
- Node.js backend deployment
- Nginx configuration
- SSL certificate installation
- Testing procedures
- Troubleshooting common issues
- Maintenance tasks
- Performance optimization
- Security best practices

#### `MYSQL_MIGRATION.md`
Migration guide covering:
- What changed from PostgreSQL
- Feature comparison
- Testing procedures
- Backup and recovery
- Monitoring and maintenance

## Architecture

```
┌─────────────────────────────────┐
│  Frontend (Browser)             │
│  - React application            │
│  - Network files (encrypted)    │
│  - Stored locally (IndexedDB)   │
└────────────┬────────────────────┘
             │ HTTPS API calls
             │
┌────────────▼────────────────────┐
│  releye.boestad.com             │
│  ┌──────────────────────────┐   │
│  │ Nginx (Port 80/443)      │   │
│  │ - SSL/TLS termination    │   │
│  │ - Static file serving    │   │
│  │ - Reverse proxy to API   │   │
│  └────────┬─────────────────┘   │
│           │                     │
│  ┌────────▼─────────────────┐   │
│  │ Node.js API (Port 3000)  │   │
│  │ - Express server         │   │
│  │ - Authentication         │   │
│  │ - User management        │   │
│  └────────┬─────────────────┘   │
│           │                     │
│  ┌────────▼─────────────────┐   │
│  │ MySQL (Port 3306)        │   │
│  │ - User credentials       │   │
│  │ - Invitations            │   │
│  │ - Activity log           │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

## API Endpoints

### Authentication
- `GET /api/health` - Check API status
- `GET /api/auth/first-time` - Check if admin exists
- `POST /api/auth/login` - Login user

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:userId` - Get user details
- `GET /api/users/email/:email` - Find user by email
- `POST /api/users` - Create new user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Invitations (Admin only)
- `GET /api/invites` - List all invites
- `GET /api/invites/:token` - Get invite details
- `POST /api/invites` - Create invitation
- `DELETE /api/invites/:token` - Revoke invitation
- `POST /api/invites/cleanup` - Clean expired invites

### Activity Log (Admin only)
- `GET /api/activity?limit=100&offset=0` - View activity log

### Admin (Admin only)
- `POST /api/admin/reset` - Reset all data (requires confirmation)

## Security Features

### Encryption
- **AES-256-GCM** for network files (client-side)
- **PBKDF2** for password hashing (100,000 iterations)
- **SSL/TLS** for all API communication
- **Base64 encoding** for binary data

### Authentication
- **Password hashing** with random salt per user
- **Secure session management** (future)
- **Activity logging** for audit trails
- **Role-based access control** (admin/editor/viewer)

### Network Security
- **CORS** properly configured
- **HTTPS only** (HTTP redirects to HTTPS)
- **Firewall rules** (only 80, 443, SSH)
- **MySQL local-only** (no remote access)

### Data Protection
- **Network files never stored on server**
- **Zero-knowledge architecture**
- **Client-side encryption/decryption**
- **Passwords never logged**

## Quick Start Deployment

### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x deploy-mysql-backend.sh

# Run as root
sudo ./deploy-mysql-backend.sh
```

The script will prompt for:
- MySQL root password
- Database user password
- Domain name (releye.boestad.com)
- Admin email for SSL

### Option 2: Manual Deployment

Follow the step-by-step guide in `MYSQL_DEPLOYMENT_GUIDE.md`.

## Testing

### 1. Test API Health

```bash
curl https://releye.boestad.com/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1234567890,
    "version": "1.0.0",
    "database": "mysql"
  }
}
```

### 2. Test First-Time Setup

```bash
curl https://releye.boestad.com/api/auth/first-time
```

Expected response (before admin created):
```json
{
  "success": true,
  "data": {
    "isFirstTime": true
  }
}
```

### 3. Test in Browser

1. Open https://releye.boestad.com
2. Should show "First Time Setup" screen
3. Create admin account (username: admin)
4. Login and test functionality

### 4. Test Multi-Device

1. Create admin in Browser A
2. Open site in Browser B (or different computer)
3. Should show normal login (not first-time setup)
4. Login with same credentials

## Maintenance

### View Logs

```bash
# API logs
sudo journalctl -u releye-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/releye-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/releye-error.log

# MySQL slow query log
sudo tail -f /var/log/mysql/slow-queries.log
```

### Backup Database

```bash
# Manual backup
mysqldump -u releye_user -p releye | gzip > backup-$(date +%Y%m%d).sql.gz

# Automated daily backup (cron)
sudo crontab -e
# Add: 0 2 * * * mysqldump -u releye_user -pPASSWORD releye | gzip > /var/backups/releye/backup-$(date +\%Y\%m\%d).sql.gz
```

### Restore Database

```bash
# Restore from backup
gunzip < backup-20240101.sql.gz | mysql -u releye_user -p releye
```

### Update Backend

```bash
# Copy new server.js to server
scp api-server-mysql.js server:/var/www/releye-api/server.js

# Restart service
sudo systemctl restart releye-api

# Check status
sudo systemctl status releye-api
```

### Restart Services

```bash
# Restart API
sudo systemctl restart releye-api

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

## Monitoring

### Check Service Status

```bash
sudo systemctl status releye-api
sudo systemctl status nginx
sudo systemctl status mysql
```

### Check Database

```bash
# Connect to MySQL
mysql -u releye_user -p releye

# In MySQL:
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM invites;
SELECT COUNT(*) FROM activity_log;
```

### Check Disk Space

```bash
df -h
```

### Check Memory

```bash
free -m
```

### Check API Performance

```bash
# Response time
time curl -s https://releye.boestad.com/api/health

# Active connections
sudo netstat -tuln | grep 3000
```

## Troubleshooting

### API Not Starting

```bash
# Check logs
sudo journalctl -u releye-api -n 50

# Test manually
cd /var/www/releye-api
node server.js

# Check permissions
ls -la /var/www/releye-api
```

### Database Connection Error

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u releye_user -p releye -e "SELECT 1;"

# Check .env file
sudo cat /var/www/releye-api/.env
```

### 502 Bad Gateway

```bash
# API is not running
sudo systemctl restart releye-api

# Check Nginx config
sudo nginx -t

# Check Nginx is proxying correctly
curl http://localhost:3000/api/health
```

## Performance Optimization

### MySQL

```sql
-- Check query performance
SHOW PROCESSLIST;

-- Analyze tables
ANALYZE TABLE users, invites, sessions, activity_log;

-- Optimize tables
OPTIMIZE TABLE users, invites, sessions, activity_log;
```

### Nginx Caching

Add to Nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
```

### Node.js

Increase connection pool:
```javascript
// In api-server-mysql.js
connectionLimit: 20  // Increase from 10
```

## Version History

- **v1.0.0** (Current) - Initial MySQL backend release
  - Full MySQL support
  - Multi-user authentication
  - Activity logging
  - Automated deployment

## Support Files

All files are in the project root:

- `database-setup-mysql.sql` - Database schema
- `api-server-mysql.js` - Backend server
- `api-package-mysql.json` - NPM dependencies
- `api-env-mysql.example` - Environment template
- `deploy-mysql-backend.sh` - Deployment script
- `MYSQL_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `MYSQL_MIGRATION.md` - Migration instructions
- `MYSQL_BACKEND_SUMMARY.md` - This file

## Getting Help

1. Check `MYSQL_DEPLOYMENT_GUIDE.md` for detailed instructions
2. Check logs: `sudo journalctl -u releye-api -n 100`
3. Test API: `curl https://releye.boestad.com/api/health`
4. Check GitHub issues or documentation

## License

MIT License - See LICENSE file

## Author

D Boestad

---

**Ready to deploy!** 

Run `sudo ./deploy-mysql-backend.sh` to get started, or follow `MYSQL_DEPLOYMENT_GUIDE.md` for manual setup.
