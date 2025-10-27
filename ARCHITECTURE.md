# NetEye - Refactored Architecture

## Overview
Complete UI/UX control mechanism overhaul using a clean, modular architecture with separated concerns.

## New Architecture

### Custom Hooks (Separation of Concerns)

1. **useWorkspaceState** (`/src/hooks/useWorkspaceState.ts`)
   - Manages all workspace data (persons, groups, connections)
   - Handles CRUD operations
   - Manages undo/redo stack
   - Pure data layer with no UI logic

2. **useSelection** (`/src/hooks/useSelection.ts`)
   - Manages selection state for persons, groups, and connections
   - Supports multi-selection
   - Clean API for selection operations

3. **useCanvasTransform** (`/src/hooks/useCanvasTransform.ts`)
   - Handles pan, zoom, and viewport transformations
   - Manages zoom constraints (MIN/MAX)
   - Provides smooth zoom-to-fit functionality

4. **useInteractionState** (`/src/hooks/useInteractionState.ts`)
   - Manages interaction modes (select, connect, pan)
   - Tracks drag states (person, group, connection, selection)
   - Handles resize operations
   - Centralizes all interaction logic

5. **useDialogState** (`/src/hooks/useDialogState.ts`)
   - Manages all dialog open/close states
   - Provides clean dialog control API
   - Stores dialog-specific data (edit person, photo viewer, etc.)

6. **useWorkspaceController** (`/src/hooks/useWorkspaceController.ts`)
   - **Master orchestrator** that combines all hooks
   - Provides unified event handlers
   - Manages interaction between different state layers
   - Single source of truth for component logic

### Component Structure

1. **WorkspaceView2.tsx** (`/src/components/WorkspaceView2.tsx`)
   - Main workspace container
   - Uses the controller hook
   - Manages keyboard shortcuts
   - Coordinates dialogs and panels

2. **WorkspaceToolbar.tsx** (`/src/components/WorkspaceToolbar.tsx`)
   - Extracted toolbar component
   - All toolbar actions in one place
   - Clean props interface

3. **WorkspaceCanvas.tsx** (`/src/components/WorkspaceCanvas.tsx`)
   - Handles all canvas rendering and interactions
   - Mouse event handling (drag, select, resize)
   - Visual feedback (selection rect, connection drag)
   - Grid and transform rendering

## Key Improvements

### 1. **Separation of Concerns**
   - Each hook has a single, well-defined responsibility
   - No mixed business logic and UI logic
   - Easier to test and maintain

### 2. **Predictable State Flow**
   ```
   User Action → Controller Handler → Hook State Update → Component Re-render
   ```

### 3. **Type Safety**
   - Strong TypeScript typing throughout
   - Return type inference from hooks
   - No implicit any types

### 4. **Performance**
   - Optimized re-renders with useCallback
   - Bulk updates for drag operations
   - Ref-based tracking for pan state

### 5. **Maintainability**
   - Clear file organization
   - Easy to locate functionality
   - Simple to add new features

### 6. **Debugging**
   - Each hook can be inspected independently
   - Clear data flow
   - Reduced coupling

## Migration Path

The old `WorkspaceView.tsx` is preserved. The new system uses `WorkspaceView2.tsx` which is imported in `App.tsx`.

To compare or rollback:
- Change `App.tsx` import from `'./components/WorkspaceView2'` back to `'./components/WorkspaceView'`

## File Structure
```
src/
├── hooks/
│   ├── useWorkspaceState.ts       # Data management
│   ├── useSelection.ts            # Selection state
│   ├── useCanvasTransform.ts      # Pan/zoom
│   ├── useInteractionState.ts     # Interaction modes
│   ├── useDialogState.ts          # Dialog management
│   └── useWorkspaceController.ts  # Master orchestrator
├── components/
│   ├── WorkspaceView2.tsx         # Main workspace (new)
│   ├── WorkspaceToolbar.tsx       # Toolbar (extracted)
│   ├── WorkspaceCanvas.tsx        # Canvas (extracted)
│   └── ... (existing components)
└── App.tsx                        # Entry point
```

## Benefits

1. **Easier to understand**: Each file has a clear purpose
2. **Easier to modify**: Changes are localized to specific hooks
3. **Easier to extend**: Add new interactions by extending hooks
4. **Better testing**: Each hook can be tested in isolation
5. **Performance**: Optimized state updates and re-renders
6. **Type safety**: Full TypeScript coverage

## Example: Adding a New Feature

To add a new feature (e.g., multi-select with keyboard):

1. Add state to appropriate hook (e.g., `useSelection`)
2. Add handler to controller
3. Wire up in component
4. No need to modify other concerns

This is much cleaner than the previous 1600+ line WorkspaceView component!
