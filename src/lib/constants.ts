import type { FrameColor, GroupColor } from './types'

export const FRAME_COLORS: Record<FrameColor, string> = {
  red: 'var(--frame-red)',
  green: 'var(--frame-green)',
  orange: 'var(--frame-orange)',
  white: 'var(--frame-white)',
}

export const GROUP_COLORS: Record<GroupColor, string> = {
  blue: 'var(--group-blue)',
  purple: 'var(--group-purple)',
  pink: 'var(--group-pink)',
  yellow: 'var(--group-yellow)',
  teal: 'var(--group-teal)',
  indigo: 'var(--group-indigo)',
  rose: 'var(--group-rose)',
  emerald: 'var(--group-emerald)',
  amber: 'var(--group-amber)',
  cyan: 'var(--group-cyan)',
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
