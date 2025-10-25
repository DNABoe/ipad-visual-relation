import type { FrameColor, GroupColor } from './types'

export const FRAME_COLORS: Record<FrameColor, string> = {
  red: 'oklch(0.60 0.20 25)',
  green: 'oklch(0.65 0.18 145)',
  orange: 'oklch(0.70 0.16 60)',
  white: 'oklch(0.95 0.01 250)',
}

export const GROUP_COLORS: Record<GroupColor, string> = {
  blue: 'oklch(0.60 0.15 250)',
  purple: 'oklch(0.60 0.15 290)',
  pink: 'oklch(0.65 0.18 350)',
  yellow: 'oklch(0.75 0.15 90)',
  teal: 'oklch(0.60 0.12 180)',
  indigo: 'oklch(0.55 0.15 270)',
  rose: 'oklch(0.65 0.20 10)',
  emerald: 'oklch(0.65 0.15 155)',
  amber: 'oklch(0.70 0.15 75)',
  cyan: 'oklch(0.65 0.15 200)',
}

export const FRAME_COLOR_NAMES: FrameColor[] = ['red', 'green', 'orange', 'white']
export const GROUP_COLOR_NAMES: GroupColor[] = ['blue', 'purple', 'pink', 'yellow', 'teal', 'indigo', 'rose', 'emerald', 'amber', 'cyan']

export const DEFAULT_USERNAME = 'admin'
export const DEFAULT_PASSWORD = 'admin'

export const NODE_WIDTH = 260
export const NODE_HEIGHT = 100
export const GRID_SIZE = 20
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3
export const ZOOM_STEP = 0.1
