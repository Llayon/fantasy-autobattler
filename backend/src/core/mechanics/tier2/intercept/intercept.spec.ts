/**
 * Tests for Intercept processor
 */

import {
  hasTag,
  canHardIntercept,
  canSoftIntercept,
  isCavalry,
  checkIntercept,
  checkInterceptAlongPath,
  calculateDisengageCost,
  canAffordDisengage,
  getInterceptorsAtPosition,
  applyDisengageCost,
  wouldCounterCharge,
} from './intercept.processor';
import { InterceptUnit } from './intercept.types';

describe('Intercept Processor', () => {
  const createUnit = (overrides: Partial<InterceptUnit> = {}): InterceptUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    ...overrides,
  });

  describe('hasTag', () => {
    it('should return true if unit has matching tag', () => {
      const unit = createUnit({ tags: ['spearman', 'infantry'] });
      expect(hasTag(unit, ['spearman'])).toBe(true);
    });

    it('should return false if unit has no matching tags', () => {
      const unit = createUnit({ tags: ['archer'] });
      expect(hasTag(unit, ['spearman'])).toBe(false);
    });

    it('should return false if unit has no tags', () => {
      const unit = createUnit();
      expect(hasTag(unit, ['spearman'])).toBe(false);
    });

    it('should return false if unit has empty tags array', () => {
      const unit = createUnit({ tags: [] });
      expect(hasTag(unit, ['spearman'])).toBe(false);
    });
  });

  describe('canHardIntercept', () => {
    it('should return true for spearman', () => {
      const unit = createUnit({ tags: ['spearman'] });
      expect(canHardIntercept(unit)).toBe(true);
    });

    it('should return true for pikeman', () => {
      const unit = createUnit({ tags: ['pikeman'] });
      expect(canHardIntercept(unit)).toBe(true);
    });

    it('should return false for regular infantry', () => {
      const unit = createUnit({ tags: ['infantry'] });
      expect(canHardIntercept(unit)).toBe(false);
    });

    it('should use custom config types', () => {
      const unit = createUnit({ tags: ['lancer'] });
      const config = { hardInterceptTypes: ['lancer'] };
      expect(canHardIntercept(unit, config)).toBe(true);
    });
  });

  describe('canSoftIntercept', () => {
    it('should return true for infantry', () => {
      const unit = createUnit({ tags: ['infantry'] });
      expect(canSoftIntercept(unit)).toBe(true);
    });

    it('should return true for swordsman', () => {
      const unit = createUnit({ tags: ['swordsman'] });
      expect(canSoftIntercept(unit)).toBe(true);
    });

    it('should return false for archer', () => {
      const unit = createUnit({ tags: ['archer'] });
      expect(canSoftIntercept(unit)).toBe(false);
    });
  });

  describe('isCavalry', () => {
    it('should return true for cavalry', () => {
      const unit = createUnit({ tags: ['cavalry'] });
      expect(isCavalry(unit)).toBe(true);
    });

    it('should return true for knight', () => {
      const unit = createUnit({ tags: ['knight'] });
      expect(isCavalry(unit)).toBe(true);
    });

    it('should return false for infantry', () => {
      const unit = createUnit({ tags: ['infantry'] });
      expect(isCavalry(unit)).toBe(false);
    });
  });

  describe('checkIntercept', () => {
    it('should not intercept if not in ZoC', () => {
      const movingUnit = createUnit({ id: 'mover', tags: ['cavalry'], isCharging: true });
      const interceptor = createUnit({ id: 'interceptor', tags: ['spearman'], position: { x: 10, y: 10 } });
      const path = { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } };

      const result = checkIntercept(movingUnit, interceptor, path);

      expect(result.intercepted).toBe(false);
      expect(result.interceptType).toBe('none');
    });

    it('should hard intercept charging cavalry with spearman', () => {
      const cavalry = createUnit({ id: 'cavalry', tags: ['cavalry'], isCharging: true });
      const spearman = createUnit({ id: 'spearman', tags: ['spearman'], position: { x: 5, y: 5 } });
      const path = { from: { x: 5, y: 3 }, to: { x: 5, y: 4 } };

      const result = checkIntercept(cavalry, spearman, path);

      expect(result.intercepted).toBe(true);
      expect(result.interceptType).toBe('hard');
      expect(result.stopMovement).toBe(true);
      expect(result.triggerEngagement).toBe(true);
      expect(result.interceptorId).toBe('spearman');
    });

    it('should not hard intercept non-charging cavalry', () => {
      const cavalry = createUnit({ id: 'cavalry', tags: ['cavalry'], isCharging: false });
      const spearman = createUnit({ id: 'spearman', tags: ['spearman'], position: { x: 5, y: 5 } });
      const path = { from: { x: 5, y: 3 }, to: { x: 5, y: 4 } };

      const result = checkIntercept(cavalry, spearman, path);

      expect(result.intercepted).toBe(false);
      expect(result.interceptType).toBe('none');
    });

    it('should soft intercept with infantry', () => {
      const movingUnit = createUnit({ id: 'mover' });
      const infantry = createUnit({ id: 'infantry', tags: ['infantry'], position: { x: 5, y: 5 } });
      const path = { from: { x: 5, y: 3 }, to: { x: 5, y: 4 } };

      const result = checkIntercept(movingUnit, infantry, path);

      expect(result.intercepted).toBe(true);
      expect(result.interceptType).toBe('soft');
      expect(result.stopMovement).toBe(false);
      expect(result.triggerEngagement).toBe(true);
    });

    it('should trigger engagement even without intercept capability', () => {
      const movingUnit = createUnit({ id: 'mover' });
      const archer = createUnit({ id: 'archer', tags: ['archer'], position: { x: 5, y: 5 } });
      const path = { from: { x: 5, y: 3 }, to: { x: 5, y: 4 } };

      const result = checkIntercept(movingUnit, archer, path);

      expect(result.intercepted).toBe(false);
      expect(result.triggerEngagement).toBe(true);
    });
  });

  describe('checkInterceptAlongPath', () => {
    it('should return no intercept for empty path', () => {
      const movingUnit = createUnit({ id: 'mover', tags: ['cavalry'], isCharging: true });
      const enemies = [createUnit({ id: 'spearman', tags: ['spearman'] })];

      const result = checkInterceptAlongPath(movingUnit, enemies, []);

      expect(result.intercepted).toBe(false);
    });

    it('should stop at first hard intercept', () => {
      const cavalry = createUnit({ id: 'cavalry', tags: ['cavalry'], isCharging: true });
      const spearman1 = createUnit({ id: 'spearman1', tags: ['spearman'], position: { x: 5, y: 4 } });
      const spearman2 = createUnit({ id: 'spearman2', tags: ['spearman'], position: { x: 5, y: 6 } });
      const path = [
        { x: 5, y: 2 },
        { x: 5, y: 3 },
        { x: 5, y: 4 },
        { x: 5, y: 5 },
      ];

      const result = checkInterceptAlongPath(cavalry, [spearman1, spearman2], path);

      expect(result.intercepted).toBe(true);
      expect(result.interceptType).toBe('hard');
      expect(result.interceptorId).toBe('spearman1');
    });

    it('should continue through soft intercepts', () => {
      const movingUnit = createUnit({ id: 'mover' });
      const infantry1 = createUnit({ id: 'infantry1', tags: ['infantry'], position: { x: 5, y: 3 } });
      const infantry2 = createUnit({ id: 'infantry2', tags: ['infantry'], position: { x: 5, y: 5 } });
      const path = [
        { x: 5, y: 1 },
        { x: 5, y: 2 },
        { x: 5, y: 3 },
        { x: 5, y: 4 },
      ];

      const result = checkInterceptAlongPath(movingUnit, [infantry1, infantry2], path);

      expect(result.intercepted).toBe(true);
      expect(result.interceptType).toBe('soft');
      expect(result.stopMovement).toBe(false);
    });
  });

  describe('calculateDisengageCost', () => {
    it('should calculate cost based on number of enemies', () => {
      const unit = createUnit({ speed: 5 });

      const result = calculateDisengageCost(unit, 2);

      expect(result.movementCost).toBe(4); // 2 * 2
      expect(result.remainingMovement).toBe(1); // 5 - 4
      expect(result.canDisengage).toBe(true);
    });

    it('should return 0 cost for no enemies', () => {
      const unit = createUnit({ speed: 5 });

      const result = calculateDisengageCost(unit, 0);

      expect(result.movementCost).toBe(0);
      expect(result.remainingMovement).toBe(5);
      expect(result.canDisengage).toBe(true);
    });

    it('should not allow disengage if cost exceeds speed', () => {
      const unit = createUnit({ speed: 3 });

      const result = calculateDisengageCost(unit, 3);

      expect(result.movementCost).toBe(6); // 3 * 2
      expect(result.remainingMovement).toBe(0);
      expect(result.canDisengage).toBe(false);
    });

    it('should use custom disengage cost from config', () => {
      const unit = createUnit({ speed: 5 });
      const config = { disengageCost: 1 };

      const result = calculateDisengageCost(unit, 2, config);

      expect(result.movementCost).toBe(2); // 2 * 1
      expect(result.remainingMovement).toBe(3);
    });

    it('should use default speed if not set', () => {
      const unit = createUnit();
      delete unit.speed;

      const result = calculateDisengageCost(unit, 1);

      expect(result.remainingMovement).toBe(1); // 3 (default) - 2
    });
  });

  describe('canAffordDisengage', () => {
    it('should return true if unit has enough movement', () => {
      const unit = createUnit({ speed: 5 });
      expect(canAffordDisengage(unit, 2)).toBe(true);
    });

    it('should return false if unit lacks movement', () => {
      const unit = createUnit({ speed: 2 });
      expect(canAffordDisengage(unit, 2)).toBe(false);
    });

    it('should return true for no enemies', () => {
      const unit = createUnit({ speed: 1 });
      expect(canAffordDisengage(unit, 0)).toBe(true);
    });
  });

  describe('getInterceptorsAtPosition', () => {
    it('should return interceptors in ZoC', () => {
      const position = { x: 5, y: 5 };
      const spearman = createUnit({ id: 'spearman', tags: ['spearman'], position: { x: 5, y: 4 } });
      const infantry = createUnit({ id: 'infantry', tags: ['infantry'], position: { x: 4, y: 5 } });
      const archer = createUnit({ id: 'archer', tags: ['archer'], position: { x: 5, y: 6 } });
      const farUnit = createUnit({ id: 'far', tags: ['spearman'], position: { x: 10, y: 10 } });

      const result = getInterceptorsAtPosition(position, [spearman, infantry, archer, farUnit]);

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.id)).toContain('spearman');
      expect(result.map((u) => u.id)).toContain('infantry');
    });

    it('should return empty array if no interceptors', () => {
      const position = { x: 5, y: 5 };
      const archer = createUnit({ id: 'archer', tags: ['archer'], position: { x: 5, y: 4 } });

      const result = getInterceptorsAtPosition(position, [archer]);

      expect(result).toHaveLength(0);
    });
  });

  describe('applyDisengageCost', () => {
    it('should reduce unit speed', () => {
      const unit = createUnit({ speed: 5 });

      const result = applyDisengageCost(unit, 2);

      expect(result.speed).toBe(1); // 5 - 4
    });

    it('should not go below 0', () => {
      const unit = createUnit({ speed: 2 });

      const result = applyDisengageCost(unit, 3);

      expect(result.speed).toBe(0);
    });
  });

  describe('wouldCounterCharge', () => {
    it('should return true for charging cavalry vs spearman', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true });
      const spearman = createUnit({ tags: ['spearman'] });

      expect(wouldCounterCharge(cavalry, spearman)).toBe(true);
    });

    it('should return false for non-charging cavalry', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: false });
      const spearman = createUnit({ tags: ['spearman'] });

      expect(wouldCounterCharge(cavalry, spearman)).toBe(false);
    });

    it('should return false for non-cavalry', () => {
      const infantry = createUnit({ tags: ['infantry'], isCharging: true });
      const spearman = createUnit({ tags: ['spearman'] });

      expect(wouldCounterCharge(infantry, spearman)).toBe(false);
    });

    it('should return false for non-spearman interceptor', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true });
      const infantry = createUnit({ tags: ['infantry'] });

      expect(wouldCounterCharge(cavalry, infantry)).toBe(false);
    });
  });
});
