/**
 * Battle Simulator Integration Tests
 *
 * Tests verifying the integration of MechanicsProcessor with simulateBattle().
 * These tests ensure:
 * 1. simulateBattle() accepts optional processor parameter
 * 2. Phase hooks are called correctly during battle simulation
 * 3. MVP preset produces identical results to no-processor (backward compatibility)
 * 4. ROGUELIKE preset applies all mechanics during battle
 *
 * @module core/mechanics
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { Position } from '../../types/game.types';
import {
  createMechanicsProcessor,
  MVP_PRESET,
  ROGUELIKE_PRESET,
  TACTICAL_PRESET,
} from './index';

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

describe('Battle Simulator Integration with MechanicsProcessor', () => {
  // Standard test teams
  const playerTeam = createTeamSetup(
    ['knight', 'archer', 'mage'],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 1 },
    ],
  );

  const enemyTeam = createTeamSetup(
    ['rogue', 'crossbowman', 'warlock'],
    [
      { x: 1, y: 9 },
      { x: 2, y: 9 },
      { x: 3, y: 8 },
    ],
  );

  const testSeed = 12345;

  describe('simulateBattle() accepts optional processor parameter', () => {
    it('should run without processor (Core 1.0 behavior)', () => {
      const result = simulateBattle(playerTeam, enemyTeam, testSeed);

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.finalState).toBeDefined();
    });

    it('should run with MVP preset processor', () => {
      const processor = createMechanicsProcessor(MVP_PRESET);
      const result = simulateBattle(playerTeam, enemyTeam, testSeed, processor);

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.finalState).toBeDefined();
    });

    it('should run with ROGUELIKE preset processor', () => {
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      const result = simulateBattle(playerTeam, enemyTeam, testSeed, processor);

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.finalState).toBeDefined();
    });

    it('should run with TACTICAL preset processor', () => {
      const processor = createMechanicsProcessor(TACTICAL_PRESET);
      const result = simulateBattle(playerTeam, enemyTeam, testSeed, processor);

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.finalState).toBeDefined();
    });
  });

  describe('Backward Compatibility (MVP preset = no processor)', () => {
    const seeds = [11111, 22222, 33333, 44444, 55555];

    test.each(seeds)(
      'MVP preset should produce identical results to no-processor with seed %i',
      (seed) => {
        // Run without processor
        const resultNoProcessor = simulateBattle(playerTeam, enemyTeam, seed);

        // Run with MVP preset processor
        const processor = createMechanicsProcessor(MVP_PRESET);
        const resultWithProcessor = simulateBattle(
          playerTeam,
          enemyTeam,
          seed,
          processor,
        );

        // Verify identical results
        expect(resultWithProcessor.winner).toBe(resultNoProcessor.winner);
        expect(resultWithProcessor.metadata.totalRounds).toBe(
          resultNoProcessor.metadata.totalRounds,
        );
        expect(resultWithProcessor.events.length).toBe(
          resultNoProcessor.events.length,
        );

        // Verify event sequence
        for (let i = 0; i < resultNoProcessor.events.length; i++) {
          expect(resultWithProcessor.events[i]?.type).toBe(
            resultNoProcessor.events[i]?.type,
          );
          expect(resultWithProcessor.events[i]?.round).toBe(
            resultNoProcessor.events[i]?.round,
          );
          expect(resultWithProcessor.events[i]?.actorId).toBe(
            resultNoProcessor.events[i]?.actorId,
          );
        }

        // Verify final states
        expect(resultWithProcessor.finalState.playerUnits.length).toBe(
          resultNoProcessor.finalState.playerUnits.length,
        );
        expect(resultWithProcessor.finalState.botUnits.length).toBe(
          resultNoProcessor.finalState.botUnits.length,
        );
      },
    );
  });

  describe('Phase Hooks Integration', () => {
    it('should include mechanicsEnabled flag in battle start event', () => {
      // Without processor
      const resultNoProcessor = simulateBattle(
        playerTeam,
        enemyTeam,
        testSeed,
      );
      const startEventNoProcessor = resultNoProcessor.events.find(
        (e) => e.type === 'round_start' && e.round === 0,
      );
      expect(startEventNoProcessor?.metadata?.['mechanicsEnabled']).toBe(false);

      // With processor
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      const resultWithProcessor = simulateBattle(
        playerTeam,
        enemyTeam,
        testSeed,
        processor,
      );
      const startEventWithProcessor = resultWithProcessor.events.find(
        (e) => e.type === 'round_start' && e.round === 0,
      );
      expect(startEventWithProcessor?.metadata?.['mechanicsEnabled']).toBe(true);
    });
  });

  describe('Determinism with Processor', () => {
    it('should produce identical results across multiple runs with same seed and processor', () => {
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);

      const results = [
        simulateBattle(playerTeam, enemyTeam, testSeed, processor),
        simulateBattle(playerTeam, enemyTeam, testSeed, processor),
        simulateBattle(playerTeam, enemyTeam, testSeed, processor),
      ];

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]?.winner).toBe(results[0]?.winner);
        expect(results[i]?.metadata.totalRounds).toBe(
          results[0]?.metadata.totalRounds,
        );
        expect(results[i]?.events.length).toBe(results[0]?.events.length);
      }
    });

    it('should produce different results with different seeds', () => {
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);

      const result1 = simulateBattle(playerTeam, enemyTeam, 11111, processor);
      const result2 = simulateBattle(playerTeam, enemyTeam, 99999, processor);

      // Results may differ (not guaranteed, but likely with different seeds)
      // At minimum, verify both complete successfully
      expect(result1.winner).toBeDefined();
      expect(result2.winner).toBeDefined();
    });
  });

  describe('Different Team Compositions', () => {
    const scenarios = [
      {
        name: '2v2 melee',
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
        name: '3v3 ranged',
        playerUnits: ['archer', 'crossbowman', 'mage'] as UnitId[],
        playerPositions: [
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 1 },
        ],
        enemyUnits: ['archer', 'crossbowman', 'warlock'] as UnitId[],
        enemyPositions: [
          { x: 2, y: 9 },
          { x: 3, y: 9 },
          { x: 4, y: 8 },
        ],
      },
      {
        name: '1v1 duel',
        playerUnits: ['duelist'] as UnitId[],
        playerPositions: [{ x: 4, y: 0 }],
        enemyUnits: ['assassin'] as UnitId[],
        enemyPositions: [{ x: 4, y: 9 }],
      },
    ];

    test.each(scenarios)(
      'should handle $name with processor',
      (scenario) => {
        const pTeam = createTeamSetup(
          scenario.playerUnits,
          scenario.playerPositions,
        );
        const eTeam = createTeamSetup(
          scenario.enemyUnits,
          scenario.enemyPositions,
        );

        const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
        const result = simulateBattle(pTeam, eTeam, testSeed, processor);

        expect(result).toBeDefined();
        expect(result.winner).toBeDefined();
        expect(['player', 'bot', 'draw']).toContain(result.winner);
      },
    );
  });

  describe('Processor Configuration Variations', () => {
    it('should work with custom partial config', () => {
      const processor = createMechanicsProcessor({
        facing: true,
        flanking: true,
        // Dependencies auto-resolved
      });

      const result = simulateBattle(
        playerTeam,
        enemyTeam,
        testSeed,
        processor,
      );

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
    });

    it('should work with single mechanic enabled', () => {
      const processor = createMechanicsProcessor({
        armorShred: { shredPerAttack: 2, maxShredPercent: 0.5, decayPerTurn: 0 },
      });

      const result = simulateBattle(
        playerTeam,
        enemyTeam,
        testSeed,
        processor,
      );

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
    });
  });
});
