/**
 * Matchmaking Controller for Fantasy Autobattler.
 * Handles HTTP requests for player queue management and matchmaking.
 */

import { Controller, Post, Delete, Get, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { MatchmakingService, QueueEntry, Match } from './matchmaking.service';
import { GuestGuard } from '../auth/guest.guard';

/**
 * Interface for authenticated requests with player information.
 */
interface AuthenticatedRequest {
  /** Player information from authentication */
  player: {
    /** Player ID */
    id: string;
  };
  /** Correlation ID for request tracing */
  correlationId?: string;
}

/**
 * Interface for join queue request body.
 */
export interface JoinQueueRequest {
  /** ID of the team to use for matchmaking */
  teamId: string;
}

/**
 * Interface for queue statistics response.
 */
export interface QueueStatsResponse {
  /** Number of players currently waiting */
  waitingPlayers: number;
  /** Average wait time in milliseconds */
  averageWaitTime: number;
  /** Rating distribution statistics */
  ratingDistribution: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Controller handling matchmaking queue operations.
 * Provides REST API endpoints for joining/leaving queue and finding matches.
 * 
 * @example
 * POST /matchmaking/queue - Join matchmaking queue
 * DELETE /matchmaking/queue - Leave matchmaking queue
 * GET /matchmaking/find - Find a match for current player
 * GET /matchmaking/stats - Get queue statistics
 */
@Controller('matchmaking')
@UseGuards(GuestGuard)
export class MatchmakingController {
  private readonly logger = new Logger(MatchmakingController.name);

  constructor(private readonly matchmakingService: MatchmakingService) {}

  /**
   * Join the matchmaking queue with a selected team.
   * Player must have an active team to join the queue.
   * 
   * @param req - Authenticated request with player information
   * @param body - Request body containing team ID
   * @returns Queue entry information
   * @throws NotFoundException if player or team not found
   * @throws ConflictException if player already in queue
   * @example
   * POST /matchmaking/queue
   * Body: { "teamId": "team-123" }
   * Response: { "id": "queue-456", "playerId": "player-123", ... }
   */
  @Post('queue')
  async joinQueue(
    @Req() req: AuthenticatedRequest,
    @Body() body: JoinQueueRequest,
  ): Promise<QueueEntry> {
    const playerId = req.player.id;
    
    this.logger.log(`Player joining matchmaking queue`, {
      playerId,
      teamId: body.teamId,
      correlationId: req.correlationId,
    });

    try {
      const queueEntry = await this.matchmakingService.joinQueue(playerId, body.teamId);
      
      this.logger.log(`Player joined queue successfully`, {
        playerId,
        queueEntryId: queueEntry.id,
        correlationId: req.correlationId,
      });

      return queueEntry;
    } catch (error) {
      this.logger.error(`Failed to join queue`, {
        playerId,
        teamId: body.teamId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      throw error;
    }
  }

  /**
   * Leave the matchmaking queue.
   * Removes the player from queue if they are currently waiting.
   * 
   * @param req - Authenticated request with player information
   * @throws NotFoundException if player not in queue
   * @example
   * DELETE /matchmaking/queue
   * Response: 204 No Content
   */
  @Delete('queue')
  async leaveQueue(@Req() req: AuthenticatedRequest): Promise<void> {
    const playerId = req.player.id;
    
    this.logger.log(`Player leaving matchmaking queue`, {
      playerId,
      correlationId: req.correlationId,
    });

    try {
      await this.matchmakingService.leaveQueue(playerId);
      
      this.logger.log(`Player left queue successfully`, {
        playerId,
        correlationId: req.correlationId,
      });
    } catch (error) {
      this.logger.error(`Failed to leave queue`, {
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      throw error;
    }
  }

  /**
   * Find a match for the current player.
   * Searches for suitable opponents based on ELO rating and wait time.
   * 
   * @param req - Authenticated request with player information
   * @returns Match information if opponent found, null otherwise
   * @throws NotFoundException if player not in queue
   * @example
   * GET /matchmaking/find
   * Response: { "player1": {...}, "player2": {...}, "battleId": "battle-789" }
   */
  @Get('find')
  async findMatch(@Req() req: AuthenticatedRequest): Promise<Match | null> {
    const playerId = req.player.id;
    
    this.logger.debug(`Finding match for player`, {
      playerId,
      correlationId: req.correlationId,
    });

    try {
      const match = await this.matchmakingService.findMatch(playerId);
      
      if (match) {
        this.logger.log(`Match found for player`, {
          playerId,
          opponentId: match.player2.playerId,
          battleId: match.battleId,
          ratingDifference: match.ratingDifference,
          correlationId: req.correlationId,
        });
      } else {
        this.logger.debug(`No match found for player`, {
          playerId,
          correlationId: req.correlationId,
        });
      }

      return match;
    } catch (error) {
      this.logger.error(`Failed to find match`, {
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      throw error;
    }
  }

  /**
   * Get current matchmaking queue statistics.
   * Provides information about queue size, wait times, and rating distribution.
   * 
   * @param req - Authenticated request with player information
   * @returns Queue statistics
   * @example
   * GET /matchmaking/stats
   * Response: { "waitingPlayers": 5, "averageWaitTime": 30000, ... }
   */
  @Get('stats')
  async getQueueStats(@Req() req: AuthenticatedRequest): Promise<QueueStatsResponse> {
    this.logger.debug(`Retrieving queue statistics`, {
      correlationId: req.correlationId,
    });

    try {
      const stats = await this.matchmakingService.getQueueStats();
      
      this.logger.debug(`Queue statistics retrieved`, {
        waitingPlayers: stats.waitingPlayers,
        averageWaitTime: stats.averageWaitTime,
        correlationId: req.correlationId,
      });

      return stats;
    } catch (error) {
      this.logger.error(`Failed to retrieve queue statistics`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      throw error;
    }
  }

  /**
   * Clean up expired queue entries (admin endpoint).
   * Removes entries that have been waiting longer than the timeout.
   * 
   * @param req - Authenticated request with player information
   * @returns Number of entries cleaned up
   * @example
   * POST /matchmaking/cleanup
   * Response: { "cleanedEntries": 3 }
   */
  @Post('cleanup')
  async cleanupExpiredEntries(@Req() req: AuthenticatedRequest): Promise<{ cleanedEntries: number }> {
    this.logger.log(`Cleaning up expired queue entries`, {
      correlationId: req.correlationId,
    });

    try {
      const cleanedEntries = await this.matchmakingService.cleanupExpiredEntries();
      
      this.logger.log(`Queue cleanup completed`, {
        cleanedEntries,
        correlationId: req.correlationId,
      });

      return { cleanedEntries };
    } catch (error) {
      this.logger.error(`Failed to cleanup expired entries`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      throw error;
    }
  }
}