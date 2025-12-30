/**
 * Tier 2: Riposte - Type Definitions
 *
 * @module core/mechanics/tier2/riposte
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import type { AttackArc } from '../../tier0/facing/facing.types';
import type { RiposteConfig } from '../../config/mechanics.types';

/**
 * Riposte processor interface.
 */
export interface RiposteProcessor {
  /** Checks if defender can riposte. */
  canRiposte(defender: BattleUnit, attacker: BattleUnit, arc: AttackArc): boolean;

  /** Calculates riposte chance based on Initiative. */
  getRiposteChance(
    defender: BattleUnit,
    attacker: BattleUnit,
    config: RiposteConfig,
  ): number;

  /** Executes riposte counter-attack. */
  executeRiposte(
    defender: BattleUnit,
    attacker: BattleUnit,
    state: BattleState,
  ): BattleState;

  /** Apply riposte logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
