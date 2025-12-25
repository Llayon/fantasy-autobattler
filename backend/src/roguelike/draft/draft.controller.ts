/**
 * Draft Controller for Roguelike Mode
 *
 * HTTP endpoints for draft operations.
 * All endpoints require guest authentication.
 *
 * @module roguelike/draft/controller
 */

import {
  Controller,
  Get,
  Post,
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
import { DraftService, DraftOptions, DraftResult } from './draft.service';
import { GuestGuard } from '../../auth/guest.guard';
import { DraftOptionsDto, SubmitDraftDto, DraftResultDto } from '../dto/draft.dto';
import { RunIdParamDto } from '../dto/run.dto';
import { ErrorResponseDto } from '../../common/dto/api-response.dto';

/**
 * Authenticated request interface with player information.
 */
interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller for roguelike draft operations.
 *
 * Provides endpoints for getting draft options and submitting picks.
 * All endpoints require guest authentication via x-guest-token header.
 *
 * @example
 * // Get initial draft options
 * GET /api/runs/:id/draft/initial
 *
 * @example
 * // Submit draft picks
 * POST /api/runs/:id/draft
 * { "picks": ["footman-1", "archer-1", "priest-1"] }
 */
@ApiTags('roguelike')
@ApiSecurity('guest-token')
@Controller('runs/:id/draft')
@UseGuards(GuestGuard)
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  /**
   * Gets initial draft options (5 cards, pick 3).
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Draft options
   */
  @Get('initial')
  @ApiOperation({
    summary: 'Get initial draft options',
    description:
      'Returns 5 cards from the deck for the initial draft. ' +
      'Player must pick 3 cards. Only available at the start of a run.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft options retrieved successfully',
    type: DraftOptionsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Draft not available (already completed or no cards)',
    type: ErrorResponseDto,
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
  async getInitialDraft(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
  ): Promise<DraftOptionsDto> {
    const options = await this.draftService.getInitialDraft(params.id, req.player.id);
    return this.mapToOptionsDto(options);
  }

  /**
   * Gets post-battle draft options (3 cards, pick 1).
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Draft options
   */
  @Get('post-battle')
  @ApiOperation({
    summary: 'Get post-battle draft options',
    description:
      'Returns 3 cards from the deck for post-battle draft. ' +
      'Player must pick 1 card. Available after each battle.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft options retrieved successfully',
    type: DraftOptionsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Draft not available (no cards remaining)',
    type: ErrorResponseDto,
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
  async getPostBattleDraft(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
  ): Promise<DraftOptionsDto> {
    const options = await this.draftService.getPostBattleDraft(params.id, req.player.id);
    return this.mapToOptionsDto(options);
  }

  /**
   * Submits draft picks.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @param submitDraftDto - Draft picks
   * @returns Draft result with updated hand
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit draft picks',
    description:
      'Submits the selected cards for the draft. ' +
      'For initial draft, must pick exactly 3 cards. ' +
      'For post-battle draft, must pick exactly 1 card.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: SubmitDraftDto,
    description: 'Draft picks',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft picks submitted successfully',
    type: DraftResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid picks (wrong count, not in options, duplicates)',
    type: ErrorResponseDto,
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
  async submitDraft(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
    @Body() submitDraftDto: SubmitDraftDto,
  ): Promise<DraftResultDto> {
    const result = await this.draftService.submitPicks(
      params.id,
      req.player.id,
      submitDraftDto.picks,
    );
    return this.mapToResultDto(result);
  }

  /**
   * Checks if draft is available.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Draft availability status
   */
  @Get('status')
  @ApiOperation({
    summary: 'Check draft availability',
    description: 'Returns whether draft is available and what type (initial or post-battle).',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft status retrieved',
  })
  async getDraftStatus(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
  ): Promise<{ available: boolean; isInitial: boolean; reason?: string }> {
    return this.draftService.isDraftAvailable(params.id, req.player.id);
  }

  /**
   * Maps draft options to DTO.
   *
   * @param options - Draft options from service
   * @returns Draft options DTO
   * @private
   */
  private mapToOptionsDto(options: DraftOptions): DraftOptionsDto {
    return {
      cards: options.cards.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      isInitial: options.isInitial,
      requiredPicks: options.requiredPicks,
      remainingInDeck: options.remainingInDeck,
    };
  }

  /**
   * Maps draft result to DTO.
   *
   * @param result - Draft result from service
   * @returns Draft result DTO
   * @private
   */
  private mapToResultDto(result: DraftResult): DraftResultDto {
    return {
      hand: result.hand.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      remainingDeck: result.remainingDeck.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      handSize: result.handSize,
      deckRemaining: result.deckRemaining,
    };
  }
}
