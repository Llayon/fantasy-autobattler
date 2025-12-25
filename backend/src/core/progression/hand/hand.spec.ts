/**
 * Hand System Tests
 *
 * Unit tests and property-based tests for hand operations.
 *
 * @module core/progression/hand/spec
 */

import * as fc from 'fast-check';
import {
  createHand,
  addToHand,
  removeFromHand,
  getHandSize,
  isHandFull,
  getHandSpace,
  discardExcess,
} from './hand';
import { HandConfig } from './hand.types';
import { BaseCard } from '../types';
import { arbitraryBaseCards } from '../test-generators';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const createTestCard = (id: string, name = 'Test Card'): BaseCard => ({
  id,
  name,
  baseCost: 5,
  tier: 1,
});

const defaultConfig: HandConfig = {
  maxHandSize: 7,
  startingHandSize: 5,
  autoDiscard: true,
};

const strictConfig: HandConfig = {
  maxHandSize: 5,
  startingHandSize: 3,
  autoDiscard: false,
};

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Hand System', () => {
  describe('createHand', () => {
    it('should create empty hand', () => {
      const hand = createHand(defaultConfig);
      expect(hand.cards).toEqual([]);
      expect(hand.config).toBe(defaultConfig);
    });
  });

  describe('addToHand', () => {
    it('should add cards to hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const { hand: newHand, discarded } = addToHand(hand, [
        createTestCard('1'),
        createTestCard('2'),
      ]);

      expect(newHand.cards).toHaveLength(2);
      expect(discarded).toHaveLength(0);
    });

    it('should not mutate original hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      addToHand(hand, [createTestCard('1')]);
      expect(hand.cards).toHaveLength(0);
    });

    it('should auto-discard excess when enabled', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`${i}`),
      );

      const { hand: newHand, discarded } = addToHand(hand, cards);

      expect(newHand.cards).toHaveLength(7); // maxHandSize
      expect(discarded).toHaveLength(3);
    });

    it('should discard newest cards on overflow', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`${i}`),
      );

      const { hand: newHand, discarded } = addToHand(hand, cards);

      // First 7 cards kept
      expect(newHand.cards.map((c) => c.id)).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      // Last 3 discarded
      expect(discarded.map((c) => c.id)).toEqual(['7', '8', '9']);
    });

    it('should throw on overflow when autoDiscard disabled', () => {
      const hand = createHand<BaseCard>(strictConfig);
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`${i}`),
      );

      expect(() => addToHand(hand, cards)).toThrow('Hand overflow');
    });
  });

  describe('removeFromHand', () => {
    it('should remove card from hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const { hand: withCards } = addToHand(hand, [
        createTestCard('1'),
        createTestCard('2'),
      ]);

      const newHand = removeFromHand(withCards, '1');

      expect(newHand.cards).toHaveLength(1);
      expect(newHand.cards[0]?.id).toBe('2');
    });

    it('should throw when card not found', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const { hand: withCards } = addToHand(hand, [createTestCard('1')]);

      expect(() => removeFromHand(withCards, 'nonexistent')).toThrow(
        'not in hand',
      );
    });
  });

  describe('isHandFull', () => {
    it('should return false for empty hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      expect(isHandFull(hand)).toBe(false);
    });

    it('should return true when at max capacity', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const cards = Array.from({ length: 7 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const { hand: fullHand } = addToHand(hand, cards);

      expect(isHandFull(fullHand)).toBe(true);
    });
  });

  describe('getHandSpace', () => {
    it('should return max size for empty hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      expect(getHandSpace(hand)).toBe(7);
    });

    it('should return 0 for full hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const cards = Array.from({ length: 7 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const { hand: fullHand } = addToHand(hand, cards);

      expect(getHandSpace(fullHand)).toBe(0);
    });

    it('should return correct space for partial hand', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const { hand: partialHand } = addToHand(hand, [
        createTestCard('1'),
        createTestCard('2'),
      ]);

      expect(getHandSpace(partialHand)).toBe(5);
    });
  });

  describe('discardExcess', () => {
    it('should do nothing if hand is not over limit', () => {
      const hand = createHand<BaseCard>(defaultConfig);
      const { hand: withCards } = addToHand(hand, [createTestCard('1')]);

      const { hand: result, discarded } = discardExcess(withCards);

      expect(result.cards).toHaveLength(1);
      expect(discarded).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Hand System Properties', () => {
  /**
   * **Feature: core-progression, Property 5: Hand respects max size**
   * **Validates: Requirements 2.2**
   *
   * For any hand with autoDiscard enabled, the hand size never exceeds
   * maxHandSize after any operation.
   */
  describe('Property 5: Hand respects max size', () => {
    it('hand size never exceeds maxHandSize with autoDiscard', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          arbitraryBaseCards(0, 20),
          (maxSize, cards) => {
            const config: HandConfig = {
              maxHandSize: maxSize,
              startingHandSize: Math.min(maxSize, 3),
              autoDiscard: true,
            };

            const hand = createHand<BaseCard>(config);
            const { hand: newHand } = addToHand(hand, cards);

            return getHandSize(newHand) <= maxSize;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 5b: Hand overflow throws without autoDiscard**
   * **Validates: Requirements 2.2**
   *
   * For any hand without autoDiscard, adding cards that exceed maxHandSize
   * throws an error.
   */
  describe('Property 5b: Hand overflow throws without autoDiscard', () => {
    it('throws on overflow when autoDiscard is false', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 6, max: 15 }),
          (maxSize, cardCount) => {
            const config: HandConfig = {
              maxHandSize: maxSize,
              startingHandSize: 0,
              autoDiscard: false,
            };

            const cards = Array.from({ length: cardCount }, (_, i) => ({
              id: `card-${i}`,
              name: `Card ${i}`,
              baseCost: 5,
              tier: 1,
            }));

            const hand = createHand<BaseCard>(config);

            try {
              addToHand(hand, cards);
              return false; // Should have thrown
            } catch (e) {
              return (e as Error).message.includes('overflow');
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 5c: Discarded cards count**
   * **Validates: Requirements 2.2**
   *
   * For any hand with autoDiscard, the number of discarded cards equals
   * max(0, added cards - available space).
   */
  describe('Property 5c: Discarded cards count is correct', () => {
    it('discarded count equals overflow amount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 15 }),
          (maxSize, initialCards, addedCards) => {
            const config: HandConfig = {
              maxHandSize: maxSize,
              startingHandSize: 0,
              autoDiscard: true,
            };

            const initial = Array.from({ length: Math.min(initialCards, maxSize) }, (_, i) => ({
              id: `initial-${i}`,
              name: `Initial ${i}`,
              baseCost: 5,
              tier: 1,
            }));

            const toAdd = Array.from({ length: addedCards }, (_, i) => ({
              id: `added-${i}`,
              name: `Added ${i}`,
              baseCost: 5,
              tier: 1,
            }));

            const hand = createHand<BaseCard>(config);
            const { hand: withInitial } = addToHand(hand, initial);
            const { discarded } = addToHand(withInitial, toAdd);

            const expectedDiscarded = Math.max(
              0,
              getHandSize(withInitial) + addedCards - maxSize,
            );

            return discarded.length === expectedDiscarded;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
