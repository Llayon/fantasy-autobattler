/**
 * Tier 3: Overwatch Processor
 *
 * Implements the overwatch (ranged reaction fire) system which allows ranged
 * units to enter a Vigilance state and automatically fire at enemies that
 * move within their range. Overwatch is primarily used by archers and
 * crossbowmen to control enemy movement.
 *
 * Overwatch requires both the intercept mechanic (Tier 2) and the
 * ammunition mechanic (Tier 3) to be enabled.
 *
 * Key mechanics:
 * - Vigilance state: Unit skips turn to enter overwatch mode
 * - Trigger on movement: Fires when enemy enters/moves through range
 * - Ammo consumption: Each overwatch shot consumes ammunition
 * - Reset at turn end: Vigilance state clears at end of round
 * - Limited shots: Can only fire once per enemy movement
 *
 * @module core/mechanics/tier3/overwatch
 */

import type { BattleState, BattleUnit, Position } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import { updateUnit, updateUnits, findUnit } from '../../helpers';
import { manhattanDistance } from '../../../grid/grid';
import { seededRandom } from '../../../utils/random';
import type {
  OverwatchProcessor,
  UnitWithOverwatch,
  OverwatchCheckResult,
  OverwatchOpportunity,
  OverwatchShotResult,
  EnterVigilanceResult,
  ExitVigilanceResult,
  ToggleVigilanceResult,
  OverwatchBlockReason,
  VigilanceBlockReason,
  VigilanceExitBlockReason,
  OverwatchProcessorOptions,
} from './overwatch.types';
import {
  DEFAULT_OVERWATCH_DAMAGE_MODIFIER,
  DEFAULT_MAX_OVERWATCH_SHOTS,
  DEFAULT_OVERWATCH_ACCURACY_PENALTY,
  OVERWATCH_TAG,
  OVERWATCH_IMMUNE_TAG,
} from './overwatch.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit has the overwatch capability.
 * A unit can overwatch if it has 'ranged' tag or canOverwatch is true.
 *
 * @param unit - Unit to check
 * @param overwatchTags - Custom tags for overwatch capability
 * @returns True if unit can perform overwatch
 */
function hasOverwatchCapability(
  unit: BattleUnit & UnitWithOverwatch,
  overwatchTags: string[] = [OVERWATCH_TAG],
): boolean {
  if (unit.canOverwatch !== undefined) {
    return unit.canOverwatch;
  }
  const tags = unit.tags ?? [];
  return overwatchTags.some((tag) => tags.includes(tag));
}

/**
 * Checks if a unit is immune to overwatch (stealth units).
 *
 * @param unit - Unit to check
 * @param immunityTags - Custom tags for overwatch immunity
 * @returns True if unit is immune to overwatch
 */
function hasOverwatchImmunity(
  unit: BattleUnit & UnitWithOverwatch,
  immunityTags: string[] = [OVERWATCH_IMMUNE_TAG],
): boolean {
  const tags = unit.tags ?? [];
  return immunityTags.some((tag) => tags.includes(tag));
}

/**
 * Gets the attack value for a unit.
 *
 * @param unit - Unit to get attack for
 * @returns Attack value
 */
function getUnitAtk(unit: BattleUnit & UnitWithOverwatch): number {
  return unit.stats?.atk ?? 0;
}

/**
 * Gets the current HP for a unit.
 *
 * @param unit - Unit to get HP for
 * @returns Current HP
 */
function getUnitHp(unit: BattleUnit & UnitWithOverwatch): number {
  return unit.currentHp ?? 0;
}

/**
 * Gets the attack range for a unit.
 *
 * @param unit - Unit to get range for
 * @returns Attack range
 */
function getUnitRange(unit: BattleUnit & UnitWithOverwatch): number {
  return unit.range ?? 1;
}

/**
 * Gets the overwatch range for a unit.
 * Defaults to unit's attack range if not specified.
 *
 * @param unit - Unit to get overwatch range for
 * @returns Overwatch range
 */
function getOverwatchRange(unit: BattleUnit & UnitWithOverwatch): number {
  return unit.overwatchRange ?? getUnitRange(unit);
}

/**
 * Gets the maximum overwatch shots for a unit.
 *
 * @param unit - Unit to get max shots for
 * @param defaultMax - Default maximum shots
 * @returns Maximum overwatch shots per round
 */
function getMaxOverwatchShots(
  unit: BattleUnit & UnitWithOverwatch,
  defaultMax: number = DEFAULT_MAX_OVERWATCH_SHOTS,
): number {
  return unit.maxOverwatchShots ?? defaultMax;
}

/**
 * Gets the remaining overwatch shots for a unit.
 *
 * @param unit - Unit to get remaining shots for
 * @param defaultMax - Default maximum shots
 * @returns Remaining overwatch shots
 */
function getRemainingOverwatchShots(
  unit: BattleUnit & UnitWithOverwatch,
  defaultMax: number = DEFAULT_MAX_OVERWATCH_SHOTS,
): number {
  const max = getMaxOverwatchShots(unit, defaultMax);
  return unit.overwatchShotsRemaining ?? max;
}

/**
 * Gets the unit's current ammunition.
 *
 * @param unit - Unit to get ammo for
 * @returns Current ammunition count
 */
function getUnitAmmo(unit: BattleUnit & UnitWithOverwatch): number {
  return unit.ammo ?? 0;
}

/**
 * Gets all allied units in vigilance state.
 *
 * @param unit - Unit to find allies for (enemies of the moving unit)
 * @param state - Current battle state
 * @returns Array of vigilant allied units
 */
function getVigilantEnemies(
  movingUnit: BattleUnit,
  state: BattleState,
): (BattleUnit & UnitWithOverwatch)[] {
  return state.units.filter((u) => {
    const unitWithOverwatch = u as BattleUnit & UnitWithOverwatch;
    return (
      u.alive &&
      u.team !== movingUnit.team &&
      unitWithOverwatch.vigilance === 'active'
    );
  }) as (BattleUnit & UnitWithOverwatch)[];
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an overwatch processor instance.
 *
 * The overwatch processor handles:
 * - Entering vigilance state (skipping attack to enter overwatch)
 * - Checking for overwatch triggers along movement paths
 * - Executing overwatch shots with damage and accuracy modifiers
 * - Consuming ammunition on overwatch shots
 * - Resetting vigilance state at turn/round end
 *
 * @param options - Optional configuration for overwatch behavior
 * @returns OverwatchProcessor instance
 *
 * @example
 * const processor = createOverwatchProcessor();
 *
 * // Enter vigilance state
 * const result = processor.enterVigilance(archer, state);
 *
 * // Check for overwatch triggers along a path
 * const check = processor.checkOverwatch(enemy, path, state);
 *
 * // Execute overwatch shot
 * const shot = processor.executeOverwatchShot(archer, enemy, state, seed);
 */
export function createOverwatchProcessor(
  options: OverwatchProcessorOptions = {},
): OverwatchProcessor {
  const damageModifier = options.damageModifier ?? DEFAULT_OVERWATCH_DAMAGE_MODIFIER;
  const maxShots = options.maxShots ?? DEFAULT_MAX_OVERWATCH_SHOTS;
  const accuracyPenalty = options.accuracyPenalty ?? DEFAULT_OVERWATCH_ACCURACY_PENALTY;
  const overwatchTags = options.overwatchTags ?? [OVERWATCH_TAG];
  const immunityTags = options.immunityTags ?? [OVERWATCH_IMMUNE_TAG];

  return {
    /**
     * Checks if a unit can enter vigilance (overwatch) state.
     *
     * Conditions for entering vigilance:
     * 1. Unit must have overwatch capability (ranged tag)
     * 2. Unit must have ammunition remaining
     * 3. Unit must not already be in vigilance
     * 4. Unit must not have already acted this turn
     *
     * @param unit - Unit attempting to enter vigilance
     * @returns True if unit can enter vigilance
     */
    canEnterVigilance(unit: BattleUnit & UnitWithOverwatch): boolean {
      // Check 1: Unit must have overwatch capability
      if (!hasOverwatchCapability(unit, overwatchTags)) {
        return false;
      }

      // Check 2: Unit must have ammunition
      if (getUnitAmmo(unit) <= 0) {
        return false;
      }

      // Check 3: Unit must not already be in vigilance
      if (unit.vigilance === 'active' || unit.vigilance === 'triggered') {
        return false;
      }

      // Check 4: Unit must not have already acted this turn
      if (unit.enteredVigilanceThisTurn) {
        return false;
      }

      return true;
    },

    /**
     * Enters vigilance state for a unit.
     * Unit skips its attack action to enter overwatch mode.
     *
     * @param unit - Unit entering vigilance
     * @param state - Current battle state
     * @returns Result of entering vigilance
     */
    enterVigilance(
      unit: BattleUnit & UnitWithOverwatch,
      state: BattleState,
    ): EnterVigilanceResult {
      // Validate that unit can enter vigilance
      if (!hasOverwatchCapability(unit, overwatchTags)) {
        return {
          success: false,
          reason: 'not_ranged' as VigilanceBlockReason,
          unit,
          state,
        };
      }

      if (getUnitAmmo(unit) <= 0) {
        return {
          success: false,
          reason: 'no_ammo' as VigilanceBlockReason,
          unit,
          state,
        };
      }

      if (unit.vigilance === 'active' || unit.vigilance === 'triggered') {
        return {
          success: false,
          reason: 'already_vigilant' as VigilanceBlockReason,
          unit,
          state,
        };
      }

      // Enter vigilance state
      const overwatchRange = getOverwatchRange(unit);
      const maxOverwatchShots = getMaxOverwatchShots(unit, maxShots);

      const updatedUnit: BattleUnit & UnitWithOverwatch = {
        ...unit,
        vigilance: 'active',
        overwatchShotsRemaining: maxOverwatchShots,
        overwatchRange,
        overwatchTargetsFired: [],
        enteredVigilanceThisTurn: true,
        canOverwatch: true,
      };

      return {
        success: true,
        unit: updatedUnit,
        state: updateUnit(state, updatedUnit),
      };
    },

    /**
     * Checks if a unit can exit vigilance (overwatch) state.
     *
     * Conditions for exiting vigilance:
     * 1. Unit must be in vigilance state (active)
     * 2. Unit must not have already triggered (fired) this round
     * 3. Unit must not be exhausted
     *
     * @param unit - Unit attempting to exit vigilance
     * @returns True if unit can exit vigilance
     */
    canExitVigilance(unit: BattleUnit & UnitWithOverwatch): boolean {
      // Check 1: Unit must be in active vigilance
      if (unit.vigilance !== 'active') {
        return false;
      }

      return true;
    },

    /**
     * Exits vigilance state for a unit.
     * Unit leaves overwatch mode and can act normally.
     *
     * @param unit - Unit exiting vigilance
     * @param state - Current battle state
     * @returns Result of exiting vigilance
     */
    exitVigilance(
      unit: BattleUnit & UnitWithOverwatch,
      state: BattleState,
    ): ExitVigilanceResult {
      // Validate that unit can exit vigilance
      if (unit.vigilance === 'inactive' || unit.vigilance === undefined) {
        return {
          success: false,
          reason: 'not_vigilant' as VigilanceExitBlockReason,
          unit,
          state,
        };
      }

      if (unit.vigilance === 'triggered') {
        return {
          success: false,
          reason: 'already_triggered' as VigilanceExitBlockReason,
          unit,
          state,
        };
      }

      if (unit.vigilance === 'exhausted') {
        return {
          success: false,
          reason: 'exhausted' as VigilanceExitBlockReason,
          unit,
          state,
        };
      }

      // Exit vigilance state
      const updatedUnit: BattleUnit & UnitWithOverwatch = {
        ...unit,
        vigilance: 'inactive',
        overwatchShotsRemaining: 0,
        overwatchTargetsFired: [],
        enteredVigilanceThisTurn: false,
      };

      return {
        success: true,
        unit: updatedUnit,
        state: updateUnit(state, updatedUnit),
      };
    },

    /**
     * Toggles vigilance state for a unit.
     * If unit is not in vigilance, enters vigilance.
     * If unit is in vigilance, exits vigilance.
     *
     * @param unit - Unit to toggle vigilance for
     * @param state - Current battle state
     * @returns Result of toggling vigilance
     */
    toggleVigilance(
      unit: BattleUnit & UnitWithOverwatch,
      state: BattleState,
    ): ToggleVigilanceResult {
      // If unit is in active vigilance, try to exit
      if (unit.vigilance === 'active') {
        const exitResult = this.exitVigilance(unit, state);
        return {
          success: exitResult.success,
          action: exitResult.success ? 'exited' : undefined,
          reason: exitResult.reason,
          unit: exitResult.unit,
          state: exitResult.state,
        };
      }

      // If unit is in triggered or exhausted state, cannot toggle
      if (unit.vigilance === 'triggered') {
        return {
          success: false,
          action: undefined,
          reason: 'already_triggered' as VigilanceExitBlockReason,
          unit,
          state,
        };
      }

      if (unit.vigilance === 'exhausted') {
        return {
          success: false,
          action: undefined,
          reason: 'exhausted' as VigilanceExitBlockReason,
          unit,
          state,
        };
      }

      // Otherwise, try to enter vigilance
      const enterResult = this.enterVigilance(unit, state);
      return {
        success: enterResult.success,
        action: enterResult.success ? 'entered' : undefined,
        reason: enterResult.reason,
        unit: enterResult.unit,
        state: enterResult.state,
      };
    },

    /**
     * Checks if a unit is currently in vigilance state.
     *
     * @param unit - Unit to check
     * @returns True if unit is in active vigilance
     */
    isVigilant(unit: BattleUnit & UnitWithOverwatch): boolean {
      return unit.vigilance === 'active';
    },

    /**
     * Checks if a target is immune to overwatch.
     *
     * @param target - Unit to check for immunity
     * @returns True if target is immune to overwatch
     */
    isImmuneToOverwatch(target: BattleUnit & UnitWithOverwatch): boolean {
      return hasOverwatchImmunity(target, immunityTags);
    },

    /**
     * Checks for overwatch triggers along a movement path.
     * Returns all units that would fire and their opportunities.
     *
     * @param target - Unit that is moving
     * @param path - Movement path (array of positions)
     * @param state - Current battle state
     * @returns Overwatch check result with opportunities
     */
    checkOverwatch(
      target: BattleUnit & UnitWithOverwatch,
      path: Position[],
      state: BattleState,
    ): OverwatchCheckResult {
      const opportunities: OverwatchOpportunity[] = [];
      const triggerPositions: Position[] = [];

      // If target is immune to overwatch, return empty result
      if (this.isImmuneToOverwatch(target)) {
        return {
          hasOverwatch: false,
          opportunities: [],
          totalShots: 0,
          triggerPositions: [],
        };
      }

      // Get all vigilant enemy units
      const vigilantEnemies = getVigilantEnemies(target, state);

      // Check each position along the path for overwatch triggers
      for (let i = 1; i < path.length; i++) {
        const currentPos = path[i];
        if (!currentPos) continue;

        // Check each vigilant enemy for overwatch opportunity at this position
        for (const watcher of vigilantEnemies) {
          // Skip if watcher already fired at this target during this movement
          const targetsFired = watcher.overwatchTargetsFired ?? [];
          if (targetsFired.includes(target.id)) {
            continue;
          }

          // Calculate distance from watcher to current position
          const distance = manhattanDistance(watcher.position, currentPos);
          const overwatchRange = getOverwatchRange(watcher);

          // Determine if overwatch can fire
          let canFire = true;
          let reason: OverwatchBlockReason | undefined;

          // Check range
          if (distance > overwatchRange) {
            canFire = false;
            reason = 'out_of_range';
          }

          // Check ammunition
          if (canFire && getUnitAmmo(watcher) <= 0) {
            canFire = false;
            reason = 'no_ammo';
          }

          // Check remaining shots
          if (canFire && getRemainingOverwatchShots(watcher, maxShots) <= 0) {
            canFire = false;
            reason = 'no_shots';
          }

          // Check vigilance state
          if (canFire && watcher.vigilance !== 'active') {
            canFire = false;
            reason = 'not_vigilant';
          }

          // Only add opportunity if within range (even if blocked for other reasons)
          if (distance <= overwatchRange) {
            const opportunity: OverwatchOpportunity = {
              watcher,
              target,
              triggerPosition: currentPos,
              canFire,
              distance,
              ...(reason !== undefined && { reason }),
            };

            // Check if we already have an opportunity for this watcher
            const existingIndex = opportunities.findIndex(
              (o) => o.watcher.id === watcher.id,
            );

            if (existingIndex === -1) {
              opportunities.push(opportunity);
              if (canFire) {
                triggerPositions.push(currentPos);
              }
            }
          }
        }
      }

      const totalShots = opportunities.filter((o) => o.canFire).length;

      return {
        hasOverwatch: totalShots > 0,
        opportunities,
        totalShots,
        triggerPositions,
      };
    },

    /**
     * Calculates overwatch damage.
     * Overwatch attacks deal reduced damage compared to normal attacks.
     *
     * ═══════════════════════════════════════════════════════════════
     * OVERWATCH DAMAGE FORMULA
     * ═══════════════════════════════════════════════════════════════
     *
     * damage = floor(watcher.atk * damageModifier)
     *
     * Where damageModifier defaults to 0.75 (75% of normal damage)
     *
     * Example calculations (with default 0.75 modifier):
     *   - watcher.atk = 20: damage = floor(20 * 0.75) = 15
     *   - watcher.atk = 15: damage = floor(15 * 0.75) = 11
     *   - watcher.atk = 10: damage = floor(10 * 0.75) = 7
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param watcher - Unit firing overwatch
     * @param target - Unit being fired upon
     * @returns Calculated damage value
     */
    calculateOverwatchDamage(
      watcher: BattleUnit & UnitWithOverwatch,
      _target: BattleUnit & UnitWithOverwatch,
    ): number {
      const watcherAtk = getUnitAtk(watcher);
      return Math.floor(watcherAtk * damageModifier);
    },

    /**
     * Executes an overwatch shot.
     * Consumes ammunition and may deal damage to target.
     *
     * ═══════════════════════════════════════════════════════════════
     * OVERWATCH HIT CALCULATION
     * ═══════════════════════════════════════════════════════════════
     *
     * hitChance = 1.0 - accuracyPenalty - targetDodge
     *
     * Where:
     * - accuracyPenalty defaults to 0.2 (20% penalty)
     * - targetDodge is the target's dodge chance (0-1)
     *
     * A random roll determines if the shot hits:
     * - roll < hitChance: Hit
     * - roll >= hitChance: Miss
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param watcher - Unit firing overwatch
     * @param target - Unit being fired upon
     * @param state - Current battle state
     * @param seed - Random seed for hit/miss roll
     * @returns Overwatch shot result
     */
    executeOverwatchShot(
      watcher: BattleUnit & UnitWithOverwatch,
      target: BattleUnit & UnitWithOverwatch,
      state: BattleState,
      seed: number,
    ): OverwatchShotResult {
      // Consume ammunition
      const currentAmmo = getUnitAmmo(watcher);
      const newAmmo = Math.max(0, currentAmmo - 1);

      // Consume overwatch shot
      const currentShots = getRemainingOverwatchShots(watcher, maxShots);
      const newShots = Math.max(0, currentShots - 1);

      // Track that we fired at this target
      const targetsFired = [...(watcher.overwatchTargetsFired ?? []), target.id];

      // Determine vigilance state after shot
      const newVigilance = newShots <= 0 ? 'exhausted' : 'triggered';

      // Calculate hit chance
      const targetDodge = target.stats?.dodge ?? 0;
      const hitChance = Math.max(0, 1.0 - accuracyPenalty - targetDodge);

      // Roll for hit
      const roll = seededRandom(seed);
      const hit = roll < hitChance;

      // Calculate damage if hit
      let damage = 0;
      let targetNewHp = getUnitHp(target);

      if (hit) {
        damage = this.calculateOverwatchDamage(watcher, target);
        targetNewHp = Math.max(0, targetNewHp - damage);
      }

      // Update watcher
      const updatedWatcher: BattleUnit & UnitWithOverwatch = {
        ...watcher,
        ammo: newAmmo,
        overwatchShotsRemaining: newShots,
        overwatchTargetsFired: targetsFired,
        vigilance: newVigilance as 'triggered' | 'exhausted',
      };

      // Update target
      const targetAlive = targetNewHp > 0;
      const updatedTarget: BattleUnit & UnitWithOverwatch = {
        ...target,
        currentHp: targetNewHp,
        alive: targetAlive,
      };

      // Update state
      const newState = updateUnits(state, [updatedWatcher, updatedTarget]);

      return {
        success: true,
        hit,
        damage,
        targetNewHp,
        ammoConsumed: 1,
        watcherAmmoRemaining: newAmmo,
        watcherShotsRemaining: newShots,
        state: newState,
      };
    },

    /**
     * Resets overwatch state for a unit.
     * Called at turn end to clear vigilance.
     *
     * @param unit - Unit to reset
     * @returns Updated unit with reset overwatch state
     */
    resetOverwatch(
      unit: BattleUnit & UnitWithOverwatch,
    ): BattleUnit & UnitWithOverwatch {
      return {
        ...unit,
        vigilance: 'inactive',
        overwatchShotsRemaining: 0,
        overwatchTargetsFired: [],
        enteredVigilanceThisTurn: false,
      };
    },

    /**
     * Resets overwatch shots for a unit at round start.
     * Restores shot count but maintains vigilance state.
     *
     * @param unit - Unit to reset shots for
     * @returns Updated unit with reset shot count
     */
    resetOverwatchShots(
      unit: BattleUnit & UnitWithOverwatch,
    ): BattleUnit & UnitWithOverwatch {
      // Only reset shots if unit is in vigilance
      if (unit.vigilance !== 'active' && unit.vigilance !== 'triggered') {
        return unit;
      }

      const maxOverwatchShots = getMaxOverwatchShots(unit, maxShots);

      return {
        ...unit,
        overwatchShotsRemaining: maxOverwatchShots,
        overwatchTargetsFired: [],
        // Reset vigilance to active if it was triggered/exhausted
        vigilance: 'active',
      };
    },

    /**
     * Apply overwatch logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_start: Reset overwatch shots for new round
     * - movement: Check for overwatch triggers, execute shots
     * - turn_end: Reset vigilance state
     *
     * @param phase - Current battle phase
     * @param state - Current battle state
     * @param context - Phase context with active unit and action
     * @returns Updated battle state
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // ─────────────────────────────────────────────────────────────
      // TURN_START: Reset overwatch shots for units in vigilance
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_start') {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithOverwatch = unit as BattleUnit & UnitWithOverwatch;

          // Reset enteredVigilanceThisTurn flag at turn start
          if (unitWithOverwatch.enteredVigilanceThisTurn) {
            const updatedUnit: BattleUnit & UnitWithOverwatch = {
              ...unitWithOverwatch,
              enteredVigilanceThisTurn: false,
            };
            return updateUnit(state, updatedUnit);
          }
        }
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // MOVEMENT: Check for overwatch triggers and execute shots
      // ─────────────────────────────────────────────────────────────
      if (phase === 'movement' && context.action?.type === 'move' && context.action.path) {
        const path = context.action.path;
        const movingUnit = context.activeUnit as BattleUnit & UnitWithOverwatch;

        // Check for overwatch opportunities along the path
        const overwatchCheck = this.checkOverwatch(movingUnit, path, state);

        // If no overwatch triggers, return unchanged state
        if (!overwatchCheck.hasOverwatch) {
          return state;
        }

        let currentState = state;
        let currentSeed = context.seed;

        // Process overwatch shots in order
        for (const opportunity of overwatchCheck.opportunities) {
          if (!opportunity.canFire) continue;

          // Get fresh references from current state
          const watcher = findUnit(currentState, opportunity.watcher.id);
          const target = findUnit(currentState, opportunity.target.id);

          if (!watcher || !target || !watcher.alive || !target.alive) {
            continue;
          }

          const watcherWithOverwatch = watcher as BattleUnit & UnitWithOverwatch;
          const targetWithOverwatch = target as BattleUnit & UnitWithOverwatch;

          // Execute overwatch shot
          const result = this.executeOverwatchShot(
            watcherWithOverwatch,
            targetWithOverwatch,
            currentState,
            currentSeed++,
          );

          currentState = result.state;

          // If target died, stop processing further overwatch
          if (result.targetNewHp <= 0) {
            break;
          }
        }

        return currentState;
      }

      // ─────────────────────────────────────────────────────────────
      // TURN_END: Reset vigilance state
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_end') {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithOverwatch = unit as BattleUnit & UnitWithOverwatch;

          // Only reset if unit was in vigilance
          if (
            unitWithOverwatch.vigilance === 'active' ||
            unitWithOverwatch.vigilance === 'triggered' ||
            unitWithOverwatch.vigilance === 'exhausted'
          ) {
            const resetUnit = this.resetOverwatch(unitWithOverwatch);
            return updateUnit(state, resetUnit);
          }
        }
        return state;
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createOverwatchProcessor;
