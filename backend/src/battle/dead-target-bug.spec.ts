/**
 * Test to reproduce the bug where units attack dead targets.
 */

import { simulateBattle, TeamSetup } from './battle.simulator';
import { BattleEvent } from '../core/types/event.types';
import { UNIT_TEMPLATES } from '../game/units/unit.data';
import { createMechanicsProcessor, ROGUELIKE_PRESET, TACTICAL_PRESET } from '../core/mechanics';

describe('Dead target bug', () => {
  it('should not attack dead units in simple scenario', () => {
    const playerTeam: TeamSetup = {
      units: [UNIT_TEMPLATES.mage, UNIT_TEMPLATES.crossbowman],
      positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    };
    
    const botTeam: TeamSetup = {
      units: [UNIT_TEMPLATES.priest],
      positions: [{ x: 0, y: 9 }],
    };
    
    const result = simulateBattle(playerTeam, botTeam, 12345);
    
    const deadUnitIds = new Set<string>();
    const attacksOnDeadUnits: BattleEvent[] = [];
    
    for (const event of result.events) {
      if (event.type === 'death' && event.killedUnits) {
        for (const unitId of event.killedUnits) {
          deadUnitIds.add(unitId);
        }
      }
      
      if ((event.type === 'attack' || event.type === 'ability') && event.targetId) {
        if (deadUnitIds.has(event.targetId)) {
          attacksOnDeadUnits.push(event);
        }
      }
    }
    
    expect(attacksOnDeadUnits).toHaveLength(0);
  });

  it('should not attack dead units with TACTICAL_PRESET mechanics', () => {
    const playerTeam: TeamSetup = {
      units: [UNIT_TEMPLATES.mage, UNIT_TEMPLATES.crossbowman, UNIT_TEMPLATES.archer],
      positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    };
    
    const botTeam: TeamSetup = {
      units: [UNIT_TEMPLATES.priest],
      positions: [{ x: 0, y: 9 }],
    };
    
    const processor = createMechanicsProcessor(TACTICAL_PRESET);
    const result = simulateBattle(playerTeam, botTeam, 12345, processor);
    
    const deadUnitIds = new Set<string>();
    const attacksOnDeadUnits: BattleEvent[] = [];
    
    for (const event of result.events) {
      if (event.type === 'death' && event.killedUnits) {
        for (const unitId of event.killedUnits) {
          deadUnitIds.add(unitId);
        }
      }
      
      if ((event.type === 'attack' || event.type === 'ability') && event.targetId) {
        if (deadUnitIds.has(event.targetId)) {
          attacksOnDeadUnits.push(event);
        }
      }
    }
    
    if (attacksOnDeadUnits.length > 0) {
      process.stdout.write('TACTICAL: Attacks on dead units:\n');
      for (const event of attacksOnDeadUnits) {
        process.stdout.write('  Round ' + event.round + ': ' + event.actorId + ' -> ' + event.targetId + '\n');
      }
    }
    
    expect(attacksOnDeadUnits).toHaveLength(0);
  });

  it('should not attack dead units with ROGUELIKE_PRESET mechanics', () => {
    const playerTeam: TeamSetup = {
      units: [UNIT_TEMPLATES.mage, UNIT_TEMPLATES.crossbowman, UNIT_TEMPLATES.archer],
      positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    };
    
    const botTeam: TeamSetup = {
      units: [UNIT_TEMPLATES.priest],
      positions: [{ x: 0, y: 9 }],
    };
    
    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    const result = simulateBattle(playerTeam, botTeam, 12345, processor);
    
    const deadUnitIds = new Set<string>();
    const attacksOnDeadUnits: BattleEvent[] = [];
    
    for (const event of result.events) {
      if (event.type === 'death' && event.killedUnits) {
        for (const unitId of event.killedUnits) {
          deadUnitIds.add(unitId);
        }
      }
      
      if ((event.type === 'attack' || event.type === 'ability') && event.targetId) {
        if (deadUnitIds.has(event.targetId)) {
          attacksOnDeadUnits.push(event);
        }
      }
    }
    
    if (attacksOnDeadUnits.length > 0) {
      process.stdout.write('ROGUELIKE: Attacks on dead units:\n');
      for (const event of attacksOnDeadUnits) {
        process.stdout.write('  Round ' + event.round + ': ' + event.actorId + ' -> ' + event.targetId + '\n');
      }
    }
    
    expect(attacksOnDeadUnits).toHaveLength(0);
  });
});
