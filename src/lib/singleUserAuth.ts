export interface SingleUser {
  userId: string
  username: string
  email: string
  role: 'normal'
  name: string
}

const HARDCODED_USERNAME = 'RelEyeUser'
const HARDCODED_PASSWORD = 'UserOfRel_Eye'
const SINGLE_USER_SESSION_KEY = 'single-user-session'

const SINGLE_USER: SingleUser = {
  userId: 'single-user-id',
  username: HARDCODED_USERNAME,
  email: 'user@releye.local',
  role: 'normal',
  name: 'RelEye User',
}

export async function authenticateSingleUser(username: string, password: string): Promise<SingleUser | null> {
  try {
    console.log('[SingleUserAuth] Authenticating:', username)
    
    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
      console.log('[SingleUserAuth] ✓ Authentication successful')
      await setCurrentSession()
      return SINGLE_USER
    }
    
    console.log('[SingleUserAuth] ✗ Invalid credentials')
    return null
  } catch (error) {
    console.error('[SingleUserAuth] Authentication error:', error)
    return null
  }
}

export async function setCurrentSession(): Promise<void> {
  try {
    localStorage.setItem(SINGLE_USER_SESSION_KEY, JSON.stringify(SINGLE_USER))
  } catch (error) {
    console.error('[SingleUserAuth] Error setting session:', error)
  }
}

export async function getCurrentSession(): Promise<SingleUser | null> {
  try {
    const sessionData = localStorage.getItem(SINGLE_USER_SESSION_KEY)
    if (sessionData) {
      return JSON.parse(sessionData) as SingleUser
    }
    return null
  } catch (error) {
    console.error('[SingleUserAuth] Error getting session:', error)
    return null
  }
}

export async function clearCurrentSession(): Promise<void> {
  try {
    localStorage.removeItem(SINGLE_USER_SESSION_KEY)
  } catch (error) {
    console.error('[SingleUserAuth] Error clearing session:', error)
  }
}

export function getSingleUser(): SingleUser {
  return SINGLE_USER
}

export function isPasswordChangeAllowed(): boolean {
  return false
}
