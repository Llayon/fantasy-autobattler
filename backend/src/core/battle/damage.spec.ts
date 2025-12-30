/**
 * Unit tests for core damage calculation system.
 * Tests physical/magic damage, dodge mechanics, and edge cases.
 * Uses minimal DamageUnit interface instead of game-specific BattleUnit.
 *
 * @module core/battle/damage.spec
 */

import {
  calculatePhysicalDamage,
  calculateMagicDamage,
  rollDodge,
  applyDamage,
  applyHealing,
  resolvePhysicalAttack,
  resolveMagicAttack,
  calculateArmorReduction,
  canSurviveDamage,
  calculateLethalDamage,
  getEffectiveArmor,
  DamageUnit,
  DEFAULT_BATTLE_CONFIG,
} from './damage';
import type { BattleConfig } from '../types/config.types';

describe('Damage System (Core)', () => {
  // Helper function to create a mock unit using minimal DamageUnit interface
  const createMockUnit = (
    stats: Partial<DamageUnit['stats']> = {},
    currentHp: number = 100,
    maxHp: number = 100,
    armorShred?: number
  ): DamageUnit => {
    const unit: DamageUnit = {
      stats: {
        atk: 10,
        atkCount: 1,
        armor: 0,
        dodge: 0,
        ...stats,
      },
      currentHp,
      maxHp,
    };
    // Only add armorShred if it's defined (to satisfy exactOptionalPropertyTypes)
    if (armorShred !== undefined) {
      unit.armorShred = armorShred;
    }
    return unit;
  };

  describe('calculatePhysicalDamage', () => {
    it('should calculate basic physical damage', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5 });

      const damage = calculatePhysicalDamage(attacker, target);

      // (15 - 5) * 1 = 10
      expect(damage).toBe(10);
    });

    it('should apply minimum damage of 1', () => {
      const attacker = createMockUnit({ atk: 5, atkCount: 1 });
      const target = createMockUnit({ armor: 10 }); // More armor than attack

      const damage = calculatePhysicalDamage(attacker, target);

      // max(1, (5 - 10) * 1) = max(1, -5) = 1
      expect(damage).toBe(1);
    });

    it('should handle multiple attacks', () => {
      const attacker = createMockUnit({ atk: 8, atkCount: 2 });
      const target = createMockUnit({ armor: 3 });

      const damage = calculatePhysicalDamage(attacker, target);

      // (8 - 3) * 2 = 10
      expect(damage).toBe(10);
    });

    it('should handle zero armor', () => {
      const attacker = createMockUnit({ atk: 12, atkCount: 1 });
      const target = createMockUnit({ armor: 0 });

      const damage = calculatePhysicalDamage(attacker, target);

      // (12 - 0) * 1 = 12
      expect(damage).toBe(12);
    });

    it('should handle high armor with multiple attacks', () => {
      const attacker = createMockUnit({ atk: 3, atkCount: 3 });
      const target = createMockUnit({ armor: 5 });

      const damage = calculatePhysicalDamage(attacker, target);

      // max(1, (3 - 5) * 3) = max(1, -6) = 1
      expect(damage).toBe(1);
    });

    it('should respect custom minDamage config', () => {
      const attacker = createMockUnit({ atk: 5, atkCount: 1 });
      const target = createMockUnit({ armor: 10 });
      const customConfig: BattleConfig = { ...DEFAULT_BATTLE_CONFIG, minDamage: 5 };

      const damage = calculatePhysicalDamage(attacker, target, customConfig);

      expect(damage).toBe(5); // Custom minimum
    });

    it('should use effective armor when target has armor shred', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 10 }, 100, 100, 4); // 4 armor shred

      const damage = calculatePhysicalDamage(attacker, target);

      // Effective armor = 10 - 4 = 6
      // Damage = (15 - 6) * 1 = 9
      expect(damage).toBe(9);
    });

    it('should handle full armor shred (armor reduced to 0)', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5 }, 100, 100, 5); // Full shred

      const damage = calculatePhysicalDamage(attacker, target);

      // Effective armor = 5 - 5 = 0
      // Damage = (15 - 0) * 1 = 15
      expect(damage).toBe(15);
    });

    it('should handle over-shred (shred > armor)', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5 }, 100, 100, 10); // Over-shred

      const damage = calculatePhysicalDamage(attacker, target);

      // Effective armor = max(0, 5 - 10) = 0
      // Damage = (15 - 0) * 1 = 15
      expect(damage).toBe(15);
    });

    it('should be backward compatible when armorShred is undefined', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5 }); // No armorShred

      const damage = calculatePhysicalDamage(attacker, target);

      // Should behave exactly as before: (15 - 5) * 1 = 10
      expect(damage).toBe(10);
    });
  });

  describe('calculateMagicDamage', () => {
    it('should calculate basic magic damage', () => {
      const attacker = createMockUnit({ atk: 20, atkCount: 1 });
      const target = createMockUnit({ armor: 10 }); // Armor ignored

      const damage = calculateMagicDamage(attacker, target);

      // 20 * 1 = 20 (armor ignored)
      expect(damage).toBe(20);
    });

    it('should ignore armor completely', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const lowArmor = createMockUnit({ armor: 2 });
      const highArmor = createMockUnit({ armor: 20 });

      const damage1 = calculateMagicDamage(attacker, lowArmor);
      const damage2 = calculateMagicDamage(attacker, highArmor);

      // Both should be the same since armor is ignored
      expect(damage1).toBe(15);
      expect(damage2).toBe(15);
    });

    it('should handle multiple magic attacks', () => {
      const attacker = createMockUnit({ atk: 12, atkCount: 2 });
      const target = createMockUnit({ armor: 5 });

      const damage = calculateMagicDamage(attacker, target);

      // 12 * 2 = 24 (armor ignored)
      expect(damage).toBe(24);
    });
  });

  describe('getEffectiveArmor', () => {
    it('should return base armor when no shred', () => {
      const unit = createMockUnit({ armor: 10 });

      const effectiveArmor = getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(10);
    });

    it('should reduce armor by shred amount', () => {
      const unit = createMockUnit({ armor: 10 }, 100, 100, 3);

      const effectiveArmor = getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(7); // 10 - 3
    });

    it('should not go below 0', () => {
      const unit = createMockUnit({ armor: 5 }, 100, 100, 10);

      const effectiveArmor = getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(0); // max(0, 5 - 10)
    });

    it('should handle zero armor', () => {
      const unit = createMockUnit({ armor: 0 }, 100, 100, 5);

      const effectiveArmor = getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(0);
    });

    it('should handle undefined armorShred', () => {
      const unit = createMockUnit({ armor: 8 });

      const effectiveArmor = getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(8);
    });

    it('should handle zero armorShred', () => {
      const unit = createMockUnit({ armor: 8 }, 100, 100, 0);

      const effectiveArmor = getEffectiveArmor(unit);

      expect(effectiveArmor).toBe(8);
    });
  });

  describe('rollDodge', () => {
    it('should be deterministic with same seed', () => {
      const unit = createMockUnit({ dodge: 50 }); // 50% dodge
      const seed = 12345;

      const result1 = rollDodge(unit, seed);
      const result2 = rollDodge(unit, seed);

      expect(result1).toBe(result2);
    });

    it('should produce different results with different seeds', () => {
      const unit = createMockUnit({ dodge: 50 }); // 50% dodge

      const results = [];
      for (let i = 1; i <= 20; i++) {
        results.push(rollDodge(unit, i * 1000)); // Use more varied seeds
      }

      // Should have some variation (not all true or all false)
      const trueCount = results.filter((r) => r).length;
      expect(trueCount).toBeGreaterThan(0);
      expect(trueCount).toBeLessThan(20);
    });

    it('should never dodge with 0% dodge chance', () => {
      const unit = createMockUnit({ dodge: 0 });

      for (let i = 0; i < 100; i++) {
        expect(rollDodge(unit, i)).toBe(false);
      }
    });

    it('should handle 100% dodge chance', () => {
      const unit = createMockUnit({ dodge: 100 });

      // Test multiple seeds - should always dodge
      for (let i = 0; i < 10; i++) {
        expect(rollDodge(unit, i)).toBe(true);
      }
    });

    it('should handle edge case dodge values', () => {
      const unit10 = createMockUnit({ dodge: 10 }); // 10% dodge
      const unit90 = createMockUnit({ dodge: 90 }); // 90% dodge

      // Test that they can produce both results with different seeds
      let dodged10 = false;
      let hit10 = false;
      let dodged90 = false;
      let hit90 = false;

      for (let i = 1; i <= 100; i++) {
        if (rollDodge(unit10, i * 123)) dodged10 = true;
        else hit10 = true;

        if (rollDodge(unit90, i * 456)) dodged90 = true;
        else hit90 = true;
      }

      // 10% dodge should mostly hit but occasionally dodge
      expect(hit10).toBe(true);
      expect(dodged10).toBe(true);

      // 90% dodge should mostly dodge but occasionally hit
      expect(dodged90).toBe(true);
      expect(hit90).toBe(true);
    });
  });

  describe('applyDamage', () => {
    it('should apply normal damage', () => {
      const unit = createMockUnit({}, 50, 100);

      const result = applyDamage(unit, 20);

      expect(result.newHp).toBe(30);
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle lethal damage', () => {
      const unit = createMockUnit({}, 25, 100);

      const result = applyDamage(unit, 25);

      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(0);
    });

    it('should handle overkill damage', () => {
      const unit = createMockUnit({}, 15, 100);

      const result = applyDamage(unit, 25);

      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(10); // 25 - 15 = 10 overkill
    });

    it('should not mutate input unit', () => {
      const unit = createMockUnit({}, 50, 100);
      const originalHp = unit.currentHp;

      applyDamage(unit, 20);

      expect(unit.currentHp).toBe(originalHp); // Should not be mutated
    });

    it('should handle zero damage', () => {
      const unit = createMockUnit({}, 50, 100);

      const result = applyDamage(unit, 0);

      expect(result.newHp).toBe(50);
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });
  });

  describe('applyHealing', () => {
    it('should apply normal healing', () => {
      const unit = createMockUnit({}, 30, 100);

      const result = applyHealing(unit, 20);

      expect(result.newHp).toBe(50);
      expect(result.overheal).toBe(0);
    });

    it('should cap healing at max HP', () => {
      const unit = createMockUnit({}, 80, 100);

      const result = applyHealing(unit, 30);

      expect(result.newHp).toBe(100);
      expect(result.overheal).toBe(10); // 30 - 20 = 10 overheal
    });

    it('should handle healing at full HP', () => {
      const unit = createMockUnit({}, 100, 100);

      const result = applyHealing(unit, 25);

      expect(result.newHp).toBe(100);
      expect(result.overheal).toBe(25);
    });

    it('should not mutate input unit', () => {
      const unit = createMockUnit({}, 50, 100);
      const originalHp = unit.currentHp;

      applyHealing(unit, 20);

      expect(unit.currentHp).toBe(originalHp); // Should not be mutated
    });
  });

  describe('resolvePhysicalAttack', () => {
    it('should resolve successful physical attack', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5, dodge: 0 }, 50, 100);

      const result = resolvePhysicalAttack(attacker, target, 12345);

      expect(result.damage).toBe(10); // (15 - 5) * 1
      expect(result.dodged).toBe(false);
      expect(result.newHp).toBe(40); // 50 - 10
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle dodged attack', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5, dodge: 100 }, 50, 100); // 100% dodge

      const result = resolvePhysicalAttack(attacker, target, 12345);

      expect(result.damage).toBe(0);
      expect(result.dodged).toBe(true);
      expect(result.newHp).toBe(50); // No damage taken
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle lethal physical attack', () => {
      const attacker = createMockUnit({ atk: 20, atkCount: 1 });
      const target = createMockUnit({ armor: 0, dodge: 0 }, 15, 100);

      const result = resolvePhysicalAttack(attacker, target, 12345);

      expect(result.damage).toBe(20);
      expect(result.dodged).toBe(false);
      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(5); // 20 - 15 = 5 overkill
    });

    it('should use effective armor when target has armor shred', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 10, dodge: 0 }, 50, 100, 4); // 4 armor shred

      const result = resolvePhysicalAttack(attacker, target, 12345);

      // Effective armor = 10 - 4 = 6
      // Damage = (15 - 6) * 1 = 9
      expect(result.damage).toBe(9);
      expect(result.dodged).toBe(false);
      expect(result.newHp).toBe(41); // 50 - 9
      expect(result.killed).toBe(false);
    });
  });

  describe('resolveMagicAttack', () => {
    it('should resolve magic attack ignoring armor', () => {
      const attacker = createMockUnit({ atk: 25, atkCount: 1 });
      const target = createMockUnit({ armor: 10 }, 50, 100); // Armor ignored

      const result = resolveMagicAttack(attacker, target);

      expect(result.damage).toBe(25); // Armor ignored
      expect(result.newHp).toBe(25); // 50 - 25
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle lethal magic attack', () => {
      const attacker = createMockUnit({ atk: 30, atkCount: 1 });
      const target = createMockUnit({ armor: 5 }, 20, 100);

      const result = resolveMagicAttack(attacker, target);

      expect(result.damage).toBe(30);
      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(10); // 30 - 20 = 10 overkill
    });
  });

  describe('calculateArmorReduction', () => {
    it('should calculate normal armor reduction', () => {
      const result = calculateArmorReduction(5, 12);

      expect(result.reducedDamage).toBe(7); // max(1, 12 - 5)
      expect(result.damageBlocked).toBe(5);
    });

    it('should respect minimum damage', () => {
      const result = calculateArmorReduction(15, 10);

      expect(result.reducedDamage).toBe(1); // Minimum damage
      expect(result.damageBlocked).toBe(9); // 10 - 1 = 9 blocked
    });

    it('should handle zero armor', () => {
      const result = calculateArmorReduction(0, 10);

      expect(result.reducedDamage).toBe(10);
      expect(result.damageBlocked).toBe(0);
    });

    it('should account for armor shred', () => {
      const result = calculateArmorReduction(10, 15, DEFAULT_BATTLE_CONFIG, 4);

      // Effective armor = 10 - 4 = 6
      expect(result.reducedDamage).toBe(9); // max(1, 15 - 6)
      expect(result.damageBlocked).toBe(6);
    });

    it('should handle full armor shred', () => {
      const result = calculateArmorReduction(8, 12, DEFAULT_BATTLE_CONFIG, 8);

      // Effective armor = 8 - 8 = 0
      expect(result.reducedDamage).toBe(12);
      expect(result.damageBlocked).toBe(0);
    });

    it('should handle over-shred', () => {
      const result = calculateArmorReduction(5, 10, DEFAULT_BATTLE_CONFIG, 10);

      // Effective armor = max(0, 5 - 10) = 0
      expect(result.reducedDamage).toBe(10);
      expect(result.damageBlocked).toBe(0);
    });

    it('should be backward compatible without shred parameter', () => {
      const result = calculateArmorReduction(5, 12);

      expect(result.reducedDamage).toBe(7);
      expect(result.damageBlocked).toBe(5);
    });
  });

  describe('canSurviveDamage', () => {
    it('should return true when unit survives', () => {
      const unit = createMockUnit({}, 25, 100);

      expect(canSurviveDamage(unit, 20)).toBe(true);
      expect(canSurviveDamage(unit, 24)).toBe(true);
    });

    it('should return false when unit dies', () => {
      const unit = createMockUnit({}, 25, 100);

      expect(canSurviveDamage(unit, 25)).toBe(false);
      expect(canSurviveDamage(unit, 30)).toBe(false);
    });
  });

  describe('calculateLethalDamage', () => {
    it('should return current HP as lethal damage', () => {
      const unit1 = createMockUnit({}, 45, 100);
      const unit2 = createMockUnit({}, 1, 100);

      expect(calculateLethalDamage(unit1)).toBe(45);
      expect(calculateLethalDamage(unit2)).toBe(1);
    });
  });

  describe('edge cases and integration', () => {
    it('should handle unit with 1 HP', () => {
      const attacker = createMockUnit({ atk: 1, atkCount: 1 });
      const target = createMockUnit({ armor: 0, dodge: 0 }, 1, 100);

      const result = resolvePhysicalAttack(attacker, target, 12345);

      expect(result.damage).toBe(1);
      expect(result.killed).toBe(true);
      expect(result.newHp).toBe(0);
    });

    it('should be deterministic across multiple calls', () => {
      const attacker = createMockUnit({ atk: 15, atkCount: 1 });
      const target = createMockUnit({ armor: 5, dodge: 25 }, 50, 100);
      const seed = 54321;

      const result1 = resolvePhysicalAttack(attacker, target, seed);
      const result2 = resolvePhysicalAttack(attacker, target, seed);

      expect(result1).toEqual(result2);
    });

    it('should handle extreme stat values', () => {
      const superAttacker = createMockUnit({ atk: 1000, atkCount: 1 });
      const superTank = createMockUnit({ armor: 999, dodge: 0 }, 1, 1);

      const damage = calculatePhysicalDamage(superAttacker, superTank);
      expect(damage).toBe(1); // Still minimum damage

      const result = resolvePhysicalAttack(superAttacker, superTank, 12345);
      expect(result.killed).toBe(true);
    });
  });

  describe('flanking damage modifier (Core 2.0)', () => {
    describe('calculatePhysicalDamage with flanking modifier', () => {
      it('should apply front attack modifier (1.0x - no change)', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.0 });

        // (15 - 5) * 1 * 1.0 = 10
        expect(damage).toBe(10);
      });

      it('should apply flank attack modifier (1.3x)', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.3 });

        // floor((15 - 5) * 1 * 1.3) = floor(13) = 13
        expect(damage).toBe(13);
      });

      it('should apply rear attack modifier (1.5x)', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.5 });

        // floor((15 - 5) * 1 * 1.5) = floor(15) = 15
        expect(damage).toBe(15);
      });

      it('should floor the result after applying modifier', () => {
        const attacker = createMockUnit({ atk: 10, atkCount: 1 });
        const target = createMockUnit({ armor: 3 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.3 });

        // floor((10 - 3) * 1 * 1.3) = floor(9.1) = 9
        expect(damage).toBe(9);
      });

      it('should still respect minimum damage with flanking modifier', () => {
        const attacker = createMockUnit({ atk: 5, atkCount: 1 });
        const target = createMockUnit({ armor: 10 }); // More armor than attack

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.5 });

        // max(1, floor((5 - 10) * 1 * 1.5)) = max(1, floor(-7.5)) = max(1, -7) = 1
        expect(damage).toBe(1);
      });

      it('should combine flanking modifier with armor shred', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 10 }, 100, 100, 4); // 4 armor shred

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.3 });

        // Effective armor = 10 - 4 = 6
        // floor((15 - 6) * 1 * 1.3) = floor(11.7) = 11
        expect(damage).toBe(11);
      });

      it('should combine flanking modifier with multiple attacks', () => {
        const attacker = createMockUnit({ atk: 8, atkCount: 2 });
        const target = createMockUnit({ armor: 3 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.5 });

        // floor((8 - 3) * 2 * 1.5) = floor(15) = 15
        expect(damage).toBe(15);
      });

      it('should be backward compatible when no options provided', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damageWithoutOptions = calculatePhysicalDamage(attacker, target);
        const damageWithUndefinedOptions = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, undefined);

        // Both should be the same: (15 - 5) * 1 = 10
        expect(damageWithoutOptions).toBe(10);
        expect(damageWithUndefinedOptions).toBe(10);
      });

      it('should not apply modifier when flankingModifier is undefined', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, {});

        // (15 - 5) * 1 = 10 (no modifier applied)
        expect(damage).toBe(10);
      });
    });

    describe('resolvePhysicalAttack with flanking modifier', () => {
      it('should apply flanking modifier to resolved attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 50, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.3 });

        // floor((15 - 5) * 1 * 1.3) = 13
        expect(result.damage).toBe(13);
        expect(result.dodged).toBe(false);
        expect(result.newHp).toBe(37); // 50 - 13
        expect(result.killed).toBe(false);
      });

      it('should apply rear attack modifier to resolved attack', () => {
        const attacker = createMockUnit({ atk: 20, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 30, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.5 });

        // floor((20 - 5) * 1 * 1.5) = floor(22.5) = 22
        expect(result.damage).toBe(22);
        expect(result.dodged).toBe(false);
        expect(result.newHp).toBe(8); // 30 - 22
        expect(result.killed).toBe(false);
      });

      it('should handle lethal flanking attack', () => {
        const attacker = createMockUnit({ atk: 20, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 20, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.5 });

        // floor((20 - 5) * 1 * 1.5) = 22
        expect(result.damage).toBe(22);
        expect(result.killed).toBe(true);
        expect(result.newHp).toBe(0);
        expect(result.overkill).toBe(2); // 22 - 20 = 2
      });

      it('should not apply flanking modifier when attack is dodged', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 100 }, 50, 100); // 100% dodge

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.5 });

        expect(result.damage).toBe(0);
        expect(result.dodged).toBe(true);
        expect(result.newHp).toBe(50); // No damage taken
      });

      it('should be backward compatible when no options provided', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 50, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345);

        // (15 - 5) * 1 = 10
        expect(result.damage).toBe(10);
        expect(result.newHp).toBe(40);
      });

      it('should combine flanking modifier with armor shred in resolved attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 10, dodge: 0 }, 50, 100, 4); // 4 armor shred

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { flankingModifier: 1.3 });

        // Effective armor = 10 - 4 = 6
        // floor((15 - 6) * 1 * 1.3) = floor(11.7) = 11
        expect(result.damage).toBe(11);
        expect(result.newHp).toBe(39); // 50 - 11
      });
    });
  });

  describe('charge momentum bonus (Core 2.0)', () => {
    describe('calculatePhysicalDamage with momentum bonus', () => {
      it('should apply momentum bonus (0.2 = +20%)', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.2 });

        // floor((15 - 5) * 1 * (1 + 0.2)) = floor(12) = 12
        expect(damage).toBe(12);
      });

      it('should apply momentum bonus (0.6 = +60%)', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.6 });

        // floor((15 - 5) * 1 * (1 + 0.6)) = floor(16) = 16
        expect(damage).toBe(16);
      });

      it('should apply max momentum bonus (1.0 = +100%)', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 1.0 });

        // floor((15 - 5) * 1 * (1 + 1.0)) = floor(20) = 20
        expect(damage).toBe(20);
      });

      it('should floor the result after applying momentum bonus', () => {
        const attacker = createMockUnit({ atk: 10, atkCount: 1 });
        const target = createMockUnit({ armor: 3 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.3 });

        // floor((10 - 3) * 1 * (1 + 0.3)) = floor(9.1) = 9
        expect(damage).toBe(9);
      });

      it('should not apply momentum bonus when value is 0', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0 });

        // (15 - 5) * 1 = 10 (no bonus applied)
        expect(damage).toBe(10);
      });

      it('should not apply momentum bonus when undefined', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, {});

        // (15 - 5) * 1 = 10 (no bonus applied)
        expect(damage).toBe(10);
      });

      it('should still respect minimum damage with momentum bonus', () => {
        const attacker = createMockUnit({ atk: 5, atkCount: 1 });
        const target = createMockUnit({ armor: 10 }); // More armor than attack

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 1.0 });

        // max(1, floor((5 - 10) * 1 * 2.0)) = max(1, floor(-10)) = max(1, -10) = 1
        expect(damage).toBe(1);
      });

      it('should combine momentum bonus with armor shred', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 10 }, 100, 100, 4); // 4 armor shred

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.5 });

        // Effective armor = 10 - 4 = 6
        // floor((15 - 6) * 1 * (1 + 0.5)) = floor(13.5) = 13
        expect(damage).toBe(13);
      });

      it('should combine momentum bonus with multiple attacks', () => {
        const attacker = createMockUnit({ atk: 8, atkCount: 2 });
        const target = createMockUnit({ armor: 3 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.4 });

        // floor((8 - 3) * 2 * (1 + 0.4)) = floor(14) = 14
        expect(damage).toBe(14);
      });

      it('should combine momentum bonus with flanking modifier', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5 });

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { 
          flankingModifier: 1.3, 
          momentumBonus: 0.4 
        });

        // Base damage = (15 - 5) * 1 = 10
        // After flanking = floor(10 * 1.3) = 13
        // After momentum = floor(13 * 1.4) = 18
        expect(damage).toBe(18);
      });

      it('should combine all modifiers: flanking, momentum, and armor shred', () => {
        const attacker = createMockUnit({ atk: 20, atkCount: 1 });
        const target = createMockUnit({ armor: 10 }, 100, 100, 4); // 4 armor shred

        const damage = calculatePhysicalDamage(attacker, target, DEFAULT_BATTLE_CONFIG, { 
          flankingModifier: 1.5, 
          momentumBonus: 0.6 
        });

        // Effective armor = 10 - 4 = 6
        // Base damage = (20 - 6) * 1 = 14
        // After flanking = floor(14 * 1.5) = 21
        // After momentum = floor(21 * 1.6) = 33
        expect(damage).toBe(33);
      });
    });

    describe('resolvePhysicalAttack with momentum bonus', () => {
      it('should apply momentum bonus to resolved attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 50, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.6 });

        // floor((15 - 5) * 1 * 1.6) = 16
        expect(result.damage).toBe(16);
        expect(result.dodged).toBe(false);
        expect(result.newHp).toBe(34); // 50 - 16
        expect(result.killed).toBe(false);
      });

      it('should apply max momentum bonus to resolved attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 50, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { momentumBonus: 1.0 });

        // floor((15 - 5) * 1 * 2.0) = 20
        expect(result.damage).toBe(20);
        expect(result.dodged).toBe(false);
        expect(result.newHp).toBe(30); // 50 - 20
        expect(result.killed).toBe(false);
      });

      it('should handle lethal charge attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 15, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.6 });

        // floor((15 - 5) * 1 * 1.6) = 16
        expect(result.damage).toBe(16);
        expect(result.killed).toBe(true);
        expect(result.newHp).toBe(0);
        expect(result.overkill).toBe(1); // 16 - 15 = 1
      });

      it('should not apply momentum bonus when attack is dodged', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 100 }, 50, 100); // 100% dodge

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { momentumBonus: 1.0 });

        expect(result.damage).toBe(0);
        expect(result.dodged).toBe(true);
        expect(result.newHp).toBe(50); // No damage taken
      });

      it('should combine momentum bonus with flanking modifier in resolved attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 5, dodge: 0 }, 50, 100);

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { 
          flankingModifier: 1.3, 
          momentumBonus: 0.4 
        });

        // Base damage = (15 - 5) * 1 = 10
        // After flanking = floor(10 * 1.3) = 13
        // After momentum = floor(13 * 1.4) = 18
        expect(result.damage).toBe(18);
        expect(result.newHp).toBe(32); // 50 - 18
      });

      it('should combine momentum bonus with armor shred in resolved attack', () => {
        const attacker = createMockUnit({ atk: 15, atkCount: 1 });
        const target = createMockUnit({ armor: 10, dodge: 0 }, 50, 100, 4); // 4 armor shred

        const result = resolvePhysicalAttack(attacker, target, 12345, DEFAULT_BATTLE_CONFIG, { momentumBonus: 0.5 });

        // Effective armor = 10 - 4 = 6
        // floor((15 - 6) * 1 * 1.5) = floor(13.5) = 13
        expect(result.damage).toBe(13);
        expect(result.newHp).toBe(37); // 50 - 13
      });
    });
  });
});
