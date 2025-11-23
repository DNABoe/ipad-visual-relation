const API_BASE_URL = 'https://releye.boestad.com/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class ApiClient {
  private static token: string | null = null

  static setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('releye-auth-token', token)
    } else {
      localStorage.removeItem('releye-auth-token')
    }
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('releye-auth-token')
    }
    return this.token
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}?endpoint=${encodeURIComponent(endpoint)}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      const data: ApiResponse<T> = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || `API error: ${response.status}`)
      }

      return data.data as T
    } catch (error) {
      console.error(`API request failed (${endpoint}):`, error)
      throw error
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  static async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  static async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  static async healthCheck(): Promise<{ status: string; timestamp: number; version: string; database: string }> {
    return this.get('health')
  }

  static async isFirstTimeSetup(): Promise<boolean> {
    const result = await this.get<{ isFirstTime: boolean }>('auth/first-time')
    return result.isFirstTime
  }

  static async login(email: string, password: string): Promise<{
    userId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    canInvestigate: boolean
    loginCount: number
    createdAt: number
    lastLogin: number
    passwordHash: string
    token: string
  }> {
    return this.post('auth/login', { email, password })
  }

  static async register(email: string, name: string, password: string, role: 'admin' | 'normal' = 'admin'): Promise<{
    userId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    canInvestigate: boolean
    token: string
  }> {
    return this.post('auth/register', { email, name, password, role })
  }

  static async verifyToken(): Promise<{
    userId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    canInvestigate: boolean
    loginCount: number
    createdAt: number
    lastLogin: number
  }> {
    return this.get('auth/verify')
  }

  static async getAllUsers(): Promise<Array<{
    userId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    canInvestigate: boolean
    loginCount: number
    createdAt: number
    lastLogin: number
  }>> {
    return this.get('users')
  }

  static async createUser(email: string, name: string, password: string, role: 'admin' | 'normal', canInvestigate: boolean): Promise<{
    userId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    canInvestigate: boolean
  }> {
    return this.post('users/create', { email, name, password, role, canInvestigate })
  }

  static async updateUser(userId: string, updates: {
    name?: string
    role?: 'admin' | 'normal'
    canInvestigate?: boolean
  }): Promise<void> {
    return this.put(`users/${userId}`, updates)
  }

  static async deleteUser(userId: string): Promise<void> {
    return this.delete(`users/${userId}`)
  }

  static async createInvite(email: string, name: string, role: 'admin' | 'normal'): Promise<{
    inviteId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    token: string
    createdAt: number
    expiresAt: number
  }> {
    return this.post('invites/create', { email, name, role })
  }

  static async getAllInvites(): Promise<Array<{
    inviteId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    token: string
    createdAt: number
    expiresAt: number
    createdBy: string
  }>> {
    return this.get('invites')
  }

  static async revokeInvite(inviteId: string): Promise<void> {
    return this.delete(`invites/${inviteId}`)
  }

  static async consumeInvite(token: string, password: string): Promise<{
    userId: string
    email: string
    name: string
    role: 'admin' | 'normal'
    canInvestigate: boolean
    token: string
  }> {
    return this.post('invites/accept', { token, password })
  }

  static async resetAll(): Promise<void> {
    return this.post('auth/reset-all')
  }
}
