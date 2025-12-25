/**
 * Upgrade System Tests
 *
 * Unit tests and property-based tests for upgrade operations.
 *
 * @module core/progression/upgrade/spec
 */

import * as fc from 'fast-check';
import {
  getUpgradeCost,
  canUpgrade,
  upgradeCard,
  getStatMultiplier,
  getTierName,
  getMaxTier,
  isMaxTier,
} from './upgrade';
import { UpgradeConfig } from './upgrade.types';
import { BaseCard } from '../types';
import {
  STANDARD_TIERS,
  SIMPLE_TIERS,
  LEGENDARY_TIERS,
  ROGUELIKE_TIERS,
} from './upgrade.presets';
import { arbitraryBaseCard } from '../test-generators';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const createTestCard = (tier = 1): BaseCard => ({
  id: 'test-card',
  name: 'Test Card',
  baseCost: 10,
  tier,
});

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Upgrade System', () => {
  describe('getUpgradeCost', () => {
    it('should return cost for upgradeable card', () => {
      const card = createTestCard(1);
      const cost = getUpgradeCost(card, STANDARD_TIERS);

      expect(cost).toBe(200); // baseCost(10) * targetTier(2) * 10
    });

    it('should return Infinity for max tier card', () => {
      const card = createTestCard(3);
      const cost = getUpgradeCost(card, STANDARD_TIERS);

      expect(cost).toBe(Infinity);
    });

    it('should use config calculateCost function', () => {
      const card = createTestCard(1);
      const cost = getUpgradeCost(card, SIMPLE_TIERS);

      expect(cost).toBe(100); // 50 * targetTier(2)
    });
  });

  describe('canUpgrade', () => {
    it('should return true for upgradeable card', () => {
      const card = createTestCard(1);
      expect(canUpgrade(card, STANDARD_TIERS)).toBe(true);
    });

    it('should return false for max tier card', () => {
      const card = createTestCard(3);
      expect(canUpgrade(card, STANDARD_TIERS)).toBe(false);
    });

    it('should respect custom canUpgrade validator', () => {
      const card = createTestCard(1);
      const config: UpgradeConfig<BaseCard> = {
        ...STANDARD_TIERS,
        canUpgrade: (c) => c.baseCost > 20, // Only expensive cards
      };

      expect(canUpgrade(card, config)).toBe(false);
    });
  });

  describe('upgradeCard', () => {
    it('should increment tier by 1', () => {
      const card = createTestCard(1);
      const upgraded = upgradeCard(card, STANDARD_TIERS);

      expect(upgraded.tier).toBe(2);
    });

    it('should not mutate original card', () => {
      const card = createTestCard(1);
      upgradeCard(card, STANDARD_TIERS);

      expect(card.tier).toBe(1);
    });

    it('should throw for max tier card', () => {
      const card = createTestCard(3);

      expect(() => upgradeCard(card, STANDARD_TIERS)).toThrow(
        'Card cannot be upgraded',
      );
    });

    it('should preserve other card properties', () => {
      const card = createTestCard(1);
      const upgraded = upgradeCard(card, STANDARD_TIERS);

      expect(upgraded.id).toBe(card.id);
      expect(upgraded.name).toBe(card.name);
      expect(upgraded.baseCost).toBe(card.baseCost);
    });
  });

  describe('getStatMultiplier', () => {
    it('should return correct multiplier for each tier', () => {
      expect(getStatMultiplier(1, STANDARD_TIERS)).toBe(1.0);
      expect(getStatMultiplier(2, STANDARD_TIERS)).toBe(1.5);
      expect(getStatMultiplier(3, STANDARD_TIERS)).toBe(2.0);
    });

    it('should work with SIMPLE_TIERS linear scaling', () => {
      expect(getStatMultiplier(1, SIMPLE_TIERS)).toBe(1.0);
      expect(getStatMultiplier(2, SIMPLE_TIERS)).toBe(1.25);
      expect(getStatMultiplier(3, SIMPLE_TIERS)).toBe(1.5);
    });
  });

  describe('getTierName', () => {
    it('should return tier name from config', () => {
      expect(getTierName(1, STANDARD_TIERS)).toBe('T1');
      expect(getTierName(2, STANDARD_TIERS)).toBe('T2');
      expect(getTierName(3, STANDARD_TIERS)).toBe('T3');
    });

    it('should return fallback for invalid tier', () => {
      expect(getTierName(99, STANDARD_TIERS)).toBe('Tier 99');
    });

    it('should work with LEGENDARY_TIERS', () => {
      expect(getTierName(1, LEGENDARY_TIERS)).toBe('Common');
      expect(getTierName(4, LEGENDARY_TIERS)).toBe('Legendary');
    });
  });

  describe('getMaxTier', () => {
    it('should return max tier from config', () => {
      expect(getMaxTier(STANDARD_TIERS)).toBe(3);
      expect(getMaxTier(SIMPLE_TIERS)).toBe(5);
      expect(getMaxTier(LEGENDARY_TIERS)).toBe(4);
    });
  });

  describe('isMaxTier', () => {
    it('should return true for max tier card', () => {
      const card = createTestCard(3);
      expect(isMaxTier(card, STANDARD_TIERS)).toBe(true);
    });

    it('should return false for non-max tier card', () => {
      const card = createTestCard(2);
      expect(isMaxTier(card, STANDARD_TIERS)).toBe(false);
    });
  });

  describe('Presets', () => {
    it('ROGUELIKE_TIERS should have correct cost scaling', () => {
      const card = createTestCard(1);
      const costT2 = getUpgradeCost(card, ROGUELIKE_TIERS);
      
      const cardT2 = { ...card, tier: 2 };
      const costT3 = getUpgradeCost(cardT2, ROGUELIKE_TIERS);

      expect(costT2).toBe(30); // baseCost(10) * 3
      expect(costT3).toBe(50); // baseCost(10) * 5
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Upgrade System Properties', () => {
  /**
   * **Feature: core-progression, Property 11: Upgrade increases tier**
   * **Validates: Requirements 4.2**
   *
   * For any upgradeable card, upgrading should increase tier by exactly 1.
   */
  describe('Property 11: Upgrade increases tier', () => {
    it('upgrading increases tier by exactly 1', () => {
      fc.assert(
        fc.property(arbitraryBaseCard(), (card) => {
          // Ensure card is upgradeable (tier < maxTier)
          const testCard = { ...card, tier: Math.min(card.tier, 2) };

          if (!canUpgrade(testCard, STANDARD_TIERS)) {
            return true; // Skip non-upgradeable cards
          }

          const tierBefore = testCard.tier;
          const upgraded = upgradeCard(testCard, STANDARD_TIERS);
          const tierAfter = upgraded.tier;

          return tierAfter === tierBefore + 1;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 12: Max tier blocks upgrade**
   * **Validates: Requirements 4.2**
   *
   * For any card at maxTier, canUpgrade should return false
   * and upgradeCard should throw.
   */
  describe('Property 12: Max tier blocks upgrade', () => {
    it('max tier cards cannot be upgraded', () => {
      fc.assert(
        fc.property(arbitraryBaseCard(), (card) => {
          const maxTierCard = { ...card, tier: STANDARD_TIERS.maxTier };

          const canUpgradeResult = canUpgrade(maxTierCard, STANDARD_TIERS);

          if (canUpgradeResult) {
            return false; // Should not be upgradeable
          }

          try {
            upgradeCard(maxTierCard, STANDARD_TIERS);
            return false; // Should have thrown
          } catch (e) {
            return (e as Error).message === 'Card cannot be upgraded';
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});
