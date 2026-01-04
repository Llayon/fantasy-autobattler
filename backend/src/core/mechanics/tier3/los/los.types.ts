/**
 * Tier 3: Line of Sight (LoS) - Type Definitions
 *
 * Defines types for the Line of Sight system which controls ranged attack
 * validation. LoS determines whether a ranged unit can target an enemy
 * based on obstacles and firing mode.
 *
 * Line of Sight requires the facing mechanic (Tier 0) to be enabled,
 * as firing arcs depend on unit facing direction.
 *
 * Key mechanics:
 * - Direct Fire: Straight-line attacks blocked by units/obstacles
 * - Arc Fire: Lobbed attacks that ignore obstacles but have accuracy penalty
 * - Firing Arc: Units can only fire within their facing arc
 * - LoS Validation: Ranged attacks must pass LoS check before execution
 * - Bresenham Algorithm: Used for precise line-of-sight calculation
 *
 * @module core/mechanics/tier3/los
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import type { LoSConfig } from '../../config/mechanics.types';
import type { FacingDirection } from '../../tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// LINE OF SIGHT CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default accuracy penalty for arc fire attacks.
 * Arc fire ignores obstacles but is less accurate.
 * 0.2 = 20% accuracy penalty.
 *
 * @example
 * // With default config:
 * // Direct fire: 100% accuracy
 * // Arc fire: 80% accuracy (100% - 20% penalty)
 */
export const DEFAULT_ARC_FIRE_PENALTY = 0.2;

/**
 * Default firing arc angle in degrees.
 * Units can only fire at targets within this angle of their facing.
 * 90 = 90° arc (45° on each side of facing direction).
 */
export const DEFAULT_FIRING_ARC_ANGLE = 90;

/**
 * Tag that identifies units capable of arc fire (artillery, mages).
 */
export const ARC_FIRE_TAG = 'arc_fire';

/**
 * Tag that identifies units with extended firing arc.
 */
export const WIDE_ARC_TAG = 'wide_arc';

/**
 * Tag that identifies units that block line of sight.
 * Large units or structures may block LoS for other units.
 */
export const LOS_BLOCKING_TAG = 'los_blocking';

/**
 * Tag that identifies units that do not block line of sight.
 * Small or incorporeal units may not block LoS.
 */
export const LOS_TRANSPARENT_TAG = 'los_transparent';

/**
 * Tag that identifies units with enhanced LoS (can see through obstacles).
 */
export const ENHANCED_LOS_TAG = 'true_sight';

// ═══════════════════════════════════════════════════════════════
// FIRE MODE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Fire mode for ranged attacks.
 *
 * - direct: Straight-line attack, blocked by units/obstacles
 * - arc: Lobbed attack, ignores obstacles but has accuracy penalty
 * - auto: Automatically choose best mode based on LoS
 */
export type FireMode = 'direct' | 'arc' | 'auto';

/**
 * Result of fire mode selection.
 *
 * - direct: Direct fire is possible and selected
 * - arc: Arc fire is required (direct blocked) or preferred
 * - blocked: No valid fire mode available
 */
export type FireModeResult = 'direct' | 'arc' | 'blocked';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the Line of Sight system.
 * These properties are added to BattleUnit when LoS mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithLoS {}
 *
 * const archer: MyBattleUnit = {
 *   ...baseUnit,
 *   canArcFire: false,
 *   firingArc: 90,
 *   blocksLoS: true,
 *   facing: 'N',
 *   range: 6,
 *   tags: ['ranged'],
 * };
 */
export interface UnitWithLoS {
  /**
   * Whether unit is capable of arc fire.
   * Typically true for artillery and some mages.
   */
  canArcFire?: boolean;

  /**
   * Unit's firing arc in degrees.
   * Targets must be within this angle of facing to be valid.
   * Default: 90° (45° on each side).
   */
  firingArc?: number;

  /**
   * Whether this unit blocks line of sight for other units.
   * Large units and structures typically block LoS.
   * Default: true for most units.
   */
  blocksLoS?: boolean;

  /**
   * Whether this unit can see through obstacles (true sight).
   * Rare ability that ignores LoS blocking.
   */
  hasTrueSight?: boolean;

  /**
   * Unit's current facing direction.
   * Required for firing arc calculation.
   */
  facing?: FacingDirection;

  /**
   * Unit's current position on the grid.
   */
  position?: Position;

  /**
   * Unit's attack range in cells.
   */
  range?: number;

  /**
   * Unit tags for LoS capability determination.
   */
  tags?: string[];

  /**
   * Preferred fire mode for this unit.
   * 'auto' will choose based on LoS availability.
   */
  preferredFireMode?: FireMode;
}

// ═══════════════════════════════════════════════════════════════
// LINE OF SIGHT CHECK TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Information about an obstacle blocking line of sight.
 *
 * @example
 * const obstacle: LoSObstacle = {
 *   position: { x: 3, y: 4 },
 *   type: 'unit',
 *   unitId: 'infantry_1',
 *   blocksCompletely: true,
 * };
 */
export interface LoSObstacle {
  /** Position of the obstacle */
  position: Position;

  /** Type of obstacle */
  type: LoSObstacleType;

  /** Unit ID if obstacle is a unit */
  unitId?: string;

  /** Whether obstacle completely blocks LoS */
  blocksCompletely: boolean;

  /** Cover value if obstacle provides partial cover (0.0-1.0) */
  coverValue?: number;
}

/**
 * Types of obstacles that can block line of sight.
 *
 * - unit: Another unit on the battlefield
 * - terrain: Terrain feature (wall, rock, etc.)
 * - structure: Building or fortification
 */
export type LoSObstacleType = 'unit' | 'terrain' | 'structure';

/**
 * Result of a line of sight check.
 *
 * @example
 * const result: LoSCheckResult = {
 *   hasLoS: true,
 *   directLoS: false,
 *   arcLoS: true,
 *   obstacles: [obstacle1],
 *   recommendedMode: 'arc',
 *   distance: 5,
 * };
 */
export interface LoSCheckResult {
  /** Whether any valid LoS exists (direct or arc) */
  hasLoS: boolean;

  /** Whether direct fire LoS is available */
  directLoS: boolean;

  /** Whether arc fire LoS is available */
  arcLoS: boolean;

  /** Obstacles blocking direct LoS */
  obstacles: LoSObstacle[];

  /** Recommended fire mode based on LoS */
  recommendedMode: FireModeResult;

  /** Distance from attacker to target in cells */
  distance: number;

  /** Whether target is within firing arc */
  inFiringArc: boolean;

  /** Reason if LoS is blocked */
  blockReason?: LoSBlockReason;
}

/**
 * Reasons why line of sight might be blocked.
 *
 * - out_of_range: Target is beyond attack range
 * - out_of_arc: Target is outside firing arc
 * - blocked_by_unit: Another unit blocks direct LoS
 * - blocked_by_terrain: Terrain blocks direct LoS
 * - no_arc_fire: Arc fire not available and direct blocked
 * - disabled: LoS mechanic disabled for this unit
 */
export type LoSBlockReason =
  | 'out_of_range'
  | 'out_of_arc'
  | 'blocked_by_unit'
  | 'blocked_by_terrain'
  | 'no_arc_fire'
  | 'disabled';

/**
 * Result of validating a ranged attack.
 *
 * @example
 * const validation: LoSValidationResult = {
 *   valid: true,
 *   fireMode: 'arc',
 *   accuracyModifier: 0.8,
 *   losCheck: checkResult,
 * };
 */
export interface LoSValidationResult {
  /** Whether the attack is valid */
  valid: boolean;

  /** Fire mode to use for the attack */
  fireMode: FireModeResult;

  /** Accuracy modifier based on fire mode (1.0 for direct, reduced for arc) */
  accuracyModifier: number;

  /** Full LoS check result */
  losCheck: LoSCheckResult;

  /** Reason if attack is invalid */
  reason?: LoSBlockReason;
}

// ═══════════════════════════════════════════════════════════════
// FIRING ARC TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of checking if a target is within firing arc.
 *
 * @example
 * const arcCheck: FiringArcResult = {
 *   inArc: true,
 *   angle: 30,
 *   arcLimit: 45,
 *   relativeDirection: 'front',
 * };
 */
export interface FiringArcResult {
  /** Whether target is within firing arc */
  inArc: boolean;

  /** Angle from facing direction to target (0-180°) */
  angle: number;

  /** Maximum angle allowed by firing arc (half of total arc) */
  arcLimit: number;

  /** Relative direction to target */
  relativeDirection: 'front' | 'side' | 'rear';
}

// ═══════════════════════════════════════════════════════════════
// BRESENHAM LINE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * A cell along the line of sight path.
 *
 * @example
 * const cell: LoSCell = {
 *   position: { x: 2, y: 3 },
 *   distanceFromStart: 2,
 *   isEndpoint: false,
 * };
 */
export interface LoSCell {
  /** Position of this cell */
  position: Position;

  /** Distance from the starting position */
  distanceFromStart: number;

  /** Whether this is the start or end position */
  isEndpoint: boolean;
}

/**
 * Result of calculating a line between two points.
 *
 * @example
 * const line: LoSLine = {
 *   cells: [cell1, cell2, cell3],
 *   start: { x: 0, y: 0 },
 *   end: { x: 3, y: 2 },
 *   length: 3,
 * };
 */
export interface LoSLine {
  /** All cells along the line (including start and end) */
  cells: LoSCell[];

  /** Starting position */
  start: Position;

  /** Ending position */
  end: Position;

  /** Total length of the line in cells */
  length: number;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * LoS check performed event for battle log.
 * Emitted when a ranged attack LoS is validated.
 *
 * @example
 * const event: LoSCheckEvent = {
 *   type: 'los_check',
 *   attackerId: 'archer_1',
 *   targetId: 'enemy_1',
 *   hasLoS: true,
 *   fireMode: 'direct',
 *   distance: 4,
 * };
 */
export interface LoSCheckEvent {
  /** Event type identifier */
  type: 'los_check';

  /** Unit performing the ranged attack */
  attackerId: string;

  /** Target unit */
  targetId: string;

  /** Whether LoS was available */
  hasLoS: boolean;

  /** Fire mode used */
  fireMode: FireModeResult;

  /** Distance to target */
  distance: number;

  /** Obstacles encountered (if any) */
  obstacles?: string[];
}

/**
 * LoS blocked event for battle log.
 * Emitted when a ranged attack is blocked due to LoS.
 *
 * @example
 * const event: LoSBlockedEvent = {
 *   type: 'los_blocked',
 *   attackerId: 'archer_1',
 *   targetId: 'enemy_1',
 *   reason: 'blocked_by_unit',
 *   blockingUnitId: 'infantry_1',
 * };
 */
export interface LoSBlockedEvent {
  /** Event type identifier */
  type: 'los_blocked';

  /** Unit that attempted the attack */
  attackerId: string;

  /** Intended target */
  targetId: string;

  /** Reason LoS was blocked */
  reason: LoSBlockReason;

  /** ID of unit blocking LoS (if applicable) */
  blockingUnitId?: string;

  /** Position of blocking obstacle (if applicable) */
  blockingPosition?: Position;
}

/**
 * Arc fire used event for battle log.
 * Emitted when arc fire is used instead of direct fire.
 *
 * @example
 * const event: ArcFireUsedEvent = {
 *   type: 'arc_fire_used',
 *   attackerId: 'artillery_1',
 *   targetId: 'enemy_1',
 *   accuracyPenalty: 0.2,
 *   obstaclesIgnored: 2,
 * };
 */
export interface ArcFireUsedEvent {
  /** Event type identifier */
  type: 'arc_fire_used';

  /** Unit using arc fire */
  attackerId: string;

  /** Target unit */
  targetId: string;

  /** Accuracy penalty applied */
  accuracyPenalty: number;

  /** Number of obstacles ignored by arc fire */
  obstaclesIgnored: number;
}

/**
 * Firing arc violation event for battle log.
 * Emitted when a target is outside the unit's firing arc.
 *
 * @example
 * const event: FiringArcViolationEvent = {
 *   type: 'firing_arc_violation',
 *   attackerId: 'archer_1',
 *   targetId: 'enemy_1',
 *   angle: 60,
 *   arcLimit: 45,
 * };
 */
export interface FiringArcViolationEvent {
  /** Event type identifier */
  type: 'firing_arc_violation';

  /** Unit that attempted the attack */
  attackerId: string;

  /** Intended target */
  targetId: string;

  /** Angle from facing to target */
  angle: number;

  /** Maximum allowed angle */
  arcLimit: number;

  /** Unit's current facing direction */
  facing: FacingDirection;
}

/**
 * Union type for all LoS-related events.
 */
export type LoSEvent =
  | LoSCheckEvent
  | LoSBlockedEvent
  | ArcFireUsedEvent
  | FiringArcViolationEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Line of Sight processor interface.
 * Handles all LoS-related mechanics including line calculation,
 * obstacle detection, firing arc validation, and attack validation.
 *
 * Requires: facing (Tier 0) - for firing arc calculation
 *
 * @example
 * const processor = createLoSProcessor(config);
 *
 * // Check LoS between two units
 * const losCheck = processor.checkLoS(archer, enemy, state);
 *
 * // Validate a ranged attack
 * const validation = processor.validateRangedAttack(archer, enemy, state, config);
 *
 * // Calculate line between positions
 * const line = processor.getLineOfSight(start, end);
 */
export interface LoSProcessor {
  /**
   * Calculates the line of sight path between two positions.
   * Uses Bresenham's line algorithm for precise cell enumeration.
   *
   * @param start - Starting position
   * @param end - Ending position
   * @returns Line of sight path with all cells
   *
   * @example
   * const line = processor.getLineOfSight({ x: 0, y: 0 }, { x: 5, y: 3 });
   * // Returns all cells the line passes through
   */
  getLineOfSight(start: Position, end: Position): LoSLine;

  /**
   * Checks if a position is blocked by an obstacle.
   *
   * @param position - Position to check
   * @param state - Current battle state
   * @param excludeUnitId - Unit ID to exclude from blocking check (usually attacker)
   * @returns Obstacle information if blocked, undefined if clear
   *
   * @example
   * const obstacle = processor.isBlocked({ x: 3, y: 4 }, state, 'archer_1');
   * if (obstacle) {
   *   // Position is blocked
   * }
   */
  isBlocked(
    position: Position,
    state: BattleState,
    excludeUnitId?: string,
  ): LoSObstacle | undefined;

  /**
   * Checks line of sight between attacker and target.
   * Evaluates both direct and arc fire possibilities.
   *
   * @param attacker - Unit performing the attack
   * @param target - Target unit
   * @param state - Current battle state
   * @returns Complete LoS check result
   *
   * @example
   * const check = processor.checkLoS(archer, enemy, state);
   * if (check.hasLoS) {
   *   // Attack is possible
   * }
   */
  checkLoS(
    attacker: BattleUnit & UnitWithLoS,
    target: BattleUnit & UnitWithLoS,
    state: BattleState,
  ): LoSCheckResult;

  /**
   * Checks if target is within attacker's firing arc.
   *
   * @param attacker - Unit performing the attack
   * @param target - Target unit
   * @returns Firing arc check result
   *
   * @example
   * const arcCheck = processor.checkFiringArc(archer, enemy);
   * if (!arcCheck.inArc) {
   *   // Target is outside firing arc
   * }
   */
  checkFiringArc(
    attacker: BattleUnit & UnitWithLoS,
    target: BattleUnit & UnitWithLoS,
  ): FiringArcResult;

  /**
   * Validates a ranged attack considering LoS, range, and firing arc.
   *
   * @param attacker - Unit performing the attack
   * @param target - Target unit
   * @param state - Current battle state
   * @param config - LoS configuration
   * @returns Validation result with fire mode and accuracy modifier
   *
   * @example
   * const validation = processor.validateRangedAttack(archer, enemy, state, config);
   * if (validation.valid) {
   *   // Apply accuracy modifier and execute attack
   *   const finalAccuracy = baseAccuracy * validation.accuracyModifier;
   * }
   */
  validateRangedAttack(
    attacker: BattleUnit & UnitWithLoS,
    target: BattleUnit & UnitWithLoS,
    state: BattleState,
    config: LoSConfig,
  ): LoSValidationResult;

  /**
   * Gets the accuracy modifier for a fire mode.
   *
   * @param fireMode - Fire mode being used
   * @param config - LoS configuration
   * @returns Accuracy modifier (1.0 for direct, reduced for arc)
   *
   * @example
   * const modifier = processor.getAccuracyModifier('arc', config);
   * // Returns 0.8 with default 20% arc fire penalty
   */
  getAccuracyModifier(fireMode: FireModeResult, config: LoSConfig): number;

  /**
   * Finds all valid targets within range and LoS.
   *
   * @param attacker - Unit looking for targets
   * @param state - Current battle state
   * @param config - LoS configuration
   * @returns Array of valid targets with their LoS check results
   *
   * @example
   * const targets = processor.findValidTargets(archer, state, config);
   * // Returns all enemies that can be attacked
   */
  findValidTargets(
    attacker: BattleUnit & UnitWithLoS,
    state: BattleState,
    config: LoSConfig,
  ): Array<{ target: BattleUnit & UnitWithLoS; losCheck: LoSCheckResult }>;

  /**
   * Apply LoS logic for a battle phase.
   *
   * Phase behaviors:
   * - pre_attack: Validate LoS for ranged attacks, determine fire mode
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('pre_attack', state, {
   *   activeUnit: archer,
   *   target: enemy,
   *   action: { type: 'attack', targetId: enemy.instanceId },
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
 * Options for creating a LoS processor with custom settings.
 *
 * @example
 * const options: LoSProcessorOptions = {
 *   defaultFiringArc: 120, // Wider firing arc
 *   arcFirePenalty: 0.3, // Higher penalty for arc fire
 * };
 */
export interface LoSProcessorOptions {
  /** Default firing arc angle in degrees (default: 90) */
  defaultFiringArc?: number;

  /** Custom arc fire accuracy penalty (default: 0.2) */
  arcFirePenalty?: number;

  /** Custom tags for arc fire capability */
  arcFireTags?: string[];

  /** Custom tags for LoS blocking */
  losBlockingTags?: string[];

  /** Custom tags for LoS transparency */
  losTransparentTags?: string[];
}

/**
 * Context for LoS calculation.
 * Contains all information needed to determine LoS outcome.
 */
export interface LoSContext {
  /** Unit performing the attack */
  attacker: BattleUnit & UnitWithLoS;

  /** Target unit */
  target: BattleUnit & UnitWithLoS;

  /** All units in battle */
  allUnits: (BattleUnit & UnitWithLoS)[];

  /** LoS configuration */
  config: LoSConfig;
}

/**
 * Full LoS check result with all details.
 * Used for detailed logging and debugging.
 */
export interface LoSFullResult {
  /** LoS check result */
  losCheck: LoSCheckResult;

  /** Firing arc check result */
  arcCheck: FiringArcResult;

  /** Validation result */
  validation: LoSValidationResult;

  /** Line of sight path */
  line: LoSLine;

  /** Events generated by this LoS check */
  events: LoSEvent[];
}

/**
 * Attack action for LoS validation.
 */
export interface RangedAttackAction {
  /** Action type */
  type: 'attack';

  /** Target unit ID */
  targetId: string;

  /** Preferred fire mode (optional) */
  fireMode?: FireMode;

  /** Whether this is a ranged attack */
  isRanged: boolean;
}

