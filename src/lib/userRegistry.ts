import { type PasswordHash } from './auth'
import { ApiClient } from './apiClient'

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

const CURRENT_USER_KEY = 'releye-current-user-id'

export async function getAllUsers(): Promise<RegisteredUser[]> {
  console.log('[UserRegistry] Getting all users from backend API...')
  
  try {
    const users = await ApiClient.getAllUsers()
    console.log('[UserRegistry] Found', users.length, 'users')
    return users.map(u => ({
      ...u,
      passwordHash: '' as unknown as PasswordHash
    }))
  } catch (error) {
    console.error('[UserRegistry] Failed to get users:', error)
    throw new Error('Failed to load user data. Please refresh the page.')
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
  
  try {
    let user: any
    
    if (role === 'admin') {
      user = await ApiClient.register(email, name, password, role)
    } else {
      user = await ApiClient.createUser(email, name, password, role, canInvestigate)
    }
    
    const result: RegisteredUser = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: '' as unknown as PasswordHash,
      createdAt: user.createdAt || Date.now(),
      loginCount: user.loginCount || 0,
      canInvestigate: user.canInvestigate || false
    }
    
    console.log('[UserRegistry] ✓ User created:', result.userId)
    console.log('[UserRegistry] ========== USER CREATED SUCCESSFULLY ==========')
    
    if (user.token) {
      ApiClient.setToken(user.token)
    }
    
    return result
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to create user:', error)
    throw error
  }
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
  
  try {
    await ApiClient.updateUser(user.userId, {
      name: user.name,
      role: user.role,
      canInvestigate: user.canInvestigate
    })
    
    console.log('[UserRegistry] ✓ User updated')
    console.log('[UserRegistry] ========== UPDATE COMPLETE ==========')
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to update user:', error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  console.log('[UserRegistry] Deleting user:', userId)
  
  try {
    await ApiClient.deleteUser(userId)
    console.log('[UserRegistry] ✓ User deleted')
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to delete user:', error)
    throw error
  }
}

export async function authenticateUser(emailOrUsername: string, password: string): Promise<RegisteredUser | null> {
  console.log('[UserRegistry] ========== AUTHENTICATING USER ==========')
  console.log('[UserRegistry] EmailOrUsername:', emailOrUsername)
  
  try {
    const response = await ApiClient.login(emailOrUsername, password)
    
    ApiClient.setToken(response.token)
    
    const user: RegisteredUser = {
      userId: response.userId,
      email: response.email,
      name: response.name,
      role: response.role,
      passwordHash: response.passwordHash as unknown as PasswordHash,
      createdAt: response.createdAt,
      lastLogin: response.lastLogin,
      loginCount: response.loginCount,
      canInvestigate: response.canInvestigate
    }
    
    await setCurrentUser(user.userId)
    
    console.log('[UserRegistry] ✓ Authentication successful')
    console.log('[UserRegistry] ========== AUTHENTICATION SUCCESSFUL ==========')
    
    return user
  } catch (error) {
    console.error('[UserRegistry] ❌ Authentication failed:', error)
    return null
  }
}

export async function isFirstTimeSetup(): Promise<boolean> {
  console.log('[UserRegistry] Checking if first time setup...')
  
  try {
    const isFirstTime = await ApiClient.isFirstTimeSetup()
    console.log('[UserRegistry] First time setup:', isFirstTime)
    return isFirstTime
  } catch (error) {
    console.error('[UserRegistry] Failed to check first time setup:', error)
    return true
  }
}

export async function getAllInvites(): Promise<PendingInvite[]> {
  console.log('[UserRegistry] Getting all invites from backend API...')
  
  try {
    const invites = await ApiClient.getAllInvites()
    console.log('[UserRegistry] Found', invites.length, 'invites')
    return invites
  } catch (error) {
    console.error('[UserRegistry] Failed to get invites:', error)
    return []
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
  console.log('[UserRegistry] Creating invite for:', email)
  
  try {
    const invite = await ApiClient.createInvite(email, name, role)
    
    const result: PendingInvite = {
      ...invite,
      createdBy
    }
    
    console.log('[UserRegistry] ✓ Invite created')
    return result
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to create invite:', error)
    throw error
  }
}

export async function consumeInvite(token: string, password: string): Promise<RegisteredUser> {
  console.log('[UserRegistry] ========== CONSUMING INVITATION ==========')
  console.log('[UserRegistry] Token:', token.substring(0, 8) + '...')
  console.log('[UserRegistry] Password length:', password.length)
  
  try {
    const response = await ApiClient.consumeInvite(token, password)
    
    ApiClient.setToken(response.token)
    
    const user: RegisteredUser = {
      userId: response.userId,
      email: response.email,
      name: response.name,
      role: response.role,
      passwordHash: '' as unknown as PasswordHash,
      createdAt: Date.now(),
      loginCount: 0,
      canInvestigate: response.canInvestigate
    }
    
    console.log('[UserRegistry] ✓ User created:', user.userId)
    console.log('[UserRegistry] ========== INVITATION CONSUMPTION COMPLETE ==========')
    
    return user
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to consume invite:', error)
    throw error
  }
}

export async function revokeInvite(inviteId: string): Promise<void> {
  console.log('[UserRegistry] Revoking invite:', inviteId)
  
  try {
    await ApiClient.revokeInvite(inviteId)
    console.log('[UserRegistry] ✓ Invite revoked')
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to revoke invite:', error)
    throw error
  }
}

export async function cleanupExpiredInvites(): Promise<void> {
  console.log('[UserRegistry] Cleanup expired invites handled by backend')
}

export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const userId = localStorage.getItem(CURRENT_USER_KEY)
    return userId || undefined
  } catch (error) {
    console.error('[UserRegistry] Failed to get current user ID:', error)
    return undefined
  }
}

export async function getCurrentUser(): Promise<RegisteredUser | undefined> {
  console.log('[UserRegistry] Getting current user...')
  
  const token = ApiClient.getToken()
  if (!token) {
    console.log('[UserRegistry] No auth token found')
    return undefined
  }
  
  try {
    const user = await ApiClient.verifyToken()
    
    const result: RegisteredUser = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: '' as unknown as PasswordHash,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      canInvestigate: user.canInvestigate
    }
    
    console.log('[UserRegistry] ✓ Current user:', user.email)
    return result
  } catch (error) {
    console.error('[UserRegistry] Failed to verify token:', error)
    ApiClient.setToken(null)
    return undefined
  }
}

export async function setCurrentUser(userId: string): Promise<void> {
  try {
    localStorage.setItem(CURRENT_USER_KEY, userId)
    console.log('[UserRegistry] ✓ Current user session saved:', userId)
  } catch (error) {
    console.error('[UserRegistry] Failed to set current user:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to save user session: ${errorMsg}`)
  }
}

export async function clearCurrentUser(): Promise<void> {
  try {
    localStorage.removeItem(CURRENT_USER_KEY)
    ApiClient.setToken(null)
    console.log('[UserRegistry] ✓ Current user session cleared')
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
  
  try {
    await ApiClient.resetAll()
    await clearCurrentUser()
    
    console.log('[UserRegistry] ✓ All data reset successfully')
    console.log('[UserRegistry] ⚠️⚠️⚠️ RESET COMPLETE ⚠️⚠️⚠️')
  } catch (error) {
    console.error('[UserRegistry] ❌ Failed to reset data:', error)
    throw new Error('Failed to reset data. Please try again.')
  }
}
