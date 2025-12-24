/**
 * Synergy System for Fantasy Autobattler.
 * Calculates and applies team composition bonuses based on unit roles.
 * 
 * @fileoverview Implements synergy detection and stat bonus application
 * for team compositions. Synergies reward strategic team building.
 */

import { UnitTemplate, BattleUnit, UnitRole } from '../../types/game.types';
import { UNIT_ROLES } from '../../config/game.constants';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Stat modifier type for synergy bonuses.
 */
export type StatModifier = 'hp' | 'atk' | 'armor' | 'speed' | 'initiative' | 'dodge';

/**
 * Synergy bonus definition.
 * Specifies which stats are modified and by how much.
 */
export interface SynergyBonus {
  /** Stat to modify */
  stat: StatModifier | 'all';
  /** Percentage bonus (0.1 = 10%) */
  percentage: number;
  /** Flat bonus value (added after percentage) */
  flat?: number;
}

/**
 * Role requirement for synergy activation.
 */
export interface RoleRequirement {
  /** Required unit role */
  role: UnitRole;
  /** Minimum count of units with this role */
  count: number;
}

/**
 * Complete synergy definition.
 */
export interface Synergy {
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
export interface ActiveSynergy extends Synergy {
  /** Unit IDs that contribute to this synergy */
  contributingUnits: string[];
}

// =============================================================================
// SYNERGY DEFINITIONS
// =============================================================================

/**
 * All available synergies in the game.
 * Synergies reward strategic team composition.
 */
export const SYNERGIES: Synergy[] = [
  // ==========================================================================
  // ROLE-BASED SYNERGIES
  // ==========================================================================
  
  {
    id: 'frontline',
    name: 'Передовая линия',
    description: '+10% HP всем юнитам при наличии 2+ танков',
    requiredRoles: [
      { role: UNIT_ROLES.TANK as UnitRole, count: 2 },
    ],
    bonuses: [
      { stat: 'hp', percentage: 0.10 },
    ],
    icon: '🛡️',
  },
  
  {
    id: 'magic_circle',
    name: 'Магический круг',
    description: '+15% атаки магам при наличии 2+ магов',
    requiredRoles: [
      { role: UNIT_ROLES.MAGE as UnitRole, count: 2 },
    ],
    bonuses: [
      { stat: 'atk', percentage: 0.15 },
    ],
    icon: '🔮',
  },
  
  {
    id: 'assassin_guild',
    name: 'Гильдия убийц',
    description: '+20% уклонения при наличии 2+ ближних бойцов',
    requiredRoles: [
      { role: UNIT_ROLES.MELEE_DPS as UnitRole, count: 2 },
    ],
    bonuses: [
      { stat: 'dodge', percentage: 0.20 },
    ],
    icon: '🗡️',
  },
  
  {
    id: 'ranger_corps',
    name: 'Корпус стрелков',
    description: '+10% атаки и скорости при наличии 2+ стрелков',
    requiredRoles: [
      { role: UNIT_ROLES.RANGED_DPS as UnitRole, count: 2 },
    ],
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
    requiredRoles: [
      { role: UNIT_ROLES.SUPPORT as UnitRole, count: 2 },
    ],
    bonuses: [
      { stat: 'hp', percentage: 0.15 },
    ],
    icon: '💚',
  },
  
  // ==========================================================================
  // COMPOSITION SYNERGIES
  // ==========================================================================
  
  {
    id: 'balanced',
    name: 'Баланс',
    description: '+5% ко всем характеристикам при наличии танка, бойца и саппорта',
    requiredRoles: [
      { role: UNIT_ROLES.TANK as UnitRole, count: 1 },
      { role: UNIT_ROLES.MELEE_DPS as UnitRole, count: 1 },
      { role: UNIT_ROLES.SUPPORT as UnitRole, count: 1 },
    ],
    bonuses: [
      { stat: 'all', percentage: 0.05 },
    ],
    icon: '⚖️',
  },
  
  {
    id: 'arcane_army',
    name: 'Армия арканы',
    description: '+10% атаки при наличии мага и контролёра',
    requiredRoles: [
      { role: UNIT_ROLES.MAGE as UnitRole, count: 1 },
      { role: UNIT_ROLES.CONTROL as UnitRole, count: 1 },
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
    requiredRoles: [
      { role: UNIT_ROLES.TANK as UnitRole, count: 3 },
    ],
    bonuses: [
      { stat: 'armor', percentage: 0.20 },
    ],
    icon: '🏰',
  },
  
  {
    id: 'glass_cannon',
    name: 'Стеклянная пушка',
    description: '+25% атаки при наличии 3+ магов (без танков)',
    requiredRoles: [
      { role: UNIT_ROLES.MAGE as UnitRole, count: 3 },
    ],
    bonuses: [
      { stat: 'atk', percentage: 0.25 },
    ],
    icon: '💥',
  },
  
  {
    id: 'swift_strike',
    name: 'Быстрый удар',
    description: '+15% инициативы при наличии стрелка и ближнего бойца',
    requiredRoles: [
      { role: UNIT_ROLES.RANGED_DPS as UnitRole, count: 1 },
      { role: UNIT_ROLES.MELEE_DPS as UnitRole, count: 1 },
    ],
    bonuses: [
      { stat: 'initiative', percentage: 0.15 },
    ],
    icon: '⚡',
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Count units by role in a team.
 * 
 * @param units - Array of unit templates
 * @returns Map of role to count
 */
function countUnitsByRole(units: UnitTemplate[]): Map<UnitRole, number> {
  const counts = new Map<UnitRole, number>();
  
  for (const unit of units) {
    const currentCount = counts.get(unit.role) ?? 0;
    counts.set(unit.role, currentCount + 1);
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
  roleCounts: Map<UnitRole, number>
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
 * @param units - Array of unit templates
 * @returns Array of unit IDs that contribute
 */
function getContributingUnits(
  synergy: Synergy,
  units: UnitTemplate[]
): string[] {
  const requiredRoles = new Set(synergy.requiredRoles.map(r => r.role));
  return units
    .filter(unit => requiredRoles.has(unit.role))
    .map(unit => unit.id);
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Calculate active synergies for a team composition.
 * Analyzes team roles and returns all synergies that are activated.
 * 
 * @param team - Array of unit templates in the team
 * @returns Array of active synergies with contributing units
 * @example
 * const synergies = calculateSynergies([knight, guardian, mage]);
 * // Returns: [{ id: 'frontline', ... }]
 */
export function calculateSynergies(team: UnitTemplate[]): ActiveSynergy[] {
  if (team.length === 0) {
    return [];
  }
  
  const roleCounts = countUnitsByRole(team);
  const activeSynergies: ActiveSynergy[] = [];
  
  for (const synergy of SYNERGIES) {
    if (checkSynergyRequirements(synergy, roleCounts)) {
      // Special case: Glass Cannon requires NO tanks
      if (synergy.id === 'glass_cannon') {
        const tankCount = roleCounts.get(UNIT_ROLES.TANK as UnitRole) ?? 0;
        if (tankCount > 0) {
          continue;
        }
      }
      
      activeSynergies.push({
        ...synergy,
        contributingUnits: getContributingUnits(synergy, team),
      });
    }
  }
  
  return activeSynergies;
}

/**
 * Apply a single stat bonus to a unit.
 * 
 * @param unit - Battle unit to modify
 * @param bonus - Bonus to apply
 * @returns Modified battle unit
 */
function applyStatBonus(unit: BattleUnit, bonus: SynergyBonus): BattleUnit {
  const modified = { ...unit, stats: { ...unit.stats } };
  
  if (bonus.stat === 'all') {
    modified.stats.hp = Math.round(modified.stats.hp * (1 + bonus.percentage));
    modified.stats.atk = Math.round(modified.stats.atk * (1 + bonus.percentage));
    modified.stats.armor = Math.round(modified.stats.armor * (1 + bonus.percentage));
    modified.stats.speed = Math.round(modified.stats.speed * (1 + bonus.percentage));
    modified.stats.initiative = Math.round(modified.stats.initiative * (1 + bonus.percentage));
    modified.stats.dodge = Math.min(50, Math.round(modified.stats.dodge * (1 + bonus.percentage)));
    
    modified.maxHp = modified.stats.hp;
    modified.currentHp = Math.round(modified.currentHp * (1 + bonus.percentage));
  } else {
    switch (bonus.stat) {
      case 'hp':
        modified.stats.hp = Math.round(modified.stats.hp * (1 + bonus.percentage));
        modified.maxHp = modified.stats.hp;
        modified.currentHp = Math.round(modified.currentHp * (1 + bonus.percentage));
        break;
      case 'atk':
        modified.stats.atk = Math.round(modified.stats.atk * (1 + bonus.percentage));
        break;
      case 'armor':
        modified.stats.armor = Math.round(modified.stats.armor * (1 + bonus.percentage));
        break;
      case 'speed':
        modified.stats.speed = Math.round(modified.stats.speed * (1 + bonus.percentage));
        break;
      case 'initiative':
        modified.stats.initiative = Math.round(modified.stats.initiative * (1 + bonus.percentage));
        break;
      case 'dodge':
        modified.stats.dodge = Math.min(50, Math.round(modified.stats.dodge * (1 + bonus.percentage)));
        break;
    }
    
    if (bonus.flat !== undefined) {
      switch (bonus.stat) {
        case 'hp':
          modified.stats.hp += bonus.flat;
          modified.maxHp = modified.stats.hp;
          modified.currentHp += bonus.flat;
          break;
        case 'atk':
          modified.stats.atk += bonus.flat;
          break;
        case 'armor':
          modified.stats.armor += bonus.flat;
          break;
        case 'speed':
          modified.stats.speed += bonus.flat;
          break;
        case 'initiative':
          modified.stats.initiative += bonus.flat;
          break;
        case 'dodge':
          modified.stats.dodge = Math.min(50, modified.stats.dodge + bonus.flat);
          break;
      }
    }
  }
  
  return modified;
}

/**
 * Apply synergy bonuses to all units in a team.
 * Modifies unit stats based on active synergies.
 * 
 * @param units - Array of battle units to modify
 * @param synergies - Array of active synergies to apply
 * @returns Array of modified battle units with synergy bonuses
 * @example
 * const modifiedUnits = applySynergyBonuses(battleUnits, activeSynergies);
 */
export function applySynergyBonuses(
  units: BattleUnit[],
  synergies: ActiveSynergy[]
): BattleUnit[] {
  if (synergies.length === 0) {
    return units;
  }
  
  let modifiedUnits = [...units];
  
  for (const synergy of synergies) {
    for (const bonus of synergy.bonuses) {
      modifiedUnits = modifiedUnits.map(unit => applyStatBonus(unit, bonus));
    }
  }
  
  return modifiedUnits;
}

/**
 * Get synergy by ID.
 * 
 * @param synergyId - Synergy identifier
 * @returns Synergy definition or undefined
 * @example
 * const synergy = getSynergyById('frontline');
 */
export function getSynergyById(synergyId: string): Synergy | undefined {
  return SYNERGIES.find(s => s.id === synergyId);
}

/**
 * Get all available synergies.
 * 
 * @returns Array of all synergy definitions
 * @example
 * const allSynergies = getAllSynergies();
 */
export function getAllSynergies(): Synergy[] {
  return [...SYNERGIES];
}

/**
 * Calculate total stat bonus from synergies for a specific stat.
 * 
 * @param synergies - Array of active synergies
 * @param stat - Stat to calculate bonus for
 * @returns Total percentage bonus (0.1 = 10%)
 * @example
 * const hpBonus = calculateTotalStatBonus(synergies, 'hp');
 */
export function calculateTotalStatBonus(
  synergies: ActiveSynergy[],
  stat: StatModifier
): number {
  let totalBonus = 0;
  
  for (const synergy of synergies) {
    for (const bonus of synergy.bonuses) {
      if (bonus.stat === stat || bonus.stat === 'all') {
        totalBonus += bonus.percentage;
      }
    }
  }
  
  return totalBonus;
}

/**
 * Format synergy bonus for display.
 * 
 * @param bonus - Synergy bonus to format
 * @returns Formatted string (e.g., "+10% HP")
 * @example
 * const text = formatSynergyBonus({ stat: 'hp', percentage: 0.1 });
 */
export function formatSynergyBonus(bonus: SynergyBonus): string {
  const statNames: Record<StatModifier | 'all', string> = {
    hp: 'HP',
    atk: 'ATK',
    armor: 'Броня',
    speed: 'Скорость',
    initiative: 'Инициатива',
    dodge: 'Уклонение',
    all: 'все характеристики',
  };
  
  const percentText = `+${Math.round(bonus.percentage * 100)}%`;
  const statName = statNames[bonus.stat];
  
  if (bonus.flat !== undefined) {
    return `${percentText} ${statName} (+${bonus.flat})`;
  }
  
  return `${percentText} ${statName}`;
}
