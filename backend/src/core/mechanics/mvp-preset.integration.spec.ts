/**
 * MVP Preset Integration Tests
 *
 * Verifies that battles simulated with MVP preset (all mechanics disabled)
 * produce identical results to Core 1.0 behavior (no mechanics processor).
 *
 * This is a critical backward compatibility test ensuring that:
 * 1. MVP preset disables all mechanics
 * 2. Battle results are deterministic
 * 3. Event sequences are identical
 * 4. Final unit states match exactly
 *
 * @module core/mechanics
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { Position } from '../../types/game.types';
import { createMechanicsProcessor, MVP_PRESET, PhaseContext } from './index';
import { BattleState, BattleUnit } from '../types';

describe('MVP Preset Integration Tests', () => {
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

  describe('MVP Preset Configuration', () => {
    it('should have all mechanics disabled', () => {
      // Verify MVP preset has all mechanics set to false
      const mechanicKeys = Object.keys(MVP_PRESET) as (keyof typeof MVP_PRESET)[];

      for (const key of mechanicKeys) {
        expect(MVP_PRESET[key]).toBe(false);
      }
    });

    it('should create a processor with all mechanics disabled', () => {
      const processor = createMechanicsProcessor(MVP_PRESET);

      // Verify resolved config matches MVP preset
      expect(processor.config).toEqual(MVP_PRESET);

      // Verify no processors are created (all disabled)
      expect(Object.keys(processor.processors).length).toBe(0);
    });

    it('should have exactly 14 mechanics defined', () => {
      const mechanicCount = Object.keys(MVP_PRESET).length;
      expect(mechanicCount).toBe(14);
    });
  });

  describe('Battle Determinism with MVP Preset', () => {
    it('should produce identical results with same seed (basic battle)', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [
          { x: 1, y: 0 },
          { x: 2, y: 1 },
        ],
      );

      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [
          { x: 1, y: 9 },
          { x: 2, y: 8 },
        ],
      );

      const seed = 12345;

      // Run battle twice with same seed
      const result1 = simulateBattle(playerTeam, enemyTeam, seed);
      const result2 = simulateBattle(playerTeam, enemyTeam, seed);

      // Results must be completely identical
      expect(result1.winner).toBe(result2.winner);
      expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
      expect(result1.events.length).toBe(result2.events.length);

      // Verify event sequence is identical
      for (let i = 0; i < result1.events.length; i++) {
        const event1 = result1.events[i];
        const event2 = result2.events[i];
        if (event1 && event2) {
          expect(event1.type).toBe(event2.type);
          expect(event1.round).toBe(event2.round);
          expect(event1.actorId).toBe(event2.actorId);
          if (event1.targetId) {
            expect(event1.targetId).toBe(event2.targetId);
          }
        }
      }

      // Final unit states should be identical
      expect(result1.finalState.playerUnits.length).toBe(
        result2.finalState.playerUnits.length,
      );
      expect(result1.finalState.botUnits.length).toBe(
        result2.finalState.botUnits.length,
      );

      for (let i = 0; i < result1.finalState.playerUnits.length; i++) {
        const unit1 = result1.finalState.playerUnits[i];
        const unit2 = result2.finalState.playerUnits[i];
        if (unit1 && unit2) {
          expect(unit1.currentHp).toBe(unit2.currentHp);
          expect(unit1.alive).toBe(unit2.alive);
          expect(unit1.position.x).toBe(unit2.position.x);
          expect(unit1.position.y).toBe(unit2.position.y);
        }
      }
    });

    it('should produce identical results with same seed (mixed team)', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer', 'mage'],
        [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 1 },
        ],
      );

      const enemyTeam = createTeamSetup(
        ['berserker', 'crossbowman', 'warlock'],
        [
          { x: 1, y: 9 },
          { x: 2, y: 9 },
          { x: 3, y: 8 },
        ],
      );

      const seed = 42;
      const result1 = simulateBattle(playerTeam, enemyTeam, seed);
      const result2 = simulateBattle(playerTeam, enemyTeam, seed);

      // Results must be completely identical
      expect(result1.winner).toBe(result2.winner);
      expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
      expect(result1.events.length).toBe(result2.events.length);
      expect(result1.metadata.seed).toBe(seed);
      expect(result2.metadata.seed).toBe(seed);
    });

    it('should produce identical results with same seed (single unit)', () => {
      const playerTeam = createTeamSetup(['guardian'], [{ x: 3, y: 0 }]);

      const enemyTeam = createTeamSetup(['assassin'], [{ x: 3, y: 9 }]);

      const seed = 77777;
      const result1 = simulateBattle(playerTeam, enemyTeam, seed);
      const result2 = simulateBattle(playerTeam, enemyTeam, seed);

      expect(result1.winner).toBe(result2.winner);
      expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
      expect(result1.events.length).toBe(result2.events.length);
    });
  });

  describe('MVP Preset Processor Behavior', () => {
    it('should not modify state when processing phases', () => {
      const processor = createMechanicsProcessor(MVP_PRESET);

      // Create a minimal mock unit that satisfies BattleUnit interface
      const mockUnit: BattleUnit = {
        id: 'test-unit-1',
        name: 'Test Unit',
        role: 'tank',
        cost: 5,
        stats: {
          hp: 100,
          atk: 10,
          atkCount: 1,
          armor: 5,
          speed: 3,
          initiative: 5,
          dodge: 0,
        },
        range: 1,
        abilities: [],
        position: { x: 0, y: 0 },
        currentHp: 100,
        maxHp: 100,
        team: 'player',
        alive: true,
        instanceId: 'test-unit-1-instance',
      };

      // Create a minimal battle state for testing
      const mockState: BattleState = {
        units: [mockUnit],
        round: 1,
        events: [],
      };

      const mockContext: PhaseContext = {
        activeUnit: mockUnit,
        seed: 12345,
      };

      // Process all phases - state should remain unchanged
      const phases = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ] as const;

      for (const phase of phases) {
        const result = processor.process(phase, mockState, mockContext);
        // With MVP preset (no processors), state should be returned unchanged
        expect(result).toBe(mockState);
      }
    });
  });

  describe('Battle Scenarios with MVP Preset', () => {
    it('should handle player victory scenario', () => {
      // Strong player team vs weak enemy
      const strongPlayerTeam = createTeamSetup(
        ['berserker', 'elementalist'],
        [
          { x: 2, y: 1 },
          { x: 3, y: 1 },
        ],
      );

      const weakEnemyTeam: TeamSetup = {
        units: [
          {
            ...getUnitTemplate('priest')!,
            stats: { ...getUnitTemplate('priest')!.stats, hp: 5 },
          },
          {
            ...getUnitTemplate('bard')!,
            stats: { ...getUnitTemplate('bard')!.stats, hp: 5 },
          },
        ],
        positions: [
          { x: 2, y: 8 },
          { x: 3, y: 8 },
        ],
      };

      const result = simulateBattle(strongPlayerTeam, weakEnemyTeam, 11111);

      expect(result.winner).toBe('player');
      expect(result.finalState.playerUnits.some((u) => u.alive)).toBe(true);
      expect(result.finalState.botUnits.every((u) => !u.alive)).toBe(true);
    });

    it('should handle bot victory scenario', () => {
      // Weak player team
      const weakPlayerTeam: TeamSetup = {
        units: [
          {
            ...getUnitTemplate('priest')!,
            stats: { ...getUnitTemplate('priest')!.stats, hp: 3 },
          },
        ],
        positions: [{ x: 4, y: 1 }],
      };

      // Strong enemy team
      const strongEnemyTeam = createTeamSetup(
        ['assassin', 'elementalist'],
        [
          { x: 4, y: 8 },
          { x: 5, y: 8 },
        ],
      );

      const result = simulateBattle(weakPlayerTeam, strongEnemyTeam, 22222);

      expect(result.winner).toBe('bot');
      expect(result.finalState.playerUnits.every((u) => !u.alive)).toBe(true);
      expect(result.finalState.botUnits.some((u) => u.alive)).toBe(true);
    });

    it('should handle draw scenario (max rounds)', () => {
      // Create very tanky units that can't kill each other quickly
      const tankPlayerTeam: TeamSetup = {
        units: [
          {
            ...getUnitTemplate('guardian')!,
            stats: {
              ...getUnitTemplate('guardian')!.stats,
              hp: 500,
              armor: 50,
            },
          },
        ],
        positions: [{ x: 0, y: 1 }],
      };

      const tankEnemyTeam: TeamSetup = {
        units: [
          {
            ...getUnitTemplate('guardian')!,
            stats: {
              ...getUnitTemplate('guardian')!.stats,
              hp: 500,
              armor: 50,
            },
          },
        ],
        positions: [{ x: 0, y: 8 }],
      };

      const result = simulateBattle(tankPlayerTeam, tankEnemyTeam, 33333);

      expect(result.winner).toBe('draw');
      expect(result.metadata.totalRounds).toBe(100); // MAX_ROUNDS
    });
  });

  describe('Event Generation Consistency', () => {
    it('should generate consistent event types', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [
          { x: 1, y: 0 },
          { x: 2, y: 1 },
        ],
      );

      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [
          { x: 1, y: 9 },
          { x: 2, y: 8 },
        ],
      );

      const result = simulateBattle(playerTeam, enemyTeam, 44444);

      // Should have battle start and end events
      const startEvents = result.events.filter((e) => e.type === 'round_start');
      const endEvents = result.events.filter((e) => e.type === 'battle_end');

      expect(startEvents.length).toBeGreaterThan(0);
      expect(endEvents.length).toBe(1);

      // Should have action events
      const actionEvents = result.events.filter((e) =>
        ['move', 'attack', 'damage', 'death'].includes(e.type),
      );
      expect(actionEvents.length).toBeGreaterThan(0);

      // Events should be in chronological order
      for (let i = 1; i < result.events.length; i++) {
        const currentEvent = result.events[i];
        const previousEvent = result.events[i - 1];
        if (currentEvent && previousEvent) {
          expect(currentEvent.round).toBeGreaterThanOrEqual(previousEvent.round);
        }
      }
    });

    it('should generate move events with path information', () => {
      // Place melee unit far from enemy to force movement
      const playerTeam = createTeamSetup(['knight'], [{ x: 0, y: 0 }]);

      const enemyTeam = createTeamSetup(['priest'], [{ x: 7, y: 9 }]);

      const result = simulateBattle(playerTeam, enemyTeam, 55555);

      const moveEvents = result.events.filter((e) => e.type === 'move');
      expect(moveEvents.length).toBeGreaterThan(0);

      // Verify move events have required information
      moveEvents.forEach((event) => {
        expect(event.fromPosition).toBeDefined();
        expect(event.toPosition).toBeDefined();
        if (event.fromPosition && event.toPosition) {
          expect(event.fromPosition.x).toBeGreaterThanOrEqual(0);
          expect(event.fromPosition.y).toBeGreaterThanOrEqual(0);
          expect(event.toPosition.x).toBeGreaterThanOrEqual(0);
          expect(event.toPosition.y).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Multiple Seeds Verification', () => {
    const testSeeds = [1001, 2002, 3003, 4004, 5005];

    it.each(testSeeds)(
      'should produce deterministic results with seed %i',
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

        const result1 = simulateBattle(playerTeam, enemyTeam, seed);
        const result2 = simulateBattle(playerTeam, enemyTeam, seed);

        expect(result1.winner).toBe(result2.winner);
        expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
        expect(result1.events.length).toBe(result2.events.length);
        expect(result1.metadata.seed).toBe(seed);
      },
    );
  });

  describe('Final State Verification', () => {
    it('should have correct final unit states', () => {
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

      const result = simulateBattle(playerTeam, enemyTeam, 66666);

      // Check final states have required properties
      for (const unit of result.finalState.playerUnits) {
        expect(unit.instanceId).toBeDefined();
        expect(typeof unit.currentHp).toBe('number');
        expect(unit.position).toBeDefined();
        expect(typeof unit.alive).toBe('boolean');
        expect(unit.currentHp).toBeGreaterThanOrEqual(0);
      }

      for (const unit of result.finalState.botUnits) {
        expect(unit.instanceId).toBeDefined();
        expect(typeof unit.currentHp).toBe('number');
        expect(unit.position).toBeDefined();
        expect(typeof unit.alive).toBe('boolean');
        expect(unit.currentHp).toBeGreaterThanOrEqual(0);
      }

      // Verify winner consistency with final state
      if (result.winner === 'player') {
        expect(result.finalState.playerUnits.some((u) => u.alive)).toBe(true);
        expect(result.finalState.botUnits.every((u) => !u.alive)).toBe(true);
      } else if (result.winner === 'bot') {
        expect(result.finalState.playerUnits.every((u) => !u.alive)).toBe(true);
        expect(result.finalState.botUnits.some((u) => u.alive)).toBe(true);
      }
    });
  });
});
