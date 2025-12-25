/**
 * Draft System Presets
 *
 * Pre-configured draft settings for common game scenarios.
 *
 * @module core/progression/draft/presets
 */

import { DraftConfig } from './draft.types';

/**
 * Initial draft configuration for roguelike runs.
 * Players choose 3 cards from 5 options at the start.
 *
 * @example
 * const draft = createDraft(pool, INITIAL_DRAFT_CONFIG, seed);
 */
export const INITIAL_DRAFT_CONFIG: DraftConfig = {
  optionsCount: 5,
  picksCount: 3,
  type: 'pick',
  allowSkip: false,
  rerollsAllowed: 0,
};

/**
 * Post-battle draft configuration.
 * Players choose 1 card from 3 options after winning a battle.
 * Allows skipping and one reroll.
 *
 * @example
 * const draft = createDraft(pool, POST_BATTLE_DRAFT_CONFIG, seed);
 */
export const POST_BATTLE_DRAFT_CONFIG: DraftConfig = {
  optionsCount: 3,
  picksCount: 1,
  type: 'pick',
  allowSkip: true,
  rerollsAllowed: 1,
};

/**
 * Arena draft configuration with pick-and-ban mechanics.
 * Players can both pick and ban cards for competitive drafting.
 *
 * @example
 * const draft = createDraft(pool, ARENA_DRAFT_CONFIG, seed);
 */
export const ARENA_DRAFT_CONFIG: DraftConfig = {
  optionsCount: 5,
  picksCount: 2,
  type: 'pick-and-ban',
  allowSkip: false,
  rerollsAllowed: 0,
};
