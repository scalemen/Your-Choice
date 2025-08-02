import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, LoginCredentials, RegisterData } from '@/types'
import { authService } from '@/services/authService'

interface AuthState {
  // State
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  initializeAuth: () => Promise<void>
  clearError: () => void
  updateUser: (user: Partial<User>) => void

  // Google OAuth
  loginWithGoogle: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Login action
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.login(credentials)
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          })

          // Set token in axios defaults
          authService.setAuthToken(response.token)
          
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Login failed'
          })
          throw error
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.register(data)
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          })

          // Set token in axios defaults
          authService.setAuthToken(response.token)
          
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Registration failed'
          })
          throw error
        }
      },

      // Google OAuth login
      loginWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null })
          
          // Redirect to Google OAuth endpoint
          window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`
          
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Google login failed'
          })
          throw error
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isLoading: false,
          error: null
        })

        // Clear token from axios defaults
        authService.clearAuthToken()
        
        // Clear any stored session data
        localStorage.removeItem('auth-storage')
        sessionStorage.clear()
      },

      // Refresh authentication
      refreshAuth: async () => {
        try {
          const { refreshToken } = get()
          
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          set({ isLoading: true, error: null })
          
          const response = await authService.refreshToken(refreshToken)
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          })

          // Set new token in axios defaults
          authService.setAuthToken(response.token)
          
        } catch (error: any) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      // Initialize authentication on app startup
      initializeAuth: async () => {
        try {
          set({ isLoading: true })
          
          const { token, refreshToken } = get()
          
          if (!token) {
            set({ isLoading: false, isInitialized: true })
            return
          }

          // Set token in axios defaults
          authService.setAuthToken(token)

          try {
            // Verify token is still valid by fetching user profile
            const user = await authService.getCurrentUser()
            
            set({
              user,
              isLoading: false,
              isInitialized: true,
              error: null
            })
            
          } catch (error: any) {
            // Token is invalid, try to refresh
            if (refreshToken) {
              try {
                await get().refreshAuth()
                set({ isInitialized: true })
              } catch (refreshError) {
                // Refresh failed, logout
                get().logout()
                set({ isInitialized: true })
              }
            } else {
              // No refresh token, logout
              get().logout()
              set({ isInitialized: true })
            }
          }
          
        } catch (error: any) {
          get().logout()
          set({
            isLoading: false,
            isInitialized: true,
            error: error.message || 'Authentication initialization failed'
          })
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Update user profile
      updateUser: (updatedUser: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...updatedUser }
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migrations if needed
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            isInitialized: false
          }
        }
        return persistedState
      }
    }
  )
)