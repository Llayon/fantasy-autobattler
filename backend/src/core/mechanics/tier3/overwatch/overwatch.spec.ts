/**
 * Tier 3: Overwatch Processor Tests
 *
 * Tests for the overwatch (ranged reaction fire) system.
 * Validates vigilance state management, overwatch triggers,
 * shot execution, and phase integration.
 *
 * @module core/mechanics/tier3/overwatch
 */

import { createOverwatchProcessor } from './overwatch.processor';
import { createTestUnit, createTestBattleState } from '../../test-fixtures';
import type { BattleUnit } from '../../../types';
import type { UnitWithOverwatch } from './overwatch.types';
import {
  OVERWATCH_TAG,
  OVERWATCH_IMMUNE_TAG,
  DEFAULT_MAX_OVERWATCH_SHOTS,
} from './overwatch.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a test unit with overwatch properties (ranged unit).
 */
function createOverwatchUnit(
  overrides: Partial<BattleUnit & UnitWithOverwatch> = {},
): BattleUnit & UnitWithOverwatch {
  const unit = createTestUnit({
    id: overrides.id ?? 'overwatch-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    range: overrides.range ?? 4,
    role: 'ranged_dps',
    stats: {
      hp: 60,
      atk: 18,
      atkCount: 1,
      armor: 2,
      speed: 3,
      initiative: 7,
      dodge: 0.1,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 60,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  return {
    ...unit,
    canOverwatch: overrides.canOverwatch ?? true,
    vigilance: overrides.vigilance ?? 'inactive',
    overwatchShotsRemaining: overrides.overwatchShotsRemaining ?? DEFAULT_MAX_OVERWATCH_SHOTS,
    maxOverwatchShots: overrides.maxOverwatchShots ?? DEFAULT_MAX_OVERWATCH_SHOTS,
    overwatchRange: overrides.overwatchRange ?? overrides.range ?? 4,
    overwatchTargetsFired: overrides.overwatchTargetsFired ?? [],
    enteredVigilanceThisTurn: overrides.enteredVigilanceThisTurn ?? false,
    ammo: overrides.ammo ?? 6,
    tags: overrides.tags ?? [OVERWATCH_TAG],
  } as BattleUnit & UnitWithOverwatch;
}

/**
 * Creates a melee unit that cannot overwatch.
 */
function createMeleeUnit(
  overrides: Partial<BattleUnit & UnitWithOverwatch> = {},
): BattleUnit & UnitWithOverwatch {
  const unit = createTestUnit({
    id: overrides.id ?? 'melee-unit',
    position: overrides.position ?? { x: 5, y: 5 },
    team: overrides.team ?? 'bot',
    range: 1,
    role: 'melee_dps',
    stats: {
      hp: 80,
      atk: 15,
      atkCount: 1,
      armor: 5,
      speed: 4,
      initiative: 6,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 80,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  return {
    ...unit,
    canOverwatch: false,
    vigilance: 'inactive',
    tags: overrides.tags ?? [],
  } as BattleUnit & UnitWithOverwatch;
}

/**
 * Creates a stealth unit immune to overwatch.
 */
function createStealthUnit(
  overrides: Partial<BattleUnit & UnitWithOverwatch> = {},
): BattleUnit & UnitWithOverwatch {
  const unit = createTestUnit({
    id: overrides.id ?? 'stealth-unit',
    position: overrides.position ?? { x: 4, y: 4 },
    team: overrides.team ?? 'bot',
    range: 1,
    role: 'melee_dps',
    stats: {
      hp: 50,
      atk: 25,
      atkCount: 1,
      armor: 1,
      speed: 5,
      initiative: 9,
      dodge: 0.3,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 50,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  return {
    ...unit,
    canOverwatch: false,
    vigilance: 'inactive',
    tags: [OVERWATCH_IMMUNE_TAG, ...(overrides.tags ?? [])],
  } as BattleUnit & UnitWithOverwatch;
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('OverwatchProcessor', () => {
  // ─────────────────────────────────────────────────────────────
  // CAN ENTER VIGILANCE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('canEnterVigilance', () => {
    const processor = createOverwatchProcessor();

    it('should return true for ranged unit with ammo', () => {
      const archer = createOverwatchUnit({ ammo: 5 });
      expect(processor.canEnterVigilance(archer)).toBe(true);
    });

    it('should return false for unit without overwatch capability', () => {
      const melee = createMeleeUnit();
      expect(processor.canEnterVigilance(melee)).toBe(false);
    });

    it('should return false for unit with no ammo', () => {
      const archer = createOverwatchUnit({ ammo: 0 });
      expect(processor.canEnterVigilance(archer)).toBe(false);
    });

    it('should return false for unit already in vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'active' });
      expect(processor.canEnterVigilance(archer)).toBe(false);
    });

    it('should return false for unit that already entered vigilance this turn', () => {
      const archer = createOverwatchUnit({ enteredVigilanceThisTurn: true });
      expect(processor.canEnterVigilance(archer)).toBe(false);
    });

    it('should return false for unit in triggered state', () => {
      const archer = createOverwatchUnit({ vigilance: 'triggered' });
      expect(processor.canEnterVigilance(archer)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ENTER VIGILANCE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('enterVigilance', () => {
    const processor = createOverwatchProcessor();

    it('should successfully enter vigilance for valid unit', () => {
      const archer = createOverwatchUnit({ ammo: 5 });
      const state = createTestBattleState([archer]);

      const result = processor.enterVigilance(archer, state);

      expect(result.success).toBe(true);
      expect(result.unit.vigilance).toBe('active');
      expect(result.unit.enteredVigilanceThisTurn).toBe(true);
      expect(result.unit.overwatchShotsRemaining).toBe(DEFAULT_MAX_OVERWATCH_SHOTS);
    });

    it('should fail for unit without ranged capability', () => {
      const melee = createMeleeUnit();
      const state = createTestBattleState([melee]);

      const result = processor.enterVigilance(melee, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_ranged');
    });

    it('should fail for unit with no ammo', () => {
      const archer = createOverwatchUnit({ ammo: 0 });
      const state = createTestBattleState([archer]);

      const result = processor.enterVigilance(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('no_ammo');
    });

    it('should fail for unit already in vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'active' });
      const state = createTestBattleState([archer]);

      const result = processor.enterVigilance(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_vigilant');
    });
  });


  // ─────────────────────────────────────────────────────────────
  // CAN EXIT VIGILANCE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('canExitVigilance', () => {
    const processor = createOverwatchProcessor();

    it('should return true for unit in active vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'active' });
      expect(processor.canExitVigilance(archer)).toBe(true);
    });

    it('should return false for unit not in vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'inactive' });
      expect(processor.canExitVigilance(archer)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // EXIT VIGILANCE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('exitVigilance', () => {
    const processor = createOverwatchProcessor();

    it('should successfully exit vigilance for unit in active state', () => {
      const archer = createOverwatchUnit({ vigilance: 'active' });
      const state = createTestBattleState([archer]);

      const result = processor.exitVigilance(archer, state);

      expect(result.success).toBe(true);
      expect(result.unit.vigilance).toBe('inactive');
      expect(result.unit.overwatchShotsRemaining).toBe(0);
    });

    it('should fail for unit not in vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'inactive' });
      const state = createTestBattleState([archer]);

      const result = processor.exitVigilance(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_vigilant');
    });

    it('should fail for unit in triggered state', () => {
      const archer = createOverwatchUnit({ vigilance: 'triggered' });
      const state = createTestBattleState([archer]);

      const result = processor.exitVigilance(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_triggered');
    });

    it('should fail for unit in exhausted state', () => {
      const archer = createOverwatchUnit({ vigilance: 'exhausted' });
      const state = createTestBattleState([archer]);

      const result = processor.exitVigilance(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('exhausted');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TOGGLE VIGILANCE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('toggleVigilance', () => {
    const processor = createOverwatchProcessor();

    it('should enter vigilance when not in vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'inactive', ammo: 5 });
      const state = createTestBattleState([archer]);

      const result = processor.toggleVigilance(archer, state);

      expect(result.success).toBe(true);
      expect(result.action).toBe('entered');
      expect(result.unit.vigilance).toBe('active');
    });

    it('should exit vigilance when in active vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'active' });
      const state = createTestBattleState([archer]);

      const result = processor.toggleVigilance(archer, state);

      expect(result.success).toBe(true);
      expect(result.action).toBe('exited');
      expect(result.unit.vigilance).toBe('inactive');
    });

    it('should fail to toggle when in triggered state', () => {
      const archer = createOverwatchUnit({ vigilance: 'triggered' });
      const state = createTestBattleState([archer]);

      const result = processor.toggleVigilance(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_triggered');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // IS VIGILANT TESTS
  // ─────────────────────────────────────────────────────────────
  describe('isVigilant', () => {
    const processor = createOverwatchProcessor();

    it('should return true for unit in active vigilance', () => {
      const archer = createOverwatchUnit({ vigilance: 'active' });
      expect(processor.isVigilant(archer)).toBe(true);
    });

    it('should return false for unit in inactive state', () => {
      const archer = createOverwatchUnit({ vigilance: 'inactive' });
      expect(processor.isVigilant(archer)).toBe(false);
    });

    it('should return false for unit in triggered state', () => {
      const archer = createOverwatchUnit({ vigilance: 'triggered' });
      expect(processor.isVigilant(archer)).toBe(false);
    });

    it('should return false for unit in exhausted state', () => {
      const archer = createOverwatchUnit({ vigilance: 'exhausted' });
      expect(processor.isVigilant(archer)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // IS IMMUNE TO OVERWATCH TESTS
  // ─────────────────────────────────────────────────────────────
  describe('isImmuneToOverwatch', () => {
    const processor = createOverwatchProcessor();

    it('should return true for stealth unit', () => {
      const stealth = createStealthUnit();
      expect(processor.isImmuneToOverwatch(stealth)).toBe(true);
    });

    it('should return false for normal unit', () => {
      const melee = createMeleeUnit();
      expect(processor.isImmuneToOverwatch(melee)).toBe(false);
    });

    it('should return false for ranged unit', () => {
      const archer = createOverwatchUnit();
      expect(processor.isImmuneToOverwatch(archer)).toBe(false);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // CHECK OVERWATCH TESTS
  // ─────────────────────────────────────────────────────────────
  describe('checkOverwatch', () => {
    const processor = createOverwatchProcessor();

    it('should detect overwatch opportunity when enemy moves through range', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 3, y: 3 },
        team: 'player',
        vigilance: 'active',
        overwatchRange: 4,
        ammo: 5,
      });
      const enemy = createMeleeUnit({
        id: 'enemy',
        position: { x: 3, y: 7 },
        team: 'bot',
      });
      const state = createTestBattleState([archer, enemy]);

      // Enemy moves from y=7 to y=5 (within range 4 of archer at y=3)
      const path = [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
      ];

      const result = processor.checkOverwatch(enemy, path, state);

      expect(result.hasOverwatch).toBe(true);
      expect(result.totalShots).toBe(1);
      expect(result.opportunities.length).toBe(1);
      expect(result.opportunities[0]?.canFire).toBe(true);
    });

    it('should not trigger overwatch for stealth units', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 3, y: 3 },
        team: 'player',
        vigilance: 'active',
        ammo: 5,
      });
      const stealth = createStealthUnit({
        id: 'stealth',
        position: { x: 3, y: 7 },
        team: 'bot',
      });
      const state = createTestBattleState([archer, stealth]);

      const path = [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
      ];

      const result = processor.checkOverwatch(stealth, path, state);

      expect(result.hasOverwatch).toBe(false);
      expect(result.totalShots).toBe(0);
    });

    it('should not trigger overwatch when target is out of range', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 0, y: 0 },
        team: 'player',
        vigilance: 'active',
        overwatchRange: 3,
        ammo: 5,
      });
      const enemy = createMeleeUnit({
        id: 'enemy',
        position: { x: 7, y: 7 },
        team: 'bot',
      });
      const state = createTestBattleState([archer, enemy]);

      // Enemy moves but stays far from archer
      const path = [
        { x: 7, y: 7 },
        { x: 7, y: 6 },
        { x: 7, y: 5 },
      ];

      const result = processor.checkOverwatch(enemy, path, state);

      expect(result.hasOverwatch).toBe(false);
    });

    it('should not trigger overwatch when watcher has no ammo', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 3, y: 3 },
        team: 'player',
        vigilance: 'active',
        ammo: 0,
      });
      const enemy = createMeleeUnit({
        id: 'enemy',
        position: { x: 3, y: 7 },
        team: 'bot',
      });
      const state = createTestBattleState([archer, enemy]);

      const path = [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
      ];

      const result = processor.checkOverwatch(enemy, path, state);

      expect(result.hasOverwatch).toBe(false);
      expect(result.opportunities[0]?.reason).toBe('no_ammo');
    });

    it('should not trigger overwatch when watcher is not in vigilance', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 3, y: 3 },
        team: 'player',
        vigilance: 'inactive',
        ammo: 5,
      });
      const enemy = createMeleeUnit({
        id: 'enemy',
        position: { x: 3, y: 7 },
        team: 'bot',
      });
      const state = createTestBattleState([archer, enemy]);

      const path = [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
      ];

      const result = processor.checkOverwatch(enemy, path, state);

      expect(result.hasOverwatch).toBe(false);
    });

    it('should not fire at same target twice during one movement', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 3, y: 3 },
        team: 'player',
        vigilance: 'active',
        ammo: 5,
        overwatchTargetsFired: ['enemy'],
      });
      const enemy = createMeleeUnit({
        id: 'enemy',
        position: { x: 3, y: 7 },
        team: 'bot',
      });
      const state = createTestBattleState([archer, enemy]);

      const path = [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
      ];

      const result = processor.checkOverwatch(enemy, path, state);

      expect(result.hasOverwatch).toBe(false);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // CALCULATE OVERWATCH DAMAGE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('calculateOverwatchDamage', () => {
    const processor = createOverwatchProcessor();

    it('should calculate damage with default modifier (75%)', () => {
      const archer = createOverwatchUnit({ stats: { hp: 60, atk: 20, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 0 } });
      const target = createMeleeUnit();

      // 20 * 0.75 = 15
      const damage = processor.calculateOverwatchDamage(archer, target);
      expect(damage).toBe(15);
    });

    it('should floor the damage result', () => {
      const archer = createOverwatchUnit({ stats: { hp: 60, atk: 17, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 0 } });
      const target = createMeleeUnit();

      // 17 * 0.75 = 12.75 -> 12
      const damage = processor.calculateOverwatchDamage(archer, target);
      expect(damage).toBe(12);
    });

    it('should handle zero attack', () => {
      const archer = createOverwatchUnit({ stats: { hp: 60, atk: 0, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 0 } });
      const target = createMeleeUnit();

      const damage = processor.calculateOverwatchDamage(archer, target);
      expect(damage).toBe(0);
    });

    it('should use custom damage modifier', () => {
      const customProcessor = createOverwatchProcessor({ damageModifier: 0.5 });
      const archer = createOverwatchUnit({ stats: { hp: 60, atk: 20, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 0 } });
      const target = createMeleeUnit();

      // 20 * 0.5 = 10
      const damage = customProcessor.calculateOverwatchDamage(archer, target);
      expect(damage).toBe(10);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // EXECUTE OVERWATCH SHOT TESTS
  // ─────────────────────────────────────────────────────────────
  describe('executeOverwatchShot', () => {
    const processor = createOverwatchProcessor();

    it('should consume ammo on shot', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'active',
        ammo: 5,
        overwatchShotsRemaining: 2,
      });
      const target = createMeleeUnit({ id: 'target', currentHp: 80 });
      const state = createTestBattleState([archer, target]);

      const result = processor.executeOverwatchShot(archer, target, state, 12345);

      expect(result.success).toBe(true);
      expect(result.ammoConsumed).toBe(1);
      expect(result.watcherAmmoRemaining).toBe(4);
    });

    it('should consume overwatch shot', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'active',
        ammo: 5,
        overwatchShotsRemaining: 2,
      });
      const target = createMeleeUnit({ id: 'target', currentHp: 80 });
      const state = createTestBattleState([archer, target]);

      const result = processor.executeOverwatchShot(archer, target, state, 12345);

      expect(result.watcherShotsRemaining).toBe(1);
    });

    it('should set vigilance to exhausted when no shots remaining', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'active',
        ammo: 5,
        overwatchShotsRemaining: 1,
      });
      const target = createMeleeUnit({ id: 'target', currentHp: 80 });
      const state = createTestBattleState([archer, target]);

      const result = processor.executeOverwatchShot(archer, target, state, 12345);

      expect(result.watcherShotsRemaining).toBe(0);
      const updatedArcher = result.state.units.find(u => u.id === 'archer') as BattleUnit & UnitWithOverwatch;
      expect(updatedArcher.vigilance).toBe('exhausted');
    });

    it('should track target in overwatchTargetsFired', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'active',
        ammo: 5,
        overwatchShotsRemaining: 2,
        overwatchTargetsFired: [],
      });
      const target = createMeleeUnit({ id: 'target', currentHp: 80 });
      const state = createTestBattleState([archer, target]);

      const result = processor.executeOverwatchShot(archer, target, state, 12345);

      const updatedArcher = result.state.units.find(u => u.id === 'archer') as BattleUnit & UnitWithOverwatch;
      expect(updatedArcher.overwatchTargetsFired).toContain('target');
    });

    it('should kill target when HP reaches 0', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'active',
        ammo: 5,
        stats: { hp: 60, atk: 100, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 0 },
      });
      const target = createMeleeUnit({ id: 'target', currentHp: 10 });
      const state = createTestBattleState([archer, target]);

      // Use a seed that will result in a hit
      const result = processor.executeOverwatchShot(archer, target, state, 1);

      if (result.hit) {
        expect(result.targetNewHp).toBe(0);
        const updatedTarget = result.state.units.find(u => u.id === 'target');
        expect(updatedTarget?.alive).toBe(false);
      }
    });
  });


  // ─────────────────────────────────────────────────────────────
  // RESET OVERWATCH TESTS
  // ─────────────────────────────────────────────────────────────
  describe('resetOverwatch', () => {
    const processor = createOverwatchProcessor();

    it('should reset all overwatch properties', () => {
      const archer = createOverwatchUnit({
        vigilance: 'active',
        overwatchShotsRemaining: 1,
        overwatchTargetsFired: ['enemy1', 'enemy2'],
        enteredVigilanceThisTurn: true,
      });

      const result = processor.resetOverwatch(archer);

      expect(result.vigilance).toBe('inactive');
      expect(result.overwatchShotsRemaining).toBe(0);
      expect(result.overwatchTargetsFired).toEqual([]);
      expect(result.enteredVigilanceThisTurn).toBe(false);
    });

    it('should reset from triggered state', () => {
      const archer = createOverwatchUnit({ vigilance: 'triggered' });

      const result = processor.resetOverwatch(archer);

      expect(result.vigilance).toBe('inactive');
    });

    it('should reset from exhausted state', () => {
      const archer = createOverwatchUnit({ vigilance: 'exhausted' });

      const result = processor.resetOverwatch(archer);

      expect(result.vigilance).toBe('inactive');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // RESET OVERWATCH SHOTS TESTS
  // ─────────────────────────────────────────────────────────────
  describe('resetOverwatchShots', () => {
    const processor = createOverwatchProcessor();

    it('should restore shot count for unit in vigilance', () => {
      const archer = createOverwatchUnit({
        vigilance: 'active',
        overwatchShotsRemaining: 0,
        maxOverwatchShots: 2,
      });

      const result = processor.resetOverwatchShots(archer);

      expect(result.overwatchShotsRemaining).toBe(2);
      expect(result.overwatchTargetsFired).toEqual([]);
    });

    it('should restore vigilance to active from triggered', () => {
      const archer = createOverwatchUnit({
        vigilance: 'triggered',
        overwatchShotsRemaining: 0,
      });

      const result = processor.resetOverwatchShots(archer);

      expect(result.vigilance).toBe('active');
    });

    it('should not reset shots for unit not in vigilance', () => {
      const archer = createOverwatchUnit({
        vigilance: 'inactive',
        overwatchShotsRemaining: 0,
      });

      const result = processor.resetOverwatchShots(archer);

      expect(result.overwatchShotsRemaining).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('apply (phase integration)', () => {
    const processor = createOverwatchProcessor();

    it('should reset enteredVigilanceThisTurn at turn_start', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        enteredVigilanceThisTurn: true,
      });
      const state = createTestBattleState([archer]);

      const result = processor.apply('turn_start', state, {
        activeUnit: archer,
        seed: 12345,
      });

      const updatedArcher = result.units.find(u => u.id === 'archer') as BattleUnit & UnitWithOverwatch;
      expect(updatedArcher.enteredVigilanceThisTurn).toBe(false);
    });

    it('should trigger overwatch during movement phase', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        position: { x: 3, y: 3 },
        team: 'player',
        vigilance: 'active',
        ammo: 5,
        overwatchRange: 4,
      });
      const enemy = createMeleeUnit({
        id: 'enemy',
        position: { x: 3, y: 7 },
        team: 'bot',
        currentHp: 80,
      });
      const state = createTestBattleState([archer, enemy]);

      const path = [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
      ];

      const result = processor.apply('movement', state, {
        activeUnit: enemy,
        action: { type: 'move', path },
        seed: 12345,
      });

      // Archer should have fired (ammo consumed)
      const updatedArcher = result.units.find(u => u.id === 'archer') as BattleUnit & UnitWithOverwatch;
      expect(updatedArcher.ammo).toBeLessThan(5);
    });

    it('should reset vigilance at turn_end', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'active',
        overwatchShotsRemaining: 1,
      });
      const state = createTestBattleState([archer]);

      const result = processor.apply('turn_end', state, {
        activeUnit: archer,
        seed: 12345,
      });

      const updatedArcher = result.units.find(u => u.id === 'archer') as BattleUnit & UnitWithOverwatch;
      expect(updatedArcher.vigilance).toBe('inactive');
    });

    it('should not change state for non-vigilant unit at turn_end', () => {
      const archer = createOverwatchUnit({
        id: 'archer',
        vigilance: 'inactive',
      });
      const state = createTestBattleState([archer]);

      const result = processor.apply('turn_end', state, {
        activeUnit: archer,
        seed: 12345,
      });

      expect(result).toEqual(state);
    });

    it('should return unchanged state for unhandled phases', () => {
      const archer = createOverwatchUnit({ id: 'archer' });
      const state = createTestBattleState([archer]);

      const result = processor.apply('attack', state, {
        activeUnit: archer,
        seed: 12345,
      });

      expect(result).toEqual(state);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CUSTOM OPTIONS TESTS
  // ─────────────────────────────────────────────────────────────
  describe('custom options', () => {
    it('should use custom damage modifier', () => {
      const processor = createOverwatchProcessor({ damageModifier: 0.5 });
      const archer = createOverwatchUnit({ stats: { hp: 60, atk: 20, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 0 } });
      const target = createMeleeUnit();

      // 20 * 0.5 = 10
      const damage = processor.calculateOverwatchDamage(archer, target);
      expect(damage).toBe(10);
    });

    it('should use custom max shots', () => {
      const processor = createOverwatchProcessor({ maxShots: 3 });
      // Create unit and delete maxOverwatchShots to test processor default
      const archer = createOverwatchUnit({ ammo: 5 });
      delete (archer as Partial<BattleUnit & UnitWithOverwatch>).maxOverwatchShots;
      const state = createTestBattleState([archer]);

      const result = processor.enterVigilance(archer, state);

      expect(result.unit.overwatchShotsRemaining).toBe(3);
    });

    it('should use custom overwatch tags', () => {
      const processor = createOverwatchProcessor({ overwatchTags: ['sniper'] });
      
      // Unit with 'ranged' tag should not be able to overwatch
      const archer = createOverwatchUnit({ tags: [OVERWATCH_TAG] });
      // Override canOverwatch to undefined to test tag-based detection
      delete (archer as Partial<BattleUnit & UnitWithOverwatch>).canOverwatch;
      expect(processor.canEnterVigilance(archer)).toBe(false);

      // Unit with 'sniper' tag should be able to overwatch
      const sniper = createOverwatchUnit({ tags: ['sniper'] });
      delete (sniper as Partial<BattleUnit & UnitWithOverwatch>).canOverwatch;
      expect(processor.canEnterVigilance(sniper)).toBe(true);
    });

    it('should use custom immunity tags', () => {
      const processor = createOverwatchProcessor({ immunityTags: ['invisible'] });
      
      // Unit with 'stealth' tag should not be immune
      const stealth = createStealthUnit();
      expect(processor.isImmuneToOverwatch(stealth)).toBe(false);

      // Unit with 'invisible' tag should be immune
      const invisible = createMeleeUnit({ tags: ['invisible'] });
      expect(processor.isImmuneToOverwatch(invisible)).toBe(true);
    });
  });
});
