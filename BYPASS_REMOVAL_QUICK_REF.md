# Quick Reference: Authentication Bypass Removal

## TL;DR - What to Remove

### File: `src/App.tsx`

**Lines to DELETE:** ~1-24 (Header comment block)
**Lines to DELETE:** ~50-117 (Everything between the "TEMPORARY BYPASS" comment markers)

**Lines to KEEP/RESTORE:** Original `initializeAuth()` implementation (see BYPASS_INSTRUCTIONS.md)

## Visual Markers in Code

Look for these comment blocks to identify bypass code:

```typescript
/*
 * ============================================================
 * AUTHENTICATION BYPASS MODE - TEMPORARY FOR TESTING
 * ============================================================
```

```typescript
// ============================================================
// TEMPORARY BYPASS FOR TESTING WITHOUT BACKEND
// ============================================================
```

```typescript
// ============================================================
// END OF TEMPORARY BYPASS BLOCK
// ============================================================
```

## Files That Are NOT Bypass Code (Don't Touch)

These files contain **real, permanent functionality**:

✅ `src/lib/auth.ts` - Real password hashing and API key encryption
✅ `src/lib/storage.ts` - Real storage adapter (works with/without bypass)
✅ `src/lib/externalLLM.ts` - Real OpenAI API integration
✅ `src/lib/userRegistry.ts` - Real user management (for when backend exists)
✅ `src/components/SettingsDialog.tsx` - Real settings and API key UI
✅ `src/components/PersonDialog.tsx` - Real investigation feature
✅ All other components and utilities

## Why the Bypass Preserves Your API Key

The bypass code includes this critical section:

```typescript
const existingCredentials = await storage.get<UserCredentials>('user-credentials')

if (!existingCredentials) {
  // Only create temp credentials if none exist
} else {
  // PRESERVE existing credentials completely (including encrypted API key)
  console.log('[App] ✓ Existing credentials found and preserved')
  // DO NOT overwrite or modify existing credentials
}
```

This means:
1. If you've added an API key, it's stored in `user-credentials`
2. The bypass checks if credentials exist
3. If they exist, it **does not overwrite them**
4. Your API key remains encrypted and accessible

## How to Test Your API Key Works

1. Open Settings → Investigation
2. Check for green checkmark: "API key is configured and encrypted"
3. Open any person card → Investigate tab
4. Click "Generate Intelligence Report"
5. Enter your password when prompted
6. Report should generate

If this works, your API key is properly configured and will survive the bypass removal.

## After Removing the Bypass

Your encrypted API key will still be in storage because:
- It's stored in browser IndexedDB
- The bypass never touches it (only reads to preserve it)
- Full authentication flow also uses the same storage

You'll just need to:
1. Log in with your real credentials
2. Your API key will be there in Settings → Investigation
3. Everything will work exactly as it does now

## Need the Original Code?

The original `initializeAuth()` implementation is documented in:
- `BYPASS_INSTRUCTIONS.md` (this directory)

Or check the git history:
```bash
git log --all --full-history -- src/App.tsx
```
