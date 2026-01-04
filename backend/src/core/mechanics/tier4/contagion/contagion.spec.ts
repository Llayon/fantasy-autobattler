/**
 * Tier 4: Contagion Processor - Unit Tests
 *
 * Tests for the contagion (effect spreading) system.
 *
 * @module core/mechanics/tier4/contagion
 */

import { createContagionProcessor } from './contagion.processor';
import type { ContagionConfig } from '../../config/mechanics.types';
import type { BattleUnit } from '../../../types';
import type { ContagionType, UnitWithContagion } from './contagion.types';
import {
  DEFAULT_FIRE_SPREAD,
  DEFAULT_POISON_SPREAD,
  DEFAULT_CURSE_SPREAD,
  DEFAULT_FROST_SPREAD,
  DEFAULT_PLAGUE_SPREAD,
  DEFAULT_PHALANX_SPREAD_BONUS,
} from './contagion.types';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

/**
 * Default contagion config for testing.
 */
const DEFAULT_CONFIG: ContagionConfig = {
  fireSpread: DEFAULT_FIRE_SPREAD,
  poisonSpread: DEFAULT_POISON_SPREAD,
  curseSpread: DEFAULT_CURSE_SPREAD,
  frostSpread: DEFAULT_FROST_SPREAD,
  plagueSpread: DEFAULT_PLAGUE_SPREAD,
  phalanxSpreadBonus: DEFAULT_PHALANX_SPREAD_BONUS,
};

/**
 * Custom contagion config for testing.
 */
const CUSTOM_CONFIG: ContagionConfig = {
  fireSpread: 0.7,
  poisonSpread: 0.4,
  curseSpread: 0.35,
  frostSpread: 0.3,
  plagueSpread: 0.8,
  phalanxSpreadBonus: 0.2,
};

/**
 * Creates a mock battle unit for testing.
 */
function createMockUnit(
  overrides: Partial<BattleUnit & UnitWithContagion> = {},
): BattleUnit & UnitWithContagion {
  return {
    id: 'unit_1',
    instanceId: overrides.instanceId ?? 'unit_1',
    name: 'Test Unit',
    currentHp: 100,
    maxHp: 100,
    atk: 10,
    armor: 5,
    speed: 3,
    initiative: 10,
    range: 1,
    attackCount: 1,
    position: { x: 0, y: 0 },
    team: 1,
    alive: true,
    statusEffects: [],
    ...overrides,
  } as BattleUnit & UnitWithContagion;
}

// ═══════════════════════════════════════════════════════════════
// getSpreadChance() TESTS
// ═══════════════════════════════════════════════════════════════

describe('ContagionProcessor', () => {
  describe('getSpreadChance()', () => {
    it('should return correct spread chance for fire effect', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const chance = processor.getSpreadChance('fire', DEFAULT_CONFIG);
      expect(chance).toBe(DEFAULT_FIRE_SPREAD);
    });

    it('should return correct spread chance for poison effect', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const chance = processor.getSpreadChance('poison', DEFAULT_CONFIG);
      expect(chance).toBe(DEFAULT_POISON_SPREAD);
    });

    it('should return correct spread chance for curse effect', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const chance = processor.getSpreadChance('curse', DEFAULT_CONFIG);
      expect(chance).toBe(DEFAULT_CURSE_SPREAD);
    });

    it('should return correct spread chance for frost effect', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const chance = processor.getSpreadChance('frost', DEFAULT_CONFIG);
      expect(chance).toBe(DEFAULT_FROST_SPREAD);
    });

    it('should return correct spread chance for plague effect', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const chance = processor.getSpreadChance('plague', DEFAULT_CONFIG);
      expect(chance).toBe(DEFAULT_PLAGUE_SPREAD);
    });

    it('should return custom spread chance when config overrides defaults', () => {
      const processor = createContagionProcessor(CUSTOM_CONFIG);
      
      expect(processor.getSpreadChance('fire', CUSTOM_CONFIG)).toBe(0.7);
      expect(processor.getSpreadChance('poison', CUSTOM_CONFIG)).toBe(0.4);
      expect(processor.getSpreadChance('curse', CUSTOM_CONFIG)).toBe(0.35);
      expect(processor.getSpreadChance('frost', CUSTOM_CONFIG)).toBe(0.3);
      expect(processor.getSpreadChance('plague', CUSTOM_CONFIG)).toBe(0.8);
    });

    it('should return different chances for different effect types', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const fireChance = processor.getSpreadChance('fire', DEFAULT_CONFIG);
      const poisonChance = processor.getSpreadChance('poison', DEFAULT_CONFIG);
      const curseChance = processor.getSpreadChance('curse', DEFAULT_CONFIG);
      const frostChance = processor.getSpreadChance('frost', DEFAULT_CONFIG);
      const plagueChance = processor.getSpreadChance('plague', DEFAULT_CONFIG);
      
      // Verify they are all different (based on default values)
      const chances = [fireChance, poisonChance, curseChance, frostChance, plagueChance];
      const uniqueChances = new Set(chances);
      expect(uniqueChances.size).toBe(5);
    });

    it('should return plague as the highest spread chance by default', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const allTypes: ContagionType[] = ['fire', 'poison', 'curse', 'frost', 'plague'];
      const chances = allTypes.map(type => ({
        type,
        chance: processor.getSpreadChance(type, DEFAULT_CONFIG),
      }));
      
      const maxChance = Math.max(...chances.map(c => c.chance));
      const maxType = chances.find(c => c.chance === maxChance)?.type;
      
      expect(maxType).toBe('plague');
      expect(maxChance).toBe(DEFAULT_PLAGUE_SPREAD);
    });

    it('should return frost as the lowest spread chance by default', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const allTypes: ContagionType[] = ['fire', 'poison', 'curse', 'frost', 'plague'];
      const chances = allTypes.map(type => ({
        type,
        chance: processor.getSpreadChance(type, DEFAULT_CONFIG),
      }));
      
      const minChance = Math.min(...chances.map(c => c.chance));
      const minType = chances.find(c => c.chance === minChance)?.type;
      
      expect(minType).toBe('frost');
      expect(minChance).toBe(DEFAULT_FROST_SPREAD);
    });

    it('should handle zero spread chance', () => {
      const zeroConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        fireSpread: 0,
      };
      const processor = createContagionProcessor(zeroConfig);
      
      expect(processor.getSpreadChance('fire', zeroConfig)).toBe(0);
    });

    it('should handle 100% spread chance', () => {
      const fullConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(fullConfig);
      
      expect(processor.getSpreadChance('plague', fullConfig)).toBe(1.0);
    });
  });

  describe('getEffectiveSpreadChance()', () => {
    it('should return base chance when target is not in phalanx', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ inPhalanx: false });
      
      const effectiveChance = processor.getEffectiveSpreadChance('fire', target, DEFAULT_CONFIG);
      
      expect(effectiveChance).toBe(DEFAULT_FIRE_SPREAD);
    });

    it('should add phalanx bonus when target is in phalanx', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ inPhalanx: true });
      
      const effectiveChance = processor.getEffectiveSpreadChance('fire', target, DEFAULT_CONFIG);
      
      expect(effectiveChance).toBe(DEFAULT_FIRE_SPREAD + DEFAULT_PHALANX_SPREAD_BONUS);
    });

    it('should apply phalanx bonus to all effect types', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const target = createMockUnit({ inPhalanx: true });
      
      const allTypes: ContagionType[] = ['fire', 'poison', 'curse', 'frost', 'plague'];
      
      for (const type of allTypes) {
        const baseChance = processor.getSpreadChance(type, DEFAULT_CONFIG);
        const effectiveChance = processor.getEffectiveSpreadChance(type, target, DEFAULT_CONFIG);
        
        expect(effectiveChance).toBe(baseChance + DEFAULT_PHALANX_SPREAD_BONUS);
      }
    });

    it('should use custom phalanx bonus from config', () => {
      const processor = createContagionProcessor(CUSTOM_CONFIG);
      const target = createMockUnit({ inPhalanx: true });
      
      const effectiveChance = processor.getEffectiveSpreadChance('fire', target, CUSTOM_CONFIG);
      
      expect(effectiveChance).toBe(CUSTOM_CONFIG.fireSpread + CUSTOM_CONFIG.phalanxSpreadBonus);
    });

    it('should not add bonus when inPhalanx is undefined', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      const target = createMockUnit(); // inPhalanx is undefined
      
      const effectiveChance = processor.getEffectiveSpreadChance('fire', target, DEFAULT_CONFIG);
      
      expect(effectiveChance).toBe(DEFAULT_FIRE_SPREAD);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // findSpreadTargets() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('findSpreadTargets()', () => {
    it('should return adjacent units (Manhattan distance = 1)', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const adjacentUnit = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 }, // Manhattan distance = 1
      });
      
      const units = [source, adjacentUnit];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(1);
      expect(targets[0]?.instanceId).toBe('adjacent');
    });

    it('should return all four adjacent units when surrounded', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const north = createMockUnit({
        instanceId: 'north',
        position: { x: 2, y: 1 },
      });
      
      const south = createMockUnit({
        instanceId: 'south',
        position: { x: 2, y: 3 },
      });
      
      const east = createMockUnit({
        instanceId: 'east',
        position: { x: 3, y: 2 },
      });
      
      const west = createMockUnit({
        instanceId: 'west',
        position: { x: 1, y: 2 },
      });
      
      const units = [source, north, south, east, west];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(4);
      const targetIds = targets.map(t => t.instanceId);
      expect(targetIds).toContain('north');
      expect(targetIds).toContain('south');
      expect(targetIds).toContain('east');
      expect(targetIds).toContain('west');
    });

    it('should exclude the source unit itself', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const units = [source];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should exclude dead units (currentHp <= 0)', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const deadUnit = createMockUnit({
        instanceId: 'dead',
        position: { x: 2, y: 3 },
        currentHp: 0,
        alive: false,
      });
      
      const units = [source, deadUnit];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should exclude units with alive=false', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const deadUnit = createMockUnit({
        instanceId: 'dead',
        position: { x: 2, y: 3 },
        currentHp: 50, // Still has HP but marked as dead
        alive: false,
      });
      
      const units = [source, deadUnit];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should exclude non-adjacent units (Manhattan distance > 1)', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const farUnit = createMockUnit({
        instanceId: 'far',
        position: { x: 4, y: 2 }, // Manhattan distance = 2
      });
      
      const diagonalUnit = createMockUnit({
        instanceId: 'diagonal',
        position: { x: 3, y: 3 }, // Manhattan distance = 2 (diagonal)
      });
      
      const units = [source, farUnit, diagonalUnit];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should return empty array when no adjacent units exist', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 0, y: 0 },
      });
      
      const farUnit = createMockUnit({
        instanceId: 'far',
        position: { x: 5, y: 5 },
      });
      
      const units = [source, farUnit];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should include units from both teams', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
        team: 'player',
      });
      
      const ally = createMockUnit({
        instanceId: 'ally',
        position: { x: 2, y: 3 },
        team: 'player',
      });
      
      const enemy = createMockUnit({
        instanceId: 'enemy',
        position: { x: 3, y: 2 },
        team: 'bot',
      });
      
      const units = [source, ally, enemy];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(2);
      const targetIds = targets.map(t => t.instanceId);
      expect(targetIds).toContain('ally');
      expect(targetIds).toContain('enemy');
    });

    it('should handle units without position gracefully', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const noPositionUnit = createMockUnit({
        instanceId: 'no_position',
      });
      // Remove position to simulate edge case
      delete (noPositionUnit as Partial<BattleUnit & UnitWithContagion>).position;
      
      const units = [source, noPositionUnit as BattleUnit & UnitWithContagion];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should handle source without position gracefully', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
      });
      // Remove position to simulate edge case
      delete (source as Partial<BattleUnit & UnitWithContagion>).position;
      
      const adjacentUnit = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
      });
      
      const units = [source as BattleUnit & UnitWithContagion, adjacentUnit];
      const targets = processor.findSpreadTargets(source as BattleUnit & UnitWithContagion, units);
      
      expect(targets).toHaveLength(0);
    });

    it('should filter correctly with mixed valid and invalid targets', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      // Valid adjacent target
      const validTarget = createMockUnit({
        instanceId: 'valid',
        position: { x: 2, y: 3 },
        currentHp: 50,
        alive: true,
      });
      
      // Dead adjacent unit
      const deadAdjacent = createMockUnit({
        instanceId: 'dead_adjacent',
        position: { x: 3, y: 2 },
        currentHp: 0,
        alive: false,
      });
      
      // Far alive unit
      const farAlive = createMockUnit({
        instanceId: 'far_alive',
        position: { x: 5, y: 5 },
        currentHp: 100,
        alive: true,
      });
      
      const units = [source, validTarget, deadAdjacent, farAlive];
      const targets = processor.findSpreadTargets(source, units);
      
      expect(targets).toHaveLength(1);
      expect(targets[0]?.instanceId).toBe('valid');
    });

    it('should use instanceId for unit identification when available', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      // Source with both id and instanceId
      const source = createMockUnit({
        id: 'base_id',
        instanceId: 'source_instance',
        position: { x: 2, y: 2 },
      });
      
      // Adjacent unit with same base id but different instanceId
      const adjacentUnit = createMockUnit({
        id: 'base_id', // Same base id
        instanceId: 'adjacent_instance', // Different instance
        position: { x: 2, y: 3 },
      });
      
      const units = [source, adjacentUnit];
      const targets = processor.findSpreadTargets(source, units);
      
      // Should find the adjacent unit since instanceIds are different
      expect(targets).toHaveLength(1);
      expect(targets[0]?.instanceId).toBe('adjacent_instance');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // canSpreadTo() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('canSpreadTo()', () => {
    it('should allow spread to adjacent unit without the effect', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const target = createMockUnit({
        instanceId: 'target',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const eligibility = processor.canSpreadTo('fire', source, target, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(true);
      expect(eligibility.spreadChance).toBe(DEFAULT_FIRE_SPREAD);
      expect(eligibility.phalanxBonusApplied).toBe(false);
    });

    it('should block spread to self', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const eligibility = processor.canSpreadTo('fire', source, source, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(false);
      expect(eligibility.reason).toBe('same_unit');
    });

    it('should block spread to dead units', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const deadTarget = createMockUnit({
        instanceId: 'dead',
        position: { x: 2, y: 3 },
        currentHp: 0,
        alive: false,
      });
      
      const eligibility = processor.canSpreadTo('fire', source, deadTarget, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(false);
      expect(eligibility.reason).toBe('dead');
    });

    it('should block spread to non-adjacent units', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const farTarget = createMockUnit({
        instanceId: 'far',
        position: { x: 5, y: 5 },
      });
      
      const eligibility = processor.canSpreadTo('fire', source, farTarget, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(false);
      expect(eligibility.reason).toBe('not_adjacent');
    });

    it('should block spread to immune units', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const immuneTarget = createMockUnit({
        instanceId: 'immune',
        position: { x: 2, y: 3 },
        contagionImmunities: ['fire'],
      });
      
      const eligibility = processor.canSpreadTo('fire', source, immuneTarget, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(false);
      expect(eligibility.reason).toBe('immune');
    });

    it('should block spread to already infected units', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const alreadyInfected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 3 },
        statusEffects: [{ type: 'fire', duration: 2 }],
      });
      
      const eligibility = processor.canSpreadTo('fire', source, alreadyInfected, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(false);
      expect(eligibility.reason).toBe('already_infected');
    });

    it('should apply phalanx bonus when target is in phalanx', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const source = createMockUnit({
        instanceId: 'source',
        position: { x: 2, y: 2 },
      });
      
      const phalanxTarget = createMockUnit({
        instanceId: 'phalanx',
        position: { x: 2, y: 3 },
        inPhalanx: true,
      });
      
      const eligibility = processor.canSpreadTo('fire', source, phalanxTarget, DEFAULT_CONFIG);
      
      expect(eligibility.canSpread).toBe(true);
      expect(eligibility.spreadChance).toBe(DEFAULT_FIRE_SPREAD + DEFAULT_PHALANX_SPREAD_BONUS);
      expect(eligibility.phalanxBonusApplied).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getContagiousEffects() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getContagiousEffects()', () => {
    it('should return empty array for unit with no status effects', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const unit = createMockUnit({
        statusEffects: [],
      });
      
      const effects = processor.getContagiousEffects(unit);
      
      expect(effects).toHaveLength(0);
    });

    it('should return empty array for unit with undefined status effects', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const unit = createMockUnit();
      delete (unit as Partial<BattleUnit & UnitWithContagion>).statusEffects;
      
      const effects = processor.getContagiousEffects(unit as BattleUnit & UnitWithContagion);
      
      expect(effects).toHaveLength(0);
    });

    it('should return contagious effects only', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const unit = createMockUnit({
        statusEffects: [
          { type: 'fire', duration: 3 },
          { type: 'stun', duration: 1 }, // Non-contagious
          { type: 'poison', duration: 2 },
          { type: 'shield', duration: 5 }, // Non-contagious
        ],
      });
      
      const effects = processor.getContagiousEffects(unit);
      
      expect(effects).toHaveLength(2);
      expect(effects.map(e => e.type)).toContain('fire');
      expect(effects.map(e => e.type)).toContain('poison');
    });

    it('should return all five contagious effect types', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const unit = createMockUnit({
        statusEffects: [
          { type: 'fire', duration: 3 },
          { type: 'poison', duration: 2 },
          { type: 'curse', duration: 4 },
          { type: 'frost', duration: 1 },
          { type: 'plague', duration: 5 },
        ],
      });
      
      const effects = processor.getContagiousEffects(unit);
      
      expect(effects).toHaveLength(5);
      const types = effects.map(e => e.type);
      expect(types).toContain('fire');
      expect(types).toContain('poison');
      expect(types).toContain('curse');
      expect(types).toContain('frost');
      expect(types).toContain('plague');
    });

    it('should preserve effect duration', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const unit = createMockUnit({
        statusEffects: [
          { type: 'plague', duration: 7 },
        ],
      });
      
      const effects = processor.getContagiousEffects(unit);
      
      expect(effects).toHaveLength(1);
      expect(effects[0]?.duration).toBe(7);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // applyEffect() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('applyEffect()', () => {
    it('should add effect to unit with no existing effects', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const target = createMockUnit({
        instanceId: 'target',
        statusEffects: [],
      });
      
      const effect = { type: 'fire' as ContagionType, duration: 3 };
      
      const updated = processor.applyEffect(target, effect, 'source_id');
      
      expect(updated.statusEffects).toHaveLength(1);
      expect(updated.statusEffects?.[0]?.type).toBe('fire');
      expect(updated.statusEffects?.[0]?.duration).toBe(3);
      expect((updated.statusEffects?.[0] as { isSpread?: boolean })?.isSpread).toBe(true);
      expect((updated.statusEffects?.[0] as { spreadFromId?: string })?.spreadFromId).toBe('source_id');
    });

    it('should add effect to unit with existing effects', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const target = createMockUnit({
        instanceId: 'target',
        statusEffects: [{ type: 'stun', duration: 1 }],
      });
      
      const effect = { type: 'poison' as ContagionType, duration: 2 };
      
      const updated = processor.applyEffect(target, effect, 'source_id');
      
      expect(updated.statusEffects).toHaveLength(2);
      expect(updated.statusEffects?.[0]?.type).toBe('stun');
      expect(updated.statusEffects?.[1]?.type).toBe('poison');
    });

    it('should not mutate original unit', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const target = createMockUnit({
        instanceId: 'target',
        statusEffects: [],
      });
      
      const effect = { type: 'fire' as ContagionType, duration: 3 };
      
      processor.applyEffect(target, effect, 'source_id');
      
      // Original should be unchanged
      expect(target.statusEffects).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // spreadEffects() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('spreadEffects()', () => {
    /**
     * Creates a mock battle state for testing.
     */
    function createMockState(units: Array<BattleUnit & UnitWithContagion>) {
      return {
        units,
        round: 1,
        events: [],
      };
    }

    /**
     * Helper to get unit with contagion properties from state.
     */
    function getUnit(state: { units: BattleUnit[] }, instanceId: string): BattleUnit & UnitWithContagion | undefined {
      return state.units.find(u => u.instanceId === instanceId) as BattleUnit & UnitWithContagion | undefined;
    }

    it('should return unchanged state when no units have contagious effects', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const unit1 = createMockUnit({
        instanceId: 'unit1',
        position: { x: 0, y: 0 },
        statusEffects: [],
      });
      
      const unit2 = createMockUnit({
        instanceId: 'unit2',
        position: { x: 0, y: 1 },
        statusEffects: [],
      });
      
      const state = createMockState([unit1, unit2]);
      const newState = processor.spreadEffects(state, 12345);
      
      // No effects should be added
      const newUnit1 = getUnit(newState, 'unit1');
      const newUnit2 = getUnit(newState, 'unit2');
      
      expect(newUnit1?.statusEffects ?? []).toHaveLength(0);
      expect(newUnit2?.statusEffects ?? []).toHaveLength(0);
    });

    it('should spread effect to adjacent unit with 100% spread chance', () => {
      // Use config with 100% spread chance for deterministic test
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0, // 100% spread
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      const newState = processor.spreadEffects(state, 12345);
      
      const newAdjacent = getUnit(newState, 'adjacent');
      
      expect(newAdjacent?.statusEffects).toHaveLength(1);
      expect(newAdjacent?.statusEffects?.[0]?.type).toBe('plague');
    });

    it('should not spread effect with 0% spread chance', () => {
      // Use config with 0% spread chance
      const noSpreadConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        fireSpread: 0, // 0% spread
      };
      const processor = createContagionProcessor(noSpreadConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      const newState = processor.spreadEffects(state, 12345);
      
      const newAdjacent = getUnit(newState, 'adjacent');
      
      expect(newAdjacent?.statusEffects).toHaveLength(0);
    });

    it('should not spread to non-adjacent units', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 0, y: 0 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const farUnit = createMockUnit({
        instanceId: 'far',
        position: { x: 5, y: 5 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, farUnit]);
      const newState = processor.spreadEffects(state, 12345);
      
      const newFar = getUnit(newState, 'far');
      
      expect(newFar?.statusEffects).toHaveLength(0);
    });

    it('should not spread to already infected units', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected1 = createMockUnit({
        instanceId: 'infected1',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const infected2 = createMockUnit({
        instanceId: 'infected2',
        position: { x: 2, y: 3 },
        statusEffects: [{ type: 'plague', duration: 2 }],
      });
      
      const state = createMockState([infected1, infected2]);
      const newState = processor.spreadEffects(state, 12345);
      
      const newInfected2 = getUnit(newState, 'infected2');
      
      // Should still have only 1 plague effect
      expect(newInfected2?.statusEffects?.filter((e: { type: string }) => e.type === 'plague')).toHaveLength(1);
    });

    it('should not spread to immune units', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        fireSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const immune = createMockUnit({
        instanceId: 'immune',
        position: { x: 2, y: 3 },
        statusEffects: [],
        contagionImmunities: ['fire'],
      });
      
      const state = createMockState([infected, immune]);
      const newState = processor.spreadEffects(state, 12345);
      
      const newImmune = getUnit(newState, 'immune');
      
      expect(newImmune?.statusEffects).toHaveLength(0);
    });

    it('should spread multiple effects from same unit', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        fireSpread: 1.0,
        poisonSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [
          { type: 'fire', duration: 3 },
          { type: 'poison', duration: 2 },
        ],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      const newState = processor.spreadEffects(state, 12345);
      
      const newAdjacent = getUnit(newState, 'adjacent');
      
      expect(newAdjacent?.statusEffects).toHaveLength(2);
      const types = newAdjacent?.statusEffects?.map((e: { type: string }) => e.type);
      expect(types).toContain('fire');
      expect(types).toContain('poison');
    });

    it('should spread to multiple adjacent units', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const north = createMockUnit({
        instanceId: 'north',
        position: { x: 2, y: 1 },
        statusEffects: [],
      });
      
      const south = createMockUnit({
        instanceId: 'south',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, north, south]);
      
      // Use spreadEffectsWithDetails to see what's happening
      const result = processor.spreadEffectsWithDetails(state, 12345, guaranteedConfig);
      
      // Check that we found adjacent targets
      expect(result.unitResults).toHaveLength(1);
      expect(result.unitResults[0]?.sourceId).toBe('infected');
      
      // Check that spread was successful
      expect(result.totalSuccessful).toBe(2);
      expect(result.allNewlyInfectedIds).toContain('north');
      expect(result.allNewlyInfectedIds).toContain('south');
    });

    it('should be deterministic with same seed', () => {
      const processor = createContagionProcessor(DEFAULT_CONFIG);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      
      // Run twice with same seed
      const result1 = processor.spreadEffects(state, 42);
      const result2 = processor.spreadEffects(state, 42);
      
      const adj1 = getUnit(result1, 'adjacent');
      const adj2 = getUnit(result2, 'adjacent');
      
      expect(adj1?.statusEffects?.length).toBe(adj2?.statusEffects?.length);
    });

    it('should produce different results with different seeds', () => {
      // Use a spread chance that will sometimes succeed and sometimes fail
      const partialConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        fireSpread: 0.5,
      };
      const processor = createContagionProcessor(partialConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      
      // Run with many different seeds and collect results
      const results: boolean[] = [];
      for (let seed = 0; seed < 100; seed++) {
        const result = processor.spreadEffects(state, seed);
        const adj = getUnit(result, 'adjacent');
        results.push((adj?.statusEffects?.length ?? 0) > 0);
      }
      
      // With 50% chance, we should see both successes and failures
      const successes = results.filter(r => r).length;
      expect(successes).toBeGreaterThan(0);
      expect(successes).toBeLessThan(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // spreadEffectsWithDetails() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('spreadEffectsWithDetails()', () => {
    function createMockState(units: Array<BattleUnit & UnitWithContagion>) {
      return {
        units,
        round: 1,
        events: [],
      };
    }

    it('should return detailed results for spread attempts', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      const result = processor.spreadEffectsWithDetails(state, 12345, guaranteedConfig);
      
      expect(result.totalAttempts).toBeGreaterThan(0);
      expect(result.totalSuccessful).toBe(1);
      expect(result.allNewlyInfectedIds).toContain('adjacent');
      expect(result.unitResults).toHaveLength(1);
      expect(result.unitResults[0]?.sourceId).toBe('infected');
    });

    it('should track blocked attempts', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        fireSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'fire', duration: 3 }],
      });
      
      const immune = createMockUnit({
        instanceId: 'immune',
        position: { x: 2, y: 3 },
        statusEffects: [],
        contagionImmunities: ['fire'],
      });
      
      const state = createMockState([infected, immune]);
      const result = processor.spreadEffectsWithDetails(state, 12345, guaranteedConfig);
      
      expect(result.totalAttempts).toBe(1);
      expect(result.totalSuccessful).toBe(0);
      expect(result.allNewlyInfectedIds).toHaveLength(0);
      
      const blockedAttempt = result.unitResults[0]?.attempts[0];
      expect(blockedAttempt?.success).toBe(false);
      expect(blockedAttempt?.blockReason).toBe('immune');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // apply() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('apply()', () => {
    function createMockState(units: Array<BattleUnit & UnitWithContagion>) {
      return {
        units,
        round: 1,
        events: [],
      };
    }

    function getUnit(state: { units: BattleUnit[] }, instanceId: string): BattleUnit & UnitWithContagion | undefined {
      return state.units.find(u => u.instanceId === instanceId) as BattleUnit & UnitWithContagion | undefined;
    }

    it('should spread effects on turn_end phase', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      const context = {
        activeUnit: infected as BattleUnit,
        seed: 12345,
      };
      
      const newState = processor.apply('turn_end', state, context);
      
      const newAdjacent = getUnit(newState, 'adjacent');
      expect(newAdjacent?.statusEffects).toHaveLength(1);
    });

    it('should not spread effects on other phases', () => {
      const guaranteedConfig: ContagionConfig = {
        ...DEFAULT_CONFIG,
        plagueSpread: 1.0,
      };
      const processor = createContagionProcessor(guaranteedConfig);
      
      const infected = createMockUnit({
        instanceId: 'infected',
        position: { x: 2, y: 2 },
        statusEffects: [{ type: 'plague', duration: 3 }],
      });
      
      const adjacent = createMockUnit({
        instanceId: 'adjacent',
        position: { x: 2, y: 3 },
        statusEffects: [],
      });
      
      const state = createMockState([infected, adjacent]);
      const context = {
        activeUnit: infected as BattleUnit,
        seed: 12345,
      };
      
      // Test various phases that should NOT trigger spread
      const phases = ['turn_start', 'movement', 'pre_attack', 'attack', 'post_attack'] as const;
      
      for (const phase of phases) {
        const newState = processor.apply(phase, state, context);
        const newAdjacent = getUnit(newState, 'adjacent');
        expect(newAdjacent?.statusEffects).toHaveLength(0);
      }
    });
  });
});
