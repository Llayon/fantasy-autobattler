/**
 * Ability System Types for the core battle engine.
 * These types are game-agnostic and can be used across different projects.
 *
 * @module core/types/ability
 */

// =============================================================================
// ENUMS & UNION TYPES
// =============================================================================

/**
 * Type of ability - determines when and how it activates.
 * - active: Manually triggered, has cooldown
 * - passive: Always active, provides continuous effects
 */
export type AbilityType = 'active' | 'passive';

/**
 * Target selection type for abilities.
 */
export type TargetType =
  | 'self'
  | 'ally'
  | 'enemy'
  | 'area'
  | 'all_enemies'
  | 'all_allies'
  | 'random_enemy'
  | 'random_ally'
  | 'lowest_hp_ally'
  | 'lowest_hp_enemy';

/**
 * Type of effect an ability can apply.
 */
export type EffectType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'stun'
  | 'taunt'
  | 'summon'
  | 'shield'
  | 'dot'
  | 'hot'
  | 'cleanse'
  | 'dispel';

/**
 * Damage type for damage effects.
 * - physical: Reduced by armor
 * - magical: Ignores armor
 * - true: Cannot be reduced
 */
export type DamageType = 'physical' | 'magical' | 'true';

/**
 * Stat that can be modified by buffs/debuffs.
 */
export type ModifiableStat =
  | 'attack'
  | 'armor'
  | 'speed'
  | 'initiative'
  | 'dodge'
  | 'attackCount'
  | 'range';

/**
 * Trigger condition for passive abilities.
 */
export type PassiveTrigger =
  | 'on_turn_start'
  | 'on_turn_end'
  | 'on_attack'
  | 'on_hit'
  | 'on_kill'
  | 'on_death'
  | 'on_ally_death'
  | 'on_low_hp'
  | 'on_battle_start';

// =============================================================================
// EFFECT INTERFACES
// =============================================================================

/**
 * Base interface for all ability effects.
 */
interface BaseAbilityEffect {
  type: EffectType;
  duration?: number;
  chance?: number;
}

/**
 * Damage effect configuration.
 */
export interface DamageEffect extends BaseAbilityEffect {
  type: 'damage';
  value: number;
  damageType: DamageType;
  attackScaling?: number;
}

/**
 * Heal effect configuration.
 */
export interface HealEffect extends BaseAbilityEffect {
  type: 'heal';
  value: number;
  attackScaling?: number;
  canOverheal?: boolean;
}

/**
 * Buff effect configuration.
 */
export interface BuffEffect extends BaseAbilityEffect {
  type: 'buff';
  stat: ModifiableStat;
  value?: number;
  percentage?: number;
  duration: number;
  stackable?: boolean;
  maxStacks?: number;
}

/**
 * Debuff effect configuration.
 */
export interface DebuffEffect extends BaseAbilityEffect {
  type: 'debuff';
  stat: ModifiableStat;
  value?: number;
  percentage?: number;
  duration: number;
  stackable?: boolean;
  maxStacks?: number;
}

/**
 * Stun effect configuration.
 */
export interface StunEffect extends BaseAbilityEffect {
  type: 'stun';
  duration: number;
}

/**
 * Taunt effect configuration.
 */
export interface TauntEffect extends BaseAbilityEffect {
  type: 'taunt';
  duration: number;
}

/**
 * Summon effect configuration.
 * Generic version - TUnitId can be specialized per game.
 */
export interface SummonEffect<TUnitId = string> extends BaseAbilityEffect {
  type: 'summon';
  summonUnitId: TUnitId;
  count: number;
  duration?: number;
}

/**
 * Shield effect configuration.
 */
export interface ShieldEffect extends BaseAbilityEffect {
  type: 'shield';
  value: number;
  attackScaling?: number;
  duration?: number;
}

/**
 * Damage over time effect configuration.
 */
export interface DotEffect extends BaseAbilityEffect {
  type: 'dot';
  value: number;
  damageType: DamageType;
  duration: number;
}

/**
 * Heal over time effect configuration.
 */
export interface HotEffect extends BaseAbilityEffect {
  type: 'hot';
  value: number;
  duration: number;
}

/**
 * Cleanse effect configuration.
 */
export interface CleanseEffect extends BaseAbilityEffect {
  type: 'cleanse';
  count?: number;
}

/**
 * Dispel effect configuration.
 */
export interface DispelEffect extends BaseAbilityEffect {
  type: 'dispel';
  count?: number;
}

/**
 * Union type of all ability effects.
 */
export type AbilityEffect<TUnitId = string> =
  | DamageEffect
  | HealEffect
  | BuffEffect
  | DebuffEffect
  | StunEffect
  | TauntEffect
  | SummonEffect<TUnitId>
  | ShieldEffect
  | DotEffect
  | HotEffect
  | CleanseEffect
  | DispelEffect;

// =============================================================================
// ABILITY INTERFACES
// =============================================================================

/**
 * Unique identifier for abilities.
 */
export type AbilityId = string;

/**
 * Base interface for all abilities.
 */
export interface BaseAbility<TUnitId = string> {
  id: AbilityId;
  name: string;
  description: string;
  type: AbilityType;
  targetType: TargetType;
  range: number;
  effects: AbilityEffect<TUnitId>[];
  icon?: string;
}

/**
 * Active ability that can be triggered.
 */
export interface ActiveAbility<TUnitId = string> extends BaseAbility<TUnitId> {
  type: 'active';
  cooldown: number;
  manaCost?: number;
  areaSize?: number;
  usableWhileStunned?: boolean;
}

/**
 * Passive ability that triggers automatically.
 */
export interface PassiveAbility<TUnitId = string> extends BaseAbility<TUnitId> {
  type: 'passive';
  trigger: PassiveTrigger;
  triggerThreshold?: number;
  internalCooldown?: number;
  maxTriggers?: number;
}

/**
 * Union type of all abilities.
 */
export type Ability<TUnitId = string> = ActiveAbility<TUnitId> | PassiveAbility<TUnitId>;

// =============================================================================
// RUNTIME STATE INTERFACES
// =============================================================================

/**
 * Runtime state for an active ability during battle.
 */
export interface ActiveAbilityState<TUnitId = string> {
  ability: ActiveAbility<TUnitId>;
  currentCooldown: number;
  usageCount: number;
}

/**
 * Runtime state for a passive ability during battle.
 */
export interface PassiveAbilityState<TUnitId = string> {
  ability: PassiveAbility<TUnitId>;
  currentCooldown: number;
  triggerCount: number;
  isActive: boolean;
}

/**
 * Active status effect on a unit.
 */
export interface StatusEffect<TUnitId = string> {
  id: string;
  sourceAbilityId: AbilityId;
  sourceUnitId: string;
  effect: AbilityEffect<TUnitId>;
  remainingDuration: number;
  stacks: number;
}

/**
 * Shield instance on a unit.
 */
export interface ShieldInstance {
  id: string;
  sourceAbilityId: AbilityId;
  remainingValue: number;
  remainingDuration?: number;
}

// =============================================================================
// STATUS EFFECTS TYPES (from status-effects.ts)
// =============================================================================

import { BattleUnit, UnitStats } from './battle.types';

/**
 * Extended battle unit with status effects tracking.
 */
export interface BattleUnitWithEffects<TUnitId = string> extends BattleUnit {
  statusEffects: StatusEffect<TUnitId>[];
  isStunned: boolean;
  hasTaunt: boolean;
}

/**
 * Result of applying a status effect.
 */
export interface ApplyEffectResult<TUnitId = string> {
  unit: BattleUnitWithEffects<TUnitId>;
  applied: boolean;
  message: string;
}

/**
 * Result of ticking status effects at turn end.
 */
export interface TickEffectsResult<TUnitId = string> {
  unit: BattleUnitWithEffects<TUnitId>;
  expiredEffects: StatusEffect<TUnitId>[];
  dotDamage: number;
  hotHealing: number;
}

/**
 * Modified stats after applying all active effects.
 */
export interface ModifiedStatsResult {
  stats: UnitStats;
  modifications: Record<ModifiableStat, { flat: number; percentage: number }>;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if ability is active.
 */
export function isActiveAbility<TUnitId = string>(
  ability: Ability<TUnitId>
): ability is ActiveAbility<TUnitId> {
  return ability.type === 'active';
}

/**
 * Type guard to check if ability is passive.
 */
export function isPassiveAbility<TUnitId = string>(
  ability: Ability<TUnitId>
): ability is PassiveAbility<TUnitId> {
  return ability.type === 'passive';
}

/**
 * Type guard to check if effect is damage effect.
 */
export function isDamageEffect(effect: AbilityEffect): effect is DamageEffect {
  return effect.type === 'damage';
}

/**
 * Type guard to check if effect is heal effect.
 */
export function isHealEffect(effect: AbilityEffect): effect is HealEffect {
  return effect.type === 'heal';
}

/**
 * Type guard to check if effect is buff effect.
 */
export function isBuffEffect(effect: AbilityEffect): effect is BuffEffect {
  return effect.type === 'buff';
}

/**
 * Type guard to check if effect is debuff effect.
 */
export function isDebuffEffect(effect: AbilityEffect): effect is DebuffEffect {
  return effect.type === 'debuff';
}
