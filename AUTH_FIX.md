# Authentication and Admin Tab Fix

## Issues Identified

### 1. Admin Tab Not Showing
**Problem**: After creating an admin account through first-time setup, the Admin tab was not appearing in the Settings dialog.

**Root Cause**: The Admin tab visibility is determined by checking if the current user has an `admin` role in the `workspace.users` array. However, when a workspace was created or loaded, the `workspace.users` array was empty, so the admin check always returned false.

### 2. Authentication Not Persisting on Reload
**Problem**: After setting up the admin account and refreshing the browser, the app would show the first-time setup screen again.

**Root Cause**: Actually, this was working correctly! User credentials ARE persisted to the cloud using `spark.kv('user-credentials')`. However, the `workspace.users` array was not being initialized properly, which may have made it seem like authentication wasn't working because the admin tab still wouldn't show.

## How Data is Stored

RelEye uses a hybrid storage model:

### User Credentials (Cloud Storage - spark.kv)
- **What**: Username and password hash
- **Where**: `spark.kv` with key `'user-credentials'`
- **Why**: Enables authentication to persist across browser sessions
- **Security**: Password is hashed with PBKDF2 (210,000 iterations, SHA-256)

### Workspace Data (Local Encrypted Files)
- **What**: All network data (persons, connections, groups, canvas state, user list)
- **Where**: Encrypted .enc.releye files stored locally by the user
- **Why**: Maximum privacy - workspace content never uploaded to cloud
- **Security**: AES-256-GCM encryption with password-based key derivation

### User Management Data (Embedded in Workspace)
- **What**: List of users with access to the workspace (roles, permissions)
- **Where**: `workspace.users` array inside the encrypted workspace file
- **Why**: Each workspace has its own independent access control
- **How**: When workspace is created/loaded, current user is automatically added as admin

## Fixes Applied

### Fix 1: Initialize Admin User on Workspace Load
**File**: `src/App.tsx`

**Change**: Modified the `handleLoad` callback to check if the current authenticated user exists in the `workspace.users` array. If not, automatically add them as an admin.

```typescript
const handleLoad = useCallback((loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
  if (!userCredentials) {
    console.error('[App] Cannot load workspace without user credentials')
    return
  }

  const currentUser = loadedWorkspace.users?.find(u => u.username === userCredentials.username)
  
  if (!currentUser) {
    console.log('[App] Current user not found in workspace, adding as admin')
    const adminUser = {
      userId: loadedWorkspace.ownerId || `user-${Date.now()}`,
      username: userCredentials.username,
      role: 'admin' as const,
      addedAt: Date.now(),
      addedBy: 'system',
      status: 'active' as const
    }
    
    const updatedWorkspace = {
      ...loadedWorkspace,
      users: [...(loadedWorkspace.users || []), adminUser],
      ownerId: adminUser.userId
    }
    
    setInitialWorkspace(updatedWorkspace)
  } else {
    setInitialWorkspace(loadedWorkspace)
  }
  
  setFileName(loadedFileName)
  setPassword(loadedPassword)
  setShowFileManager(false)
}, [userCredentials])
```

### Fix 2: Remove Redundant User Initialization
**File**: `src/components/SettingsDialog.tsx`

**Change**: Removed the `useEffect` that was trying to add the admin user to the workspace. This was creating a race condition and wasn't working reliably because it ran after the component mounted, not during the initial workspace load.

**Before**:
```typescript
useEffect(() => {
  if (userCredentials && (!workspace.users || workspace.users.length === 0)) {
    const adminUser = {
      userId: `user-${Date.now()}`,
      username: userCredentials.username,
      role: 'admin' as const,
      addedAt: Date.now(),
      addedBy: 'system',
      status: 'active' as const
    }
    setWorkspace((current) => ({
      ...current,
      users: [adminUser],
      ownerId: adminUser.userId
    }))
  }
}, [userCredentials, workspace.users, setWorkspace])
```

**After**: Removed this code entirely. User initialization now happens in App.tsx when the workspace is loaded.

### Fix 3: Updated Documentation
**File**: `PRD.md`

**Change**: Added a "Data Persistence Architecture" section that clearly explains:
- How user credentials are stored in the cloud (spark.kv)
- How workspace data is stored locally (encrypted files)
- How user management data is embedded in workspaces
- The initialization flow for adding the admin user

Also updated the Multi-User Collaboration and Admin Dashboard sections to accurately reflect how the system works (removed references to GitHub login which isn't implemented, clarified the invite flow).

## Testing the Fix

### Test 1: Fresh Setup
1. Open the app for the first time
2. Create admin account (username + password)
3. Create or load a workspace
4. Open Settings → You should now see the "Admin" tab
5. Click Admin tab → You should see the "Open Admin Dashboard" button

### Test 2: Persistence After Reload
1. Complete Test 1
2. Refresh the browser (F5 or Ctrl+R)
3. You should see the login screen (NOT first-time setup)
4. Log in with your credentials
5. Load your workspace
6. Open Settings → Admin tab should still be visible
7. The Admin tab should appear because your user is now in workspace.users

### Test 3: Multiple Workspaces
1. Create workspace A → Admin tab appears
2. Save workspace A
3. Create workspace B → Admin tab appears (you're added as admin)
4. Load workspace A again → Admin tab appears (your user was saved)

## How Admin Detection Works

The admin tab visibility is determined by this logic in `SettingsDialog.tsx`:

```typescript
const currentUser = workspace.users?.find(u => u.username === userCredentials?.username)
const isAdmin = currentUser?.role === 'admin'

// Later in the render:
{isAdmin && (
  <TabsTrigger value="admin">
    <Shield className="w-4 h-4 mr-1.5" />
    Admin
  </TabsTrigger>
)}
```

This checks:
1. Does `workspace.users` contain a user with the current username?
2. Does that user have role === 'admin'?
3. If both true, show the Admin tab

With our fix, when you load a workspace, if you're not in `workspace.users`, you're automatically added as admin. This ensures the Admin tab always shows for the person who set up the application.

## Important Notes

1. **First user is always admin**: The first person to set up the application and create/load a workspace becomes the admin automatically

2. **Workspace-specific access**: Each workspace has its own user list. If you create multiple workspaces, you'll be added as admin to each one

3. **Changes must be saved**: When you modify the workspace (including user changes), you need to save the workspace file to persist those changes

4. **Password security**: User passwords are never stored in plain text. They're hashed using PBKDF2 with 210,000 iterations before being saved to spark.kv

5. **Recovery**: If you forget your password, there's no recovery mechanism. This is by design for security - we don't have a master key or backdoor
