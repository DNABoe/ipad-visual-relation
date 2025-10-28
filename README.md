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

This application is configured for automatic deployment to your custom domain `releye.boestad.com` via GitHub Pages.

### Automatic Deployment

Every push to the `main` branch automatically:
1. Builds the application
2. Deploys to GitHub Pages
3. Serves at your custom domain

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically by the workflow)
   - Folder: `/ (root)`

2. **Custom Domain** (already configured):
   - CNAME file is already set to `releye.boestad.com`
   - Configure DNS:
     - Add a CNAME record pointing `releye.boestad.com` to `[your-github-username].github.io`
     - Or add A records pointing to GitHub Pages IPs:
       - `185.199.108.153`
       - `185.199.109.153`
       - `185.199.110.153`
       - `185.199.111.153`

3. **Verify Deployment**:
   - Check Actions tab for deployment status
   - Visit `https://releye.boestad.com` once DNS propagates

### Manual Deployment

To build and deploy manually:

```bash
npm install
npm run build
```

The built files will be in the `dist/` directory.

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
