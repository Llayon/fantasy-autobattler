/**
 * Tier 3: Line of Sight - Type Definitions
 *
 * @module core/mechanics/tier3/los
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Types of fire.
 */
export type FireType = 'direct' | 'arc';

/**
 * Line of Sight processor interface.
 */
export interface LoSProcessor {
  /** Apply LoS logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
