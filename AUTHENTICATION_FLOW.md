# RelEye Authentication & User Management Flow

## Overview
RelEye implements a secure, cloud-based authentication system where user credentials are stored safely at the spark.kv cloud storage (accessible via `window.spark.kv` API), while workspace data remains locally encrypted on the user's device.

## Architecture Summary

### Cloud Storage (spark.kv)
- **What's Stored**: Username and password hash only
- **Storage Location**: `relay.boestad.com` (via spark.kv API)
- **Security**: PBKDF2-hashed passwords with 210,000 iterations + SHA-256
- **Persistence**: Survives browser refreshes, accessible across sessions
- **Key Name**: `user-credentials`

### Local Storage (Encrypted Files)
- **What's Stored**: All workspace data (persons, connections, groups, activity logs)
- **Storage Location**: User's computer (.enc.releye files)
- **Security**: AES-256-GCM encryption
- **Persistence**: Manual save/load by user

## Complete Authentication Flow

### 1. First-Time Administrator Setup

**Location**: `FirstTimeSetup.tsx` → `App.tsx:handleFirstTimeSetup`

**User Journey**:
1. User opens RelEye for the first time
2. App checks `spark.kv.get('user-credentials')` → returns `null`
3. FirstTimeSetup screen appears
4. User enters username (min 3 chars) and password (min 8 chars)
5. User confirms password

**Technical Flow**:
```typescript
// FirstTimeSetup.tsx calls onComplete
onComplete(username.trim(), password)

// App.tsx:handleFirstTimeSetup
async function handleFirstTimeSetup(username: string, password: string) {
  // 1. Hash the password using PBKDF2
  const passwordHash = await hashPassword(password)
  const credentials = { username, passwordHash }
  
  // 2. Write directly to spark.kv (PRIMARY operation)
  await window.spark.kv.set('user-credentials', credentials)
  
  // 3. Wait for cloud persistence to complete
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 4. Verify the write was successful
  const savedCreds = await window.spark.kv.get('user-credentials')
  if (!savedCreds) {
    throw new Error('Failed to save credentials')
  }
  
  // 5. Update React state for reactivity
  setUserCredentials(() => credentials)
  
  // 6. Mark user as authenticated
  setIsAuthenticated(true)
  
  // 7. User proceeds to FileManager
}
```

**Result**: 
- Credentials stored at `relay.boestad.com` via spark.kv
- User automatically logged in
- FileManager screen appears

### 2. Subsequent Login (Returning User)

**Location**: `LoginView.tsx`

**User Journey**:
1. User opens RelEye
2. App checks `spark.kv.get('user-credentials')` → credentials exist
3. LoginView screen appears with username/password fields
4. User enters credentials
5. Password is verified against stored hash
6. User authenticated if match

**Technical Flow**:
```typescript
// LoginView.tsx
async function handleLogin(e: FormEvent) {
  // 1. Load stored credentials from spark.kv
  const userSettings = await spark.kv.get('user-credentials')
  
  // 2. Verify username matches
  if (username.trim() !== userSettings.username) {
    return error('Invalid username or password')
  }
  
  // 3. Verify password using PBKDF2 comparison
  const isValid = await verifyPassword(password, userSettings.passwordHash)
  
  // 4. If valid, call onLogin() to set isAuthenticated = true
  if (isValid) {
    onLogin()  // → App.tsx sets isAuthenticated = true
  }
}
```

**Result**:
- User authenticated
- FileManager screen appears

### 3. Creating a New Network

**Location**: `FileManager.tsx:handleCreateNetwork`

**User Journey**:
1. User clicks "New Network" button
2. Dialog appears requesting filename and password (for file encryption)
3. User optionally includes sample data
4. User clicks "Create Network"

**Technical Flow**:
```typescript
async function handleCreateNetwork() {
  // 1. Load current user credentials from spark.kv
  const credentials = await window.spark.kv.get('user-credentials')
  
  if (!credentials) {
    return toast.error('User credentials not loaded')
  }
  
  // 2. Create admin user object for workspace
  const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const adminUser = {
    userId,
    username: credentials.username,
    role: 'admin',
    addedAt: Date.now(),
    addedBy: 'system',
    status: 'active'
  }
  
  // 3. Create workspace with admin user
  const workspace = {
    persons: [],
    connections: [],
    groups: [],
    users: [adminUser],  // ← Admin user embedded in workspace
    ownerId: userId,
    activityLog: [],
    createdAt: Date.now()
  }
  
  // 4. Encrypt workspace with user-provided password
  const encrypted = await encryptData(
    serializeWorkspace(workspace), 
    filePassword  // NOT the login password!
  )
  
  // 5. Create download blob
  const blob = new Blob([JSON.stringify(encrypted)])
  const url = URL.createObjectURL(blob)
  
  // 6. Offer download to user
  // 7. Load workspace into WorkspaceView
}
```

**Important Notes**:
- **Two Passwords**: Login password (cloud-stored) vs. File encryption password (never stored)
- **User Injection**: Admin user automatically added to workspace.users array
- **Cloud Data**: Only username from cloud credentials is used
- **Local Data**: All workspace content stays in encrypted file

### 4. Loading an Existing Network

**Location**: `FileManager.tsx:handleLoadNetwork`

**User Journey**:
1. User clicks "Load Network" button
2. User selects .enc.releye file from computer
3. User enters file encryption password
4. File decrypted and loaded

**Technical Flow**:
```typescript
async function handleLoadNetwork() {
  // 1. Read encrypted file
  const fileContent = await loadingFile.text()
  const encrypted = JSON.parse(fileContent)
  
  // 2. Decrypt with user-provided password
  const decrypted = await decryptData(encrypted, loadPassword)
  const workspace = deserializeWorkspace(decrypted)
  
  // 3. Pass to App.tsx:handleLoad
  onLoad(workspace, fileName, password)
}

// App.tsx:handleLoad ensures current user is in workspace
async function handleLoad(workspace, fileName, password) {
  const credentials = await spark.kv.get('user-credentials')
  
  // Check if current user exists in workspace.users
  const currentUser = workspace.users?.find(
    u => u.username === credentials.username
  )
  
  // If not, inject them as admin
  if (!currentUser) {
    workspace.users.push({
      userId: generateId(),
      username: credentials.username,
      role: 'admin',
      addedAt: Date.now(),
      addedBy: 'system',
      status: 'active'
    })
  }
  
  // Load workspace into WorkspaceView
  setInitialWorkspace(workspace)
}
```

**Important Notes**:
- User credentials fetched from cloud (`spark.kv`)
- Current authenticated user automatically injected if missing
- This ensures the logged-in user always has admin access to loaded workspaces

### 5. Workspace Session (WorkspaceView)

**Location**: `WorkspaceView.tsx`

**Technical Flow**:
```typescript
useEffect(() => {
  async function ensureCurrentUserInWorkspace() {
    // 1. Load credentials from cloud
    const creds = await window.spark.kv.get('user-credentials')
    
    if (!creds) return
    
    // 2. Check if user exists in workspace.users array
    const currentUser = workspace.users?.find(
      u => u.username === creds.username
    )
    
    // 3. If missing, inject as admin
    if (!currentUser) {
      const adminUser = {
        userId: generateId(),
        username: creds.username,
        role: 'admin',
        addedAt: Date.now(),
        addedBy: 'system',
        status: 'active'
      }
      
      setWorkspace(current => ({
        ...current,
        users: [...(current.users || []), adminUser],
        ownerId: current.ownerId || adminUser.userId
      }))
    }
  }
  
  ensureCurrentUserInWorkspace()
}, [workspace.users])
```

**Purpose**: Guarantees the logged-in user can always access admin features

### 6. Admin Dashboard Access

**Location**: `SettingsDialog.tsx` → `AdminDashboard.tsx`

**User Journey**:
1. User clicks Settings → Admin tab (only visible if user is admin)
2. User clicks "Open Admin Dashboard"
3. Full-screen dashboard opens

**Technical Flow**:
```typescript
// SettingsDialog.tsx determines if Admin tab is visible
const [userCredentials] = useKV('user-credentials', null)

const currentUser = workspace.users?.find(
  u => u.username === userCredentials?.username
)

const isAdmin = currentUser?.role === 'admin'

// Admin tab only renders if isAdmin === true
{isAdmin && (
  <TabsTrigger value="admin">
    <Shield /> Admin
  </TabsTrigger>
)}
```

**Important Notes**:
- Admin role determined by workspace.users array (stored in encrypted file)
- User credentials (username) fetched from cloud to match against workspace users
- Multi-user workspaces have multiple users in workspace.users array
- First user to create/load workspace always gets admin role

### 7. Changing Password

**Location**: `SettingsDialog.tsx:handleSaveUserSettings`

**User Journey**:
1. User opens Settings → User tab
2. User enters current password, new password, and confirmation
3. User clicks "Save Changes"

**Technical Flow**:
```typescript
async function handleSaveUserSettings() {
  // 1. Verify current password
  const isValid = await verifyPassword(
    currentPassword, 
    userCredentials.passwordHash
  )
  
  if (!isValid) {
    return toast.error('Current password is incorrect')
  }
  
  // 2. Hash new password
  const newHash = await hashPassword(newPassword)
  const newCreds = {
    username: username.trim(),
    passwordHash: newHash
  }
  
  // 3. Write directly to spark.kv (PRIMARY)
  await window.spark.kv.set('user-credentials', newCreds)
  
  // 4. Wait for persistence
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 5. Update React state
  setUserCredentials(() => newCreds)
  
  toast.success('Password updated successfully')
}
```

**Result**: New password stored at `relay.boestad.com`, user can log in with new password

### 8. Invite-Based User Addition (Future Feature)

**Location**: `AdminDashboard.tsx` → `InviteAcceptView.tsx`

**Flow** (when implemented):
1. Admin generates invite link in Admin Dashboard
2. Invite data stored in workspace.users array as 'pending' status
3. Admin shares invite link (contains workspace ID + token)
4. New user clicks link
5. New user creates account (username + password)
6. New user credentials saved to spark.kv under their username
7. Workspace user status changed from 'pending' to 'active'
8. New user can now log in and access the workspace

## Critical Implementation Details

### Why Direct spark.kv Writes?

```typescript
// ❌ WRONG - Relies on React state sync timing
setUserCredentials({ username, passwordHash })
setIsAuthenticated(true)  // May execute before KV write completes!

// ✅ CORRECT - Ensures cloud persistence before proceeding
await window.spark.kv.set('user-credentials', { username, passwordHash })
await new Promise(resolve => setTimeout(resolve, 500))  // Wait for sync
const verified = await window.spark.kv.get('user-credentials')
if (!verified) throw new Error('Save failed')
setUserCredentials(() => verified)  // Sync React state
setIsAuthenticated(true)  // Now safe to proceed
```

### Why Two Passwords?

1. **Login Password**: 
   - Hashed with PBKDF2 (210,000 iterations)
   - Stored at `relay.boestad.com` via spark.kv
   - Used for authentication
   - Can be changed in Settings

2. **File Encryption Password**:
   - Used to encrypt/decrypt .enc.releye files
   - NEVER stored anywhere
   - Used with AES-256-GCM
   - If lost, file is permanently unrecoverable

### Security Guarantees

✅ **What's Cloud-Stored** (relay.boestad.com):
- Username (plaintext)
- Password hash (PBKDF2 with 210k iterations + SHA-256)
- Salt used for hashing

✅ **What's Local-Only** (encrypted files):
- All workspace data
- Person records, connections, groups
- Activity logs
- User list with roles

✅ **What's NEVER Stored**:
- Plaintext passwords
- File encryption passwords
- Workspace content (stays in files)

## Testing the Flow

### Test 1: First-Time Setup
1. Clear all data: `await spark.kv.delete('user-credentials')`
2. Refresh page
3. Should see "Create Administrator Account" screen
4. Enter username: "admin", password: "test1234"
5. Should see "Administrator account created successfully!"
6. Should land on FileManager screen
7. Refresh page → should see Login screen
8. Login with "admin" / "test1234" → should succeed

### Test 2: Create & Load Network
1. Login as admin
2. Click "New Network"
3. Enter filename: "test-network", password: "file1234"
4. Click "Create Network"
5. Download file and click "Continue Without Download"
6. Should see workspace canvas with admin user in Settings → Admin tab
7. Click "Load Network"
8. Select downloaded file
9. Enter password: "file1234"
10. Should load workspace with admin access

### Test 3: Admin Access
1. Login and load workspace
2. Open Settings dialog
3. Verify "Admin" tab is visible
4. Click Admin tab
5. Click "Open Admin Dashboard"
6. Should see full admin interface with user management

### Test 4: Password Change
1. Login as admin
2. Open Settings → User tab
3. Enter current password, new password, confirmation
4. Click "Save Changes"
5. Logout
6. Login with new password → should succeed
7. Login with old password → should fail

## Troubleshooting

### "User credentials not found" Error
**Cause**: spark.kv read timing issue
**Solution**: Components now use direct `window.spark.kv.get()` with proper async/await

### Admin Tab Not Showing
**Cause**: User not in workspace.users array
**Solution**: WorkspaceView now auto-injects current user as admin

### Credentials Not Persisting
**Cause**: Using setUserCredentials before KV write completes
**Solution**: All critical paths now use direct KV writes with verification

### Can't Access Admin Dashboard
**Check**:
1. Are you logged in? Check `await spark.kv.get('user-credentials')`
2. Is your username in workspace.users? Check workspace data
3. Is your role 'admin'? Check user.role in workspace.users
4. Open browser console and look for `[SettingsDialog] isAdmin:` logs

## Summary

RelEye's authentication system is **secure, distributed, and privacy-focused**:

- 🔐 **Credentials**: Cloud-stored at relay.boestad.com with PBKDF2 hashing
- 📁 **Workspace Data**: Local-only, AES-256 encrypted files
- 👤 **User Management**: Per-workspace roles embedded in encrypted files
- 🛡️ **Admin Access**: Automatic admin role for workspace creator
- 🔑 **Zero-Knowledge**: File passwords never stored, ensuring true privacy

The system balances convenience (persistent authentication) with security (local-only data, strong encryption, separate passwords for files).
