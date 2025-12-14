/**
 * Loading States components for Fantasy Autobattler.
 * Provides various loading indicators for different UI contexts.
 * 
 * @fileoverview Comprehensive loading states including spinners, skeletons, and overlays.
 */

'use client';

import { ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Spinner component props.
 */
interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color theme */
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton component props.
 */
interface SkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Shape of skeleton */
  shape?: 'rectangle' | 'circle' | 'text';
  /** Number of lines for text skeleton */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full page loader props.
 */
interface FullPageLoaderProps {
  /** Loading message */
  message?: string;
  /** Show backdrop */
  backdrop?: boolean;
  /** Custom icon */
  icon?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button loader props.
 */
interface ButtonLoaderProps {
  /** Whether button is loading */
  loading: boolean;
  /** Button content when not loading */
  children: ReactNode;
  /** Loading text */
  loadingText?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading overlay props.
 */
interface LoadingOverlayProps {
  /** Whether overlay is visible */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Children to wrap */
  children: ReactNode;
  /** Blur background */
  blur?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Spinner size configurations */
const SPINNER_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
} as const;

/** Spinner color configurations */
const SPINNER_COLORS = {
  primary: 'text-blue-500',
  secondary: 'text-gray-500',
  white: 'text-white',
  gray: 'text-gray-400',
} as const;

/** Button size configurations */
const BUTTON_SIZES = {
  sm: 'px-3 py-2 text-sm min-h-[44px]', // Ensure minimum touch target
  md: 'px-4 py-2 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]',
} as const;

/** Button variant configurations */
const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  success: 'bg-green-600 hover:bg-green-500 text-white',
} as const;

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Simple spinning loader component.
 * 
 * @param props - Spinner component props
 * @returns Spinner component
 * @example
 * <Spinner size="md" color="primary" />
 */
export function Spinner({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}: SpinnerProps) {
  const sizeClass = SPINNER_SIZES[size];
  const colorClass = SPINNER_COLORS[color];
  
  return (
    <div
      className={`
        ${sizeClass} ${colorClass} ${className}
        animate-spin inline-block
      `}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

/**
 * Skeleton placeholder component for content loading.
 * 
 * @param props - Skeleton component props
 * @returns Skeleton component
 * @example
 * <Skeleton width="100%" height="20px" shape="text" lines={3} />
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  shape = 'rectangle',
  lines = 1,
  className = ''
}: SkeletonProps) {
  const baseClasses = `
    bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700
    animate-pulse bg-[length:200%_100%]
    ${className}
  `;
  
  if (shape === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full`}
        style={{ width, height }}
        role="status"
        aria-label="Loading content"
      />
    );
  }
  
  if (shape === 'text' && lines > 1) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading content">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`${baseClasses} rounded`}
            style={{
              width: i === lines - 1 ? '75%' : width,
              height,
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={`${baseClasses} rounded`}
      style={{ width, height }}
      role="status"
      aria-label="Loading content"
    />
  );
}

/**
 * Full page loading overlay component.
 * 
 * @param props - Full page loader props
 * @returns Full page loader component
 * @example
 * <FullPageLoader message="Загрузка игры..." />
 */
export function FullPageLoader({
  message = 'Загрузка...',
  backdrop = true,
  icon = '⏳',
  className = ''
}: FullPageLoaderProps) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${backdrop ? 'bg-black/50 backdrop-blur-sm' : ''}
        ${className}
      `}
      role="status"
      aria-label={message}
    >
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Spinner size="md" color="primary" />
            <span className="text-xl font-medium text-white">{message}</span>
          </div>
          <div className="text-sm text-gray-400">
            Пожалуйста, подождите...
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Button with integrated loading state.
 * 
 * @param props - Button loader props
 * @returns Button with loading state
 * @example
 * <ButtonLoader loading={saving} loadingText="Сохранение...">
 *   Сохранить
 * </ButtonLoader>
 */
export function ButtonLoader({
  loading,
  children,
  loadingText,
  size = 'md',
  variant = 'primary',
  disabled = false,
  onClick,
  className = ''
}: ButtonLoaderProps) {
  const sizeClass = BUTTON_SIZES[size];
  const variantClass = BUTTON_VARIANTS[variant];
  const isDisabled = loading || disabled;
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${sizeClass} ${variantClass}
        rounded-lg font-medium transition-all duration-200
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        ${className}
      `}
      role="button"
      aria-label={loading ? loadingText || 'Loading' : undefined}
    >
      {loading && <Spinner size="sm" color="white" />}
      <span>{loading ? (loadingText || 'Загрузка...') : children}</span>
    </button>
  );
}

/**
 * Loading overlay for wrapping content areas.
 * 
 * @param props - Loading overlay props
 * @returns Loading overlay component
 * @example
 * <LoadingOverlay visible={loading} message="Загрузка команд...">
 *   <TeamList />
 * </LoadingOverlay>
 */
export function LoadingOverlay({
  visible,
  message = 'Загрузка...',
  children,
  blur = true
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      
      {visible && (
        <div
          className={`
            absolute inset-0 z-10 flex items-center justify-center
            bg-gray-900/80 rounded-lg
            ${blur ? 'backdrop-blur-sm' : ''}
          `}
          role="status"
          aria-label={message}
        >
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-3">
              <Spinner size="md" color="primary" />
              <span className="text-white font-medium">{message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Card skeleton for loading card-based content.
 * 
 * @param props - Card skeleton props
 * @returns Card skeleton component
 * @example
 * <CardSkeleton />
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" width="40px" height="40px" />
          <div className="flex-1">
            <Skeleton width="60%" height="16px" />
            <div className="mt-2">
              <Skeleton width="40%" height="12px" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <Skeleton shape="text" lines={3} height="14px" />
        
        {/* Footer */}
        <div className="flex justify-between items-center">
          <Skeleton width="80px" height="32px" />
          <Skeleton width="100px" height="32px" />
        </div>
      </div>
    </div>
  );
}

/**
 * List skeleton for loading list-based content.
 * 
 * @param props - List skeleton props
 * @returns List skeleton component
 * @example
 * <ListSkeleton items={5} />
 */
export function ListSkeleton({ 
  items = 3, 
  className = '' 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" width="32px" height="32px" />
            <div className="flex-1">
              <Skeleton width="70%" height="16px" />
              <div className="mt-2">
                <Skeleton width="50%" height="12px" />
              </div>
            </div>
            <Skeleton width="60px" height="24px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Grid skeleton for loading grid-based content.
 * 
 * @param props - Grid skeleton props
 * @returns Grid skeleton component
 * @example
 * <GridSkeleton cols={3} rows={2} />
 */
export function GridSkeleton({ 
  cols = 3, 
  rows = 2, 
  className = '' 
}: { 
  cols?: number; 
  rows?: number; 
  className?: string; 
}) {
  const totalItems = cols * rows;
  
  return (
    <div 
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: totalItems }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Inline loading component for small spaces.
 * 
 * @param props - Inline loading props
 * @returns Inline loading component
 * @example
 * <InlineLoading text="Сохранение..." />
 */
export function InlineLoading({ 
  text = 'Загрузка...', 
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
      <Spinner size="sm" color="gray" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * Pulsing dot indicator for subtle loading states.
 * 
 * @param props - Pulse dot props
 * @returns Pulse dot component
 * @example
 * <PulseDot color="green" />
 */
export function PulseDot({ 
  color = 'blue', 
  size = 'md',
  className = '' 
}: { 
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
  };
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]} ${colorClasses[color]}
        rounded-full animate-pulse
        ${className}
      `}
      role="status"
      aria-label="Loading indicator"
    />
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  Spinner,
  Skeleton,
  FullPageLoader,
  ButtonLoader,
  LoadingOverlay,
  CardSkeleton,
  ListSkeleton,
  GridSkeleton,
  InlineLoading,
  PulseDot,
};

export type {
  SpinnerProps,
  SkeletonProps,
  FullPageLoaderProps,
  ButtonLoaderProps,
  LoadingOverlayProps,
};