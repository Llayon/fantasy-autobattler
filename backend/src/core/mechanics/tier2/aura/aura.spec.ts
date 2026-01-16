/**
 * Tier 2: Aura Processor Tests
 *
 * Tests for the aura system which allows units to project area effects
 * that influence nearby allies or enemies.
 *
 * @module core/mechanics/tier2/aura
 */

import { createAuraProcessor } from './aura.processor';
import type { Aura, UnitWithAura } from './aura.types';
import type { BattleState, BattleUnit, TeamType } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a test unit with optional aura properties.
 */
function createTestUnit(
  overrides: Partial<BattleUnit & UnitWithAura> = {},
): BattleUnit & UnitWithAura {
  return {
    id: 'unit_1',
    name: 'Test Unit',
    role: 'tank',
    cost: 5,
    team: 'player' as TeamType,
    position: { x: 0, y: 0 },
    currentHp: 100,
    maxHp: 100,
    alive: true,
    range: 1,
    abilities: [],
    instanceId: 'unit_1_instance',
    stats: {
      hp: 100,
      atk: 10,
      armor: 5,
      speed: 3,
      initiative: 10,
      dodge: 0,
      atkCount: 1,
    },
    auras: [],
    activeAuraBuffs: [],
    auraImmunities: [],
    ...overrides,
  };
}


/**
 * Creates a test battle state with given units.
 */
function createTestState(units: BattleUnit[]): BattleState {
  return {
    units,
    round: 1,
    events: [],
  };
}

/**
 * Creates a leadership aura (static, allies, +10% ATK).
 */
function createLeadershipAura(): Aura {
  return {
    id: 'leadership',
    name: 'Leadership',
    type: 'static',
    target: 'allies',
    range: 2,
    effect: {
      type: 'buff_stat',
      stat: 'atk',
      value: 0.1,
      isPercentage: true,
    },
    stackable: false,
  };
}

/**
 * Creates a fear aura (static, enemies, -10% ATK).
 */
function createFearAura(): Aura {
  return {
    id: 'fear',
    name: 'Fear',
    type: 'static',
    target: 'enemies',
    range: 2,
    effect: {
      type: 'debuff_stat',
      stat: 'atk',
      value: 0.1,
      isPercentage: true,
    },
    stackable: false,
  };
}

/**
 * Creates a healing pulse aura (pulse, allies, heal 10 HP).
 */
function createHealingPulseAura(): Aura {
  return {
    id: 'healing_pulse',
    name: 'Healing Pulse',
    type: 'pulse',
    target: 'allies',
    range: 2,
    effect: {
      type: 'heal',
      value: 10,
      isPercentage: false,
    },
    stackable: false,
    pulseInterval: 1,
  };
}


// ═══════════════════════════════════════════════════════════════
// STATIC AURA TESTS
// ═══════════════════════════════════════════════════════════════

describe('AuraProcessor', () => {
  describe('Static Auras', () => {
    describe('getUnitsInRange', () => {
      it('should find allies within aura range', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const ally1 = createTestUnit({
          id: 'ally_1',
          instanceId: 'ally_1_instance',
          team: 'player',
          position: { x: 3, y: 2 }, // Distance 1
        });

        const ally2 = createTestUnit({
          id: 'ally_2',
          instanceId: 'ally_2_instance',
          team: 'player',
          position: { x: 4, y: 2 }, // Distance 2
        });

        const allyOutOfRange = createTestUnit({
          id: 'ally_3',
          instanceId: 'ally_3_instance',
          team: 'player',
          position: { x: 5, y: 2 }, // Distance 3 (out of range)
        });

        const state = createTestState([leader, ally1, ally2, allyOutOfRange]);
        const unitsInRange = processor.getUnitsInRange(leader, leadershipAura, state);

        expect(unitsInRange).toHaveLength(2);
        expect(unitsInRange.map((u) => u.id)).toContain('ally_1');
        expect(unitsInRange.map((u) => u.id)).toContain('ally_2');
        expect(unitsInRange.map((u) => u.id)).not.toContain('ally_3');
      });


      it('should find enemies within aura range for enemy-targeting auras', () => {
        const processor = createAuraProcessor();
        const fearAura = createFearAura();

        const source = createTestUnit({
          id: 'source',
          instanceId: 'source_instance',
          team: 'player',
          position: { x: 2, y: 2 },
          auras: [fearAura],
        });

        const enemy1 = createTestUnit({
          id: 'enemy_1',
          instanceId: 'enemy_1_instance',
          team: 'bot',
          position: { x: 3, y: 2 }, // Distance 1
        });

        const enemy2 = createTestUnit({
          id: 'enemy_2',
          instanceId: 'enemy_2_instance',
          team: 'bot',
          position: { x: 4, y: 2 }, // Distance 2
        });

        const state = createTestState([source, enemy1, enemy2]);
        const unitsInRange = processor.getUnitsInRange(source, fearAura, state);

        expect(unitsInRange).toHaveLength(2);
        expect(unitsInRange.map((u) => u.id)).toContain('enemy_1');
        expect(unitsInRange.map((u) => u.id)).toContain('enemy_2');
      });

      it('should not include dead units', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const aliveAlly = createTestUnit({
          id: 'ally_alive',
          instanceId: 'ally_alive_instance',
          team: 'player',
          position: { x: 3, y: 2 },
          alive: true,
        });

        const deadAlly = createTestUnit({
          id: 'ally_dead',
          instanceId: 'ally_dead_instance',
          team: 'player',
          position: { x: 4, y: 2 },
          alive: false,
          currentHp: 0,
        });

        const state = createTestState([leader, aliveAlly, deadAlly]);
        const unitsInRange = processor.getUnitsInRange(leader, leadershipAura, state);

        expect(unitsInRange).toHaveLength(1);
        expect(unitsInRange[0]?.id).toBe('ally_alive');
      });


      it('should not include the source unit for ally-targeting auras', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const state = createTestState([leader]);
        const unitsInRange = processor.getUnitsInRange(leader, leadershipAura, state);

        expect(unitsInRange).toHaveLength(0);
      });

      it('should return empty array if source is dead', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const deadLeader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
          alive: false,
          currentHp: 0,
        });

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
        });

        const state = createTestState([deadLeader, ally]);
        const unitsInRange = processor.getUnitsInRange(deadLeader, leadershipAura, state);

        expect(unitsInRange).toHaveLength(0);
      });
    });


    describe('applyStaticAuras', () => {
      it('should apply stat buff to allies in range', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
          stats: {
            hp: 100,
            atk: 20,
            armor: 5,
            speed: 3,
            initiative: 10,
            dodge: 0,
            atkCount: 1,
          },
        });

        const state = createTestState([leader, ally]);
        const newState = processor.applyStaticAuras(state);

        const updatedAlly = newState.units.find((u) => u.id === 'ally') as BattleUnit & UnitWithAura;
        expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
        expect(updatedAlly.activeAuraBuffs?.[0]?.auraId).toBe('leadership');
        expect(updatedAlly.activeAuraBuffs?.[0]?.stat).toBe('atk');
        expect(updatedAlly.activeAuraBuffs?.[0]?.isPercentage).toBe(true);
        expect(updatedAlly.activeAuraBuffs?.[0]?.value).toBe(0.1);
      });

      it('should apply stat debuff to enemies in range', () => {
        const processor = createAuraProcessor();
        const fearAura = createFearAura();

        const source = createTestUnit({
          id: 'source',
          instanceId: 'source_instance',
          team: 'player',
          position: { x: 2, y: 2 },
          auras: [fearAura],
        });

        const enemy = createTestUnit({
          id: 'enemy',
          instanceId: 'enemy_instance',
          team: 'bot',
          position: { x: 3, y: 2 },
        });

        const state = createTestState([source, enemy]);
        const newState = processor.applyStaticAuras(state);

        const updatedEnemy = newState.units.find((u) => u.id === 'enemy') as BattleUnit & UnitWithAura;
        expect(updatedEnemy.activeAuraBuffs).toHaveLength(1);
        expect(updatedEnemy.activeAuraBuffs?.[0]?.auraId).toBe('fear');
        expect(updatedEnemy.activeAuraBuffs?.[0]?.value).toBe(-0.1); // Negative for debuff
      });


      it('should not apply aura to units out of range', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 0, y: 0 },
          auras: [leadershipAura],
        });

        const farAlly = createTestUnit({
          id: 'far_ally',
          instanceId: 'far_ally_instance',
          team: 'player',
          position: { x: 5, y: 5 }, // Distance 10 (out of range 2)
        });

        const state = createTestState([leader, farAlly]);
        const newState = processor.applyStaticAuras(state);

        const updatedAlly = newState.units.find((u) => u.id === 'far_ally') as BattleUnit & UnitWithAura;
        expect(updatedAlly.activeAuraBuffs).toHaveLength(0);
      });

      it('should clear old aura buffs when recalculating', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
          activeAuraBuffs: [
            {
              auraId: 'old_aura',
              sourceId: 'old_source',
              stat: 'armor',
              value: 5,
              isPercentage: false,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([leader, ally]);
        const newState = processor.applyStaticAuras(state);

        const updatedAlly = newState.units.find((u) => u.id === 'ally') as BattleUnit & UnitWithAura;
        // Old buff should be cleared, only new leadership buff should exist
        expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
        expect(updatedAlly.activeAuraBuffs?.[0]?.auraId).toBe('leadership');
      });


      it('should handle multiple auras from different sources', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader1 = createTestUnit({
          id: 'leader_1',
          instanceId: 'leader_1_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const leader2 = createTestUnit({
          id: 'leader_2',
          instanceId: 'leader_2_instance',
          position: { x: 4, y: 2 },
          auras: [leadershipAura],
        });

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          position: { x: 3, y: 2 }, // In range of both leaders
        });

        const state = createTestState([leader1, leader2, ally]);
        const newState = processor.applyStaticAuras(state);

        const updatedAlly = newState.units.find((u) => u.id === 'ally') as BattleUnit & UnitWithAura;
        // Should have buffs from both leaders
        expect(updatedAlly.activeAuraBuffs).toHaveLength(2);
        expect(updatedAlly.activeAuraBuffs?.map((b) => b.sourceId)).toContain('leader_1');
        expect(updatedAlly.activeAuraBuffs?.map((b) => b.sourceId)).toContain('leader_2');
      });
    });


    describe('getEffectiveStat', () => {
      it('should calculate effective stat with percentage buff', () => {
        const processor = createAuraProcessor();

        const unit = createTestUnit({
          id: 'unit',
          instanceId: 'unit_instance',
          stats: {
            hp: 100,
            atk: 20,
            armor: 5,
            speed: 3,
            initiative: 10,
            dodge: 0,
            atkCount: 1,
          },
          activeAuraBuffs: [
            {
              auraId: 'leadership',
              sourceId: 'leader',
              stat: 'atk',
              value: 0.1, // +10%
              isPercentage: true,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([unit]);
        const effectiveAtk = processor.getEffectiveStat(unit, 'atk', state);

        // Base 20 + 10% = 20 + 2 = 22
        expect(effectiveAtk).toBe(22);
      });

      it('should calculate effective stat with flat buff', () => {
        const processor = createAuraProcessor();

        const unit = createTestUnit({
          id: 'unit',
          instanceId: 'unit_instance',
          stats: {
            hp: 100,
            atk: 20,
            armor: 5,
            speed: 3,
            initiative: 10,
            dodge: 0,
            atkCount: 1,
          },
          activeAuraBuffs: [
            {
              auraId: 'strength',
              sourceId: 'source',
              stat: 'atk',
              value: 5, // +5 flat
              isPercentage: false,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([unit]);
        const effectiveAtk = processor.getEffectiveStat(unit, 'atk', state);

        // Base 20 + 5 = 25
        expect(effectiveAtk).toBe(25);
      });


      it('should calculate effective stat with debuff (negative value)', () => {
        const processor = createAuraProcessor();

        const unit = createTestUnit({
          id: 'unit',
          instanceId: 'unit_instance',
          stats: {
            hp: 100,
            atk: 20,
            armor: 5,
            speed: 3,
            initiative: 10,
            dodge: 0,
            atkCount: 1,
          },
          activeAuraBuffs: [
            {
              auraId: 'fear',
              sourceId: 'source',
              stat: 'atk',
              value: -0.1, // -10%
              isPercentage: true,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([unit]);
        const effectiveAtk = processor.getEffectiveStat(unit, 'atk', state);

        // Base 20 - 10% = 20 - 2 = 18
        expect(effectiveAtk).toBe(18);
      });

      it('should stack multiple buffs for same stat', () => {
        const processor = createAuraProcessor();

        const unit = createTestUnit({
          id: 'unit',
          instanceId: 'unit_instance',
          stats: {
            hp: 100,
            atk: 20,
            armor: 5,
            speed: 3,
            initiative: 10,
            dodge: 0,
            atkCount: 1,
          },
          activeAuraBuffs: [
            {
              auraId: 'leadership_1',
              sourceId: 'leader_1',
              stat: 'atk',
              value: 0.1, // +10%
              isPercentage: true,
              stacks: 1,
            },
            {
              auraId: 'leadership_2',
              sourceId: 'leader_2',
              stat: 'atk',
              value: 0.1, // +10%
              isPercentage: true,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([unit]);
        const effectiveAtk = processor.getEffectiveStat(unit, 'atk', state);

        // Base 20 + 10% + 10% = 20 + 2 + 2 = 24
        expect(effectiveAtk).toBe(24);
      });

      it('should not go below 0 for effective stat', () => {
        const processor = createAuraProcessor();

        const unit = createTestUnit({
          id: 'unit',
          instanceId: 'unit_instance',
          stats: {
            hp: 100,
            atk: 10,
            armor: 5,
            speed: 3,
            initiative: 10,
            dodge: 0,
            atkCount: 1,
          },
          activeAuraBuffs: [
            {
              auraId: 'massive_debuff',
              sourceId: 'source',
              stat: 'atk',
              value: -20, // -20 flat (more than base)
              isPercentage: false,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([unit]);
        const effectiveAtk = processor.getEffectiveStat(unit, 'atk', state);

        // Should be clamped to 0
        expect(effectiveAtk).toBe(0);
      });
    });


    describe('handleUnitDeath', () => {
      it('should remove aura buffs from dead unit source', () => {
        const processor = createAuraProcessor();

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          activeAuraBuffs: [
            {
              auraId: 'leadership',
              sourceId: 'dead_leader',
              stat: 'atk',
              value: 0.1,
              isPercentage: true,
              stacks: 1,
            },
            {
              auraId: 'other_buff',
              sourceId: 'other_source',
              stat: 'armor',
              value: 2,
              isPercentage: false,
              stacks: 1,
            },
          ],
        });

        const state = createTestState([ally]);
        const newState = processor.handleUnitDeath(state, 'dead_leader');

        const updatedAlly = newState.units.find((u) => u.id === 'ally') as BattleUnit & UnitWithAura;
        expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
        expect(updatedAlly.activeAuraBuffs?.[0]?.sourceId).toBe('other_source');
      });
    });

    describe('removeAuraEffect', () => {
      it('should remove specific aura effect from unit', () => {
        const processor = createAuraProcessor();

        const unit = createTestUnit({
          id: 'unit',
          instanceId: 'unit_instance',
          activeAuraBuffs: [
            {
              auraId: 'leadership',
              sourceId: 'leader_1',
              stat: 'atk',
              value: 0.1,
              isPercentage: true,
              stacks: 1,
            },
            {
              auraId: 'leadership',
              sourceId: 'leader_2',
              stat: 'atk',
              value: 0.1,
              isPercentage: true,
              stacks: 1,
            },
          ],
        });

        const updatedUnit = processor.removeAuraEffect(unit, 'leadership', 'leader_1');

        expect(updatedUnit.activeAuraBuffs).toHaveLength(1);
        expect(updatedUnit.activeAuraBuffs?.[0]?.sourceId).toBe('leader_2');
      });
    });


    describe('recalculateAuras', () => {
      it('should recalculate all auras after state change', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
        });

        const state = createTestState([leader, ally]);
        const newState = processor.recalculateAuras(state);

        const updatedAlly = newState.units.find((u) => u.id === 'ally') as BattleUnit & UnitWithAura;
        expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
        expect(updatedAlly.activeAuraBuffs?.[0]?.auraId).toBe('leadership');
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PULSE AURA TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Pulse Auras', () => {
    describe('triggerPulseAuras', () => {
      it('should apply healing pulse to allies in range', () => {
        const processor = createAuraProcessor();
        const healingPulse = createHealingPulseAura();

        const healer = createTestUnit({
          id: 'healer',
          instanceId: 'healer_instance',
          position: { x: 2, y: 2 },
          auras: [healingPulse],
        });

        const woundedAlly = createTestUnit({
          id: 'wounded_ally',
          instanceId: 'wounded_ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
          currentHp: 50,
          maxHp: 100,
        });

        const state = createTestState([healer, woundedAlly]);
        const newState = processor.triggerPulseAuras(state, 12345);

        const updatedAlly = newState.units.find((u) => u.id === 'wounded_ally');
        expect(updatedAlly?.currentHp).toBe(60); // 50 + 10 heal
      });

      it('should not overheal beyond max HP', () => {
        const processor = createAuraProcessor();
        const healingPulse = createHealingPulseAura();

        const healer = createTestUnit({
          id: 'healer',
          instanceId: 'healer_instance',
          position: { x: 2, y: 2 },
          auras: [healingPulse],
        });

        const nearFullAlly = createTestUnit({
          id: 'near_full_ally',
          instanceId: 'near_full_ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
          currentHp: 95,
          maxHp: 100,
        });

        const state = createTestState([healer, nearFullAlly]);
        const newState = processor.triggerPulseAuras(state, 12345);

        const updatedAlly = newState.units.find((u) => u.id === 'near_full_ally');
        expect(updatedAlly?.currentHp).toBe(100); // Capped at max HP
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PHASE INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Phase Integration', () => {
    describe('apply', () => {
      it('should trigger pulse auras and recalculate static auras on turn_start', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();
        const healingPulse = createHealingPulseAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura, healingPulse],
        });

        const woundedAlly = createTestUnit({
          id: 'wounded_ally',
          instanceId: 'wounded_ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
          currentHp: 50,
          maxHp: 100,
        });

        const state = createTestState([leader, woundedAlly]);
        const context = {
          activeUnit: leader,
          seed: 12345,
        };

        const newState = processor.apply('turn_start', state, context);

        const updatedAlly = newState.units.find((u) => u.id === 'wounded_ally') as BattleUnit & UnitWithAura;
        // Should have healing applied
        expect(updatedAlly.currentHp).toBe(60);
        // Should have leadership buff
        expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
        expect(updatedAlly.activeAuraBuffs?.[0]?.auraId).toBe('leadership');
      });

      it('should recalculate auras on movement phase', () => {
        const processor = createAuraProcessor();
        const leadershipAura = createLeadershipAura();

        const leader = createTestUnit({
          id: 'leader',
          instanceId: 'leader_instance',
          position: { x: 2, y: 2 },
          auras: [leadershipAura],
        });

        const ally = createTestUnit({
          id: 'ally',
          instanceId: 'ally_instance',
          team: 'player',
          position: { x: 3, y: 2 },
        });

        const state = createTestState([leader, ally]);
        const context = {
          activeUnit: ally,
          seed: 12345,
        };

        const newState = processor.apply('movement', state, context);

        const updatedAlly = newState.units.find((u) => u.id === 'ally') as BattleUnit & UnitWithAura;
        expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
      });
    });
  });
});
