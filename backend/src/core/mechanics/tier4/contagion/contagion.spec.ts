/**
 * Tests for Contagion processor
 */

import {
  getDistance,
  isAdjacent,
  getBaseSpreadChance,
  getSpreadChance,
  findSpreadTargets,
  hasEffect,
  getEffectStacks,
  canApplyEffect,
  trySpread,
  applySpreadEffect,
  processContagion,
  applySpreads,
  tickEffects,
  removeEffect,
  getUnitsWithEffect,
  countTotalStacks,
} from './contagion.processor';
import {
  ContagionUnit,
  SpreadableEffect,
  DEFAULT_SPREAD_CHANCES,
  DEFAULT_CONTAGION_VALUES,
} from './contagion.types';

describe('Contagion Processor', () => {
  const createUnit = (overrides: Partial<ContagionUnit> = {}): ContagionUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    team: 'player',
    isAlive: true,
    ...overrides,
  });

  const createEffect = (overrides: Partial<SpreadableEffect> = {}): SpreadableEffect => ({
    id: 'effect1',
    type: 'fire',
    duration: 3,
    ...overrides,
  });

  describe('getDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('isAdjacent', () => {
    it('should return true for adjacent positions', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 6 })).toBe(true);
      expect(isAdjacent({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(true);
    });

    it('should return false for same position', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(false);
    });

    it('should return false for non-adjacent positions', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 7 })).toBe(false);
    });

    it('should respect custom range', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 7 }, 2)).toBe(true);
    });
  });

  describe('getBaseSpreadChance', () => {
    it('should return default spread chances', () => {
      expect(getBaseSpreadChance('fire')).toBe(DEFAULT_SPREAD_CHANCES.fire);
      expect(getBaseSpreadChance('poison')).toBe(DEFAULT_SPREAD_CHANCES.poison);
      expect(getBaseSpreadChance('disease')).toBe(DEFAULT_SPREAD_CHANCES.disease);
    });

    it('should use custom config values', () => {
      const config = { spreadChances: { fire: 0.5 } };
      expect(getBaseSpreadChance('fire', config)).toBe(0.5);
    });
  });

  describe('getSpreadChance', () => {
    it('should return base chance without phalanx', () => {
      expect(getSpreadChance('fire', false)).toBe(DEFAULT_SPREAD_CHANCES.fire);
    });

    it('should add phalanx bonus', () => {
      const expected = DEFAULT_SPREAD_CHANCES.fire + DEFAULT_CONTAGION_VALUES.phalanxSpreadBonus;
      expect(getSpreadChance('fire', true)).toBe(expected);
    });

    it('should cap at 1.0', () => {
      const config = { spreadChances: { fire: 0.9 }, phalanxSpreadBonus: 0.5 };
      expect(getSpreadChance('fire', true, config)).toBe(1.0);
    });
  });

  describe('findSpreadTargets', () => {
    it('should find adjacent allies', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const adjacent = createUnit({ id: 'adj', position: { x: 5, y: 6 } });
      const far = createUnit({ id: 'far', position: { x: 10, y: 10 } });

      const targets = findSpreadTargets(source, [source, adjacent, far]);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.id).toBe('adj');
    });

    it('should not include enemies by default', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const enemy = createUnit({ id: 'enemy', position: { x: 5, y: 6 }, team: 'enemy' });

      const targets = findSpreadTargets(source, [source, enemy]);

      expect(targets).toHaveLength(0);
    });

    it('should include enemies when configured', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const enemy = createUnit({ id: 'enemy', position: { x: 5, y: 6 }, team: 'enemy' });

      const targets = findSpreadTargets(source, [source, enemy], { spreadToEnemies: true });

      expect(targets).toHaveLength(1);
    });

    it('should not include dead units', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const dead = createUnit({ id: 'dead', position: { x: 5, y: 6 }, isAlive: false });

      const targets = findSpreadTargets(source, [source, dead]);

      expect(targets).toHaveLength(0);
    });
  });

  describe('hasEffect', () => {
    it('should return true if unit has effect', () => {
      const unit = createUnit({ effects: [createEffect({ type: 'fire' })] });
      expect(hasEffect(unit, 'fire')).toBe(true);
    });

    it('should return false if unit does not have effect', () => {
      const unit = createUnit({ effects: [createEffect({ type: 'fire' })] });
      expect(hasEffect(unit, 'poison')).toBe(false);
    });

    it('should return false for unit without effects', () => {
      const unit = createUnit();
      expect(hasEffect(unit, 'fire')).toBe(false);
    });
  });

  describe('getEffectStacks', () => {
    it('should return stack count', () => {
      const unit = createUnit({
        effects: [createEffect({ type: 'fire', stacks: 2 })],
      });
      expect(getEffectStacks(unit, 'fire')).toBe(2);
    });

    it('should return 0 for missing effect', () => {
      const unit = createUnit();
      expect(getEffectStacks(unit, 'fire')).toBe(0);
    });
  });

  describe('canApplyEffect', () => {
    it('should return true if under max stacks', () => {
      const unit = createUnit({
        effects: [createEffect({ type: 'fire', stacks: 1 })],
      });
      expect(canApplyEffect(unit, 'fire')).toBe(true);
    });

    it('should return false if at max stacks', () => {
      const unit = createUnit({
        effects: [createEffect({ type: 'fire', stacks: 3 })],
      });
      expect(canApplyEffect(unit, 'fire')).toBe(false);
    });

    it('should return true for new effect', () => {
      const unit = createUnit();
      expect(canApplyEffect(unit, 'fire')).toBe(true);
    });
  });

  describe('trySpread', () => {
    it('should spread when roll is below chance', () => {
      const source = createUnit({ effects: [createEffect()] });
      const target = createUnit({ id: 'target' });
      const effect = createEffect();

      const result = trySpread(source, target, effect, 0.1); // Low roll

      expect(result.didSpread).toBe(true);
    });

    it('should not spread when roll is above chance', () => {
      const source = createUnit({ effects: [createEffect()] });
      const target = createUnit({ id: 'target' });
      const effect = createEffect();

      const result = trySpread(source, target, effect, 0.9); // High roll

      expect(result.didSpread).toBe(false);
    });

    it('should not spread if target at max stacks', () => {
      const source = createUnit({ effects: [createEffect()] });
      const target = createUnit({
        id: 'target',
        effects: [createEffect({ stacks: 3 })],
      });
      const effect = createEffect();

      const result = trySpread(source, target, effect, 0.1);

      expect(result.didSpread).toBe(false);
    });
  });

  describe('applySpreadEffect', () => {
    it('should add new effect', () => {
      const unit = createUnit();
      const effect = createEffect();

      const result = applySpreadEffect(unit, effect);

      expect(result.effects).toHaveLength(1);
      expect(result.effects?.[0]?.type).toBe('fire');
      expect(result.effects?.[0]?.stacks).toBe(1);
    });

    it('should stack existing effect', () => {
      const unit = createUnit({
        effects: [createEffect({ stacks: 1 })],
      });
      const effect = createEffect();

      const result = applySpreadEffect(unit, effect);

      expect(result.effects).toHaveLength(1);
      expect(result.effects?.[0]?.stacks).toBe(2);
    });

    it('should not exceed max stacks', () => {
      const unit = createUnit({
        effects: [createEffect({ stacks: 3 })],
      });
      const effect = createEffect();

      const result = applySpreadEffect(unit, effect);

      expect(result.effects?.[0]?.stacks).toBe(3);
    });
  });

  describe('processContagion', () => {
    it('should process spreads for all units with effects', () => {
      const source = createUnit({
        id: 'source',
        position: { x: 5, y: 5 },
        effects: [createEffect()],
      });
      const target = createUnit({
        id: 'target',
        position: { x: 5, y: 6 },
      });

      const result = processContagion([source, target], () => 0.1);

      expect(result.spreads).toHaveLength(1);
      expect(result.totalSpreads).toBe(1);
      expect(result.affectedUnits).toContain('target');
    });

    it('should not spread to non-adjacent units', () => {
      const source = createUnit({
        id: 'source',
        position: { x: 5, y: 5 },
        effects: [createEffect()],
      });
      const target = createUnit({
        id: 'target',
        position: { x: 10, y: 10 },
      });

      const result = processContagion([source, target], () => 0.1);

      expect(result.spreads).toHaveLength(0);
    });
  });

  describe('applySpreads', () => {
    it('should apply successful spreads to units', () => {
      const units = [
        createUnit({ id: 'u1' }),
        createUnit({ id: 'u2' }),
      ];
      const spreads = [
        {
          sourceId: 'u1',
          targetId: 'u2',
          effect: createEffect(),
          spreadChance: 0.3,
          didSpread: true,
        },
      ];

      const result = applySpreads(units, spreads);

      expect(result[1]?.effects).toHaveLength(1);
    });

    it('should not apply failed spreads', () => {
      const units = [
        createUnit({ id: 'u1' }),
        createUnit({ id: 'u2' }),
      ];
      const spreads = [
        {
          sourceId: 'u1',
          targetId: 'u2',
          effect: createEffect(),
          spreadChance: 0.3,
          didSpread: false,
        },
      ];

      const result = applySpreads(units, spreads);

      expect(result[1]?.effects).toBeUndefined();
    });
  });

  describe('tickEffects', () => {
    it('should decrement effect durations', () => {
      const unit = createUnit({
        effects: [createEffect({ duration: 3 })],
      });

      const result = tickEffects(unit);

      expect(result.effects?.[0]?.duration).toBe(2);
    });

    it('should remove expired effects', () => {
      const unit = createUnit({
        effects: [createEffect({ duration: 1 })],
      });

      const result = tickEffects(unit);

      expect(result.effects).toBeUndefined();
    });
  });

  describe('removeEffect', () => {
    it('should remove specific effect', () => {
      const unit = createUnit({
        effects: [
          createEffect({ type: 'fire' }),
          createEffect({ id: 'e2', type: 'poison' }),
        ],
      });

      const result = removeEffect(unit, 'fire');

      expect(result.effects).toHaveLength(1);
      expect(result.effects?.[0]?.type).toBe('poison');
    });
  });

  describe('getUnitsWithEffect', () => {
    it('should find units with specific effect', () => {
      const units = [
        createUnit({ id: 'u1', effects: [createEffect({ type: 'fire' })] }),
        createUnit({ id: 'u2', effects: [createEffect({ type: 'poison' })] }),
        createUnit({ id: 'u3' }),
      ];

      const result = getUnitsWithEffect(units, 'fire');

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('u1');
    });
  });

  describe('countTotalStacks', () => {
    it('should count stacks across all units', () => {
      const units = [
        createUnit({ id: 'u1', effects: [createEffect({ type: 'fire', stacks: 2 })] }),
        createUnit({ id: 'u2', effects: [createEffect({ type: 'fire', stacks: 1 })] }),
        createUnit({ id: 'u3' }),
      ];

      expect(countTotalStacks(units, 'fire')).toBe(3);
    });
  });
});
