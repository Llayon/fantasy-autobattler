/**
 * A* pathfinding algorithm for Fantasy Autobattler battlefield.
 * Re-exports from core/grid/pathfinding with game-specific defaults.
 *
 * @fileoverview A* pathfinding implementation with priority queue optimization,
 * Manhattan distance heuristic, and deterministic path generation.
 *
 * @deprecated Import from '../core/grid' for new code.
 * This file is kept for backward compatibility.
 */

import { BattleUnit } from '../types/game.types';
import { GRID_DIMENSIONS, DEPLOYMENT_ZONES, PATHFINDING_CONSTANTS } from '../config/game.constants';
import type { GridConfig, PathfindingConfig } from '../core/types/config.types';
import type { Position, Grid } from '../core/types/grid.types';

// Import core functions for wrapping
import {
  findPath as coreFindPath,
  findPathWithMaxLength as coreFindPathWithMaxLength,
  findClosestReachablePosition as coreFindClosestReachablePosition,
  hasPath as coreHasPath,
} from '../core/grid';

// =============================================================================
// GAME-SPECIFIC CONFIG
// =============================================================================

/**
 * Game-specific grid configuration.
 */
const GAME_GRID_CONFIG: GridConfig = {
  width: GRID_DIMENSIONS.WIDTH,
  height: GRID_DIMENSIONS.HEIGHT,
  playerRows: DEPLOYMENT_ZONES.PLAYER_ROWS as unknown as number[],
  enemyRows: DEPLOYMENT_ZONES.ENEMY_ROWS as unknown as number[],
};

/**
 * Game-specific pathfinding configuration.
 */
const GAME_PATHFINDING_CONFIG: PathfindingConfig = {
  maxIterations: PATHFINDING_CONSTANTS.MAX_ITERATIONS,
  movementCost: PATHFINDING_CONSTANTS.MOVEMENT_COST,
  diagonalCost: 1.414,
};

// =============================================================================
// WRAPPER FUNCTIONS (use game-specific config by default)
// =============================================================================

/**
 * Find optimal path using A* algorithm.
 * Uses Manhattan distance heuristic and considers unit collisions.
 *
 * @param start - Starting position
 * @param goal - Target position
 * @param grid - Current grid state
 * @param units - Array of units that can block movement
 * @param movingUnit - The unit that is moving (excluded from collision)
 * @returns Array of positions forming the path, empty if no path found
 * @example
 * const path = findPath(
 *   { x: 0, y: 0 },
 *   { x: 3, y: 3 },
 *   grid,
 *   allUnits,
 *   currentUnit
 * );
 * if (path.length > 0) {
 *   console.log(`Path found with ${path.length} steps`);
 * }
 */
export function findPath(
  start: Position,
  goal: Position,
  grid: Grid,
  units: BattleUnit[],
  movingUnit?: BattleUnit
): Position[] {
  return coreFindPath(start, goal, grid, units, movingUnit, GAME_GRID_CONFIG, GAME_PATHFINDING_CONFIG);
}

/**
 * Find path with maximum length constraint.
 * Useful for movement with limited range.
 *
 * @param start - Starting position
 * @param goal - Target position
 * @param maxLength - Maximum path length (including start)
 * @param grid - Current grid state
 * @param units - Array of units that can block movement
 * @param movingUnit - The unit that is moving (excluded from collision)
 * @returns Array of positions forming the path, empty if no path found or too long
 * @example
 * const path = findPathWithMaxLength(
 *   { x: 0, y: 0 },
 *   { x: 5, y: 5 },
 *   3, // Maximum 3 steps
 *   grid,
 *   allUnits,
 *   currentUnit
 * );
 */
export function findPathWithMaxLength(
  start: Position,
  goal: Position,
  maxLength: number,
  grid: Grid,
  units: BattleUnit[],
  movingUnit?: BattleUnit
): Position[] {
  return coreFindPathWithMaxLength(
    start,
    goal,
    maxLength,
    grid,
    units,
    movingUnit,
    GAME_GRID_CONFIG,
    GAME_PATHFINDING_CONFIG
  );
}

/**
 * Find the closest reachable position to a target.
 * Useful when the exact target is unreachable.
 *
 * @param start - Starting position
 * @param target - Desired target position
 * @param maxRange - Maximum search range
 * @param grid - Current grid state
 * @param units - Array of units that can block movement
 * @param movingUnit - The unit that is moving (excluded from collision)
 * @returns Closest reachable position or start if none found
 * @example
 * const closest = findClosestReachablePosition(
 *   { x: 0, y: 0 },
 *   { x: 5, y: 5 }, // Target might be blocked
 *   4, // Search within 4 cells
 *   grid,
 *   allUnits,
 *   currentUnit
 * );
 */
export function findClosestReachablePosition(
  start: Position,
  target: Position,
  maxRange: number,
  grid: Grid,
  units: BattleUnit[],
  movingUnit?: BattleUnit
): Position {
  return coreFindClosestReachablePosition(
    start,
    target,
    maxRange,
    grid,
    units,
    movingUnit,
    GAME_GRID_CONFIG,
    GAME_PATHFINDING_CONFIG
  );
}

/**
 * Check if a path exists between two positions.
 * More efficient than findPath when you only need to know if path exists.
 *
 * @param start - Starting position
 * @param goal - Target position
 * @param grid - Current grid state
 * @param units - Array of units that can block movement
 * @param movingUnit - The unit that is moving (excluded from collision)
 * @returns True if a path exists
 * @example
 * if (hasPath(unitPos, targetPos, grid, allUnits, unit)) {
 *   // Plan movement
 * } else {
 *   // Find alternative target
 * }
 */
export function hasPath(
  start: Position,
  goal: Position,
  grid: Grid,
  units: BattleUnit[],
  movingUnit?: BattleUnit
): boolean {
  return coreHasPath(start, goal, grid, units, movingUnit, GAME_GRID_CONFIG, GAME_PATHFINDING_CONFIG);
}
