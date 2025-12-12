/**
 * Matchmaking Controller for Fantasy Autobattler.
 * Handles HTTP requests for player queue management and matchmaking.
 */

import { Controller, Post, Get, Body, UseGuards, Req, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { MatchmakingService, QueueEntry } from './matchmaking.service';
import { GuestGuard } from '../auth/guest.guard';
import { ErrorResponseDto } from '../common/dto/api-response.dto';
import { JoinQueueDto } from './dto/matchmaking.dto';

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
@ApiTags('matchmaking')
@ApiSecurity('guest-token')
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Join matchmaking queue',
    description: 'Adds player to matchmaking queue with selected team for ELO-based opponent matching',
  })
  @ApiBody({
    type: JoinQueueDto,
    description: 'Team selection for matchmaking',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully joined matchmaking queue',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Queue entry identifier',
        },
        playerId: {
          type: 'string',
          format: 'uuid',
          description: 'Player identifier',
        },
        teamId: {
          type: 'string',
          format: 'uuid',
          description: 'Team identifier',
        },
        rating: {
          type: 'number',
          description: 'Player ELO rating',
          example: 1200,
        },
        joinedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Queue join timestamp',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid team or player already in queue',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player or team not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Player already in matchmaking queue',
    type: ErrorResponseDto,
  })
  async joinQueue(
    @Req() req: AuthenticatedRequest,
    @Body() body: JoinQueueDto,
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
  @ApiOperation({
    summary: 'Leave matchmaking queue',
    description: 'Removes player from matchmaking queue if currently waiting for match',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully left matchmaking queue',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Operation success status',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found in queue',
    type: ErrorResponseDto,
  })
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
   * Also checks for recent battles to detect matches.
   * 
   * @param req - Authenticated request with player information
   * @returns Current matchmaking status with details
   * @example
   * GET /matchmaking/status
   * Response: { "status": "queued", "queueEntry": {...} }
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get matchmaking status',
    description: 'Returns current matchmaking status: queued, matched, or not in queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Matchmaking status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['queued', 'matched', 'not_in_queue'],
          description: 'Current matchmaking status',
          example: 'queued',
        },
        queueEntry: {
          type: 'object',
          description: 'Queue entry details (if status is queued)',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Queue entry identifier',
            },
            teamId: {
              type: 'string',
              format: 'uuid',
              description: 'Team identifier',
            },
            rating: {
              type: 'number',
              description: 'Player ELO rating',
              example: 1200,
            },
            waitTime: {
              type: 'number',
              description: 'Time spent waiting in seconds',
              example: 45,
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Queue join timestamp',
            },
          },
        },
        match: {
          type: 'object',
          description: 'Match details (if status is matched)',
          properties: {
            battleId: {
              type: 'string',
              format: 'uuid',
              description: 'Battle identifier',
            },
            opponentId: {
              type: 'string',
              format: 'uuid',
              description: 'Opponent player identifier',
            },
            ratingDifference: {
              type: 'number',
              description: 'ELO rating difference with opponent',
              example: 50,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getStatus(@Req() req: AuthenticatedRequest): Promise<MatchmakingStatusResponse> {
    const playerId = req.player.id;
    
    this.logger.debug(`Getting matchmaking status for player`, {
      playerId,
      correlationId: req.correlationId,
    });

    try {
      // First check if player has an active queue entry
      const queueEntry = await this.matchmakingService.getPlayerQueueEntry(playerId);
      
      if (queueEntry) {
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
      }

      // If no queue entry, check for recent battles (last 5 minutes)
      // This handles the case where a player was matched but removed from queue
      const recentMatch = await this.matchmakingService.getRecentMatchForPlayer(playerId);
      
      if (recentMatch) {
        this.logger.log(`Found recent match for player`, {
          playerId,
          battleId: recentMatch.battleId,
          opponentId: recentMatch.opponentId,
          correlationId: req.correlationId,
        });

        return {
          status: 'matched',
          match: {
            battleId: recentMatch.battleId,
            opponentId: recentMatch.opponentId,
            ratingDifference: 0, // Would need additional data
          },
        };
      }

      this.logger.debug(`No queue entry or recent match found for player`, {
        playerId,
        correlationId: req.correlationId,
      });

      // Player is not in queue and has no recent matches
      return { status: 'not_in_queue' };
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
  @ApiOperation({
    summary: 'Find match',
    description: 'Searches for suitable opponent based on ELO rating and creates battle if match found',
  })
  @ApiResponse({
    status: 200,
    description: 'Match search completed (may or may not have found opponent)',
    schema: {
      type: 'object',
      properties: {
        found: {
          type: 'boolean',
          description: 'Whether a match was found',
          example: true,
        },
        match: {
          type: 'object',
          description: 'Match details (if found is true)',
          properties: {
            battleId: {
              type: 'string',
              format: 'uuid',
              description: 'Created battle identifier',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            opponentId: {
              type: 'string',
              format: 'uuid',
              description: 'Opponent player identifier',
              example: '987fcdeb-51a2-43d1-9f6e-123456789abc',
            },
            ratingDifference: {
              type: 'number',
              description: 'ELO rating difference with opponent',
              example: 50,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found in queue',
    type: ErrorResponseDto,
  })
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