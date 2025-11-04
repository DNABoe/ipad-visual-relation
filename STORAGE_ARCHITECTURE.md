# Storage Architecture - RelEye

## Overview

RelEye uses the **Spark KV (Key-Value) API** for persisting user credentials and application settings in the cloud. This document explains how the storage system works, what was fixed, and how to debug storage issues.

## The Problem (Before Fix)

The previous implementation had a critical flaw:

1. **Module Load Time Detection**: The storage adapter tried to detect if `window.spark.kv` was available at module load time
2. **Race Condition**: The Spark runtime initializes asynchronously, so `window.spark.kv` might not be ready when the storage module loads
3. **Fallback to localStorage**: When spark.kv wasn't detected, the app would silently fall back to localStorage (browser-only storage)
4. **Data Loss**: On page refresh, credentials saved to localStorage wouldn't persist in the cloud, causing the "first time setup" screen to appear repeatedly

## The Solution (After Fix)

### 1. Lazy Initialization with Async Ready Check

```typescript
class SparkKVAdapter implements StorageAdapter {
  private readyPromise: Promise<boolean> | null = null

  async isReady(): Promise<boolean> {
    if (this.readyPromise) {
      return this.readyPromise  // Cached promise
    }
    this.readyPromise = this.checkSparkKV()
    return this.readyPromise
  }

  private async checkSparkKV(): Promise<boolean> {
    // Wait up to 5 seconds for spark.kv to become available
    // Polls every 100ms
    // Verifies spark.kv works by calling get()
  }
}
```

### 2. Wait Before All Operations

Every storage operation (`get`, `set`, `delete`, `keys`) now waits for the storage system to be ready:

```typescript
async get<T>(key: string): Promise<T | undefined> {
  await this.isReady()  // Wait for spark.kv
  
  if (!window.spark?.kv) {
    throw new Error('Spark KV not available')
  }

  return await window.spark.kv.get<T>(key)
}
```

### 3. Verification After Write

When saving credentials, we now verify they were actually saved:

```typescript
await window.spark.kv.set(key, value)

const verification = await window.spark.kv.get<T>(key)
if (!verification) {
  throw new Error(`Failed to verify ${key} was saved`)
}
```

### 4. App-Level Initialization

The main App component now explicitly waits for storage to be ready before loading credentials:

```typescript
useEffect(() => {
  const loadCredentials = async () => {
    const storageReady = await storage.isReady()
    
    if (!storageReady) {
      console.error('[App] Storage failed to become ready')
      return
    }
    
    const credentials = await storage.get('user-credentials')
    // ...
  }
  loadCredentials()
}, [])
```

## Storage Keys Used

| Key | Type | Purpose |
|-----|------|---------|
| `user-credentials` | `{ username: string, passwordHash: PasswordHash }` | Current user's authentication credentials |
| `app-settings` | `AppSettings` | Application-level preferences (grid, snap, etc.) |

Note: Workspace data (persons, connections, groups) is stored in encrypted local files, NOT in spark.kv.

## How Spark KV Works (Production)

When deployed at `releye.boestad.com`:

1. **Global Object**: The Spark runtime injects `window.spark.kv` into the page
2. **Cloud Storage**: Data is persisted in GitHub's infrastructure associated with the spark app
3. **Async API**: All operations return promises
4. **Serialization**: Values are automatically JSON serialized/deserialized
5. **Persistence**: Data survives browser refreshes, device changes, and remains available as long as the spark is deployed

## Debugging Storage Issues

### Enable Console Logging

The storage adapter includes extensive logging:

```
[SparkKVAdapter] Checking for Spark KV availability...
[SparkKVAdapter] ✓ Spark KV is ready
[SparkKVAdapter] Setting key: user-credentials
[SparkKVAdapter] Successfully set user-credentials
[SparkKVAdapter] Verified user-credentials was saved
```

### Check Spark Availability

Open browser console on deployed site:

```javascript
// Check if spark is available
console.log('spark exists:', !!window.spark)
console.log('spark.kv exists:', !!window.spark?.kv)

// Test basic operations
await window.spark.kv.set('test', { hello: 'world' })
await window.spark.kv.get('test')  // Should return { hello: 'world' }
await window.spark.kv.keys()  // Should include 'test'
```

### Common Issues

**Issue**: "Storage system is not available"
- **Cause**: Spark runtime failed to initialize within 5 seconds
- **Fix**: Check browser console for spark initialization errors. Ensure the app is deployed correctly.

**Issue**: "Failed to verify credentials were saved"
- **Cause**: `spark.kv.set()` succeeded but `spark.kv.get()` returned undefined
- **Fix**: Check network tab for spark API errors. Verify the spark is deployed and running.

**Issue**: First time setup appears on every page refresh
- **Cause**: Credentials are not persisting
- **Fix**: Verify spark.kv is being used (not localStorage). Check console logs for storage adapter type.

## Development vs Production

### Production (Deployed at releye.boestad.com)
- Uses `SparkKVAdapter` 
- Data persists in cloud via `window.spark.kv`
- Credentials survive browser refreshes
- Available across devices (if user has access to the spark)

### Local Development (NOT SUPPORTED)
- Spark KV is only available when deployed as a GitHub Spark
- Local development will fail after 5 second timeout
- For local development, you would need to implement a localStorage fallback (not recommended for production)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  1. Wait for storage.isReady()                              │
│  2. Load user-credentials from storage                      │
│  3. Show FirstTimeSetup OR LoginView                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   storage.ts (SparkKVAdapter)                │
│  - isReady(): Polls for window.spark.kv (5 sec timeout)    │
│  - get/set/delete/keys: All wait for isReady()             │
│  - Verification: Confirms writes with immediate read        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              window.spark.kv (Spark Runtime)                 │
│  - Injected by GitHub Spark infrastructure                  │
│  - Persists to cloud storage                                │
│  - Available only when deployed                             │
└─────────────────────────────────────────────────────────────┘
```

## Testing Checklist

When testing the storage system:

- [ ] First time setup saves credentials successfully
- [ ] Credentials persist after browser refresh
- [ ] Login works with saved credentials
- [ ] Wrong password shows error
- [ ] Settings can update username
- [ ] Settings can change password
- [ ] Password change requires current password
- [ ] Admin tab appears for admin users
- [ ] Logout works and requires re-login
- [ ] All operations complete within 5 seconds

## Future Improvements

1. **Retry Logic**: Add exponential backoff retry for failed writes
2. **Optimistic UI**: Show success immediately, sync in background
3. **Offline Support**: Queue operations when spark.kv unavailable
4. **Migration**: Provide tool to migrate from localStorage to spark.kv
5. **Backup**: Auto-backup credentials to encrypted local file
