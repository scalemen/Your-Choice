import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

// Types
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  learningStyle?: string;
  educationLevel?: string;
  subjects: string[];
  preferences: Record<string, any>;
  timezone: string;
  language: string;
  theme: string;
  isVerified: boolean;
  isPremium: boolean;
  points: number;
  streak: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Create auth store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null });

            const response = await axios.post('/api/auth/login', {
              email,
              password
            });

            const { user, token } = response.data;

            // Set axios default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Store token in localStorage
            localStorage.setItem('token', token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            toast.success(`Welcome back, ${user.firstName}!`);
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        register: async (userData: RegisterData) => {
          try {
            set({ isLoading: true, error: null });

            const response = await axios.post('/api/auth/register', userData);

            const { user, token } = response.data;

            // Set axios default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Store token in localStorage
            localStorage.setItem('token', token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            toast.success(`Welcome to StudyGenius, ${user.firstName}!`);
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        logout: () => {
          // Clear token from localStorage
          localStorage.removeItem('token');

          // Clear axios authorization header
          delete axios.defaults.headers.common['Authorization'];

          // Make logout request to server
          axios.post('/api/auth/logout').catch(() => {
            // Ignore errors on logout
          });

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });

          toast.success('Logged out successfully');
        },

        updateUser: async (userData: Partial<User>) => {
          try {
            set({ isLoading: true, error: null });

            const response = await axios.put('/api/users/profile', userData);

            const updatedUser = response.data.data;

            set({
              user: updatedUser,
              isLoading: false,
              error: null
            });

            toast.success('Profile updated successfully');
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Update failed';
            set({
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        forgotPassword: async (email: string) => {
          try {
            set({ isLoading: true, error: null });

            await axios.post('/api/auth/forgot-password', { email });

            set({ isLoading: false, error: null });

            toast.success('Password reset link sent to your email');
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Request failed';
            set({
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        resetPassword: async (token: string, email: string, password: string) => {
          try {
            set({ isLoading: true, error: null });

            await axios.post('/api/auth/reset-password', {
              token,
              email,
              password
            });

            set({ isLoading: false, error: null });

            toast.success('Password reset successfully');
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Reset failed';
            set({
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        verifyEmail: async (token: string) => {
          try {
            set({ isLoading: true, error: null });

            const response = await axios.post('/api/auth/verify-email', { token });

            // Update user verification status
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: { ...currentUser, isVerified: true },
                isLoading: false,
                error: null
              });
            }

            toast.success('Email verified successfully');
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Verification failed';
            set({
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        changePassword: async (currentPassword: string, newPassword: string) => {
          try {
            set({ isLoading: true, error: null });

            await axios.post('/api/auth/change-password', {
              currentPassword,
              newPassword
            });

            set({ isLoading: false, error: null });

            toast.success('Password changed successfully');
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Password change failed';
            set({
              isLoading: false,
              error: errorMessage
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        initializeAuth: async () => {
          try {
            set({ isLoading: true, error: null });

            // Check for stored token
            const token = localStorage.getItem('token');
            if (!token) {
              set({ isLoading: false });
              return;
            }

            // Set axios authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
              // Verify token and get user data
              const response = await axios.get('/api/auth/me');
              const user = response.data.user;

              set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
              });
            } catch (error) {
              // Token is invalid, clear it
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
              
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              });
            }
          } catch (error: any) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Authentication initialization failed'
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
);

// Axios response interceptor for handling token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const { logout } = useAuthStore.getState();
      logout();
      toast.error('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

export default useAuthStore;