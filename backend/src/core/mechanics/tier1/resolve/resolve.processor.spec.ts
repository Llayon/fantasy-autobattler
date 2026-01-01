import { createResolveProcessor } from './resolve.processor';
import type { ResolveConfig } from '../../config/mechanics.types';
import type { BattleState, BattleUnit } from '../../../types';
import type { UnitWithResolve } from './resolve.types';
import { DEFAULT_RESOLVE_CONFIG } from '../../config/defaults';

function createTestUnit(
  overrides: Partial<BattleUnit & UnitWithResolve> = {},
): BattleUnit & UnitWithResolve {
  return {
    id: 'test-unit',
    name: 'Test Unit',
    role: 'tank',
    cost: 5,
    stats: {
      hp: 100,
      atk: 10,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 10,
      dodge: 0,
    },
    range: 1,
    abilities: [],
    position: { x: 0, y: 0 },
    currentHp: 100,
    maxHp: 100,
    team: 'player',
    alive: true,
    instanceId: 'unit-1',
    resolve: 100,
    maxResolve: 100,
    faction: 'human',
    ...overrides,
  };
}

function createTestState(
  units: (BattleUnit & UnitWithResolve)[] = [],
): BattleState {
  return { units, round: 1, events: [] };
}

// Ensure createTestState is used
void createTestState;

describe('ResolveProcessor', () => {
  describe('regenerate', () => {
    it('regenerates resolve by baseRegeneration', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, baseRegeneration: 5 };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 80, maxResolve: 100 });
      const result = processor.regenerate(unit, config);
      expect(result.resolve).toBe(85);
    });

    it('caps resolve at maxResolve', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, baseRegeneration: 10 };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 95, maxResolve: 100 });
      const result = processor.regenerate(unit, config);
      expect(result.resolve).toBe(100);
    });

    it('does not regenerate for routing units', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 0, maxResolve: 100, isRouting: true });
      const result = processor.regenerate(unit, DEFAULT_RESOLVE_CONFIG);
      expect(result.resolve).toBe(0);
      expect(result.isRouting).toBe(true);
    });

    it('does not regenerate for crumbled units', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 0, maxResolve: 100, hasCrumbled: true, faction: 'undead' });
      const result = processor.regenerate(unit, DEFAULT_RESOLVE_CONFIG);
      expect(result.resolve).toBe(0);
      expect(result.hasCrumbled).toBe(true);
    });
  });

  describe('applyDamage', () => {
    it('reduces resolve by damage amount', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 100 });
      const result = processor.applyDamage(unit, 12);
      expect(result.resolve).toBe(88);
    });

    it('does not reduce resolve below 0', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 10 });
      const result = processor.applyDamage(unit, 25);
      expect(result.resolve).toBe(0);
    });

    it('handles zero damage', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 50 });
      const result = processor.applyDamage(unit, 0);
      expect(result.resolve).toBe(50);
    });

    it('handles large damage values', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 100 });
      const result = processor.applyDamage(unit, 1000);
      expect(result.resolve).toBe(0);
    });
  });

  describe('checkState', () => {
    it('returns active when resolve > 0', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 50 });
      const result = processor.checkState(unit, DEFAULT_RESOLVE_CONFIG);
      expect(result).toBe('active');
    });

    it('returns routing for human unit with resolve = 0', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, humanRetreat: true };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 0, faction: 'human' });
      const result = processor.checkState(unit, config);
      expect(result).toBe('routing');
    });

    it('returns crumbled for undead unit with resolve = 0', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, undeadCrumble: true };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 0, faction: 'undead' });
      const result = processor.checkState(unit, config);
      expect(result).toBe('crumbled');
    });

    it('returns active when humanRetreat disabled', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, humanRetreat: false };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 0, faction: 'human' });
      const result = processor.checkState(unit, config);
      expect(result).toBe('active');
    });

    it('returns active when undeadCrumble disabled', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, undeadCrumble: false };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 0, faction: 'undead' });
      const result = processor.checkState(unit, config);
      expect(result).toBe('active');
    });

    it('returns routing when already routing', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 50, isRouting: true });
      const result = processor.checkState(unit, DEFAULT_RESOLVE_CONFIG);
      expect(result).toBe('routing');
    });

    it('returns crumbled when already crumbled', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 50, faction: 'undead', hasCrumbled: true });
      const result = processor.checkState(unit, DEFAULT_RESOLVE_CONFIG);
      expect(result).toBe('crumbled');
    });
  });

  describe('apply', () => {
    it('regenerates resolve on turn_start', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, baseRegeneration: 5 };
      const processor = createResolveProcessor(config);
      const unit = createTestUnit({ resolve: 80, maxResolve: 100 });
      const state = createTestState([unit]);
      const result = processor.apply('turn_start', state, { activeUnit: unit, seed: 12345 });
      const updatedUnit = result.units[0] as BattleUnit & UnitWithResolve;
      expect(updatedUnit.resolve).toBe(85);
    });

    it('triggers routing on post_attack for human with resolve 0', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, humanRetreat: true };
      const processor = createResolveProcessor(config);
      const attacker = createTestUnit({ instanceId: 'attacker-1' });
      const target = createTestUnit({ instanceId: 'target-1', id: 'target', resolve: 0, faction: 'human' });
      const state = createTestState([attacker, target]);
      const result = processor.apply('post_attack', state, { activeUnit: attacker, target, seed: 12345 });
      const updatedTarget = result.units.find((u) => u.id === 'target') as BattleUnit & UnitWithResolve;
      expect(updatedTarget.isRouting).toBe(true);
    });

    it('triggers crumble on post_attack for undead with resolve 0', () => {
      const config: ResolveConfig = { ...DEFAULT_RESOLVE_CONFIG, undeadCrumble: true };
      const processor = createResolveProcessor(config);
      const attacker = createTestUnit({ instanceId: 'attacker-1' });
      const target = createTestUnit({ instanceId: 'target-1', id: 'target', resolve: 0, faction: 'undead' });
      const state = createTestState([attacker, target]);
      const result = processor.apply('post_attack', state, { activeUnit: attacker, target, seed: 12345 });
      const updatedTarget = result.units.find((u) => u.id === 'target') as BattleUnit & UnitWithResolve;
      expect(updatedTarget.hasCrumbled).toBe(true);
      expect(updatedTarget.alive).toBe(false);
    });

    it('returns unchanged state for movement phase', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 50 });
      const state = createTestState([unit]);
      const result = processor.apply('movement', state, { activeUnit: unit, seed: 12345 });
      expect(result).toEqual(state);
    });

    it('does not regenerate for dead units', () => {
      const processor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
      const unit = createTestUnit({ resolve: 50, alive: false, currentHp: 0 });
      const state = createTestState([unit]);
      const result = processor.apply('turn_start', state, { activeUnit: unit, seed: 12345 });
      const updatedUnit = result.units[0] as BattleUnit & UnitWithResolve;
      expect(updatedUnit.resolve).toBe(50);
    });
  });
});
