/**
 * Economy System Types
 * 
 * @module core/progression/economy/types
 */

/**
 * Configuration for economy behavior.
 */
export interface EconomyConfig {
  /** Starting currency */
  startingAmount: number;
  
  /** Currency name */
  currencyName: string;
  
  /** Maximum currency (0 = unlimited) */
  maxAmount: number;
  
  /** Win reward calculation */
  winReward: (streak: number, context?: unknown) => number;
  
  /** Lose reward calculation */
  loseReward: (streak: number, context?: unknown) => number;
  
  /** Interest rate per round (0 = none) */
  interestRate: number;
  
  /** Interest cap */
  interestCap: number;
}

/**
 * Wallet state containing currency amount.
 */
export interface Wallet {
  /** Current currency amount */
  amount: number;
  
  /** Economy configuration */
  config: EconomyConfig;
}
