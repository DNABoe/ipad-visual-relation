import { hashPassword, verifyPassword, type PasswordHash } from './auth'
import { cloudAuthService } from './cloudAuthService'

export interface RegisteredUser {
  userId: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  passwordHash: PasswordHash
  createdAt: number
  lastLogin?: number
  loginCount: number
  canInvestigate: boolean
  encryptedApiKey?: string
  apiKeySalt?: string
}

export interface PendingInvite {
  inviteId: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  token: string
  createdAt: number
  expiresAt: number
  createdBy: string
}

const CURRENT_USER_KEY = 'releye-current-user-id'

export async function getAllUsers(): Promise<RegisteredUser[]> {
  console.log('[UserRegistry] Getting all users from cloud API...')
  try {
    const users = await cloudAuthService.getAllUsers()
    console.log('[UserRegistry] Found', users?.length || 0, 'users')
    return users || []
  } catch (error) {
    console.error('[UserRegistry] Failed to get users:', error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Looking up user by email:', email)
  try {
    const user = await cloudAuthService.getUserByEmail(email)
    console.log('[UserRegistry] User found:', !!user)
    return user || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get user by email:', error)
    return undefined
  }
}

export async function getUserById(userId: string): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Looking up user by ID:', userId)
  try {
    const user = await cloudAuthService.getUserById(userId)
    console.log('[UserRegistry] User found:', !!user)
    return user || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get user by ID:', error)
    return undefined
  }
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: 'admin' | 'editor' | 'viewer',
  canInvestigate: boolean = false
): Promise<RegisteredUser> {
  console.log('[UserRegistry] ========== CREATING USER ==========')
  console.log('[UserRegistry] Email:', email)
  console.log('[UserRegistry] Name:', name)
  console.log('[UserRegistry] Role:', role)
  
  const existing = await getUserByEmail(email)
  if (existing) {
    console.error('[UserRegistry] ❌ User already exists with this email')
    throw new Error('A user with this email already exists')
  }

  console.log('[UserRegistry] Hashing password...')
  const passwordHash = await hashPassword(password)
  console.log('[UserRegistry] ✓ Password hashed')

  const user: RegisteredUser = {
    userId: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    email: email.toLowerCase(),
    name,
    role,
    passwordHash,
    createdAt: Date.now(),
    loginCount: 0,
    canInvestigate
  }

  console.log('[UserRegistry] Saving user to cloud API...')
  try {
    const createdUser = await cloudAuthService.createUser(user)
    console.log('[UserRegistry] ✓ User created')
    console.log('[UserRegistry] ========== USER CREATED SUCCESSFULLY ==========')
    return createdUser
  } catch (error) {
    console.error('[UserRegistry] Failed to create user:', error)
    throw error
  }
}

export async function updateUser(user: RegisteredUser): Promise<void> {
  console.log('[UserRegistry] Updating user:', user.userId)
  try {
    await cloudAuthService.updateUser(user.userId, user)
    console.log('[UserRegistry] ✓ User updated')
  } catch (error) {
    console.error('[UserRegistry] Failed to update user:', error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  console.log('[UserRegistry] Deleting user:', userId)
  try {
    await cloudAuthService.deleteUser(userId)
    console.log('[UserRegistry] ✓ User deleted')
  } catch (error) {
    console.error('[UserRegistry] Failed to delete user:', error)
    throw error
  }
}

export async function authenticateUser(emailOrUsername: string, password: string): Promise<RegisteredUser | null> {
  console.log('[UserRegistry] ========== AUTHENTICATING USER ==========')
  console.log('[UserRegistry] EmailOrUsername:', emailOrUsername)
  
  try {
    const user = await cloudAuthService.authenticateUser(emailOrUsername, password)
    
    if (!user) {
      console.log('[UserRegistry] ❌ Authentication failed')
      return null
    }

    console.log('[UserRegistry] ✓ Authentication successful')
    await setCurrentUser(user.userId)
    console.log('[UserRegistry] ========== AUTHENTICATION SUCCESSFUL ==========')
    
    return user
  } catch (error) {
    console.error('[UserRegistry] Authentication error:', error)
    return null
  }
}

export async function isFirstTimeSetup(): Promise<boolean> {
  try {
    const isFirstTime = await cloudAuthService.isFirstTimeSetup()
    console.log('[UserRegistry] First time setup:', isFirstTime)
    return isFirstTime
  } catch (error) {
    console.error('[UserRegistry] Failed to check first time setup:', error)
    return true
  }
}

export async function getAllInvites(): Promise<PendingInvite[]> {
  try {
    const invites = await cloudAuthService.getAllInvites()
    return invites || []
  } catch (error) {
    console.error('[UserRegistry] Failed to get invites:', error)
    return []
  }
}

export async function getInviteByToken(token: string): Promise<PendingInvite | undefined> {
  try {
    const invite = await cloudAuthService.getInviteByToken(token)
    return invite || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get invite:', error)
    return undefined
  }
}

export async function createInvite(
  email: string,
  name: string,
  role: 'admin' | 'editor' | 'viewer',
  createdBy: string
): Promise<PendingInvite> {
  const token = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  const invite: PendingInvite = {
    inviteId: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    email: email.toLowerCase(),
    name,
    role,
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    createdBy
  }

  try {
    const createdInvite = await cloudAuthService.createInvite(invite)
    console.log('[UserRegistry] ✓ Invite created')
    return createdInvite
  } catch (error) {
    console.error('[UserRegistry] Failed to create invite:', error)
    throw error
  }
}

export async function consumeInvite(token: string, password: string): Promise<RegisteredUser> {
  console.log('[UserRegistry] Consuming invite with token:', token)
  
  const invite = await getInviteByToken(token)
  if (!invite) {
    throw new Error('Invalid invite token')
  }

  if (Date.now() > invite.expiresAt) {
    throw new Error('Invite has expired')
  }

  const user = await createUser(invite.email, invite.name, password, invite.role, false)

  try {
    await cloudAuthService.deleteInvite(token)
    console.log('[UserRegistry] ✓ Invite consumed')
  } catch (error) {
    console.error('[UserRegistry] Failed to delete invite after consumption:', error)
  }

  return user
}

export async function revokeInvite(token: string): Promise<void> {
  console.log('[UserRegistry] Revoking invite:', token.substring(0, 8) + '...')
  try {
    await cloudAuthService.deleteInvite(token)
    console.log('[UserRegistry] ✓ Invite revoked')
  } catch (error) {
    console.error('[UserRegistry] Failed to revoke invite:', error)
    throw error
  }
}

export async function cleanupExpiredInvites(): Promise<void> {
  console.log('[UserRegistry] Cleaning up expired invites...')
  try {
    await cloudAuthService.cleanupExpiredInvites()
    console.log('[UserRegistry] ✓ Expired invites cleaned up')
  } catch (error) {
    console.error('[UserRegistry] Failed to cleanup invites:', error)
  }
}

export async function getCurrentUserId(): Promise<string | undefined> {
  const userId = localStorage.getItem(CURRENT_USER_KEY)
  return userId || undefined
}

export async function getCurrentUser(): Promise<RegisteredUser | undefined> {
  const userId = await getCurrentUserId()
  if (!userId) return undefined
  return await getUserById(userId)
}

export async function setCurrentUser(userId: string): Promise<void> {
  localStorage.setItem(CURRENT_USER_KEY, userId)
  console.log('[UserRegistry] ✓ Current user set:', userId)
}

export async function clearCurrentUser(): Promise<void> {
  localStorage.removeItem(CURRENT_USER_KEY)
  cloudAuthService.logout()
  console.log('[UserRegistry] ✓ Current user cleared and logged out')
}

export function generateInviteLink(token: string, email: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}?invite=${token}&email=${encodeURIComponent(email)}`
}

export async function resetAllData(): Promise<void> {
  console.log('[UserRegistry] ⚠️⚠️⚠️ RESETTING ALL DATA ⚠️⚠️⚠️')
  try {
    await cloudAuthService.resetAll()
    await clearCurrentUser()
    console.log('[UserRegistry] ✓ All data has been reset - application will restart')
  } catch (error) {
    console.error('[UserRegistry] Failed to reset data:', error)
    throw error
  }
}
