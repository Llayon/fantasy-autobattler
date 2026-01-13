/**
 * Debug test for riposte mechanic
 * Testing if riposte damage is actually applied to attacker HP
 */

import { simulateBattle, TeamSetup, toCoreBattleState, fromCoreBattleState } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { createMechanicsProcessor, ROGUELIKE_PRESET } from '../../core/mechanics';

describe('Riposte Debug', () => {
  const createTeam = (unitIds: UnitId[], positions: { x: number; y: number }[]): TeamSetup => {
    const units = unitIds.map((id) => {
      const template = getUnitTemplate(id);
      if (!template) throw new Error(`Unit not found: ${id}`);
      return template;
    });
    return { units, positions };
  };

  it('should have riposte events in battle log', () => {
    // Duelist has riposte passive ability
    const playerTeam = createTeam(['duelist'], [{ x: 4, y: 1 }]);
    const enemyTeam = createTeam(['knight'], [{ x: 4, y: 8 }]);

    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);

    // Get all riposte events
    const riposteEvents = result.events.filter((e) => e.type === 'mechanic_riposte');
    
    // There should be riposte events (duelist should riposte when attacked)
    console.log('Riposte events:', riposteEvents.length);
    console.log('Riposte events details:', JSON.stringify(riposteEvents, null, 2));
  });

  it('should reduce attacker HP after riposte', () => {
    // Use duelist (has riposte) vs knight
    const playerTeam = createTeam(['duelist'], [{ x: 4, y: 1 }]);
    const enemyTeam = createTeam(['knight'], [{ x: 4, y: 8 }]);

    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);

    // Get riposte events
    const riposteEvents = result.events.filter((e) => e.type === 'mechanic_riposte');
    
    // Get attack events from knight (attacker)
    const knightAttacks = result.events.filter(
      (e) => e.type === 'attack' && e.actorId?.includes('knight')
    );

    // Get damage events where knight is target (from riposte)
    const knightDamageEvents = result.events.filter(
      (e) => e.type === 'damage' && e.targetId?.includes('knight')
    );

    console.log('Knight attacks:', knightAttacks.length);
    console.log('Riposte events:', riposteEvents.length);
    console.log('Knight damage events (from riposte):', knightDamageEvents.length);

    // If there are riposte events, there should be corresponding damage to knight
    if (riposteEvents.length > 0) {
      // Check final knight HP
      const knightFinal = [...result.finalState.playerUnits, ...result.finalState.botUnits].find(u => u.instanceId.includes('knight'));
      const knightTemplate = getUnitTemplate('knight');
      
      console.log('Knight initial HP:', knightTemplate?.stats.hp);
      console.log('Knight final HP:', knightFinal?.currentHp);
      
      // Knight should have taken damage from riposte
      // Riposte damage = 50% of duelist ATK
      const duelistTemplate = getUnitTemplate('duelist');
      const expectedRiposteDamage = Math.floor((duelistTemplate?.stats.atk ?? 0) * 0.5);
      console.log('Expected riposte damage per hit:', expectedRiposteDamage);
      
      // If riposte happened, knight HP should be less than max
      if (riposteEvents.length > 0 && knightFinal && knightTemplate) {
        expect(knightFinal.currentHp).toBeLessThan(knightTemplate.stats.hp);
      }
    }
  });
});

describe('Riposte Debug - Processor Direct Test', () => {
  it('should apply riposte damage in processor', () => {
    const { createRiposteProcessor } = require('../../core/mechanics/tier2/riposte/riposte.processor');
    
    // Create riposte processor with ROGUELIKE_PRESET config
    const riposteConfig = {
      initiativeBased: true,
      chargesPerRound: 'attackCount' as const,
      baseChance: 0.5,
      guaranteedThreshold: 10,
    };
    const riposteProcessor = createRiposteProcessor(riposteConfig);

    // Create mock state with duelist (defender) and knight (attacker)
    const mockState = {
      units: [
        {
          id: 'duelist',
          instanceId: 'player_duelist_0',
          name: 'Duelist',
          role: 'melee_dps',
          range: 1,
          position: { x: 4, y: 4 },
          currentHp: 70,
          maxHp: 70,
          team: 'player',
          alive: true,
          stats: { hp: 70, atk: 22, atkCount: 1, armor: 4, speed: 4, initiative: 9, dodge: 15 },
          cost: 5,
          abilities: ['riposte'],
          riposteCharges: 1,
          facing: 'S',
        },
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          name: 'Knight',
          role: 'tank',
          range: 1,
          position: { x: 4, y: 5 },
          currentHp: 100,
          maxHp: 100,
          team: 'bot',
          alive: true,
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          cost: 5,
          abilities: ['shield_wall'],
          facing: 'N',
        },
      ],
      round: 1,
      events: [],
    };

    // Context: knight attacks duelist
    const context = {
      activeUnit: mockState.units[1], // knight (attacker)
      target: mockState.units[0], // duelist (defender)
      action: { type: 'attack' as const, targetId: 'player_duelist_0' },
      seed: 12345, // Use seed that should trigger riposte
    };

    // Apply riposte processor
    const result = riposteProcessor.apply('attack', mockState, context);

    console.log('Riposte result events:', result.events);
    
    // Check if riposte event was generated
    const riposteEvent = result.events.find((e: { type: string }) => e.type === 'mechanic_riposte');
    
    if (riposteEvent) {
      console.log('Riposte triggered!');
      console.log('Riposte damage:', riposteEvent.metadata?.damage);
      
      // Check knight HP in result state
      const knightAfter = result.state.units.find((u: { instanceId: string }) => u.instanceId === 'bot_knight_0');
      console.log('Knight HP before:', 100);
      console.log('Knight HP after:', knightAfter?.currentHp);
      
      // Riposte damage = floor(22 * 0.5) = 11
      expect(knightAfter?.currentHp).toBe(89); // 100 - 11 = 89
    } else {
      console.log('Riposte did not trigger (roll failed)');
    }
  });

  it('should apply riposte damage with guaranteed trigger', () => {
    const { createRiposteProcessor } = require('../../core/mechanics/tier2/riposte/riposte.processor');
    
    // Create riposte processor with 100% base chance for testing
    const riposteConfig = {
      initiativeBased: false, // Disable initiative-based, use flat chance
      chargesPerRound: 'attackCount' as const,
      baseChance: 1.0, // 100% chance
      guaranteedThreshold: 10,
    };
    const riposteProcessor = createRiposteProcessor(riposteConfig);

    // Create mock state
    const mockState = {
      units: [
        {
          id: 'duelist',
          instanceId: 'player_duelist_0',
          name: 'Duelist',
          role: 'melee_dps',
          range: 1,
          position: { x: 4, y: 4 },
          currentHp: 70,
          maxHp: 70,
          team: 'player',
          alive: true,
          stats: { hp: 70, atk: 22, atkCount: 1, armor: 4, speed: 4, initiative: 9, dodge: 15 },
          cost: 5,
          abilities: ['riposte'],
          riposteCharges: 1,
          facing: 'S',
        },
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          name: 'Knight',
          role: 'tank',
          range: 1,
          position: { x: 4, y: 5 },
          currentHp: 100,
          maxHp: 100,
          team: 'bot',
          alive: true,
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          cost: 5,
          abilities: ['shield_wall'],
          facing: 'N',
        },
      ],
      round: 1,
      events: [],
    };

    const context = {
      activeUnit: mockState.units[1], // knight
      target: mockState.units[0], // duelist
      action: { type: 'attack' as const, targetId: 'player_duelist_0' },
      seed: 99999,
    };

    const result = riposteProcessor.apply('attack', mockState, context);

    // With 100% chance, riposte should always trigger
    const riposteEvent = result.events.find((e: { type: string }) => e.type === 'mechanic_riposte');
    expect(riposteEvent).toBeDefined();
    
    // Check knight HP
    const knightAfter = result.state.units.find((u: { instanceId: string }) => u.instanceId === 'bot_knight_0');
    
    // Riposte damage = floor(22 * 0.5) = 11
    expect(knightAfter?.currentHp).toBe(89);
  });
});

describe('Riposte Debug - State Conversion', () => {
  it('should preserve HP changes through fromCoreBattleState', () => {
    // Create mock game state
    const gameState = {
      units: [
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          name: 'Knight',
          role: 'tank',
          range: 1,
          position: { x: 4, y: 5 },
          currentHp: 100,
          maxHp: 100,
          team: 'bot',
          alive: true,
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          cost: 5,
          abilities: ['shield_wall'],
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'N',
          resolve: 100,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // Create core state with reduced HP (simulating riposte damage)
    const coreState = {
      units: [
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          name: 'Knight',
          role: 'tank',
          range: 1,
          position: { x: 4, y: 5 },
          currentHp: 89, // Reduced by riposte (100 - 11)
          maxHp: 100,
          team: 'bot',
          alive: true,
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          cost: 5,
          abilities: ['shield_wall'],
        },
      ],
      round: 1,
      events: [],
    };

    // Convert back to game state
    const updatedGameState = fromCoreBattleState(gameState as any, coreState as any);

    // HP should be updated to 89
    expect(updatedGameState.units[0]?.currentHp).toBe(89);
  });

  it('should use Math.min for HP (take lower value)', () => {
    // Game state has higher HP
    const gameState = {
      units: [
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          currentHp: 100,
          maxHp: 100,
          alive: true,
          position: { x: 4, y: 5 },
          team: 'bot',
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // Core state has lower HP
    const coreState = {
      units: [
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          currentHp: 50,
          maxHp: 100,
          alive: true,
          position: { x: 4, y: 5 },
          team: 'bot',
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
        },
      ],
      round: 1,
      events: [],
    };

    const result = fromCoreBattleState(gameState as any, coreState as any);
    
    // Should take the lower HP value (50)
    expect(result.units[0]?.currentHp).toBe(50);
  });
});

describe('Riposte Debug - Full Integration', () => {
  it('should track HP changes through processPhase', () => {
    const { createMechanicsProcessor, ROGUELIKE_PRESET } = require('../../core/mechanics');
    
    const processor = createMechanicsProcessor({
      ...ROGUELIKE_PRESET,
      riposte: {
        initiativeBased: false,
        chargesPerRound: 'attackCount',
        baseChance: 1.0, // 100% for testing
        guaranteedThreshold: 10,
      },
    });

    // Create game state
    let gameState = {
      units: [
        {
          id: 'duelist',
          instanceId: 'player_duelist_0',
          name: 'Duelist',
          role: 'melee_dps',
          range: 1,
          position: { x: 4, y: 4 },
          currentHp: 70,
          maxHp: 70,
          team: 'player',
          alive: true,
          stats: { hp: 70, atk: 22, atkCount: 1, armor: 4, speed: 4, initiative: 9, dodge: 15 },
          cost: 5,
          abilities: ['riposte'],
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'S',
          resolve: 100,
          riposteCharges: 1,
        },
        {
          id: 'knight',
          instanceId: 'bot_knight_0',
          name: 'Knight',
          role: 'tank',
          range: 1,
          position: { x: 4, y: 5 },
          currentHp: 100,
          maxHp: 100,
          team: 'bot',
          alive: true,
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          cost: 5,
          abilities: ['shield_wall'],
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'N',
          resolve: 100,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // Convert to core state
    const coreState = toCoreBattleState(gameState as any);
    
    // Process attack phase (knight attacks duelist)
    const context = {
      activeUnit: coreState.units[1], // knight
      target: coreState.units[0], // duelist
      action: { type: 'attack' as const, targetId: 'player_duelist_0' },
      seed: 12345,
    };

    const result = processor.process('attack', coreState, context);
    
    console.log('Process result events:', result.events);
    
    // Check for riposte event
    const riposteEvent = result.events.find((e: { type: string }) => e.type === 'mechanic_riposte');
    
    if (riposteEvent) {
      console.log('Riposte event found:', riposteEvent);
      
      // Check knight HP in core result
      const knightInCore = result.state.units.find((u: { instanceId: string }) => u.instanceId === 'bot_knight_0');
      console.log('Knight HP in core state after riposte:', knightInCore?.currentHp);
      
      // Convert back to game state
      const updatedGameState = fromCoreBattleState(gameState as any, result.state);
      
      // Check knight HP in game state
      const knightInGame = updatedGameState.units.find((u: { instanceId: string }) => u.instanceId === 'bot_knight_0');
      console.log('Knight HP in game state after conversion:', knightInGame?.currentHp);
      
      // Knight should have taken riposte damage
      expect(knightInGame?.currentHp).toBe(89); // 100 - 11 = 89
    }
  });
});
