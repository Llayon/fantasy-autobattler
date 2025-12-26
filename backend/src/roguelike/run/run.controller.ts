/**
 * Run Controller for Roguelike Mode
 *
 * HTTP endpoints for managing roguelike runs.
 * All endpoints require guest authentication.
 *
 * @module roguelike/run/controller
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { RunService } from './run.service';
import { GuestGuard } from '../../auth/guest.guard';
import {
  CreateRunDto,
  RunResponseDto,
  RunSummaryDto,
  RunIdParamDto,
  SpellCardDto,
} from '../dto/run.dto';
import { ErrorResponseDto } from '../../common/dto/api-response.dto';
import { RoguelikeRunEntity } from '../entities/run.entity';

/**
 * Authenticated request interface with player information.
 */
interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller for roguelike run management.
 *
 * Provides endpoints for creating, retrieving, and abandoning runs.
 * All endpoints require guest authentication via x-guest-token header.
 *
 * @example
 * // Create a new run
 * POST /api/runs
 * { "faction": "humans", "leaderId": "commander_aldric" }
 *
 * @example
 * // Get active run
 * GET /api/runs/active
 */
@ApiTags('roguelike')
@ApiSecurity('guest-token')
@Controller('runs')
@UseGuards(GuestGuard)
export class RunController {
  constructor(private readonly runService: RunService) {}

  /**
   * Creates a new roguelike run.
   *
   * @param req - Authenticated request with player info
   * @param createRunDto - Run creation parameters
   * @returns Created run response
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new roguelike run',
    description:
      'Creates a new roguelike run with selected faction and leader. ' +
      'Player must not have an existing active run.',
  })
  @ApiBody({
    type: CreateRunDto,
    description: 'Run creation parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'Run created successfully',
    type: RunResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid faction or leader',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Player already has an active run',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Leader does not belong to selected faction',
    type: ErrorResponseDto,
  })
  async createRun(
    @Req() req: AuthenticatedRequest,
    @Body() createRunDto: CreateRunDto,
  ): Promise<RunResponseDto> {
    const run = await this.runService.createRun(
      req.player.id,
      createRunDto.faction,
      createRunDto.leaderId,
    );
    return this.mapToRunResponse(run);
  }

  /**
   * Gets the active run for the authenticated player.
   *
   * @param req - Authenticated request with player info
   * @returns Active run or null
   */
  @Get('active')
  @ApiOperation({
    summary: 'Get active run',
    description: 'Returns the currently active roguelike run for the player, or null if none exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active run retrieved (or null if none)',
    type: RunResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getActiveRun(
    @Req() req: AuthenticatedRequest,
  ): Promise<RunResponseDto | null> {
    const run = await this.runService.getActiveRun(req.player.id);
    return run ? this.mapToRunResponse(run) : null;
  }

  /**
   * Gets a run by ID.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Run response
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get run by ID',
    description: 'Returns the roguelike run with the specified ID. Player must own the run.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Run retrieved successfully',
    type: RunResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - run belongs to another player',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Run not found',
    type: ErrorResponseDto,
  })
  async getRun(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
  ): Promise<RunResponseDto> {
    const run = await this.runService.getRun(params.id, req.player.id);
    return this.mapToRunResponse(run);
  }

  /**
   * Abandons an active run.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Abandoned run response
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Abandon run',
    description:
      'Abandons the specified roguelike run. ' +
      'The run will be marked as lost. Cannot abandon already completed runs.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Run abandoned successfully',
    type: RunResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - run belongs to another player',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Run not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Run is already completed',
    type: ErrorResponseDto,
  })
  async abandonRun(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
  ): Promise<RunResponseDto> {
    const run = await this.runService.abandonRun(params.id, req.player.id);
    return this.mapToRunResponse(run);
  }

  /**
   * Gets run history for the authenticated player.
   *
   * @param req - Authenticated request with player info
   * @returns Array of run summaries
   */
  @Get()
  @ApiOperation({
    summary: 'Get run history',
    description: 'Returns the run history for the player, ordered by creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'Run history retrieved successfully',
    type: [RunSummaryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getRunHistory(@Req() req: AuthenticatedRequest): Promise<RunSummaryDto[]> {
    const runs = await this.runService.getRunHistory(req.player.id);
    return runs.map((run) => this.mapToRunSummary(run));
  }

  /**
   * Maps a run entity to a response DTO.
   *
   * @param run - Run entity to map
   * @returns Run response DTO
   */
  private mapToRunResponse(run: RoguelikeRunEntity): RunResponseDto {
    return {
      id: run.id,
      playerId: run.playerId,
      faction: run.faction,
      leaderId: run.leaderId,
      deck: run.deck.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      remainingDeck: run.remainingDeck.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      hand: run.hand.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      field: run.field.map((unit) => ({
        instanceId: unit.instanceId,
        unitId: unit.unitId,
        tier: unit.tier,
        position: unit.position,
        hasBattled: unit.hasBattled ?? false,
      })),
      spells: run.spells.map((spell) => {
        const dto: SpellCardDto = { spellId: spell.spellId };
        if (spell.timing) {
          dto.timing = spell.timing;
        }
        return dto;
      }),
      wins: run.wins,
      losses: run.losses,
      consecutiveWins: run.consecutiveWins,
      gold: run.gold,
      battleHistory: run.battleHistory,
      status: run.status,
      rating: run.rating,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
    };
  }

  /**
   * Maps a run entity to a summary DTO.
   *
   * @param run - Run entity to map
   * @returns Run summary DTO
   */
  private mapToRunSummary(run: RoguelikeRunEntity): RunSummaryDto {
    return {
      id: run.id,
      faction: run.faction,
      wins: run.wins,
      losses: run.losses,
      gold: run.gold,
      status: run.status,
      handSize: run.hand.length,
      deckRemaining: run.remainingDeck.length,
    };
  }
}
