import type { FrameColor, GroupColor } from './types'

export const FRAME_COLORS: Record<FrameColor, string> = {
  red: 'oklch(0.608 0.221 14)',
  green: 'oklch(0.825 0.145 165)',
  orange: 'oklch(0.722 0.165 45)',
  white: 'oklch(0.98 0 0)',
}

export const GROUP_COLORS: Record<GroupColor, string> = {
  blue: 'oklch(0.628 0.088 196)',
  purple: 'oklch(0.542 0.150 286)',
  pink: 'oklch(0.722 0.165 340)',
  yellow: 'oklch(0.850 0.125 95)',
  teal: 'oklch(0.658 0.096 180)',
  indigo: 'oklch(0.542 0.150 270)',
  rose: 'oklch(0.722 0.165 10)',
  emerald: 'oklch(0.825 0.145 165)',
  amber: 'oklch(0.850 0.125 75)',
  cyan: 'oklch(0.875 0.125 192)',
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
