/**
 * Ability System Types for Fantasy Autobattler.
 * Defines types for unit abilities, effects, and targeting.
 *
 * @fileoverview Complete type definitions for the ability system.
 * Extends core ability types with game-specific UnitId.
 */

import { UnitId } from '../unit/unit.data';

// =============================================================================
// RE-EXPORTS FROM CORE TYPES (for backward compatibility)
// =============================================================================

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
  AbilityId,
  ShieldInstance,
  BattleUnitWithEffects,
  ApplyEffectResult,
  TickEffectsResult,
  ModifiedStatsResult,
} from '../core/types/ability.types';

export {
  isActiveAbility,
  isPassiveAbility,
  isDamageEffect,
  isHealEffect,
  isBuffEffect,
  isDebuffEffect,
} from '../core/types/ability.types';

// Import core types for specialization
import type {
  SummonEffect as CoreSummonEffect,
  AbilityEffect as CoreAbilityEffect,
  ActiveAbility as CoreActiveAbility,
  PassiveAbility as CorePassiveAbility,
  Ability as CoreAbility,
  ActiveAbilityState as CoreActiveAbilityState,
  PassiveAbilityState as CorePassiveAbilityState,
  StatusEffect as CoreStatusEffect,
} from '../core/types/ability.types';

// =============================================================================
// GAME-SPECIFIC TYPE SPECIALIZATIONS
// =============================================================================

/**
 * Summon effect configuration specialized with game UnitId.
 */
export interface SummonEffect extends CoreSummonEffect<UnitId> {
  type: 'summon';
  summonUnitId: UnitId;
  count: number;
  duration?: number;
}

/**
 * Union type of all ability effects (specialized with UnitId).
 */
export type AbilityEffect = CoreAbilityEffect<UnitId>;

/**
 * Active ability specialized with game UnitId.
 */
export type ActiveAbility = CoreActiveAbility<UnitId>;

/**
 * Passive ability specialized with game UnitId.
 */
export type PassiveAbility = CorePassiveAbility<UnitId>;

/**
 * Union type of all abilities (specialized with UnitId).
 */
export type Ability = CoreAbility<UnitId>;

/**
 * Runtime state for an active ability during battle.
 */
export type ActiveAbilityState = CoreActiveAbilityState<UnitId>;

/**
 * Runtime state for a passive ability during battle.
 */
export type PassiveAbilityState = CorePassiveAbilityState<UnitId>;

/**
 * Active status effect on a unit.
 */
export type StatusEffect = CoreStatusEffect<UnitId>;
