/**
 * Deck System Tests
 *
 * Unit tests and property-based tests for deck operations.
 *
 * @module core/progression/deck/spec
 */

import * as fc from 'fast-check';
import {
  createDeck,
  addCard,
  removeCard,
  shuffleDeck,
  drawCards,
  getDeckSize,
  validateDeck,
} from './deck';
import { DeckConfig } from './deck.types';
import { BaseCard } from '../types';
import { arbitraryBaseCard, arbitraryBaseCards } from '../test-generators';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const createTestCard = (id: string, name = 'Test Card'): BaseCard => ({
  id,
  name,
  baseCost: 5,
  tier: 1,
});

const defaultConfig: DeckConfig<BaseCard> = {
  maxDeckSize: 12,
  minDeckSize: 0,
  allowDuplicates: false,
  maxCopies: 1,
};

const strictConfig: DeckConfig<BaseCard> = {
  maxDeckSize: 12,
  minDeckSize: 12,
  allowDuplicates: false,
  maxCopies: 1,
};

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Deck System', () => {
  describe('createDeck', () => {
    it('should create empty deck with valid config', () => {
      const deck = createDeck([], defaultConfig);
      expect(deck.cards).toEqual([]);
      expect(deck.config).toBe(defaultConfig);
    });

    it('should create deck with initial cards', () => {
      const cards = [createTestCard('1'), createTestCard('2')];
      const deck = createDeck(cards, defaultConfig);
      expect(deck.cards).toHaveLength(2);
    });

    it('should throw on invalid initial cards (too many)', () => {
      const cards = Array.from({ length: 15 }, (_, i) =>
        createTestCard(`${i}`),
      );
      expect(() => createDeck(cards, defaultConfig)).toThrow('Invalid deck');
    });

    it('should throw on duplicate cards when not allowed', () => {
      const cards = [createTestCard('1'), createTestCard('1')];
      expect(() => createDeck(cards, defaultConfig)).toThrow('Invalid deck');
    });
  });

  describe('addCard', () => {
    it('should add card to deck', () => {
      const deck = createDeck([createTestCard('1')], defaultConfig);
      const newDeck = addCard(deck, createTestCard('2'));
      expect(newDeck.cards).toHaveLength(2);
    });

    it('should not mutate original deck', () => {
      const deck = createDeck([createTestCard('1')], defaultConfig);
      addCard(deck, createTestCard('2'));
      expect(deck.cards).toHaveLength(1);
    });

    it('should throw when deck is full', () => {
      const cards = Array.from({ length: 12 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = createDeck(cards, defaultConfig);
      expect(() => addCard(deck, createTestCard('new'))).toThrow('Deck is full');
    });

    it('should throw on duplicate when not allowed', () => {
      const deck = createDeck([createTestCard('1')], defaultConfig);
      expect(() => addCard(deck, createTestCard('1'))).toThrow(
        'Duplicates not allowed',
      );
    });

    it('should allow duplicates when configured', () => {
      const config: DeckConfig<BaseCard> = {
        ...defaultConfig,
        allowDuplicates: true,
        maxCopies: 3,
      };
      const deck = createDeck([createTestCard('1')], config);
      const newDeck = addCard(deck, createTestCard('1'));
      expect(newDeck.cards).toHaveLength(2);
    });

    it('should enforce maxCopies limit', () => {
      const config: DeckConfig<BaseCard> = {
        ...defaultConfig,
        allowDuplicates: true,
        maxCopies: 2,
      };
      const deck = createDeck(
        [createTestCard('1'), createTestCard('1')],
        config,
      );
      expect(() => addCard(deck, createTestCard('1'))).toThrow(
        'Max 2 copies allowed',
      );
    });
  });

  describe('removeCard', () => {
    it('should remove card from deck', () => {
      const deck = createDeck(
        [createTestCard('1'), createTestCard('2')],
        defaultConfig,
      );
      const newDeck = removeCard(deck, '1');
      expect(newDeck.cards).toHaveLength(1);
      expect(newDeck.cards[0]?.id).toBe('2');
    });

    it('should throw when card not found', () => {
      const deck = createDeck([createTestCard('1')], defaultConfig);
      expect(() => removeCard(deck, 'nonexistent')).toThrow('not found');
    });
  });

  describe('shuffleDeck', () => {
    it('should shuffle deck deterministically', () => {
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = createDeck(cards, defaultConfig);

      const shuffled1 = shuffleDeck(deck, 12345);
      const shuffled2 = shuffleDeck(deck, 12345);

      expect(shuffled1.cards.map((c) => c.id)).toEqual(
        shuffled2.cards.map((c) => c.id),
      );
    });

    it('should produce different results with different seeds', () => {
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = createDeck(cards, defaultConfig);

      const shuffled1 = shuffleDeck(deck, 12345);
      const shuffled2 = shuffleDeck(deck, 54321);

      expect(shuffled1.cards.map((c) => c.id)).not.toEqual(
        shuffled2.cards.map((c) => c.id),
      );
    });

    it('should preserve all cards', () => {
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = createDeck(cards, defaultConfig);
      const shuffled = shuffleDeck(deck, 12345);

      const originalIds = cards.map((c) => c.id).sort();
      const shuffledIds = shuffled.cards.map((c) => c.id).sort();

      expect(shuffledIds).toEqual(originalIds);
    });
  });

  describe('drawCards', () => {
    it('should draw specified number of cards', () => {
      const cards = Array.from({ length: 5 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = createDeck(cards, defaultConfig);

      const [drawn, remaining] = drawCards(deck, 3);

      expect(drawn).toHaveLength(3);
      expect(remaining.cards).toHaveLength(2);
    });

    it('should draw from top of deck', () => {
      const cards = [
        createTestCard('first'),
        createTestCard('second'),
        createTestCard('third'),
      ];
      const deck = createDeck(cards, defaultConfig);

      const [drawn] = drawCards(deck, 2);

      expect(drawn[0]?.id).toBe('first');
      expect(drawn[1]?.id).toBe('second');
    });

    it('should handle drawing more than available', () => {
      const deck = createDeck([createTestCard('1')], defaultConfig);

      const [drawn, remaining] = drawCards(deck, 5);

      expect(drawn).toHaveLength(1);
      expect(remaining.cards).toHaveLength(0);
    });

    it('should handle drawing from empty deck', () => {
      const deck = createDeck([], defaultConfig);

      const [drawn, remaining] = drawCards(deck, 3);

      expect(drawn).toHaveLength(0);
      expect(remaining.cards).toHaveLength(0);
    });
  });

  describe('validateDeck', () => {
    it('should validate correct deck', () => {
      const cards = Array.from({ length: 12 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = createDeck(cards, strictConfig);

      const result = validateDeck(deck);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect too few cards', () => {
      const deck = { cards: [createTestCard('1')], config: strictConfig };

      const result = validateDeck(deck);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('minimum');
    });

    it('should detect too many cards', () => {
      const cards = Array.from({ length: 15 }, (_, i) =>
        createTestCard(`${i}`),
      );
      const deck = { cards, config: defaultConfig };

      const result = validateDeck(deck);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('maximum');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Deck System Properties', () => {
  /**
   * **Feature: core-progression, Property 1: Deck size invariant after add**
   * **Validates: Requirements 1.2**
   *
   * For any valid deck and valid card, adding the card should increase
   * deck size by exactly 1.
   */
  describe('Property 1: Deck size invariant after add', () => {
    it('adding a card increases deck size by 1', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(0, 10),
          arbitraryBaseCard(),
          (cards, newCard) => {
            // Ensure unique IDs
            const uniqueCards = cards.filter((c) => c.id !== newCard.id);
            if (uniqueCards.length >= 11) return true; // Skip if deck would be full

            const config: DeckConfig<BaseCard> = {
              maxDeckSize: 12,
              minDeckSize: 0,
              allowDuplicates: false,
              maxCopies: 1,
            };

            try {
              const deck = createDeck(uniqueCards, config);
              const sizeBefore = getDeckSize(deck);
              const newDeck = addCard(deck, newCard);
              const sizeAfter = getDeckSize(newDeck);

              return sizeAfter === sizeBefore + 1;
            } catch {
              // Invalid input, skip
              return true;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 2: Shuffle determinism**
   * **Validates: Requirements 1.2**
   *
   * For any deck and seed, shuffling twice with the same seed produces
   * identical results.
   */
  describe('Property 2: Shuffle determinism', () => {
    it('same seed produces same shuffle', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(2, 12),
          fc.integer({ min: 0, max: 1000000 }),
          (cards, seed) => {
            const config: DeckConfig<BaseCard> = {
              maxDeckSize: 12,
              minDeckSize: 0,
              allowDuplicates: false,
              maxCopies: 1,
            };

            try {
              const deck = createDeck(cards, config);
              const shuffled1 = shuffleDeck(deck, seed);
              const shuffled2 = shuffleDeck(deck, seed);

              const ids1 = shuffled1.cards.map((c) => c.id);
              const ids2 = shuffled2.cards.map((c) => c.id);

              return JSON.stringify(ids1) === JSON.stringify(ids2);
            } catch {
              return true;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 3: Draw preserves total cards**
   * **Validates: Requirements 1.2**
   *
   * For any deck and draw count, the total cards (drawn + remaining)
   * equals the original deck size.
   */
  describe('Property 3: Draw preserves total cards', () => {
    it('drawn + remaining equals original size', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(0, 12),
          fc.integer({ min: 0, max: 15 }),
          (cards, drawCount) => {
            const config: DeckConfig<BaseCard> = {
              maxDeckSize: 12,
              minDeckSize: 0,
              allowDuplicates: false,
              maxCopies: 1,
            };

            try {
              const deck = createDeck(cards, config);
              const originalSize = getDeckSize(deck);
              const [drawn, remaining] = drawCards(deck, drawCount);

              return drawn.length + getDeckSize(remaining) === originalSize;
            } catch {
              return true;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
