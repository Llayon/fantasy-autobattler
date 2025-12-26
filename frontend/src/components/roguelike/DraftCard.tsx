/**
 * DraftCard component for Roguelike Mode.
 * Displays a unit card for draft selection with tier indicator.
 *
 * @fileoverview Draft card component with selection state and tier styling.
 */

'use client';

import { memo, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Unit stats for draft card display.
 */
export interface DraftUnitStats {
  hp: number;
  atk: number;
  armor: number;
  speed: number;
  initiative: number;
  range: number;
  attackCount: number;
  dodge: number;
}

/**
 * Unit ability info.
 */
export interface DraftUnitAbility {
  id: string;
  name: string;
  description: string;
}

/**
 * Draft card data.
 */
export interface DraftCardData {
  /** Unique instance ID */
  instanceId: string;
  /** Unit template ID */
  unitId: string;
  /** Unit name */
  name: string;
  /** Unit role */
  role: string;
  /** Unit tier (1, 2, or 3) */
  tier: 1 | 2 | 3;
  /** Unit cost */
  cost: number;
  /** Unit stats */
  stats: DraftUnitStats;
  /** Unit ability (if any) */
  ability?: DraftUnitAbility;
}

/**
 * DraftCard component props.
 */
interface DraftCardProps {
  /** Card data to display */
  card: DraftCardData;
  /** Whether card is selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether card is disabled */
  disabled?: boolean;
  /** Use Russian language */
  useRussian?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Role icon mapping.
 */
const ROLE_ICONS: Record<string, string> = {
  tank: '🛡️',
  melee_dps: '⚔️',
  ranged_dps: '🏹',
  mage: '🔮',
  support: '💚',
  control: '🎯',
};

/**
 * Tier style type.
 */
interface TierStyle {
  border: string;
  bg: string;
  label: string;
  glow: string;
}

/**
 * Tier styling configuration.
 */
const TIER_STYLES: Record<number, TierStyle> = {
  1: {
    border: 'border-amber-700',
    bg: 'bg-amber-900/20',
    label: 'T1',
    glow: 'shadow-amber-700/30',
  },
  2: {
    border: 'border-gray-400',
    bg: 'bg-gray-600/20',
    label: 'T2',
    glow: 'shadow-gray-400/30',
  },
  3: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-900/20',
    label: 'T3',
    glow: 'shadow-yellow-400/30',
  },
};

/** Default tier style */
const DEFAULT_TIER_STYLE: TierStyle = {
  border: 'border-amber-700',
  bg: 'bg-amber-900/20',
  label: 'T1',
  glow: 'shadow-amber-700/30',
};

/**
 * Role color mapping.
 */
const ROLE_COLORS: Record<string, string> = {
  tank: 'text-blue-400',
  melee_dps: 'text-red-400',
  ranged_dps: 'text-green-400',
  mage: 'text-purple-400',
  support: 'text-yellow-400',
  control: 'text-cyan-400',
};

/**
 * Role name mapping.
 */
const ROLE_NAMES: Record<string, { en: string; ru: string }> = {
  tank: { en: 'Tank', ru: 'Танк' },
  melee_dps: { en: 'Melee DPS', ru: 'Ближний урон' },
  ranged_dps: { en: 'Ranged DPS', ru: 'Дальний урон' },
  mage: { en: 'Mage', ru: 'Маг' },
  support: { en: 'Support', ru: 'Поддержка' },
  control: { en: 'Control', ru: 'Контроль' },
};

/**
 * Stat icons.
 */
const STAT_ICONS = {
  hp: '❤️',
  atk: '⚔️',
  armor: '🛡️',
  speed: '🏃',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tier styling.
 */
function getTierStyle(tier: number): TierStyle {
  const style = TIER_STYLES[tier];
  return style !== undefined ? style : DEFAULT_TIER_STYLE;
}

/**
 * Get role icon.
 */
function getRoleIcon(role: string): string {
  return ROLE_ICONS[role] ?? '❓';
}

/**
 * Get role color class.
 */
function getRoleColor(role: string): string {
  return ROLE_COLORS[role] ?? 'text-gray-400';
}

/**
 * Get role display name.
 */
function getRoleName(role: string, useRussian: boolean): string {
  const names = ROLE_NAMES[role];
  if (!names) return role;
  return useRussian ? names.ru : names.en;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DraftCard component for displaying a unit in draft selection.
 * Shows unit stats, tier indicator, and selection state.
 *
 * @example
 * <DraftCard
 *   card={draftOption}
 *   selected={selectedCards.includes(card.instanceId)}
 *   onClick={() => toggleSelection(card.instanceId)}
 * />
 */
const DraftCard = memo(function DraftCard({
  card,
  selected = false,
  onClick,
  disabled = false,
  useRussian = false,
  className = '',
}: DraftCardProps) {
  const tierStyle = getTierStyle(card.tier);
  const roleIcon = getRoleIcon(card.role);
  const roleColor = getRoleColor(card.role);
  const roleName = getRoleName(card.role, useRussian);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`${card.name} - ${roleName} - Tier ${card.tier} - Cost ${card.cost} - HP ${card.stats.hp} - ATK ${card.stats.atk}${selected ? ' (Selected)' : ''}`}
      aria-pressed={selected}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
        ${tierStyle.bg} ${tierStyle.border}
        ${selected ? `ring-2 ring-yellow-400 shadow-lg ${tierStyle.glow} scale-105` : ''}
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-105 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900'
        }
        ${className}
      `}
    >
      {/* Tier Badge */}
      <div
        className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold ${tierStyle.border} border ${tierStyle.bg}`}
      >
        {tierStyle.label}
      </div>

      {/* Cost Badge */}
      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
        {card.cost}
      </div>

      {/* Header: Icon + Name */}
      <div className="flex items-center gap-3 mt-6 mb-3">
        <div
          className={`w-10 h-10 rounded-lg ${tierStyle.bg} ${tierStyle.border} border flex items-center justify-center text-xl`}
        >
          {roleIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{card.name}</h3>
          <div className={`text-sm ${roleColor} font-medium`}>{roleName}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-red-400">{STAT_ICONS.hp}</span>
          <span className="text-white font-bold">{card.stats.hp}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-orange-400">{STAT_ICONS.atk}</span>
          <span className="text-white font-bold">{card.stats.atk}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-purple-400">{STAT_ICONS.armor}</span>
          <span className="text-gray-300">{card.stats.armor}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-400">{STAT_ICONS.speed}</span>
          <span className="text-gray-300">{card.stats.speed}</span>
        </div>
      </div>

      {/* Ability (if any) */}
      {card.ability && (
        <div className="text-xs text-gray-400 truncate">
          <span className="text-yellow-400">✨</span> {card.ability.name}
        </div>
      )}

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute bottom-2 right-2 text-yellow-400 text-xl" aria-hidden="true">
          ✓
        </div>
      )}
    </button>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { DraftCard };
export type { DraftCardProps };
