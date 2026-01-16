/**
 * Bresenham Line Algorithm Tests
 *
 * Tests for the Bresenham line algorithm implementation used for
 * line-of-sight calculations in grid-based combat.
 *
 * @module core/mechanics/tier3/los/bresenham
 */

import {
  bresenhamLine,
  getLineOfSight,
  isBlocked,
  findObstaclesAlongLine,
  hasDirectLoS,
  manhattanDistance,
  euclideanDistance,
  chebyshevDistance,
} from './bresenham';
import { createTestUnit, createTestBattleState } from '../../test-fixtures';
import type { BattleUnit } from '../../../types';
import type { UnitWithLoS } from './los.types';
import { LOS_TRANSPARENT_TAG } from './los.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a test unit with LoS properties.
 */
function createLoSUnit(
  overrides: Partial<BattleUnit & UnitWithLoS> = {},
): BattleUnit & UnitWithLoS {
  const unit = createTestUnit({
    id: overrides.id ?? 'los-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    stats: {
      hp: 100,
      atk: 20,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 7,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 100,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  const result: BattleUnit & UnitWithLoS = {
    ...unit,
    facing: overrides.facing ?? 'S',
    tags: overrides.tags ?? [],
  };

  if (overrides.blocksLoS !== undefined) {
    result.blocksLoS = overrides.blocksLoS;
  }

  return result as BattleUnit & UnitWithLoS;
}

// ═══════════════════════════════════════════════════════════════
// BRESENHAM LINE ALGORITHM TESTS
// ═══════════════════════════════════════════════════════════════

describe('bresenhamLine', () => {
  describe('horizontal lines', () => {
    it('should calculate horizontal line left to right', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 4, y: 0 });

      expect(cells).toHaveLength(5);
      expect(cells.map(c => c.position)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ]);
    });

    it('should calculate horizontal line right to left', () => {
      const cells = bresenhamLine({ x: 4, y: 0 }, { x: 0, y: 0 });

      expect(cells).toHaveLength(5);
      expect(cells.map(c => c.position)).toEqual([
        { x: 4, y: 0 },
        { x: 3, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ]);
    });
  });

  describe('vertical lines', () => {
    it('should calculate vertical line top to bottom', () => {
      const cells = bresenhamLine({ x: 2, y: 1 }, { x: 2, y: 5 });

      expect(cells).toHaveLength(5);
      expect(cells.map(c => c.position)).toEqual([
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 },
      ]);
    });

    it('should calculate vertical line bottom to top', () => {
      const cells = bresenhamLine({ x: 2, y: 5 }, { x: 2, y: 1 });

      expect(cells).toHaveLength(5);
      expect(cells.map(c => c.position)).toEqual([
        { x: 2, y: 5 },
        { x: 2, y: 4 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ]);
    });
  });

  describe('diagonal lines', () => {
    it('should calculate 45-degree diagonal line', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 3, y: 3 });

      expect(cells).toHaveLength(4);
      expect(cells.map(c => c.position)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ]);
    });

    it('should calculate reverse diagonal line', () => {
      const cells = bresenhamLine({ x: 3, y: 3 }, { x: 0, y: 0 });

      expect(cells).toHaveLength(4);
      expect(cells.map(c => c.position)).toEqual([
        { x: 3, y: 3 },
        { x: 2, y: 2 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
      ]);
    });

    it('should calculate anti-diagonal line', () => {
      const cells = bresenhamLine({ x: 0, y: 3 }, { x: 3, y: 0 });

      expect(cells).toHaveLength(4);
      expect(cells.map(c => c.position)).toEqual([
        { x: 0, y: 3 },
        { x: 1, y: 2 },
        { x: 2, y: 1 },
        { x: 3, y: 0 },
      ]);
    });
  });

  describe('shallow angle lines', () => {
    it('should calculate shallow angle line (more horizontal)', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 4, y: 1 });

      expect(cells).toHaveLength(5);
      // Line should step in x more often than y
      expect(cells[0]?.position).toEqual({ x: 0, y: 0 });
      expect(cells[cells.length - 1]?.position).toEqual({ x: 4, y: 1 });
    });

    it('should calculate steep angle line (more vertical)', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 1, y: 4 });

      expect(cells).toHaveLength(5);
      // Line should step in y more often than x
      expect(cells[0]?.position).toEqual({ x: 0, y: 0 });
      expect(cells[cells.length - 1]?.position).toEqual({ x: 1, y: 4 });
    });
  });

  describe('edge cases', () => {
    it('should handle same start and end position', () => {
      const cells = bresenhamLine({ x: 3, y: 3 }, { x: 3, y: 3 });

      expect(cells).toHaveLength(1);
      expect(cells[0]?.position).toEqual({ x: 3, y: 3 });
      expect(cells[0]?.isEndpoint).toBe(true);
    });

    it('should handle single step horizontal', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 1, y: 0 });

      expect(cells).toHaveLength(2);
      expect(cells.map(c => c.position)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]);
    });

    it('should handle single step vertical', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 0, y: 1 });

      expect(cells).toHaveLength(2);
      expect(cells.map(c => c.position)).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ]);
    });

    it('should handle negative coordinates', () => {
      const cells = bresenhamLine({ x: -2, y: -2 }, { x: 2, y: 2 });

      expect(cells).toHaveLength(5);
      expect(cells[0]?.position).toEqual({ x: -2, y: -2 });
      expect(cells[cells.length - 1]?.position).toEqual({ x: 2, y: 2 });
    });
  });

  describe('endpoint marking', () => {
    it('should mark start and end as endpoints', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 3, y: 0 });

      expect(cells[0]?.isEndpoint).toBe(true);
      expect(cells[1]?.isEndpoint).toBe(false);
      expect(cells[2]?.isEndpoint).toBe(false);
      expect(cells[3]?.isEndpoint).toBe(true);
    });

    it('should mark single cell as endpoint', () => {
      const cells = bresenhamLine({ x: 5, y: 5 }, { x: 5, y: 5 });

      expect(cells[0]?.isEndpoint).toBe(true);
    });
  });

  describe('distance tracking', () => {
    it('should track distance from start correctly', () => {
      const cells = bresenhamLine({ x: 0, y: 0 }, { x: 4, y: 0 });

      expect(cells[0]?.distanceFromStart).toBe(0);
      expect(cells[1]?.distanceFromStart).toBe(1);
      expect(cells[2]?.distanceFromStart).toBe(2);
      expect(cells[3]?.distanceFromStart).toBe(3);
      expect(cells[4]?.distanceFromStart).toBe(4);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// GET LINE OF SIGHT TESTS
// ═══════════════════════════════════════════════════════════════

describe('getLineOfSight', () => {
  it('should return LoSLine with correct metadata', () => {
    const line = getLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 });

    expect(line.start).toEqual({ x: 0, y: 0 });
    expect(line.end).toEqual({ x: 4, y: 0 });
    expect(line.length).toBe(5);
    expect(line.cells).toHaveLength(5);
  });

  it('should include all cells from bresenhamLine', () => {
    const line = getLineOfSight({ x: 0, y: 0 }, { x: 3, y: 3 });

    expect(line.cells.map(c => c.position)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════
// IS BLOCKED TESTS
// ═══════════════════════════════════════════════════════════════

describe('isBlocked', () => {
  it('should return undefined when position is empty', () => {
    const state = createTestBattleState([]);
    const result = isBlocked({ x: 3, y: 3 }, state);

    expect(result).toBeUndefined();
  });

  it('should return obstacle when unit is at position', () => {
    const blocker = createLoSUnit({
      id: 'blocker',
      instanceId: 'blocker-inst',
      position: { x: 3, y: 3 },
      team: 'bot',
      blocksLoS: true,
    });
    const state = createTestBattleState([blocker]);

    const result = isBlocked({ x: 3, y: 3 }, state);

    expect(result).toBeDefined();
    expect(result?.type).toBe('unit');
    expect(result?.unitId).toBe('blocker-inst');
    expect(result?.blocksCompletely).toBe(true);
  });

  it('should exclude specified unit from blocking check', () => {
    const unit = createLoSUnit({
      id: 'self',
      instanceId: 'self',
      position: { x: 3, y: 3 },
      team: 'player',
      blocksLoS: true,
    });
    const state = createTestBattleState([unit]);

    const result = isBlocked({ x: 3, y: 3 }, state, 'self');
    expect(result).toBeUndefined();
  });

  it('should not block when unit is dead', () => {
    const deadUnit = createLoSUnit({
      id: 'dead',
      position: { x: 3, y: 3 },
      team: 'bot',
      currentHp: 0,
      alive: false,
      blocksLoS: true,
    });
    const state = createTestBattleState([deadUnit]);

    const result = isBlocked({ x: 3, y: 3 }, state);
    expect(result).toBeUndefined();
  });

  it('should not block when unit has blocksLoS = false', () => {
    const transparent = createLoSUnit({
      id: 'ghost',
      position: { x: 3, y: 3 },
      team: 'bot',
      blocksLoS: false,
    });
    const state = createTestBattleState([transparent]);

    const result = isBlocked({ x: 3, y: 3 }, state);
    expect(result).toBeUndefined();
  });

  it('should not block when unit has LOS_TRANSPARENT_TAG', () => {
    const transparent = createLoSUnit({
      id: 'spirit',
      position: { x: 3, y: 3 },
      team: 'bot',
      tags: [LOS_TRANSPARENT_TAG],
    });
    const state = createTestBattleState([transparent]);

    const result = isBlocked({ x: 3, y: 3 }, state);
    expect(result).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// FIND OBSTACLES ALONG LINE TESTS
// ═══════════════════════════════════════════════════════════════

describe('findObstaclesAlongLine', () => {
  it('should return empty array when path is clear', () => {
    const state = createTestBattleState([]);
    const obstacles = findObstaclesAlongLine(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      state,
    );

    expect(obstacles).toHaveLength(0);
  });

  it('should find obstacle in the middle of path', () => {
    const blocker = createLoSUnit({
      id: 'blocker',
      instanceId: 'blocker',
      position: { x: 2, y: 0 },
      team: 'bot',
      blocksLoS: true,
    });
    const state = createTestBattleState([blocker]);

    const obstacles = findObstaclesAlongLine(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      state,
    );

    expect(obstacles).toHaveLength(1);
    expect(obstacles[0]?.unitId).toBe('blocker');
  });

  it('should not include endpoints as obstacles', () => {
    const startUnit = createLoSUnit({
      id: 'start',
      instanceId: 'start',
      position: { x: 0, y: 0 },
      team: 'player',
      blocksLoS: true,
    });
    const endUnit = createLoSUnit({
      id: 'end',
      instanceId: 'end',
      position: { x: 4, y: 0 },
      team: 'bot',
      blocksLoS: true,
    });
    const state = createTestBattleState([startUnit, endUnit]);

    const obstacles = findObstaclesAlongLine(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      state,
      ['start', 'end'],
    );

    expect(obstacles).toHaveLength(0);
  });

  it('should find multiple obstacles', () => {
    const blocker1 = createLoSUnit({
      id: 'blocker1',
      instanceId: 'blocker1',
      position: { x: 1, y: 0 },
      team: 'bot',
      blocksLoS: true,
    });
    const blocker2 = createLoSUnit({
      id: 'blocker2',
      instanceId: 'blocker2',
      position: { x: 3, y: 0 },
      team: 'bot',
      blocksLoS: true,
    });
    const state = createTestBattleState([blocker1, blocker2]);

    const obstacles = findObstaclesAlongLine(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      state,
    );

    expect(obstacles).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// HAS DIRECT LOS TESTS
// ═══════════════════════════════════════════════════════════════

describe('hasDirectLoS', () => {
  it('should return true when path is clear', () => {
    const state = createTestBattleState([]);
    const result = hasDirectLoS({ x: 0, y: 0 }, { x: 4, y: 0 }, state);

    expect(result).toBe(true);
  });

  it('should return false when path is blocked', () => {
    const blocker = createLoSUnit({
      id: 'blocker',
      instanceId: 'blocker',
      position: { x: 2, y: 0 },
      team: 'bot',
      blocksLoS: true,
    });
    const state = createTestBattleState([blocker]);

    const result = hasDirectLoS({ x: 0, y: 0 }, { x: 4, y: 0 }, state);

    expect(result).toBe(false);
  });

  it('should return true when blocker is excluded', () => {
    const blocker = createLoSUnit({
      id: 'blocker',
      instanceId: 'blocker',
      position: { x: 2, y: 0 },
      team: 'bot',
      blocksLoS: true,
    });
    const state = createTestBattleState([blocker]);

    const result = hasDirectLoS(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      state,
      ['blocker'],
    );

    expect(result).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// DISTANCE CALCULATION TESTS
// ═══════════════════════════════════════════════════════════════

describe('manhattanDistance', () => {
  it('should calculate horizontal distance', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
  });

  it('should calculate vertical distance', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(5);
  });

  it('should calculate diagonal distance', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('should handle negative coordinates', () => {
    expect(manhattanDistance({ x: -2, y: -2 }, { x: 2, y: 2 })).toBe(8);
  });

  it('should return 0 for same position', () => {
    expect(manhattanDistance({ x: 3, y: 3 }, { x: 3, y: 3 })).toBe(0);
  });
});

describe('euclideanDistance', () => {
  it('should calculate horizontal distance', () => {
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
  });

  it('should calculate vertical distance', () => {
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(5);
  });

  it('should calculate 3-4-5 triangle', () => {
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('should return 0 for same position', () => {
    expect(euclideanDistance({ x: 3, y: 3 }, { x: 3, y: 3 })).toBe(0);
  });
});

describe('chebyshevDistance', () => {
  it('should calculate horizontal distance', () => {
    expect(chebyshevDistance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
  });

  it('should calculate vertical distance', () => {
    expect(chebyshevDistance({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(5);
  });

  it('should calculate diagonal distance (max of dx, dy)', () => {
    expect(chebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
  });

  it('should return 0 for same position', () => {
    expect(chebyshevDistance({ x: 3, y: 3 }, { x: 3, y: 3 })).toBe(0);
  });
});
