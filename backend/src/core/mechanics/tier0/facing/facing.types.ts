/**
 * Tier 0: Facing - Type Definitions
 *
 * @module core/mechanics/tier0/facing
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Cardinal directions for unit facing.
 */
export type FacingDirection = 'N' | 'S' | 'E' | 'W';

/**
 * Attack arc relative to target's facing.
 */
export type AttackArc = 'front' | 'flank' | 'rear';

/**
 * Facing processor interface.
 */
export interface FacingProcessor {
  /**
   * Gets unit's current facing direction.
   */
  getFacing(unit: { facing?: FacingDirection }): FacingDirection;

  /**
   * Rotates unit to face target position.
   */
  faceTarget<T extends { position: { x: number; y: number } }>(
    unit: T & { facing?: FacingDirection },
    target: { x: number; y: number },
  ): T & { facing: FacingDirection };

  /**
   * Determines attack arc (front/flank/rear).
   */
  getAttackArc(
    attacker: { position: { x: number; y: number } },
    target: { position: { x: number; y: number }; facing?: FacingDirection },
  ): AttackArc;

  /**
   * Apply facing logic for phase.
   */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
