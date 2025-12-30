/**
 * Tier 1: Resolve - Type Definitions
 *
 * @module core/mechanics/tier1/resolve
 */

import type { ResolveConfig } from '../../config/mechanics.types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';

/**
 * Resolve state for a unit in the mechanics system.
 * Named differently from core/battle/turn-order.ts ResolveState to avoid conflicts.
 */
export type MechanicsResolveState = 'active' | 'routing' | 'crumbled';

/**
 * Resolve processor interface.
 */
export interface ResolveProcessor {
  /** Regenerates resolve at turn start. */
  regenerate(unit: BattleUnit, config: ResolveConfig): BattleUnit;

  /** Applies resolve damage from combat. */
  applyDamage(unit: BattleUnit, damage: number): BattleUnit;

  /** Checks if unit should rout/crumble. */
  checkState(unit: BattleUnit, config: ResolveConfig): MechanicsResolveState;

  /** Apply resolve logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
