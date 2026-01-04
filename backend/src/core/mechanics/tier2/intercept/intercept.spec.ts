/**
 * Tier 2: Intercept Processor Tests
 *
 * Tests for the intercept system which allows units to block or engage
 * passing enemies during movement.
 *
 * Key mechanics tested:
 * - Hard Intercept: Spearmen completely stop cavalry charges
 * - Soft Intercept: Infantry engages passing units (triggers ZoC)
 * - Disengage Cost: Movement penalty to leave engagement
 *
 * @module core/mechanics/tier2/intercept
 */

import { createInterceptProcessor } from './intercept.processor';
import { createTestUnit } from '../../test-fixtures';
import type { InterceptConfig } from '../../config/mechanics.types';
import type { BattleUnit, Position } from '../../../types';
import type { UnitWithIntercept } from './intercept.types';
import {
  HARD_INTERCEPT_DAMAGE_MULTIPLIER,
  HARD_INTERCEPT_TAG,
  CAVALRY_TAG,
  DEFAULT_DISENGAGE_COST,
} from './intercept.types';

// ═══════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: InterceptConfig = {
  hardIntercept: true,
  softIntercept: true,
  disengageCost: 2,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a test unit with intercept properties.
 */
function createInterceptUnit(
  overrides: Partial<BattleUnit & UnitWithIntercept> = {},
): BattleUnit & UnitWithIntercept {
  const unit = createTestUnit({
    id: overrides.id ?? 'intercept-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    stats: {
      hp: 100,
      atk: 20,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 5,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 100,
    alive: overrides.alive ?? true,
    range: overrides.range ?? 1,
    ...overrides,
  });

  const result: BattleUnit & UnitWithIntercept = {
    ...unit,
  };

  // Add optional intercept properties if defined
  if (overrides.tags !== undefined) {
    result.tags = overrides.tags;
  }
  if (overrides.canHardIntercept !== undefined) {
    result.canHardIntercept = overrides.canHardIntercept;
  }
  if (overrides.canSoftIntercept !== undefined) {
    result.canSoftIntercept = overrides.canSoftIntercept;
  }
  if (overrides.isCavalry !== undefined) {
    result.isCavalry = overrides.isCavalry;
  }
  if (overrides.interceptsRemaining !== undefined) {
    result.interceptsRemaining = overrides.interceptsRemaining;
  }
  if (overrides.maxIntercepts !== undefined) {
    result.maxIntercepts = overrides.maxIntercepts;
  }
  if (overrides.isCharging !== undefined) {
    result.isCharging = overrides.isCharging;
  }
  if (overrides.momentum !== undefined) {
    result.momentum = overrides.momentum;
  }
  if (overrides.engaged !== undefined) {
    result.engaged = overrides.engaged;
  }

  return result;
}

/**
 * Creates a spearman unit (can hard intercept).
 */
function createSpearman(
  overrides: Partial<BattleUnit & UnitWithIntercept> = {},
): BattleUnit & UnitWithIntercept {
  return createInterceptUnit({
    id: overrides.id ?? 'spearman',
    tags: [HARD_INTERCEPT_TAG],
    interceptsRemaining: 1,
    ...overrides,
  });
}

/**
 * Creates a cavalry unit (can be hard intercepted).
 */
function createCavalry(
  overrides: Partial<BattleUnit & UnitWithIntercept> = {},
): BattleUnit & UnitWithIntercept {
  return createInterceptUnit({
    id: overrides.id ?? 'cavalry',
    tags: [CAVALRY_TAG],
    isCavalry: true,
    stats: {
      hp: 80,
      atk: 15,
      atkCount: 1,
      armor: 4,
      speed: 5,
      initiative: 7,
      dodge: 0,
      ...overrides.stats,
    },
    ...overrides,
  });
}

/**
 * Creates a test battle state with the given units.
 */
function createTestState(units: BattleUnit[]): { units: BattleUnit[]; round: number; events: unknown[] } {
  return {
    units,
    round: 1,
    events: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// canHardIntercept() TESTS
// ═══════════════════════════════════════════════════════════════

describe('InterceptProcessor', () => {
  describe('canHardIntercept()', () => {
    describe('basic requirements', () => {
      it('should allow hard intercept when spearman intercepts cavalry', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player' });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });

      it('should deny hard intercept when config disables it', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, hardIntercept: false };
        const processor = createInterceptProcessor(config);
        const spearman = createSpearman({ team: 'player' });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, config);

        expect(result).toBe(false);
      });

      it('should deny hard intercept when interceptor is not spearman', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({ id: 'infantry', team: 'player', tags: [] });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(infantry, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should deny hard intercept when target is not cavalry', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player' });
        const infantry = createInterceptUnit({ id: 'infantry', team: 'bot', tags: [] });

        const result = processor.canHardIntercept(spearman, infantry, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });
    });

    describe('interceptor state checks', () => {
      it('should deny hard intercept when interceptor is dead (alive=false)', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player', alive: false });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should deny hard intercept when interceptor has 0 HP', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player', currentHp: 0, alive: true });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should deny hard intercept when no intercepts remaining', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player', interceptsRemaining: 0 });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should allow hard intercept when intercepts remaining', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player', interceptsRemaining: 2 });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });
    });

    describe('tag-based detection', () => {
      it('should detect spearman via spear_wall tag', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createInterceptUnit({
          id: 'spearman',
          team: 'player',
          tags: [HARD_INTERCEPT_TAG],
          interceptsRemaining: 1,
        });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });

      it('should detect cavalry via cavalry tag', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player' });
        const cavalry = createInterceptUnit({
          id: 'cavalry',
          team: 'bot',
          tags: [CAVALRY_TAG],
        });

        const result = processor.canHardIntercept(spearman, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });

      it('should use canHardIntercept flag when set explicitly', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'custom-unit',
          team: 'player',
          canHardIntercept: true,
          interceptsRemaining: 1,
        });
        const cavalry = createCavalry({ team: 'bot' });

        const result = processor.canHardIntercept(unit, cavalry, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });

      it('should use isCavalry flag when set explicitly', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player' });
        const unit = createInterceptUnit({
          id: 'custom-cavalry',
          team: 'bot',
          isCavalry: true,
        });

        const result = processor.canHardIntercept(spearman, unit, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // canSoftIntercept() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('canSoftIntercept()', () => {
    describe('basic requirements', () => {
      it('should allow soft intercept when melee infantry intercepts enemy', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1, // Melee unit
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(infantry, enemy, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });

      it('should deny soft intercept when config disables it', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, softIntercept: false };
        const processor = createInterceptProcessor(config);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(infantry, enemy, config);

        expect(result).toBe(false);
      });

      it('should deny soft intercept when interceptor is ranged unit', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const archer = createInterceptUnit({
          id: 'archer',
          team: 'player',
          range: 5, // Ranged unit
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(archer, enemy, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should deny soft intercept when target is ally', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const ally = createInterceptUnit({
          id: 'ally',
          team: 'player', // Same team
        });

        const result = processor.canSoftIntercept(infantry, ally, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });
    });

    describe('interceptor state checks', () => {
      it('should deny soft intercept when interceptor is dead (alive=false)', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          alive: false,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(infantry, enemy, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should deny soft intercept when interceptor has 0 HP', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          currentHp: 0,
          alive: true,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(infantry, enemy, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should deny soft intercept when no intercepts remaining', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 0,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(infantry, enemy, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });

      it('should allow soft intercept when intercepts remaining', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 2,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(infantry, enemy, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });
    });

    describe('canSoftIntercept flag', () => {
      it('should use canSoftIntercept flag when set explicitly to true', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'custom-unit',
          team: 'player',
          range: 5, // Ranged, but flag overrides
          canSoftIntercept: true,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(unit, enemy, DEFAULT_CONFIG);

        expect(result).toBe(true);
      });

      it('should use canSoftIntercept flag when set explicitly to false', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'custom-unit',
          team: 'player',
          range: 1, // Melee, but flag overrides
          canSoftIntercept: false,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });

        const result = processor.canSoftIntercept(unit, enemy, DEFAULT_CONFIG);

        expect(result).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // executeSoftIntercept() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('executeSoftIntercept()', () => {
    describe('engagement', () => {
      it('should mark target as engaged', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          engaged: false,
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        const updatedEnemy = result.state.units.find(u => u.id === 'enemy') as BattleUnit & UnitWithIntercept;
        expect(updatedEnemy?.engaged).toBe(true);
      });

      it('should not deal damage (soft intercept is engagement only)', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          stats: { hp: 100, atk: 30, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          currentHp: 100,
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        expect(result.damage).toBe(0);
        expect(result.targetNewHp).toBe(100); // No HP change
        const updatedEnemy = result.state.units.find(u => u.id === 'enemy');
        expect(updatedEnemy?.currentHp).toBe(100);
      });

      it('should not stop movement', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        expect(result.movementStopped).toBe(false);
        expect(result.stoppedAt).toBeUndefined();
      });
    });

    describe('intercept charge consumption', () => {
      it('should consume one intercept charge', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 3,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        expect(result.interceptorInterceptsRemaining).toBe(2); // 3 - 1 = 2
        const updatedInfantry = result.state.units.find(u => u.id === 'infantry') as BattleUnit & UnitWithIntercept;
        expect(updatedInfantry?.interceptsRemaining).toBe(2);
      });

      it('should reduce charges from 1 to 0', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        expect(result.interceptorInterceptsRemaining).toBe(0); // 1 - 1 = 0
      });

      it('should set isIntercepting flag on interceptor', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        const updatedInfantry = result.state.units.find(u => u.id === 'infantry') as BattleUnit & UnitWithIntercept;
        expect(updatedInfantry?.isIntercepting).toBe(true);
      });
    });

    describe('result properties', () => {
      it('should return success=true', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        expect(result.success).toBe(true);
      });

      it('should return type=soft', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
        });
        const state = createTestState([infantry, enemy]);

        const result = processor.executeSoftIntercept(infantry, enemy, state);

        expect(result.type).toBe('soft');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // executeHardIntercept() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('executeHardIntercept()', () => {
    describe('damage calculation', () => {
      it('should deal damage based on ATK * HARD_INTERCEPT_DAMAGE_MULTIPLIER', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          team: 'player',
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          team: 'bot',
          currentHp: 100,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(20 * 1.5) = 30
        expect(result.damage).toBe(30);
        expect(result.targetNewHp).toBe(70); // 100 - 30 = 70
      });

      it('should floor the damage calculation', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          team: 'player',
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          team: 'bot',
          currentHp: 100,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(15 * 1.5) = floor(22.5) = 22
        expect(result.damage).toBe(22);
        expect(result.targetNewHp).toBe(78); // 100 - 22 = 78
      });

      it('should handle zero ATK interceptor (no damage)', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          team: 'player',
          stats: { hp: 100, atk: 0, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          team: 'bot',
          currentHp: 50,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(0 * 1.5) = 0
        expect(result.damage).toBe(0);
        expect(result.targetNewHp).toBe(50); // No change
      });

      it('should handle high ATK interceptor', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          team: 'player',
          stats: { hp: 100, atk: 100, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          team: 'bot',
          currentHp: 80,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(100 * 1.5) = 150
        expect(result.damage).toBe(150);
        expect(result.targetNewHp).toBe(0); // 80 - 150 = -70, clamped to 0
      });
    });

    describe('target HP and alive status', () => {
      it('should reduce target HP by intercept damage', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          stats: { hp: 100, atk: 30, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          currentHp: 100,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(30 * 1.5) = 45
        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry');
        expect(updatedCavalry?.currentHp).toBe(55); // 100 - 45 = 55
        expect(updatedCavalry?.alive).toBe(true);
      });

      it('should set target alive to false when HP reaches 0', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          stats: { hp: 100, atk: 40, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          currentHp: 50,
          alive: true,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(40 * 1.5) = 60
        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry');
        expect(updatedCavalry?.currentHp).toBe(0); // 50 - 60 = -10, clamped to 0
        expect(updatedCavalry?.alive).toBe(false);
      });

      it('should not reduce HP below 0', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          stats: { hp: 100, atk: 100, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          currentHp: 10,
          alive: true,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(100 * 1.5) = 150, but HP is only 10
        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry');
        expect(updatedCavalry?.currentHp).toBe(0); // Clamped to 0, not -140
        expect(updatedCavalry?.alive).toBe(false);
      });
    });

    describe('movement blocking', () => {
      it('should stop cavalry movement', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 3, y: 5 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.movementStopped).toBe(true);
        expect(result.stoppedAt).toEqual(spearman.position);
      });

      it('should reset cavalry momentum', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          momentum: 0.6,
          isCharging: true,
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry') as BattleUnit & UnitWithIntercept;
        expect(updatedCavalry?.momentum).toBe(0);
        expect(updatedCavalry?.isCharging).toBe(false);
      });
    });

    describe('intercept charge consumption', () => {
      it('should consume one intercept charge', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          interceptsRemaining: 3,
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.interceptorInterceptsRemaining).toBe(2); // 3 - 1 = 2
        const updatedSpearman = result.state.units.find(u => u.id === 'spearman') as BattleUnit & UnitWithIntercept;
        expect(updatedSpearman?.interceptsRemaining).toBe(2);
      });

      it('should reduce charges from 1 to 0', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          interceptsRemaining: 1,
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.interceptorInterceptsRemaining).toBe(0); // 1 - 1 = 0
      });

      it('should not reduce charges below 0', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          interceptsRemaining: 0,
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.interceptorInterceptsRemaining).toBe(0); // Clamped to 0
      });

      it('should set isIntercepting flag on interceptor', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
        });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        const updatedSpearman = result.state.units.find(u => u.id === 'spearman') as BattleUnit & UnitWithIntercept;
        expect(updatedSpearman?.isIntercepting).toBe(true);
      });
    });

    describe('result properties', () => {
      it('should return success=true', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player' });
        const cavalry = createCavalry({ team: 'bot' });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.success).toBe(true);
      });

      it('should return type=hard', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({ team: 'player' });
        const cavalry = createCavalry({ team: 'bot' });
        const state = createTestState([spearman, cavalry]);

        const result = processor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.type).toBe('hard');
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // checkIntercept() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('checkIntercept()', () => {
    describe('hard intercept detection', () => {
      it('should detect hard intercept when cavalry passes adjacent to spearman', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 3, y: 5 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        // Cavalry moves from (3,3) to (3,7), passing adjacent to spearman at (3,5)
        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to spearman
          { x: 3, y: 6 },
          { x: 3, y: 7 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        expect(result.hasIntercept).toBe(true);
        expect(result.movementBlocked).toBe(true);
        expect(result.firstIntercept?.type).toBe('hard');
        expect(result.firstIntercept?.interceptor.id).toBe('spearman');
      });

      it('should block movement at intercept position', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 4, y: 5 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        // Cavalry moves from (3,3) to (3,7), passing adjacent to spearman at (4,5)
        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to spearman at (4,5)
          { x: 3, y: 6 },
          { x: 3, y: 7 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        expect(result.movementBlocked).toBe(true);
        expect(result.blockedAt).toEqual({ x: 3, y: 5 });
      });

      it('should not detect hard intercept when cavalry not adjacent to spearman', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 6, y: 5 }, // Far from path
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        expect(result.hasIntercept).toBe(false);
        expect(result.movementBlocked).toBe(false);
      });

      it('should not detect hard intercept for non-cavalry units', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 3, y: 5 },
        });
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'bot',
          position: { x: 3, y: 3 },
          tags: [], // Not cavalry
        });
        const state = createTestState([spearman, infantry]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to spearman
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(infantry, path, state, DEFAULT_CONFIG);

        // Should not trigger hard intercept (infantry is not cavalry)
        // May trigger soft intercept if enabled
        const hardIntercepts = result.opportunities.filter(o => o.type === 'hard');
        expect(hardIntercepts.length).toBe(0);
      });
    });

    describe('intercept charge tracking', () => {
      it('should not detect intercept when spearman has no charges', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 3, y: 5 },
          interceptsRemaining: 0,
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        // Spearman has no charges, so cannot intercept
        const canInterceptOpportunities = result.opportunities.filter(o => o.canIntercept);
        expect(canInterceptOpportunities.length).toBe(0);
        expect(result.movementBlocked).toBe(false);
      });
    });

    describe('multiple interceptors', () => {
      it('should detect first intercept opportunity along path', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman1 = createSpearman({
          id: 'spearman1',
          team: 'player',
          position: { x: 3, y: 4 },
        });
        const spearman2 = createSpearman({
          id: 'spearman2',
          team: 'player',
          position: { x: 3, y: 6 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 2 },
        });
        const state = createTestState([spearman1, spearman2, cavalry]);

        const path: Position[] = [
          { x: 3, y: 2 },
          { x: 3, y: 3 }, // Adjacent to spearman1 at (3,4)
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to spearman2 at (3,6)
          { x: 3, y: 6 },
          { x: 3, y: 7 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        expect(result.hasIntercept).toBe(true);
        expect(result.firstIntercept?.interceptor.id).toBe('spearman1');
        // Movement should be blocked at first intercept
        expect(result.movementBlocked).toBe(true);
      });
    });

    describe('ally detection', () => {
      it('should not intercept allies', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player', // Same team as cavalry
          position: { x: 3, y: 5 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'player', // Same team as spearman
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        expect(result.hasIntercept).toBe(false);
        expect(result.movementBlocked).toBe(false);
      });
    });

    describe('soft intercept detection', () => {
      it('should detect soft intercept when infantry passes adjacent to melee enemy', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          position: { x: 3, y: 5 },
          range: 1, // Melee unit
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          position: { x: 3, y: 3 },
          tags: [], // Not cavalry
        });
        const state = createTestState([infantry, enemy]);

        // Enemy moves from (3,3) to (3,7), passing adjacent to infantry at (3,5)
        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to infantry
          { x: 3, y: 6 },
          { x: 3, y: 7 },
        ];

        const result = processor.checkIntercept(enemy, path, state, DEFAULT_CONFIG);

        expect(result.hasIntercept).toBe(true);
        expect(result.movementBlocked).toBe(false); // Soft intercept doesn't block
        expect(result.firstIntercept?.type).toBe('soft');
        expect(result.firstIntercept?.interceptor.id).toBe('infantry');
      });

      it('should not block movement for soft intercept', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          position: { x: 4, y: 5 },
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          position: { x: 3, y: 3 },
          tags: [],
        });
        const state = createTestState([infantry, enemy]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to infantry at (4,5)
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(enemy, path, state, DEFAULT_CONFIG);

        expect(result.movementBlocked).toBe(false);
        expect(result.blockedAt).toBeUndefined();
      });

      it('should not detect soft intercept when ranged unit is adjacent', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const archer = createInterceptUnit({
          id: 'archer',
          team: 'player',
          position: { x: 3, y: 5 },
          range: 5, // Ranged unit
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          position: { x: 3, y: 3 },
          tags: [],
        });
        const state = createTestState([archer, enemy]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(enemy, path, state, DEFAULT_CONFIG);

        // Ranged units cannot soft intercept
        const softIntercepts = result.opportunities.filter(o => o.type === 'soft' && o.canIntercept);
        expect(softIntercepts.length).toBe(0);
      });

      it('should prioritize hard intercept over soft intercept', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const spearman = createSpearman({
          id: 'spearman',
          team: 'player',
          position: { x: 3, y: 5 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          team: 'bot',
          position: { x: 3, y: 3 },
        });
        const state = createTestState([spearman, cavalry]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        // Hard intercept should be detected (spearman vs cavalry)
        expect(result.firstIntercept?.type).toBe('hard');
        expect(result.movementBlocked).toBe(true);
      });

      it('should detect multiple soft intercepts along path', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const infantry1 = createInterceptUnit({
          id: 'infantry1',
          team: 'player',
          position: { x: 3, y: 4 },
          range: 1,
          interceptsRemaining: 1,
        });
        const infantry2 = createInterceptUnit({
          id: 'infantry2',
          team: 'player',
          position: { x: 3, y: 6 },
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          position: { x: 3, y: 2 },
          tags: [],
        });
        const state = createTestState([infantry1, infantry2, enemy]);

        const path: Position[] = [
          { x: 3, y: 2 },
          { x: 3, y: 3 }, // Adjacent to infantry1 at (3,4)
          { x: 3, y: 4 },
          { x: 3, y: 5 }, // Adjacent to infantry2 at (3,6)
          { x: 3, y: 6 },
          { x: 3, y: 7 },
        ];

        const result = processor.checkIntercept(enemy, path, state, DEFAULT_CONFIG);

        expect(result.hasIntercept).toBe(true);
        // Should have opportunities from both infantry units
        const softIntercepts = result.opportunities.filter(o => o.type === 'soft' && o.canIntercept);
        expect(softIntercepts.length).toBeGreaterThanOrEqual(1);
        expect(result.movementBlocked).toBe(false); // Soft intercepts don't block
      });

      it('should not detect soft intercept when config disables it', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, softIntercept: false };
        const processor = createInterceptProcessor(config);
        const infantry = createInterceptUnit({
          id: 'infantry',
          team: 'player',
          position: { x: 3, y: 5 },
          range: 1,
          interceptsRemaining: 1,
        });
        const enemy = createInterceptUnit({
          id: 'enemy',
          team: 'bot',
          position: { x: 3, y: 3 },
          tags: [],
        });
        const state = createTestState([infantry, enemy]);

        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const result = processor.checkIntercept(enemy, path, state, config);

        // Soft intercept disabled, so no intercept should be detected
        const canInterceptOpportunities = result.opportunities.filter(o => o.canIntercept);
        expect(canInterceptOpportunities.length).toBe(0);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getDisengageCost() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getDisengageCost()', () => {
    describe('basic cost calculation', () => {
      it('should return configured disengage cost when unit is engaged', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 2 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, config);

        expect(cost).toBe(2);
      });

      it('should return 0 when unit is not engaged', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: false,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, DEFAULT_CONFIG);

        expect(cost).toBe(0);
      });

      it('should return 0 when engaged property is undefined', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'unit',
        });
        // Ensure engaged is not set
        delete (unit as Partial<BattleUnit & UnitWithIntercept>).engaged;
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, DEFAULT_CONFIG);

        expect(cost).toBe(0);
      });
    });

    describe('custom disengage costs', () => {
      it('should use custom disengage cost from config', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 3 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, config);

        expect(cost).toBe(3);
      });

      it('should handle disengage cost of 1', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 1 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, config);

        expect(cost).toBe(1);
      });

      it('should handle disengage cost of 0 (free disengage)', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 0 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, config);

        expect(cost).toBe(0);
      });

      it('should handle high disengage cost', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 5 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, config);

        expect(cost).toBe(5);
      });
    });

    describe('default disengage cost', () => {
      it('should use DEFAULT_DISENGAGE_COST (2) when config.disengageCost is undefined', () => {
        const config: InterceptConfig = {
          hardIntercept: true,
          softIntercept: true,
        } as InterceptConfig;
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
        });
        const state = createTestState([unit]);

        const cost = processor.getDisengageCost(unit, state, config);

        // Should fall back to DEFAULT_DISENGAGE_COST which is 2
        expect(cost).toBe(2);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // attemptDisengage() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('attemptDisengage()', () => {
    describe('successful disengage', () => {
      it('should succeed when unit has enough movement', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 2 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 5, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.success).toBe(true);
        expect(result.movementCost).toBe(2);
        expect(result.remainingMovement).toBe(3); // 5 - 2 = 3
      });

      it('should mark unit as no longer engaged after successful disengage', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 2 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 5, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        const updatedUnit = result.state.units.find(u => u.id === 'unit') as BattleUnit & UnitWithIntercept;
        expect(updatedUnit?.engaged).toBe(false);
      });

      it('should trigger Attack of Opportunity on successful disengage', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 2 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 5, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.triggeredAoO).toBe(true);
      });

      it('should succeed when movement exactly equals disengage cost', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 3 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.success).toBe(true);
        expect(result.movementCost).toBe(3);
        expect(result.remainingMovement).toBe(0); // 3 - 3 = 0
      });
    });

    describe('failed disengage', () => {
      it('should fail when unit has insufficient movement', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 3 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_movement');
      });

      it('should not consume movement on failed disengage', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 5 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.success).toBe(false);
        expect(result.movementCost).toBe(0);
        expect(result.remainingMovement).toBe(3); // Original speed unchanged
      });

      it('should not trigger AoO on failed disengage', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 5 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.triggeredAoO).toBe(false);
      });

      it('should keep unit engaged on failed disengage', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 5 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        // State should be unchanged
        const updatedUnit = result.state.units.find(u => u.id === 'unit') as BattleUnit & UnitWithIntercept;
        expect(updatedUnit?.engaged).toBe(true);
      });
    });

    describe('non-engaged unit', () => {
      it('should succeed trivially when unit is not engaged', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: false,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, DEFAULT_CONFIG, 12345);

        expect(result.success).toBe(true);
        expect(result.movementCost).toBe(0);
        expect(result.remainingMovement).toBe(3);
        expect(result.triggeredAoO).toBe(false);
      });

      it('should succeed trivially when engaged is undefined', () => {
        const processor = createInterceptProcessor(DEFAULT_CONFIG);
        const unit = createInterceptUnit({
          id: 'unit',
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 4, initiative: 5, dodge: 0 },
        });
        // Ensure engaged is not set
        delete (unit as Partial<BattleUnit & UnitWithIntercept>).engaged;
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, DEFAULT_CONFIG, 12345);

        expect(result.success).toBe(true);
        expect(result.movementCost).toBe(0);
        expect(result.remainingMovement).toBe(4);
      });
    });

    describe('edge cases', () => {
      it('should handle unit with 0 speed', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 1 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 0, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_movement');
      });

      it('should handle disengage cost of 0 (free disengage)', () => {
        const config: InterceptConfig = { ...DEFAULT_CONFIG, disengageCost: 0 };
        const processor = createInterceptProcessor(config);
        const unit = createInterceptUnit({
          id: 'unit',
          engaged: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([unit]);

        const result = processor.attemptDisengage(unit, state, config, 12345);

        expect(result.success).toBe(true);
        expect(result.movementCost).toBe(0);
        expect(result.remainingMovement).toBe(3);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // resetInterceptCharges() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('resetInterceptCharges()', () => {
    it('should reset intercept charges to max', () => {
      const processor = createInterceptProcessor(DEFAULT_CONFIG);
      const spearman = createSpearman({
        interceptsRemaining: 0,
        maxIntercepts: 2,
      });

      const result = processor.resetInterceptCharges(spearman, 2);

      expect(result.interceptsRemaining).toBe(2);
      expect(result.lastInterceptResetRound).toBe(2);
    });

    it('should use default max intercepts (1) when not specified', () => {
      const processor = createInterceptProcessor(DEFAULT_CONFIG);
      const spearman = createSpearman({
        interceptsRemaining: 0,
      });
      // Remove maxIntercepts to test default
      delete (spearman as Partial<BattleUnit & UnitWithIntercept>).maxIntercepts;

      const result = processor.resetInterceptCharges(spearman, 1);

      expect(result.interceptsRemaining).toBe(1);
    });

    it('should clear isIntercepting flag', () => {
      const processor = createInterceptProcessor(DEFAULT_CONFIG);
      const spearman = createSpearman({
        isIntercepting: true,
      });

      const result = processor.resetInterceptCharges(spearman, 1);

      expect(result.isIntercepting).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DAMAGE MULTIPLIER CONSTANT TEST
  // ═══════════════════════════════════════════════════════════════

  describe('constants', () => {
    it('should have correct HARD_INTERCEPT_DAMAGE_MULTIPLIER', () => {
      expect(HARD_INTERCEPT_DAMAGE_MULTIPLIER).toBe(1.5);
    });

    it('should have correct HARD_INTERCEPT_TAG', () => {
      expect(HARD_INTERCEPT_TAG).toBe('spear_wall');
    });

    it('should have correct CAVALRY_TAG', () => {
      expect(CAVALRY_TAG).toBe('cavalry');
    });

    it('should have correct DEFAULT_DISENGAGE_COST', () => {
      expect(DEFAULT_DISENGAGE_COST).toBe(2);
    });
  });
});
