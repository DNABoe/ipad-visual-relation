/// <reference types="../vite-end.d.ts" />
import { hashPassword, verifyPassword, type PasswordHash } from './auth'

export interface RegisteredUser {
  userId: string
  email: string
  name: string
  role: 'admin' | 'normal'
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
  role: 'admin' | 'normal'
  token: string
  createdAt: number
  expiresAt: number
  createdBy: string
}

const USERS_KV_KEY = 'releye-users'
const INVITES_KV_KEY = 'releye-invites'
const CURRENT_USER_KEY = 'releye-current-user-id'
const SESSION_KV_KEY = 'releye-active-sessions'

export async function getAllUsers(): Promise<RegisteredUser[]> {
  console.log('[UserRegistry] Getting all users from Spark KV...')
  
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    throw new Error('Storage system not available. Please refresh the page.')
  }
  
  try {
    const users = await window.spark.kv.get<RegisteredUser[]>(USERS_KV_KEY)
    console.log('[UserRegistry] Found', users?.length || 0, 'users')
    return users || []
  } catch (error) {
    console.error('[UserRegistry] Failed to get users:', error)
    throw new Error('Failed to load user data. Please check your connection.')
  }
}

async function saveAllUsers(users: RegisteredUser[]): Promise<void> {
  console.log('[UserRegistry] Saving', users.length, 'users to Spark KV...')
  
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    throw new Error('Storage system not available. Please refresh the page and try again.')
  }
  
  try {
    await Promise.race([
      window.spark.kv.set(USERS_KV_KEY, users),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Storage operation timed out after 10 seconds')), 10000)
      )
    ])
    console.log('[UserRegistry] ✓ Users saved successfully')
    
    const verification = await window.spark.kv.get<RegisteredUser[]>(USERS_KV_KEY)
    if (!verification || verification.length !== users.length) {
      console.warn('[UserRegistry] ⚠️ Verification mismatch after save')
    } else {
      console.log('[UserRegistry] ✓ Save verified')
    }
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to save users:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to save user data: ${errorMsg}. Please check your connection and try again.`)
  }
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
  role: 'admin' | 'normal',
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
  console.log('[UserRegistry] ========== UPDATING USER ==========')
  console.log('[UserRegistry] User ID:', user.userId)
  console.log('[UserRegistry] User data:', {
    email: user.email,
    name: user.name,
    role: user.role,
    canInvestigate: user.canInvestigate
  })
  
  const users = await getAllUsers()
  console.log('[UserRegistry] Current users count:', users.length)
  
  const index = users.findIndex(u => u.userId === user.userId)
  
  if (index === -1) {
    console.error('[UserRegistry] ❌ User not found in registry')
    throw new Error('User not found')
  }
  
  console.log('[UserRegistry] Found user at index:', index)
  console.log('[UserRegistry] Old user data:', {
    email: users[index].email,
    role: users[index].role,
    canInvestigate: users[index].canInvestigate
  })
  
  users[index] = user
  console.log('[UserRegistry] Updated user in array')
  console.log('[UserRegistry] New user data:', {
    email: users[index].email,
    role: users[index].role,
    canInvestigate: users[index].canInvestigate
  })
  
  console.log('[UserRegistry] Saving all users...')
  await saveAllUsers(users)
  console.log('[UserRegistry] ✓ User updated')
  
  const verification = await getUserById(user.userId)
  if (verification) {
    console.log('[UserRegistry] ✓ Verification check - user role:', verification.role, 'canInvestigate:', verification.canInvestigate)
  } else {
    console.error('[UserRegistry] ❌ Verification failed - user not found after update')
  }
  
  console.log('[UserRegistry] ========== UPDATE COMPLETE ==========')
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
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    return []
  }
  
  try {
    const invites = await window.spark.kv.get<PendingInvite[]>(INVITES_KV_KEY)
    return invites || []
  } catch (error) {
    console.error('[UserRegistry] Failed to get invites:', error)
    return []
  }
}

async function saveAllInvites(invites: PendingInvite[]): Promise<void> {
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    throw new Error('Storage system not available. Please refresh the page.')
  }
  
  try {
    await window.spark.kv.set(INVITES_KV_KEY, invites)
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to save invites:', error)
    throw new Error('Failed to save invite data. Please check your connection.')
  }
}

export async function getInviteByToken(token: string): Promise<PendingInvite | undefined> {
  console.log('[UserRegistry] Looking up invite by token:', token.substring(0, 8) + '...')
  const invites = await getAllInvites()
  console.log('[UserRegistry] Total invites in storage:', invites.length)
  
  if (invites.length > 0) {
    console.log('[UserRegistry] Available invite tokens:')
    invites.forEach((inv, idx) => {
      console.log(`  [${idx}] ${inv.token.substring(0, 8)}... (${inv.email})`)
    })
  }
  
  const decodedToken = decodeURIComponent(token)
  console.log('[UserRegistry] Decoded token:', decodedToken.substring(0, 8) + '...')
  
  const invite = invites.find(i => i.token === token || i.token === decodedToken)
  
  if (invite) {
    console.log('[UserRegistry] ✓ Found matching invite for:', invite.email)
  } else {
    console.log('[UserRegistry] ❌ No matching invite found')
  }
  
  return invite
}

export async function createInvite(
  email: string,
  name: string,
  role: 'admin' | 'normal',
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
  console.log('[UserRegistry] ========== CONSUMING INVITATION ==========')
  console.log('[UserRegistry] Token:', token.substring(0, 8) + '...')
  console.log('[UserRegistry] Password length:', password.length)
  
  const invite = await getInviteByToken(token)
  if (!invite) {
    console.error('[UserRegistry] ❌ Invalid or missing invite token')
    throw new Error('Invalid invite token. The invitation may have been revoked or already used.')
  }

  console.log('[UserRegistry] Found invite for:', invite.email)
  console.log('[UserRegistry] Invite created:', new Date(invite.createdAt).toISOString())
  console.log('[UserRegistry] Invite expires:', new Date(invite.expiresAt).toISOString())

  if (Date.now() > invite.expiresAt) {
    console.error('[UserRegistry] ❌ Invite expired at:', new Date(invite.expiresAt).toISOString())
    const expiredDate = new Date(invite.expiresAt).toLocaleDateString()
    throw new Error(`This invitation expired on ${expiredDate}. Please contact your administrator for a new invitation.`)
  }

  console.log('[UserRegistry] Checking if user already exists...')
  const existingUser = await getUserByEmail(invite.email)
  if (existingUser) {
    console.error('[UserRegistry] ❌ User already exists with this email')
    throw new Error('A user with this email already exists. The invitation may have already been used.')
  }

  console.log('[UserRegistry] Creating user account...')
  const user = await createUser(invite.email, invite.name, password, invite.role, false)
  console.log('[UserRegistry] ✓ User created:', user.userId)

  console.log('[UserRegistry] Removing consumed invite...')
  const invites = await getAllInvites()
  const filtered = invites.filter(i => i.token !== token && i.token !== decodeURIComponent(token))
  await saveAllInvites(filtered)
  console.log('[UserRegistry] ✓ Invite consumed and removed')
  
  console.log('[UserRegistry] ========== INVITATION CONSUMPTION COMPLETE ==========')
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
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    return undefined
  }
  
  try {
    const userId = await window.spark.kv.get<string>(CURRENT_USER_KEY)
    return userId
  } catch (error) {
    console.error('[UserRegistry] Failed to get current user ID:', error)
    return undefined
  }
}

export async function getCurrentUser(): Promise<RegisteredUser | undefined> {
  const userId = await getCurrentUserId()
  if (!userId) return undefined
  
  try {
    return await getUserById(userId)
  } catch (error) {
    console.error('[UserRegistry] Failed to get current user:', error)
    return undefined
  }
}

export async function setCurrentUser(userId: string): Promise<void> {
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    throw new Error('Storage system not available. Please refresh the page and try again.')
  }
  
  try {
    await window.spark.kv.set(CURRENT_USER_KEY, userId)
    console.log('[UserRegistry] ✓ Current user session saved to GitHub:', userId)
  } catch (error) {
    console.error('[UserRegistry] Failed to set current user:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to save user session: ${errorMsg}`)
  }
}

export async function clearCurrentUser(): Promise<void> {
  if (!window.spark || !window.spark.kv) {
    console.warn('[UserRegistry] ⚠️ Spark KV is not available - cannot clear session')
    return
  }
  
  try {
    await window.spark.kv.delete(CURRENT_USER_KEY)
    console.log('[UserRegistry] ✓ Current user session cleared from GitHub')
  } catch (error) {
    console.error('[UserRegistry] Failed to clear current user:', error)
  }
}

export function generateInviteLink(token: string, email: string): string {
  const baseUrl = window.location.origin + window.location.pathname
  const encodedEmail = encodeURIComponent(email)
  const encodedToken = encodeURIComponent(token)
  const link = `${baseUrl}?invite=${encodedToken}&email=${encodedEmail}`
  
  console.log('[UserRegistry] Generated invite link:')
  console.log('  Base URL:', baseUrl)
  console.log('  Token (first 8 chars):', token.substring(0, 8) + '...')
  console.log('  Email:', email)
  console.log('  Full link:', link)
  
  return link
}

export async function resetAllData(): Promise<void> {
  console.log('[UserRegistry] ⚠️⚠️⚠️ RESETTING ALL DATA ⚠️⚠️⚠️')
  
  if (!window.spark || !window.spark.kv) {
    console.error('[UserRegistry] ❌ Spark KV is not available!')
    throw new Error('Storage system not available. Please refresh the page.')
  }
  
  try {
    await window.spark.kv.delete(USERS_KV_KEY)
    await window.spark.kv.delete(INVITES_KV_KEY)
    await clearCurrentUser()
    console.log('[UserRegistry] ✓ All data has been reset from GitHub')
  } catch (error) {
    console.error('[UserRegistry] Failed to reset all data:', error)
    throw new Error('Failed to reset data')
  }
}
