/**
 * Economy System Presets
 *
 * Pre-configured economy settings for common game scenarios.
 *
 * @module core/progression/economy/presets
 */

import { EconomyConfig } from './economy.types';

/**
 * Roguelike economy configuration.
 * No interest, streak bonuses for wins.
 *
 * Win reward: 7 base + streak bonus (2 per win after 3rd)
 * Lose reward: 9 (consolation)
 *
 * @example
 * const wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
 */
export const ROGUELIKE_ECONOMY_CONFIG: EconomyConfig = {
  startingAmount: 10,
  currencyName: 'Gold',
  maxAmount: 0, // Unlimited
  winReward: (streak) => {
    const base = 7;
    const streakBonus = streak >= 3 ? (streak - 2) * 2 : 0;
    return base + streakBonus;
  },
  loseReward: () => 9,
  interestRate: 0,
  interestCap: 0,
};

/**
 * Autobattler economy configuration (TFT-style).
 * Interest system with 10% rate, capped at 5.
 *
 * Win reward: 1 base + 1 per win streak
 * Lose reward: 1 base + 1 per lose streak
 *
 * @example
 * const wallet = createWallet(AUTOBATTLER_ECONOMY_CONFIG);
 * const withInterest = applyInterest(wallet);
 */
export const AUTOBATTLER_ECONOMY_CONFIG: EconomyConfig = {
  startingAmount: 5,
  currencyName: 'Gold',
  maxAmount: 100,
  winReward: (streak) => 1 + Math.min(streak, 5),
  loseReward: (streak) => 1 + Math.min(streak, 5),
  interestRate: 0.1, // 10%
  interestCap: 5,
};

/**
 * Card game economy configuration.
 * Fixed rewards, no interest.
 *
 * @example
 * const wallet = createWallet(CARD_GAME_ECONOMY_CONFIG);
 */
export const CARD_GAME_ECONOMY_CONFIG: EconomyConfig = {
  startingAmount: 100,
  currencyName: 'Coins',
  maxAmount: 9999,
  winReward: () => 25,
  loseReward: () => 10,
  interestRate: 0,
  interestCap: 0,
};

/**
 * Arena economy configuration.
 * High stakes, no consolation for losses.
 *
 * @example
 * const wallet = createWallet(ARENA_ECONOMY_CONFIG);
 */
export const ARENA_ECONOMY_CONFIG: EconomyConfig = {
  startingAmount: 0,
  currencyName: 'Tokens',
  maxAmount: 0,
  winReward: (streak) => 10 + streak * 5,
  loseReward: () => 0,
  interestRate: 0,
  interestCap: 0,
};
