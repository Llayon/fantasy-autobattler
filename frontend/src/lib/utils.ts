/**
 * Utility functions for Frontend components.
 * Common helper functions used across the application.
 * 
 * @fileoverview Shared utility functions for UI components.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge.
 * Merges Tailwind CSS classes intelligently, removing conflicts.
 * 
 * @param inputs - Class values to combine
 * @returns Merged class string
 * @example
 * cn('px-2 py-1', 'px-4', 'text-red-500') // 'py-1 px-4 text-red-500'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with appropriate suffixes (K, M, B).
 * 
 * @param num - Number to format
 * @returns Formatted string
 * @example
 * formatNumber(1234) // '1.2K'
 * formatNumber(1234567) // '1.2M'
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Capitalizes the first letter of a string.
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 * @example
 * capitalize('hello world') // 'Hello world'
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates text to specified length with ellipsis.
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 * @example
 * truncate('This is a long text', 10) // 'This is a...'
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounces a function call.
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * @example
 * const debouncedSearch = debounce(search, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generates a random ID string.
 * 
 * @param length - Length of the ID
 * @returns Random ID string
 * @example
 * generateId(8) // 'a1b2c3d4'
 */
export function generateId(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}