/**
 * Matchmaking Service for Fantasy Autobattler.
 * Manages player queue, opponent matching, and battle creation.
 */

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchmakingQueue, MatchmakingStatus } from '../entities/matchmaking-queue.entity';
import { Player } from '../entities/player.entity';
import { Team } from '../entities/team.entity';
import { BattleService } from '../battle/battle.service';
import { MATCHMAKING_CONSTANTS } from '../config/game.constants';

/**
 * Queue entry interface for matchmaking operations.
 */
export interface QueueEntry {
  /** Unique queue entry ID */
  id: string;
  /** Player ID in the queue */
  playerId: string;
  /** Team ID being used for matchmaking */
  teamId: string;
  /** Player's ELO rating */
  rating: number;
  /** Current queue status */
  status: MatchmakingStatus;
  /** When the player joined the queue */
  joinedAt: Date;
  /** Time spent waiting in milliseconds */
  waitTime: number;
}

/**
 * Match result interface when two players are paired.
 */
export interface Match {
  /** First player's queue entry */
  player1: QueueEntry;
  /** Second player's queue entry */
  player2: QueueEntry;
  /** Rating difference between players */
  ratingDifference: number;
  /** Battle ID created for this match */
  battleId: string;
}

/**
 * Battle creation result interface.
 */
export interface Battle {
  /** Unique battle identifier */
  id: string;
  /** First player ID */
  player1Id: string;
  /** Second player ID */
  player2Id: string;
  /** Battle status */
  status: string;
  /** When the battle was created */
  createdAt: Date;
}

/**
 * Matchmaking Service.
 * Handles player queue management, opponent matching with ELO-based algorithms,
 * and battle creation for matched players.
 * 
 * @example
 * const queueEntry = await matchmakingService.joinQueue('player-123', 'team-456');
 * const match = await matchmakingService.findMatch('player-123');
 */
@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    @InjectRepository(MatchmakingQueue)
    private readonly queueRepository: Repository<MatchmakingQueue>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly battleService: BattleService,
  ) {}

  /**
   * Add a player to the matchmaking queue with their selected team.
   * 
   * @param playerId - ID of the player joining the queue
   * @param teamId - ID of the team to use for matchmaking
   * @returns Queue entry information
   * @throws BadRequestException if player or team not found
   * @throws ConflictException if player already in queue
   * @example
   * const entry = await matchmakingService.joinQueue('player-123', 'team-456');
   */
  async joinQueue(playerId: string, teamId: string): Promise<QueueEntry> {
    this.logger.log(`Player joining queue`, { playerId, teamId });

    // Validate player exists
    const player = await this.playerRepository.findOne({ where: { id: playerId } });
    if (!player) {
      this.logger.warn(`Player not found for queue join`, { playerId });
      throw new NotFoundException(`Игрок не найден`);
    }

    // Validate team exists and belongs to player
    const team = await this.teamRepository.findOne({
      where: { id: teamId, playerId, isActive: true },
    });
    if (!team) {
      this.logger.warn(`Team not found or not active for queue join`, { playerId, teamId });
      throw new NotFoundException(`Активная команда не найдена`);
    }

    // Check if player is already in queue
    const existingEntry = await this.queueRepository.findOne({
      where: { playerId, status: MatchmakingStatus.WAITING },
    });
    if (existingEntry) {
      this.logger.warn(`Player already in queue`, { playerId, existingEntryId: existingEntry.id });
      throw new ConflictException(`Игрок уже находится в очереди`);
    }

    // Create queue entry
    const queueEntry = this.queueRepository.create({
      playerId,
      teamId,
      rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO, // TODO: Get actual player rating
      status: MatchmakingStatus.WAITING,
    });

    const savedEntry = await this.queueRepository.save(queueEntry);

    this.logger.log(`Player joined queue successfully`, {
      playerId,
      teamId,
      queueEntryId: savedEntry.id,
      rating: savedEntry.rating,
    });

    return this.mapToQueueEntry(savedEntry);
  }

  /**
   * Remove a player from the matchmaking queue.
   * 
   * @param playerId - ID of the player leaving the queue
   * @throws NotFoundException if player not in queue
   * @example
   * await matchmakingService.leaveQueue('player-123');
   */
  async leaveQueue(playerId: string): Promise<void> {
    this.logger.log(`Player leaving queue`, { playerId });

    // Find player's queue entry
    const queueEntry = await this.queueRepository.findOne({
      where: { playerId, status: MatchmakingStatus.WAITING },
    });

    if (!queueEntry) {
      this.logger.warn(`Player not found in queue for leave`, { playerId });
      throw new NotFoundException(`Игрок не найден в очереди`);
    }

    // Remove from queue
    await this.queueRepository.remove(queueEntry);

    this.logger.log(`Player left queue successfully`, {
      playerId,
      queueEntryId: queueEntry.id,
      waitTime: queueEntry.getWaitTime(),
    });
  }

  /**
   * Find a suitable opponent for the specified player.
   * Uses ELO-based matching with expanding search radius over time.
   * 
   * @param playerId - ID of the player to find a match for
   * @returns Match information if opponent found, null otherwise
   * @throws NotFoundException if player not in queue
   * @example
   * const match = await matchmakingService.findMatch('player-123');
   * if (match) {
   *   console.log(`Match found! Battle ID: ${match.battleId}`);
   * }
   */
  async findMatch(playerId: string): Promise<Match | null> {
    this.logger.debug(`Finding match for player`, { playerId });

    // Find player's queue entry
    const playerEntry = await this.queueRepository.findOne({
      where: { playerId, status: MatchmakingStatus.WAITING },
    });

    if (!playerEntry) {
      this.logger.warn(`Player not found in queue for match`, { playerId });
      throw new NotFoundException(`Игрок не найден в очереди`);
    }

    // Calculate expanded rating range based on wait time
    const waitTimeMinutes = Math.floor(playerEntry.getWaitTime() / (60 * 1000));
    const ratingExpansion = waitTimeMinutes * MATCHMAKING_CONSTANTS.RATING_EXPANSION_PER_MINUTE;
    const maxRatingDiff = Math.min(
      MATCHMAKING_CONSTANTS.MAX_RATING_DIFFERENCE + ratingExpansion,
      500 // Maximum expansion limit
    );

    this.logger.debug(`Searching for opponent with expanded rating range`, {
      playerId,
      playerRating: playerEntry.rating,
      waitTimeMinutes,
      maxRatingDiff,
    });

    // Find potential opponents
    const opponents = await this.queueRepository
      .createQueryBuilder('queue')
      .where('queue.playerId != :playerId', { playerId })
      .andWhere('queue.status = :status', { status: MatchmakingStatus.WAITING })
      .andWhere('ABS(queue.rating - :playerRating) <= :maxRatingDiff', {
        playerRating: playerEntry.rating,
        maxRatingDiff,
      })
      .orderBy('ABS(queue.rating - :playerRating)', 'ASC')
      .addOrderBy('queue.joinedAt', 'ASC') // Prioritize players who waited longer
      .setParameter('playerRating', playerEntry.rating)
      .limit(1)
      .getMany();

    if (opponents.length === 0) {
      this.logger.debug(`No suitable opponent found`, {
        playerId,
        playerRating: playerEntry.rating,
        maxRatingDiff,
        waitTimeMinutes,
      });
      return null;
    }

    const opponent = opponents[0];
    if (!opponent) {
      this.logger.debug(`No opponent found in query result`, { playerId });
      return null;
    }

    const ratingDifference = Math.abs(playerEntry.rating - opponent.rating);

    this.logger.log(`Match found`, {
      player1Id: playerId,
      player1Rating: playerEntry.rating,
      player2Id: opponent.playerId,
      player2Rating: opponent.rating,
      ratingDifference,
      player1WaitTime: playerEntry.getWaitTime(),
      player2WaitTime: opponent.getWaitTime(),
    });

    // Create battle for matched players
    const battle = await this.createBattle(playerEntry, opponent);

    return {
      player1: this.mapToQueueEntry(playerEntry),
      player2: this.mapToQueueEntry(opponent),
      ratingDifference,
      battleId: battle.id,
    };
  }

  /**
   * Create a battle between two matched players.
   * Updates queue entries to matched status and initiates battle simulation.
   * 
   * @param player1 - First player's queue entry
   * @param player2 - Second player's queue entry
   * @returns Battle information
   * @example
   * const battle = await matchmakingService.createBattle(entry1, entry2);
   */
  async createBattle(player1: MatchmakingQueue, player2: MatchmakingQueue): Promise<Battle> {
    this.logger.log(`Creating battle for matched players`, {
      player1Id: player1.playerId,
      player2Id: player2.playerId,
      player1TeamId: player1.teamId,
      player2TeamId: player2.teamId,
    });

    try {
      // Get team data for battle simulation
      const [team1, team2] = await Promise.all([
        this.teamRepository.findOne({ where: { id: player1.teamId } }),
        this.teamRepository.findOne({ where: { id: player2.teamId } }),
      ]);

      if (!team1 || !team2) {
        this.logger.error(`Team data not found for battle creation`, {
          player1TeamId: player1.teamId,
          player2TeamId: player2.teamId,
          team1Found: !!team1,
          team2Found: !!team2,
        });
        throw new BadRequestException(`Данные команды не найдены`);
      }

      // Start battle simulation using BattleService
      const battleResult = await this.battleService.startBattle(player1.playerId);

      // Mark queue entries as matched and remove from queue
      player1.markAsMatched(battleResult.battleId);
      player2.markAsMatched(battleResult.battleId);

      // Save the matched status first, then remove from queue
      await Promise.all([
        this.queueRepository.save(player1),
        this.queueRepository.save(player2),
      ]);

      // Remove both players from the queue after successful match
      await Promise.all([
        this.queueRepository.remove(player1),
        this.queueRepository.remove(player2),
      ]);

      this.logger.log(`Battle created successfully`, {
        battleId: battleResult.battleId,
        player1Id: player1.playerId,
        player2Id: player2.playerId,
      });

      return {
        id: battleResult.battleId,
        player1Id: player1.playerId,
        player2Id: player2.playerId,
        status: 'completed',
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to create battle`, {
        player1Id: player1.playerId,
        player2Id: player2.playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get player's current queue entry if they are in queue.
   * 
   * @param playerId - ID of the player to check
   * @returns Queue entry with match info if player is in queue, null otherwise
   * @example
   * const entry = await matchmakingService.getPlayerQueueEntry('player-123');
   * if (entry) console.log(`Player is ${entry.status}`);
   */
  async getPlayerQueueEntry(playerId: string): Promise<(QueueEntry & { matchId?: string }) | null> {
    this.logger.debug(`Getting queue entry for player`, { playerId });

    const queueEntry = await this.queueRepository.findOne({
      where: { playerId },
      order: { createdAt: 'DESC' }, // Get most recent entry
    });

    if (!queueEntry) {
      return null;
    }

    const baseEntry = this.mapToQueueEntry(queueEntry);
    return queueEntry.matchId 
      ? { ...baseEntry, matchId: queueEntry.matchId }
      : baseEntry;
  }

  /**
   * Get current queue status and statistics.
   * 
   * @returns Queue statistics
   * @example
   * const stats = await matchmakingService.getQueueStats();
   * console.log(`${stats.waitingPlayers} players waiting`);
   */
  async getQueueStats(): Promise<{
    waitingPlayers: number;
    averageWaitTime: number;
    ratingDistribution: { min: number; max: number; average: number };
  }> {
    const waitingEntries = await this.queueRepository.find({
      where: { status: MatchmakingStatus.WAITING },
    });

    if (waitingEntries.length === 0) {
      return {
        waitingPlayers: 0,
        averageWaitTime: 0,
        ratingDistribution: { min: 0, max: 0, average: 0 },
      };
    }

    const ratings = waitingEntries.map(e => e.rating);
    const waitTimes = waitingEntries.map(e => e.getWaitTime());

    return {
      waitingPlayers: waitingEntries.length,
      averageWaitTime: waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length,
      ratingDistribution: {
        min: Math.min(...ratings),
        max: Math.max(...ratings),
        average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      },
    };
  }

  /**
   * Clean up expired queue entries.
   * Removes entries that have been waiting longer than the timeout.
   * 
   * @returns Number of entries cleaned up
   * @example
   * const cleaned = await matchmakingService.cleanupExpiredEntries();
   */
  async cleanupExpiredEntries(): Promise<number> {
    const timeoutMinutes = MATCHMAKING_CONSTANTS.MAX_QUEUE_TIME_MINUTES;
    
    const expiredEntries = await this.queueRepository
      .createQueryBuilder('queue')
      .where('queue.status = :status', { status: MatchmakingStatus.WAITING })
      .andWhere('queue.joinedAt < :expiredTime', {
        expiredTime: new Date(Date.now() - timeoutMinutes * 60 * 1000),
      })
      .getMany();

    if (expiredEntries.length === 0) {
      return 0;
    }

    // Mark as expired
    for (const entry of expiredEntries) {
      entry.markAsExpired();
    }

    await this.queueRepository.save(expiredEntries);

    this.logger.log(`Cleaned up expired queue entries`, {
      count: expiredEntries.length,
      timeoutMinutes,
    });

    return expiredEntries.length;
  }

  /**
   * Map MatchmakingQueue entity to QueueEntry interface.
   * 
   * @param entity - MatchmakingQueue entity
   * @returns QueueEntry interface
   */
  private mapToQueueEntry(entity: MatchmakingQueue): QueueEntry {
    return {
      id: entity.id,
      playerId: entity.playerId,
      teamId: entity.teamId,
      rating: entity.rating,
      status: entity.status,
      joinedAt: entity.joinedAt,
      waitTime: entity.getWaitTime(),
    };
  }
}