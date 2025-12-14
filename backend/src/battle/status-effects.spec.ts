/**
 * Unit tests for Status Effects System.
 * Tests buff/debuff application, stacking, duration, and stat modifications.
 */

import {
  createStatusEffect,
  applyStatusEffect,
  removeStatusEffect,
  tickStatusEffects,
  getModifiedStats,
  initializeUnitEffects,
  clearAllEffects,
  hasEffectType,
  getEffectsByType,
  getStatModifier,
  BattleUnitWithEffects,
} from './status-effects';
import { BattleUnit } from '../types/game.types';
import { BuffEffect, DebuffEffect, StunEffect, DotEffect, HotEffect, TauntEffect } from '../types/ability.types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create a test battle unit with default stats.
 */
function createTestUnit(overrides: Partial<BattleUnit> = {}): BattleUnit {
  return {
    id: 'knight',
    name: 'Knight',
    role: 'tank',
    cost: 5,
    stats: {
      hp: 100,
      atk: 15,
      atkCount: 1,
      armor: 10,
      speed: 2,
      initiative: 5,
      dodge: 10,
    },
    range: 1,
    abilities: ['shield_wall'],
    position: { x: 1, y: 0 },
    currentHp: 100,
    maxHp: 100,
    team: 'player',
    alive: true,
    instanceId: 'player_knight_0',
    ...overrides,
  };
}

/**
 * Create a test unit with effects initialized.
 */
function createTestUnitWithEffects(overrides: Partial<BattleUnit> = {}): BattleUnitWithEffects {
  return initializeUnitEffects(createTestUnit(overrides));
}

// =============================================================================
// EFFECT CREATION TESTS
// =============================================================================

describe('createStatusEffect', () => {
  it('should create a status effect with correct properties', () => {
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };

    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');

    expect(statusEffect.id).toMatch(/^effect_/);
    expect(statusEffect.sourceAbilityId).toBe('shield_wall');
    expect(statusEffect.sourceUnitId).toBe('player_knight_0');
    expect(statusEffect.effect).toEqual(buffEffect);
    expect(statusEffect.remainingDuration).toBe(3);
    expect(statusEffect.stacks).toBe(1);
  });

  it('should use provided duration over effect duration', () => {
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };

    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0', 5);

    expect(statusEffect.remainingDuration).toBe(5);
  });

  it('should default to duration 1 if not specified', () => {
    const stunEffect: StunEffect = {
      type: 'stun',
      duration: 0, // Will be overridden
    };

    // Create without duration in effect
    const effectWithoutDuration = { ...stunEffect, duration: undefined } as unknown as StunEffect;
    const statusEffect = createStatusEffect(effectWithoutDuration, 'stun_ability', 'player_mage_0');

    expect(statusEffect.remainingDuration).toBe(1);
  });
});

// =============================================================================
// EFFECT APPLICATION TESTS
// =============================================================================

describe('applyStatusEffect', () => {
  it('should apply a new buff effect to a unit', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');

    const result = applyStatusEffect(unit, statusEffect);

    expect(result.applied).toBe(true);
    expect(result.unit.statusEffects).toHaveLength(1);
    expect(result.unit.statusEffects[0]?.effect.type).toBe('buff');
    expect(result.message).toBe('Applied new effect');
  });

  it('should not apply effect to dead unit', () => {
    const unit = createTestUnitWithEffects({ alive: false, currentHp: 0 });
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');

    const result = applyStatusEffect(unit, statusEffect);

    expect(result.applied).toBe(false);
    expect(result.unit.statusEffects).toHaveLength(0);
    expect(result.message).toBe('Cannot apply effect to dead unit');
  });

  it('should refresh duration for non-stackable effects from same source', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
      stackable: false,
    };
    
    // Apply first effect
    const effect1 = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0', 2);
    const result1 = applyStatusEffect(unit, effect1);
    
    // Apply second effect from same source
    const effect2 = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0', 5);
    const result2 = applyStatusEffect(result1.unit, effect2);

    expect(result2.applied).toBe(true);
    expect(result2.unit.statusEffects).toHaveLength(1);
    expect(result2.unit.statusEffects[0]?.remainingDuration).toBe(5);
    expect(result2.message).toBe('Refreshed effect duration');
  });

  it('should stack stackable effects up to max stacks', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'attack',
      value: 2,
      duration: 3,
      stackable: true,
      maxStacks: 3,
    };
    
    let currentUnit = unit;
    
    // Apply 4 stacks (should cap at 3)
    for (let i = 0; i < 4; i++) {
      const effect = createStatusEffect(buffEffect, 'rage', 'player_berserker_0');
      const result = applyStatusEffect(currentUnit, effect);
      currentUnit = result.unit;
    }

    expect(currentUnit.statusEffects).toHaveLength(1);
    expect(currentUnit.statusEffects[0]?.stacks).toBe(3);
  });

  it('should set isStunned flag when stun effect is applied', () => {
    const unit = createTestUnitWithEffects();
    const stunEffect: StunEffect = {
      type: 'stun',
      duration: 2,
    };
    const statusEffect = createStatusEffect(stunEffect, 'stun_ability', 'player_mage_0');

    const result = applyStatusEffect(unit, statusEffect);

    expect(result.unit.isStunned).toBe(true);
  });

  it('should set hasTaunt flag when taunt effect is applied', () => {
    const unit = createTestUnitWithEffects();
    const tauntEffect: TauntEffect = {
      type: 'taunt',
      duration: 2,
    };
    const statusEffect = createStatusEffect(tauntEffect, 'taunt_ability', 'player_guardian_0');

    const result = applyStatusEffect(unit, statusEffect);

    expect(result.unit.hasTaunt).toBe(true);
  });
});

// =============================================================================
// EFFECT REMOVAL TESTS
// =============================================================================

describe('removeStatusEffect', () => {
  it('should remove a specific effect by ID', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');
    
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);
    const effectId = unitWithEffect.statusEffects[0]?.id ?? '';
    
    const updatedUnit = removeStatusEffect(unitWithEffect, effectId);

    expect(updatedUnit.statusEffects).toHaveLength(0);
  });

  it('should update stun flag when stun effect is removed', () => {
    const unit = createTestUnitWithEffects();
    const stunEffect: StunEffect = {
      type: 'stun',
      duration: 2,
    };
    const statusEffect = createStatusEffect(stunEffect, 'stun_ability', 'player_mage_0');
    
    const { unit: stunnedUnit } = applyStatusEffect(unit, statusEffect);
    expect(stunnedUnit.isStunned).toBe(true);
    
    const effectId = stunnedUnit.statusEffects[0]?.id ?? '';
    const updatedUnit = removeStatusEffect(stunnedUnit, effectId);

    expect(updatedUnit.isStunned).toBe(false);
  });
});

// =============================================================================
// EFFECT TICK TESTS
// =============================================================================

describe('tickStatusEffects', () => {
  it('should reduce duration of all effects by 1', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = tickStatusEffects(unitWithEffect);

    expect(result.unit.statusEffects[0]?.remainingDuration).toBe(2);
    expect(result.expiredEffects).toHaveLength(0);
  });

  it('should expire effects when duration reaches 0', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 1,
    };
    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = tickStatusEffects(unitWithEffect);

    expect(result.unit.statusEffects).toHaveLength(0);
    expect(result.expiredEffects).toHaveLength(1);
    expect(result.expiredEffects[0]?.sourceAbilityId).toBe('shield_wall');
  });

  it('should apply DoT damage', () => {
    const unit = createTestUnitWithEffects({ currentHp: 100 });
    const dotEffect: DotEffect = {
      type: 'dot',
      value: 10,
      damageType: 'magical',
      duration: 3,
    };
    const statusEffect = createStatusEffect(dotEffect, 'poison', 'bot_warlock_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = tickStatusEffects(unitWithEffect);

    expect(result.dotDamage).toBe(10);
    expect(result.unit.currentHp).toBe(90);
  });

  it('should apply HoT healing', () => {
    const unit = createTestUnitWithEffects({ currentHp: 50, maxHp: 100 });
    const hotEffect: HotEffect = {
      type: 'hot',
      value: 15,
      duration: 3,
    };
    const statusEffect = createStatusEffect(hotEffect, 'regeneration', 'player_priest_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = tickStatusEffects(unitWithEffect);

    expect(result.hotHealing).toBe(15);
    expect(result.unit.currentHp).toBe(65);
  });

  it('should not heal above max HP', () => {
    const unit = createTestUnitWithEffects({ currentHp: 95, maxHp: 100 });
    const hotEffect: HotEffect = {
      type: 'hot',
      value: 20,
      duration: 3,
    };
    const statusEffect = createStatusEffect(hotEffect, 'regeneration', 'player_priest_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = tickStatusEffects(unitWithEffect);

    expect(result.unit.currentHp).toBe(100);
  });

  it('should kill unit if DoT reduces HP to 0', () => {
    const unit = createTestUnitWithEffects({ currentHp: 5 });
    const dotEffect: DotEffect = {
      type: 'dot',
      value: 10,
      damageType: 'magical',
      duration: 3,
    };
    const statusEffect = createStatusEffect(dotEffect, 'poison', 'bot_warlock_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = tickStatusEffects(unitWithEffect);

    expect(result.unit.currentHp).toBe(0);
    expect(result.unit.alive).toBe(false);
  });

  it('should multiply DoT/HoT by stacks', () => {
    const unit = createTestUnitWithEffects({ currentHp: 100 });
    const dotEffect: DotEffect = {
      type: 'dot',
      value: 5,
      damageType: 'magical',
      duration: 3,
    };
    
    // Manually create a stacked effect
    const statusEffect = createStatusEffect(dotEffect, 'poison', 'bot_warlock_0');
    const stackedEffect = { ...statusEffect, stacks: 3 };
    
    const unitWithEffect: BattleUnitWithEffects = {
      ...unit,
      statusEffects: [stackedEffect],
    };

    const result = tickStatusEffects(unitWithEffect);

    expect(result.dotDamage).toBe(15); // 5 * 3 stacks
    expect(result.unit.currentHp).toBe(85);
  });
});

// =============================================================================
// STAT MODIFICATION TESTS
// =============================================================================

describe('getModifiedStats', () => {
  it('should return base stats when no effects are active', () => {
    const unit = createTestUnitWithEffects();

    const result = getModifiedStats(unit);

    expect(result.stats.atk).toBe(15);
    expect(result.stats.armor).toBe(10);
    expect(result.stats.speed).toBe(2);
  });

  it('should apply flat buff to stats', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = getModifiedStats(unitWithEffect);

    expect(result.stats.armor).toBe(15); // 10 + 5
    expect(result.modifications.armor.flat).toBe(5);
  });

  it('should apply percentage buff to stats', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'attack',
      percentage: 0.5, // +50%
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'rage', 'player_berserker_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = getModifiedStats(unitWithEffect);

    expect(result.stats.atk).toBe(23); // 15 * 1.5 = 22.5, rounded to 23
    expect(result.modifications.attack.percentage).toBe(0.5);
  });

  it('should apply flat debuff to stats', () => {
    const unit = createTestUnitWithEffects();
    const debuffEffect: DebuffEffect = {
      type: 'debuff',
      stat: 'armor',
      value: 5,
      duration: 3,
    };
    const statusEffect = createStatusEffect(debuffEffect, 'armor_break', 'bot_rogue_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = getModifiedStats(unitWithEffect);

    expect(result.stats.armor).toBe(5); // 10 - 5
    expect(result.modifications.armor.flat).toBe(-5);
  });

  it('should not reduce stats below minimum values', () => {
    const unit = createTestUnitWithEffects();
    const debuffEffect: DebuffEffect = {
      type: 'debuff',
      stat: 'armor',
      value: 100, // More than current armor
      duration: 3,
    };
    const statusEffect = createStatusEffect(debuffEffect, 'armor_shatter', 'bot_rogue_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = getModifiedStats(unitWithEffect);

    expect(result.stats.armor).toBe(0); // Minimum armor is 0
    expect(result.stats.atk).toBeGreaterThanOrEqual(1); // Minimum attack is 1
  });

  it('should cap dodge at 100%', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'dodge',
      value: 200, // Would exceed 100%
      duration: 3,
    };
    const statusEffect = createStatusEffect(buffEffect, 'evasion', 'player_rogue_0');
    const { unit: unitWithEffect } = applyStatusEffect(unit, statusEffect);

    const result = getModifiedStats(unitWithEffect);

    expect(result.stats.dodge).toBe(100);
  });

  it('should stack multiple effects on same stat', () => {
    const unit = createTestUnitWithEffects();
    
    // Apply two different armor buffs
    const buff1: BuffEffect = { type: 'buff', stat: 'armor', value: 3, duration: 3 };
    const buff2: BuffEffect = { type: 'buff', stat: 'armor', value: 2, duration: 3 };
    
    const effect1 = createStatusEffect(buff1, 'shield_wall', 'player_knight_0');
    const effect2 = createStatusEffect(buff2, 'iron_skin', 'player_guardian_0');
    
    let currentUnit = unit;
    currentUnit = applyStatusEffect(currentUnit, effect1).unit;
    currentUnit = applyStatusEffect(currentUnit, effect2).unit;

    const result = getModifiedStats(currentUnit);

    expect(result.stats.armor).toBe(15); // 10 + 3 + 2
  });

  it('should multiply effect value by stacks', () => {
    const unit = createTestUnitWithEffects();
    const buffEffect: BuffEffect = {
      type: 'buff',
      stat: 'attack',
      value: 2,
      duration: 3,
      stackable: true,
      maxStacks: 5,
    };
    
    // Create effect with 3 stacks
    const statusEffect = createStatusEffect(buffEffect, 'rage', 'player_berserker_0');
    const stackedEffect = { ...statusEffect, stacks: 3 };
    
    const unitWithEffect: BattleUnitWithEffects = {
      ...unit,
      statusEffects: [stackedEffect],
    };

    const result = getModifiedStats(unitWithEffect);

    expect(result.stats.atk).toBe(21); // 15 + (2 * 3)
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('initializeUnitEffects', () => {
  it('should add empty status effects array to unit', () => {
    const unit = createTestUnit();

    const unitWithEffects = initializeUnitEffects(unit);

    expect(unitWithEffects.statusEffects).toEqual([]);
    expect(unitWithEffects.isStunned).toBe(false);
    expect(unitWithEffects.hasTaunt).toBe(false);
  });
});

describe('clearAllEffects', () => {
  it('should remove all effects when no types specified', () => {
    const unit = createTestUnitWithEffects();
    
    // Apply multiple effects
    const buff: BuffEffect = { type: 'buff', stat: 'armor', value: 5, duration: 3 };
    const debuff: DebuffEffect = { type: 'debuff', stat: 'attack', value: 2, duration: 3 };
    
    let currentUnit = unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(buff, 'buff1', 'unit1')).unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(debuff, 'debuff1', 'unit2')).unit;

    const cleansedUnit = clearAllEffects(currentUnit);

    expect(cleansedUnit.statusEffects).toHaveLength(0);
  });

  it('should remove only specified effect types', () => {
    const unit = createTestUnitWithEffects();
    
    // Apply buff and debuff
    const buff: BuffEffect = { type: 'buff', stat: 'armor', value: 5, duration: 3 };
    const debuff: DebuffEffect = { type: 'debuff', stat: 'attack', value: 2, duration: 3 };
    
    let currentUnit = unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(buff, 'buff1', 'unit1')).unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(debuff, 'debuff1', 'unit2')).unit;

    const cleansedUnit = clearAllEffects(currentUnit, ['debuff']);

    expect(cleansedUnit.statusEffects).toHaveLength(1);
    expect(cleansedUnit.statusEffects[0]?.effect.type).toBe('buff');
  });
});

describe('hasEffectType', () => {
  it('should return true if unit has effect type', () => {
    const unit = createTestUnitWithEffects();
    const stunEffect: StunEffect = { type: 'stun', duration: 2 };
    const { unit: stunnedUnit } = applyStatusEffect(
      unit,
      createStatusEffect(stunEffect, 'stun1', 'unit1')
    );

    expect(hasEffectType(stunnedUnit, 'stun')).toBe(true);
    expect(hasEffectType(stunnedUnit, 'buff')).toBe(false);
  });
});

describe('getEffectsByType', () => {
  it('should return all effects of specified type', () => {
    const unit = createTestUnitWithEffects();
    
    // Apply multiple buffs
    const buff1: BuffEffect = { type: 'buff', stat: 'armor', value: 5, duration: 3 };
    const buff2: BuffEffect = { type: 'buff', stat: 'attack', value: 2, duration: 3 };
    const debuff: DebuffEffect = { type: 'debuff', stat: 'speed', value: 1, duration: 3 };
    
    let currentUnit = unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(buff1, 'buff1', 'unit1')).unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(buff2, 'buff2', 'unit2')).unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(debuff, 'debuff1', 'unit3')).unit;

    const buffs = getEffectsByType(currentUnit, 'buff');

    expect(buffs).toHaveLength(2);
  });
});

describe('getStatModifier', () => {
  it('should return total modifier for a stat', () => {
    const unit = createTestUnitWithEffects();
    
    // Apply buff and debuff to same stat
    const buff: BuffEffect = { type: 'buff', stat: 'armor', value: 5, duration: 3 };
    const debuff: DebuffEffect = { type: 'debuff', stat: 'armor', value: 2, duration: 3 };
    
    let currentUnit = unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(buff, 'buff1', 'unit1')).unit;
    currentUnit = applyStatusEffect(currentUnit, createStatusEffect(debuff, 'debuff1', 'unit2')).unit;

    const modifier = getStatModifier(currentUnit, 'armor');

    expect(modifier).toBe(3); // +5 - 2
  });
});
