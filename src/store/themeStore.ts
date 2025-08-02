import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Theme, ThemeConfig } from '@/types'

interface ThemeState {
  // State
  theme: Theme
  systemTheme: 'light' | 'dark'
  accentColor: string
  fontSize: 'sm' | 'base' | 'lg'
  reducedMotion: boolean
  isInitialized: boolean

  // Actions
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
  setFontSize: (size: 'sm' | 'base' | 'lg') => void
  setReducedMotion: (reduced: boolean) => void
  toggleTheme: () => void
  initializeTheme: () => void
  resetToDefaults: () => void

  // Computed
  getEffectiveTheme: () => 'light' | 'dark'
}

// Default theme configuration
const defaultTheme: ThemeConfig = {
  theme: 'system',
  systemTheme: 'light',
  accentColor: '#3b82f6', // blue-500
  fontSize: 'base',
  reducedMotion: false
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: defaultTheme.theme,
      systemTheme: defaultTheme.systemTheme,
      accentColor: defaultTheme.accentColor,
      fontSize: defaultTheme.fontSize,
      reducedMotion: defaultTheme.reducedMotion,
      isInitialized: false,

      // Set theme
      setTheme: (theme: Theme) => {
        set({ theme })
        
        // Apply theme to document
        const effectiveTheme = get().getEffectiveTheme()
        applyThemeToDocument(effectiveTheme, get().accentColor, get().fontSize, get().reducedMotion)
      },

      // Set accent color
      setAccentColor: (accentColor: string) => {
        set({ accentColor })
        
        // Apply color to document
        const effectiveTheme = get().getEffectiveTheme()
        applyThemeToDocument(effectiveTheme, accentColor, get().fontSize, get().reducedMotion)
      },

      // Set font size
      setFontSize: (fontSize: 'sm' | 'base' | 'lg') => {
        set({ fontSize })
        
        // Apply font size to document
        const effectiveTheme = get().getEffectiveTheme()
        applyThemeToDocument(effectiveTheme, get().accentColor, fontSize, get().reducedMotion)
      },

      // Set reduced motion
      setReducedMotion: (reducedMotion: boolean) => {
        set({ reducedMotion })
        
        // Apply motion preference to document
        const effectiveTheme = get().getEffectiveTheme()
        applyThemeToDocument(effectiveTheme, get().accentColor, get().fontSize, reducedMotion)
      },

      // Toggle between light and dark theme
      toggleTheme: () => {
        const { theme } = get()
        let newTheme: Theme
        
        if (theme === 'system') {
          // If system, switch to opposite of system preference
          const systemTheme = get().systemTheme
          newTheme = systemTheme === 'light' ? 'dark' : 'light'
        } else {
          // If light/dark, switch to opposite
          newTheme = theme === 'light' ? 'dark' : 'light'
        }
        
        get().setTheme(newTheme)
      },

      // Initialize theme on app startup
      initializeTheme: () => {
        try {
          // Detect system theme preference
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          
          // Detect reduced motion preference
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          
          set({ 
            systemTheme,
            reducedMotion: prefersReducedMotion,
            isInitialized: true 
          })

          // Apply initial theme
          const effectiveTheme = get().getEffectiveTheme()
          applyThemeToDocument(effectiveTheme, get().accentColor, get().fontSize, get().reducedMotion)

          // Listen for system theme changes
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            const newSystemTheme = e.matches ? 'dark' : 'light'
            set({ systemTheme: newSystemTheme })
            
            // If using system theme, update effective theme
            if (get().theme === 'system') {
              applyThemeToDocument(newSystemTheme, get().accentColor, get().fontSize, get().reducedMotion)
            }
          }
          
          mediaQuery.addEventListener('change', handleSystemThemeChange)

          // Listen for reduced motion changes
          const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
          const handleMotionChange = (e: MediaQueryListEvent) => {
            const reducedMotion = e.matches
            set({ reducedMotion })
            applyThemeToDocument(get().getEffectiveTheme(), get().accentColor, get().fontSize, reducedMotion)
          }
          
          motionQuery.addEventListener('change', handleMotionChange)

          // Store cleanup function for unmounting
          ;(window as any).__themeCleanup = () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange)
            motionQuery.removeEventListener('change', handleMotionChange)
          }
          
        } catch (error) {
          console.error('Failed to initialize theme:', error)
          set({ isInitialized: true })
        }
      },

      // Reset to default theme
      resetToDefaults: () => {
        set({
          theme: defaultTheme.theme,
          accentColor: defaultTheme.accentColor,
          fontSize: defaultTheme.fontSize,
          reducedMotion: defaultTheme.reducedMotion
        })
        
        const effectiveTheme = get().getEffectiveTheme()
        applyThemeToDocument(effectiveTheme, defaultTheme.accentColor, defaultTheme.fontSize, defaultTheme.reducedMotion)
      },

      // Get the effective theme (resolves 'system' to actual theme)
      getEffectiveTheme: () => {
        const { theme, systemTheme } = get()
        return theme === 'system' ? systemTheme : theme
      }
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        fontSize: state.fontSize,
        reducedMotion: state.reducedMotion
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migrations if needed
        if (version === 0) {
          return {
            ...defaultTheme,
            ...persistedState,
            isInitialized: false
          }
        }
        return persistedState
      }
    }
  )
)

// Helper function to apply theme to document
function applyThemeToDocument(
  theme: 'light' | 'dark',
  accentColor: string,
  fontSize: 'sm' | 'base' | 'lg',
  reducedMotion: boolean
) {
  const root = document.documentElement
  
  // Apply theme class
  if (theme === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }

  // Apply font size
  root.classList.remove('text-sm', 'text-base', 'text-lg')
  root.classList.add(`text-${fontSize}`)
  root.setAttribute('data-font-size', fontSize)

  // Apply reduced motion
  if (reducedMotion) {
    root.classList.add('motion-reduce')
    root.setAttribute('data-motion', 'reduce')
  } else {
    root.classList.remove('motion-reduce')
    root.setAttribute('data-motion', 'normal')
  }

  // Apply accent color as CSS custom property
  const accentColorRgb = hexToRgb(accentColor)
  if (accentColorRgb) {
    root.style.setProperty('--color-primary', `${accentColorRgb.r} ${accentColorRgb.g} ${accentColorRgb.b}`)
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Cleanup function to be called on app unmount
export const cleanupTheme = () => {
  if ((window as any).__themeCleanup) {
    ;(window as any).__themeCleanup()
  }
}