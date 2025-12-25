/**
 * Deck System Operations
 *
 * Pure functions for managing card decks with shuffle, draw, and validation.
 * All operations are immutable and deterministic (using seeded random).
 *
 * @module core/progression/deck
 */

import { SeededRandom } from '../../utils/random';
import { BaseCard } from '../types';
import { Deck, DeckConfig, DeckValidationResult } from './deck.types';

/**
 * Creates a new deck with the given cards and configuration.
 *
 * @param cards - Initial cards in the deck
 * @param config - Deck configuration
 * @returns New deck instance
 * @throws Error if initial cards violate config
 *
 * @example
 * const deck = createDeck(myCards, {
 *   maxDeckSize: 12,
 *   minDeckSize: 12,
 *   allowDuplicates: false,
 *   maxCopies: 1,
 * });
 */
export function createDeck<TCard extends BaseCard>(
  cards: TCard[],
  config: DeckConfig<TCard>,
): Deck<TCard> {
  const deck: Deck<TCard> = { cards: [...cards], config };
  const validation = validateDeck(deck);

  if (!validation.valid) {
    throw new Error(`Invalid deck: ${validation.errors.join(', ')}`);
  }

  return deck;
}

/**
 * Adds a card to the deck.
 *
 * @param deck - Target deck
 * @param card - Card to add
 * @returns Updated deck (immutable)
 * @throws Error if deck is full or card invalid
 *
 * @example
 * const newDeck = addCard(deck, newCard);
 */
export function addCard<TCard extends BaseCard>(
  deck: Deck<TCard>,
  card: TCard,
): Deck<TCard> {
  if (deck.cards.length >= deck.config.maxDeckSize) {
    throw new Error('Deck is full');
  }

  if (deck.config.validateCard && !deck.config.validateCard(card)) {
    throw new Error('Card failed validation');
  }

  if (!deck.config.allowDuplicates) {
    const existing = deck.cards.find((c) => c.id === card.id);
    if (existing) {
      throw new Error('Duplicates not allowed');
    }
  } else if (deck.config.maxCopies > 0) {
    const copies = deck.cards.filter((c) => c.id === card.id).length;
    if (copies >= deck.config.maxCopies) {
      throw new Error(`Max ${deck.config.maxCopies} copies allowed`);
    }
  }

  return {
    ...deck,
    cards: [...deck.cards, card],
  };
}

/**
 * Removes a card from the deck by ID.
 *
 * @param deck - Target deck
 * @param cardId - ID of card to remove
 * @returns Updated deck (immutable)
 * @throws Error if card not found
 *
 * @example
 * const newDeck = removeCard(deck, 'card-123');
 */
export function removeCard<TCard extends BaseCard>(
  deck: Deck<TCard>,
  cardId: string,
): Deck<TCard> {
  const index = deck.cards.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new Error(`Card ${cardId} not found in deck`);
  }

  return {
    ...deck,
    cards: [...deck.cards.slice(0, index), ...deck.cards.slice(index + 1)],
  };
}

/**
 * Shuffles the deck using seeded random for determinism.
 * Uses Fisher-Yates algorithm.
 *
 * @param deck - Deck to shuffle
 * @param seed - Random seed for determinism
 * @returns Shuffled deck (immutable)
 *
 * @example
 * const shuffled = shuffleDeck(deck, 12345);
 * // Same seed always produces same shuffle
 */
export function shuffleDeck<TCard extends BaseCard>(
  deck: Deck<TCard>,
  seed: number,
): Deck<TCard> {
  const rng = new SeededRandom(seed);
  const cards = rng.shuffle(deck.cards);

  return { ...deck, cards };
}

/**
 * Draws cards from the top of the deck.
 *
 * @param deck - Source deck
 * @param count - Number of cards to draw
 * @returns Tuple of [drawn cards, remaining deck]
 *
 * @example
 * const [hand, remainingDeck] = drawCards(deck, 5);
 */
export function drawCards<TCard extends BaseCard>(
  deck: Deck<TCard>,
  count: number,
): [TCard[], Deck<TCard>] {
  const actualCount = Math.min(count, deck.cards.length);
  const drawn = deck.cards.slice(0, actualCount);
  const remaining: Deck<TCard> = {
    ...deck,
    cards: deck.cards.slice(actualCount),
  };

  return [drawn, remaining];
}

/**
 * Gets the current deck size.
 *
 * @param deck - Deck to check
 * @returns Number of cards in deck
 */
export function getDeckSize<TCard extends BaseCard>(deck: Deck<TCard>): number {
  return deck.cards.length;
}

/**
 * Validates deck against its configuration.
 *
 * @param deck - Deck to validate
 * @returns Validation result with errors if any
 *
 * @example
 * const result = validateDeck(deck);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateDeck<TCard extends BaseCard>(
  deck: Deck<TCard>,
): DeckValidationResult {
  const errors: string[] = [];

  if (deck.cards.length < deck.config.minDeckSize) {
    errors.push(
      `Deck has ${deck.cards.length} cards, minimum is ${deck.config.minDeckSize}`,
    );
  }

  if (deck.cards.length > deck.config.maxDeckSize) {
    errors.push(
      `Deck has ${deck.cards.length} cards, maximum is ${deck.config.maxDeckSize}`,
    );
  }

  if (!deck.config.allowDuplicates) {
    const ids = deck.cards.map((c) => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      errors.push(
        `Duplicate cards found: ${[...new Set(duplicates)].join(', ')}`,
      );
    }
  } else if (deck.config.maxCopies > 0) {
    const counts = new Map<string, number>();
    for (const card of deck.cards) {
      counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    for (const [id, count] of counts) {
      if (count > deck.config.maxCopies) {
        errors.push(
          `Card ${id} has ${count} copies, max is ${deck.config.maxCopies}`,
        );
      }
    }
  }

  if (deck.config.validateCard) {
    for (const card of deck.cards) {
      if (!deck.config.validateCard(card)) {
        errors.push(`Card ${card.id} failed custom validation`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
