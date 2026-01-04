/**
 * Tier 3: Overwatch (Ranged Reaction Fire) - Type Definitions
 *
 * Defines types for the overwatch system which allows ranged units to
 * enter a Vigilance state and automatically fire at enemies that move
 * within their range. Overwatch is primarily used by archers and
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

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// OVERWATCH CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default damage modifier for overwatch attacks.
 * Overwatch attacks deal reduced damage compared to normal attacks.
 * 0.75 = 75% of normal damage.
 */
export const DEFAULT_OVERWATCH_DAMAGE_MODIFIER = 0.75;

/**
 * Default maximum overwatch shots per round.
 * Limits how many times a unit can fire in overwatch mode.
 */
export const DEFAULT_MAX_OVERWATCH_SHOTS = 2;

/**
 * Default accuracy penalty for overwatch attacks.
 * Reaction fire is less accurate than aimed shots.
 * 0.2 = 20% accuracy penalty.
 */
export const DEFAULT_OVERWATCH_ACCURACY_PENALTY = 0.2;

/**
 * Tag that identifies units capable of overwatch (ranged units).
 */
export const OVERWATCH_TAG = 'ranged';

/**
 * Tag that identifies units with enhanced overwatch capability.
 */
export const ENHANCED_OVERWATCH_TAG = 'marksman';

/**
 * Tag that identifies units immune to overwatch (stealthy units).
 */
export const OVERWATCH_IMMUNE_TAG = 'stealth';

// ═══════════════════════════════════════════════════════════════
// VIGILANCE STATE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Overwatch vigilance state for units.
 * This is the internal state used by the overwatch processor.
 *
 * - inactive: Unit is not in overwatch mode
 * - active: Unit is in overwatch mode, ready to fire
 * - triggered: Unit has fired this movement phase
 * - exhausted: Unit has used all overwatch shots this round
 */
export type OverwatchVigilanceState = 'inactive' | 'active' | 'triggered' | 'exhausted';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the overwatch system.
 * These properties are added to BattleUnit when overwatch mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithOverwatch {}
 *
 * const archer: MyBattleUnit = {
 *   ...baseUnit,
 *   canOverwatch: true,
 *   vigilance: 'inactive',
 *   overwatchShotsRemaining: 2,
 *   overwatchRange: 6,
 *   tags: ['ranged'],
 * };
 */
export interface UnitWithOverwatch {
  /**
   * Whether unit is capable of entering overwatch mode.
   * Typically true for ranged units with 'ranged' tag.
   */
  canOverwatch?: boolean;

  /**
   * Current vigilance state.
   * Determines if unit can fire on enemy movement.
   */
  vigilance?: OverwatchVigilanceState;

  /**
   * Number of overwatch shots remaining this round.
   * Reset at round start.
   */
  overwatchShotsRemaining?: number;

  /**
   * Maximum overwatch shots per round.
   * Default: 2 for most ranged units.
   */
  maxOverwatchShots?: number;

  /**
   * Range for overwatch triggers.
   * Typically same as unit's attack range.
   */
  overwatchRange?: number;

  /**
   * IDs of units already fired upon this movement phase.
   * Prevents multiple shots at same target during one move.
   */
  overwatchTargetsFired?: string[];

  /**
   * Whether unit entered vigilance this turn (cannot act).
   * Set when unit chooses to enter overwatch instead of attacking.
   */
  enteredVigilanceThisTurn?: boolean;

  /**
   * Unit's current ammunition count.
   * Overwatch consumes ammo on each shot.
   */
  ammo?: number;
}

// ═══════════════════════════════════════════════════════════════
// OVERWATCH CHECK TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Information about a potential overwatch opportunity.
 *
 * @example
 * const opportunity: OverwatchOpportunity = {
 *   watcher: archer,
 *   target: enemy,
 *   triggerPosition: { x: 3, y: 4 },
 *   canFire: true,
 *   distance: 4,
 * };
 */
export interface OverwatchOpportunity {
  /** Unit in overwatch mode */
  watcher: BattleUnit & UnitWithOverwatch;

  /** Unit that triggered overwatch */
  target: BattleUnit & UnitWithOverwatch;

  /** Position where overwatch was triggered */
  triggerPosition: Position;

  /** Whether overwatch can actually fire */
  canFire: boolean;

  /** Distance from watcher to trigger position */
  distance: number;

  /** Reason if overwatch cannot fire */
  reason?: OverwatchBlockReason;
}

/**
 * Reasons why an overwatch shot might be blocked.
 *
 * - no_ammo: Unit has no ammunition remaining
 * - no_shots: Unit has used all overwatch shots this round
 * - out_of_range: Target is outside overwatch range
 * - same_team: Cannot fire on allies
 * - already_fired: Already fired at this target this movement
 * - not_vigilant: Unit is not in vigilance state
 * - target_immune: Target has stealth/immunity
 * - blocked_los: Line of sight is blocked
 */
export type OverwatchBlockReason =
  | 'no_ammo'
  | 'no_shots'
  | 'out_of_range'
  | 'same_team'
  | 'already_fired'
  | 'not_vigilant'
  | 'target_immune'
  | 'blocked_los';

/**
 * Result of checking for overwatch triggers along a path.
 *
 * @example
 * const check: OverwatchCheckResult = {
 *   hasOverwatch: true,
 *   opportunities: [opportunity1, opportunity2],
 *   totalShots: 2,
 * };
 */
export interface OverwatchCheckResult {
  /** Whether any overwatch opportunity exists */
  hasOverwatch: boolean;

  /** All overwatch opportunities along the path */
  opportunities: OverwatchOpportunity[];

  /** Total number of overwatch shots that will be fired */
  totalShots: number;

  /** Positions where overwatch will trigger */
  triggerPositions: Position[];
}

// ═══════════════════════════════════════════════════════════════
// OVERWATCH EXECUTION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of executing an overwatch shot.
 *
 * @example
 * const result: OverwatchShotResult = {
 *   success: true,
 *   hit: true,
 *   damage: 15,
 *   targetNewHp: 35,
 *   ammoConsumed: 1,
 *   watcherAmmoRemaining: 4,
 *   state: updatedState,
 * };
 */
export interface OverwatchShotResult {
  /** Whether overwatch shot was executed */
  success: boolean;

  /** Whether the shot hit the target */
  hit: boolean;

  /** Damage dealt (0 if missed) */
  damage: number;

  /** Target's HP after shot */
  targetNewHp: number;

  /** Ammunition consumed */
  ammoConsumed: number;

  /** Watcher's remaining ammunition */
  watcherAmmoRemaining: number;

  /** Watcher's remaining overwatch shots */
  watcherShotsRemaining: number;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Result of entering vigilance state.
 *
 * @example
 * const result: EnterVigilanceResult = {
 *   success: true,
 *   unit: updatedUnit,
 *   state: updatedState,
 * };
 */
export interface EnterVigilanceResult {
  /** Whether vigilance was entered successfully */
  success: boolean;

  /** Reason if vigilance could not be entered */
  reason?: VigilanceBlockReason;

  /** Updated unit with vigilance state */
  unit: BattleUnit & UnitWithOverwatch;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Result of exiting vigilance state.
 *
 * @example
 * const result: ExitVigilanceResult = {
 *   success: true,
 *   unit: updatedUnit,
 *   state: updatedState,
 * };
 */
export interface ExitVigilanceResult {
  /** Whether vigilance was exited successfully */
  success: boolean;

  /** Reason if vigilance could not be exited */
  reason?: VigilanceExitBlockReason;

  /** Updated unit with vigilance state */
  unit: BattleUnit & UnitWithOverwatch;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Result of toggling vigilance state.
 *
 * @example
 * const result: ToggleVigilanceResult = {
 *   success: true,
 *   action: 'entered',
 *   unit: updatedUnit,
 *   state: updatedState,
 * };
 */
export interface ToggleVigilanceResult {
  /** Whether vigilance was toggled successfully */
  success: boolean;

  /** Action that was performed: 'entered' or 'exited', undefined if failed */
  action: 'entered' | 'exited' | undefined;

  /** Reason if vigilance could not be toggled */
  reason: VigilanceBlockReason | VigilanceExitBlockReason | undefined;

  /** Updated unit with vigilance state */
  unit: BattleUnit & UnitWithOverwatch;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Reasons why entering vigilance might fail.
 *
 * - no_ammo: Unit has no ammunition
 * - not_ranged: Unit cannot perform ranged attacks
 * - already_acted: Unit already attacked this turn
 * - already_vigilant: Unit is already in vigilance
 * - disabled: Overwatch mechanic disabled for this unit
 */
export type VigilanceBlockReason =
  | 'no_ammo'
  | 'not_ranged'
  | 'already_acted'
  | 'already_vigilant'
  | 'disabled';

/**
 * Reasons why exiting vigilance might fail.
 *
 * - not_vigilant: Unit is not in vigilance state
 * - already_triggered: Unit has already fired this round (cannot cancel)
 * - exhausted: Unit has exhausted all overwatch shots
 */
export type VigilanceExitBlockReason =
  | 'not_vigilant'
  | 'already_triggered'
  | 'exhausted';

/**
 * Result of resetting overwatch state at turn/round end.
 *
 * @example
 * const result: OverwatchResetResult = {
 *   unitsReset: ['archer_1', 'crossbow_1'],
 *   state: updatedState,
 * };
 */
export interface OverwatchResetResult {
  /** IDs of units whose overwatch was reset */
  unitsReset: string[];

  /** Updated battle state */
  state: BattleState;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Vigilance entered event for battle log.
 * Emitted when a unit enters overwatch mode.
 *
 * @example
 * const event: VigilanceEnteredEvent = {
 *   type: 'vigilance_entered',
 *   unitId: 'archer_1',
 *   overwatchRange: 6,
 *   shotsAvailable: 2,
 * };
 */
export interface VigilanceEnteredEvent {
  /** Event type identifier */
  type: 'vigilance_entered';

  /** Unit instance ID that entered vigilance */
  unitId: string;

  /** Range of overwatch coverage */
  overwatchRange: number;

  /** Number of shots available */
  shotsAvailable: number;
}

/**
 * Overwatch triggered event for battle log.
 * Emitted when an enemy triggers overwatch.
 *
 * @example
 * const event: OverwatchTriggeredEvent = {
 *   type: 'overwatch_triggered',
 *   watcherId: 'archer_1',
 *   targetId: 'enemy_1',
 *   triggerPosition: { x: 3, y: 4 },
 *   distance: 4,
 * };
 */
export interface OverwatchTriggeredEvent {
  /** Event type identifier */
  type: 'overwatch_triggered';

  /** Unit in overwatch that was triggered */
  watcherId: string;

  /** Unit that triggered the overwatch */
  targetId: string;

  /** Position where overwatch was triggered */
  triggerPosition: Position;

  /** Distance from watcher to target */
  distance: number;
}

/**
 * Overwatch shot event for battle log.
 * Emitted when an overwatch shot is fired.
 *
 * @example
 * const event: OverwatchShotEvent = {
 *   type: 'overwatch_shot',
 *   watcherId: 'archer_1',
 *   targetId: 'enemy_1',
 *   hit: true,
 *   damage: 15,
 *   targetHpAfter: 35,
 *   ammoRemaining: 4,
 * };
 */
export interface OverwatchShotEvent {
  /** Event type identifier */
  type: 'overwatch_shot';

  /** Unit that fired the shot */
  watcherId: string;

  /** Unit that was shot at */
  targetId: string;

  /** Whether the shot hit */
  hit: boolean;

  /** Damage dealt (0 if missed) */
  damage: number;

  /** Target's HP after shot */
  targetHpAfter: number;

  /** Watcher's remaining ammunition */
  ammoRemaining: number;

  /** Watcher's remaining overwatch shots */
  shotsRemaining: number;
}

/**
 * Overwatch blocked event for battle log.
 * Emitted when an overwatch opportunity was blocked.
 *
 * @example
 * const event: OverwatchBlockedEvent = {
 *   type: 'overwatch_blocked',
 *   watcherId: 'archer_1',
 *   targetId: 'enemy_1',
 *   reason: 'no_ammo',
 * };
 */
export interface OverwatchBlockedEvent {
  /** Event type identifier */
  type: 'overwatch_blocked';

  /** Unit that could have fired */
  watcherId: string;

  /** Unit that triggered overwatch */
  targetId: string;

  /** Reason overwatch was blocked */
  reason: OverwatchBlockReason;
}

/**
 * Overwatch exhausted event for battle log.
 * Emitted when a unit runs out of overwatch shots.
 *
 * @example
 * const event: OverwatchExhaustedEvent = {
 *   type: 'overwatch_exhausted',
 *   unitId: 'archer_1',
 *   shotsFired: 2,
 * };
 */
export interface OverwatchExhaustedEvent {
  /** Event type identifier */
  type: 'overwatch_exhausted';

  /** Unit instance ID */
  unitId: string;

  /** Total shots fired this round */
  shotsFired: number;
}

/**
 * Overwatch reset event for battle log.
 * Emitted when overwatch state is reset at turn/round end.
 *
 * @example
 * const event: OverwatchResetEvent = {
 *   type: 'overwatch_reset',
 *   unitId: 'archer_1',
 *   previousState: 'active',
 * };
 */
export interface OverwatchResetEvent {
  /** Event type identifier */
  type: 'overwatch_reset';

  /** Unit instance ID */
  unitId: string;

  /** Vigilance state before reset */
  previousState: OverwatchVigilanceState;
}

/**
 * Union type for all overwatch-related events.
 */
export type OverwatchEvent =
  | VigilanceEnteredEvent
  | OverwatchTriggeredEvent
  | OverwatchShotEvent
  | OverwatchBlockedEvent
  | OverwatchExhaustedEvent
  | OverwatchResetEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Overwatch processor interface.
 * Handles all overwatch-related mechanics including vigilance state,
 * trigger detection, shot execution, and state reset.
 *
 * Requires:
 * - intercept (Tier 2) - for movement reaction mechanics
 * - ammunition (Tier 3) - for ammo consumption
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
export interface OverwatchProcessor {
  /**
   * Checks if a unit can enter vigilance (overwatch) state.
   *
   * @param unit - Unit attempting to enter vigilance
   * @returns True if unit can enter vigilance
   *
   * @example
   * if (processor.canEnterVigilance(archer)) {
   *   // Archer can enter overwatch mode
   * }
   */
  canEnterVigilance(unit: BattleUnit & UnitWithOverwatch): boolean;

  /**
   * Checks if a unit can exit vigilance (overwatch) state.
   *
   * @param unit - Unit attempting to exit vigilance
   * @returns True if unit can exit vigilance
   *
   * @example
   * if (processor.canExitVigilance(archer)) {
   *   // Archer can exit overwatch mode
   * }
   */
  canExitVigilance(unit: BattleUnit & UnitWithOverwatch): boolean;

  /**
   * Toggles vigilance state for a unit.
   * If unit is not in vigilance, enters vigilance.
   * If unit is in vigilance, exits vigilance.
   *
   * @param unit - Unit to toggle vigilance for
   * @param state - Current battle state
   * @returns Result of toggling vigilance
   *
   * @example
   * const result = processor.toggleVigilance(archer, state);
   * if (result.success) {
   *   // Vigilance state was toggled
   * }
   */
  toggleVigilance(
    unit: BattleUnit & UnitWithOverwatch,
    state: BattleState,
  ): ToggleVigilanceResult;

  /**
   * Enters vigilance state for a unit.
   * Unit skips its attack action to enter overwatch mode.
   *
   * @param unit - Unit entering vigilance
   * @param state - Current battle state
   * @returns Result of entering vigilance
   *
   * @example
   * const result = processor.enterVigilance(archer, state);
   * if (result.success) {
   *   // Archer is now in overwatch mode
   * }
   */
  enterVigilance(
    unit: BattleUnit & UnitWithOverwatch,
    state: BattleState,
  ): EnterVigilanceResult;

  /**
   * Exits vigilance state for a unit.
   * Unit leaves overwatch mode and can act normally.
   *
   * @param unit - Unit exiting vigilance
   * @param state - Current battle state
   * @returns Result of exiting vigilance
   *
   * @example
   * const result = processor.exitVigilance(archer, state);
   * if (result.success) {
   *   // Archer is no longer in overwatch mode
   * }
   */
  exitVigilance(
    unit: BattleUnit & UnitWithOverwatch,
    state: BattleState,
  ): ExitVigilanceResult;

  /**
   * Checks if a unit is currently in vigilance state.
   *
   * @param unit - Unit to check
   * @returns True if unit is in active vigilance
   *
   * @example
   * if (processor.isVigilant(archer)) {
   *   // Archer can fire on enemy movement
   * }
   */
  isVigilant(unit: BattleUnit & UnitWithOverwatch): boolean;

  /**
   * Checks if a target is immune to overwatch.
   *
   * @param target - Unit to check for immunity
   * @returns True if target is immune to overwatch
   *
   * @example
   * if (processor.isImmuneToOverwatch(stealthUnit)) {
   *   // Stealth unit can move without triggering overwatch
   * }
   */
  isImmuneToOverwatch(target: BattleUnit & UnitWithOverwatch): boolean;

  /**
   * Checks for overwatch triggers along a movement path.
   * Returns all units that would fire and their opportunities.
   *
   * @param target - Unit that is moving
   * @param path - Movement path (array of positions)
   * @param state - Current battle state
   * @returns Overwatch check result with opportunities
   *
   * @example
   * const check = processor.checkOverwatch(enemy, path, state);
   * if (check.hasOverwatch) {
   *   // Enemy will be fired upon during movement
   * }
   */
  checkOverwatch(
    target: BattleUnit & UnitWithOverwatch,
    path: Position[],
    state: BattleState,
  ): OverwatchCheckResult;

  /**
   * Calculates overwatch damage.
   * Overwatch attacks deal reduced damage compared to normal attacks.
   *
   * @param watcher - Unit firing overwatch
   * @param target - Unit being fired upon
   * @returns Calculated damage value
   *
   * @example
   * const damage = processor.calculateOverwatchDamage(archer, enemy);
   */
  calculateOverwatchDamage(
    watcher: BattleUnit & UnitWithOverwatch,
    target: BattleUnit & UnitWithOverwatch,
  ): number;

  /**
   * Executes an overwatch shot.
   * Consumes ammunition and may deal damage to target.
   *
   * @param watcher - Unit firing overwatch
   * @param target - Unit being fired upon
   * @param state - Current battle state
   * @param seed - Random seed for hit/miss roll
   * @returns Overwatch shot result
   *
   * @example
   * const result = processor.executeOverwatchShot(archer, enemy, state, seed);
   * if (result.hit) {
   *   // Shot hit the target
   * }
   */
  executeOverwatchShot(
    watcher: BattleUnit & UnitWithOverwatch,
    target: BattleUnit & UnitWithOverwatch,
    state: BattleState,
    seed: number,
  ): OverwatchShotResult;

  /**
   * Resets overwatch state for a unit.
   * Called at turn end to clear vigilance.
   *
   * @param unit - Unit to reset
   * @returns Updated unit with reset overwatch state
   *
   * @example
   * const resetUnit = processor.resetOverwatch(archer);
   */
  resetOverwatch(
    unit: BattleUnit & UnitWithOverwatch,
  ): BattleUnit & UnitWithOverwatch;

  /**
   * Resets overwatch shots for a unit at round start.
   * Restores shot count but maintains vigilance state.
   *
   * @param unit - Unit to reset shots for
   * @returns Updated unit with reset shot count
   *
   * @example
   * const updatedUnit = processor.resetOverwatchShots(archer);
   */
  resetOverwatchShots(
    unit: BattleUnit & UnitWithOverwatch,
  ): BattleUnit & UnitWithOverwatch;

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
   *
   * @example
   * const newState = processor.apply('movement', state, {
   *   activeUnit: enemy,
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
 * Options for creating an overwatch processor with custom settings.
 *
 * @example
 * const options: OverwatchProcessorOptions = {
 *   damageModifier: 0.5, // 50% damage for overwatch
 *   maxShots: 3, // 3 shots per round
 * };
 */
export interface OverwatchProcessorOptions {
  /** Custom damage modifier for overwatch attacks (default: 0.75) */
  damageModifier?: number;

  /** Custom maximum shots per round (default: 2) */
  maxShots?: number;

  /** Custom accuracy penalty for overwatch (default: 0.2) */
  accuracyPenalty?: number;

  /** Custom tags for overwatch capability */
  overwatchTags?: string[];

  /** Custom tags for overwatch immunity */
  immunityTags?: string[];
}

/**
 * Context for overwatch calculation.
 * Contains all information needed to determine overwatch outcome.
 */
export interface OverwatchContext {
  /** Unit in overwatch mode */
  watcher: BattleUnit & UnitWithOverwatch;

  /** Unit that triggered overwatch */
  target: BattleUnit & UnitWithOverwatch;

  /** Position where overwatch was triggered */
  triggerPosition: Position;

  /** Random seed for deterministic calculations */
  seed: number;
}

/**
 * Full overwatch check result with all details.
 * Used for detailed logging and debugging.
 */
export interface OverwatchFullResult {
  /** Overwatch check result */
  check: OverwatchCheckResult;

  /** Shot results for each overwatch opportunity */
  shots: OverwatchShotResult[];

  /** Events generated by this overwatch check */
  events: OverwatchEvent[];

  /** Final battle state after all overwatch shots */
  finalState: BattleState;
}

/**
 * Movement action with path for overwatch checking.
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
 * Vigilance action for entering overwatch.
 */
export interface VigilanceAction {
  /** Action type */
  type: 'vigilance';

  /** Unit entering vigilance */
  unitId: string;
}

/**
 * Union type for actions relevant to overwatch mechanic.
 */
export type OverwatchRelevantAction = MoveAction | VigilanceAction;
