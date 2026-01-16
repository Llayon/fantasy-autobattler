/**
 * Tier 4 Integration Tests
 *
 * Tests the integration between Tier 4 mechanics:
 * - Contagion + Phalanx: Increased spread chance in formations
 * - Armor Shred: Accumulation and cap enforcement
 * - Contagion spread mechanics
 *
 * @module core/mechanics/tier4
 */

import { createContagionProcessor } from './tier4/contagion/contagion.processor';
import { createShredProcessor } from './tier4/armor-shred/armor-shred.processor';
import { createPhalanxProcessor } from './tier3/phalanx/phalanx.processor';
import {
  DEFAULT_CONTAGION_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_SHRED_CONFIG,
} from './config/defaults';
import { createTestUnit, createTestBattleState } from './test-fixtures';
import type { BattleUnit, BattleState } from '../types';
import type { ContagionType, UnitWithContagion } from './tier4/contagion/contagion.types';
import type { UnitWithArmorShred } from './tier4/armor-shred/armor-shred.types';
import { PHALANX_TAG } from './tier3/phalanx/phalanx.types';
import {
  DEFAULT_FIRE_SPREAD,
  DEFAULT_PHALANX_SPREAD_BONUS,
} from './tier4/contagion/contagion.types';
import type { ContagionConfig, ShredConfig } from './config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a phalanx-capable unit for testing contagion spread.
 * Uses Record<string, unknown> for overrides to avoid type conflicts.
 */
function createPhalanxUnit(overrides: Record<string, unknown> = {}): BattleUnit {
  const base = createTestUnit({
    id: (overrides['id'] as string) ?? 'phalanx-unit',
    position: (overrides['position'] as { x: number; y: number }) ?? { x: 3, y: 3 },
    team: (overrides['team'] as 'player' | 'bot') ?? 'player',
    stats: { hp: 100, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
    currentHp: (overrides['currentHp'] as number) ?? 100,
    alive: (overrides['alive'] as boolean) ?? true,
    range: 1,
  });

  return {
    ...base,
    instanceId: (overrides['instanceId'] as string) ?? base.instanceId,
    tags: [PHALANX_TAG],
    inPhalanx: (overrides['inPhalanx'] as boolean) ?? false,
    adjacentAlliesCount: (overrides['adjacentAlliesCount'] as number) ?? 0,
    phalanxArmorBonus: (overrides['phalanxArmorBonus'] as number) ?? 0,
    phalanxResolveBonus: (overrides['phalanxResolveBonus'] as number) ?? 0,
    facing: (overrides['facing'] as string) ?? 'N',
    statusEffects: (overrides['statusEffects'] as Array<{ type: string; duration: number }>) ?? [],
  } as BattleUnit;
}

/**
 * Creates a mock battle state for testing.
 */
function createMockState(units: BattleUnit[]): BattleState {
  return createTestBattleState(units, 1);
}

/**
 * Gets a unit from state by instanceId.
 */
function getUnit(state: BattleState, instanceId: string): BattleUnit | undefined {
  return state.units.find((u) => u.instanceId === instanceId);
}

/**
 * Gets status effects from a unit.
 */
function getStatusEffects(unit: BattleUnit | undefined): Array<{ type: string; duration: number }> {
  if (!unit) return [];
  return (unit as unknown as UnitWithContagion).statusEffects ?? [];
}

/**
 * Checks if unit is in phalanx.
 */
function isInPhalanx(unit: BattleUnit | undefined): boolean {
  if (!unit) return false;
  return (unit as unknown as { inPhalanx?: boolean }).inPhalanx === true;
}

/**
 * Gets adjacent allies count.
 */
function getAdjacentAlliesCount(unit: BattleUnit | undefined): number {
  if (!unit) return 0;
  return (unit as unknown as { adjacentAlliesCount?: number }).adjacentAlliesCount ?? 0;
}

// ═══════════════════════════════════════════════════════════════
// CONTAGION + PHALANX INTEGRATION TESTS (Task 34)
// ═══════════════════════════════════════════════════════════════

describe('Tier 4 Integration Tests', () => {
  describe('Contagion + Phalanx Integration (Task 34)', () => {
    const contagionProcessor = createContagionProcessor(DEFAULT_CONTAGION_CONFIG);
    const phalanxProcessor = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

    /**
     * Task 34.1: Create test scenario with phalanx formation
     *
     * This test creates a phalanx formation with multiple units
     * positioned adjacently and facing the same direction.
     */
    describe('Phalanx formation scenario setup', () => {
      it('should create a valid phalanx formation with 3 adjacent units', () => {
        // Create 3 units in a horizontal line, all facing North
        const unit1 = createPhalanxUnit({
          id: 'phalanx-1',
          instanceId: 'phalanx-1-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxUnit({
          id: 'phalanx-2',
          instanceId: 'phalanx-2-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit3 = createPhalanxUnit({
          id: 'phalanx-3',
          instanceId: 'phalanx-3-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });

        const state = createMockState([unit1, unit2, unit3]);

        // Detect formation for center unit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detection = phalanxProcessor.detectFormation(unit2 as any, state);

        expect(detection.canFormPhalanx).toBe(true);
        expect(detection.alignedCount).toBe(2); // unit1 and unit3 are aligned
        expect(detection.adjacentAllies.length).toBe(2);
      });

      it('should update phalanx state for all units in formation', () => {
        const unit1 = createPhalanxUnit({
          id: 'phalanx-1',
          instanceId: 'phalanx-1-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxUnit({
          id: 'phalanx-2',
          instanceId: 'phalanx-2-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit3 = createPhalanxUnit({
          id: 'phalanx-3',
          instanceId: 'phalanx-3-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });

        let state = createMockState([unit1, unit2, unit3]);

        // Recalculate phalanx for all units
        const result = phalanxProcessor.recalculate(state, 'turn_start');
        state = result.state;

        // Verify all units are now in phalanx
        const updatedUnit1 = getUnit(state, 'phalanx-1-inst');
        const updatedUnit2 = getUnit(state, 'phalanx-2-inst');
        const updatedUnit3 = getUnit(state, 'phalanx-3-inst');

        expect(isInPhalanx(updatedUnit1)).toBe(true);
        expect(isInPhalanx(updatedUnit2)).toBe(true);
        expect(isInPhalanx(updatedUnit3)).toBe(true);

        // Center unit should have 2 adjacent allies
        expect(getAdjacentAlliesCount(updatedUnit2)).toBe(2);
        // Edge units should have 1 adjacent ally
        expect(getAdjacentAlliesCount(updatedUnit1)).toBe(1);
        expect(getAdjacentAlliesCount(updatedUnit3)).toBe(1);
      });
    });

    /**
     * Task 34.2: Apply fire effect to one unit
     *
     * This test applies a fire effect to one unit in the phalanx
     * and verifies the effect is properly tracked.
     */
    describe('Apply fire effect to phalanx unit', () => {
      it('should apply fire effect to a unit in phalanx formation', () => {
        const infectedUnit = createPhalanxUnit({
          id: 'infected',
          instanceId: 'infected-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          adjacentAlliesCount: 2,
          statusEffects: [{ type: 'fire', duration: 3 }],
        });

        const adjacentUnit = createPhalanxUnit({
          id: 'adjacent',
          instanceId: 'adjacent-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          inPhalanx: true,
          adjacentAlliesCount: 1,
          statusEffects: [],
        });

        const state = createMockState([infectedUnit, adjacentUnit]);

        // Verify infected unit has fire effect
        const infected = getUnit(state, 'infected-inst');
        const effects = getStatusEffects(infected);
        expect(effects).toHaveLength(1);
        expect(effects[0]?.type).toBe('fire');

        // Verify contagion processor can detect the effect
        const contagiousEffects = contagionProcessor.getContagiousEffects(
          infected as BattleUnit & UnitWithContagion,
        );
        expect(contagiousEffects).toHaveLength(1);
        expect(contagiousEffects[0]?.type).toBe('fire');
      });
    });

    /**
     * Task 34.3: Verify increased spread chance in phalanx
     *
     * This test verifies that units in phalanx formation have
     * increased spread chance due to the phalanx spread bonus.
     */
    describe('Increased spread chance in phalanx', () => {
      it('should have higher spread chance for units in phalanx', () => {
        const phalanxTarget = createPhalanxUnit({
          id: 'phalanx-target',
          instanceId: 'phalanx-target-inst',
          position: { x: 4, y: 3 },
          inPhalanx: true,
        });

        const normalTarget = createPhalanxUnit({
          id: 'normal-target',
          instanceId: 'normal-target-inst',
          position: { x: 5, y: 3 },
          inPhalanx: false,
        });

        // Get effective spread chance for both targets
        const phalanxChance = contagionProcessor.getEffectiveSpreadChance(
          'fire',
          phalanxTarget as BattleUnit & UnitWithContagion,
          DEFAULT_CONTAGION_CONFIG,
        );
        const normalChance = contagionProcessor.getEffectiveSpreadChance(
          'fire',
          normalTarget as BattleUnit & UnitWithContagion,
          DEFAULT_CONTAGION_CONFIG,
        );

        // Phalanx target should have higher spread chance
        expect(phalanxChance).toBeGreaterThan(normalChance);

        // Verify the exact bonus
        expect(phalanxChance).toBe(DEFAULT_FIRE_SPREAD + DEFAULT_PHALANX_SPREAD_BONUS);
        expect(normalChance).toBe(DEFAULT_FIRE_SPREAD);
      });

      it('should apply phalanx bonus to all contagion types', () => {
        const phalanxTarget = createPhalanxUnit({
          id: 'phalanx-target',
          instanceId: 'phalanx-target-inst',
          position: { x: 4, y: 3 },
          inPhalanx: true,
        });

        const contagionTypes: ContagionType[] = [
          'fire',
          'poison',
          'curse',
          'frost',
          'plague',
        ];

        for (const effectType of contagionTypes) {
          const baseChance = contagionProcessor.getSpreadChance(
            effectType,
            DEFAULT_CONTAGION_CONFIG,
          );
          const effectiveChance = contagionProcessor.getEffectiveSpreadChance(
            effectType,
            phalanxTarget as BattleUnit & UnitWithContagion,
            DEFAULT_CONTAGION_CONFIG,
          );

          expect(effectiveChance).toBe(baseChance + DEFAULT_PHALANX_SPREAD_BONUS);
        }
      });

      it('should report phalanx bonus in canSpreadTo eligibility', () => {
        const source = createPhalanxUnit({
          id: 'source',
          instanceId: 'source-inst',
          position: { x: 3, y: 3 },
          statusEffects: [{ type: 'fire', duration: 3 }],
        });

        const phalanxTarget = createPhalanxUnit({
          id: 'phalanx-target',
          instanceId: 'phalanx-target-inst',
          position: { x: 4, y: 3 },
          inPhalanx: true,
          statusEffects: [],
        });

        const eligibility = contagionProcessor.canSpreadTo(
          'fire',
          source as BattleUnit & UnitWithContagion,
          phalanxTarget as BattleUnit & UnitWithContagion,
          DEFAULT_CONTAGION_CONFIG,
        );

        expect(eligibility.canSpread).toBe(true);
        expect(eligibility.phalanxBonusApplied).toBe(true);
        expect(eligibility.spreadChance).toBe(
          DEFAULT_FIRE_SPREAD + DEFAULT_PHALANX_SPREAD_BONUS,
        );
      });
    });

    /**
     * Task 34.4: Verify spread to adjacent units
     *
     * This test verifies that effects spread to adjacent units
     * in the phalanx formation with the increased spread chance.
     */
    describe('Spread to adjacent units in phalanx', () => {
      it('should spread fire effect to adjacent phalanx units with 100% chance', () => {
        // Use 100% spread chance for deterministic test
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 1.0, // 100% base spread
        };
        const processor = createContagionProcessor(guaranteedConfig);

        const infectedUnit = createPhalanxUnit({
          id: 'infected',
          instanceId: 'infected-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          statusEffects: [{ type: 'fire', duration: 3 }],
        });

        const adjacentPhalanxUnit = createPhalanxUnit({
          id: 'adjacent-phalanx',
          instanceId: 'adjacent-phalanx-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          inPhalanx: true,
          statusEffects: [],
        });

        const state = createMockState([infectedUnit, adjacentPhalanxUnit]);
        const newState = processor.spreadEffects(state, 12345);

        const updatedAdjacent = getUnit(newState, 'adjacent-phalanx-inst');
        const effects = getStatusEffects(updatedAdjacent);
        expect(effects).toHaveLength(1);
        expect(effects[0]?.type).toBe('fire');
      });

      it('should spread to multiple adjacent units in phalanx formation', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          plagueSpread: 1.0, // 100% spread for plague
        };
        const processor = createContagionProcessor(guaranteedConfig);

        // Create a 3-unit phalanx with center unit infected
        const leftUnit = createPhalanxUnit({
          id: 'left',
          instanceId: 'left-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
          inPhalanx: true,
          statusEffects: [],
        });

        const centerUnit = createPhalanxUnit({
          id: 'center',
          instanceId: 'center-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
          inPhalanx: true,
          statusEffects: [{ type: 'plague', duration: 5 }],
        });

        const rightUnit = createPhalanxUnit({
          id: 'right',
          instanceId: 'right-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
          inPhalanx: true,
          statusEffects: [],
        });

        const state = createMockState([leftUnit, centerUnit, rightUnit]);
        const result = processor.spreadEffectsWithDetails(
          state,
          12345,
          guaranteedConfig,
        );

        // Both adjacent units should be infected
        expect(result.totalSuccessful).toBe(2);
        expect(result.allNewlyInfectedIds).toContain('left-inst');
        expect(result.allNewlyInfectedIds).toContain('right-inst');

        // Verify phalanx bonus was applied
        const attempts = result.unitResults[0]?.attempts ?? [];
        for (const attempt of attempts) {
          if (attempt.success) {
            expect(attempt.phalanxBonusApplied).toBe(true);
          }
        }
      });

      it('should have higher spread success rate in phalanx vs non-phalanx', () => {
        // Use a spread chance where phalanx bonus makes a difference
        // Base: 0.4, Phalanx bonus: 0.15, Total: 0.55
        const testConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 0.4,
          phalanxSpreadBonus: 0.15,
        };
        const processor = createContagionProcessor(testConfig);

        // Run multiple trials to compare spread rates
        const trials = 100;
        let phalanxSuccesses = 0;
        let normalSuccesses = 0;

        for (let seed = 0; seed < trials; seed++) {
          // Test phalanx target
          const phalanxInfected = createPhalanxUnit({
            id: 'infected',
            instanceId: 'infected-inst',
            position: { x: 3, y: 3 },
            statusEffects: [{ type: 'fire', duration: 3 }],
          });
          const phalanxTarget = createPhalanxUnit({
            id: 'target',
            instanceId: 'target-inst',
            position: { x: 4, y: 3 },
            inPhalanx: true,
            statusEffects: [],
          });
          const phalanxState = createMockState([phalanxInfected, phalanxTarget]);
          const phalanxResult = processor.spreadEffects(phalanxState, seed);
          const phalanxTargetAfter = getUnit(phalanxResult, 'target-inst');
          if (getStatusEffects(phalanxTargetAfter).length > 0) {
            phalanxSuccesses++;
          }

          // Test normal target
          const normalInfected = createPhalanxUnit({
            id: 'infected2',
            instanceId: 'infected2-inst',
            position: { x: 3, y: 3 },
            statusEffects: [{ type: 'fire', duration: 3 }],
          });
          const normalTarget = createPhalanxUnit({
            id: 'target2',
            instanceId: 'target2-inst',
            position: { x: 4, y: 3 },
            inPhalanx: false, // Not in phalanx
            statusEffects: [],
          });
          const normalState = createMockState([normalInfected, normalTarget]);
          const normalResult = processor.spreadEffects(normalState, seed);
          const normalTargetAfter = getUnit(normalResult, 'target2-inst');
          if (getStatusEffects(normalTargetAfter).length > 0) {
            normalSuccesses++;
          }
        }

        // Phalanx should have higher success rate
        // With 0.4 base + 0.15 bonus = 0.55 vs 0.4
        // Expected: ~55% vs ~40%
        expect(phalanxSuccesses).toBeGreaterThan(normalSuccesses);

        // Verify rates are approximately correct (with some tolerance)
        const phalanxRate = phalanxSuccesses / trials;
        const normalRate = normalSuccesses / trials;

        // Phalanx rate should be around 0.55 (±0.15 for randomness)
        expect(phalanxRate).toBeGreaterThan(0.4);
        expect(phalanxRate).toBeLessThan(0.7);

        // Normal rate should be around 0.4 (±0.15 for randomness)
        expect(normalRate).toBeGreaterThan(0.25);
        expect(normalRate).toBeLessThan(0.55);
      });
    });

    /**
     * Full integration scenario: Phalanx formation with contagion spread
     */
    describe('Full phalanx + contagion integration scenario', () => {
      it('should execute complete contagion spread in phalanx formation', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 1.0,
        };
        const contagion = createContagionProcessor(guaranteedConfig);
        const phalanx = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

        // ─────────────────────────────────────────────────────────────
        // SETUP: Create 4-unit phalanx formation (2x2 square)
        // ─────────────────────────────────────────────────────────────
        const unit1 = createPhalanxUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });
        const unit3 = createPhalanxUnit({
          id: 'unit3',
          instanceId: 'unit3-inst',
          position: { x: 3, y: 4 },
          facing: 'N',
        });
        const unit4 = createPhalanxUnit({
          id: 'unit4',
          instanceId: 'unit4-inst',
          position: { x: 4, y: 4 },
          facing: 'N',
        });

        let state = createMockState([unit1, unit2, unit3, unit4]);

        // ─────────────────────────────────────────────────────────────
        // PHASE 1: Establish phalanx formation
        // ─────────────────────────────────────────────────────────────
        const phalanxResult = phalanx.recalculate(state, 'turn_start');
        state = phalanxResult.state;

        // Verify all units are in phalanx
        const u1 = getUnit(state, 'unit1-inst');
        const u2 = getUnit(state, 'unit2-inst');
        const u3 = getUnit(state, 'unit3-inst');
        const u4 = getUnit(state, 'unit4-inst');

        expect(isInPhalanx(u1)).toBe(true);
        expect(isInPhalanx(u2)).toBe(true);
        expect(isInPhalanx(u3)).toBe(true);
        expect(isInPhalanx(u4)).toBe(true);

        // ─────────────────────────────────────────────────────────────
        // PHASE 2: Apply fire effect to unit1
        // ─────────────────────────────────────────────────────────────
        const infectedUnit1 = {
          ...u1!,
          statusEffects: [{ type: 'fire', duration: 3 }],
        };
        state = {
          ...state,
          units: state.units.map((u) =>
            u.instanceId === 'unit1-inst' ? infectedUnit1 : u,
          ),
        };

        // ─────────────────────────────────────────────────────────────
        // PHASE 3: Spread effects at turn end
        // ─────────────────────────────────────────────────────────────
        const spreadResult = contagion.spreadEffectsWithDetails(
          state,
          12345,
          guaranteedConfig,
        );

        // ─────────────────────────────────────────────────────────────
        // VERIFY: Effects spread to adjacent units with phalanx bonus
        // ─────────────────────────────────────────────────────────────

        // Unit1 is adjacent to unit2 (right) and unit3 (below)
        // Both should be infected with 100% spread chance
        expect(spreadResult.totalSuccessful).toBe(2);
        expect(spreadResult.allNewlyInfectedIds).toContain('unit2-inst');
        expect(spreadResult.allNewlyInfectedIds).toContain('unit3-inst');

        // Unit4 is not adjacent to unit1, should not be infected
        expect(spreadResult.allNewlyInfectedIds).not.toContain('unit4-inst');

        // Verify phalanx bonus was applied to all successful spreads
        const attempts = spreadResult.unitResults[0]?.attempts ?? [];
        const successfulAttempts = attempts.filter((a) => a.success);
        for (const attempt of successfulAttempts) {
          expect(attempt.phalanxBonusApplied).toBe(true);
        }
      });

      it('should cascade spread through phalanx over multiple turns', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          plagueSpread: 1.0,
        };
        const contagion = createContagionProcessor(guaranteedConfig);
        const phalanx = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

        // Create a line of 4 units
        const unit1 = createPhalanxUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 1, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
        });
        const unit3 = createPhalanxUnit({
          id: 'unit3',
          instanceId: 'unit3-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit4 = createPhalanxUnit({
          id: 'unit4',
          instanceId: 'unit4-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });

        let state = createMockState([unit1, unit2, unit3, unit4]);

        // Establish phalanx
        state = phalanx.recalculate(state, 'turn_start').state;

        // Infect unit1 (leftmost)
        state = {
          ...state,
          units: state.units.map((u) =>
            u.instanceId === 'unit1-inst'
              ? { ...u, statusEffects: [{ type: 'plague', duration: 5 }] }
              : u,
          ),
        };

        // Turn 1: Spread from unit1 to unit2
        state = contagion.spreadEffects(state, 1001);
        const u2Turn1 = getUnit(state, 'unit2-inst');
        expect(getStatusEffects(u2Turn1).some((e) => e.type === 'plague')).toBe(true);

        // Turn 2: Spread from unit1 and unit2 to unit3
        state = contagion.spreadEffects(state, 2002);
        const u3Turn2 = getUnit(state, 'unit3-inst');
        expect(getStatusEffects(u3Turn2).some((e) => e.type === 'plague')).toBe(true);

        // Turn 3: Spread from unit2 and unit3 to unit4
        state = contagion.spreadEffects(state, 3003);
        const u4Turn3 = getUnit(state, 'unit4-inst');
        expect(getStatusEffects(u4Turn3).some((e) => e.type === 'plague')).toBe(true);

        // All units should now be infected
        const allInfected = state.units.every((u) =>
          getStatusEffects(u).some((e) => e.type === 'plague'),
        );
        expect(allInfected).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TIER 4 INTEGRATION TESTS (Task 35)
  // ═══════════════════════════════════════════════════════════════

  describe('Tier 4 Integration Tests (Task 35)', () => {
    // ─────────────────────────────────────────────────────────────
    // Task 35.1: Test contagion spread mechanics
    // ─────────────────────────────────────────────────────────────
    describe('Contagion spread mechanics', () => {
      it('should spread effects only to adjacent units (Manhattan distance = 1)', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 1.0,
        };
        const processor = createContagionProcessor(guaranteedConfig);

        const infected = createPhalanxUnit({
          id: 'infected',
          instanceId: 'infected-inst',
          position: { x: 3, y: 3 },
          statusEffects: [{ type: 'fire', duration: 3 }],
        });

        const adjacent = createPhalanxUnit({
          id: 'adjacent',
          instanceId: 'adjacent-inst',
          position: { x: 4, y: 3 }, // Manhattan distance = 1
          statusEffects: [],
        });

        const diagonal = createPhalanxUnit({
          id: 'diagonal',
          instanceId: 'diagonal-inst',
          position: { x: 4, y: 4 }, // Manhattan distance = 2 (diagonal)
          statusEffects: [],
        });

        const far = createPhalanxUnit({
          id: 'far',
          instanceId: 'far-inst',
          position: { x: 6, y: 3 }, // Manhattan distance = 3
          statusEffects: [],
        });

        const state = createMockState([infected, adjacent, diagonal, far]);
        const result = processor.spreadEffectsWithDetails(state, 12345, guaranteedConfig);

        // Only adjacent unit should be infected
        expect(result.allNewlyInfectedIds).toContain('adjacent-inst');
        expect(result.allNewlyInfectedIds).not.toContain('diagonal-inst');
        expect(result.allNewlyInfectedIds).not.toContain('far-inst');
        expect(result.totalSuccessful).toBe(1);
      });

      it('should not spread to units that already have the effect', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          poisonSpread: 1.0,
        };
        const processor = createContagionProcessor(guaranteedConfig);

        const infected1 = createPhalanxUnit({
          id: 'infected1',
          instanceId: 'infected1-inst',
          position: { x: 3, y: 3 },
          statusEffects: [{ type: 'poison', duration: 3 }],
        });

        const infected2 = createPhalanxUnit({
          id: 'infected2',
          instanceId: 'infected2-inst',
          position: { x: 4, y: 3 },
          statusEffects: [{ type: 'poison', duration: 2 }], // Already has poison
        });

        const state = createMockState([infected1, infected2]);
        const result = processor.spreadEffectsWithDetails(state, 12345, guaranteedConfig);

        // No new infections since target already has the effect
        expect(result.totalSuccessful).toBe(0);
        expect(result.allNewlyInfectedIds).toHaveLength(0);
      });

      it('should spread multiple effect types independently', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 1.0,
          poisonSpread: 1.0,
        };
        const processor = createContagionProcessor(guaranteedConfig);

        const multiInfected = createPhalanxUnit({
          id: 'multi',
          instanceId: 'multi-inst',
          position: { x: 3, y: 3 },
          statusEffects: [
            { type: 'fire', duration: 3 },
            { type: 'poison', duration: 2 },
          ],
        });

        const target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 4, y: 3 },
          statusEffects: [],
        });

        const state = createMockState([multiInfected, target]);
        const newState = processor.spreadEffects(state, 12345);

        const updatedTarget = getUnit(newState, 'target-inst');
        const effects = getStatusEffects(updatedTarget);

        // Both effects should spread
        expect(effects).toHaveLength(2);
        expect(effects.some((e) => e.type === 'fire')).toBe(true);
        expect(effects.some((e) => e.type === 'poison')).toBe(true);
      });

      it('should respect immunity to specific contagion types', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 1.0,
        };
        const processor = createContagionProcessor(guaranteedConfig);

        const infected = createPhalanxUnit({
          id: 'infected',
          instanceId: 'infected-inst',
          position: { x: 3, y: 3 },
          statusEffects: [{ type: 'fire', duration: 3 }],
        });

        // Create immune unit using the UnitWithContagion interface
        const immuneUnit = {
          ...createPhalanxUnit({
            id: 'immune',
            instanceId: 'immune-inst',
            position: { x: 4, y: 3 },
            statusEffects: [],
          }),
          contagionImmunities: ['fire'],
        } as BattleUnit;

        const state = createMockState([infected, immuneUnit]);
        const result = processor.spreadEffectsWithDetails(state, 12345, guaranteedConfig);

        // Immune unit should not be infected
        expect(result.totalSuccessful).toBe(0);
        expect(result.allNewlyInfectedIds).not.toContain('immune-inst');
      });
    });

    // ─────────────────────────────────────────────────────────────
    // Task 35.2: Test armor shred accumulation
    // ─────────────────────────────────────────────────────────────
    describe('Armor shred accumulation', () => {
      const shredProcessor = createShredProcessor(DEFAULT_SHRED_CONFIG);

      it('should accumulate shred on multiple attacks', () => {
        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 0;

        // Apply shred 3 times
        target = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
        expect(target.armorShred).toBe(1);

        target = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
        expect(target.armorShred).toBe(2);

        target = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
        expect(target.armorShred).toBe(3);

        // Effective armor should decrease
        const effectiveArmor = shredProcessor.getEffectiveArmor(target);
        expect(effectiveArmor).toBe(7); // 10 - 3 = 7
      });

      it('should track shred with detailed results', () => {
        const target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 2;

        const result = shredProcessor.applyShredWithDetails(target, DEFAULT_SHRED_CONFIG);

        expect(result.shredApplied).toBe(1);
        expect(result.newTotalShred).toBe(3);
        expect(result.wasCapped).toBe(false);
        expect(result.maxShred).toBe(4); // 10 * 0.4 = 4
      });

      it('should calculate effective armor correctly', () => {
        const target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 15;
        target.armorShred = 5;

        const details = shredProcessor.getEffectiveArmorDetails(target, DEFAULT_SHRED_CONFIG);

        expect(details.baseArmor).toBe(15);
        expect(details.currentShred).toBe(5);
        expect(details.effectiveArmor).toBe(10); // 15 - 5 = 10
        expect(details.maxShred).toBe(6); // 15 * 0.4 = 6
        expect(details.shredPercent).toBeCloseTo(0.333, 2); // 5/15
      });
    });

    // ─────────────────────────────────────────────────────────────
    // Task 35.3: Test armor shred cap enforcement
    // ─────────────────────────────────────────────────────────────
    describe('Armor shred cap enforcement', () => {
      it('should cap shred at maxShredPercent of base armor', () => {
        const shredProcessor = createShredProcessor(DEFAULT_SHRED_CONFIG);

        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 0;

        // Max shred = 10 * 0.4 = 4
        // Apply shred 6 times (should cap at 4)
        for (let i = 0; i < 6; i++) {
          target = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
        }

        expect(target.armorShred).toBe(4); // Capped at max
        expect(shredProcessor.isAtMaxShred(target, DEFAULT_SHRED_CONFIG)).toBe(true);
      });

      it('should report when shred is capped', () => {
        const shredProcessor = createShredProcessor(DEFAULT_SHRED_CONFIG);

        const target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 4; // Already at max (10 * 0.4 = 4)

        const result = shredProcessor.applyShredWithDetails(target, DEFAULT_SHRED_CONFIG);

        expect(result.wasCapped).toBe(true);
        expect(result.shredApplied).toBe(0);
        expect(result.newTotalShred).toBe(4);
      });

      it('should use custom maxShredPercent from config', () => {
        const customConfig: ShredConfig = {
          ...DEFAULT_SHRED_CONFIG,
          maxShredPercent: 0.6, // 60% max shred
        };
        const shredProcessor = createShredProcessor(customConfig);

        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 0;

        // Max shred = 10 * 0.6 = 6
        for (let i = 0; i < 8; i++) {
          target = shredProcessor.applyShred(target, customConfig);
        }

        expect(target.armorShred).toBe(6); // Capped at 60%
        expect(shredProcessor.getMaxShred(target, customConfig)).toBe(6);
      });

      it('should not allow effective armor to go below 0', () => {
        const highShredConfig: ShredConfig = {
          ...DEFAULT_SHRED_CONFIG,
          maxShredPercent: 1.0, // 100% max shred
          shredPerAttack: 5,
        };
        const shredProcessor = createShredProcessor(highShredConfig);

        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 5;
        target.armorShred = 0;

        // Apply enough shred to exceed armor
        target = shredProcessor.applyShred(target, highShredConfig);
        target = shredProcessor.applyShred(target, highShredConfig);

        // Effective armor should be 0, not negative
        const effectiveArmor = shredProcessor.getEffectiveArmor(target);
        expect(effectiveArmor).toBe(0);
      });
    });

    // ─────────────────────────────────────────────────────────────
    // Task 35.4: Test contagion + phalanx counter-synergy
    // ─────────────────────────────────────────────────────────────
    describe('Contagion + phalanx counter-synergy', () => {
      it('should demonstrate phalanx as a double-edged sword for contagion', () => {
        // Phalanx provides defensive bonuses but increases contagion spread
        const testConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          plagueSpread: 0.5, // 50% base spread
          phalanxSpreadBonus: 0.25, // +25% in phalanx = 75% total
        };
        const contagionProcessor = createContagionProcessor(testConfig);
        const phalanxProcessor = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

        // Create a 3-unit phalanx
        const unit1 = createPhalanxUnit({
          id: 'unit1',
          instanceId: 'unit1-inst',
          position: { x: 2, y: 3 },
          facing: 'N',
        });
        const unit2 = createPhalanxUnit({
          id: 'unit2',
          instanceId: 'unit2-inst',
          position: { x: 3, y: 3 },
          facing: 'N',
        });
        const unit3 = createPhalanxUnit({
          id: 'unit3',
          instanceId: 'unit3-inst',
          position: { x: 4, y: 3 },
          facing: 'N',
        });

        let state = createMockState([unit1, unit2, unit3]);

        // Establish phalanx
        state = phalanxProcessor.recalculate(state, 'turn_start').state;

        // Verify phalanx bonuses are applied
        const u1 = getUnit(state, 'unit1-inst');
        const u2 = getUnit(state, 'unit2-inst');
        expect(isInPhalanx(u1)).toBe(true);
        expect(isInPhalanx(u2)).toBe(true);

        // Check spread chance difference
        const phalanxTarget = getUnit(state, 'unit2-inst') as BattleUnit & UnitWithContagion;
        const effectiveChance = contagionProcessor.getEffectiveSpreadChance(
          'plague',
          phalanxTarget,
          testConfig,
        );

        // Should be base + bonus = 0.5 + 0.25 = 0.75
        expect(effectiveChance).toBe(0.75);

        // Compare with non-phalanx unit
        const nonPhalanxUnit = createPhalanxUnit({
          id: 'solo',
          instanceId: 'solo-inst',
          position: { x: 10, y: 10 },
          inPhalanx: false,
        }) as BattleUnit & UnitWithContagion;

        const normalChance = contagionProcessor.getEffectiveSpreadChance(
          'plague',
          nonPhalanxUnit,
          testConfig,
        );

        expect(normalChance).toBe(0.5); // Just base chance
        expect(effectiveChance).toBeGreaterThan(normalChance);
      });

      it('should show rapid plague spread through tight phalanx formation', () => {
        const guaranteedConfig: ContagionConfig = {
          ...DEFAULT_CONTAGION_CONFIG,
          plagueSpread: 1.0, // 100% for deterministic test
        };
        const contagionProcessor = createContagionProcessor(guaranteedConfig);
        const phalanxProcessor = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

        // Create a 2x3 phalanx formation
        const units = [
          createPhalanxUnit({ id: 'u1', instanceId: 'u1-inst', position: { x: 2, y: 2 }, facing: 'N' }),
          createPhalanxUnit({ id: 'u2', instanceId: 'u2-inst', position: { x: 3, y: 2 }, facing: 'N' }),
          createPhalanxUnit({ id: 'u3', instanceId: 'u3-inst', position: { x: 4, y: 2 }, facing: 'N' }),
          createPhalanxUnit({ id: 'u4', instanceId: 'u4-inst', position: { x: 2, y: 3 }, facing: 'N' }),
          createPhalanxUnit({ id: 'u5', instanceId: 'u5-inst', position: { x: 3, y: 3 }, facing: 'N' }),
          createPhalanxUnit({ id: 'u6', instanceId: 'u6-inst', position: { x: 4, y: 3 }, facing: 'N' }),
        ];

        let state = createMockState(units);

        // Establish phalanx
        state = phalanxProcessor.recalculate(state, 'turn_start').state;

        // Infect center unit (u5)
        state = {
          ...state,
          units: state.units.map((u) =>
            u.instanceId === 'u5-inst'
              ? { ...u, statusEffects: [{ type: 'plague', duration: 5 }] }
              : u,
          ),
        };

        // Turn 1: Spread from u5 to adjacent units (u2, u4, u6)
        // u5 is at (3,3), adjacent to u2(3,2), u4(2,3), u6(4,3)
        state = contagionProcessor.spreadEffects(state, 1001);

        const infectedAfterTurn1 = state.units.filter((u) =>
          getStatusEffects(u).some((e) => e.type === 'plague'),
        );
        expect(infectedAfterTurn1.length).toBeGreaterThanOrEqual(2); // At least u5 + some adjacent

        // Turn 2: Spread continues
        state = contagionProcessor.spreadEffects(state, 2002);

        const infectedAfterTurn2 = state.units.filter((u) =>
          getStatusEffects(u).some((e) => e.type === 'plague'),
        );
        expect(infectedAfterTurn2.length).toBeGreaterThanOrEqual(4);

        // Turn 3: All should be infected
        state = contagionProcessor.spreadEffects(state, 3003);

        const allInfected = state.units.every((u) =>
          getStatusEffects(u).some((e) => e.type === 'plague'),
        );
        expect(allInfected).toBe(true);
      });
    });

    // ─────────────────────────────────────────────────────────────
    // Combined Tier 4 mechanics scenario
    // ─────────────────────────────────────────────────────────────
    describe('Combined Tier 4 mechanics', () => {
      it('should handle armor shred and contagion on same unit', () => {
        const shredProcessor = createShredProcessor(DEFAULT_SHRED_CONFIG);
        const contagionProcessor = createContagionProcessor({
          ...DEFAULT_CONTAGION_CONFIG,
          fireSpread: 1.0,
        });

        // Create a unit with both armor shred and contagion
        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
          statusEffects: [{ type: 'fire', duration: 3 }],
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 2;

        // Apply more shred
        target = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
        expect(target.armorShred).toBe(3);

        // Verify contagion still works
        const adjacentUnit = createPhalanxUnit({
          id: 'adjacent',
          instanceId: 'adjacent-inst',
          position: { x: 4, y: 3 },
          statusEffects: [],
        });

        const state = createMockState([target, adjacentUnit]);
        const newState = contagionProcessor.spreadEffects(state, 12345);

        const updatedAdjacent = getUnit(newState, 'adjacent-inst');
        expect(getStatusEffects(updatedAdjacent).some((e) => e.type === 'fire')).toBe(true);
      });

      it('should decay shred at turn end when configured', () => {
        const decayConfig: ShredConfig = {
          ...DEFAULT_SHRED_CONFIG,
          decayPerTurn: 1, // Decay 1 shred per turn
        };
        const shredProcessor = createShredProcessor(decayConfig);

        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 3;

        // Decay shred
        const result = shredProcessor.decayShredWithDetails(target, decayConfig);

        expect(result.decayAmount).toBe(1);
        expect(result.previousShred).toBe(3);
        expect(result.newShred).toBe(2);
        expect(result.unit.armorShred).toBe(2);
      });

      it('should reset shred when cleansed', () => {
        const shredProcessor = createShredProcessor(DEFAULT_SHRED_CONFIG);

        let target = createPhalanxUnit({
          id: 'target',
          instanceId: 'target-inst',
          position: { x: 3, y: 3 },
        }) as BattleUnit & UnitWithArmorShred;
        target.armor = 10;
        target.armorShred = 4;

        // Reset shred (simulating a cleanse effect)
        target = shredProcessor.resetShred(target);

        expect(target.armorShred).toBe(0);
        expect(shredProcessor.hasShred(target)).toBe(false);
        expect(shredProcessor.getEffectiveArmor(target)).toBe(10);
      });
    });
  });
});
