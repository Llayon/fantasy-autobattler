/**
 * Tests for Armor Shred processor
 */

import {
  getShred,
  getMaxShred,
  getEffectiveArmor,
  applyShred,
  updateShred,
  decayShred,
  applyDecay,
  resetShred,
  hasShred,
  isAtMaxShred,
  getShredPercentage,
  calculateDamageWithShred,
  processShredDecay,
  getTotalShred,
  getUnitsWithShred,
} from './armor-shred.processor';
import { ArmorShredUnit, DEFAULT_SHRED_VALUES } from './armor-shred.types';

describe('Armor Shred Processor', () => {
  const createUnit = (overrides: Partial<ArmorShredUnit> = {}): ArmorShredUnit => ({
    id: 'unit1',
    armor: 10,
    ...overrides,
  });

  describe('getShred', () => {
    it('should return current shred', () => {
      const unit = createUnit({ armorShred: 3 });
      expect(getShred(unit)).toBe(3);
    });

    it('should return 0 for no shred', () => {
      const unit = createUnit();
      expect(getShred(unit)).toBe(0);
    });
  });

  describe('getMaxShred', () => {
    it('should return default max shred', () => {
      const unit = createUnit();
      expect(getMaxShred(unit)).toBe(DEFAULT_SHRED_VALUES.maxShred);
    });

    it('should use config max shred', () => {
      const unit = createUnit();
      expect(getMaxShred(unit, { maxShred: 15 })).toBe(15);
    });

    it('should calculate percent-based max shred', () => {
      const unit = createUnit({ armor: 20 });
      expect(getMaxShred(unit, { maxShred: 50, percentBased: true })).toBe(10);
    });
  });

  describe('getEffectiveArmor', () => {
    it('should subtract shred from armor', () => {
      const unit = createUnit({ armor: 10, armorShred: 3 });
      expect(getEffectiveArmor(unit)).toBe(7);
    });

    it('should not go below 0', () => {
      const unit = createUnit({ armor: 5, armorShred: 10 });
      expect(getEffectiveArmor(unit)).toBe(0);
    });

    it('should return full armor with no shred', () => {
      const unit = createUnit({ armor: 10 });
      expect(getEffectiveArmor(unit)).toBe(10);
    });
  });

  describe('applyShred', () => {
    it('should apply shred', () => {
      const unit = createUnit();
      const result = applyShred(unit, 2);

      expect(result.shredApplied).toBe(2);
      expect(result.totalShred).toBe(2);
      expect(result.effectiveArmor).toBe(8);
      expect(result.wasCapped).toBe(false);
    });

    it('should accumulate shred', () => {
      const unit = createUnit({ armorShred: 3 });
      const result = applyShred(unit, 2);

      expect(result.totalShred).toBe(5);
    });

    it('should cap at max shred', () => {
      const unit = createUnit({ armorShred: 9 });
      const result = applyShred(unit, 3);

      expect(result.totalShred).toBe(10);
      expect(result.shredApplied).toBe(1);
      expect(result.wasCapped).toBe(true);
    });

    it('should use default shred per hit', () => {
      const unit = createUnit();
      const result = applyShred(unit);

      expect(result.shredApplied).toBe(DEFAULT_SHRED_VALUES.shredPerHit);
    });
  });

  describe('updateShred', () => {
    it('should update unit with new shred', () => {
      const unit = createUnit();
      const result = updateShred(unit, 3);

      expect(result.armorShred).toBe(3);
    });
  });

  describe('decayShred', () => {
    it('should not decay if decayPerTurn is 0', () => {
      const unit = createUnit({ armorShred: 5 });
      const result = decayShred(unit);

      expect(result.decayAmount).toBe(0);
      expect(result.newShred).toBe(5);
    });

    it('should decay shred', () => {
      const unit = createUnit({ armorShred: 5 });
      const result = decayShred(unit, { decayPerTurn: 2 });

      expect(result.decayAmount).toBe(2);
      expect(result.newShred).toBe(3);
    });

    it('should not go below 0', () => {
      const unit = createUnit({ armorShred: 1 });
      const result = decayShred(unit, { decayPerTurn: 5 });

      expect(result.newShred).toBe(0);
    });
  });

  describe('applyDecay', () => {
    it('should apply decay to unit', () => {
      const unit = createUnit({ armorShred: 5 });
      const result = applyDecay(unit, { decayPerTurn: 2 });

      expect(result.armorShred).toBe(3);
    });

    it('should remove shred property when 0', () => {
      const unit = createUnit({ armorShred: 1 });
      const result = applyDecay(unit, { decayPerTurn: 5 });

      expect(result.armorShred).toBeUndefined();
    });
  });

  describe('resetShred', () => {
    it('should remove all shred', () => {
      const unit = createUnit({ armorShred: 5 });
      const result = resetShred(unit);

      expect(result.armorShred).toBeUndefined();
    });

    it('should not modify unit without shred', () => {
      const unit = createUnit();
      const result = resetShred(unit);

      expect(result).toEqual(unit);
    });
  });

  describe('hasShred', () => {
    it('should return true if unit has shred', () => {
      expect(hasShred(createUnit({ armorShred: 1 }))).toBe(true);
    });

    it('should return false if unit has no shred', () => {
      expect(hasShred(createUnit())).toBe(false);
    });
  });

  describe('isAtMaxShred', () => {
    it('should return true at max shred', () => {
      const unit = createUnit({ armorShred: 10 });
      expect(isAtMaxShred(unit)).toBe(true);
    });

    it('should return false below max shred', () => {
      const unit = createUnit({ armorShred: 5 });
      expect(isAtMaxShred(unit)).toBe(false);
    });
  });

  describe('getShredPercentage', () => {
    it('should calculate percentage', () => {
      const unit = createUnit({ armorShred: 5 });
      expect(getShredPercentage(unit)).toBe(0.5);
    });

    it('should return 0 for no shred', () => {
      const unit = createUnit();
      expect(getShredPercentage(unit)).toBe(0);
    });
  });

  describe('calculateDamageWithShred', () => {
    it('should use effective armor', () => {
      const target = createUnit({ armor: 10, armorShred: 3 });
      // 15 damage - 7 effective armor = 8
      expect(calculateDamageWithShred(15, target)).toBe(8);
    });

    it('should return minimum 1 damage', () => {
      const target = createUnit({ armor: 20 });
      expect(calculateDamageWithShred(5, target)).toBe(1);
    });
  });

  describe('processShredDecay', () => {
    it('should decay all units', () => {
      const units = [
        createUnit({ id: 'u1', armorShred: 5 }),
        createUnit({ id: 'u2', armorShred: 3 }),
      ];

      const result = processShredDecay(units, { decayPerTurn: 1 });

      expect(result[0]?.armorShred).toBe(4);
      expect(result[1]?.armorShred).toBe(2);
    });
  });

  describe('getTotalShred', () => {
    it('should sum all shred', () => {
      const units = [
        createUnit({ id: 'u1', armorShred: 5 }),
        createUnit({ id: 'u2', armorShred: 3 }),
        createUnit({ id: 'u3' }),
      ];

      expect(getTotalShred(units)).toBe(8);
    });
  });

  describe('getUnitsWithShred', () => {
    it('should find units with shred', () => {
      const units = [
        createUnit({ id: 'u1', armorShred: 5 }),
        createUnit({ id: 'u2' }),
        createUnit({ id: 'u3', armorShred: 3 }),
      ];

      const result = getUnitsWithShred(units);

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.id)).toContain('u1');
      expect(result.map((u) => u.id)).toContain('u3');
    });
  });
});
