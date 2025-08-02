import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for combining class names with proper Tailwind CSS merging
 * This function combines clsx for conditional classes with tailwind-merge for
 * intelligent Tailwind class deduplication and conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}