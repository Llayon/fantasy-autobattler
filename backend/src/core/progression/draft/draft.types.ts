/**
 * Draft System Types
 * 
 * @module core/progression/draft/types
 */

import { BaseCard } from '../types';

/**
 * Draft type determines available actions.
 */
export type DraftType = 'pick' | 'ban' | 'pick-and-ban';

/**
 * Configuration for draft behavior.
 */
export interface DraftConfig {
  /** Cards shown per draft */
  optionsCount: number;
  
  /** Cards to pick per draft */
  picksCount: number;
  
  /** Draft type */
  type: DraftType;
  
  /** Allow skipping draft */
  allowSkip: boolean;
  
  /** Reroll options allowed */
  rerollsAllowed: number;
}

/**
 * Draft state containing pool, options, and picks.
 */
export interface Draft<TCard extends BaseCard> {
  /** Remaining cards in pool */
  pool: TCard[];
  
  /** Current draft options */
  options: TCard[];
  
  /** Cards picked so far */
  picked: TCard[];
  
  /** Cards banned so far */
  banned: TCard[];
  
  /** Draft configuration */
  config: DraftConfig;
  
  /** Rerolls used */
  rerollsUsed: number;
  
  /** Current random seed */
  seed: number;
}

/**
 * Result of a completed draft.
 */
export interface DraftResult<TCard extends BaseCard> {
  /** Cards picked */
  picked: TCard[];
  
  /** Cards banned */
  banned: TCard[];
  
  /** Whether draft was skipped */
  skipped: boolean;
}
