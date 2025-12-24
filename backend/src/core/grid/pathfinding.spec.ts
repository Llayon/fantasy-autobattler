/**
 * Unit tests for A* pathfinding algorithm.
 * Tests path finding, obstacle avoidance, and edge cases.
 * Uses mock GridConfig instead of game-specific constants.
 *
 * @module core/grid/pathfinding.spec
 */

import { findPath, findPathWithMaxLength, findClosestReachablePosition, hasPath } from './pathfinding';
import { createEmptyGrid, DEFAULT_GRID_CONFIG, GridUnit } from './grid';
import type { GridConfig } from '../types/config.types';

describe('Pathfinding System (Core)', () => {
  // Use default config for most tests (8×10 grid)
  const config = DEFAULT_GRID_CONFIG;

  // Helper function to create a mock unit
  const createMockUnit = (id: string, x: number, y: number): GridUnit => ({
    instanceId: id,
    position: { x, y },
    alive: true,
  });

  describe('findPath', () => {
    it('should find direct path on empty grid', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const path = findPath({ x: 0, y: 0 }, { x: 2, y: 2 }, grid, units, undefined, config);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });

      // Path should be optimal (Manhattan distance = 4)
      expect(path.length).toBe(5); // Including start position
    });

    it('should return path with just start position when start equals goal', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const path = findPath({ x: 1, y: 1 }, { x: 1, y: 1 }, grid, units, undefined, config);

      expect(path).toEqual([{ x: 1, y: 1 }]);
    });

    it('should avoid obstacles (other units)', () => {
      const grid = createEmptyGrid(config);
      const obstacle = createMockUnit('obstacle', 1, 0);
      const units = [obstacle];

      const path = findPath({ x: 0, y: 0 }, { x: 2, y: 0 }, grid, units, undefined, config);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 2, y: 0 });

      // Path should not go through obstacle at (1,0)
      expect(path).not.toContainEqual({ x: 1, y: 0 });
    });

    it('should exclude moving unit from collision detection', () => {
      const grid = createEmptyGrid(config);
      const movingUnit = createMockUnit('moving', 0, 0);
      const obstacle = createMockUnit('obstacle', 1, 0);
      const units = [movingUnit, obstacle];

      const path = findPath({ x: 0, y: 0 }, { x: 2, y: 0 }, grid, units, movingUnit, config);

      expect(path.length).toBeGreaterThan(0);
      // Should still avoid the obstacle but not itself
      expect(path).not.toContainEqual({ x: 1, y: 0 });
    });

    it('should return empty array when no path exists', () => {
      const grid = createEmptyGrid(config);

      // Create a wall of units blocking the path
      const units = [
        createMockUnit('wall1', 1, 0),
        createMockUnit('wall2', 1, 1),
        createMockUnit('wall3', 1, 2),
        createMockUnit('wall4', 1, 3),
        createMockUnit('wall5', 1, 4),
        createMockUnit('wall6', 1, 5),
        createMockUnit('wall7', 1, 6),
        createMockUnit('wall8', 1, 7),
        createMockUnit('wall9', 1, 8),
        createMockUnit('wall10', 1, 9),
      ];

      const path = findPath({ x: 0, y: 5 }, { x: 2, y: 5 }, grid, units, undefined, config);

      expect(path).toEqual([]);
    });

    it('should handle invalid positions', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      // Invalid start position
      let path = findPath({ x: -1, y: 0 }, { x: 2, y: 2 }, grid, units, undefined, config);
      expect(path).toEqual([]);

      // Invalid goal position
      path = findPath({ x: 0, y: 0 }, { x: 10, y: 10 }, grid, units, undefined, config);
      expect(path).toEqual([]);
    });

    it('should find path around complex obstacles', () => {
      const grid = createEmptyGrid(config);

      // Create L-shaped obstacle
      const units = [
        createMockUnit('obs1', 2, 1),
        createMockUnit('obs2', 2, 2),
        createMockUnit('obs3', 2, 3),
        createMockUnit('obs4', 3, 3),
        createMockUnit('obs5', 4, 3),
      ];

      const path = findPath({ x: 1, y: 2 }, { x: 5, y: 2 }, grid, units, undefined, config);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 1, y: 2 });
      expect(path[path.length - 1]).toEqual({ x: 5, y: 2 });

      // Should navigate around the L-shaped obstacle
      for (const unit of units) {
        expect(path).not.toContainEqual(unit.position);
      }
    });

    it('should work with custom grid config', () => {
      const smallConfig: GridConfig = {
        width: 4,
        height: 4,
        playerRows: [0],
        enemyRows: [3],
      };
      const grid = createEmptyGrid(smallConfig);
      const units: GridUnit[] = [];

      const path = findPath({ x: 0, y: 0 }, { x: 3, y: 3 }, grid, units, undefined, smallConfig);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 3, y: 3 });
      expect(path.length).toBe(7); // Manhattan distance = 6, plus start
    });
  });

  describe('findPathWithMaxLength', () => {
    it('should return path when within length limit', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const path = findPathWithMaxLength(
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        5, // Max length
        grid,
        units,
        undefined,
        config
      );

      expect(path.length).toBeGreaterThan(0);
      expect(path.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when path exceeds length limit', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const path = findPathWithMaxLength(
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        5, // Too short for this distance
        grid,
        units,
        undefined,
        config
      );

      expect(path).toEqual([]);
    });
  });

  describe('findClosestReachablePosition', () => {
    it('should return target when directly reachable', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const closest = findClosestReachablePosition(
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        5,
        grid,
        units,
        undefined,
        config
      );

      expect(closest).toEqual({ x: 2, y: 2 });
    });

    it('should return closest reachable position when target is blocked', () => {
      const grid = createEmptyGrid(config);
      const blockedTarget = createMockUnit('blocked', 2, 2);
      const units = [blockedTarget];

      const closest = findClosestReachablePosition(
        { x: 0, y: 0 },
        { x: 2, y: 2 }, // This position is blocked
        5,
        grid,
        units,
        undefined,
        config
      );

      // Should find a position adjacent to the blocked target
      expect(closest).not.toEqual({ x: 0, y: 0 }); // Should move closer
      expect(closest).not.toEqual({ x: 2, y: 2 }); // Should not be the blocked position

      // Should be within range of the target
      const distance = Math.abs(closest.x - 2) + Math.abs(closest.y - 2);
      expect(distance).toBeLessThanOrEqual(2);
    });

    it('should return start position when no reachable positions found', () => {
      const grid = createEmptyGrid(config);

      // Surround the start position
      const units = [
        createMockUnit('surround1', 1, 0),
        createMockUnit('surround2', 0, 1),
        createMockUnit('surround3', 1, 1),
      ];

      const closest = findClosestReachablePosition(
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        2, // Limited range
        grid,
        units,
        undefined,
        config
      );

      expect(closest).toEqual({ x: 0, y: 0 });
    });
  });

  describe('hasPath', () => {
    it('should return true when path exists', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const exists = hasPath({ x: 0, y: 0 }, { x: 3, y: 3 }, grid, units, undefined, config);

      expect(exists).toBe(true);
    });

    it('should return false when no path exists', () => {
      const grid = createEmptyGrid(config);

      // Create impassable barrier
      const units = Array.from({ length: 10 }, (_, i) => createMockUnit(`barrier${i}`, 2, i));

      const exists = hasPath({ x: 0, y: 5 }, { x: 4, y: 5 }, grid, units, undefined, config);

      expect(exists).toBe(false);
    });

    it('should return false for invalid positions', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      const exists = hasPath({ x: 0, y: 0 }, { x: -1, y: -1 }, grid, units, undefined, config);

      expect(exists).toBe(false);
    });
  });

  describe('edge cases and performance', () => {
    it('should handle grid boundaries correctly', () => {
      const grid = createEmptyGrid(config);
      const units: GridUnit[] = [];

      // Path along grid boundary
      const path = findPath(
        { x: 0, y: 0 },
        { x: 7, y: 9 }, // Bottom-right corner
        grid,
        units,
        undefined,
        config
      );

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 7, y: 9 });
    });

    it('should be deterministic (same input produces same output)', () => {
      const grid = createEmptyGrid(config);
      const obstacle = createMockUnit('obstacle', 2, 2);
      const units = [obstacle];

      const path1 = findPath({ x: 0, y: 0 }, { x: 4, y: 4 }, grid, units, undefined, config);

      const path2 = findPath({ x: 0, y: 0 }, { x: 4, y: 4 }, grid, units, undefined, config);

      expect(path1).toEqual(path2);
    });

    it('should handle dead units correctly', () => {
      const grid = createEmptyGrid(config);
      const deadUnit = createMockUnit('dead', 1, 1);
      deadUnit.alive = false; // Dead units should not block
      const units = [deadUnit];

      const path = findPath({ x: 0, y: 0 }, { x: 2, y: 2 }, grid, units, undefined, config);

      expect(path.length).toBeGreaterThan(0);
      // Path can go through dead unit's position
      expect(path).toContainEqual({ x: 1, y: 1 });
    });
  });
});
