import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { GuestGuard } from '../auth/guest.guard';
import { UnitType } from '../unit/unit.data';
import { ErrorResponseDto } from '../common/dto/api-response.dto';

interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

interface UpdateTeamDto {
  team: UnitType[];
}

interface UpdatePlayerNameDto {
  name: string;
}

/**
 * Controller handling player-related HTTP endpoints.
 * All endpoints require guest authentication.
 */
@ApiTags('players')
@ApiSecurity('guest-token')
@Controller('player')
@UseGuards(GuestGuard)
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  /**
   * Get current player information.
   * Returns player profile with stats and current team.
   * 
   * @param req - Authenticated request containing player information
   * @returns Player entity with current team and stats
   * @example
   * GET /player/me
   * Response: { "id": "uuid", "guestToken": "token", "team": [...], "createdAt": "..." }
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current player',
    description: 'Returns authenticated player profile with stats and current team composition',
  })
  @ApiResponse({
    status: 200,
    description: 'Player information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Player unique identifier',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        guestToken: {
          type: 'string',
          description: 'Player authentication token',
          example: 'guest_abc123def456',
        },
        team: {
          type: 'array',
          description: 'Current team composition',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'knight' },
              name: { type: 'string', example: 'Рыцарь' },
              cost: { type: 'number', example: 5 },
            },
          },
        },
        rating: {
          type: 'number',
          description: 'Player ELO rating',
          example: 1200,
        },
        gamesPlayed: {
          type: 'number',
          description: 'Total games played',
          example: 0,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Account creation timestamp',
          example: '2025-12-11T14:30:00.000Z',
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
    description: 'Player not found',
    type: ErrorResponseDto,
  })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.playerService.getPlayer(req.player.id);
  }

  /**
   * Update player's team composition.
   * Updates the player's current team with new unit selection.
   * 
   * @param req - Authenticated request containing player information
   * @param body - Request body containing new team composition
   * @returns Updated player entity
   * @example
   * PUT /player/team
   * Body: { "team": [{ "id": "knight", "name": "Рыцарь", "cost": 5 }] }
   */
  @Put('team')
  @ApiOperation({
    summary: 'Update player team',
    description: 'Updates player team composition with new unit selection within budget constraints',
  })
  @ApiBody({
    description: 'New team composition',
    schema: {
      type: 'object',
      properties: {
        team: {
          type: 'array',
          description: 'Array of units for the team',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unit identifier',
                example: 'knight',
              },
              name: {
                type: 'string',
                description: 'Unit display name',
                example: 'Рыцарь',
              },
              cost: {
                type: 'number',
                description: 'Unit cost in points',
                example: 5,
              },
            },
            required: ['id', 'name', 'cost'],
          },
        },
      },
      required: ['team'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Team updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Player unique identifier',
        },
        team: {
          type: 'array',
          description: 'Updated team composition',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'knight' },
              name: { type: 'string', example: 'Рыцарь' },
              cost: { type: 'number', example: 5 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid team composition - budget exceeded or invalid units',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
    type: ErrorResponseDto,
  })
  async updateTeam(@Req() req: AuthenticatedRequest, @Body() body: UpdateTeamDto) {
    return this.playerService.updateTeam(req.player.id, body.team);
  }

  /**
   * Update player's display name.
   * Updates the player's display name with validation.
   * 
   * @param req - Authenticated request containing player information
   * @param body - Request body containing new player name
   * @returns Updated player entity
   * @example
   * PUT /player/name
   * Body: { "name": "New Player Name" }
   */
  @Put('name')
  @ApiOperation({
    summary: 'Update player name',
    description: 'Updates player display name with validation for length and content',
  })
  @ApiBody({
    description: 'New player name',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'New display name for the player',
          example: 'Epic Warrior',
          minLength: 1,
          maxLength: 20,
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Player name updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Player unique identifier',
        },
        name: {
          type: 'string',
          description: 'Updated player name',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid name - too long, too short, or contains invalid characters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
    type: ErrorResponseDto,
  })
  async updatePlayerName(@Req() req: AuthenticatedRequest, @Body() body: UpdatePlayerNameDto) {
    return this.playerService.updatePlayerName(req.player.id, body.name);
  }
}
