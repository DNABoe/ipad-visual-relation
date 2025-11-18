# 🚀 Quick Start - Deploy RelEye in 30 Minutes

## Overview
- ✅ Authentication bypass REMOVED
- ✅ MySQL backend configured for your database
- ✅ Default admin: `admin` / `admin` (change immediately!)
- ✅ Ready for production deployment

## Your Database Info
- **Host**: releye.boestad.com
- **Database**: lpmjclyqtt_releye
- **User**: lpmjclyqtt_releye_user
- **Password**: [You need to provide this]

---

## 🎯 Quick Deployment Steps

### 1️⃣ Database Setup (5 min)
```
□ Log into Spaceship cPanel
□ Open phpMyAdmin
□ Select database: lpmjclyqtt_releye
□ Go to SQL tab
□ Copy/paste contents of: database-setup-mysql.sql
□ Click "Go"
□ Verify tables created: users, invitations, activity_log
```

### 2️⃣ Backend Deployment (15 min)
```
□ Create DigitalOcean account ($5/month droplet)
□ Create Ubuntu 22.04 droplet
□ SSH into droplet
□ Run: bash auto-deploy-backend.sh
□ Follow prompts (enter database password)
□ Test: curl http://your-ip:3000/api/health
```

### 3️⃣ DNS Configuration (5 min)
```
In Spaceship DNS for releye.boestad.com:

Frontend (GitHub Pages):
□ A record: @ → 185.199.108.153
□ A record: @ → 185.199.109.153
□ A record: @ → 185.199.110.153
□ A record: @ → 185.199.111.153

Backend API:
□ A record: api → [YOUR_DIGITALOCEAN_IP]
```

### 4️⃣ Frontend Deployment (5 min)
```
□ Update src/lib/cloudAPI.ts:
  Change: '${window.location.origin}/api'
  To: 'https://api.releye.boestad.com/api'
  
□ Build: npm run build
□ Commit: git add . && git commit -m "Deploy"
□ Push: git push origin main
□ Enable GitHub Pages in repo settings
```

---

## 📁 Important Files

### Must Run
- `database-setup-mysql.sql` - Import in phpMyAdmin

### For Backend Server
- `api-server-mysql.js` - Backend code
- `api-package-mysql.json` - Dependencies
- `.env.production` - Configuration template
- `auto-deploy-backend.sh` - Automated setup script

### Documentation
- `SPACESHIP_DEPLOYMENT.md` ⭐ **Start here for detailed guide**
- `DEPLOYMENT_SUMMARY.md` - Complete overview
- `API_URL_CONFIGURATION.md` - API endpoint setup
- `RESTORE_AUTHENTICATION.md` - Architecture details

---

## ✅ Verification Checklist

### After Database Setup
```bash
# Test database connection (from your server)
mysql -h releye.boestad.com -u lpmjclyqtt_releye_user -p lpmjclyqtt_releye
```

Should connect successfully and show:
```sql
SHOW TABLES;
-- Should show: users, invitations, activity_log

SELECT * FROM users WHERE role='admin';
-- Should show 1 admin user
```

### After Backend Deployment
```bash
# Test health endpoint
curl https://api.releye.boestad.com/api/health
```

Should return:
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

### After Frontend Deployment
1. Visit: https://releye.boestad.com
2. Should see: "Create Administrator Account" or "Login"
3. Login with: `admin` / `admin`
4. Should successfully enter app

---

## 🔧 Quick Commands

### Backend Management (on DigitalOcean)
```bash
# SSH into server
ssh root@your-droplet-ip

# Check status
pm2 status

# View logs
pm2 logs releye-api

# Restart app
pm2 restart releye-api

# Monitor
pm2 monit
```

### Database Management
```bash
# Backup database (in phpMyAdmin)
Export → Quick → Go

# View users
SELECT user_id, email, name, role FROM users;

# View activity
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10;
```

### Frontend Update
```bash
# Make changes, then:
npm run build
git add .
git commit -m "Update"
git push origin main
# GitHub Pages auto-deploys
```

---

## 🚨 Troubleshooting

### Problem: "Backend not available"
**Check:**
1. Backend running? `pm2 status`
2. API URL correct in cloudAPI.ts?
3. CORS configured? Check .env: `CORS_ORIGIN=https://releye.boestad.com`
4. Test: `curl https://api.releye.boestad.com/api/health`

### Problem: "Database connection failed"
**Check:**
1. Remote MySQL enabled in Spaceship cPanel?
2. Server IP whitelisted in MySQL?
3. Correct password in backend .env?
4. Test: `mysql -h releye.boestad.com -u lpmjclyqtt_releye_user -p`

### Problem: "Invalid credentials" when logging in
**Check:**
1. Database setup script ran successfully?
2. Check users table: `SELECT * FROM users;`
3. Try default: `admin` / `admin`
4. Clear browser cookies and try again

### Problem: Blank page after deployment
**Check:**
1. Browser console (F12) for errors
2. Network tab - API calls failing?
3. Correct API URL in cloudAPI.ts?
4. GitHub Pages enabled in repo settings?

---

## 💡 Pro Tips

### Security First
- [ ] Change admin password immediately after first login
- [ ] Use strong JWT_SECRET (already generated if using auto script)
- [ ] Enable firewall on backend server
- [ ] Setup SSL certificates (Let's Encrypt - free!)
- [ ] Regular database backups

### Cost Optimization
- **DigitalOcean**: $5/month ($60/year)
- **Spaceship**: ~$10-20/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$70-80/year

### Monitoring
```bash
# Setup monitoring alerts
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M

# Enable startup script
pm2 startup
pm2 save
```

---

## 📞 Need Help?

1. **Read the docs** (especially SPACESHIP_DEPLOYMENT.md)
2. **Check logs**:
   - Browser: F12 → Console
   - Backend: `pm2 logs releye-api`
   - Nginx: `tail -f /var/log/nginx/error.log`
3. **Test each component independently**:
   - Database connection
   - Backend health endpoint
   - Frontend loading

---

## 🎉 Success Criteria

You know it's working when:
- ✅ Visit https://releye.boestad.com shows login screen
- ✅ Can login with admin/admin
- ✅ Can create and load network files
- ✅ Can invite new users
- ✅ Can change password in settings
- ✅ Works from different browsers/computers

---

## 📋 Post-Deployment Tasks

Immediate:
- [ ] Change admin password
- [ ] Test creating a network file
- [ ] Test saving and loading files
- [ ] Test inviting a user
- [ ] Verify investigation feature (with OpenAI API key)

Within 24 hours:
- [ ] Setup database backup schedule
- [ ] Configure monitoring/alerts
- [ ] Test from different devices
- [ ] Document your custom configurations

Within 1 week:
- [ ] Review activity logs
- [ ] Check for any errors in pm2 logs
- [ ] Test all user roles (Admin, Editor, Viewer)
- [ ] Backup configuration files

---

## 🚀 You're Ready!

Everything is configured and ready to deploy. Start with:

```bash
# Read the complete guide
cat SPACESHIP_DEPLOYMENT.md

# Or jump right in with step 1: Database setup
# Open phpMyAdmin and run database-setup-mysql.sql
```

Good luck! 🎊
