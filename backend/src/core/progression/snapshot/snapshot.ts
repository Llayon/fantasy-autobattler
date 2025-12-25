/**
 * Snapshot System Operations
 *
 * Pure functions for managing player snapshots and matchmaking.
 * Snapshots store player state for asynchronous PvP matching.
 * All operations are immutable.
 *
 * @module core/progression/snapshot
 */

import { SeededRandom } from '../../utils/random';
import { BaseCard } from '../types';
import { Run } from '../run/run.types';
import {
  Snapshot,
  SnapshotConfig,
  MatchmakingConfig,
  BotConfig,
  SnapshotPoolStats,
} from './snapshot.types';

/**
 * Generates a unique ID for snapshots.
 *
 * @returns Unique snapshot ID
 */
function generateSnapshotId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `snap_${timestamp}_${random}`;
}

/**
 * Creates a snapshot of current run state.
 *
 * @param run - Current run to snapshot
 * @param playerId - Player identifier
 * @param rating - Player's current rating
 * @param config - Snapshot configuration
 * @returns New snapshot instance
 *
 * @example
 * const snapshot = createSnapshot(run, 'player-123', 1200, ROGUELIKE_SNAPSHOT_CONFIG);
 */
export function createSnapshot<TState>(
  run: Run<TState>,
  playerId: string,
  rating: number,
  config: SnapshotConfig,
): Snapshot<TState> {
  const state = config.includeFullState ? run.state : ({} as TState);

  return {
    id: generateSnapshotId(),
    playerId,
    runId: run.id,
    wins: run.wins,
    losses: run.losses,
    rating,
    state,
    createdAt: Date.now(),
  };
}

/**
 * Checks if a snapshot is expired.
 *
 * @param snapshot - Snapshot to check
 * @param config - Snapshot configuration
 * @param currentTime - Current timestamp (defaults to Date.now())
 * @returns True if snapshot is expired
 *
 * @example
 * if (isSnapshotExpired(snapshot, config)) {
 *   // Remove from pool
 * }
 */
export function isSnapshotExpired<TState>(
  snapshot: Snapshot<TState>,
  config: SnapshotConfig,
  currentTime?: number,
): boolean {
  const now = currentTime ?? Date.now();
  return now - snapshot.createdAt > config.expiryMs;
}

/**
 * Filters out expired snapshots from pool.
 *
 * @param snapshots - Snapshot pool
 * @param config - Snapshot configuration
 * @param currentTime - Current timestamp (defaults to Date.now())
 * @returns Filtered snapshots (non-expired only)
 *
 * @example
 * const validSnapshots = filterExpiredSnapshots(pool, config);
 */
export function filterExpiredSnapshots<TState>(
  snapshots: Snapshot<TState>[],
  config: SnapshotConfig,
  currentTime?: number,
): Snapshot<TState>[] {
  const now = currentTime ?? Date.now();
  return snapshots.filter((s) => !isSnapshotExpired(s, config, now));
}


/**
 * Enforces snapshot limits by removing excess snapshots.
 * Applies per-player and total limits.
 *
 * @param snapshots - Current snapshot pool
 * @param newSnapshot - Snapshot being added
 * @param config - Snapshot configuration
 * @param seed - Random seed for 'random' cleanup strategy
 * @returns Filtered snapshots with limits enforced
 *
 * @example
 * const pool = enforceSnapshotLimits(existingPool, newSnapshot, config);
 */
export function enforceSnapshotLimits<TState>(
  snapshots: Snapshot<TState>[],
  newSnapshot: Snapshot<TState>,
  config: SnapshotConfig,
  seed?: number,
): Snapshot<TState>[] {
  let result = [...snapshots];

  // 1. Remove expired snapshots
  result = filterExpiredSnapshots(result, config);

  // 2. Enforce per-player limit
  const playerSnapshots = result.filter(
    (s) => s.playerId === newSnapshot.playerId,
  );
  if (playerSnapshots.length >= config.maxSnapshotsPerPlayer) {
    // Remove oldest player snapshot
    const sortedByAge = [...playerSnapshots].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    const oldestId = sortedByAge[0]?.id;
    if (oldestId) {
      result = result.filter((s) => s.id !== oldestId);
    }
  }

  // 3. Enforce total limit
  if (config.maxTotalSnapshots > 0 && result.length >= config.maxTotalSnapshots) {
    result = applyCleanupStrategy(result, config, seed);
  }

  return result;
}

/**
 * Applies cleanup strategy to reduce snapshot count.
 * Removes approximately 10% of snapshots.
 *
 * @param snapshots - Snapshot pool
 * @param config - Snapshot configuration
 * @param seed - Random seed for 'random' strategy
 * @returns Reduced snapshot pool
 */
export function applyCleanupStrategy<TState>(
  snapshots: Snapshot<TState>[],
  config: SnapshotConfig,
  seed?: number,
): Snapshot<TState>[] {
  if (snapshots.length === 0) return snapshots;

  const toRemove = Math.max(1, Math.ceil(snapshots.length * 0.1)); // Remove 10%

  switch (config.cleanupStrategy) {
    case 'oldest':
      return [...snapshots]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, snapshots.length - toRemove);

    case 'lowest-rating':
      return [...snapshots]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, snapshots.length - toRemove);

    case 'random': {
      const rng = new SeededRandom(seed ?? Date.now());
      const shuffled = rng.shuffle([...snapshots]);
      return shuffled.slice(0, snapshots.length - toRemove);
    }

    default:
      return snapshots;
  }
}

/**
 * Gets statistics about the snapshot pool.
 *
 * @param snapshots - Snapshot pool
 * @returns Pool statistics
 *
 * @example
 * const stats = getSnapshotPoolStats(pool);
 * console.log(`Total: ${stats.totalCount}, Size: ${stats.totalSizeBytes} bytes`);
 */
export function getSnapshotPoolStats<TState>(
  snapshots: Snapshot<TState>[],
): SnapshotPoolStats {
  const byWins = new Map<number, number>();
  let totalSize = 0;
  let oldest = Date.now();

  for (const s of snapshots) {
    byWins.set(s.wins, (byWins.get(s.wins) ?? 0) + 1);
    totalSize += s.sizeBytes ?? 0;
    if (s.createdAt < oldest) {
      oldest = s.createdAt;
    }
  }

  return {
    totalCount: snapshots.length,
    totalSizeBytes: totalSize,
    oldestTimestamp: snapshots.length > 0 ? oldest : 0,
    byWins,
  };
}

/**
 * Finds a matching opponent from snapshot pool.
 * Filters by wins range and rating range.
 *
 * @param currentWins - Player's current win count
 * @param currentRating - Player's current rating
 * @param snapshots - Available opponent snapshots
 * @param config - Matchmaking configuration
 * @param seed - Random seed for selection
 * @returns Matching snapshot or null if no match found
 *
 * @example
 * const opponent = findOpponent(3, 1200, pool, ROGUELIKE_MATCHMAKING_CONFIG, 12345);
 */
export function findOpponent<TState>(
  currentWins: number,
  currentRating: number,
  snapshots: Snapshot<TState>[],
  config: MatchmakingConfig,
  seed?: number,
): Snapshot<TState> | null {
  // Filter by wins range
  const byWins = snapshots.filter(
    (s) => Math.abs(s.wins - currentWins) <= config.winsRange,
  );

  // Filter by rating range
  const byRating = byWins.filter(
    (s) => Math.abs(s.rating - currentRating) <= config.ratingRange,
  );

  if (byRating.length === 0) {
    return null;
  }

  // Random selection from filtered
  const rng = new SeededRandom(seed ?? Date.now());
  const index = Math.floor(rng.next() * byRating.length);
  return byRating[index] ?? null;
}


/**
 * Bot team result.
 */
export interface BotTeam<TCard extends BaseCard> {
  /** Bot name */
  name: string;
  /** Bot cards/units */
  cards: TCard[];
  /** Bot difficulty (0.0 - 1.0) */
  difficulty: number;
}

/**
 * Generates a bot opponent when no snapshots are available.
 * Bot difficulty scales with player's current wins.
 *
 * @param wins - Player's current win count
 * @param availableCards - Pool of cards to build bot team from
 * @param config - Bot configuration
 * @param seed - Random seed for determinism
 * @param deckSize - Target deck size (default 12)
 * @returns Generated bot team
 *
 * @example
 * const bot = generateBot(5, cardPool, ROGUELIKE_BOT_CONFIG, 12345);
 */
export function generateBot<TCard extends BaseCard>(
  wins: number,
  availableCards: TCard[],
  config: BotConfig,
  seed: number,
  deckSize = 12,
): BotTeam<TCard> {
  const difficulty = Math.min(
    config.baseDifficulty + wins * config.difficultyPerWin,
    config.maxDifficulty,
  );

  const name = config.nameGenerator?.(wins) ?? `Bot_${wins}W`;
  const cards = selectBotCards(availableCards, difficulty, seed, deckSize);

  return { name, cards, difficulty };
}

/**
 * Selects cards for bot team based on difficulty.
 * Higher difficulty = more high-tier cards.
 *
 * @param pool - Available cards
 * @param difficulty - Bot difficulty (0.0 - 1.0)
 * @param seed - Random seed
 * @param maxCards - Maximum cards to select
 * @returns Selected cards
 */
export function selectBotCards<TCard extends BaseCard>(
  pool: TCard[],
  difficulty: number,
  seed: number,
  maxCards: number,
): TCard[] {
  if (pool.length === 0) return [];

  const rng = new SeededRandom(seed);
  const selected: TCard[] = [];
  const available = [...pool];

  // Tier weights based on difficulty
  // difficulty 0.5 = mostly T1
  // difficulty 0.95 = mostly T2/T3
  const getTierWeight = (tier: number): number => {
    switch (tier) {
      case 1:
        return 1 - difficulty; // T1 weight decreases with difficulty
      case 2:
        return difficulty * 0.6; // T2 weight increases
      case 3:
        return difficulty * 0.4; // T3 weight increases slower
      default:
        return difficulty * 0.3; // Higher tiers
    }
  };

  while (selected.length < maxCards && available.length > 0) {
    // Calculate weights for remaining cards
    const weights = available.map((card) => Math.max(0.01, getTierWeight(card.tier)));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Weighted random selection
    let random = rng.next() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i] ?? 0;
      random -= weight;
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const card = available[selectedIndex];
    if (card) {
      selected.push(card);
      available.splice(selectedIndex, 1);
    }
  }

  return selected;
}

/**
 * Calculates bot difficulty for a given win count.
 *
 * @param wins - Current win count
 * @param config - Bot configuration
 * @returns Difficulty value (0.0 - 1.0)
 *
 * @example
 * const difficulty = getBotDifficulty(5, ROGUELIKE_BOT_CONFIG);
 */
export function getBotDifficulty(wins: number, config: BotConfig): number {
  return Math.min(
    config.baseDifficulty + wins * config.difficultyPerWin,
    config.maxDifficulty,
  );
}

/**
 * Gets tier distribution for a bot at given difficulty.
 * Returns expected proportion of each tier.
 *
 * @param difficulty - Bot difficulty (0.0 - 1.0)
 * @returns Map of tier to proportion
 *
 * @example
 * const dist = getBotTierDistribution(0.8);
 * // { 1: 0.2, 2: 0.48, 3: 0.32 }
 */
export function getBotTierDistribution(
  difficulty: number,
): Record<number, number> {
  const t1 = 1 - difficulty;
  const t2 = difficulty * 0.6;
  const t3 = difficulty * 0.4;
  const total = t1 + t2 + t3;

  return {
    1: t1 / total,
    2: t2 / total,
    3: t3 / total,
  };
}

