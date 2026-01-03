/**
 * Tier 4: Armor Shred Processor - Unit Tests
 *
 * Tests for the armor shred system which reduces target armor on physical attacks.
 *
 * @module core/mechanics/tier4/armor-shred
 */

import { createShredProcessor } from './armor-shred.processor';
import type { ShredConfig } from '../../config/mechanics.types';
import type { BattleUnit, BattleState } from '../../../types';
import type { UnitWithArmorShred } from './armor-shred.types';
import {
  DEFAULT_SHRED_PER_ATTACK,
  DEFAULT_MAX_SHRED_PERCENT,
  DEFAULT_DECAY_PER_TURN,
  MIN_EFFECTIVE_ARMOR,
} from './armor-shred.types';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

/**
 * Default shred config for testing.
 */
const DEFAULT_CONFIG: ShredConfig = {
  shredPerAttack: DEFAULT_SHRED_PER_ATTACK,
  maxShredPercent: DEFAULT_MAX_SHRED_PERCENT,
  decayPerTurn: DEFAULT_DECAY_PER_TURN,
};

/**
 * Custom shred config for testing.
 */
const CUSTOM_CONFIG: ShredConfig = {
  shredPerAttack: 2,
  maxShredPercent: 0.5,
  decayPerTurn: 1,
};

/**
 * Creates a mock battle unit for testing.
 */
function createMockUnit(
  overrides: Partial<BattleUnit & UnitWithArmorShred> = {},
): BattleUnit & UnitWithArmorShred {
  return {
    id: 'unit_1',
    instanceId: overrides.instanceId ?? 'unit_1',
    name: 'Test Unit',
    currentHp: 100,
    maxHp: 100,
    atk: 10,
    armor: 10,
    speed: 3,
    initiative: 10,
    range: 1,
    attackCount: 1,
    position: { x: 0, y: 0 },
    team: 1,
    alive: true,
    statusEffects: [],
    armorShred: 0,
    ...overrides,
  } as BattleUnit & UnitWithArmorShred;
}

/**
 * Creates a mock battle state for testing.
 */
function createMockState(
  units: Array<BattleUnit & UnitWithArmorShred>,
): BattleState {
  return {
    units,
    round: 1,
    events: [],
  } as unknown as BattleState;
}

// ═══════════════════════════════════════════════════════════════
// applyShred() TESTS
// ═══════════════════════════════════════════════════════════════

describe('ArmorShredProcessor', () => {
  describe('applyShred()', () => {
    it('should apply shred to unit with no existing shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 10, armorShred: 0 });

      const result = processor.applyShred(target, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(DEFAULT_SHRED_PER_ATTACK);
    });

    it('should accumulate shred on subsequent attacks', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 10, armorShred: 2 });

      const result = processor.applyShred(target, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(3);
    });

    it('should cap shred at maxShredPercent * baseArmor', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      // 10 armor * 0.4 = max 4 shred
      const target = createMockUnit({ armor: 10, armorShred: 4 });

      const result = processor.applyShred(target, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(4); // Should not exceed cap
    });

    it('should apply partial shred when approaching cap', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      // 10 armor * 0.4 = max 4 shred, currently at 3
      const target = createMockUnit({ armor: 10, armorShred: 3 });

      const result = processor.applyShred(target, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(4); // Capped at max
    });

    it('should handle unit with zero armor', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 0, armorShred: 0 });

      const result = processor.applyShred(target, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(0); // Max shred is 0 for 0 armor
    });

    it('should use custom shredPerAttack from config', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      const target = createMockUnit({ armor: 20, armorShred: 0 });

      const result = processor.applyShred(target, CUSTOM_CONFIG);

      expect(result.armorShred).toBe(2); // Custom shredPerAttack
    });

    it('should use custom maxShredPercent from config', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      // 10 armor * 0.5 = max 5 shred
      const target = createMockUnit({ armor: 10, armorShred: 4 });

      const result = processor.applyShred(target, CUSTOM_CONFIG);

      expect(result.armorShred).toBe(5); // Custom max allows more shred
    });

    it('should not mutate original unit', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 10, armorShred: 0 });

      processor.applyShred(target, DEFAULT_CONFIG);

      expect(target.armorShred).toBe(0); // Original unchanged
    });

    it('should handle undefined armorShred as zero', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 10 });
      delete (target as Partial<UnitWithArmorShred>).armorShred;

      const result = processor.applyShred(target, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(DEFAULT_SHRED_PER_ATTACK);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // applyShredWithDetails() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('applyShredWithDetails()', () => {
    it('should return detailed result with shred applied', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 10, armorShred: 0 });

      const result = processor.applyShredWithDetails(target, DEFAULT_CONFIG);

      expect(result.shredApplied).toBe(1);
      expect(result.wasCapped).toBe(false);
      expect(result.newTotalShred).toBe(1);
      expect(result.maxShred).toBe(4); // 10 * 0.4
    });

    it('should indicate when shred was capped', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ armor: 10, armorShred: 4 });

      const result = processor.applyShredWithDetails(target, DEFAULT_CONFIG);

      expect(result.shredApplied).toBe(0);
      expect(result.wasCapped).toBe(true);
      expect(result.newTotalShred).toBe(4);
    });

    it('should show partial shred when approaching cap', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      // 10 armor * 0.5 = max 5 shred, currently at 4, shredPerAttack = 2
      const target = createMockUnit({ armor: 10, armorShred: 4 });

      const result = processor.applyShredWithDetails(target, CUSTOM_CONFIG);

      expect(result.shredApplied).toBe(1); // Only 1 applied (capped at 5)
      expect(result.wasCapped).toBe(true);
      expect(result.newTotalShred).toBe(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getEffectiveArmor() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getEffectiveArmor()', () => {
    it('should return base armor when no shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 0 });

      const effectiveArmor = processor.getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(10);
    });

    it('should reduce armor by shred amount', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      const effectiveArmor = processor.getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(7);
    });

    it('should not go below minimum effective armor (0)', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 5, armorShred: 10 });

      const effectiveArmor = processor.getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(MIN_EFFECTIVE_ARMOR);
    });

    it('should handle undefined armorShred as zero', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10 });
      delete (unit as Partial<UnitWithArmorShred>).armorShred;

      const effectiveArmor = processor.getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(10);
    });

    it('should handle undefined armor as zero', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armorShred: 5 });
      delete (unit as Partial<UnitWithArmorShred>).armor;

      const effectiveArmor = processor.getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getEffectiveArmorDetails() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getEffectiveArmorDetails()', () => {
    it('should return complete armor details', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      const details = processor.getEffectiveArmorDetails(unit, DEFAULT_CONFIG);

      expect(details.baseArmor).toBe(10);
      expect(details.currentShred).toBe(3);
      expect(details.effectiveArmor).toBe(7);
      expect(details.maxShred).toBe(4);
      expect(details.shredPercent).toBeCloseTo(0.3);
    });

    it('should calculate shred percent correctly', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 20, armorShred: 5 });

      const details = processor.getEffectiveArmorDetails(unit, DEFAULT_CONFIG);

      expect(details.shredPercent).toBeCloseTo(0.25); // 5/20
    });

    it('should handle zero armor without division error', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 0, armorShred: 0 });

      const details = processor.getEffectiveArmorDetails(unit, DEFAULT_CONFIG);

      expect(details.shredPercent).toBe(0);
      expect(details.maxShred).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getMaxShred() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getMaxShred()', () => {
    it('should calculate max shred based on armor and config', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10 });

      const maxShred = processor.getMaxShred(unit, DEFAULT_CONFIG);

      expect(maxShred).toBe(4); // 10 * 0.4
    });

    it('should floor the result', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 7 }); // 7 * 0.4 = 2.8

      const maxShred = processor.getMaxShred(unit, DEFAULT_CONFIG);

      expect(maxShred).toBe(2); // Floored
    });

    it('should use custom maxShredPercent', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      const unit = createMockUnit({ armor: 10 });

      const maxShred = processor.getMaxShred(unit, CUSTOM_CONFIG);

      expect(maxShred).toBe(5); // 10 * 0.5
    });

    it('should return zero for zero armor', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 0 });

      const maxShred = processor.getMaxShred(unit, DEFAULT_CONFIG);

      expect(maxShred).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // decayShred() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('decayShred()', () => {
    it('should not decay when decayPerTurn is 0', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      const result = processor.decayShred(unit, DEFAULT_CONFIG);

      expect(result.armorShred).toBe(3); // No decay
    });

    it('should decay shred by decayPerTurn amount', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      const result = processor.decayShred(unit, CUSTOM_CONFIG);

      expect(result.armorShred).toBe(2); // Decayed by 1
    });

    it('should not decay below zero', () => {
      const config: ShredConfig = { ...CUSTOM_CONFIG, decayPerTurn: 5 };
      const processor = createShredProcessor(config);
      const unit = createMockUnit({ armor: 10, armorShred: 2 });

      const result = processor.decayShred(unit, config);

      expect(result.armorShred).toBe(0);
    });

    it('should not decay when unit has no shred', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 0 });

      const result = processor.decayShred(unit, CUSTOM_CONFIG);

      expect(result.armorShred).toBe(0);
    });

    it('should not mutate original unit', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      processor.decayShred(unit, CUSTOM_CONFIG);

      expect(unit.armorShred).toBe(3); // Original unchanged
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // decayShredWithDetails() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('decayShredWithDetails()', () => {
    it('should return detailed decay result', () => {
      const processor = createShredProcessor(CUSTOM_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      const result = processor.decayShredWithDetails(unit, CUSTOM_CONFIG);

      expect(result.decayAmount).toBe(1);
      expect(result.previousShred).toBe(3);
      expect(result.newShred).toBe(2);
    });

    it('should show zero decay when no decay configured', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      const result = processor.decayShredWithDetails(unit, DEFAULT_CONFIG);

      expect(result.decayAmount).toBe(0);
      expect(result.previousShred).toBe(3);
      expect(result.newShred).toBe(3);
    });

    it('should show partial decay when approaching zero', () => {
      const config: ShredConfig = { ...CUSTOM_CONFIG, decayPerTurn: 5 };
      const processor = createShredProcessor(config);
      const unit = createMockUnit({ armor: 10, armorShred: 2 });

      const result = processor.decayShredWithDetails(unit, config);

      expect(result.decayAmount).toBe(2); // Only 2 decayed (not 5)
      expect(result.previousShred).toBe(2);
      expect(result.newShred).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // hasShred() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('hasShred()', () => {
    it('should return true when unit has shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armorShred: 3 });

      expect(processor.hasShred(unit)).toBe(true);
    });

    it('should return false when unit has no shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armorShred: 0 });

      expect(processor.hasShred(unit)).toBe(false);
    });

    it('should return false when armorShred is undefined', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit();
      delete (unit as Partial<UnitWithArmorShred>).armorShred;

      expect(processor.hasShred(unit)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // isAtMaxShred() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('isAtMaxShred()', () => {
    it('should return true when at max shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 4 }); // Max is 4

      expect(processor.isAtMaxShred(unit, DEFAULT_CONFIG)).toBe(true);
    });

    it('should return false when below max shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 3 });

      expect(processor.isAtMaxShred(unit, DEFAULT_CONFIG)).toBe(false);
    });

    it('should return true when above max shred (edge case)', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 10, armorShred: 5 }); // Above max

      expect(processor.isAtMaxShred(unit, DEFAULT_CONFIG)).toBe(true);
    });

    it('should return true for zero armor unit with zero shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armor: 0, armorShred: 0 });

      expect(processor.isAtMaxShred(unit, DEFAULT_CONFIG)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // resetShred() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('resetShred()', () => {
    it('should reset shred to zero', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armorShred: 5 });

      const result = processor.resetShred(unit);

      expect(result.armorShred).toBe(0);
    });

    it('should not mutate original unit', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armorShred: 5 });

      processor.resetShred(unit);

      expect(unit.armorShred).toBe(5); // Original unchanged
    });

    it('should handle unit with no shred', () => {
      const processor = createShredProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({ armorShred: 0 });

      const result = processor.resetShred(unit);

      expect(result.armorShred).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // apply() PHASE INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('apply()', () => {
    describe('attack phase', () => {
      it('should apply shred on physical attack', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const attacker = createMockUnit({ instanceId: 'attacker' });
        const target = createMockUnit({
          instanceId: 'target',
          armor: 10,
          armorShred: 0,
        });
        const state = createMockState([attacker, target]);

        const newState = processor.apply('attack', state, {
          activeUnit: attacker,
          target,
          action: { type: 'attack', targetId: 'target' },
          seed: 12345,
        });

        const updatedTarget = newState.units.find(
          u => u.instanceId === 'target',
        ) as BattleUnit & UnitWithArmorShred;
        expect(updatedTarget.armorShred).toBe(1);
      });

      it('should not apply shred when no target', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const attacker = createMockUnit({ instanceId: 'attacker' });
        const state = createMockState([attacker]);

        const newState = processor.apply('attack', state, {
          activeUnit: attacker,
          action: { type: 'attack', targetId: 'target' },
          seed: 12345,
        });

        expect(newState).toBe(state); // Unchanged
      });

      it('should not apply shred when action is not attack', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const attacker = createMockUnit({ instanceId: 'attacker' });
        const target = createMockUnit({
          instanceId: 'target',
          armor: 10,
          armorShred: 0,
        });
        const state = createMockState([attacker, target]);

        const newState = processor.apply('attack', state, {
          activeUnit: attacker,
          target,
          action: { type: 'ability', targetId: 'target' },
          seed: 12345,
        });

        expect(newState).toBe(state); // Unchanged
      });

      it('should not apply shred to dead units', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const attacker = createMockUnit({ instanceId: 'attacker' });
        const target = createMockUnit({
          instanceId: 'target',
          armor: 10,
          armorShred: 0,
          currentHp: 0,
          alive: false,
        });
        const state = createMockState([attacker, target]);

        const newState = processor.apply('attack', state, {
          activeUnit: attacker,
          target,
          action: { type: 'attack', targetId: 'target' },
          seed: 12345,
        });

        expect(newState).toBe(state); // Unchanged
      });

      it('should not apply shred to units with zero armor', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const attacker = createMockUnit({ instanceId: 'attacker' });
        const target = createMockUnit({
          instanceId: 'target',
          armor: 0,
          armorShred: 0,
        });
        const state = createMockState([attacker, target]);

        const newState = processor.apply('attack', state, {
          activeUnit: attacker,
          target,
          action: { type: 'attack', targetId: 'target' },
          seed: 12345,
        });

        expect(newState).toBe(state); // Unchanged
      });
    });

    describe('turn_end phase', () => {
      it('should decay shred when configured', () => {
        const processor = createShredProcessor(CUSTOM_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit',
          armor: 10,
          armorShred: 3,
        });
        const state = createMockState([unit]);

        const newState = processor.apply('turn_end', state, {
          activeUnit: unit,
          seed: 12345,
        });

        const updatedUnit = newState.units.find(
          u => u.instanceId === 'unit',
        ) as BattleUnit & UnitWithArmorShred;
        expect(updatedUnit.armorShred).toBe(2);
      });

      it('should not decay when decayPerTurn is 0', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit',
          armor: 10,
          armorShred: 3,
        });
        const state = createMockState([unit]);

        const newState = processor.apply('turn_end', state, {
          activeUnit: unit,
          seed: 12345,
        });

        expect(newState).toBe(state); // Unchanged
      });

      it('should decay shred on all units with shred', () => {
        const processor = createShredProcessor(CUSTOM_CONFIG);
        const unit1 = createMockUnit({
          id: 'unit1',
          instanceId: 'unit1',
          armor: 10,
          armorShred: 3,
        });
        const unit2 = createMockUnit({
          id: 'unit2',
          instanceId: 'unit2',
          armor: 10,
          armorShred: 2,
        });
        const unit3 = createMockUnit({
          id: 'unit3',
          instanceId: 'unit3',
          armor: 10,
          armorShred: 0, // No shred
        });
        const state = createMockState([unit1, unit2, unit3]);

        const newState = processor.apply('turn_end', state, {
          activeUnit: unit1,
          seed: 12345,
        });

        const updated1 = newState.units.find(
          u => u.id === 'unit1',
        ) as BattleUnit & UnitWithArmorShred;
        const updated2 = newState.units.find(
          u => u.id === 'unit2',
        ) as BattleUnit & UnitWithArmorShred;
        const updated3 = newState.units.find(
          u => u.id === 'unit3',
        ) as BattleUnit & UnitWithArmorShred;

        expect(updated1.armorShred).toBe(2);
        expect(updated2.armorShred).toBe(1);
        expect(updated3.armorShred).toBe(0);
      });
    });

    describe('other phases', () => {
      it('should return unchanged state for movement phase', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({ instanceId: 'unit' });
        const state = createMockState([unit]);

        const newState = processor.apply('movement', state, {
          activeUnit: unit,
          seed: 12345,
        });

        expect(newState).toBe(state);
      });

      it('should return unchanged state for turn_start phase', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({ instanceId: 'unit' });
        const state = createMockState([unit]);

        const newState = processor.apply('turn_start', state, {
          activeUnit: unit,
          seed: 12345,
        });

        expect(newState).toBe(state);
      });

      it('should return unchanged state for pre_attack phase', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({ instanceId: 'unit' });
        const state = createMockState([unit]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: unit,
          seed: 12345,
        });

        expect(newState).toBe(state);
      });

      it('should return unchanged state for post_attack phase', () => {
        const processor = createShredProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({ instanceId: 'unit' });
        const state = createMockState([unit]);

        const newState = processor.apply('post_attack', state, {
          activeUnit: unit,
          seed: 12345,
        });

        expect(newState).toBe(state);
      });
    });
  });

});
