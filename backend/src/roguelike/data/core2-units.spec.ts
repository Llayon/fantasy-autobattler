/**
 * Core 2.0 Units Tests
 *
 * Verifies that Core 2.0 specialized units are properly defined
 * and integrated into the roguelike system.
 */

import {
  CORE2_T1_UNITS,
  CORE2_UPGRADE_LINES,
  CORE2_ALL_UNITS,
  CORE2_HUMANS_UNITS,
  CORE2_UNDEAD_UNITS,
  LIGHT_CAVALRY_T1,
  SPEARMAN_T1,
  HUNTER_T1,
  PLAGUE_BEARER_T1,
  WRAITH_T1,
  BONE_ARCHER_T1,
} from './core2-units';
import {
  ALL_T1_UNITS,
  ALL_UNITS,
  getUnitById,
  getT1UnitsByFaction,
  isCore2Unit,
  getCore2UnitsByFaction,
  getUnitStats,
} from './units.registry';

describe('Core 2.0 Units', () => {
  describe('Unit Definitions', () => {
    it('should have 6 T1 Core 2.0 units', () => {
      expect(CORE2_T1_UNITS).toHaveLength(6);
    });

    it('should have 6 upgrade lines', () => {
      expect(CORE2_UPGRADE_LINES).toHaveLength(6);
    });

    it('should have 18 total units (6 lines × 3 tiers)', () => {
      expect(CORE2_ALL_UNITS).toHaveLength(18);
    });

    it('should have 3 Humans Core 2.0 units', () => {
      expect(CORE2_HUMANS_UNITS).toHaveLength(3);
      expect(CORE2_HUMANS_UNITS.every((u) => u.faction === 'humans')).toBe(true);
    });

    it('should have 3 Undead Core 2.0 units', () => {
      expect(CORE2_UNDEAD_UNITS).toHaveLength(3);
      expect(CORE2_UNDEAD_UNITS.every((u) => u.faction === 'undead')).toBe(true);
    });
  });

  describe('Humans Core 2.0 Units', () => {
    describe('Light Cavalry (Charge)', () => {
      it('should have high speed for charge mechanic', () => {
        expect(LIGHT_CAVALRY_T1.speed).toBeGreaterThanOrEqual(4);
      });

      it('should be melee DPS role', () => {
        expect(LIGHT_CAVALRY_T1.role).toBe('melee_dps');
      });

      it('should mention Charge in description', () => {
        expect(LIGHT_CAVALRY_T1.description).toContain('Charge');
      });

      it('should have range 1 (melee)', () => {
        expect(LIGHT_CAVALRY_T1.range).toBe(1);
      });
    });

    describe('Spearman (Phalanx)', () => {
      it('should be tank role', () => {
        expect(SPEARMAN_T1.role).toBe('tank');
      });

      it('should mention Phalanx in description', () => {
        expect(SPEARMAN_T1.description).toContain('Phalanx');
      });

      it('should have decent armor for phalanx bonus', () => {
        expect(SPEARMAN_T1.armor).toBeGreaterThanOrEqual(10);
      });
    });

    describe('Hunter (Ammunition)', () => {
      it('should be ranged DPS role', () => {
        expect(HUNTER_T1.role).toBe('ranged_dps');
      });

      it('should mention Ammunition in description', () => {
        expect(HUNTER_T1.description).toContain('Ammunition');
      });

      it('should have range > 1', () => {
        expect(HUNTER_T1.range).toBeGreaterThan(1);
      });

      it('should have higher attack than basic archer', () => {
        expect(HUNTER_T1.atk).toBeGreaterThanOrEqual(20);
      });
    });
  });

  describe('Undead Core 2.0 Units', () => {
    describe('Plague Bearer (Contagion)', () => {
      it('should be tank role', () => {
        expect(PLAGUE_BEARER_T1.role).toBe('tank');
      });

      it('should mention Plague in description', () => {
        expect(PLAGUE_BEARER_T1.description).toContain('Plague');
      });

      it('should be slow (speed 1)', () => {
        expect(PLAGUE_BEARER_T1.speed).toBe(1);
      });

      it('should have 100 resolve (undead)', () => {
        expect(PLAGUE_BEARER_T1.resolve).toBe(100);
      });
    });

    describe('Wraith (Flanking & Riposte)', () => {
      it('should be melee DPS role', () => {
        expect(WRAITH_T1.role).toBe('melee_dps');
      });

      it('should mention Riposte in description', () => {
        expect(WRAITH_T1.description).toContain('Riposte');
      });

      it('should have high speed for flanking', () => {
        expect(WRAITH_T1.speed).toBeGreaterThanOrEqual(4);
      });

      it('should have high initiative for riposte', () => {
        expect(WRAITH_T1.initiative).toBeGreaterThanOrEqual(18);
      });

      it('should have high dodge', () => {
        expect(WRAITH_T1.dodge).toBeGreaterThanOrEqual(20);
      });
    });

    describe('Bone Archer (Ammunition)', () => {
      it('should be ranged DPS role', () => {
        expect(BONE_ARCHER_T1.role).toBe('ranged_dps');
      });

      it('should mention Ammunition in description', () => {
        expect(BONE_ARCHER_T1.description).toContain('Ammunition');
      });

      it('should have range > 1', () => {
        expect(BONE_ARCHER_T1.range).toBeGreaterThan(1);
      });

      it('should have 100 resolve (undead)', () => {
        expect(BONE_ARCHER_T1.resolve).toBe(100);
      });
    });
  });

  describe('Upgrade Lines', () => {
    it('should have T1, T2, T3 for each line', () => {
      CORE2_UPGRADE_LINES.forEach((line) => {
        expect(line.t1).toBeDefined();
        expect(line.t2).toBeDefined();
        expect(line.t3).toBeDefined();
        expect(line.t1.tier).toBe(1);
        expect(line.t2.tier).toBe(2);
        expect(line.t3.tier).toBe(3);
      });
    });

    it('should have correct baseUnitId for T2/T3', () => {
      CORE2_UPGRADE_LINES.forEach((line) => {
        expect(line.t2.baseUnitId).toBe(line.baseId);
        expect(line.t3.baseUnitId).toBe(line.baseId);
      });
    });

    it('should have upgrade costs for T2/T3', () => {
      CORE2_UPGRADE_LINES.forEach((line) => {
        expect(line.t2.upgradeCost).toBeGreaterThan(0);
        expect(line.t3.upgradeCost).toBeGreaterThan(0);
      });
    });

    it('should have abilities for T3 units', () => {
      CORE2_UPGRADE_LINES.forEach((line) => {
        expect(line.t3.abilityId).toBeDefined();
        expect(line.t3.abilityId).toBeTruthy();
      });
    });

    it('should have increased stats for T2/T3', () => {
      CORE2_UPGRADE_LINES.forEach((line) => {
        // T2 should have ~50% more stats than T1
        expect(line.t2.hp).toBeGreaterThan(line.t1.hp);
        expect(line.t2.atk).toBeGreaterThan(line.t1.atk);
        expect(line.t2.armor).toBeGreaterThan(line.t1.armor);

        // T3 should have ~100% more stats than T1
        expect(line.t3.hp).toBeGreaterThan(line.t2.hp);
        expect(line.t3.atk).toBeGreaterThan(line.t2.atk);
        expect(line.t3.armor).toBeGreaterThan(line.t2.armor);
      });
    });
  });

  describe('Registry Integration', () => {
    it('should include Core 2.0 units in ALL_T1_UNITS', () => {
      const core2Ids = CORE2_T1_UNITS.map((u) => u.id);
      core2Ids.forEach((id) => {
        expect(ALL_T1_UNITS.some((u) => u.id === id)).toBe(true);
      });
    });

    it('should include Core 2.0 units in ALL_UNITS', () => {
      const core2Ids = CORE2_ALL_UNITS.map((u) => u.id);
      core2Ids.forEach((id) => {
        expect(ALL_UNITS.some((u) => u.id === id)).toBe(true);
      });
    });

    it('should find Core 2.0 units by ID', () => {
      expect(getUnitById('light_cavalry')).toBeDefined();
      expect(getUnitById('spearman')).toBeDefined();
      expect(getUnitById('hunter')).toBeDefined();
      expect(getUnitById('plague_bearer')).toBeDefined();
      expect(getUnitById('wraith')).toBeDefined();
      expect(getUnitById('bone_archer')).toBeDefined();
    });

    it('should identify Core 2.0 units correctly', () => {
      expect(isCore2Unit('light_cavalry')).toBe(true);
      expect(isCore2Unit('spearman')).toBe(true);
      expect(isCore2Unit('hunter')).toBe(true);
      expect(isCore2Unit('plague_bearer')).toBe(true);
      expect(isCore2Unit('wraith')).toBe(true);
      expect(isCore2Unit('bone_archer')).toBe(true);

      // Non-Core 2.0 units
      expect(isCore2Unit('knight')).toBe(false);
      expect(isCore2Unit('zombie')).toBe(false);
    });

    it('should get Core 2.0 units by faction', () => {
      const humansCore2 = getCore2UnitsByFaction('humans');
      expect(humansCore2).toHaveLength(3);
      expect(humansCore2.map((u) => u.id)).toEqual(['light_cavalry', 'spearman', 'hunter']);

      const undeadCore2 = getCore2UnitsByFaction('undead');
      expect(undeadCore2).toHaveLength(3);
      expect(undeadCore2.map((u) => u.id)).toEqual(['plague_bearer', 'wraith', 'bone_archer']);
    });

    it('should include Core 2.0 in faction unit lists', () => {
      const humansT1 = getT1UnitsByFaction('humans');
      expect(humansT1.some((u) => u.id === 'light_cavalry')).toBe(true);
      expect(humansT1.some((u) => u.id === 'spearman')).toBe(true);
      expect(humansT1.some((u) => u.id === 'hunter')).toBe(true);

      const undeadT1 = getT1UnitsByFaction('undead');
      expect(undeadT1.some((u) => u.id === 'plague_bearer')).toBe(true);
      expect(undeadT1.some((u) => u.id === 'wraith')).toBe(true);
      expect(undeadT1.some((u) => u.id === 'bone_archer')).toBe(true);
    });

    it('should have correct unit statistics', () => {
      const stats = getUnitStats();
      
      // Should have base units + Core 2.0 units
      expect(stats.t1).toBeGreaterThanOrEqual(24 + 6); // 12 humans + 12 undead + 6 core2
      expect(stats.core2).toBe(18); // 6 lines × 3 tiers
      expect(stats.total).toBeGreaterThanOrEqual(72 + 18); // (24 base × 3 tiers) + 18 core2
    });
  });

  describe('Unit Validation', () => {
    it('should have valid cost range (3-8)', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.cost).toBeGreaterThanOrEqual(3);
        expect(unit.cost).toBeLessThanOrEqual(8);
      });
    });

    it('should have valid HP range', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.hp).toBeGreaterThan(0);
        expect(unit.hp).toBeLessThanOrEqual(300);
      });
    });

    it('should have valid attack range', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.atk).toBeGreaterThan(0);
        expect(unit.atk).toBeLessThanOrEqual(50);
      });
    });

    it('should have valid speed range (1-5)', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.speed).toBeGreaterThanOrEqual(1);
        expect(unit.speed).toBeLessThanOrEqual(5);
      });
    });

    it('should have valid initiative range', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.initiative).toBeGreaterThan(0);
        expect(unit.initiative).toBeLessThanOrEqual(25);
      });
    });

    it('should have valid range (1-7)', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.range).toBeGreaterThanOrEqual(1);
        expect(unit.range).toBeLessThanOrEqual(7);
      });
    });

    it('should have purchasable T1 units', () => {
      CORE2_T1_UNITS.forEach((unit) => {
        expect(unit.purchasable).toBe(true);
      });
    });

    it('should have non-purchasable T2/T3 units', () => {
      CORE2_UPGRADE_LINES.forEach((line) => {
        expect(line.t2.purchasable).toBe(false);
        expect(line.t3.purchasable).toBe(false);
      });
    });

    it('should have descriptions', () => {
      CORE2_ALL_UNITS.forEach((unit) => {
        expect(unit.description).toBeDefined();
        expect(unit.description).toBeTruthy();
        expect(unit.descriptionRu).toBeDefined();
        expect(unit.descriptionRu).toBeTruthy();
      });
    });
  });
});
