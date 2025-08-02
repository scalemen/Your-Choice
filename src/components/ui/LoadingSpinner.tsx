import React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border-[1px]',
        sm: 'h-4 w-4 border-[1px]',
        base: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-2',
        '2xl': 'h-16 w-16 border-[3px]',
      },
      variant: {
        default: 'border-gray-200 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400',
        primary: 'border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400',
        secondary: 'border-secondary-200 border-t-secondary-600 dark:border-secondary-800 dark:border-t-secondary-400',
        white: 'border-white/20 border-t-white',
        accent: 'border-accent-200 border-t-accent-600 dark:border-accent-800 dark:border-t-accent-400',
      },
    },
    defaultVariants: {
      size: 'base',
      variant: 'default',
    },
  }
)

const dotVariants = cva(
  'flex space-x-1',
  {
    variants: {
      size: {
        xs: 'space-x-0.5',
        sm: 'space-x-1',
        base: 'space-x-1',
        lg: 'space-x-1.5',
        xl: 'space-x-2',
        '2xl': 'space-x-2',
      },
    },
    defaultVariants: {
      size: 'base',
    },
  }
)

const dotSizeMap = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  base: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
  xl: 'h-3 w-3',
  '2xl': 'h-4 w-4',
}

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  type?: 'spinner' | 'dots' | 'pulse' | 'bars'
  label?: string
  showLabel?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    size = 'base', 
    variant = 'default', 
    type = 'spinner',
    label = 'Loading...',
    showLabel = false,
    ...props 
  }, ref) => {
    const renderSpinner = () => {
      switch (type) {
        case 'dots':
          return (
            <div className={cn(dotVariants({ size }))}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'rounded-full bg-current',
                    dotSizeMap[size as keyof typeof dotSizeMap],
                    variant === 'white' ? 'text-white' : 'text-primary-600 dark:text-primary-400'
                  )}
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )

        case 'pulse':
          return (
            <motion.div
              className={cn(
                'rounded-full',
                size === 'xs' && 'h-3 w-3',
                size === 'sm' && 'h-4 w-4',
                size === 'base' && 'h-6 w-6',
                size === 'lg' && 'h-8 w-8',
                size === 'xl' && 'h-12 w-12',
                size === '2xl' && 'h-16 w-16',
                variant === 'white' 
                  ? 'bg-white' 
                  : 'bg-primary-600 dark:bg-primary-400'
              )}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          )

        case 'bars':
          return (
            <div className={cn(dotVariants({ size }))}>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'rounded-sm bg-current',
                    size === 'xs' && 'w-0.5 h-3',
                    size === 'sm' && 'w-0.5 h-4',
                    size === 'base' && 'w-1 h-6',
                    size === 'lg' && 'w-1 h-8',
                    size === 'xl' && 'w-1.5 h-12',
                    size === '2xl' && 'w-2 h-16',
                    variant === 'white' ? 'text-white' : 'text-primary-600 dark:text-primary-400'
                  )}
                  animate={{
                    scaleY: [1, 0.4, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )

        default:
          return (
            <div
              className={cn(spinnerVariants({ size, variant }), className)}
              role="status"
              aria-label={label}
            />
          )
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          showLabel && 'flex-col space-y-2',
          className
        )}
        {...props}
      >
        {renderSpinner()}
        {showLabel && (
          <span 
            className={cn(
              'text-sm font-medium',
              variant === 'white' 
                ? 'text-white' 
                : 'text-gray-600 dark:text-gray-300'
            )}
          >
            {label}
          </span>
        )}
        {type === 'spinner' && (
          <span className="sr-only">{label}</span>
        )}
      </div>
    )
  }
)

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner

// Additional utility components
export const LoadingOverlay: React.FC<{
  isLoading: boolean
  children: React.ReactNode
  className?: string
  spinnerProps?: LoadingSpinnerProps
}> = ({ isLoading, children, className, spinnerProps = {} }) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingSpinner {...spinnerProps} />
      </div>
    </div>
  )
}

export const LoadingButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean
    loadingText?: string
    spinnerProps?: LoadingSpinnerProps
  }
> = ({ 
  isLoading = false, 
  loadingText = 'Loading...', 
  children, 
  disabled,
  className,
  spinnerProps = {},
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center space-x-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          variant="white"
          {...spinnerProps} 
        />
      )}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  )
}

export const LoadingCard: React.FC<{
  isLoading: boolean
  className?: string
  children?: React.ReactNode
  spinnerProps?: LoadingSpinnerProps
}> = ({ isLoading, className, children, spinnerProps = {} }) => {
  if (!isLoading && children) return <>{children}</>

  return (
    <div className={cn(
      'flex items-center justify-center p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
      className
    )}>
      <LoadingSpinner showLabel {...spinnerProps} />
    </div>
  )
}