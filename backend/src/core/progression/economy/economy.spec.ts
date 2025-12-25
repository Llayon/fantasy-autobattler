/**
 * Economy System Tests
 *
 * Unit tests and property-based tests for economy operations.
 *
 * @module core/progression/economy/spec
 */

import * as fc from 'fast-check';
import {
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
import { EconomyConfig, Wallet } from './economy.types';
import {
  ROGUELIKE_ECONOMY_CONFIG,
  AUTOBATTLER_ECONOMY_CONFIG,
  CARD_GAME_ECONOMY_CONFIG,
  ARENA_ECONOMY_CONFIG,
} from './economy.presets';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const testConfig: EconomyConfig = {
  startingAmount: 100,
  currencyName: 'Gold',
  maxAmount: 500,
  winReward: (streak) => 10 + streak,
  loseReward: () => 5,
  interestRate: 0.1,
  interestCap: 10,
};

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Economy System', () => {
  describe('createWallet', () => {
    it('should create wallet with starting amount', () => {
      const wallet = createWallet(testConfig);

      expect(wallet.amount).toBe(100);
      expect(wallet.config).toBe(testConfig);
    });

    it('should work with different configs', () => {
      const roguelikeWallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
      const autobattlerWallet = createWallet(AUTOBATTLER_ECONOMY_CONFIG);

      expect(roguelikeWallet.amount).toBe(10);
      expect(autobattlerWallet.amount).toBe(5);
    });
  });

  describe('addCurrency', () => {
    it('should add currency to wallet', () => {
      const wallet = createWallet(testConfig);
      const newWallet = addCurrency(wallet, 50);

      expect(newWallet.amount).toBe(150);
    });

    it('should not mutate original wallet', () => {
      const wallet = createWallet(testConfig);
      addCurrency(wallet, 50);

      expect(wallet.amount).toBe(100);
    });

    it('should cap at maxAmount', () => {
      const wallet = createWallet(testConfig);
      const newWallet = addCurrency(wallet, 1000);

      expect(newWallet.amount).toBe(500); // maxAmount
    });

    it('should not cap when maxAmount is 0', () => {
      const wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
      const newWallet = addCurrency(wallet, 10000);

      expect(newWallet.amount).toBe(10010);
    });
  });

  describe('spendCurrency', () => {
    it('should spend currency from wallet', () => {
      const wallet = createWallet(testConfig);
      const newWallet = spendCurrency(wallet, 30);

      expect(newWallet.amount).toBe(70);
    });

    it('should throw when insufficient funds', () => {
      const wallet = createWallet(testConfig);

      expect(() => spendCurrency(wallet, 200)).toThrow('Insufficient Gold');
    });

    it('should include amounts in error message', () => {
      const wallet = createWallet(testConfig);

      expect(() => spendCurrency(wallet, 200)).toThrow('have 100, need 200');
    });
  });

  describe('canAfford', () => {
    it('should return true when can afford', () => {
      const wallet = createWallet(testConfig);

      expect(canAfford(wallet, 50)).toBe(true);
      expect(canAfford(wallet, 100)).toBe(true);
    });

    it('should return false when cannot afford', () => {
      const wallet = createWallet(testConfig);

      expect(canAfford(wallet, 150)).toBe(false);
    });
  });

  describe('applyInterest', () => {
    it('should add interest to wallet', () => {
      const wallet = createWallet(testConfig);
      const newWallet = applyInterest(wallet);

      // 100 * 0.1 = 10, capped at 10
      expect(newWallet.amount).toBe(110);
    });

    it('should cap interest at interestCap', () => {
      const wallet: Wallet = { ...createWallet(testConfig), amount: 200 };
      const newWallet = applyInterest(wallet);

      // 200 * 0.1 = 20, but capped at 10
      expect(newWallet.amount).toBe(210);
    });

    it('should return same wallet when interestRate is 0', () => {
      const wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
      const newWallet = applyInterest(wallet);

      expect(newWallet.amount).toBe(wallet.amount);
    });

    it('should work with AUTOBATTLER_ECONOMY_CONFIG', () => {
      const wallet: Wallet = {
        ...createWallet(AUTOBATTLER_ECONOMY_CONFIG),
        amount: 50,
      };
      const newWallet = applyInterest(wallet);

      // 50 * 0.1 = 5, capped at 5
      expect(newWallet.amount).toBe(55);
    });
  });

  describe('getReward', () => {
    it('should return win reward for wins', () => {
      const reward = getReward(true, 3, testConfig);

      expect(reward).toBe(13); // 10 + streak(3)
    });

    it('should return lose reward for losses', () => {
      const reward = getReward(false, 3, testConfig);

      expect(reward).toBe(5);
    });

    it('should work with ROGUELIKE_ECONOMY_CONFIG streak bonus', () => {
      const reward1 = getReward(true, 1, ROGUELIKE_ECONOMY_CONFIG);
      const reward3 = getReward(true, 3, ROGUELIKE_ECONOMY_CONFIG);
      const reward5 = getReward(true, 5, ROGUELIKE_ECONOMY_CONFIG);

      expect(reward1).toBe(7); // Base
      expect(reward3).toBe(9); // 7 + (3-2)*2
      expect(reward5).toBe(13); // 7 + (5-2)*2
    });
  });

  describe('getBalance', () => {
    it('should return current amount', () => {
      const wallet = createWallet(testConfig);

      expect(getBalance(wallet)).toBe(100);
    });
  });

  describe('getCurrencyName', () => {
    it('should return currency name', () => {
      const wallet = createWallet(testConfig);

      expect(getCurrencyName(wallet)).toBe('Gold');
    });
  });

  describe('isAtMaxCapacity', () => {
    it('should return true when at max', () => {
      const wallet: Wallet = { ...createWallet(testConfig), amount: 500 };

      expect(isAtMaxCapacity(wallet)).toBe(true);
    });

    it('should return false when not at max', () => {
      const wallet = createWallet(testConfig);

      expect(isAtMaxCapacity(wallet)).toBe(false);
    });

    it('should return false when maxAmount is 0', () => {
      const wallet: Wallet = {
        ...createWallet(ROGUELIKE_ECONOMY_CONFIG),
        amount: 999999,
      };

      expect(isAtMaxCapacity(wallet)).toBe(false);
    });
  });

  describe('Presets', () => {
    it('ARENA_ECONOMY_CONFIG should give 0 for losses', () => {
      const reward = getReward(false, 5, ARENA_ECONOMY_CONFIG);

      expect(reward).toBe(0);
    });

    it('CARD_GAME_ECONOMY_CONFIG should have fixed rewards', () => {
      const winReward = getReward(true, 10, CARD_GAME_ECONOMY_CONFIG);
      const loseReward = getReward(false, 10, CARD_GAME_ECONOMY_CONFIG);

      expect(winReward).toBe(25);
      expect(loseReward).toBe(10);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Economy System Properties', () => {
  /**
   * **Feature: core-progression, Property 13: Currency cap enforcement**
   * **Validates: Requirements 5.2**
   *
   * For any wallet with maxAmount > 0, the amount should never
   * exceed maxAmount after any operation.
   */
  describe('Property 13: Currency cap enforcement', () => {
    it('amount never exceeds maxAmount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 0, max: 1000 }),
          (startingAmount, maxAmount, addAmount) => {
            const config: EconomyConfig = {
              startingAmount,
              currencyName: 'Gold',
              maxAmount,
              winReward: () => 10,
              loseReward: () => 5,
              interestRate: 0,
              interestCap: 0,
            };

            const wallet = createWallet(config);
            const newWallet = addCurrency(wallet, addAmount);

            return newWallet.amount <= maxAmount;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 14: Spend validation**
   * **Validates: Requirements 5.2**
   *
   * For any wallet, spending more than available amount should throw.
   */
  describe('Property 14: Spend validation', () => {
    it('spending more than available throws error', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (amount, extraSpend) => {
            const config: EconomyConfig = {
              startingAmount: amount,
              currencyName: 'Gold',
              maxAmount: 0,
              winReward: () => 10,
              loseReward: () => 5,
              interestRate: 0,
              interestCap: 0,
            };

            const wallet = createWallet(config);
            const spendAmount = amount + extraSpend;

            try {
              spendCurrency(wallet, spendAmount);
              return false; // Should have thrown
            } catch (e) {
              return (e as Error).message.includes('Insufficient');
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 15: Interest calculation**
   * **Validates: Requirements 5.2**
   *
   * For any wallet, applyInterest should add
   * min(amount * interestRate, interestCap) to the wallet.
   */
  describe('Property 15: Interest calculation', () => {
    it('interest equals min(amount * rate, cap)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          fc.integer({ min: 1, max: 50 }),
          (amount, interestRate, interestCap) => {
            const config: EconomyConfig = {
              startingAmount: amount,
              currencyName: 'Gold',
              maxAmount: 0,
              winReward: () => 10,
              loseReward: () => 5,
              interestRate,
              interestCap,
            };

            const wallet = createWallet(config);
            const newWallet = applyInterest(wallet);

            const expectedInterest = Math.min(
              Math.floor(amount * interestRate),
              interestCap,
            );
            const actualInterest = newWallet.amount - wallet.amount;

            return actualInterest === expectedInterest;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
