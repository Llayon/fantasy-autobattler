/**
 * Tier 4: Contagion Processor
 *
 * Implements the contagion (effect spreading) system which allows status effects
 * to spread from infected units to adjacent units. Contagion is designed
 * as a counter-mechanic to phalanx formations - dense formations have
 * increased spread risk.
 *
 * Contagion is independent (no dependencies) but interacts with:
 * - Phalanx: Units in phalanx formation have increased spread chance
 * - Status Effects: Spreads existing effects to adjacent units
 *
 * Key mechanics:
 * - Different effect types have different spread chances
 * - Spread occurs at turn end
 * - Adjacent units (Manhattan distance = 1) can be infected
 * - Phalanx formation increases spread chance (counter-synergy)
 * - Units already affected by an effect cannot be re-infected with same type
 *
 * @module core/mechanics/tier4/contagion
 */

import type { BattleState, BattleUnit } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { ContagionConfig } from '../../config/mechanics.types';
import { updateUnits } from '../../helpers';
import { manhattanDistance } from '../../../grid/grid';
import { SeededRandom } from '../../../utils/random';
import type {
  ContagionProcessor,
  ContagionType,
  ContagiousEffect,
  UnitWithContagion,
  SpreadEligibility,
  SpreadAttemptResult,
  UnitSpreadResult,
  SpreadPhaseResult,
  StatusEffect,
} from './contagion.types';
import {
  CONTAGION_TYPES,
  CONTAGION_CONFIG_KEYS,
  ADJACENCY_DISTANCE,
  DEFAULT_FIRE_SPREAD,
  DEFAULT_POISON_SPREAD,
  DEFAULT_CURSE_SPREAD,
  DEFAULT_FROST_SPREAD,
  DEFAULT_PLAGUE_SPREAD,
  DEFAULT_PHALANX_SPREAD_BONUS,
} from './contagion.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit is alive.
 *
 * @param unit - Unit to check
 * @returns True if unit is alive (HP > 0)
 */
function isUnitAlive(unit: BattleUnit): boolean {
  return (unit.currentHp ?? 0) > 0 && unit.alive !== false;
}

/**
 * Gets the unit's unique identifier.
 *
 * @param unit - Unit to get ID from
 * @returns Unit ID (instanceId or id)
 */
function getUnitId(unit: BattleUnit): string {
  return unit.instanceId ?? unit.id;
}

/**
 * Checks if an effect type is a contagious type.
 *
 * @param effectType - Effect type to check
 * @returns True if effect type is contagious
 */
function isContagiousType(effectType: string): effectType is ContagionType {
  return CONTAGION_TYPES.includes(effectType as ContagionType);
}

/**
 * Gets the spread chance for an effect type from config.
 *
 * ═══════════════════════════════════════════════════════════════
 * BASE SPREAD CHANCE FORMULA
 * ═══════════════════════════════════════════════════════════════
 *
 * Each contagion type has a different base spread chance reflecting
 * its nature and how easily it transmits between units:
 *
 *   baseChance = config[effectType + 'Spread'] ?? DEFAULT_[EFFECT]_SPREAD
 *
 * Default spread chances (from most to least contagious):
 *   - plague: 0.60 (60%) - Disease spreads rapidly in close quarters
 *   - fire:   0.50 (50%) - Burns spread quickly through contact
 *   - poison: 0.30 (30%) - Toxins spread moderately through contact
 *   - curse:  0.25 (25%) - Magical afflictions spread slowly
 *   - frost:  0.20 (20%) - Cold effects require sustained exposure
 *
 * The spread chance represents the probability that an effect will
 * transfer from an infected unit to an adjacent unit during the
 * turn_end phase. A random roll (0.0 to 1.0) is compared against
 * this chance: if roll < spreadChance, the effect spreads.
 *
 * ═══════════════════════════════════════════════════════════════
 *
 * @param effectType - Type of contagious effect
 * @param config - Contagion configuration
 * @returns Base spread chance (0.0 to 1.0)
 */
function getBaseSpreadChance(
  effectType: ContagionType,
  config: ContagionConfig,
): number {
  // Look up the config key for this effect type (e.g., 'fire' -> 'fireSpread')
  const configKey = CONTAGION_CONFIG_KEYS[effectType];
  const configValue = config[configKey];

  // Return config value if it's a number, otherwise use defaults
  if (typeof configValue === 'number') {
    return configValue;
  }

  // Fallback to defaults based on effect type's natural contagiousness
  const defaults: Record<ContagionType, number> = {
    fire: DEFAULT_FIRE_SPREAD,      // 0.50 - Burns spread quickly
    poison: DEFAULT_POISON_SPREAD,  // 0.30 - Toxins spread moderately
    curse: DEFAULT_CURSE_SPREAD,    // 0.25 - Magic spreads slowly
    frost: DEFAULT_FROST_SPREAD,    // 0.20 - Cold requires exposure
    plague: DEFAULT_PLAGUE_SPREAD,  // 0.60 - Disease is most contagious
  };

  return defaults[effectType];
}

/**
 * Checks if a unit has a specific effect type.
 *
 * @param unit - Unit to check
 * @param effectType - Effect type to look for
 * @returns True if unit has the effect
 */
function hasEffect(
  unit: BattleUnit & UnitWithContagion,
  effectType: ContagionType,
): boolean {
  return unit.statusEffects?.some((e) => e.type === effectType) ?? false;
}

/**
 * Checks if a unit is immune to a specific effect type.
 *
 * @param unit - Unit to check
 * @param effectType - Effect type to check immunity for
 * @returns True if unit is immune
 */
function isImmuneTo(
  unit: BattleUnit & UnitWithContagion,
  effectType: ContagionType,
): boolean {
  return unit.contagionImmunities?.includes(effectType) ?? false;
}

/**
 * Checks if two units are adjacent (Manhattan distance = 1).
 *
 * @param unit1 - First unit
 * @param unit2 - Second unit
 * @returns True if units are adjacent
 */
function areAdjacent(
  unit1: BattleUnit & UnitWithContagion,
  unit2: BattleUnit & UnitWithContagion,
): boolean {
  if (!unit1.position || !unit2.position) {
    return false;
  }
  return manhattanDistance(unit1.position, unit2.position) === ADJACENCY_DISTANCE;
}

/**
 * Gets contagion-specific properties from a unit.
 *
 * @param unit - Unit to get contagion properties from
 * @returns Unit with contagion properties
 */
function asContagionUnit(unit: BattleUnit): BattleUnit & UnitWithContagion {
  return unit as BattleUnit & UnitWithContagion;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a contagion processor instance.
 *
 * The contagion processor handles:
 * - Getting spread chances for different effect types
 * - Finding adjacent units that can be infected
 * - Checking spread eligibility (immunity, already infected, etc.)
 * - Spreading effects at turn end
 * - Applying phalanx spread bonus
 *
 * @param config - Contagion configuration with spread chances
 * @returns ContagionProcessor instance
 *
 * @example
 * const processor = createContagionProcessor({
 *   fireSpread: 0.5,
 *   poisonSpread: 0.3,
 *   curseSpread: 0.25,
 *   frostSpread: 0.2,
 *   plagueSpread: 0.6,
 *   phalanxSpreadBonus: 0.15,
 * });
 *
 * // Get spread chance for plague
 * const chance = processor.getSpreadChance('plague', config); // 0.6
 *
 * // Find adjacent targets
 * const targets = processor.findSpreadTargets(infectedUnit, allUnits);
 *
 * // Spread effects at turn end
 * const newState = processor.spreadEffects(state, seed);
 */
export function createContagionProcessor(
  config: ContagionConfig,
): ContagionProcessor {
  // Use config values or defaults
  const phalanxSpreadBonus = config.phalanxSpreadBonus ?? DEFAULT_PHALANX_SPREAD_BONUS;

  return {
    /**
     * Gets the base spread chance for an effect type.
     *
     * @param effectType - Type of contagious effect
     * @param contagionConfig - Contagion configuration
     * @returns Base spread chance (0.0 to 1.0)
     */
    getSpreadChance(
      effectType: ContagionType,
      contagionConfig: ContagionConfig,
    ): number {
      return getBaseSpreadChance(effectType, contagionConfig);
    },

    /**
     * Calculates the effective spread chance including phalanx bonus.
     *
     * ═══════════════════════════════════════════════════════════════
     * EFFECTIVE SPREAD CHANCE FORMULA
     * ═══════════════════════════════════════════════════════════════
     *
     * The effective spread chance combines the base chance with any
     * situational modifiers. Currently, the only modifier is the
     * phalanx formation bonus:
     *
     *   effectiveChance = baseChance + phalanxBonus
     *
     * Where:
     *   - baseChance: Effect type's natural spread rate (0.2 to 0.6)
     *   - phalanxBonus: +0.15 if target is in phalanx, 0 otherwise
     *
     * PHALANX COUNTER-SYNERGY:
     * Dense phalanx formations provide defensive bonuses (armor, resolve)
     * but increase disease/effect spread risk. This creates a strategic
     * trade-off: tight formations are strong defensively but vulnerable
     * to contagion effects.
     *
     * Example calculations (with default values):
     *   - Fire (0.50) + phalanx (0.15) = 0.65 (65% chance)
     *   - Plague (0.60) + phalanx (0.15) = 0.75 (75% chance)
     *   - Frost (0.20) + no phalanx (0.00) = 0.20 (20% chance)
     *   - Poison (0.30) + phalanx (0.15) = 0.45 (45% chance)
     *
     * Note: Effective chance can exceed 1.0 (100%) with bonuses,
     * which guarantees spread success.
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param effectType - Type of contagious effect
     * @param target - Target unit (checked for phalanx status)
     * @param contagionConfig - Contagion configuration
     * @returns Effective spread chance (0.0 to 1.0+)
     */
    getEffectiveSpreadChance(
      effectType: ContagionType,
      target: BattleUnit & UnitWithContagion,
      contagionConfig: ContagionConfig,
    ): number {
      // Step 1: Get base spread chance for this effect type
      const baseChance = getBaseSpreadChance(effectType, contagionConfig);

      // Step 2: Calculate phalanx bonus (counter-synergy mechanic)
      // Units in tight formations are more susceptible to contagion
      const bonus = target.inPhalanx
        ? (contagionConfig.phalanxSpreadBonus ?? phalanxSpreadBonus)
        : 0;

      // Step 3: Return combined chance (may exceed 1.0 for guaranteed spread)
      return baseChance + bonus;
    },

    /**
     * Finds adjacent units that can potentially be infected.
     * Filters out dead units, self, and non-adjacent units.
     *
     * @param source - Unit with contagious effects
     * @param units - All units in battle
     * @returns Array of valid spread targets
     */
    findSpreadTargets(
      source: BattleUnit & UnitWithContagion,
      units: Array<BattleUnit & UnitWithContagion>,
    ): Array<BattleUnit & UnitWithContagion> {
      const sourceId = getUnitId(source);

      return units.filter((unit) => {
        // Cannot spread to self
        if (getUnitId(unit) === sourceId) {
          return false;
        }

        // Cannot spread to dead units
        if (!isUnitAlive(unit)) {
          return false;
        }

        // Must be adjacent
        if (!areAdjacent(source, unit)) {
          return false;
        }

        return true;
      });
    },

    /**
     * Checks if a specific effect can spread to a target.
     *
     * @param effectType - Type of effect to spread
     * @param source - Unit spreading the effect
     * @param target - Potential target unit
     * @param contagionConfig - Contagion configuration
     * @returns Spread eligibility result
     */
    canSpreadTo(
      effectType: ContagionType,
      source: BattleUnit & UnitWithContagion,
      target: BattleUnit & UnitWithContagion,
      contagionConfig: ContagionConfig,
    ): SpreadEligibility {
      const sourceId = getUnitId(source);
      const targetId = getUnitId(target);

      // Cannot spread to self
      if (sourceId === targetId) {
        return {
          canSpread: false,
          reason: 'same_unit',
          spreadChance: 0,
          phalanxBonusApplied: false,
        };
      }

      // Cannot spread to dead units
      if (!isUnitAlive(target)) {
        return {
          canSpread: false,
          reason: 'dead',
          spreadChance: 0,
          phalanxBonusApplied: false,
        };
      }

      // Must be adjacent
      if (!areAdjacent(source, target)) {
        return {
          canSpread: false,
          reason: 'not_adjacent',
          spreadChance: 0,
          phalanxBonusApplied: false,
        };
      }

      // Cannot spread if target is immune
      if (isImmuneTo(target, effectType)) {
        return {
          canSpread: false,
          reason: 'immune',
          spreadChance: 0,
          phalanxBonusApplied: false,
        };
      }

      // Cannot spread if target already has this effect
      if (hasEffect(target, effectType)) {
        return {
          canSpread: false,
          reason: 'already_infected',
          spreadChance: 0,
          phalanxBonusApplied: false,
        };
      }

      // Calculate effective spread chance
      const spreadChance = this.getEffectiveSpreadChance(
        effectType,
        target,
        contagionConfig,
      );
      const phalanxBonusApplied = target.inPhalanx === true;

      return {
        canSpread: true,
        spreadChance,
        phalanxBonusApplied,
      };
    },

    /**
     * Gets all contagious effects from a unit's status effects.
     *
     * @param unit - Unit to check for contagious effects
     * @returns Array of contagious effects
     */
    getContagiousEffects(unit: BattleUnit & UnitWithContagion): ContagiousEffect[] {
      if (!unit.statusEffects) {
        return [];
      }

      return unit.statusEffects
        .filter((effect) => isContagiousType(effect.type))
        .map((effect): ContagiousEffect => {
          const contagiousEffect = effect as ContagiousEffect;
          return {
            type: effect.type as ContagionType,
            duration: effect.duration,
            ...(contagiousEffect.sourceId !== undefined && { sourceId: contagiousEffect.sourceId }),
            ...(contagiousEffect.appliedOnTurn !== undefined && { appliedOnTurn: contagiousEffect.appliedOnTurn }),
            ...(contagiousEffect.isSpread !== undefined && { isSpread: contagiousEffect.isSpread }),
            ...(contagiousEffect.spreadFromId !== undefined && { spreadFromId: contagiousEffect.spreadFromId }),
          };
        });
    },

    /**
     * Applies a contagious effect to a target unit.
     *
     * @param target - Unit to infect
     * @param effect - Effect to apply
     * @param sourceId - ID of unit spreading the effect
     * @returns Updated unit with new effect
     */
    applyEffect(
      target: BattleUnit & UnitWithContagion,
      effect: ContagiousEffect,
      sourceId: string,
    ): BattleUnit & UnitWithContagion {
      const existingEffects = target.statusEffects ?? [];

      // Create the spread effect as a StatusEffect (compatible with existing system)
      const spreadEffect: StatusEffect = {
        type: effect.type,
        duration: effect.duration,
        sourceId: effect.sourceId,
        isSpread: true,
        spreadFromId: sourceId,
      };

      return {
        ...target,
        statusEffects: [...existingEffects, spreadEffect],
      };
    },

    /**
     * Spreads all contagious effects at turn end.
     * Processes all infected units and attempts to spread their effects
     * to adjacent units.
     *
     * @param state - Current battle state
     * @param seed - Random seed for deterministic spread
     * @returns Updated battle state with spread effects
     */
    spreadEffects(state: BattleState, seed: number): BattleState {
      const result = this.spreadEffectsWithDetails(state, seed, config);
      return result.state;
    },

    /**
     * Spreads effects with detailed result tracking.
     * Same as spreadEffects but returns detailed results for logging.
     *
     * @param state - Current battle state
     * @param seed - Random seed for deterministic spread
     * @param contagionConfig - Contagion configuration
     * @returns Spread phase result with details
     */
    spreadEffectsWithDetails(
      state: BattleState,
      seed: number,
      contagionConfig: ContagionConfig,
    ): SpreadPhaseResult {
      const rng = new SeededRandom(seed);
      const unitResults: UnitSpreadResult[] = [];
      const allNewlyInfectedIds: string[] = [];
      let totalAttempts = 0;
      let totalSuccessful = 0;

      // Create a map of units for efficient updates
      const unitMap = new Map<string, BattleUnit & UnitWithContagion>();
      for (const unit of state.units) {
        unitMap.set(getUnitId(unit), asContagionUnit(unit));
      }

      // Process each unit with contagious effects
      for (const unit of state.units) {
        const contagionUnit = asContagionUnit(unit);
        const contagiousEffects = this.getContagiousEffects(contagionUnit);

        if (contagiousEffects.length === 0) {
          continue;
        }

        const sourceId = getUnitId(unit);
        const effectsChecked: ContagionType[] = [];
        const attempts: SpreadAttemptResult[] = [];
        const newlyInfectedIds: string[] = [];

        // Find adjacent targets
        const allUnits = Array.from(unitMap.values());
        const adjacentTargets = this.findSpreadTargets(contagionUnit, allUnits);

        // Try to spread each contagious effect
        for (const effect of contagiousEffects) {
          effectsChecked.push(effect.type);

          // Try to spread to each adjacent target
          for (const target of adjacentTargets) {
            const targetId = getUnitId(target);

            // Get current target state (may have been updated by previous spreads)
            const currentTarget = unitMap.get(targetId);
            if (!currentTarget) {
              continue;
            }

            // Check if spread is possible
            const eligibility = this.canSpreadTo(
              effect.type,
              contagionUnit,
              currentTarget,
              contagionConfig,
            );

            totalAttempts++;

            if (!eligibility.canSpread) {
              // Record blocked attempt
              const blockedAttempt: SpreadAttemptResult = {
                success: false,
                sourceId,
                targetId,
                effectType: effect.type,
                roll: 0,
                spreadChance: eligibility.spreadChance,
                phalanxBonusApplied: eligibility.phalanxBonusApplied,
              };
              if (eligibility.reason) {
                blockedAttempt.blockReason = eligibility.reason;
              }
              attempts.push(blockedAttempt);
              continue;
            }

            // ─────────────────────────────────────────────────────────────
            // SPREAD SUCCESS DETERMINATION
            // ─────────────────────────────────────────────────────────────
            // Roll a random number (0.0 to 1.0) and compare against the
            // effective spread chance. If roll < spreadChance, spread succeeds.
            //
            // Formula: success = (randomRoll < effectiveSpreadChance)
            //
            // Example with plague (0.6) + phalanx (0.15) = 0.75:
            //   - Roll 0.42 → 0.42 < 0.75 → SUCCESS (effect spreads)
            //   - Roll 0.89 → 0.89 < 0.75 → FAILURE (effect blocked)
            //
            // This probabilistic model ensures:
            //   - Higher spread chances = more likely to spread
            //   - Deterministic results with seeded random
            //   - Phalanx formations face higher infection risk
            // ─────────────────────────────────────────────────────────────
            const roll = rng.next();
            const success = roll < eligibility.spreadChance;

            attempts.push({
              success,
              sourceId,
              targetId,
              effectType: effect.type,
              roll,
              spreadChance: eligibility.spreadChance,
              phalanxBonusApplied: eligibility.phalanxBonusApplied,
            });

            if (success) {
              // Apply the effect to the target
              const updatedTarget = this.applyEffect(currentTarget, effect, sourceId);
              unitMap.set(targetId, updatedTarget);

              totalSuccessful++;
              if (!newlyInfectedIds.includes(targetId)) {
                newlyInfectedIds.push(targetId);
              }
              if (!allNewlyInfectedIds.includes(targetId)) {
                allNewlyInfectedIds.push(targetId);
              }
            }
          }
        }

        // Record unit result
        unitResults.push({
          sourceId,
          effectsChecked,
          attempts,
          successfulSpreads: attempts.filter((a) => a.success).length,
          newlyInfectedIds,
        });
      }

      // Build updated state
      const updatedUnitsArray = Array.from(unitMap.values());
      const updatedState = updateUnits(state, updatedUnitsArray);

      return {
        unitResults,
        totalAttempts,
        totalSuccessful,
        allNewlyInfectedIds,
        state: updatedState,
      };
    },

    /**
     * Apply contagion logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_end: Spread effects to adjacent units
     * - attack: Apply contagious effects from attacks (handled elsewhere)
     *
     * @param phase - Current battle phase
     * @param state - Current battle state
     * @param context - Phase context with active unit and seed
     * @returns Updated battle state
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // ─────────────────────────────────────────────────────────────
      // TURN_END: Spread effects to adjacent units
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_end') {
        return this.spreadEffects(state, context.seed);
      }

      // ─────────────────────────────────────────────────────────────
      // ATTACK: Contagious effects from attacks are applied by the
      // ability/damage system, not by this processor.
      // ─────────────────────────────────────────────────────────────

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createContagionProcessor;
