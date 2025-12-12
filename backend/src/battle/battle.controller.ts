import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { GuestGuard } from '../auth/guest.guard';
import { BattleResultDto, BattleLogDto, BattleListResponseDto, StartBattleDto } from './dto/battle.dto';
import { ErrorResponseDto } from '../common/dto/api-response.dto';

interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller handling battle-related HTTP endpoints.
 * All endpoints require guest authentication.
 */
@ApiTags('battles')
@ApiSecurity('guest-token')
@Controller('battle')
@UseGuards(GuestGuard)
export class BattleController {
  constructor(private battleService: BattleService) {}

  /**
   * Start a new battle against a bot opponent.
   * @param req - Authenticated request containing player information
   * @param battleData - Battle configuration (difficulty, team selection)
   * @returns Battle result with events and winner
   */
  @Post('start')
  @ApiOperation({
    summary: 'Start new battle',
    description: 'Starts a new battle against a bot opponent with optional difficulty and team selection',
  })
  @ApiBody({
    type: StartBattleDto,
    description: 'Battle configuration (optional)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Battle started successfully',
    type: BattleResultDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no active team or invalid team/difficulty',
    type: ErrorResponseDto,
  })
  async startBattle(
    @Req() req: AuthenticatedRequest,
    @Body() battleData: StartBattleDto = {},
  ) {
    return this.battleService.startBattle(req.player.id, battleData.difficulty, battleData.teamId);
  }

  /**
   * Get battle details by ID.
   * @param id - Battle ID
   * @returns Battle log with events and metadata
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get battle by ID',
    description: 'Returns complete battle log with events for replay functionality',
  })
  @ApiParam({
    name: 'id',
    description: 'Battle identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Battle retrieved successfully',
    type: BattleLogDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Battle not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getBattle(@Param('id') id: string) {
    return this.battleService.getBattle(id);
  }

  /**
   * Get all battles for the authenticated player.
   * @param req - Authenticated request containing player information
   * @returns Object with battles array and total count
   */
  @Get()
  @ApiOperation({
    summary: 'Get player battles',
    description: 'Returns all battles for the authenticated player with pagination support',
  })
  @ApiResponse({
    status: 200,
    description: 'Battles retrieved successfully',
    type: BattleListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getMyBattles(@Req() req: AuthenticatedRequest) {
    const battles = await this.battleService.getBattlesForPlayer(req.player.id);
    return {
      battles,
      total: battles.length,
    };
  }
}
