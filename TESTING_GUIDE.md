# Testing Guide: Cross-Browser Authentication Fix

This guide explains how to test that the critical security fixes are working correctly.

## What Was Fixed

The application now uses **Spark KV cloud storage** instead of browser-local IndexedDB. This means:
- User accounts exist globally, not per-browser
- Admin accounts work across all browsers and devices
- Invite links work from any browser
- Multi-device authentication is supported

## Testing Scenarios

### Test 1: Admin Creation Works Globally

**Objective**: Verify that creating an admin in one browser means it exists in all browsers.

**Steps**:
1. Open RelEye in **Chrome** (or your primary browser)
2. You should see "Create First Admin" screen
3. Create admin account:
   - Email: `admin@test.com`
   - Password: `TestAdmin123!`
4. Complete the setup

**Expected Result**: Account created successfully, you're logged in

**Cross-Browser Verification**:
5. Open RelEye in **Firefox** (or different browser)
6. Should show **Login Screen** (NOT "Create First Admin")
7. Login with same credentials: `admin@test.com` / `TestAdmin123!`
8. Should successfully authenticate

**✅ Pass Criteria**: 
- Only one admin creation screen appears (first time only)
- Login works in all browsers with same credentials
- No duplicate admin accounts can be created

**❌ Fail Indicators**:
- Firefox shows "Create First Admin" again (OLD BUG)
- Login fails with "Invalid email or password"
- Can create multiple admin accounts

---

### Test 2: Invite Links Work Cross-Browser

**Objective**: Verify invite links work when opened in different browsers.

**Prerequisites**: You have an admin account created

**Steps**:
1. Login as admin in **Chrome**
2. Create a new user invite:
   - Click Settings → User Management
   - Click "Invite User"
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Role: Editor
   - Click "Create Invite"
3. Copy the invitation link from the dialog

**Expected Result**: Invitation link copied to clipboard

**Cross-Browser Verification**:
4. Open the invitation link in **Firefox** (or different browser/device)
5. Should show account creation screen with:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Role: Editor
6. Create password: `TestUser123!`
7. Click "Create Account"

**Expected Result**: Account created successfully, user is logged in

**✅ Pass Criteria**:
- Invite link loads correctly in any browser
- User details are correct (name, email, role)
- Account creation succeeds
- User can login afterwards

**❌ Fail Indicators**:
- "Invalid or expired invitation" error (OLD BUG)
- Invite details missing or incorrect
- Account creation fails
- Cannot login after creation

---

### Test 3: Multi-Device Login

**Objective**: Verify the same account can login from multiple devices.

**Prerequisites**: You have a user account created

**Steps**:
1. Create account on **Laptop/Desktop**:
   - Use normal signup or invite process
   - Email: `multidevice@test.com`
   - Password: `MultiDevice123!`
   - Complete setup and verify it works

**Multi-Device Verification**:
2. Open RelEye on **Phone/Tablet** (or different computer)
3. Should show login screen
4. Login with same credentials:
   - Email: `multidevice@test.com`
   - Password: `MultiDevice123!`
5. Should successfully authenticate

**Expected Result**: Can login from any device with same credentials

**✅ Pass Criteria**:
- Login works on first device
- Login works on second device
- Login works on any additional device
- Each device has independent local workspace

**❌ Fail Indicators**:
- "Invalid email or password" on second device (OLD BUG)
- Account doesn't exist on new device
- Must create new account per device

---

### Test 4: Deployed Site Security

**Objective**: Verify the deployed site at releye.boestad.com is properly secured.

**Steps**:
1. Open `https://releye.boestad.com` in **fresh browser** (incognito/private mode)

**Scenario A - First Time (No Admin Exists)**:
- Should show "Create First Admin" screen
- Create the admin account
- Close browser

**Scenario B - Admin Exists**:
2. Open `https://releye.boestad.com` in **another fresh browser**
3. Should show **Login Screen** (NOT admin creation)
4. Cannot create duplicate admin
5. Must use valid credentials to access

**✅ Pass Criteria**:
- Only first user sees admin creation
- All subsequent users see login screen
- Cannot bypass authentication
- Proper security enforced globally

**❌ Fail Indicators**:
- Every new browser shows "Create First Admin" (CRITICAL BUG)
- Can create multiple admins
- No authentication required
- Security bypassed

---

### Test 5: Invite Expiration

**Objective**: Verify expired invites are properly rejected.

**Prerequisites**: You have admin access

**Steps**:
1. Login as admin
2. Create an invite (normally expires in 7 days)
3. Copy the invite link

**Manual Expiration** (for testing):
4. Open browser console (F12)
5. Run this code to manually expire the invite:
```javascript
// Get all invites
const invites = await window.spark.kv.get('app-pending-invites')
// Expire all invites (set expiresAt to past)
const expiredInvites = invites.map(inv => ({
  ...inv,
  expiresAt: Date.now() - 1000
}))
// Save back
await window.spark.kv.set('app-pending-invites', expiredInvites)
console.log('Invites expired')
```

**Verification**:
6. Open the invite link (in new tab/browser)
7. Should show error: "This invitation has expired"
8. Should not allow account creation

**✅ Pass Criteria**:
- Expired invites are rejected
- Clear error message shown
- Cannot create account with expired invite
- Link to return to login provided

**❌ Fail Indicators**:
- Expired invite still works
- No expiration checking
- Account created with expired invite

---

### Test 6: Storage Health Check

**Objective**: Verify Spark KV storage is working correctly.

**Steps**:
1. Login as admin
2. Open browser console (F12)
3. Run this diagnostic code:
```javascript
// Import and run storage tests
const { storage } = await import('./src/lib/storage.js')
const health = await storage.checkHealth()
console.log('Storage Health:', health)
console.log('✅ Is Ready:', health.isReady)
console.log('✅ Can Read:', health.canRead)
console.log('✅ Can Write:', health.canWrite)
console.log('✅ Can Delete:', health.canDelete)
if (health.error) {
  console.error('❌ Error:', health.error)
}
```

**Expected Result**:
```
Storage Health: {
  isReady: true,
  canRead: true,
  canWrite: true,
  canDelete: true,
  error: undefined
}
```

**✅ Pass Criteria**:
- All health checks return `true`
- No errors reported
- Storage is fully functional

**❌ Fail Indicators**:
- Any check returns `false`
- Error message present
- Storage not available

---

## Common Issues & Solutions

### Issue: "Spark KV not available"

**Symptoms**: Storage initialization fails, app doesn't load

**Cause**: Running locally without Spark runtime

**Solution**: 
- Deploy to GitHub Pages (where Spark runtime is available)
- Or use the local development server with Spark support

---

### Issue: "Invalid invitation" on different browser

**Symptoms**: Invite link works in Chrome but fails in Firefox

**Cause**: May still be using old IndexedDB code

**Solution**:
- Verify `src/lib/storage.ts` uses `SparkKVAdapter`
- Clear browser cache and reload
- Redeploy the application

---

### Issue: Multiple admin accounts

**Symptoms**: Can create admin in multiple browsers

**Cause**: IndexedDB still in use (not fixed)

**Solution**:
- Must use Spark KV cloud storage
- Check storage adapter implementation
- Verify cloud sync is working

---

## Verification Checklist

Use this checklist to verify the fix is working:

- [ ] Created admin in Chrome
- [ ] Opened site in Firefox, saw login (not admin creation)
- [ ] Logged in with same credentials in Firefox
- [ ] Created invite in Chrome
- [ ] Opened invite link in Firefox
- [ ] Account creation succeeded
- [ ] Can login from phone/mobile
- [ ] Fresh browser shows login (not admin creation)
- [ ] Expired invites are rejected
- [ ] Storage health check passes
- [ ] No "Invalid invitation" errors
- [ ] No duplicate admin accounts possible

**If all items checked**: ✅ Fix is working correctly

**If any item fails**: ❌ Issue needs investigation

---

## Debugging Tips

### Check Current Storage Adapter

Run in browser console:
```javascript
const { storage } = await import('./src/lib/storage.js')
console.log(storage.constructor.name) // Should be: SparkKVAdapter
```

### List All Stored Keys

Run in browser console:
```javascript
const keys = await window.spark.kv.keys()
console.log('Stored keys:', keys)
// Should include: app-users-registry, app-pending-invites, app-current-user-id
```

### View Current Users

Run in browser console:
```javascript
const users = await window.spark.kv.get('app-users-registry')
console.log('Registered users:', users)
```

### View Pending Invites

Run in browser console:
```javascript
const invites = await window.spark.kv.get('app-pending-invites')
console.log('Pending invites:', invites)
```

---

## Reporting Issues

If you find issues after testing:

1. Note which test failed
2. Document exact steps to reproduce
3. Include browser/device information
4. Check browser console for errors
5. Run storage health check
6. Report with all diagnostic information

---

## Success Indicators

The fix is working correctly when:

✅ Admin account works across all browsers
✅ Invite links work from any device
✅ Multi-device login supported
✅ Proper security enforced
✅ No duplicate admin accounts
✅ Storage health checks pass
✅ Cross-browser authentication works
✅ Deployed site properly secured

---

## Additional Resources

- `CRITICAL_SECURITY_FIX.md` - Detailed explanation of the fix
- `src/lib/storage.ts` - Storage implementation
- `src/lib/storageTest.ts` - Automated testing utilities
- `src/components/StorageDiagnostic.tsx` - UI diagnostic tool
