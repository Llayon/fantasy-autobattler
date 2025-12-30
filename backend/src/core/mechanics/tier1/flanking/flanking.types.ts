/**
 * Tier 1: Flanking - Type Definitions
 *
 * @module core/mechanics/tier1/flanking
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';
import type { AttackArc } from '../../tier0/facing/facing.types';
import type { ResolveConfig } from '../../config/mechanics.types';

/**
 * Flanking processor interface.
 */
export interface FlankingProcessor {
  /** Calculates damage modifier based on attack arc. */
  getDamageModifier(arc: AttackArc): number;

  /** Calculates resolve damage based on attack arc. */
  getResolveDamage(arc: AttackArc, config: ResolveConfig): number;

  /** Checks if flanking disables riposte. */
  disablesRiposte(arc: AttackArc): boolean;

  /** Apply flanking logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
