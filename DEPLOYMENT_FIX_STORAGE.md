# Storage Adapter Fix for Deployed Mode

## Problem
The application was using `spark.kv` and `useKV` hook directly, which only works in Spark development environment. When deployed (e.g., GitHub Pages), `window.spark.kv` is undefined, causing the application to fail when trying to save user credentials.

## Solution
Implemented a storage adapter pattern that automatically detects the environment and uses the appropriate storage backend:

### 1. Storage Adapter (`src/lib/storage.ts`)
- **Spark Environment**: Uses `window.spark.kv` when available
- **Deployed Environment**: Falls back to `localStorage` when `spark.kv` is unavailable
- Provides consistent async API for both backends

### 2. Updated Components

#### App.tsx
- **Before**: Used `useKV` hook from `@github/spark/hooks`
- **After**: 
  - Uses regular `useState` for credentials
  - Loads credentials from storage adapter on mount
  - Saves credentials using storage adapter
  - Added loading state while credentials are being loaded

#### WorkspaceView.tsx
- **Before**: Used `useKV` hook for user credentials
- **After**: 
  - Uses regular `useState` for credentials
  - Loads credentials from storage adapter on mount
  - Uses storage adapter for all credential operations

#### LoginView.tsx
- Already using storage adapter ✓

#### FileManager.tsx
- Already using storage adapter ✓

## Key Changes

### Storage Detection
```typescript
const isSparkAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.spark !== 'undefined' && 
         typeof window.spark.kv !== 'undefined'
}
```

### Dual Storage Implementation
```typescript
// localStorage adapter for deployed mode
const localStorageAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : undefined
  },
  // ... set, delete, keys methods
}

// spark.kv adapter for development mode
const sparkKVAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    return await window.spark.kv.get<T>(key)
  },
  // ... set, delete, keys methods
}

// Automatically select the right adapter
export const storage: StorageAdapter = isSparkAvailable() 
  ? sparkKVAdapter 
  : localStorageAdapter
```

### Component Pattern
```typescript
// Load credentials on mount
useEffect(() => {
  const loadCredentials = async () => {
    const creds = await storage.get<CredentialType>('user-credentials')
    setCredentials(creds || null)
  }
  loadCredentials()
}, [])

// Save credentials
await storage.set('user-credentials', credentials)
```

## Benefits
1. **Works in both environments**: Development (Spark) and production (deployed)
2. **No code changes needed**: Same API for both storage backends
3. **Type safe**: Full TypeScript support maintained
4. **Backwards compatible**: Existing functionality preserved
5. **Error handling**: Proper try-catch blocks for all storage operations

## Testing
- ✓ Credentials persist in Spark development mode
- ✓ Credentials persist in deployed mode (localStorage)
- ✓ First-time setup works in both modes
- ✓ Login/logout flow works in both modes
- ✓ Workspace loading maintains user context

## Data Persistence
- **Development**: Data stored in Spark KV store (server-side)
- **Production**: Data stored in browser's localStorage (client-side)
- **Security**: Passwords are hashed using PBKDF2 with 210,000 iterations
- **Note**: Workspace files (.releye) remain encrypted regardless of storage backend
