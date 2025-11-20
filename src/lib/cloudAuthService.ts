import type { RegisteredUser, PendingInvite } from './userRegistry'

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://releye.boestad.com/api')

const AUTH_TOKEN_KEY = 'releye-auth-token'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error('[CloudAuthService] Failed to get auth token:', error)
    return null
  }
}

function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    console.log('[CloudAuthService] ✓ Auth token stored')
  } catch (error) {
    console.error('[CloudAuthService] Failed to store auth token:', error)
  }
}

function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    console.log('[CloudAuthService] ✓ Auth token cleared')
  } catch (error) {
    console.error('[CloudAuthService] Failed to clear auth token:', error)
  }
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  timeout: number = 5000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
      signal: controller.signal,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const result: ApiResponse<T> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed')
    }

    return result.data as T
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[CloudAuthService] API call timeout (${method} ${endpoint})`)
      throw new Error('Request timeout - backend may be unavailable')
    }
    console.error(`[CloudAuthService] API call failed (${method} ${endpoint}):`, error)
    throw error
  }
}

export const cloudAuthService = {
  async getAllUsers(): Promise<RegisteredUser[]> {
    return apiCall<RegisteredUser[]>('/users', 'GET')
  },

  async getUserByEmail(email: string): Promise<RegisteredUser | null> {
    try {
      return await apiCall<RegisteredUser>(`/users/email/${encodeURIComponent(email)}`, 'GET')
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  },

  async getUserById(userId: string): Promise<RegisteredUser | null> {
    try {
      return await apiCall<RegisteredUser>(`/users/${userId}`, 'GET')
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  },

  async createUser(user: RegisteredUser): Promise<RegisteredUser> {
    return apiCall<RegisteredUser>('/users', 'POST', user)
  },

  async updateUser(userId: string, updates: Partial<RegisteredUser>): Promise<void> {
    await apiCall<void>(`/users/${userId}`, 'PUT', updates)
  },

  async deleteUser(userId: string): Promise<void> {
    await apiCall<void>(`/users/${userId}`, 'DELETE')
  },

  async authenticateUser(email: string, password: string): Promise<RegisteredUser | null> {
    try {
      const result = await apiCall<RegisteredUser & { token?: string }>('/auth/login', 'POST', { email, password })
      
      if (result) {
        console.log('[CloudAuthService] ✓ Login successful, storing auth token')
        if (result.token) {
          setAuthToken(result.token)
        }
      }
      
      return result
    } catch (error) {
      console.error('[CloudAuthService] Authentication failed:', error)
      return null
    }
  },

  logout(): void {
    console.log('[CloudAuthService] Logging out, clearing auth token')
    clearAuthToken()
  },

  async getAllInvites(): Promise<PendingInvite[]> {
    return apiCall<PendingInvite[]>('/invites', 'GET')
  },

  async getInviteByToken(token: string): Promise<PendingInvite | null> {
    try {
      return await apiCall<PendingInvite>(`/invites/${token}`, 'GET')
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  },

  async createInvite(invite: PendingInvite): Promise<PendingInvite> {
    return apiCall<PendingInvite>('/invites', 'POST', invite)
  },

  async deleteInvite(token: string): Promise<void> {
    await apiCall<void>(`/invites/${token}`, 'DELETE')
  },

  async cleanupExpiredInvites(): Promise<void> {
    await apiCall<void>('/invites/cleanup', 'POST')
  },

  async isFirstTimeSetup(): Promise<boolean> {
    const result = await apiCall<{ isFirstTime: boolean }>('/auth/first-time', 'GET')
    return result.isFirstTime
  },

  async healthCheck(): Promise<boolean> {
    try {
      await apiCall<{ status: string }>('/health', 'GET', undefined, 3000)
      console.log('[CloudAuthService] ✓ Health check passed - backend is available')
      return true
    } catch (error) {
      console.log('[CloudAuthService] ✗ Health check failed - backend not available, will use localStorage')
      return false
    }
  },

  async resetAll(): Promise<void> {
    console.log('[CloudAuthService] ⚠️ RESETTING ALL DATA')
    await apiCall<{ success: boolean, message: string }>('/auth/reset-all', 'POST')
    console.log('[CloudAuthService] ✓ All data has been reset')
  }
}
