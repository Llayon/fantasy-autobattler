/**
 * Tests for Overwatch processor
 */

import {
  getDistance,
  canEnterOverwatch,
  enterOverwatch,
  setOverwatch,
  exitOverwatch,
  shouldTriggerOverwatch,
  triggerOverwatch,
  afterOverwatchTrigger,
  resetOverwatch,
  checkAllOverwatchers,
  getOverwatchRange,
  isInOverwatch,
} from './overwatch.processor';
import { OverwatchUnit, DEFAULT_OVERWATCH_VALUES } from './overwatch.types';

describe('Overwatch Processor', () => {
  const createUnit = (overrides: Partial<OverwatchUnit> = {}): OverwatchUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    isRanged: true,
    ammo: 6,
    ...overrides,
  });

  describe('getDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('canEnterOverwatch', () => {
    it('should return true for ranged with ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 3 });
      expect(canEnterOverwatch(unit)).toBe(true);
    });

    it('should return false for non-ranged', () => {
      const unit = createUnit({ isRanged: false });
      expect(canEnterOverwatch(unit)).toBe(false);
    });

    it('should return false without ammo', () => {
      const unit = createUnit({ isRanged: true, ammo: 0 });
      expect(canEnterOverwatch(unit)).toBe(false);
    });

    it('should return false if already in overwatch', () => {
      const unit = createUnit({ isRanged: true, vigilance: true });
      expect(canEnterOverwatch(unit)).toBe(false);
    });
  });

  describe('enterOverwatch', () => {
    it('should enter overwatch', () => {
      const unit = createUnit();
      const result = enterOverwatch(unit);

      expect(result.entered).toBe(true);
      expect(result.exited).toBe(false);
    });

    it('should fail if cannot enter', () => {
      const unit = createUnit({ isRanged: false });
      const result = enterOverwatch(unit);

      expect(result.entered).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('setOverwatch', () => {
    it('should set vigilance state', () => {
      const unit = createUnit();
      const result = setOverwatch(unit);

      expect(result.vigilance).toBe(true);
      expect(result.overwatchRange).toBe(DEFAULT_OVERWATCH_VALUES.triggerRange);
    });

    it('should use custom range from config', () => {
      const unit = createUnit();
      const result = setOverwatch(unit, { triggerRange: 8 });

      expect(result.overwatchRange).toBe(8);
    });

    it('should not modify if cannot enter', () => {
      const unit = createUnit({ isRanged: false });
      const result = setOverwatch(unit);

      expect(result.vigilance).toBeUndefined();
    });
  });

  describe('exitOverwatch', () => {
    it('should clear vigilance state', () => {
      const unit = createUnit({ vigilance: true, overwatchRange: 5 });
      const result = exitOverwatch(unit);

      expect(result.vigilance).toBe(false);
      expect(result.overwatchRange).toBeUndefined();
    });
  });

  describe('shouldTriggerOverwatch', () => {
    it('should trigger when enemy in range', () => {
      const overwatcher = createUnit({ vigilance: true, overwatchRange: 5 });
      const enemy = createUnit({ id: 'enemy', position: { x: 7, y: 5 } });

      expect(shouldTriggerOverwatch(overwatcher, enemy, enemy.position)).toBe(true);
    });

    it('should not trigger when enemy out of range', () => {
      const overwatcher = createUnit({ vigilance: true, overwatchRange: 3 });
      const enemy = createUnit({ id: 'enemy', position: { x: 10, y: 10 } });

      expect(shouldTriggerOverwatch(overwatcher, enemy, enemy.position)).toBe(false);
    });

    it('should not trigger if not in overwatch', () => {
      const overwatcher = createUnit({ vigilance: false });
      const enemy = createUnit({ id: 'enemy', position: { x: 6, y: 5 } });

      expect(shouldTriggerOverwatch(overwatcher, enemy, enemy.position)).toBe(false);
    });

    it('should not trigger without ammo', () => {
      const overwatcher = createUnit({ vigilance: true, ammo: 0 });
      const enemy = createUnit({ id: 'enemy', position: { x: 6, y: 5 } });

      expect(shouldTriggerOverwatch(overwatcher, enemy, enemy.position)).toBe(false);
    });
  });

  describe('triggerOverwatch', () => {
    it('should trigger and calculate damage', () => {
      const overwatcher = createUnit({ vigilance: true, overwatchRange: 5 });
      const enemy = createUnit({ id: 'enemy', position: { x: 6, y: 5 } });

      const result = triggerOverwatch(overwatcher, enemy, 10);

      expect(result.triggered).toBe(true);
      expect(result.attackerId).toBe('unit1');
      expect(result.targetId).toBe('enemy');
      expect(result.damage).toBe(7); // 10 * 0.75 = 7.5 -> 7
    });

    it('should not trigger if conditions not met', () => {
      const overwatcher = createUnit({ vigilance: false });
      const enemy = createUnit({ id: 'enemy', position: { x: 6, y: 5 } });

      const result = triggerOverwatch(overwatcher, enemy, 10);

      expect(result.triggered).toBe(false);
    });
  });

  describe('afterOverwatchTrigger', () => {
    it('should consume ammo and exit overwatch', () => {
      const unit = createUnit({ vigilance: true, ammo: 5 });
      const result = afterOverwatchTrigger(unit);

      expect(result.vigilance).toBe(false);
      expect(result.ammo).toBe(4);
    });

    it('should use custom ammo consumption', () => {
      const unit = createUnit({ vigilance: true, ammo: 5 });
      const result = afterOverwatchTrigger(unit, { ammoConsumption: 2 });

      expect(result.ammo).toBe(3);
    });
  });

  describe('resetOverwatch', () => {
    it('should reset overwatch at turn end', () => {
      const unit = createUnit({ vigilance: true, overwatchRange: 5 });
      const result = resetOverwatch(unit);

      expect(result.vigilance).toBe(false);
      expect(result.overwatchRange).toBeUndefined();
    });

    it('should not modify if not in overwatch', () => {
      const unit = createUnit({ vigilance: false });
      const result = resetOverwatch(unit);

      expect(result).toEqual(unit);
    });
  });

  describe('checkAllOverwatchers', () => {
    it('should find all triggering overwatchers', () => {
      const enemy = createUnit({ id: 'enemy', position: { x: 6, y: 5 } });
      const overwatchers = [
        createUnit({ id: 'o1', vigilance: true, overwatchRange: 5, position: { x: 5, y: 5 } }),
        createUnit({ id: 'o2', vigilance: true, overwatchRange: 5, position: { x: 4, y: 5 } }),
        createUnit({ id: 'o3', vigilance: false, position: { x: 7, y: 5 } }),
      ];

      const results = checkAllOverwatchers(
        enemy,
        enemy.position,
        overwatchers,
        () => 10,
      );

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.attackerId)).toContain('o1');
      expect(results.map((r) => r.attackerId)).toContain('o2');
    });
  });

  describe('getOverwatchRange', () => {
    it('should return unit range', () => {
      const unit = createUnit({ overwatchRange: 8 });
      expect(getOverwatchRange(unit)).toBe(8);
    });

    it('should return config range', () => {
      const unit = createUnit();
      expect(getOverwatchRange(unit, { triggerRange: 10 })).toBe(10);
    });

    it('should return default range', () => {
      const unit = createUnit();
      expect(getOverwatchRange(unit)).toBe(DEFAULT_OVERWATCH_VALUES.triggerRange);
    });
  });

  describe('isInOverwatch', () => {
    it('should return true if in overwatch', () => {
      expect(isInOverwatch(createUnit({ vigilance: true }))).toBe(true);
    });

    it('should return false if not in overwatch', () => {
      expect(isInOverwatch(createUnit({ vigilance: false }))).toBe(false);
      expect(isInOverwatch(createUnit())).toBe(false);
    });
  });
});
