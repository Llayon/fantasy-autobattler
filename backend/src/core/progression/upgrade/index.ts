/**
 * Upgrade System Exports
 *
 * @module core/progression/upgrade
 */

// Types
export type { UpgradeConfig } from './upgrade.types';

// Operations
export {
  getUpgradeCost,
  canUpgrade,
  upgradeCard,
  getStatMultiplier,
  getTierName,
  getMaxTier,
  isMaxTier,
} from './upgrade';

// Presets
export {
  STANDARD_TIERS,
  SIMPLE_TIERS,
  LEGENDARY_TIERS,
  ROGUELIKE_TIERS,
} from './upgrade.presets';
