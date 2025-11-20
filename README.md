# RelEye - Relationship Network Visualization

A powerful visual relationship mapping and network analysis tool for understanding complex connections between people, teams, and organizations.

## 🚀 Quick Start

### For First-Time Setup
1. Navigate to [https://releye.boestad.com](https://releye.boestad.com)
2. You'll be prompted to create an admin account
3. Set your admin username and password
4. Start creating your relationship networks!

### Resetting the Application

If you need to reset all user credentials and start fresh:

#### Option 1: Admin Dashboard (Recommended if you can login)
1. Log in as admin
2. Open Settings → Admin → Reset tab
3. Follow the multi-step confirmation process

#### Option 2: Reset Utility Page
1. Visit [https://releye.boestad.com/reset.html](https://releye.boestad.com/reset.html)
2. Follow the guided reset process

#### Option 3: API Reset (For advanced users)
```bash
curl -X POST https://releye.boestad.com/api/auth/reset-all
```

See [RESET_INSTRUCTIONS.md](RESET_INSTRUCTIONS.md) for detailed instructions.

## 🔑 Key Features

- **Visual Network Mapping**: Create intuitive visual representations of relationships
- **User Management**: Secure multi-user access with role-based permissions
- **Investigation Tools**: AI-powered analysis capabilities
- **Local File Storage**: Your network data stays with you
- **Secure Authentication**: Backend-powered credential management

## 📚 Documentation

- [Reset Instructions](RESET_INSTRUCTIONS.md) - How to reset passwords and user data
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - How to deploy to your own domain
- [API Documentation](BACKEND_DEPLOYMENT_GUIDE.md) - Backend API reference

## 🔒 Security

User credentials are stored securely in a MySQL database on the backend. Network files remain local to your browser for privacy.

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
