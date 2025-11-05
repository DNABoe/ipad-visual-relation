import type { RegisteredUser, PendingInvite } from './userRegistry'

const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`

interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class CloudAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'CloudAPIError'
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  console.log(`[CloudAPI] ${options.method || 'GET'} ${url}`)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    const data: APIResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      throw new CloudAPIError(
        data.error || `API request failed: ${response.statusText}`,
        response.status
      )
    }

    console.log(`[CloudAPI] ✓ Request successful`)
    return data.data as T
  } catch (error) {
    if (error instanceof CloudAPIError) {
      throw error
    }
    
    console.error(`[CloudAPI] ❌ Request failed:`, error)
    throw new CloudAPIError(
      error instanceof Error ? error.message : 'Network request failed'
    )
  }
}

export const cloudAPI = {
  async checkHealth(): Promise<{ status: string }> {
    return fetchAPI('/health')
  },

  async isFirstTimeSetup(): Promise<boolean> {
    const result = await fetchAPI<{ isFirstTime: boolean }>('/auth/first-time')
    return result.isFirstTime
  },

  async login(email: string, password: string): Promise<RegisteredUser> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async getAllUsers(): Promise<RegisteredUser[]> {
    return fetchAPI('/users')
  },

  async getUserByEmail(email: string): Promise<RegisteredUser | null> {
    try {
      return await fetchAPI(`/users/email/${encodeURIComponent(email)}`)
    } catch (error) {
      if (error instanceof CloudAPIError && error.statusCode === 404) {
        return null
      }
      throw error
    }
  },

  async getUserById(userId: string): Promise<RegisteredUser | null> {
    try {
      return await fetchAPI(`/users/${userId}`)
    } catch (error) {
      if (error instanceof CloudAPIError && error.statusCode === 404) {
        return null
      }
      throw error
    }
  },

  async createUser(user: RegisteredUser): Promise<RegisteredUser> {
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  },

  async updateUser(
    userId: string,
    updates: Partial<Omit<RegisteredUser, 'userId' | 'email' | 'createdAt'>>
  ): Promise<void> {
    await fetchAPI(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  async deleteUser(userId: string): Promise<void> {
    await fetchAPI(`/users/${userId}`, {
      method: 'DELETE',
    })
  },

  async getAllInvites(): Promise<PendingInvite[]> {
    return fetchAPI('/invites')
  },

  async getInviteByToken(token: string): Promise<PendingInvite | null> {
    try {
      return await fetchAPI(`/invites/${token}`)
    } catch (error) {
      if (error instanceof CloudAPIError && error.statusCode === 404) {
        return null
      }
      throw error
    }
  },

  async createInvite(invite: PendingInvite): Promise<PendingInvite> {
    return fetchAPI('/invites', {
      method: 'POST',
      body: JSON.stringify(invite),
    })
  },

  async revokeInvite(token: string): Promise<void> {
    await fetchAPI(`/invites/${token}`, {
      method: 'DELETE',
    })
  },

  async cleanupExpiredInvites(): Promise<void> {
    await fetchAPI('/invites/cleanup', {
      method: 'POST',
    })
  },
}

export async function isCloudAPIAvailable(): Promise<boolean> {
  try {
    await cloudAPI.checkHealth()
    console.log('[CloudAPI] ✓ Cloud API is available')
    return true
  } catch (error) {
    console.error('[CloudAPI] ❌ Cloud API is not available:', error)
    return false
  }
}
