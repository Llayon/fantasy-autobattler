/**
 * Armor Shred processor
 *
 * Implements armor degradation system.
 * - Physical attacks reduce target's effective armor
 * - Shred accumulates up to a cap
 * - Optional decay at turn end
 */

import { ArmorShredConfig } from '../../config/mechanics.types';
import {
  ArmorShredUnit,
  ShredResult,
  DecayResult,
  DEFAULT_SHRED_VALUES,
} from './armor-shred.types';

/**
 * Get current armor shred on a unit
 *
 * @param unit - Unit to check
 * @returns Current shred amount
 */
export function getShred(unit: ArmorShredUnit): number {
  return unit.armorShred ?? 0;
}

/**
 * Get maximum shred for a unit
 *
 * @param unit - Unit to check
 * @param config - Optional armor shred configuration
 * @returns Maximum shred amount
 */
export function getMaxShred(
  unit: ArmorShredUnit,
  config?: Partial<ArmorShredConfig>,
): number {
  const maxShred = config?.maxShred ?? DEFAULT_SHRED_VALUES.maxShred;
  const percentBased = config?.percentBased ?? DEFAULT_SHRED_VALUES.percentBased;

  if (percentBased) {
    return Math.floor(unit.armor * (maxShred / 100));
  }

  return maxShred;
}

/**
 * Calculate effective armor after shred
 *
 * @param unit - Unit to calculate for
 * @returns Effective armor value (minimum 0)
 *
 * @example
 * const unit = { armor: 10, armorShred: 3 };
 * getEffectiveArmor(unit); // Returns 7
 */
export function getEffectiveArmor(unit: ArmorShredUnit): number {
  const shred = getShred(unit);
  return Math.max(0, unit.armor - shred);
}

/**
 * Apply armor shred from a physical attack
 *
 * @param unit - Unit receiving the attack
 * @param shredAmount - Amount of shred to apply (default from config)
 * @param config - Optional armor shred configuration
 * @returns Shred result
 *
 * @example
 * const result = applyShred(target, 2);
 * if (!result.wasCapped) {
 *   // Full shred applied
 * }
 */
export function applyShred(
  unit: ArmorShredUnit,
  shredAmount?: number,
  config?: Partial<ArmorShredConfig>,
): ShredResult {
  const shredPerHit = shredAmount ?? config?.shredPerHit ?? DEFAULT_SHRED_VALUES.shredPerHit;
  const maxShred = getMaxShred(unit, config);
  const currentShred = getShred(unit);

  const potentialShred = currentShred + shredPerHit;
  const actualShred = Math.min(maxShred, potentialShred);
  const shredApplied = actualShred - currentShred;

  return {
    targetId: unit.id,
    shredApplied,
    totalShred: actualShred,
    effectiveArmor: Math.max(0, unit.armor - actualShred),
    wasCapped: potentialShred > maxShred,
  };
}

/**
 * Update unit with applied shred
 *
 * @param unit - Unit to update
 * @param shredAmount - Amount of shred to apply
 * @param config - Optional armor shred configuration
 * @returns Updated unit with new shred value
 */
export function updateShred<T extends ArmorShredUnit>(
  unit: T,
  shredAmount?: number,
  config?: Partial<ArmorShredConfig>,
): T {
  const result = applyShred(unit, shredAmount, config);

  return {
    ...unit,
    armorShred: result.totalShred,
  };
}

/**
 * Decay armor shred at turn end
 *
 * @param unit - Unit to decay shred for
 * @param config - Optional armor shred configuration
 * @returns Decay result
 */
export function decayShred(
  unit: ArmorShredUnit,
  config?: Partial<ArmorShredConfig>,
): DecayResult {
  const decayPerTurn = config?.decayPerTurn ?? DEFAULT_SHRED_VALUES.decayPerTurn;
  const currentShred = getShred(unit);

  if (decayPerTurn <= 0 || currentShred <= 0) {
    return {
      unitId: unit.id,
      previousShred: currentShred,
      newShred: currentShred,
      decayAmount: 0,
    };
  }

  const newShred = Math.max(0, currentShred - decayPerTurn);

  return {
    unitId: unit.id,
    previousShred: currentShred,
    newShred,
    decayAmount: currentShred - newShred,
  };
}

/**
 * Apply shred decay to unit
 *
 * @param unit - Unit to update
 * @param config - Optional armor shred configuration
 * @returns Updated unit with decayed shred
 */
export function applyDecay<T extends ArmorShredUnit>(
  unit: T,
  config?: Partial<ArmorShredConfig>,
): T {
  const result = decayShred(unit, config);

  if (result.decayAmount === 0) {
    return unit;
  }

  if (result.newShred === 0) {
    return {
      ...unit,
      armorShred: undefined,
    };
  }

  return {
    ...unit,
    armorShred: result.newShred,
  };
}

/**
 * Reset all armor shred on a unit
 *
 * @param unit - Unit to reset
 * @returns Updated unit with no shred
 */
export function resetShred<T extends ArmorShredUnit>(unit: T): T {
  if (unit.armorShred === undefined || unit.armorShred === 0) {
    return unit;
  }

  return {
    ...unit,
    armorShred: undefined,
  };
}

/**
 * Check if unit has any armor shred
 *
 * @param unit - Unit to check
 * @returns true if unit has shred
 */
export function hasShred(unit: ArmorShredUnit): boolean {
  return getShred(unit) > 0;
}

/**
 * Check if unit is at max shred
 *
 * @param unit - Unit to check
 * @param config - Optional armor shred configuration
 * @returns true if unit is at max shred
 */
export function isAtMaxShred(
  unit: ArmorShredUnit,
  config?: Partial<ArmorShredConfig>,
): boolean {
  return getShred(unit) >= getMaxShred(unit, config);
}

/**
 * Get shred percentage (current / max)
 *
 * @param unit - Unit to check
 * @param config - Optional armor shred configuration
 * @returns Shred percentage (0.0 to 1.0)
 */
export function getShredPercentage(
  unit: ArmorShredUnit,
  config?: Partial<ArmorShredConfig>,
): number {
  const maxShred = getMaxShred(unit, config);
  if (maxShred === 0) return 0;
  return getShred(unit) / maxShred;
}

/**
 * Calculate damage with armor shred applied
 *
 * @param baseDamage - Base damage before armor
 * @param target - Target unit with potential shred
 * @returns Damage after armor reduction
 *
 * @example
 * const target = { armor: 10, armorShred: 3 };
 * calculateDamageWithShred(15, target); // Uses effective armor of 7
 */
export function calculateDamageWithShred(
  baseDamage: number,
  target: ArmorShredUnit,
): number {
  const effectiveArmor = getEffectiveArmor(target);
  return Math.max(1, baseDamage - effectiveArmor);
}

/**
 * Process shred decay for all units
 *
 * @param units - All units to process
 * @param config - Optional armor shred configuration
 * @returns Updated units array
 */
export function processShredDecay<T extends ArmorShredUnit>(
  units: T[],
  config?: Partial<ArmorShredConfig>,
): T[] {
  return units.map((unit) => applyDecay(unit, config));
}

/**
 * Get total shred across all units
 *
 * @param units - All units
 * @returns Total shred amount
 */
export function getTotalShred(units: ArmorShredUnit[]): number {
  return units.reduce((total, unit) => total + getShred(unit), 0);
}

/**
 * Get units with shred
 *
 * @param units - All units
 * @returns Units that have armor shred
 */
export function getUnitsWithShred(units: ArmorShredUnit[]): ArmorShredUnit[] {
  return units.filter(hasShred);
}
