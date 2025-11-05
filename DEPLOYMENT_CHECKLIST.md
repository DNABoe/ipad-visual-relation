# RelEye Deployment Checklist

Use this checklist to ensure proper deployment of the RelEye application.

## Prerequisites

- [ ] Server with root/sudo access (Ubuntu 20.04+ recommended)
- [ ] Domain name pointing to server (releye.boestad.com)
- [ ] SSH access to server
- [ ] Basic familiarity with Linux command line

## Backend Deployment

### 1. Database Setup

- [ ] PostgreSQL installed on server
- [ ] Database `releye` created
- [ ] Database user `releye_user` created with password
- [ ] Database schema loaded from `database-setup.sql`
- [ ] Database connection tested

```bash
sudo -u postgres psql -d releye -c "SELECT COUNT(*) FROM users;"
```

### 2. Node.js API Server

- [ ] Node.js v18+ installed
- [ ] API files copied to `/var/www/releye-api/`
- [ ] Files renamed (api-server-example.js → server.js, api-package.json → package.json)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] API server starts without errors

```bash
cd /var/www/releye-api
node server.js
# Should see: "RelEye API server running on port 3000"
```

### 3. System Service

- [ ] Systemd service file created at `/etc/systemd/system/releye-api.service`
- [ ] Service enabled and started
- [ ] Service starts automatically on reboot
- [ ] Service logs are accessible

```bash
sudo systemctl status releye-api
sudo journalctl -u releye-api -n 50
```

### 4. Nginx Reverse Proxy

- [ ] Nginx installed
- [ ] Site configuration created at `/etc/nginx/sites-available/releye`
- [ ] Site enabled (symlink in `/etc/nginx/sites-enabled/`)
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx restarted

### 5. SSL/HTTPS

- [ ] Certbot installed
- [ ] SSL certificate obtained for releye.boestad.com
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured

```bash
sudo certbot certificates
```

## Frontend Deployment

### 6. Build and Deploy

- [ ] Project built locally (`npm run build`)
- [ ] Build directory created: `/var/www/releye/dist/`
- [ ] Built files copied to server
- [ ] File permissions set correctly
- [ ] Static files served by Nginx

```bash
ls -la /var/www/releye/dist/
# Should see index.html and assets/
```

## Testing

### 7. API Tests

- [ ] Health endpoint works: `curl https://releye.boestad.com/api/health`
- [ ] First-time endpoint works: `curl https://releye.boestad.com/api/auth/first-time`
- [ ] CORS headers present in responses
- [ ] No errors in API logs

Expected health response:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### 8. Frontend Tests

- [ ] Site loads at https://releye.boestad.com
- [ ] No console errors in browser
- [ ] "First Time Setup" screen appears
- [ ] Can create admin account
- [ ] Can log in with created account
- [ ] Can log out
- [ ] Can log in again

### 9. Multi-Device Tests

- [ ] Log in from different browser on same computer
- [ ] Log in from different computer
- [ ] User credentials work everywhere
- [ ] Network files remain local (don't sync)

### 10. Admin Functions

- [ ] Admin tab visible in settings (admin users only)
- [ ] Can create user invites
- [ ] Invite links work
- [ ] New user can accept invite
- [ ] Can revoke invites
- [ ] Can delete users
- [ ] Can modify user permissions

## Security Checklist

- [ ] Database password is strong and unique
- [ ] `.env` file has restricted permissions (600)
- [ ] Database only accepts local connections
- [ ] Firewall configured (allow 80, 443; restrict others)
- [ ] SSL/HTTPS working correctly
- [ ] No sensitive data in logs
- [ ] API rate limiting enabled (if implemented)
- [ ] Regular backups scheduled

## Monitoring

- [ ] API logs accessible via journalctl
- [ ] Nginx logs accessible
- [ ] Database backup script created
- [ ] Disk space monitored
- [ ] Service status monitoring set up (optional)

## Documentation

- [ ] `.env` file backed up securely (NOT in git)
- [ ] Database credentials documented securely
- [ ] Deployment notes saved
- [ ] Maintenance procedures documented

## Post-Deployment

### First Admin Setup

1. Visit https://releye.boestad.com
2. Complete "First Time Setup"
3. Create admin account
4. Log in
5. Test creating a network file
6. Test saving and loading

### Invite Additional Users

1. Log in as admin
2. Settings → Admin Dashboard
3. Create invite for new user
4. Copy invite link
5. Send to new user
6. Verify new user can complete signup

## Troubleshooting Commands

```bash
# Check API status
sudo systemctl status releye-api

# View API logs
sudo journalctl -u releye-api -f

# View recent API errors
sudo journalctl -u releye-api -p err -n 50

# Check Nginx status
sudo systemctl status nginx

# View Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Check database
sudo -u postgres psql -d releye

# Restart services
sudo systemctl restart releye-api
sudo systemctl restart nginx

# Check disk space
df -h

# Check API process
ps aux | grep node
```

## Common Issues

### "Unable to connect to server"
- Check API is running: `systemctl status releye-api`
- Check Nginx config has `/api/` proxy
- Check CORS_ORIGIN in `.env`

### "Setup failed to set key"
- API is not reachable from frontend
- Check `/api/health` endpoint
- Check browser console for errors

### Database errors
- Check DATABASE_URL in `.env`
- Verify database exists: `sudo -u postgres psql -l`
- Check credentials work: `sudo -u postgres psql releye`

## Rollback Plan

If deployment fails:

1. Keep old system running if possible
2. Check logs for specific errors
3. Fix issues one by one
4. Test each component individually
5. Don't update DNS until fully tested

## Maintenance Schedule

- **Daily**: Check API logs for errors
- **Weekly**: Verify backups are working
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize database

## Success Criteria

✅ All boxes checked above
✅ No errors in logs
✅ Can log in from multiple devices
✅ Admin can invite users
✅ Network files save and load correctly
✅ SSL certificate valid and auto-renewing

---

**Date Deployed**: _______________

**Deployed By**: _______________

**Notes**: _______________________________________________
