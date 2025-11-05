import type { FrameColor, GroupColor, AppSettings, WorkspaceSettings } from './types'

export const FRAME_COLORS: Record<FrameColor, string> = {
  red: 'oklch(0.6 0.25 15)',
  green: 'oklch(0.78 0.25 165)',
  orange: 'oklch(0.72 0.18 45)',
  white: 'oklch(0.65 0.02 240)',
}

export const GROUP_COLORS: Record<GroupColor, string> = {
  blue: 'oklch(0.65 0.11 185)',
  purple: 'oklch(0.63 0.24 290)',
  pink: 'oklch(0.65 0.24 350)',
  yellow: 'oklch(0.72 0.18 75)',
  teal: 'oklch(0.68 0.15 180)',
  indigo: 'oklch(0.6 0.22 275)',
  rose: 'oklch(0.6 0.25 15)',
  emerald: 'oklch(0.78 0.25 165)',
  amber: 'oklch(0.82 0.16 85)',
  cyan: 'oklch(0.88 0.18 185)',
}

export const FRAME_COLOR_NAMES: FrameColor[] = ['red', 'green', 'orange', 'white']
export const GROUP_COLOR_NAMES: GroupColor[] = ['blue', 'purple', 'pink', 'yellow', 'teal', 'indigo', 'rose', 'emerald', 'amber', 'cyan']

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 280
export const GRID_SIZE = 20
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 2
export const ZOOM_STEP = 0.1

export const DEFAULT_APP_SETTINGS: AppSettings = {
  showMinimap: true,
  openaiApiKey: undefined,
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  magneticSnap: true,
  gridSize: 20,
  organicLines: false,
  gridOpacity: 15,
  showGrid: true,
}
