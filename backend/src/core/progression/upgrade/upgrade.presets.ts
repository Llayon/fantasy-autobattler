/**
 * Upgrade System Presets
 *
 * Pre-configured upgrade settings for common game scenarios.
 *
 * @module core/progression/upgrade/presets
 */

import { BaseCard } from '../types';
import { UpgradeConfig } from './upgrade.types';

/**
 * Standard tier configuration (T1/T2/T3).
 * Multipliers: 100% / 150% / 200%
 * Costs: baseCost * targetTier * 10
 *
 * @example
 * const cost = getUpgradeCost(card, STANDARD_TIERS);
 * const upgraded = upgradeCard(card, STANDARD_TIERS);
 */
export const STANDARD_TIERS: UpgradeConfig<BaseCard> = {
  maxTier: 3,
  tierNames: ['T1', 'T2', 'T3'],
  calculateCost: (card, targetTier) => card.baseCost * targetTier * 10,
  statMultiplier: (tier) => {
    switch (tier) {
      case 1:
        return 1.0;
      case 2:
        return 1.5;
      case 3:
        return 2.0;
      default:
        return 1.0;
    }
  },
};

/**
 * Simple tier configuration (+0 to +4).
 * Linear multiplier: 100% + 25% per tier
 * Flat cost: 50 * targetTier
 *
 * @example
 * const name = getTierName(3, SIMPLE_TIERS); // "+2"
 */
export const SIMPLE_TIERS: UpgradeConfig<BaseCard> = {
  maxTier: 5,
  tierNames: ['+0', '+1', '+2', '+3', '+4'],
  calculateCost: (_card, targetTier) => 50 * targetTier,
  statMultiplier: (tier) => 1.0 + (tier - 1) * 0.25,
};

/**
 * Legendary tier configuration (Common/Rare/Epic/Legendary).
 * Exponential multiplier and cost scaling.
 *
 * @example
 * const name = getTierName(4, LEGENDARY_TIERS); // "Legendary"
 */
export const LEGENDARY_TIERS: UpgradeConfig<BaseCard> = {
  maxTier: 4,
  tierNames: ['Common', 'Rare', 'Epic', 'Legendary'],
  calculateCost: (card, targetTier) => {
    const baseCost = card.baseCost * 20;
    // Exponential scaling: 1x, 2x, 4x, 8x
    return baseCost * Math.pow(2, targetTier - 1);
  },
  statMultiplier: (tier) => {
    switch (tier) {
      case 1:
        return 1.0;
      case 2:
        return 1.3;
      case 3:
        return 1.7;
      case 4:
        return 2.5;
      default:
        return 1.0;
    }
  },
};

/**
 * Roguelike tier configuration for autobattler.
 * 3 tiers with moderate scaling.
 *
 * @example
 * const multiplier = getStatMultiplier(2, ROGUELIKE_TIERS); // 1.5
 */
export const ROGUELIKE_TIERS: UpgradeConfig<BaseCard> = {
  maxTier: 3,
  tierNames: ['Bronze', 'Silver', 'Gold'],
  calculateCost: (card, targetTier) => {
    // T1→T2: baseCost * 3, T2→T3: baseCost * 5
    const multiplier = targetTier === 2 ? 3 : 5;
    return card.baseCost * multiplier;
  },
  statMultiplier: (tier) => {
    switch (tier) {
      case 1:
        return 1.0;
      case 2:
        return 1.5;
      case 3:
        return 2.0;
      default:
        return 1.0;
    }
  },
};
