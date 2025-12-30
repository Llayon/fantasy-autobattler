/**
 * Tier 4: Armor Shred - Type Definitions
 *
 * @module core/mechanics/tier4/armor-shred
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import type { ShredConfig } from '../../config/mechanics.types';

/**
 * Armor Shred processor interface.
 */
export interface ArmorShredProcessor {
  /** Applies armor shred on physical attack. */
  applyShred(target: BattleUnit, config: ShredConfig): BattleUnit;

  /** Gets effective armor after shred. */
  getEffectiveArmor(unit: BattleUnit): number;

  /** Decays shred at turn end (if configured). */
  decayShred(unit: BattleUnit, config: ShredConfig): BattleUnit;

  /** Apply armor shred logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
