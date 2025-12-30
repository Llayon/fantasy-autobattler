/**
 * Tier 2: Intercept - Type Definitions
 *
 * @module core/mechanics/tier2/intercept
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Types of intercept.
 */
export type InterceptType = 'hard' | 'soft';

/**
 * Intercept processor interface.
 */
export interface InterceptProcessor {
  /** Apply intercept logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
