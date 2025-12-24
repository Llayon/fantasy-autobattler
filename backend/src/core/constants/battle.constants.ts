/**
 * Battle-related constants for the core battle engine.
 * These are generic defaults that can be overridden via BattleConfig.
 *
 * @module core/constants/battle
 */

/**
 * Battle simulation parameters.
 * Used as defaults when no BattleConfig is provided.
 */
export const BATTLE_LIMITS = {
  /** Maximum battle rounds before draw */
  MAX_ROUNDS: 100,
  /** Minimum damage dealt (after armor reduction) */
  MIN_DAMAGE: 1,
  /** Battle simulation timeout in milliseconds */
  SIMULATION_TIMEOUT_MS: 5000,
} as const;

/**
 * Combat calculation constants.
 * Used for damage and dodge calculations.
 */
export const COMBAT_CONSTANTS = {
  /** Base dodge chance percentage */
  BASE_DODGE_CHANCE: 0,
  /** Maximum dodge chance percentage */
  MAX_DODGE_CHANCE: 50,
  /** Dodge only applies to physical attacks */
  DODGE_AFFECTS_MAGIC: false,
} as const;
