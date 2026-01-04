/**
 * Tier 0: Facing - Type Definitions
 *
 * Defines types for the facing/direction system which enables directional combat.
 * Units have a facing direction (N/S/E/W) and attacks from different angles
 * (front/flank/rear) have different effects.
 *
 * @module core/mechanics/tier0/facing
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, FacingDirection } from '../../../types';

// Re-export FacingDirection from core types for convenience
export type { FacingDirection } from '../../../types';

/**
 * Attack arc relative to target's facing direction.
 * - front: Attack from within 45° of target's facing (no bonus)
 * - flank: Attack from 45°-135° of target's facing (+15% damage)
 * - rear: Attack from behind (>135° from facing) (+30% damage)
 *
 * @example
 * const arc: AttackArc = 'flank';
 * if (arc === 'rear') {
 *   // Apply rear attack bonus
 * }
 */
export type AttackArc = 'front' | 'flank' | 'rear';

/**
 * Facing processor interface.
 * Handles all facing-related mechanics including direction tracking,
 * target facing, and attack arc calculation.
 *
 * @example
 * const processor = createFacingProcessor();
 * const arc = processor.getAttackArc(attacker, target);
 * const damageModifier = arc === 'rear' ? 1.3 : arc === 'flank' ? 1.15 : 1.0;
 */
export interface FacingProcessor {
  /**
   * Gets unit's current facing direction.
   * Returns 'S' (South) as default if unit has no facing set.
   *
   * @param unit - Unit to get facing from
   * @returns Current facing direction (defaults to 'S')
   *
   * @example
   * const facing = processor.getFacing(unit);
   * console.log(`Unit is facing ${facing}`);
   */
  getFacing(unit: { facing?: FacingDirection }): FacingDirection;

  /**
   * Rotates unit to face target position.
   * Calculates the primary direction based on relative position
   * and returns a new unit object with updated facing.
   *
   * @param unit - Unit to rotate (must have position)
   * @param target - Target position to face
   * @returns New unit object with updated facing direction
   *
   * @example
   * const rotatedUnit = processor.faceTarget(unit, enemy.position);
   * // rotatedUnit.facing is now pointing toward enemy
   */
  faceTarget<T extends { position: { x: number; y: number } }>(
    unit: T & { facing?: FacingDirection },
    target: { x: number; y: number },
  ): T & { facing: FacingDirection };

  /**
   * Determines attack arc (front/flank/rear) based on attacker position
   * relative to target's facing direction.
   *
   * Arc calculation:
   * - front: 0°-45° from target's facing
   * - flank: 45°-135° from target's facing
   * - rear: 135°-180° from target's facing
   *
   * @param attacker - Attacking unit (needs position)
   * @param target - Target unit (needs position and optional facing)
   * @returns Attack arc type
   *
   * @example
   * const arc = processor.getAttackArc(attacker, target);
   * if (arc === 'rear') {
   *   // Flanking disables riposte, apply bonus damage
   * }
   */
  getAttackArc(
    attacker: { position: { x: number; y: number } },
    target: { position: { x: number; y: number }; facing?: FacingDirection },
  ): AttackArc;

  /**
   * Apply facing logic for a battle phase.
   * During pre_attack phase, auto-faces the active unit toward its target.
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and target
   * @returns Updated battle state
   *
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
  ): BattleState;
}
