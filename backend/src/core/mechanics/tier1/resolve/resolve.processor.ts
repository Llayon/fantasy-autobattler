/**
 * Tier 1: Resolve (Morale) Processor
 *
 * Implements the resolve/morale system which tracks unit morale
 * and determines behavior when morale breaks.
 *
 * Resolve mechanics:
 * - Regenerates at turn start (baseRegeneration per turn)
 * - Damaged by flanking/rear attacks, charges, ally deaths
 * - When resolve reaches 0:
 *   - Human units route (flee the battlefield)
 *   - Undead units crumble (destroyed)
 *
 * @module core/mechanics/tier1/resolve
 */

import type { ResolveConfig } from '../../config/mechanics.types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import { updateUnit } from '../../helpers';
import type {
  ResolveProcessor,
  MechanicsResolveState,
  UnitWithResolve,
  ResolveFaction,
} from './resolve.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Gets the effective resolve value for a unit.
 * Returns maxResolve from config if unit has no resolve set.
 *
 * @param unit - Unit to get resolve for
 * @param config - Resolve configuration
 * @returns Current resolve value
 */
function getEffectiveResolve(
  unit: BattleUnit & UnitWithResolve,
  config: ResolveConfig,
): number {
  return unit.resolve ?? unit.maxResolve ?? config.maxResolve;
}

/**
 * Gets the maximum resolve value for a unit.
 * Uses unit's maxResolve if set, otherwise config.maxResolve.
 *
 * @param unit - Unit to get max resolve for
 * @param config - Resolve configuration
 * @returns Maximum resolve value
 */
function getMaxResolve(
  unit: BattleUnit & UnitWithResolve,
  config: ResolveConfig,
): number {
  return unit.maxResolve ?? config.maxResolve;
}

/**
 * Gets the faction for a unit.
 * Defaults to 'human' if not specified.
 *
 * @param unit - Unit to get faction for
 * @returns Unit's faction
 */
function getFaction(unit: BattleUnit & UnitWithResolve): ResolveFaction {
  return unit.faction ?? 'human';
}


// ═══════════════════════════════════════════════════════════════
// RESOLVE BREAK HANDLER
// ═══════════════════════════════════════════════════════════════

/**
 * Handles a unit's resolve breaking (reaching 0).
 * Updates unit state based on faction and config.
 *
 * @param state - Current battle state
 * @param unit - Unit whose resolve broke
 * @param resolveState - The resulting state (routing/crumbled)
 * @returns Updated battle state
 */
function handleResolveBreak(
  state: BattleState,
  unit: BattleUnit & UnitWithResolve,
  resolveState: MechanicsResolveState,
): BattleState {
  if (resolveState === 'crumbled') {
    // Undead units are destroyed when they crumble
    const updatedUnit: BattleUnit & UnitWithResolve = {
      ...unit,
      hasCrumbled: true,
      alive: false,
      currentHp: 0,
    };
    return updateUnit(state, updatedUnit);
  }

  if (resolveState === 'routing') {
    // Human units flee but are not immediately destroyed
    const updatedUnit: BattleUnit & UnitWithResolve = {
      ...unit,
      isRouting: true,
    };
    return updateUnit(state, updatedUnit);
  }

  return state;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a resolve processor instance.
 *
 * The resolve processor handles:
 * - Regenerating resolve at turn start
 * - Applying resolve damage from combat
 * - Checking for routing/crumbling when resolve reaches 0
 * - Faction-specific behavior (human retreat vs undead crumble)
 *
 * @param config - Resolve configuration
 * @returns ResolveProcessor instance
 *
 * @example
 * const processor = createResolveProcessor({
 *   maxResolve: 100,
 *   baseRegeneration: 5,
 *   humanRetreat: true,
 *   undeadCrumble: true,
 *   flankingResolveDamage: 12,
 *   rearResolveDamage: 20,
 * });
 *
 * // Regenerate at turn start
 * const regenUnit = processor.regenerate(unit, config);
 *
 * // Apply damage from flanking attack
 * const damagedUnit = processor.applyDamage(unit, 12);
 *
 * // Check if unit should rout/crumble
 * const state = processor.checkState(unit, config);
 */
export function createResolveProcessor(config: ResolveConfig): ResolveProcessor {
  return {
    /**
     * Regenerates resolve at turn start.
     * Adds baseRegeneration to current resolve, capped at maxResolve.
     * Does not regenerate for routing or crumbled units.
     *
     * @param unit - Unit to regenerate resolve for
     * @param resolveConfig - Resolve configuration with regeneration values
     * @returns New unit object with updated resolve value
     * @example
     * const unit = { resolve: 80, maxResolve: 100 };
     * const config = { baseRegeneration: 5, maxResolve: 100 };
     * const result = processor.regenerate(unit, config);
     * // result.resolve === 85
     */
    regenerate(
      unit: BattleUnit & UnitWithResolve,
      resolveConfig: ResolveConfig,
    ): BattleUnit & UnitWithResolve {
      // Don't regenerate for routing or crumbled units
      if (unit.isRouting || unit.hasCrumbled) {
        return unit;
      }

      const currentResolve = getEffectiveResolve(unit, resolveConfig);
      const maxResolve = getMaxResolve(unit, resolveConfig);

      // Formula: newResolve = min(maxResolve, currentResolve + baseRegeneration)
      // Regeneration is capped at maxResolve to prevent over-healing morale
      const newResolve = Math.min(
        maxResolve,
        currentResolve + resolveConfig.baseRegeneration,
      );

      return {
        ...unit,
        resolve: newResolve,
        maxResolve,
      };
    },

    /**
     * Applies resolve damage from combat.
     * Reduces resolve by the specified amount, minimum 0.
     *
     * @param unit - Unit to apply resolve damage to
     * @param damage - Amount of resolve damage to apply
     * @returns New unit object with reduced resolve value
     * @example
     * const unit = { resolve: 50 };
     * const result = processor.applyDamage(unit, 12);
     * // result.resolve === 38
     */
    applyDamage(
      unit: BattleUnit & UnitWithResolve,
      damage: number,
    ): BattleUnit & UnitWithResolve {
      const currentResolve = getEffectiveResolve(unit, config);

      // Formula: newResolve = max(0, currentResolve - damage)
      // Resolve cannot go below 0 (triggers routing/crumbling check)
      const newResolve = Math.max(0, currentResolve - damage);

      return {
        ...unit,
        resolve: newResolve,
      };
    },

    /**
     * Checks if unit should rout/crumble based on resolve.
     * Returns 'active' if resolve > 0, otherwise checks faction
     * and config to determine routing or crumbling.
     *
     * @param unit - Unit to check resolve state for
     * @param resolveConfig - Resolve configuration with faction behavior settings
     * @returns Current resolve state ('active', 'routing', or 'crumbled')
     * @example
     * const state = processor.checkState(unit, config);
     * if (state === 'routing') {
     *   // Handle human unit fleeing
     * } else if (state === 'crumbled') {
     *   // Handle undead unit destruction
     * }
     */
    checkState(
      unit: BattleUnit & UnitWithResolve,
      resolveConfig: ResolveConfig,
    ): MechanicsResolveState {
      // Already routing or crumbled
      if (unit.isRouting) return 'routing';
      if (unit.hasCrumbled) return 'crumbled';

      const resolve = getEffectiveResolve(unit, resolveConfig);

      // Still has resolve - active
      if (resolve > 0) return 'active';

      // Resolve is 0 - check faction-specific behavior
      const faction = getFaction(unit);

      if (faction === 'undead' && resolveConfig.undeadCrumble) {
        return 'crumbled';
      }

      if (faction !== 'undead' && resolveConfig.humanRetreat) {
        return 'routing';
      }

      // Config doesn't enable routing/crumbling for this faction
      return 'active';
    },

    /**
     * Apply resolve logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_start: Regenerate resolve for active unit
     * - post_attack: Check for rout/crumble after damage
     *
     * @param phase - Current battle phase
     * @param state - Current battle state with all units
     * @param context - Phase context containing activeUnit, target, and seed
     * @returns Updated battle state with resolve changes applied
     * @example
     * const newState = processor.apply('turn_start', state, {
     *   activeUnit: unit,
     *   seed: 12345,
     * });
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // Turn start: regenerate resolve for active unit
      if (phase === 'turn_start') {
        const activeUnit = context.activeUnit as BattleUnit & UnitWithResolve;

        // Skip if unit is not alive
        if (!activeUnit.alive) {
          return state;
        }

        const updated = createResolveProcessor(config).regenerate(
          activeUnit,
          config,
        );
        return updateUnit(state, updated);
      }

      // Post attack: check for rout/crumble after damage
      if (phase === 'post_attack' && context.target) {
        const target = context.target as BattleUnit & UnitWithResolve;

        // Skip if target is not alive
        if (!target.alive) {
          return state;
        }

        const targetState = createResolveProcessor(config).checkState(
          target,
          config,
        );

        if (targetState !== 'active') {
          return handleResolveBreak(state, target, targetState);
        }
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createResolveProcessor;
