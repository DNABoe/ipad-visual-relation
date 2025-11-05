# RelEye Backend Quick Deploy

## The Problem

You're seeing **"Setup failed to set key"** errors because the backend API is not deployed at releye.boestad.com.

## The Solution

Deploy the backend API to your server. Here's the fastest way:

## 5-Minute Deployment (Automated)

### On Your Local Machine

```bash
# Make scripts executable
chmod +x prepare-deployment-package.sh deploy-backend.sh deploy-with-docker.sh

# Create deployment package
./prepare-deployment-package.sh
```

This creates: `releye-deployment-package/` with all necessary files.

### Upload to Server

```bash
scp -r releye-deployment-package your_username@releye.boestad.com:~/
```

### On Your Server

```bash
ssh your_username@releye.boestad.com
cd ~/releye-deployment-package
sudo ./deploy-backend.sh
```

The script will ask for:
1. **Database password** - Choose a strong password (12+ characters)
2. **SSL setup** - Press Y to configure HTTPS

Wait 2-5 minutes for deployment to complete.

### Deploy Frontend

Back on your local machine:

```bash
# Build the frontend
npm run build

# Upload to server
scp -r dist/* your_username@releye.boestad.com:/var/www/releye/dist/
```

### Test It

Open in your browser: **https://releye.boestad.com**

You should see the **First Time Setup** screen (not an error).

## What Gets Deployed

✅ **PostgreSQL database** - Stores user credentials  
✅ **Node.js API server** - Handles authentication  
✅ **Nginx reverse proxy** - Routes traffic  
✅ **SSL certificate** - HTTPS encryption  
✅ **Auto-start on boot** - Runs automatically  
✅ **Automated backups** - Daily database backups  

## Verify Deployment

Test the API:

```bash
curl https://releye.boestad.com/api/health
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## Alternative: Docker Deployment

If you prefer Docker:

```bash
# On server
cd ~/releye-deployment-package
sudo ./deploy-with-docker.sh
```

## Troubleshooting

### "Connection refused" or API errors

```bash
# Check if API is running
ssh your_username@releye.boestad.com
sudo systemctl status releye-api

# View logs
sudo journalctl -u releye-api -f
```

### "CORS error" in browser

Check that CORS_ORIGIN is set correctly:

```bash
# On server
sudo nano /var/www/releye-api/.env
```

Should contain:
```
CORS_ORIGIN=https://releye.boestad.com
```

Then restart:
```bash
sudo systemctl restart releye-api
```

### SSL certificate issues

```bash
# On server
sudo certbot --nginx -d releye.boestad.com
```

## After Deployment

1. ✅ Open https://releye.boestad.com
2. ✅ Create first admin account
3. ✅ Log in and test creating a network
4. ✅ Log out and log back in to verify authentication
5. ✅ Test from different browser/device

## Management Commands

```bash
# View API logs
sudo journalctl -u releye-api -f

# Restart API
sudo systemctl restart releye-api

# Restart Nginx
sudo systemctl restart nginx

# Backup database
sudo -u postgres pg_dump releye > backup.sql
```

## Need More Detail?

See **DEPLOYMENT_README.md** for comprehensive documentation.

## Summary

The backend API is **required** for the application to work. It stores user credentials in a PostgreSQL database on your server, enabling:

- ✅ Login from any browser/device
- ✅ Multiple user accounts
- ✅ Secure authentication
- ✅ User invite system

Network files still remain stored locally in each user's browser.
