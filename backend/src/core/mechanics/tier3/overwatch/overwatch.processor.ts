/**
 * Overwatch processor
 *
 * Implements vigilance system for ranged units.
 * - Units can enter overwatch mode (skip turn)
 * - Triggers attack when enemy moves in range
 * - Consumes ammo on trigger
 * - Resets at turn end
 */

import { OverwatchConfig } from '../../config/mechanics.types';
import {
  Position,
  OverwatchUnit,
  OverwatchTriggerResult,
  OverwatchStateResult,
  DEFAULT_OVERWATCH_VALUES,
} from './overwatch.types';

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
 * Check if a unit can enter overwatch
 *
 * @param unit - Unit to check
 * @returns true if unit can enter overwatch
 *
 * @example
 * if (canEnterOverwatch(archer)) {
 *   // Show overwatch option
 * }
 */
export function canEnterOverwatch(unit: OverwatchUnit): boolean {
  // Must be ranged
  if (!unit.isRanged) {
    return false;
  }

  // Must have ammo
  if (unit.ammo !== undefined && unit.ammo <= 0) {
    return false;
  }

  // Must not already be in overwatch
  if (unit.vigilance) {
    return false;
  }

  return true;
}

/**
 * Enter overwatch mode
 *
 * @param unit - Unit to enter overwatch
 * @returns Overwatch state result
 */
export function enterOverwatch(unit: OverwatchUnit): OverwatchStateResult {
  if (!canEnterOverwatch(unit)) {
    return {
      entered: false,
      exited: false,
      reason: 'Cannot enter overwatch',
    };
  }

  return {
    entered: true,
    exited: false,
  };
}

/**
 * Update unit to enter overwatch
 *
 * @param unit - Unit to update
 * @param config - Optional overwatch configuration
 * @returns Updated unit in overwatch
 */
export function setOverwatch<T extends OverwatchUnit>(
  unit: T,
  config?: Partial<OverwatchConfig>,
): T {
  if (!canEnterOverwatch(unit)) {
    return unit;
  }

  const range = config?.triggerRange ?? DEFAULT_OVERWATCH_VALUES.triggerRange;

  return {
    ...unit,
    vigilance: true,
    overwatchRange: range,
  };
}

/**
 * Exit overwatch mode
 *
 * @param unit - Unit to exit overwatch
 * @returns Updated unit
 */
export function exitOverwatch<T extends OverwatchUnit>(unit: T): T {
  return {
    ...unit,
    vigilance: false,
    overwatchRange: undefined,
  };
}

/**
 * Check if enemy movement triggers overwatch
 *
 * @param overwatcher - Unit in overwatch
 * @param enemy - Enemy unit that moved
 * @param newPosition - Enemy's new position
 * @param config - Optional overwatch configuration
 * @returns true if overwatch triggers
 */
export function shouldTriggerOverwatch(
  overwatcher: OverwatchUnit,
  _enemy: OverwatchUnit,
  newPosition: Position,
  config?: Partial<OverwatchConfig>,
): boolean {
  // Must be in overwatch
  if (!overwatcher.vigilance) {
    return false;
  }

  // Must have ammo
  if (overwatcher.ammo !== undefined && overwatcher.ammo <= 0) {
    return false;
  }

  // Check range
  const range = overwatcher.overwatchRange ?? config?.triggerRange ?? DEFAULT_OVERWATCH_VALUES.triggerRange;
  const distance = getDistance(overwatcher.position, newPosition);

  return distance <= range;
}

/**
 * Trigger overwatch attack
 *
 * @param overwatcher - Unit in overwatch
 * @param enemy - Enemy unit that triggered
 * @param baseDamage - Base damage of overwatcher
 * @param config - Optional overwatch configuration
 * @returns Overwatch trigger result
 *
 * @example
 * const result = triggerOverwatch(archer, enemy, 10);
 * if (result.triggered) {
 *   // Apply damage to enemy
 * }
 */
export function triggerOverwatch(
  overwatcher: OverwatchUnit,
  target: OverwatchUnit,
  baseDamage: number,
  config?: Partial<OverwatchConfig>,
): OverwatchTriggerResult {
  if (!shouldTriggerOverwatch(overwatcher, target, target.position, config)) {
    return {
      triggered: false,
    };
  }

  // Calculate damage (75% of normal)
  const damageMultiplier = DEFAULT_OVERWATCH_VALUES.overwatchDamageMultiplier;
  const damage = Math.floor(baseDamage * damageMultiplier);

  return {
    triggered: true,
    attackerId: overwatcher.id,
    targetId: target.id,
    damage,
  };
}

/**
 * Update overwatcher after triggering
 *
 * @param unit - Unit that triggered overwatch
 * @param config - Optional overwatch configuration
 * @returns Updated unit with consumed ammo and exited overwatch
 */
export function afterOverwatchTrigger<T extends OverwatchUnit>(
  unit: T,
  config?: Partial<OverwatchConfig>,
): T {
  const ammoConsumption = config?.ammoConsumption ?? DEFAULT_OVERWATCH_VALUES.ammoConsumption;
  const currentAmmo = unit.ammo ?? Infinity;
  const newAmmo = currentAmmo === Infinity ? Infinity : Math.max(0, currentAmmo - ammoConsumption);

  return {
    ...unit,
    vigilance: false,
    overwatchRange: undefined,
    ammo: newAmmo === Infinity ? undefined : newAmmo,
  };
}

/**
 * Reset overwatch at turn end
 *
 * @param unit - Unit to reset
 * @returns Updated unit with overwatch cleared
 */
export function resetOverwatch<T extends OverwatchUnit>(unit: T): T {
  if (!unit.vigilance) {
    return unit;
  }

  return exitOverwatch(unit);
}

/**
 * Check all overwatchers for triggers
 *
 * @param movingEnemy - Enemy that is moving
 * @param newPosition - Enemy's new position
 * @param overwatchers - All units that might be in overwatch
 * @param getDamage - Function to get base damage for each overwatcher
 * @param config - Optional overwatch configuration
 * @returns Array of trigger results
 */
export function checkAllOverwatchers(
  movingEnemy: OverwatchUnit,
  newPosition: Position,
  overwatchers: OverwatchUnit[],
  getDamage: (unit: OverwatchUnit) => number,
  config?: Partial<OverwatchConfig>,
): OverwatchTriggerResult[] {
  const results: OverwatchTriggerResult[] = [];

  for (const overwatcher of overwatchers) {
    if (!overwatcher.vigilance) continue;

    const enemyAtNewPos = { ...movingEnemy, position: newPosition };

    if (shouldTriggerOverwatch(overwatcher, enemyAtNewPos, newPosition, config)) {
      const damage = getDamage(overwatcher);
      const result = triggerOverwatch(overwatcher, enemyAtNewPos, damage, config);
      if (result.triggered) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Get overwatch range for a unit
 *
 * @param unit - Unit to check
 * @param config - Optional overwatch configuration
 * @returns Overwatch range
 */
export function getOverwatchRange(
  unit: OverwatchUnit,
  config?: Partial<OverwatchConfig>,
): number {
  return unit.overwatchRange ?? config?.triggerRange ?? DEFAULT_OVERWATCH_VALUES.triggerRange;
}

/**
 * Check if unit is in overwatch
 *
 * @param unit - Unit to check
 * @returns true if unit is in overwatch
 */
export function isInOverwatch(unit: OverwatchUnit): boolean {
  return unit.vigilance === true;
}
