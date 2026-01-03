/**
 * Tier 3 Integration Tests
 *
 * Tests the integration between Tier 3 mechanics:
 * - Charge + Intercept: Cavalry charge countered by spear wall
 * - Phalanx + Formation: Bonus calculation with adjacent allies
 * - Line of Sight + Units: LoS blocking by units
 * - Overwatch + Ammunition: Ammo consumption during overwatch
 *
 * @module core/mechanics/tier3
 */

import { createChargeProcessor } from './tier3/charge/charge.processor';
import { createInterceptProcessor } from './tier2/intercept/intercept.processor';
import { createPhalanxProcessor } from './tier3/phalanx/phalanx.processor';
import { createLoSProcessor } from './tier3/los/los.processor';
import { createOverwatchProcessor } from './tier3/overwatch/overwatch.processor';
import { createAmmunitionProcessor } from './tier3/ammunition/ammunition.processor';
import {
  DEFAULT_CHARGE_CONFIG,
  DEFAULT_INTERCEPT_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_LOS_CONFIG,
  DEFAULT_AMMO_CONFIG,
} from './config/defaults';
import { createTestUnit, createTestBattleState } from './test-fixtures';
import type { BattleUnit } from '../types';
import type { UnitWithCharge } from './tier3/charge/charge.types';
import type { UnitWithIntercept } from './tier2/intercept/intercept.types';
import type { UnitWithPhalanx } from './tier3/phalanx/phalanx.types';
import type { UnitWithLoS } from './tier3/los/los.types';
import type { UnitWithOverwatch } from './tier3/overwatch/overwatch.types';
import type { UnitWithAmmunition } from './tier3/ammunition/ammunition.types';
import {
  SPEAR_WALL_TAG,
  CAVALRY_TAG,
  CHARGE_TAG,
} from './tier3/charge/charge.types';
import { HARD_INTERCEPT_TAG } from './tier2/intercept/intercept.types';
import { PHALANX_TAG } from './tier3/phalanx/phalanx.types';
import { LOS_TRANSPARENT_TAG } from './tier3/los/los.types';
import { OVERWATCH_TAG } from './tier3/overwatch/overwatch.types';
import { RANGED_TAG } from './tier3/ammunition/ammunition.types';


// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

type ChargeInterceptUnit = BattleUnit & UnitWithCharge & UnitWithIntercept;
type LoSUnit = BattleUnit & UnitWithLoS;
type OverwatchAmmoUnit = BattleUnit & UnitWithOverwatch & UnitWithAmmunition;

function createCavalryUnit(overrides: Partial<ChargeInterceptUnit> = {}): ChargeInterceptUnit {
  const base = createTestUnit({
    id: overrides.id ?? 'cavalry',
    position: overrides.position ?? { x: 3, y: 0 },
    team: overrides.team ?? 'bot',
    stats: { hp: 80, atk: 15, atkCount: 1, armor: 4, speed: 5, initiative: 7, dodge: 0 },
    currentHp: overrides.currentHp ?? 80,
    alive: true,
    range: 1,
  });
  return {
    ...base,
    tags: [CAVALRY_TAG, CHARGE_TAG],
    isCavalry: true,
    canCharge: true,
    momentum: overrides.momentum ?? 0,
    isCharging: overrides.isCharging ?? false,
    facing: 'S',
    ...overrides,
  } as ChargeInterceptUnit;
}

function createSpearmanUnit(overrides: Partial<ChargeInterceptUnit> = {}): ChargeInterceptUnit {
  const base = createTestUnit({
    id: overrides.id ?? 'spearman',
    position: overrides.position ?? { x: 3, y: 5 },
    team: overrides.team ?? 'player',
    stats: { hp: 100, atk: 20, atkCount: 1, armor: 6, speed: 3, initiative: 5, dodge: 0 },
    currentHp: overrides.currentHp ?? 100,
    alive: true,
    range: 1,
  });
  return {
    ...base,
    tags: [SPEAR_WALL_TAG, HARD_INTERCEPT_TAG],
    canHardIntercept: true,
    interceptsRemaining: 1,
    hasZoneOfControl: true,
    facing: 'N',
    ...overrides,
  } as ChargeInterceptUnit;
}

function createPhalanxTestUnit(overrides: Record<string, unknown> = {}): BattleUnit & UnitWithPhalanx {
  const base = createTestUnit({
    id: (overrides['id'] as string) ?? 'phalanx',
    position: (overrides['position'] as { x: number; y: number }) ?? { x: 3, y: 3 },
    team: (overrides['team'] as 'player' | 'bot') ?? 'player',
    stats: { hp: 100, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
    currentHp: (overrides['currentHp'] as number) ?? 100,
    alive: (overrides['alive'] as boolean) ?? true,
    range: 1,
  });
  return {
    ...base,
    tags: [PHALANX_TAG],
    inPhalanx: (overrides['inPhalanx'] as boolean) ?? false,
    adjacentAlliesCount: (overrides['adjacentAlliesCount'] as number) ?? 0,
    phalanxArmorBonus: (overrides['phalanxArmorBonus'] as number) ?? 0,
    phalanxResolveBonus: (overrides['phalanxResolveBonus'] as number) ?? 0,
    facing: (overrides['facing'] as string) ?? 'N',
    ...overrides,
  } as BattleUnit & UnitWithPhalanx;
}

function createLoSTestUnit(overrides: Partial<LoSUnit> = {}): LoSUnit {
  const base = createTestUnit({
    id: overrides.id ?? 'los-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    currentHp: overrides.currentHp ?? 100,
    alive: overrides.alive ?? true,
    range: overrides.range ?? 4,
  });
  return {
    ...base,
    tags: overrides.tags ?? [],
    blocksLoS: overrides.blocksLoS ?? true,
    facing: overrides.facing ?? 'S',
    firingArc: overrides.firingArc ?? 360, // Full 360° arc for testing LoS blocking, not firing arc
    canArcFire: overrides.canArcFire ?? false,
    ...overrides,
  } as LoSUnit;
}


// ═══════════════════════════════════════════════════════════════
// CHARGE + INTERCEPT INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════

describe('Tier 3 Integration Tests', () => {
  describe('Charge + Intercept Integration', () => {
    const chargeProcessor = createChargeProcessor(DEFAULT_CHARGE_CONFIG);
    const interceptProcessor = createInterceptProcessor(DEFAULT_INTERCEPT_CONFIG);

    describe('Cavalry charge countered by Spear Wall', () => {
      it('should detect spear wall counter when cavalry charges', () => {
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
        });

        const isCountered = chargeProcessor.isCounteredBySpearWall(spearman);
        expect(isCountered).toBe(true);
      });

      it('should stop cavalry and deal damage on hard intercept', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 3 },
          momentum: 0.8,
          isCharging: true,
          currentHp: 80,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
        });
        const state = createTestBattleState([cavalry, spearman]);

        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        expect(result.movementStopped).toBe(true);
        expect(result.damage).toBe(30); // floor(20 * 1.5) = 30
        expect(result.targetNewHp).toBe(50); // 80 - 30 = 50
      });

      it('should reset cavalry momentum after spear wall counter', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 3 },
          momentum: 0.8,
          isCharging: true,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
        });
        const state = createTestBattleState([cavalry, spearman]);

        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;
        expect(updatedCavalry?.momentum).toBe(0);
        expect(updatedCavalry?.isCharging).toBe(false);
      });

      it('should calculate momentum based on distance moved', () => {
        // Distance = 4 cells, momentumPerCell = 0.2
        const momentum = chargeProcessor.calculateMomentum(4, DEFAULT_CHARGE_CONFIG);
        expect(momentum).toBe(0.8);
      });

      it('should not grant momentum for short distances', () => {
        // Distance = 2 cells, minChargeDistance = 3
        const momentum = chargeProcessor.calculateMomentum(2, DEFAULT_CHARGE_CONFIG);
        expect(momentum).toBe(0);
      });

      it('should cap momentum at maximum value', () => {
        // Distance = 10 cells, maxMomentum = 1.0
        const momentum = chargeProcessor.calculateMomentum(10, DEFAULT_CHARGE_CONFIG);
        expect(momentum).toBe(1.0);
      });

      it('should apply charge damage bonus based on momentum', () => {
        const baseDamage = 20;
        const momentum = 0.6;
        const bonusDamage = chargeProcessor.applyChargeBonus(baseDamage, momentum);
        expect(bonusDamage).toBe(32); // floor(20 * 1.6) = 32
      });
    });

    describe('Full charge + intercept flow', () => {
      it('should stop cavalry charge when passing adjacent to spearman', () => {
        // Scenario: Cavalry at (3,0) moves through path passing (3,4) adjacent to spearman at (4,4)
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
          currentHp: 80,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 4, y: 4 },
        });
        const state = createTestBattleState([cavalry, spearman]);

        // Path that passes adjacent to spearman
        const path = [
          { x: 3, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 3, y: 3 },
          { x: 3, y: 4 }, // Adjacent to spearman at (4,4)
          { x: 3, y: 5 },
        ];

        // Check for intercept opportunities
        const interceptCheck = interceptProcessor.checkIntercept(cavalry, path, state, DEFAULT_INTERCEPT_CONFIG);

        expect(interceptCheck.hasIntercept).toBe(true);
        expect(interceptCheck.movementBlocked).toBe(true);
        expect(interceptCheck.firstIntercept?.type).toBe('hard');
        expect(interceptCheck.blockedAt).toEqual({ x: 3, y: 4 });
      });

      it('should deal counter damage and reset momentum when cavalry is intercepted', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 3 },
          currentHp: 80,
          momentum: 0.8,
          isCharging: true,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 6, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestBattleState([cavalry, spearman]);

        // Execute hard intercept
        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Verify charge is stopped
        expect(result.movementStopped).toBe(true);

        // Verify counter damage applied (20 * 1.5 = 30)
        expect(result.damage).toBe(30);
        expect(result.targetNewHp).toBe(50); // 80 - 30 = 50

        // Verify momentum reset
        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;
        expect(updatedCavalry.momentum).toBe(0);
        expect(updatedCavalry.isCharging).toBe(false);
      });

      it('should kill cavalry if counter damage exceeds HP', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 3 },
          currentHp: 25, // Low HP
          momentum: 1.0,
          isCharging: true,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
          stats: { hp: 100, atk: 30, atkCount: 1, armor: 6, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestBattleState([cavalry, spearman]);

        // Execute hard intercept - counter damage = 30 * 1.5 = 45
        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Verify cavalry is killed
        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;
        expect(updatedCavalry.currentHp).toBe(0);
        expect(updatedCavalry.alive).toBe(false);
      });

      it('should consume intercept charge from spearman', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 3 },
          currentHp: 80,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
          interceptsRemaining: 1,
        });
        const state = createTestBattleState([cavalry, spearman]);

        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Verify intercept charge consumed
        expect(result.interceptorInterceptsRemaining).toBe(0);
        const updatedSpearman = result.state.units.find(u => u.id === 'spearman') as ChargeInterceptUnit;
        expect(updatedSpearman.interceptsRemaining).toBe(0);
      });

      it('should not intercept when spearman has no intercepts remaining', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 4, y: 4 },
          interceptsRemaining: 0, // No intercepts remaining
        });
        const state = createTestBattleState([cavalry, spearman]);

        const path = [
          { x: 3, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 3, y: 3 },
          { x: 3, y: 4 }, // Adjacent to spearman
          { x: 3, y: 5 },
        ];

        const interceptCheck = interceptProcessor.checkIntercept(cavalry, path, state, DEFAULT_INTERCEPT_CONFIG);

        // Should not have a valid intercept opportunity
        expect(interceptCheck.movementBlocked).toBe(false);
      });

      it('should allow charge to proceed against non-spearman units', () => {
        // Regular infantry without spear wall
        const infantry = createCavalryUnit({
          id: 'infantry',
          instanceId: 'infantry-inst',
          position: { x: 3, y: 4 },
          team: 'player',
          tags: [], // No spear_wall tag
          canCharge: false,
          isCavalry: false,
        }) as ChargeInterceptUnit;
        infantry.canHardIntercept = false;
        infantry.hasSpearWall = false;

        // Charge should not be countered
        const isCountered = chargeProcessor.isCounteredBySpearWall(infantry);
        expect(isCountered).toBe(false);
      });

      it('should integrate charge tracking with intercept check during movement', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
          currentHp: 80,
        });
        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 4, y: 3 },
        });
        let state = createTestBattleState([cavalry, spearman]);

        // Path of 4 cells (enough for charge)
        const path = [
          { x: 3, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 3, y: 3 }, // Adjacent to spearman at (4,3)
        ];

        // First, track movement to build momentum
        state = chargeProcessor.apply('movement', state, {
          activeUnit: cavalry,
          action: { type: 'move', path },
          seed: 12345,
        });

        const updatedCavalry = state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;
        expect(updatedCavalry.chargeDistance).toBe(3);
        expect(updatedCavalry.momentum).toBeCloseTo(0.6);
        expect(updatedCavalry.isCharging).toBe(true);

        // Then check for intercept
        const interceptCheck = interceptProcessor.checkIntercept(updatedCavalry, path, state, DEFAULT_INTERCEPT_CONFIG);
        expect(interceptCheck.hasIntercept).toBe(true);
        expect(interceptCheck.movementBlocked).toBe(true);
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // TASK 29: COMPREHENSIVE CAVALRY VS SPEARMEN SCENARIO
    // ═══════════════════════════════════════════════════════════════

    describe('Comprehensive cavalry vs spearmen scenario (Task 29)', () => {
      /**
       * This test suite validates the complete Spear Wall counter mechanic
       * in a realistic battle scenario where cavalry charges into spearmen.
       *
       * Scenario:
       * - Cavalry unit starts at position (3, 0) with 80 HP
       * - Spearman unit is positioned at (3, 4) with 100 HP and 20 ATK
       * - Cavalry moves 4 cells to charge (building momentum)
       * - Spearman's Spear Wall counters the charge
       *
       * Expected outcomes:
       * 1. Charge is stopped (movement blocked)
       * 2. Counter damage applied to cavalry (ATK * 1.5 = 30 damage)
       * 3. Cavalry momentum reset to 0
       */

      it('should execute complete Spear Wall counter scenario', () => {
        // ─────────────────────────────────────────────────────────────
        // SETUP: Create cavalry and spearman units
        // ─────────────────────────────────────────────────────────────
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
          currentHp: 80,
          momentum: 0,
          isCharging: false,
        });

        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
          currentHp: 100,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 6, speed: 3, initiative: 5, dodge: 0 },
          interceptsRemaining: 1,
        });

        let state = createTestBattleState([cavalry, spearman]);

        // ─────────────────────────────────────────────────────────────
        // PHASE 1: Cavalry builds momentum during movement
        // ─────────────────────────────────────────────────────────────
        const chargePath = [
          { x: 3, y: 0 }, // Start
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 3, y: 3 }, // Adjacent to spearman - 3 cells moved
        ];

        // Track movement to build momentum
        state = chargeProcessor.apply('movement', state, {
          activeUnit: cavalry,
          action: { type: 'move', path: chargePath },
          seed: 12345,
        });

        const cavalryAfterMove = state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;

        // Verify momentum was built (3 cells * 0.2 = 0.6)
        expect(cavalryAfterMove.chargeDistance).toBe(3);
        expect(cavalryAfterMove.momentum).toBeCloseTo(0.6);
        expect(cavalryAfterMove.isCharging).toBe(true);

        // ─────────────────────────────────────────────────────────────
        // PHASE 2: Check for intercept opportunity
        // ─────────────────────────────────────────────────────────────
        const interceptCheck = interceptProcessor.checkIntercept(
          cavalryAfterMove,
          chargePath,
          state,
          DEFAULT_INTERCEPT_CONFIG,
        );

        // VERIFY: Charge is stopped (movement blocked)
        expect(interceptCheck.hasIntercept).toBe(true);
        expect(interceptCheck.movementBlocked).toBe(true);
        expect(interceptCheck.firstIntercept?.type).toBe('hard');
        expect(interceptCheck.blockedAt).toEqual({ x: 3, y: 3 });

        // ─────────────────────────────────────────────────────────────
        // PHASE 3: Execute hard intercept (Spear Wall counter)
        // ─────────────────────────────────────────────────────────────
        const interceptResult = interceptProcessor.executeHardIntercept(
          spearman,
          cavalryAfterMove,
          state,
          12345,
        );

        // VERIFY: Charge is stopped
        expect(interceptResult.movementStopped).toBe(true);
        expect(interceptResult.success).toBe(true);
        expect(interceptResult.type).toBe('hard');

        // VERIFY: Counter damage applied (20 ATK * 1.5 = 30 damage)
        expect(interceptResult.damage).toBe(30);
        expect(interceptResult.targetNewHp).toBe(50); // 80 - 30 = 50

        // VERIFY: Momentum reset
        const cavalryAfterCounter = interceptResult.state.units.find(
          u => u.id === 'cavalry',
        ) as ChargeInterceptUnit;
        expect(cavalryAfterCounter.momentum).toBe(0);
        expect(cavalryAfterCounter.isCharging).toBe(false);

        // VERIFY: Spearman consumed intercept charge
        expect(interceptResult.interceptorInterceptsRemaining).toBe(0);
        const spearmanAfterCounter = interceptResult.state.units.find(
          u => u.id === 'spearman',
        ) as ChargeInterceptUnit;
        expect(spearmanAfterCounter.interceptsRemaining).toBe(0);
      });

      it('should verify charge is stopped at correct position', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 0, y: 0 },
          currentHp: 80,
        });

        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 4, y: 3 }, // Positioned to intercept at (3, 3)
        });

        const state = createTestBattleState([cavalry, spearman]);

        // Long charge path
        const path = [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 3, y: 3 }, // Adjacent to spearman at (4, 3)
          { x: 3, y: 4 },
          { x: 3, y: 5 },
        ];

        const interceptCheck = interceptProcessor.checkIntercept(
          cavalry,
          path,
          state,
          DEFAULT_INTERCEPT_CONFIG,
        );

        // Charge should be stopped at (3, 3), adjacent to spearman
        expect(interceptCheck.movementBlocked).toBe(true);
        expect(interceptCheck.blockedAt).toEqual({ x: 3, y: 3 });
      });

      it('should verify counter damage formula (ATK * 1.5)', () => {
        // Test with different ATK values
        const testCases = [
          { atk: 10, expectedDamage: 15 },  // 10 * 1.5 = 15
          { atk: 15, expectedDamage: 22 },  // 15 * 1.5 = 22.5 -> 22 (floor)
          { atk: 20, expectedDamage: 30 },  // 20 * 1.5 = 30
          { atk: 25, expectedDamage: 37 },  // 25 * 1.5 = 37.5 -> 37 (floor)
        ];

        for (const { atk, expectedDamage } of testCases) {
          const spearman = createSpearmanUnit({
            id: 'spearman',
            instanceId: 'spearman-inst',
            stats: { hp: 100, atk, atkCount: 1, armor: 6, speed: 3, initiative: 5, dodge: 0 },
          });

          const counterDamage = chargeProcessor.calculateCounterDamage(spearman);
          expect(counterDamage).toBe(expectedDamage);
        }
      });

      it('should verify momentum is completely reset after counter', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
          currentHp: 100,
          momentum: 1.0, // Maximum momentum
          isCharging: true,
          chargeDistance: 5,
        });

        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
        });

        const state = createTestBattleState([cavalry, spearman]);

        const result = interceptProcessor.executeHardIntercept(
          spearman,
          cavalry,
          state,
          12345,
        );

        const cavalryAfter = result.state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;

        // All charge-related state should be reset
        expect(cavalryAfter.momentum).toBe(0);
        expect(cavalryAfter.isCharging).toBe(false);
      });

      it('should kill cavalry if counter damage exceeds remaining HP', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 3 },
          currentHp: 20, // Low HP
          momentum: 1.0,
          isCharging: true,
        });

        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 3, y: 4 },
          stats: { hp: 100, atk: 30, atkCount: 1, armor: 6, speed: 3, initiative: 5, dodge: 0 },
        });

        const state = createTestBattleState([cavalry, spearman]);

        // Counter damage = 30 * 1.5 = 45, cavalry HP = 20
        const result = interceptProcessor.executeHardIntercept(
          spearman,
          cavalry,
          state,
          12345,
        );

        const cavalryAfter = result.state.units.find(u => u.id === 'cavalry') as ChargeInterceptUnit;

        expect(result.damage).toBe(45);
        expect(cavalryAfter.currentHp).toBe(0);
        expect(cavalryAfter.alive).toBe(false);
      });

      it('should not counter when spearman has no intercepts remaining', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
        });

        const spearman = createSpearmanUnit({
          id: 'spearman',
          instanceId: 'spearman-inst',
          position: { x: 4, y: 3 },
          interceptsRemaining: 0, // No intercepts left
        });

        const state = createTestBattleState([cavalry, spearman]);

        const path = [
          { x: 3, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 3, y: 3 }, // Adjacent to spearman
        ];

        const interceptCheck = interceptProcessor.checkIntercept(
          cavalry,
          path,
          state,
          DEFAULT_INTERCEPT_CONFIG,
        );

        // Should not block movement when no intercepts remaining
        expect(interceptCheck.movementBlocked).toBe(false);
      });

      it('should allow charge against non-spearman units', () => {
        const cavalry = createCavalryUnit({
          id: 'cavalry',
          instanceId: 'cavalry-inst',
          position: { x: 3, y: 0 },
          currentHp: 80,
          momentum: 0.8,
          isCharging: true,
        });

        // Regular infantry without spear wall
        const infantry = createCavalryUnit({
          id: 'infantry',
          instanceId: 'infantry-inst',
          position: { x: 3, y: 4 },
          team: 'player',
          currentHp: 100,
          tags: [], // No spear_wall tag
          canCharge: false,
          isCavalry: false,
        }) as ChargeInterceptUnit;
        infantry.canHardIntercept = false;
        infantry.hasSpearWall = false;

        const state = createTestBattleState([cavalry, infantry]);

        // Execute charge against infantry
        const result = chargeProcessor.executeCharge(
          cavalry,
          infantry,
          state,
          DEFAULT_CHARGE_CONFIG,
          12345,
        );

        // Charge should succeed (not countered)
        expect(result.success).toBe(true);
        expect(result.wasCountered).toBe(false);
        // Damage = 15 * (1 + 0.8) = 27
        expect(result.damage).toBe(27);
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PHALANX BONUS CALCULATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Phalanx Bonus Calculation', () => {
    const phalanxProcessor = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

    describe('Formation detection', () => {
      it('should detect phalanx formation with adjacent allies', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });
        const state = createTestBattleState([unit1, unit2]);

        const result = phalanxProcessor.detectFormation(unit1, state);

        expect(result.canFormPhalanx).toBe(true);
        expect(result.adjacentAllies.length).toBe(1);
      });

      it('should not detect formation when allies face different directions', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'S',
        });
        const state = createTestBattleState([unit1, unit2]);

        const result = phalanxProcessor.detectFormation(unit1, state);

        expect(result.canFormPhalanx).toBe(false);
      });

      it('should not detect formation with non-adjacent allies', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 5, y: 3 },
          facing: 'N',
        });
        const state = createTestBattleState([unit1, unit2]);

        const result = phalanxProcessor.detectFormation(unit1, state);

        expect(result.canFormPhalanx).toBe(false);
      });
    });

    describe('Bonus calculation', () => {
      it('should calculate bonuses based on adjacent allies', () => {
        const bonuses = phalanxProcessor.calculateBonuses(2, DEFAULT_PHALANX_CONFIG);

        // 2 allies * 1 armor per ally = 2 armor bonus
        expect(bonuses.armorBonus).toBe(2);
        // 2 allies * 5 resolve per ally = 10 resolve bonus
        expect(bonuses.resolveBonus).toBe(10);
      });

      it('should cap armor bonus at maximum', () => {
        const bonuses = phalanxProcessor.calculateBonuses(10, DEFAULT_PHALANX_CONFIG);

        expect(bonuses.armorBonus).toBe(DEFAULT_PHALANX_CONFIG.maxArmorBonus);
      });

      it('should cap resolve bonus at maximum', () => {
        const bonuses = phalanxProcessor.calculateBonuses(10, DEFAULT_PHALANX_CONFIG);

        expect(bonuses.resolveBonus).toBe(DEFAULT_PHALANX_CONFIG.maxResolveBonus);
      });

      it('should return zero bonuses for zero adjacent allies', () => {
        const bonuses = phalanxProcessor.calculateBonuses(0, DEFAULT_PHALANX_CONFIG);

        expect(bonuses.armorBonus).toBe(0);
        expect(bonuses.resolveBonus).toBe(0);
        expect(bonuses.formationState).toBe('none');
      });

      it('should indicate partial formation state for 1-3 allies', () => {
        const bonuses = phalanxProcessor.calculateBonuses(2, DEFAULT_PHALANX_CONFIG);

        expect(bonuses.formationState).toBe('partial');
      });

      it('should indicate full formation state for 4+ allies', () => {
        const bonuses = phalanxProcessor.calculateBonuses(4, DEFAULT_PHALANX_CONFIG);

        expect(bonuses.formationState).toBe('full');
      });

      it('should track raw bonuses before capping', () => {
        const bonuses = phalanxProcessor.calculateBonuses(10, DEFAULT_PHALANX_CONFIG);

        // Raw bonuses should be uncapped
        expect(bonuses.rawArmorBonus).toBe(10); // 10 * 1
        expect(bonuses.rawResolveBonus).toBe(50); // 10 * 5
        // Capped bonuses
        expect(bonuses.armorBonus).toBe(5);
        expect(bonuses.resolveBonus).toBe(25);
        expect(bonuses.cappedArmor).toBe(true);
        expect(bonuses.cappedResolve).toBe(true);
      });
    });

    describe('Effective armor and resolve', () => {
      it('should calculate effective armor with phalanx bonus', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
          phalanxArmorBonus: 3,
        });

        const effectiveArmor = phalanxProcessor.getEffectiveArmor(unit);

        expect(effectiveArmor).toBe(11); // 8 base + 3 bonus
      });

      it('should calculate effective resolve with phalanx bonus', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          resolve: 80,
          phalanxResolveBonus: 15,
        });

        const effectiveResolve = phalanxProcessor.getEffectiveResolve(unit);

        expect(effectiveResolve).toBe(95); // 80 base + 15 bonus
      });

      it('should return base armor when no phalanx bonus', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
          phalanxArmorBonus: 0,
        });

        const effectiveArmor = phalanxProcessor.getEffectiveArmor(unit);

        expect(effectiveArmor).toBe(8);
      });
    });

    describe('Full formation with multiple allies', () => {
      it('should detect formation with 3 adjacent allies', () => {
        // Create a cross formation:
        //     unit2
        // unit3 unit1 unit4
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 3, y: 2 }, // North of unit1
          facing: 'N',
        });
        const unit3 = createPhalanxTestUnit({
          id: 'unit3',
          instanceId: 'unit3-inst',
          position: { x: 2, y: 3 }, // West of unit1
          facing: 'N',
        });
        const unit4 = createPhalanxTestUnit({
          id: 'unit4',
          instanceId: 'unit4-inst',
          position: { x: 4, y: 3 }, // East of unit1
          facing: 'N',
        });
        const state = createTestBattleState([unit1, unit2, unit3, unit4]);

        const result = phalanxProcessor.detectFormation(unit1, state);

        expect(result.canFormPhalanx).toBe(true);
        expect(result.alignedCount).toBe(3);
        expect(result.totalAdjacent).toBe(3);
      });

      it('should calculate maximum bonuses for full formation', () => {
        // Create a full cross formation with 4 adjacent allies
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 3, y: 2 }, // North
          facing: 'N',
        });
        const unit3 = createPhalanxTestUnit({
          id: 'unit3',
          instanceId: 'unit3-inst',
          position: { x: 2, y: 3 }, // West
          facing: 'N',
        });
        const unit4 = createPhalanxTestUnit({
          id: 'unit4',
          instanceId: 'unit4-inst',
          position: { x: 4, y: 3 }, // East
          facing: 'N',
        });
        const unit5 = createPhalanxTestUnit({
          id: 'unit5',
          instanceId: 'unit5-inst',
          position: { x: 3, y: 4 }, // South
          facing: 'N',
        });
        const state = createTestBattleState([unit1, unit2, unit3, unit4, unit5]);

        const result = phalanxProcessor.detectFormation(unit1, state);

        expect(result.canFormPhalanx).toBe(true);
        expect(result.alignedCount).toBe(4);

        const bonuses = phalanxProcessor.calculateBonuses(result.alignedCount, DEFAULT_PHALANX_CONFIG);
        expect(bonuses.armorBonus).toBe(4); // 4 * 1 = 4 (not capped)
        expect(bonuses.resolveBonus).toBe(20); // 4 * 5 = 20 (not capped)
        expect(bonuses.formationState).toBe('full');
      });
    });

    describe('Recalculation after casualties', () => {
      it('should recalculate bonuses when ally dies', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          adjacentAlliesCount: 2,
          phalanxArmorBonus: 2,
          phalanxResolveBonus: 10,
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          inPhalanx: true,
        });
        const unit3 = createPhalanxTestUnit({
          id: 'unit3',
          instanceId: 'unit3-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
          alive: false, // This unit died
          currentHp: 0,
        });
        const state = createTestBattleState([unit1, unit2, unit3]);

        const result = phalanxProcessor.recalculate(state, 'unit_death');

        // unit1 should now only have 1 adjacent ally
        const updatedUnit1 = result.state.units.find(u => u.id === 'unit1') as unknown as UnitWithPhalanx;
        expect(updatedUnit1.adjacentAlliesCount).toBe(1);
        expect(updatedUnit1.phalanxArmorBonus).toBe(1);
        expect(updatedUnit1.phalanxResolveBonus).toBe(5);
      });

      it('should clear phalanx when last ally dies', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          adjacentAlliesCount: 1,
          phalanxArmorBonus: 1,
          phalanxResolveBonus: 5,
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          alive: false, // Last ally died
          currentHp: 0,
        });
        const state = createTestBattleState([unit1, unit2]);

        const result = phalanxProcessor.recalculate(state, 'unit_death');

        const updatedUnit1 = result.state.units.find(u => u.id === 'unit1') as unknown as UnitWithPhalanx;
        expect(updatedUnit1.inPhalanx).toBe(false);
        expect(updatedUnit1.adjacentAlliesCount).toBe(0);
        expect(updatedUnit1.phalanxArmorBonus).toBe(0);
        expect(updatedUnit1.phalanxResolveBonus).toBe(0);
      });

      it('should track formation changes in recalculation result', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          adjacentAlliesCount: 1,
          phalanxArmorBonus: 1,
          phalanxResolveBonus: 5,
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          alive: false,
          currentHp: 0,
        });
        const state = createTestBattleState([unit1, unit2]);

        const result = phalanxProcessor.recalculate(state, 'unit_death');

        expect(result.formationsChanged).toBeGreaterThan(0);
        expect(result.totalArmorBonusChange).toBeLessThan(0);
        expect(result.totalResolveBonusChange).toBeLessThan(0);
      });
    });

    describe('Apply method integration', () => {
      it('should recalculate phalanx at turn start', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });
        const state = createTestBattleState([unit1, unit2]);

        const result = phalanxProcessor.apply('turn_start', state, {
          activeUnit: unit1,
          seed: 12345,
        });

        const updatedUnit1 = result.units.find(u => u.id === 'unit1') as unknown as UnitWithPhalanx;
        expect(updatedUnit1.inPhalanx).toBe(true);
        expect(updatedUnit1.phalanxArmorBonus).toBe(1);
        expect(updatedUnit1.phalanxResolveBonus).toBe(5);
      });

      it('should recalculate phalanx after target death in post_attack', () => {
        const unit1 = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          adjacentAlliesCount: 2,
          phalanxArmorBonus: 2,
          phalanxResolveBonus: 10,
        });
        const unit2 = createPhalanxTestUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          inPhalanx: true,
        });
        const deadTarget = createPhalanxTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
          alive: false,
          currentHp: 0,
        });
        const attacker = createPhalanxTestUnit({
          id: 'attacker',
          instanceId: 'attacker-inst',
          position: { x: 3, y: 5 },
          team: 'bot',
        });
        const state = createTestBattleState([unit1, unit2, deadTarget, attacker]);

        const result = phalanxProcessor.apply('post_attack', state, {
          activeUnit: attacker,
          target: deadTarget,
          seed: 12345,
        });

        // unit1 should have reduced bonuses after ally death
        const updatedUnit1 = result.units.find(u => u.id === 'unit1') as unknown as UnitWithPhalanx;
        expect(updatedUnit1.adjacentAlliesCount).toBe(1);
        expect(updatedUnit1.phalanxArmorBonus).toBe(1);
        expect(updatedUnit1.phalanxResolveBonus).toBe(5);
      });
    });

    describe('isInPhalanx check', () => {
      it('should return true for unit in phalanx with adjacent allies', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          inPhalanx: true,
          adjacentAlliesCount: 2,
        });

        expect(phalanxProcessor.isInPhalanx(unit)).toBe(true);
      });

      it('should return false for unit not in phalanx', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          inPhalanx: false,
          adjacentAlliesCount: 0,
        });

        expect(phalanxProcessor.isInPhalanx(unit)).toBe(false);
      });

      it('should return false for unit marked in phalanx but with no allies', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          inPhalanx: true,
          adjacentAlliesCount: 0,
        });

        expect(phalanxProcessor.isInPhalanx(unit)).toBe(false);
      });
    });

    describe('clearPhalanx', () => {
      it('should clear all phalanx state from unit', () => {
        const unit = createPhalanxTestUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          inPhalanx: true,
          adjacentAlliesCount: 3,
          phalanxArmorBonus: 3,
          phalanxResolveBonus: 15,
          phalanxState: 'partial',
        });

        const cleared = phalanxProcessor.clearPhalanx(unit);
        const clearedProps = cleared as unknown as UnitWithPhalanx;

        expect(clearedProps.inPhalanx).toBe(false);
        expect(clearedProps.adjacentAlliesCount).toBe(0);
        expect(clearedProps.phalanxArmorBonus).toBe(0);
        expect(clearedProps.phalanxResolveBonus).toBe(0);
        expect(clearedProps.phalanxState).toBe('none');
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // LINE OF SIGHT BLOCKING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Line of Sight Blocking', () => {
    const losProcessor = createLoSProcessor(DEFAULT_LOS_CONFIG);

    describe('LoS blocked by units', () => {
      it('should detect LoS blocked by unit in path', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const blocker = createLoSTestUnit({
          id: 'blocker',
          instanceId: 'blocker-inst',
          position: { x: 2, y: 0 },
          blocksLoS: true,
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
        });
        const state = createTestBattleState([archer, blocker, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(false);
        expect(result.obstacles.length).toBeGreaterThan(0);
      });

      it('should allow LoS when path is clear', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
        });
        const state = createTestBattleState([archer, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(true);
      });

      it('should not block LoS with transparent units', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const ghost = createLoSTestUnit({
          id: 'ghost',
          instanceId: 'ghost-inst',
          position: { x: 2, y: 0 },
          blocksLoS: false,
          tags: [LOS_TRANSPARENT_TAG],
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
        });
        const state = createTestBattleState([archer, ghost, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(true);
      });

      it('should not block LoS with dead units', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const deadUnit = createLoSTestUnit({
          id: 'dead',
          instanceId: 'dead-inst',
          position: { x: 2, y: 0 },
          alive: false,
          currentHp: 0,
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
        });
        const state = createTestBattleState([archer, deadUnit, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(true);
      });

      it('should detect multiple blockers in path', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 8,
        });
        const blocker1 = createLoSTestUnit({
          id: 'blocker1',
          instanceId: 'blocker1-inst',
          position: { x: 2, y: 0 },
          blocksLoS: true,
          team: 'bot',
        });
        const blocker2 = createLoSTestUnit({
          id: 'blocker2',
          instanceId: 'blocker2-inst',
          position: { x: 4, y: 0 },
          blocksLoS: true,
          team: 'bot',
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 6, y: 0 },
          team: 'bot',
        });
        const state = createTestBattleState([archer, blocker1, blocker2, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(false);
        expect(result.obstacles.length).toBe(2);
        expect(result.obstacles[0]?.unitId).toBe('blocker1-inst');
        expect(result.obstacles[1]?.unitId).toBe('blocker2-inst');
      });

      it('should block LoS when ally is in the path (friendly fire prevention)', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
          team: 'player',
        });
        const ally = createLoSTestUnit({
          id: 'ally',
          instanceId: 'ally-inst',
          position: { x: 2, y: 0 },
          blocksLoS: true,
          team: 'player', // Same team as archer
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
          team: 'bot',
        });
        const state = createTestBattleState([archer, ally, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(false);
        expect(result.obstacles.length).toBe(1);
        expect(result.obstacles[0]?.unitId).toBe('ally-inst');
        expect(result.blockReason).toBe('blocked_by_unit');
      });

      it('should identify blocking unit in obstacle info', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const blocker = createLoSTestUnit({
          id: 'infantry',
          instanceId: 'infantry-inst',
          position: { x: 2, y: 0 },
          blocksLoS: true,
          team: 'bot',
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
          team: 'bot',
        });
        const state = createTestBattleState([archer, blocker, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(false);
        expect(result.obstacles[0]?.type).toBe('unit');
        expect(result.obstacles[0]?.unitId).toBe('infantry-inst');
        expect(result.obstacles[0]?.blocksCompletely).toBe(true);
      });
    });

    describe('Diagonal LoS', () => {
      it('should check LoS along diagonal path', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        });
        const state = createTestBattleState([archer, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(true);
      });

      it('should detect blocker on diagonal path', () => {
        const archer = createLoSTestUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 0, y: 0 },
          range: 6,
        });
        const blocker = createLoSTestUnit({
          id: 'blocker',
          instanceId: 'blocker-inst',
          position: { x: 2, y: 2 },
          blocksLoS: true,
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 4 },
        });
        const state = createTestBattleState([archer, blocker, target]);

        const result = losProcessor.checkLoS(archer, target, state);

        expect(result.hasLoS).toBe(false);
      });
    });

    describe('LoS blocking with arc fire fallback', () => {
      it('should allow arc fire when direct LoS is blocked', () => {
        const artillery = createLoSTestUnit({
          id: 'artillery',
          instanceId: 'artillery-inst',
          position: { x: 0, y: 0 },
          range: 6,
          canArcFire: true,
        });
        const blocker = createLoSTestUnit({
          id: 'blocker',
          instanceId: 'blocker-inst',
          position: { x: 2, y: 0 },
          blocksLoS: true,
          team: 'bot',
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
          team: 'bot',
        });
        const state = createTestBattleState([artillery, blocker, target]);

        const result = losProcessor.checkLoS(artillery, target, state);

        expect(result.hasLoS).toBe(true);
        expect(result.directLoS).toBe(false);
        expect(result.arcLoS).toBe(true);
        expect(result.recommendedMode).toBe('arc');
        expect(result.obstacles.length).toBe(1);
      });

      it('should block completely when unit cannot arc fire and direct is blocked', () => {
        const crossbow = createLoSTestUnit({
          id: 'crossbow',
          instanceId: 'crossbow-inst',
          position: { x: 0, y: 0 },
          range: 6,
          canArcFire: false,
        });
        const blocker = createLoSTestUnit({
          id: 'blocker',
          instanceId: 'blocker-inst',
          position: { x: 2, y: 0 },
          blocksLoS: true,
          team: 'bot',
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
          team: 'bot',
        });
        const state = createTestBattleState([crossbow, blocker, target]);

        const result = losProcessor.checkLoS(crossbow, target, state);

        expect(result.hasLoS).toBe(false);
        expect(result.directLoS).toBe(false);
        expect(result.arcLoS).toBe(false);
        expect(result.recommendedMode).toBe('blocked');
        expect(result.blockReason).toBe('blocked_by_unit');
      });

      it('should prefer direct fire when path is clear even if arc fire available', () => {
        const artillery = createLoSTestUnit({
          id: 'artillery',
          instanceId: 'artillery-inst',
          position: { x: 0, y: 0 },
          range: 6,
          canArcFire: true,
        });
        const target = createLoSTestUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 0 },
          team: 'bot',
        });
        const state = createTestBattleState([artillery, target]);

        const result = losProcessor.checkLoS(artillery, target, state);

        expect(result.hasLoS).toBe(true);
        expect(result.directLoS).toBe(true);
        expect(result.arcLoS).toBe(true);
        expect(result.recommendedMode).toBe('direct');
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // OVERWATCH + AMMUNITION INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Overwatch + Ammunition Integration', () => {
    const overwatchProcessor = createOverwatchProcessor();
    const ammunitionProcessor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    /**
     * Creates a ranged unit with overwatch and ammunition properties.
     */
    function createOverwatchArcherUnit(
      overrides: Partial<OverwatchAmmoUnit> = {},
    ): OverwatchAmmoUnit {
      const base = createTestUnit({
        id: overrides.id ?? 'archer',
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
      });
      return {
        ...base,
        canOverwatch: overrides.canOverwatch ?? true,
        vigilance: overrides.vigilance ?? 'inactive',
        overwatchShotsRemaining: overrides.overwatchShotsRemaining ?? 2,
        maxOverwatchShots: overrides.maxOverwatchShots ?? 2,
        overwatchRange: overrides.overwatchRange ?? overrides.range ?? 4,
        overwatchTargetsFired: overrides.overwatchTargetsFired ?? [],
        enteredVigilanceThisTurn: overrides.enteredVigilanceThisTurn ?? false,
        ammo: overrides.ammo ?? 6,
        maxAmmo: overrides.maxAmmo ?? 6,
        resourceType: 'ammo',
        tags: overrides.tags ?? [OVERWATCH_TAG, RANGED_TAG],
        ...overrides,
      } as OverwatchAmmoUnit;
    }

    /**
     * Creates a melee enemy unit for overwatch testing.
     */
    function createEnemyMeleeUnit(
      overrides: Partial<BattleUnit> = {},
    ): BattleUnit {
      return createTestUnit({
        id: overrides.id ?? 'enemy',
        position: overrides.position ?? { x: 3, y: 7 },
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
    }

    describe('Overwatch shot consumes ammunition', () => {
      it('should consume 1 ammo when overwatch shot is fired', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'active',
          ammo: 6,
          overwatchShotsRemaining: 2,
        });
        const enemy = createEnemyMeleeUnit({
          id: 'enemy',
          instanceId: 'enemy-inst',
          position: { x: 3, y: 7 },
          currentHp: 80,
        });
        const state = createTestBattleState([archer, enemy]);

        // Execute overwatch shot
        const result = overwatchProcessor.executeOverwatchShot(
          archer,
          enemy as OverwatchAmmoUnit,
          state,
          12345,
        );

        // Verify ammo was consumed
        expect(result.ammoConsumed).toBe(1);
        expect(result.watcherAmmoRemaining).toBe(5);

        // Verify state was updated
        const updatedArcher = result.state.units.find(u => u.id === 'archer') as OverwatchAmmoUnit;
        expect(updatedArcher.ammo).toBe(5);
      });

      it('should consume ammo for each overwatch shot in sequence', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'active',
          ammo: 6,
          overwatchShotsRemaining: 2,
        });
        const enemy1 = createEnemyMeleeUnit({
          id: 'enemy1',
          instanceId: 'enemy1-inst',
          position: { x: 3, y: 7 },
          currentHp: 80,
        });
        const enemy2 = createEnemyMeleeUnit({
          id: 'enemy2',
          instanceId: 'enemy2-inst',
          position: { x: 4, y: 7 },
          currentHp: 80,
        });
        let state = createTestBattleState([archer, enemy1, enemy2]);

        // First overwatch shot
        const result1 = overwatchProcessor.executeOverwatchShot(
          archer,
          enemy1 as OverwatchAmmoUnit,
          state,
          12345,
        );
        state = result1.state;

        // Get updated archer for second shot
        const archerAfterFirst = state.units.find(u => u.id === 'archer') as OverwatchAmmoUnit;
        expect(archerAfterFirst.ammo).toBe(5);

        // Second overwatch shot (need to update archer's overwatchTargetsFired)
        const archerForSecondShot: OverwatchAmmoUnit = {
          ...archerAfterFirst,
          vigilance: 'active', // Reset to active for second shot
          overwatchShotsRemaining: 1,
        };

        const result2 = overwatchProcessor.executeOverwatchShot(
          archerForSecondShot,
          enemy2 as OverwatchAmmoUnit,
          state,
          12346,
        );

        // Verify ammo consumed for both shots
        const finalArcher = result2.state.units.find(u => u.id === 'archer') as OverwatchAmmoUnit;
        expect(finalArcher.ammo).toBe(4); // 6 - 2 = 4
      });

      it('should not allow overwatch when unit has no ammo', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'inactive',
          ammo: 0, // No ammo
        });
        const state = createTestBattleState([archer]);

        // Try to enter vigilance with no ammo
        const result = overwatchProcessor.enterVigilance(archer, state);

        expect(result.success).toBe(false);
        expect(result.reason).toBe('no_ammo');
      });

      it('should block overwatch opportunity when watcher has no ammo', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'active',
          ammo: 0, // No ammo
          overwatchShotsRemaining: 2,
        });
        const enemy = createEnemyMeleeUnit({
          id: 'enemy',
          instanceId: 'enemy-inst',
          position: { x: 3, y: 7 },
        });
        const state = createTestBattleState([archer, enemy]);

        // Enemy moves through archer's range
        const path = [
          { x: 3, y: 7 },
          { x: 3, y: 6 },
          { x: 3, y: 5 },
        ];

        const result = overwatchProcessor.checkOverwatch(
          enemy as OverwatchAmmoUnit,
          path,
          state,
        );

        // Should detect opportunity but cannot fire due to no ammo
        expect(result.hasOverwatch).toBe(false);
        expect(result.opportunities.length).toBe(1);
        expect(result.opportunities[0]?.canFire).toBe(false);
        expect(result.opportunities[0]?.reason).toBe('no_ammo');
      });
    });

    describe('Ammunition state affects overwatch capability', () => {
      it('should allow entering vigilance when unit has ammo', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          ammo: 3,
          vigilance: 'inactive',
        });
        const state = createTestBattleState([archer]);

        // Check ammo state
        const ammoCheck = ammunitionProcessor.checkAmmo(archer);
        expect(ammoCheck.canAttack).toBe(true);
        expect(ammoCheck.hasAmmo).toBe(true);

        // Enter vigilance
        const result = overwatchProcessor.enterVigilance(archer, state);
        expect(result.success).toBe(true);
        expect(result.unit.vigilance).toBe('active');
      });

      it('should track ammo consumption through ammunition processor', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          ammo: 3,
        });
        const state = createTestBattleState([archer]);

        // Consume ammo via ammunition processor
        const consumeResult = ammunitionProcessor.consumeAmmo(archer, state, 1);

        expect(consumeResult.success).toBe(true);
        expect(consumeResult.ammoConsumed).toBe(1);
        expect(consumeResult.ammoRemaining).toBe(2);
        expect(consumeResult.unit.ammo).toBe(2);
      });

      it('should prevent overwatch when ammo is depleted during battle', () => {
        // Start with 1 ammo
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'active',
          ammo: 1,
          overwatchShotsRemaining: 2,
        });
        const enemy = createEnemyMeleeUnit({
          id: 'enemy',
          instanceId: 'enemy-inst',
          position: { x: 3, y: 7 },
          currentHp: 80,
        });
        let state = createTestBattleState([archer, enemy]);

        // First shot depletes ammo
        const result1 = overwatchProcessor.executeOverwatchShot(
          archer,
          enemy as OverwatchAmmoUnit,
          state,
          12345,
        );
        state = result1.state;

        expect(result1.watcherAmmoRemaining).toBe(0);

        // Get updated archer
        const archerAfterShot = state.units.find(u => u.id === 'archer') as OverwatchAmmoUnit;
        expect(archerAfterShot.ammo).toBe(0);

        // Try to check for more overwatch opportunities
        const enemy2 = createEnemyMeleeUnit({
          id: 'enemy2',
          instanceId: 'enemy2-inst',
          position: { x: 4, y: 7 },
        });
        state = createTestBattleState([archerAfterShot, enemy2]);

        const path = [
          { x: 4, y: 7 },
          { x: 4, y: 6 },
          { x: 4, y: 5 },
        ];

        const result2 = overwatchProcessor.checkOverwatch(
          enemy2 as OverwatchAmmoUnit,
          path,
          state,
        );

        // Should not be able to fire due to no ammo
        expect(result2.hasOverwatch).toBe(false);
      });
    });

    describe('Full overwatch + ammunition flow during movement phase', () => {
      it('should consume ammo when overwatch triggers during movement', () => {
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'active',
          ammo: 6,
          overwatchRange: 4,
          overwatchShotsRemaining: 2,
        });
        const enemy = createEnemyMeleeUnit({
          id: 'enemy',
          instanceId: 'enemy-inst',
          position: { x: 3, y: 7 },
          currentHp: 80,
        });
        const state = createTestBattleState([archer, enemy]);

        // Enemy moves through archer's overwatch range
        const path = [
          { x: 3, y: 7 },
          { x: 3, y: 6 },
          { x: 3, y: 5 }, // Within range 4 of archer at y=3
        ];

        // Apply overwatch during movement phase
        const result = overwatchProcessor.apply('movement', state, {
          activeUnit: enemy,
          action: { type: 'move', path },
          seed: 12345,
        });

        // Verify archer's ammo was consumed
        const updatedArcher = result.units.find(u => u.id === 'archer') as OverwatchAmmoUnit;
        expect(updatedArcher.ammo).toBeLessThan(6);
      });

      it('should stop firing overwatch when ammo runs out mid-movement', () => {
        // Archer with only 1 ammo
        const archer = createOverwatchArcherUnit({
          id: 'archer',
          instanceId: 'archer-inst',
          position: { x: 3, y: 3 },
          vigilance: 'active',
          ammo: 1,
          overwatchRange: 6,
          overwatchShotsRemaining: 3, // Has shots but limited ammo
        });
        const enemy = createEnemyMeleeUnit({
          id: 'enemy',
          instanceId: 'enemy-inst',
          position: { x: 3, y: 9 },
          currentHp: 80,
        });
        const state = createTestBattleState([archer, enemy]);

        // Long path through overwatch range
        const path = [
          { x: 3, y: 9 },
          { x: 3, y: 8 },
          { x: 3, y: 7 },
          { x: 3, y: 6 },
          { x: 3, y: 5 },
          { x: 3, y: 4 },
        ];

        // Apply overwatch during movement
        const result = overwatchProcessor.apply('movement', state, {
          activeUnit: enemy,
          action: { type: 'move', path },
          seed: 12345,
        });

        // Verify archer's ammo is depleted
        const updatedArcher = result.units.find(u => u.id === 'archer') as OverwatchAmmoUnit;
        expect(updatedArcher.ammo).toBe(0);
      });
    });
  });
});
