/**
 * Economy System Operations
 *
 * Pure functions for managing in-game currency.
 * All operations are immutable.
 *
 * @module core/progression/economy
 */

import { EconomyConfig, Wallet } from './economy.types';

/**
 * Creates a new wallet with starting amount.
 *
 * @param config - Economy configuration
 * @returns New wallet with starting amount
 *
 * @example
 * const wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
 * console.log(wallet.amount); // 10 (starting amount)
 */
export function createWallet(config: EconomyConfig): Wallet {
  return {
    amount: config.startingAmount,
    config,
  };
}

/**
 * Adds currency to wallet, respecting max amount cap.
 *
 * @param wallet - Current wallet
 * @param amount - Amount to add
 * @returns Updated wallet (immutable)
 *
 * @example
 * const newWallet = addCurrency(wallet, 50);
 */
export function addCurrency(wallet: Wallet, amount: number): Wallet {
  let newAmount = wallet.amount + amount;

  if (wallet.config.maxAmount > 0) {
    newAmount = Math.min(newAmount, wallet.config.maxAmount);
  }

  return { ...wallet, amount: newAmount };
}

/**
 * Spends currency from wallet.
 *
 * @param wallet - Current wallet
 * @param amount - Amount to spend
 * @returns Updated wallet (immutable)
 * @throws Error if insufficient funds
 *
 * @example
 * if (canAfford(wallet, 30)) {
 *   const newWallet = spendCurrency(wallet, 30);
 * }
 */
export function spendCurrency(wallet: Wallet, amount: number): Wallet {
  if (wallet.amount < amount) {
    throw new Error(
      `Insufficient ${wallet.config.currencyName}: have ${wallet.amount}, need ${amount}`,
    );
  }

  return { ...wallet, amount: wallet.amount - amount };
}

/**
 * Checks if wallet can afford an amount.
 *
 * @param wallet - Current wallet
 * @param amount - Amount to check
 * @returns True if wallet has enough currency
 *
 * @example
 * if (canAfford(wallet, upgradeCost)) {
 *   // Proceed with upgrade
 * }
 */
export function canAfford(wallet: Wallet, amount: number): boolean {
  return wallet.amount >= amount;
}

/**
 * Applies interest to wallet (for auto-battler style games).
 * Interest = min(amount * interestRate, interestCap)
 *
 * @param wallet - Current wallet
 * @returns Updated wallet with interest added (immutable)
 *
 * @example
 * // With 10% interest rate and 5 cap:
 * // 50 gold → 50 + min(5, 5) = 55 gold
 * const newWallet = applyInterest(wallet);
 */
export function applyInterest(wallet: Wallet): Wallet {
  if (wallet.config.interestRate === 0) {
    return wallet;
  }

  const interest = Math.min(
    Math.floor(wallet.amount * wallet.config.interestRate),
    wallet.config.interestCap,
  );

  return addCurrency(wallet, interest);
}

/**
 * Calculates reward for win/loss.
 *
 * @param won - Whether the battle was won
 * @param streak - Current win/loss streak
 * @param config - Economy configuration
 * @param context - Optional context for reward calculation
 * @returns Reward amount
 *
 * @example
 * const reward = getReward(true, 3, config);
 * const newWallet = addCurrency(wallet, reward);
 */
export function getReward(
  won: boolean,
  streak: number,
  config: EconomyConfig,
  context?: unknown,
): number {
  return won
    ? config.winReward(streak, context)
    : config.loseReward(streak, context);
}

/**
 * Gets current wallet balance.
 *
 * @param wallet - Current wallet
 * @returns Current amount
 */
export function getBalance(wallet: Wallet): number {
  return wallet.amount;
}

/**
 * Gets currency name from wallet config.
 *
 * @param wallet - Current wallet
 * @returns Currency name
 */
export function getCurrencyName(wallet: Wallet): string {
  return wallet.config.currencyName;
}

/**
 * Checks if wallet is at max capacity.
 *
 * @param wallet - Current wallet
 * @returns True if at max (or false if no max)
 */
export function isAtMaxCapacity(wallet: Wallet): boolean {
  if (wallet.config.maxAmount === 0) {
    return false;
  }
  return wallet.amount >= wallet.config.maxAmount;
}
