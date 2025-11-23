export interface SingleUser {
  userId: string
  username: string
  email: string
  name: string
  role: 'normal'
}

const HARDCODED_USERNAME = 'RelEyeUser'
const HARDCODED_PASSWORD = 'UserOfRel_Eye'
const SINGLE_USER_SESSION_KEY = 'releye-single-user-session'

const SINGLE_USER: SingleUser = {
  userId: 'single-user-001',
  username: HARDCODED_USERNAME,
  email: 'user@releye.local',
  name: 'RelEye User',
  role: 'normal'
}

export async function authenticateSingleUser(username: string, password: string): Promise<SingleUser | null> {
  console.log('[SingleUserAuth] Authenticating user:', username)
  
  if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
    console.log('[SingleUserAuth] ✓ Authentication successful')
    await setCurrentSession()
    return SINGLE_USER
  }
  
  console.log('[SingleUserAuth] ❌ Authentication failed')
  return null
}

export async function getCurrentSession(): Promise<SingleUser | null> {
  try {
    const session = localStorage.getItem(SINGLE_USER_SESSION_KEY)
    if (session === 'active') {
      console.log('[SingleUserAuth] ✓ Active session found')
      return SINGLE_USER
    }
  } catch (error) {
    console.error('[SingleUserAuth] Failed to get session:', error)
  }
  
  console.log('[SingleUserAuth] No active session')
  return null
}

export async function setCurrentSession(): Promise<void> {
  try {
    localStorage.setItem(SINGLE_USER_SESSION_KEY, 'active')
    console.log('[SingleUserAuth] ✓ Session created')
  } catch (error) {
    console.error('[SingleUserAuth] Failed to set session:', error)
    throw new Error('Failed to create session')
  }
}

export async function clearCurrentSession(): Promise<void> {
  try {
    localStorage.removeItem(SINGLE_USER_SESSION_KEY)
    console.log('[SingleUserAuth] ✓ Session cleared')
  } catch (error) {
    console.error('[SingleUserAuth] Failed to clear session:', error)
  }
}

export function getSingleUser(): SingleUser {
  return SINGLE_USER
}

export function isPasswordChangeAllowed(): boolean {
  return false
}
