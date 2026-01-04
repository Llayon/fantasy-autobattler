/**
 * SynergyIndicator component for Fantasy Autobattler.
 * Shows active synergies with icons, names, bonuses, and tooltips.
 * Highlights when a synergy is newly activated.
 * 
 * @fileoverview Component for displaying team synergies in Team Builder.
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
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
  /** Whether this synergy was just activated */
  isNew?: boolean;
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
 * SynergyIndicator component props.
 */
interface SynergyIndicatorProps {
  /** Array of placed units in the team */
  units: PlacedUnit[];
  /** Available unit templates for role lookup */
  unitTemplates: UnitTemplate[];
  /** Display variant */
  variant?: 'full' | 'compact' | 'minimal';
  /** Custom CSS classes */
  className?: string;
  /** Show highlight animation for new synergies */
  showHighlight?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Unit role mapping for synergy calculation */
const UNIT_ROLES: Record<UnitId, string> = {
  knight: 'tank',
  guardian: 'tank', 
  berserker: 'tank',
  rogue: 'melee_dps',
  duelist: 'melee_dps',
  assassin: 'melee_dps',
  archer: 'ranged_dps',
  crossbowman: 'ranged_dps',
  hunter: 'ranged_dps',
  mage: 'mage',
  warlock: 'mage',
  elementalist: 'mage',
  priest: 'support',
  bard: 'support',
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
          continue;
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
    all: 'все',
  };
  
  const percentText = `+${Math.round(bonus.percentage * 100)}%`;
  const statName = statNames[bonus.stat] || bonus.stat;
  
  return `${percentText} ${statName}`;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Tooltip component for synergy details.
 */
interface TooltipProps {
  synergy: ActiveSynergy;
  children: React.ReactNode;
}

function SynergyTooltip({ synergy, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {/* Tooltip */}
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-purple-500/50 rounded-lg shadow-xl">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
          
          {/* Content */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{synergy.icon}</span>
            <span className="font-medium text-purple-300">{synergy.name}</span>
          </div>
          
          <p className="text-sm text-gray-300 mb-2">{synergy.description}</p>
          
          <div className="text-xs text-purple-400">
            Бонусы: {synergy.bonuses.map(b => formatSynergyBonus(b)).join(', ')}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            Юнитов: {synergy.contributingUnits.length}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual synergy badge component.
 */
interface SynergyBadgeProps {
  synergy: ActiveSynergy;
  variant: 'full' | 'compact' | 'minimal';
  isHighlighted: boolean;
}

function SynergyBadge({ synergy, variant, isHighlighted }: SynergyBadgeProps) {
  const bonusText = synergy.bonuses
    .map(bonus => formatSynergyBonus(bonus))
    .join(', ');

  const baseClasses = `
    transition-all duration-300
    ${isHighlighted ? 'animate-pulse ring-2 ring-yellow-400 ring-opacity-75' : ''}
  `;

  if (variant === 'minimal') {
    return (
      <SynergyTooltip synergy={synergy}>
        <div className={`
          inline-flex items-center justify-center w-8 h-8 
          bg-purple-900/50 border border-purple-500/50 rounded-full
          cursor-help ${baseClasses}
        `}>
          <span className="text-sm">{synergy.icon}</span>
        </div>
      </SynergyTooltip>
    );
  }

  if (variant === 'compact') {
    return (
      <SynergyTooltip synergy={synergy}>
        <div className={`
          inline-flex items-center gap-1.5 px-2 py-1
          bg-purple-900/30 border border-purple-500/50 rounded-lg
          cursor-help ${baseClasses}
        `}>
          <span className="text-sm">{synergy.icon}</span>
          <span className="text-xs text-purple-300 font-medium truncate max-w-[80px]">
            {synergy.name}
          </span>
        </div>
      </SynergyTooltip>
    );
  }

  // Full variant
  return (
    <SynergyTooltip synergy={synergy}>
      <div className={`
        flex items-center gap-2 px-3 py-2
        bg-purple-900/30 border border-purple-500/50 rounded-lg
        cursor-help ${baseClasses}
      `}>
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
    </SynergyTooltip>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SynergyIndicator component for showing active team synergies.
 * Displays synergies with icons, names, bonuses, and tooltips.
 * Highlights newly activated synergies with animation.
 * 
 * @param props - Component props
 * @returns Synergy indicator component
 * @example
 * // Full variant with all details
 * <SynergyIndicator
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="full"
 *   showHighlight
 * />
 * 
 * // Compact variant for tight spaces
 * <SynergyIndicator
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="compact"
 * />
 * 
 * // Minimal variant (icons only)
 * <SynergyIndicator
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="minimal"
 * />
 */
export function SynergyIndicator({
  units,
  unitTemplates: _unitTemplates,
  variant = 'full',
  className = '',
  showHighlight = true,
}: SynergyIndicatorProps) {
  // Note: unitTemplates is available for future role lookup enhancements
  void _unitTemplates;
  // Track previous synergies for highlight detection
  const [previousSynergyIds, setPreviousSynergyIds] = useState<Set<string>>(new Set());
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  /**
   * Calculate active synergies with memoization.
   */
  const activeSynergies = useMemo(() => {
    return calculateSynergies(units);
  }, [units]);

  /**
   * Detect newly activated synergies and highlight them.
   * Uses ref to track previous synergies to avoid infinite loop.
   */
  useEffect(() => {
    if (!showHighlight) return;

    const currentIds = new Set(activeSynergies.map(s => s.id));
    const newIds = new Set<string>();

    // Find newly activated synergies
    currentIds.forEach(id => {
      if (!previousSynergyIds.has(id)) {
        newIds.add(id);
      }
    });

    // Update highlighted synergies if there are new ones
    if (newIds.size > 0) {
      setHighlightedIds(newIds);
      
      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightedIds(new Set());
      }, 2000);

      // Update previous synergies only when we have new ones
      setPreviousSynergyIds(currentIds);

      return () => clearTimeout(timer);
    }

    // Update previous synergies only if the set actually changed
    // Compare by converting to sorted arrays
    const prevArray = Array.from(previousSynergyIds).sort();
    const currArray = Array.from(currentIds).sort();
    const setsAreEqual = prevArray.length === currArray.length && 
      prevArray.every((id, i) => id === currArray[i]);
    
    if (!setsAreEqual) {
      setPreviousSynergyIds(currentIds);
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSynergies, showHighlight]); // Removed previousSynergyIds from deps to prevent infinite loop

  // Empty state
  if (activeSynergies.length === 0) {
    if (variant === 'minimal') {
      return null;
    }

    return (
      <div className={`text-center text-gray-500 text-sm py-2 ${className}`}>
        <span className="text-purple-400/50">⚡</span>
        <span className="ml-1">Нет синергий</span>
      </div>
    );
  }

  // Render based on variant
  const containerClasses = {
    full: 'space-y-2',
    compact: 'flex flex-wrap gap-2',
    minimal: 'flex gap-1',
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {/* Header for full variant */}
      {variant === 'full' && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-400">⚡</span>
          <span className="text-sm font-medium text-purple-300">
            Синергии ({activeSynergies.length})
          </span>
        </div>
      )}

      {/* Synergy badges */}
      {activeSynergies.map(synergy => (
        <SynergyBadge
          key={synergy.id}
          synergy={synergy}
          variant={variant}
          isHighlighted={highlightedIds.has(synergy.id)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SynergyIndicatorProps, ActiveSynergy, Synergy };