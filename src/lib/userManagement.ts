import { hashPassword, type PasswordHash } from './auth'
import type { UserRole, WorkspaceUser, ActivityLog } from './types'

export function generateInviteToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function generateInviteLink(workspaceId: string, token: string): string {
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?workspace=${workspaceId}&invite=${token}`
}

export function createWorkspaceUser(
  username: string,
  email: string | undefined,
  role: UserRole,
  addedByUserId: string,
  githubLogin?: string,
  githubAvatar?: string
): WorkspaceUser {
  const inviteToken = generateInviteToken()
  const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000)
  
  return {
    userId: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    username,
    email,
    role,
    githubLogin,
    githubAvatar,
    addedAt: Date.now(),
    addedBy: addedByUserId,
    inviteToken,
    inviteExpiry: expiry,
    status: 'pending'
  }
}

export function canPerformAction(userRole: UserRole, action: string): boolean {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage-users', 'export', 'settings'],
    editor: ['read', 'write', 'export'],
    viewer: ['read', 'export']
  }

  return permissions[userRole]?.includes(action) || false
}

export function createActivityLog(
  userId: string,
  username: string,
  action: string,
  entityType?: 'person' | 'connection' | 'group' | 'user' | 'workspace',
  entityId?: string,
  details?: string
): ActivityLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
    userId,
    username,
    action,
    entityType,
    entityId,
    details
  }
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Viewer'
  }
  return roleNames[role]
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Full access including user management',
    editor: 'Can create, edit, and delete content',
    viewer: 'Can only view and export content'
  }
  return descriptions[role]
}

export async function validateInviteToken(
  user: WorkspaceUser,
  token: string
): Promise<boolean> {
  if (user.status !== 'pending') {
    return false
  }
  
  if (!user.inviteToken || !user.inviteExpiry) {
    return false
  }
  
  if (Date.now() > user.inviteExpiry) {
    return false
  }
  
  return user.inviteToken === token
}

export interface EncryptedUserCredentials {
  userId: string
  passwordHash: PasswordHash
  createdAt: number
}

export async function createUserCredentials(
  userId: string,
  password: string
): Promise<EncryptedUserCredentials> {
  const passwordHash = await hashPassword(password)
  
  return {
    userId,
    passwordHash,
    createdAt: Date.now()
  }
}

export function filterActivityLog(
  logs: ActivityLog[],
  filters: {
    userId?: string
    entityType?: string
    startDate?: number
    endDate?: number
  }
): ActivityLog[] {
  return logs.filter(log => {
    if (filters.userId && log.userId !== filters.userId) return false
    if (filters.entityType && log.entityType !== filters.entityType) return false
    if (filters.startDate && log.timestamp < filters.startDate) return false
    if (filters.endDate && log.timestamp > filters.endDate) return false
    return true
  })
}
