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
  | 'battle_end';

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
