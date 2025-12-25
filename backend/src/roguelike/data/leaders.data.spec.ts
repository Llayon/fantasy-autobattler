/**
 * Unit tests for Leader Data
 *
 * @module roguelike/data/leaders.spec
 */

import {
  // Passives
  PASSIVE_FORMATION,
  PASSIVE_LIFE_DRAIN,
  // Spells
  SPELL_HOLY_LIGHT,
  SPELL_RALLY,
  SPELL_DEATH_COIL,
  SPELL_RAISE_DEAD,
  SPELLS_DATA,
  getSpell,
  getSpellsByFaction,
  // Leaders
  LEADER_COMMANDER_ALDRIC,
  LEADER_LICH_KING_MALACHAR,
  LEADERS_DATA,
  getLeader,
  getLeadersByFaction,
  isValidLeader,
  getLeaderWithSpells,
  // Spell trigger functions
  shouldTriggerSpell,
  getSpellTimingThreshold,
  createSpellExecution,
  markSpellTriggered,
  UnitHpState,
} from './leaders.data';
import { SpellExecution, SPELL_TIMING_THRESHOLDS } from '../types/leader.types';

describe('Leaders Data', () => {
  describe('Passive Abilities', () => {
    describe('PASSIVE_FORMATION', () => {
      it('should have correct id and effect type', () => {
        expect(PASSIVE_FORMATION.id).toBe('formation');
        expect(PASSIVE_FORMATION.effectType).toBe('aura');
      });

      it('should grant +5 armor to adjacent allies', () => {
        expect(PASSIVE_FORMATION.effectValue).toBe(5);
        expect(PASSIVE_FORMATION.effectStat).toBe('armor');
        expect(PASSIVE_FORMATION.range).toBe(1);
      });

      it('should have English and Russian names', () => {
        expect(PASSIVE_FORMATION.name).toBe('Formation');
        expect(PASSIVE_FORMATION.nameRu).toBe('Построение');
      });
    });

    describe('PASSIVE_LIFE_DRAIN', () => {
      it('should have correct id and effect type', () => {
        expect(PASSIVE_LIFE_DRAIN.id).toBe('life_drain');
        expect(PASSIVE_LIFE_DRAIN.effectType).toBe('on_damage');
      });

      it('should heal 10% of damage dealt', () => {
        expect(PASSIVE_LIFE_DRAIN.effectValue).toBe(0.1);
      });
    });
  });

  describe('Spells', () => {
    describe('SPELL_HOLY_LIGHT', () => {
      it('should heal lowest HP ally for 30 HP', () => {
        expect(SPELL_HOLY_LIGHT.id).toBe('holy_light');
        expect(SPELL_HOLY_LIGHT.targetType).toBe('ally_lowest_hp');
        expect(SPELL_HOLY_LIGHT.effectType).toBe('heal');
        expect(SPELL_HOLY_LIGHT.effectValue).toBe(30);
      });

      it('should belong to humans faction', () => {
        expect(SPELL_HOLY_LIGHT.faction).toBe('humans');
      });

      it('should recommend mid timing', () => {
        expect(SPELL_HOLY_LIGHT.recommendedTiming).toBe('mid');
      });
    });

    describe('SPELL_RALLY', () => {
      it('should buff all allies with +15% ATK for 3 rounds', () => {
        expect(SPELL_RALLY.id).toBe('rally');
        expect(SPELL_RALLY.targetType).toBe('all_allies');
        expect(SPELL_RALLY.effectType).toBe('buff');
        expect(SPELL_RALLY.effectValue).toBe(0.15);
        expect(SPELL_RALLY.duration).toBe(3);
      });

      it('should recommend early timing', () => {
        expect(SPELL_RALLY.recommendedTiming).toBe('early');
      });
    });

    describe('SPELL_DEATH_COIL', () => {
      it('should deal 40 damage to enemy', () => {
        expect(SPELL_DEATH_COIL.id).toBe('death_coil');
        expect(SPELL_DEATH_COIL.targetType).toBe('enemy_highest_hp');
        expect(SPELL_DEATH_COIL.effectType).toBe('damage');
        expect(SPELL_DEATH_COIL.effectValue).toBe(40);
      });

      it('should belong to undead faction', () => {
        expect(SPELL_DEATH_COIL.faction).toBe('undead');
      });
    });

    describe('SPELL_RAISE_DEAD', () => {
      it('should summon 2 skeleton warriors', () => {
        expect(SPELL_RAISE_DEAD.id).toBe('raise_dead');
        expect(SPELL_RAISE_DEAD.targetType).toBe('summon');
        expect(SPELL_RAISE_DEAD.effectType).toBe('summon');
        expect(SPELL_RAISE_DEAD.effectValue).toBe(2);
      });

      it('should recommend late timing', () => {
        expect(SPELL_RAISE_DEAD.recommendedTiming).toBe('late');
      });
    });

    describe('SPELLS_DATA', () => {
      it('should contain all 4 spells', () => {
        expect(Object.keys(SPELLS_DATA)).toHaveLength(4);
        expect(SPELLS_DATA).toHaveProperty('holy_light');
        expect(SPELLS_DATA).toHaveProperty('rally');
        expect(SPELLS_DATA).toHaveProperty('death_coil');
        expect(SPELLS_DATA).toHaveProperty('raise_dead');
      });
    });

    describe('getSpell', () => {
      it('should return spell by id', () => {
        expect(getSpell('holy_light')).toBe(SPELL_HOLY_LIGHT);
        expect(getSpell('death_coil')).toBe(SPELL_DEATH_COIL);
      });

      it('should return undefined for unknown spell', () => {
        expect(getSpell('unknown')).toBeUndefined();
      });
    });

    describe('getSpellsByFaction', () => {
      it('should return 2 spells for humans', () => {
        const spells = getSpellsByFaction('humans');
        expect(spells).toHaveLength(2);
        expect(spells).toContain(SPELL_HOLY_LIGHT);
        expect(spells).toContain(SPELL_RALLY);
      });

      it('should return 2 spells for undead', () => {
        const spells = getSpellsByFaction('undead');
        expect(spells).toHaveLength(2);
        expect(spells).toContain(SPELL_DEATH_COIL);
        expect(spells).toContain(SPELL_RAISE_DEAD);
      });
    });
  });

  describe('Leaders', () => {
    describe('LEADER_COMMANDER_ALDRIC', () => {
      it('should have correct id and faction', () => {
        expect(LEADER_COMMANDER_ALDRIC.id).toBe('commander_aldric');
        expect(LEADER_COMMANDER_ALDRIC.faction).toBe('humans');
      });

      it('should have Formation passive', () => {
        expect(LEADER_COMMANDER_ALDRIC.passive).toBe(PASSIVE_FORMATION);
      });

      it('should have Holy Light and Rally spells', () => {
        expect(LEADER_COMMANDER_ALDRIC.spellIds).toEqual(['holy_light', 'rally']);
      });

      it('should have English and Russian names', () => {
        expect(LEADER_COMMANDER_ALDRIC.name).toBe('Commander Aldric');
        expect(LEADER_COMMANDER_ALDRIC.nameRu).toBe('Командир Алдрик');
      });
    });

    describe('LEADER_LICH_KING_MALACHAR', () => {
      it('should have correct id and faction', () => {
        expect(LEADER_LICH_KING_MALACHAR.id).toBe('lich_king_malachar');
        expect(LEADER_LICH_KING_MALACHAR.faction).toBe('undead');
      });

      it('should have Life Drain passive', () => {
        expect(LEADER_LICH_KING_MALACHAR.passive).toBe(PASSIVE_LIFE_DRAIN);
      });

      it('should have Death Coil and Raise Dead spells', () => {
        expect(LEADER_LICH_KING_MALACHAR.spellIds).toEqual(['death_coil', 'raise_dead']);
      });
    });

    describe('LEADERS_DATA', () => {
      it('should contain 2 leaders in Phase 1', () => {
        expect(Object.keys(LEADERS_DATA)).toHaveLength(2);
      });
    });

    describe('getLeader', () => {
      it('should return leader by id', () => {
        expect(getLeader('commander_aldric')).toBe(LEADER_COMMANDER_ALDRIC);
        expect(getLeader('lich_king_malachar')).toBe(LEADER_LICH_KING_MALACHAR);
      });

      it('should return undefined for unknown leader', () => {
        expect(getLeader('unknown')).toBeUndefined();
      });
    });

    describe('getLeadersByFaction', () => {
      it('should return 1 leader for humans', () => {
        const leaders = getLeadersByFaction('humans');
        expect(leaders).toHaveLength(1);
        expect(leaders[0]).toBe(LEADER_COMMANDER_ALDRIC);
      });

      it('should return 1 leader for undead', () => {
        const leaders = getLeadersByFaction('undead');
        expect(leaders).toHaveLength(1);
        expect(leaders[0]).toBe(LEADER_LICH_KING_MALACHAR);
      });
    });

    describe('isValidLeader', () => {
      it('should return true for valid leaders', () => {
        expect(isValidLeader('commander_aldric')).toBe(true);
        expect(isValidLeader('lich_king_malachar')).toBe(true);
      });

      it('should return false for invalid leaders', () => {
        expect(isValidLeader('unknown')).toBe(false);
        expect(isValidLeader('')).toBe(false);
      });
    });

    describe('getLeaderWithSpells', () => {
      it('should return leader with resolved spell objects', () => {
        const leader = getLeaderWithSpells('commander_aldric');
        expect(leader).toBeDefined();
        expect(leader?.id).toBe('commander_aldric');
        expect(leader?.spells).toHaveLength(2);
        expect(leader?.spells[0]).toBe(SPELL_HOLY_LIGHT);
        expect(leader?.spells[1]).toBe(SPELL_RALLY);
      });

      it('should not have spellIds property', () => {
        const leader = getLeaderWithSpells('commander_aldric');
        expect(leader).not.toHaveProperty('spellIds');
      });

      it('should return undefined for unknown leader', () => {
        expect(getLeaderWithSpells('unknown')).toBeUndefined();
      });
    });
  });

  describe('Spell Trigger Logic', () => {
    describe('shouldTriggerSpell', () => {
      describe('early timing', () => {
        it('should trigger immediately when not yet triggered', () => {
          const spell: SpellExecution = {
            spellId: 'rally',
            timing: 'early',
            triggered: false,
          };
          const units: UnitHpState[] = [{ currentHp: 100, maxHp: 100 }];

          expect(shouldTriggerSpell(spell, units)).toBe(true);
        });

        it('should trigger even with empty units array', () => {
          const spell: SpellExecution = {
            spellId: 'rally',
            timing: 'early',
            triggered: false,
          };

          expect(shouldTriggerSpell(spell, [])).toBe(true);
        });

        it('should not trigger if already triggered', () => {
          const spell: SpellExecution = {
            spellId: 'rally',
            timing: 'early',
            triggered: true,
          };

          expect(shouldTriggerSpell(spell, [])).toBe(false);
        });
      });

      describe('mid timing (70% HP threshold)', () => {
        it('should trigger when any unit is below 70% HP', () => {
          const spell: SpellExecution = {
            spellId: 'holy_light',
            timing: 'mid',
            triggered: false,
          };
          const units: UnitHpState[] = [
            { currentHp: 100, maxHp: 100 }, // 100% HP
            { currentHp: 60, maxHp: 100 }, // 60% HP - below threshold
          ];

          expect(shouldTriggerSpell(spell, units)).toBe(true);
        });

        it('should not trigger when all units are at or above 70% HP', () => {
          const spell: SpellExecution = {
            spellId: 'holy_light',
            timing: 'mid',
            triggered: false,
          };
          const units: UnitHpState[] = [
            { currentHp: 100, maxHp: 100 }, // 100% HP
            { currentHp: 70, maxHp: 100 }, // 70% HP - at threshold
          ];

          expect(shouldTriggerSpell(spell, units)).toBe(false);
        });

        it('should trigger at exactly 69% HP', () => {
          const spell: SpellExecution = {
            spellId: 'holy_light',
            timing: 'mid',
            triggered: false,
          };
          const units: UnitHpState[] = [{ currentHp: 69, maxHp: 100 }];

          expect(shouldTriggerSpell(spell, units)).toBe(true);
        });

        it('should not trigger if already triggered', () => {
          const spell: SpellExecution = {
            spellId: 'holy_light',
            timing: 'mid',
            triggered: true,
          };
          const units: UnitHpState[] = [{ currentHp: 10, maxHp: 100 }];

          expect(shouldTriggerSpell(spell, units)).toBe(false);
        });
      });

      describe('late timing (40% HP threshold)', () => {
        it('should trigger when any unit is below 40% HP', () => {
          const spell: SpellExecution = {
            spellId: 'raise_dead',
            timing: 'late',
            triggered: false,
          };
          const units: UnitHpState[] = [
            { currentHp: 80, maxHp: 100 }, // 80% HP
            { currentHp: 35, maxHp: 100 }, // 35% HP - below threshold
          ];

          expect(shouldTriggerSpell(spell, units)).toBe(true);
        });

        it('should not trigger when all units are at or above 40% HP', () => {
          const spell: SpellExecution = {
            spellId: 'raise_dead',
            timing: 'late',
            triggered: false,
          };
          const units: UnitHpState[] = [
            { currentHp: 50, maxHp: 100 }, // 50% HP
            { currentHp: 40, maxHp: 100 }, // 40% HP - at threshold
          ];

          expect(shouldTriggerSpell(spell, units)).toBe(false);
        });

        it('should trigger at exactly 39% HP', () => {
          const spell: SpellExecution = {
            spellId: 'raise_dead',
            timing: 'late',
            triggered: false,
          };
          const units: UnitHpState[] = [{ currentHp: 39, maxHp: 100 }];

          expect(shouldTriggerSpell(spell, units)).toBe(true);
        });
      });

      describe('edge cases', () => {
        it('should handle unit with 0 maxHp (avoid division by zero)', () => {
          const spell: SpellExecution = {
            spellId: 'holy_light',
            timing: 'mid',
            triggered: false,
          };
          const units: UnitHpState[] = [{ currentHp: 0, maxHp: 0 }];

          expect(shouldTriggerSpell(spell, units)).toBe(false);
        });

        it('should handle empty units array for mid timing', () => {
          const spell: SpellExecution = {
            spellId: 'holy_light',
            timing: 'mid',
            triggered: false,
          };

          expect(shouldTriggerSpell(spell, [])).toBe(false);
        });

        it('should handle unit with 0 currentHp', () => {
          const spell: SpellExecution = {
            spellId: 'raise_dead',
            timing: 'late',
            triggered: false,
          };
          const units: UnitHpState[] = [{ currentHp: 0, maxHp: 100 }];

          expect(shouldTriggerSpell(spell, units)).toBe(true);
        });
      });
    });

    describe('getSpellTimingThreshold', () => {
      it('should return 1.0 for early timing', () => {
        expect(getSpellTimingThreshold('early')).toBe(1.0);
      });

      it('should return 0.7 for mid timing', () => {
        expect(getSpellTimingThreshold('mid')).toBe(0.7);
      });

      it('should return 0.4 for late timing', () => {
        expect(getSpellTimingThreshold('late')).toBe(0.4);
      });

      it('should match SPELL_TIMING_THRESHOLDS constant', () => {
        expect(getSpellTimingThreshold('early')).toBe(SPELL_TIMING_THRESHOLDS.early);
        expect(getSpellTimingThreshold('mid')).toBe(SPELL_TIMING_THRESHOLDS.mid);
        expect(getSpellTimingThreshold('late')).toBe(SPELL_TIMING_THRESHOLDS.late);
      });
    });

    describe('createSpellExecution', () => {
      it('should create spell execution with triggered set to false', () => {
        const execution = createSpellExecution('holy_light', 'mid');

        expect(execution.spellId).toBe('holy_light');
        expect(execution.timing).toBe('mid');
        expect(execution.triggered).toBe(false);
      });

      it('should work with all timing types', () => {
        const early = createSpellExecution('rally', 'early');
        const mid = createSpellExecution('holy_light', 'mid');
        const late = createSpellExecution('raise_dead', 'late');

        expect(early.timing).toBe('early');
        expect(mid.timing).toBe('mid');
        expect(late.timing).toBe('late');
      });
    });

    describe('markSpellTriggered', () => {
      it('should set triggered to true', () => {
        const spell = createSpellExecution('rally', 'early');
        expect(spell.triggered).toBe(false);

        markSpellTriggered(spell);
        expect(spell.triggered).toBe(true);
      });

      it('should return the same spell object', () => {
        const spell = createSpellExecution('rally', 'early');
        const result = markSpellTriggered(spell);

        expect(result).toBe(spell);
      });

      it('should work on already triggered spell', () => {
        const spell = createSpellExecution('rally', 'early');
        spell.triggered = true;

        markSpellTriggered(spell);
        expect(spell.triggered).toBe(true);
      });
    });
  });
});
