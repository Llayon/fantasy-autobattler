/**
 * Snapshot System Types
 * 
 * @module core/progression/snapshot/types
 */

/**
 * Cleanup strategy for snapshot pool.
 */
export type CleanupStrategy = 'oldest' | 'lowest-rating' | 'random';

/**
 * Configuration for snapshot behavior.
 */
export interface SnapshotConfig {
  /** Snapshot expiry time in milliseconds */
  expiryMs: number;
  
  /** Maximum snapshots per player */
  maxSnapshotsPerPlayer: number;
  
  /** Include full state or summary only */
  includeFullState: boolean;
  
  /** Maximum total snapshots in pool (0 = unlimited) */
  maxTotalSnapshots: number;
  
  /** Cleanup strategy when limit reached */
  cleanupStrategy: CleanupStrategy;
}

/**
 * Snapshot of a player's run state.
 */
export interface Snapshot<TState> {
  /** Unique snapshot identifier */
  id: string;
  
  /** Player identifier */
  playerId: string;
  
  /** Run identifier */
  runId: string;
  
  /** Current wins */
  wins: number;
  
  /** Current losses */
  losses: number;
  
  /** Player rating */
  rating: number;
  
  /** Game state (team composition) */
  state: TState;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Optional size in bytes (for monitoring) */
  sizeBytes?: number | undefined;
}

/**
 * Configuration for matchmaking behavior.
 */
export interface MatchmakingConfig {
  /** Rating range for matching */
  ratingRange: number;
  
  /** Wins range for matching */
  winsRange: number;
  
  /** Enable bot fallback */
  botFallback: boolean;
  
  /** Bot difficulty scaling */
  botDifficultyScale: (wins: number) => number;
}

/**
 * Configuration for bot generation.
 */
export interface BotConfig {
  /** Base difficulty (0.0 - 1.0) */
  baseDifficulty: number;
  
  /** Difficulty scaling per win */
  difficultyPerWin: number;
  
  /** Max difficulty cap */
  maxDifficulty: number;
  
  /** Bot name generator */
  nameGenerator?: (wins: number) => string;
}

/**
 * Statistics about the snapshot pool.
 */
export interface SnapshotPoolStats {
  /** Total snapshot count */
  totalCount: number;
  
  /** Total size in bytes */
  totalSizeBytes: number;
  
  /** Oldest snapshot timestamp */
  oldestTimestamp: number;
  
  /** Count by wins */
  byWins: Map<number, number>;
}
