/**
 * AxeProvider component for accessibility testing.
 * Provides axe-core integration in development mode.
 * 
 * @fileoverview React provider for axe-core accessibility testing.
 */

'use client';

import { useEffect } from 'react';
import { setupAxeCore } from '@/lib/axe-config';

// =============================================================================
// TYPES
// =============================================================================

/**
 * AxeProvider component props.
 */
interface AxeProviderProps {
  /** Child components */
  children: React.ReactNode;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AxeProvider component for accessibility testing setup.
 * Initializes axe-core in development mode for automated accessibility checking.
 * 
 * @param props - Component props
 * @returns Provider component
 * @example
 * // Wrap app in layout.tsx
 * <AxeProvider>
 *   <App />
 * </AxeProvider>
 */
export function AxeProvider({ children }: AxeProviderProps) {
  useEffect(() => {
    // Only run in development mode and client-side
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setupAxeCore();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Return undefined for non-development environments
    return undefined;
  }, []);

  return <>{children}</>;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { AxeProviderProps };