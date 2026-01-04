/**
 * MVP Preset Snapshot Tests
 *
 * Snapshot tests that capture and verify the exact output of battles
 * simulated with MVP preset. These tests ensure:
 * 1. Battle results are deterministic across runs
 * 2. MVP preset produces identical results to Core 1.0 (no mechanics)
 * 3. Any changes to battle logic are detected and reviewed
 *
 * Snapshot tests work by:
 * 1. First run: Captures the output and saves it as a snapshot file
 * 2. Subsequent runs: Compares current output against saved snapshot
 * 3. If output differs, test fails until snapshot is updated
 *
 * @module core/mechanics
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { Position, BattleResult } from '../../types/game.types';
import { createMechanicsProcessor, MVP_PRESET } from './index';

/**
 * Helper function to create a team setup from unit IDs and positions.
 */
const createTeamSetup = (
  unitIds: UnitId[],
  positions: Position[],
): TeamSetup => {
  const units = unitIds.map((id) => {
    const template = getUnitTemplate(id);
    if (!template) {
      throw new Error(`Unit template not found: ${id}`);
    }
    return template;
  });

  return { units, positions };
};

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
    // Capture event sequence (type and round only for stability)
    eventSequence: result.events.map((e) => ({
      type: e.type,
      round: e.round,
      actorId: e.actorId,
      targetId: e.targetId,
    })),
    // Capture final unit states
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

describe('MVP Preset Snapshot Tests', () => {
  /**
   * Test scenarios with different team compositions and seeds.
   * Each scenario captures a specific battle configuration.
   */
  const testScenarios = [
    {
      name: 'basic_melee_fight',
      seed: 1001,
      playerUnits: ['knight', 'rogue'] as UnitId[],
      playerPositions: [
        { x: 1, y: 0 },
        { x: 2, y: 1 },
      ],
      enemyUnits: ['berserker', 'assassin'] as UnitId[],
      enemyPositions: [
        { x: 1, y: 9 },
        { x: 2, y: 8 },
      ],
    },
    {
      name: 'ranged_vs_melee',
      seed: 2002,
      playerUnits: ['archer', 'crossbowman'] as UnitId[],
      playerPositions: [
        { x: 3, y: 0 },
        { x: 4, y: 1 },
      ],
      enemyUnits: ['knight', 'guardian'] as UnitId[],
      enemyPositions: [
        { x: 3, y: 9 },
        { x: 4, y: 8 },
      ],
    },
    {
      name: 'mixed_team_battle',
      seed: 3003,
      playerUnits: ['knight', 'archer', 'mage'] as UnitId[],
      playerPositions: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 1 },
      ],
      enemyUnits: ['berserker', 'crossbowman', 'warlock'] as UnitId[],
      enemyPositions: [
        { x: 1, y: 9 },
        { x: 2, y: 9 },
        { x: 3, y: 8 },
      ],
    },
    {
      name: 'support_heavy_battle',
      seed: 4004,
      playerUnits: ['priest', 'bard', 'guardian'] as UnitId[],
      playerPositions: [
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 1 },
      ],
      enemyUnits: ['mage', 'elementalist', 'rogue'] as UnitId[],
      enemyPositions: [
        { x: 2, y: 9 },
        { x: 3, y: 9 },
        { x: 4, y: 8 },
      ],
    },
    {
      name: 'single_unit_duel',
      seed: 5005,
      playerUnits: ['duelist'] as UnitId[],
      playerPositions: [{ x: 4, y: 0 }],
      enemyUnits: ['assassin'] as UnitId[],
      enemyPositions: [{ x: 4, y: 9 }],
    },
  ];

  describe('Battle Result Snapshots', () => {
    test.each(testScenarios)(
      'should match snapshot for $name (seed: $seed)',
      (scenario) => {
        const playerTeam = createTeamSetup(
          scenario.playerUnits,
          scenario.playerPositions,
        );
        const enemyTeam = createTeamSetup(
          scenario.enemyUnits,
          scenario.enemyPositions,
        );

        const result = simulateBattle(playerTeam, enemyTeam, scenario.seed);
        const normalized = normalizeBattleResult(result);

        expect(normalized).toMatchSnapshot();
      },
    );
  });

  describe('MVP Preset vs No Processor Comparison', () => {
    /**
     * These tests verify that MVP preset produces identical results
     * to running without any mechanics processor (Core 1.0 behavior).
     */
    test.each(testScenarios)(
      'MVP preset should match no-processor result for $name',
      (scenario) => {
        const playerTeam = createTeamSetup(
          scenario.playerUnits,
          scenario.playerPositions,
        );
        const enemyTeam = createTeamSetup(
          scenario.enemyUnits,
          scenario.enemyPositions,
        );

        // Run without processor (Core 1.0 behavior)
        const resultNoProcessor = simulateBattle(
          playerTeam,
          enemyTeam,
          scenario.seed,
        );

        // Run with MVP preset processor
        const processor = createMechanicsProcessor(MVP_PRESET);

        // Verify MVP preset has all mechanics disabled
        expect(processor.config).toEqual(MVP_PRESET);
        expect(Object.keys(processor.processors).length).toBe(0);

        // Run with MVP preset processor - should produce identical results
        const resultWithProcessor = simulateBattle(
          playerTeam,
          enemyTeam,
          scenario.seed,
          processor,
        );

        // Verify MVP preset produces identical results to no-processor
        expect(resultNoProcessor.winner).toBe(resultWithProcessor.winner);
        expect(resultNoProcessor.metadata.totalRounds).toBe(
          resultWithProcessor.metadata.totalRounds,
        );
        expect(resultNoProcessor.events.length).toBe(
          resultWithProcessor.events.length,
        );

        // Verify event sequence is identical
        for (let i = 0; i < resultNoProcessor.events.length; i++) {
          expect(resultWithProcessor.events[i]!.type).toBe(
            resultNoProcessor.events[i]!.type,
          );
          expect(resultWithProcessor.events[i]!.round).toBe(
            resultNoProcessor.events[i]!.round,
          );
          expect(resultWithProcessor.events[i]!.actorId).toBe(
            resultNoProcessor.events[i]!.actorId,
          );
        }
      },
    );
  });

  describe('Event Sequence Snapshots', () => {
    /**
     * Capture detailed event sequences for regression testing.
     * These snapshots help detect changes in battle flow logic.
     */
    test.each(testScenarios)(
      'should match event sequence snapshot for $name',
      (scenario) => {
        const playerTeam = createTeamSetup(
          scenario.playerUnits,
          scenario.playerPositions,
        );
        const enemyTeam = createTeamSetup(
          scenario.enemyUnits,
          scenario.enemyPositions,
        );

        const result = simulateBattle(playerTeam, enemyTeam, scenario.seed);

        // Create detailed event sequence for snapshot
        const eventSequence = result.events.map((event, index) => ({
          index,
          type: event.type,
          round: event.round,
          actorId: event.actorId,
          targetId: event.targetId ?? null,
          damage: event.damage ?? null,
          fromPosition: event.fromPosition ?? null,
          toPosition: event.toPosition ?? null,
        }));

        expect(eventSequence).toMatchSnapshot();
      },
    );
  });

  describe('Final State Snapshots', () => {
    /**
     * Capture final unit states for each scenario.
     * These snapshots verify that battle outcomes are consistent.
     */
    test.each(testScenarios)(
      'should match final state snapshot for $name',
      (scenario) => {
        const playerTeam = createTeamSetup(
          scenario.playerUnits,
          scenario.playerPositions,
        );
        const enemyTeam = createTeamSetup(
          scenario.enemyUnits,
          scenario.enemyPositions,
        );

        const result = simulateBattle(playerTeam, enemyTeam, scenario.seed);

        const finalState = {
          winner: result.winner,
          totalRounds: result.metadata.totalRounds,
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
        };

        expect(finalState).toMatchSnapshot();
      },
    );
  });

  describe('Determinism Verification', () => {
    /**
     * Verify that multiple runs with the same seed produce identical results.
     * This is critical for replay functionality.
     */
    const deterministicSeeds = [11111, 22222, 33333, 44444, 55555];

    test.each(deterministicSeeds)(
      'should produce identical results across 3 runs with seed %i',
      (seed) => {
        const playerTeam = createTeamSetup(
          ['knight', 'mage'],
          [
            { x: 1, y: 0 },
            { x: 2, y: 1 },
          ],
        );
        const enemyTeam = createTeamSetup(
          ['rogue', 'archer'],
          [
            { x: 1, y: 9 },
            { x: 2, y: 8 },
          ],
        );

        const results = [
          simulateBattle(playerTeam, enemyTeam, seed),
          simulateBattle(playerTeam, enemyTeam, seed),
          simulateBattle(playerTeam, enemyTeam, seed),
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
});
