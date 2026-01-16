/**
 * Units Registry
 *
 * Central registry for all roguelike units including Core 2.0 specialized units.
 * Provides unified access to all unit data.
 *
 * @module roguelike/data/units.registry
 */

import { RoguelikeUnit, UnitUpgradeLine } from '../types/unit.types';
import { Faction } from '../types/faction.types';
import {
  HUMANS_T1_UNITS,
  HUMANS_UPGRADE_LINES,
  HUMANS_ALL_UNITS,
  UNDEAD_T1_UNITS,
  UNDEAD_UPGRADE_LINES,
  UNDEAD_ALL_UNITS,
  CORE2_T1_UNITS,
  CORE2_UPGRADE_LINES,
  CORE2_ALL_UNITS,
  CORE2_HUMANS_UNITS,
  CORE2_UNDEAD_UNITS,
} from './index';

/**
 * All T1 units (purchasable) including Core 2.0.
 */
export const ALL_T1_UNITS: RoguelikeUnit[] = [
  ...HUMANS_T1_UNITS,
  ...UNDEAD_T1_UNITS,
  ...CORE2_T1_UNITS,
];

/**
 * All unit upgrade lines including Core 2.0.
 */
export const ALL_UPGRADE_LINES: UnitUpgradeLine[] = [
  ...HUMANS_UPGRADE_LINES,
  ...UNDEAD_UPGRADE_LINES,
  ...CORE2_UPGRADE_LINES,
];

/**
 * All units (all tiers) including Core 2.0.
 */
export const ALL_UNITS: RoguelikeUnit[] = [
  ...HUMANS_ALL_UNITS,
  ...UNDEAD_ALL_UNITS,
  ...CORE2_ALL_UNITS,
];

/**
 * All Humans units including Core 2.0.
 */
export const ALL_HUMANS_UNITS: RoguelikeUnit[] = [
  ...HUMANS_ALL_UNITS,
  ...CORE2_HUMANS_UNITS.flatMap((unit) => {
    const line = CORE2_UPGRADE_LINES.find((l) => l.baseId === unit.id);
    return line ? [line.t1, line.t2, line.t3] : [unit];
  }),
];

/**
 * All Undead units including Core 2.0.
 */
export const ALL_UNDEAD_UNITS: RoguelikeUnit[] = [
  ...UNDEAD_ALL_UNITS,
  ...CORE2_UNDEAD_UNITS.flatMap((unit) => {
    const line = CORE2_UPGRADE_LINES.find((l) => l.baseId === unit.id);
    return line ? [line.t1, line.t2, line.t3] : [unit];
  }),
];

/**
 * Get unit by ID from all units.
 *
 * @param unitId - Unit ID to search for
 * @returns Unit definition or undefined if not found
 * @example
 * const cavalry = getUnitById('light_cavalry');
 */
export function getUnitById(unitId: string): RoguelikeUnit | undefined {
  return ALL_UNITS.find((u) => u.id === unitId);
}

/**
 * Get all T1 units for a faction including Core 2.0.
 *
 * @param faction - Faction to get units for
 * @returns Array of T1 units for the faction
 * @example
 * const humansUnits = getT1UnitsByFaction('humans');
 */
export function getT1UnitsByFaction(faction: Faction): RoguelikeUnit[] {
  return ALL_T1_UNITS.filter((u) => u.faction === faction);
}

/**
 * Get all units for a faction including Core 2.0.
 *
 * @param faction - Faction to get units for
 * @returns Array of all units (all tiers) for the faction
 * @example
 * const undeadUnits = getAllUnitsByFaction('undead');
 */
export function getAllUnitsByFaction(faction: Faction): RoguelikeUnit[] {
  return ALL_UNITS.filter((u) => u.faction === faction);
}

/**
 * Get upgrade line for a base unit ID.
 *
 * @param baseUnitId - Base unit ID (e.g., 'footman', 'light_cavalry')
 * @returns Upgrade line or undefined if not found
 * @example
 * const cavalryLine = getUpgradeLine('light_cavalry');
 */
export function getUpgradeLine(baseUnitId: string): UnitUpgradeLine | undefined {
  return ALL_UPGRADE_LINES.find((line) => line.baseId === baseUnitId);
}

/**
 * Check if a unit is a Core 2.0 specialized unit.
 *
 * @param unitId - Unit ID to check
 * @returns True if unit is from Core 2.0
 * @example
 * const isCavalry = isCore2Unit('light_cavalry'); // true
 * const isKnight = isCore2Unit('knight'); // false
 */
export function isCore2Unit(unitId: string): boolean {
  return CORE2_T1_UNITS.some((u) => u.id === unitId || u.baseUnitId === unitId);
}

/**
 * Get all Core 2.0 units for a faction.
 *
 * @param faction - Faction to get Core 2.0 units for
 * @returns Array of Core 2.0 units for the faction
 * @example
 * const humansCore2 = getCore2UnitsByFaction('humans');
 */
export function getCore2UnitsByFaction(faction: Faction): RoguelikeUnit[] {
  return CORE2_T1_UNITS.filter((u) => u.faction === faction);
}

/**
 * Get unit count statistics.
 *
 * @returns Object with unit counts
 * @example
 * const stats = getUnitStats();
 * console.log(`Total units: ${stats.total}`);
 */
export function getUnitStats(): {
  total: number;
  t1: number;
  humans: number;
  undead: number;
  core2: number;
} {
  return {
    total: ALL_UNITS.length,
    t1: ALL_T1_UNITS.length,
    humans: ALL_HUMANS_UNITS.length,
    undead: ALL_UNDEAD_UNITS.length,
    core2: CORE2_ALL_UNITS.length,
  };
}
