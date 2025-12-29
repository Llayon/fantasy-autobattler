/**
 * Unit Data Version Selector
 *
 * This module provides a centralized way to switch between different versions
 * of unit data (stable v1 vs experimental v2) using environment variables.
 *
 * Usage:
 * - Set UNITS_VERSION=v1 (default) for stable version
 * - Set UNITS_VERSION=v2 for experimental version
 *
 * @module roguelike/data/units.version-selector
 */

import { RoguelikeUnit, UnitUpgradeLine } from '../types/unit.types';

// Import both versions
import * as HumansV1 from './humans.units.v1';
import * as HumansV2 from './humans.units.v2';
import * as UndeadV1 from './undead.units.v1';
import * as UndeadV2 from './undead.units.v2';

/**
 * Get the current units version from environment.
 * Defaults to 'v1' (stable) if not specified.
 *
 * @returns The units version: 'v1' or 'v2'
 * @example
 * const version = getCurrentUnitsVersion();
 * console.log(version); // 'v1' or 'v2'
 */
export function getCurrentUnitsVersion(): 'v1' | 'v2' {
  const version = process.env['UNITS_VERSION'] || 'v1';
  if (version !== 'v1' && version !== 'v2') {
    console.warn(
      `Invalid UNITS_VERSION: ${version}. Defaulting to v1. Valid values: v1, v2`,
    );
    return 'v1';
  }
  return version;
}

/**
 * Get Humans T1 units for the current version.
 *
 * @returns Array of Humans T1 units
 * @example
 * const units = getHumansT1Units();
 * console.log(units.length); // 12
 */
export function getHumansT1Units(): RoguelikeUnit[] {
  const version = getCurrentUnitsVersion();
  return version === 'v2' ? HumansV2.HUMANS_T1_UNITS : HumansV1.HUMANS_T1_UNITS;
}

/**
 * Get Humans upgrade lines for the current version.
 *
 * @returns Array of Humans upgrade lines
 * @example
 * const lines = getHumansUpgradeLines();
 * console.log(lines.length); // 12
 */
export function getHumansUpgradeLines(): UnitUpgradeLine[] {
  const version = getCurrentUnitsVersion();
  return version === 'v2' ? HumansV2.HUMANS_UPGRADE_LINES : HumansV1.HUMANS_UPGRADE_LINES;
}

/**
 * Get all Humans units (all tiers) for the current version.
 *
 * @returns Array of all Humans units
 * @example
 * const allUnits = getHumansAllUnits();
 * console.log(allUnits.length); // 36 (12 units × 3 tiers)
 */
export function getHumansAllUnits(): RoguelikeUnit[] {
  const version = getCurrentUnitsVersion();
  return version === 'v2' ? HumansV2.HUMANS_ALL_UNITS : HumansV1.HUMANS_ALL_UNITS;
}

/**
 * Get Undead T1 units for the current version.
 *
 * @returns Array of Undead T1 units
 * @example
 * const units = getUndeadT1Units();
 * console.log(units.length); // 12
 */
export function getUndeadT1Units(): RoguelikeUnit[] {
  const version = getCurrentUnitsVersion();
  return version === 'v2' ? UndeadV2.UNDEAD_T1_UNITS : UndeadV1.UNDEAD_T1_UNITS;
}

/**
 * Get Undead upgrade lines for the current version.
 *
 * @returns Array of Undead upgrade lines
 * @example
 * const lines = getUndeadUpgradeLines();
 * console.log(lines.length); // 12
 */
export function getUndeadUpgradeLines(): UnitUpgradeLine[] {
  const version = getCurrentUnitsVersion();
  return version === 'v2' ? UndeadV2.UNDEAD_UPGRADE_LINES : UndeadV1.UNDEAD_UPGRADE_LINES;
}

/**
 * Get all Undead units (all tiers) for the current version.
 *
 * @returns Array of all Undead units
 * @example
 * const allUnits = getUndeadAllUnits();
 * console.log(allUnits.length); // 36 (12 units × 3 tiers)
 */
export function getUndeadAllUnits(): RoguelikeUnit[] {
  const version = getCurrentUnitsVersion();
  return version === 'v2' ? UndeadV2.UNDEAD_ALL_UNITS : UndeadV1.UNDEAD_ALL_UNITS;
}

/**
 * Log the current units version to console.
 * Useful for debugging which version is active.
 *
 * @example
 * logCurrentVersion();
 * // Output: "Units version: v1 (stable)"
 */
export function logCurrentVersion(): void {
  const version = getCurrentUnitsVersion();
  const label = version === 'v1' ? 'stable' : 'experimental';
  console.log(`Units version: ${version} (${label})`);
}
