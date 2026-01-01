/**
 * Tier 1: Engagement (Zone of Control) - Type Definitions
 *
 * Defines types for the engagement/Zone of Control system which controls
 * how units interact when in close proximity. Engaged units are locked
 * in combat and suffer penalties when trying to disengage or use ranged attacks.
 *
 * Key concepts:
 * - Zone of Control (ZoC): Adjacent cells around a melee unit
 * - Engagement: When an enemy enters a unit's ZoC
 * - Attack of Opportunity: Free attack when enemy leaves ZoC
 * - Archer Penalty: Ranged units suffer accuracy penalty when engaged
 *
 * @module core/mechanics/tier1/engagement
 */

import type { EngagementConfig } from '../../config/mechanics.types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// ENGAGEMENT STATE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Engagement status for a unit.
 *
 * - free: Unit is not engaged with any enemy
 * - engaged: Unit is in Zone of Control of one or more enemies
 * - pinned: Unit is engaged by multiple enemies (harder to disengage)
 *
 * @example
 * const status = processor.getEngagementStatus(unit, state);
 * if (status === 'engaged') {
 *   // Apply archer penalty if ranged unit
 * }
 */
export type EngagementStatus = 'free' | 'engaged' | 'pinned';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the engagement system.
 * These properties are added to BattleUnit when engagement mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithEngagement {}
 *
 * const unit: MyBattleUnit = {
 *   ...baseUnit,
 *   engaged: true,
 *   engagedBy: ['enemy_1', 'enemy_2'],
 *   hasZoneOfControl: true,
 * };
 */
export interface UnitWithEngagement {
  /** Whether unit is currently engaged in melee combat */
  engaged?: boolean;

  /** List of unit IDs that are engaging this unit */
  engagedBy?: string[];

  /** Whether this unit projects a Zone of Control */
  hasZoneOfControl?: boolean;

  /** Whether unit is a ranged type (for archer penalty) */
  isRanged?: boolean;

  /** Whether unit used Attack of Opportunity this turn */
  usedAttackOfOpportunity?: boolean;

  /**
   * Damage multiplier from archer penalty when engaged.
   * Set during pre_attack phase for ranged units in melee.
   * Value of 1.0 means no penalty, 0.5 means 50% damage.
   */
  archerPenaltyModifier?: number;
}

// ═══════════════════════════════════════════════════════════════
// ZONE OF CONTROL TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Zone of Control information for a unit.
 * Contains the cells that are within the unit's ZoC.
 *
 * @example
 * const zoc = processor.getZoneOfControl(unit);
 * if (zoc.cells.some(c => c.x === target.x && c.y === target.y)) {
 *   // Target is in unit's Zone of Control
 * }
 */
export interface ZoneOfControl {
  /** Unit that owns this Zone of Control */
  unitId: string;

  /** Cells within the Zone of Control (adjacent cells) */
  cells: Position[];

  /** Whether ZoC is currently active */
  active: boolean;
}

/**
 * Result of checking Zone of Control for a position.
 *
 * @example
 * const check = processor.checkZoneOfControl(position, state);
 * if (check.inZoC) {
 *   console.log(`Position is in ZoC of: ${check.controllingUnits.join(', ')}`);
 * }
 */
export interface ZoCCheckResult {
  /** Whether the position is in any unit's Zone of Control */
  inZoC: boolean;

  /** IDs of units whose ZoC covers this position */
  controllingUnits: string[];

  /** Whether moving through this position triggers Attack of Opportunity */
  triggersAoO: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ATTACK OF OPPORTUNITY TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Attack of Opportunity trigger information.
 *
 * @example
 * const trigger: AoOTrigger = {
 *   type: 'leave_zoc',
 *   attacker: engagingUnit,
 *   target: movingUnit,
 *   fromPosition: { x: 3, y: 4 },
 *   toPosition: { x: 4, y: 4 },
 * };
 */
export interface AoOTrigger {
  /** Type of trigger that caused the Attack of Opportunity */
  type: 'leave_zoc' | 'move_through_zoc';

  /** Unit that gets the free attack */
  attacker: BattleUnit;

  /** Unit that triggered the Attack of Opportunity */
  target: BattleUnit;

  /** Position the target is moving from */
  fromPosition: Position;

  /** Position the target is moving to */
  toPosition: Position;
}

/**
 * Result of an Attack of Opportunity.
 *
 * @example
 * const result = processor.executeAttackOfOpportunity(trigger, state, seed);
 * if (result.hit) {
 *   console.log(`AoO dealt ${result.damage} damage`);
 * }
 */
export interface AoOResult {
  /** Whether the attack hit */
  hit: boolean;

  /** Damage dealt (0 if missed) */
  damage: number;

  /** Whether the target's movement was interrupted */
  movementInterrupted: boolean;

  /** Updated battle state after AoO */
  state: BattleState;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Engagement event when a unit becomes engaged.
 *
 * @example
 * const event: EngagementEvent = {
 *   type: 'engagement',
 *   unitId: 'unit_1',
 *   engagedBy: 'enemy_1',
 *   status: 'engaged',
 * };
 */
export interface EngagementEvent {
  /** Event type identifier */
  type: 'engagement';

  /** Unit that became engaged */
  unitId: string;

  /** Unit that caused the engagement */
  engagedBy: string;

  /** New engagement status */
  status: EngagementStatus;
}

/**
 * Disengagement event when a unit breaks free from engagement.
 *
 * @example
 * const event: DisengagementEvent = {
 *   type: 'disengagement',
 *   unitId: 'unit_1',
 *   from: 'enemy_1',
 *   triggeredAoO: true,
 * };
 */
export interface DisengagementEvent {
  /** Event type identifier */
  type: 'disengagement';

  /** Unit that disengaged */
  unitId: string;

  /** Unit that was disengaged from */
  from: string;

  /** Whether disengagement triggered Attack of Opportunity */
  triggeredAoO: boolean;
}

/**
 * Attack of Opportunity event.
 *
 * @example
 * const event: AttackOfOpportunityEvent = {
 *   type: 'attack_of_opportunity',
 *   attackerId: 'enemy_1',
 *   targetId: 'unit_1',
 *   hit: true,
 *   damage: 15,
 * };
 */
export interface AttackOfOpportunityEvent {
  /** Event type identifier */
  type: 'attack_of_opportunity';

  /** Unit that performed the Attack of Opportunity */
  attackerId: string;

  /** Unit that was attacked */
  targetId: string;

  /** Whether the attack hit */
  hit: boolean;

  /** Damage dealt */
  damage: number;
}

/**
 * Archer penalty event when ranged unit attacks while engaged.
 *
 * @example
 * const event: ArcherPenaltyEvent = {
 *   type: 'archer_penalty',
 *   unitId: 'archer_1',
 *   penaltyPercent: 0.5,
 *   engagedBy: ['enemy_1'],
 * };
 */
export interface ArcherPenaltyEvent {
  /** Event type identifier */
  type: 'archer_penalty';

  /** Ranged unit suffering the penalty */
  unitId: string;

  /** Penalty percentage applied */
  penaltyPercent: number;

  /** Units engaging the archer */
  engagedBy: string[];
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Engagement processor interface.
 * Handles all engagement-related mechanics including Zone of Control,
 * Attack of Opportunity, and archer penalties.
 *
 * @example
 * const processor = createEngagementProcessor(config);
 *
 * // Check if unit is engaged
 * const status = processor.getEngagementStatus(unit, state);
 *
 * // Get Zone of Control cells
 * const zoc = processor.getZoneOfControl(unit);
 *
 * // Check for Attack of Opportunity
 * const aoo = processor.checkAttackOfOpportunity(unit, fromPos, toPos, state);
 */
export interface EngagementProcessor {
  /**
   * Gets the engagement status of a unit.
   * Checks if unit is in any enemy's Zone of Control.
   *
   * @param unit - Unit to check engagement for
   * @param state - Current battle state
   * @returns Engagement status (free, engaged, or pinned)
   *
   * @example
   * const status = processor.getEngagementStatus(unit, state);
   * if (status === 'pinned') {
   *   // Unit is engaged by multiple enemies
   * }
   */
  getEngagementStatus(
    unit: BattleUnit & UnitWithEngagement,
    state: BattleState,
  ): EngagementStatus;

  /**
   * Gets the Zone of Control for a unit.
   * Returns adjacent cells that the unit controls.
   *
   * @param unit - Unit to get ZoC for
   * @returns Zone of Control information
   *
   * @example
   * const zoc = processor.getZoneOfControl(unit);
   * console.log(`Unit controls ${zoc.cells.length} cells`);
   */
  getZoneOfControl(unit: BattleUnit & UnitWithEngagement): ZoneOfControl;

  /**
   * Checks if a position is in any unit's Zone of Control.
   *
   * @param position - Position to check
   * @param state - Current battle state
   * @param excludeUnitId - Optional unit ID to exclude from check
   * @returns ZoC check result
   *
   * @example
   * const check = processor.checkZoneOfControl(targetPos, state);
   * if (check.triggersAoO) {
   *   // Moving here will trigger Attack of Opportunity
   * }
   */
  checkZoneOfControl(
    position: Position,
    state: BattleState,
    excludeUnitId?: string,
  ): ZoCCheckResult;

  /**
   * Checks if movement triggers Attack of Opportunity.
   *
   * @param unit - Unit that is moving
   * @param fromPosition - Starting position
   * @param toPosition - Target position
   * @param state - Current battle state
   * @returns Array of AoO triggers (empty if none)
   *
   * @example
   * const triggers = processor.checkAttackOfOpportunity(unit, from, to, state);
   * for (const trigger of triggers) {
   *   const result = processor.executeAttackOfOpportunity(trigger, state, seed);
   * }
   */
  checkAttackOfOpportunity(
    unit: BattleUnit & UnitWithEngagement,
    fromPosition: Position,
    toPosition: Position,
    state: BattleState,
  ): AoOTrigger[];

  /**
   * Executes an Attack of Opportunity.
   *
   * @param trigger - AoO trigger information
   * @param state - Current battle state
   * @param seed - Random seed for determinism
   * @returns AoO result with updated state
   *
   * @example
   * const result = processor.executeAttackOfOpportunity(trigger, state, seed);
   * if (result.movementInterrupted) {
   *   // Target's movement was stopped
   * }
   */
  executeAttackOfOpportunity(
    trigger: AoOTrigger,
    state: BattleState,
    seed: number,
  ): AoOResult;

  /**
   * Calculates archer penalty when engaged.
   * Returns damage multiplier (1.0 = no penalty, 0.5 = 50% damage).
   *
   * @param unit - Ranged unit to check
   * @param state - Current battle state
   * @param config - Engagement configuration
   * @returns Damage multiplier (0.0 to 1.0)
   *
   * @example
   * const multiplier = processor.getArcherPenalty(archer, state, config);
   * const finalDamage = baseDamage * multiplier;
   */
  getArcherPenalty(
    unit: BattleUnit & UnitWithEngagement,
    state: BattleState,
    config: EngagementConfig,
  ): number;

  /**
   * Updates engagement status for all units.
   * Should be called after movement to recalculate engagements.
   *
   * @param state - Current battle state
   * @returns Updated battle state with engagement info
   *
   * @example
   * const newState = processor.updateEngagements(state);
   */
  updateEngagements(state: BattleState): BattleState;

  /**
   * Apply engagement logic for a battle phase.
   *
   * Phase behaviors:
   * - movement: Check for ZoC entry/exit, trigger AoO
   * - pre_attack: Apply archer penalty if engaged
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('movement', state, {
   *   activeUnit: unit,
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
 * Options for calculating engagement.
 */
export interface EngagementOptions {
  /** Whether to include diagonal cells in ZoC */
  includeDiagonals?: boolean;

  /** Minimum range for ZoC (default: 1) */
  minRange?: number;

  /** Maximum range for ZoC (default: 1) */
  maxRange?: number;
}

/**
 * Result of updating engagements.
 */
export interface EngagementUpdateResult {
  /** Updated battle state */
  state: BattleState;

  /** New engagements formed */
  newEngagements: EngagementEvent[];

  /** Engagements broken */
  brokenEngagements: DisengagementEvent[];
}
