/**
 * Economy Service for Roguelike Mode
 *
 * Manages gold rewards and spending in roguelike runs.
 * Uses core progression economy system with roguelike-specific rewards.
 *
 * @module roguelike/economy/service
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Economy configuration for roguelike mode.
 */
const ECONOMY_CONFIG = {
  /** Base gold reward for winning a battle */
  WIN_BASE_REWARD: 7,
  /** Bonus gold per win after 3rd consecutive win */
  WIN_STREAK_BONUS: 2,
  /** Minimum wins for streak bonus */
  WIN_STREAK_THRESHOLD: 3,
  /** Gold reward for losing a battle (consolation) */
  LOSE_REWARD: 9,
  /** Starting gold for new runs */
  STARTING_GOLD: 10,
} as const;

/**
 * Gold reward calculation result.
 */
export interface GoldReward {
  /** Base reward amount */
  base: number;
  /** Streak bonus amount */
  streakBonus: number;
  /** Total reward */
  total: number;
  /** Whether this was a win */
  isWin: boolean;
  /** Current streak count */
  streak: number;
}

/**
 * Service for managing roguelike economy.
 *
 * Handles gold reward calculations for wins and losses.
 * Win rewards include streak bonuses, loss rewards are fixed consolation.
 *
 * @example
 * // Calculate win reward
 * const reward = economyService.calculateWinReward(3);
 * // reward.total === 9 (7 base + 2 streak bonus)
 *
 * @example
 * // Calculate loss reward
 * const reward = economyService.calculateLossReward(2);
 * // reward.total === 9 (fixed consolation)
 */
@Injectable()
export class EconomyService {
  private readonly logger = new Logger(EconomyService.name);

  /**
   * Calculates gold reward for winning a battle.
   *
   * Formula: base (7) + streak bonus (2 per win after 3rd)
   * - 1st win: 7 gold
   * - 2nd win: 7 gold
   * - 3rd win: 9 gold (7 + 2)
   * - 4th win: 11 gold (7 + 4)
   * - etc.
   *
   * @param consecutiveWins - Number of consecutive wins (including this one)
   * @returns Gold reward breakdown
   *
   * @example
   * const reward = economyService.calculateWinReward(5);
   * // reward = { base: 7, streakBonus: 6, total: 13, isWin: true, streak: 5 }
   */
  calculateWinReward(consecutiveWins: number): GoldReward {
    const base = ECONOMY_CONFIG.WIN_BASE_REWARD;
    const streakBonus =
      consecutiveWins >= ECONOMY_CONFIG.WIN_STREAK_THRESHOLD
        ? (consecutiveWins - ECONOMY_CONFIG.WIN_STREAK_THRESHOLD + 1) * ECONOMY_CONFIG.WIN_STREAK_BONUS
        : 0;

    const total = base + streakBonus;

    this.logger.debug('Calculated win reward', {
      consecutiveWins,
      base,
      streakBonus,
      total,
    });

    return {
      base,
      streakBonus,
      total,
      isWin: true,
      streak: consecutiveWins,
    };
  }

  /**
   * Calculates gold reward for losing a battle.
   *
   * Fixed consolation reward to help players recover.
   * Higher than base win reward to provide catch-up mechanic.
   *
   * @param consecutiveLosses - Number of consecutive losses (including this one)
   * @returns Gold reward breakdown
   *
   * @example
   * const reward = economyService.calculateLossReward(2);
   * // reward = { base: 9, streakBonus: 0, total: 9, isWin: false, streak: 2 }
   */
  calculateLossReward(consecutiveLosses: number): GoldReward {
    const base = ECONOMY_CONFIG.LOSE_REWARD;

    this.logger.debug('Calculated loss reward', {
      consecutiveLosses,
      base,
    });

    return {
      base,
      streakBonus: 0,
      total: base,
      isWin: false,
      streak: consecutiveLosses,
    };
  }

  /**
   * Calculates gold reward based on battle result.
   *
   * @param won - Whether the battle was won
   * @param streak - Current win or loss streak
   * @returns Gold reward breakdown
   *
   * @example
   * const reward = economyService.calculateReward(true, 4);
   * // Win with 4-streak: 11 gold
   */
  calculateReward(won: boolean, streak: number): GoldReward {
    return won
      ? this.calculateWinReward(streak)
      : this.calculateLossReward(streak);
  }

  /**
   * Checks if player can afford a purchase.
   *
   * @param currentGold - Player's current gold
   * @param cost - Cost of the purchase
   * @returns True if player can afford
   *
   * @example
   * if (economyService.canAfford(25, 5)) {
   *   // Proceed with purchase
   * }
   */
  canAfford(currentGold: number, cost: number): boolean {
    return currentGold >= cost;
  }

  /**
   * Gets the starting gold amount for new runs.
   *
   * @returns Starting gold amount
   *
   * @example
   * const startingGold = economyService.getStartingGold();
   * // startingGold === 10
   */
  getStartingGold(): number {
    return ECONOMY_CONFIG.STARTING_GOLD;
  }

  /**
   * Gets economy configuration (for display purposes).
   *
   * @returns Economy configuration object
   *
   * @example
   * const config = economyService.getConfig();
   * // config.WIN_BASE_REWARD === 7
   */
  getConfig(): typeof ECONOMY_CONFIG {
    return { ...ECONOMY_CONFIG };
  }

  /**
   * Calculates projected gold after N more wins.
   *
   * Useful for showing potential rewards to players.
   *
   * @param currentGold - Current gold amount
   * @param currentStreak - Current win streak
   * @param additionalWins - Number of additional wins to project
   * @returns Projected gold amount
   *
   * @example
   * const projected = economyService.projectGoldAfterWins(10, 2, 3);
   * // Projects gold after 3 more wins starting from 2-streak
   */
  projectGoldAfterWins(
    currentGold: number,
    currentStreak: number,
    additionalWins: number,
  ): number {
    let gold = currentGold;
    let streak = currentStreak;

    for (let i = 0; i < additionalWins; i++) {
      streak++;
      const reward = this.calculateWinReward(streak);
      gold += reward.total;
    }

    return gold;
  }

  /**
   * Calculates total gold earned from a win streak.
   *
   * @param streakLength - Length of the win streak
   * @returns Total gold earned during the streak
   *
   * @example
   * const total = economyService.calculateStreakTotal(5);
   * // Total gold from 5 consecutive wins
   */
  calculateStreakTotal(streakLength: number): number {
    let total = 0;

    for (let i = 1; i <= streakLength; i++) {
      const reward = this.calculateWinReward(i);
      total += reward.total;
    }

    return total;
  }
}
