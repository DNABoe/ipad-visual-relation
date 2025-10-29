export type FrameColor = 'red' | 'green' | 'orange' | 'white'
export type GroupColor = 'blue' | 'purple' | 'pink' | 'yellow' | 'teal' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'cyan'
export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left'

export interface Person {
  id: string
  name: string
  position: string
  position2?: string
  position3?: string
  photo?: string
  score: number
  frameColor: FrameColor
  x: number
  y: number
  groupId?: string
  advocate?: boolean
  createdAt: number
}

export interface Connection {
  id: string
  fromPersonId: string
  toPersonId: string
  fromSide?: ConnectionSide
  toSide?: ConnectionSide
}

export interface Group {
  id: string
  name: string
  color: GroupColor
  x: number
  y: number
  width: number
  height: number
  solidBackground?: boolean
  createdAt: number
}

export interface AppSettings {
  username: string
  passwordHash: string
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  showMinimap: boolean
  organicLines: boolean
  gridOpacity: number
}

export interface Workspace {
  persons: Person[]
  connections: Connection[]
  groups: Group[]
}

export interface ViewTransform {
  x: number
  y: number
  scale: number
}
