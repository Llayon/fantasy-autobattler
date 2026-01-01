/**
 * Tier 2: Intercept - Type Definitions
 *
 * Defines types for the intercept system which allows units to block
 * or engage passing enemies during movement. Intercept extends the
 * engagement mechanic with movement blocking capabilities.
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

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import type { InterceptConfig } from '../../config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// INTERCEPT CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Damage multiplier for hard intercept counter-attacks.
 * Spearmen deal bonus damage when stopping cavalry.
 *
 * @example
 * const interceptDamage = Math.floor(spearman.atk * HARD_INTERCEPT_DAMAGE_MULTIPLIER);
 */
export const HARD_INTERCEPT_DAMAGE_MULTIPLIER = 1.5;

/**
 * Default movement cost to disengage from Zone of Control.
 * Unit must spend this many movement points to leave engagement.
 */
export const DEFAULT_DISENGAGE_COST = 2;

/**
 * Tag that identifies units capable of hard intercept (spearmen).
 */
export const HARD_INTERCEPT_TAG = 'spear_wall';

/**
 * Tag that identifies units that can be hard intercepted (cavalry).
 */
export const CAVALRY_TAG = 'cavalry';

// ═══════════════════════════════════════════════════════════════
// INTERCEPT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Types of intercept.
 *
 * - hard: Spearmen completely stop cavalry charges (movement blocked)
 * - soft: Infantry engages passing units (triggers ZoC, movement continues)
 */
export type InterceptType = 'hard' | 'soft';

/**
 * Result of an intercept attempt.
 *
 * - blocked: Movement was completely stopped (hard intercept)
 * - engaged: Unit was engaged but can continue moving (soft intercept)
 * - none: No intercept occurred
 */
export type InterceptResult = 'blocked' | 'engaged' | 'none';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the intercept system.
 * These properties are added to BattleUnit when intercept mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithIntercept {}
 *
 * const spearman: MyBattleUnit = {
 *   ...baseUnit,
 *   canHardIntercept: true,
 *   canSoftIntercept: true,
 *   interceptsRemaining: 1,
 *   tags: ['spear_wall'],
 * };
 */
export interface UnitWithIntercept {
  /**
   * Whether unit can perform hard intercept (stop cavalry).
   * Typically true for spearmen with 'spear_wall' tag.
   */
  canHardIntercept?: boolean;

  /**
   * Whether unit can perform soft intercept (engage passing units).
   * Typically true for all melee infantry.
   */
  canSoftIntercept?: boolean;

  /**
   * Number of intercepts remaining this round.
   * Reset at the start of each round.
   */
  interceptsRemaining?: number;

  /**
   * Maximum intercepts per round.
   * Default: 1 for most units.
   */
  maxIntercepts?: number;

  /**
   * Whether unit is currently intercepting (blocking movement).
   * Set during movement phase when intercept triggers.
   */
  isIntercepting?: boolean;

  /**
   * Unit tags for intercept type determination.
   * 'spear_wall' enables hard intercept, 'cavalry' can be hard intercepted.
   */
  tags?: string[];

  /**
   * Whether unit is cavalry (can be hard intercepted).
   * Derived from tags or set explicitly.
   */
  isCavalry?: boolean;

  /**
   * Whether unit is currently charging (for charge + intercept interaction).
   * Charging cavalry can be stopped by hard intercept.
   */
  isCharging?: boolean;

  /**
   * Current momentum from charge (for damage calculation).
   * Used when calculating intercept counter-damage.
   */
  momentum?: number;

  /**
   * The round number when intercepts were last reset.
   * Used to track per-round intercept resets.
   */
  lastInterceptResetRound?: number;
}

// ═══════════════════════════════════════════════════════════════
// INTERCEPT CHECK TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Information about a potential intercept opportunity.
 *
 * @example
 * const opportunity: InterceptOpportunity = {
 *   interceptor: spearman,
 *   target: cavalry,
 *   type: 'hard',
 *   position: { x: 3, y: 4 },
 *   canIntercept: true,
 * };
 */
export interface InterceptOpportunity {
  /** Unit that can intercept */
  interceptor: BattleUnit & UnitWithIntercept;

  /** Unit being intercepted */
  target: BattleUnit & UnitWithIntercept;

  /** Type of intercept (hard or soft) */
  type: InterceptType;

  /** Position where intercept would occur */
  position: Position;

  /** Whether intercept can actually be performed */
  canIntercept: boolean;

  /** Reason if intercept cannot be performed */
  reason?: InterceptBlockReason;
}

/**
 * Reasons why an intercept might be blocked.
 *
 * - no_intercepts: No intercepts remaining this round
 * - wrong_type: Interceptor cannot intercept this target type
 * - out_of_range: Target not in intercept range
 * - same_team: Cannot intercept allies
 * - disabled: Intercept mechanic disabled for this unit
 * - already_engaged: Target already engaged by this unit
 */
export type InterceptBlockReason =
  | 'no_intercepts'
  | 'wrong_type'
  | 'out_of_range'
  | 'same_team'
  | 'disabled'
  | 'already_engaged';

/**
 * Result of checking for intercept opportunities along a path.
 *
 * @example
 * const check: InterceptCheckResult = {
 *   hasIntercept: true,
 *   opportunities: [opportunity1, opportunity2],
 *   firstIntercept: opportunity1,
 *   blockedAt: { x: 3, y: 4 },
 * };
 */
export interface InterceptCheckResult {
  /** Whether any intercept opportunity exists */
  hasIntercept: boolean;

  /** All intercept opportunities along the path */
  opportunities: InterceptOpportunity[];

  /** First intercept opportunity (if any) */
  firstIntercept?: InterceptOpportunity;

  /** Position where movement is blocked (for hard intercept) */
  blockedAt?: Position;

  /** Whether movement is completely blocked */
  movementBlocked: boolean;
}

// ═══════════════════════════════════════════════════════════════
// INTERCEPT EXECUTION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of executing an intercept.
 *
 * @example
 * const result: InterceptExecutionResult = {
 *   success: true,
 *   type: 'hard',
 *   damage: 25,
 *   targetNewHp: 50,
 *   movementStopped: true,
 *   stoppedAt: { x: 3, y: 4 },
 *   state: updatedState,
 * };
 */
export interface InterceptExecutionResult {
  /** Whether intercept was executed successfully */
  success: boolean;

  /** Type of intercept that was executed */
  type: InterceptType;

  /** Damage dealt by intercept (hard intercept only) */
  damage: number;

  /** Target's HP after intercept */
  targetNewHp: number;

  /** Whether target's movement was stopped */
  movementStopped: boolean;

  /** Position where target was stopped (if movement stopped) */
  stoppedAt?: Position;

  /** Interceptor's remaining intercepts */
  interceptorInterceptsRemaining: number;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Disengage attempt result.
 *
 * @example
 * const result: DisengageResult = {
 *   success: true,
 *   movementCost: 2,
 *   remainingMovement: 3,
 *   triggeredAoO: true,
 *   state: updatedState,
 * };
 */
export interface DisengageResult {
  /** Whether disengage was successful */
  success: boolean;

  /** Movement points spent to disengage */
  movementCost: number;

  /** Remaining movement after disengage */
  remainingMovement: number;

  /** Whether disengage triggered Attack of Opportunity */
  triggeredAoO: boolean;

  /** Reason if disengage failed */
  reason?: DisengageFailReason;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Reasons why a disengage might fail.
 *
 * - insufficient_movement: Not enough movement points
 * - pinned: Unit is pinned by multiple enemies
 * - blocked: No valid escape path
 */
export type DisengageFailReason =
  | 'insufficient_movement'
  | 'pinned'
  | 'blocked';

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Hard intercept event for battle log.
 * Emitted when a spearman stops cavalry.
 *
 * @example
 * const event: HardInterceptEvent = {
 *   type: 'hard_intercept',
 *   interceptorId: 'spearman_1',
 *   targetId: 'cavalry_1',
 *   damage: 25,
 *   stoppedAt: { x: 3, y: 4 },
 * };
 */
export interface HardInterceptEvent {
  /** Event type identifier */
  type: 'hard_intercept';

  /** Unit that performed the intercept */
  interceptorId: string;

  /** Unit that was intercepted */
  targetId: string;

  /** Damage dealt by intercept */
  damage: number;

  /** Position where target was stopped */
  stoppedAt: Position;

  /** Target's HP after intercept */
  targetHpAfter: number;
}

/**
 * Soft intercept event for battle log.
 * Emitted when infantry engages a passing unit.
 *
 * @example
 * const event: SoftInterceptEvent = {
 *   type: 'soft_intercept',
 *   interceptorId: 'infantry_1',
 *   targetId: 'enemy_1',
 *   engagedAt: { x: 3, y: 4 },
 * };
 */
export interface SoftInterceptEvent {
  /** Event type identifier */
  type: 'soft_intercept';

  /** Unit that performed the intercept */
  interceptorId: string;

  /** Unit that was intercepted */
  targetId: string;

  /** Position where engagement occurred */
  engagedAt: Position;
}

/**
 * Intercept blocked event for battle log.
 * Emitted when an intercept opportunity was blocked.
 *
 * @example
 * const event: InterceptBlockedEvent = {
 *   type: 'intercept_blocked',
 *   interceptorId: 'spearman_1',
 *   targetId: 'cavalry_1',
 *   reason: 'no_intercepts',
 * };
 */
export interface InterceptBlockedEvent {
  /** Event type identifier */
  type: 'intercept_blocked';

  /** Unit that could have intercepted */
  interceptorId: string;

  /** Unit that passed by */
  targetId: string;

  /** Reason intercept was blocked */
  reason: InterceptBlockReason;
}

/**
 * Disengage event for battle log.
 * Emitted when a unit disengages from combat.
 *
 * @example
 * const event: DisengageEvent = {
 *   type: 'disengage',
 *   unitId: 'unit_1',
 *   from: 'enemy_1',
 *   movementCost: 2,
 *   triggeredAoO: true,
 * };
 */
export interface DisengageEvent {
  /** Event type identifier */
  type: 'disengage';

  /** Unit that disengaged */
  unitId: string;

  /** Unit that was disengaged from */
  from: string;

  /** Movement points spent */
  movementCost: number;

  /** Whether disengage triggered Attack of Opportunity */
  triggeredAoO: boolean;
}

/**
 * Intercept charges reset event for battle log.
 * Emitted at the start of each round when charges are restored.
 *
 * @example
 * const event: InterceptChargesResetEvent = {
 *   type: 'intercept_charges_reset',
 *   unitId: 'spearman_1',
 *   charges: 1,
 * };
 */
export interface InterceptChargesResetEvent {
  /** Event type identifier */
  type: 'intercept_charges_reset';

  /** Unit instance ID */
  unitId: string;

  /** Number of charges restored */
  charges: number;
}

/**
 * Union type for all intercept-related events.
 */
export type InterceptEvent =
  | HardInterceptEvent
  | SoftInterceptEvent
  | InterceptBlockedEvent
  | DisengageEvent
  | InterceptChargesResetEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Intercept processor interface.
 * Handles all intercept-related mechanics including hard/soft intercept,
 * disengage costs, and movement blocking.
 *
 * Requires: engagement (Tier 1) - uses Zone of Control for intercept range
 *
 * @example
 * const processor = createInterceptProcessor(config);
 *
 * // Check for intercept opportunities along a path
 * const check = processor.checkIntercept(unit, path, state);
 *
 * // Execute hard intercept
 * const result = processor.executeHardIntercept(interceptor, target, state, seed);
 *
 * // Calculate disengage cost
 * const cost = processor.getDisengageCost(unit, state, config);
 */
export interface InterceptProcessor {
  /**
   * Checks if a unit can perform hard intercept (stop cavalry).
   * Hard intercept requires 'spear_wall' tag and target must be cavalry.
   *
   * @param interceptor - Unit attempting to intercept
   * @param target - Unit being intercepted
   * @param config - Intercept configuration
   * @returns True if hard intercept is possible
   *
   * @example
   * if (processor.canHardIntercept(spearman, cavalry, config)) {
   *   // Spearman can stop the cavalry charge
   * }
   */
  canHardIntercept(
    interceptor: BattleUnit & UnitWithIntercept,
    target: BattleUnit & UnitWithIntercept,
    config: InterceptConfig,
  ): boolean;

  /**
   * Checks if a unit can perform soft intercept (engage passing unit).
   * Soft intercept requires melee capability and intercepts remaining.
   *
   * @param interceptor - Unit attempting to intercept
   * @param target - Unit being intercepted
   * @param config - Intercept configuration
   * @returns True if soft intercept is possible
   *
   * @example
   * if (processor.canSoftIntercept(infantry, enemy, config)) {
   *   // Infantry can engage the passing enemy
   * }
   */
  canSoftIntercept(
    interceptor: BattleUnit & UnitWithIntercept,
    target: BattleUnit & UnitWithIntercept,
    config: InterceptConfig,
  ): boolean;

  /**
   * Checks for intercept opportunities along a movement path.
   * Returns all potential intercepts and whether movement is blocked.
   *
   * @param unit - Unit that is moving
   * @param path - Movement path (array of positions)
   * @param state - Current battle state
   * @param config - Intercept configuration
   * @returns Intercept check result with opportunities
   *
   * @example
   * const check = processor.checkIntercept(cavalry, path, state, config);
   * if (check.movementBlocked) {
   *   // Cavalry charge was stopped by spearmen
   * }
   */
  checkIntercept(
    unit: BattleUnit & UnitWithIntercept,
    path: Position[],
    state: BattleState,
    config: InterceptConfig,
  ): InterceptCheckResult;

  /**
   * Executes a hard intercept (spearmen stop cavalry).
   * Deals counter-damage and stops movement.
   *
   * @param interceptor - Unit performing the intercept
   * @param target - Unit being intercepted
   * @param state - Current battle state
   * @param seed - Random seed for determinism
   * @returns Intercept execution result
   *
   * @example
   * const result = processor.executeHardIntercept(spearman, cavalry, state, seed);
   * if (result.movementStopped) {
   *   // Update cavalry position to stoppedAt
   * }
   */
  executeHardIntercept(
    interceptor: BattleUnit & UnitWithIntercept,
    target: BattleUnit & UnitWithIntercept,
    state: BattleState,
    seed: number,
  ): InterceptExecutionResult;

  /**
   * Executes a soft intercept (infantry engages passing unit).
   * Engages the target but allows movement to continue.
   *
   * @param interceptor - Unit performing the intercept
   * @param target - Unit being intercepted
   * @param state - Current battle state
   * @returns Intercept execution result
   *
   * @example
   * const result = processor.executeSoftIntercept(infantry, enemy, state);
   * // Target is now engaged but can continue moving
   */
  executeSoftIntercept(
    interceptor: BattleUnit & UnitWithIntercept,
    target: BattleUnit & UnitWithIntercept,
    state: BattleState,
  ): InterceptExecutionResult;

  /**
   * Calculates the movement cost to disengage from engagement.
   *
   * @param unit - Unit attempting to disengage
   * @param state - Current battle state
   * @param config - Intercept configuration
   * @returns Movement cost to disengage
   *
   * @example
   * const cost = processor.getDisengageCost(unit, state, config);
   * if (unit.movement >= cost) {
   *   // Unit can afford to disengage
   * }
   */
  getDisengageCost(
    unit: BattleUnit & UnitWithIntercept,
    state: BattleState,
    config: InterceptConfig,
  ): number;

  /**
   * Attempts to disengage a unit from engagement.
   * Spends movement points and may trigger Attack of Opportunity.
   *
   * @param unit - Unit attempting to disengage
   * @param state - Current battle state
   * @param config - Intercept configuration
   * @param seed - Random seed for AoO roll
   * @returns Disengage result
   *
   * @example
   * const result = processor.attemptDisengage(unit, state, config, seed);
   * if (result.success) {
   *   // Unit successfully disengaged
   * }
   */
  attemptDisengage(
    unit: BattleUnit & UnitWithIntercept,
    state: BattleState,
    config: InterceptConfig,
    seed: number,
  ): DisengageResult;

  /**
   * Resets intercept charges for a unit at round start.
   *
   * @param unit - Unit to reset charges for
   * @param round - Current round number
   * @returns Updated unit with reset charges
   *
   * @example
   * const updatedUnit = processor.resetInterceptCharges(unit, round);
   */
  resetInterceptCharges(
    unit: BattleUnit & UnitWithIntercept,
    round: number,
  ): BattleUnit & UnitWithIntercept;

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
 * Options for creating an intercept processor with custom settings.
 *
 * @example
 * const options: InterceptProcessorOptions = {
 *   hardInterceptDamageMultiplier: 2.0, // Double damage for hard intercept
 * };
 */
export interface InterceptProcessorOptions {
  /** Custom damage multiplier for hard intercept (default: 1.5) */
  hardInterceptDamageMultiplier?: number;

  /** Custom tags for hard intercept capability */
  hardInterceptTags?: string[];

  /** Custom tags for cavalry (can be hard intercepted) */
  cavalryTags?: string[];
}

/**
 * Context for intercept calculation.
 * Contains all information needed to determine intercept outcome.
 */
export interface InterceptContext {
  /** Unit performing the intercept */
  interceptor: BattleUnit & UnitWithIntercept;

  /** Unit being intercepted */
  target: BattleUnit & UnitWithIntercept;

  /** Position where intercept occurs */
  position: Position;

  /** Intercept configuration */
  config: InterceptConfig;

  /** Random seed for deterministic calculations */
  seed: number;
}

/**
 * Full intercept check result with all details.
 * Used for detailed logging and debugging.
 */
export interface InterceptFullResult {
  /** Intercept check result */
  check: InterceptCheckResult;

  /** Execution results for each intercept (if any) */
  executions: InterceptExecutionResult[];

  /** Events generated by this intercept check */
  events: InterceptEvent[];

  /** Final battle state after all intercepts */
  finalState: BattleState;
}
