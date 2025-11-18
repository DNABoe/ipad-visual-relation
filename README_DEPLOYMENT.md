# RelEye - Relationship Network Visualization

A secure, privacy-focused relationship network visualization tool with local-only encrypted storage and cloud-based user authentication.

## 🎉 Authentication Restored - Ready for Deployment!

The temporary authentication bypass has been **REMOVED**. The application now uses proper MySQL backend authentication and is ready for production deployment to **releye.boestad.com**.

## 🚀 Quick Start Deployment

**⏱️ Total Time: ~40 minutes**

### Step 1: Read This First
```bash
cat START_HERE.md
```
This contains your 30-minute quick deployment checklist.

### Step 2: Complete Deployment Guide
```bash
cat SPACESHIP_DEPLOYMENT.md
```
Step-by-step instructions for deploying to your Spaceship.com hosting with MySQL.

### Step 3: Follow the Steps
1. **Database** (5 min) - Import `database-setup-mysql.sql` in phpMyAdmin
2. **Backend** (15 min) - Deploy API server to DigitalOcean/AWS
3. **DNS** (5 min) - Configure DNS records in Spaceship
4. **Frontend** (5 min) - Push to GitHub for GitHub Pages deployment
5. **Test** (5 min) - Verify everything works

## 📁 Key Files for Deployment

### 🗄️ Database Setup
- **`database-setup-mysql.sql`** - Import this in phpMyAdmin

### 🖥️ Backend Server
- **`api-server-mysql.js`** - Backend API server code
- **`api-package-mysql.json`** - Dependencies (rename to package.json)
- **`.env.production`** - Environment configuration template
- **`auto-deploy-backend.sh`** - Automated backend deployment script

### 📚 Documentation (Start Here!)
- **`START_HERE.md`** ⭐ - 30-minute quick deployment
- **`SPACESHIP_DEPLOYMENT.md`** - Complete deployment guide
- **`DEPLOYMENT_SUMMARY.md`** - Full overview and architecture
- **`COMPLETE_RESTORATION.md`** - What was changed and why
- **`API_URL_CONFIGURATION.md`** - Configure API endpoints
- **`RESTORE_AUTHENTICATION.md`** - Authentication architecture

## 🏗️ Architecture

```
Frontend (GitHub Pages)           Backend API (DigitalOcean)      Database (Spaceship)
releye.boestad.com         →      api.releye.boestad.com    →     MySQL: lpmjclyqtt_releye
Static React App                  Node.js + Express                User credentials stored
Network files local/encrypted     Authentication & APIs            Activity logs & invites
```

## 🔐 Default Credentials

After deployment:
- **Username**: `admin`
- **Password**: `admin`

⚠️ **CRITICAL**: Change this password immediately after first login!

## 🛠️ Your Database Configuration

- **Host**: releye.boestad.com
- **Database**: lpmjclyqtt_releye
- **User**: lpmjclyqtt_releye_user
- **Port**: 3306

## ✅ What's Included

- ✅ Full user authentication system
- ✅ MySQL backend (configured for your database)
- ✅ First-time admin setup
- ✅ User invitation system
- ✅ Role-based access control (Admin, Editor, Viewer)
- ✅ Encrypted local network file storage (AES-256-GCM)
- ✅ Complete network visualization features
- ✅ Investigation tools (with OpenAI integration)
- ✅ Activity logging and user management
- ✅ Cross-browser/device support

## 🚀 Deployment Options

### Recommended (Most Automated)
```bash
# 1. Setup database in phpMyAdmin (manual)
# 2. Run automated backend deployment
bash auto-deploy-backend.sh
# 3. Configure DNS (manual)
# 4. Deploy frontend to GitHub Pages
```

### Manual (Full Control)
Follow the complete guide in `SPACESHIP_DEPLOYMENT.md`

## 💰 Cost Breakdown

- **Spaceship domain + hosting**: ~$10-20/year
- **DigitalOcean droplet**: $5/month ($60/year)
- **SSL certificates**: Free (Let's Encrypt)
- **GitHub Pages**: Free

**Total: ~$70-90/year**

## 📞 Need Help?

1. **Read the documentation** (start with START_HERE.md)
2. **Check troubleshooting** (in DEPLOYMENT_SUMMARY.md)
3. **Verify each component**:
   - Database connection
   - Backend API health endpoint
   - Frontend loading

## 🎯 Success Checklist

- [ ] Database tables created in phpMyAdmin
- [ ] Backend API running and responding
- [ ] DNS records configured
- [ ] Frontend deployed to GitHub Pages
- [ ] Can access https://releye.boestad.com
- [ ] Can login with admin/admin
- [ ] Changed admin password
- [ ] Can create and load network files

## 🔄 What Was Changed

- ✅ Removed temporary authentication bypass
- ✅ Restored proper MySQL backend authentication
- ✅ Configured for your Spaceship database
- ✅ Created complete deployment documentation
- ✅ Added automated deployment scripts
- ✅ Implemented security best practices

See `COMPLETE_RESTORATION.md` for full details.

## 📝 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
