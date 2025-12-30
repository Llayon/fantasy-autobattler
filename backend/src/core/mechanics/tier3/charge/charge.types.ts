/**
 * Tier 3: Charge - Type Definitions
 *
 * @module core/mechanics/tier3/charge
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import type { ChargeConfig } from '../../config/mechanics.types';

/**
 * Charge processor interface.
 */
export interface ChargeProcessor {
  /** Calculates momentum based on distance moved. */
  calculateMomentum(distance: number, config: ChargeConfig): number;

  /** Applies charge damage bonus. */
  applyChargeBonus(baseDamage: number, momentum: number): number;

  /** Checks if charge is countered by Spear Wall. */
  isCounteredBySpearWall(target: BattleUnit): boolean;

  /** Apply charge logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
