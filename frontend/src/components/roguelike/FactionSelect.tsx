/**
 * FactionSelect component for Roguelike Mode.
 * Displays faction cards for selection at run start.
 *
 * @fileoverview Faction selection component with accessibility support.
 */

'use client';

import { memo, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Faction bonus configuration.
 */
export interface FactionBonus {
  /** The stat that receives the bonus */
  stat: string;
  /** Bonus value as decimal (0.1 = 10%) */
  value: number;
}

/**
 * Faction data for display.
 */
export interface FactionData {
  /** Unique faction identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Faction description (English) */
  description: string;
  /** Faction description (Russian) */
  descriptionRu: string;
  /** Faction bonus applied to all units */
  bonus: FactionBonus;
  /** Icon identifier for UI */
  icon: string;
}

/**
 * FactionSelect component props.
 */
interface FactionSelectProps {
  /** Available factions to select from */
  factions: FactionData[];
  /** Currently selected faction ID */
  selectedFactionId: string | null;
  /** Callback when faction is selected */
  onSelect: (factionId: string) => void;
  /** Whether selection is disabled */
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
 * Faction icon mapping.
 */
const FACTION_ICONS: Record<string, string> = {
  'faction-humans': '⚔️',
  'faction-undead': '💀',
  'faction-order': '🛡️',
  'faction-chaos': '🔥',
  'faction-nature': '🌿',
  'faction-shadow': '🌙',
  'faction-arcane': '✨',
  'faction-machine': '⚙️',
};

/**
 * Stat name mapping for display.
 */
const STAT_NAMES: Record<string, { en: string; ru: string }> = {
  hp: { en: 'HP', ru: 'HP' },
  atk: { en: 'ATK', ru: 'ATK' },
  armor: { en: 'Armor', ru: 'Броня' },
  dodge: { en: 'Dodge', ru: 'Уклонение' },
  speed: { en: 'Speed', ru: 'Скорость' },
  regen: { en: 'Regen', ru: 'Регенерация' },
};

/**
 * Faction color mapping.
 */
const FACTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  humans: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  undead: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500',
    text: 'text-purple-400',
  },
  order: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
  },
  chaos: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-400',
  },
  nature: {
    bg: 'bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-400',
  },
  shadow: {
    bg: 'bg-gray-900/30',
    border: 'border-gray-500',
    text: 'text-gray-400',
  },
};

/** Default faction colors */
const DEFAULT_FACTION_COLORS: { bg: string; border: string; text: string } = {
  bg: 'bg-blue-900/30',
  border: 'border-blue-500',
  text: 'text-blue-400',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get faction icon by icon identifier.
 *
 * @param icon - Icon identifier
 * @returns Emoji icon string
 */
function getFactionIcon(icon: string): string {
  return FACTION_ICONS[icon] || '❓';
}

/**
 * Get faction colors by faction ID.
 *
 * @param factionId - Faction identifier
 * @returns Color classes object
 */
function getFactionColors(factionId: string): { bg: string; border: string; text: string } {
  return FACTION_COLORS[factionId] ?? DEFAULT_FACTION_COLORS;
}

/**
 * Format bonus value as percentage string.
 *
 * @param value - Decimal value (0.1 = 10%)
 * @returns Formatted percentage string
 */
function formatBonusValue(value: number): string {
  return `+${Math.round(value * 100)}%`;
}

/**
 * Get stat display name.
 *
 * @param stat - Stat identifier
 * @param useRussian - Whether to use Russian
 * @returns Display name
 */
function getStatName(stat: string, useRussian: boolean): string {
  const names = STAT_NAMES[stat];
  if (!names) return stat.toUpperCase();
  return useRussian ? names.ru : names.en;
}

// =============================================================================
// FACTION CARD COMPONENT
// =============================================================================

interface FactionCardProps {
  faction: FactionData;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  useRussian: boolean;
}

const FactionCard = memo(function FactionCard({
  faction,
  selected,
  onSelect,
  disabled,
  useRussian,
}: FactionCardProps) {
  const colors = getFactionColors(faction.id);
  const icon = getFactionIcon(faction.icon);
  const name = useRussian ? faction.nameRu : faction.name;
  const description = useRussian ? faction.descriptionRu : faction.description;
  const statName = getStatName(faction.bonus.stat, useRussian);
  const bonusText = `${formatBonusValue(faction.bonus.value)} ${statName}`;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          onSelect();
        }
      }
    },
    [disabled, onSelect]
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`${name} - ${bonusText} - ${description}${selected ? ' (Selected)' : ''}`}
      aria-pressed={selected}
      className={`
        relative w-full p-6 rounded-xl border-2 transition-all duration-200
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30 scale-105' : ''}
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-105 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900'
        }
      `}
    >
      {/* Faction Icon */}
      <div className="flex justify-center mb-4">
        <div
          className={`w-16 h-16 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-4xl`}
        >
          {icon}
        </div>
      </div>

      {/* Faction Name */}
      <h3 className="text-xl font-bold text-white text-center mb-2">{name}</h3>

      {/* Faction Bonus */}
      <div
        className={`text-center ${colors.text} font-semibold text-lg mb-3`}
        aria-label={`Bonus: ${bonusText}`}
      >
        {bonusText}
      </div>

      {/* Faction Description */}
      <p className="text-gray-400 text-sm text-center">{description}</p>

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
// MAIN COMPONENT
// =============================================================================

/**
 * FactionSelect component for selecting a faction at run start.
 * Displays faction cards with bonuses and descriptions.
 *
 * @example
 * <FactionSelect
 *   factions={[humansFaction, undeadFaction]}
 *   selectedFactionId={selectedFaction}
 *   onSelect={(id) => setSelectedFaction(id)}
 * />
 */
const FactionSelect = memo(function FactionSelect({
  factions,
  selectedFactionId,
  onSelect,
  disabled = false,
  useRussian = false,
  className = '',
}: FactionSelectProps) {
  const handleSelect = useCallback(
    (factionId: string) => {
      if (!disabled) {
        onSelect(factionId);
      }
    },
    [disabled, onSelect]
  );

  const title = useRussian ? 'Выберите фракцию' : 'Select Faction';

  return (
    <div className={`space-y-6 ${className}`} role="group" aria-label={title}>
      {/* Title */}
      <h2 className="text-2xl font-bold text-white text-center">{title}</h2>

      {/* Faction Cards Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        role="radiogroup"
        aria-label={title}
      >
        {factions.map((faction) => (
          <FactionCard
            key={faction.id}
            faction={faction}
            selected={selectedFactionId === faction.id}
            onSelect={() => handleSelect(faction.id)}
            disabled={disabled}
            useRussian={useRussian}
          />
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { FactionSelect, FactionCard };
export type { FactionSelectProps };
