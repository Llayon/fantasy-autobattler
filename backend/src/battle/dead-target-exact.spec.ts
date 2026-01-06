/**
 * Test to reproduce the exact bug from battle_log.json
 * where player_crossbowman_1 uses piercing_shot on already dead bot_priest_3
 */

import { simulateBattle, TeamSetup } from './battle.simulator';
import { BattleEvent } from '../core/types/event.types';
import { UNIT_TEMPLATES } from '../game/units/unit.data';

describe('Dead target bug - exact reproduction', () => {
  it('should not allow attacks or abilities on dead units', () => {
    // Exact team setup from battle_log.json
    const playerTeam: TeamSetup = {
      units: [
        UNIT_TEMPLATES.guardian,
        UNIT_TEMPLATES.crossbowman,
        UNIT_TEMPLATES.archer,
        UNIT_TEMPLATES.mage,
        UNIT_TEMPLATES.priest,
        UNIT_TEMPLATES.knight,
      ],
      positions: [
        { x: 2, y: 1 },
        { x: 2, y: 0 },
        { x: 7, y: 0 },
        { x: 3, y: 0 },
        { x: 1, y: 0 },
        { x: 3, y: 1 },
      ],
    };
    
    const botTeam: TeamSetup = {
      units: [
        UNIT_TEMPLATES.knight,
        UNIT_TEMPLATES.rogue,
        UNIT_TEMPLATES.hunter,
        UNIT_TEMPLATES.priest,
        UNIT_TEMPLATES.assassin,
        UNIT_TEMPLATES.enchanter,
      ],
      positions: [
        { x: 0, y: 9 },
        { x: 1, y: 9 },
        { x: 2, y: 9 },
        { x: 0, y: 8 },
        { x: 1, y: 8 },
        { x: 2, y: 8 },
      ],
    };
    
    // Use the exact seed from the battle
    const result = simulateBattle(playerTeam, botTeam, 1409954818);
    
    // Find all attack/ability events that target dead units
    const deadUnitIds = new Set<string>();
    const attacksOnDeadUnits: BattleEvent[] = [];
    const actionsFromDeadUnits: BattleEvent[] = [];
    
    for (const event of result.events) {
      // Track when units die
      if (event.type === 'death' && event.killedUnits) {
        for (const unitId of event.killedUnits) {
          deadUnitIds.add(unitId);
        }
      }
      
      // Check if attack/ability targets a dead unit
      if ((event.type === 'attack' || event.type === 'ability') && event.targetId) {
        if (deadUnitIds.has(event.targetId)) {
          attacksOnDeadUnits.push(event);
        }
      }
      
      // Check if a dead unit is performing an action
      if ((event.type === 'attack' || event.type === 'ability' || event.type === 'move') && event.actorId) {
        if (deadUnitIds.has(event.actorId)) {
          actionsFromDeadUnits.push(event);
        }
      }
    }
    
    // Count duplicate deaths (each unit should die only once)
    const deathCounts = new Map<string, number>();
    for (const event of result.events) {
      if (event.type === 'death' && event.killedUnits) {
        for (const unitId of event.killedUnits) {
          deathCounts.set(unitId, (deathCounts.get(unitId) || 0) + 1);
        }
      }
    }
    
    const duplicateDeaths: string[] = [];
    for (const [id, count] of deathCounts) {
      if (count > 1) {
        duplicateDeaths.push(`${id} died ${count} times`);
      }
    }
    
    // Assertions
    expect(attacksOnDeadUnits).toHaveLength(0);
    expect(actionsFromDeadUnits).toHaveLength(0);
    expect(duplicateDeaths).toHaveLength(0);
  });
  
  it('should not have duplicate death events for the same unit', () => {
    // Test with multiple seeds to ensure robustness
    const seeds = [1409954818, 12345, 67890, 111111, 999999];
    
    const playerTeam: TeamSetup = {
      units: [
        UNIT_TEMPLATES.guardian,
        UNIT_TEMPLATES.crossbowman,
        UNIT_TEMPLATES.archer,
        UNIT_TEMPLATES.mage,
        UNIT_TEMPLATES.priest,
        UNIT_TEMPLATES.knight,
      ],
      positions: [
        { x: 2, y: 1 },
        { x: 2, y: 0 },
        { x: 7, y: 0 },
        { x: 3, y: 0 },
        { x: 1, y: 0 },
        { x: 3, y: 1 },
      ],
    };
    
    const botTeam: TeamSetup = {
      units: [
        UNIT_TEMPLATES.knight,
        UNIT_TEMPLATES.rogue,
        UNIT_TEMPLATES.hunter,
        UNIT_TEMPLATES.priest,
        UNIT_TEMPLATES.assassin,
        UNIT_TEMPLATES.enchanter,
      ],
      positions: [
        { x: 0, y: 9 },
        { x: 1, y: 9 },
        { x: 2, y: 9 },
        { x: 0, y: 8 },
        { x: 1, y: 8 },
        { x: 2, y: 8 },
      ],
    };
    
    for (const seed of seeds) {
      const result = simulateBattle(playerTeam, botTeam, seed);
      
      const deathCounts = new Map<string, number>();
      for (const event of result.events) {
        if (event.type === 'death' && event.killedUnits) {
          for (const unitId of event.killedUnits) {
            deathCounts.set(unitId, (deathCounts.get(unitId) || 0) + 1);
          }
        }
      }
      
      for (const [, count] of deathCounts) {
        expect(count).toBe(1);
      }
    }
  });
});
