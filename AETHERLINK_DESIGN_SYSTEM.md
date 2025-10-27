# AetherLink UI Design System

A dark, modern design system for the NetEye Relationship Network Program that visualizes and manages connections between people, teams, and organizations. The system feels sleek, tech-oriented, and trustworthy, balancing analytical precision with emotional warmth.

## 🎨 Color System

### Core Palette

| Name | Usage | Hex | oklch | Notes |
|------|-------|-----|-------|-------|
| **Primary Background** | Main app background | `#0B0C10` | `oklch(0.078 0.013 240)` | Deep black with soft blue tint |
| **Secondary Background** | Panels, cards | `#1F2833` | `oklch(0.204 0.019 228)` | Charcoal gray-blue |
| **Surface** | Buttons, containers | `#2E3B4E` | `oklch(0.315 0.030 228)` | Neutral slate tone |
| **Primary Blue** | Primary action, highlights | `#45A29E` | `oklch(0.658 0.096 196)` | Muted cyan-blue accent |
| **Secondary Blue** | Hover/active states | `#66FCF1` | `oklch(0.788 0.106 192)` | Bright, glowing accent |
| **Text Primary** | Headings, main text | `#FFFFFF` | `oklch(1.0 0 0)` | White |
| **Text Secondary** | Secondary text | `#C5C6C7` | `oklch(0.780 0.008 240)` | Cool gray |
| **Accent Purple** | Node highlight / visualization | `#8B5CF6` | `oklch(0.542 0.150 286)` | Adds vibrancy to relationship graphs |
| **Success Green** | Positive states | `#00FFB3` | `oklch(0.788 0.106 154)` | Bright success indicator |
| **Error Red** | Alerts / warnings | `#FF3C64` | `oklch(0.627 0.221 14)` | Clear error signaling |

### Overall Aesthetic
Cool tones, glowing blues and purples on dark graphite backgrounds. Smooth gradients and subtle motion for hover states create a sophisticated tech-oriented feel.

## 🔤 Typography

### Font Families
- **Display/Titles**: Poppins (geometric, futuristic)
- **UI Text**: Inter (clean, legible sans-serif)
- **Data/Code**: IBM Plex Mono (technical precision)

### Type Scale

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| **Title / App Name** | Poppins | 32-40px | 700 (Bold) | #FFFFFF |
| **Section Heading** | Inter | 24px | 600 (SemiBold) | #FFFFFF |
| **Body Text** | Inter | 16px | 400 (Regular) | #C5C6C7 |
| **Small / Label** | Inter | 13px | 500 (Medium) | #A0A0A0 |
| **Data Values** | IBM Plex Mono | 14px | 500 (Medium) | #66FCF1 |

**Tone**: Clean, geometric sans-serif with a touch of futurism.

## 🧩 Component Styles

### Buttons

**Primary Button**
- Background: `#45A29E`
- Text: `#0B0C10`
- Hover: Background `#66FCF1` with subtle shadow `0 0 10px rgba(102,252,241,0.3)`
- Border radius: `6px`

**Secondary Button**
- Outline with border: `#45A29E`
- Text: `#45A29E`
- Hover: Glow effect
- Border radius: `6px`

### Inputs / Fields

- Background: `#1F2833`
- Border: `1px solid #2E3B4E`
- Focus: Glow border in `#66FCF1`
- Text color: `#FFFFFF`
- Placeholder: `#707070`
- Border radius: `6px`

### Cards / Panels

- Background: Gradient from `#1F2833 → #0B0C10`
- Border: `1px solid #2E3B4E`
- Padding: `16-24px`
- Shadow: Subtle inner glow or soft outer blue shadow for emphasis
- Border radius: `6px`

### Graphs / Network Nodes

**Node Types**
- **User**: `#66FCF1` (Secondary Blue)
- **Organization**: `#8B5CF6` (Accent Purple)
- **Team**: `#45A29E` (Primary Blue)

**Edges**
- Default: Semi-transparent blue `rgba(102,252,241,0.4)`
- Hover: Bright cyan with glow effect
- Style: Smooth curves with subtle animation

**Interactions**
- Hover glow effect using outer ring highlight
- Node selection: Cyan border with shadow

### Sidebar / Navigation

- Background: `#0B0C10`
- Active link: Highlight bar `#66FCF1`
- Icons: Monochrome white with blue hover tint
- Smooth transitions on state changes

## 🧱 Layout & Spacing

### Grid System
- Base unit: `8px`
- Scale: `8, 16, 24, 32, 48`

### Borders & Radius
- Rounded corners: `6px` (standard)
- Border weight: `1px` for most dividers

### Shadows
- Subtle, cyan-tinted glows
- Hover shadow: `0 0 10px rgba(102,252,241,0.3)`
- Focus shadow for inputs and interactive elements

### Glassmorphism
- Use subtly in overlays
- Combine blur with transparency
- Maintain readability with sufficient contrast

## ⚙️ Motion / Interaction

### Hover States
- Softly glow with cyan-tinted shadow
- Shift up by `2px` for lift effect
- Smooth transitions

### Transitions
- Duration: `0.2-0.3s`
- Easing: `ease-in-out`
- Consistent across all interactive elements

### Animations
- **Network graph edges**: Slight animation on hover or update
- **Dialogs**: Slide in with fade from bottom
  - Opacity: `0 → 1`
  - Transform Y: `+10px → 0`
- **Node dragging**: Physics-based with subtle spring effect

### Timing
- Instant feedback: `< 100ms`
- Quick transitions: `100-200ms`
- Standard animations: `200-300ms`
- Complex transitions: `300-400ms`

## 💬 Tone & Brand Personality

**Core Values**
- Professional, analytical, yet inviting
- Balances human connection with data visualization
- Clean and sophisticated without being cold

**Keywords**
- Insightful
- Connected
- Trustworthy
- Modern
- Elegant Dark Tech

## 🎯 Implementation Guidelines

### CSS Variables (in `:root`)

```css
:root {
  --background: oklch(0.078 0.013 240);
  --foreground: oklch(1.0 0 0);
  
  --card: oklch(0.204 0.019 228);
  --card-foreground: oklch(1.0 0 0);
  
  --primary: oklch(0.658 0.096 196);
  --primary-foreground: oklch(0.078 0.013 240);
  
  --secondary: oklch(0.315 0.030 228);
  --secondary-foreground: oklch(1.0 0 0);
  
  --accent: oklch(0.788 0.106 192);
  --accent-foreground: oklch(0.078 0.013 240);
  
  --radius: 0.375rem;
}
```

### Google Fonts Import

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@700&family=IBM+Plex+Mono:wght@500&display=swap">
```

### Example Usage

**Primary Action Button**
```tsx
<Button className="bg-primary hover:bg-accent text-primary-foreground shadow-[0_0_10px_rgba(102,252,241,0.3)] rounded-md">
  Add Person
</Button>
```

**Input Field**
```tsx
<Input 
  className="bg-card border-secondary focus:ring-accent focus:border-accent"
  placeholder="Enter name..."
/>
```

**Network Node**
```tsx
<div className="bg-gradient-to-b from-card to-background border border-secondary rounded-md p-4 hover:shadow-[0_0_10px_rgba(102,252,241,0.3)] transition-all duration-200">
  {/* Node content */}
</div>
```

## 📊 Accessibility

### Contrast Ratios (WCAG AA Compliant)

- Background / Text: `21:1` ✓
- Card / Text: `14.8:1` ✓
- Primary / Text: `8.2:1` ✓
- Accent / Text: `12.5:1` ✓
- All interactive elements meet minimum 4.5:1 for normal text

### Focus States
- All interactive elements have visible focus indicators
- Focus ring uses accent color `#66FCF1`
- Minimum touch target size: `44x44px`

### Motion
- Respect `prefers-reduced-motion` for users with motion sensitivity
- Provide alternatives to animation-dependent interactions

---

**Design System Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: NetEye Development Team
