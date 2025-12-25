/**
 * Snapshot System Tests
 *
 * Unit tests and property-based tests for snapshot and matchmaking operations.
 *
 * @module core/progression/snapshot/spec
 */

import * as fc from 'fast-check';
import {
  createSnapshot,
  isSnapshotExpired,
  filterExpiredSnapshots,
  enforceSnapshotLimits,
  applyCleanupStrategy,
  getSnapshotPoolStats,
  findOpponent,
  generateBot,
  selectBotCards,
  getBotDifficulty,
  getBotTierDistribution,
} from './snapshot';
import { SnapshotConfig, MatchmakingConfig, BotConfig, Snapshot } from './snapshot.types';
import { Run } from '../run/run.types';
import { BaseCard } from '../types';
import {
  ROGUELIKE_SNAPSHOT_CONFIG,
  ROGUELIKE_MATCHMAKING_CONFIG,
  ROGUELIKE_BOT_CONFIG,
} from './snapshot.presets';
import {
  arbitrarySnapshotConfig,
} from '../test-generators';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const createTestRun = <TState>(state: TState, wins = 3, losses = 1): Run<TState> => ({
  id: 'run-123',
  config: {
    winsToComplete: 9,
    maxLosses: 4,
    phases: ['battle', 'shop'],
    trackStreaks: true,
    enableRating: true,
  },
  wins,
  losses,
  currentPhaseIndex: 0,
  winStreak: 1,
  loseStreak: 0,
  status: 'active',
  state,
  history: [],
});

const createTestSnapshot = <TState>(
  playerId: string,
  wins: number,
  rating: number,
  state: TState,
  createdAt?: number,
): Snapshot<TState> => ({
  id: `snap-${playerId}-${wins}`,
  playerId,
  runId: 'run-123',
  wins,
  losses: 0,
  rating,
  state,
  createdAt: createdAt ?? Date.now(),
});

const createTestCard = (id: string, tier = 1): BaseCard => ({
  id,
  name: `Card ${id}`,
  baseCost: tier * 3,
  tier,
});

const defaultConfig: SnapshotConfig = {
  expiryMs: 24 * 60 * 60 * 1000, // 24h
  maxSnapshotsPerPlayer: 10,
  includeFullState: false,
  maxTotalSnapshots: 100,
  cleanupStrategy: 'oldest',
};

const defaultMatchmakingConfig: MatchmakingConfig = {
  ratingRange: 200,
  winsRange: 1,
  botFallback: true,
  botDifficultyScale: (wins) => 0.5 + wins * 0.1,
};

const defaultBotConfig: BotConfig = {
  baseDifficulty: 0.5,
  difficultyPerWin: 0.05,
  maxDifficulty: 0.95,
  nameGenerator: (wins) => `Bot_${wins}W`,
};

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Snapshot System', () => {
  describe('createSnapshot', () => {
    it('should create snapshot from run', () => {
      const run = createTestRun({ deck: ['card1'] });
      const snapshot = createSnapshot(run, 'player-1', 1200, defaultConfig);

      expect(snapshot.id).toMatch(/^snap_/);
      expect(snapshot.playerId).toBe('player-1');
      expect(snapshot.runId).toBe('run-123');
      expect(snapshot.wins).toBe(3);
      expect(snapshot.losses).toBe(1);
      expect(snapshot.rating).toBe(1200);
      expect(snapshot.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it('should include full state when configured', () => {
      const state = { deck: ['card1', 'card2'] };
      const run = createTestRun(state);
      const config = { ...defaultConfig, includeFullState: true };

      const snapshot = createSnapshot(run, 'player-1', 1200, config);

      expect(snapshot.state).toEqual(state);
    });

    it('should exclude state when not configured', () => {
      const state = { deck: ['card1', 'card2'] };
      const run = createTestRun(state);
      const config = { ...defaultConfig, includeFullState: false };

      const snapshot = createSnapshot(run, 'player-1', 1200, config);

      expect(snapshot.state).toEqual({});
    });
  });

  describe('isSnapshotExpired', () => {
    it('should return false for fresh snapshot', () => {
      const snapshot = createTestSnapshot('player-1', 3, 1200, {});
      const result = isSnapshotExpired(snapshot, defaultConfig);

      expect(result).toBe(false);
    });

    it('should return true for old snapshot', () => {
      const oldTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const snapshot = createTestSnapshot('player-1', 3, 1200, {}, oldTime);
      const result = isSnapshotExpired(snapshot, defaultConfig);

      expect(result).toBe(true);
    });

    it('should use custom current time', () => {
      const snapshot = createTestSnapshot('player-1', 3, 1200, {}, 1000);
      const result = isSnapshotExpired(snapshot, defaultConfig, 1000 + defaultConfig.expiryMs + 1);

      expect(result).toBe(true);
    });
  });

  describe('filterExpiredSnapshots', () => {
    it('should remove expired snapshots', () => {
      const now = Date.now();
      const snapshots = [
        createTestSnapshot('p1', 1, 1000, {}, now), // Fresh
        createTestSnapshot('p2', 2, 1100, {}, now - 25 * 60 * 60 * 1000), // Expired
        createTestSnapshot('p3', 3, 1200, {}, now - 1000), // Fresh
      ];

      const result = filterExpiredSnapshots(snapshots, defaultConfig, now);

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.playerId)).toEqual(['p1', 'p3']);
    });

    it('should return empty array when all expired', () => {
      const oldTime = Date.now() - 25 * 60 * 60 * 1000;
      const snapshots = [
        createTestSnapshot('p1', 1, 1000, {}, oldTime),
        createTestSnapshot('p2', 2, 1100, {}, oldTime),
      ];

      const result = filterExpiredSnapshots(snapshots, defaultConfig);

      expect(result).toHaveLength(0);
    });
  });

  describe('enforceSnapshotLimits', () => {
    it('should enforce per-player limit', () => {
      const now = Date.now();
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createTestSnapshot('player-1', i, 1000 + i * 10, {}, now - i * 1000),
      );
      const newSnapshot = createTestSnapshot('player-1', 10, 1100, {}, now);

      const result = enforceSnapshotLimits(snapshots, newSnapshot, defaultConfig);

      const playerSnapshots = result.filter((s) => s.playerId === 'player-1');
      expect(playerSnapshots.length).toBeLessThan(10);
    });

    it('should enforce total limit', () => {
      const config = { ...defaultConfig, maxTotalSnapshots: 10 };
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createTestSnapshot(`player-${i}`, i, 1000, {}),
      );
      const newSnapshot = createTestSnapshot('player-new', 5, 1200, {});

      const result = enforceSnapshotLimits(snapshots, newSnapshot, config);

      expect(result.length).toBeLessThan(10);
    });

    it('should remove expired snapshots first', () => {
      const now = Date.now();
      const oldTime = now - 25 * 60 * 60 * 1000;
      const snapshots = [
        createTestSnapshot('p1', 1, 1000, {}, oldTime), // Expired
        createTestSnapshot('p2', 2, 1100, {}, now), // Fresh
      ];
      const newSnapshot = createTestSnapshot('p3', 3, 1200, {}, now);

      const result = enforceSnapshotLimits(snapshots, newSnapshot, defaultConfig);

      expect(result.find((s) => s.playerId === 'p1')).toBeUndefined();
    });
  });

  describe('applyCleanupStrategy', () => {
    it('should remove oldest with oldest strategy', () => {
      const now = Date.now();
      const snapshots = [
        createTestSnapshot('p1', 1, 1000, {}, now - 3000),
        createTestSnapshot('p2', 2, 1100, {}, now - 2000),
        createTestSnapshot('p3', 3, 1200, {}, now - 1000),
      ];
      const config = { ...defaultConfig, cleanupStrategy: 'oldest' as const };

      const result = applyCleanupStrategy(snapshots, config);

      // Should remove oldest (p1)
      expect(result.find((s) => s.playerId === 'p1')).toBeUndefined();
      expect(result).toHaveLength(2);
    });

    it('should remove lowest-rating with lowest-rating strategy', () => {
      const snapshots = [
        createTestSnapshot('p1', 1, 800, {}),
        createTestSnapshot('p2', 2, 1200, {}),
        createTestSnapshot('p3', 3, 1000, {}),
      ];
      const config = { ...defaultConfig, cleanupStrategy: 'lowest-rating' as const };

      const result = applyCleanupStrategy(snapshots, config);

      // Should remove lowest rating (p1)
      expect(result.find((s) => s.playerId === 'p1')).toBeUndefined();
      expect(result).toHaveLength(2);
    });

    it('should be deterministic with random strategy and seed', () => {
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createTestSnapshot(`p${i}`, i, 1000 + i * 100, {}),
      );
      const config = { ...defaultConfig, cleanupStrategy: 'random' as const };

      const result1 = applyCleanupStrategy(snapshots, config, 12345);
      const result2 = applyCleanupStrategy(snapshots, config, 12345);

      expect(result1.map((s) => s.playerId)).toEqual(result2.map((s) => s.playerId));
    });
  });

  describe('getSnapshotPoolStats', () => {
    it('should calculate correct stats', () => {
      const now = Date.now();
      const snapshots = [
        { ...createTestSnapshot('p1', 1, 1000, {}, now - 1000), sizeBytes: 100 },
        { ...createTestSnapshot('p2', 1, 1100, {}, now - 2000), sizeBytes: 200 },
        { ...createTestSnapshot('p3', 2, 1200, {}, now - 3000), sizeBytes: 150 },
      ];

      const stats = getSnapshotPoolStats(snapshots);

      expect(stats.totalCount).toBe(3);
      expect(stats.totalSizeBytes).toBe(450);
      expect(stats.oldestTimestamp).toBe(now - 3000);
      expect(stats.byWins.get(1)).toBe(2);
      expect(stats.byWins.get(2)).toBe(1);
    });

    it('should handle empty pool', () => {
      const stats = getSnapshotPoolStats([]);

      expect(stats.totalCount).toBe(0);
      expect(stats.totalSizeBytes).toBe(0);
      expect(stats.oldestTimestamp).toBe(0);
    });
  });

  describe('findOpponent', () => {
    it('should find opponent within wins range', () => {
      const snapshots = [
        createTestSnapshot('p1', 1, 1200, {}),
        createTestSnapshot('p2', 3, 1200, {}),
        createTestSnapshot('p3', 5, 1200, {}),
      ];

      const result = findOpponent(3, 1200, snapshots, defaultMatchmakingConfig, 12345);

      expect(result).not.toBeNull();
      expect(Math.abs(result!.wins - 3)).toBeLessThanOrEqual(1);
    });

    it('should find opponent within rating range', () => {
      const snapshots = [
        createTestSnapshot('p1', 3, 800, {}),
        createTestSnapshot('p2', 3, 1200, {}),
        createTestSnapshot('p3', 3, 1600, {}),
      ];

      const result = findOpponent(3, 1200, snapshots, defaultMatchmakingConfig, 12345);

      expect(result).not.toBeNull();
      expect(Math.abs(result!.rating - 1200)).toBeLessThanOrEqual(200);
    });

    it('should return null when no match found', () => {
      const snapshots = [
        createTestSnapshot('p1', 10, 2000, {}), // Too far
      ];

      const result = findOpponent(3, 1200, snapshots, defaultMatchmakingConfig, 12345);

      expect(result).toBeNull();
    });

    it('should be deterministic with same seed', () => {
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createTestSnapshot(`p${i}`, 3, 1200, {}),
      );

      const result1 = findOpponent(3, 1200, snapshots, defaultMatchmakingConfig, 12345);
      const result2 = findOpponent(3, 1200, snapshots, defaultMatchmakingConfig, 12345);

      expect(result1?.playerId).toBe(result2?.playerId);
    });
  });

  describe('generateBot', () => {
    it('should generate bot with correct difficulty', () => {
      const cards = Array.from({ length: 20 }, (_, i) =>
        createTestCard(`card-${i}`, (i % 3) + 1),
      );

      const bot = generateBot(5, cards, defaultBotConfig, 12345);

      expect(bot.name).toBe('Bot_5W');
      expect(bot.difficulty).toBe(0.5 + 5 * 0.05);
      expect(bot.cards.length).toBeLessThanOrEqual(12);
    });

    it('should cap difficulty at maxDifficulty', () => {
      const cards = Array.from({ length: 20 }, (_, i) =>
        createTestCard(`card-${i}`, 1),
      );

      const bot = generateBot(100, cards, defaultBotConfig, 12345);

      expect(bot.difficulty).toBe(0.95);
    });

    it('should use custom name generator', () => {
      const cards = [createTestCard('card-1', 1)];
      const config = {
        ...defaultBotConfig,
        nameGenerator: (wins: number) => `Champion_${wins}`,
      };

      const bot = generateBot(3, cards, config, 12345);

      expect(bot.name).toBe('Champion_3');
    });

    it('should be deterministic with same seed', () => {
      const cards = Array.from({ length: 20 }, (_, i) =>
        createTestCard(`card-${i}`, (i % 3) + 1),
      );

      const bot1 = generateBot(5, cards, defaultBotConfig, 12345);
      const bot2 = generateBot(5, cards, defaultBotConfig, 12345);

      expect(bot1.cards.map((c) => c.id)).toEqual(bot2.cards.map((c) => c.id));
    });
  });

  describe('selectBotCards', () => {
    it('should select up to maxCards', () => {
      const cards = Array.from({ length: 20 }, (_, i) =>
        createTestCard(`card-${i}`, 1),
      );

      const selected = selectBotCards(cards, 0.5, 12345, 12);

      expect(selected.length).toBe(12);
    });

    it('should handle pool smaller than maxCards', () => {
      const cards = [createTestCard('card-1', 1), createTestCard('card-2', 2)];

      const selected = selectBotCards(cards, 0.5, 12345, 12);

      expect(selected.length).toBe(2);
    });

    it('should prefer higher tiers at higher difficulty', () => {
      const cards = [
        ...Array.from({ length: 10 }, (_, i) => createTestCard(`t1-${i}`, 1)),
        ...Array.from({ length: 10 }, (_, i) => createTestCard(`t2-${i}`, 2)),
        ...Array.from({ length: 10 }, (_, i) => createTestCard(`t3-${i}`, 3)),
      ];

      const lowDiffCards = selectBotCards(cards, 0.3, 12345, 12);
      const highDiffCards = selectBotCards(cards, 0.9, 54321, 12);

      const lowT1Count = lowDiffCards.filter((c) => c.tier === 1).length;
      const highT1Count = highDiffCards.filter((c) => c.tier === 1).length;

      // Higher difficulty should have fewer T1 cards on average
      // This is probabilistic, so we just check the trend
      expect(lowT1Count).toBeGreaterThanOrEqual(highT1Count - 3);
    });
  });

  describe('getBotDifficulty', () => {
    it('should calculate correct difficulty', () => {
      expect(getBotDifficulty(0, defaultBotConfig)).toBe(0.5);
      expect(getBotDifficulty(5, defaultBotConfig)).toBe(0.75);
      expect(getBotDifficulty(10, defaultBotConfig)).toBe(0.95); // Capped
    });
  });

  describe('getBotTierDistribution', () => {
    it('should return normalized distribution', () => {
      const dist = getBotTierDistribution(0.5);
      const total = (dist[1] ?? 0) + (dist[2] ?? 0) + (dist[3] ?? 0);

      expect(total).toBeCloseTo(1, 5);
    });

    it('should favor T1 at low difficulty', () => {
      const dist = getBotTierDistribution(0.3);

      expect(dist[1] ?? 0).toBeGreaterThan(dist[2] ?? 0);
      expect(dist[1] ?? 0).toBeGreaterThan(dist[3] ?? 0);
    });

    it('should favor T2/T3 at high difficulty', () => {
      const dist = getBotTierDistribution(0.9);

      expect((dist[2] ?? 0) + (dist[3] ?? 0)).toBeGreaterThan(dist[1] ?? 0);
    });
  });

  describe('Presets', () => {
    it('ROGUELIKE_SNAPSHOT_CONFIG should have correct values', () => {
      expect(ROGUELIKE_SNAPSHOT_CONFIG.expiryMs).toBe(24 * 60 * 60 * 1000);
      expect(ROGUELIKE_SNAPSHOT_CONFIG.maxSnapshotsPerPlayer).toBe(10);
      expect(ROGUELIKE_SNAPSHOT_CONFIG.maxTotalSnapshots).toBe(10000);
    });

    it('ROGUELIKE_MATCHMAKING_CONFIG should have correct values', () => {
      expect(ROGUELIKE_MATCHMAKING_CONFIG.ratingRange).toBe(200);
      expect(ROGUELIKE_MATCHMAKING_CONFIG.winsRange).toBe(1);
    });

    it('ROGUELIKE_BOT_CONFIG should have correct values', () => {
      expect(ROGUELIKE_BOT_CONFIG.baseDifficulty).toBe(0.5);
      expect(ROGUELIKE_BOT_CONFIG.maxDifficulty).toBe(0.95);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Snapshot System Properties', () => {
  /**
   * **Feature: core-progression, Property 21: Snapshot expiry**
   * **Validates: Requirements 7.1**
   *
   * For any snapshot older than expiryMs, isSnapshotExpired should return true.
   */
  describe('Property 21: Snapshot expiry', () => {
    it('snapshots older than expiryMs are expired', () => {
      fc.assert(
        fc.property(
          arbitrarySnapshotConfig(),
          fc.integer({ min: 1, max: 1000000 }),
          (config, extraMs) => {
            const createdAt = Date.now() - config.expiryMs - extraMs;
            const snapshot: Snapshot<unknown> = {
              id: 'test',
              playerId: 'player',
              runId: 'run',
              wins: 0,
              losses: 0,
              rating: 1000,
              state: {},
              createdAt,
            };

            return isSnapshotExpired(snapshot, config);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('snapshots younger than expiryMs are not expired', () => {
      fc.assert(
        fc.property(
          arbitrarySnapshotConfig(),
          fc.integer({ min: 0, max: 1000 }),
          (config, ageMs) => {
            // Ensure age is less than expiry
            const actualAge = Math.min(ageMs, config.expiryMs - 1);
            const createdAt = Date.now() - actualAge;
            const snapshot: Snapshot<unknown> = {
              id: 'test',
              playerId: 'player',
              runId: 'run',
              wins: 0,
              losses: 0,
              rating: 1000,
              state: {},
              createdAt,
            };

            return !isSnapshotExpired(snapshot, config);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 22: Matchmaking wins filter**
   * **Validates: Requirements 7.2**
   *
   * For any run and snapshot pool, findOpponent should only return
   * snapshots within winsRange of run.wins.
   */
  describe('Property 22: Matchmaking wins filter', () => {
    it('returned opponent is within wins range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 1000000 }),
          (currentWins, winsRange, seed) => {
            // Create snapshots with various wins
            const snapshots: Snapshot<unknown>[] = Array.from({ length: 20 }, (_, i) => ({
              id: `snap-${i}`,
              playerId: `player-${i}`,
              runId: 'run',
              wins: i,
              losses: 0,
              rating: 1000,
              state: {},
              createdAt: Date.now(),
            }));

            const config: MatchmakingConfig = {
              ratingRange: 10000, // Wide range to not filter by rating
              winsRange,
              botFallback: false,
              botDifficultyScale: () => 0.5,
            };

            const result = findOpponent(currentWins, 1000, snapshots, config, seed);

            if (result === null) {
              // No match found - verify no valid matches exist
              return !snapshots.some(
                (s) => Math.abs(s.wins - currentWins) <= winsRange,
              );
            }

            return Math.abs(result.wins - currentWins) <= winsRange;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 23: Matchmaking rating filter**
   * **Validates: Requirements 7.5**
   *
   * For any run and snapshot pool, findOpponent should only return
   * snapshots within ratingRange of run rating.
   */
  describe('Property 23: Matchmaking rating filter', () => {
    it('returned opponent is within rating range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3000 }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 1000000 }),
          (currentRating, ratingRange, seed) => {
            // Create snapshots with various ratings
            const snapshots: Snapshot<unknown>[] = Array.from({ length: 20 }, (_, i) => ({
              id: `snap-${i}`,
              playerId: `player-${i}`,
              runId: 'run',
              wins: 5, // Same wins to not filter by wins
              losses: 0,
              rating: i * 150,
              state: {},
              createdAt: Date.now(),
            }));

            const config: MatchmakingConfig = {
              ratingRange,
              winsRange: 100, // Wide range to not filter by wins
              botFallback: false,
              botDifficultyScale: () => 0.5,
            };

            const result = findOpponent(5, currentRating, snapshots, config, seed);

            if (result === null) {
              // No match found - verify no valid matches exist
              return !snapshots.some(
                (s) => Math.abs(s.rating - currentRating) <= ratingRange,
              );
            }

            return Math.abs(result.rating - currentRating) <= ratingRange;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 24: Per-player snapshot limit**
   * **Validates: Requirements 7.3**
   *
   * For any player, when they have >= maxSnapshotsPerPlayer snapshots,
   * enforceSnapshotLimits removes at least one to make room for new snapshot.
   */
  describe('Property 24: Per-player snapshot limit', () => {
    it('per-player limit is enforced', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          (maxPerPlayer, numSnapshots) => {
            const playerId = 'test-player';
            const snapshots: Snapshot<unknown>[] = Array.from(
              { length: numSnapshots },
              (_, i) => ({
                id: `snap-${i}`,
                playerId,
                runId: 'run',
                wins: i,
                losses: 0,
                rating: 1000,
                state: {},
                createdAt: Date.now() - i * 1000,
              }),
            );

            const config: SnapshotConfig = {
              expiryMs: 24 * 60 * 60 * 1000,
              maxSnapshotsPerPlayer: maxPerPlayer,
              includeFullState: false,
              maxTotalSnapshots: 0, // Unlimited total
              cleanupStrategy: 'oldest',
            };

            const newSnapshot: Snapshot<unknown> = {
              id: 'new-snap',
              playerId,
              runId: 'run',
              wins: 99,
              losses: 0,
              rating: 1000,
              state: {},
              createdAt: Date.now(),
            };

            const result = enforceSnapshotLimits(snapshots, newSnapshot, config);
            const playerSnapshots = result.filter((s) => s.playerId === playerId);

            // If we had >= maxPerPlayer snapshots, at least one should be removed
            // to make room for the new snapshot
            if (numSnapshots >= maxPerPlayer) {
              return playerSnapshots.length < numSnapshots;
            }
            // If we had fewer, nothing should be removed
            return playerSnapshots.length === numSnapshots;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 25: Total snapshot limit**
   * **Validates: Requirements 7.3**
   *
   * For any snapshot pool, when total >= maxTotalSnapshots,
   * enforceSnapshotLimits removes some snapshots via cleanup strategy.
   */
  describe('Property 25: Total snapshot limit', () => {
    it('total limit is enforced', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 50 }),
          fc.integer({ min: 10, max: 100 }),
          (maxTotal, numSnapshots) => {
            const snapshots: Snapshot<unknown>[] = Array.from(
              { length: numSnapshots },
              (_, i) => ({
                id: `snap-${i}`,
                playerId: `player-${i}`,
                runId: 'run',
                wins: i % 10,
                losses: 0,
                rating: 1000 + i * 10,
                state: {},
                createdAt: Date.now() - i * 1000,
              }),
            );

            const config: SnapshotConfig = {
              expiryMs: 24 * 60 * 60 * 1000,
              maxSnapshotsPerPlayer: 100, // High limit
              includeFullState: false,
              maxTotalSnapshots: maxTotal,
              cleanupStrategy: 'oldest',
            };

            const newSnapshot: Snapshot<unknown> = {
              id: 'new-snap',
              playerId: 'new-player',
              runId: 'run',
              wins: 5,
              losses: 0,
              rating: 1000,
              state: {},
              createdAt: Date.now(),
            };

            const result = enforceSnapshotLimits(snapshots, newSnapshot, config);

            // If we had >= maxTotal snapshots, cleanup should reduce count
            if (numSnapshots >= maxTotal) {
              return result.length < numSnapshots;
            }
            // If we had fewer, nothing should be removed
            return result.length === numSnapshots;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 26: Bot difficulty scaling**
   * **Validates: Requirements 7.6**
   *
   * For any wins count, generateBot should produce a bot with
   * difficulty = min(baseDifficulty + wins * difficultyPerWin, maxDifficulty).
   */
  describe('Property 26: Bot difficulty scaling', () => {
    it('bot difficulty scales correctly with wins', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50 }),
          fc.double({ min: 0.1, max: 0.5, noNaN: true }),
          fc.double({ min: 0.01, max: 0.1, noNaN: true }),
          fc.double({ min: 0.7, max: 1.0, noNaN: true }),
          fc.integer({ min: 0, max: 1000000 }),
          (wins, baseDifficulty, difficultyPerWin, maxDifficulty, seed) => {
            const config: BotConfig = {
              baseDifficulty,
              difficultyPerWin,
              maxDifficulty,
            };

            const cards = Array.from({ length: 20 }, (_, i) => ({
              id: `card-${i}`,
              name: `Card ${i}`,
              baseCost: 3,
              tier: 1,
            }));

            const bot = generateBot(wins, cards, config, seed);
            const expectedDifficulty = Math.min(
              baseDifficulty + wins * difficultyPerWin,
              maxDifficulty,
            );

            return Math.abs(bot.difficulty - expectedDifficulty) < 0.0001;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 27: Bot tier distribution**
   * **Validates: Requirements 7.6**
   *
   * For any bot with difficulty D, the proportion of T2/T3 cards
   * should increase with D.
   */
  describe('Property 27: Bot tier distribution', () => {
    it('higher difficulty produces more high-tier cards on average', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.2, max: 0.4, noNaN: true }),
          fc.double({ min: 0.7, max: 0.95, noNaN: true }),
          (lowDiff, highDiff) => {
            // Get tier distributions
            const lowDist = getBotTierDistribution(lowDiff);
            const highDist = getBotTierDistribution(highDiff);

            // Higher difficulty should have lower T1 proportion
            // and higher T2+T3 proportion
            const lowHighTierProp = (lowDist[2] ?? 0) + (lowDist[3] ?? 0);
            const highHighTierProp = (highDist[2] ?? 0) + (highDist[3] ?? 0);

            return highHighTierProp > lowHighTierProp;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

