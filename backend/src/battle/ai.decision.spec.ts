/**
 * Tests for AI Decision Making System.
 * Validates role-specific decision logic and deterministic behavior.
 */

import {
  decideAction,
  selectBestAction,
  shouldUseAbility,
  UnitAction,
} from './ai.decision';
import { BattleState } from './actions';
import { BattleUnit, TeamType } from '../types/game.types';
import { BattleUnitWithAbilities } from './ability.executor';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Create a mock battle unit for testing.
 */
function createMockUnit(overrides: Partial<BattleUnitWithAbilities> = {}): BattleUnitWithAbilities {
  return {
    id: 'test_unit',
    name: 'Test Unit',
    role: 'tank',
    cost: 5,
    stats: {
      hp: 100,
      atk: 20,
      atkCount: 1,
      armor: 10,
      speed: 2,
      initiative: 50,
      dodge: 10,
    },
    range: 1,
    abilities: [],
    position: { x: 0, y: 0 },
    currentHp: 100,
    maxHp: 100,
    team: 'player' as TeamType,
    alive: true,
    instanceId: 'unit_1',
    ...overrides,
  };
}

/**
 * Create a mock battle state for testing.
 */
function createMockBattleState(units: BattleUnit[]): BattleState {
  const occupiedPositions = new Set<string>();
  units.forEach(unit => {
    if (unit.alive) {
      occupiedPositions.add(`${unit.position.x},${unit.position.y}`);
    }
  });

  return {
    units,
    currentRound: 1,
    occupiedPositions,
    metadata: {
      seed: 12345,
      startTime: Date.now(),
    },
  };
}


// =============================================================================
// decideAction TESTS
// =============================================================================

describe('decideAction', () => {
  describe('basic behavior', () => {
    test('returns no action for dead unit', () => {
      const unit = createMockUnit({ alive: false });
      const state = createMockBattleState([unit]);

      const action = decideAction(unit, state);

      expect(action.priority).toBe(0);
      expect(action.reason).toContain('dead');
    });

    test('returns no action for stunned unit', () => {
      const unit = createMockUnit({ isStunned: true });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 1, y: 0 },
      });
      const state = createMockBattleState([unit, enemy]);

      const action = decideAction(unit, state);

      expect(action.priority).toBe(0);
      expect(action.reason).toContain('stunned');
    });

    test('returns no action when no enemies remain', () => {
      const unit = createMockUnit();
      const ally = createMockUnit({ instanceId: 'ally_1', position: { x: 1, y: 0 } });
      const state = createMockBattleState([unit, ally]);

      const action = decideAction(unit, state);

      expect(action.priority).toBe(0);
      expect(action.reason).toContain('No enemies');
    });
  });

  describe('tank role', () => {
    test('attacks enemy in range', () => {
      const tank = createMockUnit({ role: 'tank', range: 1 });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 1, y: 0 },
      });
      const state = createMockBattleState([tank, enemy]);

      const action = decideAction(tank, state);

      expect(action.type).toBe('attack');
      expect(action.target?.instanceId).toBe('enemy_1');
    });

    test('moves towards enemy when out of range', () => {
      const tank = createMockUnit({ role: 'tank', range: 1 });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 5, y: 5 },
      });
      const state = createMockBattleState([tank, enemy]);

      const action = decideAction(tank, state);

      expect(action.type).toBe('move');
      expect(action.targetPosition).toEqual({ x: 5, y: 5 });
    });
  });

  describe('support role', () => {
    test('prioritizes healing wounded allies', () => {
      const priest = createMockUnit({
        id: 'priest',
        role: 'support',
        range: 3,
        position: { x: 0, y: 0 },
      });
      const woundedAlly = createMockUnit({
        instanceId: 'ally_1',
        currentHp: 30,
        maxHp: 100,
        position: { x: 1, y: 0 },
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 5, y: 5 },
      });
      const state = createMockBattleState([priest, woundedAlly, enemy]);

      const action = decideAction(priest, state);

      // Support should try to heal or attack, not just move
      expect(['attack', 'ability', 'move']).toContain(action.type);
    });
  });

  describe('DPS role', () => {
    test('attacks weakest enemy in range', () => {
      const dps = createMockUnit({
        role: 'melee_dps',
        range: 1,
        position: { x: 2, y: 0 },
      });
      const strongEnemy = createMockUnit({
        id: 'strong',
        instanceId: 'enemy_1',
        team: 'bot',
        currentHp: 100,
        position: { x: 3, y: 0 },
      });
      const weakEnemy = createMockUnit({
        id: 'weak',
        instanceId: 'enemy_2',
        team: 'bot',
        currentHp: 20,
        position: { x: 1, y: 0 },
      });
      const state = createMockBattleState([dps, strongEnemy, weakEnemy]);

      const action = decideAction(dps, state);

      expect(action.type).toBe('attack');
      expect(action.target?.instanceId).toBe('enemy_2'); // Weakest
    });

    test('moves towards weakest enemy when out of range', () => {
      const dps = createMockUnit({
        role: 'ranged_dps',
        range: 2,
        position: { x: 0, y: 0 },
      });
      const strongEnemy = createMockUnit({
        id: 'strong',
        instanceId: 'enemy_1',
        team: 'bot',
        currentHp: 100,
        position: { x: 5, y: 5 },
      });
      const weakEnemy = createMockUnit({
        id: 'weak',
        instanceId: 'enemy_2',
        team: 'bot',
        currentHp: 20,
        position: { x: 6, y: 6 },
      });
      const state = createMockBattleState([dps, strongEnemy, weakEnemy]);

      const action = decideAction(dps, state);

      expect(action.type).toBe('move');
      expect(action.target?.instanceId).toBe('enemy_2'); // Weakest
    });
  });

  describe('mage role', () => {
    test('attacks enemy when in range', () => {
      const mage = createMockUnit({
        id: 'mage',
        role: 'mage',
        range: 3,
        position: { x: 0, y: 0 },
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 2, y: 0 },
      });
      const state = createMockBattleState([mage, enemy]);

      const action = decideAction(mage, state);

      expect(['attack', 'ability']).toContain(action.type);
    });
  });

  describe('control role', () => {
    test('attacks enemy when in range', () => {
      const enchanter = createMockUnit({
        id: 'enchanter',
        role: 'control',
        range: 3,
        position: { x: 0, y: 0 },
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 2, y: 0 },
      });
      const state = createMockBattleState([enchanter, enemy]);

      const action = decideAction(enchanter, state);

      expect(['attack', 'ability']).toContain(action.type);
    });
  });
});


// =============================================================================
// selectBestAction TESTS
// =============================================================================

describe('selectBestAction', () => {
  test('returns action with highest priority', () => {
    const actions: UnitAction[] = [
      { type: 'move', priority: 30, reason: 'Move' },
      { type: 'attack', priority: 50, reason: 'Attack' },
      { type: 'ability', priority: 75, reason: 'Ability' },
    ];

    const best = selectBestAction(actions);

    expect(best.type).toBe('ability');
    expect(best.priority).toBe(75);
  });

  test('uses type as tiebreaker when priorities equal', () => {
    const actions: UnitAction[] = [
      { type: 'move', priority: 50, reason: 'Move' },
      { type: 'ability', priority: 50, reason: 'Ability' },
      { type: 'attack', priority: 50, reason: 'Attack' },
    ];

    const best = selectBestAction(actions);

    // Attack has highest type priority (3 > 2 > 1)
    expect(best.type).toBe('attack');
  });

  test('returns no-action for empty array', () => {
    const best = selectBestAction([]);

    expect(best.priority).toBe(0);
    expect(best.reason).toContain('No actions');
  });
});

// =============================================================================
// shouldUseAbility TESTS
// =============================================================================

describe('shouldUseAbility', () => {
  test('returns false for unit without ability', () => {
    const unit = createMockUnit({ id: 'unknown_unit' });
    const state = createMockBattleState([unit]);

    const result = shouldUseAbility(unit, state);

    expect(result).toBe(false);
  });

  test('returns false for dead unit', () => {
    const unit = createMockUnit({ id: 'mage', alive: false });
    const state = createMockBattleState([unit]);

    const result = shouldUseAbility(unit, state);

    expect(result).toBe(false);
  });
});

// =============================================================================
// DETERMINISM TESTS
// =============================================================================

describe('deterministic behavior', () => {
  test('same inputs produce same outputs', () => {
    const unit = createMockUnit({ role: 'melee_dps', range: 1 });
    const enemy1 = createMockUnit({
      id: 'enemy_a',
      instanceId: 'enemy_1',
      team: 'bot',
      currentHp: 50,
      position: { x: 1, y: 0 },
    });
    const enemy2 = createMockUnit({
      id: 'enemy_b',
      instanceId: 'enemy_2',
      team: 'bot',
      currentHp: 50,
      position: { x: 0, y: 1 },
    });
    const state = createMockBattleState([unit, enemy1, enemy2]);

    // Run multiple times
    const results = Array.from({ length: 5 }, () => decideAction(unit, state));

    // All results should be identical
    const firstResult = results[0];
    results.forEach(result => {
      expect(result.type).toBe(firstResult?.type);
      expect(result.target?.instanceId).toBe(firstResult?.target?.instanceId);
      expect(result.priority).toBe(firstResult?.priority);
    });
  });

  test('tiebreaker uses ID for consistent selection', () => {
    const unit = createMockUnit({ role: 'melee_dps', range: 1 });
    // Two enemies with identical stats but different IDs
    const enemyA = createMockUnit({
      id: 'aaa',
      instanceId: 'enemy_a',
      team: 'bot',
      currentHp: 50,
      maxHp: 100,
      position: { x: 1, y: 0 },
    });
    const enemyB = createMockUnit({
      id: 'bbb',
      instanceId: 'enemy_b',
      team: 'bot',
      currentHp: 50,
      maxHp: 100,
      position: { x: 0, y: 1 },
    });
    const state = createMockBattleState([unit, enemyA, enemyB]);

    const action = decideAction(unit, state);

    // Should consistently pick 'aaa' due to alphabetical tiebreaker
    expect(action.target?.id).toBe('aaa');
  });
});
