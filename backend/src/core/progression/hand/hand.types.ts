/**
 * Hand System Types
 * 
 * @module core/progression/hand/types
 */

import { BaseCard } from '../types';

/**
 * Configuration for hand behavior.
 */
export interface HandConfig {
  /** Maximum cards in hand */
  maxHandSize: number;
  
  /** Starting hand size (for initial draw) */
  startingHandSize: number;
  
  /** Auto-discard excess cards when hand overflows */
  autoDiscard: boolean;
}

/**
 * Hand state containing cards and configuration.
 */
export interface Hand<TCard extends BaseCard> {
  /** Cards currently in hand */
  cards: TCard[];
  
  /** Hand configuration */
  config: HandConfig;
}
