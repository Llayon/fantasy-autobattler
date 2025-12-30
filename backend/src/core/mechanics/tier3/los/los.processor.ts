/**
 * Line of Sight processor
 *
 * Implements visibility system for ranged attacks.
 * - Direct Fire: blocked by units in the path
 * - Arc Fire: ignores obstacles but has 20% accuracy penalty
 * - Uses Bresenham's line algorithm for path calculation
 */

import { LineOfSightConfig } from '../../config/mechanics.types';
import {
  Position,
  LoSUnit,
  FireType,
  LoSResult,
  LineResult,
  DEFAULT_LOS_VALUES,
} from './los.types';

/**
 * Calculate line of sight using Bresenham's algorithm
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Array of positions along the line
 *
 * @example
 * const line = getLineOfSight({ x: 0, y: 0 }, { x: 3, y: 2 });
 * // Returns positions along the line
 */
export function getLineOfSight(from: Position, to: Position): Position[] {
  const points: Position[] = [];

  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
}

/**
 * Check if a position is blocked by any unit
 *
 * @param position - Position to check
 * @param units - All units on the battlefield
 * @param excludeIds - Unit IDs to exclude from blocking check
 * @returns Blocking unit ID or undefined
 */
export function getBlockingUnit(
  position: Position,
  units: LoSUnit[],
  excludeIds: string[] = [],
): string | undefined {
  for (const unit of units) {
    if (excludeIds.includes(unit.id)) continue;
    if (unit.position.x === position.x && unit.position.y === position.y) {
      return unit.id;
    }
  }
  return undefined;
}

/**
 * Calculate line with blocking check
 *
 * @param from - Starting position
 * @param to - Target position
 * @param units - All units on the battlefield
 * @param excludeIds - Unit IDs to exclude from blocking
 * @returns Line result with blocking info
 */
export function calculateLine(
  from: Position,
  to: Position,
  units: LoSUnit[],
  excludeIds: string[] = [],
): LineResult {
  const points = getLineOfSight(from, to);
  const blockedBy: string[] = [];

  // Check each point except start and end
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    if (point) {
      const blockerId = getBlockingUnit(point, units, excludeIds);
      if (blockerId) {
        blockedBy.push(blockerId);
      }
    }
  }

  return {
    points,
    blocked: blockedBy.length > 0,
  };
}

/**
 * Check line of sight between attacker and target
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param allUnits - All units on the battlefield
 * @param config - Optional LoS configuration
 * @returns LoS result
 *
 * @example
 * const result = checkLineOfSight(archer, enemy, allUnits);
 * if (!result.hasLineOfSight) {
 *   // Cannot attack with direct fire
 * }
 */
export function checkLineOfSight(
  attacker: LoSUnit,
  target: LoSUnit,
  allUnits: LoSUnit[],
  config?: Partial<LineOfSightConfig>,
): LoSResult {
  const directFireBlocked = config?.directFireBlocked ?? DEFAULT_LOS_VALUES.directFireBlocked;
  const arcFirePenalty = config?.arcFirePenalty ?? DEFAULT_LOS_VALUES.arcFirePenalty;

  // Calculate line between attacker and target
  const lineResult = calculateLine(
    attacker.position,
    target.position,
    allUnits,
    [attacker.id, target.id],
  );

  // If not blocked, direct fire is possible
  if (!lineResult.blocked || !directFireBlocked) {
    return {
      hasLineOfSight: true,
      fireType: 'direct',
      accuracyPenalty: 0,
    };
  }

  // If blocked but can arc fire
  if (attacker.canArcFire) {
    return {
      hasLineOfSight: true,
      blockedBy: lineResult.points
        .slice(1, -1)
        .map((p) => getBlockingUnit(p, allUnits, [attacker.id, target.id]))
        .filter((id): id is string => id !== undefined),
      fireType: 'arc',
      accuracyPenalty: arcFirePenalty,
    };
  }

  // Blocked and cannot arc fire
  return {
    hasLineOfSight: false,
    blockedBy: lineResult.points
      .slice(1, -1)
      .map((p) => getBlockingUnit(p, allUnits, [attacker.id, target.id]))
      .filter((id): id is string => id !== undefined),
    fireType: 'direct',
    accuracyPenalty: 0,
  };
}

/**
 * Check if direct fire is possible
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param allUnits - All units on the battlefield
 * @returns true if direct fire is possible
 */
export function canDirectFire(
  attacker: LoSUnit,
  target: LoSUnit,
  allUnits: LoSUnit[],
): boolean {
  const result = checkLineOfSight(attacker, target, allUnits);
  return result.hasLineOfSight && result.fireType === 'direct';
}

/**
 * Check if arc fire is required
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param allUnits - All units on the battlefield
 * @returns true if arc fire is required (direct blocked)
 */
export function requiresArcFire(
  attacker: LoSUnit,
  target: LoSUnit,
  allUnits: LoSUnit[],
): boolean {
  const result = checkLineOfSight(attacker, target, allUnits);
  return result.hasLineOfSight && result.fireType === 'arc';
}

/**
 * Get accuracy modifier for attack
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param allUnits - All units on the battlefield
 * @param config - Optional LoS configuration
 * @returns Accuracy multiplier (1.0 for direct, 0.8 for arc)
 */
export function getAccuracyModifier(
  attacker: LoSUnit,
  target: LoSUnit,
  allUnits: LoSUnit[],
  config?: Partial<LineOfSightConfig>,
): number {
  const result = checkLineOfSight(attacker, target, allUnits, config);

  if (!result.hasLineOfSight) {
    return 0;
  }

  return 1 - result.accuracyPenalty;
}

/**
 * Apply accuracy penalty to damage
 *
 * @param baseDamage - Base damage before penalty
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param allUnits - All units on the battlefield
 * @param config - Optional LoS configuration
 * @returns Modified damage
 */
export function applyLoSPenalty(
  baseDamage: number,
  attacker: LoSUnit,
  target: LoSUnit,
  allUnits: LoSUnit[],
  config?: Partial<LineOfSightConfig>,
): number {
  const modifier = getAccuracyModifier(attacker, target, allUnits, config);
  return Math.floor(baseDamage * modifier);
}

/**
 * Find all valid targets for a ranged unit
 *
 * @param attacker - Attacking unit
 * @param enemies - Enemy units
 * @param allUnits - All units on the battlefield
 * @param config - Optional LoS configuration
 * @returns Array of valid targets with fire type
 */
export function findValidTargets(
  attacker: LoSUnit,
  enemies: LoSUnit[],
  allUnits: LoSUnit[],
  config?: Partial<LineOfSightConfig>,
): Array<{ target: LoSUnit; fireType: FireType; penalty: number }> {
  const validTargets: Array<{ target: LoSUnit; fireType: FireType; penalty: number }> = [];

  for (const enemy of enemies) {
    const result = checkLineOfSight(attacker, enemy, allUnits, config);
    if (result.hasLineOfSight) {
      validTargets.push({
        target: enemy,
        fireType: result.fireType,
        penalty: result.accuracyPenalty,
      });
    }
  }

  return validTargets;
}

/**
 * Get units blocking line of sight
 *
 * @param from - Starting position
 * @param to - Target position
 * @param allUnits - All units on the battlefield
 * @param excludeIds - Unit IDs to exclude
 * @returns Array of blocking unit IDs
 */
export function getBlockingUnits(
  from: Position,
  to: Position,
  allUnits: LoSUnit[],
  excludeIds: string[] = [],
): string[] {
  const lineResult = calculateLine(from, to, allUnits, excludeIds);
  const blockers: string[] = [];

  for (let i = 1; i < lineResult.points.length - 1; i++) {
    const point = lineResult.points[i];
    if (point) {
      const blockerId = getBlockingUnit(point, allUnits, excludeIds);
      if (blockerId && !blockers.includes(blockerId)) {
        blockers.push(blockerId);
      }
    }
  }

  return blockers;
}
