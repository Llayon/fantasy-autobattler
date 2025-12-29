/**
 * Engagement processor
 *
 * Implements zone of control system.
 * - Melee units create zones of control around them
 * - Moving through ZoC triggers attacks of opportunity
 * - Engaged archers suffer accuracy penalty
 */

import { EngagementConfig } from '../../config/mechanics.types';
import {
  EngagementUnit,
  EngagementCheckResult,
  ArcherPenaltyResult,
  Position,
  DEFAULT_ENGAGEMENT_VALUES,
} from './engagement.types';

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
 * Check if a position is within zone of control range
 *
 * @param unitPosition - Position of the unit creating ZoC
 * @param targetPosition - Position to check
 * @param config - Optional engagement configuration
 * @returns true if target is within ZoC
 */
export function isInZoneOfControl(
  unitPosition: Position,
  targetPosition: Position,
  config?: Partial<EngagementConfig>,
): boolean {
  const range = config?.zoneOfControlRange ?? DEFAULT_ENGAGEMENT_VALUES.zoneOfControlRange;
  return getDistance(unitPosition, targetPosition) <= range;
}

/**
 * Get all positions within zone of control
 *
 * @param unitPosition - Position of the unit
 * @param config - Optional engagement configuration
 * @returns Array of positions within ZoC
 */
export function getZoneOfControlPositions(
  unitPosition: Position,
  config?: Partial<EngagementConfig>,
): Position[] {
  const range = config?.zoneOfControlRange ?? DEFAULT_ENGAGEMENT_VALUES.zoneOfControlRange;
  const positions: Position[] = [];

  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) + Math.abs(dy) <= range) {
        positions.push({
          x: unitPosition.x + dx,
          y: unitPosition.y + dy,
        });
      }
    }
  }

  return positions;
}

/**
 * Check engagement status for a unit
 *
 * @param unit - Unit to check
 * @param enemies - Array of enemy units
 * @param config - Optional engagement configuration
 * @returns Engagement check result
 *
 * @example
 * const result = checkEngagement(unit, enemies);
 * if (result.isEngaged) { ... }
 */
export function checkEngagement(
  unit: EngagementUnit,
  enemies: EngagementUnit[],
  config?: Partial<EngagementConfig>,
): EngagementCheckResult {
  const engagedWith: string[] = [];

  for (const enemy of enemies) {
    if (isInZoneOfControl(enemy.position, unit.position, config)) {
      engagedWith.push(enemy.id);
    }
  }

  return {
    isEngaged: engagedWith.length > 0,
    engagedWith,
    canMoveFreely: engagedWith.length === 0,
    attackOfOpportunityFrom: engagedWith,
  };
}

/**
 * Check if moving from one position to another triggers attack of opportunity
 *
 * @param from - Starting position
 * @param to - Target position
 * @param enemies - Array of enemy units
 * @param config - Optional engagement configuration
 * @returns Array of enemy IDs that can make attacks of opportunity
 */
export function checkAttackOfOpportunity(
  from: Position,
  to: Position,
  enemies: EngagementUnit[],
  config?: Partial<EngagementConfig>,
): string[] {
  const attackers: string[] = [];

  for (const enemy of enemies) {
    // If we're leaving an enemy's ZoC
    const wasInZoC = isInZoneOfControl(enemy.position, from, config);
    const stillInZoC = isInZoneOfControl(enemy.position, to, config);

    if (wasInZoC && !stillInZoC) {
      attackers.push(enemy.id);
    }
  }

  return attackers;
}

/**
 * Calculate archer penalty when engaged
 *
 * @param unit - Archer unit
 * @param baseDamage - Base damage before penalty
 * @param enemies - Array of enemy units
 * @param config - Optional engagement configuration
 * @returns Archer penalty result
 *
 * @example
 * const result = calculateArcherPenalty(archer, 10, enemies);
 * // result.effectiveDamage === 5 (if engaged)
 */
export function calculateArcherPenalty(
  unit: EngagementUnit,
  baseDamage: number,
  enemies: EngagementUnit[],
  config?: Partial<EngagementConfig>,
): ArcherPenaltyResult {
  const engagement = checkEngagement(unit, enemies, config);
  const penalty = config?.archerPenalty ?? DEFAULT_ENGAGEMENT_VALUES.archerPenalty;

  if (!engagement.isEngaged || !unit.isRanged) {
    return {
      isEngaged: engagement.isEngaged,
      penaltyMultiplier: 1.0,
      effectiveDamage: baseDamage,
    };
  }

  const penaltyMultiplier = 1.0 - penalty;
  const effectiveDamage = Math.floor(baseDamage * penaltyMultiplier);

  return {
    isEngaged: true,
    penaltyMultiplier,
    effectiveDamage,
  };
}

/**
 * Update unit engagement status
 *
 * @param unit - Unit to update
 * @param enemies - Array of enemy units
 * @param config - Optional engagement configuration
 * @returns Updated unit with engagement info
 */
export function updateEngagement<T extends EngagementUnit>(
  unit: T,
  enemies: EngagementUnit[],
  config?: Partial<EngagementConfig>,
): T {
  const result = checkEngagement(unit, enemies, config);

  return {
    ...unit,
    engaged: result.isEngaged,
    engagedWith: result.engagedWith,
  };
}

/**
 * Check if unit can disengage (move away from enemies)
 *
 * @param unit - Unit trying to disengage
 * @param enemies - Array of enemy units
 * @param config - Optional engagement configuration
 * @returns true if unit is engaged and would trigger AoO
 */
export function wouldTriggerDisengage(
  unit: EngagementUnit,
  enemies: EngagementUnit[],
  config?: Partial<EngagementConfig>,
): boolean {
  const engagement = checkEngagement(unit, enemies, config);
  return engagement.isEngaged;
}

/**
 * Get all units engaged with a specific unit
 *
 * @param unit - Unit to check
 * @param allUnits - All units on the battlefield
 * @param config - Optional engagement configuration
 * @returns Array of units engaged with the target
 */
export function getEngagedUnits<T extends EngagementUnit>(
  unit: EngagementUnit,
  allUnits: T[],
  config?: Partial<EngagementConfig>,
): T[] {
  return allUnits.filter((other) =>
    other.id !== unit.id && isInZoneOfControl(unit.position, other.position, config),
  );
}
