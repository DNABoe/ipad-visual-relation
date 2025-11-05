# Cloud Authentication API Setup Guide

This document describes the backend API that needs to be deployed at `https://releye.boestad.com/api` to enable cloud-based user authentication across browsers and devices.

## Overview

The RelEye application now supports cloud-based user authentication. User credentials and account information are stored in a remote database, while network files remain stored locally on each device. This enables users to:

- Access the app from multiple browsers
- Access the app from multiple computers
- Share their credentials across devices
- Maintain network files locally for privacy and performance

## Architecture

- **Frontend**: React application (this codebase)
- **Backend API**: Node.js/Express server (to be deployed at releye.boestad.com)
- **Database**: PostgreSQL or MongoDB (recommended)
- **User Data**: Stored in cloud database
- **Network Files**: Stored locally in browser localStorage

## API Endpoints Required

### Health Check
- **GET** `/api/health`
- Response: `{ success: true, data: { status: "ok" } }`

### Authentication

#### Check First Time Setup
- **GET** `/api/auth/first-time`
- Response: `{ success: true, data: { isFirstTime: boolean } }`

#### Login
- **POST** `/api/auth/login`
- Body: `{ email: string, password: string }`
- Response: `{ success: true, data: RegisteredUser }`
- Note: Server should verify password hash and update lastLogin/loginCount

### Users

#### Get All Users
- **GET** `/api/users`
- Response: `{ success: true, data: RegisteredUser[] }`

#### Get User by Email
- **GET** `/api/users/email/:email`
- Response: `{ success: true, data: RegisteredUser }` or 404

#### Get User by ID
- **GET** `/api/users/:userId`
- Response: `{ success: true, data: RegisteredUser }` or 404

#### Create User
- **POST** `/api/users`
- Body: `RegisteredUser` object
- Response: `{ success: true, data: RegisteredUser }`

#### Update User
- **PUT** `/api/users/:userId`
- Body: Partial `RegisteredUser` object
- Response: `{ success: true }`

#### Delete User
- **DELETE** `/api/users/:userId`
- Response: `{ success: true }`

### Invites

#### Get All Invites
- **GET** `/api/invites`
- Response: `{ success: true, data: PendingInvite[] }`

#### Get Invite by Token
- **GET** `/api/invites/:token`
- Response: `{ success: true, data: PendingInvite }` or 404

#### Create Invite
- **POST** `/api/invites`
- Body: `PendingInvite` object
- Response: `{ success: true, data: PendingInvite }`

#### Delete Invite
- **DELETE** `/api/invites/:token`
- Response: `{ success: true }`

#### Cleanup Expired Invites
- **POST** `/api/invites/cleanup`
- Response: `{ success: true }`

## Data Types

### RegisteredUser
```typescript
{
  userId: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  passwordHash: {
    hash: string
    salt: string
    iterations: number
  }
  createdAt: number
  lastLogin?: number
  loginCount: number
  canInvestigate: boolean
  encryptedApiKey?: string
  apiKeySalt?: string
}
```

### PendingInvite
```typescript
{
  inviteId: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  token: string
  createdAt: number
  expiresAt: number
  createdBy: string
}
```

## Security Considerations

1. **CORS**: Configure CORS to allow requests from your frontend domain
2. **HTTPS**: All API calls must be over HTTPS
3. **Rate Limiting**: Implement rate limiting on authentication endpoints
4. **Password Hashing**: Passwords are already hashed client-side using PBKDF2
5. **Input Validation**: Validate all inputs on the server
6. **SQL Injection**: Use parameterized queries
7. **Session Management**: Consider implementing session tokens for authenticated requests

## Database Schema

### users table
```sql
CREATE TABLE users (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash_hash VARCHAR(512) NOT NULL,
  password_hash_salt VARCHAR(512) NOT NULL,
  password_hash_iterations INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  last_login BIGINT,
  login_count INTEGER DEFAULT 0,
  can_investigate BOOLEAN DEFAULT FALSE,
  encrypted_api_key TEXT,
  api_key_salt VARCHAR(512)
);

CREATE INDEX idx_users_email ON users(email);
```

### invites table
```sql
CREATE TABLE invites (
  invite_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(512) UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);
```

## Sample Node.js/Express Implementation

See `api-server-example.js` in this directory for a reference implementation using Express and PostgreSQL.

## Deployment Checklist

- [ ] Set up database (PostgreSQL/MongoDB)
- [ ] Create database tables/collections
- [ ] Deploy API server to releye.boestad.com
- [ ] Configure CORS for frontend domain
- [ ] Set up SSL/HTTPS certificate
- [ ] Configure environment variables
- [ ] Test all endpoints
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Configure backup strategy

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/releye
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://releye.boestad.com
```

## Testing the API

Once deployed, you can test the health endpoint:

```bash
curl https://releye.boestad.com/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## Fallback Behavior

The frontend is designed to gracefully fallback to local storage if the cloud API is unavailable:

1. On app load, it checks if the cloud API is reachable
2. If available, all user operations go through the cloud API
3. If unavailable, it falls back to localStorage
4. Network files always remain local regardless of cloud API availability

This ensures the app continues to work even if the backend is temporarily unavailable.
