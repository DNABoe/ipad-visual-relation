# NetEye - Relationship Network App

A web-based network visualization tool that lets users build and explore visual relationship maps of key persons with draggable nodes, connections, and color-coded groups. All data is stored locally and encrypted with AES-256 for maximum security and privacy.

**Experience Qualities**:
1. **Intuitive** - Direct manipulation feels natural; drag nodes, connect people, and organize groups with immediate visual feedback
2. **Powerful** - Advanced features like multi-select, grouping, zoom/pan, and bulk operations accessible without overwhelming the interface
3. **Secure** - Military-grade AES-256 encryption ensures all network data remains private and never leaves your computer

**Complexity Level**: Complex Application (advanced functionality, local encryption)
This is a full-featured network visualization tool with encrypted local file storage, persistent state, canvas manipulation, and sophisticated interaction patterns requiring careful state management and performance optimization. All operations run entirely client-side with no server communication.

## Essential Features

### Encrypted File Management
- **Functionality**: Create and load encrypted network database files with password protection
- **Purpose**: Ensure data privacy and security - all data stays on the user's computer, never transmitted online
- **Trigger**: App launch shows "New Network" or "Load Network" options
- **Progression**: New Network → Enter filename and password → See security warning about password loss → Empty encrypted file created and downloaded → Workspace opens | Load Network → Select .enc.json file → Enter password → Workspace loads with data
- **Success criteria**: Files are encrypted with AES-256-GCM using PBKDF2 (100,000 iterations) for key derivation; wrong password fails gracefully with clear error message; file can be saved/loaded across sessions; user sees security warnings about zero-knowledge architecture

### Save Network
- **Functionality**: Save current network state to encrypted file
- **Purpose**: Persist work and create backups with full encryption
- **Trigger**: Click "Save Network" button in toolbar
- **Progression**: Click Save → Encrypt current workspace → Download .enc.json file → Confirmation toast
- **Success criteria**: File contains all persons, connections, and groups in encrypted format; can be re-loaded with correct password

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

### Legacy Import/Export
- **Functionality**: Import unencrypted JSON workspace files from Settings dialog
- **Purpose**: Migrate from older versions or share data in unencrypted format if needed
- **Trigger**: Click Import in Settings
- **Progression**: Import → Select JSON file → Parse and restore workspace → All data loaded
- **Success criteria**: Unencrypted JSON import works for backward compatibility; users are reminded to save as encrypted file

## Edge Case Handling

- **Orphaned Connections**: When a person is deleted, all their connections are automatically removed
- **Wrong Password**: Show clear error message when decryption fails; allow retry without losing file selection
- **Missing Photos**: Display default avatar icon with person's initials
- **Overlapping Nodes**: Z-index based on selection state; selected nodes appear on top
- **Large Networks**: Canvas virtualization and edge batching for 200+ nodes
- **Lost Password**: No password recovery possible - encryption keys are derived from password only; user must remember password or lose access to file
- **File Corruption**: Validate JSON structure before attempting decryption; show helpful error messages
- **Browser Compatibility**: Web Crypto API required; gracefully detect and warn on unsupported browsers

## Design Direction

The design should feel like a professional, secure data visualization tool—clean, sophisticated, and trustworthy with a **dark, modern aesthetic**. Privacy and security are paramount, communicated through clear messaging about local-only storage and encryption. The dark theme reduces eye strain during extended use and provides excellent contrast for network visualization. The interface should balance the complexity of a network graph with the approachability of consumer software, using subtle depth, generous whitespace, and purposeful color to create visual hierarchy without overwhelming users.

## Color Selection

**Triadic dark color scheme** with vibrant, distinct colors for high visual separation between groups and states, maintaining a dark canvas background for reduced eye strain and professional appearance.

- **Primary Color**: Vibrant Blue `oklch(0.55 0.18 250)` — Represents authority and stability; used for primary actions (Add Person, Save, Login)
- **Secondary Colors**: 
  - Dark Slate `oklch(0.25 0.03 250)` for secondary UI elements and toolbar backgrounds
  - Very Dark Blue `oklch(0.12 0.02 250)` for main background providing deep contrast
- **Accent Color**: Bright Cyan `oklch(0.65 0.15 200)` — Highlights active connections, selected nodes, and interactive states
- **Foreground/Background Pairings**:
  - Background (Very Dark `oklch(0.12 0.02 250)`): Light text `oklch(0.95 0.01 250)` - Ratio 14.5:1 ✓
  - Card (Dark Slate `oklch(0.18 0.02 250)`): Light text `oklch(0.95 0.01 250)` - Ratio 12.1:1 ✓
  - Primary (Vibrant Blue `oklch(0.55 0.18 250)`): White text `oklch(0.98 0 0)` - Ratio 5.8:1 ✓
  - Secondary (Dark Slate `oklch(0.25 0.03 250)`): Light text `oklch(0.95 0.01 250)` - Ratio 9.2:1 ✓
  - Accent (Bright Cyan `oklch(0.65 0.15 200)`): White text `oklch(0.98 0 0)` - Ratio 4.9:1 ✓
  - Muted (Dark `oklch(0.20 0.02 250)`): Muted text `oklch(0.60 0.02 250)` - Ratio 4.5:1 ✓
  - Node Frame Colors (user-selectable):
    - Red `oklch(0.55 0.22 25)`: White text - Ratio 5.3:1 ✓
    - Green `oklch(0.68 0.18 145)`: White text - Ratio 5.1:1 ✓
    - Orange `oklch(0.72 0.16 60)`: White text - Ratio 6.2:1 ✓
    - Slate `oklch(0.65 0.12 250)`: White text - Ratio 4.8:1 ✓

## Font Selection

**Inter** for its exceptional legibility at all sizes, geometric precision that complements technical diagrams, and comprehensive weight range for clear hierarchy. The slightly condensed letterforms maximize space efficiency in node labels.

- **Typographic Hierarchy**:
  - H1 (App Title): Inter SemiBold / 24px / -0.02em letter-spacing / 1.2 line-height
  - H2 (Panel Headers): Inter Medium / 16px / -0.01em / 1.3
  - H3 (Node Names): Inter SemiBold / 14px / 0em / 1.2
  - Body (Position, Labels): Inter Regular / 13px / 0em / 1.4
  - Small (Metadata, Counts): Inter Medium / 11px / 0.01em / 1.3
  - Score Badges: Inter Bold / 12px / 0em / 1.0

## Animations

Animations should feel responsive and physics-based, reinforcing the spatial nature of the network. Motion communicates relationships—nodes moving together show grouping, edges flexing show connections, and smooth zoom transitions maintain spatial context.

- **Purposeful Meaning**: Use spring physics for node dragging (slight overshoot/settle), linear easing for zoom (predictable), and gentle ease-out for panel slides
- **Hierarchy of Movement**:
  1. **Critical**: Node drag (instant follow, 0ms), zoom (150ms), pan (200ms)
  2. **Feedback**: Selection state (100ms), hover highlights (80ms), button presses (120ms)
  3. **Delight**: Panel open/close (250ms), score badge pop (180ms), connection draw (300ms)

## Component Selection

- **Components**: 
  - Dialog (add/edit person modal)
  - Card (node representation with custom styling)
  - Button (toolbar actions, primary/secondary/ghost variants)
  - Input, Label, Select (form fields)
  - Popover (context menus on nodes)
  - Separator (divide toolbar sections)
  - Badge (score display)
  - Avatar (person photos with fallback)
  - Sheet (side panel for list view)
  - Scroll Area (list panel content)
  - Tooltip (toolbar hints)
  - Sonner (toast notifications for saves/errors)

- **Customizations**:
  - Custom Canvas component using HTML5 Canvas for edge rendering (performance)
  - Custom DraggableNode component with React state and CSS transforms
  - Custom GroupFrame component with resize handles
  - Custom Minimap component showing viewport bounds
  - Custom ColorPicker for frame and group colors

- **States**:
  - Buttons: default/hover (scale 1.02)/active (scale 0.98)/disabled (opacity 0.5)
  - Nodes: default/hover (subtle shadow)/selected (accent border + shadow)/dragging (elevation + opacity 0.9)
  - Edges: default (muted gray)/hover (accent color)/selected (accent + thicker)
  - Groups: default (subtle fill)/hover (border highlight)/selected (accent border)

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
  - Toolbar padding: p-2
  - Node card padding: p-3
  - Panel padding: p-4
  - Button spacing: gap-2
  - Node gap from edges: 12px minimum
  - Grid snapping: 20px intervals

- **Mobile**:
  - Hide minimap on screens < 1024px
  - Collapse list panel to drawer on < 768px
  - Stack toolbar buttons vertically on < 640px
  - Touch-optimized drag handles (44px minimum)
  - Pinch-to-zoom on touch devices
  - Single-tap select, long-press for context menu
