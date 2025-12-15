/**
 * SynergyDisplay component for Fantasy Autobattler.
 * Shows active synergies and their bonuses for the current team.
 * 
 * @fileoverview Component for displaying team synergies with visual indicators.
 */

'use client';

import { useMemo } from 'react';
import { UnitTemplate, UnitId } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Synergy bonus definition.
 */
interface SynergyBonus {
  /** Stat to modify */
  stat: 'hp' | 'atk' | 'armor' | 'speed' | 'initiative' | 'dodge' | 'all';
  /** Percentage bonus (0.1 = 10%) */
  percentage: number;
  /** Flat bonus value (added after percentage) */
  flat?: number;
}

/**
 * Role requirement for synergy activation.
 */
interface RoleRequirement {
  /** Required unit role */
  role: string;
  /** Minimum count of units with this role */
  count: number;
}

/**
 * Synergy definition.
 */
interface Synergy {
  /** Unique synergy identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the synergy effect */
  description: string;
  /** Role requirements to activate this synergy */
  requiredRoles: RoleRequirement[];
  /** Bonuses applied when synergy is active */
  bonuses: SynergyBonus[];
  /** Icon for UI display */
  icon: string;
}

/**
 * Active synergy with matched units.
 */
interface ActiveSynergy extends Synergy {
  /** Unit IDs that contribute to this synergy */
  contributingUnits: string[];
}

/**
 * Placed unit interface for synergy calculation.
 */
interface PlacedUnit {
  /** Unit identifier */
  unitId: UnitId;
  /** Unit position on battlefield */
  position: { x: number; y: number };
}

/**
 * SynergyDisplay component props.
 */
interface SynergyDisplayProps {
  /** Array of placed units in the team */
  units: PlacedUnit[];
  /** Available unit templates for role lookup */
  unitTemplates: UnitTemplate[];
  /** Display variant */
  variant?: 'full' | 'compact';
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Unit role mapping for synergy calculation */
const UNIT_ROLES: Record<UnitId, string> = {
  // Tanks
  knight: 'tank',
  guardian: 'tank', 
  berserker: 'tank',
  // Melee DPS
  rogue: 'melee_dps',
  duelist: 'melee_dps',
  assassin: 'melee_dps',
  // Ranged DPS
  archer: 'ranged_dps',
  crossbowman: 'ranged_dps',
  hunter: 'ranged_dps',
  // Mages
  mage: 'mage',
  warlock: 'mage',
  elementalist: 'mage',
  // Support
  priest: 'support',
  bard: 'support',
  // Control
  enchanter: 'control',
};

/**
 * All available synergies in the game.
 */
const SYNERGIES: Synergy[] = [
  {
    id: 'frontline',
    name: 'Передовая линия',
    description: '+10% HP всем юнитам при наличии 2+ танков',
    requiredRoles: [{ role: 'tank', count: 2 }],
    bonuses: [{ stat: 'hp', percentage: 0.10 }],
    icon: '🛡️',
  },
  {
    id: 'magic_circle',
    name: 'Магический круг',
    description: '+15% атаки магам при наличии 2+ магов',
    requiredRoles: [{ role: 'mage', count: 2 }],
    bonuses: [{ stat: 'atk', percentage: 0.15 }],
    icon: '🔮',
  },
  {
    id: 'assassin_guild',
    name: 'Гильдия убийц',
    description: '+20% уклонения при наличии 2+ ближних бойцов',
    requiredRoles: [{ role: 'melee_dps', count: 2 }],
    bonuses: [{ stat: 'dodge', percentage: 0.20 }],
    icon: '🗡️',
  },
  {
    id: 'ranger_corps',
    name: 'Корпус стрелков',
    description: '+10% атаки и скорости при наличии 2+ стрелков',
    requiredRoles: [{ role: 'ranged_dps', count: 2 }],
    bonuses: [
      { stat: 'atk', percentage: 0.10 },
      { stat: 'speed', percentage: 0.10 },
    ],
    icon: '🏹',
  },
  {
    id: 'healing_aura',
    name: 'Аура исцеления',
    description: '+15% HP всем при наличии 2+ саппортов',
    requiredRoles: [{ role: 'support', count: 2 }],
    bonuses: [{ stat: 'hp', percentage: 0.15 }],
    icon: '💚',
  },
  {
    id: 'balanced',
    name: 'Баланс',
    description: '+5% ко всем характеристикам при наличии танка, бойца и саппорта',
    requiredRoles: [
      { role: 'tank', count: 1 },
      { role: 'melee_dps', count: 1 },
      { role: 'support', count: 1 },
    ],
    bonuses: [{ stat: 'all', percentage: 0.05 }],
    icon: '⚖️',
  },
  {
    id: 'arcane_army',
    name: 'Армия арканы',
    description: '+10% атаки при наличии мага и контролёра',
    requiredRoles: [
      { role: 'mage', count: 1 },
      { role: 'control', count: 1 },
    ],
    bonuses: [
      { stat: 'atk', percentage: 0.10 },
      { stat: 'initiative', percentage: 0.10 },
    ],
    icon: '✨',
  },
  {
    id: 'iron_wall',
    name: 'Железная стена',
    description: '+20% брони при наличии 3+ танков',
    requiredRoles: [{ role: 'tank', count: 3 }],
    bonuses: [{ stat: 'armor', percentage: 0.20 }],
    icon: '🏰',
  },
  {
    id: 'glass_cannon',
    name: 'Стеклянная пушка',
    description: '+25% атаки при наличии 3+ магов (без танков)',
    requiredRoles: [{ role: 'mage', count: 3 }],
    bonuses: [{ stat: 'atk', percentage: 0.25 }],
    icon: '💥',
  },
  {
    id: 'swift_strike',
    name: 'Быстрый удар',
    description: '+15% инициативы при наличии стрелка и ближнего бойца',
    requiredRoles: [
      { role: 'ranged_dps', count: 1 },
      { role: 'melee_dps', count: 1 },
    ],
    bonuses: [{ stat: 'initiative', percentage: 0.15 }],
    icon: '⚡',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Count units by role in a team.
 * 
 * @param units - Array of placed units
 * @returns Map of role to count
 */
function countUnitsByRole(units: PlacedUnit[]): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const unit of units) {
    const role = UNIT_ROLES[unit.unitId];
    if (role) {
      const currentCount = counts.get(role) ?? 0;
      counts.set(role, currentCount + 1);
    }
  }
  
  return counts;
}

/**
 * Check if a synergy's requirements are met by the team.
 * 
 * @param synergy - Synergy to check
 * @param roleCounts - Map of role to count
 * @returns True if all requirements are met
 */
function checkSynergyRequirements(
  synergy: Synergy,
  roleCounts: Map<string, number>
): boolean {
  for (const requirement of synergy.requiredRoles) {
    const count = roleCounts.get(requirement.role) ?? 0;
    if (count < requirement.count) {
      return false;
    }
  }
  return true;
}

/**
 * Get units that contribute to a synergy.
 * 
 * @param synergy - Synergy to check
 * @param units - Array of placed units
 * @returns Array of unit IDs that contribute
 */
function getContributingUnits(
  synergy: Synergy,
  units: PlacedUnit[]
): string[] {
  const requiredRoles = new Set(synergy.requiredRoles.map(r => r.role));
  return units
    .filter(unit => {
      const role = UNIT_ROLES[unit.unitId];
      return role && requiredRoles.has(role);
    })
    .map(unit => unit.unitId);
}

/**
 * Calculate active synergies for a team composition.
 * 
 * @param units - Array of placed units in the team
 * @returns Array of active synergies with contributing units
 */
function calculateSynergies(units: PlacedUnit[]): ActiveSynergy[] {
  if (units.length === 0) {
    return [];
  }
  
  const roleCounts = countUnitsByRole(units);
  const activeSynergies: ActiveSynergy[] = [];
  
  for (const synergy of SYNERGIES) {
    if (checkSynergyRequirements(synergy, roleCounts)) {
      // Special case: Glass Cannon requires NO tanks
      if (synergy.id === 'glass_cannon') {
        const tankCount = roleCounts.get('tank') ?? 0;
        if (tankCount > 0) {
          continue; // Skip if team has tanks
        }
      }
      
      activeSynergies.push({
        ...synergy,
        contributingUnits: getContributingUnits(synergy, units),
      });
    }
  }
  
  return activeSynergies;
}

/**
 * Format synergy bonus for display.
 * 
 * @param bonus - Synergy bonus to format
 * @returns Formatted string (e.g., "+10% HP")
 */
function formatSynergyBonus(bonus: SynergyBonus): string {
  const statNames: Record<string, string> = {
    hp: 'HP',
    atk: 'ATK',
    armor: 'Броня',
    speed: 'Скорость',
    initiative: 'Инициатива',
    dodge: 'Уклонение',
    all: 'все характеристики',
  };
  
  const percentText = `+${Math.round(bonus.percentage * 100)}%`;
  const statName = statNames[bonus.stat] || bonus.stat;
  
  if (bonus.flat !== undefined) {
    return `${percentText} ${statName} (+${bonus.flat})`;
  }
  
  return `${percentText} ${statName}`;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Individual synergy card component.
 */
interface SynergyCardProps {
  synergy: ActiveSynergy;
  variant: 'full' | 'compact';
}

function SynergyCard({ synergy, variant }: SynergyCardProps) {
  const bonusText = synergy.bonuses
    .map(bonus => formatSynergyBonus(bonus))
    .join(', ');

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 border border-purple-500/50 rounded-lg">
        <span className="text-lg">{synergy.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-purple-300 truncate">
            {synergy.name}
          </div>
          <div className="text-xs text-purple-400 truncate">
            {bonusText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{synergy.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-purple-300">
            {synergy.name}
          </div>
          <div className="text-xs text-purple-400">
            {bonusText}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400">
        {synergy.description}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SynergyDisplay component for showing active team synergies.
 * Calculates and displays synergies based on current team composition.
 * 
 * @param props - Component props
 * @returns Synergy display component
 * @example
 * // Full variant with detailed cards
 * <SynergyDisplay
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="full"
 * />
 * 
 * // Compact variant for smaller spaces
 * <SynergyDisplay
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="compact"
 * />
 */
export function SynergyDisplay({
  units,
  unitTemplates,
  variant = 'full',
  className = '',
}: SynergyDisplayProps) {
  /**
   * Calculate active synergies with memoization for performance.
   */
  const activeSynergies = useMemo(() => {
    return calculateSynergies(units);
  }, [units]);

  // Empty state
  if (activeSynergies.length === 0) {
    return (
      <div className={`text-center text-gray-500 text-sm py-4 ${className}`}>
        <div className="text-2xl mb-2">⚡</div>
        <div>Нет активных синергий</div>
        <div className="text-xs text-gray-600 mt-1">
          Добавьте юнитов одинаковых ролей для активации бонусов
        </div>
      </div>
    );
  }

  // Render synergies
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-purple-400">⚡</span>
        <span className="text-sm font-medium text-purple-300">
          Синергии ({activeSynergies.length})
        </span>
      </div>

      {/* Synergy list */}
      <div className={`space-y-2 ${variant === 'compact' ? 'max-h-32 overflow-y-auto' : ''}`}>
        {activeSynergies.map(synergy => (
          <SynergyCard
            key={synergy.id}
            synergy={synergy}
            variant={variant}
          />
        ))}
      </div>

      {/* Summary for compact variant */}
      {variant === 'compact' && activeSynergies.length > 2 && (
        <div className="text-xs text-purple-400 mt-2 text-center">
          +{activeSynergies.length - 2} синергий
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SynergyDisplayProps, ActiveSynergy, Synergy };