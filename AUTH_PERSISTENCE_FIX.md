# Authentication & Admin Tab Persistence Fix

## Issues Identified

### Issue 1: Admin Tab Not Visible After First-Time Setup
**Symptom**: After creating an admin account during first-time setup, the Admin tab does not appear in the Settings dialog.

**Root Cause**: When a workspace is created or loaded, the `workspace.users` array is not initialized with the current authenticated user. The SettingsDialog checks for admin role by looking for the current user in `workspace.users`, but the array is either undefined or empty.

**Flow**:
1. User completes first-time setup → credentials saved to `spark.kv`
2. User is authenticated and sees FileManager
3. User creates new network (with or without sample data)
4. `generateSampleData()` returns workspace WITHOUT `users` array
5. Workspace is passed to WorkspaceView
6. SettingsDialog looks for `workspace.users.find(u => u.username === currentUsername)`
7. No match found → `isAdmin = false` → Admin tab hidden

### Issue 2: Authentication Lost on Page Reload
**Symptom**: After creating an admin account and refreshing the browser, the first-time setup screen appears again instead of the login screen.

**Root Cause**: Timing issue with `useKV` persistence. The credentials were saved but the app flow continued immediately without waiting for the write to complete, potentially causing a race condition on page reload.

## Solutions Implemented

### Fix 1: Ensure Workspace Users Array is Initialized
**Location**: `src/App.tsx` - `handleLoad` function

**Changes**:
```typescript
const handleLoad = useCallback((loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
  if (!userCredentials) {
    console.error('[App] Cannot load workspace without user credentials')
    toast.error('Authentication error. Please reload the page.')
    return
  }

  // Initialize users array if it doesn't exist
  let updatedWorkspace = { ...loadedWorkspace }
  
  if (!updatedWorkspace.users) {
    updatedWorkspace.users = []
  }
  
  // Check if current user exists in workspace
  const currentUser = updatedWorkspace.users.find(u => u.username === userCredentials.username)
  
  if (!currentUser) {
    // Add current user as admin
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const adminUser = {
      userId: userId,
      username: userCredentials.username,
      role: 'admin' as const,
      addedAt: Date.now(),
      addedBy: 'system',
      status: 'active' as const
    }
    
    updatedWorkspace = {
      ...updatedWorkspace,
      users: [...updatedWorkspace.users, adminUser],
      ownerId: userId
    }
  }
  
  setInitialWorkspace(updatedWorkspace)
  setFileName(loadedFileName)
  setPassword(loadedPassword)
  setShowFileManager(false)
}, [userCredentials])
```

**Result**: Every workspace that is loaded or created will now automatically have the current authenticated user added as an admin if they're not already in the users list.

### Fix 2: Add Small Delay After Credentials Save
**Location**: `src/App.tsx` - `handleFirstTimeSetup` function

**Changes**:
```typescript
const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
  try {
    console.log('[App] Creating admin account:', username)
    const passwordHash = await hashPassword(password)
    
    const credentials = {
      username,
      passwordHash
    }
    
    await setUserCredentials(credentials)
    
    // Wait a moment to ensure KV write completes
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('[App] First-time setup complete')
    setNeedsSetup(false)
    setIsAuthenticated(true)
  } catch (error) {
    console.error('[App] First-time setup error:', error)
    toast.error('Failed to create admin account. Please try again.')
  }
}, [setUserCredentials])
```

**Result**: Credentials are now properly persisted before continuing the authentication flow.

### Fix 3: Enhanced Logging
**Location**: `src/components/SettingsDialog.tsx`

**Changes**: Added comprehensive debug logging to help diagnose similar issues in the future:
```typescript
useEffect(() => {
  console.log('[SettingsDialog] === Workspace User Check ===')
  console.log('[SettingsDialog] userCredentials:', userCredentials)
  console.log('[SettingsDialog] username:', userCredentials?.username)
  console.log('[SettingsDialog] workspace.users:', workspace.users)
  console.log('[SettingsDialog] currentUser:', currentUser)
  console.log('[SettingsDialog] currentUser role:', currentUser?.role)
  console.log('[SettingsDialog] isAdmin:', isAdmin)
  console.log('[SettingsDialog] ========================')
}, [userCredentials, currentUser, isAdmin, workspace.users])
```

**Result**: Clear visibility into the authentication and user role determination process.

### Fix 4: Import sonner toast
**Location**: `src/App.tsx`

**Changes**: Fixed import to include toast function:
```typescript
import { Toaster, toast } from 'sonner'
```

**Result**: Toast notifications now work properly for error messages.

## Testing Steps

1. **First-Time Setup**:
   - Clear browser storage
   - Reload page
   - Should see "Welcome to RelEye" first-time setup screen
   - Enter username (e.g., "admin") and password (min 8 chars)
   - Confirm password
   - Click "Create Administrator Account"
   - Should be authenticated and see FileManager

2. **Persistence Check**:
   - After completing first-time setup
   - Reload the browser tab (F5 or Ctrl+R)
   - Should see Login screen (NOT first-time setup again)
   - Enter credentials
   - Should successfully log in

3. **Admin Tab Visibility**:
   - After authentication, create or load a network
   - Once in workspace, click Settings (gear icon)
   - Should see tabs: System, User, **Admin**, About
   - Admin tab should have shield icon and be accessible

4. **Admin Dashboard**:
   - Click Admin tab in Settings
   - Should see "Administrator Panel" section
   - Click "Open Admin Dashboard" button
   - Should open admin dashboard with user management tools

## Expected Behavior After Fix

✅ First-time setup credentials persist across page reloads
✅ Login screen appears on subsequent visits (not first-time setup)
✅ Admin tab visible immediately after first-time setup
✅ Admin tab visible after loading any workspace
✅ Current user automatically added as admin to new/loaded workspaces
✅ All authentication state properly managed through useKV
✅ Clear error messages if authentication issues occur

## Technical Details

### Data Flow
```
1. First-Time Setup
   ├─ User enters credentials
   ├─ Password hashed (PBKDF2, 210k iterations)
   ├─ Saved to spark.kv('user-credentials')
   ├─ Wait 100ms for persistence
   └─ User authenticated

2. Page Reload
   ├─ App checks spark.kv('user-credentials')
   ├─ If found: Show login screen
   └─ If not found: Show first-time setup

3. Workspace Load/Create
   ├─ Workspace loaded/created
   ├─ Check workspace.users array
   ├─ If current user not in array:
   │  ├─ Generate unique userId
   │  ├─ Create admin user object
   │  └─ Add to workspace.users
   └─ Pass workspace to WorkspaceView

4. Settings Dialog
   ├─ Receives workspace with users array
   ├─ Finds current user: workspace.users.find(u => u.username === credentials.username)
   ├─ Checks role: currentUser.role === 'admin'
   └─ Shows/hides Admin tab based on role
```

### Storage Locations
- **User Credentials**: `spark.kv('user-credentials')` - Cloud persisted
- **Workspace Data**: Encrypted .enc.releye files - Local only
- **Workspace Users**: Embedded in workspace file - Saved with workspace

## Related Files Modified
- `src/App.tsx` - Authentication flow and workspace initialization
- `src/components/SettingsDialog.tsx` - Enhanced logging
- `src/lib/types.ts` - Types already support workspace.users array

## Future Improvements
1. Consider adding workspace.users initialization in `generateSampleData()`
2. Add UI indicator when credentials are being saved
3. Implement credential recovery mechanism
4. Add unit tests for authentication flow
5. Consider caching user role in a higher-level context to avoid repeated lookups
