/**
 * Tier 2: Aura - Type Definitions
 *
 * @module core/mechanics/tier2/aura
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState } from '../../../types';

/**
 * Types of auras.
 */
export type AuraType = 'static' | 'pulse' | 'relic';

/**
 * Aura definition.
 */
export interface Aura {
  /** Unique identifier */
  id: string;
  /** Aura type */
  type: AuraType;
  /** Effect range in cells */
  range: number;
  /** Effect to apply */
  effect: string;
  /** Effect value */
  value: number;
}

/**
 * Aura processor interface.
 */
export interface AuraProcessor {
  /** Apply aura logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
