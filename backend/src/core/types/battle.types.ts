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

// ═══════════════════════════════════════════════════════════════
// STATUS EFFECT TYPES (Tier 4: Contagion mechanic and Ability system)
// ═══════════════════════════════════════════════════════════════

/**
 * Type of status effect.
 * Determines how the effect modifies unit behavior or stats.
 *
 * - damage: Direct damage effect
 * - heal: Direct healing effect
 * - buff: Positive stat modification
 * - debuff: Negative stat modification
 * - stun: Prevents unit from acting
 * - taunt: Forces enemies to target this unit
 * - dot: Damage over time (fire, poison, etc.)
 * - hot: Healing over time
 * - shield: Absorbs incoming damage
 * - cleanse: Removes negative effects
 * - dispel: Removes positive effects from enemies
 */
export type BattleStatusEffectType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'stun'
  | 'taunt'
  | 'dot'
  | 'hot'
  | 'shield'
  | 'cleanse'
  | 'dispel';

/**
 * Contagious effect types that can spread between units.
 * Used by the Contagion mechanic (Tier 4).
 *
 * - fire: Burns spread quickly (50% base chance)
 * - poison: Toxins spread through contact (30% base chance)
 * - curse: Magical afflictions spread slowly (25% base chance)
 * - frost: Cold effects spread slowly (20% base chance)
 * - plague: Disease spreads rapidly (60% base chance)
 */
export type BattleContagionType = 'fire' | 'poison' | 'curse' | 'frost' | 'plague';

/**
 * Active status effect on a unit.
 * Represents a temporary modification to unit state from abilities or contagion.
 *
 * This is a simplified interface for BattleUnit. For full status effect tracking
 * with ability integration, see StatusEffect in ability.types.ts.
 *
 * @example
 * // Burn effect (DoT)
 * const burnEffect: BattleStatusEffect = {
 *   id: 'burn_1',
 *   type: 'dot',
 *   value: 5,
 *   duration: 3,
 *   sourceUnitId: 'mage_1',
 * };
 *
 * // Attack buff
 * const atkBuff: BattleStatusEffect = {
 *   id: 'inspire_1',
 *   type: 'buff',
 *   stat: 'atk',
 *   value: 0.2,
 *   isPercentage: true,
 *   duration: 2,
 *   sourceUnitId: 'bard_1',
 * };
 */
export interface BattleStatusEffect {
  /** Unique identifier for this effect instance (optional for simple effects) */
  id?: string;

  /** Effect type (determines behavior) */
  type: BattleStatusEffectType | BattleContagionType | string;

  /** Effect value (damage, heal amount, or stat modifier) */
  value?: number;

  /** Stat being modified (for buff/debuff effects) */
  stat?: BattleAuraStat;

  /** Whether value is a percentage (true) or flat amount (false) */
  isPercentage?: boolean;

  /** Remaining duration in turns */
  duration: number;

  /** ID of the unit that applied this effect */
  sourceUnitId?: string;

  /** ID of the ability that created this effect */
  sourceAbilityId?: string;

  /** Current stack count (for stackable effects) */
  stacks?: number;

  /** Maximum stacks allowed */
  maxStacks?: number;

  /** Whether this effect was spread from another unit (contagion) */
  isSpread?: boolean;

  /** ID of unit this effect spread from (if isSpread is true) */
  spreadFromId?: string;
}

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

  // ═══════════════════════════════════════════════════════════════
  // MECHANICS 2.0 EXTENSIONS (Tier 3)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Unit's current momentum value (Tier 3: Charge mechanic).
   * Momentum accumulates based on distance moved before attacking.
   * Provides a damage bonus when attacking after movement.
   *
   * Momentum calculation:
   * - If distance < minChargeDistance: momentum = 0
   * - Otherwise: momentum = min(maxMomentum, distance * momentumPerCell)
   *
   * Default config values:
   * - momentumPerCell: 0.2 (+20% damage per cell moved)
   * - maxMomentum: 1.0 (+100% maximum damage bonus)
   * - minChargeDistance: 3 cells
   *
   * Momentum is reset after attacking or at turn end.
   * Primarily used by cavalry units with 'cavalry' or 'charge' tags.
   *
   * If not set, defaults to 0 (no momentum).
   *
   * @see ChargeConfig for configuration options
   * @example
   * // Cavalry that moved 4 cells with default config:
   * // momentum = 4 * 0.2 = 0.8 (+80% damage bonus)
   * const cavalry: BattleUnit = { ...baseUnit, momentum: 0.8 };
   */
  momentum?: number;

  /**
   * Whether unit is currently in a phalanx formation (Tier 3: Phalanx mechanic).
   * True when unit has at least one adjacent ally facing the same direction.
   *
   * Units in phalanx receive defensive bonuses:
   * - Armor bonus: +1 per adjacent ally (default, capped at +5)
   * - Resolve bonus: +5 per adjacent ally (default, capped at +25)
   *
   * Phalanx formation requires:
   * - Unit has 'phalanx' tag (typically infantry with shields)
   * - Unit has facing direction set
   * - At least one adjacent ally facing the same direction
   *
   * Formation is recalculated after:
   * - Unit movement
   * - Unit death (casualties break formation)
   * - Facing direction change
   *
   * If not set, defaults to false (unit is not in formation).
   *
   * @see PhalanxConfig for configuration options
   * @see UnitWithPhalanx for full phalanx state (adjacentAlliesCount, bonuses, etc.)
   * @example
   * const spearman: BattleUnit = { ...baseUnit, inPhalanx: true, tags: ['phalanx'] };
   */
  inPhalanx?: boolean;

  /**
   * Current ammunition count for ranged units (Tier 3: Ammunition mechanic).
   * Decremented on each ranged attack. When ammo reaches 0, unit cannot
   * perform ranged attacks until reloaded.
   *
   * Ammunition tracking:
   * - Each ranged attack consumes 1 ammo (configurable)
   * - Units with 'unlimited_ammo' tag ignore ammo consumption
   * - Ammo can be restored via reload action at turn start (if configured)
   *
   * Default config values:
   * - defaultAmmo: 6 (starting ammunition)
   * - autoReload: false (no automatic reload)
   *
   * Only used by units with 'ranged' tag. Mage units use cooldowns instead.
   * If not set, defaults to defaultAmmo from AmmoConfig (default: 6).
   *
   * @see AmmoConfig for configuration options
   * @see UnitWithAmmunition for full ammunition state (maxAmmo, ammoState, etc.)
   * @example
   * // Archer with 4 arrows remaining
   * const archer: BattleUnit = { ...baseUnit, ammo: 4, tags: ['ranged'] };
   */
  ammo?: number;

  /**
   * Ability cooldowns map for mage units (Tier 3: Ammunition mechanic).
   * Key: ability ID, Value: turns remaining until ability is ready.
   * When cooldown reaches 0, the ability can be used again.
   *
   * Cooldown tracking:
   * - Each ability use triggers its cooldown (configurable duration)
   * - Cooldowns decrease by 1 at the start of each turn
   * - Units with 'quick_cooldown' tag have reduced cooldown durations
   * - Abilities not in the map are considered ready (cooldown = 0)
   *
   * Default config values:
   * - defaultCooldown: 3 (turns before ability is ready again)
   *
   * Only used by units with 'mage' tag. Ranged units use ammo instead.
   * If not set, defaults to empty object (all abilities ready).
   *
   * @see AmmoConfig for configuration options
   * @see UnitWithAmmunition for full cooldown state
   * @example
   * // Mage with fireball on cooldown (2 turns remaining)
   * const mage: BattleUnit = {
   *   ...baseUnit,
   *   cooldowns: { fireball: 2, frostbolt: 0 },
   *   tags: ['mage'],
   * };
   */
  cooldowns?: Record<string, number>;

  // ═══════════════════════════════════════════════════════════════
  // MECHANICS 2.0 EXTENSIONS (Tier 4)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Accumulated armor shred on this unit (Tier 4: Armor Shred mechanic).
   * Reduces effective armor by this amount when calculating damage.
   *
   * Armor shred mechanics:
   * - Physical attacks apply shred to targets (default: 1 per attack)
   * - Shred accumulates up to a maximum percentage of base armor
   * - Effective armor = base armor - accumulated shred
   * - Optional decay reduces shred at turn end (default: no decay)
   *
   * Maximum shred calculation:
   * - maxShred = floor(baseArmor * maxShredPercent)
   * - Default maxShredPercent: 0.4 (40% of base armor)
   *
   * Example with default config:
   * - Unit with 10 armor can have max 4 shred (40% of 10)
   * - After 4 physical attacks: effective armor = 10 - 4 = 6
   *
   * Armor shred is a fully independent mechanic (no dependencies).
   * If not set, defaults to 0 (no shred applied).
   *
   * @see ShredConfig for configuration options
   * @see UnitWithArmorShred for full armor shred state interface
   * @example
   * // Unit with 10 base armor and 3 accumulated shred
   * // Effective armor = 10 - 3 = 7
   * const shreddedUnit: BattleUnit = {
   *   ...baseUnit,
   *   stats: { ...baseStats, armor: 10 },
   *   armorShred: 3,
   * };
   */
  armorShred?: number;

  /**
   * Active status effects on this unit (Tier 4: Contagion mechanic and Ability system).
   * Status effects represent temporary modifications to unit state such as
   * buffs, debuffs, damage over time, healing over time, stuns, etc.
   *
   * Status effects are used by multiple systems:
   * - Ability System: Buffs, debuffs, stuns, taunts, DoT, HoT from abilities
   * - Contagion Mechanic: Spreading effects (fire, poison, curse, frost, plague)
   *
   * Each status effect contains:
   * - id: Unique identifier for the effect instance
   * - sourceAbilityId: ID of the ability that created this effect
   * - sourceUnitId: ID of the unit that applied this effect
   * - effect: The actual effect definition (damage, heal, buff, etc.)
   * - remainingDuration: Turns until effect expires
   * - stacks: Number of stacks (for stackable effects)
   *
   * Status effects are processed at various battle phases:
   * - Turn start: DoT damage, HoT healing, duration tick
   * - Turn end: Contagion spread to adjacent units
   * - On attack: Some effects trigger on attack
   *
   * If not set, defaults to empty array (no active effects).
   *
   * @see StatusEffect for effect structure
   * @see BattleUnitWithEffects for full status effect tracking interface
   * @see ContagionConfig for contagion spread configuration
   * @example
   * // Unit with a burn effect (DoT) and an attack buff
   * const buffedUnit: BattleUnit = {
   *   ...baseUnit,
   *   statusEffects: [
   *     {
   *       id: 'burn_1',
   *       sourceAbilityId: 'fireball',
   *       sourceUnitId: 'mage_1',
   *       effect: { type: 'dot', value: 5, damageType: 'magical', duration: 3 },
   *       remainingDuration: 2,
   *       stacks: 1,
   *     },
   *     {
   *       id: 'atk_buff_1',
   *       sourceAbilityId: 'inspire',
   *       sourceUnitId: 'bard_1',
   *       effect: { type: 'buff', stat: 'attack', percentage: 20, duration: 2 },
   *       remainingDuration: 1,
   *       stacks: 1,
   *     },
   *   ],
   * };
   */
  statusEffects?: BattleStatusEffect[];

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
