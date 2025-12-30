/**
 * Tier 4: Contagion - Type Definitions
 *
 * @module core/mechanics/tier4/contagion
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import type { ContagionConfig } from '../../config/mechanics.types';

/**
 * Types of contagious effects.
 */
export type ContagionType = 'fire' | 'poison' | 'curse' | 'frost' | 'plague';

/**
 * Contagion processor interface.
 */
export interface ContagionProcessor {
  /** Gets spread chance for effect type. */
  getSpreadChance(effectType: ContagionType, config: ContagionConfig): number;

  /** Finds adjacent units that can be infected. */
  findSpreadTargets(source: BattleUnit, units: BattleUnit[]): BattleUnit[];

  /** Applies contagion spread at turn end. */
  spreadEffects(state: BattleState, seed: number): BattleState;

  /** Apply contagion logic for phase. */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}
