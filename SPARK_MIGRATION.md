# RelEye - Relationship Network Visualization

A simplified Spark application for visualizing relationship networks between people, teams, and organizations.

## Architecture

This application has been simplified to run entirely as a self-contained Spark application:

### Data Storage
- **All data stored using Spark KV storage** (`window.spark.kv` API)
- No external database required
- No backend API server needed
- All authentication and user data persists in the Spark runtime

### Key Features
- Multi-user authentication system
- Secure password hashing
- User roles (admin, editor, viewer)
- Invite system for new users
- Network visualization canvas
- File encryption for workspace data
- Local file export/import

## How It Works

1. **First Time Setup**: On first launch, create an admin account
2. **Authentication**: Users log in with email/password
3. **Workspaces**: Create and manage relationship network workspaces
4. **Persistence**: All data (users, workspaces, settings) stored in Spark KV

## Migration from External Backend

The application was migrated from using an external MySQL database to using Spark's built-in KV storage:

**Before:**
- Required external API server at `/api`
- MySQL database for user management
- Complex deployment with frontend + backend

**After:**
- Single Spark application
- All data in Spark KV storage
- Simple deployment - just the Spark app

## Development

This is a standard Spark application. The Spark runtime handles:
- Module bundling with Vite
- Hot module replacement
- KV storage persistence
- User session management

## Key Files

- `src/App.tsx` - Main application component
- `src/lib/userRegistry.ts` - User management using Spark KV
- `src/lib/auth.ts` - Password hashing and verification
- `src/components/WorkspaceView.tsx` - Main network visualization
- `src/components/FileManager.tsx` - Workspace file management

## No External Dependencies

This app runs entirely in the Spark runtime with no external services required.
