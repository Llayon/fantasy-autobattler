/**
 * Bresenham Line Algorithm Implementation
 *
 * Provides precise line-of-sight calculation using Bresenham's line algorithm.
 * This algorithm efficiently calculates all grid cells that a line passes through
 * between two points, which is essential for determining line of sight in
 * grid-based combat systems.
 *
 * The algorithm works by tracking an error term that determines when to step
 * in the secondary direction, producing a line with no gaps and minimal
 * deviation from the true line between two points.
 *
 * @module core/mechanics/tier3/los/bresenham
 */

import type { Position, BattleState, BattleUnit } from '../../../types';
import type { LoSCell, LoSLine, LoSObstacle, UnitWithLoS } from './los.types';
import { LOS_TRANSPARENT_TAG } from './los.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit is alive.
 *
 * @param unit - Unit to check
 * @returns True if unit is alive
 */
function isUnitAlive(unit: BattleUnit): boolean {
  return (unit.currentHp ?? 0) > 0 && unit.alive !== false;
}

/**
 * Gets the unit's unique identifier.
 *
 * @param unit - Unit to get ID from
 * @returns Unit ID (instanceId or id)
 */
function getUnitId(unit: BattleUnit): string {
  return unit.instanceId ?? unit.id;
}

/**
 * Checks if a unit blocks line of sight.
 *
 * @param unit - Unit to check
 * @returns True if unit blocks LoS
 */
function doesUnitBlockLoS(unit: BattleUnit & UnitWithLoS): boolean {
  // Check explicit property first
  if (unit.blocksLoS !== undefined) {
    return unit.blocksLoS;
  }
  // Check for transparency tag
  const tags = unit.tags ?? [];
  if (tags.includes(LOS_TRANSPARENT_TAG)) {
    return false;
  }
  // Default: units block LoS
  return true;
}

// ═══════════════════════════════════════════════════════════════
// BRESENHAM LINE ALGORITHM
// ═══════════════════════════════════════════════════════════════

/**
 * Implements Bresenham's line algorithm to calculate all cells
 * along a line between two positions.
 *
 * ═══════════════════════════════════════════════════════════════
 * ALGORITHM DESCRIPTION
 * ═══════════════════════════════════════════════════════════════
 *
 * Bresenham's line algorithm is an efficient method for drawing
 * a line between two points on a grid. It uses only integer
 * arithmetic, making it fast and precise.
 *
 * The algorithm works by:
 * 1. Calculate dx = |x1 - x0| and dy = |y1 - y0|
 * 2. Determine step directions: sx = sign(x1 - x0), sy = sign(y1 - y0)
 * 3. Initialize error = dx - dy
 * 4. For each step:
 *    - Add current position to line
 *    - If at end, stop
 *    - Calculate e2 = 2 * error
 *    - If e2 > -dy: error -= dy, x += sx
 *    - If e2 < dx: error += dx, y += sy
 *
 * This produces a line with no gaps and minimal deviation from
 * the true line between the two points.
 *
 * ═══════════════════════════════════════════════════════════════
 *
 * @param start - Starting position
 * @param end - Ending position
 * @returns Array of cells along the line
 *
 * @example
 * // Calculate line from (0,0) to (3,2)
 * const cells = bresenhamLine({ x: 0, y: 0 }, { x: 3, y: 2 });
 * // Returns cells at (0,0), (1,0), (1,1), (2,1), (2,2), (3,2)
 *
 * @example
 * // Horizontal line
 * const horizontal = bresenhamLine({ x: 0, y: 0 }, { x: 4, y: 0 });
 * // Returns cells at (0,0), (1,0), (2,0), (3,0), (4,0)
 *
 * @example
 * // Diagonal line
 * const diagonal = bresenhamLine({ x: 0, y: 0 }, { x: 3, y: 3 });
 * // Returns cells at (0,0), (1,1), (2,2), (3,3)
 */
export function bresenhamLine(start: Position, end: Position): LoSCell[] {
  const cells: LoSCell[] = [];

  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let distanceFromStart = 0;

  while (true) {
    const isEndpoint = (x0 === start.x && y0 === start.y) || (x0 === x1 && y0 === y1);

    cells.push({
      position: { x: x0, y: y0 },
      distanceFromStart,
      isEndpoint,
    });

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }

    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }

    distanceFromStart++;
  }

  return cells;
}

/**
 * Calculates the line of sight path between two positions.
 * Uses Bresenham's line algorithm for precise cell enumeration.
 *
 * @param start - Starting position
 * @param end - Ending position
 * @returns Line of sight path with all cells and metadata
 *
 * @example
 * const line = getLineOfSight({ x: 0, y: 0 }, { x: 5, y: 3 });
 * console.log(line.length); // Number of cells in the line
 * console.log(line.cells); // Array of LoSCell objects
 */
export function getLineOfSight(start: Position, end: Position): LoSLine {
  const cells = bresenhamLine(start, end);

  return {
    cells,
    start,
    end,
    length: cells.length,
  };
}

/**
 * Checks if a position is blocked by an obstacle (unit).
 *
 * This function examines a specific grid position to determine if
 * there is a unit that would block line of sight. It considers:
 * - Whether a unit exists at the position
 * - Whether the unit is alive
 * - Whether the unit blocks LoS (some units are transparent)
 * - Whether to exclude a specific unit (usually the attacker)
 *
 * @param position - Position to check
 * @param state - Current battle state containing all units
 * @param excludeUnitId - Unit ID to exclude from blocking check (usually attacker)
 * @returns Obstacle information if blocked, undefined if clear
 *
 * @example
 * // Check if position (3, 4) is blocked
 * const obstacle = isBlocked({ x: 3, y: 4 }, state);
 * if (obstacle) {
 *   console.log(`Blocked by ${obstacle.type}: ${obstacle.unitId}`);
 * }
 *
 * @example
 * // Check position excluding the attacker
 * const obstacle = isBlocked({ x: 3, y: 4 }, state, 'archer_1');
 * // Won't return obstacle if archer_1 is at that position
 */
export function isBlocked(
  position: Position,
  state: BattleState,
  excludeUnitId?: string,
): LoSObstacle | undefined {
  // Find unit at this position
  const unitAtPosition = state.units.find(
    (u) =>
      u.position &&
      u.position.x === position.x &&
      u.position.y === position.y &&
      isUnitAlive(u) &&
      getUnitId(u) !== excludeUnitId,
  );

  if (unitAtPosition) {
    const unitWithLoS = unitAtPosition as BattleUnit & UnitWithLoS;

    // Check if this unit blocks LoS
    if (doesUnitBlockLoS(unitWithLoS)) {
      return {
        position,
        type: 'unit',
        unitId: getUnitId(unitAtPosition),
        blocksCompletely: true,
      };
    }
  }

  // No obstacle at this position
  return undefined;
}

/**
 * Finds all obstacles along a line of sight path.
 *
 * This function calculates the line between two positions and
 * checks each cell (excluding endpoints) for blocking obstacles.
 *
 * @param start - Starting position (attacker)
 * @param end - Ending position (target)
 * @param state - Current battle state
 * @param excludeUnitIds - Unit IDs to exclude from blocking check
 * @returns Array of obstacles found along the path
 *
 * @example
 * // Find obstacles between archer and target
 * const obstacles = findObstaclesAlongLine(
 *   archerPos,
 *   targetPos,
 *   state,
 *   ['archer_1', 'target_1']
 * );
 */
export function findObstaclesAlongLine(
  start: Position,
  end: Position,
  state: BattleState,
  excludeUnitIds: string[] = [],
): LoSObstacle[] {
  const line = getLineOfSight(start, end);
  const obstacles: LoSObstacle[] = [];

  for (const cell of line.cells) {
    // Skip endpoints (start and end positions)
    if (cell.isEndpoint) continue;

    // Check for obstacle at this cell
    for (const excludeId of excludeUnitIds) {
      const obstacle = isBlocked(cell.position, state, excludeId);
      if (obstacle && !excludeUnitIds.includes(obstacle.unitId ?? '')) {
        obstacles.push(obstacle);
        break; // Only add one obstacle per cell
      }
    }

    // If no excludeIds provided, check without exclusion
    if (excludeUnitIds.length === 0) {
      const obstacle = isBlocked(cell.position, state);
      if (obstacle) {
        obstacles.push(obstacle);
      }
    }
  }

  return obstacles;
}

/**
 * Checks if there is a clear line of sight between two positions.
 *
 * This is a convenience function that returns a simple boolean
 * indicating whether the path is clear of obstacles.
 *
 * @param start - Starting position
 * @param end - Ending position
 * @param state - Current battle state
 * @param excludeUnitIds - Unit IDs to exclude from blocking check
 * @returns True if line of sight is clear, false if blocked
 *
 * @example
 * if (hasDirectLoS(archerPos, targetPos, state, ['archer_1', 'target_1'])) {
 *   // Can use direct fire
 * }
 */
export function hasDirectLoS(
  start: Position,
  end: Position,
  state: BattleState,
  excludeUnitIds: string[] = [],
): boolean {
  const obstacles = findObstaclesAlongLine(start, end, state, excludeUnitIds);
  return obstacles.length === 0;
}

/**
 * Calculates the Manhattan distance between two positions.
 * This is used for range checking in LoS calculations.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Manhattan distance (|dx| + |dy|)
 *
 * @example
 * const dist = manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
 * // Returns 7
 */
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Calculates the Euclidean distance between two positions.
 * This can be used for more precise range calculations.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Euclidean distance (sqrt(dx² + dy²))
 *
 * @example
 * const dist = euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
 * // Returns 5
 */
export function euclideanDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the Chebyshev distance between two positions.
 * This represents the minimum number of king moves in chess.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Chebyshev distance (max(|dx|, |dy|))
 *
 * @example
 * const dist = chebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
 * // Returns 4
 */
export function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
