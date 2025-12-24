/**
 * Game constants and configuration values for Fantasy Autobattler.
 * All magic numbers from the Game Design Document are centralized here.
 * 
 * @fileoverview Contains all game balance parameters, grid dimensions,
 * unit costs, stat ranges, and other configurable values.
 * 
 * NOTE: This file re-exports from core and game modules for backward compatibility.
 * New code should import directly from @core/constants or @game/constants.
 */

// Re-export core constants
export { PATHFINDING_CONSTANTS } from '../core/constants/grid.constants';
export { BATTLE_LIMITS, COMBAT_CONSTANTS } from '../core/constants/battle.constants';

// Re-export game constants
export {
  TEAM_LIMITS,
  UNIT_ROLES,
  ROLE_DISTRIBUTION,
  UNIT_STAT_RANGES,
  ABILITY_CONSTANTS,
  ABILITY_EFFECT_RANGES,
  MATCHMAKING_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  GAMEPLAY_VALUES,
  COST_CALCULATION_WEIGHTS,
  ABILITY_TYPES,
  ABILITY_TARGET_TYPES,
  ABILITY_EFFECT_TYPES,
} from '../game/constants/game.constants';

// Re-export types
export type {
  UnitRole,
  AbilityType,
  AbilityTargetType,
  AbilityEffectType,
} from '../game/constants/game.constants';

// =============================================================================
// GRID & BATTLEFIELD CONSTANTS (kept for backward compatibility)
// =============================================================================

/**
 * Battlefield grid dimensions (8×10 cells).
 * @deprecated Import from @game/config/game.config instead
 */
export const GRID_DIMENSIONS = {
  /** Grid width in cells */
  WIDTH: 8,
  /** Grid height in cells */
  HEIGHT: 10,
} as const;

/**
 * Player and enemy deployment zones.
 * @deprecated Import from @game/config/game.config instead
 */
export const DEPLOYMENT_ZONES = {
  /** Player unit rows (0-1) */
  PLAYER_ROWS: [0, 1] as const,
  /** Enemy unit rows (8-9) */
  ENEMY_ROWS: [8, 9] as const,
  /** Neutral battlefield rows (2-7) */
  NEUTRAL_ROWS: [2, 3, 4, 5, 6, 7] as const,
} as const;