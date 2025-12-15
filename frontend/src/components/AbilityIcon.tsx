/**
 * AbilityIcon Component for Fantasy Autobattler.
 * Displays individual ability icons with tooltips, cooldown indicators, and ready states.
 * 
 * @fileoverview Reusable ability icon component with comprehensive visual feedback.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Ability data structure for UI display.
 */
export interface AbilityData {
  /** Unique ability identifier */
  id: string;
  /** Display name */
  name: string;
  /** Ability description */
  description: string;
  /** Ability type (active/passive) */
  type: 'active' | 'passive';
  /** Icon identifier for visual representation */
  icon: string;
  /** Base cooldown in turns (0 for passive abilities) */
  cooldown?: number;
  /** Current cooldown remaining (0 = ready) */
  currentCooldown?: number;
  /** Whether ability is ready to use */
  isReady?: boolean;
  /** Whether ability is disabled */
  isDisabled?: boolean;
}

/**
 * AbilityIcon component props.
 */
export interface AbilityIconProps {
  /** Ability data to display */
  ability: AbilityData;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show tooltip on hover */
  showTooltip?: boolean;
  /** Whether to show cooldown overlay */
  showCooldown?: boolean;
  /** Click handler for ability activation */
  onClick?: (ability: AbilityData) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the icon is interactive */
  interactive?: boolean;
}

// =============================================================================
// ICON MAPPING
// =============================================================================

/**
 * Maps ability icon identifiers to emoji/visual representations.
 */
const ABILITY_ICONS: Record<string, string> = {
  // Tank abilities
  shield: '🛡️',
  taunt: '🗣️',
  rage: '😡',
  
  // Melee DPS abilities
  dagger: '🗡️',
  sword: '⚔️',
  skull: '💀',
  
  // Ranged DPS abilities
  arrows: '🏹',
  crossbow: '🎯',
  trap: '🕳️',
  
  // Mage abilities
  fireball: '🔥',
  drain: '🌙',
  lightning: '⚡',
  
  // Support abilities
  heal: '💚',
  music: '🎵',
  
  // Control abilities
  stun: '✨',
  
  // Default fallback
  default: '❓',
};

/**
 * Size configuration for different icon variants.
 */
const SIZE_CONFIG = {
  sm: {
    container: 'w-8 h-8',
    icon: 'text-lg',
    cooldown: 'text-xs',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'text-2xl',
    cooldown: 'text-sm',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'text-3xl',
    cooldown: 'text-base',
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get icon emoji for ability.
 * 
 * @param iconId - Icon identifier from ability data
 * @returns Emoji string for the icon
 * @example
 * const icon = getAbilityIcon('fireball'); // '🔥'
 */
function getAbilityIcon(iconId: string): string {
  return ABILITY_ICONS[iconId] || ABILITY_ICONS['default'] || '❓';
}

/**
 * Get ability state classes for styling.
 * 
 * @param ability - Ability data
 * @param interactive - Whether icon is interactive
 * @returns CSS class string for current state
 * @example
 * const classes = getAbilityStateClasses(ability, true);
 */
function getAbilityStateClasses(ability: AbilityData, interactive: boolean): string {
  const baseClasses = 'relative flex items-center justify-center rounded-lg border-2 transition-all duration-200';
  
  if (ability.isDisabled) {
    return cn(baseClasses, 'bg-gray-200 border-gray-300 opacity-50 cursor-not-allowed');
  }
  
  if (ability.type === 'passive') {
    return cn(baseClasses, 'bg-purple-100 border-purple-300 text-purple-700');
  }
  
  const isOnCooldown = (ability.currentCooldown ?? 0) > 0;
  
  if (isOnCooldown) {
    return cn(
      baseClasses,
      'bg-gray-100 border-gray-400 text-gray-500',
      interactive && 'cursor-not-allowed'
    );
  }
  
  if (ability.isReady) {
    return cn(
      baseClasses,
      'bg-green-100 border-green-400 text-green-700 shadow-md',
      interactive && 'hover:bg-green-200 hover:border-green-500 hover:shadow-lg cursor-pointer'
    );
  }
  
  return cn(
    baseClasses,
    'bg-blue-100 border-blue-300 text-blue-700',
    interactive && 'hover:bg-blue-200 hover:border-blue-400 cursor-pointer'
  );
}

/**
 * Get tooltip content for ability.
 * 
 * @param ability - Ability data
 * @returns Formatted tooltip content
 * @example
 * const tooltip = getTooltipContent(ability);
 */
function getTooltipContent(ability: AbilityData): string {
  let content = `${ability.name}\n${ability.description}`;
  
  if (ability.type === 'active' && ability.cooldown) {
    content += `\n\nПерезарядка: ${ability.cooldown} ход${ability.cooldown > 1 ? 'а' : ''}`;
    
    const currentCooldown = ability.currentCooldown ?? 0;
    if (currentCooldown > 0) {
      content += `\nОсталось: ${currentCooldown} ход${currentCooldown > 1 ? 'а' : ''}`;
    }
  }
  
  if (ability.type === 'passive') {
    content += '\n\nПассивная способность';
  }
  
  return content;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AbilityIcon component for displaying unit abilities.
 * Shows ability icon with optional tooltip, cooldown indicator, and ready state.
 * 
 * @param props - Component props
 * @returns JSX element
 * @example
 * <AbilityIcon
 *   ability={fireballAbility}
 *   size="md"
 *   showTooltip={true}
 *   showCooldown={true}
 *   onClick={handleAbilityClick}
 * />
 */
export function AbilityIcon({
  ability,
  size = 'md',
  showTooltip = true,
  showCooldown = true,
  onClick,
  className,
  interactive = true,
}: AbilityIconProps): JSX.Element {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const sizeConfig = SIZE_CONFIG[size];
  const icon = getAbilityIcon(ability.icon);
  const stateClasses = getAbilityStateClasses(ability, interactive);
  const isOnCooldown = (ability.currentCooldown ?? 0) > 0;
  const isClickable = interactive && !ability.isDisabled && (!isOnCooldown || ability.type === 'passive');
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);
  
  /**
   * Handle click event.
   */
  const handleClick = (): void => {
    if (isClickable && onClick) {
      onClick(ability);
    }
  };
  
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
  
  /**
   * Handle keyboard events for accessibility.
   */
  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (showTooltip) {
        setShowTooltipState(!showTooltipState);
      }
      if (isClickable && onClick) {
        onClick(ability);
      }
    }
    if (event.key === 'Escape') {
      setShowTooltipState(false);
    }
  };
  
  return (
    <div className="relative">
      {/* Main Icon Container */}
      <div
        className={cn(
          sizeConfig.container,
          stateClasses,
          className
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onKeyDown={handleKeyDown}
        role={interactive ? 'button' : 'img'}
        tabIndex={isClickable ? 0 : -1}
        aria-label={`${ability.name}: ${ability.description}`}
        aria-disabled={ability.isDisabled}
        aria-describedby={showTooltipState ? `tooltip-${ability.id}` : undefined}
      >
        {/* Ability Icon */}
        <span className={cn('select-none', sizeConfig.icon)} aria-hidden="true">
          {icon}
        </span>
        
        {/* Cooldown Overlay */}
        {showCooldown && isOnCooldown && ability.type === 'active' && (
          <>
            {/* Darkening Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg" />
            
            {/* Cooldown Number */}
            <div className={cn(
              'absolute inset-0 flex items-center justify-center font-bold text-white',
              sizeConfig.cooldown
            )}>
              {ability.currentCooldown}
            </div>
          </>
        )}
        
        {/* Ready Indicator */}
        {ability.isReady && ability.type === 'active' && !isOnCooldown && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
        
        {/* Passive Indicator */}
        {ability.type === 'passive' && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div 
            id={`tooltip-${ability.id}`}
            className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs whitespace-pre-line"
            role="tooltip"
            onClick={(e) => e.stopPropagation()}
          >
            {getTooltipContent(ability)}
            
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
// UTILITY COMPONENTS
// =============================================================================

/**
 * AbilityIconSkeleton for loading states.
 * 
 * @param props - Size and className props
 * @returns JSX element
 * @example
 * <AbilityIconSkeleton size="md" />
 */
export function AbilityIconSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}): JSX.Element {
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <div
      className={cn(
        sizeConfig.container,
        'bg-gray-200 border-2 border-gray-300 rounded-lg animate-pulse',
        className
      )}
      aria-label="Loading ability..."
    />
  );
}

/**
 * AbilityIconPlaceholder for empty states.
 * 
 * @param props - Size and className props
 * @returns JSX element
 * @example
 * <AbilityIconPlaceholder size="md" />
 */
export function AbilityIconPlaceholder({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}): JSX.Element {
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <div
      className={cn(
        sizeConfig.container,
        'bg-gray-100 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center text-gray-400',
        className
      )}
      aria-label="No ability"
    >
      <span className={cn('select-none', sizeConfig.icon)}>❓</span>
    </div>
  );
}

export default AbilityIcon;