/**
 * UpgradeCard component for Roguelike Mode.
 * Displays a unit card with upgrade button and tier progression.
 *
 * @fileoverview Upgrade card component with tier indicator and upgrade action.
 */

'use client';

import { memo, useCallback } from 'react';
import { DraftCardData } from './DraftCard';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Upgrade card data extending draft card with upgrade info.
 */
export interface UpgradeCardData extends DraftCardData {
  /** Whether unit can be upgraded */
  canUpgrade: boolean;
  /** Cost to upgrade (if upgradeable) */
  upgradeCost?: number;
  /** Next tier after upgrade */
  nextTier?: 2 | 3;
}

/**
 * UpgradeCard component props.
 */
interface UpgradeCardProps {
  /** Card data to display */
  card: UpgradeCardData;
  /** Current gold balance */
  gold: number;
  /** Click handler for upgrade */
  onUpgrade?: () => void;
  /** Whether upgrade is in progress */
  isUpgrading?: boolean;
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
  color: string;
}

/**
 * Tier styling configuration.
 */
const TIER_STYLES: Record<number, TierStyle> = {
  1: {
    border: 'border-amber-700',
    bg: 'bg-amber-900/20',
    label: 'T1',
    color: 'text-amber-500',
  },
  2: {
    border: 'border-gray-400',
    bg: 'bg-gray-600/20',
    label: 'T2',
    color: 'text-gray-300',
  },
  3: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-900/20',
    label: 'T3',
    color: 'text-yellow-400',
  },
};

/** Default tier style */
const DEFAULT_TIER_STYLE: TierStyle = {
  border: 'border-amber-700',
  bg: 'bg-amber-900/20',
  label: 'T1',
  color: 'text-amber-500',
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

const LABELS = {
  en: {
    upgrade: 'Upgrade',
    upgrading: 'Upgrading...',
    maxTier: 'Max Tier',
    notEnoughGold: 'Not enough gold',
  },
  ru: {
    upgrade: 'Улучшить',
    upgrading: 'Улучшение...',
    maxTier: 'Макс. уровень',
    notEnoughGold: 'Недостаточно золота',
  },
};

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

/**
 * Get localized labels.
 */
function getLabels(useRussian: boolean) {
  return useRussian ? LABELS.ru : LABELS.en;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UpgradeCard component for displaying a unit with upgrade option.
 * Shows unit stats, tier indicator, and upgrade button.
 *
 * @example
 * <UpgradeCard
 *   card={handCard}
 *   gold={currentGold}
 *   onUpgrade={() => upgradeUnit(card.instanceId)}
 * />
 */
const UpgradeCard = memo(function UpgradeCard({
  card,
  gold,
  onUpgrade,
  isUpgrading = false,
  disabled = false,
  useRussian = false,
  className = '',
}: UpgradeCardProps) {
  const tierStyle = getTierStyle(card.tier);
  const nextTierStyle = card.nextTier ? getTierStyle(card.nextTier) : null;
  const roleIcon = getRoleIcon(card.role);
  const roleColor = getRoleColor(card.role);
  const roleName = getRoleName(card.role, useRussian);
  const labels = getLabels(useRussian);

  const canAfford = card.upgradeCost !== undefined && gold >= card.upgradeCost;
  const canUpgrade = card.canUpgrade && canAfford && !isUpgrading && !disabled;
  const isMaxTier = card.tier === 3;

  const handleUpgrade = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canUpgrade && onUpgrade) {
        onUpgrade();
      }
    },
    [canUpgrade, onUpgrade]
  );

  const getUpgradeButtonText = () => {
    if (isUpgrading) return labels.upgrading;
    if (isMaxTier) return labels.maxTier;
    if (!canAfford && card.upgradeCost !== undefined) return labels.notEnoughGold;
    return `${labels.upgrade} (${card.upgradeCost}g)`;
  };

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200
        ${tierStyle.bg} ${tierStyle.border}
        ${className}
      `}
      aria-label={`${card.name} - ${roleName} - Tier ${card.tier}`}
    >
      {/* Tier Badge */}
      <div
        className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold ${tierStyle.border} border ${tierStyle.bg} ${tierStyle.color}`}
      >
        {tierStyle.label}
        {nextTierStyle && (
          <span className="text-gray-500">
            {' → '}
            <span className={nextTierStyle.color}>{nextTierStyle.label}</span>
          </span>
        )}
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
        <div className="text-xs text-gray-400 truncate mb-3">
          <span className="text-yellow-400">✨</span> {card.ability.name}
        </div>
      )}

      {/* Upgrade Button */}
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={!canUpgrade}
        aria-label={`${labels.upgrade} ${card.name} to Tier ${card.nextTier ?? card.tier}`}
        className={`
          w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200
          ${canUpgrade
            ? 'bg-green-600 text-white hover:bg-green-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {getUpgradeButtonText()}
      </button>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { UpgradeCard };
export type { UpgradeCardProps };
