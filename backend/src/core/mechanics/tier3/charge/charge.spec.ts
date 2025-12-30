/**
 * Tests for Charge processor
 */

import {
  getDistance,
  hasTag,
  isCavalry,
  isSpearWall,
  calculateMomentum,
  calculateMomentumFromPositions,
  applyChargeBonus,
  checkSpearWallCounter,
  calculateChargeDamage,
  startCharge,
  updateMomentum,
  endCharge,
  canCharge,
  getChargeDamageMultiplier,
} from './charge.processor';
import { ChargeUnit, DEFAULT_CHARGE_VALUES } from './charge.types';

describe('Charge Processor', () => {
  const createUnit = (overrides: Partial<ChargeUnit> = {}): ChargeUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    atk: 10,
    ...overrides,
  });

  describe('getDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
      expect(getDistance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
    });
  });

  describe('hasTag', () => {
    it('should return true if unit has matching tag', () => {
      const unit = createUnit({ tags: ['cavalry', 'heavy'] });
      expect(hasTag(unit, ['cavalry'])).toBe(true);
    });

    it('should return false if no matching tags', () => {
      const unit = createUnit({ tags: ['infantry'] });
      expect(hasTag(unit, ['cavalry'])).toBe(false);
    });

    it('should return false if no tags', () => {
      const unit = createUnit();
      expect(hasTag(unit, ['cavalry'])).toBe(false);
    });
  });

  describe('isCavalry', () => {
    it('should return true for cavalry units', () => {
      expect(isCavalry(createUnit({ tags: ['cavalry'] }))).toBe(true);
      expect(isCavalry(createUnit({ tags: ['knight'] }))).toBe(true);
      expect(isCavalry(createUnit({ tags: ['lancer'] }))).toBe(true);
    });

    it('should return false for non-cavalry', () => {
      expect(isCavalry(createUnit({ tags: ['infantry'] }))).toBe(false);
      expect(isCavalry(createUnit())).toBe(false);
    });
  });

  describe('isSpearWall', () => {
    it('should return true for spear wall units', () => {
      expect(isSpearWall(createUnit({ tags: ['spearman'] }))).toBe(true);
      expect(isSpearWall(createUnit({ tags: ['pikeman'] }))).toBe(true);
      expect(isSpearWall(createUnit({ tags: ['halberdier'] }))).toBe(true);
    });

    it('should return false for non-spear units', () => {
      expect(isSpearWall(createUnit({ tags: ['cavalry'] }))).toBe(false);
      expect(isSpearWall(createUnit())).toBe(false);
    });
  });

  describe('calculateMomentum', () => {
    it('should calculate momentum based on distance', () => {
      const result = calculateMomentum(5);

      expect(result.distanceMoved).toBe(5);
      expect(result.momentum).toBe(1.0); // 5 * 0.2 = 1.0
      expect(result.meetsMinDistance).toBe(true);
    });

    it('should return 0 momentum if below min distance', () => {
      const result = calculateMomentum(2);

      expect(result.momentum).toBe(0);
      expect(result.meetsMinDistance).toBe(false);
      expect(result.bonusMultiplier).toBe(1);
    });

    it('should cap momentum at max', () => {
      const result = calculateMomentum(10);

      expect(result.momentum).toBe(1.0); // Capped at max
      expect(result.bonusMultiplier).toBe(2.0);
    });

    it('should calculate bonus multiplier correctly', () => {
      const result = calculateMomentum(4);

      expect(result.momentum).toBe(0.8); // 4 * 0.2
      expect(result.bonusMultiplier).toBe(1.8);
    });

    it('should use custom config values', () => {
      const config = { momentumPerCell: 0.3, maxMomentum: 0.5 };
      const result = calculateMomentum(5, config);

      expect(result.momentum).toBe(0.5); // Capped at 0.5
    });
  });

  describe('calculateMomentumFromPositions', () => {
    it('should calculate momentum from positions', () => {
      const result = calculateMomentumFromPositions(
        { x: 0, y: 0 },
        { x: 3, y: 2 },
      );

      expect(result.distanceMoved).toBe(5);
      expect(result.momentum).toBe(1.0);
    });
  });

  describe('applyChargeBonus', () => {
    it('should apply momentum bonus to damage', () => {
      expect(applyChargeBonus(10, 0.5)).toBe(15); // 10 * 1.5
      expect(applyChargeBonus(10, 1.0)).toBe(20); // 10 * 2.0
      expect(applyChargeBonus(10, 0)).toBe(10); // No bonus
    });

    it('should clamp momentum to max', () => {
      expect(applyChargeBonus(10, 2.0)).toBe(20); // Capped at 1.0 max
    });

    it('should floor the result', () => {
      expect(applyChargeBonus(7, 0.5)).toBe(10); // 7 * 1.5 = 10.5 -> 10
    });
  });

  describe('checkSpearWallCounter', () => {
    it('should counter charging cavalry with spearman', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true, atk: 10 });
      const spearman = createUnit({ id: 'spear', tags: ['spearman'], atk: 8 });

      const result = checkSpearWallCounter(cavalry, spearman);

      expect(result.countered).toBe(true);
      expect(result.chargeStops).toBe(true);
      expect(result.counterDamage).toBe(4); // 8 * 0.5
    });

    it('should not counter non-charging cavalry', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: false });
      const spearman = createUnit({ id: 'spear', tags: ['spearman'], atk: 8 });

      const result = checkSpearWallCounter(cavalry, spearman);

      expect(result.countered).toBe(false);
    });

    it('should not counter non-cavalry', () => {
      const infantry = createUnit({ tags: ['infantry'], isCharging: true });
      const spearman = createUnit({ id: 'spear', tags: ['spearman'], atk: 8 });

      const result = checkSpearWallCounter(infantry, spearman);

      expect(result.countered).toBe(false);
    });

    it('should not counter with non-spear units', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true });
      const archer = createUnit({ id: 'archer', tags: ['archer'], atk: 8 });

      const result = checkSpearWallCounter(cavalry, archer);

      expect(result.countered).toBe(false);
    });
  });

  describe('calculateChargeDamage', () => {
    it('should calculate charge damage with momentum', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true });
      const target = createUnit({ id: 'target', tags: ['infantry'] });

      const result = calculateChargeDamage(cavalry, target, 10, 5);

      expect(result.baseDamage).toBe(10);
      expect(result.finalDamage).toBe(20); // 10 * 2.0 (max momentum)
      expect(result.momentumBonus).toBe(10);
      expect(result.shockResolveDamage).toBe(DEFAULT_CHARGE_VALUES.shockResolveDamage);
      expect(result.wasCountered).toBe(false);
    });

    it('should not apply bonus if countered', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true });
      const spearman = createUnit({ id: 'spear', tags: ['spearman'], atk: 8 });

      const result = calculateChargeDamage(cavalry, spearman, 10, 5);

      expect(result.finalDamage).toBe(10); // No bonus
      expect(result.momentumBonus).toBe(0);
      expect(result.shockResolveDamage).toBe(0);
      expect(result.wasCountered).toBe(true);
      expect(result.counterDamage).toBe(4);
    });

    it('should not apply shock damage if below min distance', () => {
      const cavalry = createUnit({ tags: ['cavalry'], isCharging: true });
      const target = createUnit({ id: 'target' });

      const result = calculateChargeDamage(cavalry, target, 10, 2);

      expect(result.shockResolveDamage).toBe(0);
      expect(result.momentumBonus).toBe(0);
    });
  });

  describe('startCharge', () => {
    it('should set charging state', () => {
      const unit = createUnit({ tags: ['cavalry'] });

      const result = startCharge(unit);

      expect(result.isCharging).toBe(true);
      expect(result.momentum).toBe(0);
    });
  });

  describe('updateMomentum', () => {
    it('should update momentum for charging unit', () => {
      const unit = createUnit({ tags: ['cavalry'], isCharging: true });

      const result = updateMomentum(unit, 4);

      expect(result.momentum).toBe(0.8);
    });

    it('should not update momentum for non-charging unit', () => {
      const unit = createUnit({ tags: ['cavalry'], isCharging: false });

      const result = updateMomentum(unit, 4);

      expect(result.momentum).toBeUndefined();
    });
  });

  describe('endCharge', () => {
    it('should reset charging state', () => {
      const unit = createUnit({ tags: ['cavalry'], isCharging: true, momentum: 0.8 });

      const result = endCharge(unit);

      expect(result.isCharging).toBe(false);
      expect(result.momentum).toBe(0);
    });
  });

  describe('canCharge', () => {
    it('should return true for cavalry not charging', () => {
      const unit = createUnit({ tags: ['cavalry'], isCharging: false });
      expect(canCharge(unit)).toBe(true);
    });

    it('should return false for already charging', () => {
      const unit = createUnit({ tags: ['cavalry'], isCharging: true });
      expect(canCharge(unit)).toBe(false);
    });

    it('should return false for non-cavalry', () => {
      const unit = createUnit({ tags: ['infantry'] });
      expect(canCharge(unit)).toBe(false);
    });
  });

  describe('getChargeDamageMultiplier', () => {
    it('should return correct multiplier', () => {
      expect(getChargeDamageMultiplier(0)).toBe(1.0);
      expect(getChargeDamageMultiplier(0.5)).toBe(1.5);
      expect(getChargeDamageMultiplier(1.0)).toBe(2.0);
    });

    it('should clamp to max', () => {
      expect(getChargeDamageMultiplier(2.0)).toBe(2.0);
    });

    it('should clamp negative to 0', () => {
      expect(getChargeDamageMultiplier(-0.5)).toBe(1.0);
    });
  });
});
