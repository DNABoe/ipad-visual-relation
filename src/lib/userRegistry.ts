import { storage } from './storage'
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

const USERS_KEY = 'app-users-registry'
const INVITES_KEY = 'app-pending-invites'
const CURRENT_USER_KEY = 'app-current-user-id'

export async function getAllUsers(): Promise<RegisteredUser[]> {
  console.log('[UserRegistry] Getting all users...')
  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  console.log('[UserRegistry] Found', users.length, 'users')
  return users
}

export async function getUserByEmail(email: string): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Looking up user by email:', email)
  const users = await getAllUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  console.log('[UserRegistry] User found:', !!user)
  return user
}

export async function getUserById(userId: string): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Looking up user by ID:', userId)
  const users = await getAllUsers()
  const user = users.find(u => u.userId === userId)
  console.log('[UserRegistry] User found:', !!user)
  return user
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

  console.log('[UserRegistry] Created user object:', {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role
  })

  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  users.push(user)
  
  console.log('[UserRegistry] Saving user (total users:', users.length, ')...')
  await storage.set(USERS_KEY, users)
  console.log('[UserRegistry] ✓ User saved')
  
  console.log('[UserRegistry] Verifying save...')
  const verify = await getUserById(user.userId)
  if (!verify) {
    console.error('[UserRegistry] ❌ Failed to verify user was saved!')
    throw new Error('Failed to save user to registry')
  }
  console.log('[UserRegistry] ✓ User verified in registry')
  console.log('[UserRegistry] ========== USER CREATED SUCCESSFULLY ==========')
  
  return user
}

export async function authenticateUser(email: string, password: string): Promise<RegisteredUser | null> {
  console.log('[UserRegistry] ========== AUTHENTICATING USER ==========')
  console.log('[UserRegistry] Email:', email)
  
  const user = await getUserByEmail(email)
  if (!user) {
    console.log('[UserRegistry] ❌ User not found')
    return null
  }

  console.log('[UserRegistry] User found, verifying password...')
  const isValid = await verifyPassword(password, user.passwordHash)
  
  if (!isValid) {
    console.log('[UserRegistry] ❌ Invalid password')
    return null
  }

  console.log('[UserRegistry] ✓ Password verified')
  
  user.lastLogin = Date.now()
  user.loginCount = (user.loginCount || 0) + 1
  
  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  const index = users.findIndex(u => u.userId === user.userId)
  if (index !== -1) {
    users[index] = user
    await storage.set(USERS_KEY, users)
    console.log('[UserRegistry] ✓ Login stats updated')
  }
  
  await storage.set(CURRENT_USER_KEY, user.userId)
  console.log('[UserRegistry] ✓ Current user set')
  console.log('[UserRegistry] ========== AUTHENTICATION SUCCESSFUL ==========')
  
  return user
}

export async function getCurrentUserId(): Promise<string | undefined> {
  return await storage.get<string>(CURRENT_USER_KEY)
}

export async function getCurrentUser(): Promise<RegisteredUser | undefined> {
  const userId = await getCurrentUserId()
  if (!userId) return undefined
  return await getUserById(userId)
}

export async function setCurrentUser(userId: string): Promise<void> {
  await storage.set(CURRENT_USER_KEY, userId)
}

export async function clearCurrentUser(): Promise<void> {
  await storage.delete(CURRENT_USER_KEY)
}

export async function updateUser(userId: string, updates: Partial<Omit<RegisteredUser, 'userId' | 'email' | 'createdAt'>>): Promise<void> {
  console.log('[UserRegistry] Updating user:', userId)
  
  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  const index = users.findIndex(u => u.userId === userId)
  
  if (index === -1) {
    throw new Error('User not found')
  }
  
  users[index] = { ...users[index], ...updates }
  await storage.set(USERS_KEY, users)
  console.log('[UserRegistry] ✓ User updated')
}

export async function deleteUser(userId: string): Promise<void> {
  console.log('[UserRegistry] Deleting user:', userId)
  
  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  const filtered = users.filter(u => u.userId !== userId)
  await storage.set(USERS_KEY, filtered)
  console.log('[UserRegistry] ✓ User deleted')
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

  console.log('[UserRegistry] Created invite:', {
    inviteId: invite.inviteId,
    email: invite.email,
    token: invite.token,
    expiresAt: new Date(invite.expiresAt).toISOString()
  })

  const invites = await storage.get<PendingInvite[]>(INVITES_KEY) || []
  invites.push(invite)
  
  console.log('[UserRegistry] Saving invites (total:', invites.length, ')...')
  await storage.set(INVITES_KEY, invites)
  console.log('[UserRegistry] ✓ Invite saved')
  
  console.log('[UserRegistry] Verifying save...')
  const verify = await getInviteByToken(invite.token)
  if (!verify) {
    console.error('[UserRegistry] ❌ Failed to verify invite was saved!')
    throw new Error('Failed to save invite')
  }
  console.log('[UserRegistry] ✓ Invite verified')
  console.log('[UserRegistry] ========== INVITE CREATED SUCCESSFULLY ==========')
  
  return invite
}

export async function getAllInvites(): Promise<PendingInvite[]> {
  console.log('[UserRegistry] Getting all invites...')
  const invites = await storage.get<PendingInvite[]>(INVITES_KEY) || []
  console.log('[UserRegistry] Found', invites.length, 'invites')
  return invites
}

export async function getInviteByToken(token: string): Promise<PendingInvite | undefined> {
  console.log('[UserRegistry] Looking up invite by token:', token.substring(0, 8) + '...')
  const invites = await getAllInvites()
  const invite = invites.find(inv => inv.token === token)
  console.log('[UserRegistry] Invite found:', !!invite)
  if (invite) {
    console.log('[UserRegistry] Invite details:', {
      email: invite.email,
      name: invite.name,
      expiresAt: new Date(invite.expiresAt).toISOString(),
      isExpired: invite.expiresAt < Date.now()
    })
  }
  return invite
}

export async function consumeInvite(token: string, password: string): Promise<RegisteredUser> {
  console.log('[UserRegistry] ========== CONSUMING INVITE ==========')
  console.log('[UserRegistry] Token:', token.substring(0, 8) + '...')
  
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
  const invites = await storage.get<PendingInvite[]>(INVITES_KEY) || []
  const filtered = invites.filter(inv => inv.token !== token)
  await storage.set(INVITES_KEY, filtered)
  console.log('[UserRegistry] ✓ Invite removed')
  
  console.log('[UserRegistry] ========== INVITE CONSUMED SUCCESSFULLY ==========')
  return user
}

export async function revokeInvite(token: string): Promise<void> {
  console.log('[UserRegistry] Revoking invite:', token.substring(0, 8) + '...')
  
  const invites = await storage.get<PendingInvite[]>(INVITES_KEY) || []
  const filtered = invites.filter(inv => inv.token !== token)
  await storage.set(INVITES_KEY, filtered)
  console.log('[UserRegistry] ✓ Invite revoked')
}

export async function cleanupExpiredInvites(): Promise<void> {
  console.log('[UserRegistry] Cleaning up expired invites...')
  
  const invites = await storage.get<PendingInvite[]>(INVITES_KEY) || []
  const now = Date.now()
  const valid = invites.filter(inv => inv.expiresAt > now)
  
  if (valid.length !== invites.length) {
    console.log('[UserRegistry] Removing', invites.length - valid.length, 'expired invites')
    await storage.set(INVITES_KEY, valid)
  } else {
    console.log('[UserRegistry] No expired invites found')
  }
}

export async function isFirstTimeSetup(): Promise<boolean> {
  const users = await storage.get<RegisteredUser[]>(USERS_KEY) || []
  const hasAdmin = users.some(u => u.role === 'admin')
  console.log('[UserRegistry] Is first time setup:', !hasAdmin, '(found', users.length, 'users)')
  return !hasAdmin
}

export async function resetAllUsers(): Promise<void> {
  console.log('[UserRegistry] ========== RESETTING ALL USERS ==========')
  await storage.delete(USERS_KEY)
  await storage.delete(INVITES_KEY)
  await storage.delete(CURRENT_USER_KEY)
  console.log('[UserRegistry] ✓ All user data cleared')
  console.log('[UserRegistry] ========== RESET COMPLETE ==========')
}

export function generateInviteLink(token: string, email: string): string {
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?invite=${token}&email=${encodeURIComponent(email)}`
}
