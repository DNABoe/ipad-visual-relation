# Authentication & Cloud Storage - Technical Explanation

## Current Implementation

### ✅ What IS Working (And Is Correct)

**User credentials ARE ALREADY stored in the cloud!**

The application uses `spark.kv` API for cloud storage through the `useKV` React hook:

```typescript
// In App.tsx line 14-17
const [userCredentials, setUserCredentials] = useKV<{
  username: string
  passwordHash: PasswordHash
} | null>('user-credentials', null)
```

**How `spark.kv` works:**
- `spark.kv` is the Spark platform's cloud key-value storage
- Data persists across browser sessions and page refreshes
- Accessible at the deployment URL (currently RelEye.boestad.com)
- NOT stored in browser localStorage - it's server-side

**Security measures in place:**
- Passwords are hashed using PBKDF2 with 210,000 iterations
- Hash algorithm: SHA-256
- Random 32-byte salt per password
- Only the hash is stored, never the plaintext password

### Where Credentials Are Stored

1. **User Credentials (Cloud):** `spark.kv` with key `'user-credentials'`
   - Username
   - Password hash (PBKDF2 with 210,000 iterations)
   - Salt
   
2. **Workspace Data (Local Files):** Encrypted .enc.releye files
   - All person nodes, connections, groups
   - Workspace-specific user list and permissions
   - AES-256-GCM encrypted with workspace password

### Authentication Flow

1. **First Time Setup** (App.tsx lines 66-96)
   - User creates admin account
   - Password is hashed
   - Credentials stored to `spark.kv` via `setUserCredentials()`
   - User automatically authenticated

2. **Subsequent Visits** (App.tsx lines 31-64)
   - App checks `spark.kv` for `user-credentials` via `useKV` hook
   - If found → Show login screen
   - If not found → Show first-time setup
   
3. **Login** (LoginView component)
   - User enters password
   - Password hashed with stored salt
   - Hash compared to stored hash
   - If match → Authenticated

4. **Workspace Load** (App.tsx lines 123-191)
   - Workspace file decrypted
   - Current authenticated user checked against workspace.users array
   - If not in array → Automatically added as admin
   - User permissions loaded from workspace

## The Issue

Based on the symptoms described:
- "Refreshing the browser takes me back to admin first time login"
- "Admin tab does not appear in settings"
- "User says: loading..."

### Root Cause Analysis

The issue is NOT with cloud storage (credentials ARE in the cloud).

The issue appears to be:

1. **Race condition in credential loading:** The `useKV` hook may not be fully loaded when the auth check runs
2. **Workspace user synchronization:** When workspace loads, the current user isn't being properly added to workspace.users array
3. **State synchronization:** The SettingsDialog doesn't see the updated workspace.users after the user is added

### Evidence from the Code

In `App.tsx` line 138-145, when a workspace is loaded:

```typescript
let updatedWorkspace = { ...loadedWorkspace }

if (!updatedWorkspace.users) {
  console.log('[App] users array is null/undefined, initializing to []')
  updatedWorkspace.users = []
}

const currentUser = updatedWorkspace.users.find(u => u.username === userCredentials.username)
```

This code SHOULD add the user as admin if they don't exist (lines 153-169), but something in the state flow is preventing the SettingsDialog from seeing this update.

## Next Steps to Fix

1. **Verify credential persistence:** Add more robust error handling for `useKV` operations
2. **Fix workspace user initialization:** Ensure the user is added to workspace before it's passed to WorkspaceView
3. **Add loading states:** Show "Loading credentials..." instead of jumping to setup
4. **Debug logging:** Add comprehensive logging to track credential load timing
5. **State synchronization:** Ensure workspace updates propagate to all components

## Testing the Current Implementation

To verify credentials are in cloud storage:

1. Create admin account
2. Open browser dev tools → Application tab
3. Look for `spark.kv` storage (may appear as IndexedDB or custom storage)
4. Refresh page - credentials should still be there
5. If credentials disappear on refresh → that's the bug
6. If credentials persist but app shows setup anyway → state loading bug
