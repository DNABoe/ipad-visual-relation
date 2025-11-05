# Deployment Architecture Analysis: Critical Issues

## Executive Summary

**CRITICAL FINDING**: The current invitation and authentication architecture **WILL NOT WORK** when deployed outside the Spark environment at `releye.boestad.com`.

## The Problem

### Current Architecture Uses Spark KV (Cloud Storage)

Your application currently relies on `window.spark.kv` for storing:
- User registry (all user accounts, emails, password hashes, roles)
- Pending invitations (invite tokens, expiration times)
- Current user session data

### What is Spark KV?

Spark KV is a **GitHub Spark-specific cloud storage API** that:
- Only exists within the GitHub Spark runtime environment
- Is NOT available when you deploy to GitHub Pages at `releye.boestad.com`
- Is NOT a standard web API (like localStorage or IndexedDB)

### What Happens When Deployed to releye.boestad.com?

When users visit `https://releye.boestad.com`:

1. ❌ `window.spark` will be **undefined**
2. ❌ `window.spark.kv` will **not exist**
3. ❌ All authentication will **fail**
4. ❌ First-time setup will **fail**
5. ❌ Invitations will **fail**
6. ❌ Login will **fail**
7. ❌ The app will be **completely unusable**

## Evidence From Your Code

### storage.ts (Lines 18-154)
```typescript
class SparkKVAdapter implements StorageAdapter {
  private async checkReady(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.spark || !window.spark.kv) {
      console.error('[SparkKVAdapter] ✗ Spark KV not available')
      return false  // ← THIS WILL ALWAYS BE FALSE ON GITHUB PAGES
    }
    return true
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.ensureReady()
    return await window.spark.kv.get<T>(key)  // ← window.spark DOESN'T EXIST
  }
}
```

### userRegistry.ts Uses This Storage
```typescript
const USERS_KEY = 'app-users-registry'
const INVITES_KEY = 'app-pending-invites'
const CURRENT_USER_KEY = 'app-current-user-id'

export async function getAllUsers(): Promise<RegisteredUser[]> {
  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  // ← This calls SparkKVAdapter which WILL FAIL on GitHub Pages
  return users
}
```

## The Security Issue You Described

> "Now if i create a new admin in one browser, I get a create new admin if i go to releye.boestad.com on a different browser. Seems like the program ar not aware of the admin. Serious security issue."

**Root Cause**: You're testing on GitHub Pages (releye.boestad.com) where Spark KV doesn't exist. The storage adapter silently fails, so:
- Admin created in Chrome → NOT saved (Spark KV unavailable)
- Open Firefox → App checks for admin → Finds nothing → Shows first-time setup again
- Every browser/session acts like it's the first time

## What About the PRD's Claims?

Your PRD.md states:
> "This application is designed to be deployed as a static site on GitHub Pages"
> "All functionality works when deployed"
> "User authentication with secure credential storage via Spark KV (cloud-synced storage)"

**These statements are contradictory**. Spark KV is NOT available on GitHub Pages static sites. It only works within the Spark runtime environment.

## GitHub Pages vs GitHub Spark

| Feature | GitHub Pages | GitHub Spark |
|---------|-------------|--------------|
| **Type** | Static file hosting | Interactive runtime environment |
| **URL** | Custom domain (releye.boestad.com) | spark.github.com/[owner]/[repo] |
| **APIs** | Standard web APIs only | Special APIs including `window.spark` |
| **Storage** | localStorage, IndexedDB | Spark KV (cloud-synced) |
| **Backend** | None | Spark runtime services |

## Solutions

### Option 1: Use IndexedDB (Browser Storage)
**Pros**:
- Works on GitHub Pages
- Standard web API
- Persistent storage

**Cons**:
- Storage is per-browser (not synced across devices)
- Creating admin in Chrome won't be visible in Firefox
- Each browser has separate user database
- Invites won't work across browsers

**Verdict**: ❌ **NOT suitable for multi-user authentication system**

### Option 2: Deploy as GitHub Spark (Not GitHub Pages)
**Pros**:
- Spark KV works perfectly
- Cloud-synced authentication
- Cross-browser/device user registry
- Invitations work properly

**Cons**:
- URL will be spark.github.com instead of releye.boestad.com
- Cannot use custom domain
- Must use Spark deployment, not GitHub Pages

**Verdict**: ✅ **This is what your current code is designed for**

### Option 3: Add Backend Server
**Pros**:
- Can use custom domain (releye.boestad.com)
- Proper multi-user authentication
- Cross-browser/device user registry

**Cons**:
- Requires backend infrastructure (Node.js, database)
- Hosting costs
- More complex deployment
- Contradicts "all data stays on device" security model

**Verdict**: ⚠️ **Possible but changes architecture significantly**

### Option 4: Hybrid - Files + Simple Auth Backend
**Pros**:
- Keep encrypted files on device (main security promise)
- Backend only handles user credentials
- Can use custom domain

**Cons**:
- Still requires backend hosting
- More complex than current setup

**Verdict**: ⚠️ **Possible compromise solution**

## Recommended Path Forward

### Immediate: Clarify Deployment Target

**Decision Point**: Where do you want to deploy?

#### Path A: GitHub Spark
- ✅ Current code works as-is
- ✅ Multi-user authentication works
- ✅ Invitations work across browsers
- ❌ Cannot use custom domain
- URL: `https://spark.github.com/[your-username]/spark-template`

#### Path B: GitHub Pages (Custom Domain)
- ❌ Current code **WILL NOT WORK**
- ✅ Can use releye.boestad.com
- Requires complete rewrite of authentication system
- Options:
  - Single-user mode (no invites, one password per browser)
  - Add backend server for authentication

## Testing Recommendations

To verify this analysis, test on actual GitHub Pages:

1. Deploy current code to GitHub Pages at releye.boestad.com
2. Open browser console
3. Run: `console.log(window.spark)` → **Will be undefined**
4. Try to create admin → **Will fail or silently not persist**
5. Refresh page → **First-time setup appears again**

## Documentation Updates Needed

Your current documentation is misleading:

### STORAGE_ARCHITECTURE.md Claims (INCORRECT for GitHub Pages):
- "RelEye uses the Spark KV (Key-Value) API for persisting user credentials"
- "When deployed at releye.boestad.com... The Spark runtime injects window.spark.kv"

### DEPLOYMENT.md Claims (INCORRECT):
- "RelEye is configured to automatically deploy to releye.boestad.com using GitHub Pages"
- (Then describes GitHub Pages deployment process)

These documents contradict each other. You cannot have both Spark KV AND GitHub Pages custom domain.

## Questions to Answer

1. **Is this app deployed via GitHub Spark or GitHub Pages?**
   - If GitHub Spark: Why have CNAME and GitHub Pages config?
   - If GitHub Pages: Why use Spark KV?

2. **Where are you testing when you see the admin issue?**
   - Testing on spark.github.com? → Should work
   - Testing on releye.boestad.com? → Won't work

3. **What is your priority?**
   - Custom domain (releye.boestad.com)? → Need different storage
   - Current architecture? → Must use Spark deployment

4. **Do you need multi-user authentication?**
   - Yes → Need cloud storage (backend or Spark)
   - No → Can use single-user mode with IndexedDB

## Next Steps

1. **Clarify deployment target** (Spark vs Pages)
2. **Choose storage strategy** based on target
3. **Update architecture** to match deployment
4. **Fix or remove contradictory documentation**
5. **Implement appropriate storage adapter**
6. **Test on actual deployment environment**

## Conclusion

The current architecture is designed for **GitHub Spark** but your documentation and configuration suggest **GitHub Pages**. These are incompatible. You must choose one and update the code accordingly.

The "serious security issue" you're experiencing is actually a deployment architecture mismatch, not a security bug in the code itself.
