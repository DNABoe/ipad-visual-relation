# Deployment Fix - Storage Abstraction

## Problem
The application relied heavily on `window.spark.kv` API which is only available in the Spark development environment. When deployed to releye.boestad.com, this API doesn't exist, causing the application to fail to initialize.

## Solution
Created a storage abstraction layer (`src/lib/storage.ts`) that:
- Uses Spark KV when available (development environment)
- Falls back to localStorage when Spark KV is not available (deployed sites)
- Provides a consistent API for both scenarios

## Changes Made

### New File: `src/lib/storage.ts`
- `StorageAdapter` interface for unified storage operations
- `SparkKVAdapter` - uses window.spark.kv
- `LocalStorageAdapter` - uses browser localStorage with `releye_` prefix
- `getStorage()` - automatically selects the appropriate adapter
- `waitForStorage()` - checks for available storage
- `isStorageAvailable()` - quick check for storage availability

### Updated Files
1. **src/App.tsx**
   - Replaced `waitForSpark()` with `waitForStorage()`
   - Removed dependency on `deferredCredentials`
   - Simplified credential storage logic
   - Uses `getStorage()` instead of `window.spark.kv`

2. **src/components/LoginView.tsx**
   - Imports `getStorage` from `@/lib/storage`
   - Uses `getStorage()` instead of `window.spark.kv`

3. **src/components/FirstTimeSetup.tsx**
   - Removed Spark availability check
   - Simplified setup flow

## Files Still Using window.spark (Need Manual Update)
These files still reference `window.spark` directly and need to be updated to use the storage abstraction:

1. **src/components/AnalysisHelper.tsx** - AI investigation feature
2. **src/components/FileManager.tsx** - File operations
3. **src/components/PersonDialog.tsx** - Person editing
4. **src/components/SettingsDialog.tsx** - Settings management  
5. **src/components/WorkspaceView.tsx** - Workspace operations

## Next Steps
The remaining files need to be updated in the same pattern:
```typescript
// OLD
import { useEffect } from 'react'
const data = await window.spark.kv.get('key')
await window.spark.kv.set('key', value)

// NEW
import { getStorage } from '@/lib/storage'
const storage = getStorage()
const data = await storage.get('key')
await storage.set('key', value)
```

## Testing
After all files are updated:
1. Test in development environment (should use Spark KV)
2. Build and deploy to releye.boestad.com
3. Verify app loads and credentials persist using localStorage
4. Test all storage operations (save/load networks, settings, etc.)

## Important Notes
- localStorage has size limits (~5-10MB depending on browser)
- All data is stored locally in the user's browser
- Clearing browser data will delete all stored information
- The encryption remains the same - files are still encrypted with AES-256-GCM
