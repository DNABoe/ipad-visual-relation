# Quick Start Guide - Deploy RelEye to releye.boestad.com

This guide will help you deploy RelEye with your Spaceship.com hosting and MySQL database.

## Your Setup

- **Domain**: releye.boestad.com
- **Hosting**: Spaceship.com (cPanel)
- **Database**: lpmjclyqtt_releye
- **DB User**: lpmjclyqtt_releye_user
- **Frontend**: GitHub Pages (static React app)
- **Backend**: Needs separate Node.js server

## Architecture Overview

```
┌──────────────────────────────────────────┐
│ Users Browser                            │
│ https://releye.boestad.com               │
└────────────────┬─────────────────────────┘
                 │
                 ├─── HTML/CSS/JS (GitHub Pages)
                 │
                 └─── API Calls
                      │
        ┌─────────────▼────────────────┐
        │ Backend API Server           │
        │ (DigitalOcean/AWS)           │
        │ Node.js + Express            │
        └─────────────┬────────────────┘
                      │
        ┌─────────────▼────────────────┐
        │ MySQL Database               │
        │ (Spaceship cPanel)           │
        │ lpmjclyqtt_releye            │
        └──────────────────────────────┘
```

## Step-by-Step Deployment

### 1. Setup MySQL Database (5 minutes)

1. **Log into Spaceship cPanel**
   - Go to your Spaceship.com control panel
   - Find and click "phpMyAdmin"

2. **Select Your Database**
   - In phpMyAdmin, click on `lpmjclyqtt_releye` in the left sidebar

3. **Import Database Schema**
   - Click the "SQL" tab at the top
   - Open the file `database-setup-mysql.sql` from this project
   - Copy the entire contents
   - Paste into the SQL query box
   - Click "Go" button

4. **Verify Setup**
   - You should see tables created: `users`, `invitations`, `activity_log`
   - Check the `users` table - should have 1 admin user

**✅ Database is now ready!**

Default admin credentials:
- Username: `admin`
- Password: `admin`
- ⚠️ **MUST change after first login!**

---

### 2. Deploy Backend API (15 minutes)

Since Spaceship.com doesn't support Node.js applications, you need a separate server for the backend.

#### Option A: DigitalOcean (Recommended - $5/month)

1. **Create DigitalOcean Account**
   - Go to https://www.digitalocean.com
   - Sign up for an account

2. **Create a Droplet**
   - Click "Create" → "Droplets"
   - Choose Ubuntu 22.04 LTS
   - Select $5/month Basic plan
   - Choose datacenter closest to you
   - Add SSH key or use password
   - Click "Create Droplet"

3. **Connect to Your Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

4. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install -y git
   ```

5. **Upload Backend Files**
   
   On your local machine:
   ```bash
   # Create deployment package
   mkdir releye-backend
   cp api-server-mysql.js releye-backend/server.js
   cp api-package-mysql.json releye-backend/package.json
   
   # Upload to server
   scp -r releye-backend root@your-droplet-ip:/var/www/
   ```

6. **Configure Environment**
   
   On the server:
   ```bash
   cd /var/www/releye-backend
   
   # Create .env file
   nano .env
   ```
   
   Paste this (replace YOUR_DB_PASSWORD):
   ```env
   DB_HOST=releye.boestad.com
   DB_USER=lpmjclyqtt_releye_user
   DB_PASSWORD=YOUR_DB_PASSWORD_HERE
   DB_NAME=lpmjclyqtt_releye
   DB_PORT=3306
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://releye.boestad.com
   JWT_SECRET=YOUR_RANDOM_SECRET_HERE
   ```
   
   Save: `Ctrl+O`, `Enter`, `Ctrl+X`

7. **Install Dependencies**
   ```bash
   npm install
   ```

8. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name releye-api
   pm2 startup
   pm2 save
   ```

9. **Install Nginx (Reverse Proxy)**
   ```bash
   sudo apt-get install -y nginx
   ```

10. **Configure Nginx**
    ```bash
    sudo nano /etc/nginx/sites-available/releye-api
    ```
    
    Paste this configuration:
    ```nginx
    server {
        listen 80;
        server_name api.releye.boestad.com;
        
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    
    Enable site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/releye-api /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Setup SSL Certificate**
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d api.releye.boestad.com
    ```

**✅ Backend API is now running!**

Your API is available at: `https://api.releye.boestad.com`

---

### 3. Configure DNS (5 minutes)

1. **Log into Spaceship.com**
   - Go to your domain management
   - Find "DNS Management" for releye.boestad.com

2. **Add DNS Records**
   
   **For frontend (GitHub Pages):**
   - Type: `A`
   - Host: `@`
   - Value: `185.199.108.153`
   
   Add these additional A records:
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   
   **For backend API:**
   - Type: `A`
   - Host: `api`
   - Value: `YOUR_DIGITALOCEAN_DROPLET_IP`

3. **Wait for DNS Propagation** (5-30 minutes)

---

### 4. Deploy Frontend (2 minutes)

1. **Update API Endpoint**
   
   Edit `src/lib/cloudAPI.ts`:
   ```typescript
   const API_BASE_URL = window.location.origin.includes('localhost') 
     ? 'http://localhost:3000/api'
     : 'https://api.releye.boestad.com/api'
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   git add .
   git commit -m "Deploy with backend API"
   git push origin main
   ```

3. **Enable GitHub Pages**
   - Go to your GitHub repository
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`, folder: `/` (root)
   - Save

**✅ Frontend is now deployed!**

Visit: `https://releye.boestad.com`

---

## First Login

1. Go to `https://releye.boestad.com`
2. You should see "Create Administrator Account"
3. Login with:
   - Username: `admin`
   - Password: `admin`
4. **Immediately change password:**
   - Click Settings (gear icon)
   - Go to User tab
   - Change password

---

## Testing the Deployment

### Test Backend API

```bash
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

### Test Frontend

1. Open `https://releye.boestad.com`
2. Should see login screen
3. Try logging in with admin/admin
4. Should successfully log in

---

## Troubleshooting

### Backend API not accessible

1. **Check if server is running:**
   ```bash
   ssh root@your-droplet-ip
   pm2 status
   pm2 logs releye-api
   ```

2. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. **Check firewall:**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

### Database connection failed

1. **Enable remote MySQL access:**
   - In Spaceship cPanel, find "Remote MySQL"
   - Add your DigitalOcean droplet IP address

2. **Test connection:**
   ```bash
   mysql -h releye.boestad.com -u lpmjclyqtt_releye_user -p lpmjclyqtt_releye
   ```

### Frontend shows "Backend not available"

1. **Check API URL in code**
   - Verify `src/lib/cloudAPI.ts` has correct URL

2. **Check CORS settings**
   - Backend `.env` should have: `CORS_ORIGIN=https://releye.boestad.com`

3. **Check browser console**
   - Open DevTools → Console
   - Look for network errors

---

## Cost Breakdown

- **Spaceship.com domain + hosting**: ~$10-20/year
- **DigitalOcean droplet**: $5/month ($60/year)
- **SSL Certificate**: Free (Let's Encrypt)

**Total: ~$70-80/year**

---

## Maintenance

### Update backend code

```bash
ssh root@your-droplet-ip
cd /var/www/releye-backend
# Upload new files
pm2 restart releye-api
```

### Database backup

In phpMyAdmin:
- Select database
- Export → Quick export
- Save .sql file

### Monitor backend

```bash
pm2 monit
pm2 logs releye-api
```

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET in .env
- [ ] Enabled UFW firewall on droplet
- [ ] Installed SSL certificates
- [ ] Regular database backups
- [ ] Restricted MySQL remote access to API server IP only

---

## Need Help?

Common issues:
1. **"Backend not available"** - Backend server not running or wrong URL
2. **"Database connection failed"** - MySQL remote access not enabled
3. **"Invalid credentials"** - Database not setup or wrong password
4. **Blank page** - Check browser console for errors

For more help, check:
- `RESTORE_AUTHENTICATION.md` - Detailed authentication docs
- `database-setup-mysql.sql` - Database schema
- Backend logs: `pm2 logs releye-api`
