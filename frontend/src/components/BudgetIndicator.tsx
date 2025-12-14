/**
 * Budget Indicator component for Fantasy Autobattler Team Builder.
 * Displays current budget usage with visual progress bar and color coding.
 * 
 * @fileoverview Interactive budget display with animated progress and status colors.
 */

'use client';

import { useMemo, useEffect, useState, useRef, memo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Budget display variants.
 */
export type BudgetVariant = 'bar' | 'compact';

/**
 * Budget status levels for color coding.
 */
type BudgetStatus = 'safe' | 'warning' | 'danger' | 'over';

/**
 * BudgetIndicator component props.
 */
interface BudgetIndicatorProps {
  /** Current budget used */
  current: number;
  /** Maximum budget allowed */
  max: number;
  /** Display variant */
  variant?: BudgetVariant;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Budget status thresholds (percentage-based) */
const BUDGET_THRESHOLDS = {
  SAFE: 50,      // Green: 0-50%
  WARNING: 80,   // Yellow: 50-80%
  DANGER: 100,   // Orange: 80-100%
  // Over 100% = Red + shake
} as const;

/** Status color configurations with exact hex colors */
const STATUS_COLORS = {
  safe: {
    bg: 'bg-green-900/20',
    border: 'border-green-500',
    text: 'text-green-300',
    progress: 'bg-green-500', // #22C55E
    progressHex: '#22C55E',
    glow: 'shadow-green-500/20',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500',
    text: 'text-yellow-300',
    progress: 'bg-yellow-500', // #EAB308
    progressHex: '#EAB308',
    glow: 'shadow-yellow-500/20',
  },
  danger: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-500',
    text: 'text-orange-300',
    progress: 'bg-orange-500', // #F97316
    progressHex: '#F97316',
    glow: 'shadow-orange-500/20',
  },
  over: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-300',
    progress: 'bg-red-500', // #EF4444
    progressHex: '#EF4444',
    glow: 'shadow-red-500/30',
  },
} as const;

/** Budget status icons */
const STATUS_ICONS = {
  safe: '💰',
  warning: '⚠️',
  danger: '🔥',
  over: '❌',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine budget status based on percentage usage.
 * 
 * @param current - Current budget used
 * @param max - Maximum budget allowed
 * @returns Budget status level
 * @example
 * getBudgetStatus(15, 30) // 'safe' (50%)
 * getBudgetStatus(20, 30) // 'warning' (67%)
 * getBudgetStatus(27, 30) // 'danger' (90%)
 * getBudgetStatus(35, 30) // 'over' (117%)
 */
function getBudgetStatus(current: number, max: number): BudgetStatus {
  const percentage = (current / max) * 100;
  
  if (percentage > BUDGET_THRESHOLDS.DANGER) return 'over';
  if (percentage >= BUDGET_THRESHOLDS.WARNING) return 'danger';
  if (percentage >= BUDGET_THRESHOLDS.SAFE) return 'warning';
  return 'safe';
}

/**
 * Calculate progress percentage for progress bar.
 * 
 * @param current - Current budget used
 * @param max - Maximum budget allowed
 * @returns Progress percentage (0-100, capped at 100)
 * @example
 * getProgressPercentage(15, 30) // 50
 * getProgressPercentage(35, 30) // 100 (capped)
 */
function getProgressPercentage(current: number, max: number): number {
  return Math.min((current / max) * 100, 100);
}

/**
 * Get remaining budget with proper handling of over-budget scenarios.
 * 
 * @param current - Current budget used
 * @param max - Maximum budget allowed
 * @returns Remaining budget (can be negative)
 * @example
 * getRemainingBudget(15, 30) // 15
 * getRemainingBudget(35, 30) // -5
 */
function getRemainingBudget(current: number, max: number): number {
  return max - current;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Animated number counter component.
 * Smoothly animates from old value to new value.
 */
interface AnimatedCounterProps {
  /** Target value to animate to */
  value: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Custom CSS classes */
  className?: string;
}

function AnimatedCounter({ value, duration = 300, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef(value);

  useEffect(() => {
    if (startValueRef.current === value) return;

    setIsAnimating(true);
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOut;
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, displayValue]);

  return (
    <span 
      className={`
        transition-all duration-200
        ${isAnimating ? 'scale-110' : 'scale-100'}
        ${className}
      `}
    >
      {displayValue}
    </span>
  );
}

/**
 * Progress bar component with animated fill.
 */
interface ProgressBarProps {
  percentage: number;
  status: BudgetStatus;
}

function ProgressBar({ percentage, status }: ProgressBarProps) {
  const colors = STATUS_COLORS[status];
  
  return (
    <div 
      className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Budget usage: ${percentage.toFixed(1)}%`}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-gray-700/50 rounded-full" />
      
      {/* Progress fill with smooth animation */}
      <div
        className={`
          h-full rounded-full transition-all duration-500 ease-out
          ${colors.progress}
        `}
        style={{ 
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: colors.progressHex,
        }}
      />
      
      {/* Overflow indicator for >100% */}
      {percentage > 100 && (
        <div
          className="absolute inset-0 bg-red-500/30 rounded-full animate-pulse"
        />
      )}
      
      {/* Glow effect for over-budget */}
      {status === 'over' && (
        <div
          className={`
            absolute inset-0 rounded-full blur-sm opacity-30 animate-pulse
            ${colors.progress}
          `}
        />
      )}
    </div>
  );
}

// =============================================================================
// VARIANT COMPONENTS
// =============================================================================

/**
 * Compact variant - shows only "current/max" for mobile headers.
 */
interface CompactVariantProps {
  current: number;
  max: number;
  status: BudgetStatus;
  className: string;
}

function CompactVariant({ current, max, status, className }: CompactVariantProps) {
  const colors = STATUS_COLORS[status];
  const percentage = Math.round((current / max) * 100);
  
  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs
        ${colors.bg} ${colors.border} border
        ${status === 'over' ? 'animate-shake' : ''}
        max-w-[80px] flex-shrink-0
        ${className}
      `}
      role="meter"
      aria-label={`Budget: ${current} of ${max} (${percentage}%)`}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {/* Status icon */}
      <span className="text-xs leading-none">{STATUS_ICONS[status]}</span>
      
      {/* Budget display with animated counter */}
      <span className={`font-bold text-xs leading-none ${colors.text} tabular-nums`}>
        <AnimatedCounter value={current} className="tabular-nums" />
        <span className="opacity-60">/{max}</span>
      </span>
    </div>
  );
}

/**
 * Bar variant - full progress bar with details.
 */
interface BarVariantProps {
  current: number;
  max: number;
  status: BudgetStatus;
  percentage: number;
  remaining: number;
  className: string;
}

function BarVariant({ current, max, status, percentage, remaining, className }: BarVariantProps) {
  const colors = STATUS_COLORS[status];
  
  return (
    <div
      className={`
        relative transition-all duration-300 ease-out p-3 rounded-lg
        ${colors.bg} ${colors.border} border
        ${status === 'over' ? 'animate-shake' : ''}
        ${className}
      `}
      role="meter"
      aria-label={`Team Budget: ${current} of ${max} (${Math.round(percentage)}%)`}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {/* Header with icon and budget display */}
      <div className="flex items-center gap-2 mb-2">
        {/* Status icon */}
        <div className="text-lg">
          {STATUS_ICONS[status]}
        </div>
        
        {/* Budget text with animated counter */}
        <div className="flex-1">
          <div className={`font-bold text-lg ${colors.text}`}>
            <AnimatedCounter value={current} className="tabular-nums" />
            <span className="opacity-60">/{max}</span>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`text-xs font-medium ${colors.text} opacity-90`}>
          {status === 'safe' && 'Safe'}
          {status === 'warning' && 'Warning'}
          {status === 'danger' && 'Danger'}
          {status === 'over' && 'Over'}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-1">
        <ProgressBar 
          percentage={percentage} 
          status={status}
        />
      </div>
      
      {/* Remaining budget display */}
      <div className={`text-xs ${colors.text} opacity-80`}>
        {remaining >= 0 ? (
          <span>Remaining: <strong>{remaining}</strong></span>
        ) : (
          <span className="text-red-300">Over: <strong>{Math.abs(remaining)}</strong></span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * BudgetIndicator component for displaying team budget status.
 * Supports two variants: 'compact' for mobile headers and 'bar' for full display.
 * 
 * @param props - Component props
 * @returns Budget indicator component
 * @example
 * // Compact variant for mobile header
 * <BudgetIndicator current={18} max={30} variant="compact" />
 * 
 * // Full bar variant with progress bar
 * <BudgetIndicator current={25} max={30} variant="bar" />
 */
const BudgetIndicator = memo(function BudgetIndicator({
  current,
  max,
  variant = 'bar',
  className = '',
}: BudgetIndicatorProps) {
  // Calculate derived values
  const status = useMemo(() => getBudgetStatus(current, max), [current, max]);
  const percentage = useMemo(() => getProgressPercentage(current, max), [current, max]);
  const remaining = useMemo(() => getRemainingBudget(current, max), [current, max]);
  
  // Render appropriate variant
  if (variant === 'compact') {
    return (
      <CompactVariant
        current={current}
        max={max}
        status={status}
        className={className}
      />
    );
  }
  
  return (
    <BarVariant
      current={current}
      max={max}
      status={status}
      percentage={percentage}
      remaining={remaining}
      className={className}
    />
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { BudgetIndicator };
export type { BudgetIndicatorProps, BudgetStatus };
export { getBudgetStatus, getProgressPercentage, getRemainingBudget, BUDGET_THRESHOLDS };