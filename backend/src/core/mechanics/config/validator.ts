/**
 * Core Mechanics 2.0 - Configuration Validator
 *
 * Validates mechanics configuration for correctness and consistency.
 *
 * @module core/mechanics/config
 */

import type { MechanicsConfig } from './mechanics.types';
import { MECHANIC_DEPENDENCIES } from './dependencies';

/**
 * Validation result for mechanics configuration.
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
}

/**
 * Validates a mechanics configuration.
 * Checks for:
 * - Config values within valid bounds
 * - Dependency consistency (enabled mechanics have their deps enabled)
 * - Type correctness
 *
 * @param config - Mechanics configuration to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * const result = validateMechanicsConfig(config);
 * if (!result.valid) {
 *   console.error('Invalid config:', result.errors);
 * }
 */
export function validateMechanicsConfig(
  config: MechanicsConfig,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate dependency consistency
  for (const [mechanic, deps] of Object.entries(MECHANIC_DEPENDENCIES)) {
    const key = mechanic as keyof MechanicsConfig;
    if (config[key]) {
      for (const dep of deps) {
        if (!config[dep]) {
          errors.push(
            `Mechanic '${key}' requires '${dep}' to be enabled, but it is disabled`,
          );
        }
      }
    }
  }

  // Validate resolve config bounds
  if (config.resolve && typeof config.resolve === 'object') {
    if (config.resolve.maxResolve <= 0) {
      errors.push('resolve.maxResolve must be positive');
    }
    if (config.resolve.baseRegeneration < 0) {
      errors.push('resolve.baseRegeneration cannot be negative');
    }
    if (config.resolve.flankingResolveDamage < 0) {
      errors.push('resolve.flankingResolveDamage cannot be negative');
    }
    if (config.resolve.rearResolveDamage < 0) {
      errors.push('resolve.rearResolveDamage cannot be negative');
    }
  }

  // Validate engagement config bounds
  if (config.engagement && typeof config.engagement === 'object') {
    if (
      config.engagement.archerPenaltyPercent < 0 ||
      config.engagement.archerPenaltyPercent > 1
    ) {
      errors.push('engagement.archerPenaltyPercent must be between 0 and 1');
    }
  }

  // Validate riposte config bounds
  if (config.riposte && typeof config.riposte === 'object') {
    if (config.riposte.baseChance < 0 || config.riposte.baseChance > 1) {
      errors.push('riposte.baseChance must be between 0 and 1');
    }
    if (config.riposte.guaranteedThreshold <= 0) {
      errors.push('riposte.guaranteedThreshold must be positive');
    }
  }

  // Validate intercept config bounds
  if (config.intercept && typeof config.intercept === 'object') {
    if (config.intercept.disengageCost < 0) {
      errors.push('intercept.disengageCost cannot be negative');
    }
  }

  // Validate charge config bounds
  if (config.charge && typeof config.charge === 'object') {
    if (config.charge.momentumPerCell < 0) {
      errors.push('charge.momentumPerCell cannot be negative');
    }
    if (config.charge.maxMomentum < 0) {
      errors.push('charge.maxMomentum cannot be negative');
    }
    if (config.charge.minChargeDistance < 0) {
      errors.push('charge.minChargeDistance cannot be negative');
    }
    if (config.charge.shockResolveDamage < 0) {
      errors.push('charge.shockResolveDamage cannot be negative');
    }
  }

  // Validate phalanx config bounds
  if (config.phalanx && typeof config.phalanx === 'object') {
    if (config.phalanx.maxArmorBonus < 0) {
      errors.push('phalanx.maxArmorBonus cannot be negative');
    }
    if (config.phalanx.maxResolveBonus < 0) {
      errors.push('phalanx.maxResolveBonus cannot be negative');
    }
    if (config.phalanx.armorPerAlly < 0) {
      errors.push('phalanx.armorPerAlly cannot be negative');
    }
    if (config.phalanx.resolvePerAlly < 0) {
      errors.push('phalanx.resolvePerAlly cannot be negative');
    }
  }

  // Validate LoS config bounds
  if (config.lineOfSight && typeof config.lineOfSight === 'object') {
    if (
      config.lineOfSight.arcFirePenalty < 0 ||
      config.lineOfSight.arcFirePenalty > 1
    ) {
      errors.push('lineOfSight.arcFirePenalty must be between 0 and 1');
    }
  }

  // Validate ammunition config bounds
  if (config.ammunition && typeof config.ammunition === 'object') {
    if (config.ammunition.defaultAmmo < 0) {
      errors.push('ammunition.defaultAmmo cannot be negative');
    }
    if (config.ammunition.defaultCooldown < 0) {
      errors.push('ammunition.defaultCooldown cannot be negative');
    }
  }

  // Validate contagion config bounds
  if (config.contagion && typeof config.contagion === 'object') {
    const spreadFields = [
      'fireSpread',
      'poisonSpread',
      'curseSpread',
      'frostSpread',
      'plagueSpread',
    ] as const;
    for (const field of spreadFields) {
      if (config.contagion[field] < 0 || config.contagion[field] > 1) {
        errors.push(`contagion.${field} must be between 0 and 1`);
      }
    }
    if (
      config.contagion.phalanxSpreadBonus < 0 ||
      config.contagion.phalanxSpreadBonus > 1
    ) {
      errors.push('contagion.phalanxSpreadBonus must be between 0 and 1');
    }
  }

  // Validate armor shred config bounds
  if (config.armorShred && typeof config.armorShred === 'object') {
    if (config.armorShred.shredPerAttack < 0) {
      errors.push('armorShred.shredPerAttack cannot be negative');
    }
    if (
      config.armorShred.maxShredPercent < 0 ||
      config.armorShred.maxShredPercent > 1
    ) {
      errors.push('armorShred.maxShredPercent must be between 0 and 1');
    }
    if (config.armorShred.decayPerTurn < 0) {
      errors.push('armorShred.decayPerTurn cannot be negative');
    }
  }

  // Warnings for potentially problematic configurations
  if (config.contagion && config.phalanx) {
    warnings.push(
      'Both contagion and phalanx are enabled. Contagion spreads faster in phalanx formations.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
