# RelEye Quick Start Guide

## For Users

### First Time Setup
1. Visit https://releye.boestad.com
2. Create administrator account
3. Log in and start creating networks

### Multi-Device Access
- Use same email/password on any device
- User credentials sync automatically
- Network files stored locally per device
- Transfer files using download/upload

## For Developers

### Local Development (Easy Way)
```bash
# Start backend + database
docker-compose up -d

# Start frontend
npm run dev

# Visit http://localhost:5173
```

### Local Development (Manual Way)
```bash
# Terminal 1: API
node api-server-example.js

# Terminal 2: Frontend
npm run dev
```

### Test API
```bash
./test-cloud-api.sh http://localhost:3000/api
```

## For Deployment

### Backend (Server)
```bash
# On releye.boestad.com server
cd /var/www/releye-api
psql releye < database-setup.sql
npm install
pm2 start api-server-example.js --name releye-api
```

### Frontend (GitHub Pages)
```bash
# Push to GitHub - auto-deploys
git add .
git commit -m "Deploy"
git push origin main
```

### Verify Deployment
```bash
curl https://releye.boestad.com/api/health
# Should return: {"success":true,"data":{"status":"ok"}}
```

## Architecture

### Cloud Storage (PostgreSQL)
- User accounts
- Password hashes
- Invites
- Login stats

### Local Storage (Browser)
- Network files (.enc.releye)
- Encrypted data
- Person nodes
- Connections

## Key Files

### Backend
- `api-server-example.js` - API server
- `database-setup.sql` - Database schema
- `docker-compose.yml` - Local dev setup

### Frontend
- `src/lib/cloudAuthService.ts` - API client
- `src/lib/userRegistry.ts` - User management
- `src/lib/storage.ts` - Local file storage

### Documentation
- `CLOUD_API_SETUP.md` - Backend API guide
- `DEPLOYMENT_GUIDE.md` - Full deployment
- `LOCAL_DEVELOPMENT.md` - Dev setup
- `CLOUD_STORAGE_MIGRATION.md` - Architecture details

## Troubleshooting

### API Not Working
```bash
# Check status
pm2 status

# View logs
pm2 logs releye-api

# Restart
pm2 restart releye-api
```

### Frontend Can't Connect
1. Check console (F12) for errors
2. Verify API URL in `src/lib/cloudAuthService.ts`
3. Test API: `curl http://localhost:3000/api/health`

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## URLs

- **Production Frontend**: https://releye.boestad.com
- **Production API**: https://releye.boestad.com/api
- **Local Frontend**: http://localhost:5173
- **Local API**: http://localhost:3000/api

## Commands Cheat Sheet

```bash
# Development
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
npm run dev                   # Start frontend
npm run build                 # Build for production

# Deployment
pm2 start api-server-example.js    # Start API
pm2 restart releye-api              # Restart API
pm2 logs releye-api                 # View logs
pm2 status                          # Check status

# Database
psql releye < database-setup.sql    # Initialize
psql -U releye_user -d releye       # Connect
docker-compose exec postgres psql   # Connect (Docker)

# Testing
./test-cloud-api.sh                 # Test API
curl http://localhost:3000/api/health  # Health check
```

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://releye.boestad.com/api
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://releye.boestad.com
```

## Next Steps

1. **Try it locally**: `docker-compose up -d && npm run dev`
2. **Read deployment guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. **Deploy backend**: Follow steps in CLOUD_API_SETUP.md
4. **Deploy frontend**: Push to GitHub
5. **Test production**: Visit releye.boestad.com

## Support

- Issues? Check [CLOUD_STORAGE_MIGRATION.md](./CLOUD_STORAGE_MIGRATION.md)
- API problems? Review [CLOUD_API_SETUP.md](./CLOUD_API_SETUP.md)
- Local dev? See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
