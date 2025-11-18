# Backend API URL Configuration

## Current Configuration

The frontend is configured to call the backend API at:
- **Development**: `http://localhost:3000/api`
- **Production**: `${window.location.origin}/api`

This means when deployed to `https://releye.boestad.com`, it will try to connect to `https://releye.boestad.com/api`.

## Deployment Options

### Option 1: Same Domain with Subdirectory (Requires Backend on Same Server)

If your hosting supports Node.js applications, you can run both frontend and backend on the same domain:

- Frontend: `https://releye.boestad.com/`
- Backend: `https://releye.boestad.com/api`

**Current configuration works with this setup!** No code changes needed.

### Option 2: Subdomain for API (Recommended for Spaceship)

Use a subdomain for the API server:

- Frontend: `https://releye.boestad.com`
- Backend: `https://api.releye.boestad.com`

**Requires code change** in `src/lib/cloudAPI.ts`:

```typescript
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api'
  : 'https://api.releye.boestad.com/api'  // <- Change this line
```

### Option 3: Different Domain

Use a completely different domain for the API:

- Frontend: `https://releye.boestad.com`
- Backend: `https://releye-api.yourdomain.com`

**Requires code change** in `src/lib/cloudAPI.ts`:

```typescript
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api'
  : 'https://releye-api.yourdomain.com/api'  // <- Change this line
```

## Recommended Setup for Spaceship.com Hosting

Since Spaceship.com is primarily a shared hosting provider without Node.js support:

1. **Frontend** → GitHub Pages at `https://releye.boestad.com`
2. **Backend** → DigitalOcean/AWS at `https://api.releye.boestad.com`
3. **Database** → MySQL on Spaceship cPanel at `releye.boestad.com:3306`

### Step 1: Update API URL

Edit `src/lib/cloudAPI.ts`:

```typescript
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api'
  : 'https://api.releye.boestad.com/api'
```

### Step 2: Setup DNS

In Spaceship DNS management:

```
Type: A
Host: api
Value: [YOUR_DIGITALOCEAN_DROPLET_IP]
TTL: 3600
```

### Step 3: Configure CORS on Backend

In backend `.env`:

```env
CORS_ORIGIN=https://releye.boestad.com
```

## Testing the Connection

After deployment, test the API connection:

1. **Open browser console** on `https://releye.boestad.com`
2. **Run test**:
   ```javascript
   fetch('https://api.releye.boestad.com/api/health')
     .then(r => r.json())
     .then(d => console.log(d))
   ```
3. **Expected response**:
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

## Quick Update Script

To quickly update the API URL:

```bash
# Update API URL for subdomain deployment
sed -i 's|${window.location.origin}/api|https://api.releye.boestad.com/api|g' src/lib/cloudAPI.ts

# Rebuild
npm run build

# Deploy
git add .
git commit -m "Update API URL for production"
git push origin main
```

## Environment-Based Configuration (Advanced)

For more flexibility, you can use build-time environment variables:

**vite.config.ts:**
```typescript
export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || '/api')
  }
})
```

**src/lib/cloudAPI.ts:**
```typescript
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api'
  : __API_URL__
```

**Build with custom URL:**
```bash
VITE_API_URL=https://api.releye.boestad.com/api npm run build
```
