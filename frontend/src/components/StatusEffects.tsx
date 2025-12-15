/**
 * StatusEffects Component for Fantasy Autobattler.
 * Displays buff/debuff indicators with color coding, duration, and tooltips.
 * 
 * @fileoverview Status effect indicators for battle units with comprehensive visual feedback.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Status effect data structure for UI display.
 */
export interface StatusEffectData {
  /** Unique effect instance ID */
  id: string;
  /** Effect type identifier */
  type: string;
  /** Display name of the effect */
  name: string;
  /** Effect description */
  description: string;
  /** Remaining duration in turns */
  remainingDuration: number;
  /** Current stack count */
  stacks: number;
  /** Whether this is a positive (buff) or negative (debuff) effect */
  isPositive: boolean;
  /** Source ability that created this effect */
  sourceAbility?: string;
  /** Source unit that applied this effect */
  sourceUnit?: string;
}

/**
 * StatusEffects component props.
 */
export interface StatusEffectsProps {
  /** Array of status effects to display */
  effects: StatusEffectData[];
  /** Size variant for effect icons */
  size?: 'sm' | 'md' | 'lg';
  /** Maximum number of effects to display */
  maxEffects?: number;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether to show tooltips */
  showTooltips?: boolean;
  /** Whether to show duration counters */
  showDuration?: boolean;
  /** Whether to show stack counts */
  showStacks?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Position relative to unit */
  position?: 'above' | 'below' | 'left' | 'right';
}

/**
 * Individual status effect icon props.
 */
export interface StatusEffectIconProps {
  /** Effect data to display */
  effect: StatusEffectData;
  /** Size variant */
  size: 'sm' | 'md' | 'lg';
  /** Whether to show tooltip */
  showTooltip: boolean;
  /** Whether to show duration */
  showDuration: boolean;
  /** Whether to show stacks */
  showStacks: boolean;
}

// =============================================================================
// EFFECT ICON MAPPING
// =============================================================================

/**
 * Maps effect types to emoji icons and colors.
 */
const EFFECT_ICONS: Record<string, { icon: string; color: string }> = {
  // Buffs (positive effects)
  buff: { icon: '⬆️', color: 'green' },
  heal: { icon: '💚', color: 'green' },
  hot: { icon: '💖', color: 'green' },
  shield: { icon: '🛡️', color: 'blue' },
  taunt: { icon: '🗣️', color: 'blue' },
  
  // Debuffs (negative effects)
  debuff: { icon: '⬇️', color: 'red' },
  damage: { icon: '💥', color: 'red' },
  dot: { icon: '🔥', color: 'red' },
  stun: { icon: '💫', color: 'red' },
  
  // Neutral effects
  cleanse: { icon: '✨', color: 'yellow' },
  dispel: { icon: '🌟', color: 'yellow' },
  
  // Default fallback
  default: { icon: '❓', color: 'gray' },
};

/**
 * Size configuration for different effect variants.
 */
const SIZE_CONFIG = {
  sm: {
    container: 'w-6 h-6',
    icon: 'text-xs',
    duration: 'text-xs',
    stacks: 'text-xs',
  },
  md: {
    container: 'w-8 h-8',
    icon: 'text-sm',
    duration: 'text-xs',
    stacks: 'text-xs',
  },
  lg: {
    container: 'w-10 h-10',
    icon: 'text-base',
    duration: 'text-sm',
    stacks: 'text-sm',
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get icon and color for an effect type.
 * 
 * @param effectType - Effect type identifier
 * @param isPositive - Whether the effect is positive
 * @returns Icon emoji and color scheme
 * @example
 * const { icon, color } = getEffectIcon('buff', true); // { icon: '⬆️', color: 'green' }
 */
function getEffectIcon(effectType: string, isPositive: boolean): { icon: string; color: string } {
  const effectConfig = EFFECT_ICONS[effectType] || EFFECT_ICONS['default'];
  
  if (!effectConfig) {
    return { icon: '❓', color: isPositive ? 'green' : 'red' };
  }
  
  // Override color based on positive/negative if not explicitly set
  if (effectConfig.color === 'gray') {
    return {
      icon: effectConfig.icon,
      color: isPositive ? 'green' : 'red',
    };
  }
  
  return effectConfig;
}

/**
 * Get CSS classes for effect styling based on color and state.
 * 
 * @param color - Color scheme (green, red, blue, yellow, gray)
 * @param isPositive - Whether effect is positive
 * @returns CSS class string
 * @example
 * const classes = getEffectClasses('green', true);
 */
function getEffectClasses(color: string): string {
  const baseClasses = 'relative flex items-center justify-center rounded-full border-2 transition-all duration-200';
  
  switch (color) {
    case 'green':
      return cn(baseClasses, 'bg-green-100 border-green-400 text-green-700');
    case 'red':
      return cn(baseClasses, 'bg-red-100 border-red-400 text-red-700');
    case 'blue':
      return cn(baseClasses, 'bg-blue-100 border-blue-400 text-blue-700');
    case 'yellow':
      return cn(baseClasses, 'bg-yellow-100 border-yellow-400 text-yellow-700');
    case 'gray':
    default:
      return cn(baseClasses, 'bg-gray-100 border-gray-400 text-gray-700');
  }
}

/**
 * Get tooltip content for a status effect.
 * 
 * @param effect - Status effect data
 * @returns Formatted tooltip content
 * @example
 * const tooltip = getTooltipContent(buffEffect);
 */
function getTooltipContent(effect: StatusEffectData): string {
  let content = `${effect.name}\n${effect.description}`;
  
  if (effect.remainingDuration > 0) {
    const turns = effect.remainingDuration === 1 ? 'ход' : 'хода';
    content += `\n\nДлительность: ${effect.remainingDuration} ${turns}`;
  }
  
  if (effect.stacks > 1) {
    content += `\nСтаки: ${effect.stacks}`;
  }
  
  if (effect.sourceAbility) {
    content += `\nИсточник: ${effect.sourceAbility}`;
  }
  
  return content;
}

// =============================================================================
// STATUS EFFECT ICON COMPONENT
// =============================================================================

/**
 * Individual status effect icon with tooltip and indicators.
 * 
 * @param props - Component props
 * @returns JSX element
 */
function StatusEffectIcon({
  effect,
  size,
  showTooltip,
  showDuration,
  showStacks,
}: StatusEffectIconProps): JSX.Element {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const sizeConfig = SIZE_CONFIG[size];
  const { icon, color } = getEffectIcon(effect.type, effect.isPositive);
  const effectClasses = getEffectClasses(color);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);
  
  /**
   * Handle mouse enter for tooltip (desktop).
   */
  const handleMouseEnter = (): void => {
    if (showTooltip) {
      setShowTooltipState(true);
    }
  };
  
  /**
   * Handle mouse leave for tooltip (desktop).
   */
  const handleMouseLeave = (): void => {
    setShowTooltipState(false);
  };
  
  /**
   * Handle touch start for long press tooltip (mobile).
   */
  const handleTouchStart = (): void => {
    if (!showTooltip) return;
    
    const timer = setTimeout(() => {
      setShowTooltipState(true);
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };
  
  /**
   * Handle touch end to clear long press timer.
   */
  const handleTouchEnd = (): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  /**
   * Handle touch move to cancel long press if finger moves.
   */
  const handleTouchMove = (): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  return (
    <div className="relative">
      {/* Effect Icon */}
      <div
        className={cn(
          sizeConfig.container,
          effectClasses
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        role="img"
        aria-label={`${effect.name}: ${effect.description}`}
      >
        {/* Icon Emoji */}
        <span className={cn('select-none', sizeConfig.icon)} aria-hidden="true">
          {icon}
        </span>
        
        {/* Duration Counter */}
        {showDuration && effect.remainingDuration > 0 && (
          <div className={cn(
            'absolute -bottom-1 -right-1 bg-gray-800 text-white rounded-full min-w-4 h-4 flex items-center justify-center font-bold',
            sizeConfig.duration
          )}>
            {effect.remainingDuration}
          </div>
        )}
        
        {/* Stack Counter */}
        {showStacks && effect.stacks > 1 && (
          <div className={cn(
            'absolute -top-1 -right-1 bg-blue-600 text-white rounded-full min-w-4 h-4 flex items-center justify-center font-bold',
            sizeConfig.stacks
          )}>
            {effect.stacks}
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div 
            id={`status-tooltip-${effect.id}`}
            className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs whitespace-pre-line"
            role="tooltip"
            onClick={(e) => e.stopPropagation()}
          >
            {getTooltipContent(effect)}
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            
            {/* Close button for mobile */}
            <button
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xs text-white md:hidden"
              onClick={() => setShowTooltipState(false)}
              aria-label="Закрыть подсказку"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * StatusEffects component for displaying unit status effects.
 * Shows buff/debuff icons with color coding, duration, and tooltips.
 * 
 * @param props - Component props
 * @returns JSX element
 * @example
 * <StatusEffects
 *   effects={unitEffects}
 *   size="md"
 *   position="above"
 *   showTooltips={true}
 *   showDuration={true}
 * />
 */
export function StatusEffects({
  effects,
  size = 'md',
  maxEffects = 6,
  orientation = 'horizontal',
  showTooltips = true,
  showDuration = true,
  showStacks = true,
  className,
  position = 'above',
}: StatusEffectsProps): JSX.Element | null {
  // Don't render if no effects
  if (!effects || effects.length === 0) {
    return null;
  }
  
  // Sort effects: buffs first, then by remaining duration (descending)
  const sortedEffects = [...effects]
    .sort((a, b) => {
      // Buffs before debuffs
      if (a.isPositive !== b.isPositive) {
        return a.isPositive ? -1 : 1;
      }
      // Then by remaining duration (longer first)
      return b.remainingDuration - a.remainingDuration;
    })
    .slice(0, maxEffects);
  
  // Get container classes based on orientation and position
  const containerClasses = cn(
    'flex gap-1',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    position === 'above' && 'mb-1',
    position === 'below' && 'mt-1',
    position === 'left' && 'mr-1',
    position === 'right' && 'ml-1',
    className
  );
  
  return (
    <div className={containerClasses}>
      {sortedEffects.map((effect) => (
        <StatusEffectIcon
          key={effect.id}
          effect={effect}
          size={size}
          showTooltip={showTooltips}
          showDuration={showDuration}
          showStacks={showStacks}
        />
      ))}
      
      {/* Overflow indicator */}
      {effects.length > maxEffects && (
        <div className={cn(
          SIZE_CONFIG[size].container,
          'bg-gray-200 border-2 border-gray-400 rounded-full flex items-center justify-center text-gray-600'
        )}>
          <span className={cn('select-none font-bold', SIZE_CONFIG[size].icon)}>
            +{effects.length - maxEffects}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * StatusEffectsSkeleton for loading states.
 * 
 * @param props - Component props
 * @returns JSX element
 */
export function StatusEffectsSkeleton({
  count = 3,
  size = 'md',
  orientation = 'horizontal',
  className,
}: {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}): JSX.Element {
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <div className={cn(
      'flex gap-1',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      className
    )}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            sizeConfig.container,
            'bg-gray-200 border-2 border-gray-300 rounded-full animate-pulse'
          )}
          aria-label="Loading status effect..."
        />
      ))}
    </div>
  );
}

/**
 * Compact StatusEffects for small spaces.
 * 
 * @param props - Component props
 * @returns JSX element
 */
export function CompactStatusEffects({
  effects,
  className,
}: {
  effects: StatusEffectData[];
  className?: string;
}): JSX.Element | null {
  return (
    <StatusEffects
      effects={effects}
      size="sm"
      maxEffects={3}
      orientation="horizontal"
      showTooltips={true}
      showDuration={true}
      showStacks={false}
      className={className}
    />
  );
}

export default StatusEffects;