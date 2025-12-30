/**
 * Tier 1: Engagement - Type Definitions
 *
 * @module core/mechanics/tier1/engagement
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Engagement processor interface.
 */
export interface EngagementProcessor {
  /** Apply engagement logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
