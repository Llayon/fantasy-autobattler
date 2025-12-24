/**
 * Unit tests for core grid system functions.
 * Tests pure functions, edge cases, and mathematical correctness.
 * Uses mock GridConfig instead of game-specific constants.
 *
 * @module core/grid/grid.spec
 */

import {
  DEFAULT_GRID_CONFIG,
  createEmptyGrid,
  createGridWithUnits,
  isValidPosition,
  isWalkable,
  getNeighbors,
  manhattanDistance,
  isPlayerDeploymentZone,
  isEnemyDeploymentZone,
  positionToKey,
  keyToPosition,
  positionsEqual,
  GridUnit,
} from './grid';
import type { GridConfig } from '../types/config.types';

describe('Grid System (Core)', () => {
  // Use default config for most tests (8×10 grid)
  const config = DEFAULT_GRID_CONFIG;

  describe('createEmptyGrid', () => {
    it('should create grid with correct dimensions from config', () => {
      const grid = createEmptyGrid(config);

      expect(grid.length).toBe(config.height); // 10 rows
      expect(grid[0]?.length).toBe(config.width); // 8 columns

      // Check all cells are empty
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          const row = grid[y];
          expect(row).toBeDefined();
          const cell = row?.[x];
          expect(cell).toBeDefined();
          expect(cell?.type).toBe('empty');
          expect(cell?.position).toEqual({ x, y });
          expect(cell?.unitId).toBeUndefined();
        }
      }
    });

    it('should create custom-sized grid', () => {
      const customConfig: GridConfig = {
        width: 4,
        height: 4,
        playerRows: [0],
        enemyRows: [3],
      };

      const grid = createEmptyGrid(customConfig);

      expect(grid.length).toBe(4);
      expect(grid[0]?.length).toBe(4);
    });

    it('should be a pure function (no side effects)', () => {
      const grid1 = createEmptyGrid(config);
      const grid2 = createEmptyGrid(config);

      // Grids should be separate instances
      expect(grid1).not.toBe(grid2);

      // Modifying one shouldn't affect the other
      const cell1 = grid1[0]?.[0];
      const cell2 = grid2[0]?.[0];
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      if (cell1) cell1.type = 'occupied';
      expect(cell2?.type).toBe('empty');
    });
  });

  describe('isValidPosition', () => {
    it('should validate positions within grid bounds', () => {
      // Valid positions
      expect(isValidPosition({ x: 0, y: 0 }, config)).toBe(true);
      expect(isValidPosition({ x: 7, y: 9 }, config)).toBe(true);
      expect(isValidPosition({ x: 3, y: 5 }, config)).toBe(true);
    });

    it('should reject positions outside grid bounds', () => {
      // Out of bounds
      expect(isValidPosition({ x: -1, y: 0 }, config)).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 }, config)).toBe(false);
      expect(isValidPosition({ x: 8, y: 0 }, config)).toBe(false);
      expect(isValidPosition({ x: 0, y: 10 }, config)).toBe(false);
      expect(isValidPosition({ x: 8, y: 10 }, config)).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      // Boundary positions
      expect(isValidPosition({ x: 0, y: 0 }, config)).toBe(true); // top-left
      expect(isValidPosition({ x: 7, y: 0 }, config)).toBe(true); // top-right
      expect(isValidPosition({ x: 0, y: 9 }, config)).toBe(true); // bottom-left
      expect(isValidPosition({ x: 7, y: 9 }, config)).toBe(true); // bottom-right

      // Just outside boundaries
      expect(isValidPosition({ x: -1, y: -1 }, config)).toBe(false);
      expect(isValidPosition({ x: 8, y: 10 }, config)).toBe(false);
    });

    it('should work with custom grid config', () => {
      const smallConfig: GridConfig = {
        width: 4,
        height: 4,
        playerRows: [0],
        enemyRows: [3],
      };

      expect(isValidPosition({ x: 3, y: 3 }, smallConfig)).toBe(true);
      expect(isValidPosition({ x: 4, y: 3 }, smallConfig)).toBe(false);
      expect(isValidPosition({ x: 3, y: 4 }, smallConfig)).toBe(false);
    });
  });

  describe('getNeighbors', () => {
    it('should return 4 neighbors for center positions', () => {
      const neighbors = getNeighbors({ x: 3, y: 5 }, config);

      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual({ x: 3, y: 4 }); // up
      expect(neighbors).toContainEqual({ x: 3, y: 6 }); // down
      expect(neighbors).toContainEqual({ x: 2, y: 5 }); // left
      expect(neighbors).toContainEqual({ x: 4, y: 5 }); // right
    });

    it('should return 2 neighbors for corner positions', () => {
      // Top-left corner
      const topLeft = getNeighbors({ x: 0, y: 0 }, config);
      expect(topLeft).toHaveLength(2);
      expect(topLeft).toContainEqual({ x: 0, y: 1 }); // down
      expect(topLeft).toContainEqual({ x: 1, y: 0 }); // right

      // Bottom-right corner
      const bottomRight = getNeighbors({ x: 7, y: 9 }, config);
      expect(bottomRight).toHaveLength(2);
      expect(bottomRight).toContainEqual({ x: 7, y: 8 }); // up
      expect(bottomRight).toContainEqual({ x: 6, y: 9 }); // left
    });

    it('should return 3 neighbors for edge positions', () => {
      // Top edge
      const topEdge = getNeighbors({ x: 3, y: 0 }, config);
      expect(topEdge).toHaveLength(3);
      expect(topEdge).toContainEqual({ x: 3, y: 1 }); // down
      expect(topEdge).toContainEqual({ x: 2, y: 0 }); // left
      expect(topEdge).toContainEqual({ x: 4, y: 0 }); // right

      // Left edge
      const leftEdge = getNeighbors({ x: 0, y: 5 }, config);
      expect(leftEdge).toHaveLength(3);
      expect(leftEdge).toContainEqual({ x: 0, y: 4 }); // up
      expect(leftEdge).toContainEqual({ x: 0, y: 6 }); // down
      expect(leftEdge).toContainEqual({ x: 1, y: 5 }); // right
    });

    it('should only return valid positions', () => {
      const neighbors = getNeighbors({ x: 0, y: 0 }, config);

      for (const neighbor of neighbors) {
        expect(isValidPosition(neighbor, config)).toBe(true);
      }
    });
  });

  describe('manhattanDistance', () => {
    it('should calculate distance correctly', () => {
      // Same position
      expect(manhattanDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);

      // Horizontal distance
      expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);

      // Vertical distance
      expect(manhattanDistance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);

      // Diagonal distance (3,4,5 triangle)
      expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);

      // Negative coordinates (should work with absolute values)
      expect(manhattanDistance({ x: 5, y: 5 }, { x: 2, y: 1 })).toBe(7);
    });

    it('should be symmetric', () => {
      const pos1 = { x: 1, y: 2 };
      const pos2 = { x: 4, y: 6 };

      expect(manhattanDistance(pos1, pos2)).toBe(manhattanDistance(pos2, pos1));
    });

    it('should handle edge cases', () => {
      // Maximum distance on 8x10 grid
      const maxDist = manhattanDistance({ x: 0, y: 0 }, { x: 7, y: 9 });
      expect(maxDist).toBe(16); // 7 + 9

      // Adjacent positions
      expect(manhattanDistance({ x: 2, y: 3 }, { x: 2, y: 4 })).toBe(1);
      expect(manhattanDistance({ x: 2, y: 3 }, { x: 3, y: 3 })).toBe(1);
    });
  });

  describe('isWalkable', () => {
    it('should return true for empty cells', () => {
      const grid = createEmptyGrid(config);

      expect(isWalkable({ x: 0, y: 0 }, grid, config)).toBe(true);
      expect(isWalkable({ x: 3, y: 5 }, grid, config)).toBe(true);
      expect(isWalkable({ x: 7, y: 9 }, grid, config)).toBe(true);
    });

    it('should return false for occupied cells', () => {
      const mockUnit: GridUnit = {
        instanceId: 'unit1',
        position: { x: 2, y: 3 },
        alive: true,
      };

      const grid = createGridWithUnits([mockUnit], config);

      expect(isWalkable({ x: 2, y: 3 }, grid, config)).toBe(false);
      expect(isWalkable({ x: 0, y: 0 }, grid, config)).toBe(true); // Still empty
    });

    it('should return false for invalid positions', () => {
      const grid = createEmptyGrid(config);

      expect(isWalkable({ x: -1, y: 0 }, grid, config)).toBe(false);
      expect(isWalkable({ x: 8, y: 0 }, grid, config)).toBe(false);
      expect(isWalkable({ x: 0, y: 10 }, grid, config)).toBe(false);
    });
  });

  describe('deployment zones', () => {
    it('should correctly identify player deployment zone', () => {
      // Player rows (0-1)
      expect(isPlayerDeploymentZone({ x: 0, y: 0 }, config)).toBe(true);
      expect(isPlayerDeploymentZone({ x: 7, y: 1 }, config)).toBe(true);

      // Non-player rows
      expect(isPlayerDeploymentZone({ x: 0, y: 2 }, config)).toBe(false);
      expect(isPlayerDeploymentZone({ x: 0, y: 8 }, config)).toBe(false);
    });

    it('should correctly identify enemy deployment zone', () => {
      // Enemy rows (8-9)
      expect(isEnemyDeploymentZone({ x: 0, y: 8 }, config)).toBe(true);
      expect(isEnemyDeploymentZone({ x: 7, y: 9 }, config)).toBe(true);

      // Non-enemy rows
      expect(isEnemyDeploymentZone({ x: 0, y: 7 }, config)).toBe(false);
      expect(isEnemyDeploymentZone({ x: 0, y: 0 }, config)).toBe(false);
    });

    it('should work with custom deployment zones', () => {
      const customConfig: GridConfig = {
        width: 8,
        height: 8,
        playerRows: [0, 1, 2],
        enemyRows: [5, 6, 7],
      };

      expect(isPlayerDeploymentZone({ x: 0, y: 2 }, customConfig)).toBe(true);
      expect(isPlayerDeploymentZone({ x: 0, y: 3 }, customConfig)).toBe(false);
      expect(isEnemyDeploymentZone({ x: 0, y: 5 }, customConfig)).toBe(true);
      expect(isEnemyDeploymentZone({ x: 0, y: 4 }, customConfig)).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should convert positions to keys and back', () => {
      const pos = { x: 3, y: 7 };
      const key = positionToKey(pos);
      const convertedBack = keyToPosition(key);

      expect(key).toBe('3,7');
      expect(convertedBack).toEqual(pos);
    });

    it('should handle edge case positions in key conversion', () => {
      const positions = [
        { x: 0, y: 0 },
        { x: 7, y: 9 },
        { x: 10, y: 15 }, // Even outside grid bounds
      ];

      for (const pos of positions) {
        const key = positionToKey(pos);
        const converted = keyToPosition(key);
        expect(converted).toEqual(pos);
      }
    });

    it('should correctly compare positions', () => {
      expect(positionsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
      expect(positionsEqual({ x: 1, y: 2 }, { x: 1, y: 3 })).toBe(false);
      expect(positionsEqual({ x: 1, y: 2 }, { x: 2, y: 2 })).toBe(false);
    });

    it('should throw error for invalid position keys', () => {
      expect(() => keyToPosition('invalid')).toThrow('Invalid position key: invalid');
      expect(() => keyToPosition('1')).toThrow('Invalid position key: 1');
      expect(() => keyToPosition('')).toThrow('Invalid position key: ');
    });
  });
});
