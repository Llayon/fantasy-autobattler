/**
 * Flanking processor
 *
 * Implements attack arc damage modifiers.
 * - Front attacks: 100% damage (default)
 * - Flank attacks: 130% damage
 * - Rear attacks: 150% damage
 *
 * Flanking attacks also deal resolve damage and can disable riposte.
 */

import { AttackArc, FlankingConfig } from '../../config/mechanics.types';
import { getAttackArc, Position, FacingDirection } from '../../tier0/facing';
import { FlankingUnit, FlankingDamageResult, DEFAULT_FLANKING_VALUES } from './flanking.types';

/**
 * Get damage modifier for an attack arc
 *
 * @param arc - Attack arc (FRONT, FLANK, REAR)
 * @param config - Optional flanking configuration
 * @returns Damage multiplier
 *
 * @example
 * const modifier = getDamageModifier(AttackArc.REAR);
 * // Returns 1.5 (150% damage)
 */
export function getDamageModifier(
  arc: AttackArc,
  config?: Partial<FlankingConfig>,
): number {
  const frontMod = config?.frontDamageModifier ?? DEFAULT_FLANKING_VALUES.frontDamageModifier;
  const flankMod = config?.flankDamageModifier ?? DEFAULT_FLANKING_VALUES.flankDamageModifier;
  const rearMod = config?.rearDamageModifier ?? DEFAULT_FLANKING_VALUES.rearDamageModifier;

  switch (arc) {
    case AttackArc.FRONT:
      return frontMod;
    case AttackArc.FLANK:
      return flankMod;
    case AttackArc.REAR:
      return rearMod;
    default:
      return frontMod;
  }
}

/**
 * Calculate resolve damage from a flanking attack
 *
 * Resolve damage is a percentage of the attacker's ATK stat.
 * Only applied for flank and rear attacks.
 *
 * @param attackerAtk - Attacker's ATK stat
 * @param arc - Attack arc
 * @param config - Optional flanking configuration
 * @returns Resolve damage amount
 *
 * @example
 * const resolveDmg = getResolveDamage(10, AttackArc.REAR);
 * // Returns 2.5 (25% of ATK)
 */
export function getResolveDamage(
  attackerAtk: number,
  arc: AttackArc,
  config?: Partial<FlankingConfig>,
): number {
  // No resolve damage for front attacks
  if (arc === AttackArc.FRONT) {
    return 0;
  }

  const modifier = config?.resolveDamageModifier ?? DEFAULT_FLANKING_VALUES.resolveDamageModifier;
  return Math.floor(attackerAtk * modifier);
}

/**
 * Check if an attack arc disables riposte
 *
 * Flank and rear attacks disable the target's ability to riposte.
 *
 * @param arc - Attack arc
 * @returns true if riposte is disabled
 *
 * @example
 * const disabled = disablesRiposte(AttackArc.FLANK);
 * // Returns true
 */
export function disablesRiposte(arc: AttackArc): boolean {
  return arc !== AttackArc.FRONT;
}

/**
 * Calculate complete flanking damage result
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param baseDamage - Base damage before flanking modifier
 * @param config - Optional flanking configuration
 * @returns Complete flanking damage result
 *
 * @example
 * const result = calculateFlankingDamage(attacker, target, 10);
 * // result.finalDamage === 15 (if rear attack)
 * // result.resolveDamage === 2 (25% of ATK)
 */
export function calculateFlankingDamage(
  attacker: FlankingUnit,
  target: { position: Position; facing?: FacingDirection },
  baseDamage: number,
  config?: Partial<FlankingConfig>,
): FlankingDamageResult {
  const arc = getAttackArc(attacker.position, target);
  const damageModifier = getDamageModifier(arc, config);
  const finalDamage = Math.floor(baseDamage * damageModifier);
  const resolveDamage = getResolveDamage(attacker.atk ?? baseDamage, arc, config);

  return {
    arc,
    baseDamage,
    damageModifier,
    finalDamage,
    resolveDamage,
    disablesRiposte: disablesRiposte(arc),
  };
}

/**
 * Apply flanking modifier to damage
 *
 * Simple function to apply flanking modifier without full calculation.
 *
 * @param damage - Base damage
 * @param attackerPosition - Position of attacker
 * @param target - Target unit
 * @param config - Optional flanking configuration
 * @returns Modified damage
 *
 * @example
 * const damage = applyFlankingModifier(10, attackerPos, target);
 */
export function applyFlankingModifier(
  damage: number,
  attackerPosition: Position,
  target: { position: Position; facing?: FacingDirection },
  config?: Partial<FlankingConfig>,
): number {
  const arc = getAttackArc(attackerPosition, target);
  const modifier = getDamageModifier(arc, config);
  return Math.floor(damage * modifier);
}

/**
 * Check if an attack is a flanking attack (not front)
 *
 * @param attackerPosition - Position of attacker
 * @param target - Target unit
 * @returns true if attack is from flank or rear
 */
export function isFlankingAttack(
  attackerPosition: Position,
  target: { position: Position; facing?: FacingDirection },
): boolean {
  const arc = getAttackArc(attackerPosition, target);
  return arc !== AttackArc.FRONT;
}

/**
 * Check if an attack is a rear attack
 *
 * @param attackerPosition - Position of attacker
 * @param target - Target unit
 * @returns true if attack is from rear
 */
export function isRearAttack(
  attackerPosition: Position,
  target: { position: Position; facing?: FacingDirection },
): boolean {
  const arc = getAttackArc(attackerPosition, target);
  return arc === AttackArc.REAR;
}
