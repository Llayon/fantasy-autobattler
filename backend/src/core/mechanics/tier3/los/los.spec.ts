/**
 * Tests for Line of Sight processor
 */

import {
  getLineOfSight,
  getBlockingUnit,
  calculateLine,
  checkLineOfSight,
  canDirectFire,
  requiresArcFire,
  getAccuracyModifier,
  applyLoSPenalty,
  findValidTargets,
  getBlockingUnits,
} from './los.processor';
import { LoSUnit, DEFAULT_LOS_VALUES } from './los.types';

describe('Line of Sight Processor', () => {
  const createUnit = (overrides: Partial<LoSUnit> = {}): LoSUnit => ({
    id: 'unit1',
    position: { x: 0, y: 0 },
    isRanged: true,
    ...overrides,
  });

  describe('getLineOfSight', () => {
    it('should calculate horizontal line', () => {
      const line = getLineOfSight({ x: 0, y: 0 }, { x: 3, y: 0 });

      expect(line).toHaveLength(4);
      expect(line[0]).toEqual({ x: 0, y: 0 });
      expect(line[3]).toEqual({ x: 3, y: 0 });
    });

    it('should calculate vertical line', () => {
      const line = getLineOfSight({ x: 0, y: 0 }, { x: 0, y: 3 });

      expect(line).toHaveLength(4);
      expect(line[0]).toEqual({ x: 0, y: 0 });
      expect(line[3]).toEqual({ x: 0, y: 3 });
    });

    it('should calculate diagonal line', () => {
      const line = getLineOfSight({ x: 0, y: 0 }, { x: 3, y: 3 });

      expect(line).toHaveLength(4);
      expect(line[0]).toEqual({ x: 0, y: 0 });
      expect(line[3]).toEqual({ x: 3, y: 3 });
    });

    it('should handle same position', () => {
      const line = getLineOfSight({ x: 5, y: 5 }, { x: 5, y: 5 });

      expect(line).toHaveLength(1);
      expect(line[0]).toEqual({ x: 5, y: 5 });
    });
  });

  describe('getBlockingUnit', () => {
    it('should find unit at position', () => {
      const units = [
        createUnit({ id: 'u1', position: { x: 2, y: 2 } }),
        createUnit({ id: 'u2', position: { x: 5, y: 5 } }),
      ];

      expect(getBlockingUnit({ x: 2, y: 2 }, units)).toBe('u1');
      expect(getBlockingUnit({ x: 5, y: 5 }, units)).toBe('u2');
      expect(getBlockingUnit({ x: 0, y: 0 }, units)).toBeUndefined();
    });

    it('should exclude specified units', () => {
      const units = [createUnit({ id: 'u1', position: { x: 2, y: 2 } })];

      expect(getBlockingUnit({ x: 2, y: 2 }, units, ['u1'])).toBeUndefined();
    });
  });

  describe('calculateLine', () => {
    it('should detect blocked line', () => {
      const units = [createUnit({ id: 'blocker', position: { x: 2, y: 0 } })];

      const result = calculateLine({ x: 0, y: 0 }, { x: 4, y: 0 }, units);

      expect(result.blocked).toBe(true);
      expect(result.points).toHaveLength(5);
    });

    it('should detect clear line', () => {
      const units = [createUnit({ id: 'far', position: { x: 10, y: 10 } })];

      const result = calculateLine({ x: 0, y: 0 }, { x: 4, y: 0 }, units);

      expect(result.blocked).toBe(false);
    });

    it('should exclude start and end positions', () => {
      const units = [
        createUnit({ id: 'start', position: { x: 0, y: 0 } }),
        createUnit({ id: 'end', position: { x: 4, y: 0 } }),
      ];

      const result = calculateLine({ x: 0, y: 0 }, { x: 4, y: 0 }, units, ['start', 'end']);

      expect(result.blocked).toBe(false);
    });
  });

  describe('checkLineOfSight', () => {
    it('should return direct fire for clear line', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 } });
      const target = createUnit({ id: 'enemy', position: { x: 5, y: 0 } });

      const result = checkLineOfSight(attacker, target, [attacker, target]);

      expect(result.hasLineOfSight).toBe(true);
      expect(result.fireType).toBe('direct');
      expect(result.accuracyPenalty).toBe(0);
    });

    it('should return arc fire when blocked and can arc', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: true });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      const result = checkLineOfSight(attacker, target, [attacker, target, blocker]);

      expect(result.hasLineOfSight).toBe(true);
      expect(result.fireType).toBe('arc');
      expect(result.accuracyPenalty).toBe(DEFAULT_LOS_VALUES.arcFirePenalty);
      expect(result.blockedBy).toContain('blocker');
    });

    it('should return no LoS when blocked and cannot arc', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: false });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      const result = checkLineOfSight(attacker, target, [attacker, target, blocker]);

      expect(result.hasLineOfSight).toBe(false);
      expect(result.blockedBy).toContain('blocker');
    });
  });

  describe('canDirectFire', () => {
    it('should return true for clear line', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 } });
      const target = createUnit({ id: 'enemy', position: { x: 5, y: 0 } });

      expect(canDirectFire(attacker, target, [attacker, target])).toBe(true);
    });

    it('should return false for blocked line', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 } });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      expect(canDirectFire(attacker, target, [attacker, target, blocker])).toBe(false);
    });
  });

  describe('requiresArcFire', () => {
    it('should return true when blocked but can arc', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: true });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      expect(requiresArcFire(attacker, target, [attacker, target, blocker])).toBe(true);
    });

    it('should return false for clear line', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: true });
      const target = createUnit({ id: 'enemy', position: { x: 5, y: 0 } });

      expect(requiresArcFire(attacker, target, [attacker, target])).toBe(false);
    });
  });

  describe('getAccuracyModifier', () => {
    it('should return 1.0 for direct fire', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 } });
      const target = createUnit({ id: 'enemy', position: { x: 5, y: 0 } });

      expect(getAccuracyModifier(attacker, target, [attacker, target])).toBe(1.0);
    });

    it('should return 0.8 for arc fire', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: true });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      expect(getAccuracyModifier(attacker, target, [attacker, target, blocker])).toBe(0.8);
    });

    it('should return 0 for no LoS', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: false });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      expect(getAccuracyModifier(attacker, target, [attacker, target, blocker])).toBe(0);
    });
  });

  describe('applyLoSPenalty', () => {
    it('should not reduce damage for direct fire', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 } });
      const target = createUnit({ id: 'enemy', position: { x: 5, y: 0 } });

      expect(applyLoSPenalty(10, attacker, target, [attacker, target])).toBe(10);
    });

    it('should reduce damage for arc fire', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: true });
      const target = createUnit({ id: 'enemy', position: { x: 4, y: 0 } });
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      expect(applyLoSPenalty(10, attacker, target, [attacker, target, blocker])).toBe(8);
    });
  });

  describe('findValidTargets', () => {
    it('should find all valid targets', () => {
      const attacker = createUnit({ id: 'archer', position: { x: 0, y: 0 }, canArcFire: true });
      const enemy1 = createUnit({ id: 'e1', position: { x: 5, y: 5 } }); // Not blocked
      const enemy2 = createUnit({ id: 'e2', position: { x: 4, y: 0 } }); // Blocked by blocker
      const blocker = createUnit({ id: 'blocker', position: { x: 2, y: 0 } });

      const targets = findValidTargets(
        attacker,
        [enemy1, enemy2],
        [attacker, enemy1, enemy2, blocker],
      );

      expect(targets).toHaveLength(2);
      expect(targets.find((t) => t.target.id === 'e1')?.fireType).toBe('direct');
      expect(targets.find((t) => t.target.id === 'e2')?.fireType).toBe('arc');
    });
  });

  describe('getBlockingUnits', () => {
    it('should return all blocking units', () => {
      const units = [
        createUnit({ id: 'b1', position: { x: 2, y: 0 } }),
        createUnit({ id: 'b2', position: { x: 3, y: 0 } }),
      ];

      const blockers = getBlockingUnits({ x: 0, y: 0 }, { x: 5, y: 0 }, units);

      expect(blockers).toContain('b1');
      expect(blockers).toContain('b2');
    });
  });
});
