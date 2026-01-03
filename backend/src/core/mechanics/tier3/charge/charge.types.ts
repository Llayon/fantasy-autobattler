/**
 * Tier 3: Charge (Cavalry Momentum) - Type Definitions
 *
 * Defines types for the charge system which provides damage bonuses
 * based on distance moved before attacking. Charge is primarily used
 * by cavalry units and can be countered by spearmen with Spear Wall.
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

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import type { ChargeConfig } from '../../config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// CHARGE CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default momentum bonus per cell moved.
 * 0.2 = +20% damage per cell.
 *
 * @example
 * // Moving 5 cells with default config:
 * // momentum = 5 * 0.2 = 1.0 (100% bonus damage)
 */
export const DEFAULT_MOMENTUM_PER_CELL = 0.2;

/**
 * Default maximum momentum bonus cap.
 * 1.0 = +100% maximum damage bonus.
 */
export const DEFAULT_MAX_MOMENTUM = 1.0;

/**
 * Default minimum distance required for charge bonus.
 * Unit must move at least this many cells to gain momentum.
 */
export const DEFAULT_MIN_CHARGE_DISTANCE = 3;

/**
 * Default resolve damage on charge impact.
 * Applied in addition to HP damage when charging.
 */
export const DEFAULT_SHOCK_RESOLVE_DAMAGE = 10;

/**
 * Damage multiplier for Spear Wall counter-attack.
 * Spearmen deal bonus damage when stopping a charge.
 *
 * @example
 * const counterDamage = Math.floor(spearman.atk * SPEAR_WALL_COUNTER_MULTIPLIER);
 */
export const SPEAR_WALL_COUNTER_MULTIPLIER = 1.5;

/**
 * Tag that identifies units capable of countering charges (spearmen).
 */
export const SPEAR_WALL_TAG = 'spear_wall';

/**
 * Tag that identifies units capable of charging (cavalry).
 */
export const CAVALRY_TAG = 'cavalry';

/**
 * Tag that identifies units with charge capability.
 */
export const CHARGE_TAG = 'charge';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the charge system.
 * These properties are added to BattleUnit when charge mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithCharge {}
 *
 * const cavalry: MyBattleUnit = {
 *   ...baseUnit,
 *   canCharge: true,
 *   momentum: 0,
 *   isCharging: false,
 *   chargeDistance: 0,
 *   tags: ['cavalry', 'charge'],
 * };
 */
export interface UnitWithCharge {
  /**
   * Whether unit is capable of charging.
   * Typically true for cavalry units with 'charge' tag.
   */
  canCharge?: boolean;

  /**
   * Current momentum accumulated from movement.
   * Reset after attack or at turn end.
   * Formula: momentum = min(maxMomentum, distance * momentumPerCell)
   */
  momentum?: number;

  /**
   * Whether unit is currently in a charge state.
   * Set when unit moves minimum distance and has charge capability.
   */
  isCharging?: boolean;

  /**
   * Distance moved this turn (for momentum calculation).
   * Reset at turn start.
   */
  chargeDistance?: number;

  /**
   * Starting position at turn start (for distance calculation).
   */
  chargeStartPosition?: Position;

  /**
   * Whether unit's charge was countered this turn.
   * Set when stopped by Spear Wall.
   */
  chargeCountered?: boolean;

  /**
   * Unit tags for charge type determination.
   * 'cavalry' and 'charge' enable charging, 'spear_wall' enables counter.
   */
  tags?: string[];

  /**
   * Whether unit has Spear Wall ability (can counter charges).
   * Derived from tags or set explicitly.
   */
  hasSpearWall?: boolean;

  /**
   * Unit's base attack value (for damage calculation).
   */
  atk?: number;

  /**
   * Unit's current HP.
   */
  currentHp?: number;

  /**
   * Unit's current resolve (for shock damage).
   */
  resolve?: number;
}

// ═══════════════════════════════════════════════════════════════
// CHARGE RESULT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of momentum calculation.
 * Contains the calculated momentum and factors that influenced it.
 *
 * @example
 * const result: MomentumResult = {
 *   momentum: 0.8,
 *   distance: 4,
 *   qualifiesForCharge: true,
 *   cappedAtMax: false,
 * };
 */
export interface MomentumResult {
  /** Calculated momentum value (0.0 to maxMomentum) */
  momentum: number;

  /** Distance moved in cells */
  distance: number;

  /** Whether distance meets minimum for charge bonus */
  qualifiesForCharge: boolean;

  /** Whether momentum was capped at maximum */
  cappedAtMax: boolean;

  /** Raw momentum before capping */
  rawMomentum: number;
}

/**
 * Result of a charge eligibility check.
 * Contains information about whether charge is possible and why.
 *
 * @example
 * const check: ChargeEligibility = {
 *   canCharge: true,
 *   reason: undefined,
 *   distance: 5,
 *   momentum: 1.0,
 * };
 */
export interface ChargeEligibility {
  /** Whether the unit can perform a charge attack */
  canCharge: boolean;

  /** Reason if charge is not possible */
  reason?: ChargeBlockReason;

  /** Distance moved */
  distance: number;

  /** Calculated momentum (if eligible) */
  momentum: number;
}

/**
 * Reasons why a charge might be blocked.
 *
 * - insufficient_distance: Did not move minimum required cells
 * - no_charge_ability: Unit cannot charge (no 'charge' tag)
 * - already_charged: Unit already charged this turn
 * - countered: Charge was stopped by Spear Wall
 * - no_target: No valid target in range
 * - disabled: Charge mechanic disabled for this unit
 */
export type ChargeBlockReason =
  | 'insufficient_distance'
  | 'no_charge_ability'
  | 'already_charged'
  | 'countered'
  | 'no_target'
  | 'disabled';

/**
 * Result of applying charge damage bonus.
 *
 * @example
 * const result: ChargeDamageResult = {
 *   baseDamage: 20,
 *   momentum: 0.6,
 *   bonusDamage: 12,
 *   totalDamage: 32,
 *   shockResolveDamage: 10,
 * };
 */
export interface ChargeDamageResult {
  /** Original damage before charge bonus */
  baseDamage: number;

  /** Momentum used for bonus calculation */
  momentum: number;

  /** Bonus damage from charge */
  bonusDamage: number;

  /** Total damage after charge bonus */
  totalDamage: number;

  /** Resolve damage from charge shock */
  shockResolveDamage: number;
}

/**
 * Result of a Spear Wall counter check.
 *
 * @example
 * const result: SpearWallCounterResult = {
 *   isCountered: true,
 *   counterDamage: 30,
 *   chargerStopped: true,
 *   stoppedAt: { x: 3, y: 4 },
 * };
 */
export interface SpearWallCounterResult {
  /** Whether the charge was countered */
  isCountered: boolean;

  /** Damage dealt to the charger by Spear Wall */
  counterDamage: number;

  /** Whether the charger's movement was stopped */
  chargerStopped: boolean;

  /** Position where charger was stopped */
  stoppedAt?: Position;

  /** Spearman unit that performed the counter */
  counteredBy?: BattleUnit;
}

/**
 * Result of executing a charge attack.
 *
 * @example
 * const result: ChargeExecutionResult = {
 *   success: true,
 *   damage: 32,
 *   targetNewHp: 18,
 *   shockDamage: 10,
 *   targetNewResolve: 70,
 *   momentumUsed: 0.6,
 *   wasCountered: false,
 *   state: updatedState,
 * };
 */
export interface ChargeExecutionResult {
  /** Whether charge was executed successfully */
  success: boolean;

  /** Total damage dealt (base + bonus) */
  damage: number;

  /** Target's HP after charge */
  targetNewHp: number;

  /** Shock resolve damage dealt */
  shockDamage: number;

  /** Target's resolve after shock */
  targetNewResolve: number;

  /** Momentum that was used */
  momentumUsed: number;

  /** Whether charge was countered by Spear Wall */
  wasCountered: boolean;

  /** Counter result if charge was countered */
  counterResult?: SpearWallCounterResult;

  /** Updated battle state */
  state: BattleState;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Charge started event for battle log.
 * Emitted when a unit begins a charge (moves minimum distance).
 *
 * @example
 * const event: ChargeStartedEvent = {
 *   type: 'charge_started',
 *   unitId: 'cavalry_1',
 *   startPosition: { x: 1, y: 1 },
 *   distance: 4,
 *   momentum: 0.8,
 * };
 */
export interface ChargeStartedEvent {
  /** Event type identifier */
  type: 'charge_started';

  /** Unit instance ID that started charging */
  unitId: string;

  /** Position where charge started */
  startPosition: Position;

  /** Distance moved */
  distance: number;

  /** Momentum accumulated */
  momentum: number;
}

/**
 * Charge impact event for battle log.
 * Emitted when a charging unit attacks a target.
 *
 * @example
 * const event: ChargeImpactEvent = {
 *   type: 'charge_impact',
 *   chargerId: 'cavalry_1',
 *   targetId: 'infantry_1',
 *   damage: 32,
 *   bonusDamage: 12,
 *   shockDamage: 10,
 *   momentum: 0.6,
 * };
 */
export interface ChargeImpactEvent {
  /** Event type identifier */
  type: 'charge_impact';

  /** Unit that performed the charge */
  chargerId: string;

  /** Unit that was charged */
  targetId: string;

  /** Total damage dealt */
  damage: number;

  /** Bonus damage from momentum */
  bonusDamage: number;

  /** Shock resolve damage dealt */
  shockDamage: number;

  /** Momentum used */
  momentum: number;

  /** Target's HP after impact */
  targetHpAfter: number;

  /** Target's resolve after shock */
  targetResolveAfter: number;
}

/**
 * Charge countered event for battle log.
 * Emitted when a charge is stopped by Spear Wall.
 *
 * @example
 * const event: ChargeCounteredEvent = {
 *   type: 'charge_countered',
 *   chargerId: 'cavalry_1',
 *   counteredById: 'spearman_1',
 *   counterDamage: 30,
 *   stoppedAt: { x: 3, y: 4 },
 * };
 */
export interface ChargeCounteredEvent {
  /** Event type identifier */
  type: 'charge_countered';

  /** Unit that was charging */
  chargerId: string;

  /** Unit that countered the charge (spearman) */
  counteredById: string;

  /** Damage dealt to the charger */
  counterDamage: number;

  /** Position where charger was stopped */
  stoppedAt: Position;

  /** Charger's HP after counter */
  chargerHpAfter: number;
}

/**
 * Charge failed event for battle log.
 * Emitted when a charge attempt fails (insufficient distance, etc.).
 *
 * @example
 * const event: ChargeFailedEvent = {
 *   type: 'charge_failed',
 *   unitId: 'cavalry_1',
 *   reason: 'insufficient_distance',
 *   distance: 2,
 *   minRequired: 3,
 * };
 */
export interface ChargeFailedEvent {
  /** Event type identifier */
  type: 'charge_failed';

  /** Unit that attempted to charge */
  unitId: string;

  /** Reason charge failed */
  reason: ChargeBlockReason;

  /** Distance moved (if applicable) */
  distance?: number;

  /** Minimum distance required (if applicable) */
  minRequired?: number;
}

/**
 * Momentum reset event for battle log.
 * Emitted when a unit's momentum is reset (turn end or after attack).
 *
 * @example
 * const event: MomentumResetEvent = {
 *   type: 'momentum_reset',
 *   unitId: 'cavalry_1',
 *   previousMomentum: 0.8,
 * };
 */
export interface MomentumResetEvent {
  /** Event type identifier */
  type: 'momentum_reset';

  /** Unit instance ID */
  unitId: string;

  /** Momentum value before reset */
  previousMomentum: number;
}

/**
 * Union type for all charge-related events.
 */
export type ChargeEvent =
  | ChargeStartedEvent
  | ChargeImpactEvent
  | ChargeCounteredEvent
  | ChargeFailedEvent
  | MomentumResetEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Charge processor interface.
 * Handles all charge-related mechanics including momentum calculation,
 * damage bonuses, and Spear Wall counters.
 *
 * Requires: intercept (Tier 2) - for movement blocking interaction
 *
 * @example
 * const processor = createChargeProcessor(config);
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
export interface ChargeProcessor {
  /**
   * Calculates momentum based on distance moved.
   * Momentum is capped at config.maxMomentum.
   *
   * Formula:
   * - If distance < minChargeDistance: momentum = 0
   * - Otherwise: momentum = min(maxMomentum, distance * momentumPerCell)
   *
   * @param distance - Number of cells moved
   * @param config - Charge configuration
   * @returns Calculated momentum value (0.0 to maxMomentum)
   *
   * @example
   * // With default config (0.2 per cell, max 1.0, min 3 cells):
   * processor.calculateMomentum(2, config); // 0 (below minimum)
   * processor.calculateMomentum(3, config); // 0.6
   * processor.calculateMomentum(5, config); // 1.0 (capped)
   */
  calculateMomentum(distance: number, config: ChargeConfig): number;

  /**
   * Applies charge damage bonus based on momentum.
   *
   * Formula: totalDamage = floor(baseDamage * (1 + momentum))
   *
   * @param baseDamage - Original damage before bonus
   * @param momentum - Momentum value (0.0 to maxMomentum)
   * @returns Total damage after charge bonus
   *
   * @example
   * processor.applyChargeBonus(20, 0.6); // 32 (20 * 1.6)
   * processor.applyChargeBonus(20, 1.0); // 40 (20 * 2.0)
   */
  applyChargeBonus(baseDamage: number, momentum: number): number;

  /**
   * Checks if target has Spear Wall ability to counter charges.
   *
   * @param target - Unit being charged
   * @returns True if target can counter the charge
   *
   * @example
   * if (processor.isCounteredBySpearWall(spearman)) {
   *   // Charge is stopped, charger takes counter damage
   * }
   */
  isCounteredBySpearWall(target: BattleUnit & UnitWithCharge): boolean;

  /**
   * Calculates Spear Wall counter damage.
   *
   * Formula: counterDamage = floor(spearman.atk * SPEAR_WALL_COUNTER_MULTIPLIER)
   *
   * @param spearman - Unit with Spear Wall performing counter
   * @returns Counter damage to be dealt to charger
   *
   * @example
   * const damage = processor.calculateCounterDamage(spearman);
   */
  calculateCounterDamage(spearman: BattleUnit & UnitWithCharge): number;

  /**
   * Checks if a unit can perform a charge attack.
   *
   * @param unit - Unit attempting to charge
   * @param distance - Distance moved this turn
   * @param config - Charge configuration
   * @returns Charge eligibility result
   *
   * @example
   * const eligibility = processor.canCharge(cavalry, 4, config);
   * if (eligibility.canCharge) {
   *   // Proceed with charge attack
   * }
   */
  canCharge(
    unit: BattleUnit & UnitWithCharge,
    distance: number,
    config: ChargeConfig,
  ): ChargeEligibility;

  /**
   * Executes a charge attack against a target.
   *
   * @param charger - Unit performing the charge
   * @param target - Unit being charged
   * @param state - Current battle state
   * @param config - Charge configuration
   * @param seed - Random seed for determinism
   * @returns Charge execution result
   *
   * @example
   * const result = processor.executeCharge(cavalry, infantry, state, config, seed);
   */
  executeCharge(
    charger: BattleUnit & UnitWithCharge,
    target: BattleUnit & UnitWithCharge,
    state: BattleState,
    config: ChargeConfig,
    seed: number,
  ): ChargeExecutionResult;

  /**
   * Resets a unit's momentum and charge state.
   * Called at turn end or after attack.
   *
   * @param unit - Unit to reset
   * @returns Updated unit with reset charge state
   *
   * @example
   * const resetUnit = processor.resetCharge(cavalry);
   */
  resetCharge(unit: BattleUnit & UnitWithCharge): BattleUnit & UnitWithCharge;

  /**
   * Tracks movement distance for momentum calculation.
   * Called during movement phase.
   *
   * @param unit - Unit that moved
   * @param path - Movement path (array of positions)
   * @param config - Charge configuration
   * @returns Updated unit with tracked distance and momentum
   *
   * @example
   * const updatedUnit = processor.trackMovement(cavalry, path, config);
   */
  trackMovement(
    unit: BattleUnit & UnitWithCharge,
    path: Position[],
    config: ChargeConfig,
  ): BattleUnit & UnitWithCharge;

  /**
   * Apply charge logic for a battle phase.
   *
   * Phase behaviors:
   * - turn_start: Reset charge state, record start position
   * - movement: Track distance, calculate momentum
   * - pre_attack: Validate charge, check for Spear Wall counter
   * - attack: Apply charge bonus damage and shock resolve damage
   * - turn_end: Reset momentum
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('movement', state, {
   *   activeUnit: cavalry,
   *   action: { type: 'move', path: [...] },
   *   seed: 12345,
   * });
   */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Options for creating a charge processor with custom settings.
 *
 * @example
 * const options: ChargeProcessorOptions = {
 *   spearWallCounterMultiplier: 2.0, // Double counter damage
 * };
 */
export interface ChargeProcessorOptions {
  /** Custom damage multiplier for Spear Wall counter (default: 1.5) */
  spearWallCounterMultiplier?: number;

  /** Custom tags for charge capability */
  chargeTags?: string[];

  /** Custom tags for Spear Wall capability */
  spearWallTags?: string[];
}

/**
 * Context for charge calculation.
 * Contains all information needed to determine charge outcome.
 */
export interface ChargeContext {
  /** Unit performing the charge */
  charger: BattleUnit & UnitWithCharge;

  /** Unit being charged */
  target: BattleUnit & UnitWithCharge;

  /** Distance moved before attack */
  distance: number;

  /** Charge configuration */
  config: ChargeConfig;

  /** Random seed for deterministic calculations */
  seed: number;
}

/**
 * Full charge check result with all details.
 * Used for detailed logging and debugging.
 */
export interface ChargeFullResult {
  /** Eligibility check result */
  eligibility: ChargeEligibility;

  /** Momentum calculation result */
  momentumResult: MomentumResult;

  /** Spear Wall counter result (if applicable) */
  counterResult?: SpearWallCounterResult;

  /** Execution result (if charge was performed) */
  executionResult?: ChargeExecutionResult;

  /** Events generated by this charge */
  events: ChargeEvent[];

  /** Final battle state after charge */
  finalState: BattleState;
}

/**
 * Movement action with path for charge tracking.
 */
export interface MoveAction {
  /** Action type */
  type: 'move';

  /** Movement path (array of positions) */
  path: Position[];

  /** Target position (last position in path) */
  targetPosition: Position;
}

/**
 * Attack action for charge execution.
 */
export interface AttackAction {
  /** Action type */
  type: 'attack';

  /** Target unit ID */
  targetId: string;

  /** Whether this is a charge attack */
  isCharge?: boolean;
}

/**
 * Union type for actions relevant to charge mechanic.
 */
export type ChargeRelevantAction = MoveAction | AttackAction;
