/**
 * Unit tests for grid system functions.
 * Tests pure functions, edge cases, and mathematical correctness.
 */

import {
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
} from './grid';
import { BattleUnit } from '../types/game.types';
import { GRID_DIMENSIONS } from '../config/game.constants';

describe('Grid System', () => {
  describe('createEmptyGrid', () => {
    it('should create 8x10 grid with correct dimensions', () => {
      const grid = createEmptyGrid();
      
      expect(grid.length).toBe(GRID_DIMENSIONS.HEIGHT); // 10 rows
      expect(grid[0]?.length).toBe(GRID_DIMENSIONS.WIDTH); // 8 columns
      
      // Check all cells are empty
      for (let y = 0; y < GRID_DIMENSIONS.HEIGHT; y++) {
        for (let x = 0; x < GRID_DIMENSIONS.WIDTH; x++) {
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

    it('should be a pure function (no side effects)', () => {
      const grid1 = createEmptyGrid();
      const grid2 = createEmptyGrid();
      
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
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 7, y: 9 })).toBe(true);
      expect(isValidPosition({ x: 3, y: 5 })).toBe(true);
    });

    it('should reject positions outside grid bounds', () => {
      // Out of bounds
      expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 })).toBe(false);
      expect(isValidPosition({ x: 8, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: 10 })).toBe(false);
      expect(isValidPosition({ x: 8, y: 10 })).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      // Boundary positions
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true); // top-left
      expect(isValidPosition({ x: 7, y: 0 })).toBe(true); // top-right
      expect(isValidPosition({ x: 0, y: 9 })).toBe(true); // bottom-left
      expect(isValidPosition({ x: 7, y: 9 })).toBe(true); // bottom-right
      
      // Just outside boundaries
      expect(isValidPosition({ x: -1, y: -1 })).toBe(false);
      expect(isValidPosition({ x: 8, y: 10 })).toBe(false);
    });
  });

  describe('getNeighbors', () => {
    it('should return 4 neighbors for center positions', () => {
      const neighbors = getNeighbors({ x: 3, y: 5 });
      
      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual({ x: 3, y: 4 }); // up
      expect(neighbors).toContainEqual({ x: 3, y: 6 }); // down
      expect(neighbors).toContainEqual({ x: 2, y: 5 }); // left
      expect(neighbors).toContainEqual({ x: 4, y: 5 }); // right
    });

    it('should return 2 neighbors for corner positions', () => {
      // Top-left corner
      const topLeft = getNeighbors({ x: 0, y: 0 });
      expect(topLeft).toHaveLength(2);
      expect(topLeft).toContainEqual({ x: 0, y: 1 }); // down
      expect(topLeft).toContainEqual({ x: 1, y: 0 }); // right
      
      // Bottom-right corner
      const bottomRight = getNeighbors({ x: 7, y: 9 });
      expect(bottomRight).toHaveLength(2);
      expect(bottomRight).toContainEqual({ x: 7, y: 8 }); // up
      expect(bottomRight).toContainEqual({ x: 6, y: 9 }); // left
    });

    it('should return 3 neighbors for edge positions', () => {
      // Top edge
      const topEdge = getNeighbors({ x: 3, y: 0 });
      expect(topEdge).toHaveLength(3);
      expect(topEdge).toContainEqual({ x: 3, y: 1 }); // down
      expect(topEdge).toContainEqual({ x: 2, y: 0 }); // left
      expect(topEdge).toContainEqual({ x: 4, y: 0 }); // right
      
      // Left edge
      const leftEdge = getNeighbors({ x: 0, y: 5 });
      expect(leftEdge).toHaveLength(3);
      expect(leftEdge).toContainEqual({ x: 0, y: 4 }); // up
      expect(leftEdge).toContainEqual({ x: 0, y: 6 }); // down
      expect(leftEdge).toContainEqual({ x: 1, y: 5 }); // right
    });

    it('should only return valid positions', () => {
      const neighbors = getNeighbors({ x: 0, y: 0 });
      
      for (const neighbor of neighbors) {
        expect(isValidPosition(neighbor)).toBe(true);
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
      const grid = createEmptyGrid();
      
      expect(isWalkable({ x: 0, y: 0 }, grid)).toBe(true);
      expect(isWalkable({ x: 3, y: 5 }, grid)).toBe(true);
      expect(isWalkable({ x: 7, y: 9 }, grid)).toBe(true);
    });

    it('should return false for occupied cells', () => {
      const mockUnit: BattleUnit = {
        id: 'test',
        name: 'Test Unit',
        role: 'tank',
        cost: 5,
        stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 5, dodge: 0 },
        range: 1,
        abilities: [],
        position: { x: 2, y: 3 },
        currentHp: 100,
        maxHp: 100,
        team: 'player',
        alive: true,
        instanceId: 'unit1',
      };

      const grid = createGridWithUnits([mockUnit]);
      
      expect(isWalkable({ x: 2, y: 3 }, grid)).toBe(false);
      expect(isWalkable({ x: 0, y: 0 }, grid)).toBe(true); // Still empty
    });

    it('should return false for invalid positions', () => {
      const grid = createEmptyGrid();
      
      expect(isWalkable({ x: -1, y: 0 }, grid)).toBe(false);
      expect(isWalkable({ x: 8, y: 0 }, grid)).toBe(false);
      expect(isWalkable({ x: 0, y: 10 }, grid)).toBe(false);
    });
  });

  describe('deployment zones', () => {
    it('should correctly identify player deployment zone', () => {
      // Player rows (0-1)
      expect(isPlayerDeploymentZone({ x: 0, y: 0 })).toBe(true);
      expect(isPlayerDeploymentZone({ x: 7, y: 1 })).toBe(true);
      
      // Non-player rows
      expect(isPlayerDeploymentZone({ x: 0, y: 2 })).toBe(false);
      expect(isPlayerDeploymentZone({ x: 0, y: 8 })).toBe(false);
    });

    it('should correctly identify enemy deployment zone', () => {
      // Enemy rows (8-9)
      expect(isEnemyDeploymentZone({ x: 0, y: 8 })).toBe(true);
      expect(isEnemyDeploymentZone({ x: 7, y: 9 })).toBe(true);
      
      // Non-enemy rows
      expect(isEnemyDeploymentZone({ x: 0, y: 7 })).toBe(false);
      expect(isEnemyDeploymentZone({ x: 0, y: 0 })).toBe(false);
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