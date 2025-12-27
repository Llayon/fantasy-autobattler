/**
 * Unit tests for RoguelikeRunEntity
 *
 * @module roguelike/entities/run.spec
 */

import { RoguelikeRunEntity, RUN_CONSTANTS } from './run.entity';
import { DeckCard } from '../types/unit.types';

describe('RoguelikeRunEntity', () => {
  /**
   * Creates a valid run entity for testing.
   */
  function createValidRun(): RoguelikeRunEntity {
    const run = new RoguelikeRunEntity();
    run.playerId = '550e8400-e29b-41d4-a716-446655440000';
    run.faction = 'humans';
    run.leaderId = 'commander_aldric';
    run.deck = createDeck();
    run.remainingDeck = createDeck().slice(3);
    run.hand = createDeck().slice(0, 3);
    run.field = [];
    run.spells = [{ spellId: 'holy_light' }, { spellId: 'rally' }];
    run.wins = 0;
    run.losses = 0;
    run.consecutiveWins = 0;
    run.consecutiveLosses = 0;
    run.gold = RUN_CONSTANTS.STARTING_GOLD;
    run.battleHistory = [];
    run.status = 'active';
    run.rating = RUN_CONSTANTS.STARTING_RATING;
    return run;
  }

  /**
   * Creates a sample deck for testing.
   */
  function createDeck(): DeckCard[] {
    return Array.from({ length: 12 }, (_, i) => ({
      unitId: `unit_${i}`,
      tier: 1 as const,
      instanceId: `unit_${i}_instance`,
    }));
  }

  describe('RUN_CONSTANTS', () => {
    it('should have correct starting values', () => {
      expect(RUN_CONSTANTS.STARTING_GOLD).toBe(10);
      expect(RUN_CONSTANTS.STARTING_RATING).toBe(1000);
      expect(RUN_CONSTANTS.MAX_WINS).toBe(9);
      expect(RUN_CONSTANTS.MAX_LOSSES).toBe(4);
      expect(RUN_CONSTANTS.MAX_HAND_SIZE).toBe(12);
      expect(RUN_CONSTANTS.DECK_SIZE).toBe(12);
      expect(RUN_CONSTANTS.SPELLS_COUNT).toBe(2);
    });
  });

  describe('validateRun', () => {
    describe('wins and losses validation', () => {
      it('should accept valid wins (0-9)', () => {
        const run = createValidRun();
        run.wins = 5;
        expect(() => run.validateRun()).not.toThrow();
      });

      it('should reject negative wins', () => {
        const run = createValidRun();
        run.wins = -1;
        expect(() => run.validateRun()).toThrow('Wins must be between 0 and 9');
      });

      it('should reject wins > 9', () => {
        const run = createValidRun();
        run.wins = 10;
        expect(() => run.validateRun()).toThrow('Wins must be between 0 and 9');
      });

      it('should accept valid losses (0-4)', () => {
        const run = createValidRun();
        run.losses = 3;
        expect(() => run.validateRun()).not.toThrow();
      });

      it('should reject negative losses', () => {
        const run = createValidRun();
        run.losses = -1;
        expect(() => run.validateRun()).toThrow('Losses must be between 0 and 4');
      });

      it('should reject losses > 4', () => {
        const run = createValidRun();
        run.losses = 5;
        expect(() => run.validateRun()).toThrow('Losses must be between 0 and 4');
      });
    });

    describe('gold validation', () => {
      it('should accept positive gold', () => {
        const run = createValidRun();
        run.gold = 100;
        expect(() => run.validateRun()).not.toThrow();
      });

      it('should accept zero gold', () => {
        const run = createValidRun();
        run.gold = 0;
        expect(() => run.validateRun()).not.toThrow();
      });

      it('should reject negative gold', () => {
        const run = createValidRun();
        run.gold = -1;
        expect(() => run.validateRun()).toThrow('Gold cannot be negative');
      });
    });

    describe('deck validation', () => {
      it('should accept valid deck arrays', () => {
        const run = createValidRun();
        expect(() => run.validateRun()).not.toThrow();
      });

      it('should reject non-array deck', () => {
        const run = createValidRun();
        run.deck = 'invalid' as unknown as DeckCard[];
        expect(() => run.validateRun()).toThrow('Deck must be an array');
      });

      it('should reject non-array remainingDeck', () => {
        const run = createValidRun();
        run.remainingDeck = 'invalid' as unknown as DeckCard[];
        expect(() => run.validateRun()).toThrow('Remaining deck must be an array');
      });

      it('should reject non-array hand', () => {
        const run = createValidRun();
        run.hand = 'invalid' as unknown as DeckCard[];
        expect(() => run.validateRun()).toThrow('Hand must be an array');
      });

      it('should reject hand exceeding max size', () => {
        const run = createValidRun();
        run.hand = Array.from({ length: 13 }, (_, i) => ({
          unitId: `unit_${i}`,
          tier: 1 as const,
          instanceId: `unit_${i}_instance`,
        }));
        expect(() => run.validateRun()).toThrow('Hand cannot exceed 12 cards');
      });
    });

    describe('status auto-update', () => {
      it('should set status to won when wins reach 9', () => {
        const run = createValidRun();
        run.wins = 9;
        run.validateRun();
        expect(run.status).toBe('won');
      });

      it('should set status to lost when losses reach 4', () => {
        const run = createValidRun();
        run.losses = 4;
        run.validateRun();
        expect(run.status).toBe('lost');
      });

      it('should not change non-active status', () => {
        const run = createValidRun();
        run.status = 'won';
        run.wins = 0;
        run.validateRun();
        expect(run.status).toBe('won');
      });
    });
  });

  describe('isActive', () => {
    it('should return true for active runs', () => {
      const run = createValidRun();
      run.status = 'active';
      expect(run.isActive()).toBe(true);
    });

    it('should return false for won runs', () => {
      const run = createValidRun();
      run.status = 'won';
      expect(run.isActive()).toBe(false);
    });

    it('should return false for lost runs', () => {
      const run = createValidRun();
      run.status = 'lost';
      expect(run.isActive()).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('should return false for active runs', () => {
      const run = createValidRun();
      run.status = 'active';
      expect(run.isComplete()).toBe(false);
    });

    it('should return true for won runs', () => {
      const run = createValidRun();
      run.status = 'won';
      expect(run.isComplete()).toBe(true);
    });

    it('should return true for lost runs', () => {
      const run = createValidRun();
      run.status = 'lost';
      expect(run.isComplete()).toBe(true);
    });
  });

  describe('getRemainingBattles', () => {
    it('should calculate remaining battles correctly at start', () => {
      const run = createValidRun();
      run.wins = 0;
      run.losses = 0;
      const remaining = run.getRemainingBattles();
      expect(remaining.winsNeeded).toBe(9);
      expect(remaining.lossesAllowed).toBe(3);
    });

    it('should calculate remaining battles mid-run', () => {
      const run = createValidRun();
      run.wins = 5;
      run.losses = 2;
      const remaining = run.getRemainingBattles();
      expect(remaining.winsNeeded).toBe(4);
      expect(remaining.lossesAllowed).toBe(1);
    });

    it('should show 0 losses allowed when at 3 losses', () => {
      const run = createValidRun();
      run.wins = 3;
      run.losses = 3;
      const remaining = run.getRemainingBattles();
      expect(remaining.lossesAllowed).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should return correct summary', () => {
      const run = createValidRun();
      run.id = 'test-run-id';
      run.wins = 3;
      run.losses = 1;
      run.gold = 25;

      const summary = run.getSummary();

      expect(summary.id).toBe('test-run-id');
      expect(summary.faction).toBe('humans');
      expect(summary.wins).toBe(3);
      expect(summary.losses).toBe(1);
      expect(summary.gold).toBe(25);
      expect(summary.status).toBe('active');
      expect(summary.handSize).toBe(3);
      expect(summary.deckRemaining).toBe(9);
    });
  });
});
