/**
 * Tier 3: Charge Processor
 *
 * Implements the charge (cavalry momentum) system which provides damage bonuses
 * based on distance moved before attacking. Charge is primarily used by cavalry
 * units and can be countered by spearmen with Spear Wall.
 *
 * Charge requires the intercept mechanic (Tier 2) to be enabled,
 * which in turn requires engagement (Tier 1).
 *
 * Key mechanics:
 * - Momentum builds based on distance moved (cells traveled)
 * - Momentum provides damage bonus on attack
 * - Charge impact deals additional resolve damage (shock)
 * - Spear Wall units can counter and stop charges
 * - Minimum distance required to qualify for charge bonus
 *
 * @module core/mechanics/tier3/charge
 */

import type { BattleState, BattleUnit, Position } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { ChargeConfig } from '../../config/mechanics.types';
import { updateUnit, updateUnits, findUnit } from '../../helpers';
import type {
  ChargeProcessor,
  UnitWithCharge,
  ChargeEligibility,
  SpearWallCounterResult,
  ChargeExecutionResult,
} from './charge.types';
import {
  SPEAR_WALL_TAG,
  CAVALRY_TAG,
  CHARGE_TAG,
  SPEAR_WALL_COUNTER_MULTIPLIER,
} from './charge.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit has the charge capability.
 * A unit can charge if it has 'cavalry' or 'charge' tag, or canCharge is true.
 *
 * @param unit - Unit to check
 * @returns True if unit can perform charges
 */
function hasChargeCapability(unit: BattleUnit & UnitWithCharge): boolean {
  if (unit.canCharge !== undefined) {
    return unit.canCharge;
  }
  const tags = unit.tags ?? [];
  return tags.includes(CAVALRY_TAG) || tags.includes(CHARGE_TAG);
}

/**
 * Checks if a unit has Spear Wall capability (can counter charges).
 *
 * @param unit - Unit to check
 * @returns True if unit can counter charges
 */
function hasSpearWall(unit: BattleUnit & UnitWithCharge): boolean {
  if (unit.hasSpearWall !== undefined) {
    return unit.hasSpearWall;
  }
  return unit.tags?.includes(SPEAR_WALL_TAG) ?? false;
}

/**
 * Gets the attack value for a unit.
 *
 * @param unit - Unit to get attack for
 * @returns Attack value
 */
function getUnitAtk(unit: BattleUnit & UnitWithCharge): number {
  return unit.atk ?? unit.stats?.atk ?? 0;
}

/**
 * Gets the current HP for a unit.
 *
 * @param unit - Unit to get HP for
 * @returns Current HP
 */
function getUnitHp(unit: BattleUnit & UnitWithCharge): number {
  return unit.currentHp ?? 0;
}

/**
 * Gets the current resolve for a unit.
 *
 * @param unit - Unit to get resolve for
 * @param defaultResolve - Default resolve value if not set
 * @returns Current resolve
 */
function getUnitResolve(unit: BattleUnit & UnitWithCharge, defaultResolve = 100): number {
  return unit.resolve ?? defaultResolve;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a charge processor instance.
 *
 * The charge processor handles:
 * - Calculating momentum based on distance moved
 * - Applying charge damage bonus to attacks
 * - Checking for Spear Wall counters
 * - Tracking movement distance for momentum calculation
 * - Resetting charge state at turn end
 *
 * @param config - Charge configuration with momentum and shock settings
 * @returns ChargeProcessor instance
 *
 * @example
 * const processor = createChargeProcessor({
 *   momentumPerCell: 0.2,
 *   maxMomentum: 1.0,
 *   shockResolveDamage: 10,
 *   minChargeDistance: 3,
 * });
 *
 * // Calculate momentum from distance
 * const momentum = processor.calculateMomentum(5, config);
 *
 * // Apply charge bonus to damage
 * const totalDamage = processor.applyChargeBonus(20, 0.6);
 *
 * // Check for Spear Wall counter
 * if (processor.isCounteredBySpearWall(target)) {
 *   // Handle counter
 * }
 */
export function createChargeProcessor(config: ChargeConfig): ChargeProcessor {
  return {
    /**
     * Calculates momentum based on distance moved.
     * Momentum is capped at config.maxMomentum.
     *
     * ═══════════════════════════════════════════════════════════════
     * MOMENTUM FORMULA
     * ═══════════════════════════════════════════════════════════════
     *
     * Step 1: Check minimum distance requirement
     *   - If distance < minChargeDistance: momentum = 0
     *
     * Step 2: Calculate raw momentum
     *   - rawMomentum = distance * momentumPerCell
     *
     * Step 3: Cap at maximum
     *   - momentum = min(maxMomentum, rawMomentum)
     *
     * Example calculations (with defaults: 0.2 per cell, max 1.0, min 3 cells):
     *   - distance = 2: momentum = 0 (below minimum)
     *   - distance = 3: momentum = 3 * 0.2 = 0.6
     *   - distance = 4: momentum = 4 * 0.2 = 0.8
     *   - distance = 5: momentum = min(1.0, 5 * 0.2) = 1.0 (capped)
     *   - distance = 10: momentum = min(1.0, 10 * 0.2) = 1.0 (capped)
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param distance - Number of cells moved
     * @param chargeConfig - Charge configuration
     * @returns Calculated momentum value (0.0 to maxMomentum)
     */
    calculateMomentum(distance: number, chargeConfig: ChargeConfig): number {
      // ─────────────────────────────────────────────────────────────
      // Step 1: Check minimum distance requirement
      // Unit must move at least minChargeDistance cells to gain momentum
      // ─────────────────────────────────────────────────────────────
      if (distance < chargeConfig.minChargeDistance) {
        return 0;
      }

      // ─────────────────────────────────────────────────────────────
      // Step 2: Calculate raw momentum
      // Formula: rawMomentum = distance * momentumPerCell
      // ─────────────────────────────────────────────────────────────
      const rawMomentum = distance * chargeConfig.momentumPerCell;

      // ─────────────────────────────────────────────────────────────
      // Step 3: Cap at maximum momentum
      // Formula: momentum = min(maxMomentum, rawMomentum)
      // ─────────────────────────────────────────────────────────────
      return Math.min(chargeConfig.maxMomentum, rawMomentum);
    },

    /**
     * Applies charge damage bonus based on momentum.
     *
     * ═══════════════════════════════════════════════════════════════
     * CHARGE DAMAGE FORMULA
     * ═══════════════════════════════════════════════════════════════
     *
     * totalDamage = floor(baseDamage * (1 + momentum))
     *
     * Example calculations:
     *   - baseDamage = 20, momentum = 0.0: total = floor(20 * 1.0) = 20
     *   - baseDamage = 20, momentum = 0.6: total = floor(20 * 1.6) = 32
     *   - baseDamage = 20, momentum = 1.0: total = floor(20 * 2.0) = 40
     *   - baseDamage = 15, momentum = 0.8: total = floor(15 * 1.8) = 27
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param baseDamage - Original damage before bonus
     * @param momentum - Momentum value (0.0 to maxMomentum)
     * @returns Total damage after charge bonus
     */
    applyChargeBonus(baseDamage: number, momentum: number): number {
      // Formula: totalDamage = floor(baseDamage * (1 + momentum))
      // The floor() ensures we always deal whole number damage
      return Math.floor(baseDamage * (1 + momentum));
    },

    /**
     * Checks if target has Spear Wall ability to counter charges.
     *
     * @param target - Unit being charged
     * @returns True if target can counter the charge
     */
    isCounteredBySpearWall(target: BattleUnit & UnitWithCharge): boolean {
      return hasSpearWall(target);
    },

    /**
     * Calculates Spear Wall counter damage.
     *
     * ═══════════════════════════════════════════════════════════════
     * SPEAR WALL COUNTER DAMAGE FORMULA
     * ═══════════════════════════════════════════════════════════════
     *
     * counterDamage = floor(spearman.atk * SPEAR_WALL_COUNTER_MULTIPLIER)
     *
     * Where SPEAR_WALL_COUNTER_MULTIPLIER = 1.5 (150% damage)
     *
     * Example calculations:
     *   - spearman.atk = 20: counterDamage = floor(20 * 1.5) = 30
     *   - spearman.atk = 15: counterDamage = floor(15 * 1.5) = 22
     *   - spearman.atk = 10: counterDamage = floor(10 * 1.5) = 15
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param spearman - Unit with Spear Wall performing counter
     * @returns Counter damage to be dealt to charger
     */
    calculateCounterDamage(spearman: BattleUnit & UnitWithCharge): number {
      const spearmanAtk = getUnitAtk(spearman);
      return Math.floor(spearmanAtk * SPEAR_WALL_COUNTER_MULTIPLIER);
    },

    /**
     * Checks if a unit can perform a charge attack.
     *
     * Conditions for charge:
     * 1. Unit must have charge capability (cavalry/charge tag)
     * 2. Unit must have moved minimum distance
     * 3. Unit must not have already charged this turn
     * 4. Unit must not have been countered
     *
     * @param unit - Unit attempting to charge
     * @param distance - Distance moved this turn
     * @param chargeConfig - Charge configuration
     * @returns Charge eligibility result
     */
    canCharge(
      unit: BattleUnit & UnitWithCharge,
      distance: number,
      chargeConfig: ChargeConfig,
    ): ChargeEligibility {
      // ─────────────────────────────────────────────────────────────
      // Check 1: Unit must have charge capability
      // ─────────────────────────────────────────────────────────────
      if (!hasChargeCapability(unit)) {
        return {
          canCharge: false,
          reason: 'no_charge_ability',
          distance,
          momentum: 0,
        };
      }

      // ─────────────────────────────────────────────────────────────
      // Check 2: Unit must not have been countered this turn
      // ─────────────────────────────────────────────────────────────
      if (unit.chargeCountered) {
        return {
          canCharge: false,
          reason: 'countered',
          distance,
          momentum: 0,
        };
      }

      // ─────────────────────────────────────────────────────────────
      // Check 3: Unit must have moved minimum distance
      // ─────────────────────────────────────────────────────────────
      if (distance < chargeConfig.minChargeDistance) {
        return {
          canCharge: false,
          reason: 'insufficient_distance',
          distance,
          momentum: 0,
        };
      }

      // ─────────────────────────────────────────────────────────────
      // All checks passed - calculate momentum
      // ─────────────────────────────────────────────────────────────
      const momentum = this.calculateMomentum(distance, chargeConfig);

      return {
        canCharge: true,
        distance,
        momentum,
      };
    },

    /**
     * Executes a charge attack against a target.
     *
     * @param charger - Unit performing the charge
     * @param target - Unit being charged
     * @param state - Current battle state
     * @param chargeConfig - Charge configuration
     * @param _seed - Random seed for determinism (unused in current implementation)
     * @returns Charge execution result
     */
    executeCharge(
      charger: BattleUnit & UnitWithCharge,
      target: BattleUnit & UnitWithCharge,
      state: BattleState,
      chargeConfig: ChargeConfig,
      _seed: number,
    ): ChargeExecutionResult {
      const momentum = charger.momentum ?? 0;

      // ─────────────────────────────────────────────────────────────
      // Check for Spear Wall counter
      // ─────────────────────────────────────────────────────────────
      if (this.isCounteredBySpearWall(target)) {
        const counterDamage = this.calculateCounterDamage(target);
        const chargerNewHp = Math.max(0, getUnitHp(charger) - counterDamage);
        const chargerAlive = chargerNewHp > 0;

        // Update charger with counter damage and reset momentum
        const updatedCharger: BattleUnit & UnitWithCharge = {
          ...charger,
          currentHp: chargerNewHp,
          alive: chargerAlive,
          momentum: 0,
          isCharging: false,
          chargeCountered: true,
        };

        const counterResult: SpearWallCounterResult = {
          isCountered: true,
          counterDamage,
          chargerStopped: true,
          stoppedAt: charger.position,
          counteredBy: target,
        };

        return {
          success: false,
          damage: 0,
          targetNewHp: getUnitHp(target),
          shockDamage: 0,
          targetNewResolve: getUnitResolve(target),
          momentumUsed: momentum,
          wasCountered: true,
          counterResult,
          state: updateUnit(state, updatedCharger),
        };
      }

      // ─────────────────────────────────────────────────────────────
      // Execute charge attack
      // ─────────────────────────────────────────────────────────────
      const chargerAtk = getUnitAtk(charger);
      const baseDamage = chargerAtk;
      const totalDamage = this.applyChargeBonus(baseDamage, momentum);
      const shockDamage = chargeConfig.shockResolveDamage;

      // Apply damage to target
      const targetNewHp = Math.max(0, getUnitHp(target) - totalDamage);
      const targetAlive = targetNewHp > 0;
      const targetNewResolve = Math.max(0, getUnitResolve(target) - shockDamage);

      // Update target with damage
      const updatedTarget: BattleUnit & UnitWithCharge = {
        ...target,
        currentHp: targetNewHp,
        alive: targetAlive,
        resolve: targetNewResolve,
      };

      // Reset charger's momentum after attack
      const updatedCharger: BattleUnit & UnitWithCharge = {
        ...charger,
        momentum: 0,
        isCharging: false,
      };

      return {
        success: true,
        damage: totalDamage,
        targetNewHp,
        shockDamage,
        targetNewResolve,
        momentumUsed: momentum,
        wasCountered: false,
        state: updateUnits(state, [updatedTarget, updatedCharger]),
      };
    },

    /**
     * Resets a unit's momentum and charge state.
     * Called at turn end or after attack.
     *
     * @param unit - Unit to reset
     * @returns Updated unit with reset charge state
     */
    resetCharge(unit: BattleUnit & UnitWithCharge): BattleUnit & UnitWithCharge {
      // Create a new object without chargeStartPosition to properly reset
      const { chargeStartPosition, ...rest } = unit;
      return {
        ...rest,
        momentum: 0,
        isCharging: false,
        chargeDistance: 0,
        chargeCountered: false,
      } as BattleUnit & UnitWithCharge;
    },

    /**
     * Tracks movement distance for momentum calculation.
     * Called during movement phase.
     *
     * @param unit - Unit that moved
     * @param path - Movement path (array of positions)
     * @param chargeConfig - Charge configuration
     * @returns Updated unit with tracked distance and momentum
     */
    trackMovement(
      unit: BattleUnit & UnitWithCharge,
      path: Position[],
      chargeConfig: ChargeConfig,
    ): BattleUnit & UnitWithCharge {
      // Path length is the number of cells moved (path includes start position)
      // So actual distance is path.length - 1
      const distance = path.length > 0 ? path.length - 1 : 0;

      // Calculate momentum based on distance
      const momentum = this.calculateMomentum(distance, chargeConfig);

      // Determine if unit qualifies for charge
      const isCharging = momentum > 0 && hasChargeCapability(unit);

      // Get start position from path or use current position
      const firstPosition = path[0];
      const startPosition = firstPosition !== undefined ? firstPosition : unit.position;

      return {
        ...unit,
        chargeDistance: distance,
        momentum,
        isCharging,
        chargeStartPosition: startPosition,
      };
    },

    /**
     * Apply charge logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_start: Reset charge state, record start position
     * - movement: Track distance, calculate momentum
     * - pre_attack: Validate charge, check for Spear Wall counter
     * - attack: Apply shock resolve damage to target when charging
     * - turn_end: Reset momentum
     *
     * Shock Resolve Damage:
     * When a charging unit (momentum > 0) attacks a target, the target
     * suffers additional resolve damage equal to config.shockResolveDamage.
     * This represents the psychological impact of a cavalry charge.
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
      // TURN_START: Reset charge state and record start position
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_start') {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithCharge = unit as BattleUnit & UnitWithCharge;
          const resetUnit: BattleUnit & UnitWithCharge = {
            ...unitWithCharge,
            chargeDistance: 0,
            momentum: 0,
            isCharging: false,
            chargeStartPosition: unit.position,
            chargeCountered: false,
          };
          return updateUnit(state, resetUnit);
        }
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // MOVEMENT: Track distance moved for momentum calculation
      // ─────────────────────────────────────────────────────────────
      if (phase === 'movement' && context.action?.type === 'move' && context.action.path) {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithCharge = unit as BattleUnit & UnitWithCharge;
          const updatedUnit = this.trackMovement(
            unitWithCharge,
            context.action.path,
            config,
          );
          return updateUnit(state, updatedUnit);
        }
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // PRE_ATTACK: Check for Spear Wall counter
      // ─────────────────────────────────────────────────────────────
      if (phase === 'pre_attack' && context.target) {
        const unit = findUnit(state, context.activeUnit.id);
        const target = findUnit(state, context.target.id);

        if (unit && target) {
          const unitWithCharge = unit as BattleUnit & UnitWithCharge;
          const targetWithCharge = target as BattleUnit & UnitWithCharge;
          const momentum = unitWithCharge.momentum ?? 0;

          // Only check for counter if unit has momentum (is charging)
          if (momentum > 0 && this.isCounteredBySpearWall(targetWithCharge)) {
            // Charge is countered - apply counter damage to charger
            const counterDamage = this.calculateCounterDamage(targetWithCharge);
            const chargerNewHp = Math.max(0, getUnitHp(unitWithCharge) - counterDamage);
            const chargerAlive = chargerNewHp > 0;

            const updatedCharger: BattleUnit & UnitWithCharge = {
              ...unitWithCharge,
              currentHp: chargerNewHp,
              alive: chargerAlive,
              momentum: 0,
              isCharging: false,
              chargeCountered: true,
            };

            return updateUnit(state, updatedCharger);
          }
        }
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // ATTACK: Apply shock resolve damage when charging
      // ─────────────────────────────────────────────────────────────
      // Shock resolve damage is applied during the attack phase when
      // a unit with momentum attacks a target. This represents the
      // psychological impact of a cavalry charge on the target unit.
      //
      // Formula: targetNewResolve = max(0, targetResolve - shockResolveDamage)
      //
      // The shock damage is only applied if:
      // 1. The attacker has momentum > 0 (is charging)
      // 2. The charge was not countered by Spear Wall
      // 3. There is a valid target
      // ─────────────────────────────────────────────────────────────
      if (phase === 'attack' && context.target) {
        const unit = findUnit(state, context.activeUnit.id);
        const target = findUnit(state, context.target.id);

        if (unit && target) {
          const unitWithCharge = unit as BattleUnit & UnitWithCharge;
          const targetWithCharge = target as BattleUnit & UnitWithCharge;
          const momentum = unitWithCharge.momentum ?? 0;

          // Only apply shock damage if unit has momentum and wasn't countered
          if (momentum > 0 && !unitWithCharge.chargeCountered) {
            const shockDamage = config.shockResolveDamage;
            const currentResolve = getUnitResolve(targetWithCharge);
            const newResolve = Math.max(0, currentResolve - shockDamage);

            const updatedTarget: BattleUnit & UnitWithCharge = {
              ...targetWithCharge,
              resolve: newResolve,
            };

            // Also reset the charger's momentum after the attack
            const updatedCharger: BattleUnit & UnitWithCharge = {
              ...unitWithCharge,
              momentum: 0,
              isCharging: false,
            };

            return updateUnits(state, [updatedTarget, updatedCharger]);
          }
        }
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // TURN_END: Reset momentum
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_end') {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithCharge = unit as BattleUnit & UnitWithCharge;
          const resetUnit = this.resetCharge(unitWithCharge);
          return updateUnit(state, resetUnit);
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
export default createChargeProcessor;
