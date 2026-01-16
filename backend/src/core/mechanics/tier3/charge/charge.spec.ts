/**
 * Tier 3: Charge Processor Tests
 *
 * Tests for the charge (cavalry momentum) system.
 * Validates momentum calculation, damage bonuses, Spear Wall counters,
 * and phase integration.
 *
 * @module core/mechanics/tier3/charge
 */

import { createChargeProcessor } from './charge.processor';
import { createTestUnit, createTestBattleState } from '../../test-fixtures';
import type { ChargeConfig } from '../../config/mechanics.types';
import type { BattleUnit } from '../../../types';
import type { UnitWithCharge } from './charge.types';
import { SPEAR_WALL_TAG, CAVALRY_TAG, CHARGE_TAG } from './charge.types';

// ═══════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ChargeConfig = {
  momentumPerCell: 0.2,
  maxMomentum: 1.0,
  shockResolveDamage: 10,
  minChargeDistance: 3,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a test unit with charge properties.
 */
function createChargeUnit(
  overrides: Partial<BattleUnit & UnitWithCharge> = {},
): BattleUnit & UnitWithCharge {
  const unit = createTestUnit({
    id: overrides.id ?? 'charge-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    stats: {
      hp: 100,
      atk: 20,
      atkCount: 1,
      armor: 5,
      speed: 5,
      initiative: 7,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 100,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  const result: BattleUnit & UnitWithCharge = {
    ...unit,
    canCharge: overrides.canCharge ?? true,
    momentum: overrides.momentum ?? 0,
    isCharging: overrides.isCharging ?? false,
    chargeDistance: overrides.chargeDistance ?? 0,
    tags: overrides.tags ?? [CAVALRY_TAG, CHARGE_TAG],
    atk: overrides.atk ?? unit.stats?.atk ?? 20,
    resolve: overrides.resolve ?? 100,
  };

  // Set hasSpearWall if provided
  if (overrides.hasSpearWall !== undefined) {
    result.hasSpearWall = overrides.hasSpearWall;
  }

  // Set chargeCountered if provided
  if (overrides.chargeCountered !== undefined) {
    result.chargeCountered = overrides.chargeCountered;
  }

  return result;
}

/**
 * Creates a spearman unit with Spear Wall capability.
 */
function createSpearmanUnit(
  overrides: Partial<BattleUnit & UnitWithCharge> = {},
): BattleUnit & UnitWithCharge {
  const unit = createTestUnit({
    id: overrides.id ?? 'spearman-unit',
    position: overrides.position ?? { x: 5, y: 5 },
    team: overrides.team ?? 'bot',
    stats: {
      hp: 80,
      atk: 15,
      atkCount: 1,
      armor: 3,
      speed: 3,
      initiative: 5,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 80,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  return {
    ...unit,
    hasSpearWall: true,
    tags: overrides.tags ?? [SPEAR_WALL_TAG],
    atk: overrides.atk ?? unit.stats?.atk ?? 15,
    resolve: overrides.resolve ?? 100,
  } as BattleUnit & UnitWithCharge;
}

// ═══════════════════════════════════════════════════════════════
// CALCULATE MOMENTUM TESTS
// ═══════════════════════════════════════════════════════════════

describe('ChargeProcessor', () => {
  describe('calculateMomentum', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should return 0 momentum when distance is below minimum', () => {
      // Distance 0 - no movement
      expect(processor.calculateMomentum(0, DEFAULT_CONFIG)).toBe(0);
      
      // Distance 1 - below minimum (3)
      expect(processor.calculateMomentum(1, DEFAULT_CONFIG)).toBe(0);
      
      // Distance 2 - still below minimum
      expect(processor.calculateMomentum(2, DEFAULT_CONFIG)).toBe(0);
    });

    it('should calculate momentum correctly at minimum distance', () => {
      // Distance 3 (minimum) = 3 * 0.2 = 0.6
      const momentum = processor.calculateMomentum(3, DEFAULT_CONFIG);
      expect(momentum).toBeCloseTo(0.6);
    });

    it('should calculate momentum correctly above minimum distance', () => {
      // Distance 4 = 4 * 0.2 = 0.8
      expect(processor.calculateMomentum(4, DEFAULT_CONFIG)).toBe(0.8);
    });

    it('should cap momentum at maxMomentum', () => {
      // Distance 5 = 5 * 0.2 = 1.0 (at cap)
      expect(processor.calculateMomentum(5, DEFAULT_CONFIG)).toBe(1.0);
      
      // Distance 6 = 6 * 0.2 = 1.2, but capped at 1.0
      expect(processor.calculateMomentum(6, DEFAULT_CONFIG)).toBe(1.0);
      
      // Distance 10 = 10 * 0.2 = 2.0, but capped at 1.0
      expect(processor.calculateMomentum(10, DEFAULT_CONFIG)).toBe(1.0);
    });

    it('should work with custom config values', () => {
      const customConfig: ChargeConfig = {
        momentumPerCell: 0.3,
        maxMomentum: 1.5,
        shockResolveDamage: 15,
        minChargeDistance: 2,
      };

      // Distance 1 - below minimum (2)
      expect(processor.calculateMomentum(1, customConfig)).toBe(0);
      
      // Distance 2 (minimum) = 2 * 0.3 = 0.6
      expect(processor.calculateMomentum(2, customConfig)).toBe(0.6);
      
      // Distance 4 = 4 * 0.3 = 1.2
      expect(processor.calculateMomentum(4, customConfig)).toBe(1.2);
      
      // Distance 6 = 6 * 0.3 = 1.8, but capped at 1.5
      expect(processor.calculateMomentum(6, customConfig)).toBe(1.5);
    });

    it('should handle edge case of minChargeDistance = 0', () => {
      const zeroMinConfig: ChargeConfig = {
        ...DEFAULT_CONFIG,
        minChargeDistance: 0,
      };

      // Distance 0 should still give 0 momentum (0 * 0.2 = 0)
      expect(processor.calculateMomentum(0, zeroMinConfig)).toBe(0);
      
      // Distance 1 = 1 * 0.2 = 0.2
      expect(processor.calculateMomentum(1, zeroMinConfig)).toBe(0.2);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // APPLY CHARGE BONUS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('applyChargeBonus', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should return base damage when momentum is 0', () => {
      expect(processor.applyChargeBonus(20, 0)).toBe(20);
    });

    it('should apply momentum bonus correctly', () => {
      // 20 * (1 + 0.6) = 20 * 1.6 = 32
      expect(processor.applyChargeBonus(20, 0.6)).toBe(32);
      
      // 20 * (1 + 1.0) = 20 * 2.0 = 40
      expect(processor.applyChargeBonus(20, 1.0)).toBe(40);
    });

    it('should floor the result', () => {
      // 15 * (1 + 0.8) = 15 * 1.8 = 27
      expect(processor.applyChargeBonus(15, 0.8)).toBe(27);
      
      // 17 * (1 + 0.3) = 17 * 1.3 = 22.1 -> 22
      expect(processor.applyChargeBonus(17, 0.3)).toBe(22);
    });

    it('should handle zero base damage', () => {
      const damage = processor.applyChargeBonus(0, 1.0);
      expect(damage).toBe(0);
    });

    it('should handle very high base damage', () => {
      // baseDamage = 100, momentum = 1.0
      // totalDamage = floor(100 * 2.0) = 200
      const damage = processor.applyChargeBonus(100, 1.0);
      expect(damage).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SPEAR WALL COUNTER TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('isCounteredBySpearWall', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should return true for units with Spear Wall tag', () => {
      const spearman = createSpearmanUnit();
      expect(processor.isCounteredBySpearWall(spearman)).toBe(true);
    });

    it('should return true for units with hasSpearWall property', () => {
      const unit = createChargeUnit({ hasSpearWall: true, tags: [], canCharge: false });
      expect(processor.isCounteredBySpearWall(unit)).toBe(true);
    });

    it('should return false for units without Spear Wall', () => {
      const cavalry = createChargeUnit();
      expect(processor.isCounteredBySpearWall(cavalry)).toBe(false);
    });

    it('should return false for unit with empty tags', () => {
      const unit = createChargeUnit({ tags: [] });
      expect(processor.isCounteredBySpearWall(unit)).toBe(false);
    });
  });

  describe('calculateCounterDamage', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should calculate counter damage with 1.5x multiplier', () => {
      const spearman = createSpearmanUnit({ atk: 20 });
      // 20 * 1.5 = 30
      expect(processor.calculateCounterDamage(spearman)).toBe(30);
    });

    it('should floor the result', () => {
      const spearman = createSpearmanUnit({ atk: 15 });
      // 15 * 1.5 = 22.5 -> 22
      expect(processor.calculateCounterDamage(spearman)).toBe(22);
    });

    it('should handle zero attack', () => {
      const spearman = createSpearmanUnit({ atk: 0 });
      const damage = processor.calculateCounterDamage(spearman);
      expect(damage).toBe(0);
    });

    it('should use stats.atk as fallback', () => {
      const spearman = createSpearmanUnit({
        stats: { hp: 100, atk: 12, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
      });
      // Remove top-level atk to force fallback
      delete (spearman as Partial<BattleUnit & UnitWithCharge>).atk;

      // counterDamage = floor(12 * 1.5) = 18
      const damage = processor.calculateCounterDamage(spearman);
      expect(damage).toBe(18);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // CAN CHARGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('canCharge', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should return false for units without charge capability', () => {
      const infantry = createChargeUnit({ canCharge: false, tags: [] });
      const result = processor.canCharge(infantry, 5, DEFAULT_CONFIG);
      
      expect(result.canCharge).toBe(false);
      expect(result.reason).toBe('no_charge_ability');
    });

    it('should return false for insufficient distance', () => {
      const cavalry = createChargeUnit();
      const result = processor.canCharge(cavalry, 2, DEFAULT_CONFIG);
      
      expect(result.canCharge).toBe(false);
      expect(result.reason).toBe('insufficient_distance');
    });

    it('should return false for countered units', () => {
      const cavalry = createChargeUnit({ chargeCountered: true });
      const result = processor.canCharge(cavalry, 5, DEFAULT_CONFIG);
      
      expect(result.canCharge).toBe(false);
      expect(result.reason).toBe('countered');
    });

    it('should return true with momentum for valid charge', () => {
      const cavalry = createChargeUnit();
      const result = processor.canCharge(cavalry, 4, DEFAULT_CONFIG);
      
      expect(result.canCharge).toBe(true);
      expect(result.momentum).toBe(0.8);
      expect(result.distance).toBe(4);
    });

    it('should allow charge for unit with cavalry tag', () => {
      const cavalry = createChargeUnit({ tags: [CAVALRY_TAG, CHARGE_TAG] });
      const result = processor.canCharge(cavalry, 5, DEFAULT_CONFIG);

      expect(result.canCharge).toBe(true);
      expect(result.momentum).toBe(1.0);
    });

    it('should allow charge when distance equals minimum', () => {
      const cavalry = createChargeUnit();
      const result = processor.canCharge(cavalry, 3, DEFAULT_CONFIG);

      expect(result.canCharge).toBe(true);
      expect(result.momentum).toBeCloseTo(0.6);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TRACK MOVEMENT TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('trackMovement', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should track distance from path length', () => {
      const cavalry = createChargeUnit();
      const path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ];
      
      const result = processor.trackMovement(cavalry, path, DEFAULT_CONFIG);
      
      // Path length 4 means 3 cells moved (path includes start)
      expect(result.chargeDistance).toBe(3);
      expect(result.momentum).toBeCloseTo(0.6);
      expect(result.isCharging).toBe(true);
    });

    it('should not set charging for short distances', () => {
      const cavalry = createChargeUnit();
      const path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];
      
      const result = processor.trackMovement(cavalry, path, DEFAULT_CONFIG);
      
      expect(result.chargeDistance).toBe(1);
      expect(result.momentum).toBe(0);
      expect(result.isCharging).toBe(false);
    });

    it('should handle empty path', () => {
      const cavalry = createChargeUnit();
      const result = processor.trackMovement(cavalry, [], DEFAULT_CONFIG);
      
      expect(result.chargeDistance).toBe(0);
      expect(result.momentum).toBe(0);
      expect(result.isCharging).toBe(false);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // RESET CHARGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('resetCharge', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should reset all charge-related properties', () => {
      const cavalry = createChargeUnit({
        momentum: 0.8,
        isCharging: true,
        chargeDistance: 4,
        chargeCountered: true,
        chargeStartPosition: { x: 0, y: 0 },
      });
      
      const result = processor.resetCharge(cavalry);
      
      expect(result.momentum).toBe(0);
      expect(result.isCharging).toBe(false);
      expect(result.chargeDistance).toBe(0);
      expect(result.chargeCountered).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EXECUTE CHARGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('executeCharge', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should apply charge damage and shock to target', () => {
      const cavalry = createChargeUnit({ momentum: 0.6 });
      const target = createChargeUnit({
        id: 'target',
        team: 'bot',
        currentHp: 100,
        resolve: 100,
      });
      const state = createTestBattleState([cavalry, target]);
      
      const result = processor.executeCharge(cavalry, target, state, DEFAULT_CONFIG, 12345);
      
      expect(result.success).toBe(true);
      expect(result.wasCountered).toBe(false);
      // 20 * (1 + 0.6) = 32 damage
      expect(result.damage).toBe(32);
      expect(result.targetNewHp).toBe(68); // 100 - 32
      expect(result.shockDamage).toBe(10);
      expect(result.targetNewResolve).toBe(90); // 100 - 10
    });

    it('should be countered by Spear Wall', () => {
      const cavalry = createChargeUnit({ momentum: 0.8, currentHp: 100 });
      const spearman = createSpearmanUnit({ currentHp: 80 });
      const state = createTestBattleState([cavalry, spearman]);
      
      const result = processor.executeCharge(cavalry, spearman, state, DEFAULT_CONFIG, 12345);
      
      expect(result.success).toBe(false);
      expect(result.wasCountered).toBe(true);
      expect(result.counterResult?.isCountered).toBe(true);
      // Spearman atk 15 * 1.5 = 22 counter damage
      expect(result.counterResult?.counterDamage).toBe(22);
    });

    it('should deal counter damage to charger', () => {
      const cavalry = createChargeUnit({ momentum: 0.8, currentHp: 100 });
      const spearman = createSpearmanUnit({ atk: 20, currentHp: 100 });
      const state = createTestBattleState([cavalry, spearman]);

      const result = processor.executeCharge(cavalry, spearman, state, DEFAULT_CONFIG, 12345);

      // counterDamage = floor(20 * 1.5) = 30
      expect(result.counterResult?.counterDamage).toBe(30);
      const updatedCavalry = result.state.units.find(u => u.id === 'charge-unit');
      expect(updatedCavalry?.currentHp).toBe(70); // 100 - 30
    });

    it('should reset charger momentum after attack', () => {
      const cavalry = createChargeUnit({ momentum: 0.8 });
      const target = createChargeUnit({ id: 'target', team: 'bot', currentHp: 100 });
      const state = createTestBattleState([cavalry, target]);

      const result = processor.executeCharge(cavalry, target, state, DEFAULT_CONFIG, 12345);

      const updatedCavalry = result.state.units.find(u => u.id === 'charge-unit') as BattleUnit & UnitWithCharge;
      expect(updatedCavalry.momentum).toBe(0);
      expect(updatedCavalry.isCharging).toBe(false);
    });

    it('should kill target when HP reaches 0', () => {
      const cavalry = createChargeUnit({ atk: 50, momentum: 1.0 });
      const target = createChargeUnit({ id: 'target', team: 'bot', currentHp: 50 });
      const state = createTestBattleState([cavalry, target]);

      // damage = floor(50 * 2.0) = 100, target HP = 50
      const result = processor.executeCharge(cavalry, target, state, DEFAULT_CONFIG, 12345);

      expect(result.targetNewHp).toBe(0);
      const updatedTarget = result.state.units.find(u => u.id === 'target');
      expect(updatedTarget?.alive).toBe(false);
    });

    it('should reset charger momentum when countered', () => {
      const cavalry = createChargeUnit({ momentum: 0.8, currentHp: 100 });
      const spearman = createSpearmanUnit({ atk: 20, currentHp: 100 });
      const state = createTestBattleState([cavalry, spearman]);

      const result = processor.executeCharge(cavalry, spearman, state, DEFAULT_CONFIG, 12345);

      const updatedCavalry = result.state.units.find(u => u.id === 'charge-unit') as BattleUnit & UnitWithCharge;
      expect(updatedCavalry.momentum).toBe(0);
      expect(updatedCavalry.chargeCountered).toBe(true);
    });

    it('should kill charger if counter damage exceeds HP', () => {
      const cavalry = createChargeUnit({ momentum: 0.8, currentHp: 20 });
      const spearman = createSpearmanUnit({ atk: 30, currentHp: 100 });
      const state = createTestBattleState([cavalry, spearman]);

      // counterDamage = floor(30 * 1.5) = 45, cavalry HP = 20
      const result = processor.executeCharge(cavalry, spearman, state, DEFAULT_CONFIG, 12345);

      const updatedCavalry = result.state.units.find(u => u.id === 'charge-unit');
      expect(updatedCavalry?.currentHp).toBe(0);
      expect(updatedCavalry?.alive).toBe(false);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PHASE INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('apply (phase integration)', () => {
    const processor = createChargeProcessor(DEFAULT_CONFIG);

    it('should reset charge state at turn_start', () => {
      const cavalry = createChargeUnit({
        momentum: 0.8,
        isCharging: true,
        chargeDistance: 4,
      });
      const state = createTestBattleState([cavalry]);
      
      const result = processor.apply('turn_start', state, {
        activeUnit: cavalry,
        seed: 12345,
      });
      
      const updatedUnit = result.units.find(u => u.id === cavalry.id) as BattleUnit & UnitWithCharge;
      expect(updatedUnit.momentum).toBe(0);
      expect(updatedUnit.isCharging).toBe(false);
      expect(updatedUnit.chargeDistance).toBe(0);
    });

    it('should track movement during movement phase', () => {
      const cavalry = createChargeUnit();
      const state = createTestBattleState([cavalry]);
      const path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ];
      
      const result = processor.apply('movement', state, {
        activeUnit: cavalry,
        action: { type: 'move', path },
        seed: 12345,
      });
      
      const updatedUnit = result.units.find(u => u.id === cavalry.id) as BattleUnit & UnitWithCharge;
      expect(updatedUnit.chargeDistance).toBe(4);
      expect(updatedUnit.momentum).toBe(0.8);
      expect(updatedUnit.isCharging).toBe(true);
    });

    it('should reset momentum at turn_end', () => {
      const cavalry = createChargeUnit({
        momentum: 0.8,
        isCharging: true,
      });
      const state = createTestBattleState([cavalry]);
      
      const result = processor.apply('turn_end', state, {
        activeUnit: cavalry,
        seed: 12345,
      });
      
      const updatedUnit = result.units.find(u => u.id === cavalry.id) as BattleUnit & UnitWithCharge;
      expect(updatedUnit.momentum).toBe(0);
      expect(updatedUnit.isCharging).toBe(false);
    });

    it('should apply counter damage during pre_attack phase when charging into spearman', () => {
      const cavalry = createChargeUnit({ momentum: 0.6, currentHp: 100 });
      const spearman = createSpearmanUnit({ atk: 20, currentHp: 80 });
      const state = createTestBattleState([cavalry, spearman]);
      
      const result = processor.apply('pre_attack', state, {
        activeUnit: cavalry,
        target: spearman,
        seed: 12345,
      });
      
      const updatedCavalry = result.units.find(u => u.id === cavalry.id) as BattleUnit & UnitWithCharge;
      // counterDamage = floor(20 * 1.5) = 30
      expect(updatedCavalry.currentHp).toBe(70); // 100 - 30
      expect(updatedCavalry.momentum).toBe(0);
      expect(updatedCavalry.chargeCountered).toBe(true);
    });

    it('should not apply counter when not charging (momentum = 0)', () => {
      const cavalry = createChargeUnit({ momentum: 0, currentHp: 100 });
      const spearman = createSpearmanUnit({ atk: 20, currentHp: 80 });
      const state = createTestBattleState([cavalry, spearman]);
      
      const result = processor.apply('pre_attack', state, {
        activeUnit: cavalry,
        target: spearman,
        seed: 12345,
      });
      
      const updatedCavalry = result.units.find(u => u.id === cavalry.id) as BattleUnit & UnitWithCharge;
      // No counter damage since not charging
      expect(updatedCavalry.currentHp).toBe(100);
    });
  });
});
