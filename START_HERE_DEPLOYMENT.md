# 🚀 START HERE: Deploy RelEye Backend to releye.boestad.com

## ⚠️ CRITICAL: Backend Deployment Required

If you're seeing **"Setup failed to set key"** or **"Unable to connect to server"** errors, it's because the backend API is not yet deployed to your server.

**RelEye requires a backend API** to manage user credentials and authentication. Without it, the application cannot function.

---

## 📋 What You Need

- ✅ A server running Ubuntu 20.04+ or Debian 11+
- ✅ SSH access with sudo privileges  
- ✅ Domain name (releye.boestad.com) pointing to your server's IP
- ✅ Ports 80 and 443 open in your firewall
- ✅ 10 minutes of your time

---

## 🎯 Choose Your Deployment Method

### Option 1: Automated Script (Easiest) ⭐

Perfect if you want a quick, no-fuss deployment.

**Time:** ~5 minutes  
**Complexity:** Low  
**Requirements:** Ubuntu/Debian server

👉 **[Follow QUICK_DEPLOY.md](QUICK_DEPLOY.md)** 👈

### Option 2: Docker (Containerized)

Perfect if you're familiar with Docker.

**Time:** ~5 minutes  
**Complexity:** Low  
**Requirements:** Docker support on your server

👉 **[Follow DEPLOYMENT_README.md - Docker Section](DEPLOYMENT_README.md)** 👈

### Option 3: Manual Setup (Full Control)

Perfect if you want to understand every step.

**Time:** ~15-20 minutes  
**Complexity:** Medium  
**Requirements:** Linux server administration knowledge

👉 **[Follow DEPLOY_TO_RELEYE.md](DEPLOY_TO_RELEYE.md)** 👈

---

## 🏃 Super Quick Start

**TL;DR - Get it running in 3 commands:**

### On Your Local Machine:
```bash
./prepare-deployment-package.sh
scp -r releye-deployment-package user@releye.boestad.com:~/
```

### On Your Server:
```bash
cd ~/releye-deployment-package
sudo ./deploy-backend.sh
```

### Back on Local Machine:
```bash
npm run build
scp -r dist/* user@releye.boestad.com:/var/www/releye/dist/
```

**Done!** Open https://releye.boestad.com

---

## 📚 Documentation Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** | Fast deployment guide | Start here for quickest setup |
| **[DEPLOYMENT_README.md](DEPLOYMENT_README.md)** | Complete reference | Detailed instructions & troubleshooting |
| **[DEPLOY_TO_RELEYE.md](DEPLOY_TO_RELEYE.md)** | Manual deployment | Step-by-step manual installation |
| **[BACKEND_DEPLOYMENT_GUIDE.md](BACKEND_DEPLOYMENT_GUIDE.md)** | Original guide | Alternative detailed guide |

---

## 🔧 Deployment Scripts

| Script | Purpose |
|--------|---------|
| `prepare-deployment-package.sh` | Creates deployment bundle |
| `deploy-backend.sh` | Automated native deployment |
| `deploy-with-docker.sh` | Automated Docker deployment |
| `test-deployment.sh` | Tests deployment status |

---

## ✅ After Deployment Checklist

Once deployment completes:

1. **Test API Endpoint**
   ```bash
   curl https://releye.boestad.com/api/health
   ```
   Should return: `{"success":true,"data":{"status":"ok"}}`

2. **Open Application**  
   Navigate to: https://releye.boestad.com

3. **Create Admin Account**  
   You should see "First Time Setup" screen  
   Create your administrator account

4. **Test Login**  
   - Log in with your new account
   - Create a test network
   - Log out and log back in
   - Test from a different browser

5. **Invite Other Users** (Optional)  
   Use the admin panel to send invites

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│  Frontend (Browser)                 │
│  - React application                │
│  - Network files (local storage)    │
└──────────────┬──────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────┐
│  Nginx (releye.boestad.com)         │
│  - SSL/HTTPS                        │
│  - Serves frontend                  │
│  - Proxies /api to backend          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Node.js API Server (Port 3000)     │
│  - User authentication              │
│  - Invite management                │
│  - Password hashing                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  - User credentials                 │
│  - Invite tokens                    │
│  - Encrypted data                   │
└─────────────────────────────────────┘
```

**Important Notes:**
- ✅ User credentials stored in cloud database
- ✅ Works across browsers and devices
- ❌ Network files remain local to each user's browser
- 💡 Users share networks by downloading/uploading `.releye` files

---

## 🚨 Common Issues

### Issue: "Setup failed to set key"

**Cause:** Backend API not deployed or not reachable  
**Solution:** Deploy the backend using this guide

### Issue: "Unable to connect to server"

**Cause:** API server not running or Nginx misconfigured  
**Solution:** 
```bash
sudo systemctl status releye-api
sudo journalctl -u releye-api -f
```

### Issue: CORS errors in browser console

**Cause:** CORS_ORIGIN misconfigured  
**Solution:** Check `/var/www/releye-api/.env` has correct domain

### Issue: SSL certificate errors

**Cause:** Certificate not installed or expired  
**Solution:**
```bash
sudo certbot --nginx -d releye.boestad.com
```

---

## 📞 Getting Help

1. **Check Status**
   ```bash
   # API status
   sudo systemctl status releye-api
   
   # View logs
   sudo journalctl -u releye-api -f
   
   # Test API
   curl https://releye.boestad.com/api/health
   ```

2. **Review Documentation**  
   - [DEPLOYMENT_README.md](DEPLOYMENT_README.md) - Troubleshooting section
   - [DEPLOY_TO_RELEYE.md](DEPLOY_TO_RELEYE.md) - Manual steps

3. **Test Each Component**
   - Database: `sudo -u postgres psql -d releye`
   - API: `curl http://localhost:3000/api/health`
   - Nginx: `sudo nginx -t`
   - SSL: `sudo certbot certificates`

---

## 🎓 Understanding the System

### Why Do I Need This?

Previously, you might have used Spark's KV storage, which:
- ❌ Only worked in one browser
- ❌ Lost data if cache was cleared
- ❌ Didn't support multiple users

Now with the backend:
- ✅ Works across all browsers and devices
- ✅ Secure cloud-based authentication
- ✅ Proper multi-user support
- ✅ Invite system for teams
- ✅ Survives browser cache clears

### What Gets Stored Where?

| Data | Location | Why |
|------|----------|-----|
| User credentials | PostgreSQL database | Security & sync across devices |
| User invites | PostgreSQL database | Multi-user management |
| Network files | Browser localStorage | Privacy - your data stays local |
| Photos/attachments | Browser localStorage | Privacy - your data stays local |

---

## 🔐 Security Notes

- ✅ All passwords are hashed with PBKDF2 before storage
- ✅ Database connection uses SSL in production
- ✅ API uses HTTPS with Let's Encrypt certificates
- ✅ CORS restricted to your domain only
- ✅ SQL injection protection via parameterized queries
- ✅ Environment variables for sensitive config

---

## 📦 What Gets Installed

### Native Deployment
- PostgreSQL 15
- Node.js 18+
- Nginx web server
- Certbot for SSL
- Systemd service for auto-start

### Docker Deployment
- Docker Engine
- Docker Compose
- PostgreSQL container
- Node.js API container
- Nginx (host system)
- Automated backups

---

## 🔄 Maintenance

### Regular Tasks

```bash
# View logs
sudo journalctl -u releye-api -f

# Restart services
sudo systemctl restart releye-api
sudo systemctl restart nginx

# Backup database
sudo -u postgres pg_dump releye > backup_$(date +%Y%m%d).sql

# Check disk space
df -h

# Update system
sudo apt update && sudo apt upgrade
```

### Automated Tasks

- ✅ SSL certificates auto-renew (Certbot)
- ✅ Database backups daily at 2 AM (if Docker deployment)
- ✅ Service auto-starts on server reboot

---

## 🎯 Next Steps After Deployment

1. **Create Admin Account** - First time setup
2. **Invite Team Members** - Use admin panel
3. **Create Networks** - Start building your relationship maps
4. **Set Up Backups** - Regular database backups
5. **Monitor Logs** - Watch for any issues
6. **Update Frontend** - Deploy updates as needed

---

## 📝 Quick Reference

### Service Commands
```bash
sudo systemctl status releye-api    # Check status
sudo systemctl restart releye-api   # Restart API
sudo systemctl stop releye-api      # Stop API
sudo systemctl start releye-api     # Start API
```

### Log Commands
```bash
sudo journalctl -u releye-api -f    # Follow API logs
sudo journalctl -u releye-api -n 50 # Last 50 log lines
sudo tail -f /var/log/nginx/error.log  # Nginx errors
```

### Database Commands
```bash
sudo -u postgres psql -d releye     # Connect to database
sudo -u postgres pg_dump releye > backup.sql  # Backup
sudo -u postgres psql releye < backup.sql     # Restore
```

### Test Commands
```bash
curl https://releye.boestad.com/api/health           # Test API
curl https://releye.boestad.com/api/auth/first-time  # Test auth
curl -I https://releye.boestad.com                   # Test SSL
```

---

## 🚀 Ready to Deploy?

Pick your method and follow the guide:

1. **Quick & Easy** → [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
2. **Docker** → [DEPLOYMENT_README.md - Docker](DEPLOYMENT_README.md)
3. **Manual** → [DEPLOY_TO_RELEYE.md](DEPLOY_TO_RELEYE.md)

**Good luck! 🎉**

---

## 📄 License & Support

This deployment setup is part of RelEye and follows the same license.

For issues with deployment:
1. Check the troubleshooting sections in the guides
2. Review service logs for error messages
3. Verify all prerequisites are met
4. Test each component individually

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Tested On:** Ubuntu 20.04 LTS, Ubuntu 22.04 LTS, Debian 11
