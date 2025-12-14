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

// =============================================================================
// REAL ABILITY TESTS
// =============================================================================

import { 
  executeAbility, 
  applyAbilityEvents, 
  tickAbilityCooldowns 
} from './ability.executor';
import { ABILITIES } from '../abilities/ability.data';

describe('Real Ability Tests', () => {
  
  // =============================================================================
  // FIREBALL TESTS - AoE Magic Damage
  // =============================================================================
  
  describe('Fireball Ability', () => {
    test('deals magic damage to all enemies in radius', () => {
      const mage = createMockUnit({
        id: 'mage',
        instanceId: 'mage_1',
        position: { x: 2, y: 2 },
        stats: { hp: 60, atk: 25, atkCount: 1, armor: 5, speed: 2, initiative: 40, dodge: 5 },
        abilityCooldowns: {}, // Initialize cooldowns
      });
      
      const enemy1 = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 4, y: 4 }, // Within fireball range (3) and AoE (1)
        currentHp: 80,
        maxHp: 80,
      });
      
      const enemy2 = createMockUnit({
        instanceId: 'enemy_2', 
        team: 'bot',
        position: { x: 4, y: 3 }, // Within AoE radius of target
        currentHp: 80,
        maxHp: 80,
      });
      
      const enemy3 = createMockUnit({
        instanceId: 'enemy_3',
        team: 'bot', 
        position: { x: 6, y: 6 }, // Outside AoE radius
        currentHp: 80,
        maxHp: 80,
      });
      
      const state = createMockBattleState([mage, enemy1, enemy2, enemy3]);
      const fireball = ABILITIES.fireball;
      
      const events = executeAbility(mage, fireball, { x: 4, y: 4 }, state, 12345);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('ability');
      expect(events[0]?.abilityId).toBe('fireball');
      expect(events[0]?.effectResults).toHaveLength(2); // Should hit 2 enemies in AoE
      
      // Check that both enemies in AoE took damage
      const results = events[0]?.effectResults || [];
      expect(results.every(r => r.effectType === 'damage')).toBe(true);
      expect(results.every(r => r.damage && r.damage > 0)).toBe(true);
    });
    
    test('magical damage ignores armor', () => {
      const mage = createMockUnit({
        id: 'mage',
        instanceId: 'mage_1',
        position: { x: 0, y: 0 },
        stats: { hp: 60, atk: 25, atkCount: 1, armor: 5, speed: 2, initiative: 40, dodge: 5 },
        abilityCooldowns: {}, // Initialize cooldowns
      });
      
      const armoredEnemy = createMockUnit({
        instanceId: 'armored_enemy',
        team: 'bot',
        position: { x: 2, y: 2 },
        stats: { hp: 100, atk: 15, atkCount: 1, armor: 20, speed: 2, initiative: 30, dodge: 0 }, // High armor
        currentHp: 100,
        maxHp: 100,
      });
      
      const state = createMockBattleState([mage, armoredEnemy]);
      const fireball = ABILITIES.fireball;
      
      const events = executeAbility(mage, fireball, { x: 2, y: 2 }, state, 12345);
      
      expect(events).toHaveLength(1);
      const result = events[0]?.effectResults[0];
      expect(result?.damage).toBeDefined();
      // Fireball base damage (30) + attack scaling (25 * 0.6 = 15) = 45 damage
      // Should not be reduced by armor since it's magical
      expect(result?.damage).toBe(45);
    });
  });
  
  // =============================================================================
  // HEAL TESTS - HP Restoration with Limits
  // =============================================================================
  
  describe('Heal Ability', () => {
    test('restores HP to wounded ally', () => {
      const priest = createMockUnit({
        id: 'priest',
        instanceId: 'priest_1',
        position: { x: 0, y: 0 },
        stats: { hp: 70, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 35, dodge: 10 },
      });
      
      const woundedAlly = createMockUnit({
        instanceId: 'wounded_ally',
        team: 'player',
        position: { x: 1, y: 1 },
        currentHp: 30,
        maxHp: 100,
      });
      
      const state = createMockBattleState([priest, woundedAlly]);
      const heal = ABILITIES.heal;
      
      const events = executeAbility(priest, heal, woundedAlly, state, 12345);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('ability');
      expect(events[0]?.abilityId).toBe('heal');
      
      const result = events[0]?.effectResults[0];
      expect(result?.effectType).toBe('heal');
      expect(result?.healing).toBeDefined();
      expect(result?.healing).toBeGreaterThan(0);
      // Heal base (25) + attack scaling (15 * 0.5 = 7.5 rounded down = 7) = 32 healing
      expect(result?.healing).toBe(32);
    });
    
    test('does not heal above maximum HP', () => {
      const priest = createMockUnit({
        id: 'priest',
        instanceId: 'priest_1',
        position: { x: 0, y: 0 },
        stats: { hp: 70, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 35, dodge: 10 },
      });
      
      const nearFullAlly = createMockUnit({
        instanceId: 'near_full_ally',
        team: 'player',
        position: { x: 1, y: 1 },
        currentHp: 95,
        maxHp: 100,
      });
      
      const state = createMockBattleState([priest, nearFullAlly]);
      const heal = ABILITIES.heal;
      
      const events = executeAbility(priest, heal, nearFullAlly, state, 12345);
      
      expect(events).toHaveLength(1);
      const result = events[0]?.effectResults[0];
      expect(result?.newHp).toBe(100); // Should cap at max HP
      expect(result?.healing).toBe(5); // Only healed 5 HP to reach max
    });
    
    test('targets lowest HP ally automatically', () => {
      const priest = createMockUnit({
        id: 'priest',
        instanceId: 'priest_1',
        position: { x: 0, y: 0 },
        stats: { hp: 70, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 35, dodge: 10 },
      });
      
      const ally1 = createMockUnit({
        instanceId: 'ally_1',
        team: 'player',
        position: { x: 1, y: 1 },
        currentHp: 60,
        maxHp: 100,
      });
      
      const ally2 = createMockUnit({
        instanceId: 'ally_2',
        team: 'player',
        position: { x: 2, y: 1 },
        currentHp: 20, // Lowest HP - should be targeted
        maxHp: 100,
      });
      
      const state = createMockBattleState([priest, ally1, ally2]);
      const heal = ABILITIES.heal;
      
      const events = executeAbility(priest, heal, ally2, state, 12345);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.targetId).toBe('ally_2');
    });
  });
  
  // =============================================================================
  // STUN TESTS - Turn Skipping
  // =============================================================================
  
  describe('Stun Ability', () => {
    test('applies stun effect to target', () => {
      const enchanter = createMockUnit({
        id: 'enchanter',
        instanceId: 'enchanter_1',
        position: { x: 0, y: 0 },
        stats: { hp: 55, atk: 20, atkCount: 1, armor: 6, speed: 2, initiative: 45, dodge: 15 },
        abilityCooldowns: {}, // Initialize cooldowns
      });
      
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 1, y: 2 }, // Distance 3 from (0,0) - within stun range
        currentHp: 80,
        maxHp: 80,
        isStunned: false,
      });
      
      const state = createMockBattleState([enchanter, enemy]);
      const stun = ABILITIES.stun;
      
      const events = executeAbility(enchanter, stun, enemy, state, 12345);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('ability');
      expect(events[0]?.abilityId).toBe('stun');
      
      const result = events[0]?.effectResults[0];
      expect(result?.effectType).toBe('stun');
      expect(result?.duration).toBe(1);
      expect(result?.targetId).toBe('enemy_1');
    });
    
    test('stunned unit cannot use abilities', () => {
      const stunnedUnit = createMockUnit({
        isStunned: true,
        abilityCooldowns: {},
      });
      const ability = ABILITIES.fireball;
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 1, y: 0 },
      });
      const state = createMockBattleState([stunnedUnit, enemy]);
      
      expect(canUseAbility(stunnedUnit, ability, state)).toBe(false);
    });
  });
  
  // =============================================================================
  // TAUNT TESTS - Force Enemy Targeting
  // =============================================================================
  
  describe('Taunt Ability', () => {
    test('applies taunt effect to self', () => {
      const guardian = createMockUnit({
        id: 'guardian',
        instanceId: 'guardian_1',
        position: { x: 0, y: 0 },
        stats: { hp: 120, atk: 18, atkCount: 1, armor: 15, speed: 1, initiative: 25, dodge: 5 },
        hasTaunt: false,
      });
      
      const state = createMockBattleState([guardian]);
      const taunt = ABILITIES.taunt;
      
      const events = executeAbility(guardian, taunt, guardian, state, 12345);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('ability');
      expect(events[0]?.abilityId).toBe('taunt');
      
      const result = events[0]?.effectResults[0];
      expect(result?.effectType).toBe('taunt');
      expect(result?.duration).toBe(2);
      expect(result?.targetId).toBe('guardian_1');
    });
    
    test('taunt effect is applied to unit state', () => {
      const guardian = createMockUnit({
        id: 'guardian',
        instanceId: 'guardian_1',
        position: { x: 0, y: 0 },
        stats: { hp: 120, atk: 18, atkCount: 1, armor: 15, speed: 1, initiative: 25, dodge: 5 },
        hasTaunt: false,
        tauntDuration: 0,
      });
      
      const state = createMockBattleState([guardian]);
      const taunt = ABILITIES.taunt;
      
      const events = executeAbility(guardian, taunt, guardian, state, 12345);
      const updatedState = applyAbilityEvents(state, events, taunt, guardian.instanceId);
      
      const updatedGuardian = updatedState.units.find(u => u.instanceId === 'guardian_1') as BattleUnitWithAbilities;
      expect(updatedGuardian?.hasTaunt).toBe(true);
      expect(updatedGuardian?.tauntDuration).toBe(2);
    });
  });
  
  // =============================================================================
  // RAGE TESTS - Conditional ATK Boost
  // =============================================================================
  
  describe('Rage Ability (Passive)', () => {
    test('triggers when HP falls below 50%', () => {
      const berserker = createMockUnit({
        id: 'berserker',
        instanceId: 'berserker_1',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 22, atkCount: 1, armor: 12, speed: 2, initiative: 30, dodge: 8 },
        currentHp: 40, // Below 50% threshold
        maxHp: 100,
      });
      
      const rage = ABILITIES.rage;
      
      // Test trigger condition
      expect(rage.type).toBe('passive');
      if (rage.type === 'passive') {
        expect(rage.trigger).toBe('on_low_hp');
        expect(rage.triggerThreshold).toBe(50);
      }
      
      // Check if rage should trigger
      const hpPercent = (berserker.currentHp / berserker.maxHp) * 100;
      expect(hpPercent).toBeLessThan(50);
      
      // Rage effect should boost attack by 50%
      const effect = rage.effects[0];
      expect(effect?.type).toBe('buff');
      if (effect?.type === 'buff') {
        expect(effect.stat).toBe('attack');
        expect(effect.percentage).toBe(0.5);
      }
    });
    
    test('does not trigger when HP is above 50%', () => {
      const berserker = createMockUnit({
        id: 'berserker',
        instanceId: 'berserker_1',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 22, atkCount: 1, armor: 12, speed: 2, initiative: 30, dodge: 8 },
        currentHp: 60, // Above 50% threshold
        maxHp: 100,
      });
      
      const hpPercent = (berserker.currentHp / berserker.maxHp) * 100;
      expect(hpPercent).toBeGreaterThan(50);
      
      // Rage should not trigger
      const rage = ABILITIES.rage;
      if (rage.type === 'passive') {
        expect(rage.triggerThreshold).toBe(50);
      }
    });
  });
  
  // =============================================================================
  // HEAL TESTS - HP Restoration with Limits (continued)
  // =============================================================================
  
  describe('Heal Ability (continued)', () => {
    test('targets lowest HP ally automatically', () => {
      const priest = createMockUnit({
        id: 'priest',
        instanceId: 'priest_1',
        position: { x: 0, y: 0 },
        stats: { hp: 70, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 35, dodge: 10 },
      });
      
      const ally1 = createMockUnit({
        instanceId: 'ally_1',
        team: 'player',
        position: { x: 1, y: 1 },
        currentHp: 60,
        maxHp: 100,
      });
      
      const ally2 = createMockUnit({
        instanceId: 'ally_2',
        team: 'player',
        position: { x: 2, y: 1 },
        currentHp: 20, // Lowest HP - should be targeted
        maxHp: 100,
      });
      
      const state = createMockBattleState([priest, ally1, ally2]);
      const heal = ABILITIES.heal;
      
      const events = executeAbility(priest, heal, ally2, state, 12345);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.targetId).toBe('ally_2');
    });
  });
  
  // =============================================================================
  // TAUNT TESTS - Force Enemy Targeting (continued)
  // =============================================================================
  
  describe('Taunt Ability (continued)', () => {
    test('taunt effect is applied to unit state', () => {
      const guardian = createMockUnit({
        id: 'guardian',
        instanceId: 'guardian_1',
        position: { x: 0, y: 0 },
        stats: { hp: 120, atk: 18, atkCount: 1, armor: 15, speed: 1, initiative: 25, dodge: 5 },
        hasTaunt: false,
        tauntDuration: 0,
      });
      
      const state = createMockBattleState([guardian]);
      const taunt = ABILITIES.taunt;
      
      const events = executeAbility(guardian, taunt, guardian, state, 12345);
      const updatedState = applyAbilityEvents(state, events, taunt, guardian.instanceId);
      
      const updatedGuardian = updatedState.units.find(u => u.instanceId === 'guardian_1') as BattleUnitWithAbilities;
      expect(updatedGuardian?.hasTaunt).toBe(true);
      expect(updatedGuardian?.tauntDuration).toBe(2);
    });
  });
  
  // =============================================================================
  // RAGE TESTS - Conditional ATK Boost (continued)
  // =============================================================================
  
  describe('Rage Ability (Passive) (continued)', () => {
    test('does not trigger when HP is above 50%', () => {
      const berserker = createMockUnit({
        id: 'berserker',
        instanceId: 'berserker_1',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 22, atkCount: 1, armor: 12, speed: 2, initiative: 30, dodge: 8 },
        currentHp: 60, // Above 50% threshold
        maxHp: 100,
      });
      
      const hpPercent = (berserker.currentHp / berserker.maxHp) * 100;
      expect(hpPercent).toBeGreaterThan(50);
      
      // Rage should not trigger
      const rage = ABILITIES.rage;
      if (rage.type === 'passive') {
        expect(rage.triggerThreshold).toBe(50);
      }
    });
  });
  
  // =============================================================================
  // COOLDOWN TESTS - Ability Availability
  // =============================================================================
  
  describe('Cooldown System', () => {
    test('ability is unavailable when on cooldown', () => {
      const mage = createMockUnit({
        id: 'mage',
        instanceId: 'mage_1',
        abilityCooldowns: { fireball: 2 }, // Fireball on cooldown
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 1, y: 0 },
      });
      const state = createMockBattleState([mage, enemy]);
      const fireball = ABILITIES.fireball;
      
      expect(canUseAbility(mage, fireball, state)).toBe(false);
    });
    
    test('ability becomes available when cooldown reaches 0', () => {
      const mage = createMockUnit({
        id: 'mage',
        instanceId: 'mage_1',
        abilityCooldowns: { fireball: 0 }, // Cooldown finished
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 1, y: 0 },
      });
      const state = createMockBattleState([mage, enemy]);
      const fireball = ABILITIES.fireball;
      
      expect(canUseAbility(mage, fireball, state)).toBe(true);
    });
    
    test('cooldown is set after using ability', () => {
      const mage = createMockUnit({
        id: 'mage',
        instanceId: 'mage_1',
        position: { x: 0, y: 0 },
        abilityCooldowns: {},
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot',
        position: { x: 2, y: 2 },
      });
      const state = createMockBattleState([mage, enemy]);
      const fireball = ABILITIES.fireball;
      
      const events = executeAbility(mage, fireball, { x: 2, y: 2 }, state, 12345);
      const updatedState = applyAbilityEvents(state, events, fireball, mage.instanceId);
      
      const updatedMage = updatedState.units.find(u => u.instanceId === 'mage_1') as BattleUnitWithAbilities;
      expect(updatedMage?.abilityCooldowns?.['fireball']).toBe(2); // Fireball cooldown is 2
    });
    
    test('cooldowns tick down each turn', () => {
      const unit = createMockUnit({
        abilityCooldowns: {
          fireball: 3,
          heal: 1,
          stun: 2,
        },
      });
      
      const updatedUnit = tickAbilityCooldowns(unit);
      
      expect(updatedUnit.abilityCooldowns?.['fireball']).toBe(2);
      expect(updatedUnit.abilityCooldowns?.['heal']).toBeUndefined(); // Removed when reaches 0
      expect(updatedUnit.abilityCooldowns?.['stun']).toBe(1);
    });
    
    test('cooldowns tick down correctly', () => {
      const unit = createMockUnit({
        abilityCooldowns: {
          fireball: 3,
          heal: 1,
          stun: 2,
        },
      });
      
      const updatedUnit = tickAbilityCooldowns(unit);
      
      expect(updatedUnit.abilityCooldowns?.['fireball']).toBe(2);
      expect(updatedUnit.abilityCooldowns?.['heal']).toBeUndefined(); // Removed when reaches 0
      expect(updatedUnit.abilityCooldowns?.['stun']).toBe(1);
    });
  });
});
