/**
 * Debug test for ammunition mechanic
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { createMechanicsProcessor, ROGUELIKE_PRESET } from '../../core/mechanics';

describe('Ammunition Debug', () => {
  const createTeam = (unitIds: UnitId[], positions: { x: number; y: number }[]): TeamSetup => {
    const units = unitIds.map((id) => {
      const template = getUnitTemplate(id);
      if (!template) throw new Error(`Unit not found: ${id}`);
      return template;
    });
    return { units, positions };
  };

  it('should have tags in archer template', () => {
    // Check archer template
    const archerTemplate = getUnitTemplate('archer');
    expect(archerTemplate).toBeDefined();
    expect(archerTemplate?.tags).toContain('ranged');
    expect(archerTemplate?.ammo).toBe(8);
    expect(archerTemplate?.range).toBe(4);
  });

  it('should track ammo consumption in events', () => {
    const playerTeam = createTeam(['archer'], [{ x: 4, y: 1 }]);
    const enemyTeam = createTeam(['knight'], [{ x: 4, y: 8 }]);

    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);

    // Get all ammunition events
    const ammoEvents = result.events.filter((e) => e.type === 'mechanic_ammunition');
    
    // Get all attack events from archer
    const archerAttacks = result.events.filter(
      (e) => e.type === 'attack' && e.actorId?.includes('archer')
    );

    // There should be archer attacks
    expect(archerAttacks.length).toBeGreaterThan(0);
    
    // There should be ammo events
    expect(ammoEvents.length).toBeGreaterThan(0);
  });

  it('should show ammo values in consumed events', () => {
    const playerTeam = createTeam(['archer'], [{ x: 4, y: 1 }]);
    const enemyTeam = createTeam(['knight'], [{ x: 4, y: 8 }]);

    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);

    // Get consumed events
    const consumedEvents = result.events.filter(
      (e) => e.type === 'mechanic_ammunition' && e.metadata?.['action'] === 'consumed'
    );

    // Check ammo values
    const ammoValues = consumedEvents.map((e) => ({
      round: e.round,
      actorId: e.actorId,
      ammoRemaining: e.metadata?.['ammoRemaining'] as number,
      ammoConsumed: e.metadata?.['ammoConsumed'] as number,
    }));

    // Archer has ammo: 8, so first attack should show 7, second 6, etc.
    expect(ammoValues.length).toBeGreaterThanOrEqual(2);
    
    // Check that ammo decreases
    // The bug is that ammunition is not persisted between rounds
    // First attack: 8 - 1 = 7 (correct)
    // Second attack: should be 7 - 1 = 6, but shows 7 (bug)
    const first = ammoValues[0];
    const second = ammoValues[1];
    
    expect(first?.ammoRemaining).toBe(7);
    expect(first?.ammoConsumed).toBe(1);
    
    // This assertion will fail due to the bug
    expect(second?.ammoRemaining).toBe(6);
    expect(second?.ammoConsumed).toBe(1);
  });
});


describe('Ammunition Debug - State Conversion', () => {
  it('should preserve tags in toCoreBattleState', () => {
    // Import toCoreBattleState
    const { toCoreBattleState } = require('../../battle/battle.simulator');
    
    // Create a mock game state with archer
    const mockGameState = {
      units: [
        {
          id: 'archer',
          name: 'Archer',
          role: 'ranged_dps',
          cost: 4,
          stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
          range: 4,
          abilities: ['volley'],
          position: { x: 4, y: 1 },
          currentHp: 60,
          maxHp: 60,
          team: 'player',
          alive: true,
          instanceId: 'player_archer_0',
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'S',
          resolve: 40,
          tags: ['ranged', 'light'],
          ammunition: 8,
          maxAmmunition: 8,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // Convert to core state
    const coreState = toCoreBattleState(mockGameState);
    
    // Check that tags are preserved
    const archerInCore = coreState.units[0];
    expect(archerInCore).toBeDefined();
    expect(archerInCore?.tags).toContain('ranged');
    expect(archerInCore?.ammo).toBe(8);
    expect(archerInCore?.range).toBe(4);
  });
});


describe('Ammunition Debug - Processor', () => {
  it('should consume ammo in ammunition processor', () => {
    const { createAmmunitionProcessor } = require('../../core/mechanics/tier3/ammunition/ammunition.processor');
    
    // Create ammunition processor
    const ammoProcessor = createAmmunitionProcessor({
      enabled: true,
      mageCooldowns: true,
      defaultAmmo: 6,
      defaultCooldown: 3,
    });

    // Create a mock state with archer
    const mockState = {
      units: [
        {
          id: 'archer',
          instanceId: 'player_archer_0',
          name: 'Archer',
          role: 'ranged_dps',
          range: 4,
          tags: ['ranged', 'light'],
          ammo: 8,
          maxAmmo: 8,
          position: { x: 4, y: 1 },
          currentHp: 60,
          maxHp: 60,
          team: 'player',
          alive: true,
          stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
          cost: 4,
          abilities: ['volley'],
        },
      ],
      round: 1,
      events: [],
    };

    // Create context
    const context = {
      activeUnit: mockState.units[0],
      target: { id: 'knight', instanceId: 'bot_knight_0' },
      action: { type: 'attack' as const, targetId: 'bot_knight_0' },
      seed: 12345,
    };

    // Apply ammunition processor
    const result = ammoProcessor.apply('attack', mockState, context);

    // Check that ammo was consumed
    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.events).toBeDefined();
    expect(result.events.length).toBeGreaterThan(0);

    // Check that ammo was reduced
    const archerAfter = result.state.units.find((u: { instanceId: string }) => u.instanceId === 'player_archer_0');
    expect(archerAfter).toBeDefined();
    expect(archerAfter?.ammo).toBe(7); // 8 - 1 = 7
  });

  it('should consume ammo twice in sequence', () => {
    const { createAmmunitionProcessor } = require('../../core/mechanics/tier3/ammunition/ammunition.processor');
    
    // Create ammunition processor
    const ammoProcessor = createAmmunitionProcessor({
      enabled: true,
      mageCooldowns: true,
      defaultAmmo: 6,
      defaultCooldown: 3,
    });

    // Create a mock state with archer
    let mockState = {
      units: [
        {
          id: 'archer',
          instanceId: 'player_archer_0',
          name: 'Archer',
          role: 'ranged_dps',
          range: 4,
          tags: ['ranged', 'light'],
          ammo: 8,
          maxAmmo: 8,
          position: { x: 4, y: 1 },
          currentHp: 60,
          maxHp: 60,
          team: 'player',
          alive: true,
          stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
          cost: 4,
          abilities: ['volley'],
        },
      ],
      round: 1,
      events: [],
    };

    // Create context
    const context = {
      activeUnit: mockState.units[0],
      target: { id: 'knight', instanceId: 'bot_knight_0' },
      action: { type: 'attack' as const, targetId: 'bot_knight_0' },
      seed: 12345,
    };

    // First attack
    const result1 = ammoProcessor.apply('attack', mockState, context);
    expect(result1.state.units[0]?.ammo).toBe(7);

    // Update state for second attack
    mockState = result1.state;
    context.activeUnit = mockState.units[0];

    // Second attack
    const result2 = ammoProcessor.apply('attack', mockState, context);
    expect(result2.state.units[0]?.ammo).toBe(6); // 7 - 1 = 6
  });
});


describe('Ammunition Debug - State Conversion Round Trip', () => {
  it('should preserve ammo through toCoreBattleState and fromCoreBattleState', () => {
    const { toCoreBattleState, fromCoreBattleState } = require('../../battle/battle.simulator');
    
    // Create a mock game state with archer
    const mockGameState = {
      units: [
        {
          id: 'archer',
          name: 'Archer',
          role: 'ranged_dps',
          cost: 4,
          stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
          range: 4,
          abilities: ['volley'],
          position: { x: 4, y: 1 },
          currentHp: 60,
          maxHp: 60,
          team: 'player',
          alive: true,
          instanceId: 'player_archer_0',
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'S',
          resolve: 40,
          tags: ['ranged', 'light'],
          ammunition: 8,
          maxAmmunition: 8,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // Convert to core state
    const coreState = toCoreBattleState(mockGameState);
    expect(coreState.units[0]?.ammo).toBe(8);

    // Modify ammo in core state (simulate ammunition processor)
    const modifiedCoreState = {
      ...coreState,
      units: coreState.units.map((u: { ammo?: number }) => ({ ...u, ammo: 7 })),
    };

    // Convert back to game state
    const updatedGameState = fromCoreBattleState(mockGameState, modifiedCoreState);
    
    // Check that ammunition was updated
    expect(updatedGameState.units[0]?.ammunition).toBe(7);
  });

  it('should preserve ammo through multiple round trips', () => {
    const { toCoreBattleState, fromCoreBattleState } = require('../../battle/battle.simulator');
    
    // Create a mock game state with archer
    let gameState = {
      units: [
        {
          id: 'archer',
          name: 'Archer',
          role: 'ranged_dps',
          cost: 4,
          stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
          range: 4,
          abilities: ['volley'],
          position: { x: 4, y: 1 },
          currentHp: 60,
          maxHp: 60,
          team: 'player',
          alive: true,
          instanceId: 'player_archer_0',
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'S',
          resolve: 40,
          tags: ['ranged', 'light'],
          ammunition: 8,
          maxAmmunition: 8,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // First round trip: 8 -> 7
    let coreState = toCoreBattleState(gameState);
    expect(coreState.units[0]?.ammo).toBe(8);
    
    let modifiedCoreState = {
      ...coreState,
      units: coreState.units.map((u: { ammo?: number }) => ({ ...u, ammo: (u.ammo ?? 8) - 1 })),
    };
    
    gameState = fromCoreBattleState(gameState, modifiedCoreState);
    expect(gameState.units[0]?.ammunition).toBe(7);

    // Second round trip: 7 -> 6
    coreState = toCoreBattleState(gameState);
    expect(coreState.units[0]?.ammo).toBe(7); // THIS IS THE KEY TEST
    
    modifiedCoreState = {
      ...coreState,
      units: coreState.units.map((u: { ammo?: number }) => ({ ...u, ammo: (u.ammo ?? 7) - 1 })),
    };
    
    gameState = fromCoreBattleState(gameState, modifiedCoreState);
    expect(gameState.units[0]?.ammunition).toBe(6);
  });
});


describe('Ammunition Debug - processPhase Integration', () => {
  it('should update ammunition through processPhase', () => {
    const { toCoreBattleState, fromCoreBattleState } = require('../../battle/battle.simulator');
    const { createMechanicsProcessor, ROGUELIKE_PRESET } = require('../../core/mechanics');
    
    // Create processor
    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    
    // Create a mock game state with archer
    let gameState = {
      units: [
        {
          id: 'archer',
          name: 'Archer',
          role: 'ranged_dps',
          cost: 4,
          stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
          range: 4,
          abilities: ['volley'],
          position: { x: 4, y: 1 },
          currentHp: 60,
          maxHp: 60,
          team: 'player',
          alive: true,
          instanceId: 'player_archer_0',
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'S',
          resolve: 40,
          tags: ['ranged', 'light'],
          ammunition: 8,
          maxAmmunition: 8,
        },
        {
          id: 'knight',
          name: 'Knight',
          role: 'tank',
          cost: 5,
          stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
          range: 1,
          abilities: ['shield_wall'],
          position: { x: 4, y: 8 },
          currentHp: 100,
          maxHp: 100,
          team: 'bot',
          alive: true,
          instanceId: 'bot_knight_0',
          abilityCooldowns: {},
          statusEffects: [],
          isStunned: false,
          hasTaunt: false,
          facing: 'N',
          resolve: 100,
          tags: ['heavy'],
          ammunition: undefined,
          maxAmmunition: undefined,
        },
      ],
      currentRound: 1,
      events: [],
      occupiedPositions: new Set<string>(),
    };

    // Simulate processPhase for attack
    const coreState = toCoreBattleState(gameState);
    
    const context = {
      activeUnit: coreState.units[0], // archer
      target: coreState.units[1], // knight
      action: { type: 'attack' as const, targetId: 'bot_knight_0' },
      seed: 12345,
    };
    
    const result = processor.process('attack', coreState, context);
    
    // Check that ammo was consumed
    const archerInResult = result.state.units.find((u: { instanceId: string }) => u.instanceId === 'player_archer_0');
    expect(archerInResult?.ammo).toBe(7);
    
    // Convert back to game state
    const updatedGameState = fromCoreBattleState(gameState, result.state);
    expect(updatedGameState.units[0]?.ammunition).toBe(7);
    
    // Second attack
    gameState = updatedGameState;
    const coreState2 = toCoreBattleState(gameState);
    
    // Check that ammo is 7 in core state
    const archerInCore2 = coreState2.units.find((u: { instanceId: string }) => u.instanceId === 'player_archer_0');
    expect(archerInCore2?.ammo).toBe(7); // THIS IS THE KEY TEST
    
    const context2 = {
      activeUnit: coreState2.units[0], // archer
      target: coreState2.units[1], // knight
      action: { type: 'attack' as const, targetId: 'bot_knight_0' },
      seed: 12346,
    };
    
    const result2 = processor.process('attack', coreState2, context2);
    
    // Check that ammo was consumed again
    const archerInResult2 = result2.state.units.find((u: { instanceId: string }) => u.instanceId === 'player_archer_0');
    expect(archerInResult2?.ammo).toBe(6);
  });
});


describe('Ammunition Debug - hasMechanicsEnabled', () => {
  it('should have mechanics enabled in ROGUELIKE_PRESET', () => {
    const { createMechanicsProcessor, ROGUELIKE_PRESET } = require('../../core/mechanics');
    
    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    
    // Check that mechanics are enabled
    expect(processor.config.facing).toBe(true);
    expect(processor.config.flanking).toBe(true);
    expect(processor.config.charge).toBeTruthy();
    expect(processor.config.armorShred).toBeTruthy();
    expect(processor.config.resolve).toBeTruthy();
    expect(processor.config.riposte).toBeTruthy();
    expect(processor.config.engagement).toBeTruthy();
    expect(processor.config.ammunition).toBeTruthy();
    
    // hasMechanicsEnabled check from battle.simulator.ts
    const hasMechanicsEnabled = processor && (
      processor.config.facing ||
      processor.config.flanking ||
      processor.config.charge ||
      processor.config.armorShred ||
      processor.config.resolve ||
      processor.config.riposte ||
      processor.config.engagement
    );
    
    expect(hasMechanicsEnabled).toBe(true);
  });
});
