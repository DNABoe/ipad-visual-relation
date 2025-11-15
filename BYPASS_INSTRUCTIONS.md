# Authentication Bypass Mode - Instructions

## Current Status

This application is currently running in **BYPASS MODE** to allow testing and development without a backend server. All core functionality works correctly, including API key storage for investigation features.

## What's Bypassed

1. **User Authentication**
   - Login screen is skipped
   - First-time setup is bypassed
   - Mock user is automatically created with admin privileges

2. **Backend API Calls**
   - No calls to cloud authentication server
   - No multi-user synchronization
   - User registry calls are not made

3. **File Manager**
   - Automatically loads sample data
   - Skips the "New Network" / "Load Network" selection

## What's Preserved (Real Functionality)

✅ **User Credentials & API Keys**
   - Stored in browser storage (IndexedDB)
   - Encrypted API keys work correctly
   - Settings persist between sessions

✅ **Investigation Features**
   - OpenAI API integration fully functional
   - Report generation works
   - PDF attachments work

✅ **All Core Application Features**
   - Network visualization
   - Person/connection/group management
   - Save/load encrypted files
   - All settings and preferences

## Files Modified for Bypass

### Primary Bypass Implementation

**`src/App.tsx`** (Lines 26-120)
- Contains the main bypass logic in `initializeAuth()` function
- Creates mock user with admin role
- Loads sample data automatically
- **PRESERVES** existing user credentials and API keys

Look for the comment blocks:
```
// ============================================================
// TEMPORARY BYPASS FOR TESTING WITHOUT BACKEND
// ============================================================
```

## How to Restore Full Authentication

### Step 1: Remove the Bypass Block in App.tsx

In `src/App.tsx`, locate the `initializeAuth()` function (around line 26) and:

1. **Delete** the entire bypass block between these comments:
   ```typescript
   // ============================================================
   // TEMPORARY BYPASS FOR TESTING WITHOUT BACKEND
   // ============================================================
   ```
   and
   ```typescript
   // ============================================================
   // END OF TEMPORARY BYPASS BLOCK
   // ============================================================
   ```

2. **Replace** with the original authentication flow:

```typescript
useEffect(() => {
  const initializeAuth = async () => {
    try {
      console.log('[App] Initializing authentication...')
      
      // Check if cloud API is available
      const apiAvailable = await isCloudAPIAvailable()
      
      if (!apiAvailable) {
        console.log('[App] Cloud API not available, checking for existing setup...')
        const hasUsers = await UserRegistry.hasAnyUsers()
        
        if (!hasUsers) {
          console.log('[App] No users found, showing first-time setup')
          setIsFirstTime(true)
          setIsLoadingAuth(false)
          return
        }
      }
      
      // Check for current user session
      const currentUserId = await UserRegistry.getCurrentUserId()
      
      if (currentUserId) {
        const user = await UserRegistry.getUserById(currentUserId)
        if (user) {
          console.log('[App] User session found:', user.email)
          setCurrentUser(user)
          setIsLoadingAuth(false)
          return
        }
      }
      
      // Check for invite token in URL
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('invite')
      
      if (token) {
        console.log('[App] Invite token found in URL')
        try {
          const invite = await UserRegistry.getInviteByToken(token)
          if (invite) {
            setInviteToken(token)
            setInviteEmail(invite.email)
            setIsLoadingAuth(false)
            return
          }
        } catch (error) {
          console.error('[App] Invalid or expired invite token')
          toast.error('Invalid or expired invitation link')
        }
      }
      
      // No session found - show login
      console.log('[App] No active session, showing login')
      setCurrentUser(null)
      setIsLoadingAuth(false)
      
    } catch (error) {
      console.error('[App] Failed to initialize:', error)
      toast.error('Failed to initialize application. Please refresh the page.')
      setIsLoadingAuth(false)
    }
  }
  
  initializeAuth()
}, [])
```

### Step 2: Remove the Header Comment Block

In `src/App.tsx`, delete the large comment block at the top of the file (lines 1-24) that explains the bypass mode.

### Step 3: Test the Restore

1. Clear browser storage (to test fresh installation):
   - Open DevTools → Application → Storage → Clear site data

2. Refresh the application

3. You should see:
   - First-time setup screen (if no backend)
   - OR Login screen (if backend is available)
   - OR User dashboard (if you have an active session)

## Important Notes

### API Keys Are Safe

The bypass mode **explicitly preserves** all user credentials including encrypted API keys. When you add an API key in Settings:

1. It's encrypted with your password
2. Stored in browser IndexedDB
3. **NOT** affected by the bypass
4. Will persist when you restore full authentication

The key code that preserves credentials is in `App.tsx`:

```typescript
// IMPORTANT: Preserve existing credentials including API keys
const existingCredentials = await storage.get<UserCredentials>('user-credentials')

if (!existingCredentials) {
  // Only create temporary credentials if none exist
  // ...
} else {
  // Preserve existing credentials completely (including encrypted API key)
  console.log('[App] ✓ Existing credentials found and preserved')
  // DO NOT overwrite or modify existing credentials
}
```

### What Happens to Settings

All application settings are stored separately from authentication:
- Grid preferences
- Canvas settings
- Visual preferences

These are stored in the workspace file and browser storage, completely independent of the authentication bypass.

## Troubleshooting

### "I can't perform investigations despite having an API key"

Check the browser console for errors. The most common issues:

1. **Password mismatch**: The password you use to decrypt the API key must match the password you used to encrypt it
2. **API key not saved**: Verify in Settings → Investigation that it shows "API key is configured and encrypted"
3. **Browser storage cleared**: If you cleared storage, you'll need to re-add your API key

### "My API key disappeared after refreshing"

This shouldn't happen. The bypass mode preserves credentials. Check:

1. Browser DevTools → Application → IndexedDB → `RelEyeStorage` → `keyValue` → look for `user-credentials`
2. If missing, you may have cleared browser data
3. Re-add your API key in Settings → Investigation

### Testing the Investigation Feature

1. Add your OpenAI API key in Settings → Investigation
2. Enter your password to encrypt it
3. Verify the success message
4. Open any person card
5. Go to Investigate tab
6. Fill in country if needed
7. Click "Generate Intelligence Report"
8. Enter your password when prompted
9. Report should generate and attach as PDF

## Questions?

If you run into issues restoring authentication or have questions about what's safe to remove, refer to the comment blocks in the code - they mark exactly what needs to be removed versus what's permanent functionality.
