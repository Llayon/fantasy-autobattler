/**
 * Tests for Aura processor
 */

import { AuraType } from '../../config/mechanics.types';
import {
  getDistance,
  isInAuraRange,
  auraAffectsTarget,
  getAffectedUnits,
  applyStaticAura,
  applyPulseAura,
  applyAllAuras,
  countStackedEffects,
  canStackAura,
  addAuraEffect,
  removeAuraEffectsFromSource,
  decayPulseEffects,
  calculateAuraStatModifier,
  calculateAuraPercentageModifier,
  createBuffAura,
  createDamageAura,
} from './aura.processor';
import { Aura, AuraUnit, AppliedAuraEffect } from './aura.types';

describe('Aura Processor', () => {
  const createUnit = (overrides: Partial<AuraUnit> = {}): AuraUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    team: 'player',
    ...overrides,
  });

  const createAura = (overrides: Partial<Aura> = {}): Aura => ({
    id: 'aura1',
    name: 'Test Aura',
    type: AuraType.STATIC,
    range: 2,
    effect: { stat: 'atk', modifier: 5 },
    affectsAllies: true,
    affectsEnemies: false,
    stackable: false,
    ...overrides,
  });

  describe('getDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
      expect(getDistance({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(2);
    });
  });

  describe('isInAuraRange', () => {
    it('should return true for units within range', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const target = createUnit({ id: 'target', position: { x: 6, y: 5 } });
      const aura = createAura({ range: 2 });

      const result = isInAuraRange(source, target, aura);

      expect(result.inRange).toBe(true);
      expect(result.distance).toBe(1);
    });

    it('should return false for units outside range', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const target = createUnit({ id: 'target', position: { x: 10, y: 10 } });
      const aura = createAura({ range: 2 });

      const result = isInAuraRange(source, target, aura);

      expect(result.inRange).toBe(false);
      expect(result.distance).toBe(10);
    });

    it('should return false for same position (distance 0)', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const target = createUnit({ id: 'target', position: { x: 5, y: 5 } });
      const aura = createAura({ range: 2 });

      const result = isInAuraRange(source, target, aura);

      expect(result.inRange).toBe(false);
    });
  });

  describe('auraAffectsTarget', () => {
    it('should affect allies when affectsAllies is true', () => {
      const source = createUnit({ team: 'player' });
      const target = createUnit({ id: 'target', team: 'player' });
      const aura = createAura({ affectsAllies: true, affectsEnemies: false });

      expect(auraAffectsTarget(source, target, aura)).toBe(true);
    });

    it('should affect enemies when affectsEnemies is true', () => {
      const source = createUnit({ team: 'player' });
      const target = createUnit({ id: 'target', team: 'enemy' });
      const aura = createAura({ affectsAllies: false, affectsEnemies: true });

      expect(auraAffectsTarget(source, target, aura)).toBe(true);
    });

    it('should not affect self', () => {
      const source = createUnit({ id: 'same' });
      const target = createUnit({ id: 'same' });
      const aura = createAura({ affectsAllies: true });

      expect(auraAffectsTarget(source, target, aura)).toBe(false);
    });

    it('should not affect allies when affectsAllies is false', () => {
      const source = createUnit({ team: 'player' });
      const target = createUnit({ id: 'target', team: 'player' });
      const aura = createAura({ affectsAllies: false, affectsEnemies: true });

      expect(auraAffectsTarget(source, target, aura)).toBe(false);
    });
  });

  describe('getAffectedUnits', () => {
    it('should return units in range that are affected', () => {
      const source = createUnit({ position: { x: 5, y: 5 }, team: 'player' });
      const ally1 = createUnit({ id: 'ally1', position: { x: 6, y: 5 }, team: 'player' });
      const ally2 = createUnit({ id: 'ally2', position: { x: 5, y: 6 }, team: 'player' });
      const enemy = createUnit({ id: 'enemy', position: { x: 4, y: 5 }, team: 'enemy' });
      const farAlly = createUnit({ id: 'far', position: { x: 10, y: 10 }, team: 'player' });
      const aura = createAura({ range: 2, affectsAllies: true, affectsEnemies: false });

      const affected = getAffectedUnits(source, aura, [source, ally1, ally2, enemy, farAlly]);

      expect(affected).toHaveLength(2);
      expect(affected.map((u) => u.id)).toContain('ally1');
      expect(affected.map((u) => u.id)).toContain('ally2');
    });
  });

  describe('applyStaticAura', () => {
    it('should apply static aura to affected units', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const ally = createUnit({ id: 'ally', position: { x: 6, y: 5 } });
      const aura = createAura({ type: AuraType.STATIC });

      const result = applyStaticAura(source, aura, [source, ally]);

      expect(result.affectedUnits).toContain('ally');
      expect(result.appliedEffects).toHaveLength(1);
      expect(result.appliedEffects[0]?.auraId).toBe('aura1');
    });

    it('should not apply pulse aura', () => {
      const source = createUnit();
      const ally = createUnit({ id: 'ally', position: { x: 6, y: 5 } });
      const aura = createAura({ type: AuraType.PULSE });

      const result = applyStaticAura(source, aura, [source, ally]);

      expect(result.affectedUnits).toHaveLength(0);
    });
  });

  describe('applyPulseAura', () => {
    it('should apply pulse aura with duration', () => {
      const source = createUnit({ position: { x: 5, y: 5 } });
      const ally = createUnit({ id: 'ally', position: { x: 6, y: 5 } });
      const aura = createAura({ type: AuraType.PULSE });

      const result = applyPulseAura(source, aura, [source, ally]);

      expect(result.affectedUnits).toContain('ally');
      expect(result.appliedEffects[0]?.remainingDuration).toBe(1);
    });

    it('should not apply static aura', () => {
      const source = createUnit();
      const ally = createUnit({ id: 'ally', position: { x: 6, y: 5 } });
      const aura = createAura({ type: AuraType.STATIC });

      const result = applyPulseAura(source, aura, [source, ally]);

      expect(result.affectedUnits).toHaveLength(0);
    });
  });

  describe('applyAllAuras', () => {
    it('should apply all auras from a unit', () => {
      const aura1 = createAura({ id: 'aura1', type: AuraType.STATIC });
      const aura2 = createAura({ id: 'aura2', type: AuraType.PULSE });
      const source = createUnit({ auras: [aura1, aura2] });
      const ally = createUnit({ id: 'ally', position: { x: 6, y: 5 } });

      const result = applyAllAuras(source, [source, ally]);

      expect(result.affectedUnits).toContain('ally');
      expect(result.appliedEffects).toHaveLength(2);
    });

    it('should return empty result for unit without auras', () => {
      const source = createUnit();
      const ally = createUnit({ id: 'ally', position: { x: 6, y: 5 } });

      const result = applyAllAuras(source, [source, ally]);

      expect(result.affectedUnits).toHaveLength(0);
      expect(result.appliedEffects).toHaveLength(0);
    });
  });

  describe('countStackedEffects', () => {
    it('should count effects with matching aura ID', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'aura1', sourceUnitId: 'u1', effect: {} },
          { auraId: 'aura1', sourceUnitId: 'u2', effect: {} },
          { auraId: 'aura2', sourceUnitId: 'u3', effect: {} },
        ],
      });

      expect(countStackedEffects(unit, 'aura1')).toBe(2);
      expect(countStackedEffects(unit, 'aura2')).toBe(1);
      expect(countStackedEffects(unit, 'aura3')).toBe(0);
    });

    it('should return 0 for unit without effects', () => {
      const unit = createUnit();

      expect(countStackedEffects(unit, 'aura1')).toBe(0);
    });
  });

  describe('canStackAura', () => {
    it('should allow first application of non-stackable aura', () => {
      const unit = createUnit();
      const aura = createAura({ stackable: false });

      expect(canStackAura(unit, aura)).toBe(true);
    });

    it('should not allow second application of non-stackable aura', () => {
      const unit = createUnit({
        activeAuraEffects: [{ auraId: 'aura1', sourceUnitId: 'u1', effect: {} }],
      });
      const aura = createAura({ id: 'aura1', stackable: false });

      expect(canStackAura(unit, aura)).toBe(false);
    });

    it('should allow stacking up to limit', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'aura1', sourceUnitId: 'u1', effect: {} },
          { auraId: 'aura1', sourceUnitId: 'u2', effect: {} },
        ],
      });
      const aura = createAura({ id: 'aura1', stackable: true });

      expect(canStackAura(unit, aura)).toBe(true);
      expect(canStackAura(unit, aura, { stackingLimit: 2 })).toBe(false);
    });
  });

  describe('addAuraEffect', () => {
    it('should add effect to unit', () => {
      const unit = createUnit();
      const aura = createAura();
      const effect: AppliedAuraEffect = {
        auraId: 'aura1',
        sourceUnitId: 'source',
        effect: { stat: 'atk', modifier: 5 },
      };

      const result = addAuraEffect(unit, effect, aura);

      expect(result.activeAuraEffects).toHaveLength(1);
      expect(result.activeAuraEffects?.[0]?.auraId).toBe('aura1');
    });

    it('should not add effect if stacking limit reached', () => {
      const unit = createUnit({
        activeAuraEffects: [{ auraId: 'aura1', sourceUnitId: 'u1', effect: {} }],
      });
      const aura = createAura({ id: 'aura1', stackable: false });
      const effect: AppliedAuraEffect = {
        auraId: 'aura1',
        sourceUnitId: 'source',
        effect: {},
      };

      const result = addAuraEffect(unit, effect, aura);

      expect(result.activeAuraEffects).toHaveLength(1);
    });
  });

  describe('removeAuraEffectsFromSource', () => {
    it('should remove effects from specific source', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'aura1', sourceUnitId: 'u1', effect: {} },
          { auraId: 'aura1', sourceUnitId: 'u2', effect: {} },
          { auraId: 'aura2', sourceUnitId: 'u1', effect: {} },
        ],
      });

      const result = removeAuraEffectsFromSource(unit, 'u1');

      expect(result.activeAuraEffects).toHaveLength(1);
      expect(result.activeAuraEffects?.[0]?.sourceUnitId).toBe('u2');
    });
  });

  describe('decayPulseEffects', () => {
    it('should decrement duration and remove expired effects', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'aura1', sourceUnitId: 'u1', effect: {}, remainingDuration: 2 },
          { auraId: 'aura2', sourceUnitId: 'u2', effect: {}, remainingDuration: 1 },
          { auraId: 'aura3', sourceUnitId: 'u3', effect: {} }, // Static, no duration
        ],
      });

      const result = decayPulseEffects(unit);

      expect(result.activeAuraEffects).toHaveLength(2);
      expect(result.activeAuraEffects?.[0]?.remainingDuration).toBe(1);
      expect(result.activeAuraEffects?.[1]?.auraId).toBe('aura3');
    });
  });

  describe('calculateAuraStatModifier', () => {
    it('should sum flat modifiers', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'a1', sourceUnitId: 'u1', effect: { stat: 'atk', modifier: 5 } },
          { auraId: 'a2', sourceUnitId: 'u2', effect: { stat: 'atk', modifier: 3 } },
          { auraId: 'a3', sourceUnitId: 'u3', effect: { stat: 'def', modifier: 10 } },
        ],
      });

      expect(calculateAuraStatModifier(unit, 'atk')).toBe(8);
      expect(calculateAuraStatModifier(unit, 'def')).toBe(10);
      expect(calculateAuraStatModifier(unit, 'speed')).toBe(0);
    });

    it('should ignore percentage modifiers', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'a1', sourceUnitId: 'u1', effect: { stat: 'atk', modifier: 0.2, isPercentage: true } },
        ],
      });

      expect(calculateAuraStatModifier(unit, 'atk')).toBe(0);
    });
  });

  describe('calculateAuraPercentageModifier', () => {
    it('should multiply percentage modifiers', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'a1', sourceUnitId: 'u1', effect: { stat: 'atk', modifier: 0.1, isPercentage: true } },
          { auraId: 'a2', sourceUnitId: 'u2', effect: { stat: 'atk', modifier: 0.2, isPercentage: true } },
        ],
      });

      // 1.1 * 1.2 = 1.32
      expect(calculateAuraPercentageModifier(unit, 'atk')).toBeCloseTo(1.32);
    });

    it('should return 1.0 for no percentage effects', () => {
      const unit = createUnit({
        activeAuraEffects: [
          { auraId: 'a1', sourceUnitId: 'u1', effect: { stat: 'atk', modifier: 5 } },
        ],
      });

      expect(calculateAuraPercentageModifier(unit, 'atk')).toBe(1.0);
    });
  });

  describe('createBuffAura', () => {
    it('should create a static buff aura', () => {
      const aura = createBuffAura('leadership', 'Leadership', 'atk', 5, 3);

      expect(aura.id).toBe('leadership');
      expect(aura.type).toBe(AuraType.STATIC);
      expect(aura.range).toBe(3);
      expect(aura.effect.stat).toBe('atk');
      expect(aura.effect.modifier).toBe(5);
      expect(aura.affectsAllies).toBe(true);
      expect(aura.affectsEnemies).toBe(false);
    });
  });

  describe('createDamageAura', () => {
    it('should create a pulse damage aura', () => {
      const aura = createDamageAura('fire', 'Fire Aura', 10, 2);

      expect(aura.id).toBe('fire');
      expect(aura.type).toBe(AuraType.PULSE);
      expect(aura.range).toBe(2);
      expect(aura.effect.damage).toBe(10);
      expect(aura.affectsAllies).toBe(false);
      expect(aura.affectsEnemies).toBe(true);
      expect(aura.stackable).toBe(true);
    });
  });
});
