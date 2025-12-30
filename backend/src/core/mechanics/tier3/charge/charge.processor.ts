/**
 * Charge processor
 *
 * Implements cavalry momentum system.
 * - Momentum builds based on distance moved (20% per cell)
 * - Maximum momentum bonus: 100%
 * - Minimum 3 cells for charge bonus
 * - Spear Wall counters charges
 * - Shock damage to resolve on impact
 */

import { ChargeConfig } from '../../config/mechanics.types';
import { Position } from '../../tier0/facing';
import {
  ChargeUnit,
  MomentumResult,
  ChargeDamageResult,
  SpearWallResult,
  DEFAULT_CHARGE_VALUES,
} from './charge.types';

/**
 * Calculate Manhattan distance between two positions
 *
 * @param a - First position
 * @param b - Second position
 * @returns Manhattan distance
 */
export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if a unit has a specific tag
 *
 * @param unit - Unit to check
 * @param tags - Tags to look for
 * @returns true if unit has any of the specified tags
 */
export function hasTag(unit: ChargeUnit, tags: string[]): boolean {
  if (!unit.tags || unit.tags.length === 0) {
    return false;
  }
  return unit.tags.some((tag) => tags.includes(tag));
}

/**
 * Check if a unit is cavalry
 *
 * @param unit - Unit to check
 * @returns true if unit is cavalry
 */
export function isCavalry(unit: ChargeUnit): boolean {
  return hasTag(unit, DEFAULT_CHARGE_VALUES.cavalryTypes);
}

/**
 * Check if a unit can form a spear wall
 *
 * @param unit - Unit to check
 * @returns true if unit can counter charges
 */
export function isSpearWall(unit: ChargeUnit): boolean {
  return hasTag(unit, DEFAULT_CHARGE_VALUES.spearWallTypes);
}

/**
 * Calculate momentum based on distance moved
 *
 * Formula: min(maxMomentum, distance * momentumPerCell)
 *
 * @param distance - Distance moved in cells
 * @param config - Optional charge configuration
 * @returns Momentum result
 *
 * @example
 * const result = calculateMomentum(5);
 * // result.momentum === 1.0 (5 * 0.2 = 1.0, capped at max)
 */
export function calculateMomentum(
  distance: number,
  config?: Partial<ChargeConfig>,
): MomentumResult {
  const momentumPerCell = config?.momentumPerCell ?? DEFAULT_CHARGE_VALUES.momentumPerCell;
  const maxMomentum = config?.maxMomentum ?? DEFAULT_CHARGE_VALUES.maxMomentum;
  const minDistance = DEFAULT_CHARGE_VALUES.minChargeDistance;

  const rawMomentum = distance * momentumPerCell;
  const momentum = Math.min(maxMomentum, rawMomentum);
  const meetsMinDistance = distance >= minDistance;

  return {
    momentum: meetsMinDistance ? momentum : 0,
    distanceMoved: distance,
    bonusMultiplier: meetsMinDistance ? 1 + momentum : 1,
    meetsMinDistance,
  };
}

/**
 * Calculate momentum from start to end position
 *
 * @param startPosition - Starting position
 * @param endPosition - Ending position
 * @param config - Optional charge configuration
 * @returns Momentum result
 */
export function calculateMomentumFromPositions(
  startPosition: Position,
  endPosition: Position,
  config?: Partial<ChargeConfig>,
): MomentumResult {
  const distance = getDistance(startPosition, endPosition);
  return calculateMomentum(distance, config);
}

/**
 * Apply charge bonus to damage
 *
 * @param baseDamage - Base damage before charge bonus
 * @param momentum - Current momentum (0.0 to 1.0)
 * @param config - Optional charge configuration
 * @returns Modified damage
 *
 * @example
 * const damage = applyChargeBonus(10, 0.6);
 * // Returns 16 (10 * 1.6)
 */
export function applyChargeBonus(
  baseDamage: number,
  momentum: number,
  config?: Partial<ChargeConfig>,
): number {
  const maxMomentum = config?.maxMomentum ?? DEFAULT_CHARGE_VALUES.maxMomentum;
  const clampedMomentum = Math.min(maxMomentum, Math.max(0, momentum));

  return Math.floor(baseDamage * (1 + clampedMomentum));
}

/**
 * Check if charge is countered by spear wall
 *
 * @param charger - Charging unit
 * @param target - Target unit
 * @param config - Optional charge configuration
 * @returns Spear wall result
 *
 * @example
 * const result = checkSpearWallCounter(cavalry, spearman);
 * if (result.countered) {
 *   // Apply counter damage to charger
 * }
 */
export function checkSpearWallCounter(
  charger: ChargeUnit,
  target: ChargeUnit,
  _config?: Partial<ChargeConfig>,
): SpearWallResult {
  // Only cavalry can be countered
  if (!isCavalry(charger)) {
    return {
      countered: false,
      counterDamage: 0,
      chargeStops: false,
    };
  }

  // Only spear wall units can counter
  if (!isSpearWall(target)) {
    return {
      countered: false,
      counterDamage: 0,
      chargeStops: false,
    };
  }

  // Must be charging
  if (!charger.isCharging) {
    return {
      countered: false,
      counterDamage: 0,
      chargeStops: false,
    };
  }

  // Calculate counter damage (50% of target's ATK)
  const counterMultiplier = DEFAULT_CHARGE_VALUES.spearWallCounterDamage;
  const counterDamage = Math.floor(target.atk * counterMultiplier);

  return {
    countered: true,
    counterDamage,
    chargeStops: true,
  };
}

/**
 * Calculate complete charge damage result
 *
 * @param charger - Charging unit
 * @param target - Target unit
 * @param baseDamage - Base damage before modifiers
 * @param distanceMoved - Distance moved before attack
 * @param config - Optional charge configuration
 * @returns Complete charge damage result
 */
export function calculateChargeDamage(
  charger: ChargeUnit,
  target: ChargeUnit,
  baseDamage: number,
  distanceMoved: number,
): ChargeDamageResult {
  const momentumResult = calculateMomentum(distanceMoved);
  const spearWallResult = checkSpearWallCounter(charger, target);

  // If countered, charge is stopped and no bonus applies
  if (spearWallResult.countered) {
    return {
      baseDamage,
      momentumBonus: 0,
      finalDamage: baseDamage,
      shockResolveDamage: 0,
      wasCountered: true,
      counterDamage: spearWallResult.counterDamage,
    };
  }

  const finalDamage = applyChargeBonus(baseDamage, momentumResult.momentum);
  const momentumBonus = finalDamage - baseDamage;
  const shockResolveDamage = momentumResult.meetsMinDistance
    ? DEFAULT_CHARGE_VALUES.shockResolveDamage
    : 0;

  return {
    baseDamage,
    momentumBonus,
    finalDamage,
    shockResolveDamage,
    wasCountered: false,
    counterDamage: 0,
  };
}

/**
 * Start a charge for a unit
 *
 * @param unit - Unit to start charging
 * @returns Updated unit with charging state
 */
export function startCharge<T extends ChargeUnit>(unit: T): T {
  return {
    ...unit,
    isCharging: true,
    momentum: 0,
  };
}

/**
 * Update momentum during movement
 *
 * @param unit - Unit that is moving
 * @param distanceMoved - Distance moved this turn
 * @param config - Optional charge configuration
 * @returns Updated unit with new momentum
 */
export function updateMomentum<T extends ChargeUnit>(
  unit: T,
  distanceMoved: number,
  config?: Partial<ChargeConfig>,
): T {
  if (!unit.isCharging) {
    return unit;
  }

  const result = calculateMomentum(distanceMoved, config);

  return {
    ...unit,
    momentum: result.momentum,
  };
}

/**
 * End a charge (after attack or being stopped)
 *
 * @param unit - Unit to end charge for
 * @returns Updated unit with charge ended
 */
export function endCharge<T extends ChargeUnit>(unit: T): T {
  return {
    ...unit,
    isCharging: false,
    momentum: 0,
  };
}

/**
 * Check if unit can charge
 *
 * @param unit - Unit to check
 * @returns true if unit can initiate a charge
 */
export function canCharge(unit: ChargeUnit): boolean {
  return isCavalry(unit) && !unit.isCharging;
}

/**
 * Get charge damage multiplier
 *
 * @param momentum - Current momentum
 * @param config - Optional charge configuration
 * @returns Damage multiplier (1.0 to 2.0)
 */
export function getChargeDamageMultiplier(
  momentum: number,
  config?: Partial<ChargeConfig>,
): number {
  const maxMomentum = config?.maxMomentum ?? DEFAULT_CHARGE_VALUES.maxMomentum;
  const clampedMomentum = Math.min(maxMomentum, Math.max(0, momentum));
  return 1 + clampedMomentum;
}
