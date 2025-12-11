/**
 * Test suite for MatchmakingQueue entity.
 * Tests entity validation, utility methods, and business logic.
 */

import { MatchmakingQueue, MatchmakingStatus } from './matchmaking-queue.entity';

describe('MatchmakingQueue Entity', () => {
  let queueEntry: MatchmakingQueue;

  beforeEach(() => {
    queueEntry = new MatchmakingQueue();
    queueEntry.id = 'queue-123';
    queueEntry.playerId = 'player-123';
    queueEntry.teamId = 'team-456';
    queueEntry.rating = 1300;
    queueEntry.status = MatchmakingStatus.WAITING;
    queueEntry.joinedAt = new Date();
    queueEntry.createdAt = new Date();
    queueEntry.updatedAt = new Date();
  });

  describe('Entity Creation and Validation', () => {
    it('should create a matchmaking queue entry with default values', () => {
      const entry = new MatchmakingQueue();
      entry.playerId = 'player-123';
      entry.teamId = 'team-456';

      expect(entry.playerId).toBe('player-123');
      expect(entry.teamId).toBe('team-456');
      expect(entry.rating).toBeUndefined(); // Will be set by default in database
      expect(entry.status).toBeUndefined(); // Will be set by default in database
    });

    it('should create a queue entry with custom rating', () => {
      const entry = new MatchmakingQueue();
      entry.playerId = 'player-123';
      entry.teamId = 'team-456';
      entry.rating = 1500;

      expect(entry.rating).toBe(1500);
    });

    it('should create a queue entry with custom status', () => {
      const entry = new MatchmakingQueue();
      entry.playerId = 'player-123';
      entry.teamId = 'team-456';
      entry.status = MatchmakingStatus.MATCHED;
      entry.matchId = 'battle-789';

      expect(entry.status).toBe(MatchmakingStatus.MATCHED);
      expect(entry.matchId).toBe('battle-789');
    });

    it('should have proper enum values', () => {
      expect(MatchmakingStatus.WAITING).toBe('waiting');
      expect(MatchmakingStatus.MATCHED).toBe('matched');
      expect(MatchmakingStatus.EXPIRED).toBe('expired');
    });
  });

  describe('Utility Methods', () => {
    let testEntry: MatchmakingQueue;

    beforeEach(() => {
      testEntry = new MatchmakingQueue();
      testEntry.id = 'queue-456';
      testEntry.playerId = 'player-123';
      testEntry.teamId = 'team-456';
      testEntry.rating = 1300;
      testEntry.status = MatchmakingStatus.WAITING;
      testEntry.joinedAt = new Date();
    });

    describe('isExpired', () => {
      it('should return false for non-waiting entries', () => {
        testEntry.status = MatchmakingStatus.MATCHED;
        expect(testEntry.isExpired(5)).toBe(false);

        testEntry.status = MatchmakingStatus.EXPIRED;
        expect(testEntry.isExpired(5)).toBe(false);
      });

      it('should return false for recent entries', () => {
        testEntry.joinedAt = new Date(); // Just joined
        expect(testEntry.isExpired(5)).toBe(false);
      });

      it('should return true for old entries', () => {
        // Set joinedAt to 10 minutes ago
        testEntry.joinedAt = new Date(Date.now() - 10 * 60 * 1000);
        expect(testEntry.isExpired(5)).toBe(true);
      });

      it('should use custom timeout', () => {
        // Set joinedAt to 3 minutes ago
        testEntry.joinedAt = new Date(Date.now() - 3 * 60 * 1000);
        expect(testEntry.isExpired(2)).toBe(true); // 2 minute timeout
        expect(testEntry.isExpired(5)).toBe(false); // 5 minute timeout
      });
    });

    describe('getWaitTime', () => {
      it('should return correct wait time', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        testEntry.joinedAt = fiveMinutesAgo;

        const waitTime = testEntry.getWaitTime();
        expect(waitTime).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000); // Allow 1s tolerance
        expect(waitTime).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
      });

      it('should return zero for just-joined entries', () => {
        testEntry.joinedAt = new Date();
        const waitTime = testEntry.getWaitTime();
        expect(waitTime).toBeLessThan(1000); // Less than 1 second
      });
    });

    describe('canMatchWith', () => {
      it('should allow matching with similar ratings', () => {
        testEntry.rating = 1300;
        expect(testEntry.canMatchWith(1250)).toBe(true); // 50 diff < 200 default
        expect(testEntry.canMatchWith(1450)).toBe(true); // 150 diff < 200 default
      });

      it('should reject matching with very different ratings', () => {
        testEntry.rating = 1300;
        expect(testEntry.canMatchWith(1600)).toBe(false); // 300 diff > 200 default
        expect(testEntry.canMatchWith(1000)).toBe(false); // 300 diff > 200 default
      });

      it('should use custom rating difference', () => {
        testEntry.rating = 1300;
        expect(testEntry.canMatchWith(1400, 50)).toBe(false); // 100 diff > 50 custom
        expect(testEntry.canMatchWith(1350, 50)).toBe(true); // 50 diff = 50 custom
      });

      it('should handle exact rating matches', () => {
        testEntry.rating = 1300;
        expect(testEntry.canMatchWith(1300)).toBe(true);
      });
    });

    describe('markAsMatched', () => {
      it('should update status and match ID', () => {
        const matchId = 'battle-789';
        testEntry.markAsMatched(matchId);

        expect(testEntry.status).toBe(MatchmakingStatus.MATCHED);
        expect(testEntry.matchId).toBe(matchId);
      });
    });

    describe('markAsExpired', () => {
      it('should update status to expired', () => {
        testEntry.markAsExpired();
        expect(testEntry.status).toBe(MatchmakingStatus.EXPIRED);
      });
    });

    describe('getSummary', () => {
      it('should return complete summary', () => {
        testEntry.joinedAt = new Date(Date.now() - 30000); // 30 seconds ago
        const summary = testEntry.getSummary();

        expect(summary.id).toBe(testEntry.id);
        expect(summary.playerId).toBe(testEntry.playerId);
        expect(summary.teamId).toBe(testEntry.teamId);
        expect(summary.rating).toBe(testEntry.rating);
        expect(summary.status).toBe(testEntry.status);
        expect(summary.waitTimeSeconds).toBeGreaterThanOrEqual(29);
        expect(summary.waitTimeSeconds).toBeLessThanOrEqual(31);
        expect(summary.joinedAt).toBe(testEntry.joinedAt);
      });
    });
  });

  describe('Business Logic', () => {
    it('should handle multiple queue entries with different ratings', () => {
      const entries = [
        { rating: 1200, status: MatchmakingStatus.WAITING },
        { rating: 1300, status: MatchmakingStatus.WAITING },
        { rating: 1400, status: MatchmakingStatus.MATCHED },
      ].map(data => {
        const entry = new MatchmakingQueue();
        entry.rating = data.rating;
        entry.status = data.status;
        entry.joinedAt = new Date();
        return entry;
      });

      const waitingEntries = entries.filter(e => e.status === MatchmakingStatus.WAITING);
      expect(waitingEntries).toHaveLength(2);
      expect(waitingEntries.map(e => e.rating)).toEqual([1200, 1300]);
    });

    it('should identify expired entries correctly', () => {
      const entries = [
        { joinedAt: new Date(Date.now() - 2 * 60 * 1000), rating: 1200 }, // 2 min ago
        { joinedAt: new Date(Date.now() - 10 * 60 * 1000), rating: 1300 }, // 10 min ago
      ].map(data => {
        const entry = new MatchmakingQueue();
        entry.rating = data.rating;
        entry.status = MatchmakingStatus.WAITING;
        entry.joinedAt = data.joinedAt;
        return entry;
      });

      const expiredEntries = entries.filter(entry => entry.isExpired(5));
      expect(expiredEntries).toHaveLength(1);
      expect(expiredEntries[0]?.rating).toBe(1300);
    });

    it('should match players with compatible ratings', () => {
      const player1 = new MatchmakingQueue();
      player1.rating = 1300;

      const player2 = new MatchmakingQueue();
      player2.rating = 1350;

      const player3 = new MatchmakingQueue();
      player3.rating = 1600;

      expect(player1.canMatchWith(player2.rating)).toBe(true); // 50 diff
      expect(player1.canMatchWith(player3.rating)).toBe(false); // 300 diff
    });
  });

  describe('Entity Relationships', () => {
    it('should have proper foreign key references', () => {
      const entry = new MatchmakingQueue();
      entry.playerId = 'player-123';
      entry.teamId = 'team-456';

      expect(entry.playerId).toBe('player-123');
      expect(entry.teamId).toBe('team-456');
    });

    it('should support match ID for tracking battles', () => {
      const entry = new MatchmakingQueue();
      entry.matchId = 'battle-789';

      expect(entry.matchId).toBe('battle-789');
    });

    it('should handle undefined match ID for waiting entries', () => {
      const entry = new MatchmakingQueue();
      entry.status = MatchmakingStatus.WAITING;

      expect(entry.matchId).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple queue entries for same player', () => {
      const entry1 = new MatchmakingQueue();
      entry1.playerId = 'player-123';
      entry1.teamId = 'team-456';
      entry1.rating = 1200;

      const entry2 = new MatchmakingQueue();
      entry2.playerId = 'player-123';
      entry2.teamId = 'team-789';
      entry2.rating = 1300;

      expect(entry1.playerId).toBe(entry2.playerId);
      expect(entry1.teamId).not.toBe(entry2.teamId);
      expect(entry1.rating).not.toBe(entry2.rating);
    });

    it('should handle very high and low ratings', () => {
      const highRatingEntry = new MatchmakingQueue();
      highRatingEntry.rating = 3000; // Very high rating

      expect(highRatingEntry.canMatchWith(2800)).toBe(true); // Within 200
      expect(highRatingEntry.canMatchWith(2700)).toBe(false); // Outside 200

      const lowRatingEntry = new MatchmakingQueue();
      lowRatingEntry.rating = 800; // Very low rating
      expect(lowRatingEntry.canMatchWith(1000)).toBe(true); // Within 200
      expect(lowRatingEntry.canMatchWith(1100)).toBe(false); // Outside 200
    });

    it('should handle zero wait time correctly', () => {
      const entry = new MatchmakingQueue();
      entry.joinedAt = new Date();
      entry.status = MatchmakingStatus.WAITING;

      expect(entry.getWaitTime()).toBeGreaterThanOrEqual(0);
      expect(entry.isExpired(5)).toBe(false);
    });

    it('should handle status transitions correctly', () => {
      const entry = new MatchmakingQueue();
      entry.status = MatchmakingStatus.WAITING;

      // Transition to matched
      entry.markAsMatched('battle-123');
      expect(entry.status).toBe(MatchmakingStatus.MATCHED);
      expect(entry.matchId).toBe('battle-123');

      // Reset and transition to expired
      entry.status = MatchmakingStatus.WAITING;
      entry.markAsExpired();
      expect(entry.status).toBe(MatchmakingStatus.EXPIRED);
    });
  });
});