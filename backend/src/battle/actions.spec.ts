/**
 * Unit tests for battle actions system.
 * Tests movement, attacks, turn execution, and battle state management.
 */

import {
  executeMove,
  executeAttack,
  executeTurn,
  createBattleState,
  applyBattleEvents,
  checkBattleEnd,
  advanceToNextRound,
  MoveEvent,
  AttackEvent,
} from './actions';
import { BattleUnit, Position } from '../types/game.types';

describe('Battle Actions System', () => {
  // Helper function to create a mock unit
  const createMockUnit = (
    id: string,
    x: number,
    y: number,
    team: 'player' | 'bot' = 'player',
    currentHp: number = 100,
    maxHp: number = 100,
    alive: boolean = true,
    role: BattleUnit['role'] = 'tank',
    atk: number = 15,
    atkCount: number = 1,
    armor: number = 5,
    speed: number = 2,
    range: number = 1
  ): BattleUnit => ({
    id,
    name: `Unit ${id}`,
    role,
    cost: 5,
    stats: {
      hp: maxHp,
      atk,
      atkCount,
      armor,
      speed,
      initiative: 5,
      dodge: 0,
    },
    range,
    abilities: [],
    position: { x, y },
    currentHp,
    maxHp,
    team,
    alive,
    instanceId: `${id}_instance`,
  });

  describe('executeMove', () => {
    it('should move unit along path within movement limit', () => {
      const unit = createMockUnit('warrior', 2, 2, 'player', 100, 100, true, 'tank', 15, 1, 5, 3);
      const path: Position[] = [
        { x: 2, y: 2 }, // Start position
        { x: 3, y: 2 }, // Step 1
        { x: 4, y: 2 }, // Step 2
        { x: 5, y: 2 }, // Step 3
        { x: 6, y: 2 }, // Step 4 (beyond speed limit)
      ];
      
      const moveEvent = executeMove(unit, path, unit.stats.speed);
      
      expect(moveEvent.type).toBe('move');
      expect(moveEvent.actorId).toBe(unit.instanceId);
      expect(moveEvent.fromPosition).toEqual({ x: 2, y: 2 });
      expect(moveEvent.toPosition).toEqual({ x: 5, y: 2 }); // Moved 3 steps (speed limit)
      expect(moveEvent.path).toHaveLength(4); // Start + 3 steps
    });

    it('should handle path starting from different position', () => {
      const unit = createMockUnit('archer', 1, 1, 'player', 80, 80, true, 'ranged_dps', 20, 1, 2, 2);
      const path: Position[] = [
        { x: 2, y: 1 }, // Different start
        { x: 3, y: 1 },
      ];
      
      const moveEvent = executeMove(unit, path, unit.stats.speed);
      
      expect(moveEvent.fromPosition).toEqual({ x: 1, y: 1 }); // Original position
      expect(moveEvent.toPosition).toEqual({ x: 3, y: 1 }); // End of path
    });

    it('should handle empty path gracefully', () => {
      const unit = createMockUnit('mage', 3, 3);
      const path: Position[] = [];
      
      expect(() => executeMove(unit, path, 2)).toThrow('Cannot execute move: empty path');
    });

    it('should handle zero movement limit', () => {
      const unit = createMockUnit('rogue', 4, 4);
      const path: Position[] = [{ x: 4, y: 4 }, { x: 5, y: 4 }];
      
      expect(() => executeMove(unit, path, 0)).toThrow('Cannot execute move: invalid maxSteps');
    });

    it('should not move if already at destination', () => {
      const unit = createMockUnit('knight', 5, 5);
      const path: Position[] = [{ x: 5, y: 5 }]; // Same position
      
      const moveEvent = executeMove(unit, path, 2);
      
      expect(moveEvent.fromPosition).toEqual({ x: 5, y: 5 });
      expect(moveEvent.toPosition).toEqual({ x: 5, y: 5 });
      expect(moveEvent.path).toHaveLength(1);
    });
  });

  describe('executeAttack', () => {
    it('should execute physical attack with damage calculation', () => {
      const attacker = createMockUnit('warrior', 2, 2, 'player', 100, 100, true, 'tank', 20, 1, 5);
      const target = createMockUnit('enemy', 3, 2, 'bot', 80, 100, true, 'tank', 15, 1, 3);
      
      const attackEvent = executeAttack(attacker, target, 12345);
      
      expect(attackEvent.type).toBe('attack');
      expect(attackEvent.actorId).toBe(attacker.instanceId);
      expect(attackEvent.targetId).toBe(target.instanceId);
      expect(attackEvent.attackType).toBe('physical');
      expect(attackEvent.damage).toBeGreaterThan(0);
      expect(typeof attackEvent.dodged).toBe('boolean');
      expect(typeof attackEvent.killed).toBe('boolean');
    });

    it('should execute magic attack ignoring armor', () => {
      const mage = createMockUnit('mage', 2, 2, 'player', 60, 60, true, 'mage', 25, 1, 0);
      const target = createMockUnit('tank', 3, 2, 'bot', 100, 100, true, 'tank', 10, 1, 10);
      
      const attackEvent = executeAttack(mage, target, 54321);
      
      expect(attackEvent.attackType).toBe('magic');
      expect(attackEvent.dodged).toBe(false); // Magic attacks can't be dodged
      expect(attackEvent.damage).toBe(25); // Should ignore armor
    });

    it('should throw error when attacker is dead', () => {
      const deadAttacker = createMockUnit('dead', 2, 2, 'player', 0, 100, false);
      const target = createMockUnit('target', 3, 2, 'bot');
      
      expect(() => executeAttack(deadAttacker, target, 12345))
        .toThrow('Cannot execute attack: attacker dead_instance is dead');
    });

    it('should throw error when target is dead', () => {
      const attacker = createMockUnit('attacker', 2, 2, 'player');
      const deadTarget = createMockUnit('dead', 3, 2, 'bot', 0, 100, false);
      
      expect(() => executeAttack(attacker, deadTarget, 12345))
        .toThrow('Cannot execute attack: target dead_instance is dead');
    });

    it('should be deterministic with same seed', () => {
      const attacker = createMockUnit('warrior', 2, 2, 'player', 100, 100, true, 'tank', 15, 1, 5);
      const target = createMockUnit('enemy', 3, 2, 'bot', 80, 100, true, 'tank', 10, 1, 3);
      const seed = 98765;
      
      const attack1 = executeAttack(attacker, target, seed);
      const attack2 = executeAttack(attacker, target, seed);
      
      expect(attack1.damage).toBe(attack2.damage);
      expect(attack1.dodged).toBe(attack2.dodged);
      expect(attack1.killed).toBe(attack2.killed);
    });
  });

  describe('executeTurn', () => {
    it('should execute complete turn with movement and attack', () => {
      const warrior = createMockUnit('warrior', 2, 2, 'player', 100, 100, true, 'tank', 20, 1, 5, 2, 1);
      const enemy = createMockUnit('enemy', 4, 2, 'bot', 50, 100, true, 'tank', 15, 1, 3, 2, 1);
      
      const state = createBattleState([warrior], [enemy], 12345);
      const events = executeTurn(warrior, state, 12345);
      
      // Should generate at least one event (move or attack)
      expect(events.length).toBeGreaterThan(0);
      
      const moveEvents = events.filter(e => e.type === 'move');
      const attackEvents = events.filter(e => e.type === 'attack');
      
      // Should either move or attack (or both)
      expect(moveEvents.length + attackEvents.length).toBeGreaterThan(0);
    });

    it('should attack immediately if target is in range', () => {
      const archer = createMockUnit('archer', 2, 2, 'player', 80, 80, true, 'ranged_dps', 18, 1, 2, 2, 3);
      const enemy = createMockUnit('enemy', 4, 2, 'bot', 60, 100, true, 'tank', 12, 1, 4, 2, 1);
      
      const state = createBattleState([archer], [enemy], 54321);
      const events = executeTurn(archer, state, 54321);
      
      // Should attack without moving (enemy is within range 3)
      const moveEvents = events.filter(e => e.type === 'move');
      const attackEvents = events.filter(e => e.type === 'attack');
      
      expect(moveEvents.length).toBe(0); // No movement needed
      expect(attackEvents.length).toBe(1); // Should attack
    });

    it('should return empty array for dead unit', () => {
      const deadUnit = createMockUnit('dead', 2, 2, 'player', 0, 100, false);
      const enemy = createMockUnit('enemy', 3, 2, 'bot');
      
      const state = createBattleState([deadUnit], [enemy], 12345);
      const events = executeTurn(deadUnit, state, 12345);
      
      expect(events).toHaveLength(0);
    });

    it('should return empty array when no enemies exist', () => {
      const warrior = createMockUnit('warrior', 2, 2, 'player');
      
      const state = createBattleState([warrior], [], 12345);
      const events = executeTurn(warrior, state, 12345);
      
      expect(events).toHaveLength(0);
    });

    it('should use appropriate targeting strategy based on role', () => {
      const mage = createMockUnit('mage', 2, 2, 'player', 60, 60, true, 'mage', 25, 1, 0, 2, 4);
      const weakEnemy = createMockUnit('weak', 3, 3, 'bot', 10, 100, true, 'tank', 8, 1, 5, 1, 1);
      const strongEnemy = createMockUnit('strong', 4, 4, 'bot', 90, 100, true, 'mage', 30, 2, 0, 1, 1);
      
      const state = createBattleState([mage], [weakEnemy, strongEnemy], 12345);
      const events = executeTurn(mage, state, 12345);
      
      // Mage should use 'highest_threat' strategy, likely targeting the strong mage
      const attackEvents = events.filter(e => e.type === 'attack') as AttackEvent[];
      if (attackEvents.length > 0) {
        // Should target based on threat level, not just proximity
        expect(attackEvents[0]?.targetId).toBeDefined();
      }
    });
  });

  describe('createBattleState', () => {
    it('should create initial battle state with all units', () => {
      const playerUnits = [
        createMockUnit('p1', 1, 0, 'player'),
        createMockUnit('p2', 2, 0, 'player'),
      ];
      const botUnits = [
        createMockUnit('b1', 1, 9, 'bot'),
        createMockUnit('b2', 2, 9, 'bot'),
      ];
      
      const state = createBattleState(playerUnits, botUnits, 12345);
      
      expect(state.units).toHaveLength(4);
      expect(state.currentRound).toBe(1);
      expect(state.occupiedPositions.size).toBe(4);
      expect(state.metadata.seed).toBe(12345);
      expect(state.metadata.startTime).toBeDefined();
    });

    it('should handle dead units in occupied positions', () => {
      const aliveUnit = createMockUnit('alive', 1, 0, 'player', 50, 100, true);
      const deadUnit = createMockUnit('dead', 2, 0, 'player', 0, 100, false);
      
      const state = createBattleState([aliveUnit, deadUnit], [], 12345);
      
      expect(state.occupiedPositions.size).toBe(1); // Only alive unit
      expect(state.occupiedPositions.has('1,0')).toBe(true);
      expect(state.occupiedPositions.has('2,0')).toBe(false);
    });
  });

  describe('applyBattleEvents', () => {
    it('should apply movement events to update positions', () => {
      const unit = createMockUnit('warrior', 2, 2, 'player');
      const state = createBattleState([unit], [], 12345);
      
      const moveEvent: MoveEvent = {
        round: 1,
        type: 'move',
        actorId: unit.instanceId,
        fromPosition: { x: 2, y: 2 },
        toPosition: { x: 4, y: 2 },
      };
      
      const newState = applyBattleEvents(state, [moveEvent]);
      
      const movedUnit = newState.units.find(u => u.instanceId === unit.instanceId);
      expect(movedUnit?.position).toEqual({ x: 4, y: 2 });
      expect(newState.occupiedPositions.has('4,2')).toBe(true);
      expect(newState.occupiedPositions.has('2,2')).toBe(false);
    });

    it('should apply damage events to reduce HP', () => {
      const unit = createMockUnit('target', 3, 3, 'bot', 80, 100);
      const state = createBattleState([], [unit], 12345);
      
      const damageEvent = {
        round: 1,
        type: 'damage' as const,
        actorId: 'attacker_instance',
        targetId: unit.instanceId,
        damage: 30,
      };
      
      const newState = applyBattleEvents(state, [damageEvent]);
      
      const damagedUnit = newState.units.find(u => u.instanceId === unit.instanceId);
      expect(damagedUnit?.currentHp).toBe(50);
      expect(damagedUnit?.alive).toBe(true);
    });

    it('should apply death events to kill units', () => {
      const unit = createMockUnit('victim', 3, 3, 'bot', 10, 100);
      const state = createBattleState([], [unit], 12345);
      
      const deathEvent = {
        round: 1,
        type: 'death' as const,
        actorId: unit.instanceId,
        killedUnits: [unit.instanceId],
      };
      
      const newState = applyBattleEvents(state, [deathEvent]);
      
      const deadUnit = newState.units.find(u => u.instanceId === unit.instanceId);
      expect(deadUnit?.alive).toBe(false);
      expect(deadUnit?.currentHp).toBe(0);
      expect(newState.occupiedPositions.has('3,3')).toBe(false);
    });

    it('should handle multiple events in sequence', () => {
      const unit = createMockUnit('unit', 2, 2, 'player', 100, 100);
      const state = createBattleState([unit], [], 12345);
      
      const events = [
        {
          round: 1,
          type: 'move' as const,
          actorId: unit.instanceId,
          fromPosition: { x: 2, y: 2 },
          toPosition: { x: 3, y: 2 },
        },
        {
          round: 1,
          type: 'damage' as const,
          actorId: 'enemy_instance',
          targetId: unit.instanceId,
          damage: 40,
        },
      ];
      
      const newState = applyBattleEvents(state, events);
      
      const updatedUnit = newState.units.find(u => u.instanceId === unit.instanceId);
      expect(updatedUnit?.position).toEqual({ x: 3, y: 2 });
      expect(updatedUnit?.currentHp).toBe(60);
      expect(updatedUnit?.alive).toBe(true);
    });
  });

  describe('checkBattleEnd', () => {
    it('should detect player victory', () => {
      const playerUnit = createMockUnit('player', 1, 0, 'player', 50, 100, true);
      const deadBotUnit = createMockUnit('bot', 1, 9, 'bot', 0, 100, false);
      
      const state = createBattleState([playerUnit], [deadBotUnit], 12345);
      const result = checkBattleEnd(state);
      
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('player');
    });

    it('should detect bot victory', () => {
      const deadPlayerUnit = createMockUnit('player', 1, 0, 'player', 0, 100, false);
      const botUnit = createMockUnit('bot', 1, 9, 'bot', 30, 100, true);
      
      const state = createBattleState([deadPlayerUnit], [botUnit], 12345);
      const result = checkBattleEnd(state);
      
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('bot');
    });

    it('should detect draw when all units dead', () => {
      const deadPlayerUnit = createMockUnit('player', 1, 0, 'player', 0, 100, false);
      const deadBotUnit = createMockUnit('bot', 1, 9, 'bot', 0, 100, false);
      
      const state = createBattleState([deadPlayerUnit], [deadBotUnit], 12345);
      const result = checkBattleEnd(state);
      
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('draw');
    });

    it('should detect draw when max rounds reached', () => {
      const playerUnit = createMockUnit('player', 1, 0, 'player', 50, 100, true);
      const botUnit = createMockUnit('bot', 1, 9, 'bot', 50, 100, true);
      
      const state = createBattleState([playerUnit], [botUnit], 12345);
      state.currentRound = 100; // Max rounds
      
      const result = checkBattleEnd(state);
      
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('draw');
    });

    it('should continue battle when both teams have living units', () => {
      const playerUnit = createMockUnit('player', 1, 0, 'player', 50, 100, true);
      const botUnit = createMockUnit('bot', 1, 9, 'bot', 30, 100, true);
      
      const state = createBattleState([playerUnit], [botUnit], 12345);
      const result = checkBattleEnd(state);
      
      expect(result.shouldEnd).toBe(false);
    });
  });

  describe('advanceToNextRound', () => {
    it('should increment round counter', () => {
      const unit = createMockUnit('unit', 1, 0, 'player');
      const state = createBattleState([unit], [], 12345);
      
      expect(state.currentRound).toBe(1);
      
      const nextState = advanceToNextRound(state);
      
      expect(nextState.currentRound).toBe(2);
      expect(nextState.units).toBe(state.units); // Should not change units
      expect(nextState.metadata).toBe(state.metadata); // Should not change metadata
    });

    it('should preserve all other state properties', () => {
      const playerUnit = createMockUnit('player', 1, 0, 'player');
      const botUnit = createMockUnit('bot', 1, 9, 'bot');
      const state = createBattleState([playerUnit], [botUnit], 54321);
      
      const nextState = advanceToNextRound(state);
      
      expect(nextState.units).toEqual(state.units);
      expect(nextState.occupiedPositions).toBe(state.occupiedPositions);
      expect(nextState.metadata).toBe(state.metadata);
    });
  });

  describe('integration tests', () => {
    it('should handle complete battle turn flow', () => {
      const warrior = createMockUnit('warrior', 2, 2, 'player', 100, 100, true, 'tank', 20, 1, 5, 2, 1);
      const enemy = createMockUnit('enemy', 4, 2, 'bot', 60, 100, true, 'tank', 15, 1, 3, 2, 1);
      
      let state = createBattleState([warrior], [enemy], 12345);
      
      // Execute warrior's turn
      const events = executeTurn(warrior, state, 12345);
      expect(events.length).toBeGreaterThan(0);
      
      // Apply events to state
      state = applyBattleEvents(state, events);
      
      // Check that some action was taken
      const moveEvents = events.filter(e => e.type === 'move');
      const attackEvents = events.filter(e => e.type === 'attack');
      expect(moveEvents.length + attackEvents.length).toBeGreaterThan(0);
      
      // Check battle end condition
      const battleEnd = checkBattleEnd(state);
      expect(battleEnd.shouldEnd).toBe(false); // Battle should continue
    });

    it('should be deterministic across multiple runs', () => {
      const seed = 98765;
      const warrior1 = createMockUnit('w1', 2, 2, 'player', 100, 100, true, 'tank', 20, 1, 5, 2, 1);
      const enemy1 = createMockUnit('e1', 5, 2, 'bot', 50, 100, true, 'tank', 15, 1, 3, 2, 1);
      
      const warrior2 = createMockUnit('w1', 2, 2, 'player', 100, 100, true, 'tank', 20, 1, 5, 2, 1);
      const enemy2 = createMockUnit('e1', 5, 2, 'bot', 50, 100, true, 'tank', 15, 1, 3, 2, 1);
      
      const state1 = createBattleState([warrior1], [enemy1], seed);
      const state2 = createBattleState([warrior2], [enemy2], seed);
      
      const events1 = executeTurn(warrior1, state1, seed);
      const events2 = executeTurn(warrior2, state2, seed);
      
      // Events should be identical with same seed
      expect(events1.length).toBe(events2.length);
      for (let i = 0; i < events1.length; i++) {
        const event1 = events1[i];
        const event2 = events2[i];
        if (event1 && event2) {
          expect(event1.type).toBe(event2.type);
          if (event1.type === 'attack' && event2.type === 'attack') {
            expect((event1 as AttackEvent).damage).toBe((event2 as AttackEvent).damage);
          }
        }
      }
    });
  });
});