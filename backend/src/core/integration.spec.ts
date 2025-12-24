/**
 * Core Library Integration Tests
 * @module core/integration
 */

import {
  createEmptyGrid,
  isValidPosition,
  getUnitsInRange,
  getClosestUnit,
  findPath,
  hasPath,
  DEFAULT_GRID_CONFIG,
  calculatePhysicalDamage,
  calculateMagicDamage,
  applyDamage,
  rollDodge,
  DEFAULT_BATTLE_CONFIG,
  buildTurnQueue,
  getNextUnit,
  hasLivingUnits,
  getLivingUnitsByTeam,
  removeDeadUnits,
  findNearestEnemy,
  findWeakestEnemy,
  selectTarget,
  canTarget,
  seededRandom,
  SeededRandom,
} from './index';

import type { GridConfig, GridUnit, DamageUnit, TurnOrderUnit, TargetingUnit } from './index';

function createGridUnit(id: string, x: number, y: number): GridUnit {
  return { instanceId: id, position: { x, y }, alive: true };
}

function createDamageUnit(atk: number, armor: number, hp: number, dodge = 0): DamageUnit {
  return { stats: { atk, atkCount: 1, armor, dodge }, currentHp: hp, maxHp: hp };
}

function createTurnOrderUnit(id: string, initiative: number, team: 'player' | 'bot'): TurnOrderUnit {
  return { id, instanceId: id + '_1', stats: { initiative, speed: 1 }, team, alive: true, currentHp: 100 };
}

function createTargetingUnit(id: string, x: number, y: number, hp = 100, range = 1): TargetingUnit {
  return { id, instanceId: id + '_1', position: { x, y }, currentHp: hp, maxHp: hp, stats: { atk: 10, atkCount: 1 }, range, alive: true, role: 'melee_dps', abilities: [] };
}

describe('Core Integration: Grid', () => {
  const config: GridConfig = { width: 8, height: 10, playerRows: [0, 1], enemyRows: [8, 9] };

  test('creates empty grid and finds path', () => {
    const grid = createEmptyGrid(config);
    const path = findPath({ x: 0, y: 0 }, { x: 3, y: 5 }, grid, [], undefined, config);
    expect(path.length).toBeGreaterThan(0);
  });

  test('hasPath returns correct boolean', () => {
    const grid = createEmptyGrid(config);
    expect(hasPath({ x: 0, y: 0 }, { x: 5, y: 5 }, grid, [], undefined, config)).toBe(true);
  });

  test('getUnitsInRange finds nearby units', () => {
    const units = [createGridUnit('center', 4, 4), createGridUnit('near', 5, 4), createGridUnit('far', 7, 7)];
    const inRange = getUnitsInRange({ x: 4, y: 4 }, 2, units);
    expect(inRange.map(u => u.instanceId)).toContain('near');
  });

  test('getClosestUnit finds nearest unit', () => {
    const units = [createGridUnit('unit1', 2, 2), createGridUnit('unit2', 5, 5)];
    expect(getClosestUnit({ x: 0, y: 0 }, units)?.instanceId).toBe('unit1');
  });
});

describe('Core Integration: Damage', () => {
  test('physical damage reduces by armor', () => {
    expect(calculatePhysicalDamage(createDamageUnit(20, 0, 100), createDamageUnit(10, 5, 100))).toBe(15);
  });

  test('physical damage minimum is 1', () => {
    expect(calculatePhysicalDamage(createDamageUnit(5, 0, 100), createDamageUnit(10, 100, 100))).toBe(1);
  });

  test('magic damage ignores armor', () => {
    expect(calculateMagicDamage(createDamageUnit(30, 0, 100), createDamageUnit(10, 50, 100))).toBe(30);
  });

  test('applyDamage reduces HP correctly', () => {
    const result = applyDamage(createDamageUnit(10, 0, 100), 30);
    expect(result.newHp).toBe(70);
    expect(result.killed).toBe(false);
  });

  test('rollDodge is deterministic', () => {
    const unit = createDamageUnit(10, 0, 100, 50);
    expect(rollDodge(unit, 12345)).toBe(rollDodge(unit, 12345));
  });
});

describe('Core Integration: Turn Order', () => {
  test('buildTurnQueue sorts by initiative', () => {
    const units = [createTurnOrderUnit('slow', 10, 'player'), createTurnOrderUnit('fast', 30, 'bot'), createTurnOrderUnit('medium', 20, 'player')];
    const queue = buildTurnQueue(units);
    expect(queue[0]?.instanceId).toBe('fast_1');
    expect(queue[1]?.instanceId).toBe('medium_1');
  });

  test('getNextUnit returns first alive unit', () => {
    const units = [{ ...createTurnOrderUnit('dead', 30, 'player'), alive: false }, createTurnOrderUnit('alive', 20, 'bot')];
    expect(getNextUnit(units)?.instanceId).toBe('alive_1');
  });

  test('removeDeadUnits filters correctly', () => {
    const units = [createTurnOrderUnit('alive1', 20, 'player'), { ...createTurnOrderUnit('dead', 30, 'bot'), alive: false }];
    expect(removeDeadUnits(units).length).toBe(1);
  });

  test('hasLivingUnits checks correctly', () => {
    expect(hasLivingUnits([createTurnOrderUnit('player1', 20, 'player')])).toBe(true);
  });

  test('getLivingUnitsByTeam filters by team', () => {
    const units = [createTurnOrderUnit('p1', 20, 'player'), createTurnOrderUnit('p2', 15, 'player'), createTurnOrderUnit('b1', 25, 'bot')];
    expect(getLivingUnitsByTeam(units, 'player').length).toBe(2);
  });
});

describe('Core Integration: Targeting', () => {
  test('findNearestEnemy finds closest', () => {
    const attacker = createTargetingUnit('attacker', 0, 0);
    const enemies = [createTargetingUnit('far', 5, 5), createTargetingUnit('near', 2, 1)];
    expect(findNearestEnemy(attacker, enemies)?.id).toBe('near');
  });

  test('findWeakestEnemy finds lowest HP', () => {
    const enemies = [createTargetingUnit('healthy', 2, 2, 100), createTargetingUnit('wounded', 3, 3, 30)];
    expect(findWeakestEnemy(enemies)?.id).toBe('wounded');
  });

  test('selectTarget uses strategy', () => {
    const attacker = createTargetingUnit('attacker', 0, 0);
    const enemies = [createTargetingUnit('far-weak', 5, 5, 20), createTargetingUnit('near-strong', 1, 1, 100)];
    expect(selectTarget(attacker, enemies, 'nearest')?.id).toBe('near-strong');
    expect(selectTarget(attacker, enemies, 'weakest')?.id).toBe('far-weak');
  });

  test('canTarget checks range', () => {
    const target = createTargetingUnit('target', 3, 0);
    expect(canTarget(createTargetingUnit('melee', 0, 0, 100, 1), target)).toBe(false);
    expect(canTarget(createTargetingUnit('ranged', 0, 0, 100, 5), target)).toBe(true);
  });
});

describe('Core Integration: Seeded Random', () => {
  test('seededRandom is deterministic', () => {
    expect(seededRandom(42)).toBe(seededRandom(42));
  });

  test('SeededRandom produces consistent sequences', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    expect([rng1.next(), rng1.next()]).toEqual([rng2.next(), rng2.next()]);
  });

  test('SeededRandom.shuffle is deterministic', () => {
    const rng1 = new SeededRandom(99999);
    const rng2 = new SeededRandom(99999);
    expect(rng1.shuffle([1, 2, 3, 4, 5])).toEqual(rng2.shuffle([1, 2, 3, 4, 5]));
  });
});

describe('Core Independence', () => {
  test('core modules export expected functions', () => {
    expect(typeof createEmptyGrid).toBe('function');
    expect(typeof calculatePhysicalDamage).toBe('function');
    expect(typeof buildTurnQueue).toBe('function');
    expect(typeof selectTarget).toBe('function');
    expect(typeof seededRandom).toBe('function');
  });

  test('default configs are valid', () => {
    expect(DEFAULT_GRID_CONFIG.width).toBeGreaterThan(0);
    expect(DEFAULT_BATTLE_CONFIG.maxRounds).toBeGreaterThan(0);
  });

  test('works with different grid configurations', () => {
    const configs: GridConfig[] = [
      { width: 8, height: 10, playerRows: [0, 1], enemyRows: [8, 9] },
      { width: 4, height: 4, playerRows: [0], enemyRows: [3] },
    ];
    for (const cfg of configs) {
      const grid = createEmptyGrid(cfg);
      expect(grid.length).toBe(cfg.height);
      expect(isValidPosition({ x: 0, y: 0 }, cfg)).toBe(true);
      expect(isValidPosition({ x: cfg.width, y: 0 }, cfg)).toBe(false);
    }
  });
});