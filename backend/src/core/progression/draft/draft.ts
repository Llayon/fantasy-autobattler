/**
 * Draft System Operations
 *
 * Pure functions for managing card drafts with pick, ban, and reroll mechanics.
 * All operations are immutable and deterministic (using seeded random).
 *
 * @module core/progression/draft
 */

import { SeededRandom } from '../../utils/random';
import { BaseCard } from '../types';
import { Draft, DraftConfig, DraftResult } from './draft.types';

/**
 * Creates a new draft from a card pool.
 *
 * @param pool - Available cards to draft from
 * @param config - Draft configuration
 * @param seed - Random seed for determinism
 * @returns New draft instance with options selected from pool
 *
 * @example
 * const draft = createDraft(cardPool, {
 *   optionsCount: 3,
 *   picksCount: 1,
 *   type: 'pick',
 *   allowSkip: true,
 *   rerollsAllowed: 1,
 * }, 12345);
 */
export function createDraft<TCard extends BaseCard>(
  pool: TCard[],
  config: DraftConfig,
  seed: number,
): Draft<TCard> {
  const rng = new SeededRandom(seed);
  const shuffled = rng.shuffle([...pool]);
  const optionsCount = Math.min(config.optionsCount, shuffled.length);
  const options = shuffled.slice(0, optionsCount);
  const remainingPool = shuffled.slice(optionsCount);

  return {
    pool: remainingPool,
    options,
    picked: [],
    banned: [],
    config,
    rerollsUsed: 0,
    seed,
  };
}

/**
 * Gets the current draft options.
 *
 * @param draft - Current draft state
 * @returns Array of available options
 *
 * @example
 * const options = getDraftOptions(draft);
 */
export function getDraftOptions<TCard extends BaseCard>(
  draft: Draft<TCard>,
): TCard[] {
  return [...draft.options];
}


/**
 * Picks a card from draft options.
 *
 * @param draft - Current draft state
 * @param cardId - ID of card to pick
 * @returns Updated draft with card picked (immutable)
 * @throws Error if card not in options or max picks reached
 *
 * @example
 * const newDraft = pickCard(draft, 'card-123');
 */
export function pickCard<TCard extends BaseCard>(
  draft: Draft<TCard>,
  cardId: string,
): Draft<TCard> {
  const card = draft.options.find((c) => c.id === cardId);
  if (!card) {
    throw new Error(`Card ${cardId} not in options`);
  }

  if (draft.picked.length >= draft.config.picksCount) {
    throw new Error('Already picked maximum cards');
  }

  return {
    ...draft,
    options: draft.options.filter((c) => c.id !== cardId),
    picked: [...draft.picked, card],
  };
}

/**
 * Bans a card from draft options.
 *
 * @param draft - Current draft state
 * @param cardId - ID of card to ban
 * @returns Updated draft with card banned (immutable)
 * @throws Error if banning not allowed or card not in options
 *
 * @example
 * const newDraft = banCard(draft, 'card-456');
 */
export function banCard<TCard extends BaseCard>(
  draft: Draft<TCard>,
  cardId: string,
): Draft<TCard> {
  if (draft.config.type === 'pick') {
    throw new Error('Banning not allowed in pick-only draft');
  }

  const card = draft.options.find((c) => c.id === cardId);
  if (!card) {
    throw new Error(`Card ${cardId} not in options`);
  }

  return {
    ...draft,
    options: draft.options.filter((c) => c.id !== cardId),
    banned: [...draft.banned, card],
  };
}

/**
 * Rerolls draft options (if allowed).
 *
 * @param draft - Current draft state
 * @param newSeed - New random seed for reroll
 * @returns Updated draft with new options (immutable)
 * @throws Error if no rerolls remaining
 *
 * @example
 * const newDraft = rerollOptions(draft, 54321);
 */
export function rerollOptions<TCard extends BaseCard>(
  draft: Draft<TCard>,
  newSeed: number,
): Draft<TCard> {
  if (draft.rerollsUsed >= draft.config.rerollsAllowed) {
    throw new Error('No rerolls remaining');
  }

  const rng = new SeededRandom(newSeed);
  const allAvailable = [...draft.pool, ...draft.options];
  const shuffled = rng.shuffle(allAvailable);
  const optionsCount = Math.min(draft.config.optionsCount, shuffled.length);
  const newOptions = shuffled.slice(0, optionsCount);
  const newPool = shuffled.slice(optionsCount);

  return {
    ...draft,
    pool: newPool,
    options: newOptions,
    rerollsUsed: draft.rerollsUsed + 1,
    seed: newSeed,
  };
}

/**
 * Skips the draft without picking any cards.
 *
 * @param draft - Current draft state
 * @returns Updated draft marked as skipped (immutable)
 * @throws Error if skipping not allowed
 *
 * @example
 * const skippedDraft = skipDraft(draft);
 */
export function skipDraft<TCard extends BaseCard>(
  draft: Draft<TCard>,
): Draft<TCard> {
  if (!draft.config.allowSkip) {
    throw new Error('Skipping not allowed in this draft');
  }

  // Mark as complete by setting picked to empty (skipped state)
  return {
    ...draft,
    options: [],
  };
}

/**
 * Checks if draft is complete.
 * Draft is complete when required picks are made or draft was skipped.
 *
 * @param draft - Current draft state
 * @returns True if draft is complete
 *
 * @example
 * if (isDraftComplete(draft)) {
 *   const result = getDraftResult(draft);
 * }
 */
export function isDraftComplete<TCard extends BaseCard>(
  draft: Draft<TCard>,
): boolean {
  // Complete if picked enough cards
  if (draft.picked.length >= draft.config.picksCount) {
    return true;
  }

  // Complete if skipped (options cleared and skip allowed)
  if (draft.options.length === 0 && draft.config.allowSkip) {
    return true;
  }

  // Complete if no more options available (pool exhausted)
  if (draft.options.length === 0 && draft.pool.length === 0) {
    return true;
  }

  return false;
}

/**
 * Gets draft result.
 *
 * @param draft - Current draft state
 * @returns Draft result with picked and banned cards
 *
 * @example
 * const result = getDraftResult(draft);
 * console.log(`Picked: ${result.picked.length}, Banned: ${result.banned.length}`);
 */
export function getDraftResult<TCard extends BaseCard>(
  draft: Draft<TCard>,
): DraftResult<TCard> {
  const skipped =
    draft.picked.length === 0 &&
    draft.options.length === 0 &&
    draft.config.allowSkip;

  return {
    picked: [...draft.picked],
    banned: [...draft.banned],
    skipped,
  };
}
