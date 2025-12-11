/**
 * Budget Indicator component for Fantasy Autobattler Team Builder.
 * Displays current budget usage with visual progress bar and color coding.
 * 
 * @fileoverview Interactive budget display with animated progress and status colors.
 */

'use client';

import { useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

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
  /** Custom CSS classes */
  className?: string;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Budget status thresholds */
const BUDGET_THRESHOLDS = {
  SAFE: 20,      // Green: < 20
  WARNING: 27,   // Yellow: 20-27
  DANGER: 30,    // Red: 28-30
} as const;

/** Status color configurations */
const STATUS_COLORS = {
  safe: {
    bg: 'bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-300',
    progress: 'bg-green-500',
    glow: 'shadow-green-500/20',
  },
  warning: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500',
    text: 'text-yellow-300',
    progress: 'bg-yellow-500',
    glow: 'shadow-yellow-500/20',
  },
  danger: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-300',
    progress: 'bg-red-500',
    glow: 'shadow-red-500/20',
  },
  over: {
    bg: 'bg-red-900/50',
    border: 'border-red-400',
    text: 'text-red-200',
    progress: 'bg-red-400',
    glow: 'shadow-red-400/30',
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
 * Determine budget status based on current usage.
 * 
 * @param current - Current budget used
 * @param max - Maximum budget allowed
 * @returns Budget status level
 * @example
 * getBudgetStatus(15, 30) // 'safe'
 * getBudgetStatus(25, 30) // 'warning'
 * getBudgetStatus(29, 30) // 'danger'
 * getBudgetStatus(35, 30) // 'over'
 */
function getBudgetStatus(current: number, max: number): BudgetStatus {
  if (current > max) return 'over';
  if (current >= BUDGET_THRESHOLDS.DANGER) return 'danger';
  if (current >= BUDGET_THRESHOLDS.WARNING) return 'warning';
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
 * Progress bar component with animated fill.
 */
interface ProgressBarProps {
  percentage: number;
  status: BudgetStatus;
  animated?: boolean;
}

function ProgressBar({ percentage, status, animated = true }: ProgressBarProps) {
  const colors = STATUS_COLORS[status];
  
  return (
    <div 
      className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Budget usage: ${percentage.toFixed(1)}%`}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-gray-700/50 rounded-full" />
      
      {/* Progress fill */}
      <div
        className={`
          h-full rounded-full transition-all duration-500 ease-out
          ${colors.progress}
          ${animated ? 'animate-pulse' : ''}
          ${status === 'over' ? 'animate-pulse' : ''}
        `}
        style={{ width: `${percentage}%` }}
      />
      
      {/* Glow effect for over-budget */}
      {status === 'over' && (
        <div
          className={`
            absolute inset-0 rounded-full blur-sm opacity-50
            ${colors.progress}
          `}
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  );
}

/**
 * Budget details component showing breakdown.
 */
interface BudgetDetailsProps {
  current: number;
  max: number;
  remaining: number;
  status: BudgetStatus;
}

function BudgetDetails({ current, remaining, status }: Omit<BudgetDetailsProps, 'max'>) {
  const colors = STATUS_COLORS[status];
  
  return (
    <div className="flex items-center justify-between text-xs mt-1">
      <span className={`${colors.text} opacity-80`}>
        Used: {current}
      </span>
      
      <span className={`${colors.text} opacity-80`}>
        {remaining >= 0 ? `Remaining: ${remaining}` : `Over: ${Math.abs(remaining)}`}
      </span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * BudgetIndicator component for displaying team budget status.
 * Shows current/max budget with color-coded progress bar and animations.
 * 
 * @param props - Component props
 * @returns Budget indicator component
 * @example
 * <BudgetIndicator current={18} max={30} />
 * <BudgetIndicator current={25} max={30} showDetails />
 * <BudgetIndicator current={32} max={30} compact />
 */
export function BudgetIndicator({
  current,
  max,
  className = '',
  showDetails = false,
  compact = false,
}: BudgetIndicatorProps) {
  // Calculate derived values
  const status = useMemo(() => getBudgetStatus(current, max), [current, max]);
  const percentage = useMemo(() => getProgressPercentage(current, max), [current, max]);
  const remaining = useMemo(() => getRemainingBudget(current, max), [current, max]);
  
  const colors = STATUS_COLORS[status];
  const icon = STATUS_ICONS[status];
  
  return (
    <div
      className={`
        relative transition-all duration-300 ease-out
        ${compact ? 'p-2' : 'p-4'}
        ${colors.bg} ${colors.border} border-2 rounded-lg
        ${colors.glow} shadow-lg
        ${status === 'over' ? 'animate-pulse' : ''}
        ${className}
      `}
      role="region"
      aria-label="Team Budget Indicator"
      aria-describedby={`budget-status-${status}`}
    >
      {/* Header with icon and budget display */}
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className="text-2xl">
          {icon}
        </div>
        
        {/* Budget text */}
        <div className="flex-1">
          <div 
            className={`font-bold ${compact ? 'text-lg' : 'text-2xl'} ${colors.text}`}
            aria-label={`Current budget: ${current} out of ${max} points`}
          >
            {current}/{max}
          </div>
          
          {!compact && (
            <div className={`text-xs ${colors.text} opacity-80`}>
              Team Budget
            </div>
          )}
        </div>
        
        {/* Status indicator */}
        {!compact && (
          <div 
            id={`budget-status-${status}`}
            className={`text-xs font-medium ${colors.text} opacity-90`}
            aria-live="polite"
          >
            {status === 'safe' && 'Safe'}
            {status === 'warning' && 'Warning'}
            {status === 'danger' && 'Danger'}
            {status === 'over' && 'Over Budget'}
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className={`${compact ? 'mt-2' : 'mt-3'}`}>
        <ProgressBar 
          percentage={percentage} 
          status={status}
          animated={status === 'over'}
        />
      </div>
      
      {/* Detailed breakdown */}
      {showDetails && !compact && (
        <BudgetDetails
          current={current}
          remaining={remaining}
          status={status}
        />
      )}
      
      {/* Over-budget warning */}
      {status === 'over' && (
        <div className={`
          mt-2 text-xs font-medium ${colors.text}
          ${compact ? 'text-center' : ''}
        `}>
          {compact ? `Over by ${Math.abs(remaining)}` : `Team exceeds budget by ${Math.abs(remaining)} points`}
        </div>
      )}
      
      {/* Compact remaining display */}
      {compact && status !== 'over' && (
        <div className={`mt-1 text-xs ${colors.text} opacity-80 text-center`}>
          {remaining} remaining
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { BudgetIndicatorProps, BudgetStatus };
export { getBudgetStatus, getProgressPercentage, getRemainingBudget, BUDGET_THRESHOLDS };