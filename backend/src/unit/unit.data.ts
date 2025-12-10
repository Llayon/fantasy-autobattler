/**
 * Unit templates and data for Fantasy Autobattler.
 * Contains all 15 unit definitions with exact stats from GDD.
 * 
 * @fileoverview Complete unit database with templates, creation functions,
 * and utility methods for team generation and validation.
 */

import { UnitTemplate, UnitRole } from '../types/game.types';
import { UNIT_ROLES, GAMEPLAY_VALUES } from '../config/game.constants';

// =============================================================================
// UNIT TYPE DEFINITIONS
// =============================================================================

/**
 * All available unit IDs in the game.
 * Expanded from MVP (3 units) to full game (15 units).
 */
export type UnitId = 
  // Tanks (3)
  | 'knight' | 'guardian' | 'berserker'
  // Melee DPS (3)  
  | 'rogue' | 'duelist' | 'assassin'
  // Ranged DPS (3)
  | 'archer' | 'crossbowman' | 'hunter'
  // Mages (3)
  | 'mage' | 'warlock' | 'elementalist'
  // Support (2)
  | 'priest' | 'bard'
  // Control (1)
  | 'enchanter';

/**
 * Legacy unit type for backward compatibility.
 * @deprecated Use UnitId instead for new code.
 */
export type UnitType = 'Warrior' | 'Mage' | 'Healer';

/**
 * Legacy unit stats interface for backward compatibility.
 * @deprecated Use UnitTemplate from game.types.ts for new code.
 */
export interface UnitStats {
  type: UnitType;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

// =============================================================================
// UNIT TEMPLATES DATABASE
// =============================================================================

/**
 * Complete unit templates database with all 15 units.
 * Stats are taken directly from GDD section 6.1.
 */
export const UNIT_TEMPLATES: Record<UnitId, UnitTemplate> = {
  // ==========================================================================
  // TANKS (3) - High HP and armor, low damage
  // ==========================================================================
  
  knight: {
    id: 'knight',
    name: 'Рыцарь',
    role: UNIT_ROLES.TANK as UnitRole,
    cost: 5,
    stats: {
      hp: 120,
      atk: 12,
      atkCount: 1,
      armor: 8,
      speed: 2,
      initiative: 4,
      dodge: 5, // 5%
    },
    range: 1,
    abilities: ['shield_wall'],
  },

  guardian: {
    id: 'guardian',
    name: 'Страж',
    role: UNIT_ROLES.TANK as UnitRole,
    cost: 6,
    stats: {
      hp: 150,
      atk: 8,
      atkCount: 1,
      armor: 12,
      speed: 1,
      initiative: 3,
      dodge: 0, // 0%
    },
    range: 1,
    abilities: ['taunt'],
  },

  berserker: {
    id: 'berserker',
    name: 'Берсерк',
    role: UNIT_ROLES.TANK as UnitRole,
    cost: 7,
    stats: {
      hp: 100,
      atk: 18,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 6,
      dodge: 0, // 0%
    },
    range: 1,
    abilities: ['rage'],
  },

  // ==========================================================================
  // MELEE DPS (3) - High damage, medium survivability
  // ==========================================================================

  rogue: {
    id: 'rogue',
    name: 'Разбойник',
    role: UNIT_ROLES.MELEE_DPS as UnitRole,
    cost: 5,
    stats: {
      hp: 70,
      atk: 15,
      atkCount: 2,
      armor: 3,
      speed: 4,
      initiative: 9,
      dodge: 25, // 25%
    },
    range: 1,
    abilities: ['backstab'],
  },

  duelist: {
    id: 'duelist',
    name: 'Дуэлянт',
    role: UNIT_ROLES.MELEE_DPS as UnitRole,
    cost: 6,
    stats: {
      hp: 80,
      atk: 20,
      atkCount: 1,
      armor: 4,
      speed: 3,
      initiative: 8,
      dodge: 15, // 15%
    },
    range: 1,
    abilities: ['riposte'],
  },

  assassin: {
    id: 'assassin',
    name: 'Убийца',
    role: UNIT_ROLES.MELEE_DPS as UnitRole,
    cost: 8,
    stats: {
      hp: 55,
      atk: 28,
      atkCount: 1,
      armor: 2,
      speed: 5,
      initiative: 10,
      dodge: 20, // 20%
    },
    range: 1,
    abilities: ['execute'],
  },

  // ==========================================================================
  // RANGED DPS (3) - High damage from distance
  // ==========================================================================

  archer: {
    id: 'archer',
    name: 'Лучник',
    role: UNIT_ROLES.RANGED_DPS as UnitRole,
    cost: 4,
    stats: {
      hp: 60,
      atk: 18,
      atkCount: 1,
      armor: 2,
      speed: 3,
      initiative: 7,
      dodge: 10, // 10%
    },
    range: 4,
    abilities: ['volley'],
  },

  crossbowman: {
    id: 'crossbowman',
    name: 'Арбалетчик',
    role: UNIT_ROLES.RANGED_DPS as UnitRole,
    cost: 5,
    stats: {
      hp: 65,
      atk: 22,
      atkCount: 1,
      armor: 3,
      speed: 2,
      initiative: 5,
      dodge: 5, // 5%
    },
    range: 5,
    abilities: ['piercing_shot'],
  },

  hunter: {
    id: 'hunter',
    name: 'Охотник',
    role: UNIT_ROLES.RANGED_DPS as UnitRole,
    cost: 6,
    stats: {
      hp: 70,
      atk: 16,
      atkCount: 2,
      armor: 2,
      speed: 3,
      initiative: 6,
      dodge: 15, // 15%
    },
    range: 4,
    abilities: ['trap'],
  },

  // ==========================================================================
  // MAGES (3) - Magic damage, ignores armor
  // ==========================================================================

  mage: {
    id: 'mage',
    name: 'Маг',
    role: UNIT_ROLES.MAGE as UnitRole,
    cost: 6,
    stats: {
      hp: 50,
      atk: 25,
      atkCount: 1,
      armor: 0,
      speed: 2,
      initiative: 6,
      dodge: 0, // 0%
    },
    range: 3,
    abilities: ['fireball'],
  },

  warlock: {
    id: 'warlock',
    name: 'Чернокнижник',
    role: UNIT_ROLES.MAGE as UnitRole,
    cost: 7,
    stats: {
      hp: 60,
      atk: 20,
      atkCount: 1,
      armor: 2,
      speed: 2,
      initiative: 5,
      dodge: 0, // 0%
    },
    range: 3,
    abilities: ['drain_life'],
  },

  elementalist: {
    id: 'elementalist',
    name: 'Элементалист',
    role: UNIT_ROLES.MAGE as UnitRole,
    cost: 8,
    stats: {
      hp: 45,
      atk: 30,
      atkCount: 1,
      armor: 0,
      speed: 2,
      initiative: 7,
      dodge: 0, // 0%
    },
    range: 4,
    abilities: ['chain_lightning'],
  },

  // ==========================================================================
  // SUPPORT (2) - Healing and buffs
  // ==========================================================================

  priest: {
    id: 'priest',
    name: 'Жрец',
    role: UNIT_ROLES.SUPPORT as UnitRole,
    cost: 4,
    stats: {
      hp: 55,
      atk: 8,
      atkCount: 1,
      armor: 2,
      speed: 2,
      initiative: 5,
      dodge: 5, // 5%
    },
    range: 2,
    abilities: ['heal'],
  },

  bard: {
    id: 'bard',
    name: 'Бард',
    role: UNIT_ROLES.SUPPORT as UnitRole,
    cost: 5,
    stats: {
      hp: 50,
      atk: 10,
      atkCount: 1,
      armor: 1,
      speed: 3,
      initiative: 6,
      dodge: 10, // 10%
    },
    range: 2,
    abilities: ['inspire'],
  },

  // ==========================================================================
  // CONTROL (1) - Crowd control abilities
  // ==========================================================================

  enchanter: {
    id: 'enchanter',
    name: 'Чародей',
    role: UNIT_ROLES.CONTROL as UnitRole,
    cost: 6,
    stats: {
      hp: 45,
      atk: 12,
      atkCount: 1,
      armor: 1,
      speed: 2,
      initiative: 8,
      dodge: 5, // 5%
    },
    range: 3,
    abilities: ['stun'],
  },
};

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Legacy MVP unit templates for backward compatibility.
 * Maps old UnitType to new UnitTemplate system.
 * @deprecated Use UNIT_TEMPLATES directly for new code.
 */
export const LEGACY_UNIT_TEMPLATES: Record<UnitType, Omit<UnitStats, 'maxHp'>> = {
  Warrior: { 
    type: 'Warrior', 
    hp: 100, 
    atk: 15, 
    def: 10, 
    spd: 5 
  },
  Mage: { 
    type: 'Mage', 
    hp: 60, 
    atk: 25, 
    def: 3, 
    spd: 8 
  },
  Healer: { 
    type: 'Healer', 
    hp: 70, 
    atk: 8, 
    def: 5, 
    spd: 10 
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get unit template by ID.
 * 
 * @param unitId - The unit ID to retrieve
 * @returns Unit template or undefined if not found
 * @example
 * const knight = getUnitTemplate('knight');
 * console.log(knight?.name); // 'Рыцарь'
 */
export function getUnitTemplate(unitId: UnitId): UnitTemplate | undefined {
  return UNIT_TEMPLATES[unitId];
}

/**
 * Get all units by role.
 * 
 * @param role - The unit role to filter by
 * @returns Array of unit templates with the specified role
 * @example
 * const tanks = getUnitsByRole('tank');
 * console.log(tanks.length); // 3
 */
export function getUnitsByRole(role: UnitRole): UnitTemplate[] {
  return Object.values(UNIT_TEMPLATES).filter(unit => unit.role === role);
}

/**
 * Get all available unit IDs.
 * 
 * @returns Array of all unit IDs
 * @example
 * const allUnits = getAllUnitIds();
 * console.log(allUnits.length); // 15
 */
export function getAllUnitIds(): UnitId[] {
  return Object.keys(UNIT_TEMPLATES) as UnitId[];
}

/**
 * Calculate total team cost.
 * 
 * @param unitIds - Array of unit IDs in the team
 * @returns Total cost of all units
 * @example
 * const cost = calculateTeamCost(['knight', 'mage', 'priest']);
 * console.log(cost); // 15 (5 + 6 + 4)
 */
export function calculateTeamCost(unitIds: UnitId[]): number {
  return unitIds.reduce((total, unitId) => {
    const template = getUnitTemplate(unitId);
    return total + (template?.cost ?? 0);
  }, 0);
}

/**
 * Generate a random team for bot opponents.
 * Creates a balanced team within budget constraints.
 * 
 * @param budget - Maximum team budget (default: 30)
 * @returns Array of unit IDs forming a valid team
 * @example
 * const botTeam = generateRandomTeam(25);
 * console.log(calculateTeamCost(botTeam)); // <= 25
 */
export function generateRandomTeam(budget: number = 30): UnitId[] {
  const allUnits = getAllUnitIds();
  const team: UnitId[] = [];
  let remainingBudget = budget;
  
  // Shuffle units for randomness
  const shuffledUnits = [...allUnits].sort(() => Math.random() - 0.5);
  
  for (const unitId of shuffledUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget) {
      team.push(unitId);
      remainingBudget -= template.cost;
    }
    
    // Stop if we have a reasonable team size
    if (team.length >= 8) break;
  }
  
  return team;
}

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

/**
 * Create a legacy unit instance from a template.
 * @deprecated Use UnitTemplate directly for new code.
 * 
 * @param type - The legacy unit type to create
 * @returns Legacy unit stats with initialized values
 * @example
 * const warrior = createUnit('Warrior');
 * console.log(warrior.hp, warrior.maxHp); // 100, 100
 */
export function createUnit(type: UnitType): UnitStats {
  const template = LEGACY_UNIT_TEMPLATES[type];
  return { ...template, maxHp: template.hp };
}

/**
 * Generate a random legacy team for backward compatibility.
 * @deprecated Use generateRandomTeam() for new code.
 * 
 * @returns Array of 3 random legacy unit types
 * @example
 * const botTeam = getRandomTeam();
 * // ['Warrior', 'Mage', 'Healer']
 */
export function getRandomTeam(): UnitType[] {
  const types: UnitType[] = ['Warrior', 'Mage', 'Healer'];
  const team: UnitType[] = [];
  
  for (let i = 0; i < GAMEPLAY_VALUES.MVP_TEAM_SIZE; i++) {
    const randomIndex = Math.floor(Math.random() * types.length);
    const selectedType = types[randomIndex];
    if (selectedType) {
      team.push(selectedType);
    }
  }
  return team;
}