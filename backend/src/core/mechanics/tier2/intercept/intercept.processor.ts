/**
 * Intercept processor
 *
 * Implements movement interception system.
 * - Hard Intercept: Spearmen stop cavalry charges completely
 * - Soft Intercept: Infantry engages passing units
 * - Disengage cost for leaving engagement
 */

import { InterceptConfig } from '../../config/mechanics.types';
import { isInZoneOfControl } from '../../tier1/engagement';
import { Position } from '../../tier0/facing';
import {
  InterceptUnit,
  InterceptCheckResult,
  DisengageResult,
  PathSegment,
  DEFAULT_INTERCEPT_VALUES,
} from './intercept.types';

/**
 * Check if a unit has a specific tag
 *
 * @param unit - Unit to check
 * @param tags - Tags to look for
 * @returns true if unit has any of the specified tags
 */
export function hasTag(unit: InterceptUnit, tags: string[]): boolean {
  if (!unit.tags || unit.tags.length === 0) {
    return false;
  }
  return unit.tags.some((tag) => tags.includes(tag));
}

/**
 * Check if a unit can perform hard intercept
 *
 * Hard intercept stops cavalry charges completely.
 *
 * @param unit - Potential interceptor
 * @param config - Optional intercept configuration
 * @returns true if unit can hard intercept
 *
 * @example
 * const canIntercept = canHardIntercept(spearman);
 * // Returns true if spearman has 'spearman' tag
 */
export function canHardIntercept(
  unit: InterceptUnit,
  config?: Partial<InterceptConfig>,
): boolean {
  const hardTypes = config?.hardInterceptTypes ?? DEFAULT_INTERCEPT_VALUES.hardInterceptTypes;
  return hasTag(unit, hardTypes);
}

/**
 * Check if a unit can perform soft intercept
 *
 * Soft intercept engages passing units but doesn't stop them.
 *
 * @param unit - Potential interceptor
 * @param config - Optional intercept configuration
 * @returns true if unit can soft intercept
 */
export function canSoftIntercept(
  unit: InterceptUnit,
  config?: Partial<InterceptConfig>,
): boolean {
  const softTypes = config?.softInterceptTypes ?? DEFAULT_INTERCEPT_VALUES.softInterceptTypes;
  return hasTag(unit, softTypes);
}

/**
 * Check if a unit is cavalry (can be hard intercepted)
 *
 * @param unit - Unit to check
 * @returns true if unit is cavalry
 */
export function isCavalry(unit: InterceptUnit): boolean {
  return hasTag(unit, DEFAULT_INTERCEPT_VALUES.cavalryTypes);
}

/**
 * Check if movement through a position triggers intercept
 *
 * @param movingUnit - Unit that is moving
 * @param interceptor - Potential interceptor
 * @param path - Movement path segment
 * @param config - Optional intercept configuration
 * @returns Intercept check result
 *
 * @example
 * const result = checkIntercept(cavalry, spearman, { from, to });
 * if (result.intercepted && result.stopMovement) {
 *   // Cavalry charge is stopped
 * }
 */
export function checkIntercept(
  movingUnit: InterceptUnit,
  interceptor: InterceptUnit,
  path: PathSegment,
  config?: Partial<InterceptConfig>,
): InterceptCheckResult {
  // Check if path passes through interceptor's ZoC
  const passesZoC = isInZoneOfControl(interceptor.position, path.to);

  if (!passesZoC) {
    return {
      intercepted: false,
      interceptType: 'none',
      stopMovement: false,
      triggerEngagement: false,
    };
  }

  // Check for hard intercept (spearmen vs cavalry)
  if (canHardIntercept(interceptor, config) && isCavalry(movingUnit) && movingUnit.isCharging) {
    return {
      intercepted: true,
      interceptType: 'hard',
      interceptorId: interceptor.id,
      stopMovement: true,
      triggerEngagement: true,
    };
  }

  // Check for soft intercept (infantry engages)
  if (canSoftIntercept(interceptor, config)) {
    return {
      intercepted: true,
      interceptType: 'soft',
      interceptorId: interceptor.id,
      stopMovement: false,
      triggerEngagement: true,
    };
  }

  // No intercept capability, but still in ZoC
  return {
    intercepted: false,
    interceptType: 'none',
    stopMovement: false,
    triggerEngagement: true,
  };
}

/**
 * Check intercept along entire movement path
 *
 * @param movingUnit - Unit that is moving
 * @param enemies - Array of enemy units
 * @param path - Array of positions in movement path
 * @param config - Optional intercept configuration
 * @returns First intercept result that stops movement, or last result
 */
export function checkInterceptAlongPath(
  movingUnit: InterceptUnit,
  enemies: InterceptUnit[],
  path: Position[],
  config?: Partial<InterceptConfig>,
): InterceptCheckResult {
  let lastResult: InterceptCheckResult = {
    intercepted: false,
    interceptType: 'none',
    stopMovement: false,
    triggerEngagement: false,
  };

  for (let i = 0; i < path.length - 1; i++) {
    const fromPos = path[i];
    const toPos = path[i + 1];

    if (!fromPos || !toPos) {
      continue;
    }

    const segment: PathSegment = {
      from: fromPos,
      to: toPos,
    };

    for (const enemy of enemies) {
      const result = checkIntercept(movingUnit, enemy, segment, config);

      if (result.intercepted) {
        lastResult = result;

        // Hard intercept stops movement immediately
        if (result.stopMovement) {
          return result;
        }
      }
    }
  }

  return lastResult;
}

/**
 * Calculate disengage cost for leaving engagement
 *
 * @param unit - Unit trying to disengage
 * @param engagedWith - Number of enemies engaged with
 * @param config - Optional intercept configuration
 * @returns Disengage result with movement cost
 *
 * @example
 * const result = calculateDisengageCost(unit, 2);
 * // result.movementCost === 4 (2 enemies * 2 cost each)
 */
export function calculateDisengageCost(
  unit: InterceptUnit,
  engagedWith: number,
  config?: Partial<InterceptConfig>,
): DisengageResult {
  const costPerEnemy = config?.disengageCost ?? DEFAULT_INTERCEPT_VALUES.disengageCost;
  const totalCost = engagedWith * costPerEnemy;
  const unitSpeed = unit.speed ?? 3;
  const remainingMovement = Math.max(0, unitSpeed - totalCost);

  return {
    canDisengage: remainingMovement > 0 || engagedWith === 0,
    movementCost: totalCost,
    remainingMovement,
  };
}

/**
 * Check if unit can afford to disengage
 *
 * @param unit - Unit trying to disengage
 * @param engagedWith - Number of enemies engaged with
 * @param config - Optional intercept configuration
 * @returns true if unit has enough movement to disengage
 */
export function canAffordDisengage(
  unit: InterceptUnit,
  engagedWith: number,
  config?: Partial<InterceptConfig>,
): boolean {
  const result = calculateDisengageCost(unit, engagedWith, config);
  return result.canDisengage;
}

/**
 * Get all units that can intercept at a position
 *
 * @param position - Position to check
 * @param enemies - Array of enemy units
 * @param config - Optional intercept configuration
 * @returns Array of units that can intercept at this position
 */
export function getInterceptorsAtPosition(
  position: Position,
  enemies: InterceptUnit[],
  config?: Partial<InterceptConfig>,
): InterceptUnit[] {
  return enemies.filter((enemy) => {
    if (!isInZoneOfControl(enemy.position, position)) {
      return false;
    }
    return canHardIntercept(enemy, config) || canSoftIntercept(enemy, config);
  });
}

/**
 * Apply disengage cost to unit movement
 *
 * @param unit - Unit disengaging
 * @param engagedWith - Number of enemies engaged with
 * @param config - Optional intercept configuration
 * @returns Updated unit with reduced speed for this turn
 */
export function applyDisengageCost<T extends InterceptUnit>(
  unit: T,
  engagedWith: number,
  config?: Partial<InterceptConfig>,
): T {
  const result = calculateDisengageCost(unit, engagedWith, config);

  return {
    ...unit,
    speed: result.remainingMovement,
  };
}

/**
 * Check if a hard intercept would counter a charge
 *
 * @param charger - Charging cavalry unit
 * @param interceptor - Potential interceptor
 * @param config - Optional intercept configuration
 * @returns true if intercept would stop the charge
 */
export function wouldCounterCharge(
  charger: InterceptUnit,
  interceptor: InterceptUnit,
  config?: Partial<InterceptConfig>,
): boolean {
  return (
    isCavalry(charger) &&
    charger.isCharging === true &&
    canHardIntercept(interceptor, config)
  );
}
