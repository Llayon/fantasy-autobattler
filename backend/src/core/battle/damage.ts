/**
 * Damage calculation system for battle engine.
 * Provides deterministic damage calculations with physical/magic damage types,
 * dodge mechanics, and health management.
 *
 * @fileoverview Pure functions for combat damage calculations.
 * All functions are deterministic and use seeded randomness for reproducible results.
 *
 * @module core/battle/damage
 */

import type { BattleConfig } from '../types/config.types';
import { seededRandom } from '../utils/random';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default battle configuration.
 */
export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  maxRounds: 100,
  minDamage: 1,
  dodgeCapPercent: 50,
};

// =============================================================================
// UNIT INTERFACE (minimal for core)
// =============================================================================

/**
 * Minimal unit interface for damage calculations.
 * Game-specific unit types should extend this.
 */
export interface DamageUnit {
  /** Unit stats */
  stats: {
    /** Attack power */
    atk: number;
    /** Number of attacks per turn */
    atkCount: number;
    /** Armor (damage reduction) */
    armor: number;
    /** Dodge chance (0-100) */
    dodge: number;
  };
  /** Current hit points */
  currentHp: number;
  /** Maximum hit points */
  maxHp: number;
}

// =============================================================================
// DAMAGE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate physical damage dealt by attacker to target.
 * Physical damage is reduced by target's armor but has a minimum of 1.
 * Formula: max(minDamage, (ATK - armor) * atkCount)
 *
 * @param attacker - The unit dealing damage
 * @param target - The unit receiving damage
 * @param config - Battle configuration (defaults to standard config)
 * @returns Calculated physical damage value (minimum 1)
 * @example
 * const warrior = { stats: { atk: 15, atkCount: 1, armor: 0, dodge: 0 }, currentHp: 100, maxHp: 100 };
 * const knight = { stats: { atk: 10, atkCount: 1, armor: 8, dodge: 0 }, currentHp: 100, maxHp: 100 };
 * const damage = calculatePhysicalDamage(warrior, knight);
 * // Returns: max(1, (15 - 8) * 1) = 7
 */
export function calculatePhysicalDamage(
  attacker: DamageUnit,
  target: DamageUnit,
  config: BattleConfig = DEFAULT_BATTLE_CONFIG
): number {
  const baseDamage = attacker.stats.atk - target.stats.armor;
  const totalDamage = baseDamage * attacker.stats.atkCount;

  // Ensure minimum damage per config
  return Math.max(config.minDamage, totalDamage);
}

/**
 * Calculate magic damage dealt by attacker to target.
 * Magic damage ignores armor and is calculated directly from attack power.
 * Formula: ATK * atkCount
 *
 * @param attacker - The unit dealing magic damage
 * @param _target - The unit receiving damage (armor ignored, parameter kept for API consistency)
 * @returns Calculated magic damage value
 * @example
 * const mage = { stats: { atk: 20, atkCount: 1, armor: 0, dodge: 0 }, currentHp: 100, maxHp: 100 };
 * const knight = { stats: { atk: 10, atkCount: 1, armor: 10, dodge: 0 }, currentHp: 100, maxHp: 100 };
 * const damage = calculateMagicDamage(mage, knight);
 * // Returns: 20 * 1 = 20 (armor ignored)
 */
export function calculateMagicDamage(attacker: DamageUnit, _target: DamageUnit): number {
  // Magic damage ignores armor completely
  return attacker.stats.atk * attacker.stats.atkCount;
}

/**
 * Perform deterministic dodge roll for physical attacks.
 * Uses seeded random number generation for reproducible results.
 * Magic attacks cannot be dodged.
 *
 * @param target - The unit attempting to dodge
 * @param seed - Seed for deterministic random generation
 * @returns True if attack was dodged, false if hit
 * @example
 * const rogue = { stats: { atk: 10, atkCount: 1, armor: 0, dodge: 25 }, currentHp: 50, maxHp: 50 };
 * const dodged = rollDodge(rogue, 12345);
 * // Returns: true or false based on seeded random roll
 */
export function rollDodge(target: DamageUnit, seed: number): boolean {
  // Generate deterministic random number [0, 1)
  const roll = seededRandom(seed);

  // Convert dodge percentage to decimal and compare
  const dodgeChance = target.stats.dodge / 100;

  return roll < dodgeChance;
}

/**
 * Apply damage to a unit and calculate new health state.
 * Does not mutate the input unit, returns new state values.
 *
 * @param target - The unit receiving damage
 * @param damage - Amount of damage to apply
 * @returns Object with new HP and death status
 * @example
 * const unit = { currentHp: 50, maxHp: 100, stats: { atk: 10, atkCount: 1, armor: 0, dodge: 0 } };
 * const result = applyDamage(unit, 30);
 * // Returns: { newHp: 20, killed: false, overkill: 0 }
 */
export function applyDamage(
  target: DamageUnit,
  damage: number
): { newHp: number; killed: boolean; overkill: number } {
  const newHp = Math.max(0, target.currentHp - damage);
  const killed = newHp === 0;
  const overkill = damage > target.currentHp ? damage - target.currentHp : 0;

  return {
    newHp,
    killed,
    overkill,
  };
}

/**
 * Apply healing to a unit and calculate new health state.
 * Does not mutate the input unit, returns new state values.
 * Cannot heal above maximum HP.
 *
 * @param target - The unit receiving healing
 * @param healAmount - Amount of healing to apply
 * @returns Object with new HP and overheal amount
 * @example
 * const unit = { currentHp: 30, maxHp: 100, stats: { atk: 10, atkCount: 1, armor: 0, dodge: 0 } };
 * const result = applyHealing(unit, 25);
 * // Returns: { newHp: 55, overheal: 0 }
 */
export function applyHealing(
  target: DamageUnit,
  healAmount: number
): { newHp: number; overheal: number } {
  const potentialHp = target.currentHp + healAmount;
  const newHp = Math.min(target.maxHp, potentialHp);
  const overheal = potentialHp > target.maxHp ? potentialHp - target.maxHp : 0;

  return {
    newHp,
    overheal,
  };
}

// =============================================================================
// COMBAT RESOLUTION FUNCTIONS
// =============================================================================

/**
 * Resolve a complete physical attack between two units.
 * Handles damage calculation, dodge rolls, and damage application.
 *
 * @param attacker - The unit performing the attack
 * @param target - The unit being attacked
 * @param seed - Seed for deterministic dodge calculation
 * @param config - Battle configuration
 * @returns Complete attack result with damage and status changes
 * @example
 * const result = resolvePhysicalAttack(warrior, rogue, 12345);
 * // Returns: { damage: 13, dodged: false, killed: false, newHp: 37, overkill: 0 }
 */
export function resolvePhysicalAttack(
  attacker: DamageUnit,
  target: DamageUnit,
  seed: number,
  config: BattleConfig = DEFAULT_BATTLE_CONFIG
): {
  damage: number;
  dodged: boolean;
  killed: boolean;
  newHp: number;
  overkill: number;
} {
  // Check for dodge first
  const dodged = rollDodge(target, seed);

  if (dodged) {
    return {
      damage: 0,
      dodged: true,
      killed: false,
      newHp: target.currentHp,
      overkill: 0,
    };
  }

  // Calculate and apply damage
  const damage = calculatePhysicalDamage(attacker, target, config);
  const damageResult = applyDamage(target, damage);

  return {
    damage,
    dodged: false,
    killed: damageResult.killed,
    newHp: damageResult.newHp,
    overkill: damageResult.overkill,
  };
}

/**
 * Resolve a complete magic attack between two units.
 * Magic attacks cannot be dodged and ignore armor.
 *
 * @param attacker - The unit performing the magic attack
 * @param target - The unit being attacked
 * @returns Complete magic attack result with damage and status changes
 * @example
 * const result = resolveMagicAttack(mage, knight);
 * // Returns: { damage: 25, killed: false, newHp: 75, overkill: 0 }
 */
export function resolveMagicAttack(
  attacker: DamageUnit,
  target: DamageUnit
): {
  damage: number;
  killed: boolean;
  newHp: number;
  overkill: number;
} {
  // Magic attacks cannot be dodged
  const damage = calculateMagicDamage(attacker, target);
  const damageResult = applyDamage(target, damage);

  return {
    damage,
    killed: damageResult.killed,
    newHp: damageResult.newHp,
    overkill: damageResult.overkill,
  };
}

/**
 * Calculate effective damage reduction from armor.
 * Used for UI display and damage preview calculations.
 *
 * @param armor - Armor value of the defending unit
 * @param incomingDamage - Raw damage before armor reduction
 * @param config - Battle configuration
 * @returns Object with reduced damage and damage blocked
 * @example
 * const result = calculateArmorReduction(5, 12);
 * // Returns: { reducedDamage: 7, damageBlocked: 5 }
 */
export function calculateArmorReduction(
  armor: number,
  incomingDamage: number,
  config: BattleConfig = DEFAULT_BATTLE_CONFIG
): { reducedDamage: number; damageBlocked: number } {
  const damageBlocked = Math.min(armor, incomingDamage - config.minDamage);
  const reducedDamage = Math.max(config.minDamage, incomingDamage - armor);

  return {
    reducedDamage,
    damageBlocked: Math.max(0, damageBlocked),
  };
}

/**
 * Check if a unit can survive a specific amount of damage.
 * Useful for AI decision making and damage preview.
 *
 * @param unit - The unit to check survival for
 * @param damage - Amount of damage to test
 * @returns True if unit survives, false if killed
 * @example
 * const survives = canSurviveDamage(unit, 20); // true if currentHp > 20
 */
export function canSurviveDamage(unit: DamageUnit, damage: number): boolean {
  return unit.currentHp > damage;
}

/**
 * Calculate damage needed to kill a unit.
 * Useful for AI targeting and damage optimization.
 *
 * @param unit - The unit to calculate lethal damage for
 * @returns Minimum damage needed to kill the unit
 * @example
 * const lethalDamage = calculateLethalDamage(unit); // equals currentHp
 */
export function calculateLethalDamage(unit: DamageUnit): number {
  return unit.currentHp;
}
