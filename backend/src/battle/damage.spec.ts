/**
 * Unit tests for damage calculation system.
 * Tests physical/magic damage, dodge mechanics, and edge cases.
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
} from './damage';
import { BattleUnit } from '../types/game.types';

describe('Damage System', () => {
  // Helper function to create a mock unit
  const createMockUnit = (
    id: string,
    stats: Partial<BattleUnit['stats']> = {},
    currentHp: number = 100,
    maxHp: number = 100
  ): BattleUnit => ({
    id,
    name: `Unit ${id}`,
    role: 'tank',
    cost: 5,
    stats: {
      hp: maxHp,
      atk: 10,
      atkCount: 1,
      armor: 0,
      speed: 2,
      initiative: 5,
      dodge: 0,
      ...stats,
    },
    range: 1,
    abilities: [],
    position: { x: 0, y: 0 },
    currentHp,
    maxHp,
    team: 'player',
    alive: true,
    instanceId: id,
  });

  describe('calculatePhysicalDamage', () => {
    it('should calculate basic physical damage', () => {
      const attacker = createMockUnit('attacker', { atk: 15, atkCount: 1 });
      const target = createMockUnit('target', { armor: 5 });
      
      const damage = calculatePhysicalDamage(attacker, target);
      
      // (15 - 5) * 1 = 10
      expect(damage).toBe(10);
    });

    it('should apply minimum damage of 1', () => {
      const attacker = createMockUnit('attacker', { atk: 5, atkCount: 1 });
      const target = createMockUnit('target', { armor: 10 }); // More armor than attack
      
      const damage = calculatePhysicalDamage(attacker, target);
      
      // max(1, (5 - 10) * 1) = max(1, -5) = 1
      expect(damage).toBe(1);
    });

    it('should handle multiple attacks', () => {
      const attacker = createMockUnit('attacker', { atk: 8, atkCount: 2 });
      const target = createMockUnit('target', { armor: 3 });
      
      const damage = calculatePhysicalDamage(attacker, target);
      
      // (8 - 3) * 2 = 10
      expect(damage).toBe(10);
    });

    it('should handle zero armor', () => {
      const attacker = createMockUnit('attacker', { atk: 12, atkCount: 1 });
      const target = createMockUnit('target', { armor: 0 });
      
      const damage = calculatePhysicalDamage(attacker, target);
      
      // (12 - 0) * 1 = 12
      expect(damage).toBe(12);
    });

    it('should handle high armor with multiple attacks', () => {
      const attacker = createMockUnit('attacker', { atk: 3, atkCount: 3 });
      const target = createMockUnit('target', { armor: 5 });
      
      const damage = calculatePhysicalDamage(attacker, target);
      
      // max(1, (3 - 5) * 3) = max(1, -6) = 1
      expect(damage).toBe(1);
    });
  });

  describe('calculateMagicDamage', () => {
    it('should calculate basic magic damage', () => {
      const attacker = createMockUnit('attacker', { atk: 20, atkCount: 1 });
      const target = createMockUnit('target', { armor: 10 }); // Armor ignored
      
      const damage = calculateMagicDamage(attacker, target);
      
      // 20 * 1 = 20 (armor ignored)
      expect(damage).toBe(20);
    });

    it('should ignore armor completely', () => {
      const attacker = createMockUnit('attacker', { atk: 15, atkCount: 1 });
      const lowArmor = createMockUnit('lowArmor', { armor: 2 });
      const highArmor = createMockUnit('highArmor', { armor: 20 });
      
      const damage1 = calculateMagicDamage(attacker, lowArmor);
      const damage2 = calculateMagicDamage(attacker, highArmor);
      
      // Both should be the same since armor is ignored
      expect(damage1).toBe(15);
      expect(damage2).toBe(15);
    });

    it('should handle multiple magic attacks', () => {
      const attacker = createMockUnit('attacker', { atk: 12, atkCount: 2 });
      const target = createMockUnit('target', { armor: 5 });
      
      const damage = calculateMagicDamage(attacker, target);
      
      // 12 * 2 = 24 (armor ignored)
      expect(damage).toBe(24);
    });
  });

  describe('rollDodge', () => {
    it('should be deterministic with same seed', () => {
      const unit = createMockUnit('unit', { dodge: 50 }); // 50% dodge
      const seed = 12345;
      
      const result1 = rollDodge(unit, seed);
      const result2 = rollDodge(unit, seed);
      
      expect(result1).toBe(result2);
    });

    it('should produce different results with different seeds', () => {
      const unit = createMockUnit('unit', { dodge: 50 }); // 50% dodge
      
      const results = [];
      for (let i = 1; i <= 20; i++) {
        results.push(rollDodge(unit, i * 1000)); // Use more varied seeds
      }
      
      // Should have some variation (not all true or all false)
      const trueCount = results.filter(r => r).length;
      expect(trueCount).toBeGreaterThan(0);
      expect(trueCount).toBeLessThan(20);
    });

    it('should never dodge with 0% dodge chance', () => {
      const unit = createMockUnit('unit', { dodge: 0 });
      
      for (let i = 0; i < 100; i++) {
        expect(rollDodge(unit, i)).toBe(false);
      }
    });

    it('should handle 100% dodge chance', () => {
      const unit = createMockUnit('unit', { dodge: 100 });
      
      // Test multiple seeds - should always dodge
      for (let i = 0; i < 10; i++) {
        expect(rollDodge(unit, i)).toBe(true);
      }
    });

    it('should handle edge case dodge values', () => {
      const unit10 = createMockUnit('unit10', { dodge: 10 }); // 10% dodge
      const unit90 = createMockUnit('unit90', { dodge: 90 }); // 90% dodge
      
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
      const unit = createMockUnit('unit', {}, 50, 100);
      
      const result = applyDamage(unit, 20);
      
      expect(result.newHp).toBe(30);
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle lethal damage', () => {
      const unit = createMockUnit('unit', {}, 25, 100);
      
      const result = applyDamage(unit, 25);
      
      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(0);
    });

    it('should handle overkill damage', () => {
      const unit = createMockUnit('unit', {}, 15, 100);
      
      const result = applyDamage(unit, 25);
      
      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(10); // 25 - 15 = 10 overkill
    });

    it('should not mutate input unit', () => {
      const unit = createMockUnit('unit', {}, 50, 100);
      const originalHp = unit.currentHp;
      
      applyDamage(unit, 20);
      
      expect(unit.currentHp).toBe(originalHp); // Should not be mutated
    });

    it('should handle zero damage', () => {
      const unit = createMockUnit('unit', {}, 50, 100);
      
      const result = applyDamage(unit, 0);
      
      expect(result.newHp).toBe(50);
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });
  });

  describe('applyHealing', () => {
    it('should apply normal healing', () => {
      const unit = createMockUnit('unit', {}, 30, 100);
      
      const result = applyHealing(unit, 20);
      
      expect(result.newHp).toBe(50);
      expect(result.overheal).toBe(0);
    });

    it('should cap healing at max HP', () => {
      const unit = createMockUnit('unit', {}, 80, 100);
      
      const result = applyHealing(unit, 30);
      
      expect(result.newHp).toBe(100);
      expect(result.overheal).toBe(10); // 30 - 20 = 10 overheal
    });

    it('should handle healing at full HP', () => {
      const unit = createMockUnit('unit', {}, 100, 100);
      
      const result = applyHealing(unit, 25);
      
      expect(result.newHp).toBe(100);
      expect(result.overheal).toBe(25);
    });

    it('should not mutate input unit', () => {
      const unit = createMockUnit('unit', {}, 50, 100);
      const originalHp = unit.currentHp;
      
      applyHealing(unit, 20);
      
      expect(unit.currentHp).toBe(originalHp); // Should not be mutated
    });
  });

  describe('resolvePhysicalAttack', () => {
    it('should resolve successful physical attack', () => {
      const attacker = createMockUnit('attacker', { atk: 15, atkCount: 1 });
      const target = createMockUnit('target', { armor: 5, dodge: 0 }, 50, 100);
      
      const result = resolvePhysicalAttack(attacker, target, 12345);
      
      expect(result.damage).toBe(10); // (15 - 5) * 1
      expect(result.dodged).toBe(false);
      expect(result.newHp).toBe(40); // 50 - 10
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle dodged attack', () => {
      const attacker = createMockUnit('attacker', { atk: 15, atkCount: 1 });
      const target = createMockUnit('target', { armor: 5, dodge: 100 }, 50, 100); // 100% dodge
      
      const result = resolvePhysicalAttack(attacker, target, 12345);
      
      expect(result.damage).toBe(0);
      expect(result.dodged).toBe(true);
      expect(result.newHp).toBe(50); // No damage taken
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle lethal physical attack', () => {
      const attacker = createMockUnit('attacker', { atk: 20, atkCount: 1 });
      const target = createMockUnit('target', { armor: 0, dodge: 0 }, 15, 100);
      
      const result = resolvePhysicalAttack(attacker, target, 12345);
      
      expect(result.damage).toBe(20);
      expect(result.dodged).toBe(false);
      expect(result.newHp).toBe(0);
      expect(result.killed).toBe(true);
      expect(result.overkill).toBe(5); // 20 - 15 = 5 overkill
    });
  });

  describe('resolveMagicAttack', () => {
    it('should resolve magic attack ignoring armor', () => {
      const attacker = createMockUnit('attacker', { atk: 25, atkCount: 1 });
      const target = createMockUnit('target', { armor: 10 }, 50, 100); // Armor ignored
      
      const result = resolveMagicAttack(attacker, target);
      
      expect(result.damage).toBe(25); // Armor ignored
      expect(result.newHp).toBe(25); // 50 - 25
      expect(result.killed).toBe(false);
      expect(result.overkill).toBe(0);
    });

    it('should handle lethal magic attack', () => {
      const attacker = createMockUnit('attacker', { atk: 30, atkCount: 1 });
      const target = createMockUnit('target', { armor: 5 }, 20, 100);
      
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
  });

  describe('canSurviveDamage', () => {
    it('should return true when unit survives', () => {
      const unit = createMockUnit('unit', {}, 25, 100);
      
      expect(canSurviveDamage(unit, 20)).toBe(true);
      expect(canSurviveDamage(unit, 24)).toBe(true);
    });

    it('should return false when unit dies', () => {
      const unit = createMockUnit('unit', {}, 25, 100);
      
      expect(canSurviveDamage(unit, 25)).toBe(false);
      expect(canSurviveDamage(unit, 30)).toBe(false);
    });
  });

  describe('calculateLethalDamage', () => {
    it('should return current HP as lethal damage', () => {
      const unit1 = createMockUnit('unit1', {}, 45, 100);
      const unit2 = createMockUnit('unit2', {}, 1, 100);
      
      expect(calculateLethalDamage(unit1)).toBe(45);
      expect(calculateLethalDamage(unit2)).toBe(1);
    });
  });

  describe('edge cases and integration', () => {
    it('should handle unit with 1 HP', () => {
      const attacker = createMockUnit('attacker', { atk: 1, atkCount: 1 });
      const target = createMockUnit('target', { armor: 0, dodge: 0 }, 1, 100);
      
      const result = resolvePhysicalAttack(attacker, target, 12345);
      
      expect(result.damage).toBe(1);
      expect(result.killed).toBe(true);
      expect(result.newHp).toBe(0);
    });

    it('should be deterministic across multiple calls', () => {
      const attacker = createMockUnit('attacker', { atk: 15, atkCount: 1 });
      const target = createMockUnit('target', { armor: 5, dodge: 25 }, 50, 100);
      const seed = 54321;
      
      const result1 = resolvePhysicalAttack(attacker, target, seed);
      const result2 = resolvePhysicalAttack(attacker, target, seed);
      
      expect(result1).toEqual(result2);
    });

    it('should handle extreme stat values', () => {
      const superAttacker = createMockUnit('super', { atk: 1000, atkCount: 1 });
      const superTank = createMockUnit('tank', { armor: 999, dodge: 0 }, 1, 1);
      
      const damage = calculatePhysicalDamage(superAttacker, superTank);
      expect(damage).toBe(1); // Still minimum damage
      
      const result = resolvePhysicalAttack(superAttacker, superTank, 12345);
      expect(result.killed).toBe(true);
    });
  });
});