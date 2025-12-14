/**
 * Tests for ability executor system.
 * Validates all critical functionality: effect types, cooldowns, range, AoE, determinism.
 */

import {
  canUseAbility,
  getValidTargets,
  getUnitsInAoE,
  applyEffect,
  BattleUnitWithAbilities,
} from './ability.executor';
import { BattleState } from './actions';
import { BattleUnit, Position, TeamType } from '../types/game.types';
import {
  ActiveAbility,
  DamageEffect,
  HealEffect,
  BuffEffect,
  StunEffect,
} from '../types/ability.types';

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

/**
 * Create a mock active ability for testing.
 */
function createMockActiveAbility(overrides: Partial<ActiveAbility> = {}): ActiveAbility {
  return {
    id: 'test_ability',
    name: 'Test Ability',
    description: 'A test ability',
    type: 'active',
    targetType: 'enemy',
    cooldown: 2,
    range: 3,
    effects: [
      {
        type: 'damage',
        value: 25,
        damageType: 'physical',
      } as DamageEffect,
    ],
    ...overrides,
  };
}

// =============================================================================
// canUseAbility TESTS
// =============================================================================

describe('canUseAbility', () => {
  test('returns false for dead units', () => {
    const unit = createMockUnit({ alive: false });
    const ability = createMockActiveAbility();
    const state = createMockBattleState([unit]);

    expect(canUseAbility(unit, ability, state)).toBe(false);
  });

  test('returns false when ability is on cooldown', () => {
    const unit = createMockUnit({
      abilityCooldowns: { test_ability: 2 },
    });
    const ability = createMockActiveAbility();
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const state = createMockBattleState([unit, enemy]);

    expect(canUseAbility(unit, ability, state)).toBe(false);
  });

  test('returns true when cooldown is 0', () => {
    const unit = createMockUnit({
      abilityCooldowns: { test_ability: 0 },
    });
    const ability = createMockActiveAbility();
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const state = createMockBattleState([unit, enemy]);

    expect(canUseAbility(unit, ability, state)).toBe(true);
  });

  test('returns false when unit is stunned', () => {
    const unit = createMockUnit({ isStunned: true });
    const ability = createMockActiveAbility();
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const state = createMockBattleState([unit, enemy]);

    expect(canUseAbility(unit, ability, state)).toBe(false);
  });

  test('returns true for ability usable while stunned', () => {
    const unit = createMockUnit({ isStunned: true });
    const ability = createMockActiveAbility({ usableWhileStunned: true });
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const state = createMockBattleState([unit, enemy]);

    expect(canUseAbility(unit, ability, state)).toBe(true);
  });

  test('returns false when no valid targets exist', () => {
    const unit = createMockUnit();
    const ability = createMockActiveAbility({ range: 1 });
    // Enemy is out of range
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 5, y: 5 },
    });
    const state = createMockBattleState([unit, enemy]);

    expect(canUseAbility(unit, ability, state)).toBe(false);
  });

  test('returns true for self-targeting ability with no other targets', () => {
    const unit = createMockUnit();
    const ability = createMockActiveAbility({ targetType: 'self' });
    const state = createMockBattleState([unit]);

    expect(canUseAbility(unit, ability, state)).toBe(true);
  });
});


// =============================================================================
// getValidTargets TESTS
// =============================================================================

describe('getValidTargets', () => {
  test('returns self for self-targeting ability', () => {
    const unit = createMockUnit();
    const ability = createMockActiveAbility({ targetType: 'self' });
    const state = createMockBattleState([unit]);

    const targets = getValidTargets(unit, ability, state);

    expect(targets).toHaveLength(1);
    expect(targets[0]?.instanceId).toBe(unit.instanceId);
  });

  test('returns enemies within range for enemy-targeting ability', () => {
    const unit = createMockUnit({ position: { x: 0, y: 0 } });
    const nearEnemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const farEnemy = createMockUnit({
      instanceId: 'enemy_2',
      team: 'bot',
      position: { x: 5, y: 5 },
    });
    const ability = createMockActiveAbility({ targetType: 'enemy', range: 2 });
    const state = createMockBattleState([unit, nearEnemy, farEnemy]);

    const targets = getValidTargets(unit, ability, state);

    expect(targets).toHaveLength(1);
    expect(targets[0]?.instanceId).toBe('enemy_1');
  });

  test('returns all allies for all_allies targeting', () => {
    const unit = createMockUnit({ instanceId: 'unit_1' });
    const ally1 = createMockUnit({ instanceId: 'ally_1', position: { x: 1, y: 0 } });
    const ally2 = createMockUnit({ instanceId: 'ally_2', position: { x: 2, y: 0 } });
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 5, y: 5 },
    });
    const ability = createMockActiveAbility({ targetType: 'all_allies' });
    const state = createMockBattleState([unit, ally1, ally2, enemy]);

    const targets = getValidTargets(unit, ability, state);

    expect(targets).toHaveLength(3); // unit + 2 allies
    expect(targets.every(t => t.team === 'player')).toBe(true);
  });

  test('returns all enemies for all_enemies targeting', () => {
    const unit = createMockUnit();
    const enemy1 = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const enemy2 = createMockUnit({
      instanceId: 'enemy_2',
      team: 'bot',
      position: { x: 2, y: 0 },
    });
    const ability = createMockActiveAbility({ targetType: 'all_enemies' });
    const state = createMockBattleState([unit, enemy1, enemy2]);

    const targets = getValidTargets(unit, ability, state);

    expect(targets).toHaveLength(2);
    expect(targets.every(t => t.team === 'bot')).toBe(true);
  });

  test('returns lowest HP ally for lowest_hp_ally targeting', () => {
    const unit = createMockUnit({ instanceId: 'unit_1', currentHp: 100 });
    const ally1 = createMockUnit({
      instanceId: 'ally_1',
      currentHp: 50,
      position: { x: 1, y: 0 },
    });
    const ally2 = createMockUnit({
      instanceId: 'ally_2',
      currentHp: 30,
      position: { x: 2, y: 0 },
    });
    const ability = createMockActiveAbility({ targetType: 'lowest_hp_ally' });
    const state = createMockBattleState([unit, ally1, ally2]);

    const targets = getValidTargets(unit, ability, state);

    expect(targets).toHaveLength(1);
    expect(targets[0]?.instanceId).toBe('ally_2');
  });

  test('excludes dead units from targets', () => {
    const unit = createMockUnit();
    const aliveEnemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 1, y: 0 },
    });
    const deadEnemy = createMockUnit({
      instanceId: 'enemy_2',
      team: 'bot',
      position: { x: 2, y: 0 },
      alive: false,
    });
    const ability = createMockActiveAbility({ targetType: 'all_enemies' });
    const state = createMockBattleState([unit, aliveEnemy, deadEnemy]);

    const targets = getValidTargets(unit, ability, state);

    expect(targets).toHaveLength(1);
    expect(targets[0]?.instanceId).toBe('enemy_1');
  });
});


// =============================================================================
// getUnitsInAoE TESTS
// =============================================================================

describe('getUnitsInAoE', () => {
  test('returns units within area size', () => {
    const targetPosition: Position = { x: 3, y: 3 };
    const nearUnit = createMockUnit({
      instanceId: 'near_1',
      team: 'bot',
      position: { x: 3, y: 4 },
    });
    const farUnit = createMockUnit({
      instanceId: 'far_1',
      team: 'bot',
      position: { x: 7, y: 7 },
    });
    const units = [nearUnit, farUnit];

    const result = getUnitsInAoE(targetPosition, 2, units, 'enemy', 'player');

    expect(result).toHaveLength(1);
    expect(result[0]?.instanceId).toBe('near_1');
  });

  test('filters by team correctly', () => {
    const targetPosition: Position = { x: 3, y: 3 };
    const enemy = createMockUnit({
      instanceId: 'enemy_1',
      team: 'bot',
      position: { x: 3, y: 4 },
    });
    const ally = createMockUnit({
      instanceId: 'ally_1',
      team: 'player',
      position: { x: 3, y: 2 },
    });
    const units = [enemy, ally];

    const enemyResult = getUnitsInAoE(targetPosition, 2, units, 'enemy', 'player');
    const allyResult = getUnitsInAoE(targetPosition, 2, units, 'ally', 'player');

    expect(enemyResult).toHaveLength(1);
    expect(enemyResult[0]?.instanceId).toBe('enemy_1');
    expect(allyResult).toHaveLength(1);
    expect(allyResult[0]?.instanceId).toBe('ally_1');
  });

  test('excludes dead units', () => {
    const targetPosition: Position = { x: 3, y: 3 };
    const aliveUnit = createMockUnit({
      instanceId: 'alive_1',
      team: 'bot',
      position: { x: 3, y: 4 },
    });
    const deadUnit = createMockUnit({
      instanceId: 'dead_1',
      team: 'bot',
      position: { x: 3, y: 2 },
      alive: false,
    });
    const units = [aliveUnit, deadUnit];

    const result = getUnitsInAoE(targetPosition, 2, units, 'enemy', 'player');

    expect(result).toHaveLength(1);
    expect(result[0]?.instanceId).toBe('alive_1');
  });
});

// =============================================================================
// applyEffect TESTS
// =============================================================================

describe('applyEffect', () => {
  test('applies damage effect correctly', () => {
    const target = createMockUnit({ currentHp: 100 });
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: DamageEffect = {
      type: 'damage',
      value: 30,
      damageType: 'physical',
    };

    const result = applyEffect(effect, target, caster, 12345);

    expect(result.success).toBe(true);
    expect(result.effectType).toBe('damage');
    expect(result.damage).toBeDefined();
    expect(result.damage).toBeGreaterThan(0);
  });

  test('applies heal effect correctly', () => {
    const target = createMockUnit({ currentHp: 50, maxHp: 100 });
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: HealEffect = {
      type: 'heal',
      value: 25,
    };

    const result = applyEffect(effect, target, caster, 12345);

    expect(result.success).toBe(true);
    expect(result.effectType).toBe('heal');
    expect(result.healing).toBeDefined();
  });

  test('applies buff effect correctly', () => {
    const target = createMockUnit();
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: BuffEffect = {
      type: 'buff',
      stat: 'attack',
      percentage: 0.2,
      duration: 2,
    };

    const result = applyEffect(effect, target, caster, 12345);

    expect(result.success).toBe(true);
    expect(result.effectType).toBe('buff');
    expect(result.statModified).toBe('attack');
    expect(result.duration).toBe(2);
  });

  test('applies stun effect correctly', () => {
    const target = createMockUnit();
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: StunEffect = {
      type: 'stun',
      duration: 1,
    };

    const result = applyEffect(effect, target, caster, 12345);

    expect(result.success).toBe(true);
    expect(result.effectType).toBe('stun');
    expect(result.duration).toBe(1);
  });

  test('respects effect chance and can resist', () => {
    const target = createMockUnit();
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: StunEffect = {
      type: 'stun',
      duration: 1,
      chance: 0, // 0% chance - always resisted
    };

    const result = applyEffect(effect, target, caster, 12345);

    expect(result.success).toBe(false);
    expect(result.resisted).toBe(true);
  });

  test('physical damage is reduced by armor', () => {
    const target = createMockUnit({
      currentHp: 100,
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 15, speed: 2, initiative: 50, dodge: 0 },
    });
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: DamageEffect = {
      type: 'damage',
      value: 30,
      damageType: 'physical',
    };

    const result = applyEffect(effect, target, caster, 12345);

    // Damage should be reduced by armor (30 - 15 = 15)
    expect(result.damage).toBe(15);
  });

  test('magical damage ignores armor', () => {
    const target = createMockUnit({
      currentHp: 100,
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 15, speed: 2, initiative: 50, dodge: 0 },
    });
    const caster = createMockUnit({ instanceId: 'caster_1' });
    const effect: DamageEffect = {
      type: 'damage',
      value: 30,
      damageType: 'magical',
    };

    const result = applyEffect(effect, target, caster, 12345);

    // Magical damage ignores armor
    expect(result.damage).toBe(30);
  });
});
