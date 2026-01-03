/**
 * Tier 3: Line of Sight (LoS) Processor Tests
 *
 * Tests for the Line of Sight system which controls ranged attack
 * validation. Validates direct fire blocking, Bresenham line algorithm,
 * firing arc checks, and LoS validation.
 *
 * @module core/mechanics/tier3/los
 */

import { createLoSProcessor } from './los.processor';
import { createTestUnit, createTestBattleState } from '../../test-fixtures';
import type { LoSConfig } from '../../config/mechanics.types';
import type { BattleUnit, Position } from '../../../types';
import type { UnitWithLoS } from './los.types';
import {
  LOS_TRANSPARENT_TAG,
  ENHANCED_LOS_TAG,
} from './los.types';

// ═══════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: LoSConfig = {
  directFire: true,
  arcFire: true,
  arcFirePenalty: 0.2,
};

const DIRECT_FIRE_ONLY_CONFIG: LoSConfig = {
  directFire: true,
  arcFire: false,
  arcFirePenalty: 0.2,
};

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
    range: overrides.range ?? 5,
    ...overrides,
  });

  // Only set blocksLoS if explicitly provided, otherwise let the processor determine from tags
  const result: BattleUnit & UnitWithLoS = {
    ...unit,
    facing: overrides.facing ?? 'S',
    firingArc: overrides.firingArc ?? 90,
    canArcFire: overrides.canArcFire ?? false,
    hasTrueSight: overrides.hasTrueSight ?? false,
    tags: overrides.tags ?? [],
    range: overrides.range ?? unit.range ?? 5,
  };

  // Only set blocksLoS if explicitly provided
  if (overrides.blocksLoS !== undefined) {
    result.blocksLoS = overrides.blocksLoS;
  }

  return result as BattleUnit & UnitWithLoS;
}

/**
 * Creates a ranged unit (archer-like) for testing.
 */
function createRangedUnit(
  overrides: Partial<BattleUnit & UnitWithLoS> = {},
): BattleUnit & UnitWithLoS {
  return createLoSUnit({
    id: overrides.id ?? 'ranged-unit',
    range: overrides.range ?? 6,
    facing: overrides.facing ?? 'S',
    firingArc: overrides.firingArc ?? 90,
    canArcFire: false,
    ...overrides,
  });
}

/**
 * Creates a blocking unit (infantry-like).
 */
function createBlockingUnit(
  overrides: Partial<BattleUnit & UnitWithLoS> = {},
): BattleUnit & UnitWithLoS {
  return createLoSUnit({
    id: overrides.id ?? 'blocking-unit',
    range: 1,
    blocksLoS: true,
    ...overrides,
  });
}

/**
 * Creates a transparent unit that doesn't block LoS.
 */
function createTransparentUnit(
  overrides: Partial<BattleUnit & UnitWithLoS> = {},
): BattleUnit & UnitWithLoS {
  return createLoSUnit({
    id: overrides.id ?? 'transparent-unit',
    blocksLoS: false,
    tags: [LOS_TRANSPARENT_TAG],
    ...overrides,
  });
}


// ═══════════════════════════════════════════════════════════════
// BRESENHAM LINE ALGORITHM TESTS
// ═══════════════════════════════════════════════════════════════

describe('LoSProcessor', () => {
  describe('getLineOfSight (Bresenham algorithm)', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should calculate horizontal line correctly', () => {
      const line = processor.getLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 });

      expect(line.length).toBe(5);
      expect(line.start).toEqual({ x: 0, y: 0 });
      expect(line.end).toEqual({ x: 4, y: 0 });
      expect(line.cells.map(c => c.position)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ]);
    });

    it('should calculate vertical line correctly', () => {
      const line = processor.getLineOfSight({ x: 2, y: 1 }, { x: 2, y: 5 });

      expect(line.length).toBe(5);
      expect(line.cells.map(c => c.position)).toEqual([
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 },
      ]);
    });

    it('should calculate diagonal line correctly', () => {
      const line = processor.getLineOfSight({ x: 0, y: 0 }, { x: 3, y: 3 });

      expect(line.length).toBe(4);
      expect(line.cells.map(c => c.position)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ]);
    });

    it('should handle same start and end position', () => {
      const line = processor.getLineOfSight({ x: 3, y: 3 }, { x: 3, y: 3 });

      expect(line.length).toBe(1);
      expect(line.cells[0]?.position).toEqual({ x: 3, y: 3 });
      expect(line.cells[0]?.isEndpoint).toBe(true);
    });

    it('should mark endpoints correctly', () => {
      const line = processor.getLineOfSight({ x: 0, y: 0 }, { x: 2, y: 0 });

      expect(line.cells[0]?.isEndpoint).toBe(true);
      expect(line.cells[1]?.isEndpoint).toBe(false);
      expect(line.cells[2]?.isEndpoint).toBe(true);
    });

    it('should track distance from start', () => {
      const line = processor.getLineOfSight({ x: 0, y: 0 }, { x: 3, y: 0 });

      expect(line.cells[0]?.distanceFromStart).toBe(0);
      expect(line.cells[1]?.distanceFromStart).toBe(1);
      expect(line.cells[2]?.distanceFromStart).toBe(2);
      expect(line.cells[3]?.distanceFromStart).toBe(3);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // DIRECT FIRE BLOCKING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('isBlocked (Direct Fire blocking)', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should return undefined when position is empty', () => {
      const state = createTestBattleState([]);
      const result = processor.isBlocked({ x: 3, y: 3 }, state);

      expect(result).toBeUndefined();
    });

    it('should return obstacle when unit is at position', () => {
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker-inst',
        position: { x: 3, y: 3 },
        team: 'bot',
      });
      const state = createTestBattleState([blocker]);

      const result = processor.isBlocked({ x: 3, y: 3 }, state);

      expect(result).toBeDefined();
      expect(result?.type).toBe('unit');
      expect(result?.unitId).toBe('blocker-inst');
      expect(result?.blocksCompletely).toBe(true);
    });

    it('should exclude specified unit from blocking check', () => {
      const unit = createBlockingUnit({
        id: 'self',
        instanceId: 'self',
        position: { x: 3, y: 3 },
        team: 'player',
      });
      const state = createTestBattleState([unit]);

      // Should not block when excluding self
      const result = processor.isBlocked({ x: 3, y: 3 }, state, 'self');
      expect(result).toBeUndefined();
    });

    it('should not block when unit is dead', () => {
      const deadUnit = createBlockingUnit({
        id: 'dead',
        position: { x: 3, y: 3 },
        team: 'bot',
        currentHp: 0,
        alive: false,
      });
      const state = createTestBattleState([deadUnit]);

      const result = processor.isBlocked({ x: 3, y: 3 }, state);
      expect(result).toBeUndefined();
    });

    it('should not block when unit has blocksLoS = false', () => {
      const transparent = createTransparentUnit({
        id: 'ghost',
        position: { x: 3, y: 3 },
        team: 'bot',
      });
      const state = createTestBattleState([transparent]);

      const result = processor.isBlocked({ x: 3, y: 3 }, state);
      expect(result).toBeUndefined();
    });

    it('should not block when unit has LOS_TRANSPARENT_TAG', () => {
      const transparent = createLoSUnit({
        id: 'spirit',
        position: { x: 3, y: 3 },
        team: 'bot',
        tags: [LOS_TRANSPARENT_TAG],
        // blocksLoS not set - let tag determine behavior
      });
      const state = createTestBattleState([transparent]);

      const result = processor.isBlocked({ x: 3, y: 3 }, state);
      expect(result).toBeUndefined();
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // CHECK LOS TESTS (Direct Fire)
  // ═══════════════════════════════════════════════════════════════

  describe('checkLoS (Direct Fire)', () => {
    it('should have direct LoS when path is clear', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.directLoS).toBe(true);
      expect(result.obstacles).toHaveLength(0);
      expect(result.recommendedMode).toBe('direct');
    });

    it('should block direct LoS when unit is in the path', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.directLoS).toBe(false);
      expect(result.obstacles).toHaveLength(1);
      expect(result.obstacles[0]?.unitId).toBe('blocker');
      expect(result.recommendedMode).toBe('blocked');
      expect(result.blockReason).toBe('blocked_by_unit');
    });

    it('should block direct LoS when ally is in the path', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const ally = createBlockingUnit({
        id: 'ally',
        instanceId: 'ally',
        position: { x: 2, y: 4 },
        team: 'player', // Same team as shooter
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, ally, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.directLoS).toBe(false);
      expect(result.obstacles).toHaveLength(1);
      expect(result.obstacles[0]?.unitId).toBe('ally');
    });

    it('should not block when transparent unit is in the path', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const ghost = createTransparentUnit({
        id: 'ghost',
        instanceId: 'ghost',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, ghost, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.directLoS).toBe(true);
      expect(result.obstacles).toHaveLength(0);
    });

    it('should detect multiple obstacles in the path', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 8,
      });
      const blocker1 = createBlockingUnit({
        id: 'blocker1',
        instanceId: 'blocker1',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const blocker2 = createBlockingUnit({
        id: 'blocker2',
        instanceId: 'blocker2',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 8 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker1, blocker2, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.directLoS).toBe(false);
      expect(result.obstacles).toHaveLength(2);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // FIRING ARC TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('checkFiringArc', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should return in arc when target is directly in front (facing S)', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 3 },
        facing: 'S',
        firingArc: 90,
      });
      const target = createLoSUnit({
        id: 'target',
        position: { x: 3, y: 5 }, // Directly south
      });

      const result = processor.checkFiringArc(shooter, target);

      expect(result.inArc).toBe(true);
      expect(result.relativeDirection).toBe('front');
    });

    it('should return in arc when target is directly in front (facing N)', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 5 },
        facing: 'N',
        firingArc: 90,
      });
      const target = createLoSUnit({
        id: 'target',
        position: { x: 3, y: 3 }, // Directly north
      });

      const result = processor.checkFiringArc(shooter, target);

      expect(result.inArc).toBe(true);
      expect(result.relativeDirection).toBe('front');
    });

    it('should return out of arc when target is behind (facing S, target N)', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 5 },
        facing: 'S',
        firingArc: 90,
      });
      const target = createLoSUnit({
        id: 'target',
        position: { x: 3, y: 3 }, // Behind (north)
      });

      const result = processor.checkFiringArc(shooter, target);

      expect(result.inArc).toBe(false);
      expect(result.relativeDirection).toBe('rear');
    });

    it('should return side direction for targets at 90 degrees', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 3 },
        facing: 'S',
        firingArc: 90,
      });
      const target = createLoSUnit({
        id: 'target',
        position: { x: 6, y: 3 }, // Directly east (90 degrees from facing)
      });

      const result = processor.checkFiringArc(shooter, target);

      expect(result.relativeDirection).toBe('side');
    });

    it('should use wider arc when firingArc is larger', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 3 },
        facing: 'S',
        firingArc: 180, // Wide arc
      });
      const target = createLoSUnit({
        id: 'target',
        position: { x: 6, y: 3 }, // Directly east
      });

      const result = processor.checkFiringArc(shooter, target);

      expect(result.inArc).toBe(true);
      expect(result.arcLimit).toBe(90);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // RANGE AND ARC VALIDATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('checkLoS (range and arc validation)', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should block when target is out of range', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 0, y: 0 },
        team: 'player',
        facing: 'S',
        range: 3, // Short range
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 0, y: 6 }, // 6 cells away
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.blockReason).toBe('out_of_range');
    });

    it('should block when target is outside firing arc', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 3, y: 5 },
        team: 'player',
        facing: 'S',
        firingArc: 90,
        range: 6,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 3, y: 3 }, // Behind the shooter
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.blockReason).toBe('out_of_arc');
      expect(result.inFiringArc).toBe(false);
    });

    it('should allow true sight units to ignore obstacles', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        hasTrueSight: true,
        tags: [ENHANCED_LOS_TAG],
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.directLoS).toBe(true);
      expect(result.obstacles).toHaveLength(0);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // VALIDATE RANGED ATTACK TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('validateRangedAttack', () => {
    it('should return valid with direct fire when path is clear', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(true);
      expect(result.fireMode).toBe('direct');
      expect(result.accuracyModifier).toBe(1.0);
    });

    it('should return invalid when LoS is blocked and no arc fire', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: false,
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DIRECT_FIRE_ONLY_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.fireMode).toBe('blocked');
      expect(result.reason).toBe('blocked_by_unit');
    });

    it('should return invalid when target is out of range', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 0, y: 0 },
        team: 'player',
        facing: 'S',
        range: 3,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 0, y: 8 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('out_of_range');
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // ACCURACY MODIFIER TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getAccuracyModifier', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should return 1.0 for direct fire', () => {
      const modifier = processor.getAccuracyModifier('direct', DEFAULT_CONFIG);
      expect(modifier).toBe(1.0);
    });

    it('should return reduced accuracy for arc fire', () => {
      const modifier = processor.getAccuracyModifier('arc', DEFAULT_CONFIG);
      expect(modifier).toBe(0.8); // 1.0 - 0.2 penalty
    });

    it('should return 0 for blocked', () => {
      const modifier = processor.getAccuracyModifier('blocked', DEFAULT_CONFIG);
      expect(modifier).toBe(0);
    });

    it('should use custom arc fire penalty', () => {
      const customConfig: LoSConfig = {
        directFire: true,
        arcFire: true,
        arcFirePenalty: 0.3,
      };
      const modifier = processor.getAccuracyModifier('arc', customConfig);
      expect(modifier).toBe(0.7); // 1.0 - 0.3 penalty
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FIND VALID TARGETS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('findValidTargets', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should find all enemies with clear LoS', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 3, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const enemy1 = createLoSUnit({
        id: 'enemy1',
        instanceId: 'enemy1',
        position: { x: 2, y: 5 },
        team: 'bot',
      });
      const enemy2 = createLoSUnit({
        id: 'enemy2',
        instanceId: 'enemy2',
        position: { x: 4, y: 5 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, enemy1, enemy2]);

      const targets = processor.findValidTargets(shooter, state, DEFAULT_CONFIG);

      expect(targets).toHaveLength(2);
      expect(targets.map(t => t.target.id)).toContain('enemy1');
      expect(targets.map(t => t.target.id)).toContain('enemy2');
    });

    it('should exclude allies from targets', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 3, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const ally = createLoSUnit({
        id: 'ally',
        instanceId: 'ally',
        position: { x: 3, y: 4 },
        team: 'player',
      });
      const enemy = createLoSUnit({
        id: 'enemy',
        instanceId: 'enemy',
        position: { x: 3, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, ally, enemy]);

      const targets = processor.findValidTargets(shooter, state, DEFAULT_CONFIG);

      // Should only find enemy, not ally (even though ally blocks LoS to enemy)
      expect(targets.map(t => t.target.id)).not.toContain('ally');
    });

    it('should exclude dead units from targets', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 3, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const deadEnemy = createLoSUnit({
        id: 'dead',
        instanceId: 'dead',
        position: { x: 3, y: 5 },
        team: 'bot',
        currentHp: 0,
        alive: false,
      });
      const state = createTestBattleState([shooter, deadEnemy]);

      const targets = processor.findValidTargets(shooter, state, DEFAULT_CONFIG);

      expect(targets).toHaveLength(0);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PHASE INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('apply (phase integration)', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should return unchanged state for non-attack phases', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 2 },
        team: 'player',
      });
      const state = createTestBattleState([shooter]);

      const result = processor.apply('turn_start', state, {
        activeUnit: shooter,
        seed: 12345,
      });

      expect(result).toBe(state);
    });

    it('should return unchanged state for pre_attack phase (validation only)', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        position: { x: 3, y: 2 },
        team: 'player',
      });
      const target = createLoSUnit({
        id: 'target',
        position: { x: 3, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.apply('pre_attack', state, {
        activeUnit: shooter,
        target: target,
        action: { type: 'attack', targetId: 'target' },
        seed: 12345,
      });

      // LoS processor provides validation functions but doesn't modify state
      expect(result).toBe(state);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ARC FIRE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Arc Fire (ignores obstacles)', () => {
    it('should allow arc fire when direct fire is blocked', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true, // Artillery can use arc fire
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.directLoS).toBe(false);
      expect(result.arcLoS).toBe(true);
      expect(result.recommendedMode).toBe('arc');
      expect(result.obstacles).toHaveLength(1);
    });

    it('should prefer direct fire when path is clear even if arc fire available', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.directLoS).toBe(true);
      expect(result.arcLoS).toBe(true);
      expect(result.recommendedMode).toBe('direct'); // Prefer direct when available
    });

    it('should recognize ARC_FIRE_TAG for arc fire capability', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      // Create unit without canArcFire property to test tag-based detection
      const baseUnit = createTestUnit({
        id: 'mortar',
        position: { x: 2, y: 2 },
        team: 'player',
        stats: {
          hp: 100,
          atk: 20,
          atkCount: 1,
          armor: 5,
          speed: 3,
          initiative: 7,
          dodge: 0,
        },
        currentHp: 100,
        alive: true,
        range: 6,
      });
      const shooter: BattleUnit & UnitWithLoS = {
        ...baseUnit,
        facing: 'S',
        firingArc: 90,
        // canArcFire NOT set - should use tag-based detection
        tags: ['arc_fire'], // Using tag instead of canArcFire property
        range: 6,
      };
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.arcLoS).toBe(true);
      expect(result.recommendedMode).toBe('arc');
    });

    it('should block when arc fire is disabled in config', () => {
      const noArcConfig: LoSConfig = {
        directFire: true,
        arcFire: false, // Arc fire disabled
        arcFirePenalty: 0.2,
      };
      const processor = createLoSProcessor(noArcConfig);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true, // Unit can arc fire, but config disables it
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.arcLoS).toBe(false);
      expect(result.recommendedMode).toBe('blocked');
    });

    it('should block when unit cannot arc fire and direct is blocked', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'crossbow',
        instanceId: 'crossbow',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: false, // Crossbow cannot arc fire
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(false);
      expect(result.directLoS).toBe(false);
      expect(result.arcLoS).toBe(false);
      expect(result.recommendedMode).toBe('blocked');
      expect(result.blockReason).toBe('blocked_by_unit');
    });

    it('should allow arc fire over multiple obstacles', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'catapult',
        instanceId: 'catapult',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 8,
        canArcFire: true,
      });
      const blocker1 = createBlockingUnit({
        id: 'blocker1',
        instanceId: 'blocker1',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const blocker2 = createBlockingUnit({
        id: 'blocker2',
        instanceId: 'blocker2',
        position: { x: 2, y: 5 },
        team: 'bot',
      });
      const blocker3 = createBlockingUnit({
        id: 'blocker3',
        instanceId: 'blocker3',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 8 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker1, blocker2, blocker3, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.arcLoS).toBe(true);
      expect(result.obstacles).toHaveLength(3);
      expect(result.recommendedMode).toBe('arc');
    });

    it('should allow arc fire over allied units', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true,
      });
      const ally = createBlockingUnit({
        id: 'ally',
        instanceId: 'ally',
        position: { x: 2, y: 4 },
        team: 'player', // Same team
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, ally, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.arcLoS).toBe(true);
      expect(result.recommendedMode).toBe('arc');
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // ARC FIRE ACCURACY PENALTY TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Arc Fire accuracy penalty', () => {
    it('should apply accuracy penalty for arc fire validation', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true,
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(true);
      expect(result.fireMode).toBe('arc');
      expect(result.accuracyModifier).toBe(0.8); // 1.0 - 0.2 penalty
    });

    it('should use custom arc fire penalty from config', () => {
      const customConfig: LoSConfig = {
        directFire: true,
        arcFire: true,
        arcFirePenalty: 0.35, // 35% penalty
      };
      const processor = createLoSProcessor(customConfig);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true,
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.validateRangedAttack(shooter, target, state, customConfig);

      expect(result.valid).toBe(true);
      expect(result.fireMode).toBe('arc');
      expect(result.accuracyModifier).toBe(0.65); // 1.0 - 0.35 penalty
    });

    it('should have no penalty for direct fire', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'archer',
        instanceId: 'archer',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(true);
      expect(result.fireMode).toBe('direct');
      expect(result.accuracyModifier).toBe(1.0); // No penalty
    });

    it('should return zero accuracy for blocked attacks', () => {
      const processor = createLoSProcessor(DIRECT_FIRE_ONLY_CONFIG);
      const shooter = createRangedUnit({
        id: 'crossbow',
        instanceId: 'crossbow',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: false,
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DIRECT_FIRE_ONLY_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.fireMode).toBe('blocked');
      expect(result.accuracyModifier).toBe(0);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // LOS VALIDATION FOR RANGED ATTACKS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('LoS validation for ranged attacks', () => {
    it('should validate attack with all checks passing', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'archer',
        instanceId: 'archer',
        position: { x: 3, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        firingArc: 90,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 3, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(true);
      expect(result.losCheck.hasLoS).toBe(true);
      expect(result.losCheck.inFiringArc).toBe(true);
      expect(result.losCheck.distance).toBe(4);
    });

    it('should invalidate attack when out of firing arc', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'archer',
        instanceId: 'archer',
        position: { x: 3, y: 5 },
        team: 'player',
        facing: 'S', // Facing south
        range: 6,
        firingArc: 90,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 3, y: 2 }, // Target is north (behind)
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('out_of_arc');
    });

    it('should invalidate attack when out of range', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'archer',
        instanceId: 'archer',
        position: { x: 0, y: 0 },
        team: 'player',
        facing: 'S',
        range: 3, // Short range
        firingArc: 180,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 0, y: 8 }, // 8 cells away
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('out_of_range');
    });

    it('should include full LoS check result in validation', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'artillery',
        instanceId: 'artillery',
        position: { x: 2, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
        canArcFire: true,
      });
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 2, y: 4 },
        team: 'bot',
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 2, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(true);
      expect(result.losCheck).toBeDefined();
      expect(result.losCheck.obstacles).toHaveLength(1);
      expect(result.losCheck.directLoS).toBe(false);
      expect(result.losCheck.arcLoS).toBe(true);
    });

    it('should handle validation with missing attacker position', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'archer',
        team: 'player',
        facing: 'S',
        range: 6,
      });
      delete (shooter as { position?: Position }).position;
      
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 3, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('disabled');
    });

    it('should handle validation with missing target position', () => {
      const processor = createLoSProcessor(DEFAULT_CONFIG);
      const shooter = createRangedUnit({
        id: 'archer',
        instanceId: 'archer',
        position: { x: 3, y: 2 },
        team: 'player',
        facing: 'S',
        range: 6,
      });
      const target = createLoSUnit({
        id: 'target',
        team: 'bot',
      });
      delete (target as { position?: Position }).position;
      
      const state = createTestBattleState([shooter, target]);

      const result = processor.validateRangedAttack(shooter, target, state, DEFAULT_CONFIG);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('disabled');
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // EDGE CASE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    const processor = createLoSProcessor(DEFAULT_CONFIG);

    it('should handle missing positions gracefully', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        team: 'player',
      });
      // Manually remove position to test missing position handling
      // Use delete to properly remove the property
      delete (shooter as { position?: Position }).position;
      
      const target = createLoSUnit({
        id: 'target',
        position: { x: 3, y: 6 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.checkLoS(shooter, target, state);

      // When positions are missing, LoS check fails
      expect(result.hasLoS).toBe(false);
      // The processor returns 'disabled' when positions are missing
      expect(result.blockReason).toBe('disabled');
    });

    it('should handle adjacent units (distance 1)', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 3, y: 3 },
        team: 'player',
        facing: 'S',
        range: 1,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 3, y: 4 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.hasLoS).toBe(true);
      expect(result.distance).toBe(1);
    });

    it('should handle diagonal blocking correctly', () => {
      const shooter = createRangedUnit({
        id: 'shooter',
        instanceId: 'shooter',
        position: { x: 0, y: 0 },
        team: 'player',
        facing: 'S',
        firingArc: 180, // Wide arc to allow diagonal
        range: 8,
      });
      // Place blocker directly on the diagonal line
      const blocker = createBlockingUnit({
        id: 'blocker',
        instanceId: 'blocker',
        position: { x: 1, y: 1 }, // On the diagonal from (0,0) to (3,3)
        team: 'bot',
        blocksLoS: true,
      });
      const target = createLoSUnit({
        id: 'target',
        instanceId: 'target',
        position: { x: 3, y: 3 },
        team: 'bot',
      });
      const state = createTestBattleState([shooter, blocker, target]);

      const result = processor.checkLoS(shooter, target, state);

      expect(result.directLoS).toBe(false);
      expect(result.obstacles).toHaveLength(1);
    });
  });
});
