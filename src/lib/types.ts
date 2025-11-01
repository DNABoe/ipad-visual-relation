export type FrameColor = 'red' | 'green' | 'orange' | 'white'
export type GroupColor = 'blue' | 'purple' | 'pink' | 'yellow' | 'teal' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'cyan'
export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left'

export interface Attachment {
  id: string
  name: string
  type: string
  data: string
  size: number
  addedAt: number
}

export interface ActivityLogEntry {
  id: string
  timestamp: number
  action: 'created' | 'modified' | 'photo_added' | 'photo_removed' | 'attachment_added' | 'attachment_removed' | 'note_updated'
  details?: string
}

export interface Person {
  id: string
  name: string
  position: string
  position2?: string
  position3?: string
  photo?: string
  photoOffsetX?: number
  photoOffsetY?: number
  photoZoom?: number
  score: number
  frameColor: FrameColor
  x: number
  y: number
  groupId?: string
  advocate?: boolean
  hidden?: boolean
  notes?: string
  attachments?: Attachment[]
  activityLog?: ActivityLogEntry[]
  createdAt: number
  modifiedAt?: number
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
  showMinimap: boolean
}

export interface WorkspaceSettings {
  magneticSnap: boolean
  gridSize: number
  organicLines: boolean
  gridOpacity: number
  showGrid: boolean
}

export interface CollapsedBranch {
  parentId: string
  collapsedPersonIds: string[]
  parentPositionAtCollapse: { x: number; y: number }
}

export interface Workspace {
  persons: Person[]
  connections: Connection[]
  groups: Group[]
  collapsedBranches?: CollapsedBranch[]
  settings?: WorkspaceSettings
  canvasTransform?: ViewTransform
}

export interface ViewTransform {
  x: number
  y: number
  scale: number
}
