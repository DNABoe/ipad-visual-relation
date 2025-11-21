# RelEye - Relationship Network App

A web-based network visualization tool that lets users build and explore visual relationship maps of key persons with draggable nodes, connections, and color-coded groups. All data is stored using GitHub-backed Spark KV storage and browser localStorage with AES-256 encryption for maximum security and privacy.

## ✨ SIMPLIFIED ARCHITECTURE - SINGLE DEPLOYMENT

**This application now uses a simplified architecture with NO backend server required!** Simply deploy to GitHub Pages and you're done.

## Deployment Information

**Production URL**: https://releye.boestad.com

This application consists of a single component:
- **Frontend**: Static React app deployed via GitHub Pages with Spark KV integration

### Architecture Overview

**GitHub-Backed User Authentication:**
- User credentials stored in Spark KV (GitHub-backed storage)
- Enables access from any browser or device
- Role-based access control (Admin, Editor, Viewer)
- Invite system for multi-user collaboration
- No separate backend server needed!

**Local Network Storage:**
- Network files (.enc.releye) stored in browser localStorage
- AES-256-GCM encryption for all relationship data
- Files never leave the user's device
- Privacy-first approach for sensitive data

### Critical Architecture: Hybrid Storage Model

**Why Spark KV for User Data:**
- Managed by GitHub (secure, reliable, no server to maintain)
- Users can access from multiple browsers and devices
- Credentials sync automatically across all platforms
- Invite system works across different devices
- Multi-user collaboration without backend complexity

**Why Local Network Files:**
- Maximum privacy - relationship data never leaves device
- No network latency for file operations
- Works offline once authenticated
- User maintains full control of sensitive data

**What's Stored in Spark KV (GitHub):**
- User accounts (email, name, role)
- Password hashes (PBKDF2)
- Pending invites
- Login statistics

**What Stays Local (Browser Storage):**
- Relationship network files (.enc.releye)
- Encrypted relationship data
- Person nodes and connections
- Group information
- Network layouts
- Current user session token

### Deployment Architecture

**Single Deployment (GitHub Pages):**
- Static React application with Spark runtime
- Deployed at https://releye.boestad.com
- Spark KV automatically handles data persistence via GitHub
- No backend server configuration needed
- No database setup required

### Deployment Checklist

✅ **Domain Configuration**: CNAME file present in `/public/CNAME` with `releye.boestad.com`
✅ **Base Path**: `index.html` uses relative paths (`./src/main.css`, `./src/main.tsx`) compatible with custom domain deployment
✅ **Assets**: All assets use proper imports (no hardcoded paths), public folder assets accessible via `/` root path
✅ **GitHub Pages**: Enable GitHub Pages in repository settings, set source to root directory
✅ **Spark Runtime**: Application automatically uses Spark KV for user data storage
✅ **Storage Layer**: Cloud API for user credentials with localStorage fallback
✅ **Web Crypto API**: All encryption/decryption uses standard Web Crypto API available in all modern browsers
✅ **Backend API**: Node.js/Express server deployed at releye.boestad.com/api
✅ **Database**: PostgreSQL for user data storage
✅ **SSL/HTTPS**: All API communication over HTTPS
✅ **CORS**: Configured to allow frontend domain
✅ **SPA Routing**: Single-page application with no client-side routing requirements
✅ **Meta Tags**: Open Graph tags configured with correct production URL
✅ **Jekyll Bypass**: `.nojekyll` file present to prevent GitHub Pages from processing files with underscores
✅ **Browser Compatibility**: Supports Chrome, Firefox, Safari, Edge (latest versions) - requires Web Crypto API and ES6 support
✅ **Robots.txt**: Configured for proper SEO crawling with sitemap reference

### Critical Production Components

1. **Spark KV Storage** (`src/lib/storage.ts`): Cloud-synced Spark KV adapter for credential storage (works across all browsers and devices)
2. **Storage Adapter Interface**: Unified `StorageAdapter` interface supporting get/set/delete/keys operations with health checks
3. **Error Boundaries**: React error boundary wraps entire app to catch and display runtime errors gracefully
4. **Initialization Sequence**: App → Storage Check → Load Credentials → First Time Setup OR Login → File Manager → Workspace View

**Experience Qualities**:
1. **Intuitive** - Direct manipulation feels natural; drag nodes, connect people, and organize groups with immediate visual feedback
2. **Powerful** - Advanced features like multi-select, grouping, zoom/pan, and bulk operations accessible without overwhelming the interface
3. **Secure** - Military-grade AES-256 encryption ensures all network data remains private and never leaves your computer

**Complexity Level**: Complex Application (advanced functionality, local encryption)
This is a full-featured network visualization tool with encrypted local file storage, persistent state, canvas manipulation, and sophisticated interaction patterns requiring careful state management and performance optimization. All operations run entirely client-side with no server communication.

### Data Persistence Architecture

RelEye uses a hybrid storage model that balances security and usability. **All functionality works correctly when deployed at releye.boestad.com.**

### User Credentials (Browser IndexedDB Storage)
- **Storage**: User credentials (username and password hash) are stored using browser-native IndexedDB, which persists data locally in the user's browser
- **Deployment Compatibility**: IndexedDB works identically in development and production on any modern browser - no external dependencies
- **Implementation**: Uses `IndexedDBAdapter` which wraps browser's native `indexedDB` API
- **Purpose**: Enables authentication without needing to re-enter credentials on every page load
- **Security**: Passwords are hashed using PBKDF2 with 210,000 iterations and SHA-256 before storage - never stored in plain text
- **Persistence**: Data persists across browser refreshes and sessions in the user's browser (per-origin storage)
- **Database**: `RelEyeStorage` IndexedDB database, `keyValue` object store
- **Key**: `user-credentials` in IndexedDB
- **Access Pattern**: 
  1. Write: `await storage.set('user-credentials', credentials)` 
  2. Read: `await storage.get('user-credentials')`
  3. Initialization: Database opens immediately on app mount (no timeout needed)
- **Deployment Verified**: IndexedDB operations work correctly on all deployed sites with proper error handling

### Workspace Data (Local Files)
- **Storage**: All relationship network data (persons, connections, groups) is stored in encrypted local files (.enc.releye)
- **Purpose**: Maximum privacy - workspace content never leaves your device
- **Security**: AES-256-GCM encryption with password-based key derivation (PBKDF2, 100,000 iterations)
- **Persistence**: Must be explicitly saved and loaded by the user via browser downloads
- **Format**: JSON-serialized workspace encrypted with user-provided password
- **Deployment Compatibility**: Uses browser's Web Crypto API (available in all modern browsers) and blob downloads

### User Management Data (Hybrid)
- **Storage**: Workspace user list (roles, permissions) is embedded in the encrypted workspace file
- **Purpose**: Each workspace tracks its own access control independently
- **Initialization**: When a workspace is created or first loaded, the current authenticated user is automatically added as admin if not present
- **Persistence**: Saved with workspace data when file is saved
- **Auto-injection**: WorkspaceView and FileManager automatically ensure the current authenticated user exists in workspace.users array with admin role

## Essential Features

### First-Time Setup & Authentication
- **Functionality**: Administrator account creation and password-based authentication
- **Purpose**: Secure access control without relying on external authentication providers
- **Trigger**: First app launch shows "Create Administrator Account" screen
- **Progression**: Enter username (min 3 chars) → Enter password (min 8 chars) → Confirm password → Account created and stored in spark.kv → User automatically logged in → Can now create/load workspaces
- **Success criteria**: 
  - First user to set up account becomes the admin
  - Credentials persist across browser refreshes
  - Password is hashed before storage (never stored in plain text)
  - Login screen appears on subsequent visits
  - Wrong credentials show clear error message
  - Admin tab appears in Settings after authentication

### Multi-User System (Simplified)
- **Functionality**: Administrator-controlled user invitations with role-based application access
- **Purpose**: Allow administrators to grant access to the application while keeping each user's network files completely independent
- **Trigger**: Admin opens Settings → Admin tab → Clicks "Invite User"
- **Progression**: Enter name and email → Select role (Admin/Editor/Viewer) → Generate invitation → Send email with link → User clicks link → Creates password → Account active → User creates their own network files
- **Success criteria**:
  - Admin can invite users via email with custom roles
  - Each user gets their own independent workspace with local file storage
  - Users create and manage their own encrypted .enc.releye files
  - No workspace or file sharing between users
  - Pending invitations are tracked and can be revoked
  - Invitations expire after 7 days
  - Simple, clear invitation email that explains the process
- **Trigger**: Admin clicks Settings → Admin tab → Open Admin Dashboard button
- **Progression**: Admin Dashboard opens → Invite user (username, optional email, role) → System generates secure invite link → Admin shares link via email or other means → Invited user clicks link → User creates account (username + password) → User gains access based on assigned role → User can now load the shared workspace file
- **Success criteria**: 
  - First user to set up the application becomes admin automatically
  - When workspace is created/loaded, current user is added to workspace.users as admin if not already present
  - Admins can add/remove users, change roles, suspend accounts
  - Editors can create/edit/delete content but not manage users (future feature)
  - Viewers can only view and export (future feature)
  - User list stored in workspace file (encrypted with workspace data)
  - Activity log tracks all user actions with timestamps
  - Invite links expire after 7 days
  - Each user's permissions stored in workspace.users array
  - Dashboard shows user stats, activity history, and role distribution

### Admin Dashboard
- **Functionality**: Comprehensive administration interface for workspace management
- **Purpose**: Centralized control panel for user management, activity monitoring, and workspace settings
- **Trigger**: Admin-only "Admin" tab in Settings dialog → "Open Admin Dashboard" button
- **Progression**: Open Settings → Click Admin tab → Click "Open Admin Dashboard" → Full-screen dashboard → Three tabs (Users, Activity, Stats) → Manage users with role changes, suspensions, deletions → View activity log with filters → Monitor workspace statistics
- **Success criteria**: Only visible to users with admin role in workspace.users array; displays user list with avatars (if available), roles, status badges; search/filter functionality; inline role changes; copy invite links for pending users; activity log with filtering by user/type/date; statistics cards showing user distribution and activity metrics



### Encrypted File Management
- **Functionality**: Create and load encrypted network database files with password protection
- **Purpose**: Ensure data privacy and security - all data stays on the user's computer, never transmitted online
- **Trigger**: App launch shows "New Network" or "Load Network" options
- **Progression**: New Network → Enter filename and password → See security warning about password loss → Empty encrypted file created and downloaded → Workspace opens | Load Network → Select .enc.releye file → Enter password → Workspace loads with data
- **Success criteria**: Files are encrypted with AES-256-GCM using PBKDF2 (100,000 iterations) for key derivation; wrong password fails gracefully with clear error message; file can be saved/loaded across sessions; user sees security warnings about zero-knowledge architecture; all files use the .enc.releye extension

### Save Network
- **Functionality**: Save current network state to encrypted file with automatic download
- **Purpose**: Persist work and create backups with full encryption
- **Trigger**: Click "Save Network" button in toolbar (or Ctrl+S)
- **Progression**: Click Save → File is encrypted in browser → Browser automatically downloads .enc.releye file to Downloads folder → Confirmation toast appears → Unsaved changes indicator clears
- **Success criteria**: File contains all persons, connections, groups, and settings in encrypted format; can be re-loaded with correct password; download works across all major browsers (Chrome, Firefox, Safari, Edge) without requiring right-click; user receives clear confirmation when file is saved

### File Download Mechanism
- **Browser Compatibility**: All major browsers support programmatic file downloads via blob URLs and the HTML5 download attribute
- **User Experience**: Single left-click triggers immediate download to default Downloads folder
- **Fallback Option**: If browser blocks automatic download, user can right-click "Save link as..."
- **Clear Messaging**: Tooltips and dialogs explain download location and process
- **Unsaved Changes Dialog**: When user tries to create new network or load different file, dialog offers "Save & Continue" button that triggers download and automatically continues after successful save

### Windows File Icon Setup
- **Functionality**: Provide custom icon for .enc.releye files in Windows File Explorer with automated setup tools
- **Purpose**: Make encrypted network files visually identifiable in Windows, improving file management and brand recognition
- **Trigger**: User navigates to Settings → About tab → Windows File Icon section
- **Progression**: Download icon file (.ico) → Download setup script (.bat) → Run script as administrator → Enter icon file path → Windows Explorer restarts → All .enc.releye files show RelEye icon
- **Success criteria**: Icon file generated at multiple resolutions (16x16, 32x32, 48x48, 256x256) embedded in .ico format; setup script creates registry entries for file association; comprehensive documentation provided; icon features eye design with lock badge to communicate security; falls back gracefully on browsers that don't support canvas-to-PNG conversion

### Interactive Canvas with Pan/Zoom
- **Functionality**: Infinite canvas with mouse/touch pan and zoom controls
- **Purpose**: Navigate large networks comfortably and focus on specific areas
- **Trigger**: Mouse wheel scroll (zoom), middle-click drag or two-finger pan
- **Progression**: User scrolls → Canvas zooms around cursor → Node positions update
- **Success criteria**: Smooth 60fps pan/zoom with 100+ nodes; "Zoom to Fit" centers all nodes in view

### Person Nodes
- **Functionality**: Visual cards showing person details (photo, name, position, score) with draggable positioning
- **Purpose**: Represent individuals in the network with rich metadata
- **Trigger**: Click "Add Person" button or click existing node
- **Progression**: Add Person → Fill form (name, position, photo, score, color) → Node appears on canvas → Drag to position → Auto-save
- **Success criteria**: Nodes display all fields, drag smoothly, persist position, and support frame colors (red/green/orange/white)

### Connections
- **Functionality**: Visual edges linking related persons, updating live as nodes move
- **Purpose**: Show relationships and hierarchies in the network
- **Trigger**: Click "Connect Mode" → Click source node → Click target node
- **Progression**: Enable connect mode → Select first person → Line follows cursor → Click second person → Edge created → Mode exits
- **Success criteria**: Edges render smoothly, update during drag, and can be deleted

### Groups (Visual Containers)
- **Functionality**: Colored background regions that organize related nodes
- **Purpose**: Visually cluster related people (teams, departments, etc.)
- **Trigger**: Click "Add Group" button
- **Progression**: Add Group → Name group and choose color → Resize/position frame → Drag nodes into group → Moving group moves members
- **Success criteria**: Groups show behind nodes, support 10 preset colors, and maintain member positions when moved

### Multi-Select & Bulk Operations
- **Functionality**: Select multiple nodes via marquee or Shift-click; apply changes to all
- **Purpose**: Efficiently manage large networks
- **Trigger**: Click-drag on empty canvas (marquee) or Shift-click nodes
- **Progression**: Start selection → Draw rectangle → Nodes inside highlight → Apply bulk action (color, score, group, delete)
- **Success criteria**: Marquee selection works smoothly; bulk color/score/group assignment updates all selected nodes

### List View with Sort/Filter
- **Functionality**: Side panel listing all persons with sorting and filtering options
- **Purpose**: Quick navigation and organization of large networks
- **Trigger**: Toggle list panel open
- **Progression**: Open list → Choose sort (name, position, score, created) → Apply filter (group, color, score) → Click person → Canvas pans to node
- **Success criteria**: Sort/filter updates instantly; clicking list item focuses canvas on that person

### Network Layout Algorithms
- **Functionality**: Four automatic layout tools to organize person nodes intelligently
- **Purpose**: Quickly arrange large networks to minimize overlap and optimize visual clarity
- **Trigger**: Click layout buttons in toolbar: Organize by Importance, Minimize Overlap, Tighten Network, or Smart Arrange
- **Progression**: 
  - **Organize by Importance** → Persons arranged in concentric rings (score 1 at center → score 5 at outer edge)
  - **Minimize Overlap** → Positions persons close to their connections while eliminating card overlap
  - **Tighten Network** → Reduces spacing between cards while preserving relative positions
  - **Smart Arrange (Recommended)** → Combines importance-based rings with connection optimization
- **Success criteria**: All layouts ensure zero overlap between person cards; connections are visually clean; layouts complete within 1 second for 100+ person networks; undo restores previous positions

### Advanced Search and Filtering
- **Functionality**: Real-time fuzzy search with multi-criteria filtering (score range, position, group, frame color, advocate status) and visual highlighting of matches
- **Purpose**: Quickly locate and focus on specific persons within large networks
- **Trigger**: Type in search bar or open filter dropdown
- **Progression**: Enter search query → Results highlight in real-time → Matching persons glow green and scale up → Non-matching persons fade out → Clear search to restore full view
- **Success criteria**: Fuzzy search matches partial names and positions; filters combine using AND logic; highlighted persons remain interactive; search updates within 100ms of typing

### Search History
- **Functionality**: Dropdown showing last 10 search queries with criteria labels and timestamps
- **Purpose**: Quickly re-apply complex filters without re-configuring
- **Trigger**: Click history icon next to search bar
- **Progression**: Click history → See list of recent searches → Select search → Criteria auto-populated and applied → Results highlight on canvas
- **Success criteria**: History persists between sessions; shows human-readable labels (e.g., "score: 3-5 • advocates only"); clicking item instantly applies search; individual items can be deleted

### Shortest Path Finder
- **Functionality**: Find and highlight the shortest connection path between any two selected persons
- **Purpose**: Understand relationship chains and identify key connectors in network
- **Trigger**: Select exactly 2 persons → Click path finder button
- **Progression**: Select person A → Shift-click person B → Click path icon → BFS algorithm calculates shortest path → All persons in path highlight → Toast shows path length
- **Success criteria**: Uses breadth-first search for optimal path; handles disconnected persons gracefully with "No path found" message; highlights entire path chain; works on networks with 200+ persons/connections

### Legacy Import/Export
- **Functionality**: Import unencrypted JSON workspace files from Settings dialog
- **Purpose**: Migrate from older versions or share data in unencrypted format if needed
- **Trigger**: Click Import in Settings
- **Progression**: Import → Select JSON file → Parse and restore workspace → All data loaded
- **Success criteria**: Unencrypted JSON import works for backward compatibility; users are reminded to save as encrypted file

## Edge Case Handling

- **No Search Results**: Show informative toast when no persons match search criteria; allow user to adjust filters
- **Disconnected Network for Path Finding**: Show "No path found" message when selected persons are in separate network components
- **Search on Empty Network**: Search bar disabled or shows "No persons to search" when workspace is empty
- **Orphaned Connections**: When a person is deleted, all their connections are automatically removed
- **Wrong Password**: Show clear error message when decryption fails; allow retry without losing file selection
- **Missing Photos**: Display default avatar icon with person's initials
- **Overlapping Nodes**: Z-index based on selection state; selected nodes appear on top
- **Large Networks**: Canvas virtualization and edge batching for 200+ nodes
- **Lost Password**: No password recovery possible - encryption keys are derived from password only; user must remember password or lose access to file
- **File Corruption**: Validate JSON structure before attempting decryption; show helpful error messages
- **Browser Compatibility**: Web Crypto API required; gracefully detect and warn on unsupported browsers

## Design Direction

The design follows the **AetherLink UI System** - a dark, modern design system for relationship network visualization that feels sleek, tech-oriented, and trustworthy. It balances analytical precision with emotional warmth through cool tones, glowing blues and purples on dark graphite backgrounds, with smooth gradients and subtle motion for hover states. The interface should communicate security and professionalism while remaining approachable, using glassmorphism subtly in overlays and cyan-tinted glows for depth.

## Color Selection

**AetherLink Color System** with cool tones creating a tech-oriented, trustworthy aesthetic that balances analytical precision with warmth.

- **Primary Color**: Muted Cyan-Blue `oklch(0.658 0.096 196)` / #45A29E — Primary actions and highlights; represents stability and trust
- **Secondary Colors**: 
  - Charcoal Gray-Blue `oklch(0.204 0.019 228)` / #1F2833 for panels and cards
  - Deep Black `oklch(0.078 0.013 240)` / #0B0C10 for main background with soft blue tint
  - Neutral Slate `oklch(0.315 0.030 228)` / #2E3B4E for surfaces and containers
- **Accent Color**: Bright Glowing Cyan `oklch(0.788 0.106 192)` / #66FCF1 — Hover/active states and connection highlights
- **Accent Purple**: `oklch(0.542 0.150 286)` / #8B5CF6 — Node highlights and visualization vibrancy
- **Success Green**: `oklch(0.788 0.106 154)` / #00FFB3 — Positive states
- **Error Red**: `oklch(0.627 0.221 14)` / #FF3C64 — Alerts and warnings
- **Foreground/Background Pairings**:
  - Background (Deep Black #0B0C10): White text (#FFFFFF) - Ratio 21:1 ✓
  - Card (Charcoal #1F2833): White text (#FFFFFF) - Ratio 14.8:1 ✓
  - Primary (Cyan-Blue #45A29E): Deep Black text (#0B0C10) - Ratio 8.2:1 ✓
  - Secondary (Slate #2E3B4E): White text (#FFFFFF) - Ratio 9.5:1 ✓
  - Accent (Bright Cyan #66FCF1): Deep Black text (#0B0C10) - Ratio 12.5:1 ✓
  - Text Secondary: Cool Gray (#C5C6C7) on backgrounds - Ratio 11.2:1 ✓

## Font Selection

**Poppins** for titles (geometric, futuristic), **Inter** for UI text (clean, legible), and **IBM Plex Mono** for data values (technical precision).

- **Typographic Hierarchy**:
  - Title / App Name: Poppins Bold / 32-40px / -0.02em letter-spacing
  - Section Heading: Inter SemiBold / 24px / -0.01em
  - H3 (Node Names): Inter SemiBold / 16px / 0em
  - Body Text: Inter Regular / 16px / 0em / 1.5 line-height
  - Small / Label: Inter Medium / 13px / 0.01em
  - Data Values: IBM Plex Mono Medium / 14px / 0em

## Animations

Animations follow AetherLink motion principles: smooth transitions with ease-in-out 0.2-0.3s, subtle glows and 2px lifts on hover, and physics-based spatial motion that reinforces relationships.

- **Purposeful Meaning**: 
  - Hover states softly glow (cyan-tinted shadow: `0 0 10px rgba(102,252,241,0.3)`) or shift up by 2px
  - Network graph edges animate slightly on hover or update
  - Dialogs slide in with fade from bottom (opacity 0 → 1, Y +10px → 0)
  - Use spring physics for node dragging, linear easing for zoom, gentle ease-out for panels
- **Hierarchy of Movement**:
  1. **Critical**: Node drag (instant, 0ms), zoom (150ms linear), pan (200ms ease-out)
  2. **Feedback**: Selection state (100ms), hover highlights (80ms, glow effect), button presses (120ms with scale)
  3. **Delight**: Panel open/close (250ms), connection draw (300ms), score badge pop (180ms)

## Component Selection

- **Components**: 
  - Dialog (add/edit person modal with slide-in fade animation)
  - Card (node representation with gradient backgrounds from #1F2833 → #0B0C10)
  - Button (Primary: bg #45A29E text #0B0C10 hover #66FCF1, Secondary: outline border #45A29E, 6px radius)
  - Input (bg #1F2833, border 1px solid #2E3B4E, focus glow border #66FCF1, placeholder #707070)
  - Label, Select (form fields)
  - Popover (context menus)
  - Separator (divide toolbar sections)
  - Badge (score display)
  - Avatar (person photos with fallback)
  - Sheet (side panel with #0B0C10 background)
  - Scroll Area (list panel content)
  - Tooltip (toolbar hints)
  - Sonner (toast notifications)

- **Customizations**:
  - Custom Canvas component using HTML5 Canvas for edge rendering (semi-transparent blue edges: `rgba(102,252,241,0.4)`)
  - Custom DraggableNode component with gradient card backgrounds
  - Custom GroupFrame component with resize handles
  - Custom Minimap component
  - Custom ColorPicker for frame and group colors
  - Graph nodes use accent colors: User (#66FCF1), Organization (#8B5CF6), Team (#45A29E)
  - Hover glow effect using outer ring highlight on nodes

- **States**:
  - Buttons: default / hover (glow shadow `0 0 10px rgba(102,252,241,0.3)`, shift up 2px) / active / disabled
  - Inputs: default / focus (glow border #66FCF1)
  - Nodes: default / hover (cyan glow) / selected (accent border + glow) / dragging (elevation + opacity 0.95)
  - Edges: semi-transparent blue (rgba(102,252,241,0.4)) / hover (bright cyan) / selected (accent + thicker)
  - Navigation: active link highlight bar #66FCF1, icons white with blue hover tint

- **Icon Selection**:
  - FilePlus (new network)
  - FloppyDisk (save network)
  - FolderOpen (load network)
  - Plus (add person/group)
  - Link (connection mode)
  - MagnifyingGlassPlus/Minus (zoom in/out)
  - ArrowsOut (zoom to fit)
  - TreeStructure (auto arrange)
  - Target (arrange by score)
  - GridFour (toggle grid)
  - List (toggle list panel)
  - Gear (settings)
  - Upload (import unencrypted)
  - Trash (delete)
  - DotsThree (context menu)

- **Spacing**:
  - Base unit: 8px (8, 16, 24, 32, 48)
  - Toolbar padding: p-2
  - Node card padding: p-3 (16-24px per AetherLink spec)
  - Panel padding: p-4
  - Button spacing: gap-2
  - Node gap from edges: 12px minimum
  - Grid snapping: 20px intervals
  - Rounded corners: 6px (AetherLink standard)

- **Mobile**:
  - Hide minimap on screens < 1024px
  - Collapse list panel to drawer on < 768px
  - Stack toolbar buttons vertically on < 640px
  - Touch-optimized drag handles (44px minimum)
  - Pinch-to-zoom on touch devices
  - Single-tap select, long-press for context menu
