# RelEye - MySQL Backend Migration

## What Changed?

Your RelEye application has been upgraded to use **MySQL** as the backend database instead of PostgreSQL. This provides better compatibility and easier deployment options for releye.boestad.com.

## New Files Created

1. **database-setup-mysql.sql** - MySQL database schema with tables for:
   - users (authentication & credentials)
   - invites (user invitations)
   - sessions (future session management)
   - activity_log (audit trail)

2. **api-server-mysql.js** - Node.js backend API server using:
   - Express framework
   - mysql2 library for database connections
   - Secure password hashing with PBKDF2
   - CORS support for cross-origin requests
   - Activity logging

3. **api-package-mysql.json** - Package dependencies:
   - express
   - cors
   - mysql2
   - dotenv

4. **api-env-mysql.example** - Environment configuration template

5. **MYSQL_DEPLOYMENT_GUIDE.md** - Complete step-by-step deployment instructions

## Key Features

### Security
- ✅ **AES-256-GCM encryption** for network files (unchanged)
- ✅ **PBKDF2** password hashing with salt
- ✅ **SSL/TLS** encryption for all API communication
- ✅ **Activity logging** for audit trails
- ✅ **Zero-knowledge architecture** - network files never leave the browser
- ✅ **Secure credential storage** in MySQL with encryption

### Multi-User Support
- ✅ **Admin user** with full control
- ✅ **User invitations** via email links
- ✅ **Role-based access** (admin, editor, viewer)
- ✅ **Per-user settings** (API keys, preferences)
- ✅ **Cross-device authentication** - login from any browser/computer

### Database
- ✅ **MySQL 8.0+** - industry-standard RDBMS
- ✅ **Automatic cleanup** of expired invites/sessions
- ✅ **Transaction support** for data consistency
- ✅ **Indexed queries** for fast performance
- ✅ **Easy backup/restore** with mysqldump

## Deployment to releye.boestad.com

Follow the comprehensive guide: **MYSQL_DEPLOYMENT_GUIDE.md**

### Quick Summary:

1. **Install MySQL** on your server
   ```bash
   sudo apt install mysql-server
   ```

2. **Create database** and user
   ```bash
   sudo mysql -u root -p < database-setup-mysql.sql
   ```

3. **Deploy backend API**
   ```bash
   cd /var/www/releye-api
   npm install
   sudo systemctl start releye-api
   ```

4. **Configure Nginx** to proxy /api requests

5. **Deploy frontend** (no changes needed!)

6. **Install SSL** with Let's Encrypt

## Testing

### 1. Test API Health
```bash
curl https://releye.boestad.com/api/health
```

Expected:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "mysql"
  }
}
```

### 2. Test First-Time Setup
Open https://releye.boestad.com in your browser:
- Should show "First Time Setup" for admin user
- Create admin account (username: admin, password: your choice)
- Admin credentials stored in MySQL

### 3. Test Multi-Device
- Login on Browser 1
- Open https://releye.boestad.com on Browser 2 or different computer
- Should show normal login screen (NOT first-time setup)
- Login with same admin credentials

## Migration from PostgreSQL (if applicable)

If you were using the PostgreSQL backend, migration is straightforward:

### Option 1: Start Fresh
Simply deploy the MySQL backend. All users will need to re-register.

### Option 2: Migrate Data
```bash
# Export from PostgreSQL
pg_dump -U postgres releye --data-only --inserts > postgres-data.sql

# Convert to MySQL format (adjust as needed)
sed 's/TRUE/1/g; s/FALSE/0/g' postgres-data.sql > mysql-data.sql

# Import to MySQL
mysql -u releye_user -p releye < mysql-data.sql
```

## API Endpoints

All endpoints remain the same as before. The API is fully compatible with the existing frontend.

### Authentication
- `GET /api/health` - API health check
- `GET /api/auth/first-time` - Check if admin exists
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - List all users
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Invitations
- `GET /api/invites` - List all invites
- `GET /api/invites/:token` - Get invite details
- `POST /api/invites` - Create invitation
- `DELETE /api/invites/:token` - Revoke invitation

## Environment Variables

Required in `/var/www/releye-api/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=releye_user
DB_PASSWORD=your_secure_password
DB_NAME=releye

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://releye.boestad.com
```

## Troubleshooting

### "Setup failed to set key"
- **Cause**: Frontend can't reach backend API
- **Fix**: Check API is running: `sudo systemctl status releye-api`
- **Fix**: Check Nginx config forwards /api requests
- **Fix**: Check CORS_ORIGIN matches your domain

### "Database connection failed"
- **Cause**: MySQL not running or wrong credentials
- **Fix**: Check MySQL: `sudo systemctl status mysql`
- **Fix**: Verify credentials: `mysql -u releye_user -p`
- **Fix**: Check .env file has correct DB_PASSWORD

### "First-time setup reappears"
- **Cause**: Admin user not persisting in database
- **Fix**: Check database: `mysql -u releye_user -p releye -e "SELECT * FROM users;"`
- **Fix**: Check API logs: `sudo journalctl -u releye-api -n 100`

### "Invalid invitation link"
- **Cause**: Invite expired or not found in database
- **Fix**: Check invites: `mysql -u releye_user -p releye -e "SELECT * FROM invites;"`
- **Fix**: Create new invitation from admin dashboard

## Performance

The MySQL backend is optimized for performance:

- **Connection pooling**: Up to 10 concurrent connections
- **Indexed queries**: Fast lookups on email, role, timestamps
- **Prepared statements**: Protection against SQL injection
- **Async/await**: Non-blocking I/O operations
- **Activity logging**: Async writes don't block requests

## Backup & Recovery

### Automated Backup Script

Create `/usr/local/bin/backup-releye.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/releye"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
mysqldump -u releye_user -p'YOUR_PASSWORD' releye | gzip > $BACKUP_DIR/releye-$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "releye-*.sql.gz" -mtime +7 -delete
```

Add to crontab:
```bash
sudo crontab -e
# Add:
0 2 * * * /usr/local/bin/backup-releye.sh
```

## Monitoring

### API Status
```bash
# Check if running
sudo systemctl status releye-api

# View logs
sudo journalctl -u releye-api -f

# Check recent errors
sudo journalctl -u releye-api | grep -i error | tail -20
```

### Database Status
```bash
# Check MySQL
sudo systemctl status mysql

# Check connections
mysql -u releye_user -p releye -e "SHOW PROCESSLIST;"

# Check table sizes
mysql -u releye_user -p releye -e "
  SELECT table_name, 
         ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
  FROM information_schema.TABLES 
  WHERE table_schema = 'releye';"
```

## Security Checklist

- [ ] MySQL password is strong (20+ characters)
- [ ] `.env` file has 600 permissions
- [ ] MySQL only binds to localhost (127.0.0.1)
- [ ] Firewall only allows ports 80, 443, and SSH
- [ ] SSL certificate is valid and auto-renewing
- [ ] Regular backups are configured
- [ ] Activity logs are monitored
- [ ] API is running as www-data user (limited privileges)

## What Hasn't Changed

The frontend application remains **exactly the same**:

- ✅ All UI/UX features unchanged
- ✅ Network files still encrypted with AES-256-GCM
- ✅ Files still stored locally in browser (never in cloud)
- ✅ All canvas features work identically
- ✅ All sorting/arranging functions unchanged
- ✅ Export, import, connections all work the same

**Only the backend authentication storage changed from PostgreSQL to MySQL.**

## Next Steps

1. Review **MYSQL_DEPLOYMENT_GUIDE.md** for detailed instructions
2. Deploy MySQL database on your server
3. Deploy backend API as systemd service
4. Configure Nginx to proxy API requests
5. Test on https://releye.boestad.com
6. Set up automated backups
7. Monitor logs for any issues

## Support

If you encounter issues:

1. Check logs: `sudo journalctl -u releye-api -n 100`
2. Test API: `curl https://releye.boestad.com/api/health`
3. Check database: `mysql -u releye_user -p releye -e "SHOW TABLES;"`
4. Review MYSQL_DEPLOYMENT_GUIDE.md troubleshooting section

## Version

- **Backend Version**: 1.0.0
- **Database**: MySQL 8.0+
- **Frontend**: Beta 1.0+ (unchanged)
- **Deployment**: releye.boestad.com

---

**Ready to deploy!** Follow MYSQL_DEPLOYMENT_GUIDE.md for complete step-by-step instructions.
