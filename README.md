# RelEye - Relationship Network Visualization

A web-based network visualization tool for mapping and understanding relationships between people, teams, and organizations. Built with React, TypeScript, and GitHub Spark.

## ✨ Key Features

- **Visual Network Mapping**: Drag-and-drop interface for building relationship networks
- **Multi-User Collaboration**: Role-based access control (Admin, Editor, Viewer)
- **Privacy-First**: Network data encrypted with AES-256 and stored locally
- **GitHub-Backed Auth**: User credentials managed via Spark KV (no backend required)
- **Color-Coded Organization**: Visual grouping and color-coding for easy navigation
- **Connection Mapping**: Multiple connection styles, weights, and directions
- **Photo Support**: Add profile photos to person nodes
- **Rich Annotations**: Notes, attachments, and activity logging

## 🚀 Quick Start

### Deployment

**See [SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md) for complete deployment instructions.**

This application uses a simplified single-deployment architecture:
1. Enable GitHub Pages in repository settings
2. (Optional) Configure custom domain
3. Access your deployed application

No backend server or database setup required!

### Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see your app.

## 🏗️ Architecture

### Hybrid Storage Model

**Spark KV (GitHub-backed)**
- User accounts and credentials
- Invite tokens
- User roles and permissions
- Synced across all devices

**Browser localStorage**
- Encrypted network files
- Person nodes and connections
- Groups and layouts
- Privacy-first: data never leaves device

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Storage**: Spark KV + localStorage
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Authentication**: PBKDF2 password hashing
- **Deployment**: GitHub Pages

## 📖 Documentation

- [SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md) - Deployment instructions
- [PRD.md](./PRD.md) - Product requirements and design system
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details

## 🔐 Security

- Passwords hashed with PBKDF2 (100,000 iterations)
- Network files encrypted with AES-256-GCM
- All traffic over HTTPS
- User data managed by GitHub's secure infrastructure
- Network data never leaves the user's device

## 📄 License

MIT License - Copyright GitHub, Inc.
