import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  // State
  theme: Theme;
  systemTheme: 'light' | 'dark';
  actualTheme: 'light' | 'dark';
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

// Detect system theme
const detectSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Calculate actual theme based on preference and system
const calculateActualTheme = (theme: Theme, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  if (theme === 'system') return systemTheme;
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: 'system',
        systemTheme: detectSystemTheme(),
        actualTheme: detectSystemTheme(),

        // Actions
        setTheme: (theme: Theme) => {
          const systemTheme = get().systemTheme;
          const actualTheme = calculateActualTheme(theme, systemTheme);
          
          set({
            theme,
            actualTheme
          });

          // Apply theme to document
          if (actualTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },

        toggleTheme: () => {
          const currentTheme = get().theme;
          const currentActualTheme = get().actualTheme;
          
          // Toggle between light and dark (ignore system)
          const newTheme: Theme = currentActualTheme === 'dark' ? 'light' : 'dark';
          get().setTheme(newTheme);
        },

        initializeTheme: () => {
          const systemTheme = detectSystemTheme();
          const theme = get().theme;
          const actualTheme = calculateActualTheme(theme, systemTheme);
          
          set({
            systemTheme,
            actualTheme
          });

          // Apply theme to document
          if (actualTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          // Listen for system theme changes
          if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleSystemThemeChange = (e: MediaQueryListEvent) => {
              const newSystemTheme = e.matches ? 'dark' : 'light';
              const currentTheme = get().theme;
              const newActualTheme = calculateActualTheme(currentTheme, newSystemTheme);
              
              set({
                systemTheme: newSystemTheme,
                actualTheme: newActualTheme
              });

              // Apply theme if using system preference
              if (currentTheme === 'system') {
                if (newActualTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }
            };

            mediaQuery.addEventListener('change', handleSystemThemeChange);
            
            // Cleanup function (though not easily accessible in Zustand)
            return () => {
              mediaQuery.removeEventListener('change', handleSystemThemeChange);
            };
          }
        }
      }),
      {
        name: 'theme-storage',
        partialize: (state) => ({
          theme: state.theme
        })
      }
    ),
    {
      name: 'theme-store'
    }
  )
);

export default useThemeStore;