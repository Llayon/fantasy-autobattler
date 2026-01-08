/**
 * Unit tests for Battle Simulator v2.
 * Tests the complete battle simulation system with grid-based combat,
 * pathfinding, targeting, and deterministic behavior.
 * 
 * Comprehensive test suite covering:
 * - Deterministic behavior with seeded randomness
 * - Player/bot victory conditions
 * - Draw conditions (MAX_ROUNDS timeout)
 * - Event generation for replay (move, attack, damage, death)
 * - Taunt mechanics and targeting priorities
 * - Ranged combat behavior (archers staying at distance)
 */

import { simulateBattle, TeamSetup, analyzeBattleResult } from './battle.simulator';
import { Position } from '../types/game.types';
import { getUnitTemplate, UnitId } from '../unit/unit.data';
import { BATTLE_LIMITS } from '../config/game.constants';

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

  // =============================================================================
  // COMPREHENSIVE BATTLE SCENARIOS
  // =============================================================================

  describe('deterministic behavior', () => {
    it('should produce identical results with same seed', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer', 'mage'],
        [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['berserker', 'crossbowman', 'warlock'],
        [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 8 }]
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
      expect(result1.finalState.playerUnits.length).toBe(result2.finalState.playerUnits.length);
      expect(result1.finalState.botUnits.length).toBe(result2.finalState.botUnits.length);
      
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

    it('should produce different results with different seeds', () => {
      const playerTeam = createTeamSetup(
        ['rogue', 'priest'],
        [{ x: 0, y: 1 }, { x: 1, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['duelist', 'bard'],
        [{ x: 0, y: 8 }, { x: 1, y: 9 }]
      );
      
      const result1 = simulateBattle(playerTeam, enemyTeam, 12345);
      const result2 = simulateBattle(playerTeam, enemyTeam, 54321);
      
      // Seeds should be recorded correctly
      expect(result1.metadata.seed).toBe(12345);
      expect(result2.metadata.seed).toBe(54321);
      
      // Results may differ due to randomness (dodge, damage, etc.)
      // At minimum, we verify the battles complete successfully
      expect(result1.winner).toMatch(/^(player|bot|draw)$/);
      expect(result2.winner).toMatch(/^(player|bot|draw)$/);
    });
  });

  describe('victory conditions', () => {
    it('should determine player victory when enemy team is eliminated', () => {
      // Strong player team vs weak enemy
      const strongPlayerTeam = createTeamSetup(
        ['berserker', 'elementalist'], // High damage units
        [{ x: 2, y: 1 }, { x: 3, y: 1 }]
      );
      
      // Weak enemy team with low HP
      const weakEnemyTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('priest')!, stats: { ...getUnitTemplate('priest')!.stats, hp: 5 } },
          { ...getUnitTemplate('bard')!, stats: { ...getUnitTemplate('bard')!.stats, hp: 5 } }
        ],
        positions: [{ x: 2, y: 8 }, { x: 3, y: 8 }]
      };
      
      const result = simulateBattle(strongPlayerTeam, weakEnemyTeam, 11111);
      
      expect(result.winner).toBe('player');
      expect(result.finalState.playerUnits.some(u => u.alive)).toBe(true);
      expect(result.finalState.botUnits.every(u => !u.alive)).toBe(true);
      expect(result.metadata.totalRounds).toBeLessThan(BATTLE_LIMITS.MAX_ROUNDS);
      
      // Should have death events for enemy units (may be combined if killed in same turn)
      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents.length).toBeGreaterThanOrEqual(1); // At least 1 death event
      
      // Verify all enemy units are dead in final state
      const deadEnemies = result.finalState.botUnits.filter(u => !u.alive);
      expect(deadEnemies.length).toBe(2); // Both enemies should be dead
    });

    it('should determine bot victory when player team is eliminated', () => {
      // Weak player team
      const weakPlayerTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('priest')!, stats: { ...getUnitTemplate('priest')!.stats, hp: 3 } }
        ],
        positions: [{ x: 4, y: 1 }]
      };
      
      // Strong enemy team
      const strongEnemyTeam = createTeamSetup(
        ['assassin', 'elementalist'], // High damage, high initiative
        [{ x: 4, y: 8 }, { x: 5, y: 8 }]
      );
      
      const result = simulateBattle(weakPlayerTeam, strongEnemyTeam, 22222);
      
      expect(result.winner).toBe('bot');
      expect(result.finalState.playerUnits.every(u => !u.alive)).toBe(true);
      expect(result.finalState.botUnits.some(u => u.alive)).toBe(true);
      expect(result.metadata.totalRounds).toBeLessThan(BATTLE_LIMITS.MAX_ROUNDS);
    });

    it('should determine draw when MAX_ROUNDS is reached', () => {
      // Create very tanky units that can't kill each other quickly
      const tankPlayerTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('guardian')!, stats: { ...getUnitTemplate('guardian')!.stats, hp: 500, armor: 50 } }
        ],
        positions: [{ x: 0, y: 1 }]
      };
      
      const tankEnemyTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('guardian')!, stats: { ...getUnitTemplate('guardian')!.stats, hp: 500, armor: 50 } }
        ],
        positions: [{ x: 0, y: 8 }]
      };
      
      const result = simulateBattle(tankPlayerTeam, tankEnemyTeam, 33333);
      
      expect(result.winner).toBe('draw');
      expect(result.metadata.totalRounds).toBe(BATTLE_LIMITS.MAX_ROUNDS);
      
      // Both units should still be alive (or both dead from mutual elimination)
      const playerAlive = result.finalState.playerUnits.some(u => u.alive);
      const botAlive = result.finalState.botUnits.some(u => u.alive);
      
      // In a timeout scenario, usually both are alive
      if (result.metadata.totalRounds === BATTLE_LIMITS.MAX_ROUNDS) {
        expect(playerAlive || botAlive).toBe(true); // At least one team has survivors
      }
    });
  });

  describe('event generation and replay', () => {
    it('should generate comprehensive events for battle replay', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 44444);
      
      // Verify essential event types are present
      const eventTypes = new Set(result.events.map(e => e.type));
      
      expect(eventTypes.has('round_start')).toBe(true);
      expect(eventTypes.has('battle_end')).toBe(true);
      
      // Should have action events (units should move and attack)
      const actionEventTypes = ['move', 'attack', 'damage', 'death'] as const;
      const hasActionEvents = actionEventTypes.some(type => eventTypes.has(type));
      expect(hasActionEvents).toBe(true);
      
      // Events should be chronologically ordered
      for (let i = 1; i < result.events.length; i++) {
        const current = result.events[i];
        const previous = result.events[i - 1];
        if (current && previous) {
          expect(current.round).toBeGreaterThanOrEqual(previous.round);
        }
      }
      
      // All events should have required fields
      result.events.forEach(event => {
        expect(event.type).toBeDefined();
        expect(event.round).toBeGreaterThanOrEqual(0);
        expect(event.actorId).toBeDefined();
      });
    });

    it('should generate move events with path information', () => {
      // Place melee unit far from enemy to force movement
      const playerTeam = createTeamSetup(
        ['knight'], // Melee unit, range 1
        [{ x: 0, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['priest'], // Support unit
        [{ x: 7, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 55555);
      
      const moveEvents = result.events.filter(e => e.type === 'move');
      expect(moveEvents.length).toBeGreaterThan(0);
      
      // Verify move events have required information
      moveEvents.forEach(event => {
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

    it('should generate attack and damage events', () => {
      // Close combat scenario - adjacent positions for guaranteed combat
      const playerTeam = createTeamSetup(
        ['berserker'], // High damage melee
        [{ x: 3, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['priest'], // Lower HP target
        [{ x: 3, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 66666);
      
      const attackEvents = result.events.filter(e => e.type === 'attack');
      const damageEvents = result.events.filter(e => e.type === 'damage');
      
      expect(attackEvents.length).toBeGreaterThan(0);
      
      // Verify attack events have target information
      attackEvents.forEach(event => {
        expect(event.targetId).toBeDefined();
        expect(event.actorId).toBeDefined();
      });
      
      // If there are damage events, verify they have proper information
      if (damageEvents.length > 0) {
        damageEvents.forEach(event => {
          expect(event.damage).toBeDefined();
          if (event.damage !== undefined) {
            expect(event.damage).toBeGreaterThanOrEqual(0); // Can be 0 if dodged
          }
          expect(event.targetId).toBeDefined();
        });
      }
    });

    it('should generate death events when units are killed', () => {
      // High damage vs low HP scenario - guaranteed kill
      const playerTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('assassin')!, stats: { ...getUnitTemplate('assassin')!.stats, atk: 200, atkCount: 2 } }
        ],
        positions: [{ x: 4, y: 1 }]
      };
      
      const enemyTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('priest')!, stats: { ...getUnitTemplate('priest')!.stats, hp: 1, armor: 0, dodge: 0 } }
        ],
        positions: [{ x: 4, y: 8 }]
      };
      
      const result = simulateBattle(playerTeam, enemyTeam, 77777);
      
      // Battle should end with player victory (enemy eliminated)
      expect(result.winner).toBe('player');
      expect(result.finalState.botUnits.every(u => !u.alive)).toBe(true);
      
      // Should have death events for the eliminated units
      const deathEvents = result.events.filter(e => e.type === 'death');
      if (deathEvents.length > 0) {
        // Verify death events have killed unit information
        deathEvents.forEach(event => {
          expect(event.killedUnits).toBeDefined();
          if (event.killedUnits) {
            expect(event.killedUnits.length).toBeGreaterThan(0);
          }
        });
      }
    });
  });

  describe('taunt mechanics', () => {
    it('should prioritize taunting units as targets', () => {
      // Create a scenario with a taunting guardian
      const playerTeam = createTeamSetup(
        ['archer'], // Ranged DPS
        [{ x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['guardian', 'priest'], // Guardian has taunt ability, priest is support
        [{ x: 2, y: 8 }, { x: 3, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 88888);
      
      // Verify that attacks target the guardian (taunting unit) preferentially
      const attackEvents = result.events.filter(e => e.type === 'attack');
      expect(attackEvents.length).toBeGreaterThan(0);
      
      // Most attacks should target the guardian due to taunt
      const guardianTargets = attackEvents.filter(e => 
        e.targetId && (e.targetId.includes('guardian') || e.targetId.includes('bot_guardian'))
      );
      
      // Should have some attacks on the guardian (taunt working)
      expect(guardianTargets.length).toBeGreaterThan(0);
    });
  });

  describe('ranged combat behavior', () => {
    it('should keep archers at optimal range without moving closer unnecessarily', () => {
      // Archer vs melee unit - archer should stay at range
      const playerTeam = createTeamSetup(
        ['archer'], // Range 4, should stay back
        [{ x: 3, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['knight'], // Melee, range 1
        [{ x: 3, y: 8 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 99999);
      
      // Archer should attack without moving (already in range)
      const attackEvents = result.events.filter(e => 
        e.type === 'attack' && e.actorId.includes('archer')
      );
      expect(attackEvents.length).toBeGreaterThan(0);
      
      // Check if archer moved unnecessarily close
      const archerMoveEvents = result.events.filter(e => 
        e.type === 'move' && e.actorId.includes('archer')
      );
      
      // Archer might move for positioning, but shouldn't move to melee range
      archerMoveEvents.forEach(moveEvent => {
        if (moveEvent.toPosition) {
          const distance = Math.abs(moveEvent.toPosition.y - 8); // Distance from enemy row
          expect(distance).toBeGreaterThan(1); // Should maintain distance > 1
        }
      });
    });

    it('should demonstrate crossbowman long-range combat', () => {
      // Crossbowman has range 5, longest in game
      const playerTeam = createTeamSetup(
        ['crossbowman'], // Range 5
        [{ x: 4, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['berserker'], // Melee unit
        [{ x: 4, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 11223);
      
      // Crossbowman should be able to attack from starting position
      const crossbowAttacks = result.events.filter(e => 
        e.type === 'attack' && e.actorId.includes('crossbowman')
      );
      expect(crossbowAttacks.length).toBeGreaterThan(0);
      
      // Should have damage events from crossbowman
      const crossbowDamage = result.events.filter(e => 
        e.type === 'damage' && e.actorId.includes('crossbowman')
      );
      expect(crossbowDamage.length).toBeGreaterThan(0);
    });
  });

  describe('integration with battle systems', () => {
    it('should use turn order system correctly with initiative values', () => {
      // Assassin (initiative 10) vs Guardian (initiative 3)
      const playerTeam = createTeamSetup(
        ['guardian'], // Low initiative (3)
        [{ x: 0, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['assassin'], // High initiative (10)
        [{ x: 0, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 77777);
      
      // Verify turn order is based on initiative
      // Assassin has initiative 10, Guardian has initiative 3
      // The assassin should act before guardian within the same round
      const actionEvents = result.events.filter(e => 
        ['move', 'attack'].includes(e.type) && e.round === 1
      );
      
      // Find first action from each unit in round 1
      const assassinAction = actionEvents.find(e => e.actorId.includes('assassin'));
      const guardianAction = actionEvents.find(e => e.actorId.includes('guardian'));
      
      if (assassinAction && guardianAction) {
        const assassinIndex = actionEvents.indexOf(assassinAction);
        const guardianIndex = actionEvents.indexOf(guardianAction);
        // Assassin should act before guardian due to higher initiative
        expect(assassinIndex).toBeLessThan(guardianIndex);
      }
      
      // At minimum, verify battle completes successfully
      expect(result.winner).toMatch(/^(player|bot|draw)$/);
    });

    it('should use pathfinding for complex movement scenarios', () => {
      // Create obstacles by placing multiple units
      const playerTeam = createTeamSetup(
        ['knight', 'archer', 'mage'],
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['rogue', 'priest', 'bard'],
        [{ x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 88888);
      
      // Should have movement events as units navigate around each other
      const moveEvents = result.events.filter(e => e.type === 'move');
      expect(moveEvents.length).toBeGreaterThan(0);
      
      // Verify pathfinding produces valid moves
      moveEvents.forEach(event => {
        if (event.toPosition && event.fromPosition) {
          const distance = Math.abs(event.toPosition.x - event.fromPosition.x) + 
                          Math.abs(event.toPosition.y - event.fromPosition.y);
          expect(distance).toBeGreaterThan(0); // Actually moved
          expect(distance).toBeLessThanOrEqual(5); // Reasonable movement distance
        }
      });
    });

    it('should demonstrate role-based targeting strategies', () => {
      // Mixed team composition to test targeting priorities
      const playerTeam = createTeamSetup(
        ['archer', 'mage'], // Ranged units with different targeting preferences
        [{ x: 1, y: 0 }, { x: 2, y: 1 }]
      );
      
      const enemyTeam = createTeamSetup(
        ['knight', 'priest', 'rogue'], // Tank, support, DPS
        [{ x: 1, y: 9 }, { x: 2, y: 8 }, { x: 3, y: 9 }]
      );
      
      const result = simulateBattle(playerTeam, enemyTeam, 99999);
      
      // Should have multiple attack events showing targeting decisions
      const attackEvents = result.events.filter(e => e.type === 'attack');
      expect(attackEvents.length).toBeGreaterThan(0);
      
      // Verify different units make targeting decisions
      const attackers = new Set(attackEvents.map(e => e.actorId));
      expect(attackers.size).toBeGreaterThan(1); // Multiple units attacking
      
      // Each attack should have a valid target
      attackEvents.forEach(attack => {
        expect(attack.targetId).toBeDefined();
        if (attack.targetId) {
          expect(attack.targetId.length).toBeGreaterThan(0);
        }
      });
    });
  });

  // =============================================================================
  // PROPERTY-BASED TESTS (Core 2.0 Mechanics)
  // =============================================================================

  describe('Property-Based Tests: MVP Equivalence', () => {
    /**
     * **Feature: mechanics-optimization, Property 3: MVP behavior without processor**
     * **Validates: Requirements 2.2**
     * 
     * For any battle simulated without a MechanicsProcessor, the result SHALL be
     * identical to a battle with MVP_PRESET processor (all mechanics disabled).
     * 
     * This ensures backward compatibility - battles without a processor should
     * behave exactly like Core 1.0 (MVP behavior).
     */
    it('Property 3: MVP behavior without processor - battles without processor match MVP_PRESET', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fc = require('fast-check') as typeof import('fast-check');
      
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createMechanicsProcessor, MVP_PRESET } = require('../core/mechanics') as {
        createMechanicsProcessor: (config: unknown) => MechanicsProcessor;
        MVP_PRESET: unknown;
      };
      
      // Import MechanicsProcessor type
      type MechanicsProcessor = import('../core/mechanics').MechanicsProcessor;
      
      // Arbitrary generator for unit IDs
      const arbitraryUnitId = fc.constantFrom(
        'knight', 'guardian', 'berserker',
        'rogue', 'duelist', 'assassin',
        'archer', 'crossbowman', 'hunter',
        'mage', 'warlock', 'elementalist',
        'priest', 'bard', 'enchanter'
      );
      
      // Arbitrary generator for team setup
      const arbitraryTeamSetup = (yRange: [number, number]) => fc.tuple(
        fc.array(arbitraryUnitId, { minLength: 1, maxLength: 3 }),
        fc.integer({ min: 1000, max: 9999 })
      ).chain(([unitIds, seed]) => {
        const units = unitIds.map(id => {
          const template = getUnitTemplate(id);
          if (!template) {
            throw new Error(`Unit template not found: ${id}`);
          }
          return template;
        });
        
        // Generate unique positions for each unit
        // Use a more deterministic approach to avoid duplicates
        const positions: Position[] = [];
        const gridWidth = 8;
        const gridHeight = yRange[1] - yRange[0] + 1;
        const maxPositions = gridWidth * gridHeight;
        
        // Create all possible positions in the range
        const allPositions: Position[] = [];
        for (let y = yRange[0]; y <= yRange[1]; y++) {
          for (let x = 0; x < gridWidth; x++) {
            allPositions.push({ x, y });
          }
        }
        
        // Shuffle positions using seed
        const shuffled = [...allPositions];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.abs(Math.sin(seed + i)) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
        }
        
        // Take first N positions
        for (let i = 0; i < Math.min(units.length, maxPositions); i++) {
          positions.push(shuffled[i]!);
        }
        
        return fc.constant({ units, positions });
      });
      
      // Property: Battles without processor match MVP_PRESET behavior
      fc.assert(
        fc.property(
          arbitraryTeamSetup([0, 1]), // Player team (rows 0-1)
          arbitraryTeamSetup([8, 9]), // Enemy team (rows 8-9)
          fc.integer({ min: 1, max: 99999 }), // Battle seed
          (playerTeam: TeamSetup, enemyTeam: TeamSetup, seed: number) => {
            // Simulate battle WITHOUT processor (Core 1.0 behavior)
            const resultWithoutProcessor = simulateBattle(playerTeam, enemyTeam, seed);
            
            // Simulate battle WITH MVP_PRESET processor (all mechanics disabled)
            const mvpProcessor = createMechanicsProcessor(MVP_PRESET);
            const resultWithMvpProcessor = simulateBattle(playerTeam, enemyTeam, seed, mvpProcessor);
            
            // Property 3: Results should be identical
            
            // Winner should be the same
            expect(resultWithMvpProcessor.winner).toBe(resultWithoutProcessor.winner);
            
            // Total rounds should be the same
            expect(resultWithMvpProcessor.metadata.totalRounds).toBe(resultWithoutProcessor.metadata.totalRounds);
            
            // Event count should be the same (no mechanic events added)
            expect(resultWithMvpProcessor.events.length).toBe(resultWithoutProcessor.events.length);
            
            // Event types should match (no mechanic_* events)
            for (let i = 0; i < Math.min(resultWithoutProcessor.events.length, resultWithMvpProcessor.events.length); i++) {
              const event1 = resultWithoutProcessor.events[i];
              const event2 = resultWithMvpProcessor.events[i];
              if (event1 && event2) {
                expect(event2.type).toBe(event1.type);
                expect(event2.round).toBe(event1.round);
              }
            }
            
            // Final unit states should match
            expect(resultWithMvpProcessor.finalState.playerUnits.length).toBe(resultWithoutProcessor.finalState.playerUnits.length);
            expect(resultWithMvpProcessor.finalState.botUnits.length).toBe(resultWithoutProcessor.finalState.botUnits.length);
            
            // Verify each unit's final state matches
            for (let i = 0; i < resultWithoutProcessor.finalState.playerUnits.length; i++) {
              const unit1 = resultWithoutProcessor.finalState.playerUnits[i];
              const unit2 = resultWithMvpProcessor.finalState.playerUnits[i];
              if (unit1 && unit2) {
                expect(unit2.alive).toBe(unit1.alive);
                expect(unit2.currentHp).toBe(unit1.currentHp);
              }
            }
            
            for (let i = 0; i < resultWithoutProcessor.finalState.botUnits.length; i++) {
              const unit1 = resultWithoutProcessor.finalState.botUnits[i];
              const unit2 = resultWithMvpProcessor.finalState.botUnits[i];
              if (unit1 && unit2) {
                expect(unit2.alive).toBe(unit1.alive);
                expect(unit2.currentHp).toBe(unit1.currentHp);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 50 } // Reduced runs since battles can be slow
      );
    });
  });

  describe('Property-Based Tests: State Conversion', () => {
    /**
     * **Feature: mechanics-optimization, Property 6: State preservation in conversion**
     * **Validates: Requirements 5.4**
     * 
     * For any game state converted to core state and back, all unit properties
     * (HP, position, alive, facing, resolve) SHALL be preserved.
     */
    it('Property 6: State preservation in conversion - round trip preserves all unit properties', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fc = require('fast-check') as typeof import('fast-check');
      
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { toCoreBattleState, fromCoreBattleState } = require('./battle.simulator') as {
        toCoreBattleState: (state: BattleStateWithAbilitiesTest) => CoreBattleStateTest;
        fromCoreBattleState: (gameState: BattleStateWithAbilitiesTest, coreState: CoreBattleStateTest) => BattleStateWithAbilitiesTest;
      };
      
      // Type definitions for the test
      interface BattleUnitTest {
        id: string;
        name: string;
        role: string;
        cost: number;
        stats: {
          hp: number;
          atk: number;
          atkCount: number;
          armor: number;
          speed: number;
          initiative: number;
          dodge: number;
        };
        range: number;
        abilities: string[];
        position: { x: number; y: number };
        currentHp: number;
        maxHp: number;
        team: 'player' | 'bot';
        alive: boolean;
        instanceId: string;
        abilityCooldowns: Record<string, number>;
        statusEffects: unknown[];
        isStunned: boolean;
        hasTaunt: boolean;
        facing: 'N' | 'S' | 'E' | 'W';
        resolve: number;
        maxResolve: number;
        riposteCharges: number;
        ammunition: number | undefined;
        maxAmmunition: number | undefined;
        tags: string[];
        armorShred: number;
        isEngaged: boolean;
        engagedBy: string[];
        chargeMomentum: number;
        isInOverwatch: boolean;
        isInPhalanx: boolean;
        isRouting: boolean;
        hasCrumbled: boolean;
        faction: string;
      }
      
      interface BattleStateWithAbilitiesTest {
        units: BattleUnitTest[];
        currentRound: number;
        events: unknown[];
        occupiedPositions: Set<string>;
        seed: number;
      }
      
      interface CoreBattleStateTest {
        units: unknown[];
        round: number;
        events: unknown[];
      }
      
      // Arbitrary generator for Position
      const arbitraryPosition = fc.record({
        x: fc.integer({ min: 0, max: 7 }),
        y: fc.integer({ min: 0, max: 9 }),
      });
      
      // Arbitrary generator for FacingDirection
      const arbitraryFacing = fc.constantFrom('N' as const, 'S' as const, 'E' as const, 'W' as const);
      
      // Arbitrary generator for UnitStats
      const arbitraryStats = fc.record({
        hp: fc.integer({ min: 1, max: 500 }),
        atk: fc.integer({ min: 1, max: 100 }),
        atkCount: fc.integer({ min: 1, max: 5 }),
        armor: fc.integer({ min: 0, max: 50 }),
        speed: fc.integer({ min: 1, max: 10 }),
        initiative: fc.integer({ min: 1, max: 20 }),
        dodge: fc.integer({ min: 0, max: 50 }),
      });
      
      // Arbitrary generator for BattleUnitWithAbilities
      const arbitraryUnit = (team: 'player' | 'bot', baseIndex: number) => fc.record({
        id: fc.constant(`unit_${baseIndex}`),
        name: fc.constant(`Test Unit ${baseIndex}`),
        role: fc.constantFrom('tank', 'melee_dps', 'ranged_dps', 'mage', 'support'),
        cost: fc.integer({ min: 3, max: 8 }),
        stats: arbitraryStats,
        range: fc.integer({ min: 1, max: 5 }),
        abilities: fc.constant([] as string[]),
        position: arbitraryPosition,
        currentHp: fc.integer({ min: 1, max: 500 }),
        maxHp: fc.integer({ min: 1, max: 500 }),
        team: fc.constant(team),
        alive: fc.boolean(),
        instanceId: fc.constant(`${team}_unit_${baseIndex}`),
        // Ability state
        abilityCooldowns: fc.constant({} as Record<string, number>),
        statusEffects: fc.constant([] as unknown[]),
        isStunned: fc.boolean(),
        hasTaunt: fc.boolean(),
        // Core 2.0 Mechanics fields
        facing: arbitraryFacing,
        resolve: fc.integer({ min: 0, max: 100 }),
        maxResolve: fc.constant(100),
        riposteCharges: fc.integer({ min: 0, max: 5 }),
        ammunition: fc.option(fc.integer({ min: 0, max: 20 }), { nil: undefined }),
        maxAmmunition: fc.option(fc.integer({ min: 0, max: 20 }), { nil: undefined }),
        tags: fc.constant([] as string[]),
        armorShred: fc.integer({ min: 0, max: 20 }),
        isEngaged: fc.boolean(),
        engagedBy: fc.constant([] as string[]),
        chargeMomentum: fc.integer({ min: 0, max: 100 }),
        isInOverwatch: fc.boolean(),
        isInPhalanx: fc.boolean(),
        isRouting: fc.boolean(),
        hasCrumbled: fc.boolean(),
        faction: fc.constantFrom('human', 'undead'),
      }).map((unit): BattleUnitTest => ({
        ...unit,
        // Ensure currentHp <= maxHp
        currentHp: Math.min(unit.currentHp, unit.maxHp),
      }));
      
      // Arbitrary generator for BattleStateWithAbilities
      const arbitraryBattleState = fc.tuple(
        fc.array(arbitraryUnit('player', 0), { minLength: 1, maxLength: 3 }),
        fc.array(arbitraryUnit('bot', 0), { minLength: 1, maxLength: 3 }),
        fc.integer({ min: 1, max: 100 }),
      ).map(([playerUnits, botUnits, round]): BattleStateWithAbilitiesTest => {
        // Assign unique instanceIds
        const units: BattleUnitTest[] = [
          ...playerUnits.map((u: BattleUnitTest, i: number) => ({ ...u, instanceId: `player_unit_${i}` })),
          ...botUnits.map((u: BattleUnitTest, i: number) => ({ ...u, instanceId: `bot_unit_${i}` })),
        ];
        
        // Create occupied positions set
        const occupiedPositions = new Set<string>();
        units.forEach((u: BattleUnitTest) => {
          if (u.alive) {
            occupiedPositions.add(`${u.position.x},${u.position.y}`);
          }
        });
        
        return {
          units,
          currentRound: round,
          events: [],
          occupiedPositions,
          seed: 12345,
        };
      });
      
      // Property: Round-trip conversion preserves critical unit properties
      fc.assert(
        fc.property(arbitraryBattleState, (gameState: BattleStateWithAbilitiesTest) => {
          // Convert to core state
          const coreState = toCoreBattleState(gameState);
          
          // Convert back to game state
          const roundTrippedState = fromCoreBattleState(gameState, coreState);
          
          // Verify all units are preserved
          expect(roundTrippedState.units.length).toBe(gameState.units.length);
          
          // Verify each unit's critical properties are preserved
          for (let i = 0; i < gameState.units.length; i++) {
            const original = gameState.units[i];
            if (!original) continue; // Skip if original is undefined
            
            const roundTripped = roundTrippedState.units.find(
              (u: BattleUnitTest) => u.instanceId === original.instanceId
            );
            
            expect(roundTripped).toBeDefined();
            if (!roundTripped) continue;
            
            // Property 6: HP preservation
            expect(roundTripped.currentHp).toBe(original.currentHp);
            expect(roundTripped.maxHp).toBe(original.maxHp);
            
            // Property 6: Position preservation
            expect(roundTripped.position.x).toBe(original.position.x);
            expect(roundTripped.position.y).toBe(original.position.y);
            
            // Property 6: Alive status preservation
            expect(roundTripped.alive).toBe(original.alive);
            
            // Property 6: Facing preservation
            expect(roundTripped.facing).toBe(original.facing);
            
            // Property 6: Resolve preservation
            expect(roundTripped.resolve).toBe(original.resolve);
            
            // Additional mechanics fields preservation
            expect(roundTripped.riposteCharges).toBe(original.riposteCharges);
            expect(roundTripped.armorShred).toBe(original.armorShred);
            expect(roundTripped.isEngaged).toBe(original.isEngaged);
            expect(roundTripped.chargeMomentum).toBe(original.chargeMomentum);
            expect(roundTripped.isInPhalanx).toBe(original.isInPhalanx);
            
            // Game-specific fields preservation
            expect(roundTripped.abilityCooldowns).toEqual(original.abilityCooldowns);
            expect(roundTripped.statusEffects).toEqual(original.statusEffects);
            expect(roundTripped.isStunned).toBe(original.isStunned);
            expect(roundTripped.hasTaunt).toBe(original.hasTaunt);
          }
          
          // Verify round is preserved
          expect(roundTrippedState.currentRound).toBe(gameState.currentRound);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});