# RelEye - Secure Relationship Network Visualization

A privacy-focused web application for mapping and understanding connections between people, teams, and organizations. All relationship data is encrypted locally with AES-256-GCM and never leaves your device.

**Production URL**: https://releye.boestad.com

> 📖 **New to the project?** Start with [START_HERE_DOCS.md](START_HERE_DOCS.md) or [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## 🚀 Quick Start

### For Users
1. Visit https://releye.boestad.com
2. Create an account or login
3. Create or load a network file
4. Start building your relationship maps

### For Developers

**👉 See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for all guides**

**Local Development:**
```bash
npm install
npm run dev
```

**Deployment:**
- Simple: See [CPANEL_QUICK_START.md](CPANEL_QUICK_START.md)
- Advanced: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📖 Documentation

**New here?** Start with [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - it will guide you to the right documentation for your needs.

### Essential Docs
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Start here! Index of all documentation
- **[PRD.md](PRD.md)** - Product requirements and features
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - UI/UX guidelines
- **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** - Development setup
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment instructions

---

## 🏗️ Architecture Overview

### Hybrid Storage Model

**Cloud-Based Authentication:**
- User accounts stored in MySQL database
- Multi-device access with role-based permissions
- Invite system for collaboration

**Local Network Files:**
- Relationship data encrypted with AES-256-GCM
- Files stored locally in browser (.enc.releye format)
- Maximum privacy - data never leaves your device
- Password-based encryption keys

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: shadcn/ui v4, Tailwind CSS
- **State**: React hooks, Spark KV storage
- **Backend**: Node.js, Express, MySQL
- **Security**: Web Crypto API, PBKDF2, AES-256-GCM

---

## ✨ Key Features

- 🎨 **Visual Network Builder** - Drag-and-drop canvas with nodes and connections
- 🔒 **End-to-End Encryption** - AES-256-GCM encryption for all network data
- 👥 **Multi-User System** - Role-based access (Admin, Editor, Viewer)
- 🎯 **Smart Layouts** - Auto-organize by importance or connections
- 🔍 **Advanced Search** - Fuzzy search with multi-criteria filtering
- 📊 **Groups & Categories** - Color-coded visual organization
- 🌐 **Cross-Device** - Cloud authentication, local file storage
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🔐 Security

- **Zero-Knowledge Architecture**: Network data never sent to servers
- **AES-256-GCM Encryption**: Military-grade encryption for files
- **PBKDF2 Key Derivation**: 100,000 iterations for file encryption
- **Secure Password Hashing**: PBKDF2 with 210,000 iterations for credentials
- **No Password Recovery**: Your password = your encryption key

See [SECURITY.md](SECURITY.md) for complete security details.

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

## 📄 License

MIT License - Copyright GitHub, Inc. (Spark Template)

Project code - Copyright D Boestad

---

## 🆘 Need Help?

1. Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment issues
3. See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for development setup
4. Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

---

**Built with [GitHub Spark](https://githubnext.com/projects/spark)**
