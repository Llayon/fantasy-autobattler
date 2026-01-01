/**
 * Tier 1: Resolve (Morale) - Type Definitions
 *
 * Defines types for the resolve/morale system which tracks unit morale
 * and determines behavior when morale breaks (routing for humans,
 * crumbling for undead).
 *
 * Resolve is damaged by:
 * - Flanking attacks (side attacks)
 * - Rear attacks (backstabs)
 * - Charge impacts (cavalry shock)
 * - Ally deaths nearby
 *
 * Resolve regenerates at the start of each turn.
 *
 * @module core/mechanics/tier1/resolve
 */

import type { ResolveConfig } from '../../config/mechanics.types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// RESOLVE STATE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve state for a unit in the mechanics system.
 * Determines unit behavior based on current morale level.
 *
 * - active: Unit is fighting normally (resolve > 0)
 * - routing: Human unit is fleeing (resolve = 0, humanRetreat enabled)
 * - crumbled: Undead unit has disintegrated (resolve = 0, undeadCrumble enabled)
 *
 * Note: This is named MechanicsResolveState to avoid conflict with
 * the ResolveState enum in core/battle/turn-order.ts
 *
 * @example
 * const state = processor.checkState(unit, config);
 * if (state === 'routing') {
 *   // Unit will attempt to flee the battlefield
 * }
 */
export type MechanicsResolveState = 'active' | 'routing' | 'crumbled';

/**
 * @deprecated Use MechanicsResolveState instead. Kept for backward compatibility.
 */
export type ResolveState = MechanicsResolveState;

// ═══════════════════════════════════════════════════════════════
// FACTION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Faction types that affect resolve behavior.
 * Different factions have different responses to morale breaking.
 *
 * - human: Retreats when resolve reaches 0 (if humanRetreat enabled)
 * - undead: Crumbles when resolve reaches 0 (if undeadCrumble enabled)
 * - other: Custom faction behavior (defaults to human-like)
 *
 * @example
 * const unit: UnitWithResolve = {
 *   ...baseUnit,
 *   faction: 'undead',
 *   resolve: 50,
 * };
 */
export type ResolveFaction = 'human' | 'undead' | string;

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the resolve system.
 * These properties are added to BattleUnit when resolve mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithResolve {}
 *
 * const unit: MyBattleUnit = {
 *   ...baseUnit,
 *   resolve: 100,
 *   maxResolve: 100,
 *   faction: 'human',
 * };
 */
export interface UnitWithResolve {
  /** Current resolve/morale value (0 to maxResolve) */
  resolve?: number;

  /** Maximum resolve value (defaults to config.maxResolve) */
  maxResolve?: number;

  /** Unit's faction for resolve behavior */
  faction?: ResolveFaction;

  /** Whether unit is currently routing (fleeing) */
  isRouting?: boolean;

  /** Whether unit has crumbled (undead only) */
  hasCrumbled?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// RESOLVE DAMAGE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Source of resolve damage for tracking and events.
 *
 * - flanking: Damage from side attack
 * - rear: Damage from rear attack
 * - charge: Damage from cavalry charge impact
 * - ally_death: Damage from nearby ally dying
 * - ability: Damage from fear/terror abilities
 * - aura: Damage from enemy aura effects
 *
 * @example
 * const event: ResolveDamageEvent = {
 *   type: 'resolve_damage',
 *   source: 'flanking',
 *   amount: 12,
 *   targetId: unit.instanceId,
 * };
 */
export type ResolveDamageSource =
  | 'flanking'
  | 'rear'
  | 'charge'
  | 'ally_death'
  | 'ability'
  | 'aura';

/**
 * Resolve damage event for battle log.
 *
 * @example
 * const event: ResolveDamageEvent = {
 *   type: 'resolve_damage',
 *   targetId: 'unit_1',
 *   source: 'flanking',
 *   amount: 12,
 *   newResolve: 88,
 * };
 */
export interface ResolveDamageEvent {
  /** Event type identifier */
  type: 'resolve_damage';

  /** Target unit instance ID */
  targetId: string;

  /** Source of the resolve damage */
  source: ResolveDamageSource;

  /** Amount of resolve damage dealt */
  amount: number;

  /** New resolve value after damage */
  newResolve: number;
}

/**
 * Resolve break event when unit's morale fails.
 *
 * @example
 * const event: ResolveBreakEvent = {
 *   type: 'resolve_break',
 *   unitId: 'unit_1',
 *   result: 'routing',
 *   faction: 'human',
 * };
 */
export interface ResolveBreakEvent {
  /** Event type identifier */
  type: 'resolve_break';

  /** Unit instance ID */
  unitId: string;

  /** Result of resolve breaking */
  result: MechanicsResolveState;

  /** Unit's faction */
  faction: ResolveFaction;
}

/**
 * Resolve regeneration event at turn start.
 *
 * @example
 * const event: ResolveRegenEvent = {
 *   type: 'resolve_regen',
 *   unitId: 'unit_1',
 *   amount: 5,
 *   newResolve: 95,
 * };
 */
export interface ResolveRegenEvent {
  /** Event type identifier */
  type: 'resolve_regen';

  /** Unit instance ID */
  unitId: string;

  /** Amount of resolve regenerated */
  amount: number;

  /** New resolve value after regeneration */
  newResolve: number;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve processor interface.
 * Handles all resolve-related mechanics including regeneration,
 * damage application, and state checking.
 *
 * @example
 * const processor = createResolveProcessor(config);
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
export interface ResolveProcessor {
  /**
   * Regenerates resolve at turn start.
   * Adds baseRegeneration to current resolve, capped at maxResolve.
   *
   * @param unit - Unit to regenerate resolve for
   * @param config - Resolve configuration
   * @returns New unit object with updated resolve
   *
   * @example
   * const unit = { resolve: 80, maxResolve: 100 };
   * const config = { baseRegeneration: 5, maxResolve: 100 };
   * const result = processor.regenerate(unit, config);
   * // result.resolve === 85
   */
  regenerate(
    unit: BattleUnit & UnitWithResolve,
    config: ResolveConfig,
  ): BattleUnit & UnitWithResolve;

  /**
   * Applies resolve damage from combat.
   * Reduces resolve by the specified amount, minimum 0.
   *
   * @param unit - Unit to apply damage to
   * @param damage - Amount of resolve damage
   * @returns New unit object with updated resolve
   *
   * @example
   * const unit = { resolve: 50 };
   * const result = processor.applyDamage(unit, 12);
   * // result.resolve === 38
   */
  applyDamage(
    unit: BattleUnit & UnitWithResolve,
    damage: number,
  ): BattleUnit & UnitWithResolve;

  /**
   * Checks if unit should rout/crumble based on resolve.
   * Returns 'active' if resolve > 0, otherwise checks faction
   * and config to determine routing or crumbling.
   *
   * @param unit - Unit to check state for
   * @param config - Resolve configuration
   * @returns Current resolve state
   *
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
    config: ResolveConfig,
  ): MechanicsResolveState;

  /**
   * Apply resolve logic for a battle phase.
   *
   * Phase behaviors:
   * - turn_start: Regenerate resolve for active unit
   * - post_attack: Check for rout/crumble after damage
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and target
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
 * Result of handling a resolve break.
 * Contains the updated state and any events generated.
 */
export interface ResolveBreakResult {
  /** Updated battle state */
  state: BattleState;

  /** Events generated by the resolve break */
  events: ResolveBreakEvent[];
}

/**
 * Options for calculating resolve damage.
 */
export interface ResolveDamageOptions {
  /** Source of the damage */
  source: ResolveDamageSource;

  /** Base damage amount */
  baseDamage: number;

  /** Optional multiplier (default: 1.0) */
  multiplier?: number;
}
