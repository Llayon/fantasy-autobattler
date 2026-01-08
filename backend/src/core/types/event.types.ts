/**
 * Battle Event Types for Core Library.
 * Defines all event types generated during battle simulation.
 *
 * @fileoverview Core event type definitions for battle replay and logging.
 * These types are framework-agnostic and can be used in any battle system.
 */

import { Position } from './grid.types';
import { BattleWinner } from './battle.types';

// =============================================================================
// EVENT TYPE CLASSIFICATION
// =============================================================================

/**
 * Battle event type classification.
 * Covers all possible events during battle simulation.
 */
export type BattleEventType =
  | 'move'
  | 'attack'
  | 'heal'
  | 'ability'
  | 'ability_used'
  | 'damage'
  | 'death'
  | 'buff'
  | 'debuff'
  | 'status_applied'
  | 'status_tick'
  | 'status_removed'
  | 'round_start'
  | 'battle_end'
  // Mechanics 2.0 events
  | 'mechanic_facing'
  | 'mechanic_armor_shred'
  | 'mechanic_flanking'
  | 'mechanic_charge'
  | 'mechanic_riposte'
  | 'mechanic_resolve'
  | 'mechanic_routing'
  | 'mechanic_phalanx'
  | 'mechanic_overwatch'
  | 'mechanic_contagion'
  | 'mechanic_intercept'
  | 'mechanic_aoo';

// =============================================================================
// BASE EVENT INTERFACE
// =============================================================================

/**
 * Base battle event interface.
 * All specific event types extend this interface.
 */
export interface BaseBattleEvent {
  /** Battle round number (1-based) */
  round: number;
  /** Event type classification */
  type: BattleEventType;
  /** ID of the acting unit */
  actorId: string;
  /** ID of the target unit (if applicable) */
  targetId?: string;
  /** Multiple target IDs (for AoE abilities) */
  targetIds?: string[];
  /** Additional event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Generic battle event with all optional fields.
 * Used for backward compatibility and flexible event handling.
 */
export interface BattleEvent extends BaseBattleEvent {
  /** Damage dealt */
  damage?: number;
  /** Multiple damage values (for multi-target) */
  damages?: number[];
  /** Healing amount */
  healing?: number;
  /** Movement from position */
  fromPosition?: Position;
  /** Movement to position */
  toPosition?: Position;
  /** Ability used */
  abilityId?: string;
  /** Units killed by this event */
  killedUnits?: string[];
  /** Status effect applied/removed/ticked */
  statusEffect?: {
    type: string;
    duration?: number;
    value?: number;
  };
  /** Source of damage (attack, ability, status) */
  source?: 'attack' | 'ability' | 'status';
}

// =============================================================================
// SPECIFIC EVENT TYPES
// =============================================================================

/**
 * Movement action event.
 * Records unit movement from one position to another.
 */
export interface MoveEvent extends BaseBattleEvent {
  type: 'move';
  /** Starting position */
  fromPosition: Position;
  /** Ending position */
  toPosition: Position;
  /** Path taken (for animation) */
  path?: Position[];
}

/**
 * Attack action event.
 * Records combat between two units with damage resolution.
 */
export interface AttackEvent extends BaseBattleEvent {
  type: 'attack';
  /** Target unit ID */
  targetId: string;
  /** Damage dealt */
  damage: number;
  /** Whether attack was dodged */
  dodged: boolean;
  /** Whether target was killed */
  killed: boolean;
  /** Attack type (physical/magic) */
  attackType: 'physical' | 'magic';
}

/**
 * Result of applying a single effect to a target.
 */
export interface EffectResult {
  /** Whether effect was successfully applied */
  success: boolean;
  /** Type of effect applied */
  effectType: string;
  /** Target unit ID */
  targetId: string;
  /** Damage dealt (for damage effects) */
  damage?: number;
  /** Healing done (for heal effects) */
  healing?: number;
  /** Whether target was killed */
  killed?: boolean;
  /** New HP after effect */
  newHp?: number;
  /** Buff/debuff stat modified */
  statModified?: string;
  /** Buff/debuff value applied */
  modifierValue?: number;
  /** Duration of effect in turns */
  duration?: number;
  /** Whether effect was resisted/missed */
  resisted?: boolean;
}

/**
 * Ability execution event.
 * Records ability usage with all effect results.
 */
export interface AbilityEvent extends BaseBattleEvent {
  type: 'ability';
  /** Ability ID used */
  abilityId: string;
  /** All effect results */
  effectResults: EffectResult[];
  /** Total damage dealt */
  totalDamage?: number;
  /** Total healing done */
  totalHealing?: number;
  /** Units killed by this ability */
  killedUnits?: string[];
}

/**
 * Damage event (separate from attack for ability damage).
 */
export interface DamageEvent extends BaseBattleEvent {
  type: 'damage';
  /** Target unit ID */
  targetId: string;
  /** Damage dealt */
  damage: number;
  /** Source of damage */
  source?: 'attack' | 'ability' | 'status';
}

/**
 * Death event when a unit is killed.
 */
export interface DeathEvent extends BaseBattleEvent {
  type: 'death';
  /** Units killed */
  killedUnits: string[];
}

/**
 * Heal event for healing effects.
 */
export interface HealEvent extends BaseBattleEvent {
  type: 'heal';
  /** Target unit ID */
  targetId: string;
  /** Healing amount */
  healing: number;
}

/**
 * Round start event.
 */
export interface RoundStartEvent extends BaseBattleEvent {
  type: 'round_start';
}

/**
 * Battle end event.
 */
export interface BattleEndEvent extends BaseBattleEvent {
  type: 'battle_end';
  /** Battle winner */
  winner: BattleWinner;
  /** Total rounds fought */
  totalRounds: number;
}

// =============================================================================
// MECHANICS 2.0 EVENT TYPES
// =============================================================================

/**
 * Facing mechanic event.
 * Records when a unit changes facing direction.
 */
export interface FacingEvent extends BaseBattleEvent {
  type: 'mechanic_facing';
  /** Unit that changed facing */
  targetId: string;
  /** Previous facing direction */
  previousFacing: 'N' | 'S' | 'E' | 'W';
  /** New facing direction */
  newFacing: 'N' | 'S' | 'E' | 'W';
  /** Reason for facing change */
  reason: 'attack' | 'move' | 'ability';
}

/**
 * Armor Shred mechanic event.
 * Records when armor is shredded from a target.
 */
export interface ArmorShredEvent extends BaseBattleEvent {
  type: 'mechanic_armor_shred';
  /** Target unit ID */
  targetId: string;
  /** Amount of armor shredded this attack */
  shredApplied: number;
  /** Total accumulated shred on target */
  totalShred: number;
  /** Target's base armor */
  baseArmor: number;
  /** Target's effective armor after shred */
  effectiveArmor: number;
  /** Whether shred was capped */
  wasCapped: boolean;
}

/**
 * Flanking mechanic event.
 * Records when a flanking attack occurs.
 */
export interface FlankingEvent extends BaseBattleEvent {
  type: 'mechanic_flanking';
  /** Target unit ID */
  targetId: string;
  /** Attack arc (front, flank, rear) */
  arc: 'front' | 'flank' | 'rear';
  /** Damage modifier applied */
  damageModifier: number;
  /** Resolve damage dealt (if any) */
  resolveDamage?: number;
  /** Whether riposte was disabled */
  riposteDisabled: boolean;
}

/**
 * Charge mechanic event.
 * Records when a charge attack occurs.
 */
export interface ChargeEvent extends BaseBattleEvent {
  type: 'mechanic_charge';
  /** Target unit ID */
  targetId: string;
  /** Distance charged */
  chargeDistance: number;
  /** Momentum accumulated */
  momentum: number;
  /** Damage bonus from charge */
  damageBonus: number;
  /** Whether charge was countered by spear wall */
  countered: boolean;
  /** Counter damage received (if countered) */
  counterDamage?: number;
}

/**
 * Riposte mechanic event.
 * Records when a riposte counter-attack occurs.
 */
export interface RiposteEvent extends BaseBattleEvent {
  type: 'mechanic_riposte';
  /** Original attacker ID (now target of riposte) */
  targetId: string;
  /** Riposte damage dealt */
  damage: number;
  /** Remaining riposte charges */
  chargesRemaining: number;
}

/**
 * Resolve mechanic event.
 * Records resolve changes (damage, regen, break).
 */
export interface ResolveEvent extends BaseBattleEvent {
  type: 'mechanic_resolve';
  /** Unit whose resolve changed */
  targetId: string;
  /** Type of resolve change */
  changeType: 'damage' | 'regen' | 'break' | 'retreat';
  /** Amount of resolve change */
  amount: number;
  /** New resolve value */
  newResolve: number;
  /** Source of resolve change (flanking, ability, etc.) */
  source?: string;
}

/**
 * Phalanx mechanic event.
 * Records phalanx formation changes.
 */
export interface PhalanxEvent extends BaseBattleEvent {
  type: 'mechanic_phalanx';
  /** Unit in phalanx */
  targetId: string;
  /** Whether unit entered or left phalanx */
  action: 'formed' | 'broken';
  /** Number of adjacent allies */
  adjacentAllies: number;
  /** Armor bonus from phalanx */
  armorBonus: number;
  /** Resolve bonus from phalanx */
  resolveBonus: number;
}

/**
 * Overwatch mechanic event.
 * Records overwatch shots.
 */
export interface OverwatchEvent extends BaseBattleEvent {
  type: 'mechanic_overwatch';
  /** Target unit ID */
  targetId: string;
  /** Whether shot hit */
  hit: boolean;
  /** Damage dealt (if hit) */
  damage?: number;
  /** Remaining overwatch shots */
  shotsRemaining: number;
}

/**
 * Contagion mechanic event.
 * Records effect spread between units.
 */
export interface ContagionEvent extends BaseBattleEvent {
  type: 'mechanic_contagion';
  /** Source unit ID (spreading from) */
  sourceId: string;
  /** Target unit ID (spreading to) */
  targetId: string;
  /** Effect type that spread */
  effectType: string;
  /** Whether spread was successful */
  success: boolean;
  /** Spread chance that was rolled */
  spreadChance: number;
  /** Whether phalanx bonus was applied */
  phalanxBonus: boolean;
}

/**
 * Intercept mechanic event.
 * Records when a unit intercepts another during movement.
 */
export interface InterceptEvent extends BaseBattleEvent {
  type: 'mechanic_intercept';
  /** Interceptor unit ID */
  actorId: string;
  /** Target unit ID (being intercepted) */
  targetId: string;
  /** Damage dealt (for hard intercept) */
  damage?: number;
  /** Intercept type (hard = stop cavalry, soft = engage) */
  interceptType: 'hard' | 'soft';
  /** Position where intercept occurred */
  position?: { x: number; y: number };
  /** Position where target was stopped (hard intercept) */
  stoppedAt?: { x: number; y: number };
  /** Target HP after intercept */
  targetHpAfter?: number;
}

/**
 * Attack of Opportunity mechanic event.
 * Records when a unit gets a free attack on enemy leaving ZoC.
 */
export interface AttackOfOpportunityEvent extends BaseBattleEvent {
  type: 'mechanic_aoo';
  /** Attacker unit ID (getting free attack) */
  actorId: string;
  /** Target unit ID (leaving ZoC) */
  targetId: string;
  /** Damage dealt */
  damage: number;
  /** Whether attack hit */
  hit: boolean;
  /** Position target was moving from */
  fromPosition?: { x: number; y: number };
  /** Position target was moving to */
  toPosition?: { x: number; y: number };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if event is a move event.
 *
 * @param event - Event to check
 * @returns True if event is a move event
 */
export function isMoveEvent(event: BattleEvent): event is MoveEvent {
  return event.type === 'move';
}

/**
 * Type guard to check if event is an attack event.
 *
 * @param event - Event to check
 * @returns True if event is an attack event
 */
export function isAttackEvent(event: BattleEvent): event is AttackEvent {
  return event.type === 'attack';
}

/**
 * Type guard to check if event is an ability event.
 *
 * @param event - Event to check
 * @returns True if event is an ability event
 */
export function isAbilityEvent(event: BattleEvent): event is AbilityEvent {
  return event.type === 'ability';
}

/**
 * Type guard to check if event is a damage event.
 *
 * @param event - Event to check
 * @returns True if event is a damage event
 */
export function isDamageEvent(event: BattleEvent): event is DamageEvent {
  return event.type === 'damage';
}

/**
 * Type guard to check if event is a death event.
 *
 * @param event - Event to check
 * @returns True if event is a death event
 */
export function isDeathEvent(event: BattleEvent): event is DeathEvent {
  return event.type === 'death';
}

/**
 * Type guard to check if event is a heal event.
 *
 * @param event - Event to check
 * @returns True if event is a heal event
 */
export function isHealEvent(event: BattleEvent): event is HealEvent {
  return event.type === 'heal';
}
