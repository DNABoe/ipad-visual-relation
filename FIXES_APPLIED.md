# Fixes Applied for Infinite Loop Issues

## Date: 2025

## Issue Description
The application was experiencing "Maximum update depth exceeded" errors, indicating infinite loops in React state updates.

## Root Causes Identified

### 1. Critical: useWorkspaceState Hook (FIXED)
**Location**: `src/hooks/useWorkspaceState.ts`

**Problem**: The useEffect that monitored `initialWorkspace` changes was running on every render, including the first mount. This caused the workspace state to reset continuously when the parent component passed updated workspace data.

**Fix**: Added a `isFirstMount` ref to skip the reset logic on the initial mount, preventing the infinite loop.

```typescript
// Before:
useEffect(() => {
  const newInitialStr = JSON.stringify(initialWorkspace)
  if (newInitialStr !== initialWorkspaceRef.current) {
    initialWorkspaceRef.current = newInitialStr
    setWorkspace(initialWorkspace)  // This caused re-renders
    setUndoStack([])
  }
}, [initialWorkspace])

// After:
const isFirstMount = useRef(true)

useEffect(() => {
  if (isFirstMount.current) {
    isFirstMount.current = false
    return  // Skip on first mount
  }
  
  const newInitialStr = JSON.stringify(initialWorkspace)
  if (newInitialStr !== initialWorkspaceRef.current) {
    initialWorkspaceRef.current = newInitialStr
    setWorkspace(initialWorkspace)
    setUndoStack([])
  }
}, [initialWorkspace])
```

### 2. Critical: App.tsx Workspace State Management (FIXED)
**Location**: `src/App.tsx`

**Problem**: The App component was managing workspace state and passing both the workspace and a setWorkspace function to WorkspaceView. This created a circular dependency where:
- App passes workspace to WorkspaceView
- WorkspaceView updates workspace via setWorkspace
- This triggers App to re-render
- App passes the new workspace back to WorkspaceView
- useWorkspaceState sees a change and resets
- Infinite loop ensues

**Fix**: Removed the circular dependency by:
1. Renaming `workspace` state to `initialWorkspace` in App.tsx
2. Removing the `setWorkspace` prop from WorkspaceViewProps
3. Making WorkspaceView manage its own workspace state internally via the controller

```typescript
// Before:
const [workspace, setWorkspace] = useState<Workspace | null>(null)
<WorkspaceView 
  workspace={workspace} 
  setWorkspace={setWorkspace}  // Circular dependency!
  ... 
/>

// After:
const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
<WorkspaceView 
  workspace={initialWorkspace}  // One-way data flow only
  ... 
/>
```

### 3. Critical: LoginView Credential Initialization (FIXED)
**Location**: `src/components/LoginView.tsx`

**Problem**: The useEffect that initialized default credentials was running on every render because it had no dependencies and checked `userSettings` which could trigger re-renders.

**Fix**: Added a `hasInitialized` ref to ensure the initialization only runs once.

```typescript
// Before:
useEffect(() => {
  const initializeCredentials = async () => {
    if (!userSettings) {
      // This could run multiple times
      const defaultHash = await getDefaultPasswordHash()
      setUserSettings(...)
    }
    setIsInitializing(false)
  }
  initializeCredentials()
}, [])  // Missing dependency but still problematic

// After:
const hasInitialized = useRef(false)

useEffect(() => {
  if (hasInitialized.current) return  // Guard against multiple runs
  
  const initializeCredentials = async () => {
    if (!userSettings) {
      const defaultHash = await getDefaultPasswordHash()
      setUserSettings(...)
    }
    setIsInitializing(false)
    hasInitialized.current = true
  }
  initializeCredentials()
}, [])
```

## Architecture Changes

### Data Flow Before:
```
App (workspace state)
  ↓ (passes workspace)
WorkspaceView
  ↓ (passes to controller)
useWorkspaceController
  ↓ (passes to state hook)
useWorkspaceState
  ↓ (updates workspace)
  ↑ (sends back to App via setWorkspace)
App (updates workspace state)
  ↓ (passes new workspace)
WorkspaceView (receives new workspace)
  ↓ (useWorkspaceState detects change)
  ↓ (resets workspace to new initial)
  → INFINITE LOOP
```

### Data Flow After:
```
App (initialWorkspace state - immutable reference)
  ↓ (passes initial workspace once)
WorkspaceView
  ↓ (passes to controller)
useWorkspaceController
  ↓ (passes to state hook)
useWorkspaceState (manages workspace internally)
  ↓ (updates workspace)
  ↑ (stays internal, no circular update)
  → STABLE STATE
```

## Testing Recommendations

1. **Load a network file**: Ensure the file loads without crashes
2. **Create a new network**: Ensure network creation works
3. **Edit persons**: Add, update, and delete persons
4. **Canvas operations**: Pan, zoom, drag nodes
5. **Settings changes**: Toggle grid, change settings
6. **Login flow**: Logout and login again
7. **Undo operations**: Use Ctrl+Z to undo changes

## Files Modified

1. `/workspaces/spark-template/src/hooks/useWorkspaceState.ts` - Fixed infinite loop in useEffect
2. `/workspaces/spark-template/src/App.tsx` - Removed circular workspace state dependency
3. `/workspaces/spark-template/src/components/WorkspaceView.tsx` - Removed setWorkspace prop
4. `/workspaces/spark-template/src/components/LoginView.tsx` - Fixed credential initialization loop

## Prevention Guidelines

To prevent similar issues in the future:

1. **Avoid Circular State Updates**: Never pass state and setState from parent to child if the child will update that state and pass it back
2. **Use Refs for Initialization Guards**: When running one-time initialization in useEffect, use a ref to prevent multiple runs
3. **First Mount Detection**: When you need to skip logic on the first mount, use a ref flag
4. **Immutable Initial Values**: When passing initial values to hooks, ensure they're only meant to be used for initialization, not continuous sync
5. **State Ownership**: Each component should own its state. Parent components should pass initial values, not manage the child's state

## Additional Notes

The application uses a complex state management pattern with multiple custom hooks. This is generally good for separation of concerns, but requires careful attention to:
- When effects run (first mount vs subsequent updates)
- How state flows between components
- Which component owns which piece of state
