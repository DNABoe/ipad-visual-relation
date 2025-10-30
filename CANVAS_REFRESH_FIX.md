# Canvas Refresh Issue - Root Cause Analysis & Fix

## Problem Summary
The canvas was not updating when users changed settings (grid visibility, opacity, size) or toggled grid lines on/off. This was a critical UX issue affecting the core functionality.

## Root Cause Analysis

### Issue #1: Incorrect useEffect Dependencies
**Location**: `WorkspaceCanvas.tsx` line 44

**Problem**: The useEffect that applies grid styles had `controller.transform.transform` as a dependency. This is an object reference that doesn't trigger re-renders when its internal values change.

**Symptom**: Grid settings wouldn't update visually even though the state changed.

### Issue #2: Functional Updates Creating Stale References
**Location**: `SettingsDialog.tsx` lines 147-228, `WorkspaceToolbar.tsx` lines 66-71

**Problem**: Using functional updates like `setAppSettings((current) => ({ ...current!, showGrid: checked }))` can create scenarios where the spread operator creates a new object with the same property values, leading to reference equality issues with React's reconciliation.

**Symptom**: Settings dialog changes wouldn't propagate to canvas immediately.

### Issue #3: Unnecessary Key-Based Remounting
**Location**: `WorkspaceView.tsx` line 341

**Problem**: Using a complex key based on settings to force component remount was masking the real reactivity issue and causing unnecessary full remounts.

**Symptom**: Performance issues and unreliable updates.

## Solutions Implemented

### Fix #1: Correct useEffect Dependencies
Changed from:
```typescript
}, [gridSize, showGrid, gridOpacity, controller.transform.transform, controller.canvasRef, settings])
```

To:
```typescript
}, [gridSize, showGrid, gridOpacity, controller.transform.transform.x, controller.transform.transform.y, controller.transform.transform.scale, controller.canvasRef])
```

**Result**: The effect now properly responds to individual transform properties, not the object reference.

### Fix #2: Direct Object Updates Instead of Functional Updates
Changed from:
```typescript
await setAppSettings((current) => ({ ...current!, showGrid: checked }))
```

To:
```typescript
const newSettings = { ...appSettings!, showGrid: checked }
await setAppSettings(newSettings)
```

**Result**: Creates a guaranteed new object reference that React can detect as a change.

### Fix #3: Removed Key-Based Remounting
Removed:
```typescript
key={`canvas-${settings?.showGrid}-${settings?.gridSize}-...`}
```

**Result**: Component updates naturally via React's state management without expensive remounts.

## Why This Works

1. **Primitive Dependencies**: By depending on primitive values (`transform.x`, `transform.y`, etc.) instead of object references, React's comparison works correctly.

2. **New Object References**: Creating explicit new objects ensures `useKV` propagates changes to all subscribed components.

3. **Natural Reactivity**: Removing the key allows React to properly update the component tree instead of destroying and recreating it.

## Testing Checklist

- [x] Toggle grid on/off from toolbar → Canvas updates immediately
- [x] Change grid size in settings → Canvas grid spacing updates
- [x] Change grid opacity in settings → Grid visibility adjusts
- [x] Toggle snap to grid → Behavior changes immediately
- [x] Toggle organic lines → Connection rendering updates

## Performance Impact

**Before**: Full component remount on every settings change (expensive)
**After**: Targeted DOM updates via useEffect (efficient)

## Related Files Modified

- `/src/components/WorkspaceCanvas.tsx` - Fixed useEffect dependencies
- `/src/components/SettingsDialog.tsx` - Changed to direct object updates
- `/src/components/WorkspaceToolbar.tsx` - Changed to direct object updates
- `/src/components/WorkspaceView.tsx` - Removed unnecessary key prop
