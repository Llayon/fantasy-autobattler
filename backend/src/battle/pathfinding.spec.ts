/**
 * Unit tests for A* pathfinding algorithm.
 * Tests path finding, obstacle avoidance, and edge cases.
 */

import {
  findPath,
  findPathWithMaxLength,
  findClosestReachablePosition,
  hasPath,
} from './pathfinding';
import { createEmptyGrid } from './grid';
import { BattleUnit } from '../types/game.types';

describe('Pathfinding System', () => {
  // Helper function to create a mock unit
  const createMockUnit = (id: string, x: number, y: number): BattleUnit => ({
    id,
    name: `Unit ${id}`,
    role: 'tank',
    cost: 5,
    stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 5, dodge: 0 },
    range: 1,
    abilities: [],
    position: { x, y },
    currentHp: 100,
    maxHp: 100,
    team: 'player',
    alive: true,
    instanceId: id,
  });

  describe('findPath', () => {
    it('should find direct path on empty grid', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const path = findPath(
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        grid,
        units
      );
      
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
      
      // Path should be optimal (Manhattan distance = 4)
      expect(path.length).toBe(5); // Including start position
    });

    it('should return path with just start position when start equals goal', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const path = findPath(
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        grid,
        units
      );
      
      expect(path).toEqual([{ x: 1, y: 1 }]);
    });

    it('should avoid obstacles (other units)', () => {
      const grid = createEmptyGrid();
      const obstacle = createMockUnit('obstacle', 1, 0);
      const units = [obstacle];
      
      const path = findPath(
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        grid,
        units
      );
      
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 2, y: 0 });
      
      // Path should not go through obstacle at (1,0)
      expect(path).not.toContainEqual({ x: 1, y: 0 });
    });

    it('should exclude moving unit from collision detection', () => {
      const grid = createEmptyGrid();
      const movingUnit = createMockUnit('moving', 0, 0);
      const obstacle = createMockUnit('obstacle', 1, 0);
      const units = [movingUnit, obstacle];
      
      const path = findPath(
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        grid,
        units,
        movingUnit
      );
      
      expect(path.length).toBeGreaterThan(0);
      // Should still avoid the obstacle but not itself
      expect(path).not.toContainEqual({ x: 1, y: 0 });
    });

    it('should return empty array when no path exists', () => {
      const grid = createEmptyGrid();
      
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
      
      const path = findPath(
        { x: 0, y: 5 },
        { x: 2, y: 5 },
        grid,
        units
      );
      
      expect(path).toEqual([]);
    });

    it('should handle invalid positions', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      // Invalid start position
      let path = findPath(
        { x: -1, y: 0 },
        { x: 2, y: 2 },
        grid,
        units
      );
      expect(path).toEqual([]);
      
      // Invalid goal position
      path = findPath(
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        grid,
        units
      );
      expect(path).toEqual([]);
    });

    it('should find path around complex obstacles', () => {
      const grid = createEmptyGrid();
      
      // Create L-shaped obstacle
      const units = [
        createMockUnit('obs1', 2, 1),
        createMockUnit('obs2', 2, 2),
        createMockUnit('obs3', 2, 3),
        createMockUnit('obs4', 3, 3),
        createMockUnit('obs5', 4, 3),
      ];
      
      const path = findPath(
        { x: 1, y: 2 },
        { x: 5, y: 2 },
        grid,
        units
      );
      
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 1, y: 2 });
      expect(path[path.length - 1]).toEqual({ x: 5, y: 2 });
      
      // Should navigate around the L-shaped obstacle
      for (const unit of units) {
        expect(path).not.toContainEqual(unit.position);
      }
    });
  });

  describe('findPathWithMaxLength', () => {
    it('should return path when within length limit', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const path = findPathWithMaxLength(
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        5, // Max length
        grid,
        units
      );
      
      expect(path.length).toBeGreaterThan(0);
      expect(path.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when path exceeds length limit', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const path = findPathWithMaxLength(
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        5, // Too short for this distance
        grid,
        units
      );
      
      expect(path).toEqual([]);
    });
  });

  describe('findClosestReachablePosition', () => {
    it('should return target when directly reachable', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const closest = findClosestReachablePosition(
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        5,
        grid,
        units
      );
      
      expect(closest).toEqual({ x: 2, y: 2 });
    });

    it('should return closest reachable position when target is blocked', () => {
      const grid = createEmptyGrid();
      const blockedTarget = createMockUnit('blocked', 2, 2);
      const units = [blockedTarget];
      
      const closest = findClosestReachablePosition(
        { x: 0, y: 0 },
        { x: 2, y: 2 }, // This position is blocked
        5,
        grid,
        units
      );
      
      // Should find a position adjacent to the blocked target
      expect(closest).not.toEqual({ x: 0, y: 0 }); // Should move closer
      expect(closest).not.toEqual({ x: 2, y: 2 }); // Should not be the blocked position
      
      // Should be within range of the target
      const distance = Math.abs(closest.x - 2) + Math.abs(closest.y - 2);
      expect(distance).toBeLessThanOrEqual(2);
    });

    it('should return start position when no reachable positions found', () => {
      const grid = createEmptyGrid();
      
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
        units
      );
      
      expect(closest).toEqual({ x: 0, y: 0 });
    });
  });

  describe('hasPath', () => {
    it('should return true when path exists', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const exists = hasPath(
        { x: 0, y: 0 },
        { x: 3, y: 3 },
        grid,
        units
      );
      
      expect(exists).toBe(true);
    });

    it('should return false when no path exists', () => {
      const grid = createEmptyGrid();
      
      // Create impassable barrier
      const units = Array.from({ length: 10 }, (_, i) => 
        createMockUnit(`barrier${i}`, 2, i)
      );
      
      const exists = hasPath(
        { x: 0, y: 5 },
        { x: 4, y: 5 },
        grid,
        units
      );
      
      expect(exists).toBe(false);
    });

    it('should return false for invalid positions', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      const exists = hasPath(
        { x: 0, y: 0 },
        { x: -1, y: -1 },
        grid,
        units
      );
      
      expect(exists).toBe(false);
    });
  });

  describe('edge cases and performance', () => {
    it('should handle grid boundaries correctly', () => {
      const grid = createEmptyGrid();
      const units: BattleUnit[] = [];
      
      // Path along grid boundary
      const path = findPath(
        { x: 0, y: 0 },
        { x: 7, y: 9 }, // Bottom-right corner
        grid,
        units
      );
      
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 7, y: 9 });
    });

    it('should be deterministic (same input produces same output)', () => {
      const grid = createEmptyGrid();
      const obstacle = createMockUnit('obstacle', 2, 2);
      const units = [obstacle];
      
      const path1 = findPath(
        { x: 0, y: 0 },
        { x: 4, y: 4 },
        grid,
        units
      );
      
      const path2 = findPath(
        { x: 0, y: 0 },
        { x: 4, y: 4 },
        grid,
        units
      );
      
      expect(path1).toEqual(path2);
    });

    it('should handle dead units correctly', () => {
      const grid = createEmptyGrid();
      const deadUnit = createMockUnit('dead', 1, 1);
      deadUnit.alive = false; // Dead units should not block
      const units = [deadUnit];
      
      const path = findPath(
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        grid,
        units
      );
      
      expect(path.length).toBeGreaterThan(0);
      // Path can go through dead unit's position
      expect(path).toContainEqual({ x: 1, y: 1 });
    });
  });
});