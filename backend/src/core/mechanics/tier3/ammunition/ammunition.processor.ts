/**
 * Ammunition processor
 *
 * Implements resource system for ranged units and mages.
 * - Ranged units have limited ammo (default 6)
 * - Mages have ability cooldowns
 * - Ammo consumed on attack
 * - Cooldowns tick down each turn
 */

import { AmmunitionConfig } from '../../config/mechanics.types';
import {
  AmmoUnit,
  AmmoConsumeResult,
  CooldownResult,
  ReloadResult,
  DEFAULT_AMMO_VALUES,
} from './ammunition.types';

/**
 * Check if unit has ammo available
 *
 * @param unit - Unit to check
 * @returns true if unit has ammo or doesn't need it
 *
 * @example
 * if (hasAmmo(archer)) {
 *   // Can attack
 * }
 */
export function hasAmmo(unit: AmmoUnit): boolean {
  if (!unit.isRanged) {
    return true;
  }

  const ammo = unit.ammo ?? DEFAULT_AMMO_VALUES.maxAmmo;
  return ammo > 0;
}

/**
 * Get current ammo count
 *
 * @param unit - Unit to check
 * @param config - Optional ammunition configuration
 * @returns Current ammo count
 */
export function getAmmo(
  unit: AmmoUnit,
  config?: Partial<AmmunitionConfig>,
): number {
  if (!unit.isRanged) {
    return Infinity;
  }

  const maxAmmo = config?.maxAmmo ?? DEFAULT_AMMO_VALUES.maxAmmo;
  return unit.ammo ?? maxAmmo;
}

/**
 * Get maximum ammo for a unit
 *
 * @param unit - Unit to check
 * @param config - Optional ammunition configuration
 * @returns Maximum ammo
 */
export function getMaxAmmo(
  unit: AmmoUnit,
  config?: Partial<AmmunitionConfig>,
): number {
  if (!unit.isRanged) {
    return Infinity;
  }

  return unit.maxAmmo ?? config?.maxAmmo ?? DEFAULT_AMMO_VALUES.maxAmmo;
}

/**
 * Consume ammo for an attack
 *
 * @param unit - Unit consuming ammo
 * @param amount - Amount to consume (default 1)
 * @param config - Optional ammunition configuration
 * @returns Ammo consume result
 *
 * @example
 * const result = consumeAmmo(archer);
 * if (result.outOfAmmo) {
 *   // Cannot attack anymore
 * }
 */
export function consumeAmmo(
  unit: AmmoUnit,
  amount: number = 1,
  config?: Partial<AmmunitionConfig>,
): AmmoConsumeResult {
  if (!unit.isRanged) {
    return {
      consumed: false,
      remainingAmmo: Infinity,
      outOfAmmo: false,
    };
  }

  const currentAmmo = getAmmo(unit, config);
  const newAmmo = Math.max(0, currentAmmo - amount);

  return {
    consumed: true,
    remainingAmmo: newAmmo,
    outOfAmmo: newAmmo === 0,
  };
}

/**
 * Update unit after consuming ammo
 *
 * @param unit - Unit to update
 * @param amount - Amount consumed
 * @param config - Optional ammunition configuration
 * @returns Updated unit
 */
export function updateAmmo<T extends AmmoUnit>(
  unit: T,
  amount: number = 1,
  config?: Partial<AmmunitionConfig>,
): T {
  if (!unit.isRanged) {
    return unit;
  }

  const result = consumeAmmo(unit, amount, config);

  return {
    ...unit,
    ammo: result.remainingAmmo,
  };
}

/**
 * Reload ammo at turn start
 *
 * @param unit - Unit to reload
 * @param config - Optional ammunition configuration
 * @returns Reload result
 */
export function reload(
  unit: AmmoUnit,
  config?: Partial<AmmunitionConfig>,
): ReloadResult {
  if (!unit.isRanged) {
    return {
      reloaded: false,
      newAmmo: Infinity,
      ammoGained: 0,
    };
  }

  const reloadAmount = config?.reloadPerTurn ?? DEFAULT_AMMO_VALUES.reloadPerTurn;

  if (reloadAmount === 0) {
    return {
      reloaded: false,
      newAmmo: getAmmo(unit, config),
      ammoGained: 0,
    };
  }

  const currentAmmo = getAmmo(unit, config);
  const maxAmmo = getMaxAmmo(unit, config);
  const newAmmo = Math.min(maxAmmo, currentAmmo + reloadAmount);

  return {
    reloaded: true,
    newAmmo,
    ammoGained: newAmmo - currentAmmo,
  };
}

/**
 * Update unit after reload
 *
 * @param unit - Unit to update
 * @param config - Optional ammunition configuration
 * @returns Updated unit
 */
export function applyReload<T extends AmmoUnit>(
  unit: T,
  config?: Partial<AmmunitionConfig>,
): T {
  const result = reload(unit, config);

  if (!result.reloaded) {
    return unit;
  }

  return {
    ...unit,
    ammo: result.newAmmo,
  };
}

/**
 * Check if ability is on cooldown
 *
 * @param unit - Unit to check
 * @param abilityId - Ability ID to check
 * @returns Cooldown result
 *
 * @example
 * const result = checkCooldown(mage, 'fireball');
 * if (result.canUse) {
 *   // Can cast fireball
 * }
 */
export function checkCooldown(
  unit: AmmoUnit,
  abilityId: string,
): CooldownResult {
  if (!unit.isMage || !unit.cooldowns) {
    return {
      onCooldown: false,
      remainingTurns: 0,
      canUse: true,
    };
  }

  const remaining = unit.cooldowns[abilityId] ?? 0;

  return {
    onCooldown: remaining > 0,
    remainingTurns: remaining,
    canUse: remaining === 0,
  };
}

/**
 * Start cooldown for an ability
 *
 * @param unit - Unit to update
 * @param abilityId - Ability ID
 * @param cooldownTurns - Cooldown duration
 * @returns Updated unit
 */
export function startCooldown<T extends AmmoUnit>(
  unit: T,
  abilityId: string,
  cooldownTurns: number = DEFAULT_AMMO_VALUES.defaultCooldown,
): T {
  const currentCooldowns = unit.cooldowns ?? {};

  return {
    ...unit,
    cooldowns: {
      ...currentCooldowns,
      [abilityId]: cooldownTurns,
    },
  };
}

/**
 * Tick cooldowns at turn start
 *
 * @param unit - Unit to update
 * @returns Updated unit with reduced cooldowns
 */
export function tickCooldowns<T extends AmmoUnit>(unit: T): T {
  if (!unit.cooldowns) {
    return unit;
  }

  const newCooldowns: Record<string, number> = {};

  for (const [abilityId, remaining] of Object.entries(unit.cooldowns)) {
    const newRemaining = Math.max(0, remaining - DEFAULT_AMMO_VALUES.cooldownReductionPerTurn);
    if (newRemaining > 0) {
      newCooldowns[abilityId] = newRemaining;
    }
  }

  return {
    ...unit,
    cooldowns: Object.keys(newCooldowns).length > 0 ? newCooldowns : undefined,
  };
}

/**
 * Initialize ammo for a unit
 *
 * @param unit - Unit to initialize
 * @param config - Optional ammunition configuration
 * @returns Updated unit with ammo set
 */
export function initializeAmmo<T extends AmmoUnit>(
  unit: T,
  config?: Partial<AmmunitionConfig>,
): T {
  if (!unit.isRanged) {
    return unit;
  }

  const maxAmmo = config?.maxAmmo ?? DEFAULT_AMMO_VALUES.maxAmmo;

  return {
    ...unit,
    ammo: maxAmmo,
    maxAmmo,
  };
}

/**
 * Check if unit can attack (has ammo or not ranged)
 *
 * @param unit - Unit to check
 * @returns true if unit can attack
 */
export function canAttack(unit: AmmoUnit): boolean {
  return hasAmmo(unit);
}

/**
 * Get ammo percentage remaining
 *
 * @param unit - Unit to check
 * @param config - Optional ammunition configuration
 * @returns Percentage (0.0 to 1.0)
 */
export function getAmmoPercentage(
  unit: AmmoUnit,
  config?: Partial<AmmunitionConfig>,
): number {
  if (!unit.isRanged) {
    return 1.0;
  }

  const current = getAmmo(unit, config);
  const max = getMaxAmmo(unit, config);

  return max > 0 ? current / max : 0;
}
