/**
 * Unit tests for Faction Data
 *
 * @module roguelike/data/factions.spec
 */

import {
  FACTIONS_DATA,
  FACTION_LIST,
  HUMANS_FACTION,
  UNDEAD_FACTION,
  getFaction,
  getFactionBasic,
  isValidFaction,
  applyFactionBonus,
} from './factions.data';

describe('Factions Data', () => {
  describe('FACTIONS_DATA', () => {
    it('should contain humans and undead factions', () => {
      expect(FACTIONS_DATA).toHaveProperty('humans');
      expect(FACTIONS_DATA).toHaveProperty('undead');
    });

    it('should have exactly 2 factions in Phase 1', () => {
      expect(Object.keys(FACTIONS_DATA)).toHaveLength(2);
    });
  });

  describe('FACTION_LIST', () => {
    it('should contain all factions as array', () => {
      expect(FACTION_LIST).toHaveLength(2);
      expect(FACTION_LIST).toContain(HUMANS_FACTION);
      expect(FACTION_LIST).toContain(UNDEAD_FACTION);
    });
  });

  describe('HUMANS_FACTION', () => {
    it('should have correct id', () => {
      expect(HUMANS_FACTION.id).toBe('humans');
    });

    it('should have +10% HP bonus', () => {
      expect(HUMANS_FACTION.bonus.stat).toBe('hp');
      expect(HUMANS_FACTION.bonus.value).toBe(0.1);
    });

    it('should have retreating broken behavior', () => {
      expect(HUMANS_FACTION.brokenBehavior).toBe('retreating');
    });

    it('should be able to self-recover resolve', () => {
      expect(HUMANS_FACTION.canSelfRecover).toBe(true);
      expect(HUMANS_FACTION.baseResolveRegen).toBeGreaterThan(0);
    });

    it('should have English and Russian names', () => {
      expect(HUMANS_FACTION.name).toBe('Humans');
      expect(HUMANS_FACTION.nameRu).toBe('Люди');
    });
  });

  describe('UNDEAD_FACTION', () => {
    it('should have correct id', () => {
      expect(UNDEAD_FACTION.id).toBe('undead');
    });

    it('should have +15% ATK bonus', () => {
      expect(UNDEAD_FACTION.bonus.stat).toBe('atk');
      expect(UNDEAD_FACTION.bonus.value).toBe(0.15);
    });

    it('should have crumbling broken behavior', () => {
      expect(UNDEAD_FACTION.brokenBehavior).toBe('crumbling');
    });

    it('should NOT be able to self-recover resolve', () => {
      expect(UNDEAD_FACTION.canSelfRecover).toBe(false);
      expect(UNDEAD_FACTION.baseResolveRegen).toBe(0);
    });

    it('should have English and Russian names', () => {
      expect(UNDEAD_FACTION.name).toBe('Undead');
      expect(UNDEAD_FACTION.nameRu).toBe('Нежить');
    });
  });

  describe('getFaction', () => {
    it('should return humans faction', () => {
      const faction = getFaction('humans');
      expect(faction).toBe(HUMANS_FACTION);
    });

    it('should return undead faction', () => {
      const faction = getFaction('undead');
      expect(faction).toBe(UNDEAD_FACTION);
    });
  });

  describe('getFactionBasic', () => {
    it('should return faction without resolve mechanics', () => {
      const basic = getFactionBasic('humans');
      expect(basic).toBeDefined();
      expect(basic?.id).toBe('humans');
      expect(basic?.bonus).toEqual({ stat: 'hp', value: 0.1 });
      // Should not have resolve-specific fields
      expect(basic).not.toHaveProperty('brokenBehavior');
      expect(basic).not.toHaveProperty('baseResolveRegen');
      expect(basic).not.toHaveProperty('canSelfRecover');
    });
  });

  describe('isValidFaction', () => {
    it('should return true for valid factions', () => {
      expect(isValidFaction('humans')).toBe(true);
      expect(isValidFaction('undead')).toBe(true);
    });

    it('should return false for invalid factions', () => {
      expect(isValidFaction('elves')).toBe(false);
      expect(isValidFaction('orcs')).toBe(false);
      expect(isValidFaction('')).toBe(false);
    });
  });

  describe('applyFactionBonus', () => {
    it('should apply HP bonus for humans', () => {
      const baseHp = 100;
      const result = applyFactionBonus(baseHp, HUMANS_FACTION, 'hp');
      expect(result).toBe(110); // 100 + 10%
    });

    it('should apply ATK bonus for undead', () => {
      const baseAtk = 100;
      const result = applyFactionBonus(baseAtk, UNDEAD_FACTION, 'atk');
      expect(result).toBe(115); // 100 + 15%
    });

    it('should not apply bonus to non-matching stat', () => {
      const baseAtk = 100;
      const result = applyFactionBonus(baseAtk, HUMANS_FACTION, 'atk');
      expect(result).toBe(100); // No change, humans bonus is HP
    });

    it('should round result to integer', () => {
      const baseHp = 55;
      const result = applyFactionBonus(baseHp, HUMANS_FACTION, 'hp');
      expect(result).toBe(61); // 55 * 1.1 = 60.5 → 61
    });
  });
});
