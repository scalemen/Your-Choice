import axios, { AxiosInstance } from 'axios'
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types'

class AuthService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.getStoredRefreshToken()
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken)
              this.setAuthToken(response.token)
              originalRequest.headers.Authorization = `Bearer ${response.token}`
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuthToken()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/auth/login', credentials)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/auth/register', data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } catch (error: any) {
      // Don't throw on logout errors, just log them
      console.error('Logout error:', error)
    } finally {
      this.clearAuthToken()
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/auth/refresh', { refreshToken })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/auth/me')
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await this.api.put('/auth/profile', data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async changePassword(data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<void> {
    try {
      await this.api.put('/auth/change-password', data)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.api.post('/auth/forgot-password', { email })
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async resetPassword(data: {
    token: string
    password: string
    confirmPassword: string
  }): Promise<void> {
    try {
      await this.api.post('/auth/reset-password', data)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await this.api.post('/auth/verify-email', { token })
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      await this.api.post('/auth/resend-verification')
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Google OAuth methods
  getGoogleOAuthUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    return `${baseUrl}/api/auth/google`
  }

  async handleGoogleCallback(code: string, state?: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/auth/google/callback', {
        code,
        state
      })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Token management
  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('auth-token', token)
  }

  clearAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization']
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-refresh-token')
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth-token')
  }

  getStoredRefreshToken(): string | null {
    return localStorage.getItem('auth-refresh-token')
  }

  // User preferences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    try {
      const response = await this.api.put('/auth/preferences', preferences)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Account management
  async deleteAccount(password: string): Promise<void> {
    try {
      await this.api.delete('/auth/account', {
        data: { password }
      })
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async exportUserData(): Promise<Blob> {
    try {
      const response = await this.api.get('/auth/export-data', {
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = this.getStoredToken()
    if (!token) return false

    try {
      // Basic token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000
      return payload.exp > now
    } catch {
      return false
    }
  }

  getTokenPayload(): any | null {
    const token = this.getStoredToken()
    if (!token) return null

    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch {
      return null
    }
  }

  getUserRole(): string | null {
    const payload = this.getTokenPayload()
    return payload?.role || null
  }

  hasPermission(permission: string): boolean {
    const payload = this.getTokenPayload()
    const permissions = payload?.permissions || []
    return permissions.includes(permission)
  }

  // Error handling
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 
                     error.response.data?.error ||
                     `Server error: ${error.response.status}`
      
      const customError = new Error(message)
      ;(customError as any).status = error.response.status
      ;(customError as any).data = error.response.data
      
      return customError
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: Please check your internet connection')
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred')
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.api.get('/health')
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // API instance getter for other services
  getApiInstance(): AxiosInstance {
    return this.api
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService