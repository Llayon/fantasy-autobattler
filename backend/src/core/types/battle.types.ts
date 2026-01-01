/**
 * Battle-related type definitions for the core battle engine.
 * These types are game-agnostic and can be used across different projects.
 *
 * @module core/types/battle
 */

import { Position } from './grid.types';

/**
 * Team identifier for battle participants.
 */
export type TeamType = 'player' | 'bot';

/**
 * Cardinal directions for unit facing.
 * Used by the facing mechanic (Tier 0) to enable directional combat.
 *
 * - N (North): Unit faces up (negative Y)
 * - S (South): Unit faces down (positive Y)
 * - E (East): Unit faces right (positive X)
 * - W (West): Unit faces left (negative X)
 *
 * @example
 * const unit: BattleUnit = {
 *   ...baseUnit,
 *   facing: 'N',
 * };
 */
export type FacingDirection = 'N' | 'S' | 'E' | 'W';

/**
 * Battle outcome possibilities.
 */
export type BattleWinner = 'player' | 'bot' | 'draw';

// ═══════════════════════════════════════════════════════════════
// AURA TYPES (Tier 2: Aura mechanic)
// ═══════════════════════════════════════════════════════════════

/**
 * Types of auras.
 *
 * - static: Always active while unit is alive (e.g., leadership aura)
 * - pulse: Applies effect once per turn to units in range (e.g., healing pulse)
 * - relic: Item-based aura with special properties (e.g., artifact effects)
 */
export type BattleAuraType = 'static' | 'pulse' | 'relic';

/**
 * Aura effect targets.
 *
 * - allies: Only affects friendly units
 * - enemies: Only affects enemy units
 * - all: Affects all units in range
 * - self: Only affects the aura source unit
 */
export type BattleAuraTarget = 'allies' | 'enemies' | 'all' | 'self';

/**
 * Aura effect types.
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
export type BattleAuraEffectType =
  | 'buff_stat'
  | 'debuff_stat'
  | 'heal'
  | 'damage'
  | 'resolve_boost'
  | 'resolve_drain'
  | 'status_immunity'
  | 'status_apply';

/**
 * Stat types that can be modified by auras.
 */
export type BattleAuraStat =
  | 'atk'
  | 'armor'
  | 'speed'
  | 'initiative'
  | 'dodge'
  | 'hp'
  | 'resolve';

/**
 * Aura effect definition.
 * Describes what effect the aura applies to units in range.
 *
 * @example
 * // +10% ATK buff to allies
 * const effect: BattleAuraEffect = {
 *   type: 'buff_stat',
 *   stat: 'atk',
 *   value: 0.1,
 *   isPercentage: true,
 * };
 */
export interface BattleAuraEffect {
  /** Effect type */
  type: BattleAuraEffectType;

  /** Stat to modify (for buff_stat/debuff_stat) */
  stat?: BattleAuraStat;

  /** Effect value (flat or percentage based on isPercentage) */
  value: number;

  /** Whether value is a percentage (0.1 = 10%) or flat amount */
  isPercentage: boolean;

  /** Status effect ID to apply (for status_apply) */
  statusId?: string;

  /** Status effects to grant immunity to (for status_immunity) */
  immunities?: string[];
}

/**
 * Complete aura definition for BattleUnit.
 * Describes an aura's properties, range, and effects.
 *
 * This is the minimal aura interface used by BattleUnit.
 * The full Aura type in the aura mechanic module extends this with
 * additional runtime tracking properties.
 *
 * @example
 * const leadershipAura: BattleAura = {
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
export interface BattleAura {
  /** Unique aura identifier */
  id: string;

  /** Display name */
  name: string;

  /** Aura type (static, pulse, relic) */
  type: BattleAuraType;

  /** Who the aura affects */
  target: BattleAuraTarget;

  /** Effect range in cells (Manhattan distance) */
  range: number;

  /** Effect to apply */
  effect: BattleAuraEffect;

  /** Whether multiple instances of this aura can stack */
  stackable: boolean;

  /** Maximum stacks (if stackable) */
  maxStacks?: number;

  /** Pulse interval in turns (for pulse auras) */
  pulseInterval?: number;

  /** Description for UI display */
  description?: string;
}

/**
 * Core unit statistics interface.
 * Contains all combat-relevant attributes for units.
 */
export interface UnitStats {
  /** Hit points - unit dies when reaching 0 */
  hp: number;
  /** Attack damage per hit */
  atk: number;
  /** Number of attacks per turn */
  atkCount: number;
  /** Armor - reduces incoming physical damage */
  armor: number;
  /** Movement speed - cells per turn */
  speed: number;
  /** Initiative - determines turn order (higher = first) */
  initiative: number;
  /** Dodge chance percentage (0-100) */
  dodge: number;
}

/**
 * Active unit instance in battle.
 * Generic interface that can be extended with game-specific fields.
 */
export interface BattleUnit {
  /** Unique unit type identifier */
  id: string;
  /** Display name */
  name: string;
  /** Unit role classification */
  role: string;
  /** Team budget cost */
  cost: number;
  /** Base statistics */
  stats: UnitStats;
  /** Attack range in cells */
  range: number;
  /** Available ability IDs */
  abilities: string[];
  /** Current position on battlefield */
  position: Position;
  /** Current hit points */
  currentHp: number;
  /** Maximum hit points */
  maxHp: number;
  /** Team affiliation */
  team: TeamType;
  /** Whether unit is alive and can act */
  alive: boolean;
  /** Unique instance identifier for battle */
  instanceId: string;

  // ═══════════════════════════════════════════════════════════════
  // MECHANICS 2.0 EXTENSIONS (Tier 0-1)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Unit's current facing direction (Tier 0: Facing mechanic).
   * When enabled, determines attack arcs (front/flank/rear) for combat bonuses.
   * Defaults to 'S' (South) if not set.
   *
   * @see FacingDirection
   * @example
   * const unit: BattleUnit = { ...baseUnit, facing: 'N' };
   */
  facing?: FacingDirection;

  /**
   * Unit's current resolve/morale value (Tier 1: Resolve mechanic).
   * Represents unit morale - when it reaches 0, faction-specific behavior triggers:
   * - Human units retreat from battle
   * - Undead units crumble and are destroyed
   *
   * Resolve regenerates at turn start (default: +5 per turn).
   * Flanking and rear attacks deal additional resolve damage.
   *
   * If not set, defaults to maxResolve from ResolveConfig (default: 100).
   *
   * @example
   * const unit: BattleUnit = { ...baseUnit, resolve: 75 };
   */
  resolve?: number;

  /**
   * Whether unit is currently engaged in melee combat (Tier 1: Engagement mechanic).
   * A unit becomes engaged when it enters an enemy's Zone of Control (ZoC).
   *
   * Effects of being engaged:
   * - Ranged units suffer accuracy penalty (default: 50% damage reduction)
   * - Moving out of engagement triggers Attack of Opportunity
   * - Pinned units (engaged by 2+ enemies) have harder time disengaging
   *
   * Updated automatically by the engagement processor after movement.
   * If not set, defaults to false (unit is free).
   *
   * @see EngagementConfig for configuration options
   * @example
   * const unit: BattleUnit = { ...baseUnit, engaged: true };
   */
  engaged?: boolean;

  /**
   * Unit's faction identifier (Tier 1: Resolve mechanic).
   * Determines faction-specific behavior when resolve reaches 0:
   * - 'human': Unit retreats from battle (if humanRetreat enabled)
   * - 'undead': Unit crumbles and is destroyed (if undeadCrumble enabled)
   * - Other values: Custom faction behavior (defaults to human-like)
   *
   * Used by the resolve processor to determine morale break behavior.
   * If not set, defaults to 'human'.
   *
   * @see ResolveConfig for configuration options
   * @example
   * const unit: BattleUnit = { ...baseUnit, faction: 'undead' };
   */
  faction?: string;

  // ═══════════════════════════════════════════════════════════════
  // MECHANICS 2.0 EXTENSIONS (Tier 2)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Current riposte charges remaining this round (Tier 2: Riposte mechanic).
   * Decremented each time unit performs a riposte counter-attack.
   * Reset at the start of each round.
   *
   * Riposte allows defenders to counter-attack when hit from the front arc.
   * Attacks from flank or rear disable riposte.
   *
   * The number of charges is determined by RiposteConfig.chargesPerRound:
   * - 'attackCount': Uses unit's attackCount stat (default: 1)
   * - number: Fixed number of charges per round
   *
   * If not set, defaults to maxRiposteCharges or unit's attackCount.
   *
   * @see RiposteConfig for configuration options
   * @example
   * const unit: BattleUnit = { ...baseUnit, riposteCharges: 2 };
   */
  riposteCharges?: number;

  /**
   * Unit classification tags (Tier 2+: Various mechanics).
   * Tags are used to identify special unit capabilities or classifications
   * that affect how mechanics interact with the unit.
   *
   * Common tags used by mechanics:
   * - 'spear_wall': Unit can counter cavalry charges (Tier 3: Charge mechanic)
   * - 'cavalry': Unit can perform charge attacks with momentum
   * - 'ranged': Unit uses ranged attacks (affected by engagement penalty)
   * - 'heavy': Unit has reduced knockback/displacement
   * - 'flying': Unit ignores terrain and some ground effects
   *
   * Tags are checked by various processors to determine special interactions.
   * If not set, defaults to empty array (no special tags).
   *
   * @see ChargeConfig for charge/spear_wall interaction
   * @example
   * const spearman: BattleUnit = { ...baseUnit, tags: ['spear_wall', 'heavy'] };
   * const cavalry: BattleUnit = { ...baseUnit, tags: ['cavalry'] };
   */
  tags?: string[];

  /**
   * Auras this unit projects (Tier 2: Aura mechanic).
   * Auras are area effects that influence nearby allies or enemies.
   *
   * Aura types:
   * - Static: Always active while unit is alive (e.g., leadership aura)
   * - Pulse: Applies effect once per turn to units in range (e.g., healing pulse)
   * - Relic: Item-based aura with special properties (e.g., artifact effects)
   *
   * Auras can provide various effects:
   * - Stat buffs/debuffs (ATK, armor, speed, etc.)
   * - Healing or damage over time
   * - Resolve modifications
   * - Status effect immunity or application
   *
   * If not set, defaults to empty array (unit has no auras).
   *
   * @see BattleAura for aura definition structure
   * @example
   * const leader: BattleUnit = {
   *   ...baseUnit,
   *   auras: [{
   *     id: 'leadership',
   *     name: 'Leadership',
   *     type: 'static',
   *     target: 'allies',
   *     range: 2,
   *     effect: { type: 'buff_stat', stat: 'atk', value: 0.1, isPercentage: true },
   *     stackable: false,
   *   }],
   * };
   */
  auras?: BattleAura[];
}

/**
 * Final unit state after battle completion.
 */
export interface FinalUnitState {
  /** Unit instance ID */
  instanceId: string;
  /** Final hit points */
  currentHp: number;
  /** Final position */
  position: Position;
  /** Survival status */
  alive: boolean;
}

/**
 * Complete battle simulation result.
 * Contains all information needed for replay and analysis.
 *
 * @typeParam TEvent - Type of battle events (can be extended)
 */
export interface BattleResult<TEvent = unknown> {
  /** Chronological list of all battle events */
  events: TEvent[];
  /** Battle outcome */
  winner: BattleWinner;
  /** Final state of all units */
  finalState: {
    /** Player team final states */
    playerUnits: FinalUnitState[];
    /** Bot team final states */
    botUnits: FinalUnitState[];
  };
  /** Battle metadata */
  metadata: {
    /** Total rounds fought */
    totalRounds: number;
    /** Battle duration in milliseconds */
    durationMs: number;
    /** Random seed used (for deterministic replay) */
    seed?: number;
  };
}

/**
 * Battle state during simulation.
 * Used by action execution and ability systems.
 * 
 * @typeParam TUnit - Type of battle units (can be extended with game-specific fields)
 */
export interface BattleState<TUnit = BattleUnit> {
  /** All units in battle */
  units: TUnit[];
  /** Current round number */
  round: number;
  /** Battle events log */
  events: unknown[];
}

// Note: TargetStrategy and TargetSelectionResult are defined in core/battle/targeting.ts
// to keep targeting logic self-contained with its own types
