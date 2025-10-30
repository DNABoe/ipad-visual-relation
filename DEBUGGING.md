# Grid Toggle and Canvas Settings Issues - FIXED

## Problems Identified

### 1. **Async `useKV` updates not awaited**
In `SettingsDialog.tsx`, the `setAppSettings` function from `useKV` returns a Promise, but the code wasn't awaiting it before dispatching custom events and calling callbacks. This created a race condition where:
- Settings dialog would update the KV store (async)
- Immediately dispatch 'settings-changed' event (before KV update completed)
- Canvas would read stale settings

### 2. **Unnecessary setTimeout delays**
The code used `setTimeout(..., 50)` to try to wait for async operations, but 50ms is arbitrary and doesn't guarantee the KV store has updated.

### 3. **Custom event system competing with useKV reactivity**
Both `SettingsDialog` and `WorkspaceCanvas` use `useKV<AppSettings>('app-settings', ...)` which provides built-in reactivity. The custom 'settings-changed' event and `onRefreshCanvas` callback were redundant and could cause timing issues.

## Fixes Applied

### 1. Made all setting updates async/await (SettingsDialog.tsx)
Changed all `onCheckedChange` and `onValueChange` handlers to async functions that await the `setAppSettings` call:

**Before:**
```typescript
onCheckedChange={(checked) => {
  setAppSettings((current) => ({ ...DEFAULT_APP_SETTINGS, ...current, showGrid: checked }))
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('settings-changed'))
    onRefreshCanvas?.()
  }, 50)
  toast.success(checked ? 'Grid enabled' : 'Grid disabled')
}}
```

**After:**
```typescript
onCheckedChange={async (checked) => {
  await setAppSettings((current) => ({ ...DEFAULT_APP_SETTINGS, ...current, showGrid: checked }))
  window.dispatchEvent(new CustomEvent('settings-changed'))
  onRefreshCanvas?.()
  toast.success(checked ? 'Grid enabled' : 'Grid disabled')
}}
```

This ensures the KV store is updated before any side effects execute.

### 2. Added debug logging (WorkspaceCanvas.tsx)
Added a useEffect to log when settings change, making it easier to verify reactivity:

```typescript
useEffect(() => {
  console.log('[WorkspaceCanvas] Settings changed:', { showGrid, gridSize, gridOpacity, snapToGrid, organicLines })
}, [showGrid, gridSize, gridOpacity, snapToGrid, organicLines])
```

### 3. Cleaned up useKV destructuring (WorkspaceCanvas.tsx)
Changed from `const [settings, , ] = useKV(...)` to `const [settings] = useKV(...)` for cleaner code.

## How It Works Now

1. User toggles grid in Settings Dialog
2. `setAppSettings` is called with async/await
3. KV store updates and completes
4. Custom event is dispatched (for any manual listeners)
5. `onRefreshCanvas` callback is called
6. Toast notification shows
7. **Meanwhile**, `useKV` in WorkspaceCanvas detects the KV change automatically
8. WorkspaceCanvas re-renders with new settings
9. useEffect hooks trigger based on changed setting values
10. Grid visibility updates with CSS class changes

## Testing Checklist

- [ ] Toggle "Show Grid" on and off - grid should appear/disappear with fade animation
- [ ] Toggle "Snap to Grid" - dragging nodes should snap to grid when enabled
- [ ] Adjust "Grid Size" slider - grid spacing should change in real-time
- [ ] Adjust "Grid Opacity" slider - grid visibility should change
- [ ] Toggle "Organic Lines" - connection lines should change between straight and curved
- [ ] Verify console logs show settings changing
- [ ] Verify no race conditions (settings persist correctly)

