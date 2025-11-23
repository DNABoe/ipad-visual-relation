# Backend API Migration Complete

## What Changed

The application now uses the MySQL database at `releye.boestad.com/api` for **all user authentication and management** instead of `spark.kv` or localStorage.

### Key Changes:

1. **New API Client** (`src/lib/apiClient.ts`)
   - Centralized API communication layer
   - Handles authentication tokens in localStorage
   - Makes requests to `https://releye.boestad.com/api`

2. **Updated User Registry** (`src/lib/userRegistry.ts`)
   - All user operations now call the backend API
   - No more `spark.kv` dependencies for user data
   - Authentication tokens stored in localStorage only

3. **Enhanced PHP Backend** (`php-backend/index.php`)
   - Added `auth/register` endpoint
   - Added `users/create` endpoint
   - Added `invites/create` endpoint
   - Added `invites/accept` endpoint
   - Fixed invites to use `inviteId` for revocation

## How Authentication Works Now

### User Session Flow:

1. **First Time Setup**
   - Frontend calls `GET /api?endpoint=auth/first-time`
   - Backend checks MySQL for admin users
   - If no admin exists, shows first-time setup screen
   - User creates admin account via `POST /api?endpoint=auth/register`
   - Backend returns JWT token
   - Token stored in localStorage as `releye-auth-token`

2. **Login**
   - User enters credentials
   - Frontend calls `POST /api?endpoint=auth/login`
   - Backend verifies against MySQL database
   - Returns JWT token on success
   - Token stored in localStorage

3. **Session Persistence**
   - On app load, frontend checks for token in localStorage
   - If token exists, calls `GET /api?endpoint=auth/verify`
   - Backend validates token and returns user data
   - User automatically logged in

4. **Logout**
   - Token removed from localStorage
   - User redirected to login screen

### Data Storage Locations:

- **User credentials & accounts**: MySQL database (backend)
- **Authentication tokens**: localStorage (frontend)
- **Workspace data**: Still uses `useKV` hook (spark.kv)
- **Temporary UI state**: React useState

## Backend Deployment

The PHP backend is already deployed at `https://releye.boestad.com/api`. Make sure these files are uploaded to your Spaceship cPanel:

```
php-backend/
├── .htaccess           # URL rewriting rules
├── config.php          # Database configuration
├── database.php        # Database connection class
├── helpers.php         # Helper functions (JWT, CORS, etc.)
└── index.php           # Main API router (UPDATED)
```

## Frontend Changes Required

The frontend code has been updated but needs to be built and deployed:

### To Deploy Updated Frontend:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Upload to Spaceship:**
   Upload the contents of the `dist/` folder to your public_html directory at `releye.boestad.com`

3. **Verify:**
   - Visit https://releye.boestad.com
   - Should show first-time setup if no admin exists
   - Or login screen if admin exists

## Testing the Migration

### 1. Reset Everything (Fresh Start):
   ```
   https://releye.boestad.com/api?endpoint=auth/reset-all
   ```
   POST request (you can use the diagnostic page)

### 2. Check First-Time Status:
   ```
   https://releye.boestad.com/api?endpoint=auth/first-time
   ```
   Should return: `{"success":true,"data":{"isFirstTime":true}}`

### 3. Create Admin Account:
   Use the first-time setup screen on the frontend

### 4. Verify User in Database:
   Check the `users` table in MySQL via cPanel phpMyAdmin

## API Endpoints Reference

### Authentication:
- `GET /api?endpoint=auth/first-time` - Check if setup needed
- `POST /api?endpoint=auth/register` - Register first admin
- `POST /api?endpoint=auth/login` - Login user
- `GET /api?endpoint=auth/verify` - Verify JWT token
- `POST /api?endpoint=auth/reset-all` - Reset all data

### Users (requires admin token):
- `GET /api?endpoint=users` - List all users
- `POST /api?endpoint=users/create` - Create new user
- `PUT /api?endpoint=users/{userId}` - Update user
- `DELETE /api?endpoint=users/{userId}` - Delete user

### Invitations (requires admin token):
- `GET /api?endpoint=invites` - List all invitations
- `POST /api?endpoint=invites/create` - Create invitation
- `POST /api?endpoint=invites/accept` - Accept invitation (public)
- `DELETE /api?endpoint=invites/{inviteId}` - Revoke invitation

## Troubleshooting

### "No authentication token provided"
- Normal for endpoints that require admin access
- Login as admin first to get a token

### "User with this email already exists"
- Check the database directly via phpMyAdmin
- Use the reset endpoint if you need to start fresh

### Frontend shows login but backend says isFirstTime=true
- Clear browser localStorage
- Hard refresh the page (Ctrl+Shift+R)
- Check that the frontend is making requests to the correct API URL

### Token expired or invalid
- Tokens expire after 30 days
- User needs to log in again

## Migration Checklist

- [x] Created API client layer
- [x] Updated userRegistry to use backend
- [x] Added missing PHP endpoints
- [x] Removed spark.kv dependencies for auth
- [ ] Build frontend with `npm run build`
- [ ] Upload `dist/` contents to Spaceship
- [ ] Upload updated `php-backend/index.php` to Spaceship
- [ ] Test first-time setup flow
- [ ] Test login/logout flow
- [ ] Test user session persistence across browser restarts

## Important Notes

- **Workspace data (person nodes, connections, etc.) still uses spark.kv** - This migration only affects user authentication
- The API base URL is hardcoded to `https://releye.boestad.com/api` in `src/lib/apiClient.ts`
- Authentication tokens are stored in localStorage with key `releye-auth-token`
- Current user ID is stored in localStorage with key `releye-current-user-id`
