# Deployment Compatibility Guide

## Overview

RelEye has been updated to work seamlessly both in the Spark development environment and in production deployment at releye.boestad.com. The application automatically detects the runtime environment and uses the appropriate storage backend.

## Storage Architecture

### Automatic Adapter Selection

The application uses a dual-adapter storage system:

1. **Spark KV Adapter**: Used when running in the Spark environment (development)
2. **LocalStorage Adapter**: Used when deployed to production

The storage system automatically detects which environment it's running in and selects the appropriate adapter.

### Storage Implementation

**Location**: `/src/lib/storage.ts`

The storage interface provides these methods:
- `get<T>(key: string): Promise<T | undefined>` - Retrieve data
- `set<T>(key: string, value: T): Promise<void>` - Store data
- `delete(key: string): Promise<void>` - Remove data
- `keys(): Promise<string[]>` - List all keys
- `isReady(): Promise<boolean>` - Check if storage is available
- `checkHealth(): Promise<StorageHealthStatus>` - Health check

All data in production is stored in browser localStorage with the prefix `releye_` to avoid conflicts with other applications.

## React Hooks

### useKV Hook

**Location**: `/src/hooks/useKV.ts`

The custom `useKV` hook provides a drop-in replacement for `@github/spark/hooks` useKV:

```typescript
import { useKV } from '@/hooks/useKV'

// Usage (identical to Spark's useKV)
const [value, setValue, deleteValue] = useKV('my-key', defaultValue)

// Set with functional update (recommended)
await setValue((current) => ({ ...current, newField: 'value' }))

// Delete
await deleteValue()
```

**Important**: All imports that previously used `@github/spark/hooks` have been updated to use the local implementation at `@/hooks/useKV`.

## Data Persistence

### User Registry
- All user accounts (admin, editors, viewers)
- Invitation tokens
- Current user session
- User credentials (hashed passwords)

**Storage Keys**:
- `app-users-registry` - All registered users
- `app-pending-invites` - Pending invitation tokens
- `app-current-user-id` - Currently logged-in user ID
- `user-credentials` - User credentials cache

### Workspace Data
- Network files (encrypted)
- Application settings
- Canvas state
- User preferences

**Storage Keys**:
- `all-workspaces` - All workspace data
- `app-settings` - Application-wide settings

### Security

All sensitive data is encrypted before storage:
- Workspace files use AES-256-GCM encryption
- Passwords are hashed using PBKDF2 with random salts
- API keys are encrypted with user passwords

## Invitation System

The invitation system works identically in both environments:

1. Admin creates invite with email and role
2. System generates unique token and stores in `app-pending-invites`
3. Invitation link: `https://releye.boestad.com?invite={token}&email={email}`
4. When user clicks link:
   - Token is validated
   - User creates password
   - Account is created in `app-users-registry`
   - Invite is removed from `app-pending-invites`
   - User is automatically logged in

The invitation tokens and user data persist in localStorage, so they survive page refreshes and browser restarts.

## Development vs Production

### Spark Environment (Development)
- Storage: `window.spark.kv` API
- LLM features: Available via `window.spark.llm`
- Analysis tools: Fully functional

### Production Deployment
- Storage: Browser localStorage
- LLM features: Not available (gracefully disabled)
- Analysis tools: Disabled with user notification
- All core features: Fully functional

## Components Affected

### Updated Components

All components using storage have been updated:

1. **WorkspaceView.tsx** - Changed import to `@/hooks/useKV`
2. **SettingsDialog.tsx** - Changed import to `@/hooks/useKV`
3. **AnalysisHelper.tsx** - Added Spark availability check

### Storage-Dependent Features

These features use the storage adapter and work in both environments:

- User authentication and registration
- Workspace file management
- Settings persistence
- Canvas state management
- Search and filtering
- Export functionality

### Debug/Development Only

These features are only available in Spark:

- Grid Analysis Helper (gracefully disabled in production)
- Any future LLM-based features (must check for Spark availability)

## Testing Deployment

### Verifying Storage

The application includes storage health checks in the Settings dialog under the "System" tab:

- Storage availability
- Read capability
- Write capability
- Delete capability

### Testing Invitations

1. Create admin account (first time setup)
2. Go to Settings → Admin Dashboard
3. Create a new user invitation
4. Copy the invitation link
5. Open in new browser/incognito window
6. Complete registration
7. Verify user can log in

### Data Persistence

1. Create a workspace and save it
2. Close browser completely
3. Reopen and navigate to releye.boestad.com
4. Verify you're still logged in
5. Verify workspace is still available

## Migration Notes

### From Spark to Production

No data migration is needed because:
- Spark environment uses its own storage
- Production uses localStorage
- Each is independent

Users will need to:
1. Export their workspace files from Spark
2. Import them into production deployment

### Browser Compatibility

The localStorage adapter requires:
- Modern browser with localStorage API
- JavaScript enabled
- Cookies/storage not disabled

Supported browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### Storage Not Available

If users see "Storage system is not available":
1. Check browser console for errors
2. Verify localStorage is enabled
3. Check if storage quota is exceeded
4. Try clearing other site data

### Invitations Not Working

If invitation links fail:
1. Verify token hasn't expired (7 days)
2. Check storage health in Settings
3. Ensure URL parameters are intact
4. Try creating a new invitation

### Data Loss

User data is stored in localStorage, which means:
- Clearing browser data will erase everything
- Private/incognito mode won't persist data
- Different browsers have separate storage
- Users should regularly export workspace backups

## Deployment Checklist

- [x] Storage adapter automatically selects correct backend
- [x] useKV hook implemented for React components
- [x] All Spark imports replaced with local implementations
- [x] Spark-only features gracefully disabled
- [x] User authentication works with localStorage
- [x] Invitation system persists across sessions
- [x] Workspace files encrypted and stored
- [x] Settings persist correctly
- [x] Error handling for storage failures
- [x] Health checks available in Settings

## Future Improvements

Potential enhancements for production:

1. **Cloud Sync** - Optional cloud backup/sync service
2. **Shared Workspaces** - Multi-user collaboration
3. **Export/Import** - Easier data portability
4. **Storage Quota Management** - Monitor and manage space usage
5. **Backup Reminders** - Prompt users to export regularly
