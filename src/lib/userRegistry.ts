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

const USERS_KV_KEY = 'releye-users'
const INVITES_KV_KEY = 'releye-invites'
const CURRENT_USER_KEY = 'releye-current-user-id'

export async function getAllUsers(): Promise<RegisteredUser[]> {
  console.log('[UserRegistry] Getting all users from Spark KV...')
  try {
    const users = await spark.kv.get<RegisteredUser[]>(USERS_KV_KEY)
    console.log('[UserRegistry] Found', users?.length || 0, 'users')
    return users || []
  } catch (error) {
    console.error('[UserRegistry] Failed to get users:', error)
    return []
  }
}

async function saveAllUsers(users: RegisteredUser[]): Promise<void> {
  console.log('[UserRegistry] Saving', users.length, 'users to Spark KV...')
  await spark.kv.set(USERS_KV_KEY, users)
  console.log('[UserRegistry] ✓ Users saved to GitHub')
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

  console.log('[UserRegistry] Saving user to Spark KV...')
  const users = await getAllUsers()
  users.push(user)
  await saveAllUsers(users)
  
  console.log('[UserRegistry] ✓ User created')
  console.log('[UserRegistry] ========== USER CREATED SUCCESSFULLY ==========')
  return user
}

export async function updateUser(user: RegisteredUser): Promise<void> {
  console.log('[UserRegistry] Updating user:', user.userId)
  const users = await getAllUsers()
  const index = users.findIndex(u => u.userId === user.userId)
  
  if (index === -1) {
    throw new Error('User not found')
  }
  
  users[index] = user
  await saveAllUsers(users)
  console.log('[UserRegistry] ✓ User updated')
}

export async function deleteUser(userId: string): Promise<void> {
  console.log('[UserRegistry] Deleting user:', userId)
  const users = await getAllUsers()
  const filtered = users.filter(u => u.userId !== userId)
  
  if (filtered.length === users.length) {
    throw new Error('User not found')
  }
  
  await saveAllUsers(filtered)
  console.log('[UserRegistry] ✓ User deleted')
}

export async function authenticateUser(emailOrUsername: string, password: string): Promise<RegisteredUser | null> {
  console.log('[UserRegistry] ========== AUTHENTICATING USER ==========')
  console.log('[UserRegistry] EmailOrUsername:', emailOrUsername)
  
  const user = await getUserByEmail(emailOrUsername)
  
  if (!user) {
    console.log('[UserRegistry] ❌ User not found')
    return null
  }

  console.log('[UserRegistry] Verifying password...')
  const isValid = await verifyPassword(password, user.passwordHash)
  
  if (!isValid) {
    console.log('[UserRegistry] ❌ Invalid password')
    return null
  }

  console.log('[UserRegistry] ✓ Authentication successful')
  
  user.lastLogin = Date.now()
  user.loginCount = (user.loginCount || 0) + 1
  await updateUser(user)
  await setCurrentUser(user.userId)
  
  console.log('[UserRegistry] ========== AUTHENTICATION SUCCESSFUL ==========')
  return user
}

export async function isFirstTimeSetup(): Promise<boolean> {
  const users = await getAllUsers()
  const hasAdmin = users.some(u => u.role === 'admin')
  console.log('[UserRegistry] First time setup:', !hasAdmin)
  return !hasAdmin
}

export async function getAllInvites(): Promise<PendingInvite[]> {
  try {
    const invites = await spark.kv.get<PendingInvite[]>(INVITES_KV_KEY)
    return invites || []
  } catch (error) {
    console.error('[UserRegistry] Failed to get invites:', error)
    return []
  }
}

async function saveAllInvites(invites: PendingInvite[]): Promise<void> {
  await spark.kv.set(INVITES_KV_KEY, invites)
}

export async function getInviteByToken(token: string): Promise<PendingInvite | undefined> {
  const invites = await getAllInvites()
  return invites.find(i => i.token === token)
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

  const invites = await getAllInvites()
  invites.push(invite)
  await saveAllInvites(invites)
  
  console.log('[UserRegistry] ✓ Invite created')
  return invite
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

  const invites = await getAllInvites()
  const filtered = invites.filter(i => i.token !== token)
  await saveAllInvites(filtered)
  
  console.log('[UserRegistry] ✓ Invite consumed')
  return user
}

export async function revokeInvite(token: string): Promise<void> {
  console.log('[UserRegistry] Revoking invite:', token.substring(0, 8) + '...')
  const invites = await getAllInvites()
  const filtered = invites.filter(i => i.token !== token)
  
  if (filtered.length === invites.length) {
    throw new Error('Invite not found')
  }
  
  await saveAllInvites(filtered)
  console.log('[UserRegistry] ✓ Invite revoked')
}

export async function cleanupExpiredInvites(): Promise<void> {
  console.log('[UserRegistry] Cleaning up expired invites...')
  const invites = await getAllInvites()
  const now = Date.now()
  const active = invites.filter(i => i.expiresAt > now)
  
  if (active.length < invites.length) {
    await saveAllInvites(active)
    console.log('[UserRegistry] ✓ Removed', invites.length - active.length, 'expired invites')
  } else {
    console.log('[UserRegistry] No expired invites to clean up')
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

export function generateInviteLink(token: string, email: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}?invite=${token}&email=${encodeURIComponent(email)}`
}

export async function resetAllData(): Promise<void> {
  console.log('[UserRegistry] ⚠️⚠️⚠️ RESETTING ALL DATA ⚠️⚠️⚠️')
  await spark.kv.delete(USERS_KV_KEY)
  await spark.kv.delete(INVITES_KV_KEY)
  await clearCurrentUser()
  console.log('[UserRegistry] ✓ All data has been reset')
}
