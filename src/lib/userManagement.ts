import { hashPassword, type PasswordHash } from './auth'
import type { UserRole } from './types'

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

export interface WorkspaceUser {
  userId: string
  username: string
  email?: string
  role: UserRole
  githubLogin?: string
  githubAvatar?: string
  addedAt: number
  addedBy: string
  status: 'pending' | 'active' | 'suspended'
  canInvestigate?: boolean
  loginCount?: number
  lastLoginAt?: number
}

export function generateInviteToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function generateInviteLink(token: string, email: string): string {
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?invite=${token}&email=${encodeURIComponent(email)}`
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
