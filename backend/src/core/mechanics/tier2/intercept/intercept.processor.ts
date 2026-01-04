/**
 * Tier 2: Intercept Processor
 *
 * Implements the intercept system which allows units to block or engage
 * passing enemies during movement. Intercept extends the engagement
 * mechanic with movement blocking capabilities.
 *
 * Intercept requires the engagement mechanic (Tier 1) to be enabled.
 *
 * Key mechanics:
 * - Hard Intercept: Spearmen completely stop cavalry charges
 * - Soft Intercept: Infantry engages passing units (triggers ZoC)
 * - Disengage Cost: Movement penalty to leave engagement
 *
 * @module core/mechanics/tier2/intercept
 */

import type { BattleState, BattleUnit, Position } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { InterceptConfig } from '../../config/mechanics.types';
import { updateUnit, updateUnits, findUnit } from '../../helpers';
import { manhattanDistance } from '../../../grid/grid';
import type {
  InterceptProcessor,
  InterceptCheckResult,
  InterceptOpportunity,
  InterceptExecutionResult,
  DisengageResult,
  UnitWithIntercept,
  InterceptType,
  InterceptBlockReason,
} from './intercept.types';
import {
  HARD_INTERCEPT_DAMAGE_MULTIPLIER,
  DEFAULT_DISENGAGE_COST,
  HARD_INTERCEPT_TAG,
  CAVALRY_TAG,
} from './intercept.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit has the spear wall tag (can hard intercept).
 *
 * @param unit - Unit to check
 * @returns True if unit can perform hard intercept
 */
function hasSpearWallTag(unit: BattleUnit & UnitWithIntercept): boolean {
  if (unit.canHardIntercept !== undefined) {
    return unit.canHardIntercept;
  }
  return unit.tags?.includes(HARD_INTERCEPT_TAG) ?? false;
}

/**
 * Checks if a unit is cavalry (can be hard intercepted).
 *
 * @param unit - Unit to check
 * @returns True if unit is cavalry
 */
function isCavalry(unit: BattleUnit & UnitWithIntercept): boolean {
  if (unit.isCavalry !== undefined) {
    return unit.isCavalry;
  }
  return unit.tags?.includes(CAVALRY_TAG) ?? false;
}

/**
 * Checks if a unit can perform soft intercept (melee infantry).
 *
 * @param unit - Unit to check
 * @returns True if unit can perform soft intercept
 */
function canPerformSoftIntercept(unit: BattleUnit & UnitWithIntercept): boolean {
  if (unit.canSoftIntercept !== undefined) {
    return unit.canSoftIntercept;
  }
  // Default: melee units (range <= 1) can soft intercept
  return unit.range <= 1;
}

/**
 * Gets all enemy units for a given unit.
 *
 * @param unit - Unit to find enemies for
 * @param state - Current battle state
 * @returns Array of enemy units
 */
function getEnemyUnits(
  unit: BattleUnit,
  state: BattleState,
): (BattleUnit & UnitWithIntercept)[] {
  return state.units.filter(
    (u) => u.alive && u.team !== unit.team,
  ) as (BattleUnit & UnitWithIntercept)[];
}

/**
 * Checks if two positions are adjacent (Manhattan distance = 1).
 *
 * @param a - First position
 * @param b - Second position
 * @returns True if positions are adjacent
 */
function areAdjacent(a: Position, b: Position): boolean {
  return manhattanDistance(a, b) === 1;
}

/**
 * Gets the maximum intercepts per round for a unit.
 *
 * @param unit - Unit to get max intercepts for
 * @returns Maximum intercepts per round (default: 1)
 */
function getMaxIntercepts(unit: BattleUnit & UnitWithIntercept): number {
  return unit.maxIntercepts ?? 1;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an intercept processor instance.
 *
 * The intercept processor handles:
 * - Hard Intercept: Spearmen stop cavalry charges
 * - Soft Intercept: Infantry engages passing units
 * - Disengage cost calculation
 * - Intercept charge tracking per round
 *
 * @param config - Intercept configuration
 * @returns InterceptProcessor instance
 *
 * @example
 * const processor = createInterceptProcessor({
 *   hardIntercept: true,
 *   softIntercept: true,
 *   disengageCost: 2,
 * });
 *
 * // Check for intercept opportunities along a path
 * const check = processor.checkIntercept(cavalry, path, state, config);
 *
 * // Execute hard intercept
 * const result = processor.executeHardIntercept(spearman, cavalry, state, seed);
 */
export function createInterceptProcessor(
  config: InterceptConfig,
): InterceptProcessor {
  return {
    /**
     * Checks if a unit can perform hard intercept (stop cavalry).
     * Hard intercept requires 'spear_wall' tag and target must be cavalry.
     *
     * @param interceptor - Unit attempting to intercept
     * @param target - Unit being intercepted
     * @param interceptConfig - Intercept configuration
     * @returns True if hard intercept is possible
     */
    canHardIntercept(
      interceptor: BattleUnit & UnitWithIntercept,
      target: BattleUnit & UnitWithIntercept,
      interceptConfig: InterceptConfig,
    ): boolean {
      // Hard intercept must be enabled in config
      if (!interceptConfig.hardIntercept) {
        return false;
      }

      // Interceptor must be alive
      if (!interceptor.alive || interceptor.currentHp <= 0) {
        return false;
      }

      // Interceptor must have spear wall capability
      if (!hasSpearWallTag(interceptor)) {
        return false;
      }

      // Target must be cavalry
      if (!isCavalry(target)) {
        return false;
      }

      // Interceptor must have intercepts remaining
      const maxIntercepts = getMaxIntercepts(interceptor);
      const remaining = interceptor.interceptsRemaining ?? maxIntercepts;
      if (remaining <= 0) {
        return false;
      }

      return true;
    },

    /**
     * Checks if a unit can perform soft intercept (engage passing unit).
     * Soft intercept requires melee capability and intercepts remaining.
     *
     * @param interceptor - Unit attempting to intercept
     * @param target - Unit being intercepted
     * @param interceptConfig - Intercept configuration
     * @returns True if soft intercept is possible
     */
    canSoftIntercept(
      interceptor: BattleUnit & UnitWithIntercept,
      target: BattleUnit & UnitWithIntercept,
      interceptConfig: InterceptConfig,
    ): boolean {
      // Soft intercept must be enabled in config
      if (!interceptConfig.softIntercept) {
        return false;
      }

      // Interceptor must be alive
      if (!interceptor.alive || interceptor.currentHp <= 0) {
        return false;
      }

      // Cannot intercept allies
      if (interceptor.team === target.team) {
        return false;
      }

      // Interceptor must be able to soft intercept (melee unit)
      if (!canPerformSoftIntercept(interceptor)) {
        return false;
      }

      // Interceptor must have intercepts remaining
      const maxIntercepts = getMaxIntercepts(interceptor);
      const remaining = interceptor.interceptsRemaining ?? maxIntercepts;
      if (remaining <= 0) {
        return false;
      }

      return true;
    },

    /**
     * Checks for intercept opportunities along a movement path.
     * Returns all potential intercepts and whether movement is blocked.
     *
     * @param unit - Unit that is moving
     * @param path - Movement path (array of positions)
     * @param state - Current battle state
     * @param interceptConfig - Intercept configuration
     * @returns Intercept check result with opportunities
     */
    checkIntercept(
      unit: BattleUnit & UnitWithIntercept,
      path: Position[],
      state: BattleState,
      interceptConfig: InterceptConfig,
    ): InterceptCheckResult {
      const opportunities: InterceptOpportunity[] = [];
      let movementBlocked = false;
      let blockedAt: Position | undefined;
      let firstIntercept: InterceptOpportunity | undefined;

      // Get all enemy units
      const enemies = getEnemyUnits(unit, state);

      // Check each position along the path for intercept opportunities
      for (let i = 1; i < path.length; i++) {
        const currentPos = path[i];
        if (!currentPos) continue;

        // Check each enemy for intercept opportunity at this position
        for (const enemy of enemies) {
          // Skip if not adjacent to this path position
          if (!areAdjacent(currentPos, enemy.position)) {
            continue;
          }

          // Determine intercept type
          let interceptType: InterceptType | null = null;
          let canIntercept = false;
          let reason: InterceptBlockReason | undefined;

          // Check for hard intercept first (takes priority)
          if (this.canHardIntercept(enemy, unit, interceptConfig)) {
            interceptType = 'hard';
            canIntercept = true;
          } else if (this.canSoftIntercept(enemy, unit, interceptConfig)) {
            interceptType = 'soft';
            canIntercept = true;
          } else {
            // Determine why intercept is blocked
            if (enemy.team === unit.team) {
              reason = 'same_team';
            } else if ((enemy.interceptsRemaining ?? getMaxIntercepts(enemy)) <= 0) {
              reason = 'no_intercepts';
            } else if (!canPerformSoftIntercept(enemy) && !hasSpearWallTag(enemy)) {
              reason = 'disabled';
            } else {
              reason = 'wrong_type';
            }
          }

          if (interceptType) {
            const opportunity: InterceptOpportunity = {
              interceptor: enemy,
              target: unit,
              type: interceptType,
              position: currentPos,
              canIntercept,
              ...(reason !== undefined && { reason }),
            };

            opportunities.push(opportunity);

            // Track first intercept
            if (!firstIntercept && canIntercept) {
              firstIntercept = opportunity;
            }

            // Hard intercept blocks movement
            if (interceptType === 'hard' && canIntercept) {
              movementBlocked = true;
              blockedAt = currentPos;
              // Stop checking further path positions for this hard intercept
              break;
            }
          }
        }

        // If movement is blocked, stop checking further
        if (movementBlocked) {
          break;
        }
      }

      const result: InterceptCheckResult = {
        hasIntercept: opportunities.length > 0,
        opportunities,
        movementBlocked,
      };

      if (firstIntercept !== undefined) {
        result.firstIntercept = firstIntercept;
      }

      if (blockedAt !== undefined) {
        result.blockedAt = blockedAt;
      }

      return result;
    },

    /**
     * Executes a hard intercept (spearmen stop cavalry).
     * Deals counter-damage and stops movement.
     *
     * @param interceptor - Unit performing the intercept
     * @param target - Unit being intercepted
     * @param state - Current battle state
     * @param seed - Random seed for determinism
     * @returns Intercept execution result
     */
    executeHardIntercept(
      interceptor: BattleUnit & UnitWithIntercept,
      target: BattleUnit & UnitWithIntercept,
      state: BattleState,
      _seed: number,
    ): InterceptExecutionResult {
      // Calculate hard intercept damage
      // Formula: damage = floor(ATK * HARD_INTERCEPT_DAMAGE_MULTIPLIER)
      const interceptorAtk = interceptor.stats?.atk ?? 0;
      const damage = Math.floor(interceptorAtk * HARD_INTERCEPT_DAMAGE_MULTIPLIER);

      // Apply damage to target
      const newTargetHp = Math.max(0, target.currentHp - damage);
      const targetAlive = newTargetHp > 0;

      // Consume one intercept charge from interceptor
      const maxIntercepts = getMaxIntercepts(interceptor);
      const currentIntercepts = interceptor.interceptsRemaining ?? maxIntercepts;
      const newIntercepts = Math.max(0, currentIntercepts - 1);

      // Create updated units
      const updatedTarget: BattleUnit & UnitWithIntercept = {
        ...target,
        currentHp: newTargetHp,
        alive: targetAlive,
        // Reset momentum if target was charging
        momentum: 0,
        isCharging: false,
      };

      const updatedInterceptor: BattleUnit & UnitWithIntercept = {
        ...interceptor,
        interceptsRemaining: newIntercepts,
        isIntercepting: true,
      };

      // Update state with both units
      const newState = updateUnits(state, [updatedTarget, updatedInterceptor]);

      return {
        success: true,
        type: 'hard',
        damage,
        targetNewHp: newTargetHp,
        movementStopped: true,
        stoppedAt: interceptor.position, // Target stops adjacent to interceptor
        interceptorInterceptsRemaining: newIntercepts,
        state: newState,
      };
    },

    /**
     * Executes a soft intercept (infantry engages passing unit).
     * Engages the target but allows movement to continue.
     *
     * @param interceptor - Unit performing the intercept
     * @param target - Unit being intercepted
     * @param state - Current battle state
     * @returns Intercept execution result
     */
    executeSoftIntercept(
      interceptor: BattleUnit & UnitWithIntercept,
      target: BattleUnit & UnitWithIntercept,
      state: BattleState,
    ): InterceptExecutionResult {
      // Consume one intercept charge from interceptor
      const maxIntercepts = getMaxIntercepts(interceptor);
      const currentIntercepts = interceptor.interceptsRemaining ?? maxIntercepts;
      const newIntercepts = Math.max(0, currentIntercepts - 1);

      // Mark target as engaged
      const updatedTarget: BattleUnit & UnitWithIntercept = {
        ...target,
        engaged: true,
      };

      const updatedInterceptor: BattleUnit & UnitWithIntercept = {
        ...interceptor,
        interceptsRemaining: newIntercepts,
        isIntercepting: true,
      };

      // Update state with both units
      const newState = updateUnits(state, [updatedTarget, updatedInterceptor]);

      return {
        success: true,
        type: 'soft',
        damage: 0, // Soft intercept doesn't deal damage
        targetNewHp: target.currentHp,
        movementStopped: false, // Soft intercept doesn't stop movement
        interceptorInterceptsRemaining: newIntercepts,
        state: newState,
      };
    },

    /**
     * Calculates the movement cost to disengage from engagement.
     *
     * @param unit - Unit attempting to disengage
     * @param state - Current battle state
     * @param interceptConfig - Intercept configuration
     * @returns Movement cost to disengage
     */
    getDisengageCost(
      unit: BattleUnit & UnitWithIntercept,
      _state: BattleState,
      interceptConfig: InterceptConfig,
    ): number {
      // If unit is not engaged, no cost
      if (!unit.engaged) {
        return 0;
      }

      // Return configured disengage cost
      return interceptConfig.disengageCost ?? DEFAULT_DISENGAGE_COST;
    },

    /**
     * Attempts to disengage a unit from engagement.
     * Spends movement points and may trigger Attack of Opportunity.
     *
     * @param unit - Unit attempting to disengage
     * @param state - Current battle state
     * @param interceptConfig - Intercept configuration
     * @param seed - Random seed for AoO roll
     * @returns Disengage result
     */
    attemptDisengage(
      unit: BattleUnit & UnitWithIntercept,
      state: BattleState,
      interceptConfig: InterceptConfig,
      _seed: number,
    ): DisengageResult {
      // If unit is not engaged, disengage succeeds trivially
      if (!unit.engaged) {
        return {
          success: true,
          movementCost: 0,
          remainingMovement: unit.stats?.speed ?? 0,
          triggeredAoO: false,
          state,
        };
      }

      // Calculate disengage cost
      const cost = this.getDisengageCost(unit, state, interceptConfig);
      const unitSpeed = unit.stats?.speed ?? 0;

      // Check if unit has enough movement
      if (unitSpeed < cost) {
        return {
          success: false,
          movementCost: 0,
          remainingMovement: unitSpeed,
          triggeredAoO: false,
          reason: 'insufficient_movement',
          state,
        };
      }

      // Disengage succeeds - mark unit as no longer engaged
      const updatedUnit: BattleUnit & UnitWithIntercept = {
        ...unit,
        engaged: false,
      };

      const newState = updateUnit(state, updatedUnit);

      return {
        success: true,
        movementCost: cost,
        remainingMovement: unitSpeed - cost,
        triggeredAoO: true, // Disengaging triggers AoO (handled by engagement processor)
        state: newState,
      };
    },

    /**
     * Resets intercept charges for a unit at round start.
     *
     * @param unit - Unit to reset charges for
     * @param round - Current round number
     * @returns Updated unit with reset charges
     */
    resetInterceptCharges(
      unit: BattleUnit & UnitWithIntercept,
      round: number,
    ): BattleUnit & UnitWithIntercept {
      const maxIntercepts = getMaxIntercepts(unit);

      return {
        ...unit,
        interceptsRemaining: maxIntercepts,
        maxIntercepts,
        isIntercepting: false,
        lastInterceptResetRound: round,
      };
    },

    /**
     * Apply intercept logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_start: Reset intercept charges (round start)
     * - movement: Check for intercept opportunities, execute intercepts
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
      // Handle intercept charge reset at turn start (once per round)
      if (phase === 'turn_start') {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithIntercept = unit as BattleUnit & UnitWithIntercept;
          const currentRound = state.round ?? 1;
          const lastResetRound = unitWithIntercept.lastInterceptResetRound ?? 0;

          // Only reset charges if we're in a new round
          if (currentRound > lastResetRound) {
            const updatedUnit = this.resetInterceptCharges(unitWithIntercept, currentRound);
            return updateUnit(state, updatedUnit);
          }
        }
        return state;
      }

      // Handle intercept during movement phase
      if (phase === 'movement' && context.action?.type === 'move' && context.action.path) {
        const path = context.action.path;
        const unit = context.activeUnit as BattleUnit & UnitWithIntercept;

        // Check for intercept opportunities along the path
        const interceptCheck = this.checkIntercept(unit, path, state, config);

        // If no intercepts, return unchanged state
        if (!interceptCheck.hasIntercept || !interceptCheck.firstIntercept) {
          return state;
        }

        let currentState = state;

        // Process intercepts in order
        for (const opportunity of interceptCheck.opportunities) {
          if (!opportunity.canIntercept) continue;

          // Get fresh references from current state
          const interceptor = findUnit(currentState, opportunity.interceptor.id);
          const target = findUnit(currentState, opportunity.target.id);

          if (!interceptor || !target || !interceptor.alive || !target.alive) {
            continue;
          }

          const interceptorWithIntercept = interceptor as BattleUnit & UnitWithIntercept;
          const targetWithIntercept = target as BattleUnit & UnitWithIntercept;

          // Execute the appropriate intercept type
          if (opportunity.type === 'hard') {
            const result = this.executeHardIntercept(
              interceptorWithIntercept,
              targetWithIntercept,
              currentState,
              context.seed,
            );
            currentState = result.state;

            // If movement was stopped, we're done
            if (result.movementStopped) {
              break;
            }
          } else if (opportunity.type === 'soft') {
            const result = this.executeSoftIntercept(
              interceptorWithIntercept,
              targetWithIntercept,
              currentState,
            );
            currentState = result.state;
          }
        }

        return currentState;
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createInterceptProcessor;
