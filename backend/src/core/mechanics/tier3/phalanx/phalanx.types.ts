/**
 * Tier 3: Phalanx (Formation) - Type Definitions
 *
 * Defines types for the phalanx system which provides defensive bonuses
 * to units in tight formations. Units gain armor and resolve bonuses
 * based on the number of adjacent allies facing the same direction.
 *
 * Phalanx requires the facing mechanic (Tier 0) to be enabled,
 * as formation alignment depends on unit facing direction.
 *
 * Key mechanics:
 * - Formation detection: Units with adjacent allies facing same direction
 * - Armor bonus: Increased defense based on formation depth
 * - Resolve bonus: Increased morale from formation cohesion
 * - Recalculation: Bonuses update after casualties
 * - Contagion vulnerability: Dense formations spread effects faster
 *
 * @module core/mechanics/tier3/phalanx
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import type { PhalanxConfig } from '../../config/mechanics.types';
import type { FacingDirection } from '../../tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// PHALANX CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default maximum armor bonus from formation.
 * Caps the total armor bonus regardless of adjacent allies.
 */
export const DEFAULT_MAX_ARMOR_BONUS = 5;

/**
 * Default maximum resolve bonus from formation.
 * Caps the total resolve bonus regardless of adjacent allies.
 */
export const DEFAULT_MAX_RESOLVE_BONUS = 25;

/**
 * Default armor bonus per adjacent ally in formation.
 */
export const DEFAULT_ARMOR_PER_ALLY = 1;

/**
 * Default resolve bonus per adjacent ally in formation.
 */
export const DEFAULT_RESOLVE_PER_ALLY = 5;

/**
 * Maximum number of adjacent allies that can contribute to formation.
 * In a grid, a unit can have at most 4 orthogonal neighbors.
 */
export const MAX_ADJACENT_ALLIES = 4;

/**
 * Tag that identifies units capable of forming phalanx.
 * Typically infantry units with shields.
 */
export const PHALANX_TAG = 'phalanx';

/**
 * Tag that identifies units with enhanced phalanx capability.
 * Elite units may provide additional bonuses.
 */
export const ELITE_PHALANX_TAG = 'elite_phalanx';

/**
 * Tag that identifies units that cannot join formations.
 * Cavalry and large units typically cannot form phalanx.
 */
export const PHALANX_IMMUNE_TAG = 'no_phalanx';

// ═══════════════════════════════════════════════════════════════
// FORMATION STATE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Phalanx formation state for units.
 *
 * - none: Unit is not in any formation
 * - partial: Unit has some adjacent allies but not optimal formation
 * - full: Unit has maximum adjacent allies in formation
 */
export type PhalanxFormationState = 'none' | 'partial' | 'full';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the phalanx system.
 * These properties are added to BattleUnit when phalanx mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithPhalanx {}
 *
 * const spearman: MyBattleUnit = {
 *   ...baseUnit,
 *   canFormPhalanx: true,
 *   inPhalanx: true,
 *   phalanxState: 'partial',
 *   adjacentAlliesCount: 2,
 *   phalanxArmorBonus: 2,
 *   phalanxResolveBonus: 10,
 *   facing: 'N',
 *   tags: ['phalanx', 'infantry'],
 * };
 */
export interface UnitWithPhalanx {
  /**
   * Whether unit is capable of forming phalanx.
   * Typically true for infantry units with 'phalanx' tag.
   */
  canFormPhalanx?: boolean;

  /**
   * Whether unit is currently in a phalanx formation.
   * True when unit has at least one adjacent ally facing same direction.
   */
  inPhalanx?: boolean;

  /**
   * Current phalanx formation state.
   * Indicates formation quality (none/partial/full).
   */
  phalanxState?: PhalanxFormationState;

  /**
   * Number of adjacent allies in formation.
   * Used for bonus calculation.
   */
  adjacentAlliesCount?: number;

  /**
   * IDs of adjacent allies contributing to formation.
   */
  adjacentAllyIds?: string[];

  /**
   * Current armor bonus from phalanx formation.
   * Calculated as: min(maxArmorBonus, adjacentAlliesCount * armorPerAlly)
   */
  phalanxArmorBonus?: number;

  /**
   * Current resolve bonus from phalanx formation.
   * Calculated as: min(maxResolveBonus, adjacentAlliesCount * resolvePerAlly)
   */
  phalanxResolveBonus?: number;

  /**
   * Base armor value (before phalanx bonus).
   */
  baseArmor?: number;

  /**
   * Base resolve value (before phalanx bonus).
   */
  baseResolve?: number;

  /**
   * Unit's current facing direction.
   * Required for formation alignment check.
   */
  facing?: FacingDirection;

  /**
   * Unit's current position on the grid.
   */
  position?: Position;

  /**
   * Unit tags for phalanx capability determination.
   */
  tags?: string[];

  /**
   * Unit's team identifier for ally detection.
   */
  team?: number;

  /**
   * Unit's current HP (for alive check).
   */
  currentHp?: number;

  /**
   * Unit's armor stat (modified by phalanx bonus).
   */
  armor?: number;

  /**
   * Unit's resolve stat (modified by phalanx bonus).
   */
  resolve?: number;
}

// ═══════════════════════════════════════════════════════════════
// FORMATION DETECTION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Information about an adjacent ally in formation.
 *
 * @example
 * const ally: AdjacentAlly = {
 *   unit: spearman2,
 *   position: { x: 2, y: 3 },
 *   direction: 'E',
 *   facingAligned: true,
 * };
 */
export interface AdjacentAlly {
  /** The adjacent ally unit */
  unit: BattleUnit & UnitWithPhalanx;

  /** Position of the adjacent ally */
  position: Position;

  /** Direction from source unit to this ally (N/S/E/W) */
  direction: FacingDirection;

  /** Whether ally's facing is aligned with source unit */
  facingAligned: boolean;
}

/**
 * Result of detecting adjacent allies for formation.
 *
 * @example
 * const detection: FormationDetectionResult = {
 *   adjacentAllies: [ally1, ally2],
 *   alignedAllies: [ally1],
 *   totalAdjacent: 2,
 *   alignedCount: 1,
 *   canFormPhalanx: true,
 * };
 */
export interface FormationDetectionResult {
  /** All adjacent allies (regardless of facing) */
  adjacentAllies: AdjacentAlly[];

  /** Adjacent allies with aligned facing */
  alignedAllies: AdjacentAlly[];

  /** Total number of adjacent allies */
  totalAdjacent: number;

  /** Number of allies with aligned facing */
  alignedCount: number;

  /** Whether unit can form phalanx (has aligned allies) */
  canFormPhalanx: boolean;
}

/**
 * Result of calculating phalanx bonuses.
 *
 * @example
 * const bonuses: PhalanxBonusResult = {
 *   armorBonus: 2,
 *   resolveBonus: 10,
 *   adjacentCount: 2,
 *   formationState: 'partial',
 *   cappedArmor: false,
 *   cappedResolve: false,
 * };
 */
export interface PhalanxBonusResult {
  /** Calculated armor bonus */
  armorBonus: number;

  /** Calculated resolve bonus */
  resolveBonus: number;

  /** Number of adjacent allies contributing */
  adjacentCount: number;

  /** Formation state based on adjacent count */
  formationState: PhalanxFormationState;

  /** Whether armor bonus was capped at maximum */
  cappedArmor: boolean;

  /** Whether resolve bonus was capped at maximum */
  cappedResolve: boolean;

  /** Raw armor bonus before capping */
  rawArmorBonus: number;

  /** Raw resolve bonus before capping */
  rawResolveBonus: number;
}

/**
 * Result of checking phalanx eligibility for a unit.
 *
 * @example
 * const eligibility: PhalanxEligibility = {
 *   canJoinPhalanx: true,
 *   reason: undefined,
 *   hasTag: true,
 *   isAlive: true,
 * };
 */
export interface PhalanxEligibility {
  /** Whether the unit can join a phalanx formation */
  canJoinPhalanx: boolean;

  /** Reason if unit cannot join phalanx */
  reason?: PhalanxBlockReason;

  /** Whether unit has phalanx tag */
  hasTag: boolean;

  /** Whether unit is alive */
  isAlive: boolean;
}

/**
 * Reasons why a unit might not be able to join phalanx.
 *
 * - no_phalanx_tag: Unit doesn't have 'phalanx' tag
 * - immune_tag: Unit has 'no_phalanx' tag
 * - dead: Unit is dead (currentHp <= 0)
 * - no_facing: Unit doesn't have facing direction set
 * - isolated: No adjacent allies available
 * - disabled: Phalanx mechanic disabled for this unit
 */
export type PhalanxBlockReason =
  | 'no_phalanx_tag'
  | 'immune_tag'
  | 'dead'
  | 'no_facing'
  | 'isolated'
  | 'disabled';

// ═══════════════════════════════════════════════════════════════
// RECALCULATION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of recalculating phalanx bonuses after state change.
 *
 * @example
 * const result: PhalanxRecalculationResult = {
 *   unitsUpdated: ['spearman_1', 'spearman_2'],
 *   formationsChanged: 1,
 *   totalArmorBonusChange: -2,
 *   totalResolveBonusChange: -10,
 *   state: updatedState,
 * };
 */
export interface PhalanxRecalculationResult {
  /** IDs of units whose phalanx state was updated */
  unitsUpdated: string[];

  /** Number of formations that changed */
  formationsChanged: number;

  /** Net change in total armor bonus across all units */
  totalArmorBonusChange: number;

  /** Net change in total resolve bonus across all units */
  totalResolveBonusChange: number;

  /** Updated battle state */
  state: BattleState;
}

/**
 * Trigger for phalanx recalculation.
 *
 * - unit_death: A unit died, breaking formation
 * - unit_move: A unit moved, potentially breaking/forming phalanx
 * - unit_facing_change: A unit changed facing direction
 * - turn_start: Recalculate at start of turn
 * - manual: Explicit recalculation request
 */
export type RecalculationTrigger =
  | 'unit_death'
  | 'unit_move'
  | 'unit_facing_change'
  | 'turn_start'
  | 'manual';

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Phalanx formed event for battle log.
 * Emitted when a unit joins a phalanx formation.
 *
 * @example
 * const event: PhalanxFormedEvent = {
 *   type: 'phalanx_formed',
 *   unitId: 'spearman_1',
 *   adjacentAllies: ['spearman_2', 'spearman_3'],
 *   armorBonus: 2,
 *   resolveBonus: 10,
 * };
 */
export interface PhalanxFormedEvent {
  /** Event type identifier */
  type: 'phalanx_formed';

  /** Unit instance ID that joined phalanx */
  unitId: string;

  /** IDs of adjacent allies in formation */
  adjacentAllies: string[];

  /** Armor bonus gained */
  armorBonus: number;

  /** Resolve bonus gained */
  resolveBonus: number;

  /** Formation state achieved */
  formationState: PhalanxFormationState;
}

/**
 * Phalanx broken event for battle log.
 * Emitted when a unit leaves a phalanx formation.
 *
 * @example
 * const event: PhalanxBrokenEvent = {
 *   type: 'phalanx_broken',
 *   unitId: 'spearman_1',
 *   reason: 'ally_death',
 *   armorBonusLost: 2,
 *   resolveBonusLost: 10,
 * };
 */
export interface PhalanxBrokenEvent {
  /** Event type identifier */
  type: 'phalanx_broken';

  /** Unit instance ID that left phalanx */
  unitId: string;

  /** Reason formation was broken */
  reason: PhalanxBreakReason;

  /** Armor bonus lost */
  armorBonusLost: number;

  /** Resolve bonus lost */
  resolveBonusLost: number;

  /** Previous formation state */
  previousState: PhalanxFormationState;
}

/**
 * Reasons why a phalanx formation might break.
 *
 * - ally_death: An adjacent ally died
 * - ally_moved: An adjacent ally moved away
 * - unit_moved: This unit moved out of formation
 * - facing_changed: Facing alignment was broken
 * - unit_death: This unit died
 */
export type PhalanxBreakReason =
  | 'ally_death'
  | 'ally_moved'
  | 'unit_moved'
  | 'facing_changed'
  | 'unit_death';

/**
 * Phalanx updated event for battle log.
 * Emitted when phalanx bonuses change (but formation not broken).
 *
 * @example
 * const event: PhalanxUpdatedEvent = {
 *   type: 'phalanx_updated',
 *   unitId: 'spearman_1',
 *   previousArmorBonus: 3,
 *   newArmorBonus: 2,
 *   previousResolveBonus: 15,
 *   newResolveBonus: 10,
 * };
 */
export interface PhalanxUpdatedEvent {
  /** Event type identifier */
  type: 'phalanx_updated';

  /** Unit instance ID */
  unitId: string;

  /** Previous armor bonus */
  previousArmorBonus: number;

  /** New armor bonus */
  newArmorBonus: number;

  /** Previous resolve bonus */
  previousResolveBonus: number;

  /** New resolve bonus */
  newResolveBonus: number;

  /** Previous adjacent ally count */
  previousAdjacentCount: number;

  /** New adjacent ally count */
  newAdjacentCount: number;
}

/**
 * Phalanx recalculated event for battle log.
 * Emitted when phalanx bonuses are recalculated for multiple units.
 *
 * @example
 * const event: PhalanxRecalculatedEvent = {
 *   type: 'phalanx_recalculated',
 *   trigger: 'unit_death',
 *   unitsAffected: ['spearman_1', 'spearman_2'],
 *   formationsChanged: 1,
 * };
 */
export interface PhalanxRecalculatedEvent {
  /** Event type identifier */
  type: 'phalanx_recalculated';

  /** What triggered the recalculation */
  trigger: RecalculationTrigger;

  /** IDs of units whose phalanx state changed */
  unitsAffected: string[];

  /** Number of formations that changed */
  formationsChanged: number;
}

/**
 * Union type for all phalanx-related events.
 */
export type PhalanxEvent =
  | PhalanxFormedEvent
  | PhalanxBrokenEvent
  | PhalanxUpdatedEvent
  | PhalanxRecalculatedEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Phalanx processor interface.
 * Handles all phalanx-related mechanics including formation detection,
 * bonus calculation, and recalculation after state changes.
 *
 * Requires: facing (Tier 0) - for formation alignment check
 *
 * @example
 * const processor = createPhalanxProcessor(config);
 *
 * // Detect adjacent allies for a unit
 * const detection = processor.detectFormation(spearman, state);
 *
 * // Calculate phalanx bonuses
 * const bonuses = processor.calculateBonuses(2, config);
 *
 * // Recalculate after casualty
 * const result = processor.recalculate(state, 'unit_death');
 */
export interface PhalanxProcessor {
  /**
   * Checks if a unit can join a phalanx formation.
   *
   * @param unit - Unit to check
   * @returns Phalanx eligibility result
   *
   * @example
   * const eligibility = processor.canJoinPhalanx(spearman);
   * if (eligibility.canJoinPhalanx) {
   *   // Unit can form phalanx with adjacent allies
   * }
   */
  canJoinPhalanx(unit: BattleUnit & UnitWithPhalanx): PhalanxEligibility;

  /**
   * Detects adjacent allies for formation.
   * Finds all adjacent allies and checks facing alignment.
   *
   * @param unit - Unit to check formation for
   * @param state - Current battle state
   * @returns Formation detection result
   *
   * @example
   * const detection = processor.detectFormation(spearman, state);
   * if (detection.canFormPhalanx) {
   *   // Unit has aligned adjacent allies
   * }
   */
  detectFormation(
    unit: BattleUnit & UnitWithPhalanx,
    state: BattleState,
  ): FormationDetectionResult;

  /**
   * Calculates phalanx bonuses based on adjacent ally count.
   *
   * Formulas:
   * - armorBonus = min(maxArmorBonus, adjacentCount * armorPerAlly)
   * - resolveBonus = min(maxResolveBonus, adjacentCount * resolvePerAlly)
   *
   * @param adjacentCount - Number of adjacent allies in formation
   * @param config - Phalanx configuration
   * @returns Calculated bonuses
   *
   * @example
   * const bonuses = processor.calculateBonuses(3, config);
   * // bonuses.armorBonus = 3 (3 * 1, not capped)
   * // bonuses.resolveBonus = 15 (3 * 5, not capped)
   */
  calculateBonuses(
    adjacentCount: number,
    config: PhalanxConfig,
  ): PhalanxBonusResult;

  /**
   * Gets the effective armor for a unit including phalanx bonus.
   *
   * @param unit - Unit to get effective armor for
   * @returns Effective armor value
   *
   * @example
   * const effectiveArmor = processor.getEffectiveArmor(spearman);
   * // Returns baseArmor + phalanxArmorBonus
   */
  getEffectiveArmor(unit: BattleUnit & UnitWithPhalanx): number;

  /**
   * Gets the effective resolve for a unit including phalanx bonus.
   *
   * @param unit - Unit to get effective resolve for
   * @returns Effective resolve value
   *
   * @example
   * const effectiveResolve = processor.getEffectiveResolve(spearman);
   * // Returns baseResolve + phalanxResolveBonus
   */
  getEffectiveResolve(unit: BattleUnit & UnitWithPhalanx): number;

  /**
   * Updates phalanx state for a single unit.
   * Detects formation and applies bonuses.
   *
   * @param unit - Unit to update
   * @param state - Current battle state
   * @param config - Phalanx configuration
   * @returns Updated unit with phalanx state
   *
   * @example
   * const updatedUnit = processor.updateUnitPhalanx(spearman, state, config);
   */
  updateUnitPhalanx(
    unit: BattleUnit & UnitWithPhalanx,
    state: BattleState,
    config: PhalanxConfig,
  ): BattleUnit & UnitWithPhalanx;

  /**
   * Recalculates phalanx bonuses for all units.
   * Called after casualties or movement to update formations.
   *
   * @param state - Current battle state
   * @param trigger - What triggered the recalculation
   * @returns Recalculation result with updated state
   *
   * @example
   * const result = processor.recalculate(state, 'unit_death');
   * // All units' phalanx bonuses are recalculated
   */
  recalculate(
    state: BattleState,
    trigger: RecalculationTrigger,
  ): PhalanxRecalculationResult;

  /**
   * Clears phalanx state for a unit.
   * Called when unit dies or leaves formation.
   *
   * @param unit - Unit to clear phalanx state for
   * @returns Updated unit with cleared phalanx state
   *
   * @example
   * const clearedUnit = processor.clearPhalanx(spearman);
   */
  clearPhalanx(
    unit: BattleUnit & UnitWithPhalanx,
  ): BattleUnit & UnitWithPhalanx;

  /**
   * Checks if a unit is currently in a phalanx formation.
   *
   * @param unit - Unit to check
   * @returns True if unit is in phalanx
   *
   * @example
   * if (processor.isInPhalanx(spearman)) {
   *   // Unit has phalanx bonuses active
   * }
   */
  isInPhalanx(unit: BattleUnit & UnitWithPhalanx): boolean;

  /**
   * Apply phalanx logic for a battle phase.
   *
   * Phase behaviors:
   * - turn_start: Recalculate all phalanx bonuses
   * - movement: Recalculate after unit moves
   * - post_attack: Recalculate after casualties
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('post_attack', state, {
   *   activeUnit: attacker,
   *   target: defender,
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
 * Options for creating a phalanx processor with custom settings.
 *
 * @example
 * const options: PhalanxProcessorOptions = {
 *   requireSameFacing: true,
 *   diagonalAllies: false,
 * };
 */
export interface PhalanxProcessorOptions {
  /**
   * Whether adjacent allies must face the same direction.
   * Default: true
   */
  requireSameFacing?: boolean;

  /**
   * Whether to count diagonal neighbors as adjacent.
   * Default: false (only orthogonal neighbors)
   */
  diagonalAllies?: boolean;

  /** Custom tags for phalanx capability */
  phalanxTags?: string[];

  /** Custom tags for phalanx immunity */
  immunityTags?: string[];
}

/**
 * Context for phalanx calculation.
 * Contains all information needed to determine phalanx state.
 */
export interface PhalanxContext {
  /** Unit to calculate phalanx for */
  unit: BattleUnit & UnitWithPhalanx;

  /** All units in battle */
  allUnits: (BattleUnit & UnitWithPhalanx)[];

  /** Phalanx configuration */
  config: PhalanxConfig;
}

/**
 * Full phalanx check result with all details.
 * Used for detailed logging and debugging.
 */
export interface PhalanxFullResult {
  /** Eligibility check result */
  eligibility: PhalanxEligibility;

  /** Formation detection result */
  detection: FormationDetectionResult;

  /** Bonus calculation result */
  bonuses: PhalanxBonusResult;

  /** Events generated by this phalanx check */
  events: PhalanxEvent[];

  /** Updated unit with phalanx state */
  updatedUnit: BattleUnit & UnitWithPhalanx;
}

/**
 * Position offset for adjacent cell detection.
 * Used to find orthogonal neighbors.
 */
export interface PositionOffset {
  /** X offset (-1, 0, or 1) */
  dx: number;

  /** Y offset (-1, 0, or 1) */
  dy: number;

  /** Direction this offset represents */
  direction: FacingDirection;
}

/**
 * Orthogonal position offsets for adjacent cell detection.
 * Only includes N/S/E/W directions (no diagonals).
 */
export const ORTHOGONAL_OFFSETS: readonly PositionOffset[] = [
  { dx: 0, dy: -1, direction: 'N' },
  { dx: 0, dy: 1, direction: 'S' },
  { dx: 1, dy: 0, direction: 'E' },
  { dx: -1, dy: 0, direction: 'W' },
] as const;

/**
 * All position offsets including diagonals.
 * Used when diagonalAllies option is enabled.
 */
export const ALL_NEIGHBOR_OFFSETS: readonly PositionOffset[] = [
  { dx: 0, dy: -1, direction: 'N' },
  { dx: 0, dy: 1, direction: 'S' },
  { dx: 1, dy: 0, direction: 'E' },
  { dx: -1, dy: 0, direction: 'W' },
  // Diagonals use nearest cardinal direction
  { dx: 1, dy: -1, direction: 'N' },
  { dx: 1, dy: 1, direction: 'S' },
  { dx: -1, dy: -1, direction: 'N' },
  { dx: -1, dy: 1, direction: 'S' },
] as const;
