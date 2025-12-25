/**
 * Matchmaking Service for Roguelike Mode
 *
 * Manages opponent finding and snapshot creation for async PvP.
 * Uses core progression snapshot system for matchmaking logic.
 *
 * @module roguelike/matchmaking/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import {
  RoguelikeSnapshotEntity,
  PlacedUnit,
  SpellTimingConfig,
  SNAPSHOT_CONSTANTS,
} from '../entities/snapshot.entity';
import { RoguelikeRunEntity } from '../entities/run.entity';
import { NoOpponentFoundException } from '../exceptions/roguelike.exceptions';
import { Faction } from '../types/faction.types';
import {
  ROGUELIKE_BOT_CONFIG,
  ROGUELIKE_MATCHMAKING_CONFIG,
} from '../../core/progression/snapshot/snapshot.presets';
import { getBotDifficulty } from '../../core/progression/snapshot/snapshot';
import { HUMANS_T1_UNITS } from '../data/humans.units';
import { UNDEAD_T1_UNITS } from '../data/undead.units';
import { SeededRandom } from '../../core/utils/random';

/**
 * Bot opponent data structure.
 */
export interface BotOpponent {
  /** Bot identifier */
  id: string;
  /** Bot name */
  name: string;
  /** Bot faction */
  faction: Faction;
  /** Bot leader ID */
  leaderId: string;
  /** Bot team composition */
  team: PlacedUnit[];
  /** Bot spell timings */
  spellTimings: SpellTimingConfig[];
  /** Bot difficulty (0.0 - 1.0) */
  difficulty: number;
  /** Whether this is a bot */
  isBot: true;
}

/**
 * Opponent result from matchmaking.
 */
export interface MatchmakingResult {
  /** Opponent snapshot or bot */
  opponent: RoguelikeSnapshotEntity | BotOpponent;
  /** Whether opponent is a bot */
  isBot: boolean;
  /** Estimated difficulty */
  difficulty: 'easy' | 'medium' | 'hard';
}


/**
 * Service for managing roguelike matchmaking.
 *
 * Handles snapshot creation, opponent finding, and bot generation.
 * Uses TypeORM for persistence and core progression systems for logic.
 *
 * @example
 * // Find an opponent
 * const result = await matchmakingService.findOpponent(run);
 *
 * @example
 * // Save a snapshot after battle
 * await matchmakingService.saveSnapshot(run, team, spellTimings);
 */
@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    @InjectRepository(RoguelikeSnapshotEntity)
    private readonly snapshotRepository: Repository<RoguelikeSnapshotEntity>,
  ) {}

  /**
   * Saves a snapshot of the player's team for matchmaking.
   *
   * Creates a new snapshot with the current team composition and spell timings.
   * Enforces per-player snapshot limits by removing oldest snapshots.
   *
   * @param run - Current run entity
   * @param team - Team composition with positions
   * @param spellTimings - Spell timing configurations
   * @returns Created snapshot entity
   *
   * @example
   * const snapshot = await matchmakingService.saveSnapshot(
   *   run,
   *   [{ unitId: 'footman', tier: 1, position: { x: 0, y: 0 } }],
   *   [{ spellId: 'holy_light', timing: 'mid' }]
   * );
   */
  async saveSnapshot(
    run: RoguelikeRunEntity,
    team: PlacedUnit[],
    spellTimings: SpellTimingConfig[],
  ): Promise<RoguelikeSnapshotEntity> {
    this.logger.log('Saving snapshot', {
      runId: run.id,
      playerId: run.playerId,
      wins: run.wins,
      teamSize: team.length,
    });

    // Enforce per-player limit by removing oldest snapshots
    await this.enforcePlayerSnapshotLimit(run.playerId);

    // Create new snapshot
    const snapshot = this.snapshotRepository.create({
      runId: run.id,
      playerId: run.playerId,
      wins: run.wins,
      rating: run.rating,
      team,
      spellTimings,
      faction: run.faction,
      leaderId: run.leaderId,
    });

    const savedSnapshot = await this.snapshotRepository.save(snapshot);

    this.logger.log('Snapshot saved', {
      snapshotId: savedSnapshot.id,
      runId: run.id,
      playerId: run.playerId,
    });

    return savedSnapshot;
  }

  /**
   * Finds an opponent for the current run.
   *
   * Searches for snapshots within rating and wins range.
   * Falls back to bot generation if no suitable opponent found.
   *
   * @param run - Current run entity
   * @param seed - Random seed for deterministic selection (optional)
   * @returns Matchmaking result with opponent and difficulty
   *
   * @example
   * const result = await matchmakingService.findOpponent(run);
   * if (result.isBot) {
   *   console.log('Fighting bot:', result.opponent.name);
   * }
   */
  async findOpponent(
    run: RoguelikeRunEntity,
    seed?: number,
  ): Promise<MatchmakingResult> {
    this.logger.log('Finding opponent', {
      runId: run.id,
      playerId: run.playerId,
      wins: run.wins,
      rating: run.rating,
    });

    const config = ROGUELIKE_MATCHMAKING_CONFIG;

    // Calculate rating and wins ranges
    const minRating = run.rating - config.ratingRange;
    const maxRating = run.rating + config.ratingRange;
    const minWins = Math.max(0, run.wins - config.winsRange);
    const maxWins = run.wins + config.winsRange;

    // Find matching snapshots (excluding own snapshots)
    const candidates = await this.snapshotRepository.find({
      where: {
        playerId: Not(run.playerId),
        wins: Between(minWins, maxWins),
        rating: Between(minRating, maxRating),
      },
      order: { createdAt: 'DESC' },
      take: SNAPSHOT_CONSTANTS.MAX_MATCHMAKING_CANDIDATES,
    });

    this.logger.debug('Found snapshot candidates', {
      runId: run.id,
      candidateCount: candidates.length,
      minWins,
      maxWins,
      minRating,
      maxRating,
    });

    if (candidates.length > 0) {
      // Random selection from candidates
      const rng = new SeededRandom(seed ?? Date.now());
      const index = Math.floor(rng.next() * candidates.length);
      const opponent = candidates[index];

      if (opponent) {
        const difficulty = this.calculateDifficulty(run.rating, opponent.rating);

        this.logger.log('Found human opponent', {
          runId: run.id,
          opponentId: opponent.playerId,
          opponentWins: opponent.wins,
          opponentRating: opponent.rating,
          difficulty,
        });

        return {
          opponent,
          isBot: false,
          difficulty,
        };
      }
    }

    // Bot fallback
    if (config.botFallback) {
      this.logger.log('No human opponent found, generating bot', {
        runId: run.id,
        wins: run.wins,
      });

      const bot = this.generateBot(run, seed ?? Date.now());
      const difficulty = this.calculateBotDifficulty(bot.difficulty);

      return {
        opponent: bot,
        isBot: true,
        difficulty,
      };
    }

    // No opponent found and bot fallback disabled
    this.logger.warn('No opponent found', {
      runId: run.id,
      wins: run.wins,
    });
    throw new NoOpponentFoundException(run.id, run.wins);
  }


  /**
   * Generates a bot opponent based on current wins.
   *
   * Bot difficulty scales with player's win count.
   * Uses faction-appropriate units for team composition.
   *
   * @param run - Current run entity
   * @param seed - Random seed for deterministic generation
   * @returns Generated bot opponent
   *
   * @example
   * const bot = matchmakingService.generateBot(run, 12345);
   */
  generateBot(run: RoguelikeRunEntity, seed: number): BotOpponent {
    const config = ROGUELIKE_BOT_CONFIG;
    const difficulty = getBotDifficulty(run.wins, config);
    const rng = new SeededRandom(seed);

    // Alternate faction for variety
    const botFaction: Faction = rng.next() > 0.5 ? 'humans' : 'undead';
    const botLeaderId = botFaction === 'humans' ? 'commander_aldric' : 'lich_king_malachar';

    // Generate team based on difficulty
    const team = this.generateBotTeam(botFaction, difficulty, rng);

    // Generate spell timings
    const spellTimings = this.generateBotSpellTimings(botFaction, rng);

    const botName = config.nameGenerator?.(run.wins) ?? `Bot_${run.wins}W`;

    this.logger.debug('Generated bot opponent', {
      runId: run.id,
      botName,
      botFaction,
      difficulty,
      teamSize: team.length,
    });

    return {
      id: `bot_${seed}`,
      name: botName,
      faction: botFaction,
      leaderId: botLeaderId,
      team,
      spellTimings,
      difficulty,
      isBot: true,
    };
  }

  /**
   * Generates a bot team composition.
   *
   * @param faction - Bot faction
   * @param difficulty - Bot difficulty (0.0 - 1.0)
   * @param rng - Seeded random generator
   * @returns Array of placed units
   * @private
   */
  private generateBotTeam(
    faction: Faction,
    difficulty: number,
    rng: SeededRandom,
  ): PlacedUnit[] {
    const units = faction === 'humans' ? HUMANS_T1_UNITS : UNDEAD_T1_UNITS;
    const team: PlacedUnit[] = [];

    // Team size scales with difficulty (4-8 units)
    const teamSize = Math.floor(4 + difficulty * 4);

    // Shuffle units for variety
    const shuffled = rng.shuffle([...units]);

    // Place units on deployment grid (8×2)
    for (let i = 0; i < Math.min(teamSize, shuffled.length); i++) {
      const unit = shuffled[i];
      if (!unit) continue;

      // Calculate tier based on difficulty
      // Higher difficulty = more T2/T3 units
      let tier: 1 | 2 | 3 = 1;
      const tierRoll = rng.next();
      if (tierRoll < difficulty * 0.4) {
        tier = 3;
      } else if (tierRoll < difficulty * 0.7) {
        tier = 2;
      }

      team.push({
        unitId: unit.id,
        tier,
        position: {
          x: i % 8,
          y: Math.floor(i / 8),
        },
      });
    }

    return team;
  }

  /**
   * Generates bot spell timings.
   *
   * @param faction - Bot faction
   * @param rng - Seeded random generator
   * @returns Array of spell timing configs
   * @private
   */
  private generateBotSpellTimings(
    faction: Faction,
    rng: SeededRandom,
  ): SpellTimingConfig[] {
    const spellIds = faction === 'humans'
      ? ['holy_light', 'rally']
      : ['death_coil', 'raise_dead'];

    const timings: Array<'early' | 'mid' | 'late'> = ['early', 'mid', 'late'];

    return spellIds.map((spellId) => ({
      spellId,
      timing: timings[Math.floor(rng.next() * timings.length)] ?? 'mid',
    }));
  }

  /**
   * Calculates difficulty based on rating difference.
   *
   * @param playerRating - Player's rating
   * @param opponentRating - Opponent's rating
   * @returns Difficulty level
   * @private
   */
  private calculateDifficulty(
    playerRating: number,
    opponentRating: number,
  ): 'easy' | 'medium' | 'hard' {
    const diff = opponentRating - playerRating;

    if (diff < -100) return 'easy';
    if (diff > 100) return 'hard';
    return 'medium';
  }

  /**
   * Calculates difficulty from bot difficulty value.
   *
   * @param botDifficulty - Bot difficulty (0.0 - 1.0)
   * @returns Difficulty level
   * @private
   */
  private calculateBotDifficulty(
    botDifficulty: number,
  ): 'easy' | 'medium' | 'hard' {
    if (botDifficulty < 0.5) return 'easy';
    if (botDifficulty > 0.75) return 'hard';
    return 'medium';
  }

  /**
   * Enforces per-player snapshot limit.
   *
   * Removes oldest snapshots if player has too many.
   *
   * @param playerId - Player ID
   * @private
   */
  private async enforcePlayerSnapshotLimit(playerId: string): Promise<void> {
    const maxPerPlayer = 10; // From ROGUELIKE_SNAPSHOT_CONFIG

    const count = await this.snapshotRepository.count({
      where: { playerId },
    });

    if (count >= maxPerPlayer) {
      // Find oldest snapshots to delete
      const toDelete = await this.snapshotRepository.find({
        where: { playerId },
        order: { createdAt: 'ASC' },
        take: count - maxPerPlayer + 1,
      });

      if (toDelete.length > 0) {
        await this.snapshotRepository.remove(toDelete);

        this.logger.debug('Removed old snapshots', {
          playerId,
          removedCount: toDelete.length,
        });
      }
    }
  }

  /**
   * Gets snapshot statistics for monitoring.
   *
   * @returns Snapshot pool statistics
   *
   * @example
   * const stats = await matchmakingService.getSnapshotStats();
   * console.log('Total snapshots:', stats.totalCount);
   */
  async getSnapshotStats(): Promise<{
    totalCount: number;
    byWins: Record<number, number>;
    avgRating: number;
  }> {
    const snapshots = await this.snapshotRepository.find();

    const byWins: Record<number, number> = {};
    let totalRating = 0;

    for (const s of snapshots) {
      byWins[s.wins] = (byWins[s.wins] ?? 0) + 1;
      totalRating += s.rating;
    }

    return {
      totalCount: snapshots.length,
      byWins,
      avgRating: snapshots.length > 0 ? Math.round(totalRating / snapshots.length) : 0,
    };
  }

  /**
   * Cleans up expired snapshots.
   *
   * Removes snapshots older than 24 hours.
   *
   * @returns Number of deleted snapshots
   *
   * @example
   * const deleted = await matchmakingService.cleanupExpiredSnapshots();
   */
  async cleanupExpiredSnapshots(): Promise<number> {
    const expiryMs = 24 * 60 * 60 * 1000; // 24 hours
    const expiryDate = new Date(Date.now() - expiryMs);

    const result = await this.snapshotRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :expiryDate', { expiryDate })
      .execute();

    const deletedCount = result.affected ?? 0;

    if (deletedCount > 0) {
      this.logger.log('Cleaned up expired snapshots', { deletedCount });
    }

    return deletedCount;
  }
}
