/**
 * Unit Helper Functions for Roguelike Mode
 *
 * Provides functions to retrieve unit data by ID.
 *
 * @module roguelike/data/units.helpers
 */

import { RoguelikeUnit, UnitUpgradeLine } from '../types/unit.types';
import { HUMANS_T1_UNITS, HUMANS_UPGRADE_LINES } from './humans.units';
import { UNDEAD_T1_UNITS, UNDEAD_UPGRADE_LINES } from './undead.units';

/**
 * All T1 units from all factions.
 */
export const ALL_T1_UNITS: RoguelikeUnit[] = [
  ...HUMANS_T1_UNITS,
  ...UNDEAD_T1_UNITS,
];

/**
 * All upgrade lines from all factions.
 */
export const ALL_UPGRADE_LINES: UnitUpgradeLine[] = [
  ...HUMANS_UPGRADE_LINES,
  ...UNDEAD_UPGRADE_LINES,
];

/**
 * Map of unit ID to unit data for fast lookup.
 */
const UNIT_MAP: Map<string, RoguelikeUnit> = new Map();

// Build the map from all upgrade lines (includes T1, T2, T3)
for (const line of ALL_UPGRADE_LINES) {
  UNIT_MAP.set(line.t1.id, line.t1);
  UNIT_MAP.set(line.t2.id, line.t2);
  UNIT_MAP.set(line.t3.id, line.t3);
}

/**
 * Get a roguelike unit by ID.
 *
 * @param unitId - Unit identifier
 * @returns Unit data or undefined if not found
 * @example
 * const footman = getRoguelikeUnit('footman');
 * console.log(footman?.name); // 'Footman'
 */
export function getRoguelikeUnit(unitId: string): RoguelikeUnit | undefined {
  return UNIT_MAP.get(unitId);
}

/**
 * Check if a unit ID is valid.
 *
 * @param unitId - Unit identifier to check
 * @returns True if unit exists
 * @example
 * isValidRoguelikeUnit('footman'); // true
 * isValidRoguelikeUnit('invalid'); // false
 */
export function isValidRoguelikeUnit(unitId: string): boolean {
  return UNIT_MAP.has(unitId);
}

/**
 * Get all unit IDs.
 *
 * @returns Array of all unit IDs
 */
export function getAllRoguelikeUnitIds(): string[] {
  return Array.from(UNIT_MAP.keys());
}
