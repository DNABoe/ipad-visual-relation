# Single-User Mode Configuration

## Overview

RelEye is now configured in single-user mode. This is a temporary configuration that removes the multi-user backend dependency while maintaining all workspace and visualization functionality.

## Login Credentials

**Username:** `RelEyeUser`  
**Password:** `UserOfRel_Eye`

These credentials are hardcoded and cannot be changed in this temporary configuration.

## Features

### Available
- ✅ Full workspace visualization and editing
- ✅ Person and group management
- ✅ Connection visualization
- ✅ File encryption and local storage
- ✅ Export functionality
- ✅ OpenAI investigation features (with API key)
- ✅ All canvas and grid settings
- ✅ Keyboard shortcuts
- ✅ Undo/redo functionality

### Temporarily Disabled
- ❌ Password changes (fields are greyed out in Settings > User tab)
- ❌ Username changes (field is greyed out in Settings > User tab)
- ❌ Multi-user support
- ❌ Admin dashboard
- ❌ User invitations
- ❌ Backend API synchronization

## Storage

All data is stored locally in the browser's localStorage. No data is sent to or stored on releye.boestad.com or any backend server.

## Implementation Details

### Authentication Module
- Location: `src/lib/singleUserAuth.ts`
- Provides hardcoded single-user authentication
- No password hashing or encryption for the login (temporary measure)
- Session tracking via localStorage

### Modified Components
- `App.tsx` - Simplified authentication flow
- `LoginView.tsx` - Already configured for username/password
- `SettingsDialog.tsx` - Password change fields disabled
- `WorkspaceView.tsx` - Admin features disabled

### Code References
To identify password change restrictions in the UI:
```typescript
import { isPasswordChangeAllowed } from '@/lib/singleUserAuth'
const passwordChangeEnabled = isPasswordChangeAllowed() // Returns false
```

## Future Migration

When transitioning back to multi-user mode:
1. Replace `singleUserAuth.ts` imports with `userRegistry.ts`
2. Re-enable password change functionality in `SettingsDialog.tsx`
3. Restore admin dashboard in `WorkspaceView.tsx`
4. Update `App.tsx` to use full authentication flow
5. Remove hardcoded credentials

## Security Note

⚠️ This configuration is meant as a temporary solution. The hardcoded credentials should not be used in a production multi-user environment.
