/**
 * Tests for Ammunition processor
 */

import {
  hasAmmo,
  getAmmo,
  getMaxAmmo,
  consumeAmmo,
  updateAmmo,
  reload,
  applyReload,
  checkCooldown,
  startCooldown,
  tickCooldowns,
  initializeAmmo,
  canAttack,
  getAmmoPercentage,
} from './ammunition.processor';
import { AmmoUnit, DEFAULT_AMMO_VALUES } from './ammunition.types';

describe('Ammunition Processor', () => {
  const createUnit = (overrides: Partial<AmmoUnit> = {}): AmmoUnit => ({
    id: 'unit1',
    ...overrides,
  });

  describe('hasAmmo', () => {
    it('should return true for non-ranged units', () => {
      const unit = createUnit({ isRanged: false });
      expect(hasAmmo(unit)).toBe(true);
    });

    it('should return true for ranged with ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 3 });
      expect(hasAmmo(unit)).toBe(true);
    });

    it('should return false for ranged without ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 0 });
      expect(hasAmmo(unit)).toBe(false);
    });

    it('should use default ammo if not set', () => {
      const unit = createUnit({ isRanged: true });
      expect(hasAmmo(unit)).toBe(true);
    });
  });

  describe('getAmmo', () => {
    it('should return Infinity for non-ranged', () => {
      const unit = createUnit({ isRanged: false });
      expect(getAmmo(unit)).toBe(Infinity);
    });

    it('should return current ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 4 });
      expect(getAmmo(unit)).toBe(4);
    });

    it('should return default if not set', () => {
      const unit = createUnit({ isRanged: true });
      expect(getAmmo(unit)).toBe(DEFAULT_AMMO_VALUES.maxAmmo);
    });
  });

  describe('getMaxAmmo', () => {
    it('should return Infinity for non-ranged', () => {
      const unit = createUnit({ isRanged: false });
      expect(getMaxAmmo(unit)).toBe(Infinity);
    });

    it('should return unit max ammo', () => {
      const unit = createUnit({ isRanged: true, maxAmmo: 10 });
      expect(getMaxAmmo(unit)).toBe(10);
    });

    it('should use config max ammo', () => {
      const unit = createUnit({ isRanged: true });
      expect(getMaxAmmo(unit, { maxAmmo: 8 })).toBe(8);
    });
  });

  describe('consumeAmmo', () => {
    it('should not consume for non-ranged', () => {
      const unit = createUnit({ isRanged: false });
      const result = consumeAmmo(unit);

      expect(result.consumed).toBe(false);
      expect(result.remainingAmmo).toBe(Infinity);
    });

    it('should consume ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 5 });
      const result = consumeAmmo(unit);

      expect(result.consumed).toBe(true);
      expect(result.remainingAmmo).toBe(4);
      expect(result.outOfAmmo).toBe(false);
    });

    it('should detect out of ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 1 });
      const result = consumeAmmo(unit);

      expect(result.remainingAmmo).toBe(0);
      expect(result.outOfAmmo).toBe(true);
    });

    it('should consume multiple ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 5 });
      const result = consumeAmmo(unit, 3);

      expect(result.remainingAmmo).toBe(2);
    });

    it('should not go below 0', () => {
      const unit = createUnit({ isRanged: true, ammo: 1 });
      const result = consumeAmmo(unit, 5);

      expect(result.remainingAmmo).toBe(0);
    });
  });

  describe('updateAmmo', () => {
    it('should update unit ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 5 });
      const result = updateAmmo(unit);

      expect(result.ammo).toBe(4);
    });

    it('should not modify non-ranged', () => {
      const unit = createUnit({ isRanged: false });
      const result = updateAmmo(unit);

      expect(result).toEqual(unit);
    });
  });

  describe('reload', () => {
    it('should not reload if reloadPerTurn is 0', () => {
      const unit = createUnit({ isRanged: true, ammo: 3 });
      const result = reload(unit);

      expect(result.reloaded).toBe(false);
      expect(result.ammoGained).toBe(0);
    });

    it('should reload with config', () => {
      const unit = createUnit({ isRanged: true, ammo: 3, maxAmmo: 6 });
      const result = reload(unit, { reloadPerTurn: 2 });

      expect(result.reloaded).toBe(true);
      expect(result.newAmmo).toBe(5);
      expect(result.ammoGained).toBe(2);
    });

    it('should not exceed max ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 5, maxAmmo: 6 });
      const result = reload(unit, { reloadPerTurn: 3 });

      expect(result.newAmmo).toBe(6);
      expect(result.ammoGained).toBe(1);
    });
  });

  describe('applyReload', () => {
    it('should apply reload to unit', () => {
      const unit = createUnit({ isRanged: true, ammo: 3, maxAmmo: 6 });
      const result = applyReload(unit, { reloadPerTurn: 2 });

      expect(result.ammo).toBe(5);
    });
  });

  describe('checkCooldown', () => {
    it('should return canUse for non-mage', () => {
      const unit = createUnit({ isMage: false });
      const result = checkCooldown(unit, 'fireball');

      expect(result.canUse).toBe(true);
      expect(result.onCooldown).toBe(false);
    });

    it('should return canUse if no cooldown', () => {
      const unit = createUnit({ isMage: true, cooldowns: {} });
      const result = checkCooldown(unit, 'fireball');

      expect(result.canUse).toBe(true);
    });

    it('should detect cooldown', () => {
      const unit = createUnit({ isMage: true, cooldowns: { fireball: 2 } });
      const result = checkCooldown(unit, 'fireball');

      expect(result.canUse).toBe(false);
      expect(result.onCooldown).toBe(true);
      expect(result.remainingTurns).toBe(2);
    });
  });

  describe('startCooldown', () => {
    it('should set cooldown', () => {
      const unit = createUnit({ isMage: true });
      const result = startCooldown(unit, 'fireball', 3);

      expect(result.cooldowns?.['fireball']).toBe(3);
    });

    it('should use default cooldown', () => {
      const unit = createUnit({ isMage: true });
      const result = startCooldown(unit, 'fireball');

      expect(result.cooldowns?.['fireball']).toBe(DEFAULT_AMMO_VALUES.defaultCooldown);
    });

    it('should preserve other cooldowns', () => {
      const unit = createUnit({ isMage: true, cooldowns: { heal: 1 } });
      const result = startCooldown(unit, 'fireball', 3);

      expect(result.cooldowns?.['fireball']).toBe(3);
      expect(result.cooldowns?.['heal']).toBe(1);
    });
  });

  describe('tickCooldowns', () => {
    it('should reduce cooldowns by 1', () => {
      const unit = createUnit({ isMage: true, cooldowns: { fireball: 3, heal: 1 } });
      const result = tickCooldowns(unit);

      expect(result.cooldowns?.['fireball']).toBe(2);
      expect(result.cooldowns?.['heal']).toBeUndefined(); // Removed when 0
    });

    it('should remove cooldowns at 0', () => {
      const unit = createUnit({ isMage: true, cooldowns: { fireball: 1 } });
      const result = tickCooldowns(unit);

      expect(result.cooldowns).toBeUndefined();
    });

    it('should handle no cooldowns', () => {
      const unit = createUnit({ isMage: true });
      const result = tickCooldowns(unit);

      expect(result).toEqual(unit);
    });
  });

  describe('initializeAmmo', () => {
    it('should set ammo for ranged', () => {
      const unit = createUnit({ isRanged: true });
      const result = initializeAmmo(unit);

      expect(result.ammo).toBe(DEFAULT_AMMO_VALUES.maxAmmo);
      expect(result.maxAmmo).toBe(DEFAULT_AMMO_VALUES.maxAmmo);
    });

    it('should use config max ammo', () => {
      const unit = createUnit({ isRanged: true });
      const result = initializeAmmo(unit, { maxAmmo: 10 });

      expect(result.ammo).toBe(10);
      expect(result.maxAmmo).toBe(10);
    });

    it('should not modify non-ranged', () => {
      const unit = createUnit({ isRanged: false });
      const result = initializeAmmo(unit);

      expect(result).toEqual(unit);
    });
  });

  describe('canAttack', () => {
    it('should return true for non-ranged', () => {
      expect(canAttack(createUnit({ isRanged: false }))).toBe(true);
    });

    it('should return true with ammo', () => {
      expect(canAttack(createUnit({ isRanged: true, ammo: 1 }))).toBe(true);
    });

    it('should return false without ammo', () => {
      expect(canAttack(createUnit({ isRanged: true, ammo: 0 }))).toBe(false);
    });
  });

  describe('getAmmoPercentage', () => {
    it('should return 1.0 for non-ranged', () => {
      expect(getAmmoPercentage(createUnit({ isRanged: false }))).toBe(1.0);
    });

    it('should calculate percentage', () => {
      const unit = createUnit({ isRanged: true, ammo: 3, maxAmmo: 6 });
      expect(getAmmoPercentage(unit)).toBe(0.5);
    });

    it('should return 0 for empty', () => {
      const unit = createUnit({ isRanged: true, ammo: 0, maxAmmo: 6 });
      expect(getAmmoPercentage(unit)).toBe(0);
    });
  });
});
