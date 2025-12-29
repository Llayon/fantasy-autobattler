/**
 * Tests for Flanking processor
 */

import { AttackArc } from '../../config/mechanics.types';
import {
  getDamageModifier,
  getResolveDamage,
  disablesRiposte,
  calculateFlankingDamage,
  applyFlankingModifier,
  isFlankingAttack,
  isRearAttack,
} from './flanking.processor';
import { FlankingUnit } from './flanking.types';

describe('Flanking Processor', () => {
  describe('getDamageModifier', () => {
    it('should return 1.0 for front attacks', () => {
      expect(getDamageModifier(AttackArc.FRONT)).toBe(1.0);
    });

    it('should return 1.3 for flank attacks', () => {
      expect(getDamageModifier(AttackArc.FLANK)).toBe(1.3);
    });

    it('should return 1.5 for rear attacks', () => {
      expect(getDamageModifier(AttackArc.REAR)).toBe(1.5);
    });

    it('should use custom config values', () => {
      const config = {
        frontDamageModifier: 1.1,
        flankDamageModifier: 1.4,
        rearDamageModifier: 2.0,
      };

      expect(getDamageModifier(AttackArc.FRONT, config)).toBe(1.1);
      expect(getDamageModifier(AttackArc.FLANK, config)).toBe(1.4);
      expect(getDamageModifier(AttackArc.REAR, config)).toBe(2.0);
    });
  });

  describe('getResolveDamage', () => {
    it('should return 0 for front attacks', () => {
      expect(getResolveDamage(10, AttackArc.FRONT)).toBe(0);
    });

    it('should return 25% of ATK for flank attacks', () => {
      expect(getResolveDamage(10, AttackArc.FLANK)).toBe(2);
      expect(getResolveDamage(20, AttackArc.FLANK)).toBe(5);
    });

    it('should return 25% of ATK for rear attacks', () => {
      expect(getResolveDamage(10, AttackArc.REAR)).toBe(2);
      expect(getResolveDamage(100, AttackArc.REAR)).toBe(25);
    });

    it('should use custom config values', () => {
      const config = { resolveDamageModifier: 0.5 };
      expect(getResolveDamage(10, AttackArc.REAR, config)).toBe(5);
    });

    it('should floor the result', () => {
      expect(getResolveDamage(7, AttackArc.FLANK)).toBe(1); // 7 * 0.25 = 1.75 -> 1
    });
  });

  describe('disablesRiposte', () => {
    it('should return false for front attacks', () => {
      expect(disablesRiposte(AttackArc.FRONT)).toBe(false);
    });

    it('should return true for flank attacks', () => {
      expect(disablesRiposte(AttackArc.FLANK)).toBe(true);
    });

    it('should return true for rear attacks', () => {
      expect(disablesRiposte(AttackArc.REAR)).toBe(true);
    });
  });

  describe('calculateFlankingDamage', () => {
    const attacker: FlankingUnit = {
      id: 'a1',
      position: { x: 5, y: 7 },
      facing: 'N',
      atk: 10,
    };

    it('should calculate front attack damage', () => {
      // Target facing S (towards attacker)
      const target = { position: { x: 5, y: 5 }, facing: 'S' as const };
      const result = calculateFlankingDamage(attacker, target, 10);

      expect(result.arc).toBe(AttackArc.FRONT);
      expect(result.baseDamage).toBe(10);
      expect(result.damageModifier).toBe(1.0);
      expect(result.finalDamage).toBe(10);
      expect(result.resolveDamage).toBe(0);
      expect(result.disablesRiposte).toBe(false);
    });

    it('should calculate rear attack damage', () => {
      // Target facing N (away from attacker)
      const target = { position: { x: 5, y: 5 }, facing: 'N' as const };
      const result = calculateFlankingDamage(attacker, target, 10);

      expect(result.arc).toBe(AttackArc.REAR);
      expect(result.baseDamage).toBe(10);
      expect(result.damageModifier).toBe(1.5);
      expect(result.finalDamage).toBe(15);
      expect(result.resolveDamage).toBe(2); // 10 * 0.25 = 2.5 -> 2
      expect(result.disablesRiposte).toBe(true);
    });

    it('should calculate flank attack damage', () => {
      // Target facing E (perpendicular to attacker)
      const target = { position: { x: 5, y: 5 }, facing: 'E' as const };
      const result = calculateFlankingDamage(attacker, target, 10);

      expect(result.arc).toBe(AttackArc.FLANK);
      expect(result.damageModifier).toBe(1.3);
      expect(result.finalDamage).toBe(13);
      expect(result.resolveDamage).toBe(2);
      expect(result.disablesRiposte).toBe(true);
    });

    it('should use attacker ATK for resolve damage', () => {
      const strongAttacker: FlankingUnit = {
        id: 'a2',
        position: { x: 5, y: 7 },
        facing: 'N',
        atk: 40,
      };
      const target = { position: { x: 5, y: 5 }, facing: 'N' as const };
      const result = calculateFlankingDamage(strongAttacker, target, 10);

      expect(result.resolveDamage).toBe(10); // 40 * 0.25 = 10
    });
  });

  describe('applyFlankingModifier', () => {
    it('should apply correct modifier based on position', () => {
      const target = { position: { x: 5, y: 5 }, facing: 'N' as const };

      // Rear attack (attacker south of target, target facing north)
      expect(applyFlankingModifier(10, { x: 5, y: 7 }, target)).toBe(15);

      // Front attack (attacker north of target, target facing north)
      expect(applyFlankingModifier(10, { x: 5, y: 3 }, target)).toBe(10);

      // Flank attack (attacker east of target, target facing north)
      expect(applyFlankingModifier(10, { x: 7, y: 5 }, target)).toBe(13);
    });
  });

  describe('isFlankingAttack', () => {
    const target = { position: { x: 5, y: 5 }, facing: 'N' as const };

    it('should return false for front attacks', () => {
      expect(isFlankingAttack({ x: 5, y: 3 }, target)).toBe(false);
    });

    it('should return true for flank attacks', () => {
      expect(isFlankingAttack({ x: 7, y: 5 }, target)).toBe(true);
    });

    it('should return true for rear attacks', () => {
      expect(isFlankingAttack({ x: 5, y: 7 }, target)).toBe(true);
    });
  });

  describe('isRearAttack', () => {
    const target = { position: { x: 5, y: 5 }, facing: 'N' as const };

    it('should return false for front attacks', () => {
      expect(isRearAttack({ x: 5, y: 3 }, target)).toBe(false);
    });

    it('should return false for flank attacks', () => {
      expect(isRearAttack({ x: 7, y: 5 }, target)).toBe(false);
    });

    it('should return true for rear attacks', () => {
      expect(isRearAttack({ x: 5, y: 7 }, target)).toBe(true);
    });
  });
});
