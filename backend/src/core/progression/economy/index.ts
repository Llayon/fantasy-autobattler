/**
 * Economy System Exports
 *
 * @module core/progression/economy
 */

// Types
export type { EconomyConfig, Wallet } from './economy.types';

// Operations
export {
  createWallet,
  addCurrency,
  spendCurrency,
  canAfford,
  applyInterest,
  getReward,
  getBalance,
  getCurrencyName,
  isAtMaxCapacity,
} from './economy';

// Presets
export {
  ROGUELIKE_ECONOMY_CONFIG,
  AUTOBATTLER_ECONOMY_CONFIG,
  CARD_GAME_ECONOMY_CONFIG,
  ARENA_ECONOMY_CONFIG,
} from './economy.presets';
