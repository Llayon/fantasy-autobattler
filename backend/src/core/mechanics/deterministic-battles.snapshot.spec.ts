/**
 * Deterministic Battles Snapshot Tests
 *
 * Extended snapshot tests for deterministic battle verification.
 * These tests complement mvp-preset.snapshot.spec.ts by covering:
 * 1. Edge case scenarios (single unit, corner positions, etc.)
 * 2. Multiple seed variations for the same battle configuration
 * 3. Role-specific battle scenarios (all tanks, all mages, etc.)
 *
 * @module core/mechanics
 */

import { simulateBattle } from '../../battle/battle.simulator';
import { BattleResult } from '../../types/game.types';
import {
  BATTLE_SCENARIOS,
  EDGE_CASE_FIXTURES,
  TEST_SEEDS,
  createTeamSetup,
} from './test-fixtures';
import { UnitId } from '../../unit/unit.data';

/**
 * Normalize battle result for snapshot comparison.
 * Removes timing-dependent fields that would cause false failures.
 */
function normalizeBattleResult(result: BattleResult): object {
  return {
    winner: result.winner,
    totalRounds: result.metadata.totalRounds,
    seed: result.metadata.seed,
    eventCount: result.events.length,
    eventSequence: result.events.map((e) => ({
      type: e.type,
      round: e.round,
      actorId: e.actorId,
      targetId: e.targetId,
    })),
    finalState: {
      playerUnits: result.finalState.playerUnits.map((u) => ({
        instanceId: u.instanceId,
        currentHp: u.currentHp,
        alive: u.alive,
        position: u.position,
      })),
      botUnits: result.finalState.botUnits.map((u) => ({
        instanceId: u.instanceId,
        currentHp: u.currentHp,
        alive: u.alive,
        position: u.position,
      })),
    },
  };
}

describe('Deterministic Battles Snapshot Tests', () => {
  describe('Role-Specific Battle Scenarios', () => {
    /**
     * Test battles with specific role compositions.
     * These scenarios test different combat dynamics.
     */
    const roleScenarios = [
      {
        name: 'all_tanks_battle',
        scenario: BATTLE_SCENARIOS.ALL_TANKS,
      },
      {
        name: 'all_ranged_battle',
        scenario: BATTLE_SCENARIOS.ALL_RANGED,
      },
      {
        name: 'all_mages_battle',
        scenario: BATTLE_SCENARIOS.ALL_MAGES,
      },
      {
        name: 'support_heavy_battle',
        scenario: BATTLE_SCENARIOS.SUPPORT_HEAVY,
      },
      {
        name: 'high_initiative_battle',
        scenario: BATTLE_SCENARIOS.HIGH_INITIATIVE,
      },
      {
        name: 'melee_rush_battle',
        scenario: BATTLE_SCENARIOS.MELEE_RUSH,
      },
    ];

    test.each(roleScenarios)(
      'should match snapshot for $name',
      ({ scenario }) => {
        const result = simulateBattle(
          scenario.playerTeam,
          scenario.enemyTeam,
          scenario.seed,
        );
        const normalized = normalizeBattleResult(result);
        expect(normalized).toMatchSnapshot();
      },
    );
  });

  describe('Edge Case Scenarios', () => {
    /**
     * Test edge cases that might reveal determinism issues.
     */
    test('should handle single unit vs single unit (duel)', () => {
      const result = simulateBattle(
        BATTLE_SCENARIOS.DUEL_1V1.playerTeam,
        BATTLE_SCENARIOS.DUEL_1V1.enemyTeam,
        BATTLE_SCENARIOS.DUEL_1V1.seed,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });

    test('should handle corner positions battle', () => {
      const result = simulateBattle(
        EDGE_CASE_FIXTURES.CORNER_POSITIONS.playerTeam,
        EDGE_CASE_FIXTURES.CORNER_POSITIONS.enemyTeam,
        TEST_SEEDS.DEFAULT,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });

    test('should handle mirror match (identical teams)', () => {
      const result = simulateBattle(
        EDGE_CASE_FIXTURES.MIRROR_MATCH.playerTeam,
        EDGE_CASE_FIXTURES.MIRROR_MATCH.enemyTeam,
        TEST_SEEDS.DEFAULT,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });

    test('should handle one HP units battle', () => {
      const result = simulateBattle(
        EDGE_CASE_FIXTURES.ONE_HP_UNITS.playerTeam,
        EDGE_CASE_FIXTURES.ONE_HP_UNITS.enemyTeam,
        TEST_SEEDS.DEFAULT,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });

    test('should handle max dodge units battle', () => {
      const result = simulateBattle(
        EDGE_CASE_FIXTURES.MAX_DODGE.playerTeam,
        EDGE_CASE_FIXTURES.MAX_DODGE.enemyTeam,
        TEST_SEEDS.DEFAULT,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });
  });

  describe('Multiple Seeds Determinism', () => {
    /**
     * Test the same battle configuration with multiple seeds.
     * Each seed should produce consistent, deterministic results.
     */
    const seedVariations = [
      { seed: 100, name: 'seed_100' },
      { seed: 500, name: 'seed_500' },
      { seed: 1000, name: 'seed_1000' },
      { seed: 5000, name: 'seed_5000' },
      { seed: 10000, name: 'seed_10000' },
      { seed: 50000, name: 'seed_50000' },
      { seed: 99999, name: 'seed_99999' },
    ];

    const standardBattle = {
      playerTeam: createTeamSetup(
        ['knight', 'archer', 'mage'] as UnitId[],
        [
          { x: 1, y: 0 },
          { x: 3, y: 1 },
          { x: 5, y: 1 },
        ],
      ),
      enemyTeam: createTeamSetup(
        ['guardian', 'crossbowman', 'warlock'] as UnitId[],
        [
          { x: 1, y: 9 },
          { x: 3, y: 8 },
          { x: 5, y: 8 },
        ],
      ),
    };

    test.each(seedVariations)(
      'should produce deterministic result for $name',
      ({ seed }) => {
        const result = simulateBattle(
          standardBattle.playerTeam,
          standardBattle.enemyTeam,
          seed,
        );
        const normalized = normalizeBattleResult(result);
        expect(normalized).toMatchSnapshot();
      },
    );

    test.each(seedVariations)(
      'should produce identical results across 3 runs for $name',
      ({ seed }) => {
        const results = [
          simulateBattle(standardBattle.playerTeam, standardBattle.enemyTeam, seed),
          simulateBattle(standardBattle.playerTeam, standardBattle.enemyTeam, seed),
          simulateBattle(standardBattle.playerTeam, standardBattle.enemyTeam, seed),
        ];

        // All results should be identical
        for (let i = 1; i < results.length; i++) {
          expect(results[i]!.winner).toBe(results[0]!.winner);
          expect(results[i]!.metadata.totalRounds).toBe(
            results[0]!.metadata.totalRounds,
          );
          expect(results[i]!.events.length).toBe(results[0]!.events.length);

          // Verify event sequence
          for (let j = 0; j < results[0]!.events.length; j++) {
            expect(results[i]!.events[j]!.type).toBe(results[0]!.events[j]!.type);
            expect(results[i]!.events[j]!.round).toBe(results[0]!.events[j]!.round);
            expect(results[i]!.events[j]!.actorId).toBe(
              results[0]!.events[j]!.actorId,
            );
          }
        }
      },
    );
  });

  describe('Victory Condition Scenarios', () => {
    /**
     * Test scenarios with predictable outcomes.
     */
    test('should match snapshot for player victory scenario', () => {
      const result = simulateBattle(
        BATTLE_SCENARIOS.PLAYER_VICTORY.playerTeam,
        BATTLE_SCENARIOS.PLAYER_VICTORY.enemyTeam,
        BATTLE_SCENARIOS.PLAYER_VICTORY.seed,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
      expect(result.winner).toBe('player');
    });

    test('should match snapshot for bot victory scenario', () => {
      const result = simulateBattle(
        BATTLE_SCENARIOS.BOT_VICTORY.playerTeam,
        BATTLE_SCENARIOS.BOT_VICTORY.enemyTeam,
        BATTLE_SCENARIOS.BOT_VICTORY.seed,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
      expect(result.winner).toBe('bot');
    });
  });

  describe('Long Range Combat Scenarios', () => {
    /**
     * Test scenarios with ranged units at maximum distance.
     */
    test('should match snapshot for long range battle', () => {
      const result = simulateBattle(
        BATTLE_SCENARIOS.LONG_RANGE.playerTeam,
        BATTLE_SCENARIOS.LONG_RANGE.enemyTeam,
        BATTLE_SCENARIOS.LONG_RANGE.seed,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });
  });

  describe('Large Team Battles', () => {
    /**
     * Test with maximum team sizes to verify determinism at scale.
     */
    test('should match snapshot for max team size (8v8)', () => {
      const result = simulateBattle(
        EDGE_CASE_FIXTURES.MAX_TEAM_SIZE.playerTeam,
        EDGE_CASE_FIXTURES.MAX_TEAM_SIZE.enemyTeam,
        TEST_SEEDS.DEFAULT,
      );
      const normalized = normalizeBattleResult(result);
      expect(normalized).toMatchSnapshot();
    });
  });

  describe('Consecutive Battle Determinism', () => {
    /**
     * Run multiple different battles in sequence to verify
     * that the random state doesn't leak between battles.
     */
    test('should produce consistent results when running battles in sequence', () => {
      const scenarios = [
        { ...BATTLE_SCENARIOS.BASIC_2V2, seed: 1111 },
        { ...BATTLE_SCENARIOS.MIXED_3V3, seed: 2222 },
        { ...BATTLE_SCENARIOS.DUEL_1V1, seed: 3333 },
      ];

      // Run sequence twice
      const firstRun = scenarios.map((s) =>
        normalizeBattleResult(simulateBattle(s.playerTeam, s.enemyTeam, s.seed)),
      );

      const secondRun = scenarios.map((s) =>
        normalizeBattleResult(simulateBattle(s.playerTeam, s.enemyTeam, s.seed)),
      );

      // Results should be identical
      for (let i = 0; i < scenarios.length; i++) {
        expect(firstRun[i]).toEqual(secondRun[i]);
      }
    });
  });
});
