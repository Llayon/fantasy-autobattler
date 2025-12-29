/**
 * Tests for Riposte processor
 */

import { AttackArc } from '../../config/mechanics.types';
import {
  canRiposte,
  getRiposteChance,
  executeRiposte,
  checkAndExecuteRiposte,
  resetRiposteCharges,
  consumeRiposteCharge,
  arcAllowsRiposte,
  getRiposteChanceFromPosition,
} from './riposte.processor';
import { RiposteUnit, DEFAULT_RIPOSTE_VALUES } from './riposte.types';

describe('Riposte Processor', () => {
  const createUnit = (overrides: Partial<RiposteUnit> = {}): RiposteUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    initiative: 10,
    atk: 10,
    ...overrides,
  });

  describe('canRiposte', () => {
    it('should allow riposte from front attacks', () => {
      const defender = createUnit();
      const attacker = createUnit({ id: 'attacker' });

      const result = canRiposte(defender, attacker, AttackArc.FRONT);

      expect(result.canRiposte).toBe(true);
      expect(result.chance).toBeGreaterThan(0);
    });

    it('should not allow riposte from flank attacks', () => {
      const defender = createUnit();
      const attacker = createUnit({ id: 'attacker' });

      const result = canRiposte(defender, attacker, AttackArc.FLANK);

      expect(result.canRiposte).toBe(false);
      expect(result.reason).toBe('Cannot riposte from flank or rear');
      expect(result.chance).toBe(0);
    });

    it('should not allow riposte from rear attacks', () => {
      const defender = createUnit();
      const attacker = createUnit({ id: 'attacker' });

      const result = canRiposte(defender, attacker, AttackArc.REAR);

      expect(result.canRiposte).toBe(false);
      expect(result.reason).toBe('Cannot riposte from flank or rear');
    });

    it('should not allow riposte with no charges', () => {
      const defender = createUnit({ riposteCharges: 0 });
      const attacker = createUnit({ id: 'attacker' });

      const result = canRiposte(defender, attacker, AttackArc.FRONT);

      expect(result.canRiposte).toBe(false);
      expect(result.reason).toBe('No riposte charges remaining');
      expect(result.chargesRemaining).toBe(0);
    });

    it('should not allow riposte if canRiposte is false', () => {
      const defender = createUnit({ canRiposte: false });
      const attacker = createUnit({ id: 'attacker' });

      const result = canRiposte(defender, attacker, AttackArc.FRONT);

      expect(result.canRiposte).toBe(false);
      expect(result.reason).toBe('Unit cannot riposte');
    });

    it('should use custom charge limit from config', () => {
      const defender = createUnit();
      const attacker = createUnit({ id: 'attacker' });
      const config = { chargeLimit: 3 };

      const result = canRiposte(defender, attacker, AttackArc.FRONT, config);

      expect(result.canRiposte).toBe(true);
      expect(result.chargesRemaining).toBe(3);
    });
  });

  describe('getRiposteChance', () => {
    it('should return base chance when Initiative is equal', () => {
      const defender = createUnit({ initiative: 10 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChance(defender, attacker);

      expect(chance).toBe(DEFAULT_RIPOSTE_VALUES.baseChance);
    });

    it('should increase chance with higher defender Initiative', () => {
      const defender = createUnit({ initiative: 15 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChance(defender, attacker);

      // 0.5 + 5 * 0.05 = 0.75
      expect(chance).toBe(0.75);
    });

    it('should decrease chance with lower defender Initiative', () => {
      const defender = createUnit({ initiative: 5 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChance(defender, attacker);

      // 0.5 + (-5) * 0.05 = 0.25
      expect(chance).toBe(0.25);
    });

    it('should return 1.0 when defender has +10 Initiative', () => {
      const defender = createUnit({ initiative: 20 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChance(defender, attacker);

      expect(chance).toBe(1.0);
    });

    it('should return 0.0 when attacker has +10 Initiative', () => {
      const defender = createUnit({ initiative: 10 });
      const attacker = createUnit({ id: 'attacker', initiative: 20 });

      const chance = getRiposteChance(defender, attacker);

      expect(chance).toBe(0.0);
    });

    it('should clamp chance to [0, 1]', () => {
      const fastDefender = createUnit({ initiative: 100 });
      const slowAttacker = createUnit({ id: 'attacker', initiative: 0 });

      expect(getRiposteChance(fastDefender, slowAttacker)).toBe(1.0);

      const slowDefender = createUnit({ initiative: 0 });
      const fastAttacker = createUnit({ id: 'attacker', initiative: 100 });

      expect(getRiposteChance(slowDefender, fastAttacker)).toBe(0.0);
    });

    it('should use custom config values', () => {
      const defender = createUnit({ initiative: 10 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });
      const config = { baseChance: 0.7, initiativeBonus: 0.1 };

      const chance = getRiposteChance(defender, attacker, config);

      expect(chance).toBe(0.7);
    });
  });

  describe('executeRiposte', () => {
    it('should trigger riposte when roll is below chance', () => {
      const defender = createUnit({ initiative: 20, atk: 10 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      // Chance is 1.0, roll is 0.5 -> triggers
      const result = executeRiposte(defender, attacker, 0.5);

      expect(result.triggered).toBe(true);
      expect(result.damage).toBe(5); // 10 * 0.5 = 5
      expect(result.defenderChargesRemaining).toBe(0);
    });

    it('should not trigger riposte when roll is above chance', () => {
      const defender = createUnit({ initiative: 10, atk: 10 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      // Chance is 0.5, roll is 0.8 -> doesn't trigger
      const result = executeRiposte(defender, attacker, 0.8);

      expect(result.triggered).toBe(false);
      expect(result.damage).toBe(0);
    });

    it('should not trigger riposte with no charges', () => {
      const defender = createUnit({ initiative: 20, riposteCharges: 0 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const result = executeRiposte(defender, attacker, 0.1);

      expect(result.triggered).toBe(false);
      expect(result.defenderChargesRemaining).toBe(0);
    });

    it('should calculate damage as 50% of ATK', () => {
      const defender = createUnit({ initiative: 20, atk: 20 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const result = executeRiposte(defender, attacker, 0.1);

      expect(result.damage).toBe(10); // 20 * 0.5 = 10
    });

    it('should floor damage', () => {
      const defender = createUnit({ initiative: 20, atk: 7 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const result = executeRiposte(defender, attacker, 0.1);

      expect(result.damage).toBe(3); // 7 * 0.5 = 3.5 -> 3
    });
  });

  describe('checkAndExecuteRiposte', () => {
    it('should not trigger for flank attacks', () => {
      const defender = createUnit({ initiative: 20 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const result = checkAndExecuteRiposte(defender, attacker, AttackArc.FLANK, 0.1);

      expect(result.triggered).toBe(false);
    });

    it('should trigger for front attacks with good roll', () => {
      const defender = createUnit({ initiative: 20, atk: 10 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const result = checkAndExecuteRiposte(defender, attacker, AttackArc.FRONT, 0.1);

      expect(result.triggered).toBe(true);
      expect(result.damage).toBe(5);
    });
  });

  describe('resetRiposteCharges', () => {
    it('should reset charges to default limit', () => {
      const unit = createUnit({ riposteCharges: 0 });

      const result = resetRiposteCharges(unit);

      expect(result.riposteCharges).toBe(DEFAULT_RIPOSTE_VALUES.chargeLimit);
    });

    it('should use custom charge limit from config', () => {
      const unit = createUnit({ riposteCharges: 0 });
      const config = { chargeLimit: 5 };

      const result = resetRiposteCharges(unit, config);

      expect(result.riposteCharges).toBe(5);
    });
  });

  describe('consumeRiposteCharge', () => {
    it('should decrement charges by 1', () => {
      const unit = createUnit({ riposteCharges: 3 });

      const result = consumeRiposteCharge(unit);

      expect(result.riposteCharges).toBe(2);
    });

    it('should not go below 0', () => {
      const unit = createUnit({ riposteCharges: 0 });

      const result = consumeRiposteCharge(unit);

      expect(result.riposteCharges).toBe(0);
    });

    it('should use default charge if not set', () => {
      const unit = createUnit();
      delete unit.riposteCharges;

      const result = consumeRiposteCharge(unit);

      expect(result.riposteCharges).toBe(0); // 1 - 1 = 0
    });
  });

  describe('arcAllowsRiposte', () => {
    it('should return true for front attacks', () => {
      expect(arcAllowsRiposte(AttackArc.FRONT)).toBe(true);
    });

    it('should return false for flank attacks', () => {
      expect(arcAllowsRiposte(AttackArc.FLANK)).toBe(false);
    });

    it('should return false for rear attacks', () => {
      expect(arcAllowsRiposte(AttackArc.REAR)).toBe(false);
    });
  });

  describe('getRiposteChanceFromPosition', () => {
    it('should return chance for front attacks', () => {
      // Defender at (5,5) facing S, attacker at (5,7) -> front attack
      const defender = createUnit({ facing: 'S', initiative: 15 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChanceFromPosition(
        defender,
        { x: 5, y: 7 },
        attacker,
      );

      expect(chance).toBe(0.75); // 0.5 + 5 * 0.05
    });

    it('should return 0 for flank attacks', () => {
      // Defender at (5,5) facing S, attacker at (7,5) -> flank attack
      const defender = createUnit({ facing: 'S', initiative: 20 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChanceFromPosition(
        defender,
        { x: 7, y: 5 },
        attacker,
      );

      expect(chance).toBe(0);
    });

    it('should return 0 for rear attacks', () => {
      // Defender at (5,5) facing S, attacker at (5,3) -> rear attack
      const defender = createUnit({ facing: 'S', initiative: 20 });
      const attacker = createUnit({ id: 'attacker', initiative: 10 });

      const chance = getRiposteChanceFromPosition(
        defender,
        { x: 5, y: 3 },
        attacker,
      );

      expect(chance).toBe(0);
    });
  });
});
