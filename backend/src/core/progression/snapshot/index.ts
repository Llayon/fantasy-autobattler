/**
 * Snapshot System Exports
 *
 * @module core/progression/snapshot
 */

// Types
export * from './snapshot.types';

// Operations
export {
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
  BotTeam,
} from './snapshot';

// Presets
export {
  ROGUELIKE_SNAPSHOT_CONFIG,
  ARENA_SNAPSHOT_CONFIG,
  CASUAL_SNAPSHOT_CONFIG,
  ROGUELIKE_MATCHMAKING_CONFIG,
  ARENA_MATCHMAKING_CONFIG,
  CASUAL_MATCHMAKING_CONFIG,
  ROGUELIKE_BOT_CONFIG,
  EASY_BOT_CONFIG,
  HARD_BOT_CONFIG,
} from './snapshot.presets';

