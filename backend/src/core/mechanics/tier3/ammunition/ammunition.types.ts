/**
 * Tier 3: Ammunition - Type Definitions
 *
 * @module core/mechanics/tier3/ammunition
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Ammunition processor interface.
 */
export interface AmmoProcessor {
  /** Apply ammunition logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
