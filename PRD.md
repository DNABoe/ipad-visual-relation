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
