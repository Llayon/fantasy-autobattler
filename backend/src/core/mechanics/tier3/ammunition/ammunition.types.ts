/**
 * Ammunition mechanic types
 *
 * Defines types for the resource system.
 * - Ranged units have limited ammo
 * - Mages have ability cooldowns
 */

/**
 * Unit with ammunition-relevant information
 */
export interface AmmoUnit {
  id: string;
  isRanged?: boolean;
  isMage?: boolean;
  ammo?: number;
  maxAmmo?: number;
  cooldowns?: Record<string, number>;
}

/**
 * Result of ammo consumption
 */
export interface AmmoConsumeResult {
  consumed: boolean;
  remainingAmmo: number;
  outOfAmmo: boolean;
}

/**
 * Result of cooldown check
 */
export interface CooldownResult {
  onCooldown: boolean;
  remainingTurns: number;
  canUse: boolean;
}

/**
 * Result of reload
 */
export interface ReloadResult {
  reloaded: boolean;
  newAmmo: number;
  ammoGained: number;
}

/**
 * Default ammunition configuration values
 */
export const DEFAULT_AMMO_VALUES = {
  maxAmmo: 6,
  reloadPerTurn: 0,
  defaultCooldown: 3,
  cooldownReductionPerTurn: 1,
};
