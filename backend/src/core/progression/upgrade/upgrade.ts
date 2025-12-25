/**
 * Upgrade System Operations
 *
 * Pure functions for managing card tier upgrades.
 * All operations are immutable.
 *
 * @module core/progression/upgrade
 */

import { BaseCard } from '../types';
import { UpgradeConfig } from './upgrade.types';

/**
 * Gets the cost to upgrade a card to the next tier.
 *
 * @param card - Card to check upgrade cost for
 * @param config - Upgrade configuration
 * @returns Cost to upgrade, or Infinity if at max tier
 *
 * @example
 * const cost = getUpgradeCost(myCard, STANDARD_TIERS);
 * if (cost !== Infinity && wallet.amount >= cost) {
 *   // Can afford upgrade
 * }
 */
export function getUpgradeCost<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>,
): number {
  if (card.tier >= config.maxTier) {
    return Infinity;
  }

  return config.calculateCost(card, card.tier + 1);
}

/**
 * Checks if a card can be upgraded.
 *
 * @param card - Card to check
 * @param config - Upgrade configuration
 * @returns True if card can be upgraded
 *
 * @example
 * if (canUpgrade(card, config)) {
 *   const upgraded = upgradeCard(card, config);
 * }
 */
export function canUpgrade<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>,
): boolean {
  if (card.tier >= config.maxTier) {
    return false;
  }

  if (config.canUpgrade && !config.canUpgrade(card)) {
    return false;
  }

  return true;
}

/**
 * Upgrades a card to the next tier.
 * Returns new card with updated tier (immutable).
 *
 * @param card - Card to upgrade
 * @param config - Upgrade configuration
 * @returns New card with incremented tier
 * @throws Error if card cannot be upgraded
 *
 * @example
 * const upgradedCard = upgradeCard(myCard, STANDARD_TIERS);
 * console.log(upgradedCard.tier); // tier + 1
 */
export function upgradeCard<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>,
): TCard {
  if (!canUpgrade(card, config)) {
    throw new Error('Card cannot be upgraded');
  }

  return {
    ...card,
    tier: card.tier + 1,
  };
}

/**
 * Gets stat multiplier for a tier.
 *
 * @param tier - Tier level
 * @param config - Upgrade configuration
 * @returns Stat multiplier for the tier
 *
 * @example
 * const multiplier = getStatMultiplier(2, STANDARD_TIERS);
 * const scaledAtk = baseAtk * multiplier;
 */
export function getStatMultiplier<TCard extends BaseCard>(
  tier: number,
  config: UpgradeConfig<TCard>,
): number {
  return config.statMultiplier(tier);
}

/**
 * Gets display name for a tier.
 *
 * @param tier - Tier level (1-based)
 * @param config - Upgrade configuration
 * @returns Display name for the tier
 *
 * @example
 * const name = getTierName(2, STANDARD_TIERS); // "T2" or "Rare"
 */
export function getTierName<TCard extends BaseCard>(
  tier: number,
  config: UpgradeConfig<TCard>,
): string {
  const index = tier - 1;
  if (index >= 0 && index < config.tierNames.length) {
    const name = config.tierNames[index];
    if (name !== undefined) {
      return name;
    }
  }
  return `Tier ${tier}`;
}

/**
 * Gets the maximum tier from config.
 *
 * @param config - Upgrade configuration
 * @returns Maximum tier level
 */
export function getMaxTier<TCard extends BaseCard>(
  config: UpgradeConfig<TCard>,
): number {
  return config.maxTier;
}

/**
 * Checks if card is at maximum tier.
 *
 * @param card - Card to check
 * @param config - Upgrade configuration
 * @returns True if card is at max tier
 */
export function isMaxTier<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>,
): boolean {
  return card.tier >= config.maxTier;
}
