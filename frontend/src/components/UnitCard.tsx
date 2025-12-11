/**
 * UnitCard component for Fantasy Autobattler.
 * Displays unit information with stats, role-based styling, and multiple size modes.
 * 
 * @fileoverview Comprehensive unit card component with full stat display.
 */

'use client';

import { UnitTemplate, UnitRole, UNIT_INFO } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

/**
 * UnitCard component props.
 */
interface UnitCardProps {
  /** Unit template data */
  unit: UnitTemplate;
  /** Card display size */
  size?: 'compact' | 'full';
  /** Click handler */
  onClick?: () => void;
  /** Whether card is selected */
  selected?: boolean;
  /** Whether card is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Show ability icons */
  showAbilities?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Role-based color schemes.
 */
const ROLE_COLORS: Record<UnitRole, { 
  bg: string; 
  border: string; 
  accent: string; 
  text: string;
}> = {
  tank: {
    bg: 'bg-blue-900/40',
    border: 'border-blue-500',
    accent: 'text-blue-400',
    text: 'text-blue-100',
  },
  melee_dps: {
    bg: 'bg-red-900/40',
    border: 'border-red-500',
    accent: 'text-red-400',
    text: 'text-red-100',
  },
  ranged_dps: {
    bg: 'bg-orange-900/40',
    border: 'border-orange-500',
    accent: 'text-orange-400',
    text: 'text-orange-100',
  },
  mage: {
    bg: 'bg-purple-900/40',
    border: 'border-purple-500',
    accent: 'text-purple-400',
    text: 'text-purple-100',
  },
  support: {
    bg: 'bg-green-900/40',
    border: 'border-green-500',
    accent: 'text-green-400',
    text: 'text-green-100',
  },
  control: {
    bg: 'bg-indigo-900/40',
    border: 'border-indigo-500',
    accent: 'text-indigo-400',
    text: 'text-indigo-100',
  },
};

/**
 * Stat icons and labels.
 */
const STAT_DISPLAY = {
  hp: { icon: '❤️', label: 'HP', tooltip: 'Hit Points' },
  atk: { icon: '⚔️', label: 'ATK', tooltip: 'Attack Damage' },
  atkCount: { icon: '🗡️', label: '#ATK', tooltip: 'Attacks per Turn' },
  armor: { icon: '🛡️', label: 'BR', tooltip: 'Armor (Damage Reduction)' },
  speed: { icon: '💨', label: 'СК', tooltip: 'Movement Speed' },
  initiative: { icon: '⚡', label: 'ИН', tooltip: 'Initiative (Turn Order)' },
  dodge: { icon: '🌪️', label: 'УК', tooltip: 'Dodge Chance %' },
  range: { icon: '🎯', label: 'Range', tooltip: 'Attack Range' },
};

/**
 * Role display names in Russian.
 */
const ROLE_NAMES: Record<UnitRole, string> = {
  tank: 'Танк',
  melee_dps: 'Ближний бой',
  ranged_dps: 'Дальний бой',
  mage: 'Маг',
  support: 'Поддержка',
  control: 'Контроль',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get role-based styling for unit card.
 * 
 * @param role - Unit role
 * @returns CSS classes object
 */
function getRoleColors(role: UnitRole) {
  return ROLE_COLORS[role] || ROLE_COLORS.tank;
}

/**
 * Format stat value for display.
 * 
 * @param value - Stat value
 * @param statKey - Stat identifier
 * @returns Formatted string
 */
function formatStatValue(value: number, statKey: string): string {
  if (statKey === 'dodge') {
    return `${value}%`;
  }
  return value.toString();
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Compact stat display for small cards.
 */
interface CompactStatsProps {
  unit: UnitTemplate;
  colors: ReturnType<typeof getRoleColors>;
}

function CompactStats({ unit, colors }: CompactStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-1 text-xs">
      <div className={`flex items-center gap-1 ${colors.text}`}>
        <span>{STAT_DISPLAY.hp.icon}</span>
        <span>{unit.stats.hp}</span>
      </div>
      <div className={`flex items-center gap-1 ${colors.text}`}>
        <span>{STAT_DISPLAY.atk.icon}</span>
        <span>{unit.stats.atk}</span>
      </div>
      <div className={`flex items-center gap-1 ${colors.text}`}>
        <span>{STAT_DISPLAY.armor.icon}</span>
        <span>{unit.stats.armor}</span>
      </div>
      <div className={`flex items-center gap-1 ${colors.text}`}>
        <span>{STAT_DISPLAY.range.icon}</span>
        <span>{unit.range}</span>
      </div>
    </div>
  );
}

/**
 * Full stat display for detailed cards.
 */
interface FullStatsProps {
  unit: UnitTemplate;
  colors: ReturnType<typeof getRoleColors>;
}

function FullStats({ unit, colors }: FullStatsProps) {
  const stats = [
    { key: 'hp', value: unit.stats.hp },
    { key: 'atk', value: unit.stats.atk },
    { key: 'atkCount', value: unit.stats.atkCount },
    { key: 'armor', value: unit.stats.armor },
    { key: 'speed', value: unit.stats.speed },
    { key: 'initiative', value: unit.stats.initiative },
    { key: 'dodge', value: unit.stats.dodge },
    { key: 'range', value: unit.range },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {stats.map(({ key, value }) => {
        const display = STAT_DISPLAY[key as keyof typeof STAT_DISPLAY];
        return (
          <div 
            key={key}
            className={`flex items-center justify-between ${colors.text}`}
            title={display.tooltip}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">{display.icon}</span>
              <span className="text-xs font-medium">{display.label}</span>
            </div>
            <span className={`font-bold ${colors.accent}`}>
              {formatStatValue(value, key)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Ability icons display.
 */
interface AbilityIconsProps {
  abilities: string[];
  colors: ReturnType<typeof getRoleColors>;
}

function AbilityIcons({ abilities, colors }: AbilityIconsProps) {
  if (abilities.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-2">
      <span className={`text-xs ${colors.text}`}>Способности:</span>
      <div className="flex gap-1">
        {abilities.slice(0, 3).map((ability, index) => (
          <div
            key={index}
            className={`w-6 h-6 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center text-xs`}
            title={ability}
          >
            ✨
          </div>
        ))}
        {abilities.length > 3 && (
          <div className={`text-xs ${colors.text}`}>
            +{abilities.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UnitCard component for displaying unit information.
 * Supports compact and full display modes with role-based styling.
 * 
 * @example
 * <UnitCard
 *   unit={knightTemplate}
 *   size="full"
 *   selected={selectedUnit?.id === unit.id}
 *   onClick={() => selectUnit(unit)}
 * />
 */
export function UnitCard({
  unit,
  size = 'full',
  onClick,
  selected = false,
  disabled = false,
  className = '',
  showAbilities = true,
}: UnitCardProps) {
  const unitInfo = UNIT_INFO[unit.id];
  const colors = getRoleColors(unit.role);
  const isCompact = size === 'compact';
  
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-yellow-400 scale-105 shadow-lg shadow-yellow-400/30' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
        ${isCompact ? 'p-3' : 'p-4'}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Cost badge */}
      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
        {unit.cost}
      </div>

      {/* Unit header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-${isCompact ? '3xl' : '4xl'}`}>
          {unitInfo?.emoji || '❓'}
        </div>
        <div className="flex-1">
          <div className={`font-bold ${isCompact ? 'text-base' : 'text-lg'} ${colors.text}`}>
            {unit.name}
          </div>
          <div className={`text-xs ${colors.accent} font-medium`}>
            {ROLE_NAMES[unit.role]}
          </div>
        </div>
      </div>

      {/* Unit description */}
      {!isCompact && (
        <div className={`text-xs ${colors.text} mb-3 opacity-80`}>
          {unitInfo?.description || 'Описание недоступно'}
        </div>
      )}

      {/* Stats display */}
      <div className="mb-3">
        {isCompact ? (
          <CompactStats unit={unit} colors={colors} />
        ) : (
          <FullStats unit={unit} colors={colors} />
        )}
      </div>

      {/* Abilities */}
      {showAbilities && !isCompact && (
        <AbilityIcons abilities={unit.abilities} colors={colors} />
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 pointer-events-none">
          <div className="absolute top-1 right-1 text-yellow-400">
            ✓
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { UnitCardProps };
export { ROLE_COLORS, ROLE_NAMES };
