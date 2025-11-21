# Cross-Session & Cross-Browser Persistence Architecture

## Overview

RelEye now uses **Spark KV** (GitHub-backed key-value storage) for ALL authentication and user data persistence. This ensures that user credentials, sessions, and data are accessible across:

- ✅ Different browsers (Chrome, Firefox, Safari, etc.)
- ✅ Different devices (desktop, mobile, tablet)
- ✅ Different sessions (page refreshes, browser restarts)
- ✅ Different platforms (Windows, Mac, Linux)

## What is Spark KV?

Spark KV is a persistent storage layer backed by GitHub that provides:

1. **Global Persistence**: Data is stored in your GitHub account, not locally
2. **Cross-Device Access**: Access your data from any device/browser
3. **Automatic Sync**: Changes are automatically synced across all sessions
4. **Reliability**: GitHub-backed storage with built-in redundancy

## Architecture Components

### 1. User Registry (`src/lib/userRegistry.ts`)

All user-related data is stored in Spark KV:

```typescript
// Storage Keys
const USERS_KV_KEY = 'releye-users'           // All registered users
const INVITES_KV_KEY = 'releye-invites'       // Pending invites
const CURRENT_USER_KEY = 'releye-current-user-id'  // Active session
```

### 2. Persisted Data

#### User Credentials
```typescript
interface RegisteredUser {
  userId: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  passwordHash: PasswordHash        // Securely hashed
  createdAt: number
  lastLogin?: number
  loginCount: number
  canInvestigate: boolean
}
```

**Storage**: `window.spark.kv.set('releye-users', users[])`

#### Active Session
```typescript
// Current logged-in user ID
await window.spark.kv.set('releye-current-user-id', userId)
```

**Storage**: `window.spark.kv.set('releye-current-user-id', string)`

#### Pending Invites
```typescript
interface PendingInvite {
  inviteId: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  token: string
  createdAt: number
  expiresAt: number
  createdBy: string
}
```

**Storage**: `window.spark.kv.set('releye-invites', invites[])`

## Key Functions

### Session Management

```typescript
// Set current user (persists across browsers/devices)
await setCurrentUser(userId)
// → Saves to window.spark.kv.set('releye-current-user-id', userId)

// Get current user (works across browsers/devices)
const user = await getCurrentUser()
// → Reads from window.spark.kv.get('releye-current-user-id')

// Clear session (logout)
await clearCurrentUser()
// → Deletes from window.spark.kv.delete('releye-current-user-id')
```

### User Authentication

```typescript
// Authenticate and create persistent session
const user = await authenticateUser(email, password)
// → Verifies credentials
// → Updates lastLogin timestamp
// → Calls setCurrentUser(userId) to persist session
```

## Security Features

### 1. Password Hashing
- Uses **PBKDF2** with SHA-256
- 210,000 iterations
- 32-byte random salt per user
- Passwords are NEVER stored in plain text

### 2. Secure Storage
- All data stored in Spark KV (GitHub-backed)
- Session tokens stored securely
- No sensitive data in localStorage

## Migration from localStorage

**Before (OLD - Browser-specific):**
```typescript
// Only worked on same browser
localStorage.setItem('releye-current-user-id', userId)
const userId = localStorage.getItem('releye-current-user-id')
```

**After (NEW - Cross-browser/device):**
```typescript
// Works across all browsers and devices
await window.spark.kv.set('releye-current-user-id', userId)
const userId = await window.spark.kv.get('releye-current-user-id')
```

## How It Works

### First-Time Setup Flow
1. User opens app on **Browser A**
2. Creates admin account
3. Credentials saved to `window.spark.kv`
4. Session saved to `window.spark.kv`

### Cross-Browser Login Flow
1. User opens app on **Browser B**
2. App checks `window.spark.kv.get('releye-current-user-id')`
3. Finds existing session from Browser A
4. User is automatically logged in!

### After Logout Flow
1. User logs out on **Browser A**
2. `window.spark.kv.delete('releye-current-user-id')` is called
3. User opens app on **Browser B**
4. No session found, login screen shown

## Testing Cross-Session Persistence

### Test 1: Cross-Browser Session
```bash
# Browser 1 (Chrome)
1. Create account with email: admin@example.com
2. Note the browser shows you're logged in

# Browser 2 (Firefox)
1. Open the same app URL
2. ✅ You should be automatically logged in as admin@example.com
```

### Test 2: Page Refresh
```bash
1. Log in to the app
2. Refresh the page (Ctrl+R / Cmd+R)
3. ✅ You should remain logged in
```

### Test 3: Browser Restart
```bash
1. Log in to the app
2. Close the browser completely
3. Reopen the browser and navigate to the app
4. ✅ You should remain logged in
```

### Test 4: Different Device
```bash
# Device 1 (Desktop)
1. Create account with email: admin@example.com

# Device 2 (Mobile/Tablet)
1. Open the same app URL
2. ✅ You should be automatically logged in as admin@example.com
```

## Troubleshooting

### Session Not Persisting Across Browsers?

**Check 1: Verify Spark KV is available**
```typescript
// In browser console
console.log(window.spark.kv)
// Should show: { get: function, set: function, delete: function, keys: function }
```

**Check 2: Verify data is being saved**
```typescript
// In browser console
await window.spark.kv.get('releye-current-user-id')
// Should return a user ID string if logged in
```

**Check 3: Check GitHub authentication**
- Spark KV requires GitHub authentication
- Ensure you're logged in to GitHub
- Ensure the app has necessary permissions

### Data Not Syncing?

**Check network requests**
- Open Browser DevTools → Network tab
- Look for requests to GitHub API
- Verify they're completing successfully

**Check console for errors**
```typescript
// Look for errors like:
[UserRegistry] Failed to get users: ...
[UserRegistry] Failed to set current user: ...
```

## API Reference

### Core Functions

```typescript
// User Management
getAllUsers(): Promise<RegisteredUser[]>
getUserByEmail(email: string): Promise<RegisteredUser | undefined>
getUserById(userId: string): Promise<RegisteredUser | undefined>
createUser(email, name, password, role, canInvestigate): Promise<RegisteredUser>
updateUser(user: RegisteredUser): Promise<void>
deleteUser(userId: string): Promise<void>

// Authentication
authenticateUser(email: string, password: string): Promise<RegisteredUser | null>
isFirstTimeSetup(): Promise<boolean>

// Session Management
getCurrentUser(): Promise<RegisteredUser | undefined>
getCurrentUserId(): Promise<string | undefined>
setCurrentUser(userId: string): Promise<void>
clearCurrentUser(): Promise<void>

// Invite Management
createInvite(email, name, role, createdBy): Promise<PendingInvite>
consumeInvite(token: string, password: string): Promise<RegisteredUser>
revokeInvite(token: string): Promise<void>
getAllInvites(): Promise<PendingInvite[]>

// Utilities
resetAllData(): Promise<void>
generateInviteLink(token: string, email: string): string
```

## Benefits

✅ **Universal Access**: Login once, access from anywhere
✅ **No Re-authentication**: Stay logged in across devices
✅ **Centralized Data**: All user data in one secure location
✅ **Automatic Sync**: Changes propagate immediately
✅ **GitHub Security**: Leverages GitHub's security infrastructure
✅ **No Database Required**: Simple key-value storage model

## Limitations

⚠️ **GitHub Account Required**: Users must have GitHub authentication
⚠️ **Network Dependency**: Requires internet connection for sync
⚠️ **Rate Limits**: Subject to GitHub API rate limits (usually not an issue)

## Summary

RelEye's authentication architecture now provides seamless cross-browser and cross-device persistence using Spark KV (GitHub-backed storage). Users can:

- Create an account on one device
- Access it from any browser/device
- Stay logged in across sessions
- Have all their data synced automatically

All of this happens securely with industry-standard password hashing and GitHub's robust infrastructure.
