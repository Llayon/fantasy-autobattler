/**
 * Tier 3: Overwatch - Type Definitions
 *
 * @module core/mechanics/tier3/overwatch
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Overwatch processor interface.
 */
export interface OverwatchProcessor {
  /** Apply overwatch logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
