import { cloudAPI } from './cloudAPI'
import { hashPassword, verifyPassword, type PasswordHash } from './auth'

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
    const users = await cloudAPI.getAllUsers()
    console.log('[UserRegistry] Found', users.length, 'users')
    return users
  } catch (error) {
    console.error('[UserRegistry] Failed to get users:', error)
    throw new Error('Failed to retrieve users from server')
  }
}

export async function getUserByEmail(email: string): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Looking up user by email:', email)
  try {
    const user = await cloudAPI.getUserByEmail(email)
    console.log('[UserRegistry] User found:', !!user)
    return user || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get user by email:', error)
    throw new Error('Failed to retrieve user from server')
  }
}

export async function getUserById(userId: string): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Looking up user by ID:', userId)
  try {
    const user = await cloudAPI.getUserById(userId)
    console.log('[UserRegistry] User found:', !!user)
    return user || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get user by ID:', error)
    throw new Error('Failed to retrieve user from server')
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
  
  try {
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

    console.log('[UserRegistry] Sending user to cloud API...')
    const createdUser = await cloudAPI.createUser(user)
    console.log('[UserRegistry] ✓ User created on server')
    console.log('[UserRegistry] ========== USER CREATED SUCCESSFULLY ==========')
    
    return createdUser
  } catch (error) {
    console.error('[UserRegistry] Failed to create user:', error)
    throw error
  }
}

export async function authenticateUser(emailOrUsername: string, password: string): Promise<RegisteredUser | null> {
  console.log('[UserRegistry] ========== AUTHENTICATING USER ==========')
  console.log('[UserRegistry] EmailOrUsername:', emailOrUsername)
  
  try {
    const user = await cloudAPI.login(emailOrUsername, password)
    console.log('[UserRegistry] ✓ Authentication successful')
    
    localStorage.setItem(CURRENT_USER_KEY, user.userId)
    console.log('[UserRegistry] ✓ Current user stored locally')
    console.log('[UserRegistry] ========== AUTHENTICATION SUCCESSFUL ==========')
    
    return user
  } catch (error) {
    console.log('[UserRegistry] ❌ Authentication failed:', error)
    return null
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
  console.log('[UserRegistry] ✓ Current user cleared')
}

export async function updateUser(userId: string, updates: Partial<Omit<RegisteredUser, 'userId' | 'email' | 'createdAt'>>): Promise<void> {
  console.log('[UserRegistry] Updating user:', userId)
  
  try {
    await cloudAPI.updateUser(userId, updates)
    console.log('[UserRegistry] ✓ User updated')
  } catch (error) {
    console.error('[UserRegistry] Failed to update user:', error)
    throw new Error('Failed to update user on server')
  }
}

export async function deleteUser(userId: string): Promise<void> {
  console.log('[UserRegistry] Deleting user:', userId)
  
  try {
    await cloudAPI.deleteUser(userId)
    console.log('[UserRegistry] ✓ User deleted')
  } catch (error) {
    console.error('[UserRegistry] Failed to delete user:', error)
    throw new Error('Failed to delete user from server')
  }
}

export async function createInvite(
  email: string,
  name: string,
  role: 'admin' | 'editor' | 'viewer',
  createdBy: string
): Promise<PendingInvite> {
  console.log('[UserRegistry] ========== CREATING INVITE ==========')
  console.log('[UserRegistry] Email:', email)
  console.log('[UserRegistry] Name:', name)
  console.log('[UserRegistry] Role:', role)
  
  try {
    const existing = await getUserByEmail(email)
    if (existing) {
      throw new Error('A user with this email already exists')
    }

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const invite: PendingInvite = {
      inviteId: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email: email.toLowerCase(),
      name,
      role,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      createdBy
    }

    console.log('[UserRegistry] Sending invite to cloud API...')
    const createdInvite = await cloudAPI.createInvite(invite)
    console.log('[UserRegistry] ✓ Invite created on server')
    console.log('[UserRegistry] ========== INVITE CREATED SUCCESSFULLY ==========')
    
    return createdInvite
  } catch (error) {
    console.error('[UserRegistry] Failed to create invite:', error)
    throw error
  }
}

export async function getAllInvites(): Promise<PendingInvite[]> {
  console.log('[UserRegistry] Getting all invites from cloud API...')
  try {
    const invites = await cloudAPI.getAllInvites()
    console.log('[UserRegistry] Found', invites.length, 'invites')
    return invites
  } catch (error) {
    console.error('[UserRegistry] Failed to get invites:', error)
    throw new Error('Failed to retrieve invites from server')
  }
}

export async function getInviteByToken(token: string): Promise<PendingInvite | undefined> {
  console.log('[UserRegistry] Looking up invite by token:', token.substring(0, 8) + '...')
  try {
    const invite = await cloudAPI.getInviteByToken(token)
    console.log('[UserRegistry] Invite found:', !!invite)
    if (invite) {
      console.log('[UserRegistry] Invite details:', {
        email: invite.email,
        name: invite.name,
        expiresAt: new Date(invite.expiresAt).toISOString(),
        isExpired: invite.expiresAt < Date.now()
      })
    }
    return invite || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get invite by token:', error)
    throw new Error('Failed to retrieve invite from server')
  }
}

export async function consumeInvite(token: string, password: string): Promise<RegisteredUser> {
  console.log('[UserRegistry] ========== CONSUMING INVITE ==========')
  console.log('[UserRegistry] Token:', token.substring(0, 8) + '...')
  
  try {
    const invite = await getInviteByToken(token)
    if (!invite) {
      console.error('[UserRegistry] ❌ Invite not found')
      throw new Error('Invitation not found or has been revoked')
    }

    if (invite.expiresAt < Date.now()) {
      console.error('[UserRegistry] ❌ Invite expired')
      throw new Error('This invitation has expired')
    }

    console.log('[UserRegistry] Invite is valid, creating user...')
    const user = await createUser(invite.email, invite.name, password, invite.role)
    
    console.log('[UserRegistry] Removing consumed invite...')
    await cloudAPI.revokeInvite(token)
    console.log('[UserRegistry] ✓ Invite removed')
    
    console.log('[UserRegistry] ========== INVITE CONSUMED SUCCESSFULLY ==========')
    return user
  } catch (error) {
    console.error('[UserRegistry] Failed to consume invite:', error)
    throw error
  }
}

export async function revokeInvite(token: string): Promise<void> {
  console.log('[UserRegistry] Revoking invite:', token.substring(0, 8) + '...')
  
  try {
    await cloudAPI.revokeInvite(token)
    console.log('[UserRegistry] ✓ Invite revoked')
  } catch (error) {
    console.error('[UserRegistry] Failed to revoke invite:', error)
    throw new Error('Failed to revoke invite on server')
  }
}

export async function cleanupExpiredInvites(): Promise<void> {
  console.log('[UserRegistry] Cleaning up expired invites...')
  
  try {
    await cloudAPI.cleanupExpiredInvites()
    console.log('[UserRegistry] ✓ Expired invites cleaned up')
  } catch (error) {
    console.error('[UserRegistry] Failed to cleanup expired invites:', error)
  }
}

export async function isFirstTimeSetup(): Promise<boolean> {
  console.log('[UserRegistry] Checking if first time setup...')
  try {
    const isFirstTime = await cloudAPI.isFirstTimeSetup()
    console.log('[UserRegistry] Is first time setup:', isFirstTime)
    return isFirstTime
  } catch (error) {
    console.error('[UserRegistry] Failed to check first time setup:', error)
    throw new Error('Failed to check first time setup status from server')
  }
}

export async function resetAllUsers(): Promise<void> {
  console.log('[UserRegistry] ========== RESETTING ALL USERS ==========')
  console.log('[UserRegistry] ❌ Reset functionality requires direct database access')
  console.log('[UserRegistry] This should be performed via database administration')
  throw new Error('User reset must be performed by database administrator')
}

export function generateInviteLink(token: string, email: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}?invite=${token}&email=${encodeURIComponent(email)}`
}
