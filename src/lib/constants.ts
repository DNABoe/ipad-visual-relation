import type { FrameColor, GroupColor } from './types'

export const FRAME_COLORS: Record<FrameColor, string> = {
  red: '#FF3C64',
  green: '#00FFB3',
  orange: '#FF8C42',
  white: '#FFFFFF',
}

export const GROUP_COLORS: Record<GroupColor, string> = {
  blue: '#45A29E',
  purple: '#8B5CF6',
  pink: '#EC4899',
  yellow: '#F59E0B',
  teal: '#14B8A6',
  indigo: '#6366F1',
  rose: '#FF3C64',
  emerald: '#00FFB3',
  amber: '#FBBF24',
  cyan: '#66FCF1',
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
