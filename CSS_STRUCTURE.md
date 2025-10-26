# CSS Structure Documentation

## Overview
This document outlines the CSS file structure and ensures no conflicts exist in the dark color scheme implementation.

## CSS File Hierarchy

### 1. `/src/main.css` (DO NOT EDIT - Structural)
- **Purpose**: Structural CSS file managed by the runtime
- **Content**: `@import 'tailwindcss';`
  - Dark mode enforcement on html, body, #root

- **Status**: ✅ Correct - dark color sche
### 3. `/src/styles/theme.css` (Radix Colors)
- **Content**:
  - Defines contrast variabl


| Variable | V
| `--background` | `oklch(0.12 0.0
  - Dark mode enforcement on html, body, #root
  - CSS custom properties in `:root` for theme colors
  - `@theme` mapping for Tailwind
  - Application-specific utility classes (`.canvas-grid`, `.node-dragging`, `.selection-rect`)
- **Status**: ✅ Correct - dark color scheme consistent

### 3. `/src/styles/theme.css` (Radix Colors)
- **Purpose**: Imports Radix UI dark color palettes
- **Content**:
  - Imports 30+ Radix dark color schemes
  - Defines contrast variables for color accessibility
- **Status**: ✅ Fixed - cleaned up malformed imports and duplicates

## Dark Color Scheme Verification

### Color Variables (all dark-optimized)
| Variable | Value | Purpose |
|----------|-------|---------|
| `--background` | `oklch(0.12 0.02 250)` | Very dark blue-tinted background |
| `--foreground` | `oklch(0.95 0.01 250)` | Near-white text |
  color-scheme: dark;
```
### Root Element
#root {
  color: var(--foreground);
```
### JavaScript Enforcement
```typescript
  document.documentElement.setAttribute('data-appearance', 'dark')
```
## Conflicts Resolved
### ✅ Fixed Issues:

4. **Hard-coded co

- All color values a
- All Radix imports use `-dark.css` vari
- No competing style definitions
## Testing Checklist
- [x] All backgrounds use dark colors (lightnes

- [x] No light mode color definitions
- [x] CSS custom properties properly mapped to Tailwind



4. **All color




  color-scheme: dark;
}
```










### Root Element
```css
#root {
  background: var(--background);
  color: var(--foreground);
}
```

### JavaScript Enforcement
In `App.tsx`:
```typescript
useEffect(() => {
  document.documentElement.setAttribute('data-appearance', 'dark')
}, [])
```

## Conflicts Resolved

### ✅ Fixed Issues:
1. **Duplicate Tailwind imports** - Removed from theme.css, kept in main.css and index.css as needed
2. **Malformed Radix imports** - Fixed all incomplete `@import` statements in theme.css
3. **Duplicate content** - Removed duplicated contrast variables block
4. **Hard-coded colors** - Changed to use CSS variables in base layer
5. **Inconsistent dark mode** - Enforced `color-scheme: dark` everywhere

### ✅ No Conflicts Detected:
- All color values are dark-optimized (low lightness for backgrounds, high for text)
- No light-mode color definitions present
- All Radix imports use `-dark.css` variants
- Border colors properly mapped through `@theme`
- No competing style definitions

## Testing Checklist

- [x] All backgrounds use dark colors (lightness < 0.30)
- [x] All foreground colors use light colors (lightness > 0.60)
- [x] `color-scheme: dark` set on html and body
- [x] `data-appearance="dark"` attribute set via JavaScript
- [x] No light mode color definitions
- [x] All Radix color imports are dark variants
- [x] CSS custom properties properly mapped to Tailwind
- [x] No duplicate or conflicting imports

## Maintenance Notes

1. **Only edit `/src/index.css`** for theme customizations
2. **Never edit `/src/main.css`** - it's structural
3. **Add new Radix colors to `/src/styles/theme.css`** if needed
4. **All color values should use `oklch()`** format
5. **Maintain dark color scheme**: backgrounds (L: 0.10-0.30), text (L: 0.60-0.98)
