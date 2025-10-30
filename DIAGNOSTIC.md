# Live Preview Diagnostic

## Issue
Live preview is not working in Spark environment.

## Potential Causes

### 1. Authentication Initialization Hanging
The app initializes credentials in `useEffect` which uses async operations. If the KV store is not responding, the app will show a blank screen (`return null` on line 83 of App.tsx).

### 2. Crypto API Not Available
The authentication system uses Web Crypto API for PBKDF2 password hashing. If this API is not available or throws an error, the initialization will fail silently.

### 3. Build/TypeScript Errors
Check browser console for any compilation errors.

### 4. CSS Loading Issues
The index.css uses Tailwind and custom CSS variables. If CSS isn't loading properly, components might not render.

## Quick Fixes to Try

### Fix 1: Simplify Initial Render
Temporarily bypass authentication to see if the app renders at all.

### Fix 2: Add Console Logging
Add console.log statements in App.tsx to track initialization flow.

### Fix 3: Check Browser Console
Look for JavaScript errors, failed network requests, or warnings.

### Fix 4: Verify Dependencies
Ensure all npm packages are properly installed.

## Recommended Immediate Action
Add error boundaries and console logging to track where initialization is failing.
