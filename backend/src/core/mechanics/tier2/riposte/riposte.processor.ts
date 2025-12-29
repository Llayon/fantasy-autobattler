/**
 * Riposte processor
 *
 * Implements counter-attack system.
 * - Units can riposte when attacked from the front
 * - Riposte chance is based on Initiative comparison
 * - Flanking/rear attacks disable riposte
 * - Limited charges per round
 */

import { AttackArc, RiposteConfig } from '../../config/mechanics.types';
import { getAttackArc, Position, FacingDirection } from '../../tier0/facing';
import {
  RiposteUnit,
  RiposteCheckResult,
  RiposteResult,
  DEFAULT_RIPOSTE_VALUES,
} from './riposte.types';

/**
 * Check if a unit can riposte against an attacker
 *
 * @param defender - Unit being attacked
 * @param attacker - Attacking unit
 * @param arc - Attack arc (FRONT, FLANK, REAR)
 * @param config - Optional riposte configuration
 * @returns Riposte check result
 *
 * @example
 * const result = canRiposte(defender, attacker, AttackArc.FRONT);
 * if (result.canRiposte) { ... }
 */
export function canRiposte(
  defender: RiposteUnit,
  attacker: RiposteUnit,
  arc: AttackArc,
  config?: Partial<RiposteConfig>,
): RiposteCheckResult {
  const chargeLimit = config?.chargeLimit ?? DEFAULT_RIPOSTE_VALUES.chargeLimit;
  const charges = defender.riposteCharges ?? chargeLimit;

  // Cannot riposte if flanked or rear attacked
  if (arc !== AttackArc.FRONT) {
    return {
      canRiposte: false,
      reason: 'Cannot riposte from flank or rear',
      chance: 0,
      chargesRemaining: charges,
    };
  }

  // Cannot riposte if no charges remaining
  if (charges <= 0) {
    return {
      canRiposte: false,
      reason: 'No riposte charges remaining',
      chance: 0,
      chargesRemaining: 0,
    };
  }

  // Cannot riposte if explicitly disabled
  if (defender.canRiposte === false) {
    return {
      canRiposte: false,
      reason: 'Unit cannot riposte',
      chance: 0,
      chargesRemaining: charges,
    };
  }

  const chance = getRiposteChance(defender, attacker, config);

  return {
    canRiposte: true,
    chance,
    chargesRemaining: charges,
  };
}

/**
 * Calculate riposte chance based on Initiative comparison
 *
 * Formula:
 * - Base chance: 50%
 * - +5% per point of Initiative advantage
 * - Guaranteed (100%) if defender has +10 Initiative
 * - Impossible (0%) if attacker has +10 Initiative
 *
 * @param defender - Unit being attacked
 * @param attacker - Attacking unit
 * @param config - Optional riposte configuration
 * @returns Riposte chance (0.0 to 1.0)
 *
 * @example
 * const chance = getRiposteChance(defender, attacker);
 * // Returns 0.75 if defender has +5 Initiative
 */
export function getRiposteChance(
  defender: RiposteUnit,
  attacker: RiposteUnit,
  config?: Partial<RiposteConfig>,
): number {
  const baseChance = config?.baseChance ?? DEFAULT_RIPOSTE_VALUES.baseChance;
  const initiativeBonus = config?.initiativeBonus ?? DEFAULT_RIPOSTE_VALUES.initiativeBonus;
  const guaranteedThreshold = DEFAULT_RIPOSTE_VALUES.guaranteedThreshold;

  const initDiff = defender.initiative - attacker.initiative;

  // Guaranteed riposte if defender much faster
  if (initDiff >= guaranteedThreshold) {
    return 1.0;
  }

  // No riposte if attacker much faster
  if (initDiff <= -guaranteedThreshold) {
    return 0.0;
  }

  // Linear interpolation based on Initiative difference
  const chance = baseChance + initDiff * initiativeBonus;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, chance));
}

/**
 * Execute a riposte counter-attack
 *
 * @param defender - Unit performing riposte
 * @param attacker - Unit being counter-attacked
 * @param roll - Random roll (0.0 to 1.0) for riposte check
 * @param config - Optional riposte configuration
 * @returns Riposte result
 *
 * @example
 * const result = executeRiposte(defender, attacker, 0.3);
 * if (result.triggered) {
 *   // Apply result.damage to attacker
 * }
 */
export function executeRiposte(
  defender: RiposteUnit,
  attacker: RiposteUnit,
  roll: number,
  config?: Partial<RiposteConfig>,
): RiposteResult {
  const chargeLimit = config?.chargeLimit ?? DEFAULT_RIPOSTE_VALUES.chargeLimit;
  const charges = defender.riposteCharges ?? chargeLimit;
  const chance = getRiposteChance(defender, attacker, config);

  // Check if riposte triggers
  if (roll >= chance || charges <= 0) {
    return {
      triggered: false,
      damage: 0,
      defenderChargesRemaining: charges,
    };
  }

  // Calculate riposte damage (50% of normal attack)
  const damage = Math.floor(defender.atk * DEFAULT_RIPOSTE_VALUES.riposteDamageMultiplier);

  return {
    triggered: true,
    damage,
    defenderChargesRemaining: charges - 1,
  };
}

/**
 * Check riposte and execute if possible
 *
 * Combines canRiposte and executeRiposte into a single call.
 *
 * @param defender - Unit being attacked
 * @param attacker - Attacking unit
 * @param arc - Attack arc
 * @param roll - Random roll for riposte check
 * @param config - Optional riposte configuration
 * @returns Riposte result
 */
export function checkAndExecuteRiposte(
  defender: RiposteUnit,
  attacker: RiposteUnit,
  arc: AttackArc,
  roll: number,
  config?: Partial<RiposteConfig>,
): RiposteResult {
  const check = canRiposte(defender, attacker, arc, config);

  if (!check.canRiposte) {
    return {
      triggered: false,
      damage: 0,
      defenderChargesRemaining: check.chargesRemaining,
    };
  }

  return executeRiposte(defender, attacker, roll, config);
}

/**
 * Reset riposte charges for a unit at round start
 *
 * @param unit - Unit to reset charges for
 * @param config - Optional riposte configuration
 * @returns Updated unit with reset charges
 */
export function resetRiposteCharges<T extends RiposteUnit>(
  unit: T,
  config?: Partial<RiposteConfig>,
): T {
  const chargeLimit = config?.chargeLimit ?? DEFAULT_RIPOSTE_VALUES.chargeLimit;

  return {
    ...unit,
    riposteCharges: chargeLimit,
  };
}

/**
 * Consume a riposte charge from a unit
 *
 * @param unit - Unit to consume charge from
 * @returns Updated unit with decremented charges
 */
export function consumeRiposteCharge<T extends RiposteUnit>(unit: T): T {
  const charges = unit.riposteCharges ?? 1;

  return {
    ...unit,
    riposteCharges: Math.max(0, charges - 1),
  };
}

/**
 * Check if attack arc allows riposte
 *
 * @param arc - Attack arc
 * @returns true if riposte is possible from this arc
 */
export function arcAllowsRiposte(arc: AttackArc): boolean {
  return arc === AttackArc.FRONT;
}

/**
 * Calculate riposte chance from positions
 *
 * @param defender - Defending unit
 * @param attackerPosition - Position of attacker
 * @param attacker - Attacking unit (for Initiative)
 * @param config - Optional riposte configuration
 * @returns Riposte chance (0.0 to 1.0), or 0 if arc doesn't allow
 */
export function getRiposteChanceFromPosition(
  defender: RiposteUnit & { facing?: FacingDirection },
  attackerPosition: Position,
  attacker: RiposteUnit,
  config?: Partial<RiposteConfig>,
): number {
  const arc = getAttackArc(attackerPosition, defender);

  if (!arcAllowsRiposte(arc)) {
    return 0;
  }

  return getRiposteChance(defender, attacker, config);
}
