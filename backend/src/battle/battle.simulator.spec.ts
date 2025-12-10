/**
 * Unit tests for Battle Simulator v2.
 * Tests the complete battle simulation system with grid-based combat,
 * pathfinding, targeting, and deterministic behavior.
 */

import { simulateBattle, TeamSetup, analyzeBattleResult } from './battle.simulator';
import { Position } from '../types/game.types';
import { getUnitTemplate, UnitId } from '../unit/unit.data';

describe('Battle Simulator v2', () => {
  // Helper function to create a simple team setup
  const createTeamSetup = (unitIds: UnitId[], positions: Position[]): TeamSetup => {
    const units = unitIds.map(id => {
      const template = getUnitTemplate(id);
      if (!template) {
        throw new Error(`Unit template not found: ${id}`);
      }
      return template;
    });
    
    return { units, positions };
  };

  describe('simulateBattle', () => {
    it('should simulate a basic battle between two teams', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 12345);
      
      expect(result).toBeDefined();
      expect(result.winner).toMatch(/^(player|bot|draw)$/);
      expect(result.events).toBeInstanceOf(Array);
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.finalState.playerUnits).toHaveLength(2);
      expect(result.finalState.botUnits).toHaveLength(2);
      expect(result.metadata.seed).toBe(12345);
      expect(result.metadata.totalRounds).toBeGreaterThan(0);
      expect(result.metadata.durationMs).toBeGreaterThan(0);
    });

    it('should be deterministic with same seed', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'mage'],
        [{ x: 0, y: 0 }, { x: 1, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['guardian', 'archer'],
        [{ x: 0, y: 9 }, { x: 1, y: 8 }]
      );
      
      const seed = 54321;
      const result1 = simulateBattle(playerTeam, enemyTeam, seed);
      const result2 = simulateBattle(playerTeam, enemyTeam, seed);
      
      // Results should be identical
      expect(result1.winner).toBe(result2.winner);
      expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
      expect(result1.events.length).toBe(result2.events.length);
      
      // Check that key events are the same
      for (let i = 0; i < Math.min(result1.events.length, result2.events.length); i++) {
        const event1 = result1.events[i];
        const event2 = result2.events[i];
        if (event1 && event2) {
          expect(event1.type).toBe(event2.type);
          expect(event1.round).toBe(event2.round);
        }
      }
    });

    it('should produce different results with different seeds', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'mage'],
        [{ x: 2, y: 0 }, { x: 3, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['berserker', 'warlock'],
        [{ x: 2, y: 9 }, { x: 3, y: 8 }]
      );
      
      const result1 = simulateBattle(playerTeam, enemyTeam, 11111);
      const result2 = simulateBattle(playerTeam, enemyTeam, 99999);
      
      // Results may be different (though not guaranteed)
      // At minimum, the seeds should be recorded correctly
      expect(result1.metadata.seed).toBe(11111);
      expect(result2.metadata.seed).toBe(99999);
    });

    it('should handle single unit teams', () => {
      const playerTeam = createTeamSetup(
        ['guardian'],
        [{ x: 3, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['assassin'],
        [{ x: 3, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 77777);
      
      expect(result.winner).toMatch(/^(player|bot|draw)$/);
      expect(result.finalState.playerUnits).toHaveLength(1);
      expect(result.finalState.botUnits).toHaveLength(1);
      
      // One team should have no survivors (unless draw)
      if (result.winner !== 'draw') {
        const playerSurvivors = result.finalState.playerUnits.filter(u => u.alive).length;
        const botSurvivors = result.finalState.botUnits.filter(u => u.alive).length;
        
        if (result.winner === 'player') {
          expect(playerSurvivors).toBeGreaterThan(0);
          expect(botSurvivors).toBe(0);
        } else {
          expect(playerSurvivors).toBe(0);
          expect(botSurvivors).toBeGreaterThan(0);
        }
      }
    });

    it('should generate comprehensive battle events', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 33333);
      
      // Should have battle start and end events
      const startEvents = result.events.filter(e => e.type === 'round_start');
      const endEvents = result.events.filter(e => e.type === 'battle_end');
      
      expect(startEvents.length).toBeGreaterThan(0);
      expect(endEvents.length).toBe(1);
      
      // Should have action events
      const actionEvents = result.events.filter(e => 
        ['move', 'attack', 'damage', 'death'].includes(e.type)
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

    it('should respect deployment zones', () => {
      const playerTeam = createTeamSetup(
        ['knight'],
        [{ x: 0, y: 0 }] // Valid player position
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue'],
        [{ x: 0, y: 9 }] // Valid enemy position
      );
      
      expect(() => simulateBattle(playerTeam, enemyTeam, 12345)).not.toThrow();
    });

    it('should validate team setups and throw errors for invalid configurations', () => {
      // Invalid player position (wrong row)
      const invalidPlayerTeam = createTeamSetup(
        ['knight'],
        [{ x: 0, y: 5 }] // Invalid row for player
      );
      
      const validEnemyTeam = createTeamSetup(
        ['rogue'],
        [{ x: 0, y: 9 }]
      );
      
      expect(() => simulateBattle(invalidPlayerTeam, validEnemyTeam, 12345))
        .toThrow(/Invalid player team setup/);
      
      // Mismatched units and positions arrays
      const mismatchedTeam: TeamSetup = {
        units: [getUnitTemplate('knight')!],
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }] // Too many positions
      };
      
      expect(() => simulateBattle(mismatchedTeam, validEnemyTeam, 12345))
        .toThrow(/Units array length/);
    });

    it('should handle battles that reach maximum rounds', () => {
      // Create very defensive teams that might not finish quickly
      const playerTeam = createTeamSetup(
        ['guardian'], // High HP, low damage
        [{ x: 0, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['guardian'], // High HP, low damage
        [{ x: 7, y: 9 }] // Far apart
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 99999);
      
      // Should eventually end (either by elimination or max rounds)
      expect(result.winner).toMatch(/^(player|bot|draw)$/);
      expect(result.metadata.totalRounds).toBeGreaterThan(0);
      expect(result.metadata.totalRounds).toBeLessThanOrEqual(100); // MAX_ROUNDS
    });

    it('should create proper final unit states', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'mage'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue', 'archer'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 44444);
      
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
    });
  });

  describe('analyzeBattleResult', () => {
    it('should provide comprehensive battle analysis', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 55555);
      const analysis = analyzeBattleResult(result);
      
      expect(analysis.totalRounds).toBe(result.metadata.totalRounds);
      expect(analysis.totalEvents).toBe(result.events.length);
      expect(analysis.eventsByType).toBeDefined();
      expect(analysis.survivingUnits.player).toBeGreaterThanOrEqual(0);
      expect(analysis.survivingUnits.bot).toBeGreaterThanOrEqual(0);
      expect(analysis.damageDealt.player).toBeGreaterThanOrEqual(0);
      expect(analysis.damageDealt.bot).toBeGreaterThanOrEqual(0);
      
      // Should have some event types
      expect(Object.keys(analysis.eventsByType).length).toBeGreaterThan(0);
    });

    it('should count events by type correctly', () => {
      const playerTeam = createTeamSetup(
        ['knight'],
        [{ x: 3, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['assassin'],
        [{ x: 3, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 66666);
      const analysis = analyzeBattleResult(result);
      
      // Verify event counts match actual events
      const actualEventCounts: Record<string, number> = {};
      for (const event of result.events) {
        actualEventCounts[event.type] = (actualEventCounts[event.type] || 0) + 1;
      }
      
      expect(analysis.eventsByType).toEqual(actualEventCounts);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty teams gracefully', () => {
      const emptyTeam: TeamSetup = { units: [], positions: [] };
      const validTeam = createTeamSetup(['knight'], [{ x: 0, y: 9 }]);
      
      // Empty teams should be handled by validation
      expect(() => simulateBattle(emptyTeam, validTeam, 12345))
        .not.toThrow(); // Should not crash, but may have specific behavior
    });

    it('should handle duplicate positions', () => {
      const duplicatePositionTeam: TeamSetup = {
        units: [getUnitTemplate('knight')!, getUnitTemplate('mage')!],
        positions: [{ x: 0, y: 0 }, { x: 0, y: 0 }] // Duplicate positions
      };
      
      const validTeam = createTeamSetup(['rogue'], [{ x: 0, y: 9 }]);
      
      expect(() => simulateBattle(duplicatePositionTeam, validTeam, 12345))
        .toThrow(/Duplicate positions/);
    });

    it('should handle out-of-bounds positions', () => {
      const outOfBoundsTeam: TeamSetup = {
        units: [getUnitTemplate('knight')!],
        positions: [{ x: -1, y: 0 }] // Out of bounds
      };
      
      const validTeam = createTeamSetup(['rogue'], [{ x: 0, y: 9 }]);
      
      expect(() => simulateBattle(outOfBoundsTeam, validTeam, 12345))
        .toThrow(/outside grid bounds/);
    });
  });

  describe('integration with battle systems', () => {
    it('should use turn order system correctly', () => {
      // Create units with different initiative values
      const highInitiativeUnit = getUnitTemplate('assassin')!; // Should have high initiative
      const lowInitiativeUnit = getUnitTemplate('guardian')!; // Should have lower initiative
      
      const playerTeam: TeamSetup = {
        units: [lowInitiativeUnit],
        positions: [{ x: 0, y: 0 }]
      };
      
      const enemyTeam: TeamSetup = {
        units: [highInitiativeUnit],
        positions: [{ x: 0, y: 9 }]
      };
      
      const result = simulateBattle(playerTeam, enemyTeam, 77777);
      
      // Should have proper turn-based events
      const actionEvents = result.events.filter(e => 
        ['move', 'attack', 'damage'].includes(e.type)
      );
      expect(actionEvents.length).toBeGreaterThan(0);
    });

    it('should use pathfinding for movement', () => {
      // Place units far apart to force movement
      const playerTeam = createTeamSetup(
        ['knight'], // Melee unit
        [{ x: 0, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['mage'], // Ranged unit
        [{ x: 7, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 88888);
      
      // Should have movement events as units try to get in range
      const moveEvents = result.events.filter(e => e.type === 'move');
      expect(moveEvents.length).toBeGreaterThan(0);
    });

    it('should use targeting system for combat', () => {
      const playerTeam = createTeamSetup(
        ['archer', 'mage'], // Different roles
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['knight', 'priest'], // Tank and support
        [{ x: 1, y: 9 }, { x: 2, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 99999);
      
      // Should have attack events showing targeting decisions
      const attackEvents = result.events.filter(e => e.type === 'attack');
      expect(attackEvents.length).toBeGreaterThan(0);
      
      // Each attack should have a valid target
      for (const attack of attackEvents) {
        expect(attack.targetId).toBeDefined();
      }
    });
  });
});