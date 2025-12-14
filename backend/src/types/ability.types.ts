/**
 * Ability System Types for Fantasy Autobattler.
 * Defines types for unit abilities, effects, and targeting.
 * 
 * @fileoverview Complete type definitions for the ability system.
 */

import { UnitId } from '../unit/unit.data';

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
 * - self: Targets the caster only
 * - ally: Targets a single allied unit
 * - enemy: Targets a single enemy unit
 * - area: Targets an area (uses areaSize)
 * - all_enemies: Targets all enemy units
 * - all_allies: Targets all allied units
 * - random_enemy: Targets a random enemy
 * - random_ally: Targets a random ally
 * - lowest_hp_ally: Targets ally with lowest HP
 * - lowest_hp_enemy: Targets enemy with lowest HP
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
 * - damage: Deals damage to target(s)
 * - heal: Restores HP to target(s)
 * - buff: Applies positive stat modifier
 * - debuff: Applies negative stat modifier
 * - stun: Prevents target from acting
 * - taunt: Forces enemies to attack this unit
 * - summon: Creates a new unit on the battlefield
 * - shield: Absorbs incoming damage
 * - dot: Damage over time effect
 * - hot: Heal over time effect
 * - cleanse: Removes debuffs
 * - dispel: Removes buffs from enemies
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
 * - on_turn_start: Triggers at the start of unit's turn
 * - on_turn_end: Triggers at the end of unit's turn
 * - on_attack: Triggers when unit attacks
 * - on_hit: Triggers when unit is hit
 * - on_kill: Triggers when unit kills an enemy
 * - on_death: Triggers when unit dies
 * - on_ally_death: Triggers when an ally dies
 * - on_low_hp: Triggers when HP falls below threshold
 * - on_battle_start: Triggers at battle start
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
  /** Type of effect */
  type: EffectType;
  /** Duration in turns (0 = instant, undefined = permanent for passives) */
  duration?: number;
  /** Chance to apply effect (0-100, default 100) */
  chance?: number;
}

/**
 * Damage effect configuration.
 */
export interface DamageEffect extends BaseAbilityEffect {
  type: 'damage';
  /** Base damage value */
  value: number;
  /** Type of damage */
  damageType: DamageType;
  /** Scaling factor from attack stat (0-1) */
  attackScaling?: number;
}

/**
 * Heal effect configuration.
 */
export interface HealEffect extends BaseAbilityEffect {
  type: 'heal';
  /** Base heal value */
  value: number;
  /** Scaling factor from attack stat (0-1) */
  attackScaling?: number;
  /** Whether heal can exceed max HP */
  canOverheal?: boolean;
}

/**
 * Buff effect configuration.
 */
export interface BuffEffect extends BaseAbilityEffect {
  type: 'buff';
  /** Stat to modify */
  stat: ModifiableStat;
  /** Flat value to add */
  value?: number;
  /** Percentage modifier (e.g., 0.2 = +20%) */
  percentage?: number;
  /** Duration in turns */
  duration: number;
  /** Whether buff stacks with same type */
  stackable?: boolean;
  /** Maximum stacks */
  maxStacks?: number;
}

/**
 * Debuff effect configuration.
 */
export interface DebuffEffect extends BaseAbilityEffect {
  type: 'debuff';
  /** Stat to modify */
  stat: ModifiableStat;
  /** Flat value to subtract */
  value?: number;
  /** Percentage modifier (e.g., 0.2 = -20%) */
  percentage?: number;
  /** Duration in turns */
  duration: number;
  /** Whether debuff stacks with same type */
  stackable?: boolean;
  /** Maximum stacks */
  maxStacks?: number;
}

/**
 * Stun effect configuration.
 */
export interface StunEffect extends BaseAbilityEffect {
  type: 'stun';
  /** Duration in turns */
  duration: number;
}

/**
 * Taunt effect configuration.
 */
export interface TauntEffect extends BaseAbilityEffect {
  type: 'taunt';
  /** Duration in turns */
  duration: number;
}

/**
 * Summon effect configuration.
 */
export interface SummonEffect extends BaseAbilityEffect {
  type: 'summon';
  /** ID of unit to summon */
  summonUnitId: UnitId;
  /** Number of units to summon */
  count: number;
  /** Duration in turns (undefined = permanent) */
  duration?: number;
}

/**
 * Shield effect configuration.
 */
export interface ShieldEffect extends BaseAbilityEffect {
  type: 'shield';
  /** Shield HP value */
  value: number;
  /** Scaling factor from attack stat (0-1) */
  attackScaling?: number;
  /** Duration in turns (undefined = until depleted) */
  duration?: number;
}

/**
 * Damage over time effect configuration.
 */
export interface DotEffect extends BaseAbilityEffect {
  type: 'dot';
  /** Damage per tick */
  value: number;
  /** Type of damage */
  damageType: DamageType;
  /** Duration in turns */
  duration: number;
}

/**
 * Heal over time effect configuration.
 */
export interface HotEffect extends BaseAbilityEffect {
  type: 'hot';
  /** Heal per tick */
  value: number;
  /** Duration in turns */
  duration: number;
}

/**
 * Cleanse effect configuration.
 */
export interface CleanseEffect extends BaseAbilityEffect {
  type: 'cleanse';
  /** Number of debuffs to remove (undefined = all) */
  count?: number;
}

/**
 * Dispel effect configuration.
 */
export interface DispelEffect extends BaseAbilityEffect {
  type: 'dispel';
  /** Number of buffs to remove (undefined = all) */
  count?: number;
}

/**
 * Union type of all ability effects.
 */
export type AbilityEffect = 
  | DamageEffect
  | HealEffect
  | BuffEffect
  | DebuffEffect
  | StunEffect
  | TauntEffect
  | SummonEffect
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
interface BaseAbility {
  /** Unique ability identifier */
  id: AbilityId;
  /** Display name */
  name: string;
  /** Description for UI */
  description: string;
  /** Ability type (active/passive) */
  type: AbilityType;
  /** Target selection type */
  targetType: TargetType;
  /** Range in grid cells (0 = melee, -1 = unlimited) */
  range: number;
  /** Effects applied by this ability */
  effects: AbilityEffect[];
  /** Icon identifier for UI */
  icon?: string;
}

/**
 * Active ability that can be triggered.
 * Has cooldown and optional mana cost.
 * 
 * @example
 * const fireball: ActiveAbility = {
 *   id: 'fireball',
 *   name: 'Fireball',
 *   description: 'Launches a fireball dealing magic damage',
 *   type: 'active',
 *   targetType: 'enemy',
 *   cooldown: 3,
 *   range: 4,
 *   effects: [{
 *     type: 'damage',
 *     value: 30,
 *     damageType: 'magical',
 *     attackScaling: 0.5
 *   }]
 * };
 */
export interface ActiveAbility extends BaseAbility {
  type: 'active';
  /** Cooldown in turns after use */
  cooldown: number;
  /** Mana cost (optional, for future mana system) */
  manaCost?: number;
  /** Area size for area-targeting abilities */
  areaSize?: number;
  /** Whether ability can be used while stunned */
  usableWhileStunned?: boolean;
}

/**
 * Passive ability that triggers automatically.
 * Has trigger condition and optional internal cooldown.
 * 
 * @example
 * const lastStand: PassiveAbility = {
 *   id: 'last_stand',
 *   name: 'Last Stand',
 *   description: 'Gains +50% attack when below 30% HP',
 *   type: 'passive',
 *   targetType: 'self',
 *   trigger: 'on_low_hp',
 *   triggerThreshold: 30,
 *   range: 0,
 *   effects: [{
 *     type: 'buff',
 *     stat: 'attack',
 *     percentage: 0.5,
 *     duration: 1
 *   }]
 * };
 */
export interface PassiveAbility extends BaseAbility {
  type: 'passive';
  /** Trigger condition */
  trigger: PassiveTrigger;
  /** Threshold for trigger (e.g., HP percentage for on_low_hp) */
  triggerThreshold?: number;
  /** Internal cooldown in turns (prevents re-triggering) */
  internalCooldown?: number;
  /** Maximum times this can trigger per battle */
  maxTriggers?: number;
}

/**
 * Union type of all abilities.
 */
export type Ability = ActiveAbility | PassiveAbility;

// =============================================================================
// RUNTIME STATE INTERFACES
// =============================================================================

/**
 * Runtime state for an active ability during battle.
 */
export interface ActiveAbilityState {
  /** Ability definition */
  ability: ActiveAbility;
  /** Current cooldown remaining (0 = ready) */
  currentCooldown: number;
  /** Times used this battle */
  usageCount: number;
}

/**
 * Runtime state for a passive ability during battle.
 */
export interface PassiveAbilityState {
  /** Ability definition */
  ability: PassiveAbility;
  /** Current internal cooldown remaining */
  currentCooldown: number;
  /** Times triggered this battle */
  triggerCount: number;
  /** Whether ability is currently active */
  isActive: boolean;
}

/**
 * Active status effect on a unit.
 */
export interface StatusEffect {
  /** Unique instance ID */
  id: string;
  /** Source ability ID */
  sourceAbilityId: AbilityId;
  /** Source unit ID */
  sourceUnitId: string;
  /** Effect configuration */
  effect: AbilityEffect;
  /** Remaining duration in turns */
  remainingDuration: number;
  /** Current stack count */
  stacks: number;
}

/**
 * Shield instance on a unit.
 */
export interface ShieldInstance {
  /** Unique instance ID */
  id: string;
  /** Source ability ID */
  sourceAbilityId: AbilityId;
  /** Remaining shield HP */
  remainingValue: number;
  /** Remaining duration (undefined = until depleted) */
  remainingDuration?: number;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if ability is active.
 * 
 * @param ability - Ability to check
 * @returns True if ability is active type
 * @example
 * if (isActiveAbility(ability)) {
 *   console.log(ability.cooldown);
 * }
 */
export function isActiveAbility(ability: Ability): ability is ActiveAbility {
  return ability.type === 'active';
}

/**
 * Type guard to check if ability is passive.
 * 
 * @param ability - Ability to check
 * @returns True if ability is passive type
 * @example
 * if (isPassiveAbility(ability)) {
 *   console.log(ability.trigger);
 * }
 */
export function isPassiveAbility(ability: Ability): ability is PassiveAbility {
  return ability.type === 'passive';
}

/**
 * Type guard to check if effect is damage effect.
 * 
 * @param effect - Effect to check
 * @returns True if effect is damage type
 */
export function isDamageEffect(effect: AbilityEffect): effect is DamageEffect {
  return effect.type === 'damage';
}

/**
 * Type guard to check if effect is heal effect.
 * 
 * @param effect - Effect to check
 * @returns True if effect is heal type
 */
export function isHealEffect(effect: AbilityEffect): effect is HealEffect {
  return effect.type === 'heal';
}

/**
 * Type guard to check if effect is buff effect.
 * 
 * @param effect - Effect to check
 * @returns True if effect is buff type
 */
export function isBuffEffect(effect: AbilityEffect): effect is BuffEffect {
  return effect.type === 'buff';
}

/**
 * Type guard to check if effect is debuff effect.
 * 
 * @param effect - Effect to check
 * @returns True if effect is debuff type
 */
export function isDebuffEffect(effect: AbilityEffect): effect is DebuffEffect {
  return effect.type === 'debuff';
}
