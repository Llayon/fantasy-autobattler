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
  /**
   * Accumulated armor shred from physical attacks.
   * Reduces effective armor when present.
   * Part of Core 2.0 mechanics system.
   */
  armorShred?: number;
}

// =============================================================================
// EFFECTIVE ARMOR CALCULATION
// =============================================================================

/**
 * Calculate effective armor after applying armor shred.
 * Effective armor = base armor - armor shred (minimum 0).
 *
 * This function is used by damage calculations to account for
 * armor degradation from the Core 2.0 armor shred mechanic.
 *
 * @param unit - The unit to calculate effective armor for
 * @returns Effective armor value (minimum 0)
 * @example
 * const knight = { stats: { armor: 10 }, armorShred: 3 };
 * const effectiveArmor = getEffectiveArmor(knight);
 * // Returns: 7 (10 - 3)
 *
 * @example
 * // Without armor shred (backward compatible)
 * const warrior = { stats: { armor: 8 } };
 * const effectiveArmor = getEffectiveArmor(warrior);
 * // Returns: 8 (no shred applied)
 */
export function getEffectiveArmor(unit: DamageUnit): number {
  const baseArmor = unit.stats.armor;
  const shred = unit.armorShred ?? 0;
  return Math.max(0, baseArmor - shred);
}

// =============================================================================
// DAMAGE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Options for physical damage calculation.
 * Supports Core 2.0 mechanics like flanking modifiers and charge momentum.
 */
export interface PhysicalDamageOptions {
  /**
   * Flanking damage modifier from Core 2.0 mechanics.
   * Applied as a multiplier to the final damage.
   * - 1.0 = front attack (no bonus)
   * - 1.3 = flank attack (+30% damage)
   * - 1.5 = rear attack (+50% damage)
   */
  flankingModifier?: number;

  /**
   * Charge momentum bonus from Core 2.0 mechanics.
   * Applied as an additive multiplier to the final damage.
   * - 0.0 = no charge bonus
   * - 0.2 = +20% damage (1 cell moved)
   * - 1.0 = +100% damage (max momentum)
   *
   * Formula: damage * (1 + momentumBonus)
   * Momentum is calculated as: min(maxMomentum, distance * momentumPerCell)
   * Default: 0.2 per cell, max 1.0 (100%)
   */
  momentumBonus?: number;
}

/**
 * Calculate physical damage dealt by attacker to target.
 * Physical damage is reduced by target's effective armor but has a minimum of 1.
 * Effective armor accounts for armor shred from Core 2.0 mechanics.
 * Supports optional flanking modifier and charge momentum bonus from Core 2.0 mechanics.
 * 
 * Formula: max(minDamage, floor((ATK - effectiveArmor) * atkCount * flankingModifier * (1 + momentumBonus)))
 *
 * @param attacker - The unit dealing damage
 * @param target - The unit receiving damage
 * @param config - Battle configuration (defaults to standard config)
 * @param options - Optional damage calculation options (flanking modifier, momentum bonus, etc.)
 * @returns Calculated physical damage value (minimum 1)
 * @example
 * const warrior = { stats: { atk: 15, atkCount: 1, armor: 0, dodge: 0 }, currentHp: 100, maxHp: 100 };
 * const knight = { stats: { atk: 10, atkCount: 1, armor: 8, dodge: 0 }, currentHp: 100, maxHp: 100 };
 * const damage = calculatePhysicalDamage(warrior, knight);
 * // Returns: max(1, (15 - 8) * 1) = 7
 *
 * @example
 * // With armor shred (Core 2.0)
 * const knight = { stats: { armor: 10 }, armorShred: 4 };
 * // Effective armor = 10 - 4 = 6
 * const damage = calculatePhysicalDamage(attacker, knight);
 *
 * @example
 * // With flanking modifier (Core 2.0)
 * const damage = calculatePhysicalDamage(attacker, target, config, { flankingModifier: 1.3 });
 * // Damage is multiplied by 1.3 for flank attack
 *
 * @example
 * // With rear attack (Core 2.0)
 * const damage = calculatePhysicalDamage(attacker, target, config, { flankingModifier: 1.5 });
 * // Damage is multiplied by 1.5 for rear attack
 *
 * @example
 * // With charge momentum bonus (Core 2.0)
 * const damage = calculatePhysicalDamage(attacker, target, config, { momentumBonus: 0.6 });
 * // Damage is multiplied by 1.6 for charge with 60% momentum
 *
 * @example
 * // With combined flanking and charge (Core 2.0)
 * const damage = calculatePhysicalDamage(attacker, target, config, { flankingModifier: 1.3, momentumBonus: 0.4 });
 * // Damage is multiplied by 1.3 * 1.4 = 1.82 for flank charge attack
 */
export function calculatePhysicalDamage(
  attacker: DamageUnit,
  target: DamageUnit,
  config: BattleConfig = DEFAULT_BATTLE_CONFIG,
  options?: PhysicalDamageOptions
): number {
  // Use effective armor (accounts for armor shred)
  const effectiveArmor = getEffectiveArmor(target);
  const baseDamage = attacker.stats.atk - effectiveArmor;
  let totalDamage = baseDamage * attacker.stats.atkCount;

  // Apply flanking modifier if provided (Core 2.0 mechanics)
  if (options?.flankingModifier !== undefined && options.flankingModifier !== 1.0) {
    totalDamage = Math.floor(totalDamage * options.flankingModifier);
  }

  // Apply charge momentum bonus if provided (Core 2.0 mechanics)
  if (options?.momentumBonus !== undefined && options.momentumBonus > 0) {
    totalDamage = Math.floor(totalDamage * (1 + options.momentumBonus));
  }

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
 * Options for resolving a physical attack.
 * Supports Core 2.0 mechanics like flanking modifiers and charge momentum.
 */
export interface ResolvePhysicalAttackOptions {
  /**
   * Flanking damage modifier from Core 2.0 mechanics.
   * Applied as a multiplier to the final damage.
   * - 1.0 = front attack (no bonus)
   * - 1.3 = flank attack (+30% damage)
   * - 1.5 = rear attack (+50% damage)
   */
  flankingModifier?: number;

  /**
   * Charge momentum bonus from Core 2.0 mechanics.
   * Applied as an additive multiplier to the final damage.
   * - 0.0 = no charge bonus
   * - 0.2 = +20% damage (1 cell moved)
   * - 1.0 = +100% damage (max momentum)
   *
   * Formula: damage * (1 + momentumBonus)
   */
  momentumBonus?: number;
}

/**
 * Resolve a complete physical attack between two units.
 * Handles damage calculation, dodge rolls, and damage application.
 * Supports optional flanking modifier and charge momentum bonus from Core 2.0 mechanics.
 *
 * @param attacker - The unit performing the attack
 * @param target - The unit being attacked
 * @param seed - Seed for deterministic dodge calculation
 * @param config - Battle configuration
 * @param options - Optional attack resolution options (flanking modifier, momentum bonus, etc.)
 * @returns Complete attack result with damage and status changes
 * @example
 * const result = resolvePhysicalAttack(warrior, rogue, 12345);
 * // Returns: { damage: 13, dodged: false, killed: false, newHp: 37, overkill: 0 }
 *
 * @example
 * // With flanking modifier (Core 2.0)
 * const result = resolvePhysicalAttack(warrior, rogue, 12345, config, { flankingModifier: 1.3 });
 * // Damage is multiplied by 1.3 for flank attack
 *
 * @example
 * // With charge momentum bonus (Core 2.0)
 * const result = resolvePhysicalAttack(cavalry, infantry, 12345, config, { momentumBonus: 0.6 });
 * // Damage is multiplied by 1.6 for charge with 60% momentum
 *
 * @example
 * // With combined flanking and charge (Core 2.0)
 * const result = resolvePhysicalAttack(cavalry, infantry, 12345, config, { flankingModifier: 1.3, momentumBonus: 0.4 });
 * // Damage is multiplied by 1.3 * 1.4 = 1.82 for flank charge attack
 */
export function resolvePhysicalAttack(
  attacker: DamageUnit,
  target: DamageUnit,
  seed: number,
  config: BattleConfig = DEFAULT_BATTLE_CONFIG,
  options?: ResolvePhysicalAttackOptions
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

  // Calculate and apply damage with optional flanking modifier and momentum bonus
  // Build options object only with defined values to satisfy exactOptionalPropertyTypes
  let damageOptions: PhysicalDamageOptions | undefined;
  if (options?.flankingModifier !== undefined || options?.momentumBonus !== undefined) {
    damageOptions = {};
    if (options?.flankingModifier !== undefined) {
      damageOptions.flankingModifier = options.flankingModifier;
    }
    if (options?.momentumBonus !== undefined) {
      damageOptions.momentumBonus = options.momentumBonus;
    }
  }
  const damage = calculatePhysicalDamage(attacker, target, config, damageOptions);
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
 * Accounts for armor shred when present (Core 2.0).
 *
 * @param armor - Base armor value of the defending unit
 * @param incomingDamage - Raw damage before armor reduction
 * @param config - Battle configuration
 * @param armorShred - Optional armor shred amount (Core 2.0)
 * @returns Object with reduced damage and damage blocked
 * @example
 * const result = calculateArmorReduction(5, 12);
 * // Returns: { reducedDamage: 7, damageBlocked: 5 }
 *
 * @example
 * // With armor shred
 * const result = calculateArmorReduction(10, 15, DEFAULT_BATTLE_CONFIG, 4);
 * // Effective armor = 10 - 4 = 6
 * // Returns: { reducedDamage: 9, damageBlocked: 6 }
 */
export function calculateArmorReduction(
  armor: number,
  incomingDamage: number,
  config: BattleConfig = DEFAULT_BATTLE_CONFIG,
  armorShred: number = 0
): { reducedDamage: number; damageBlocked: number } {
  // Calculate effective armor (accounts for shred)
  const effectiveArmor = Math.max(0, armor - armorShred);
  const damageBlocked = Math.min(effectiveArmor, incomingDamage - config.minDamage);
  const reducedDamage = Math.max(config.minDamage, incomingDamage - effectiveArmor);

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
