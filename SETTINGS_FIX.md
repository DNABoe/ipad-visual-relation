# Canvas Settings Fix

## Problem
The grid toggle button and canvas settings in the Settings Dialog were not working properly. When users changed settings like "Show Grid", "Snap to Grid", "Grid Size", or "Grid Opacity", the canvas would not update to reflect the changes.

## Root Cause
The issue was caused by improper state management in the WorkspaceCanvas component:

1. **Stale State Problem**: The component was using local state variables (`localShowGrid`, `localGridSize`, etc.) that were initialized to `null` and only updated once from KV storage. This meant that subsequent changes to settings were not reflected.

2. **Incorrect Update Pattern**: Settings were being updated using direct object spread instead of functional updates, which could lead to stale closure issues with the `useKV` hook.

3. **Missing Dependencies**: The canvas effect that applies grid styles wasn't properly reacting to settings changes from the KV store.

## Solution

### 1. Removed Local State Layer (WorkspaceCanvas.tsx)
Removed all local state variables and directly used the settings from the `useKV` hook:

```typescript
// Before (broken):
const [localShowGrid, setLocalShowGrid] = useState<boolean | null>(null)
const showGrid = localShowGrid !== null ? localShowGrid : (settings?.showGrid ?? DEFAULT_APP_SETTINGS.showGrid)

// After (fixed):
const showGrid = settings?.showGrid ?? DEFAULT_APP_SETTINGS.showGrid
```

This ensures the canvas always reads the current value from the KV store.

### 2. Fixed Settings Update Pattern (SettingsDialog.tsx & WorkspaceToolbar.tsx)
Changed from direct object updates to functional updates to avoid stale closure issues:

```typescript
// Before (could have stale values):
const newSettings = { ...DEFAULT_APP_SETTINGS, ...appSettings, showGrid: checked }
await setAppSettings(newSettings)

// After (always uses current value):
await setAppSettings((current) => ({ ...DEFAULT_APP_SETTINGS, ...current, showGrid: checked }))
```

### 3. Added Reactive Dependencies (WorkspaceCanvas.tsx)
Added a new effect that watches for changes to settings from the KV store:

```typescript
useEffect(() => {
  setForceUpdateKey(prev => prev + 1)
}, [settings?.showGrid, settings?.gridSize, settings?.gridOpacity, settings?.snapToGrid, settings?.organicLines])
```

This ensures the canvas re-renders whenever any setting changes, triggering the grid effect to update the CSS classes and variables.

### 4. Simplified Event System
Simplified the custom event dispatching - removed the `detail` payload since we're now relying on KV reactivity:

```typescript
// Before:
window.dispatchEvent(new CustomEvent('settings-changed', { detail: { showGrid: checked } }))

// After:
window.dispatchEvent(new CustomEvent('settings-changed'))
```

## Files Modified
1. `/src/components/WorkspaceCanvas.tsx` - Removed local state, added KV reactivity
2. `/src/components/SettingsDialog.tsx` - Fixed all settings updates to use functional updates
3. `/src/components/WorkspaceToolbar.tsx` - Fixed toggle button to use functional update

## How It Works Now

1. User clicks toggle button or changes setting in dialog
2. Setting is updated in KV store using functional update
3. `useKV` hook notifies all subscribers (WorkspaceCanvas, WorkspaceToolbar, SettingsDialog)
4. WorkspaceCanvas effect triggers due to settings dependencies
5. Grid CSS classes and CSS variables are updated
6. Canvas displays the new settings immediately

## Testing
To verify the fix works:

1. **Toggle Button**: Click the grid toggle button in the toolbar - grid should appear/disappear immediately
2. **Settings Dialog - Show Grid**: Toggle "Show Grid" switch - grid should appear/disappear with animation
3. **Settings Dialog - Grid Size**: Adjust grid size slider - grid lines should resize in real-time
4. **Settings Dialog - Grid Opacity**: Adjust opacity slider - grid visibility should change smoothly
5. **Settings Dialog - Snap to Grid**: Toggle snap - dragging nodes should snap to grid when enabled
6. **Settings Dialog - Organic Lines**: Toggle organic lines - connections should change style

All settings should now work correctly and update the canvas immediately!
