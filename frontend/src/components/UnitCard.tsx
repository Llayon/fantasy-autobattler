/**
 * UnitCard component for Fantasy Autobattler.
 * Displays unit information with multiple variants and role-based styling.
 * 
 * @fileoverview Redesigned unit card component with list, grid, and compact variants.
 */

'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { UnitTemplate, UnitRole } from '@/types/game';
import { getRoleColor, getRoleIcon, getRoleName, getRoleClasses } from '@/lib/roleColors';

// =============================================================================
// TYPES
// =============================================================================

/**
 * UnitCard display variants.
 */
export type UnitCardVariant = 'list' | 'grid' | 'compact';

/**
 * UnitCard component props.
 */
interface UnitCardProps {
  /** Unit template data */
  unit: UnitTemplate;
  /** Card display variant */
  variant?: UnitCardVariant;
  /** Click handler */
  onClick?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Whether card is selected */
  selected?: boolean;
  /** Whether card is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Stat icons for display.
 */
const STAT_ICONS = {
  hp: '❤️',
  atk: '⚔️',
  atkCount: '🎯',
  armor: '🛡️',
  speed: '🏃',
  initiative: '⚡',
  dodge: '🌪️',
  range: '📏',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get role-based styling for unit card.
 * 
 * @param role - Unit role
 * @returns CSS classes and colors for the role
 */
function getCardRoleStyles(role: UnitRole) {
  const roleColor = getRoleColor(role);
  const classes = getRoleClasses(role);
  
  return {
    roleColor,
    classes,
    bgClass: `${classes.bg}/20`, // Light background
    borderClass: classes.border,
    textClass: 'text-white',
    accentClass: classes.text,
  };
}

/**
 * Truncate text to specified length with ellipsis.
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// =============================================================================
// VARIANT COMPONENTS
// =============================================================================

/**
 * List variant - full information display for unit selection.
 */
interface ListVariantProps {
  unit: UnitTemplate;
  styles: ReturnType<typeof getCardRoleStyles>;
}

function ListVariant({ unit, styles }: ListVariantProps) {
  const firstAbility = unit.abilities[0];
  
  return (
    <div className="p-4 space-y-3">
      {/* Header: Cost badge + Role icon + Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-lg ${styles.bgClass} ${styles.borderClass} border-2 flex items-center justify-center text-lg`}>
            {getRoleIcon(unit.role)}
          </div>
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unit.cost}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-bold text-white text-lg">{unit.name}</div>
          <div className={`text-sm ${styles.accentClass} font-medium`}>
            {getRoleName(unit.role)}
          </div>
        </div>
      </div>

      {/* Stats row 1: HP, ATK, Speed (prominent) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-red-400">{STAT_ICONS.hp}</span>
          <span className="text-white font-bold text-lg">{unit.stats.hp}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-orange-400">{STAT_ICONS.atk}</span>
          <span className="text-white font-bold text-lg">{unit.stats.atk}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-400">{STAT_ICONS.speed}</span>
          <span className="text-white font-bold text-lg">{unit.stats.speed}</span>
        </div>
      </div>

      {/* Stats row 2: #ATK, Armor (smaller) */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-blue-400">{STAT_ICONS.atkCount}</span>
          <span className="text-gray-300">{unit.stats.atkCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-purple-400">{STAT_ICONS.armor}</span>
          <span className="text-gray-300">{unit.stats.armor}</span>
        </div>
      </div>

      {/* Footer: Ability preview */}
      {firstAbility && (
        <div className="text-xs text-gray-400">
          <span className="text-yellow-400">✨</span> {truncateText(typeof firstAbility === 'string' ? firstAbility : firstAbility.name, 30)}
        </div>
      )}
    </div>
  );
}

/**
 * Grid variant - minimal display for battle field.
 */
interface GridVariantProps {
  unit: UnitTemplate;
  styles: ReturnType<typeof getCardRoleStyles>;
}

function GridVariant({ unit, styles }: GridVariantProps) {
  const hpPercentage = Math.min(100, (unit.stats.hp / 200) * 100); // Assume max HP ~200 for bar
  
  return (
    <div className="p-2 space-y-2">
      {/* Role icon */}
      <div className="flex justify-center">
        <div className={`w-8 h-8 rounded-lg ${styles.bgClass} ${styles.borderClass} border flex items-center justify-center text-lg`}>
          {getRoleIcon(unit.role)}
        </div>
      </div>

      {/* HP bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        <div className="text-center text-xs text-white font-medium">
          {unit.stats.hp}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact variant - minimal info for saved teams preview.
 */
interface CompactVariantProps {
  unit: UnitTemplate;
  styles: ReturnType<typeof getCardRoleStyles>;
}

function CompactVariant({ unit, styles }: CompactVariantProps) {
  return (
    <div className="p-2 flex items-center gap-2">
      {/* Role icon + Cost */}
      <div className="relative flex-shrink-0">
        <div className={`w-6 h-6 rounded ${styles.bgClass} ${styles.borderClass} border flex items-center justify-center text-sm`}>
          {getRoleIcon(unit.role)}
        </div>
        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unit.cost}
        </div>
      </div>

      {/* Name + Key stats */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{unit.name}</div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{STAT_ICONS.hp}{unit.stats.hp}</span>
          <span>{STAT_ICONS.atk}{unit.stats.atk}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UnitCard component for displaying unit information.
 * Supports multiple variants: list (full info), grid (battle field), compact (saved teams).
 * 
 * @example
 * <UnitCard
 *   unit={knightTemplate}
 *   variant="list"
 *   selected={selectedUnit?.id === unit.id}
 *   onClick={() => selectUnit(unit)}
 * />
 */
const UnitCard = memo(function UnitCard({
  unit,
  variant = 'list',
  onClick,
  onLongPress,
  selected = false,
  disabled = false,
  className = '',
}: UnitCardProps) {
  const styles = getCardRoleStyles(unit.role);
  
  // Long press detection state
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  /**
   * Handle pointer down event to start long press detection.
   * Starts a 500ms timer for long press detection.
   */
  const handlePointerDown = useCallback(() => {
    if (disabled) return;
    
    longPressTriggered.current = false;
    setIsLongPressing(true);
    
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setIsLongPressing(false);

      if (onLongPress) {
        onLongPress();
      }
    }, 500); // 500ms for long press
  }, [disabled, onLongPress]);

  /**
   * Handle pointer up event to complete interaction.
   * Clears long press timer and triggers click if long press wasn't activated.
   */
  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    setIsLongPressing(false);
    
    // Only trigger click if long press wasn't triggered
    if (!longPressTriggered.current && !disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  /**
   * Handle pointer leave event to cancel long press.
   * Clears timer when pointer moves away from element.
   */
  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  /**
   * Handle double click to open detail modal.
   */
  const handleDoubleClick = useCallback(() => {
    if (!disabled && onLongPress) {
      onLongPress();
    }
  }, [disabled, onLongPress]);

  // Get variant-specific dimensions and styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'grid':
        return {
          container: 'w-16 h-20', // Fixed size for grid cells
          minHeight: '',
        };
      case 'compact':
        return {
          container: 'min-w-[200px] h-12', // Compact horizontal layout
          minHeight: '',
        };
      case 'list':
      default:
        return {
          container: 'min-w-[280px] w-full',
          minHeight: 'min-h-[140px]',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${unit.name} - ${getRoleName(unit.role)} - Cost: ${unit.cost} - HP: ${unit.stats.hp} - Attack: ${unit.stats.atk}${selected ? ' (Selected)' : ''}`}
      aria-pressed={selected}
      aria-describedby={`unit-${unit.id}-description`}
      className={`
        relative rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${variantStyles.container} ${variantStyles.minHeight}
        bg-gray-800/50 ${styles.borderClass}
        ${selected ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30 animate-unit-select' : ''}
        ${isLongPressing ? 'scale-95 shadow-lg' : ''}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed grayscale' 
          : 'hover:scale-105 hover:shadow-lg active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900'
        }
        ${className}
      `}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={handleDoubleClick}
    >
      {/* Hidden description for screen readers */}
      <div id={`unit-${unit.id}-description`} className="sr-only">
        {unit.abilities.length > 0 && `Abilities: ${unit.abilities.map(a => typeof a === 'string' ? a : a.name).join(', ')}. `}
        Stats: HP {unit.stats.hp}, Attack {unit.stats.atk}, Speed {unit.stats.speed}, Armor {unit.stats.armor}.
      </div>

      {/* Render variant-specific content */}
      {variant === 'list' && (
        <ListVariant unit={unit} styles={styles} />
      )}
      {variant === 'grid' && (
        <GridVariant unit={unit} styles={styles} />
      )}
      {variant === 'compact' && (
        <CompactVariant unit={unit} styles={styles} />
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1 right-1 text-yellow-400 text-sm">
            ✓
          </div>
        </div>
      )}

      {/* Glow effect for selected state */}
      {selected && (
        <div className="absolute inset-0 rounded-lg bg-yellow-400/10 pointer-events-none animate-pulse" aria-hidden="true" />
      )}
    </button>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { UnitCard };
export type { UnitCardProps };
