/**
 * Rating Service for Fantasy Autobattler.
 * Implements ELO-based rating system for competitive PvP matchmaking.
 * 
 * @fileoverview Handles player rating calculations, updates, and leaderboards
 * using standard ELO algorithm with adaptive K-factors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Player } from '../entities/player.entity';

/**
 * ELO rating calculation result containing rating changes for both players.
 */
export interface EloChange {
  /** Rating change for the winning player (positive) */
  winnerDelta: number;
  /** Rating change for the losing player (negative) */
  loserDelta: number;
}

/**
 * Player ranking information with position and rating.
 */
export interface PlayerRank {
  /** Player's current rank position (1-based) */
  rank: number;
  /** Player's current rating */
  rating: number;
  /** Total number of ranked players */
  totalPlayers: number;
}

/**
 * Rating system constants for ELO calculations.
 */
const RATING_CONSTANTS = {
  /** Starting rating for new players */
  INITIAL_RATING: 1000,
  /** K-factor for new players (high volatility) */
  K_FACTOR_NEW: 32,
  /** K-factor for experienced players (low volatility) */
  K_FACTOR_EXPERIENCED: 16,
  /** Games threshold to be considered experienced */
  EXPERIENCED_THRESHOLD: 20,
  /** Maximum rating change per game */
  MAX_RATING_CHANGE: 50,
} as const;

/**
 * Service handling ELO-based rating calculations and player rankings.
 * Manages competitive rating system for PvP battles.
 */
@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    private dataSource: DataSource,
  ) {}

  /**
   * Calculate ELO rating changes for a match result.
   * Uses adaptive K-factors based on player experience and standard ELO formula.
   * 
   * @param winnerRating - Current rating of the winning player
   * @param loserRating - Current rating of the losing player
   * @param winnerGames - Total games played by winner (for K-factor calculation)
   * @param loserGames - Total games played by loser (for K-factor calculation)
   * @returns ELO changes for both players
   * @example
   * const changes = this.calculateEloChange(1200, 1100, 5, 25);
   * // Winner gains ~14 points, loser loses ~14 points
   */
  calculateEloChange(
    winnerRating: number,
    loserRating: number,
    winnerGames: number = 0,
    loserGames: number = 0,
  ): EloChange {
    // Calculate expected scores using ELO formula
    const expectedWinner = this.calculateExpectedScore(winnerRating, loserRating);
    const expectedLoser = this.calculateExpectedScore(loserRating, winnerRating);

    // Determine K-factors based on experience
    const winnerKFactor = this.getKFactor(winnerGames);
    const loserKFactor = this.getKFactor(loserGames);

    // Calculate rating changes
    // Winner gets actual score of 1, loser gets 0
    const winnerDelta = Math.round(winnerKFactor * (1 - expectedWinner));
    const loserDelta = Math.round(loserKFactor * (0 - expectedLoser));

    // Apply maximum change limits
    const clampedWinnerDelta = Math.min(winnerDelta, RATING_CONSTANTS.MAX_RATING_CHANGE);
    const clampedLoserDelta = Math.max(loserDelta, -RATING_CONSTANTS.MAX_RATING_CHANGE);

    this.logger.debug(`ELO calculation completed`, {
      winnerRating,
      loserRating,
      winnerGames,
      loserGames,
      expectedWinner: expectedWinner.toFixed(3),
      expectedLoser: expectedLoser.toFixed(3),
      winnerKFactor,
      loserKFactor,
      winnerDelta: clampedWinnerDelta,
      loserDelta: clampedLoserDelta,
    });

    return {
      winnerDelta: clampedWinnerDelta,
      loserDelta: clampedLoserDelta,
    };
  }

  /**
   * Update player ratings after a PvP match.
   * Atomically updates both players' ratings and logs the changes.
   * 
   * @param winnerId - ID of the winning player
   * @param loserId - ID of the losing player
   * @throws NotFoundException when either player is not found
   * @example
   * await ratingService.updateRatings('player-123', 'player-456');
   */
  async updateRatings(winnerId: string, loserId: string): Promise<void> {
    this.logger.log(`Updating ratings after match`, { winnerId, loserId });

    // Fetch both players with their current stats
    const [winner, loser] = await Promise.all([
      this.playerRepo.findOne({ where: { id: winnerId } }),
      this.playerRepo.findOne({ where: { id: loserId } }),
    ]);

    if (!winner) {
      this.logger.warn(`Rating update failed: Winner ${winnerId} not found`);
      throw new NotFoundException('Winner not found');
    }

    if (!loser) {
      this.logger.warn(`Rating update failed: Loser ${loserId} not found`);
      throw new NotFoundException('Loser not found');
    }

    // Calculate rating changes
    const totalWinnerGames = winner.wins + winner.losses;
    const totalLoserGames = loser.wins + loser.losses;
    
    const eloChange = this.calculateEloChange(
      winner.rating,
      loser.rating,
      totalWinnerGames,
      totalLoserGames,
    );

    // Apply rating changes atomically
    await this.dataSource.transaction(async manager => {
      // Update winner's rating
      await manager.update(Player, { id: winnerId }, {
        rating: winner.rating + eloChange.winnerDelta,
      });

      // Update loser's rating
      await manager.update(Player, { id: loserId }, {
        rating: Math.max(0, loser.rating + eloChange.loserDelta), // Prevent negative ratings
      });
    });

    this.logger.log(`Ratings updated successfully`, {
      winnerId,
      loserId,
      winnerOldRating: winner.rating,
      winnerNewRating: winner.rating + eloChange.winnerDelta,
      winnerDelta: eloChange.winnerDelta,
      loserOldRating: loser.rating,
      loserNewRating: Math.max(0, loser.rating + eloChange.loserDelta),
      loserDelta: eloChange.loserDelta,
    });
  }

  /**
   * Get the current leaderboard of top-rated players.
   * Returns players ordered by rating in descending order.
   * 
   * @param limit - Maximum number of players to return
   * @returns Array of top players with their ratings
   * @example
   * const topPlayers = await ratingService.getLeaderboard(10);
   * // Returns top 10 players by rating
   */
  async getLeaderboard(limit: number = 100): Promise<Player[]> {
    this.logger.debug(`Fetching leaderboard with limit ${limit}`);

    const players = await this.playerRepo.find({
      order: { rating: 'DESC' },
      take: Math.min(limit, 1000), // Cap at 1000 for performance
    });

    this.logger.debug(`Retrieved ${players.length} players for leaderboard`);
    return players;
  }

  /**
   * Get a player's current rank position in the rating system.
   * Calculates rank by counting players with higher ratings.
   * 
   * @param playerId - ID of the player to get rank for
   * @returns Player's rank information
   * @throws NotFoundException when player is not found
   * @example
   * const rank = await ratingService.getPlayerRank('player-123');
   * // { rank: 42, rating: 1250, totalPlayers: 1000 }
   */
  async getPlayerRank(playerId: string): Promise<PlayerRank> {
    this.logger.debug(`Getting rank for player ${playerId}`);

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    
    if (!player) {
      this.logger.warn(`Rank lookup failed: Player ${playerId} not found`);
      throw new NotFoundException('Player not found');
    }

    // Count players with higher ratings
    const playersAbove = await this.playerRepo
      .createQueryBuilder('player')
      .where('player.rating > :rating', { rating: player.rating })
      .getCount();

    // Count total players for context
    const totalPlayers = await this.playerRepo.count();

    const rank = playersAbove + 1; // Rank is 1-based

    this.logger.debug(`Player rank calculated`, {
      playerId,
      rating: player.rating,
      rank,
      playersAbove,
      totalPlayers,
    });

    return {
      rank,
      rating: player.rating,
      totalPlayers,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Calculate expected score for ELO rating system.
   * Uses standard ELO formula: 1 / (1 + 10^((opponent - player) / 400))
   * 
   * @param playerRating - Rating of the player
   * @param opponentRating - Rating of the opponent
   * @returns Expected score between 0 and 1
   * @example
   * const expected = this.calculateExpectedScore(1200, 1100);
   * // Returns ~0.64 (64% chance to win)
   */
  private calculateExpectedScore(playerRating: number, opponentRating: number): number {
    const ratingDifference = opponentRating - playerRating;
    return 1 / (1 + Math.pow(10, ratingDifference / 400));
  }

  /**
   * Determine K-factor based on player experience.
   * New players have higher volatility for faster rating adjustment.
   * 
   * @param gamesPlayed - Total number of games played by the player
   * @returns K-factor for rating calculation
   * @example
   * const kFactor = this.getKFactor(5);  // Returns 32 (new player)
   * const kFactor = this.getKFactor(25); // Returns 16 (experienced)
   */
  private getKFactor(gamesPlayed: number): number {
    return gamesPlayed < RATING_CONSTANTS.EXPERIENCED_THRESHOLD
      ? RATING_CONSTANTS.K_FACTOR_NEW
      : RATING_CONSTANTS.K_FACTOR_EXPERIENCED;
  }
}