/**
 * Tier 2: Riposte Processor
 *
 * Implements the riposte (counter-attack) system which allows defenders
 * to counter-attack when hit from the front arc. Riposte is disabled
 * when attacked from flank or rear.
 *
 * Riposte requires the flanking mechanic (Tier 1) to be enabled,
 * which in turn requires facing (Tier 0).
 *
 * Key mechanics:
 * - Only front attacks allow riposte (flank/rear disable it)
 * - Riposte chance is based on Initiative comparison
 * - Units have limited riposte charges per round
 * - Riposte deals reduced damage (50% of normal)
 *
 * @module core/mechanics/tier2/riposte
 */

import type { BattleState, BattleUnit } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { RiposteConfig } from '../../config/mechanics.types';
import { updateUnits } from '../../helpers';
import { seededRandom } from '../../../utils/random';
import { createFacingProcessor } from '../../tier0/facing/facing.processor';
import type {
  AttackArc,
  RiposteProcessor,
  UnitWithRiposte,
} from './riposte.types';
import {
  RIPOSTE_DAMAGE_MULTIPLIER as DAMAGE_MULTIPLIER,
  MIN_RIPOSTE_CHANCE as MIN_CHANCE,
  MAX_RIPOSTE_CHANCE as MAX_CHANCE,
} from './riposte.types';

/**
 * Creates a riposte processor instance.
 *
 * The riposte processor handles:
 * - Checking if defender can riposte (front arc, has charges)
 * - Calculating riposte chance based on Initiative comparison
 * - Executing riposte counter-attacks with reduced damage
 * - Resetting riposte charges at round start
 *
 * @param config - Riposte configuration with chance and charge settings
 * @returns RiposteProcessor instance
 *
 * @example
 * const processor = createRiposteProcessor({
 *   initiativeBased: true,
 *   chargesPerRound: 'attackCount',
 *   baseChance: 0.5,
 *   guaranteedThreshold: 10,
 * });
 *
 * // Check if defender can riposte
 * const canRiposte = processor.canRiposte(defender, attacker, 'front');
 *
 * // Calculate riposte chance
 * const chance = processor.getRiposteChance(defender, attacker, config);
 *
 * // Execute riposte
 * const newState = processor.executeRiposte(defender, attacker, state);
 */
export function createRiposteProcessor(config: RiposteConfig): RiposteProcessor {
  return {
    /**
     * Checks if defender can riposte against the attacker.
     * Riposte is only allowed from front arc and requires charges.
     *
     * Conditions for riposte:
     * 1. Attack must be from front arc (not flank or rear)
     * 2. Defender must have riposte charges remaining
     * 3. Defender must be alive
     *
     * @param defender - Unit being attacked (potential riposte source)
     * @param attacker - Unit performing the attack
     * @param arc - Attack arc relative to defender's facing
     * @returns True if defender can riposte
     *
     * @example
     * if (processor.canRiposte(defender, attacker, 'front')) {
     *   // Proceed with riposte chance roll
     * }
     */
    canRiposte(
      defender: BattleUnit & UnitWithRiposte,
      _attacker: BattleUnit,
      arc: AttackArc,
    ): boolean {
      // Rule 1: Cannot riposte if attacked from flank or rear
      // Flanking attacks catch the defender off-guard, preventing counter-attack
      if (arc !== 'front') {
        return false;
      }

      // Rule 2: Defender must be alive to riposte
      if (!defender.alive || defender.currentHp <= 0) {
        return false;
      }

      // Rule 3: Check remaining riposte charges
      // Charges are determined by config.chargesPerRound:
      // - 'attackCount': Uses unit's attackCount stat (default: 1)
      // - number: Fixed number of charges per round
      const maxCharges = getMaxRiposteCharges(defender, config);
      const currentCharges = defender.riposteCharges ?? maxCharges;

      return currentCharges > 0;
    },

    /**
     * Calculates riposte chance based on Initiative comparison.
     * Higher defender Initiative = higher riposte chance.
     *
     * Formula (when initiativeBased = true):
     * - initDiff = defender.initiative - attacker.initiative
     * - If initDiff >= guaranteedThreshold: chance = 1.0 (guaranteed)
     * - If initDiff <= -guaranteedThreshold: chance = 0.0 (impossible)
     * - Otherwise: chance = baseChance + (initDiff / guaranteedThreshold) * 0.5
     *
     * When initiativeBased = false, returns baseChance directly.
     *
     * @param defender - Unit being attacked
     * @param attacker - Unit performing the attack
     * @param _config - Riposte configuration (uses instance config)
     * @returns Riposte chance (0.0 to 1.0)
     *
     * @example
     * const chance = processor.getRiposteChance(defender, attacker, config);
     * if (seededRandom(seed) < chance) {
     *   // Riposte succeeds
     * }
     */
    getRiposteChance(
      defender: BattleUnit & UnitWithRiposte,
      attacker: BattleUnit,
      _config?: RiposteConfig,
    ): number {
      // If not using Initiative-based calculation, return flat base chance
      if (!config.initiativeBased) {
        return config.baseChance;
      }

      // Get Initiative values (default to 0 if not set)
      const defenderInit = defender.initiative ?? defender.stats?.initiative ?? 0;
      const attackerWithRiposte = attacker as BattleUnit & UnitWithRiposte;
      const attackerInit = attackerWithRiposte.initiative ?? attacker.stats?.initiative ?? 0;

      // Calculate Initiative difference
      // Positive = defender is faster, negative = attacker is faster
      const initDiff = defenderInit - attackerInit;

      // Guaranteed riposte if defender much faster
      // Formula: if initDiff >= guaranteedThreshold, chance = 100%
      if (initDiff >= config.guaranteedThreshold) {
        return MAX_CHANCE;
      }

      // No riposte if attacker much faster
      // Formula: if initDiff <= -guaranteedThreshold, chance = 0%
      if (initDiff <= -config.guaranteedThreshold) {
        return MIN_CHANCE;
      }

      // Linear interpolation between 0% and 100%
      // Formula: chance = baseChance + (initDiff / guaranteedThreshold) * 0.5
      // At initDiff = 0: chance = baseChance (default 50%)
      // At initDiff = +threshold: chance = baseChance + 0.5 = 100%
      // At initDiff = -threshold: chance = baseChance - 0.5 = 0%
      const chance = config.baseChance + (initDiff / config.guaranteedThreshold) * 0.5;

      // Clamp to valid range [0, 1]
      return Math.max(MIN_CHANCE, Math.min(MAX_CHANCE, chance));
    },

    /**
     * Executes a riposte counter-attack.
     * Deals 50% of defender's normal damage to attacker.
     * Consumes one riposte charge.
     *
     * Riposte damage formula:
     * damage = floor(defender.atk * RIPOSTE_DAMAGE_MULTIPLIER)
     *
     * @param defender - Unit performing the riposte
     * @param attacker - Unit receiving riposte damage
     * @param state - Current battle state
     * @returns Updated battle state with damage applied
     *
     * @example
     * const newState = processor.executeRiposte(defender, attacker, state);
     */
    executeRiposte(
      defender: BattleUnit & UnitWithRiposte,
      attacker: BattleUnit,
      state: BattleState,
    ): BattleState {
      // Calculate riposte damage (50% of normal attack)
      // Formula: damage = floor(ATK * 0.5)
      const defenderAtk = defender.stats?.atk ?? 0;
      const damage = Math.floor(defenderAtk * DAMAGE_MULTIPLIER);

      // Apply damage to attacker
      // Formula: newHp = max(0, currentHp - damage)
      const newAttackerHp = Math.max(0, attacker.currentHp - damage);
      const attackerAlive = newAttackerHp > 0;

      // Consume one riposte charge from defender
      const maxCharges = getMaxRiposteCharges(defender, config);
      const currentCharges = defender.riposteCharges ?? maxCharges;
      const newCharges = Math.max(0, currentCharges - 1);

      // Create updated units
      const updatedAttacker: BattleUnit = {
        ...attacker,
        currentHp: newAttackerHp,
        alive: attackerAlive,
      };

      const updatedDefender: BattleUnit & UnitWithRiposte = {
        ...defender,
        riposteCharges: newCharges,
      };

      // Return updated state with both units modified
      return updateUnits(state, [updatedAttacker, updatedDefender]);
    },

    /**
     * Apply riposte logic for a battle phase.
     * Riposte is checked during the 'attack' phase after damage is dealt.
     *
     * Phase behaviors:
     * - attack: Check for riposte opportunity after attacker deals damage
     * - turn_start: Reset riposte charges for the active unit (once per round)
     *
     * Charge reset is tracked per-round, not per-turn. This means:
     * - Round 1: All units start with full charges
     * - During Round 1: Units use charges as they riposte
     * - Round 2 starts: All units get charges reset (once per unit)
     * - The lastChargeResetRound field tracks when charges were last reset
     *
     * @param phase - Current battle phase
     * @param state - Current battle state
     * @param context - Phase context with active unit and target
     * @returns Updated battle state
     *
     * @example
     * const newState = processor.apply('attack', state, {
     *   activeUnit: attacker,
     *   target: defender,
     *   seed: 12345,
     * });
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // Handle riposte trigger during attack phase
      if (phase === 'attack' && context.target) {
        // Get the target (defender) from state to ensure we have latest HP
        const defender = state.units.find(u => u.id === context.target?.id);
        if (!defender || !defender.alive || defender.currentHp <= 0) {
          return state;
        }

        // Get the attacker from state
        const attacker = state.units.find(u => u.id === context.activeUnit.id);
        if (!attacker || !attacker.alive || attacker.currentHp <= 0) {
          return state;
        }

        // Calculate attack arc using facing processor
        const facingProcessor = createFacingProcessor();
        const arc = facingProcessor.getAttackArc(attacker, defender);

        // Check if defender can riposte
        const defenderWithRiposte = defender as BattleUnit & UnitWithRiposte;
        if (!this.canRiposte(defenderWithRiposte, attacker, arc)) {
          return state;
        }

        // Calculate riposte chance
        const chance = this.getRiposteChance(defenderWithRiposte, attacker, config);

        // Roll for riposte success using seeded random
        const roll = seededRandom(context.seed);

        // If roll succeeds, execute riposte
        if (roll < chance) {
          return this.executeRiposte(defenderWithRiposte, attacker, state);
        }
      }

      // Handle riposte charge reset at turn start (once per round)
      // Charges are reset when a new round starts, tracked by lastChargeResetRound
      if (phase === 'turn_start') {
        const unit = state.units.find(u => u.id === context.activeUnit.id);
        if (unit) {
          const unitWithRiposte = unit as BattleUnit & UnitWithRiposte;
          const currentRound = state.round ?? 1;
          const lastResetRound = unitWithRiposte.lastChargeResetRound ?? 0;

          // Only reset charges if we're in a new round
          // This ensures charges are reset once per round, not once per turn
          if (currentRound > lastResetRound) {
            const maxCharges = getMaxRiposteCharges(unitWithRiposte, config);

            const updatedUnit: BattleUnit & UnitWithRiposte = {
              ...unitWithRiposte,
              riposteCharges: maxCharges,
              maxRiposteCharges: maxCharges,
              lastChargeResetRound: currentRound,
            };
            return updateUnits(state, [updatedUnit]);
          }
        }
      }

      return state;
    },
  };
}

/**
 * Helper function to get maximum riposte charges for a unit.
 * Uses config.chargesPerRound which can be:
 * - 'attackCount': Uses unit's attackCount stat (default: 1)
 * - number: Fixed number of charges per round
 *
 * @param unit - Unit to get max charges for
 * @param config - Riposte configuration
 * @returns Maximum riposte charges per round
 */
function getMaxRiposteCharges(
  unit: BattleUnit & UnitWithRiposte,
  config: RiposteConfig,
): number {
  if (config.chargesPerRound === 'attackCount') {
    // Use unit's attack count, default to 1 if not set
    return unit.attackCount ?? unit.stats?.atkCount ?? 1;
  }
  return config.chargesPerRound;
}

/**
 * Default export for convenience.
 */
export default createRiposteProcessor;
