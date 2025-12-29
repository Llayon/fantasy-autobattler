/**
 * Mechanics configuration validator
 *
 * Validates that a mechanics configuration is valid:
 * - All values are within acceptable bounds
 * - Dependencies are consistent
 * - No circular dependencies
 */

import { MechanicsConfig, NormalizedMechanicsConfig } from './mechanics.types';
import { normalizeConfig, MECHANIC_DEPENDENCIES } from './dependencies';

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate a mechanics configuration
 *
 * Checks:
 * - All values are valid (boolean or object)
 * - All numeric values are within bounds
 * - Dependencies are consistent
 * - No circular dependencies
 *
 * @param config - Configuration to validate
 * @throws ValidationError if configuration is invalid
 *
 * @example
 * validateMechanicsConfig({ flanking: true });
 * // Throws if invalid
 */
export function validateMechanicsConfig(config: MechanicsConfig): void {
  // Normalize first to catch dependency issues
  let normalized: NormalizedMechanicsConfig;
  try {
    normalized = normalizeConfig(config);
  } catch (error) {
    throw new ValidationError(`Failed to normalize config: ${error}`);
  }

  // Validate each mechanic's configuration
  validateFacingConfig(normalized.facing);
  validateArmorShredConfig(normalized.armorShred);
  validateResolveConfig(normalized.resolve);
  validateEngagementConfig(normalized.engagement);
  validateFlankingConfig(normalized.flanking);
  validateRiposteConfig(normalized.riposte);
  validateInterceptConfig(normalized.intercept);
  validateAuraConfig(normalized.aura);
  validateChargeConfig(normalized.charge);
  validateOverwatchConfig(normalized.overwatch);
  validatePhalanxConfig(normalized.phalanx);
  validateLineOfSightConfig(normalized.lineOfSight);
  validateAmmunitionConfig(normalized.ammunition);
  validateContagionConfig(normalized.contagion);

  // Check for circular dependencies
  checkCircularDependencies();
}

/**
 * Validate Facing configuration
 */
function validateFacingConfig(config: any): void {
  if (config === false) return;
  // enabled is optional
}

/**
 * Validate ArmorShred configuration
 */
function validateArmorShredConfig(config: any): void {
  if (config === false) return;
  if (config.maxShred !== undefined && (config.maxShred < 0 || config.maxShred > 100)) {
    throw new ValidationError('ArmorShred maxShred must be between 0 and 100');
  }
  if (config.decayPerTurn !== undefined && config.decayPerTurn < 0) {
    throw new ValidationError('ArmorShred decayPerTurn must be >= 0');
  }
}

/**
 * Validate Resolve configuration
 */
function validateResolveConfig(config: any): void {
  if (config === false) return;
  if (config.maxResolve !== undefined && config.maxResolve <= 0) {
    throw new ValidationError('Resolve maxResolve must be > 0');
  }
  if (config.recoveryPerTurn !== undefined && config.recoveryPerTurn < 0) {
    throw new ValidationError('Resolve recoveryPerTurn must be >= 0');
  }
  if (config.wavering !== undefined && (config.wavering < 0 || config.wavering > 100)) {
    throw new ValidationError('Resolve wavering must be between 0 and 100');
  }
  if (config.routing !== undefined && (config.routing < 0 || config.routing > 100)) {
    throw new ValidationError('Resolve routing must be between 0 and 100');
  }
  if (config.humanRetreatChance !== undefined && (config.humanRetreatChance < 0 || config.humanRetreatChance > 1)) {
    throw new ValidationError('Resolve humanRetreatChance must be between 0 and 1');
  }
  if (config.undeadCrumbleChance !== undefined && (config.undeadCrumbleChance < 0 || config.undeadCrumbleChance > 1)) {
    throw new ValidationError('Resolve undeadCrumbleChance must be between 0 and 1');
  }
}

/**
 * Validate Engagement configuration
 */
function validateEngagementConfig(config: any): void {
  if (config === false) return;
  if (config.zoneOfControlRange !== undefined && config.zoneOfControlRange < 0) {
    throw new ValidationError('Engagement zoneOfControlRange must be >= 0');
  }
  if (config.archerPenalty !== undefined && (config.archerPenalty < 0 || config.archerPenalty > 1)) {
    throw new ValidationError('Engagement archerPenalty must be between 0 and 1');
  }
}

/**
 * Validate Flanking configuration
 */
function validateFlankingConfig(config: any): void {
  if (config === false) return;
  if (config.frontDamageModifier !== undefined && config.frontDamageModifier < 0) {
    throw new ValidationError('Flanking frontDamageModifier must be >= 0');
  }
  if (config.flankDamageModifier !== undefined && config.flankDamageModifier < 0) {
    throw new ValidationError('Flanking flankDamageModifier must be >= 0');
  }
  if (config.rearDamageModifier !== undefined && config.rearDamageModifier < 0) {
    throw new ValidationError('Flanking rearDamageModifier must be >= 0');
  }
  if (config.resolveDamageModifier !== undefined && (config.resolveDamageModifier < 0 || config.resolveDamageModifier > 1)) {
    throw new ValidationError('Flanking resolveDamageModifier must be between 0 and 1');
  }
}

/**
 * Validate Riposte configuration
 */
function validateRiposteConfig(config: any): void {
  if (config === false) return;
  if (config.baseChance !== undefined && (config.baseChance < 0 || config.baseChance > 1)) {
    throw new ValidationError('Riposte baseChance must be between 0 and 1');
  }
  if (config.initiativeBonus !== undefined && config.initiativeBonus < 0) {
    throw new ValidationError('Riposte initiativeBonus must be >= 0');
  }
  if (config.chargeLimit !== undefined && config.chargeLimit < 0) {
    throw new ValidationError('Riposte chargeLimit must be >= 0');
  }
}

/**
 * Validate Intercept configuration
 */
function validateInterceptConfig(config: any): void {
  if (config === false) return;
  if (config.disengageCost !== undefined && config.disengageCost < 0) {
    throw new ValidationError('Intercept disengageCost must be >= 0');
  }
}

/**
 * Validate Aura configuration
 */
function validateAuraConfig(config: any): void {
  if (config === false) return;
  if (config.maxRange !== undefined && config.maxRange < 0) {
    throw new ValidationError('Aura maxRange must be >= 0');
  }
  if (config.stackingLimit !== undefined && config.stackingLimit < 0) {
    throw new ValidationError('Aura stackingLimit must be >= 0');
  }
}

/**
 * Validate Charge configuration
 */
function validateChargeConfig(config: any): void {
  if (config === false) return;
  if (config.momentumPerCell !== undefined && config.momentumPerCell < 0) {
    throw new ValidationError('Charge momentumPerCell must be >= 0');
  }
  if (config.maxMomentum !== undefined && config.maxMomentum < 0) {
    throw new ValidationError('Charge maxMomentum must be >= 0');
  }
  if (config.damageModifier !== undefined && config.damageModifier < 0) {
    throw new ValidationError('Charge damageModifier must be >= 0');
  }
  if (config.spearWallCounterChance !== undefined && (config.spearWallCounterChance < 0 || config.spearWallCounterChance > 1)) {
    throw new ValidationError('Charge spearWallCounterChance must be between 0 and 1');
  }
}

/**
 * Validate Overwatch configuration
 */
function validateOverwatchConfig(config: any): void {
  if (config === false) return;
  if (config.ammoConsumption !== undefined && config.ammoConsumption < 0) {
    throw new ValidationError('Overwatch ammoConsumption must be >= 0');
  }
  if (config.triggerRange !== undefined && config.triggerRange < 0) {
    throw new ValidationError('Overwatch triggerRange must be >= 0');
  }
}

/**
 * Validate Phalanx configuration
 */
function validatePhalanxConfig(config: any): void {
  if (config === false) return;
  if (config.minFormationSize !== undefined && config.minFormationSize < 0) {
    throw new ValidationError('Phalanx minFormationSize must be >= 0');
  }
  if (config.armorBonus !== undefined && (config.armorBonus < 0 || config.armorBonus > 1)) {
    throw new ValidationError('Phalanx armorBonus must be between 0 and 1');
  }
  if (config.resolveBonus !== undefined && (config.resolveBonus < 0 || config.resolveBonus > 1)) {
    throw new ValidationError('Phalanx resolveBonus must be between 0 and 1');
  }
}

/**
 * Validate LineOfSight configuration
 */
function validateLineOfSightConfig(config: any): void {
  if (config === false) return;
  if (config.arcFirePenalty !== undefined && (config.arcFirePenalty < 0 || config.arcFirePenalty > 1)) {
    throw new ValidationError('LineOfSight arcFirePenalty must be between 0 and 1');
  }
}

/**
 * Validate Ammunition configuration
 */
function validateAmmunitionConfig(config: any): void {
  if (config === false) return;
  if (config.maxAmmo !== undefined && config.maxAmmo < 0) {
    throw new ValidationError('Ammunition maxAmmo must be >= 0');
  }
  if (config.reloadPerTurn !== undefined && config.reloadPerTurn < 0) {
    throw new ValidationError('Ammunition reloadPerTurn must be >= 0');
  }
}

/**
 * Validate Contagion configuration
 */
function validateContagionConfig(config: any): void {
  if (config === false) return;
  if (config.spreadChance !== undefined && (config.spreadChance < 0 || config.spreadChance > 1)) {
    throw new ValidationError('Contagion spreadChance must be between 0 and 1');
  }
  if (config.phalanxBonusChance !== undefined && (config.phalanxBonusChance < 0 || config.phalanxBonusChance > 1)) {
    throw new ValidationError('Contagion phalanxBonusChance must be between 0 and 1');
  }
  if (config.spreadRange !== undefined && config.spreadRange < 0) {
    throw new ValidationError('Contagion spreadRange must be >= 0');
  }
}

/**
 * Check for circular dependencies
 *
 * @throws ValidationError if circular dependency found
 */
function checkCircularDependencies(): void {
  for (const mechanicName of Object.keys(MECHANIC_DEPENDENCIES)) {
    const visited = new Set<string>();
    const stack = new Set<string>();

    function visit(name: string) {
      if (stack.has(name)) {
        throw new ValidationError(`Circular dependency detected: ${name}`);
      }
      if (visited.has(name)) {
        return;
      }

      visited.add(name);
      stack.add(name);

      const dependency = MECHANIC_DEPENDENCIES[name];
      if (dependency) {
        for (const depName of dependency.dependencies) {
          visit(depName);
        }
      }

      stack.delete(name);
    }

    visit(mechanicName);
  }
}
