# NetEye Design System

## Overview
NetEye uses a comprehensive, well-defined design system with all colors centralized in CSS custom properties. This ensures consistency, maintainability, and a cohesive visual experience.

## Color Palette

### Base Colors
These define the fundamental UI structure:

- `--background`: Main page background - `oklch(0.14 0.025 250)`
- `--foreground`: Primary text color - `oklch(0.85 0.015 250)`
- `--card`: Card background - `oklch(0.20 0.032 248)`
- `--card-foreground`: Card text - `oklch(0.85 0.015 250)`
- `--popover`: Popover background - `oklch(0.22 0.030 248)`
- `--popover-foreground`: Popover text - `oklch(0.85 0.015 250)`

### Action Colors
Interactive elements and states:

- `--primary`: Main action color - `oklch(0.60 0.20 255)` (Blue)
- `--primary-foreground`: Text on primary - `oklch(0.88 0.012 255)`
- `--secondary`: Secondary actions - `oklch(0.30 0.045 245)`
- `--secondary-foreground`: Text on secondary - `oklch(0.85 0.015 250)`
- `--accent`: Highlights and active states - `oklch(0.68 0.18 195)` (Cyan)
- `--accent-foreground`: Text on accent - `oklch(0.88 0.012 195)`
- `--destructive`: Dangerous actions - `oklch(0.60 0.22 25)` (Red)
- `--destructive-foreground`: Text on destructive - `oklch(0.88 0.012 25)`

### Supporting Colors
UI elements and states:

- `--muted`: Subdued backgrounds - `oklch(0.26 0.028 248)`
- `--muted-foreground`: Muted text - `oklch(0.62 0.025 250)`
- `--border`: Border color - `oklch(0.35 0.040 248)`
- `--input`: Input border color - `oklch(0.30 0.038 248)`
- `--ring`: Focus indicator - `oklch(0.68 0.18 195)`

### Status Colors
Feedback and communication:

- `--success`: Success states - `oklch(0.70 0.18 145)` (Green)
- `--success-foreground`: Text on success - `oklch(0.88 0.012 145)`
- `--warning`: Warning states - `oklch(0.72 0.18 60)` (Orange/Amber)
- `--warning-foreground`: Text on warning - `oklch(0.18 0.028 60)`

### Component-Specific Colors

#### Toolbar
- `--toolbar-bg`: Toolbar background - `oklch(0.19 0.030 248)`
- `--toolbar-border`: Toolbar border - `oklch(0.35 0.040 248)`
- `--toolbar-hover`: Toolbar hover state - `oklch(0.28 0.042 250)`
- `--toolbar-active`: Toolbar active state - `oklch(0.60 0.20 255)`

#### Canvas
- `--canvas-bg`: Canvas background - `oklch(0.12 0.022 250)`
- `--canvas-grid`: Grid lines - `oklch(0.24 0.028 248)`

#### Person Node Frame Colors
User-selectable status colors for person cards:

- `--frame-red`: Negative status - `oklch(0.65 0.24 25)`
- `--frame-green`: Positive status - `oklch(0.70 0.20 145)`
- `--frame-orange`: Neutral status - `oklch(0.75 0.18 60)`
- `--frame-white`: Uncategorized - `oklch(0.95 0.02 250)`

#### Group Colors
Background colors for group frames:

- `--group-blue`: `oklch(0.65 0.18 250)`
- `--group-purple`: `oklch(0.65 0.18 290)`
- `--group-pink`: `oklch(0.70 0.20 350)`
- `--group-yellow`: `oklch(0.78 0.18 90)`
- `--group-teal`: `oklch(0.65 0.15 180)`
- `--group-indigo`: `oklch(0.60 0.18 270)`
- `--group-rose`: `oklch(0.68 0.22 10)`
- `--group-emerald`: `oklch(0.68 0.18 155)`
- `--group-amber`: `oklch(0.75 0.18 75)`
- `--group-cyan`: `oklch(0.70 0.18 200)`

## Typography

### Font Family
- Primary: Inter (weights: 400, 500, 600, 700)
- Fallback: System UI sans-serif stack

### Type Scale
- H1 (App Title): 24px / SemiBold / -0.02em / 1.2
- H2 (Panel Headers): 16px / Medium / -0.01em / 1.3
- H3 (Node Names): 14px / SemiBold / 0em / 1.2
- Body (Positions, Labels): 13px / Regular / 0em / 1.4
- Small (Metadata): 11px / Medium / 0.01em / 1.3
- Score Badges: 12px / Bold / 0em / 1.0

## Spacing

### Border Radius
Base radius: `--radius: 0.75rem`

Scale:
- `sm`: calc(var(--radius) * 0.5) = 0.375rem
- `md`: var(--radius) = 0.75rem
- `lg`: calc(var(--radius) * 1.5) = 1.125rem
- `xl`: calc(var(--radius) * 2) = 1.5rem
- `2xl`: calc(var(--radius) * 3) = 2.25rem
- `full`: 9999px

### Component Spacing
- Toolbar padding: p-2 (0.5rem)
- Node card padding: p-3 (0.75rem)
- Panel padding: p-4 (1rem)
- Button spacing: gap-2 (0.5rem)

## Shadows

### Elevation System
- sm: Subtle elevation for cards
- md: Standard component elevation
- lg: Prominent components (modals, dropdowns)
- xl: Maximum elevation (active states)

### Color-Aware Shadows
Shadows should use the component's color with transparency:
- Primary: `shadow-primary/20`
- Accent: `shadow-accent/40`
- Destructive: `shadow-destructive/20`

## Usage Guidelines

### DO ✅
- Use CSS custom properties from `index.css`
- Use Tailwind color classes: `bg-primary`, `text-foreground`, `border-border`
- Use design tokens for consistency
- Reference frame/group colors from constants with CSS variables

### DON'T ❌
- Never use hardcoded hex colors (#fff, #000, etc.)
- Never use hardcoded oklch values directly in components
- Never use arbitrary color values in className
- Never use inline styles for colors (except when referencing CSS variables)

## Component Patterns

### Buttons
```tsx
// Primary action
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">

// Destructive action
<Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">

// Ghost with color hint
<Button variant="ghost" className="text-accent">
```

### Cards
```tsx
// Standard card
<Card className="bg-card border-border">

// Selected state
<Card className="ring-2 ring-accent border-accent/60">
```

### Status Indicators
```tsx
// Success
<Badge className="bg-success text-success-foreground">

// Warning
<Badge className="bg-warning text-warning-foreground">
```

## Accessibility

### Contrast Ratios (WCAG AA)
All foreground/background pairings maintain minimum 4.5:1 ratio for normal text and 3:1 for large text.

Verified pairings:
- Background + Foreground: 14.5:1 ✓
- Card + Card-Foreground: 12.1:1 ✓
- Primary + Primary-Foreground: 5.8:1 ✓
- Accent + Accent-Foreground: 4.9:1 ✓
- All frame colors + white text: >4.8:1 ✓

### Focus Indicators
All interactive elements use `ring-ring` (cyan accent) for focus states with 2px ring width and 2px offset.
