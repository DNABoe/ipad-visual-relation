# API Connection Diagnostics

A built-in diagnostic tool to help troubleshoot backend API connection issues in RelEye.

## Quick Access

### From Login Screen
1. Navigate to the login screen
2. Click "API Connection Diagnostics" link at the bottom
3. Click "Run Diagnostics" button

### Direct URL
Add `?diagnostics=true` to your URL:
- **Development**: `http://localhost:5173/?diagnostics=true`
- **Production**: `https://yourdomain.com/?diagnostics=true`

## What It Tests

The diagnostic tool runs 5 comprehensive tests:

### 1. Environment Info
- Shows the API base URL being used
- Displays current origin and protocol
- Identifies if running in development or production mode

### 2. Basic Connectivity
- Tests if the API server is reachable
- Verifies `/api/health` endpoint responds
- Measures response time

### 3. CORS Configuration
- Checks Cross-Origin Resource Sharing headers
- Verifies credentials are allowed
- Validates allowed methods and headers

### 4. First-Time Setup Check
- Tests `/api/auth/first-time` endpoint
- Checks if admin user exists
- Validates authentication system

### 5. User Registry
- Tests `/api/users` endpoint
- Shows number of registered users
- Validates user management system

### 6. Invite System
- Tests `/api/invites` endpoint
- Shows pending invites
- Validates invitation system

## Reading Results

Each test shows:
- ✅ **Success** (green): Test passed, system working correctly
- ❌ **Error** (red): Test failed, needs attention
- ⚠️ **Warning** (yellow): Test completed but with concerns
- **Response Time**: How long the API took to respond (in milliseconds)
- **Details**: Raw response data for debugging

## Common Issues & Solutions

### "Failed to connect to API server"
**Cause**: Backend server is not running or unreachable

**Solutions**:
- Verify the backend server is running
- Check the API URL in the Environment Info section
- For localhost: Ensure backend is running on `http://localhost:3000`
- For production: Verify domain and SSL configuration

### "CORS preflight failed"
**Cause**: CORS headers not properly configured on backend

**Solutions**:
- Check backend CORS configuration
- Verify `Access-Control-Allow-Origin` includes your domain
- Ensure `Access-Control-Allow-Credentials` is set to `true`

### "API endpoint working - isFirstTime: false" but can't login
**Cause**: API is working but authentication issue

**Solutions**:
- Check if admin user exists in database
- Verify password is correct
- Review backend authentication logs

### All tests pass but application still fails
**Cause**: Issue with session/cookies or specific functionality

**Solutions**:
- Clear browser cookies and local storage
- Check browser console for JavaScript errors
- Review backend logs for specific error messages

## Exporting Results

Click the "Copy Results" button to copy all test results to clipboard. This is helpful when:
- Reporting issues to support
- Sharing debugging info with team
- Documenting problems

## API Configuration

The API base URL is automatically determined:
- **Localhost**: `http://localhost:3000/api`
- **Production**: `{current-origin}/api`

This is configured in `/src/lib/cloudAPI.ts`.

## Returning to Normal Mode

To exit diagnostics mode:
- Click the browser back button
- Remove `?diagnostics=true` from URL
- Navigate to your domain's base URL

---

**Note**: This diagnostic tool only tests connectivity and basic API responses. It does not test file operations, workspace operations, or encryption systems.
