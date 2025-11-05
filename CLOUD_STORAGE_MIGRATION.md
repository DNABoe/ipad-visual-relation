# Cloud Storage Migration - Summary

## What Changed

RelEye has been migrated from Spark KV storage to a hybrid cloud + local storage architecture to enable proper deployment at releye.boestad.com.

## Why This Change Was Necessary

### Previous Architecture (Spark KV)
- **Problem**: Spark KV only works in the Spark development environment
- **Issue**: Won't work when deployed to releye.boestad.com
- **Impact**: Users couldn't access the app from production domain

### New Architecture (Cloud + Local)
- **Solution**: Cloud API for user authentication + localStorage for network files
- **Benefit**: Works everywhere - development, production, any browser, any device
- **Result**: True multi-device, multi-browser support

## Architecture Overview

### Cloud Storage (PostgreSQL Database)
**What's Stored:**
- User accounts (email, name, role)
- Password hashes (PBKDF2 with salt)
- Pending invites
- Login statistics
- Session management

**Why Cloud:**
- Access from multiple devices
- Access from multiple browsers
- Share credentials across platforms
- Multi-user collaboration
- Centralized authentication

**API Location:**
- Production: `https://releye.boestad.com/api`
- Development: `http://localhost:3000/api`

### Local Storage (Browser localStorage)
**What's Stored:**
- Network files (.enc.releye)
- Encrypted relationship data
- Person nodes
- Connection relationships
- Group information
- Network layouts

**Why Local:**
- Maximum privacy
- No network latency
- Works offline
- User control
- Sensitive data never leaves device

## How It Works

### First Visit
1. User visits https://releye.boestad.com
2. Frontend checks if cloud API is available
3. If available, uses cloud authentication
4. If not available, falls back to localStorage
5. User sees "First Time Setup" if no admin exists

### Creating Admin Account
1. User enters email, name, and password
2. Password is hashed client-side (PBKDF2, 210,000 iterations)
3. User account is saved to cloud database
4. Session token stored in localStorage
5. User is logged in

### Subsequent Logins
1. User enters email and password
2. Frontend calls cloud API to authenticate
3. API verifies password hash
4. Returns user account with role
5. Session token stored locally
6. User can access the app

### Working with Network Files
1. User creates/loads network file (local only)
2. File is encrypted with AES-256-GCM
3. Saved to browser localStorage
4. Never sent to cloud
5. User credentials enable access from any device
6. But network files stay on each device

### Multi-Device Scenario
**Device 1 (Desktop Chrome):**
- User creates admin account
- Creates network file "Company.enc.releye"
- File stored locally on Desktop Chrome

**Device 2 (Laptop Firefox):**
- User logs in with same credentials (from cloud)
- Can access the app
- But doesn't see "Company.enc.releye" (it's on Desktop)
- Can create new files or load transferred files

**File Transfer:**
- User can download .enc.releye file from Device 1
- Transfer via USB/email/cloud storage
- Load into Device 2 using File Manager
- Now accessible on both devices

## Files Added

### Backend API
- `api-server-example.js` - Express server implementation
- `api-package.json` - Backend dependencies
- `api-env.example` - Environment variables template
- `database-setup.sql` - PostgreSQL schema
- `Dockerfile.api` - Docker container for API
- `docker-compose.yml` - Local development setup

### Frontend Changes
- `src/lib/cloudAuthService.ts` - Cloud API client
- Updated `src/lib/userRegistry.ts` - Hybrid storage logic
- Updated `src/lib/storage.ts` - Kept for local network files

### Documentation
- `CLOUD_API_SETUP.md` - Backend deployment guide
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `LOCAL_DEVELOPMENT.md` - Local development setup
- `CLOUD_STORAGE_MIGRATION.md` - This document
- `test-cloud-api.sh` - API testing script
- Updated `README.md` - New architecture docs
- Updated `PRD.md` - Architecture documentation

## Deployment Steps

### 1. Deploy Backend API
```bash
# On server at releye.boestad.com
cd /var/www/releye-api
npm install
psql releye < database-setup.sql
pm2 start api-server-example.js
```

### 2. Configure Nginx
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
}
```

### 3. Deploy Frontend
```bash
# Push to GitHub
git push origin main

# GitHub Pages will auto-deploy to releye.boestad.com
```

### 4. Verify
```bash
curl https://releye.boestad.com/api/health
# Should return: {"success":true,"data":{"status":"ok"}}
```

## Local Development

### With Docker (Recommended)
```bash
docker-compose up -d
npm run dev
```

### Manual Setup
```bash
# Terminal 1: Start API
node api-server-example.js

# Terminal 2: Start Frontend
npm run dev
```

## Fallback Behavior

If cloud API is unavailable:
1. Frontend automatically detects
2. Falls back to localStorage for authentication
3. App continues working normally
4. Only single-device/single-browser access
5. Console shows: "Cloud storage check failed, using local storage"

This ensures the app never breaks, even if backend is down.

## Security Considerations

### Password Security
- Client-side hashing (PBKDF2, 210,000 iterations)
- Server stores only hashes
- Salt per password
- No plaintext passwords ever transmitted or stored

### Network Data Security
- AES-256-GCM encryption
- Files never leave device
- User-controlled encryption password
- No cloud storage of sensitive data

### API Security
- HTTPS only
- CORS restrictions
- Input validation
- SQL injection protection
- Rate limiting (recommended)

## Testing

### Test Cloud API
```bash
./test-cloud-api.sh https://releye.boestad.com/api
```

### Test Frontend
1. Visit https://releye.boestad.com
2. Open browser console (F12)
3. Look for: `[UserRegistry] Cloud storage: AVAILABLE ✓`
4. Create admin account
5. Log out and log back in
6. Open different browser
7. Log in with same credentials
8. Should work!

## Migration Checklist

- [x] Create cloud API service
- [x] Set up PostgreSQL schema
- [x] Implement API endpoints
- [x] Update frontend to use cloud API
- [x] Add fallback to localStorage
- [x] Create Docker setup for development
- [x] Write deployment documentation
- [x] Create testing scripts
- [x] Update README and PRD
- [ ] Deploy API to releye.boestad.com
- [ ] Test end-to-end on production
- [ ] Verify multi-device access
- [ ] Monitor API logs

## Troubleshooting

### "Cloud storage check failed"
- Check API server is running: `pm2 status`
- Test health endpoint: `curl https://releye.boestad.com/api/health`
- Check browser console for CORS errors
- Verify CORS_ORIGIN in API .env file

### Can't log in after migrating
- Old accounts in Spark KV won't exist in cloud database
- Create new admin account via "First Time Setup"
- Previous network files still exist in localStorage

### Network files disappeared
- Files are browser-specific
- Check if you're using the same browser
- Use File Manager to load from downloaded files
- Files never stored in cloud, only locally

### API not accessible
- Check Nginx configuration
- Verify SSL certificate
- Check firewall rules
- Review API logs: `pm2 logs releye-api`

## Future Enhancements

Possible improvements:
- [ ] Cloud backup of encrypted network files (optional)
- [ ] File sharing between users
- [ ] Real-time collaboration on networks
- [ ] API key management in cloud
- [ ] Audit logging
- [ ] Session management improvements
- [ ] Two-factor authentication

## Support

For issues:
1. Check documentation: CLOUD_API_SETUP.md, DEPLOYMENT_GUIDE.md
2. Review API logs: `pm2 logs releye-api`
3. Test API: `./test-cloud-api.sh`
4. Check browser console for errors

## Summary

RelEye now supports true multi-device, multi-browser access through cloud-based authentication while maintaining maximum privacy by keeping all relationship data local. The hybrid architecture provides the best of both worlds: convenient access from anywhere with full control over sensitive data.
