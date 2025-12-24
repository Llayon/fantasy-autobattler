/**
 * Core abilities module barrel export.
 * @module core/abilities
 */

// Re-export ability types from core/types
export type {
  AbilityType,
  TargetType,
  EffectType,
  DamageType,
  ModifiableStat,
  PassiveTrigger,
  DamageEffect,
  HealEffect,
  BuffEffect,
  DebuffEffect,
  StunEffect,
  TauntEffect,
  ShieldEffect,
  DotEffect,
  HotEffect,
  CleanseEffect,
  DispelEffect,
  SummonEffect,
  AbilityEffect,
  BaseAbility,
  ActiveAbility,
  PassiveAbility,
  Ability,
  AbilityId,
  ActiveAbilityState,
  PassiveAbilityState,
  StatusEffect,
  ShieldInstance,
  BattleUnitWithEffects,
  ApplyEffectResult,
  TickEffectsResult,
  ModifiedStatsResult,
} from '../types/ability.types';

export {
  isActiveAbility,
  isPassiveAbility,
  isDamageEffect,
  isHealEffect,
  isBuffEffect,
  isDebuffEffect,
} from '../types/ability.types';

// Note: Ability executor and status effects implementations are game-specific
// and remain in battle/ directory. Only types are extracted to core.
