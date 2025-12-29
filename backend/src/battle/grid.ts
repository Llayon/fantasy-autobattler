/**
 * Grid system for Fantasy Autobattler battlefield.
 * Re-exports from core/grid with game-specific defaults.
 *
 * @fileoverview Grid utilities for battlefield management, unit positioning,
 * range calculations, and movement validation.
 *
 * @deprecated Import from '../core/grid' for new code.
 * This file is kept for backward compatibility.
 */

import { BattleUnit } from '../types/game.types';
import { GRID_DIMENSIONS, DEPLOYMENT_ZONES } from '../config/game.constants';
import type { GridConfig } from '../core/types/config.types';
import type { Position, Grid } from '../core/types/grid.types';

// =============================================================================
// RE-EXPORTS FROM CORE (for backward compatibility)
// =============================================================================

export {
  manhattanDistance,
  euclideanDistance,
  isInRange,
  positionToKey,
  keyToPosition,
  positionsEqual,
} from '../core/grid';

export type { Grid } from '../core/types/grid.types';

// Import core functions for wrapping
import {
  createEmptyGrid as coreCreateEmptyGrid,
  createGridWithUnits as coreCreateGridWithUnits,
  isValidPosition as coreIsValidPosition,
  isWalkable as coreIsWalkable,
  isPlayerDeploymentZone as coreIsPlayerDeploymentZone,
  isEnemyDeploymentZone as coreIsEnemyDeploymentZone,
  getNeighbors as coreGetNeighbors,
  getPositionsInMovementRange as coreGetPositionsInMovementRange,
  getUnitsInRange as coreGetUnitsInRange,
  getClosestUnit as coreGetClosestUnit,
  getUnitAtPosition as coreGetUnitAtPosition,
  getAoEPositions as coreGetAoEPositions,
  getUnitsInAoE as coreGetUnitsInAoE,
} from '../core/grid';

// =============================================================================
// GAME-SPECIFIC GRID CONFIG
// =============================================================================

/**
 * Game-specific grid configuration.
 * Uses constants from game.constants.ts.
 */
const GAME_GRID_CONFIG: GridConfig = {
  width: GRID_DIMENSIONS.WIDTH,
  height: GRID_DIMENSIONS.HEIGHT,
  playerRows: DEPLOYMENT_ZONES.PLAYER_ROWS as unknown as number[],
  enemyRows: DEPLOYMENT_ZONES.ENEMY_ROWS as unknown as number[],
};

// =============================================================================
// WRAPPER FUNCTIONS (use game-specific config by default)
// =============================================================================

/**
 * Create an empty 8×10 battlefield grid.
 * All cells are initialized as empty and walkable.
 *
 * @returns 2D array of empty grid cells
 * @example
 * const grid = createEmptyGrid();
 * console.log(grid.length); // 10 (height)
 * console.log(grid[0].length); // 8 (width)
 */
export function createEmptyGrid(): Grid {
  return coreCreateEmptyGrid(GAME_GRID_CONFIG);
}

/**
 * Create a grid with units placed at their positions.
 * Updates cell types and unit references based on unit positions.
 *
 * @param units - Array of battle units with positions
 * @returns Grid with units placed
 * @example
 * const units = [{ instanceId: 'unit1', position: { x: 0, y: 0 }, ...otherProps }];
 * const grid = createGridWithUnits(units);
 * console.log(grid[0][0].type); // 'occupied'
 */
export function createGridWithUnits(units: BattleUnit[]): Grid {
  return coreCreateGridWithUnits(units, GAME_GRID_CONFIG);
}

/**
 * Check if a position is within the valid grid bounds.
 * Grid coordinates are 0-based: x ∈ [0,7], y ∈ [0,9].
 *
 * @param pos - Position to validate
 * @returns True if position is within grid bounds
 * @example
 * console.log(isValidPosition({ x: 0, y: 0 })); // true
 * console.log(isValidPosition({ x: 8, y: 0 })); // false (out of bounds)
 * console.log(isValidPosition({ x: -1, y: 5 })); // false (negative)
 */
export function isValidPosition(pos: Position): boolean {
  return coreIsValidPosition(pos, GAME_GRID_CONFIG);
}

/**
 * Check if a position is walkable (not occupied or blocked).
 *
 * @param pos - Position to check
 * @param grid - Current grid state
 * @returns True if position can be moved to
 * @example
 * const grid = createEmptyGrid();
 * console.log(isWalkable({ x: 0, y: 0 }, grid)); // true
 */
export function isWalkable(pos: Position, grid: Grid): boolean {
  return coreIsWalkable(pos, grid, GAME_GRID_CONFIG);
}

/**
 * Check if a position is in the player deployment zone.
 * Player units can only be placed in rows 0-1.
 *
 * @param pos - Position to check
 * @returns True if position is in player deployment zone
 * @example
 * console.log(isPlayerDeploymentZone({ x: 0, y: 0 })); // true
 * console.log(isPlayerDeploymentZone({ x: 0, y: 2 })); // false
 */
export function isPlayerDeploymentZone(pos: Position): boolean {
  return coreIsPlayerDeploymentZone(pos, GAME_GRID_CONFIG);
}

/**
 * Check if a position is in the enemy deployment zone.
 * Enemy units can only be placed in rows 8-9.
 *
 * @param pos - Position to check
 * @returns True if position is in enemy deployment zone
 * @example
 * console.log(isEnemyDeploymentZone({ x: 0, y: 8 })); // true
 * console.log(isEnemyDeploymentZone({ x: 0, y: 7 })); // false
 */
export function isEnemyDeploymentZone(pos: Position): boolean {
  return coreIsEnemyDeploymentZone(pos, GAME_GRID_CONFIG);
}

/**
 * Get all valid neighboring positions (4-directional).
 * Returns positions for up, down, left, right movement.
 *
 * @param pos - Center position
 * @returns Array of valid neighboring positions
 * @example
 * const neighbors = getNeighbors({ x: 1, y: 1 });
 * console.log(neighbors.length); // 4 (all directions valid)
 */
export function getNeighbors(pos: Position): Position[] {
  return coreGetNeighbors(pos, GAME_GRID_CONFIG);
}

/**
 * Get all positions within movement range.
 * Returns all positions reachable within the specified number of steps.
 *
 * @param center - Starting position
 * @param range - Maximum movement distance
 * @param grid - Current grid state for walkability
 * @returns Array of reachable positions
 * @example
 * const grid = createEmptyGrid();
 * const reachable = getPositionsInMovementRange({ x: 0, y: 0 }, 2, grid);
 */
export function getPositionsInMovementRange(
  center: Position,
  range: number,
  grid: Grid
): Position[] {
  return coreGetPositionsInMovementRange(center, range, grid, GAME_GRID_CONFIG);
}

/**
 * Get all units within range of a center position.
 * Uses Manhattan distance for range calculation.
 *
 * @param center - Center position for range check
 * @param range - Maximum range in cells
 * @param units - Array of units to check
 * @returns Array of units within range
 * @example
 * const nearbyUnits = getUnitsInRange({ x: 2, y: 2 }, 2, allUnits);
 */
export function getUnitsInRange(
  center: Position,
  range: number,
  units: BattleUnit[]
): BattleUnit[] {
  return coreGetUnitsInRange(center, range, units);
}

/**
 * Get the closest unit to a position.
 * Returns the unit with minimum Manhattan distance.
 *
 * @param center - Reference position
 * @param units - Array of units to check
 * @returns Closest unit or undefined if no units
 * @example
 * const closest = getClosestUnit({ x: 0, y: 0 }, enemyUnits);
 */
export function getClosestUnit(center: Position, units: BattleUnit[]): BattleUnit | undefined {
  return coreGetClosestUnit(center, units);
}

/**
 * Get unit at a specific position.
 *
 * @param pos - Position to check
 * @param units - Array of units to search
 * @returns Unit at position or undefined if none
 * @example
 * const unitAtPos = getUnitAtPosition({ x: 0, y: 0 }, allUnits);
 */
export function getUnitAtPosition(pos: Position, units: BattleUnit[]): BattleUnit | undefined {
  return coreGetUnitAtPosition(pos, units);
}

/**
 * Get all positions within an area of effect.
 * Returns positions in a square area around the center.
 *
 * @param center - Center position of AoE
 * @param radius - Radius of effect (0 = single cell, 1 = 3x3 area, etc.)
 * @returns Array of positions within AoE
 * @example
 * const aoePositions = getAoEPositions({ x: 2, y: 2 }, 1);
 * console.log(aoePositions.length); // 9 (3x3 area)
 */
export function getAoEPositions(center: Position, radius: number): Position[] {
  return coreGetAoEPositions(center, radius, GAME_GRID_CONFIG);
}

/**
 * Get all units within an area of effect.
 *
 * @param center - Center position of AoE
 * @param radius - Radius of effect
 * @param units - Array of units to check
 * @returns Array of units within AoE
 * @example
 * const affectedUnits = getUnitsInAoE({ x: 2, y: 2 }, 1, allUnits);
 */
export function getUnitsInAoE(
  center: Position,
  radius: number,
  units: BattleUnit[]
): BattleUnit[] {
  return coreGetUnitsInAoE(center, radius, units, GAME_GRID_CONFIG);
}
