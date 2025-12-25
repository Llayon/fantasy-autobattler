/**
 * Upgrade System Types
 * 
 * @module core/progression/upgrade/types
 */

import { BaseCard } from '../types';

/**
 * Configuration for upgrade behavior.
 */
export interface UpgradeConfig<TCard extends BaseCard> {
  /** Maximum tier */
  maxTier: number;
  
  /** Tier names for display */
  tierNames: string[];
  
  /** Cost calculation function */
  calculateCost: (card: TCard, targetTier: number) => number;
  
  /** Stat multiplier per tier */
  statMultiplier: (tier: number) => number;
  
  /** Optional upgrade validator */
  canUpgrade?: (card: TCard) => boolean;
}
