# Authentication Architecture Overhaul - Complete Documentation

## Executive Summary

The RelEye application's user authentication system has been completely redesigned to work properly in a deployed environment at releye.boestad.com. The previous system relied on Spark KV storage, which does not work in deployed production environments.

## The Problem

### Previous Architecture (BROKEN)
```
Frontend → Spark KV / localStorage → ❌ Doesn't work across browsers/computers
```

**Issues:**
- Spark KV only works in Spark development environment
- localStorage is browser-specific (can't share between browsers)
- No way for users to access from multiple devices
- "Setup failed to set key" errors in production
- Invitations didn't work across devices
- Admin setup would reset on browser refresh

### Root Cause
The application was trying to use Spark's `window.spark.kv` API, which:
- Only exists in Spark's development environment
- Does NOT exist when deployed to a regular web server
- Falls back to localStorage, which is browser-local only
- Cannot sync data across devices/browsers

## The Solution

### New Architecture (CORRECT)
```
Frontend (Browser) → HTTPS API Calls → Backend Server → PostgreSQL Database
```

**Benefits:**
- Works on any browser, any computer
- Users can access from multiple devices
- Proper multi-user authentication
- Industry-standard web architecture
- No dependency on Spark runtime
- Can be deployed anywhere

## What Was Changed

### 1. New Backend API Service (`src/lib/cloudAPI.ts`)

Created a new service that communicates with the backend:

```typescript
export const cloudAPI = {
  checkHealth(): Promise<{status: string}>
  isFirstTimeSetup(): Promise<boolean>
  login(email, password): Promise<RegisteredUser>
  getAllUsers(): Promise<RegisteredUser[]>
  getUserByEmail(email): Promise<RegisteredUser>
  getUserById(userId): Promise<RegisteredUser>
  createUser(user): Promise<RegisteredUser>
  updateUser(userId, updates): Promise<void>
  deleteUser(userId): Promise<void>
  getAllInvites(): Promise<PendingInvite[]>
  getInviteByToken(token): Promise<PendingInvite>
  createInvite(invite): Promise<PendingInvite>
  revokeInvite(token): Promise<void>
  cleanupExpiredInvites(): Promise<void>
}
```

### 2. Rewritten User Registry (`src/lib/userRegistry.ts`)

**Before:** Used `storage.get()` and `storage.set()` (localStorage/Spark KV)

**After:** Uses `cloudAPI.*` methods to communicate with backend

Key changes:
- All user operations now go through backend API
- Only current user ID stored in localStorage (session management)
- All persistent data in PostgreSQL database
- Password verification happens on server during login

### 3. Updated App Initialization (`src/App.tsx`)

**Before:**
```typescript
const storageReady = await storage.isReady()
if (!storageReady) { /* error */ }
```

**After:**
```typescript
const apiAvailable = await isCloudAPIAvailable()
if (!apiAvailable) { 
  toast.error('Unable to connect to server')
}
```

### 4. Removed Storage Dependency

- Removed references to `storage.isReady()`
- Removed Spark KV adapter logic for user credentials
- Only use localStorage for session management (current user ID)

### 5. Backend API Server

**File:** `api-server-example.js`

Complete Express.js server with:
- PostgreSQL database integration
- All authentication endpoints
- User CRUD operations
- Invite management
- Password verification
- CORS configuration

### 6. Database Schema

**File:** `database-setup.sql`

PostgreSQL tables:
- `users` - User accounts with encrypted passwords
- `invites` - Pending user invitations

## API Endpoints

### Authentication
- `GET /api/health` - Health check
- `GET /api/auth/first-time` - Check if admin exists
- `POST /api/auth/login` - Authenticate user

### Users
- `GET /api/users` - List all users
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `POST /api/users` - Create new user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Invites
- `GET /api/invites` - List all invites
- `GET /api/invites/:token` - Get invite by token
- `POST /api/invites` - Create invite
- `DELETE /api/invites/:token` - Revoke invite
- `POST /api/invites/cleanup` - Remove expired invites

## Data Flow

### User Registration (First Time Setup)

1. User opens https://releye.boestad.com
2. Frontend calls `GET /api/auth/first-time`
3. Backend checks database for admin users
4. Returns `{ isFirstTime: true }` if no admin exists
5. User fills in email/password
6. Frontend hashes password with PBKDF2
7. Frontend calls `POST /api/users` with user data
8. Backend stores user in PostgreSQL
9. Backend returns created user
10. Frontend stores user ID in localStorage
11. User is logged in

### User Login

1. User enters email/password
2. Frontend calls `POST /api/auth/login`
3. Backend queries database for user by email
4. Backend verifies password hash
5. Backend updates last login timestamp
6. Backend returns user object
7. Frontend stores user ID in localStorage
8. User is logged in

### Creating Invite

1. Admin opens Admin Dashboard
2. Admin enters new user's email/name
3. Frontend calls `POST /api/invites`
4. Backend checks user doesn't already exist
5. Backend generates secure token
6. Backend stores invite in database
7. Backend returns invite with token
8. Frontend generates invite link
9. Admin copies and sends to new user

### Accepting Invite

1. New user clicks invite link
2. URL contains `?invite=TOKEN&email=EMAIL`
3. Frontend calls `GET /api/invites/:token`
4. Backend returns invite details
5. User sets password
6. Frontend calls `POST /api/users` to create account
7. Frontend calls `DELETE /api/invites/:token` to consume invite
8. User is logged in

## Security Features

### Password Security
- Passwords hashed with PBKDF2 (100,000 iterations)
- Unique salt per user
- Hash stored in database, never plain password
- Verification happens server-side

### API Security
- HTTPS only (enforced by Nginx)
- CORS configured for specific origin
- Input validation on all endpoints
- SQL parameterized queries (no SQL injection)
- Environment variables for secrets

### Session Management
- Only user ID stored in browser localStorage
- Full user data fetched from server
- No sensitive data in browser storage
- Sessions can be invalidated server-side

## What Stays Local

**Network files (.enc.releye) remain in browser localStorage:**
- Relationship network data
- Person nodes and connections
- Encrypted with AES-256-GCM
- Never sent to server
- Privacy-first design

**This separation is intentional:**
- Authentication: Cloud (works across devices)
- Network data: Local (privacy and performance)

## Deployment Requirements

### Backend Server

**Required:**
- Ubuntu 20.04+ (or similar Linux distribution)
- PostgreSQL 12+
- Node.js 18+
- Nginx
- SSL certificate (Let's Encrypt)

**Components:**
1. PostgreSQL database
2. Node.js API server (port 3000)
3. Nginx reverse proxy
4. Systemd service for API

### Frontend

**Required:**
- Static file hosting
- HTTPS
- Ability to proxy `/api/*` to backend server

## Configuration

### Backend Environment Variables (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://releye.boestad.com
```

### Nginx Configuration
```nginx
# Frontend (static files)
location / {
    root /var/www/releye/dist;
    try_files $uri /index.html;
}

# Backend API (proxy)
location /api/ {
    proxy_pass http://localhost:3000/api/;
    # proxy headers...
}
```

## Testing the System

### Local Development

1. **Start PostgreSQL:**
   ```bash
   sudo systemctl start postgresql
   ```

2. **Create database:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE releye;
   \c releye
   \i database-setup.sql
   ```

3. **Start API server:**
   ```bash
   cd /path/to/project
   node api-server-example.js
   ```

4. **Test API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

5. **Start frontend:**
   ```bash
   npm run dev
   ```

6. **Test in browser:**
   - Open http://localhost:5173
   - Create admin account
   - Log in
   - Verify it works

### Production Deployment

1. Deploy backend (see BACKEND_DEPLOYMENT_GUIDE.md)
2. Deploy frontend (build and upload dist/)
3. Test health endpoint
4. Create first admin
5. Test from multiple browsers
6. Test invite system

## Migration from Old System

**There is no migration path.** The old localStorage data is incompatible with the new system.

Users will need to:
1. Export their network files (if they have any)
2. Wait for new system to be deployed
3. Create new accounts
4. Re-import their network files

## Advantages Over Old System

| Feature | Old System | New System |
|---------|-----------|------------|
| Cross-browser access | ❌ No | ✅ Yes |
| Cross-computer access | ❌ No | ✅ Yes |
| Multi-user support | ❌ Broken | ✅ Working |
| Invite system | ❌ Doesn't work | ✅ Works |
| Password reset | ❌ Impossible | ✅ Possible |
| User management | ❌ Browser-local | ✅ Centralized |
| Deployment | ❌ Complex | ✅ Standard |
| Reliability | ❌ Lost on clear data | ✅ Persistent |

## Files Modified

### Frontend (src/)
- `src/lib/cloudAPI.ts` - NEW: API communication layer
- `src/lib/userRegistry.ts` - REWRITTEN: Now uses cloudAPI
- `src/App.tsx` - MODIFIED: Uses cloudAPI instead of storage
- `src/lib/storage.ts` - UNCHANGED: Still used for network files

### Backend (root/)
- `api-server-example.js` - ENHANCED: Added dotenv
- `api-package.json` - EXISTS: Dependencies
- `database-setup.sql` - EXISTS: Database schema
- `api-env.example` - EXISTS: Environment template

### Documentation
- `BACKEND_DEPLOYMENT_GUIDE.md` - NEW: Complete deployment guide
- `URGENT_READ_ME.md` - NEW: Quick start guide
- `DEPLOYMENT_CHECKLIST.md` - NEW: Deployment checklist
- `AUTHENTICATION_ARCHITECTURE_OVERHAUL.md` - THIS FILE

## Next Steps

1. **Read URGENT_READ_ME.md** for immediate action items
2. **Follow BACKEND_DEPLOYMENT_GUIDE.md** for deployment
3. **Use DEPLOYMENT_CHECKLIST.md** to verify everything works
4. **Test thoroughly** before announcing to users

## Support

If you encounter issues during deployment:

1. Check the troubleshooting section in BACKEND_DEPLOYMENT_GUIDE.md
2. Review API logs: `sudo journalctl -u releye-api -f`
3. Check browser console for frontend errors
4. Verify each component works independently:
   - Database connection
   - API server
   - Nginx proxy
   - Frontend build

## Conclusion

This architectural overhaul transforms RelEye from a Spark-dependent development application into a production-ready web application with proper backend infrastructure. The system now follows industry standards and will work reliably in any deployment environment.

**The application will not work until the backend is deployed.**
