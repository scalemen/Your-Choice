/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        // Secondary colors
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // Success colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        // Warning colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        // Custom colors for different subjects
        math: {
          50: '#fef7ff',
          100: '#feeaff',
          200: '#fdd5ff',
          300: '#fcb0ff',
          400: '#f877ff',
          500: '#f046ff',
          600: '#e726ff',
          700: '#cc0df0',
          800: '#a412c2',
          900: '#87159b'
        },
        science: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      fontSize: {
        '2xs': ['0.625rem', '0.75rem'],
        'xs': ['0.75rem', '1rem'],
        'sm': ['0.875rem', '1.25rem'],
        'base': ['1rem', '1.5rem'],
        'lg': ['1.125rem', '1.75rem'],
        'xl': ['1.25rem', '1.75rem'],
        '2xl': ['1.5rem', '2rem'],
        '3xl': ['1.875rem', '2.25rem'],
        '4xl': ['2.25rem', '2.5rem'],
        '5xl': ['3rem', '1'],
        '6xl': ['3.75rem', '1'],
        '7xl': ['4.5rem', '1'],
        '8xl': ['6rem', '1'],
        '9xl': ['8rem', '1']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px -10px rgba(59, 130, 246, 0.6)',
        'inner-glow': 'inset 0 0 20px -5px rgba(59, 130, 246, 0.3)',
        'neumorphism': '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
        'neumorphism-inset': 'inset 20px 20px 60px #bebebe, inset -20px -20px 60px #ffffff'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'typing': 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 20px -5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 40px -10px rgba(59, 130, 246, 0.8)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' }
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' }
        },
        'blink-caret': {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#3b82f6' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding'
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '16/10': '16 / 10'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Custom plugin for glassmorphism effect
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.25)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        '.neumorphism': {
          background: '#e0e0e0',
          'box-shadow': '20px 20px 60px #bebebe, -20px -20px 60px #ffffff'
        },
        '.neumorphism-inset': {
          background: '#e0e0e0',
          'box-shadow': 'inset 20px 20px 60px #bebebe, inset -20px -20px 60px #ffffff'
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        },
        '.bg-gradient-primary': {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        },
        '.bg-gradient-secondary': {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
        },
        '.bg-gradient-success': {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        },
        '.bg-gradient-warm': {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        }
      }
      addUtilities(newUtilities)
    }
  ]
}