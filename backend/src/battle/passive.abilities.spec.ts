/**
 * Tests for passive abilities system.
 */

import {
  hasPassive,
  getUnitPassive,
  isRageConditionMet,
  applyEvasionPassive,
  getEffectiveDodge,
  updateRagePassive,
  getEffectiveAttack,
  calculateThornsDamage,
  processThorns,
  calculateLifestealHealing,
  processLifesteal,
  applyBattleStartPassives,
  applyAllBattleStartPassives,
  updateConditionalPassives,
  getEffectiveStatsWithPassives,
  processAttackPassives,
  applyPassiveResults,
  getPassiveEvents,
  PASSIVE_CONSTANTS,
  BattleUnitWithPassives,
} from './passive.abilities';
import { BattleState } from './actions';
import { BattleUnit, TeamType } from '../types/game.types';

function createMockUnit(overrides: Partial<BattleUnitWithPassives> = {}): BattleUnitWithPassives {
  return {
    id: 'test_unit',
    name: 'Test Unit',
    role: 'tank',
    cost: 5,
    stats: { hp: 100, atk: 20, atkCount: 1, armor: 10, speed: 2, initiative: 50, dodge: 10 },
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

function createMockBattleState(units: BattleUnit[]): BattleState {
  const occupiedPositions = new Set<string>();
  units.forEach(unit => {
    if (unit.alive) occupiedPositions.add(`${unit.position.x},${unit.position.y}`);
  });
  return { units, currentRound: 1, events: [], occupiedPositions, metadata: { seed: 12345, startTime: Date.now() } };
}

describe('hasPassive', () => {
  test('returns true for rogue with evasion', () => {
    const rogue = createMockUnit({ id: 'rogue' });
    expect(hasPassive(rogue, 'evasion')).toBe(true);
  });

  test('returns true for berserker with rage', () => {
    const berserker = createMockUnit({ id: 'berserker' });
    expect(hasPassive(berserker, 'rage')).toBe(true);
  });

  test('returns true for guardian with thorns', () => {
    const guardian = createMockUnit({ id: 'guardian' });
    expect(hasPassive(guardian, 'thorns')).toBe(true);
  });

  test('returns true for warlock with lifesteal', () => {
    const warlock = createMockUnit({ id: 'warlock' });
    expect(hasPassive(warlock, 'lifesteal')).toBe(true);
  });

  test('returns false for unit without passive', () => {
    const knight = createMockUnit({ id: 'knight' });
    expect(hasPassive(knight, 'evasion')).toBe(false);
  });
});

describe('getUnitPassive', () => {
  test('returns correct passive for each unit', () => {
    expect(getUnitPassive(createMockUnit({ id: 'rogue' }))).toBe('evasion');
    expect(getUnitPassive(createMockUnit({ id: 'berserker' }))).toBe('rage');
    expect(getUnitPassive(createMockUnit({ id: 'guardian' }))).toBe('thorns');
    expect(getUnitPassive(createMockUnit({ id: 'warlock' }))).toBe('lifesteal');
  });

  test('returns undefined for unit without passive', () => {
    expect(getUnitPassive(createMockUnit({ id: 'knight' }))).toBeUndefined();
  });
});

describe('Evasion Passive (Rogue)', () => {
  test('applyEvasionPassive adds dodge bonus to rogue', () => {
    const rogue = createMockUnit({ id: 'rogue' });
    const result = applyEvasionPassive(rogue);
    expect(result.evasionApplied).toBe(true);
    expect(result.passiveEffects).toHaveLength(1);
  });

  test('applyEvasionPassive does not apply twice', () => {
    const rogue = createMockUnit({ id: 'rogue', evasionApplied: true });
    const result = applyEvasionPassive(rogue);
    expect(result.passiveEffects).toBeUndefined();
  });

  test('getEffectiveDodge adds 15% for rogue', () => {
    const rogue = createMockUnit({ id: 'rogue', stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 60, dodge: 20 } });
    expect(getEffectiveDodge(rogue)).toBe(35);
  });

  test('getEffectiveDodge caps at 75%', () => {
    const rogue = createMockUnit({ id: 'rogue', stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 60, dodge: 70 } });
    expect(getEffectiveDodge(rogue)).toBe(75);
  });
});

describe('Rage Passive (Berserker)', () => {
  test('isRageConditionMet returns true when HP < 50%', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 40, maxHp: 100 });
    expect(isRageConditionMet(berserker)).toBe(true);
  });

  test('isRageConditionMet returns false when HP >= 50%', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 50, maxHp: 100 });
    expect(isRageConditionMet(berserker)).toBe(false);
  });

  test('updateRagePassive activates rage when HP drops below 50%', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 40, maxHp: 100, rageActive: false });
    const result = updateRagePassive(berserker);
    expect(result.rageActive).toBe(true);
    expect(result.passiveEffects).toHaveLength(1);
  });

  test('getEffectiveAttack applies 50% bonus when rage active', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 40, maxHp: 100, stats: { hp: 100, atk: 20, atkCount: 1, armor: 10, speed: 2, initiative: 50, dodge: 10 } });
    expect(getEffectiveAttack(berserker)).toBe(30);
  });

  test('getEffectiveAttack returns base attack when HP >= 50%', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 60, maxHp: 100, stats: { hp: 100, atk: 20, atkCount: 1, armor: 10, speed: 2, initiative: 50, dodge: 10 } });
    expect(getEffectiveAttack(berserker)).toBe(20);
  });
});

describe('Thorns Passive (Guardian)', () => {
  test('calculateThornsDamage returns 20% of damage for guardian', () => {
    const guardian = createMockUnit({ id: 'guardian' });
    expect(calculateThornsDamage(guardian, 50)).toBe(10);
    expect(calculateThornsDamage(guardian, 100)).toBe(20);
  });

  test('calculateThornsDamage returns 0 for non-guardian', () => {
    const knight = createMockUnit({ id: 'knight' });
    expect(calculateThornsDamage(knight, 50)).toBe(0);
  });

  test('processThorns creates damage event for guardian', () => {
    const guardian = createMockUnit({ id: 'guardian', instanceId: 'guardian_1' });
    const attacker = createMockUnit({ id: 'enemy', instanceId: 'enemy_1', team: 'bot' });
    const result = processThorns(guardian, attacker, 50, 12345);
    expect(result.triggered).toBe(true);
    expect(result.passiveId).toBe('thorns');
    expect(result.effect?.value).toBe(10);
  });

  test('processThorns returns not triggered for non-guardian', () => {
    const knight = createMockUnit({ id: 'knight', instanceId: 'knight_1' });
    const attacker = createMockUnit({ id: 'enemy', instanceId: 'enemy_1', team: 'bot' });
    const result = processThorns(knight, attacker, 50, 12345);
    expect(result.triggered).toBe(false);
  });
});

describe('Lifesteal Passive (Warlock)', () => {
  test('calculateLifestealHealing returns 20% of damage for warlock', () => {
    const warlock = createMockUnit({ id: 'warlock' });
    expect(calculateLifestealHealing(warlock, 50)).toBe(10);
    expect(calculateLifestealHealing(warlock, 100)).toBe(20);
  });

  test('calculateLifestealHealing returns 0 for non-warlock', () => {
    const mage = createMockUnit({ id: 'mage' });
    expect(calculateLifestealHealing(mage, 50)).toBe(0);
  });

  test('processLifesteal creates heal event for warlock', () => {
    const warlock = createMockUnit({ id: 'warlock', instanceId: 'warlock_1', currentHp: 50, maxHp: 100 });
    const result = processLifesteal(warlock, 50, 12345);
    expect(result.triggered).toBe(true);
    expect(result.passiveId).toBe('lifesteal');
    expect(result.effect?.value).toBe(10);
  });

  test('processLifesteal caps healing at max HP', () => {
    const warlock = createMockUnit({ id: 'warlock', instanceId: 'warlock_1', currentHp: 95, maxHp: 100 });
    const result = processLifesteal(warlock, 50, 12345);
    expect(result.effect?.value).toBe(5);
  });
});

describe('Battle Start Passives', () => {
  test('applyBattleStartPassives applies evasion to rogue', () => {
    const rogue = createMockUnit({ id: 'rogue' });
    const result = applyBattleStartPassives(rogue);
    expect(result.evasionApplied).toBe(true);
  });

  test('applyBattleStartPassives activates rage for low HP berserker', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 40, maxHp: 100 });
    const result = applyBattleStartPassives(berserker);
    expect(result.rageActive).toBe(true);
  });

  test('applyAllBattleStartPassives applies to all units', () => {
    const rogue = createMockUnit({ id: 'rogue', instanceId: 'rogue_1' });
    const berserker = createMockUnit({ id: 'berserker', instanceId: 'berserker_1', currentHp: 40, maxHp: 100 });
    const state = createMockBattleState([rogue, berserker]);
    const result = applyAllBattleStartPassives(state);
    const updatedRogue = result.units.find(u => u.instanceId === 'rogue_1') as BattleUnitWithPassives;
    const updatedBerserker = result.units.find(u => u.instanceId === 'berserker_1') as BattleUnitWithPassives;
    expect(updatedRogue?.evasionApplied).toBe(true);
    expect(updatedBerserker?.rageActive).toBe(true);
  });
});

describe('Effective Stats with Passives', () => {
  test('getEffectiveStatsWithPassives returns correct stats for rogue', () => {
    const rogue = createMockUnit({ id: 'rogue', stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 60, dodge: 20 } });
    const stats = getEffectiveStatsWithPassives(rogue);
    expect(stats.atk).toBe(20);
    expect(stats.dodge).toBe(35);
  });

  test('getEffectiveStatsWithPassives returns correct stats for low HP berserker', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 40, maxHp: 100, stats: { hp: 100, atk: 20, atkCount: 1, armor: 10, speed: 2, initiative: 50, dodge: 10 } });
    const stats = getEffectiveStatsWithPassives(berserker);
    expect(stats.atk).toBe(30);
    expect(stats.dodge).toBe(10);
  });
});

describe('Attack Passives Processing', () => {
  test('processAttackPassives triggers lifesteal for warlock attacker', () => {
    const warlock = createMockUnit({ id: 'warlock', instanceId: 'warlock_1', currentHp: 50, maxHp: 100 });
    const enemy = createMockUnit({ id: 'enemy', instanceId: 'enemy_1', team: 'bot' });
    const results = processAttackPassives(warlock, enemy, 50, 1, 12345);
    expect(results).toHaveLength(1);
    expect(results[0]?.passiveId).toBe('lifesteal');
  });

  test('processAttackPassives triggers thorns for guardian defender', () => {
    const attacker = createMockUnit({ id: 'enemy', instanceId: 'enemy_1', team: 'bot' });
    const guardian = createMockUnit({ id: 'guardian', instanceId: 'guardian_1' });
    const results = processAttackPassives(attacker, guardian, 50, 1, 12345);
    expect(results).toHaveLength(1);
    expect(results[0]?.passiveId).toBe('thorns');
  });

  test('processAttackPassives triggers both lifesteal and thorns', () => {
    const warlock = createMockUnit({ id: 'warlock', instanceId: 'warlock_1', currentHp: 50, maxHp: 100 });
    const guardian = createMockUnit({ id: 'guardian', instanceId: 'guardian_1' });
    const results = processAttackPassives(warlock, guardian, 50, 1, 12345);
    expect(results).toHaveLength(2);
    expect(results.some(r => r.passiveId === 'lifesteal')).toBe(true);
    expect(results.some(r => r.passiveId === 'thorns')).toBe(true);
  });
});

describe('Passive Results Application', () => {
  test('applyPassiveResults applies lifesteal healing', () => {
    const warlock = createMockUnit({ id: 'warlock', instanceId: 'warlock_1', currentHp: 50, maxHp: 100 });
    const state = createMockBattleState([warlock]);
    const results = [{ triggered: true, passiveId: 'lifesteal' as const, unitId: 'warlock_1', effect: { type: 'heal' as const, value: 10, isPercentage: false, duration: 0 } }];
    const newState = applyPassiveResults(state, results);
    const updatedWarlock = newState.units.find(u => u.instanceId === 'warlock_1');
    expect(updatedWarlock?.currentHp).toBe(60);
  });

  test('applyPassiveResults applies thorns damage', () => {
    const guardian = createMockUnit({ id: 'guardian', instanceId: 'guardian_1' });
    const attacker = createMockUnit({ id: 'enemy', instanceId: 'enemy_1', team: 'bot', currentHp: 100 });
    const state = createMockBattleState([guardian, attacker]);
    const results = [{ triggered: true, passiveId: 'thorns' as const, unitId: 'guardian_1', effect: { type: 'damage' as const, value: 10, isPercentage: false, duration: 0 }, event: { round: 1, type: 'damage' as const, actorId: 'guardian_1', targetId: 'enemy_1', damage: 10 } }];
    const newState = applyPassiveResults(state, results);
    const updatedAttacker = newState.units.find(u => u.instanceId === 'enemy_1');
    expect(updatedAttacker?.currentHp).toBe(90);
  });

  test('applyPassiveResults kills unit when thorns damage is lethal', () => {
    const guardian = createMockUnit({ id: 'guardian', instanceId: 'guardian_1' });
    const attacker = createMockUnit({ id: 'enemy', instanceId: 'enemy_1', team: 'bot', currentHp: 5 });
    const state = createMockBattleState([guardian, attacker]);
    const results = [{ triggered: true, passiveId: 'thorns' as const, unitId: 'guardian_1', effect: { type: 'damage' as const, value: 10, isPercentage: false, duration: 0 }, event: { round: 1, type: 'damage' as const, actorId: 'guardian_1', targetId: 'enemy_1', damage: 10 } }];
    const newState = applyPassiveResults(state, results);
    const updatedAttacker = newState.units.find(u => u.instanceId === 'enemy_1');
    expect(updatedAttacker?.currentHp).toBe(0);
    expect(updatedAttacker?.alive).toBe(false);
  });

  test('applyPassiveResults handles empty results array', () => {
    const unit = createMockUnit({ instanceId: 'unit_1' });
    const state = createMockBattleState([unit]);
    const newState = applyPassiveResults(state, []);
    expect(newState.units).toHaveLength(1);
    expect(newState.units[0]?.currentHp).toBe(100);
  });
});

describe('getPassiveEvents', () => {
  test('extracts events from triggered results', () => {
    const results = [
      { triggered: true, passiveId: 'lifesteal' as const, unitId: 'warlock_1', event: { round: 1, type: 'heal' as const, actorId: 'warlock_1', targetId: 'warlock_1', healing: 10 } },
      { triggered: true, passiveId: 'thorns' as const, unitId: 'guardian_1', event: { round: 1, type: 'damage' as const, actorId: 'guardian_1', targetId: 'enemy_1', damage: 5 } },
    ];
    const events = getPassiveEvents(results);
    expect(events).toHaveLength(2);
  });

  test('filters out non-triggered results', () => {
    const results = [
      { triggered: false, passiveId: 'lifesteal' as const, unitId: 'mage_1' },
      { triggered: true, passiveId: 'thorns' as const, unitId: 'guardian_1', event: { round: 1, type: 'damage' as const, actorId: 'guardian_1', targetId: 'enemy_1', damage: 5 } },
    ];
    const events = getPassiveEvents(results);
    expect(events).toHaveLength(1);
  });

  test('returns empty array for empty input', () => {
    const events = getPassiveEvents([]);
    expect(events).toHaveLength(0);
  });
});

describe('PASSIVE_CONSTANTS', () => {
  test('evasion dodge bonus is 15%', () => {
    expect(PASSIVE_CONSTANTS.EVASION_DODGE_BONUS).toBe(0.15);
  });

  test('rage attack bonus is 50%', () => {
    expect(PASSIVE_CONSTANTS.RAGE_ATK_BONUS).toBe(0.5);
  });

  test('rage HP threshold is 50%', () => {
    expect(PASSIVE_CONSTANTS.RAGE_HP_THRESHOLD).toBe(0.5);
  });

  test('thorns reflect percent is 20%', () => {
    expect(PASSIVE_CONSTANTS.THORNS_REFLECT_PERCENT).toBe(0.2);
  });

  test('lifesteal percent is 20%', () => {
    expect(PASSIVE_CONSTANTS.LIFESTEAL_PERCENT).toBe(0.2);
  });
});

describe('updateConditionalPassives', () => {
  test('activates rage when HP drops below 50%', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 40, maxHp: 100, rageActive: false });
    const result = updateConditionalPassives(berserker);
    expect(result.rageActive).toBe(true);
  });

  test('deactivates rage when HP goes above 50%', () => {
    const berserker = createMockUnit({ id: 'berserker', currentHp: 60, maxHp: 100, rageActive: true, passiveEffects: [{ passiveId: 'rage', type: 'stat_modifier', stat: 'attack', value: 0.5, isPercentage: true, remainingDuration: -1 }] });
    const result = updateConditionalPassives(berserker);
    expect(result.rageActive).toBe(false);
  });

  test('does nothing for units without conditional passives', () => {
    const knight = createMockUnit({ id: 'knight', currentHp: 40, maxHp: 100 });
    const result = updateConditionalPassives(knight);
    expect(result.rageActive).toBeUndefined();
  });
});
