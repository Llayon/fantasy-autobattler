/**
 * Grid-related constants for the core battle engine.
 * These are generic defaults that can be overridden via GridConfig.
 *
 * @module core/constants/grid
 */

/**
 * A* pathfinding algorithm parameters.
 * Used as defaults when no PathfindingConfig is provided.
 */
export const PATHFINDING_CONSTANTS = {
  /** Maximum pathfinding iterations to prevent infinite loops */
  MAX_ITERATIONS: 1000,
  /** Movement cost for adjacent cells */
  MOVEMENT_COST: 1,
  /** Diagonal movement multiplier (not used in Manhattan distance) */
  DIAGONAL_COST: 1.4,
} as const;
