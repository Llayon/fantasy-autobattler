/**
 * Unit tests for Units Data
 *
 * @module roguelike/data/units.spec
 */

import {
  // Humans
  HUMANS_T1_UNITS,
  HUMANS_UPGRADE_LINES,
  HUMANS_ALL_UNITS,
  FOOTMAN_T1,
  FOOTMAN_LINE,
  PRIEST_T1,
  // Undead
  UNDEAD_T1_UNITS,
  UNDEAD_UPGRADE_LINES,
  UNDEAD_ALL_UNITS,
  ZOMBIE_T1,
  ZOMBIE_LINE,
  GHOUL_T1,
  NECROMANCER_T1,
  VAMPIRE_T1,
  // Starter decks
  HUMANS_STARTER_DECK,
  UNDEAD_STARTER_DECK,
  STARTER_DECKS,
  getStarterDeck,
  getStarterDeckUnitCount,
  expandStarterDeck,
  isValidStarterDeck,
} from './index';
import {
  calculateUpgradeCost,
  calculateTotalCost,
  TIER_STAT_MULTIPLIERS,
} from '../types/unit.types';

describe('Units Data', () => {
  describe('Humans Units', () => {
    it('should have exactly 12 T1 units', () => {
      expect(HUMANS_T1_UNITS).toHaveLength(12);
    });

    it('should have 12 upgrade lines', () => {
      expect(HUMANS_UPGRADE_LINES).toHaveLength(12);
    });

    it('should have 36 total units (12 × 3 tiers)', () => {
      expect(HUMANS_ALL_UNITS).toHaveLength(36);
    });

    it('should have all T1 units purchasable', () => {
      HUMANS_T1_UNITS.forEach((unit) => {
        expect(unit.purchasable).toBe(true);
        expect(unit.tier).toBe(1);
        expect(unit.faction).toBe('humans');
      });
    });

    it('should have correct role distribution', () => {
      const roles = HUMANS_T1_UNITS.map((u) => u.role);
      expect(roles.filter((r) => r === 'tank')).toHaveLength(3);
      expect(roles.filter((r) => r === 'melee_dps')).toHaveLength(3);
      expect(roles.filter((r) => r === 'ranged_dps')).toHaveLength(3);
      expect(roles.filter((r) => r === 'mage')).toHaveLength(2);
      expect(roles.filter((r) => r === 'support')).toHaveLength(1);
    });

    describe('Footman upgrade line', () => {
      it('should have correct T1 stats', () => {
        expect(FOOTMAN_T1.hp).toBe(100);
        expect(FOOTMAN_T1.atk).toBe(12);
        expect(FOOTMAN_T1.armor).toBe(20);
        expect(FOOTMAN_T1.cost).toBe(3);
      });

      it('should have T2 with +50% stats', () => {
        const t2 = FOOTMAN_LINE.t2;
        expect(t2.hp).toBe(150); // 100 * 1.5
        expect(t2.atk).toBe(18); // 12 * 1.5
        expect(t2.armor).toBe(30); // 20 * 1.5
        expect(t2.purchasable).toBe(false);
        expect(t2.upgradeCost).toBe(3); // 100% of T1 cost
      });

      it('should have T3 with +100% stats and ability', () => {
        const t3 = FOOTMAN_LINE.t3;
        expect(t3.hp).toBe(200); // 100 * 2
        expect(t3.atk).toBe(24); // 12 * 2
        expect(t3.armor).toBe(40); // 20 * 2
        expect(t3.purchasable).toBe(false);
        expect(t3.upgradeCost).toBe(5); // 150% of T1 cost, rounded
        expect(t3.abilityId).toBe('shield_wall');
      });
    });

    describe('Priest (support)', () => {
      it('should have inspiring resolve trait', () => {
        expect(PRIEST_T1.resolveTrait).toBe('inspiring');
      });

      it('should have support role', () => {
        expect(PRIEST_T1.role).toBe('support');
      });
    });
  });

  describe('Undead Units', () => {
    it('should have exactly 12 T1 units', () => {
      expect(UNDEAD_T1_UNITS).toHaveLength(12);
    });

    it('should have 12 upgrade lines', () => {
      expect(UNDEAD_UPGRADE_LINES).toHaveLength(12);
    });

    it('should have 36 total units (12 × 3 tiers)', () => {
      expect(UNDEAD_ALL_UNITS).toHaveLength(36);
    });

    it('should have all T1 units purchasable', () => {
      UNDEAD_T1_UNITS.forEach((unit) => {
        expect(unit.purchasable).toBe(true);
        expect(unit.tier).toBe(1);
        expect(unit.faction).toBe('undead');
      });
    });

    it('should have all undead with 100 resolve', () => {
      UNDEAD_ALL_UNITS.forEach((unit) => {
        expect(unit.resolve).toBe(100);
      });
    });

    it('should have correct role distribution', () => {
      const roles = UNDEAD_T1_UNITS.map((u) => u.role);
      expect(roles.filter((r) => r === 'tank')).toHaveLength(3);
      expect(roles.filter((r) => r === 'melee_dps')).toHaveLength(3);
      expect(roles.filter((r) => r === 'ranged_dps')).toHaveLength(3);
      expect(roles.filter((r) => r === 'mage')).toHaveLength(2);
      expect(roles.filter((r) => r === 'support')).toHaveLength(1);
    });

    describe('Zombie upgrade line', () => {
      it('should have correct T1 stats', () => {
        expect(ZOMBIE_T1.hp).toBe(120);
        expect(ZOMBIE_T1.atk).toBe(10);
        expect(ZOMBIE_T1.speed).toBe(1); // Slow
        expect(ZOMBIE_T1.dodge).toBe(0); // No dodge
      });

      it('should maintain 100 resolve at all tiers', () => {
        expect(ZOMBIE_LINE.t1.resolve).toBe(100);
        expect(ZOMBIE_LINE.t2.resolve).toBe(100);
        expect(ZOMBIE_LINE.t3.resolve).toBe(100);
      });
    });

    describe('Ghoul (multi-attack)', () => {
      it('should have 2 attacks at T1', () => {
        expect(GHOUL_T1.attackCount).toBe(2);
      });

      it('should have 3 attacks at T3', () => {
        const t3 = UNDEAD_UPGRADE_LINES.find((l) => l.baseId === 'ghoul')?.t3;
        expect(t3?.attackCount).toBe(3);
      });
    });

    describe('Support units with auras', () => {
      it('should have necromancer with inspiring trait', () => {
        expect(NECROMANCER_T1.resolveTrait).toBe('inspiring');
      });

      it('should have vampire with inspiring trait', () => {
        expect(VAMPIRE_T1.resolveTrait).toBe('inspiring');
      });
    });
  });

  describe('Upgrade Cost Calculations', () => {
    it('should calculate T2 upgrade cost as 100% of T1', () => {
      expect(calculateUpgradeCost(3, 2)).toBe(3);
      expect(calculateUpgradeCost(5, 2)).toBe(5);
      expect(calculateUpgradeCost(8, 2)).toBe(8);
    });

    it('should calculate T3 upgrade cost as 150% of T1 (rounded)', () => {
      expect(calculateUpgradeCost(3, 3)).toBe(5); // 3 * 1.5 = 4.5 → 5
      expect(calculateUpgradeCost(4, 3)).toBe(6); // 4 * 1.5 = 6
      expect(calculateUpgradeCost(5, 3)).toBe(8); // 5 * 1.5 = 7.5 → 8
      expect(calculateUpgradeCost(6, 3)).toBe(9); // 6 * 1.5 = 9
      expect(calculateUpgradeCost(7, 3)).toBe(11); // 7 * 1.5 = 10.5 → 11
      expect(calculateUpgradeCost(8, 3)).toBe(12); // 8 * 1.5 = 12
    });

    it('should calculate total cost to T3', () => {
      // 3g unit: 3 (buy) + 3 (T2) + 5 (T3) = 11
      expect(calculateTotalCost(3, 3)).toBe(11);
      // 5g unit: 5 (buy) + 5 (T2) + 8 (T3) = 18
      expect(calculateTotalCost(5, 3)).toBe(18);
      // 8g unit: 8 (buy) + 8 (T2) + 12 (T3) = 28
      expect(calculateTotalCost(8, 3)).toBe(28);
    });

    it('should return 0 for T1 upgrade cost', () => {
      expect(calculateUpgradeCost(5, 1)).toBe(0);
    });
  });

  describe('Tier Stat Multipliers', () => {
    it('should have correct multipliers', () => {
      expect(TIER_STAT_MULTIPLIERS[1]).toBe(1.0);
      expect(TIER_STAT_MULTIPLIERS[2]).toBe(1.5);
      expect(TIER_STAT_MULTIPLIERS[3]).toBe(2.0);
    });
  });

  describe('Starter Decks', () => {
    describe('HUMANS_STARTER_DECK', () => {
      it('should have exactly 12 units', () => {
        expect(getStarterDeckUnitCount(HUMANS_STARTER_DECK)).toBe(12);
      });

      it('should be valid', () => {
        expect(isValidStarterDeck(HUMANS_STARTER_DECK)).toBe(true);
      });

      it('should contain only humans units', () => {
        const humanUnitIds = HUMANS_T1_UNITS.map((u) => u.id);
        HUMANS_STARTER_DECK.units.forEach((entry) => {
          expect(humanUnitIds).toContain(entry.unitId);
        });
      });
    });

    describe('UNDEAD_STARTER_DECK', () => {
      it('should have exactly 12 units', () => {
        expect(getStarterDeckUnitCount(UNDEAD_STARTER_DECK)).toBe(12);
      });

      it('should be valid', () => {
        expect(isValidStarterDeck(UNDEAD_STARTER_DECK)).toBe(true);
      });

      it('should contain only undead units', () => {
        const undeadUnitIds = UNDEAD_T1_UNITS.map((u) => u.id);
        UNDEAD_STARTER_DECK.units.forEach((entry) => {
          expect(undeadUnitIds).toContain(entry.unitId);
        });
      });
    });

    describe('getStarterDeck', () => {
      it('should return correct deck for faction', () => {
        expect(getStarterDeck('humans')).toBe(HUMANS_STARTER_DECK);
        expect(getStarterDeck('undead')).toBe(UNDEAD_STARTER_DECK);
      });
    });

    describe('expandStarterDeck', () => {
      it('should expand to 12 individual cards', () => {
        const cards = expandStarterDeck(HUMANS_STARTER_DECK);
        expect(cards).toHaveLength(12);
      });

      it('should create unique instance IDs', () => {
        const cards = expandStarterDeck(HUMANS_STARTER_DECK);
        const instanceIds = cards.map((c) => c.instanceId);
        const uniqueIds = new Set(instanceIds);
        expect(uniqueIds.size).toBe(12);
      });

      it('should set all cards to tier 1', () => {
        const cards = expandStarterDeck(HUMANS_STARTER_DECK);
        cards.forEach((card) => {
          expect(card.tier).toBe(1);
        });
      });

      it('should create correct instance IDs for duplicates', () => {
        const cards = expandStarterDeck(HUMANS_STARTER_DECK);
        const footmanCards = cards.filter((c) => c.unitId === 'footman');
        expect(footmanCards).toHaveLength(2);
        expect(footmanCards[0]?.instanceId).toBe('footman-1');
        expect(footmanCards[1]?.instanceId).toBe('footman-2');
      });
    });

    describe('STARTER_DECKS', () => {
      it('should contain both factions', () => {
        expect(STARTER_DECKS).toHaveProperty('humans');
        expect(STARTER_DECKS).toHaveProperty('undead');
      });
    });
  });
});
