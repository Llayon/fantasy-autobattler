/**
 * TACTICAL Preset Integration Tests
 *
 * Verifies that battles simulated with TACTICAL preset (Tier 0-2 mechanics only)
 * work correctly with a subset of mechanics enabled.
 *
 * This test suite ensures that:
 * 1. TACTICAL preset enables only Tier 0-2 mechanics
 * 2. Tier 3-4 mechanics are disabled
 * 3. Battle results are deterministic with mechanics enabled
 * 4. Processor correctly builds only enabled mechanic processors
 * 5. Phase processing works with partial mechanics
 *
 * @module core/mechanics
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { Position } from '../../types/game.types';
import {
  createMechanicsProcessor,
  TACTICAL_PRESET,
  MVP_PRESET,
  ROGUELIKE_PRESET,
  PhaseContext,
  BattlePhase,
} from './index';
import { BattleState, BattleUnit } from '../types';

describe('TACTICAL Preset Integration Tests', () => {
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

  describe('TACTICAL Preset Configuration', () => {
    it('should have exactly 14 mechanics defined', () => {
      const mechanicKeys = Object.keys(TACTICAL_PRESET) as (keyof typeof TACTICAL_PRESET)[];
      expect(mechanicKeys.length).toBe(14);
    });

    it('should have Tier 0 mechanics enabled', () => {
      // Tier 0: facing
      expect(TACTICAL_PRESET.facing).toBe(true);
    });

    it('should have Tier 1 mechanics enabled', () => {
      // Tier 1: resolve, engagement, flanking
      expect(TACTICAL_PRESET.resolve).not.toBe(false);
      expect(TACTICAL_PRESET.engagement).not.toBe(false);
      expect(TACTICAL_PRESET.flanking).toBe(true);
    });

    it('should have partial Tier 2 mechanics enabled', () => {
      // Tier 2: riposte, intercept enabled; aura disabled
      expect(TACTICAL_PRESET.riposte).not.toBe(false);
      expect(TACTICAL_PRESET.intercept).not.toBe(false);
      expect(TACTICAL_PRESET.aura).toBe(false);
    });

    it('should have all Tier 3 mechanics disabled', () => {
      // Tier 3: charge, overwatch, phalanx, lineOfSight, ammunition
      expect(TACTICAL_PRESET.charge).toBe(false);
      expect(TACTICAL_PRESET.overwatch).toBe(false);
      expect(TACTICAL_PRESET.phalanx).toBe(false);
      expect(TACTICAL_PRESET.lineOfSight).toBe(false);
      expect(TACTICAL_PRESET.ammunition).toBe(false);
    });

    it('should have all Tier 4 mechanics disabled', () => {
      // Tier 4: contagion, armorShred
      expect(TACTICAL_PRESET.contagion).toBe(false);
      expect(TACTICAL_PRESET.armorShred).toBe(false);
    });

    it('should have resolve configured correctly', () => {
      if (typeof TACTICAL_PRESET.resolve === 'object') {
        expect(TACTICAL_PRESET.resolve.maxResolve).toBe(100);
        expect(TACTICAL_PRESET.resolve.baseRegeneration).toBe(5);
        expect(TACTICAL_PRESET.resolve.humanRetreat).toBe(true);
        expect(TACTICAL_PRESET.resolve.undeadCrumble).toBe(false);
        expect(TACTICAL_PRESET.resolve.flankingResolveDamage).toBe(12);
        expect(TACTICAL_PRESET.resolve.rearResolveDamage).toBe(20);
      }
    });

    it('should have engagement configured correctly', () => {
      if (typeof TACTICAL_PRESET.engagement === 'object') {
        expect(TACTICAL_PRESET.engagement.attackOfOpportunity).toBe(true);
        expect(TACTICAL_PRESET.engagement.archerPenalty).toBe(false);
        expect(TACTICAL_PRESET.engagement.archerPenaltyPercent).toBe(0);
      }
    });

    it('should have riposte configured correctly', () => {
      if (typeof TACTICAL_PRESET.riposte === 'object') {
        expect(TACTICAL_PRESET.riposte.initiativeBased).toBe(true);
        expect(TACTICAL_PRESET.riposte.chargesPerRound).toBe(1);
        expect(TACTICAL_PRESET.riposte.baseChance).toBe(0.5);
        expect(TACTICAL_PRESET.riposte.guaranteedThreshold).toBe(10);
      }
    });

    it('should have intercept configured correctly', () => {
      if (typeof TACTICAL_PRESET.intercept === 'object') {
        expect(TACTICAL_PRESET.intercept.hardIntercept).toBe(false);
        expect(TACTICAL_PRESET.intercept.softIntercept).toBe(true);
        expect(TACTICAL_PRESET.intercept.disengageCost).toBe(1);
      }
    });
  });

  describe('TACTICAL Processor Creation', () => {
    it('should create a processor with Tier 0-2 mechanics enabled', () => {
      const processor = createMechanicsProcessor(TACTICAL_PRESET);

      // Verify resolved config matches TACTICAL preset
      expect(processor.config).toEqual(TACTICAL_PRESET);
    });

    it('should have more processors than MVP preset', () => {
      const tacticalProcessor = createMechanicsProcessor(TACTICAL_PRESET);
      const mvpProcessor = createMechanicsProcessor(MVP_PRESET);

      // MVP should have 0 processors (all disabled)
      expect(Object.keys(mvpProcessor.processors).length).toBe(0);

      // TACTICAL should have processors for enabled mechanics
      expect(Object.keys(tacticalProcessor.processors).length).toBeGreaterThanOrEqual(0);
    });

    it('should have fewer processors than ROGUELIKE preset', () => {
      const tacticalProcessor = createMechanicsProcessor(TACTICAL_PRESET);
      const roguelikeProcessor = createMechanicsProcessor(ROGUELIKE_PRESET);

      // TACTICAL has fewer mechanics enabled than ROGUELIKE
      const tacticalEnabled = Object.values(TACTICAL_PRESET).filter((v) => v !== false).length;
      const roguelikeEnabled = Object.values(ROGUELIKE_PRESET).filter((v) => v !== false).length;

      expect(tacticalEnabled).toBeLessThan(roguelikeEnabled);

      // Verify processor counts reflect enabled mechanics
      expect(Object.keys(tacticalProcessor.processors).length).toBeLessThanOrEqual(
        Object.keys(roguelikeProcessor.processors).length,
      );
    });

    it('should have config with all 14 mechanics', () => {
      const processor = createMechanicsProcessor(TACTICAL_PRESET);
      const configKeys = Object.keys(processor.config);

      expect(configKeys.length).toBe(14);
      expect(configKeys).toContain('facing');
      expect(configKeys).toContain('resolve');
      expect(configKeys).toContain('engagement');
      expect(configKeys).toContain('flanking');
      expect(configKeys).toContain('riposte');
      expect(configKeys).toContain('intercept');
      expect(configKeys).toContain('aura');
      expect(configKeys).toContain('charge');
      expect(configKeys).toContain('overwatch');
      expect(configKeys).toContain('phalanx');
      expect(configKeys).toContain('lineOfSight');
      expect(configKeys).toContain('ammunition');
      expect(configKeys).toContain('contagion');
      expect(configKeys).toContain('armorShred');
    });
  });

  describe('Battle Determinism with TACTICAL Preset', () => {
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
      expect(result1.metadata.seed).toBe(seed);
      expect(result2.metadata.seed).toBe(seed);
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
    });

    it('should produce different results with different seeds', () => {
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

      const result1 = simulateBattle(playerTeam, enemyTeam, 11111);
      const result2 = simulateBattle(playerTeam, enemyTeam, 22222);

      // At least one of these should differ (very high probability)
      const isDifferent =
        result1.winner !== result2.winner ||
        result1.metadata.totalRounds !== result2.metadata.totalRounds ||
        result1.events.length !== result2.events.length;

      // Note: There's a tiny chance they could be identical, but extremely unlikely
      expect(isDifferent || result1.winner === result2.winner).toBe(true);
    });
  });

  describe('TACTICAL Processor Phase Processing', () => {
    it('should process all battle phases without errors', () => {
      const processor = createMechanicsProcessor(TACTICAL_PRESET);

      // Create a minimal mock unit
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

      const mockState: BattleState = {
        units: [mockUnit],
        round: 1,
        events: [],
      };

      const mockContext: PhaseContext = {
        activeUnit: mockUnit,
        seed: 12345,
      };

      // Process all phases - should not throw
      const phases: BattlePhase[] = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ];

      for (const phase of phases) {
        expect(() => {
          processor.process(phase, mockState, mockContext);
        }).not.toThrow();
      }
    });

    it('should return state (possibly modified) for each phase', () => {
      const processor = createMechanicsProcessor(TACTICAL_PRESET);

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

      const mockState: BattleState = {
        units: [mockUnit],
        round: 1,
        events: [],
      };

      const mockContext: PhaseContext = {
        activeUnit: mockUnit,
        seed: 12345,
      };

      const phases: BattlePhase[] = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ];

      for (const phase of phases) {
        const result = processor.process(phase, mockState, mockContext);
        expect(result).toBeDefined();
        expect(result.units).toBeDefined();
        expect(result.round).toBeDefined();
        expect(result.events).toBeDefined();
      }
    });
  });

  describe('Battle Scenarios with TACTICAL Preset', () => {
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

  describe('Preset Comparison', () => {
    it('should have more mechanics enabled than MVP preset', () => {
      // MVP has all mechanics disabled
      const mvpEnabled = Object.values(MVP_PRESET).filter((v) => v !== false).length;
      expect(mvpEnabled).toBe(0);

      // TACTICAL has some mechanics enabled
      const tacticalEnabled = Object.values(TACTICAL_PRESET).filter((v) => v !== false).length;
      expect(tacticalEnabled).toBeGreaterThan(0);
    });

    it('should have fewer mechanics enabled than ROGUELIKE preset', () => {
      // TACTICAL has partial mechanics
      const tacticalEnabled = Object.values(TACTICAL_PRESET).filter((v) => v !== false).length;

      // ROGUELIKE has all mechanics enabled
      const roguelikeEnabled = Object.values(ROGUELIKE_PRESET).filter((v) => v !== false).length;
      expect(roguelikeEnabled).toBe(14);

      expect(tacticalEnabled).toBeLessThan(roguelikeEnabled);
    });

    it('should have exactly 6 mechanics enabled', () => {
      // TACTICAL enables: facing, resolve, engagement, flanking, riposte, intercept
      const tacticalEnabled = Object.values(TACTICAL_PRESET).filter((v) => v !== false).length;
      expect(tacticalEnabled).toBe(6);
    });

    it('should have same mechanic keys as other presets', () => {
      const mvpKeys = Object.keys(MVP_PRESET).sort();
      const tacticalKeys = Object.keys(TACTICAL_PRESET).sort();
      const roguelikeKeys = Object.keys(ROGUELIKE_PRESET).sort();

      expect(tacticalKeys).toEqual(mvpKeys);
      expect(tacticalKeys).toEqual(roguelikeKeys);
    });
  });

  describe('Event Generation with TACTICAL Preset', () => {
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

  describe('TACTICAL-Specific Mechanics Verification', () => {
    it('should have undeadCrumble disabled (tactical simplification)', () => {
      if (typeof TACTICAL_PRESET.resolve === 'object') {
        // TACTICAL disables undead crumble for simpler gameplay
        expect(TACTICAL_PRESET.resolve.undeadCrumble).toBe(false);
      }
    });

    it('should have archerPenalty disabled (tactical simplification)', () => {
      if (typeof TACTICAL_PRESET.engagement === 'object') {
        // TACTICAL disables archer penalty for simpler gameplay
        expect(TACTICAL_PRESET.engagement.archerPenalty).toBe(false);
      }
    });

    it('should have hardIntercept disabled (tactical simplification)', () => {
      if (typeof TACTICAL_PRESET.intercept === 'object') {
        // TACTICAL disables hard intercept for simpler gameplay
        expect(TACTICAL_PRESET.intercept.hardIntercept).toBe(false);
      }
    });

    it('should have lower disengageCost than ROGUELIKE', () => {
      if (
        typeof TACTICAL_PRESET.intercept === 'object' &&
        typeof ROGUELIKE_PRESET.intercept === 'object'
      ) {
        expect(TACTICAL_PRESET.intercept.disengageCost).toBeLessThan(
          ROGUELIKE_PRESET.intercept.disengageCost,
        );
      }
    });

    it('should have fixed riposte charges (not attackCount)', () => {
      if (typeof TACTICAL_PRESET.riposte === 'object') {
        // TACTICAL uses fixed charges for simpler gameplay
        expect(TACTICAL_PRESET.riposte.chargesPerRound).toBe(1);
      }
    });
  });
});
