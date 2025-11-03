# Multiuser Architecture Cleanup

## Issues Found and Fixed

### 1. Residual Single-User Types (FIXED)
**Problem**: `AppSettings` interface contained old single-user authentication fields that conflicted with new multiuser architecture.

**Location**: `src/lib/types.ts`

**Old Code**:
```typescript
export interface AppSettings {
  username: string      // ❌ OLD - conflicts with multiuser
  passwordHash: string  // ❌ OLD - conflicts with multiuser
  showMinimap: boolean
}
```

**Fixed Code**:
```typescript
export interface AppSettings {
  showMinimap: boolean  // ✅ Only app-level settings
}
```

### 2. Residual Default Constants (FIXED)
**Problem**: Constants file contained unused default credentials from old architecture.

**Location**: `src/lib/constants.ts`

**Removed**:
```typescript
export const DEFAULT_USERNAME = 'admin'  // ❌ REMOVED
export const DEFAULT_PASSWORD = 'admin'  // ❌ REMOVED
```

**Updated**:
```typescript
export const DEFAULT_APP_SETTINGS: AppSettings = {
  showMinimap: true,  // ✅ No user-specific fields
}
```

### 3. Conflicting Type Definitions (FIXED)
**Problem**: Unused `UserInfo` and `UserCredentials` types that didn't match actual usage patterns.

**Location**: `src/lib/types.ts`

**Removed**:
```typescript
export interface UserInfo {           // ❌ REMOVED - not used
  id: string
  username: string
  email?: string
  role: UserRole
  githubLogin?: string
  githubAvatar?: string
  invitedAt: number
  activatedAt?: number
  lastActiveAt?: number
}

export interface UserCredentials {    // ❌ REMOVED - wrong structure
  userId: string
  passwordHash: string
}
```

**Current Structure** (kept):
The app now uses only:
- `WorkspaceUser` - for users in a workspace with roles
- Per-user credentials stored in KV as: `{ username: string, passwordHash: PasswordHash }`

### 4. Missing users/activityLog Arrays in New Workspaces (FIXED)
**Problem**: When creating new workspaces, the `users` and `activityLog` arrays were not initialized, causing undefined errors when App.tsx tried to add the current user.

**Locations**: 
- `src/lib/sampleData.ts`
- `src/components/FileManager.tsx`

**Old Code**:
```typescript
// sampleData.ts
return { 
  persons, 
  connections, 
  groups: [group1, group2],
  collapsedBranches: [],
  settings: DEFAULT_WORKSPACE_SETTINGS
  // ❌ Missing users and activityLog arrays
}

// FileManager.tsx
const newWorkspace: Workspace = {
  persons: [], 
  connections: [], 
  groups: [], 
  collapsedBranches: [],
  settings: DEFAULT_WORKSPACE_SETTINGS
  // ❌ Missing users and activityLog arrays
}
```

**Fixed Code**:
```typescript
// Both files now include:
return { 
  persons, 
  connections, 
  groups: [...],
  collapsedBranches: [],
  settings: DEFAULT_WORKSPACE_SETTINGS,
  users: [],           // ✅ Initialize empty array
  activityLog: []      // ✅ Initialize empty array
}
```

**Impact**: This was likely the root cause of "the same issue" - when `workspace.users` was undefined, the code `workspace.users.find()` would throw errors, and the admin detection logic would fail.

## Current Architecture (Post-Cleanup)

### Authentication Layer
**Storage**: `useKV('user-credentials')` stores:
```typescript
{
  username: string
  passwordHash: PasswordHash  // { hash: string, salt: string, iterations: number }
}
```

**Purpose**: 
- Single login per device
- Persistent across sessions
- Controls who can access the app

### Authorization Layer  
**Storage**: Embedded in each workspace file:
```typescript
workspace.users: WorkspaceUser[] = [
  {
    userId: string
    username: string
    email?: string
    role: 'admin' | 'editor' | 'viewer'
    githubLogin?: string
    githubAvatar?: string
    addedAt: number
    addedBy: string
    inviteToken?: string
    inviteExpiry?: number
    status: 'pending' | 'active' | 'suspended'
  }
]
```

**Purpose**:
- Per-workspace access control
- Each file has its own user list
- Roles determine what actions users can perform

### Data Flow
1. User completes first-time setup → credentials saved to `user-credentials` KV
2. User logs in → credentials verified against `user-credentials` KV
3. User creates/loads workspace → current user auto-added to `workspace.users[]` as admin (if not present)
4. Admin invites users → new entries added to `workspace.users[]` with `status: 'pending'`
5. Invited user accepts → their entry in `workspace.users[]` updated to `status: 'active'`

## Testing Checklist

- [ ] First-time setup creates admin account successfully
- [ ] Login screen verifies credentials correctly
- [ ] Creating new workspace adds current user as admin
- [ ] Loading existing workspace adds current user as admin (if missing)
- [ ] Admin tab only visible to admin role users
- [ ] Admin dashboard shows correct user list from workspace
- [ ] Inviting users creates pending entries in workspace
- [ ] No console errors about missing or conflicting types
- [ ] Settings dialog shows correct username from credentials
- [ ] Workspace saves and loads user list correctly

## Files Modified

1. ✅ `src/lib/types.ts` - Removed conflicting types, cleaned up AppSettings
2. ✅ `src/lib/constants.ts` - Removed old defaults, cleaned up DEFAULT_APP_SETTINGS
3. ✅ `src/lib/sampleData.ts` - Added users and activityLog array initialization
4. ✅ `src/components/FileManager.tsx` - Added users and activityLog array initialization to new workspaces
5. ✅ `src/App.tsx` - Added activityLog initialization in handleLoad for legacy workspaces
6. ✅ `MULTIUSER_ARCHITECTURE_CLEANUP.md` - This documentation file

## Summary

All residual code from the previous single-user login architecture has been removed. The key issues were:

1. **Type conflicts** - Old `AppSettings` included auth fields that were moved to separate storage
2. **Missing initialization** - New workspaces didn't initialize `users[]` and `activityLog[]` arrays, causing runtime errors
3. **Unused constants** - Default credentials that were no longer applicable
4. **Legacy workspace support** - Added safety checks to initialize missing arrays when loading old workspace files

The multiuser architecture is now clean and consistent:
- **Authentication** happens at device level via `user-credentials` in KV storage
- **Authorization** happens at workspace level via `workspace.users[]` array in encrypted files
- Each workspace tracks its own users and activity independently
- First user to load a workspace becomes admin automatically
- Legacy workspaces without user arrays are automatically upgraded on load

## What Changed in This Cleanup

### Before (Broken)
```typescript
// AppSettings had conflicting fields
interface AppSettings {
  username: string      // ❌ Conflicts with multiuser
  passwordHash: string  // ❌ Conflicts with multiuser
  showMinimap: boolean
}

// New workspaces missing critical arrays
const workspace = {
  persons: [],
  connections: [],
  // ❌ No users array - causes crash when App.tsx tries workspace.users.find()
  // ❌ No activityLog array - causes crash when AdminDashboard loads
}
```

### After (Fixed)
```typescript
// AppSettings only has app-level settings
interface AppSettings {
  showMinimap: boolean  // ✅ Clean separation
}

// All workspaces have required arrays
const workspace = {
  persons: [],
  connections: [],
  users: [],       // ✅ Initialized
  activityLog: []  // ✅ Initialized
}

// Legacy support in App.tsx
if (!workspace.users) workspace.users = []          // ✅ Safe fallback
if (!workspace.activityLog) workspace.activityLog = [] // ✅ Safe fallback
```
