/**
 * Tier 0: Facing - Processor Implementation
 *
 * Handles unit facing/direction mechanics.
 *
 * @module core/mechanics/tier0/facing
 */

import type { FacingProcessor, FacingDirection, AttackArc } from './facing.types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';
import { updateUnit } from '../../helpers';

/**
 * Creates a facing processor.
 *
 * @returns Facing processor instance
 *
 * @example
 * const processor = createFacingProcessor();
 * const arc = processor.getAttackArc(attacker, target);
 */
export function createFacingProcessor(): FacingProcessor {
  return {
    getFacing: (unit) => unit.facing ?? 'S',

    faceTarget: (unit, target) => {
      const dx = target.x - unit.position.x;
      const dy = target.y - unit.position.y;

      // Determine primary direction
      let facing: FacingDirection;
      if (Math.abs(dx) > Math.abs(dy)) {
        facing = dx > 0 ? 'E' : 'W';
      } else {
        facing = dy > 0 ? 'S' : 'N';
      }

      return { ...unit, facing };
    },

    getAttackArc: (attacker, target): AttackArc => {
      const facing = target.facing ?? 'S';
      const dx = attacker.position.x - target.position.x;
      const dy = attacker.position.y - target.position.y;

      // Calculate angle relative to facing
      const facingAngles: Record<FacingDirection, number> = {
        N: 0,
        E: 90,
        S: 180,
        W: 270,
      };
      const attackAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      const relativeAngle = Math.abs(attackAngle - facingAngles[facing]);
      const normalized = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;

      if (normalized <= 45) return 'front';
      if (normalized <= 135) return 'flank';
      return 'rear';
    },

    apply: (phase: BattlePhase, state: BattleState, context: PhaseContext) => {
      if (phase === 'pre_attack' && context.target) {
        // Auto-face target before attack
        const updatedUnit = createFacingProcessor().faceTarget(
          context.activeUnit,
          context.target.position,
        );
        return updateUnit(state, updatedUnit);
      }
      return state;
    },
  };
}
