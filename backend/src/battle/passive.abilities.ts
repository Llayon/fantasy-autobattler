/**
 * Passive Abilities System for Fantasy Autobattler.
 * Handles automatic passive ability triggers and effects.
 *
 * @fileoverview Pure functions for passive ability processing.
 * All functions are deterministic for consistent replay behavior.
 *
 * Passive abilities:
 * - Evasion (Rogue): +15% dodge permanently
 * - Rage (Berserker): +50% ATK when HP < 50%
 * - Thorns (Guardian): Reflects 20% of received damage
 * - Lifesteal (Warlock): Heals 20% of damage dealt
 */

import { BattleUnit, BattleEvent } from '../types/game.types';
import { BattleState } from './actions';
import { BattleUnitWithAbilities } from './ability.executor';

// =============================================================================
// PASSIVE ABILITY CONSTANTS
// =============================================================================

/**
 * Passive ability configuration constants.
 * All values are percentages expressed as decimals (0.15 = 15%).
 */
export const PASSIVE_CONSTANTS = {
  /** Evasion: Rogue's permanent dodge bonus */
  EVASION_DODGE_BONUS: 0.15, // +15% dodge

  /** Rage: Berserker's attack bonus when low HP */
  RAGE_ATK_BONUS: 0.5, // +50% attack
  /** Rage: HP threshold to trigger */
  RAGE_HP_THRESHOLD: 0.5, // 50% HP

  /** Thorns: Guardian's damage reflection */
  THORNS_REFLECT_PERCENT: 0.2, // 20% damage reflected

  /** Lifesteal: Warlock's healing from damage */
  LIFESTEAL_PERCENT: 0.2, // 20% of damage dealt
} as const;

/**
 * Passive ability IDs mapped to unit IDs.
 */
export const UNIT_PASSIVE_MAP: Record<string, PassiveAbilityId> = {
  rogue: 'evasion',
  berserker: 'rage',
  guardian: 'thorns',
  warlock: 'lifesteal',
} as const;

/**
 * All passive ability IDs.
 */
export type PassiveAbilityId = 'evasion' | 'rage' | 'thorns' | 'lifesteal';

// =============================================================================
// PASSIVE ABILITY INTERFACES
// =============================================================================

/**
 * Result of a passive ability trigger.
 */
export interface PassiveTriggerResult {
  /** Whether the passive triggered */
  triggered: boolean;
  /** Passive ability ID */
  passiveId: PassiveAbilityId;
  /** Unit that triggered the passive */
  unitId: string;
  /** Effect applied (if any) */
  effect?: PassiveEffect;
  /** Event generated (if any) */
  event?: BattleEvent;
}

/**
 * Effect applied by a passive ability.
 */
export interface PassiveEffect {
  /** Type of effect */
  type: 'stat_modifier' | 'damage' | 'heal';
  /** Stat modified (for stat_modifier) */
  stat?: string;
  /** Value of the effect */
  value: number;
  /** Whether the value is a percentage */
  isPercentage: boolean;
  /** Duration in turns (0 = permanent, -1 = until condition ends) */
  duration: number;
}

/**
 * Extended unit with passive ability state.
 */
export interface BattleUnitWithPassives extends BattleUnitWithAbilities {
  /** Active passive effects */
  passiveEffects?: PassiveEffectInstance[];
  /** Whether rage is currently active */
  rageActive?: boolean;
  /** Whether evasion bonus is applied */
  evasionApplied?: boolean;
}

/**
 * Instance of an active passive effect on a unit.
 */
export interface PassiveEffectInstance {
  /** Passive ability ID */
  passiveId: PassiveAbilityId;
  /** Effect type */
  type: 'stat_modifier' | 'damage' | 'heal';
  /** Stat modified */
  stat?: string;
  /** Effect value */
  value: number;
  /** Whether percentage-based */
  isPercentage: boolean;
  /** Remaining duration (-1 = conditional) */
  remainingDuration: number;
}

// =============================================================================
// PASSIVE ABILITY CHECKS
// =============================================================================

/**
 * Check if a unit has a specific passive ability.
 *
 * @param unit - Unit to check
 * @param passiveId - Passive ability ID to check for
 * @returns True if unit has the passive
 * @example
 * const hasEvasion = hasPassive(rogueUnit, 'evasion'); // true
 */
export function hasPassive(unit: BattleUnit, passiveId: PassiveAbilityId): boolean {
  const unitPassive = UNIT_PASSIVE_MAP[unit.id];
  return unitPassive === passiveId;
}

/**
 * Get the passive ability ID for a unit.
 *
 * @param unit - Unit to get passive for
 * @returns Passive ability ID or undefined if unit has no passive
 * @example
 * const passive = getUnitPassive(rogueUnit); // 'evasion'
 */
export function getUnitPassive(unit: BattleUnit): PassiveAbilityId | undefined {
  return UNIT_PASSIVE_MAP[unit.id];
}

/**
 * Check if rage should be active based on HP.
 *
 * @param unit - Unit to check
 * @returns True if HP is below rage threshold
 * @example
 * const shouldRage = isRageConditionMet(berserkerAt40Percent); // true
 */
export function isRageConditionMet(unit: BattleUnit): boolean {
  const hpPercent = unit.currentHp / unit.maxHp;
  return hpPercent < PASSIVE_CONSTANTS.RAGE_HP_THRESHOLD;
}

// =============================================================================
// EVASION PASSIVE (Rogue)
// =============================================================================

/**
 * Apply evasion passive to a unit.
 * Permanently increases dodge by 15%.
 *
 * @param unit - Unit to apply evasion to
 * @returns Updated unit with evasion bonus
 * @example
 * const rogueWithEvasion = applyEvasionPassive(rogueUnit);
 */
export function applyEvasionPassive(unit: BattleUnitWithPassives): BattleUnitWithPassives {
  if (!hasPassive(unit, 'evasion')) {
    return unit;
  }

  // Don't apply twice
  if (unit.evasionApplied) {
    return unit;
  }

  const passiveEffects = unit.passiveEffects ?? [];
  const evasionEffect: PassiveEffectInstance = {
    passiveId: 'evasion',
    type: 'stat_modifier',
    stat: 'dodge',
    value: PASSIVE_CONSTANTS.EVASION_DODGE_BONUS,
    isPercentage: false, // Flat bonus to dodge percentage
    remainingDuration: 0, // Permanent
  };

  return {
    ...unit,
    passiveEffects: [...passiveEffects, evasionEffect],
    evasionApplied: true,
  };
}

/**
 * Calculate effective dodge with evasion passive.
 *
 * @param unit - Unit to calculate dodge for
 * @returns Effective dodge percentage (0-100)
 * @example
 * const dodge = getEffectiveDodge(rogueUnit); // base + 15
 */
export function getEffectiveDodge(unit: BattleUnitWithPassives): number {
  let dodge = unit.stats.dodge;

  // Add evasion bonus if applicable
  if (hasPassive(unit, 'evasion')) {
    dodge += PASSIVE_CONSTANTS.EVASION_DODGE_BONUS * 100; // Convert to percentage points
  }

  // Cap at 75% to prevent invincibility
  return Math.min(75, dodge);
}

// =============================================================================
// RAGE PASSIVE (Berserker)
// =============================================================================

/**
 * Check and apply/remove rage passive based on HP.
 *
 * @param unit - Unit to check rage for
 * @returns Updated unit with rage state
 * @example
 * const berserker = updateRagePassive(berserkerUnit);
 */
export function updateRagePassive(unit: BattleUnitWithPassives): BattleUnitWithPassives {
  if (!hasPassive(unit, 'rage')) {
    return unit;
  }

  const shouldBeActive = isRageConditionMet(unit);
  const isCurrentlyActive = unit.rageActive ?? false;

  // No change needed
  if (shouldBeActive === isCurrentlyActive) {
    return unit;
  }

  const passiveEffects = (unit.passiveEffects ?? []).filter(e => e.passiveId !== 'rage');

  if (shouldBeActive) {
    // Activate rage
    const rageEffect: PassiveEffectInstance = {
      passiveId: 'rage',
      type: 'stat_modifier',
      stat: 'attack',
      value: PASSIVE_CONSTANTS.RAGE_ATK_BONUS,
      isPercentage: true,
      remainingDuration: -1, // Conditional duration
    };

    return {
      ...unit,
      passiveEffects: [...passiveEffects, rageEffect],
      rageActive: true,
    };
  } else {
    // Deactivate rage
    return {
      ...unit,
      passiveEffects,
      rageActive: false,
    };
  }
}

/**
 * Calculate effective attack with rage passive.
 *
 * @param unit - Unit to calculate attack for
 * @returns Effective attack value
 * @example
 * const atk = getEffectiveAttack(berserkerAt40Percent); // base * 1.5
 */
export function getEffectiveAttack(unit: BattleUnitWithPassives): number {
  let attack = unit.stats.atk;

  // Apply rage bonus if active
  if (hasPassive(unit, 'rage') && isRageConditionMet(unit)) {
    attack = Math.floor(attack * (1 + PASSIVE_CONSTANTS.RAGE_ATK_BONUS));
  }

  return attack;
}

// =============================================================================
// THORNS PASSIVE (Guardian)
// =============================================================================

/**
 * Calculate thorns damage to reflect back to attacker.
 *
 * @param unit - Unit with thorns passive
 * @param damageReceived - Amount of damage received
 * @returns Damage to reflect (0 if no thorns)
 * @example
 * const reflected = calculateThornsDamage(guardianUnit, 50); // 10
 */
export function calculateThornsDamage(unit: BattleUnit, damageReceived: number): number {
  if (!hasPassive(unit, 'thorns')) {
    return 0;
  }

  // Reflect 20% of damage received
  return Math.floor(damageReceived * PASSIVE_CONSTANTS.THORNS_REFLECT_PERCENT);
}

/**
 * Process thorns passive when unit receives damage.
 *
 * @param defender - Unit that received damage (with thorns)
 * @param attacker - Unit that dealt damage
 * @param damageReceived - Amount of damage received
 * @param seed - Random seed for determinism
 * @returns Thorns trigger result with damage event
 * @example
 * const result = processThorns(guardian, enemy, 50, 12345);
 */
export function processThorns(
  defender: BattleUnitWithPassives,
  attacker: BattleUnitWithPassives,
  damageReceived: number,
  _seed: number
): PassiveTriggerResult {
  const thornsDamage = calculateThornsDamage(defender, damageReceived);

  if (thornsDamage === 0) {
    return {
      triggered: false,
      passiveId: 'thorns',
      unitId: defender.instanceId,
    };
  }

  // Create thorns damage event
  const thornsEvent: BattleEvent = {
    round: 0, // Will be set by caller
    type: 'damage',
    actorId: defender.instanceId,
    targetId: attacker.instanceId,
    damage: thornsDamage,
  };

  return {
    triggered: true,
    passiveId: 'thorns',
    unitId: defender.instanceId,
    effect: {
      type: 'damage',
      value: thornsDamage,
      isPercentage: false,
      duration: 0,
    },
    event: thornsEvent,
  };
}

// =============================================================================
// LIFESTEAL PASSIVE (Warlock)
// =============================================================================

/**
 * Calculate lifesteal healing from damage dealt.
 *
 * @param unit - Unit with lifesteal passive
 * @param damageDealt - Amount of damage dealt
 * @returns Healing amount (0 if no lifesteal)
 * @example
 * const healing = calculateLifestealHealing(warlockUnit, 50); // 10
 */
export function calculateLifestealHealing(unit: BattleUnit, damageDealt: number): number {
  if (!hasPassive(unit, 'lifesteal')) {
    return 0;
  }

  // Heal 20% of damage dealt
  return Math.floor(damageDealt * PASSIVE_CONSTANTS.LIFESTEAL_PERCENT);
}

/**
 * Process lifesteal passive when unit deals damage.
 *
 * @param attacker - Unit that dealt damage (with lifesteal)
 * @param damageDealt - Amount of damage dealt
 * @param seed - Random seed for determinism
 * @returns Lifesteal trigger result with heal event
 * @example
 * const result = processLifesteal(warlock, 50, 12345);
 */
export function processLifesteal(
  attacker: BattleUnitWithPassives,
  damageDealt: number,
  _seed: number
): PassiveTriggerResult {
  const healAmount = calculateLifestealHealing(attacker, damageDealt);

  if (healAmount === 0) {
    return {
      triggered: false,
      passiveId: 'lifesteal',
      unitId: attacker.instanceId,
    };
  }

  // Calculate actual healing (can't exceed max HP)
  const actualHealing = Math.min(healAmount, attacker.maxHp - attacker.currentHp);

  // Create lifesteal heal event
  const lifestealEvent: BattleEvent = {
    round: 0, // Will be set by caller
    type: 'heal',
    actorId: attacker.instanceId,
    targetId: attacker.instanceId,
    healing: actualHealing,
  };

  return {
    triggered: true,
    passiveId: 'lifesteal',
    unitId: attacker.instanceId,
    effect: {
      type: 'heal',
      value: actualHealing,
      isPercentage: false,
      duration: 0,
    },
    event: lifestealEvent,
  };
}

// =============================================================================
// PASSIVE APPLICATION FUNCTIONS
// =============================================================================

/**
 * Apply all battle-start passives to a unit.
 * Called once at the beginning of battle.
 *
 * @param unit - Unit to apply passives to
 * @returns Updated unit with passive effects
 * @example
 * const unitWithPassives = applyBattleStartPassives(rogueUnit);
 */
export function applyBattleStartPassives(unit: BattleUnitWithPassives): BattleUnitWithPassives {
  let updatedUnit = { ...unit };

  // Apply evasion (permanent)
  updatedUnit = applyEvasionPassive(updatedUnit);

  // Check initial rage state
  updatedUnit = updateRagePassive(updatedUnit);

  return updatedUnit;
}

/**
 * Apply all battle-start passives to all units in state.
 *
 * @param state - Current battle state
 * @returns Updated state with passive effects applied
 * @example
 * const stateWithPassives = applyAllBattleStartPassives(battleState);
 */
export function applyAllBattleStartPassives(state: BattleState): BattleState {
  const updatedUnits = state.units.map(unit => applyBattleStartPassives(unit as BattleUnitWithPassives));

  return {
    ...state,
    units: updatedUnits,
  };
}

/**
 * Update conditional passives after HP change.
 * Called after any damage or healing.
 *
 * @param unit - Unit to update passives for
 * @returns Updated unit with current passive state
 * @example
 * const updatedUnit = updateConditionalPassives(berserkerAfterDamage);
 */
export function updateConditionalPassives(unit: BattleUnitWithPassives): BattleUnitWithPassives {
  let updatedUnit = { ...unit };

  // Update rage based on current HP
  updatedUnit = updateRagePassive(updatedUnit);

  return updatedUnit;
}

// =============================================================================
// EFFECTIVE STATS CALCULATION
// =============================================================================

/**
 * Get all effective stats for a unit with passives applied.
 *
 * @param unit - Unit to calculate stats for
 * @returns Object with all effective stat values
 * @example
 * const stats = getEffectiveStatsWithPassives(berserkerAt40Percent);
 */
export function getEffectiveStatsWithPassives(unit: BattleUnitWithPassives): {
  atk: number;
  armor: number;
  speed: number;
  initiative: number;
  dodge: number;
} {
  return {
    atk: getEffectiveAttack(unit),
    armor: unit.stats.armor,
    speed: unit.stats.speed,
    initiative: unit.stats.initiative,
    dodge: getEffectiveDodge(unit),
  };
}

// =============================================================================
// PASSIVE EVENT PROCESSING
// =============================================================================

/**
 * Process all passive triggers for an attack event.
 *
 * @param attacker - Unit that attacked
 * @param defender - Unit that was attacked
 * @param damageDealt - Damage dealt by the attack
 * @param currentRound - Current battle round
 * @param seed - Random seed for determinism
 * @returns Array of passive trigger results
 * @example
 * const results = processAttackPassives(warlock, enemy, 50, 3, 12345);
 */
export function processAttackPassives(
  attacker: BattleUnitWithPassives,
  defender: BattleUnitWithPassives,
  damageDealt: number,
  currentRound: number,
  seed: number
): PassiveTriggerResult[] {
  const results: PassiveTriggerResult[] = [];

  // Process lifesteal for attacker
  const lifestealResult = processLifesteal(attacker, damageDealt, seed);
  if (lifestealResult.triggered && lifestealResult.event) {
    lifestealResult.event.round = currentRound;
    results.push(lifestealResult);
  }

  // Process thorns for defender
  const thornsResult = processThorns(defender, attacker, damageDealt, seed + 1);
  if (thornsResult.triggered && thornsResult.event) {
    thornsResult.event.round = currentRound;
    results.push(thornsResult);
  }

  return results;
}

/**
 * Apply passive trigger results to battle state.
 *
 * @param state - Current battle state
 * @param results - Passive trigger results to apply
 * @returns Updated battle state
 * @example
 * const newState = applyPassiveResults(state, passiveResults);
 */
export function applyPassiveResults(
  state: BattleState,
  results: PassiveTriggerResult[]
): BattleState {
  let updatedUnits = [...state.units] as BattleUnitWithPassives[];

  for (const result of results) {
    if (!result.triggered || !result.effect) continue;

    const unitIndex = updatedUnits.findIndex(u => u.instanceId === result.unitId);
    if (unitIndex === -1) continue;

    const unit = updatedUnits[unitIndex];
    if (!unit) continue;

    if (result.effect.type === 'heal') {
      // Apply healing
      const newHp = Math.min(unit.maxHp, unit.currentHp + result.effect.value);
      updatedUnits[unitIndex] = {
        ...unit,
        currentHp: newHp,
      };
    } else if (result.effect.type === 'damage' && result.event?.targetId) {
      // Apply thorns damage to attacker
      const targetIndex = updatedUnits.findIndex(u => u.instanceId === result.event?.targetId);
      if (targetIndex !== -1) {
        const target = updatedUnits[targetIndex];
        if (target) {
          const newHp = Math.max(0, target.currentHp - result.effect.value);
          updatedUnits[targetIndex] = {
            ...target,
            currentHp: newHp,
            alive: newHp > 0,
          };
        }
      }
    }
  }

  // Update conditional passives for all affected units
  updatedUnits = updatedUnits.map(unit => updateConditionalPassives(unit));

  return {
    ...state,
    units: updatedUnits,
  };
}

/**
 * Get passive events from trigger results.
 *
 * @param results - Passive trigger results
 * @returns Array of battle events
 * @example
 * const events = getPassiveEvents(passiveResults);
 */
export function getPassiveEvents(results: PassiveTriggerResult[]): BattleEvent[] {
  return results.filter(r => r.triggered && r.event).map(r => r.event as BattleEvent);
}
