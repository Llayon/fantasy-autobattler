/**
 * Root Error Boundary for Fantasy Autobattler.
 * Wraps the entire application to catch and handle React errors.
 * 
 * @fileoverview Application-level error boundary with custom error reporting.
 */

'use client';

import { ErrorBoundary, ErrorPage, ToastContainer } from '@/components/ErrorStates';
import { ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Root error boundary props.
 */
interface RootErrorBoundaryProps {
  /** Children to wrap */
  children: ReactNode;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Root error boundary component that wraps the entire application.
 * Provides global error handling and toast notifications.
 * 
 * @param props - Root error boundary props
 * @returns Root error boundary component
 * @example
 * <RootErrorBoundary>
 *   <App />
 * </RootErrorBoundary>
 */
export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  /**
   * Handle application errors.
   * 
   * @param error - Error that occurred
   * @param errorInfo - Error information
   */
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      // In production, this would be sent to a logging service
      void error;
      void errorInfo;
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // reportError(error, errorInfo);
    }
  };
  
  /**
   * Custom error fallback component.
   * 
   * @param error - Error that occurred
   * @param _errorInfo - Error information (unused)
   * @param retry - Retry function
   * @returns Error fallback component
   */
  const errorFallback = (error: Error, _errorInfo: { componentStack: string }, retry: () => void) => {
    const isNetworkError = error.message.includes('fetch') || 
                          error.message.includes('network') ||
                          error.message.includes('Failed to fetch');
    
    return (
      <ErrorPage
        title={isNetworkError ? 'Проблема с подключением' : 'Ошибка приложения'}
        message={
          isNetworkError 
            ? 'Не удалось подключиться к серверу. Проверьте подключение к интернету.'
            : 'Произошла неожиданная ошибка в приложении.'
        }
        details={process.env.NODE_ENV === 'development' ? error.stack : undefined}
        showRetry
        onRetry={retry}
        showHome
        onHome={() => window.location.href = '/'}
        icon={isNetworkError ? '🌐' : '🐛'}
      />
    );
  };
  
  return (
    <>
      <ErrorBoundary
        fallback={errorFallback}
        onError={handleError}
      >
        {children}
      </ErrorBoundary>
      
      {/* Global toast container */}
      <ToastContainer />
    </>
  );
}

export default RootErrorBoundary;