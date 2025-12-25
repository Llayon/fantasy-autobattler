/**
 * Draft System Tests
 *
 * Unit tests and property-based tests for draft operations.
 *
 * @module core/progression/draft/spec
 */

import * as fc from 'fast-check';
import {
  createDraft,
  getDraftOptions,
  pickCard,
  banCard,
  rerollOptions,
  skipDraft,
  isDraftComplete,
  getDraftResult,
} from './draft';
import { DraftConfig } from './draft.types';
import { BaseCard } from '../types';
import {
  INITIAL_DRAFT_CONFIG,
  POST_BATTLE_DRAFT_CONFIG,
  ARENA_DRAFT_CONFIG,
} from './draft.presets';
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

const createTestPool = (count: number): BaseCard[] =>
  Array.from({ length: count }, (_, i) => createTestCard(`card-${i}`, `Card ${i}`));

const defaultConfig: DraftConfig = {
  optionsCount: 3,
  picksCount: 1,
  type: 'pick',
  allowSkip: false,
  rerollsAllowed: 0,
};

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Draft System', () => {
  describe('createDraft', () => {
    it('should create draft with correct number of options', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);

      expect(draft.options).toHaveLength(3);
      expect(draft.pool).toHaveLength(7);
      expect(draft.picked).toHaveLength(0);
      expect(draft.banned).toHaveLength(0);
    });

    it('should handle pool smaller than optionsCount', () => {
      const pool = createTestPool(2);
      const draft = createDraft(pool, defaultConfig, 12345);

      expect(draft.options).toHaveLength(2);
      expect(draft.pool).toHaveLength(0);
    });

    it('should handle empty pool', () => {
      const draft = createDraft([], defaultConfig, 12345);

      expect(draft.options).toHaveLength(0);
      expect(draft.pool).toHaveLength(0);
    });

    it('should be deterministic with same seed', () => {
      const pool = createTestPool(10);
      const draft1 = createDraft(pool, defaultConfig, 12345);
      const draft2 = createDraft(pool, defaultConfig, 12345);

      expect(draft1.options.map((c) => c.id)).toEqual(
        draft2.options.map((c) => c.id),
      );
    });

    it('should produce different results with different seeds', () => {
      const pool = createTestPool(10);
      const draft1 = createDraft(pool, defaultConfig, 12345);
      const draft2 = createDraft(pool, defaultConfig, 54321);

      expect(draft1.options.map((c) => c.id)).not.toEqual(
        draft2.options.map((c) => c.id),
      );
    });
  });


  describe('getDraftOptions', () => {
    it('should return copy of options', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);
      const options = getDraftOptions(draft);

      expect(options).toHaveLength(3);
      expect(options).not.toBe(draft.options);
    });
  });

  describe('pickCard', () => {
    it('should pick card from options', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);
      const cardToPick = draft.options[0]!;

      const newDraft = pickCard(draft, cardToPick.id);

      expect(newDraft.picked).toHaveLength(1);
      expect(newDraft.picked[0]?.id).toBe(cardToPick.id);
      expect(newDraft.options).toHaveLength(2);
    });

    it('should not mutate original draft', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);
      const cardToPick = draft.options[0]!;

      pickCard(draft, cardToPick.id);

      expect(draft.picked).toHaveLength(0);
      expect(draft.options).toHaveLength(3);
    });

    it('should throw when card not in options', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);

      expect(() => pickCard(draft, 'nonexistent')).toThrow('not in options');
    });

    it('should throw when max picks reached', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);
      const cardToPick = draft.options[0]!;

      const draftWithPick = pickCard(draft, cardToPick.id);

      expect(() => pickCard(draftWithPick, draftWithPick.options[0]!.id)).toThrow(
        'Already picked maximum cards',
      );
    });
  });

  describe('banCard', () => {
    it('should ban card in pick-and-ban mode', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, type: 'pick-and-ban' };
      const draft = createDraft(pool, config, 12345);
      const cardToBan = draft.options[0]!;

      const newDraft = banCard(draft, cardToBan.id);

      expect(newDraft.banned).toHaveLength(1);
      expect(newDraft.banned[0]?.id).toBe(cardToBan.id);
      expect(newDraft.options).toHaveLength(2);
    });

    it('should ban card in ban-only mode', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, type: 'ban' };
      const draft = createDraft(pool, config, 12345);
      const cardToBan = draft.options[0]!;

      const newDraft = banCard(draft, cardToBan.id);

      expect(newDraft.banned).toHaveLength(1);
    });

    it('should throw in pick-only mode', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);
      const cardToBan = draft.options[0]!;

      expect(() => banCard(draft, cardToBan.id)).toThrow(
        'Banning not allowed in pick-only draft',
      );
    });

    it('should throw when card not in options', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, type: 'pick-and-ban' };
      const draft = createDraft(pool, config, 12345);

      expect(() => banCard(draft, 'nonexistent')).toThrow('not in options');
    });
  });

  describe('rerollOptions', () => {
    it('should reroll options when allowed', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, rerollsAllowed: 1 };
      const draft = createDraft(pool, config, 12345);
      const originalOptions = draft.options.map((c) => c.id);

      const newDraft = rerollOptions(draft, 54321);

      expect(newDraft.rerollsUsed).toBe(1);
      expect(newDraft.options.map((c) => c.id)).not.toEqual(originalOptions);
    });

    it('should throw when no rerolls remaining', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);

      expect(() => rerollOptions(draft, 54321)).toThrow('No rerolls remaining');
    });

    it('should throw after using all rerolls', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, rerollsAllowed: 1 };
      const draft = createDraft(pool, config, 12345);

      const draftAfterReroll = rerollOptions(draft, 54321);

      expect(() => rerollOptions(draftAfterReroll, 99999)).toThrow(
        'No rerolls remaining',
      );
    });

    it('should be deterministic with same seed', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, rerollsAllowed: 2 };
      const draft = createDraft(pool, config, 12345);

      const rerolled1 = rerollOptions(draft, 54321);
      const rerolled2 = rerollOptions(draft, 54321);

      expect(rerolled1.options.map((c) => c.id)).toEqual(
        rerolled2.options.map((c) => c.id),
      );
    });
  });


  describe('skipDraft', () => {
    it('should skip draft when allowed', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, allowSkip: true };
      const draft = createDraft(pool, config, 12345);

      const skippedDraft = skipDraft(draft);

      expect(skippedDraft.options).toHaveLength(0);
      expect(skippedDraft.picked).toHaveLength(0);
    });

    it('should throw when skip not allowed', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);

      expect(() => skipDraft(draft)).toThrow('Skipping not allowed');
    });
  });

  describe('isDraftComplete', () => {
    it('should return true when picks complete', () => {
      const pool = createTestPool(10);
      const draft = createDraft(pool, defaultConfig, 12345);
      const cardToPick = draft.options[0]!;

      const draftWithPick = pickCard(draft, cardToPick.id);

      expect(isDraftComplete(draftWithPick)).toBe(true);
    });

    it('should return false when picks incomplete', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, picksCount: 2 };
      const draft = createDraft(pool, config, 12345);
      const cardToPick = draft.options[0]!;

      const draftWithPick = pickCard(draft, cardToPick.id);

      expect(isDraftComplete(draftWithPick)).toBe(false);
    });

    it('should return true when skipped', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, allowSkip: true };
      const draft = createDraft(pool, config, 12345);

      const skippedDraft = skipDraft(draft);

      expect(isDraftComplete(skippedDraft)).toBe(true);
    });

    it('should return true when pool exhausted', () => {
      const pool = createTestPool(2);
      const config: DraftConfig = { ...defaultConfig, optionsCount: 5, picksCount: 3 };
      const draft = createDraft(pool, config, 12345);

      // Pick both available cards
      let currentDraft = pickCard(draft, draft.options[0]!.id);
      currentDraft = pickCard(currentDraft, currentDraft.options[0]!.id);

      expect(isDraftComplete(currentDraft)).toBe(true);
    });
  });

  describe('getDraftResult', () => {
    it('should return picked and banned cards', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = {
        optionsCount: 5,
        picksCount: 2,
        type: 'pick-and-ban',
        allowSkip: false,
        rerollsAllowed: 0,
      };
      const draft = createDraft(pool, config, 12345);

      let currentDraft = pickCard(draft, draft.options[0]!.id);
      currentDraft = banCard(currentDraft, currentDraft.options[0]!.id);
      currentDraft = pickCard(currentDraft, currentDraft.options[0]!.id);

      const result = getDraftResult(currentDraft);

      expect(result.picked).toHaveLength(2);
      expect(result.banned).toHaveLength(1);
      expect(result.skipped).toBe(false);
    });

    it('should indicate skipped draft', () => {
      const pool = createTestPool(10);
      const config: DraftConfig = { ...defaultConfig, allowSkip: true };
      const draft = createDraft(pool, config, 12345);

      const skippedDraft = skipDraft(draft);
      const result = getDraftResult(skippedDraft);

      expect(result.skipped).toBe(true);
      expect(result.picked).toHaveLength(0);
    });
  });

  describe('Presets', () => {
    it('INITIAL_DRAFT_CONFIG should work correctly', () => {
      const pool = createTestPool(20);
      const draft = createDraft(pool, INITIAL_DRAFT_CONFIG, 12345);

      expect(draft.options).toHaveLength(5);
      expect(draft.config.picksCount).toBe(3);
      expect(draft.config.allowSkip).toBe(false);
    });

    it('POST_BATTLE_DRAFT_CONFIG should work correctly', () => {
      const pool = createTestPool(20);
      const draft = createDraft(pool, POST_BATTLE_DRAFT_CONFIG, 12345);

      expect(draft.options).toHaveLength(3);
      expect(draft.config.picksCount).toBe(1);
      expect(draft.config.allowSkip).toBe(true);
      expect(draft.config.rerollsAllowed).toBe(1);
    });

    it('ARENA_DRAFT_CONFIG should allow banning', () => {
      const pool = createTestPool(20);
      const draft = createDraft(pool, ARENA_DRAFT_CONFIG, 12345);
      const cardToBan = draft.options[0]!;

      const newDraft = banCard(draft, cardToBan.id);

      expect(newDraft.banned).toHaveLength(1);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Draft System Properties', () => {
  /**
   * **Feature: core-progression, Property 7: Draft options count**
   * **Validates: Requirements 3.2**
   *
   * For any pool and config, createDraft should produce exactly
   * min(optionsCount, pool.length) options.
   */
  describe('Property 7: Draft options count', () => {
    it('options count equals min(optionsCount, pool.length)', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(0, 20),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 1000000 }),
          (cards, optionsCount, seed) => {
            const config: DraftConfig = {
              optionsCount,
              picksCount: 1,
              type: 'pick',
              allowSkip: false,
              rerollsAllowed: 0,
            };

            const draft = createDraft(cards, config, seed);
            const expectedCount = Math.min(optionsCount, cards.length);

            return draft.options.length === expectedCount;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 8: Draft determinism**
   * **Validates: Requirements 3.2**
   *
   * For any pool, config, and seed, creating a draft twice with the
   * same inputs should produce identical options.
   */
  describe('Property 8: Draft determinism', () => {
    it('same inputs produce identical options', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(1, 20),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 1000000 }),
          (cards, optionsCount, seed) => {
            const config: DraftConfig = {
              optionsCount,
              picksCount: 1,
              type: 'pick',
              allowSkip: false,
              rerollsAllowed: 0,
            };

            const draft1 = createDraft(cards, config, seed);
            const draft2 = createDraft(cards, config, seed);

            const ids1 = draft1.options.map((c) => c.id);
            const ids2 = draft2.options.map((c) => c.id);

            return JSON.stringify(ids1) === JSON.stringify(ids2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 9: Pick removes from options**
   * **Validates: Requirements 3.2**
   *
   * For any draft and valid card pick, the picked card should be
   * removed from options and added to picked array.
   */
  describe('Property 9: Pick removes from options', () => {
    it('picked card moves from options to picked array', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(3, 20),
          fc.integer({ min: 0, max: 1000000 }),
          (cards, seed) => {
            const config: DraftConfig = {
              optionsCount: 3,
              picksCount: 3,
              type: 'pick',
              allowSkip: false,
              rerollsAllowed: 0,
            };

            const draft = createDraft(cards, config, seed);

            if (draft.options.length === 0) {
              return true; // Skip if no options
            }

            const cardToPick = draft.options[0];
            if (!cardToPick) {
              return true;
            }

            const newDraft = pickCard(draft, cardToPick.id);

            // Card should be in picked
            const inPicked = newDraft.picked.some((c) => c.id === cardToPick.id);
            // Card should not be in options
            const notInOptions = !newDraft.options.some(
              (c) => c.id === cardToPick.id,
            );
            // Picked length increased by 1
            const pickedIncreased =
              newDraft.picked.length === draft.picked.length + 1;
            // Options length decreased by 1
            const optionsDecreased =
              newDraft.options.length === draft.options.length - 1;

            return inPicked && notInOptions && pickedIncreased && optionsDecreased;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 10: Reroll limit enforcement**
   * **Validates: Requirements 3.2**
   *
   * For any draft, attempting more than rerollsAllowed rerolls
   * should throw an error.
   */
  describe('Property 10: Reroll limit enforcement', () => {
    it('rerolls beyond limit throw error', () => {
      fc.assert(
        fc.property(
          arbitraryBaseCards(5, 20),
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 0, max: 1000000 }),
          (cards, rerollsAllowed, seed) => {
            const config: DraftConfig = {
              optionsCount: 3,
              picksCount: 1,
              type: 'pick',
              allowSkip: false,
              rerollsAllowed,
            };

            let draft = createDraft(cards, config, seed);

            // Use all allowed rerolls
            for (let i = 0; i < rerollsAllowed; i++) {
              draft = rerollOptions(draft, seed + i + 1);
            }

            // Next reroll should throw
            try {
              rerollOptions(draft, seed + rerollsAllowed + 1);
              return false; // Should have thrown
            } catch (e) {
              return (e as Error).message === 'No rerolls remaining';
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
