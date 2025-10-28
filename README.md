# RelEye - Relationship Network Visualization

RelEye is a secure, privacy-focused relationship network visualization tool that helps you map and understand connections between people, teams, and organizations.

## 🔒 Security & Privacy

- **Strong Encryption**: AES-256-GCM encryption for all stored data
- **Local Storage Only**: All data stored locally on your device - nothing in the cloud
- **Zero Server Dependencies**: Complete client-side application
- **Password Protected**: Secure authentication with bcrypt hashing

## ✨ Features

- **Interactive Network Canvas**: Drag-and-drop interface for building relationship networks
- **Person Cards**: Visual cards with photos, importance scores, and relationship details
- **Connection Management**: Define relationships with attributes (positive/neutral/negative)
- **Smart Organization Tools**:
  - Organize by Importance: Centers most important connections
  - Smart Arrange: Optimizes layout to minimize connection lengths
  - Compact Layout: Tightens network while preserving relationships
  - Hierarchy View: Organizes network from a selected person's perspective
- **Grouping**: Color-coded groups for organizing related people
- **Export/Import**: Encrypted file-based storage for your networks
- **Photo Management**: Add photos to person cards for easy visual identification

## 🚀 Deployment

This application is configured for automatic deployment to `releye.boestad.com` via GitHub Pages.

### Quick Start

**See `DEPLOYMENT_START_HERE.md` for complete deployment help.**

**Having a black screen?** → Read `FIX_BLACK_SCREEN.md` immediately!

### Automatic Deployment

Every push to the `main` branch automatically:
1. Builds the application
2. Deploys to GitHub Pages  
3. Serves at https://releye.boestad.com

### Essential Setup (First Time)

1. **Configure GitHub Pages** ⚠️ **CRITICAL**:
   - Go to repository Settings → Pages
   - **Source**: Select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Custom domain: `releye.boestad.com`
   - Save

2. **Configure DNS** at your domain registrar:
   - Add CNAME record: `releye` → `[your-github-username].github.io`
   - Or add A records to GitHub IPs (see `QUICKSTART_DEPLOY.md`)

3. **Trigger Deployment**:
   ```bash
   git push origin main
   ```

4. **Verify**: 
   - Check Actions tab (should complete in ~3 minutes)
   - Visit https://releye.boestad.com

### Deployment Documentation

- 📄 `DEPLOYMENT_START_HERE.md` - Overview of all deployment docs
- 📄 `FIX_BLACK_SCREEN.md` - Troubleshoot black screen issues
- 📄 `QUICKSTART_DEPLOY.md` - 3-minute setup guide  
- 📄 `PAGES_DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- 📄 `DEPLOYMENT.md` - Comprehensive guide

### Verify Deployment Prerequisites

```bash
# Linux/Mac
bash verify-deployment.sh

# Windows
verify-deployment.bat
```

### Local Build & Test

```bash
npm install
npm run build
npm run preview  # Visit http://localhost:4173
```

## 🛠️ Development

### Prerequisites

- Node.js 20+ 
- npm

### Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
.
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn components
│   │   ├── WorkspaceView2.tsx
│   │   ├── PersonNode.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and types
│   ├── App.tsx           # Main app component
│   └── index.css         # Design system & styles
├── .github/
│   └── workflows/
│       └── deploy.yml    # Auto-deployment workflow
├── CNAME                 # Custom domain configuration
├── index.html
├── vite.config.ts
└── package.json
```

## 🎨 Design System

RelEye uses a custom dark theme design system with:
- **Primary Colors**: Muted cyan-blue accents (#45A29E, #66FCF1)
- **Background**: Deep charcoal with blue tints
- **Typography**: Inter for UI, Poppins for headings, IBM Plex Mono for data
- **Motion**: Smooth 200-300ms transitions with ease-in-out

## 🔐 Default Credentials

First-time login:
- Username: `admin`
- Password: `admin`

**Important**: Change these immediately in Settings → User after first login.

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 👤 Author

Made by D Boestad

---

**Version**: Beta 0.5
