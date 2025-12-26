/**
 * LeaderCard component for Roguelike Mode.
 * Displays leader information with portrait, passive ability, and spell icons.
 *
 * @fileoverview Leader card component with accessibility support.
 */

'use client';

import { memo, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Passive ability configuration.
 */
export interface PassiveAbility {
  /** Unique passive ability identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Effect description (English) */
  description: string;
  /** Effect description (Russian) */
  descriptionRu: string;
}

/**
 * Spell configuration for display.
 */
export interface SpellInfo {
  /** Unique spell identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Effect description (English) */
  description: string;
  /** Effect description (Russian) */
  descriptionRu: string;
  /** Icon identifier for UI */
  icon?: string;
  /** Recommended timing */
  recommendedTiming: 'early' | 'mid' | 'late';
}

/**
 * Leader data for display.
 */
export interface LeaderData {
  /** Unique leader identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Faction this leader belongs to */
  faction: string;
  /** Leader's passive ability */
  passive: PassiveAbility;
  /** Available spells (2 spells per leader) */
  spells: SpellInfo[];
  /** Portrait image identifier */
  portrait: string;
  /** Leader backstory/description (English) */
  description: string;
  /** Leader backstory/description (Russian) */
  descriptionRu: string;
}

/**
 * LeaderCard component props.
 */
interface LeaderCardProps {
  /** Leader data to display */
  leader: LeaderData;
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
 * Leader portrait mapping (emoji placeholders).
 */
const LEADER_PORTRAITS: Record<string, string> = {
  'leader-aldric': '👨‍✈️',
  'leader-malachar': '💀',
  default: '👤',
};

/**
 * Spell icon mapping.
 */
const SPELL_ICONS: Record<string, string> = {
  'spell-holy-light': '✨',
  'spell-rally': '📯',
  'spell-death-coil': '💀',
  'spell-raise-dead': '⚰️',
  default: '🔮',
};

/**
 * Timing labels.
 */
const TIMING_LABELS: Record<string, { en: string; ru: string; color: string }> = {
  early: { en: 'Early', ru: 'Рано', color: 'text-green-400' },
  mid: { en: 'Mid', ru: 'Середина', color: 'text-yellow-400' },
  late: { en: 'Late', ru: 'Поздно', color: 'text-red-400' },
};

/** Default timing label */
const DEFAULT_TIMING_LABEL = { en: 'Mid', ru: 'Середина', color: 'text-yellow-400' };

/**
 * Faction color mapping.
 */
const FACTION_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  humans: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500',
    accent: 'text-blue-400',
  },
  undead: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500',
    accent: 'text-purple-400',
  },
};

/** Default faction colors */
const DEFAULT_FACTION_COLORS = {
  bg: 'bg-blue-900/30',
  border: 'border-blue-500',
  accent: 'text-blue-400',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get leader portrait emoji.
 *
 * @param portrait - Portrait identifier
 * @returns Emoji string
 */
function getLeaderPortrait(portrait: string): string {
  return LEADER_PORTRAITS[portrait] ?? LEADER_PORTRAITS.default ?? '👤';
}

/**
 * Get spell icon emoji.
 *
 * @param icon - Icon identifier
 * @returns Emoji string
 */
function getSpellIcon(icon?: string): string {
  if (!icon) return SPELL_ICONS.default ?? '🔮';
  return SPELL_ICONS[icon] ?? SPELL_ICONS.default ?? '🔮';
}

/**
 * Get faction colors.
 *
 * @param faction - Faction identifier
 * @returns Color classes object
 */
function getFactionColors(faction: string): { bg: string; border: string; accent: string } {
  return FACTION_COLORS[faction] ?? DEFAULT_FACTION_COLORS;
}

/**
 * Get timing label.
 *
 * @param timing - Timing type
 * @param useRussian - Whether to use Russian
 * @returns Label object with text and color
 */
function getTimingLabel(timing: string, useRussian: boolean): { text: string; color: string } {
  const label = TIMING_LABELS[timing] ?? DEFAULT_TIMING_LABEL;
  return {
    text: useRussian ? label.ru : label.en,
    color: label.color,
  };
}

// =============================================================================
// SPELL ICON COMPONENT
// =============================================================================

interface SpellIconProps {
  spell: SpellInfo;
  useRussian: boolean;
}

const SpellIcon = memo(function SpellIcon({ spell, useRussian }: SpellIconProps) {
  const icon = getSpellIcon(spell.icon);
  const name = useRussian ? spell.nameRu : spell.name;
  const description = useRussian ? spell.descriptionRu : spell.description;
  const timing = getTimingLabel(spell.recommendedTiming, useRussian);

  return (
    <div
      className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg"
      title={`${name}: ${description}`}
      aria-label={`${name} - ${description} - Recommended: ${timing.text}`}
    >
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{name}</div>
        <div className={`text-xs ${timing.color}`}>{timing.text}</div>
      </div>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * LeaderCard component for displaying leader information.
 * Shows portrait, name, passive ability, and spell options.
 *
 * @example
 * <LeaderCard
 *   leader={commanderAldric}
 *   selected={selectedLeaderId === leader.id}
 *   onClick={() => selectLeader(leader.id)}
 * />
 */
const LeaderCard = memo(function LeaderCard({
  leader,
  selected = false,
  onClick,
  disabled = false,
  useRussian = false,
  className = '',
}: LeaderCardProps) {
  const colors = getFactionColors(leader.faction);
  const portrait = getLeaderPortrait(leader.portrait);
  const name = useRussian ? leader.nameRu : leader.name;
  const description = useRussian ? leader.descriptionRu : leader.description;
  const passiveName = useRussian ? leader.passive.nameRu : leader.passive.name;
  const passiveDesc = useRussian ? leader.passive.descriptionRu : leader.passive.description;

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
      aria-label={`${name} - ${passiveName}: ${passiveDesc}${selected ? ' (Selected)' : ''}`}
      aria-pressed={selected}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30 scale-105' : ''}
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-105 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900'
        }
        ${className}
      `}
    >
      {/* Header: Portrait + Name */}
      <div className="flex items-center gap-4 mb-4">
        {/* Portrait */}
        <div
          className={`w-16 h-16 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-3xl flex-shrink-0`}
          aria-hidden="true"
        >
          {portrait}
        </div>

        {/* Name and Description */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{name}</h3>
          <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Passive Ability */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400" aria-hidden="true">
            ⭐
          </span>
          <span className={`font-semibold ${colors.accent}`}>{passiveName}</span>
          <span className="text-xs text-gray-500">
            ({useRussian ? 'Пассивная' : 'Passive'})
          </span>
        </div>
        <p className="text-sm text-gray-300">{passiveDesc}</p>
      </div>

      {/* Spells */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-400 mb-2">
          {useRussian ? 'Заклинания' : 'Spells'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {leader.spells.map((spell) => (
            <SpellIcon key={spell.id} spell={spell} useRussian={useRussian} />
          ))}
        </div>
      </div>

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-3 right-3 text-yellow-400 text-xl" aria-hidden="true">
          ✓
        </div>
      )}
    </button>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { LeaderCard, SpellIcon };
export type { LeaderCardProps };
