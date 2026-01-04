/**
 * Tier 0: Facing Processor
 *
 * Implements the facing/direction system for directional combat.
 * Units have a facing direction (N/S/E/W) and attacks from different angles
 * (front/flank/rear) have different effects.
 *
 * @module core/mechanics/tier0/facing
 */

import type { BattleState } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import { updateUnit } from '../../helpers';
import type {
  FacingDirection,
  AttackArc,
  FacingProcessor,
} from './facing.types';

/**
 * Angle mappings for each facing direction (in degrees).
 * North = 0°, East = 90°, South = 180°, West = 270°
 */
const FACING_ANGLES: Record<FacingDirection, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
};

/**
 * Arc thresholds in degrees.
 * - Front: 0° - 45° from facing
 * - Flank: 45° - 135° from facing
 * - Rear: 135° - 180° from facing
 */
const ARC_THRESHOLDS = {
  FRONT: 45,
  FLANK: 135,
};

/**
 * Calculates the angle from origin to target in degrees.
 * Returns angle in range [0, 360) where:
 * - 0° = North (negative Y)
 * - 90° = East (positive X)
 * - 180° = South (positive Y)
 * - 270° = West (negative X)
 *
 * @param origin - Origin position
 * @param target - Target position
 * @returns Angle in degrees [0, 360)
 */
function calculateAngle(
  origin: { x: number; y: number },
  target: { x: number; y: number },
): number {
  // Calculate displacement vector from origin to target
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  // Formula: angle = atan2(dx, -dy)
  // - atan2(y, x) returns angle in radians from -π to π
  // - We use atan2(dx, -dy) to rotate coordinate system so North = 0°
  // - The -dy inverts Y axis because screen coordinates have Y increasing downward
  const radians = Math.atan2(dx, -dy);

  // Convert radians to degrees: degrees = radians * (180 / π)
  const degrees = radians * (180 / Math.PI);

  // Normalize to [0, 360) range using modulo
  // Adding 360 before modulo handles negative angles from atan2
  return (degrees + 360) % 360;
}

/**
 * Calculates the smallest angle difference between two angles.
 * Result is always in range [0, 180].
 *
 * @param angle1 - First angle in degrees
 * @param angle2 - Second angle in degrees
 * @returns Absolute angle difference [0, 180]
 */
function angleDifference(angle1: number, angle2: number): number {
  // Formula: diff = |angle1 - angle2|
  // Then normalize to shortest arc (max 180°)
  const diff = Math.abs(angle1 - angle2);

  // If diff > 180°, the shorter path is going the other way around the circle
  // Formula: shortestDiff = diff > 180 ? 360 - diff : diff
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Determines the primary facing direction based on angle.
 *
 * @param angle - Angle in degrees [0, 360)
 * @returns Closest cardinal direction
 */
function angleToFacing(angle: number): FacingDirection {
  // Normalize angle to [0, 360) using double modulo to handle negatives
  // Formula: normalized = ((angle % 360) + 360) % 360
  const normalized = ((angle % 360) + 360) % 360;

  // Each cardinal direction covers a 90° arc centered on its angle:
  // - North (0°): 315° to 45° (wraps around 0°)
  // - East (90°): 45° to 135°
  // - South (180°): 135° to 225°
  // - West (270°): 225° to 315°
  if (normalized >= 315 || normalized < 45) return 'N';
  if (normalized >= 45 && normalized < 135) return 'E';
  if (normalized >= 135 && normalized < 225) return 'S';
  return 'W';
}

/**
 * Creates a facing processor instance.
 *
 * The facing processor handles:
 * - Getting unit facing direction
 * - Rotating units to face targets
 * - Calculating attack arcs (front/flank/rear)
 * - Auto-facing during pre_attack phase
 *
 * @returns FacingProcessor instance
 *
 * @example
 * const processor = createFacingProcessor();
 *
 * // Get attack arc for damage calculation
 * const arc = processor.getAttackArc(attacker, target);
 * const damageModifier = arc === 'rear' ? 1.3 : arc === 'flank' ? 1.15 : 1.0;
 *
 * // Rotate unit to face enemy
 * const rotatedUnit = processor.faceTarget(unit, enemy.position);
 */
export function createFacingProcessor(): FacingProcessor {
  return {
    /**
     * Gets unit's current facing direction.
     * Returns 'S' (South) as default if unit has no facing set.
     *
     * @param unit - Unit to get facing from (must have optional facing property)
     * @returns Current facing direction ('N', 'S', 'E', or 'W'), defaults to 'S'
     * @example
     * const facing = processor.getFacing(unit); // 'S' if not set
     */
    getFacing(unit: { facing?: FacingDirection }): FacingDirection {
      return unit.facing ?? 'S';
    },

    /**
     * Rotates unit to face target position.
     * Calculates the primary direction based on relative position
     * and returns a new unit object with updated facing.
     *
     * @param unit - Unit to rotate (must have position property)
     * @param target - Target position coordinates to face toward
     * @returns New unit object with updated facing direction
     * @example
     * const rotatedUnit = processor.faceTarget(unit, enemy.position);
     * // rotatedUnit.facing is now pointing toward enemy
     */
    faceTarget<T extends { position: { x: number; y: number } }>(
      unit: T & { facing?: FacingDirection },
      target: { x: number; y: number },
    ): T & { facing: FacingDirection } {
      // Calculate angle from unit to target
      const angle = calculateAngle(unit.position, target);

      // Convert angle to facing direction
      const facing = angleToFacing(angle);

      return { ...unit, facing };
    },

    /**
     * Determines attack arc (front/flank/rear) based on attacker position
     * relative to target's facing direction.
     *
     * Arc calculation uses angle thresholds:
     * - Front: 0°-45° from target's facing direction
     * - Flank: 45°-135° from target's facing direction
     * - Rear: 135°-180° from target's facing direction
     *
     * @param attacker - Attacking unit with position
     * @param target - Target unit with position and optional facing
     * @returns Attack arc type ('front', 'flank', or 'rear')
     * @example
     * const arc = processor.getAttackArc(attacker, target);
     * if (arc === 'rear') {
     *   // Apply +30% damage bonus
     * }
     */
    getAttackArc(
      attacker: { position: { x: number; y: number } },
      target: { position: { x: number; y: number }; facing?: FacingDirection },
    ): AttackArc {
      const targetFacing = target.facing ?? 'S';

      // Calculate angle from target to attacker
      const attackAngle = calculateAngle(target.position, attacker.position);

      // Get target's facing angle
      const facingAngle = FACING_ANGLES[targetFacing];

      // Calculate relative angle (how far off from facing the attack comes from)
      const relativeAngle = angleDifference(attackAngle, facingAngle);

      // Determine arc based on relative angle
      if (relativeAngle <= ARC_THRESHOLDS.FRONT) {
        return 'front';
      }
      if (relativeAngle <= ARC_THRESHOLDS.FLANK) {
        return 'flank';
      }
      return 'rear';
    },

    /**
     * Apply facing logic for a battle phase.
     * During pre_attack phase, auto-faces the active unit toward its target.
     *
     * @param phase - Current battle phase ('turn_start', 'movement', 'pre_attack', etc.)
     * @param state - Current battle state with all units
     * @param context - Phase context containing activeUnit, target, and seed
     * @returns Updated battle state (unchanged if not pre_attack phase)
     * @example
     * const newState = processor.apply('pre_attack', state, {
     *   activeUnit: attacker,
     *   target: defender,
     *   seed: 12345,
     * });
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // Only apply during pre_attack phase when there's a target
      if (phase !== 'pre_attack' || !context.target) {
        return state;
      }

      // Auto-face active unit toward target before attack
      const processor = createFacingProcessor();
      const updatedUnit = processor.faceTarget(
        context.activeUnit,
        context.target.position,
      );

      return updateUnit(state, updatedUnit);
    },
  };
}

/**
 * Default export for convenience.
 */
export default createFacingProcessor;
