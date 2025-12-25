/**
 * Snapshot System Presets
 *
 * Pre-configured snapshot and matchmaking settings for different game modes.
 *
 * @module core/progression/snapshot/presets
 */

import { SnapshotConfig, MatchmakingConfig, BotConfig } from './snapshot.types';

/**
 * Standard roguelike snapshot configuration.
 * 24h expiry, 10 snapshots per player, 10k total limit.
 *
 * @example
 * const snapshot = createSnapshot(run, playerId, rating, ROGUELIKE_SNAPSHOT_CONFIG);
 */
export const ROGUELIKE_SNAPSHOT_CONFIG: SnapshotConfig = {
  expiryMs: 24 * 60 * 60 * 1000, // 24 hours
  maxSnapshotsPerPlayer: 10,
  includeFullState: false, // Only team composition (~2 KB)
  maxTotalSnapshots: 10000, // ~20 MB max
  cleanupStrategy: 'oldest',
};

/**
 * Arena snapshot configuration.
 * Shorter expiry, more snapshots per player.
 *
 * @example
 * const snapshot = createSnapshot(run, playerId, rating, ARENA_SNAPSHOT_CONFIG);
 */
export const ARENA_SNAPSHOT_CONFIG: SnapshotConfig = {
  expiryMs: 12 * 60 * 60 * 1000, // 12 hours
  maxSnapshotsPerPlayer: 20,
  includeFullState: false,
  maxTotalSnapshots: 50000,
  cleanupStrategy: 'lowest-rating',
};

/**
 * Casual snapshot configuration.
 * Longer expiry, fewer limits.
 *
 * @example
 * const snapshot = createSnapshot(run, playerId, rating, CASUAL_SNAPSHOT_CONFIG);
 */
export const CASUAL_SNAPSHOT_CONFIG: SnapshotConfig = {
  expiryMs: 48 * 60 * 60 * 1000, // 48 hours
  maxSnapshotsPerPlayer: 5,
  includeFullState: true,
  maxTotalSnapshots: 5000,
  cleanupStrategy: 'random',
};

/**
 * Standard roguelike matchmaking configuration.
 * Matches within 1 win and 200 rating.
 *
 * @example
 * const opponent = findOpponent(wins, rating, pool, ROGUELIKE_MATCHMAKING_CONFIG);
 */
export const ROGUELIKE_MATCHMAKING_CONFIG: MatchmakingConfig = {
  ratingRange: 200,
  winsRange: 1,
  botFallback: true,
  botDifficultyScale: (wins) => 0.5 + wins * 0.1, // 50% + 10% per win
};

/**
 * Arena matchmaking configuration.
 * Wider rating range, stricter wins matching.
 *
 * @example
 * const opponent = findOpponent(wins, rating, pool, ARENA_MATCHMAKING_CONFIG);
 */
export const ARENA_MATCHMAKING_CONFIG: MatchmakingConfig = {
  ratingRange: 300,
  winsRange: 0, // Exact wins match
  botFallback: true,
  botDifficultyScale: (wins) => 0.6 + wins * 0.05,
};

/**
 * Casual matchmaking configuration.
 * Very wide ranges for quick matching.
 *
 * @example
 * const opponent = findOpponent(wins, rating, pool, CASUAL_MATCHMAKING_CONFIG);
 */
export const CASUAL_MATCHMAKING_CONFIG: MatchmakingConfig = {
  ratingRange: 500,
  winsRange: 3,
  botFallback: true,
  botDifficultyScale: (wins) => 0.4 + wins * 0.05,
};

/**
 * Standard roguelike bot configuration.
 * Starts at 50% difficulty, scales to 95%.
 *
 * @example
 * const bot = generateBot(wins, cardPool, ROGUELIKE_BOT_CONFIG, seed);
 */
export const ROGUELIKE_BOT_CONFIG: BotConfig = {
  baseDifficulty: 0.5,
  difficultyPerWin: 0.05,
  maxDifficulty: 0.95,
  nameGenerator: (wins) => `Bot_${wins}W`,
};

/**
 * Easy bot configuration.
 * Lower difficulty scaling for beginners.
 *
 * @example
 * const bot = generateBot(wins, cardPool, EASY_BOT_CONFIG, seed);
 */
export const EASY_BOT_CONFIG: BotConfig = {
  baseDifficulty: 0.3,
  difficultyPerWin: 0.03,
  maxDifficulty: 0.7,
  nameGenerator: (wins) => `Trainee_${wins}`,
};

/**
 * Hard bot configuration.
 * Higher difficulty for experienced players.
 *
 * @example
 * const bot = generateBot(wins, cardPool, HARD_BOT_CONFIG, seed);
 */
export const HARD_BOT_CONFIG: BotConfig = {
  baseDifficulty: 0.7,
  difficultyPerWin: 0.05,
  maxDifficulty: 0.99,
  nameGenerator: (wins) => `Champion_${wins}`,
};

