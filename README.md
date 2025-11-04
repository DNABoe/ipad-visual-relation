# RelEye - Relationship Network Visualization

**Version:** Beta 1.0

RelEye is a secure, privacy-focused relationship network visualization platform that allows you to map, analyze, and understand complex connections between people, teams, and organizations.

## 🔐 Security & Privacy

- **AES-256-GCM Encryption**: All network files are encrypted with military-grade encryption
- **Zero-Knowledge Architecture**: Your data is never stored in the cloud unencrypted
- **Local-Only Storage**: Network files are stored on your device only
- **Secure Multi-User**: End-to-end encrypted user authentication and access control

## ✨ Key Features

### Network Visualization
- Visual relationship mapping with drag-and-drop interface
- Multiple connection types (straight, organic curves) with varying weights
- Color-coded status indicators (Positive, Negative, Neutral, Uncategorized)
- Importance scoring (1-5 scale) for strategic prioritization
- Group organization with customizable colors and containers

### Advanced Analysis
- **Smart Arrange**: Multiple intelligent layout algorithms
  - Organize by importance (central-peripheral)
  - Influence-based hierarchy
  - Compact network optimization
- **Shortest Path**: Visualize optimal connection routes with animated particles
- **Find & Filter**: Real-time search and multi-criteria filtering
- **Collapse/Expand**: Manage complex branches for cleaner visualization

### Investigation Tools
- **AI-Powered Intelligence Reports**: Generate professional profiles using OpenAI
- Automated PDF report generation with intelligence brief formatting
- Photo integration and management
- Rich notes and attachment support

### Collaboration
- Multi-user workspaces with role-based access control (Admin, Editor, Viewer)
- Email-based user invitations
- Activity logging and audit trails
- Secure credential management

### Export & Integration
- Export to PNG with transparent backgrounds
- Selective export (full network or selected persons)
- Customizable export options (include/exclude photos, names, positions, scores)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/releye.git
cd releye
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys (optional, for investigation feature):
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

> **Note**: The investigation feature requires an OpenAI API key. Get one at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys). Without this key, all other features will work normally.

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

### First Time Setup

1. On first launch, you'll be prompted to set up an administrator account
2. Choose a strong username and password
3. Create a new network or load an existing one
4. Start building your relationship network!

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI API Key for Investigation Feature (optional)
VITE_OPENAI_API_KEY=sk-proj-...

# Add other configuration as needed
```

### Canvas Settings

Customize your workspace in Settings > System:
- **Grid Display**: Toggle grid visibility and adjust size/opacity
- **Magnetic Snap**: Enable alignment guides for cleaner layouts
- **Connection Style**: Choose between straight or organic curved lines
- **Grid Opacity**: Adjust grid visibility (0-100%)

## 📦 Deployment

### GitHub Pages

The project is configured for automatic deployment to GitHub Pages.

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to "GitHub Actions"
4. The workflow will automatically build and deploy

### Custom Domain

To use a custom domain (e.g., releye.boestad.com):

1. Add a `CNAME` file with your domain
2. Configure DNS settings:
   - Add a CNAME record pointing to `yourusername.github.io`
3. Enable HTTPS in GitHub Pages settings

### Environment Variables for Deployment

For the investigation feature to work on your deployed site, you need to configure the OpenAI API key as a repository secret:

1. Go to your GitHub repository Settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add a new repository secret:
   - Name: `VITE_OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-proj-...`)

The GitHub Actions workflow will automatically inject this during the build process.

## 🎨 Design System

RelEye uses a carefully crafted dark-mode design system:

- **Primary**: `oklch(0.65 0.11 185)` - Muted cyan-blue
- **Accent**: `oklch(0.88 0.18 185)` - Bright glowing accent
- **Background**: `oklch(0.15 0.02 240)` - Deep black with blue tint
- **Typography**: Inter (body), Poppins (headings), IBM Plex Mono (data)

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete details.

## 🔑 Keyboard Shortcuts

- `Space + Drag`: Pan canvas
- `Ctrl/Cmd + Click`: Multi-select
- `Ctrl/Cmd + D`: Duplicate selected person(s)
- `Ctrl/Cmd + G`: Group selected persons
- `Ctrl/Cmd + Z`: Undo
- `1-5 Keys`: Change selected person's importance score
- `Arrow Keys`: Nudge selected person(s)
- `Shift + Arrow Keys`: Nudge by larger increment
- `F`: Focus on selected person (zoom to fit)
- `/`: Focus search bar
- `?`: Show keyboard shortcuts panel

## 📝 File Format

RelEye uses `.enc.releye` files:
- Binary format with AES-256-GCM encryption
- Password-protected with PBKDF2 key derivation
- Contains complete network state, user settings, and metadata
- Never stored in cloud - local device only

## 🛡️ Security Architecture

- **Password Hashing**: PBKDF2 with 100,000 iterations
- **File Encryption**: AES-256-GCM with random IVs
- **Zero-Knowledge**: Server never sees unencrypted data
- **Local Storage**: All sensitive data stored on device
- **Secure Sessions**: Encrypted authentication tokens

See [COMPREHENSIVE_SECURITY_ANALYSIS.md](COMPREHENSIVE_SECURITY_ANALYSIS.md) for detailed security information.

## 🐛 Troubleshooting

### Investigation Feature Not Working

**Error**: "Failed to generate investigation report"

**Solution**: 
1. Check that you've set up the OpenAI API key in your `.env` file
2. Verify the API key is valid at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Ensure you have API credits available in your OpenAI account
4. Check browser console for detailed error messages

### Login Issues

**Error**: "Invalid username or password"

**Solution**:
1. Default credentials on first setup: admin/admin
2. After first login, change your password in Settings
3. If locked out, use admin panel to reset (admin users only)

### File Won't Load

**Error**: "Failed to decrypt file"

**Solution**:
1. Verify you're using the correct password
2. Ensure the file hasn't been corrupted
3. Try loading from a backup if available

## 🤝 Contributing

This is a private project. For questions or issues, contact D Boestad.

## 📄 License

Copyright © 2024 D Boestad. All rights reserved.

Made with ❤️ by D Boestad

---

**Version**: Beta 1.0  
**Last Updated**: 2024
