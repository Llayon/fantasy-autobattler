/**
 * Tier 2: Aura - Type Definitions
 *
 * Defines types for the aura system which allows units to project
 * area effects that influence nearby allies or enemies.
 *
 * Aura is an independent mechanic (no dependencies required).
 *
 * Key mechanics:
 * - Static auras: Always active while unit is alive
 * - Pulse auras: Apply effect once per turn to units in range
 * - Relic auras: Item-based auras with special properties
 *
 * @module core/mechanics/tier2/aura
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type {
  BattleState,
  BattleUnit,
  Position,
  BattleAura,
  BattleAuraType,
  BattleAuraTarget,
  BattleAuraEffectType,
  BattleAuraStat,
  BattleAuraEffect,
} from '../../../types';

// ═══════════════════════════════════════════════════════════════
// AURA CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default aura range in cells (Manhattan distance).
 *
 * @example
 * const aura: Aura = { ...baseAura, range: DEFAULT_AURA_RANGE };
 */
export const DEFAULT_AURA_RANGE = 2;

/**
 * Maximum aura range allowed.
 * Prevents performance issues from very large auras.
 */
export const MAX_AURA_RANGE = 5;

/**
 * Default pulse interval in turns.
 * Pulse auras apply their effect every N turns.
 */
export const DEFAULT_PULSE_INTERVAL = 1;

// ═══════════════════════════════════════════════════════════════
// AURA TYPE DEFINITIONS (Re-exports from battle.types.ts)
// ═══════════════════════════════════════════════════════════════

/**
 * Types of auras.
 * Re-exported from battle.types.ts for convenience.
 *
 * - static: Always active while unit is alive (e.g., leadership aura)
 * - pulse: Applies effect once per turn to units in range (e.g., healing pulse)
 * - relic: Item-based aura with special properties (e.g., artifact effects)
 */
export type AuraType = BattleAuraType;

/**
 * Aura effect targets.
 * Re-exported from battle.types.ts for convenience.
 *
 * - allies: Only affects friendly units
 * - enemies: Only affects enemy units
 * - all: Affects all units in range
 * - self: Only affects the aura source unit
 */
export type AuraTarget = BattleAuraTarget;

/**
 * Aura effect types.
 * Re-exported from battle.types.ts for convenience.
 *
 * - buff_stat: Increases a stat (atk, armor, speed, etc.)
 * - debuff_stat: Decreases a stat
 * - heal: Restores HP over time
 * - damage: Deals damage over time
 * - resolve_boost: Increases resolve regeneration
 * - resolve_drain: Decreases enemy resolve
 * - status_immunity: Grants immunity to certain status effects
 * - status_apply: Applies a status effect
 */
export type AuraEffectType = BattleAuraEffectType;

/**
 * Stat types that can be modified by auras.
 * Re-exported from battle.types.ts for convenience.
 */
export type AuraStat = BattleAuraStat;

// ═══════════════════════════════════════════════════════════════
// AURA DEFINITION TYPES (Re-exports from battle.types.ts)
// ═══════════════════════════════════════════════════════════════

/**
 * Aura effect definition.
 * Re-exported from battle.types.ts for convenience.
 * Describes what effect the aura applies to units in range.
 *
 * @example
 * // +10% ATK buff to allies
 * const effect: AuraEffect = {
 *   type: 'buff_stat',
 *   stat: 'atk',
 *   value: 0.1,
 *   isPercentage: true,
 * };
 *
 * @example
 * // 5 damage per turn to enemies
 * const effect: AuraEffect = {
 *   type: 'damage',
 *   value: 5,
 *   isPercentage: false,
 * };
 */
export type AuraEffect = BattleAuraEffect;

/**
 * Complete aura definition.
 * Re-exported from battle.types.ts for convenience.
 * Describes an aura's properties, range, and effects.
 *
 * @example
 * const leadershipAura: Aura = {
 *   id: 'leadership',
 *   name: 'Leadership',
 *   type: 'static',
 *   target: 'allies',
 *   range: 2,
 *   effect: {
 *     type: 'buff_stat',
 *     stat: 'atk',
 *     value: 0.1,
 *     isPercentage: true,
 *   },
 *   stackable: false,
 * };
 */
export type Aura = BattleAura;

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Active aura instance on a unit.
 * Tracks runtime state of an aura.
 *
 * @example
 * const activeAura: ActiveAura = {
 *   aura: leadershipAura,
 *   sourceId: 'unit_1',
 *   turnsActive: 3,
 *   lastPulseTurn: 2,
 * };
 */
export interface ActiveAura {
  /** Aura definition */
  aura: Aura;

  /** Instance ID of the unit providing this aura */
  sourceId: string;

  /** Number of turns this aura has been active */
  turnsActive: number;

  /** Last turn when pulse effect was applied (for pulse auras) */
  lastPulseTurn?: number;

  /** Current stack count (if stackable) */
  stacks?: number;
}

/**
 * Aura buff/debuff applied to a unit.
 * Tracks stat modifications from auras.
 *
 * @example
 * const auraBuff: AuraBuff = {
 *   auraId: 'leadership',
 *   sourceId: 'unit_1',
 *   stat: 'atk',
 *   value: 5,
 *   isPercentage: false,
 * };
 */
export interface AuraBuff {
  /** Aura ID that provided this buff */
  auraId: string;

  /** Instance ID of the unit providing this buff */
  sourceId: string;

  /** Stat being modified */
  stat: AuraStat;

  /** Modification value */
  value: number;

  /** Whether value is percentage */
  isPercentage: boolean;

  /** Number of stacks */
  stacks: number;
}

/**
 * Extended unit properties for the aura system.
 * These properties are added to BattleUnit when aura mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithAura {}
 *
 * const unit: MyBattleUnit = {
 *   ...baseUnit,
 *   auras: [leadershipAura],
 *   activeAuraBuffs: [],
 *   auraImmunities: [],
 * };
 */
export interface UnitWithAura {
  /**
   * Auras this unit projects.
   * These auras affect other units in range.
   */
  auras?: Aura[];

  /**
   * Active aura buffs/debuffs affecting this unit.
   * Applied by other units' auras.
   */
  activeAuraBuffs?: AuraBuff[];

  /**
   * Status effect immunities granted by auras.
   */
  auraImmunities?: string[];

  /**
   * Cached effective stats after aura modifications.
   * Recalculated when auras change.
   */
  effectiveStats?: {
    atk?: number;
    armor?: number;
    speed?: number;
    initiative?: number;
    dodge?: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// AURA CHECK TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of checking which units are in aura range.
 *
 * @example
 * const check: AuraRangeCheck = {
 *   source: sourceUnit,
 *   aura: leadershipAura,
 *   unitsInRange: [ally1, ally2],
 *   positions: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
 * };
 */
export interface AuraRangeCheck {
  /** Unit projecting the aura */
  source: BattleUnit & UnitWithAura;

  /** Aura being checked */
  aura: Aura;

  /** Units within aura range that match target criteria */
  unitsInRange: BattleUnit[];

  /** Positions of units in range */
  positions: Position[];
}

/**
 * Result of applying an aura effect.
 *
 * @example
 * const result: AuraApplicationResult = {
 *   success: true,
 *   auraId: 'leadership',
 *   targetId: 'unit_2',
 *   effectApplied: { type: 'buff_stat', stat: 'atk', value: 5 },
 *   stacks: 1,
 * };
 */
export interface AuraApplicationResult {
  /** Whether the aura was successfully applied */
  success: boolean;

  /** Aura ID that was applied */
  auraId: string;

  /** Target unit instance ID */
  targetId: string;

  /** Effect that was applied */
  effectApplied?: AuraEffect;

  /** Current stack count after application */
  stacks: number;

  /** Reason if application failed */
  reason?: AuraBlockReason;
}

/**
 * Reasons why an aura might not be applied.
 *
 * - out_of_range: Target is outside aura range
 * - wrong_target: Target doesn't match aura target type (ally/enemy)
 * - max_stacks: Maximum stacks already reached
 * - immune: Target is immune to this aura effect
 * - source_dead: Aura source unit is dead
 * - already_applied: Non-stackable aura already active
 */
export type AuraBlockReason =
  | 'out_of_range'
  | 'wrong_target'
  | 'max_stacks'
  | 'immune'
  | 'source_dead'
  | 'already_applied';

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Aura activated event for battle log.
 * Emitted when a unit's aura becomes active.
 *
 * @example
 * const event: AuraActivatedEvent = {
 *   type: 'aura_activated',
 *   sourceId: 'unit_1',
 *   auraId: 'leadership',
 *   auraName: 'Leadership',
 *   range: 2,
 * };
 */
export interface AuraActivatedEvent {
  /** Event type identifier */
  type: 'aura_activated';

  /** Unit instance ID projecting the aura */
  sourceId: string;

  /** Aura ID */
  auraId: string;

  /** Aura display name */
  auraName: string;

  /** Aura range */
  range: number;
}

/**
 * Aura deactivated event for battle log.
 * Emitted when a unit's aura becomes inactive (unit died).
 *
 * @example
 * const event: AuraDeactivatedEvent = {
 *   type: 'aura_deactivated',
 *   sourceId: 'unit_1',
 *   auraId: 'leadership',
 *   reason: 'source_dead',
 * };
 */
export interface AuraDeactivatedEvent {
  /** Event type identifier */
  type: 'aura_deactivated';

  /** Unit instance ID that was projecting the aura */
  sourceId: string;

  /** Aura ID */
  auraId: string;

  /** Reason for deactivation */
  reason: 'source_dead' | 'expired' | 'removed';
}

/**
 * Aura effect applied event for battle log.
 * Emitted when an aura effect is applied to a unit.
 *
 * @example
 * const event: AuraEffectAppliedEvent = {
 *   type: 'aura_effect_applied',
 *   sourceId: 'unit_1',
 *   targetId: 'unit_2',
 *   auraId: 'leadership',
 *   effectType: 'buff_stat',
 *   stat: 'atk',
 *   value: 5,
 * };
 */
export interface AuraEffectAppliedEvent {
  /** Event type identifier */
  type: 'aura_effect_applied';

  /** Unit instance ID projecting the aura */
  sourceId: string;

  /** Unit instance ID receiving the effect */
  targetId: string;

  /** Aura ID */
  auraId: string;

  /** Effect type applied */
  effectType: AuraEffectType;

  /** Stat modified (if applicable) */
  stat?: AuraStat;

  /** Effect value */
  value: number;

  /** Current stacks */
  stacks: number;
}

/**
 * Aura effect removed event for battle log.
 * Emitted when an aura effect is removed from a unit.
 *
 * @example
 * const event: AuraEffectRemovedEvent = {
 *   type: 'aura_effect_removed',
 *   sourceId: 'unit_1',
 *   targetId: 'unit_2',
 *   auraId: 'leadership',
 *   reason: 'out_of_range',
 * };
 */
export interface AuraEffectRemovedEvent {
  /** Event type identifier */
  type: 'aura_effect_removed';

  /** Unit instance ID that was projecting the aura */
  sourceId: string;

  /** Unit instance ID that lost the effect */
  targetId: string;

  /** Aura ID */
  auraId: string;

  /** Reason for removal */
  reason: 'out_of_range' | 'source_dead' | 'expired' | 'dispelled';
}

/**
 * Aura pulse event for battle log.
 * Emitted when a pulse aura triggers its effect.
 *
 * @example
 * const event: AuraPulseEvent = {
 *   type: 'aura_pulse',
 *   sourceId: 'unit_1',
 *   auraId: 'healing_pulse',
 *   targetsAffected: ['unit_2', 'unit_3'],
 *   effectValue: 10,
 * };
 */
export interface AuraPulseEvent {
  /** Event type identifier */
  type: 'aura_pulse';

  /** Unit instance ID projecting the aura */
  sourceId: string;

  /** Aura ID */
  auraId: string;

  /** Unit instance IDs affected by the pulse */
  targetsAffected: string[];

  /** Effect value applied */
  effectValue: number;
}

/**
 * Union type for all aura-related events.
 */
export type AuraEvent =
  | AuraActivatedEvent
  | AuraDeactivatedEvent
  | AuraEffectAppliedEvent
  | AuraEffectRemovedEvent
  | AuraPulseEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Aura processor interface.
 * Handles all aura-related mechanics including static buffs,
 * pulse effects, and aura range calculations.
 *
 * Aura is an independent mechanic (no dependencies required).
 *
 * @example
 * const processor = createAuraProcessor();
 *
 * // Find units in aura range
 * const unitsInRange = processor.getUnitsInRange(source, aura, state);
 *
 * // Apply static aura effects
 * const newState = processor.applyStaticAuras(state);
 *
 * // Trigger pulse auras
 * const newState = processor.triggerPulseAuras(state, seed);
 */
export interface AuraProcessor {
  /**
   * Gets all units within an aura's range that match target criteria.
   *
   * @param source - Unit projecting the aura
   * @param aura - Aura definition
   * @param state - Current battle state
   * @returns Array of units in range
   *
   * @example
   * const allies = processor.getUnitsInRange(leader, leadershipAura, state);
   */
  getUnitsInRange(
    source: BattleUnit & UnitWithAura,
    aura: Aura,
    state: BattleState,
  ): BattleUnit[];

  /**
   * Calculates the effective stat value after aura modifications.
   *
   * @param unit - Unit to calculate stats for
   * @param stat - Stat to calculate
   * @param state - Current battle state
   * @returns Effective stat value
   *
   * @example
   * const effectiveAtk = processor.getEffectiveStat(unit, 'atk', state);
   */
  getEffectiveStat(
    unit: BattleUnit & UnitWithAura,
    stat: AuraStat,
    state: BattleState,
  ): number;

  /**
   * Applies all static aura effects to units in range.
   * Called when aura state changes (unit moves, dies, etc.).
   *
   * @param state - Current battle state
   * @returns Updated battle state with aura effects applied
   *
   * @example
   * const newState = processor.applyStaticAuras(state);
   */
  applyStaticAuras(state: BattleState): BattleState;

  /**
   * Triggers all pulse auras for the current turn.
   * Called at turn_start phase.
   *
   * @param state - Current battle state
   * @param seed - Random seed for determinism
   * @returns Updated battle state with pulse effects applied
   *
   * @example
   * const newState = processor.triggerPulseAuras(state, seed);
   */
  triggerPulseAuras(state: BattleState, seed: number): BattleState;

  /**
   * Removes aura effects from a unit.
   * Called when unit moves out of range or aura source dies.
   *
   * @param unit - Unit to remove effects from
   * @param auraId - Aura ID to remove
   * @param sourceId - Source unit ID
   * @returns Updated unit without the aura effect
   *
   * @example
   * const updatedUnit = processor.removeAuraEffect(unit, 'leadership', 'unit_1');
   */
  removeAuraEffect(
    unit: BattleUnit & UnitWithAura,
    auraId: string,
    sourceId: string,
  ): BattleUnit & UnitWithAura;

  /**
   * Handles aura cleanup when a unit dies.
   * Removes all auras projected by the dead unit.
   *
   * @param state - Current battle state
   * @param deadUnitId - Instance ID of the dead unit
   * @returns Updated battle state with auras removed
   *
   * @example
   * const newState = processor.handleUnitDeath(state, 'unit_1');
   */
  handleUnitDeath(state: BattleState, deadUnitId: string): BattleState;

  /**
   * Recalculates all aura effects after state changes.
   * Should be called after movement or unit death.
   *
   * @param state - Current battle state
   * @returns Updated battle state with recalculated auras
   *
   * @example
   * const newState = processor.recalculateAuras(state);
   */
  recalculateAuras(state: BattleState): BattleState;

  /**
   * Apply aura logic for a battle phase.
   *
   * Phase behaviors:
   * - turn_start: Trigger pulse auras, recalculate static auras
   * - movement: Recalculate auras after unit moves
   * - post_attack: Recalculate auras if unit died
   * - turn_end: Decay temporary auras
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action
   * @returns Updated battle state
   *
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
  ): BattleState;
}

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Options for creating an aura processor with custom settings.
 *
 * @example
 * const options: AuraProcessorOptions = {
 *   maxRange: 4, // Override max aura range
 * };
 */
export interface AuraProcessorOptions {
  /** Maximum allowed aura range (default: 5) */
  maxRange?: number;

  /** Whether to allow aura stacking (default: true) */
  allowStacking?: boolean;
}

/**
 * Context for aura calculation.
 * Contains all information needed to determine aura effects.
 */
export interface AuraContext {
  /** Unit projecting the aura */
  source: BattleUnit & UnitWithAura;

  /** Aura being processed */
  aura: Aura;

  /** Current battle state */
  state: BattleState;

  /** Random seed for deterministic calculations */
  seed: number;
}

/**
 * Full aura check result with all details.
 * Used for detailed logging and debugging.
 */
export interface AuraFullResult {
  /** All aura range checks performed */
  rangeChecks: AuraRangeCheck[];

  /** All application results */
  applications: AuraApplicationResult[];

  /** Events generated */
  events: AuraEvent[];

  /** Final battle state after all aura processing */
  finalState: BattleState;
}
