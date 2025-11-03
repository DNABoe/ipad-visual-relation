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
  photoOriginal?: string
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

export type ConnectionStyle = 'solid' | 'dashed'
export type ConnectionWeight = 'thin' | 'medium' | 'thick'
export type ConnectionDirection = 'none' | 'forward' | 'backward' | 'bidirectional'

export interface Connection {
  id: string
  fromPersonId: string
  toPersonId: string
  fromSide?: ConnectionSide
  toSide?: ConnectionSide
  style?: ConnectionStyle
  weight?: ConnectionWeight
  direction?: ConnectionDirection
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

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface UserInfo {
  id: string
  username: string
  email?: string
  role: UserRole
  githubLogin?: string
  githubAvatar?: string
  invitedAt: number
  activatedAt?: number
  lastActiveAt?: number
}

export interface UserCredentials {
  userId: string
  passwordHash: string
}

export interface WorkspaceUser {
  userId: string
  username: string
  email?: string
  role: UserRole
  githubLogin?: string
  githubAvatar?: string
  addedAt: number
  addedBy: string
  inviteToken?: string
  inviteExpiry?: number
  status: 'pending' | 'active' | 'suspended'
}

export interface ActivityLog {
  id: string
  timestamp: number
  userId: string
  username: string
  action: string
  entityType?: 'person' | 'connection' | 'group' | 'user' | 'workspace'
  entityId?: string
  details?: string
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
  id?: string
  name?: string
  ownerId?: string
  persons: Person[]
  connections: Connection[]
  groups: Group[]
  collapsedBranches?: CollapsedBranch[]
  settings?: WorkspaceSettings
  canvasTransform?: ViewTransform
  users?: WorkspaceUser[]
  activityLog?: ActivityLog[]
  createdAt?: number
  modifiedAt?: number
  modifiedBy?: string
}

export interface ViewTransform {
  x: number
  y: number
  scale: number
}
