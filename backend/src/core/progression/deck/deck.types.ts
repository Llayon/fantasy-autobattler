/**
 * Deck System Types
 * 
 * @module core/progression/deck/types
 */

import { BaseCard } from '../types';

/**
 * Configuration for deck behavior.
 * 
 * @example
 * const roguelikeDeck: DeckConfig<UnitCard> = {
 *   maxDeckSize: 12,
 *   minDeckSize: 12,
 *   allowDuplicates: false,
 *   maxCopies: 1,
 * };
 */
export interface DeckConfig<TCard extends BaseCard> {
  /** Maximum cards in deck */
  maxDeckSize: number;
  
  /** Minimum cards in deck */
  minDeckSize: number;
  
  /** Allow duplicate cards */
  allowDuplicates: boolean;
  
  /** Max copies of same card (if duplicates allowed) */
  maxCopies: number;
  
  /** Optional card validator function */
  validateCard?: (card: TCard) => boolean;
}

/**
 * Deck state containing cards and configuration.
 */
export interface Deck<TCard extends BaseCard> {
  /** Cards currently in the deck */
  cards: TCard[];
  
  /** Deck configuration */
  config: DeckConfig<TCard>;
}

/**
 * Result of deck validation.
 */
export interface DeckValidationResult {
  /** Whether the deck is valid */
  valid: boolean;
  
  /** List of validation errors */
  errors: string[];
}
