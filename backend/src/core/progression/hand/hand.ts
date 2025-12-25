/**
 * Hand System Operations
 *
 * Pure functions for managing cards in hand with overflow handling.
 * All operations are immutable.
 *
 * @module core/progression/hand
 */

import { BaseCard } from '../types';
import { Hand, HandConfig } from './hand.types';

/**
 * Result of adding cards to hand.
 */
export interface AddToHandResult<TCard extends BaseCard> {
  /** Updated hand */
  hand: Hand<TCard>;
  /** Cards that were discarded due to overflow */
  discarded: TCard[];
}

/**
 * Creates a new empty hand.
 *
 * @param config - Hand configuration
 * @returns New empty hand
 *
 * @example
 * const hand = createHand({
 *   maxHandSize: 7,
 *   startingHandSize: 5,
 *   autoDiscard: true,
 * });
 */
export function createHand<TCard extends BaseCard>(
  config: HandConfig,
): Hand<TCard> {
  return { cards: [], config };
}

/**
 * Adds cards to hand, respecting max size.
 * If autoDiscard is enabled, excess cards are discarded (newest first).
 * If autoDiscard is disabled, throws error on overflow.
 *
 * @param hand - Target hand
 * @param cards - Cards to add
 * @returns Updated hand and any discarded cards
 * @throws Error if hand overflows and autoDiscard is disabled
 *
 * @example
 * const { hand: newHand, discarded } = addToHand(hand, drawnCards);
 */
export function addToHand<TCard extends BaseCard>(
  hand: Hand<TCard>,
  cards: TCard[],
): AddToHandResult<TCard> {
  const newCards = [...hand.cards, ...cards];

  if (newCards.length <= hand.config.maxHandSize) {
    return {
      hand: { ...hand, cards: newCards },
      discarded: [],
    };
  }

  if (hand.config.autoDiscard) {
    const kept = newCards.slice(0, hand.config.maxHandSize);
    const discarded = newCards.slice(hand.config.maxHandSize);
    return {
      hand: { ...hand, cards: kept },
      discarded,
    };
  }

  throw new Error(
    `Hand overflow: ${newCards.length} cards, max is ${hand.config.maxHandSize}`,
  );
}

/**
 * Removes a card from hand by ID.
 *
 * @param hand - Target hand
 * @param cardId - ID of card to remove
 * @returns Updated hand (immutable)
 * @throws Error if card not found
 *
 * @example
 * const newHand = removeFromHand(hand, 'card-123');
 */
export function removeFromHand<TCard extends BaseCard>(
  hand: Hand<TCard>,
  cardId: string,
): Hand<TCard> {
  const index = hand.cards.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new Error(`Card ${cardId} not in hand`);
  }

  return {
    ...hand,
    cards: [...hand.cards.slice(0, index), ...hand.cards.slice(index + 1)],
  };
}

/**
 * Gets the current hand size.
 *
 * @param hand - Hand to check
 * @returns Number of cards in hand
 */
export function getHandSize<TCard extends BaseCard>(hand: Hand<TCard>): number {
  return hand.cards.length;
}

/**
 * Checks if hand is full.
 *
 * @param hand - Hand to check
 * @returns True if hand is at max capacity
 *
 * @example
 * if (isHandFull(hand)) {
 *   console.log('Cannot draw more cards');
 * }
 */
export function isHandFull<TCard extends BaseCard>(hand: Hand<TCard>): boolean {
  return hand.cards.length >= hand.config.maxHandSize;
}

/**
 * Gets available space in hand.
 *
 * @param hand - Hand to check
 * @returns Number of cards that can be added
 */
export function getHandSpace<TCard extends BaseCard>(
  hand: Hand<TCard>,
): number {
  return Math.max(0, hand.config.maxHandSize - hand.cards.length);
}

/**
 * Discards excess cards from hand (oldest first).
 * Only useful if autoDiscard was disabled during addToHand.
 *
 * @param hand - Hand to trim
 * @returns Updated hand and discarded cards
 */
export function discardExcess<TCard extends BaseCard>(
  hand: Hand<TCard>,
): AddToHandResult<TCard> {
  if (hand.cards.length <= hand.config.maxHandSize) {
    return { hand, discarded: [] };
  }

  const kept = hand.cards.slice(0, hand.config.maxHandSize);
  const discarded = hand.cards.slice(hand.config.maxHandSize);

  return {
    hand: { ...hand, cards: kept },
    discarded,
  };
}
