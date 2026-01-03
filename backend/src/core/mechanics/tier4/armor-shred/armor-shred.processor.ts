/**
 * Tier 4: Armor Shred Processor
 *
 * Implements the armor shred system which reduces target armor on physical attacks.
 * Armor shred is a fully independent mechanic (no dependencies) that works with
 * any configuration.
 *
 * Key mechanics:
 * - Physical attacks apply armor shred to targets
 * - Shred accumulates up to a maximum percentage of base armor
 * - Effective armor = base armor - accumulated shred
 * - Optional decay reduces shred at turn end
 *
 * @module core/mechanics/tier4/armor-shred
 */

import type { BattleState, BattleUnit } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { ShredConfig } from '../../config/mechanics.types';
import { updateUnit, updateUnits } from '../../helpers';
import type {
  ArmorShredProcessor,
  UnitWithArmorShred,
  ApplyShredResult,
  EffectiveArmorResult,
  DecayShredResult,
} from './armor-shred.types';
import {
  DEFAULT_SHRED_PER_ATTACK,
  DEFAULT_MAX_SHRED_PERCENT,
  DEFAULT_DECAY_PER_TURN,
  MIN_EFFECTIVE_ARMOR,
} from './armor-shred.types';

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
 * Gets armor shred-specific properties from a unit.
 *
 * @param unit - Unit to get armor shred properties from
 * @returns Unit with armor shred properties
 */
function asArmorShredUnit(unit: BattleUnit): BattleUnit & UnitWithArmorShred {
  return unit as BattleUnit & UnitWithArmorShred;
}

/**
 * Gets the shred per attack value from config with fallback to default.
 *
 * @param config - Shred configuration
 * @returns Shred per attack value
 */
function getShredPerAttack(config: ShredConfig): number {
  return config.shredPerAttack ?? DEFAULT_SHRED_PER_ATTACK;
}

/**
 * Gets the max shred percent from config with fallback to default.
 *
 * @param config - Shred configuration
 * @returns Max shred percent (0.0 to 1.0)
 */
function getMaxShredPercent(config: ShredConfig): number {
  return config.maxShredPercent ?? DEFAULT_MAX_SHRED_PERCENT;
}

/**
 * Gets the decay per turn from config with fallback to default.
 *
 * @param config - Shred configuration
 * @returns Decay per turn value
 */
function getDecayPerTurn(config: ShredConfig): number {
  return config.decayPerTurn ?? DEFAULT_DECAY_PER_TURN;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an armor shred processor instance.
 *
 * The armor shred processor handles:
 * - Applying shred on physical attacks
 * - Calculating effective armor after shred
 * - Decaying shred at turn end (if configured)
 * - Tracking shred caps and limits
 *
 * @param config - Shred configuration with shred per attack, max percent, and decay
 * @returns ArmorShredProcessor instance
 *
 * @example
 * const processor = createShredProcessor({
 *   shredPerAttack: 1,
 *   maxShredPercent: 0.4,
 *   decayPerTurn: 0,
 * });
 *
 * // Apply shred on physical attack
 * const shreddedTarget = processor.applyShred(target, config);
 *
 * // Get effective armor for damage calculation
 * const effectiveArmor = processor.getEffectiveArmor(unit);
 *
 * // Decay shred at turn end
 * const decayedUnit = processor.decayShred(unit, config);
 */
export function createShredProcessor(config: ShredConfig): ArmorShredProcessor {
  return {
    /**
     * Applies armor shred on physical attack.
     * Shred is capped at maxShredPercent * baseArmor.
     *
     * ═══════════════════════════════════════════════════════════════
     * SHRED APPLICATION FORMULA
     * ═══════════════════════════════════════════════════════════════
     *
     * maxShred = floor(baseArmor * maxShredPercent)
     * newShred = min(maxShred, currentShred + shredPerAttack)
     *
     * Example calculations (with defaults):
     *   - Unit with 10 armor, 40% max = max 4 shred
     *   - Unit with 5 armor, 40% max = max 2 shred
     *   - Unit with 0 armor = max 0 shred (no effect)
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param target - Unit receiving the physical attack
     * @param shredConfig - Shred configuration
     * @returns Updated unit with new shred value
     */
    applyShred(
      target: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): BattleUnit & UnitWithArmorShred {
      const result = this.applyShredWithDetails(target, shredConfig);
      return result.target;
    },

    /**
     * Applies shred with detailed result tracking.
     *
     * @param target - Unit receiving the physical attack
     * @param shredConfig - Shred configuration
     * @returns Detailed result with shred application info
     */
    applyShredWithDetails(
      target: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): ApplyShredResult {
      const baseArmor = target.armor ?? 0;
      const currentShred = target.armorShred ?? 0;
      const shredPerAttack = getShredPerAttack(shredConfig);
      const maxShredPercent = getMaxShredPercent(shredConfig);

      // Calculate max shred for this unit
      const maxShred = Math.floor(baseArmor * maxShredPercent);

      // Calculate new shred (capped at max)
      const potentialShred = currentShred + shredPerAttack;
      const newShred = Math.min(maxShred, potentialShred);
      const shredApplied = newShred - currentShred;
      const wasCapped = potentialShred > maxShred;

      const updatedTarget: BattleUnit & UnitWithArmorShred = {
        ...target,
        armorShred: newShred,
      };

      return {
        target: updatedTarget,
        shredApplied,
        wasCapped,
        newTotalShred: newShred,
        maxShred,
      };
    },

    /**
     * Gets effective armor after shred.
     * Formula: max(0, baseArmor - armorShred)
     *
     * @param unit - Unit to calculate effective armor for
     * @returns Effective armor value (minimum 0)
     */
    getEffectiveArmor(unit: BattleUnit & UnitWithArmorShred): number {
      const baseArmor = unit.armor ?? 0;
      const currentShred = unit.armorShred ?? 0;
      return Math.max(MIN_EFFECTIVE_ARMOR, baseArmor - currentShred);
    },

    /**
     * Gets detailed effective armor calculation.
     *
     * @param unit - Unit to calculate effective armor for
     * @param shredConfig - Shred configuration (for max shred calculation)
     * @returns Detailed effective armor result
     */
    getEffectiveArmorDetails(
      unit: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): EffectiveArmorResult {
      const baseArmor = unit.armor ?? 0;
      const currentShred = unit.armorShred ?? 0;
      const maxShredPercent = getMaxShredPercent(shredConfig);
      const maxShred = Math.floor(baseArmor * maxShredPercent);
      const effectiveArmor = Math.max(MIN_EFFECTIVE_ARMOR, baseArmor - currentShred);
      const shredPercent = baseArmor > 0 ? currentShred / baseArmor : 0;

      return {
        baseArmor,
        currentShred,
        effectiveArmor,
        maxShred,
        shredPercent,
      };
    },

    /**
     * Calculates maximum shred for a unit.
     * Formula: floor(baseArmor * maxShredPercent)
     *
     * @param unit - Unit to calculate max shred for
     * @param shredConfig - Shred configuration
     * @returns Maximum shred value
     */
    getMaxShred(
      unit: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): number {
      const baseArmor = unit.armor ?? 0;
      const maxShredPercent = getMaxShredPercent(shredConfig);
      return Math.floor(baseArmor * maxShredPercent);
    },

    /**
     * Decays shred at turn end (if configured).
     * Only applies if config.decayPerTurn > 0.
     *
     * @param unit - Unit to decay shred for
     * @param shredConfig - Shred configuration
     * @returns Updated unit with decayed shred
     */
    decayShred(
      unit: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): BattleUnit & UnitWithArmorShred {
      const result = this.decayShredWithDetails(unit, shredConfig);
      return result.unit;
    },

    /**
     * Decays shred with detailed result tracking.
     *
     * @param unit - Unit to decay shred for
     * @param shredConfig - Shred configuration
     * @returns Detailed decay result
     */
    decayShredWithDetails(
      unit: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): DecayShredResult {
      const decayPerTurn = getDecayPerTurn(shredConfig);
      const previousShred = unit.armorShred ?? 0;

      // No decay if decay is 0 or unit has no shred
      if (decayPerTurn === 0 || previousShred === 0) {
        return {
          unit,
          decayAmount: 0,
          previousShred,
          newShred: previousShred,
        };
      }

      const newShred = Math.max(0, previousShred - decayPerTurn);
      const decayAmount = previousShred - newShred;

      const updatedUnit: BattleUnit & UnitWithArmorShred = {
        ...unit,
        armorShred: newShred,
      };

      return {
        unit: updatedUnit,
        decayAmount,
        previousShred,
        newShred,
      };
    },

    /**
     * Checks if a unit has any armor shred.
     *
     * @param unit - Unit to check
     * @returns True if unit has shred > 0
     */
    hasShred(unit: BattleUnit & UnitWithArmorShred): boolean {
      return (unit.armorShred ?? 0) > 0;
    },

    /**
     * Checks if a unit is at maximum shred.
     *
     * @param unit - Unit to check
     * @param shredConfig - Shred configuration
     * @returns True if unit's shred equals max shred
     */
    isAtMaxShred(
      unit: BattleUnit & UnitWithArmorShred,
      shredConfig: ShredConfig,
    ): boolean {
      const currentShred = unit.armorShred ?? 0;
      const maxShred = this.getMaxShred(unit, shredConfig);
      return currentShred >= maxShred;
    },

    /**
     * Resets shred on a unit to zero.
     * Useful for effects that cleanse debuffs.
     *
     * @param unit - Unit to reset shred for
     * @returns Updated unit with zero shred
     */
    resetShred(
      unit: BattleUnit & UnitWithArmorShred,
    ): BattleUnit & UnitWithArmorShred {
      return {
        ...unit,
        armorShred: 0,
      };
    },

    /**
     * Apply armor shred logic for a battle phase.
     *
     * Phase behaviors:
     * - attack: Apply shred on physical attacks
     * - turn_end: Decay shred (if configured)
     *
     * @param phase - Current battle phase
     * @param state - Current battle state
     * @param context - Phase context with active unit and action info
     * @returns Updated battle state
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // ─────────────────────────────────────────────────────────────
      // ATTACK: Apply shred on physical attacks
      // ─────────────────────────────────────────────────────────────
      if (phase === 'attack' && context.target && context.action?.type === 'attack') {
        const target = asArmorShredUnit(context.target);

        // Only apply shred to alive units with armor
        if (!isUnitAlive(target) || (target.armor ?? 0) <= 0) {
          return state;
        }

        const updatedTarget = this.applyShred(target, config);
        return updateUnit(state, updatedTarget);
      }

      // ─────────────────────────────────────────────────────────────
      // TURN_END: Decay shred (if configured)
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_end') {
        const decayPerTurn = getDecayPerTurn(config);

        // Skip if no decay configured
        if (decayPerTurn === 0) {
          return state;
        }

        // Decay shred on all units
        const updatedUnitsArray: BattleUnit[] = [];
        let hasChanges = false;

        for (const unit of state.units) {
          const shredUnit = asArmorShredUnit(unit);
          const currentShred = shredUnit.armorShred ?? 0;

          if (currentShred > 0) {
            const decayedUnit = this.decayShred(shredUnit, config);
            updatedUnitsArray.push(decayedUnit);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          return updateUnits(state, updatedUnitsArray);
        }
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createShredProcessor;
