/**
 * Tier 3: Phalanx - Type Definitions
 *
 * @module core/mechanics/tier3/phalanx
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Phalanx processor interface.
 */
export interface PhalanxProcessor {
  /** Apply phalanx logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
