/**
 * Matchmaking Controller for Fantasy Autobattler.
 * Handles HTTP requests for player queue management and matchmaking.
 */

import { Controller, Post, Get, Body, UseGuards, Req, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { MatchmakingService, QueueEntry } from './matchmaking.service';
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
 * Matchmaking status enumeration.
 */
export type MatchmakingStatusType = 'queued' | 'matched' | 'not_in_queue';

/**
 * Interface for matchmaking status response.
 */
export interface MatchmakingStatusResponse {
  /** Current matchmaking status */
  status: MatchmakingStatusType;
  /** Queue entry details if in queue */
  queueEntry?: {
    id: string;
    teamId: string;
    rating: number;
    waitTime: number;
    joinedAt: Date;
  };
  /** Match details if matched */
  match?: {
    battleId: string;
    opponentId: string;
    ratingDifference: number;
  };
}

/**
 * Interface for find match response.
 */
export interface FindMatchResponse {
  /** Match found status */
  found: boolean;
  /** Match details if found */
  match?: {
    battleId: string;
    opponentId: string;
    ratingDifference: number;
  };
}

/**
 * Controller handling matchmaking queue operations.
 * Provides REST API endpoints for joining/leaving queue and finding matches.
 * 
 * @example
 * POST /matchmaking/join - Join matchmaking queue
 * POST /matchmaking/leave - Leave matchmaking queue
 * GET /matchmaking/status - Get current matchmaking status
 * POST /matchmaking/find - Find a match (polling endpoint)
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
   * POST /matchmaking/join
   * Body: { "teamId": "team-123" }
   * Response: { "id": "queue-456", "playerId": "player-123", ... }
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
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
   * @returns Success confirmation
   * @throws NotFoundException if player not in queue
   * @example
   * POST /matchmaking/leave
   * Response: { "success": true }
   */
  @Post('leave')
  @HttpCode(HttpStatus.OK)
  async leaveQueue(@Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
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

      return { success: true };
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
   * Get current matchmaking status for the player.
   * Returns whether player is queued, matched, or not in queue.
   * 
   * @param req - Authenticated request with player information
   * @returns Current matchmaking status with details
   * @example
   * GET /matchmaking/status
   * Response: { "status": "queued", "queueEntry": {...} }
   */
  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest): Promise<MatchmakingStatusResponse> {
    const playerId = req.player.id;
    
    this.logger.debug(`Getting matchmaking status for player`, {
      playerId,
      correlationId: req.correlationId,
    });

    try {
      // Check if player has an active queue entry
      const queueEntry = await this.matchmakingService.getPlayerQueueEntry(playerId);
      
      if (!queueEntry) {
        return { status: 'not_in_queue' };
      }

      // Check if player has been matched
      if (queueEntry.status === 'matched' && queueEntry.matchId) {
        return {
          status: 'matched',
          match: {
            battleId: queueEntry.matchId,
            opponentId: 'unknown', // Would need additional query to get opponent
            ratingDifference: 0, // Would need additional data
          },
        };
      }

      // Player is waiting in queue
      return {
        status: 'queued',
        queueEntry: {
          id: queueEntry.id,
          teamId: queueEntry.teamId,
          rating: queueEntry.rating,
          waitTime: queueEntry.waitTime,
          joinedAt: queueEntry.joinedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get matchmaking status`, {
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      
      // If there's an error, assume not in queue
      return { status: 'not_in_queue' };
    }
  }

  /**
   * Find a match for the current player (polling endpoint).
   * Searches for suitable opponents based on ELO rating and wait time.
   * 
   * @param req - Authenticated request with player information
   * @returns Match information if opponent found
   * @throws NotFoundException if player not in queue
   * @example
   * POST /matchmaking/find
   * Response: { "found": true, "match": { "battleId": "battle-789", ... } }
   */
  @Post('find')
  @HttpCode(HttpStatus.OK)
  async findMatch(@Req() req: AuthenticatedRequest): Promise<FindMatchResponse> {
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

        return {
          found: true,
          match: {
            battleId: match.battleId,
            opponentId: match.player2.playerId,
            ratingDifference: match.ratingDifference,
          },
        };
      } else {
        this.logger.debug(`No match found for player`, {
          playerId,
          correlationId: req.correlationId,
        });

        return { found: false };
      }
    } catch (error) {
      this.logger.error(`Failed to find match`, {
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      throw error;
    }
  }

}