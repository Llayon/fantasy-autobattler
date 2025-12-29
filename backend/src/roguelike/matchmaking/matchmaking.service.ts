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
import { getBotTeamForRound, getBudgetForRound } from '../data/bot-teams.data';

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
    // Calculate round number (wins + losses + 1 for current battle)
    const round = run.wins + run.losses + 1;

    this.logger.log('Saving snapshot', {
      runId: run.id,
      playerId: run.playerId,
      wins: run.wins,
      round,
      teamSize: team.length,
    });

    // Enforce per-player limit by removing oldest snapshots
    await this.enforcePlayerSnapshotLimit(run.playerId);

    // Create new snapshot
    const snapshot = this.snapshotRepository.create({
      runId: run.id,
      playerId: run.playerId,
      wins: run.wins,
      round,
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
      round,
    });

    return savedSnapshot;
  }

  /**
   * Finds an opponent for the current run.
   *
   * Searches for snapshots within rating range and exact round match.
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
    // Calculate round number (wins + losses + 1 for current battle)
    const currentRound = run.wins + run.losses + 1;

    this.logger.log('Finding opponent', {
      runId: run.id,
      playerId: run.playerId,
      wins: run.wins,
      round: currentRound,
      rating: run.rating,
    });

    const config = ROGUELIKE_MATCHMAKING_CONFIG;

    // Calculate rating range (round must match exactly for fair budget)
    const minRating = run.rating - config.ratingRange;
    const maxRating = run.rating + config.ratingRange;

    // Find matching snapshots (excluding own snapshots, exact round match)
    const candidates = await this.snapshotRepository.find({
      where: {
        playerId: Not(run.playerId),
        round: currentRound, // Exact round match for fair budget
        rating: Between(minRating, maxRating),
      },
      order: { createdAt: 'DESC' },
      take: SNAPSHOT_CONSTANTS.MAX_MATCHMAKING_CANDIDATES,
    });

    this.logger.debug('Found snapshot candidates', {
      runId: run.id,
      candidateCount: candidates.length,
      round: currentRound,
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
          opponentRound: opponent.round,
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
        round: currentRound,
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
      round: currentRound,
    });
    throw new NoOpponentFoundException(run.id, run.wins);
  }


  /**
   * Generates a bot opponent based on current wins.
   *
   * Uses predefined team compositions for each round with random variant selection.
   * Bot difficulty scales with player's win count.
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

    // Calculate round number (wins + losses + 1 for current battle)
    const roundNumber = run.wins + run.losses + 1;
    
    // Get predefined team for this round with random variant selection
    const variantRandom = rng.next();
    const predefinedTeam = getBotTeamForRound(roundNumber, botFaction, variantRandom);
    const team = predefinedTeam 
      ? predefinedTeam.units 
      : this.generateBotTeamFallback(botFaction, roundNumber, rng);

    // Generate spell timings
    const spellTimings = this.generateBotSpellTimings(botFaction, rng);

    const botName = config.nameGenerator?.(run.wins) ?? `Bot_${run.wins}W`;

    this.logger.debug('Generated bot opponent', {
      runId: run.id,
      botName,
      botFaction,
      roundNumber,
      difficulty,
      teamSize: team.length,
      usedPredefined: !!predefinedTeam,
      variant: predefinedTeam?.variant,
      budget: getBudgetForRound(roundNumber),
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
   * Fallback team generation when predefined team not available.
   *
   * @param faction - Bot faction
   * @param roundNumber - Current round number
   * @param rng - Seeded random generator
   * @returns Array of placed units
   * @private
   */
  private generateBotTeamFallback(
    faction: Faction,
    roundNumber: number,
    rng: SeededRandom,
  ): PlacedUnit[] {
    const units = faction === 'humans' ? HUMANS_T1_UNITS : UNDEAD_T1_UNITS;
    const budget = getBudgetForRound(roundNumber);
    const team: PlacedUnit[] = [];
    let remainingBudget = budget;

    // Shuffle units for variety
    const shuffled = rng.shuffle([...units]);

    // Place units until budget exhausted
    let posIndex = 0;
    for (const unit of shuffled) {
      if (remainingBudget < unit.cost) continue;
      if (posIndex >= 16) break; // Max 16 positions (8×2)

      team.push({
        unitId: unit.id,
        tier: 1,
        position: {
          x: posIndex % 8,
          y: Math.floor(posIndex / 8),
        },
      });

      remainingBudget -= unit.cost;
      posIndex++;
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
