# RelEye Backend API Deployment Guide

## CRITICAL: This backend API MUST be deployed for the application to work

The RelEye application requires a backend API server running at `https://releye.boestad.com/api` to handle user authentication and credentials. Without this backend, users will see "Setup failed to set key" errors and the application will not function.

## Overview

RelEye uses a **cloud-based authentication system** where:
- ✅ **User credentials** are stored in a PostgreSQL database on your server
- ✅ **User invitations** are managed by the backend API
- ✅ **Authentication** happens through secure API endpoints
- ✅ **Works across different browsers and computers**
- ❌ **Network files** remain stored locally in each user's browser (NOT in the cloud)

## Architecture

```
┌─────────────────────────────────────┐
│  Frontend (releye.boestad.com)     │
│  - React application                │
│  - Handles UI and network files     │
│  - Calls backend API for auth       │
└──────────────┬──────────────────────┘
               │
               │ HTTPS API Calls
               │
┌──────────────▼──────────────────────┐
│  Backend API (/api endpoints)       │
│  - Node.js + Express                │
│  - Handles authentication           │
│  - Manages user database            │
└──────────────┬──────────────────────┘
               │
               │ SQL Queries
               │
┌──────────────▼──────────────────────┐
│  PostgreSQL Database                │
│  - Stores user credentials          │
│  - Stores pending invites           │
│  - Encrypted password hashes        │
└─────────────────────────────────────┘
```

## Quick Start Deployment

### Step 1: Set Up PostgreSQL Database

1. Install PostgreSQL on your server:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Start PostgreSQL
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. Create the database:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE releye;
   CREATE USER releye_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE releye TO releye_user;
   \q
   ```

3. Run the database setup script:
   ```bash
   sudo -u postgres psql -d releye < database-setup.sql
   ```

### Step 2: Install Node.js Backend

1. Install Node.js (v18 or later):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. Create backend directory:
   ```bash
   sudo mkdir -p /var/www/releye-api
   cd /var/www/releye-api
   ```

3. Copy backend files to the server:
   ```bash
   # Copy these files from your project:
   # - api-server-example.js (rename to server.js)
   # - api-package.json (rename to package.json)
   ```

4. Install dependencies:
   ```bash
   sudo npm install
   ```

5. Create environment file:
   ```bash
   sudo nano /var/www/releye-api/.env
   ```
   
   Add this content:
   ```env
   DATABASE_URL=postgresql://releye_user:your_secure_password_here@localhost:5432/releye
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://releye.boestad.com
   ```

### Step 3: Set Up API as a System Service

1. Create systemd service file:
   ```bash
   sudo nano /etc/systemd/system/releye-api.service
   ```

2. Add this content:
   ```ini
   [Unit]
   Description=RelEye Backend API
   After=network.target postgresql.service
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/releye-api
   Environment="NODE_ENV=production"
   EnvironmentFile=/var/www/releye-api/.env
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=10
   
   [Install]
   WantedBy=multi-user.target
   ```

3. Start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start releye-api
   sudo systemctl enable releye-api
   sudo systemctl status releye-api
   ```

### Step 4: Configure Nginx as Reverse Proxy

1. Install Nginx:
   ```bash
   sudo apt install nginx
   ```

2. Create Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/releye
   ```

3. Add this content:
   ```nginx
   server {
       listen 80;
       server_name releye.boestad.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name releye.boestad.com;
       
       # SSL Configuration (update paths to your certificates)
       ssl_certificate /etc/letsencrypt/live/releye.boestad.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/releye.boestad.com/privkey.pem;
       
       # Frontend (static files)
       location / {
           root /var/www/releye/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api/ {
           proxy_pass http://localhost:3000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/releye /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Step 5: Set Up SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d releye.boestad.com
```

### Step 6: Deploy Frontend

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Copy build files to server:
   ```bash
   sudo mkdir -p /var/www/releye/dist
   sudo cp -r dist/* /var/www/releye/dist/
   sudo chown -R www-data:www-data /var/www/releye
   ```

## Testing the Deployment

### Test 1: Check API Health
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

### Test 2: Check First-Time Setup
```bash
curl https://releye.boestad.com/api/auth/first-time
```

Expected response (before any admin is created):
```json
{
  "success": true,
  "data": {
    "isFirstTime": true
  }
}
```

### Test 3: Access the Application
1. Open https://releye.boestad.com in your browser
2. You should see the "First Time Setup" screen for creating an admin user
3. Create an admin account
4. Verify you can log in from a different browser or computer

## Troubleshooting

### Error: "Unable to connect to server"
- **Check API is running**: `sudo systemctl status releye-api`
- **Check API logs**: `sudo journalctl -u releye-api -f`
- **Check Nginx**: `sudo nginx -t && sudo systemctl status nginx`
- **Test API directly**: `curl http://localhost:3000/api/health`

### Error: "Setup failed to set key"
This means the frontend cannot reach the backend API.

1. Check browser console for error messages
2. Verify API endpoint in browser: `https://releye.boestad.com/api/health`
3. Check CORS configuration in `.env` matches your domain
4. Check Nginx proxy configuration

### Error: "Failed to retrieve users from server"
- **Check database connection**: `sudo -u postgres psql -d releye -c "SELECT * FROM users;"`
- **Check DATABASE_URL in `.env`**
- **Check API logs**: `sudo journalctl -u releye-api -f`

### Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql -d releye -c "SELECT COUNT(*) FROM users;"

# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Security Checklist

- [ ] PostgreSQL password is strong and unique
- [ ] `.env` file has restricted permissions (600)
- [ ] SSL/HTTPS is properly configured
- [ ] Firewall allows only necessary ports (80, 443)
- [ ] Database only accepts local connections
- [ ] Regular backups are configured
- [ ] API rate limiting is enabled (consider adding)
- [ ] API logs are monitored

## Maintenance

### View API Logs
```bash
sudo journalctl -u releye-api -f
```

### Restart API
```bash
sudo systemctl restart releye-api
```

### Database Backup
```bash
sudo -u postgres pg_dump releye > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
sudo -u postgres psql releye < backup_20240101.sql
```

### Update Backend Code
```bash
cd /var/www/releye-api
sudo git pull  # if using git
sudo npm install
sudo systemctl restart releye-api
```

## API Endpoints Reference

### Authentication
- `GET /api/health` - Check API health
- `GET /api/auth/first-time` - Check if first-time setup needed
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `POST /api/users` - Create new user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Invites
- `GET /api/invites` - Get all invites
- `GET /api/invites/:token` - Get invite by token
- `POST /api/invites` - Create new invite
- `DELETE /api/invites/:token` - Delete invite
- `POST /api/invites/cleanup` - Clean up expired invites

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review API logs: `sudo journalctl -u releye-api -n 100`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Test each component individually (database → API → Nginx → frontend)

## Alternative: Docker Deployment

If you prefer Docker, use the included `docker-compose.yml`:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop containers
docker-compose down
```

The Docker setup includes:
- PostgreSQL database container
- Node.js API container
- Automatic networking between containers
- Environment variable management
