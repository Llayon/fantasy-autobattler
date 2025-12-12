/**
 * Error States components for Fantasy Autobattler.
 * Provides comprehensive error handling UI components.
 * 
 * @fileoverview Complete error handling system with inline errors, full-page errors, toasts, and boundaries.
 */

'use client';

import { ReactNode, Component, ErrorInfo, useState, useEffect, useCallback } from 'react';
import { ButtonLoader } from '@/components/LoadingStates';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Error severity levels.
 */
type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Error message component props.
 */
interface ErrorMessageProps {
  /** Error message text */
  message: string;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Optional error details */
  details?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error page component props.
 */
interface ErrorPageProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Error details */
  details?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Show home button */
  showHome?: boolean;
  /** Home callback */
  onHome?: () => void;
  /** Custom icon */
  icon?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toast notification props.
 */
interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Auto-dismiss duration in ms */
  duration?: number;
  /** Show close button */
  showClose?: boolean;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Network error component props.
 */
interface NetworkErrorProps {
  /** Error message */
  message?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Show offline indicator */
  showOffline?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error boundary state.
 */
interface ErrorBoundaryState {
  /** Whether error occurred */
  hasError: boolean;
  /** Error object */
  error: Error | null;
  /** Error info */
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary props.
 */
interface ErrorBoundaryProps {
  /** Children to wrap */
  children: ReactNode;
  /** Fallback component */
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Toast manager state.
 */
interface Toast {
  /** Unique ID */
  id: string;
  /** Toast message */
  message: string;
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Auto-dismiss duration */
  duration?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Error severity configurations */
const ERROR_SEVERITY_CONFIG = {
  info: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-400/50',
    icon: 'ℹ️',
  },
  warning: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-400/50',
    icon: '⚠️',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-400/50',
    icon: '❌',
  },
  critical: {
    color: 'text-red-300',
    bgColor: 'bg-red-900/50',
    borderColor: 'border-red-300',
    icon: '🚨',
  },
} as const;

/** Toast type configurations */
const TOAST_TYPE_CONFIG = {
  success: {
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-400/50',
    icon: '✅',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-400/50',
    icon: '❌',
  },
  warning: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-400/50',
    icon: '⚠️',
  },
  info: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-400/50',
    icon: 'ℹ️',
  },
} as const;

/** Default toast duration */
const DEFAULT_TOAST_DURATION = 5000;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique ID for toasts.
 * 
 * @returns Unique string ID
 * @example
 * const id = generateId();
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Check if error is a network error.
 * 
 * @param error - Error to check
 * @returns True if network error
 * @example
 * const isNetwork = isNetworkError(error);
 */
function isNetworkError(error: Error): boolean {
  return error.message.includes('fetch') || 
         error.message.includes('network') ||
         error.message.includes('Failed to fetch') ||
         error.name === 'NetworkError';
}

/**
 * Get user-friendly error message.
 * 
 * @param error - Error object
 * @returns User-friendly message
 * @example
 * const message = getErrorMessage(error);
 */
function getErrorMessage(error: Error): string {
  if (isNetworkError(error)) {
    return 'Проблема с подключением к серверу';
  }
  
  // Common API errors
  if (error.message.includes('404')) {
    return 'Запрашиваемые данные не найдены';
  }
  
  if (error.message.includes('500')) {
    return 'Внутренняя ошибка сервера';
  }
  
  if (error.message.includes('401') || error.message.includes('403')) {
    return 'Ошибка авторизации';
  }
  
  return error.message || 'Произошла неизвестная ошибка';
}

// =============================================================================
// TOAST MANAGER
// =============================================================================

/** Global toast state */
const toastState: {
  toasts: Toast[];
  listeners: Array<(toasts: Toast[]) => void>;
} = {
  toasts: [],
  listeners: [],
};

/**
 * Toast manager for global toast notifications.
 */
export const toastManager = {
  /**
   * Show a toast notification.
   * 
   * @param message - Toast message
   * @param type - Toast type
   * @param duration - Auto-dismiss duration
   * @returns Toast ID
   * @example
   * toastManager.show('Success!', 'success');
   */
  show: (message: string, type: Toast['type'] = 'info', duration = DEFAULT_TOAST_DURATION): string => {
    const id = generateId();
    const toast: Toast = { id, message, type, duration };
    
    toastState.toasts.push(toast);
    toastState.listeners.forEach(listener => listener(toastState.toasts));
    
    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        toastManager.dismiss(id);
      }, duration);
    }
    
    return id;
  },
  
  /**
   * Dismiss a toast by ID.
   * 
   * @param id - Toast ID to dismiss
   * @example
   * toastManager.dismiss(toastId);
   */
  dismiss: (id: string): void => {
    toastState.toasts = toastState.toasts.filter(toast => toast.id !== id);
    toastState.listeners.forEach(listener => listener(toastState.toasts));
  },
  
  /**
   * Clear all toasts.
   * 
   * @example
   * toastManager.clear();
   */
  clear: (): void => {
    toastState.toasts = [];
    toastState.listeners.forEach(listener => listener(toastState.toasts));
  },
  
  /**
   * Subscribe to toast changes.
   * 
   * @param listener - Callback for toast changes
   * @returns Unsubscribe function
   * @example
   * const unsubscribe = toastManager.subscribe(setToasts);
   */
  subscribe: (listener: (toasts: Toast[]) => void): (() => void) => {
    toastState.listeners.push(listener);
    return () => {
      toastState.listeners = toastState.listeners.filter(l => l !== listener);
    };
  },
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Inline error message component.
 * 
 * @param props - Error message props
 * @returns Error message component
 * @example
 * <ErrorMessage 
 *   message="Failed to load data" 
 *   severity="error" 
 *   showRetry 
 *   onRetry={handleRetry} 
 * />
 */
export function ErrorMessage({
  message,
  severity = 'error',
  details,
  showRetry = false,
  onRetry,
  onDismiss,
  className = ''
}: ErrorMessageProps) {
  const config = ERROR_SEVERITY_CONFIG[severity];
  
  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${className}
        border-2 rounded-lg p-4
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{config.icon}</div>
        
        <div className="flex-1">
          <div className={`font-medium ${config.color} mb-1`}>
            {message}
          </div>
          
          {details && (
            <div className="text-sm text-gray-400 mb-3">
              {details}
            </div>
          )}
          
          {(showRetry || onDismiss) && (
            <div className="flex gap-2">
              {showRetry && onRetry && (
                <ButtonLoader
                  loading={false}
                  onClick={onRetry}
                  variant="primary"
                  size="sm"
                >
                  🔄 Повторить
                </ButtonLoader>
              )}
              
              {onDismiss && (
                <ButtonLoader
                  loading={false}
                  onClick={onDismiss}
                  variant="secondary"
                  size="sm"
                >
                  Закрыть
                </ButtonLoader>
              )}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Закрыть"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Full-page error component.
 * 
 * @param props - Error page props
 * @returns Error page component
 * @example
 * <ErrorPage 
 *   title="Ошибка загрузки" 
 *   message="Не удалось загрузить данные" 
 *   showRetry 
 *   onRetry={handleRetry} 
 * />
 */
export function ErrorPage({
  title = 'Произошла ошибка',
  message,
  details,
  showRetry = true,
  onRetry,
  showHome = true,
  onHome,
  icon = '💥',
  className = ''
}: ErrorPageProps) {
  const handleHome = useCallback(() => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  }, [onHome]);
  
  return (
    <div
      className={`
        min-h-screen bg-gray-900 text-white flex items-center justify-center p-6
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">{icon}</div>
        
        <h1 className="text-3xl font-bold text-red-400 mb-4">
          {title}
        </h1>
        
        <p className="text-xl text-gray-300 mb-4">
          {message}
        </p>
        
        {details && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm text-gray-400 font-mono">
              {details}
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && onRetry && (
            <ButtonLoader
              loading={false}
              onClick={onRetry}
              variant="primary"
              size="lg"
            >
              🔄 Попробовать снова
            </ButtonLoader>
          )}
          
          {showHome && (
            <ButtonLoader
              loading={false}
              onClick={handleHome}
              variant="secondary"
              size="lg"
            >
              🏠 На главную
            </ButtonLoader>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          Если проблема повторяется, попробуйте обновить страницу
        </div>
      </div>
    </div>
  );
}

/**
 * Toast notification component.
 * 
 * @param props - Toast props
 * @returns Toast component
 * @example
 * <Toast message="Success!" type="success" onDismiss={handleDismiss} />
 */
export function Toast({
  message,
  type = 'info',
  duration = DEFAULT_TOAST_DURATION,
  showClose = true,
  onDismiss,
  className = ''
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = TOAST_TYPE_CONFIG[type];
  
  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300); // Wait for animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
    
    // Return empty cleanup function for other code paths
    return () => {};
  }, [duration, onDismiss]);
  
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  }, [onDismiss]);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${className}
        border-2 rounded-lg p-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="text-xl">{config.icon}</div>
        
        <div className={`flex-1 font-medium ${config.color}`}>
          {message}
        </div>
        
        {showClose && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Закрыть"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Network error component with offline detection.
 * 
 * @param props - Network error props
 * @returns Network error component
 * @example
 * <NetworkError message="Connection failed" showRetry onRetry={handleRetry} />
 */
export function NetworkError({
  message = 'Проблема с подключением к серверу',
  showRetry = true,
  onRetry,
  showOffline = true,
  className = ''
}: NetworkErrorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const displayMessage = !isOnline && showOffline 
    ? 'Отсутствует подключение к интернету'
    : message;
  
  const icon = !isOnline ? '📡' : '🌐';
  
  return (
    <div
      className={`
        bg-orange-900/30 border-2 border-orange-400/50 rounded-lg p-6 text-center
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="text-6xl mb-4">{icon}</div>
      
      <h3 className="text-xl font-bold text-orange-400 mb-2">
        Проблема с сетью
      </h3>
      
      <p className="text-gray-300 mb-4">
        {displayMessage}
      </p>
      
      {!isOnline && showOffline && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-400">
            💡 Проверьте подключение к интернету и попробуйте снова
          </div>
        </div>
      )}
      
      {showRetry && onRetry && (
        <ButtonLoader
          loading={false}
          onClick={onRetry}
          variant="primary"
          size="lg"
          disabled={!isOnline && showOffline}
        >
          🔄 Повторить попытку
        </ButtonLoader>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        {isOnline ? 'Подключение к интернету: ✅' : 'Подключение к интернету: ❌'}
      </div>
    </div>
  );
}

/**
 * Toast container component for displaying multiple toasts.
 * 
 * @returns Toast container component
 * @example
 * <ToastContainer />
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);
  
  if (toasts.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={0} // Managed by toast manager
          onDismiss={() => toastManager.dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * React Error Boundary component.
 * Catches JavaScript errors in component tree and displays fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  
  /**
   * Update state when error occurs.
   * 
   * @param error - Error that occurred
   * @returns Updated state
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }
  
  /**
   * Handle component error.
   * 
   * @param error - Error that occurred
   * @param errorInfo - Error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // Call error callback
    this.props.onError?.(error, errorInfo);
    
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }
  
  /**
   * Reset error state.
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo || {} as ErrorInfo,
          this.handleRetry
        );
      }
      
      // Default fallback
      return (
        <ErrorPage
          title="Ошибка приложения"
          message={getErrorMessage(this.state.error)}
          details={this.state.error.stack}
          showRetry
          onRetry={this.handleRetry}
          icon="🐛"
        />
      );
    }
    
    return this.props.children;
  }
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for showing toast notifications.
 * 
 * @returns Toast functions
 * @example
 * const { showSuccess, showError } = useToast();
 * showSuccess('Operation completed!');
 */
export function useToast() {
  return {
    showSuccess: (message: string) => toastManager.show(message, 'success'),
    showError: (message: string) => toastManager.show(message, 'error'),
    showWarning: (message: string) => toastManager.show(message, 'warning'),
    showInfo: (message: string) => toastManager.show(message, 'info'),
    dismiss: toastManager.dismiss,
    clear: toastManager.clear,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  ErrorMessage,
  ErrorPage,
  Toast,
  NetworkError,
  ToastContainer,
  ErrorBoundary,
  toastManager,
  useToast,
};

export type {
  ErrorMessageProps,
  ErrorPageProps,
  ToastProps,
  NetworkErrorProps,
  ErrorBoundaryProps,
  ErrorSeverity,
};