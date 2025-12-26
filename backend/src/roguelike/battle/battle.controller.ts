/**
 * Battle Controller for Roguelike Mode
 *
 * HTTP endpoints for roguelike battle operations.
 * All endpoints require guest authentication.
 *
 * @module roguelike/battle/controller
 */

import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { GuestGuard } from '../../auth/guest.guard';
import {
  FindOpponentResponseDto,
  SubmitBattleDto,
  BattleResultDto,
  OpponentSnapshotDto,
} from '../dto/battle.dto';
import { ErrorResponseDto } from '../../common/dto/api-response.dto';
import { RunService } from '../run/run.service';
import { MatchmakingService, BotOpponent } from '../matchmaking/matchmaking.service';
import { RoguelikeSnapshotEntity, PlacedUnit, SpellTimingConfig } from '../entities/snapshot.entity';

/**
 * Authenticated request interface with player information.
 */
interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller for roguelike battle operations.
 *
 * Provides endpoints for finding opponents and submitting battles.
 * All endpoints require guest authentication via x-guest-token header.
 *
 * @example
 * // Find an opponent
 * POST /api/runs/:id/battle/find
 *
 * @example
 * // Submit battle
 * POST /api/runs/:id/battle
 */
@ApiTags('roguelike')
@ApiSecurity('guest-token')
@Controller('roguelike/battle')
@UseGuards(GuestGuard)
export class BattleController {
  private readonly logger = new Logger(BattleController.name);

  constructor(
    private readonly runService: RunService,
    private readonly matchmakingService: MatchmakingService,
  ) {}

  /**
   * Finds an opponent for the current run.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Opponent data and difficulty
   */
  @Post(':runId/find')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find opponent for battle',
    description:
      'Finds an opponent for the roguelike battle. ' +
      'Returns a player snapshot or generates a bot if no suitable opponent found.',
  })
  @ApiParam({
    name: 'runId',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Opponent found successfully',
    type: FindOpponentResponseDto,
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
    description: 'Run not found or no opponent available',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Run is already completed',
    type: ErrorResponseDto,
  })
  async findOpponent(
    @Req() req: AuthenticatedRequest,
    @Param('runId') runId: string,
  ): Promise<FindOpponentResponseDto> {
    // Get the run and verify ownership
    const run = await this.runService.getRun(runId, req.player.id);

    // Find opponent using matchmaking service
    const result = await this.matchmakingService.findOpponent(run);

    // Map to response DTO
    return {
      opponent: this.mapToOpponentDto(result.opponent, result.isBot),
      difficulty: result.difficulty,
    };
  }

  /**
   * Submits a battle with team placement and spell timings.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @param submitBattleDto - Battle submission data
   * @returns Battle result
   */
  @Post(':runId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit battle',
    description:
      'Submits the battle with team placement and spell timings. ' +
      'Simulates the battle and returns the result.',
  })
  @ApiParam({
    name: 'runId',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: SubmitBattleDto,
    description: 'Battle submission data',
  })
  @ApiResponse({
    status: 200,
    description: 'Battle completed successfully',
    type: BattleResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid team placement or spell timings',
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
  async submitBattle(
    @Req() req: AuthenticatedRequest,
    @Param('runId') runId: string,
    @Body() submitBattleDto: SubmitBattleDto,
  ): Promise<BattleResultDto> {
    this.logger.log('Submit battle request received', {
      runId,
      playerId: req.player.id,
      teamSize: submitBattleDto.team?.length ?? 0,
      spellTimingsSize: submitBattleDto.spellTimings?.length ?? 0,
    });

    // Get the run and verify ownership
    const run = await this.runService.getRun(runId, req.player.id);

    // Build a map of instanceId -> card from hand for tier lookup
    const handMap = new Map(run.hand.map((card) => [card.instanceId, card]));

    // Convert DTO to entity format, resolving unitId and tier from hand
    const team: PlacedUnit[] = submitBattleDto.team.map((unit) => {
      const handCard = handMap.get(unit.instanceId);
      return {
        unitId: handCard?.unitId ?? unit.instanceId.split('-')[0] ?? unit.instanceId,
        tier: handCard?.tier ?? (1 as const),
        position: unit.position,
      };
    });

    // Convert spell timings, defaulting to 'mid' if empty
    const spellTimings: SpellTimingConfig[] =
      submitBattleDto.spellTimings.length > 0
        ? submitBattleDto.spellTimings.map((st) => ({
            spellId: st.spellId,
            timing: st.timing,
          }))
        : run.spells.map((spell) => ({
            spellId: spell.spellId,
            timing: spell.timing ?? 'mid',
          }));

    // Save snapshot for matchmaking pool (skip if team is empty)
    if (team.length > 0) {
      try {
        await this.matchmakingService.saveSnapshot(run, team, spellTimings);
      } catch (error) {
        // Log but don't fail the battle if snapshot save fails
        this.logger.warn('Failed to save snapshot', {
          runId,
          playerId: req.player.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // TODO: Implement actual battle simulation
    // For now, return a mock result
    const isWin = Math.random() > 0.4; // 60% win rate for testing
    const goldEarned = isWin ? 5 + run.consecutiveWins : 2;
    const battleId = `battle-${Date.now()}`;
    const ratingChange = isWin ? 15 : -10;

    // Create opponent info for battle history
    // TODO: Get actual opponent from findOpponent call
    const opponentInfo = {
      name: 'Bot',
      faction: run.faction === 'humans' ? 'undead' : 'humans',
      rating: 1000,
    };

    // Update run state with opponent info
    const updatedRun = isWin
      ? await this.runService.recordWin(runId, req.player.id, goldEarned, battleId, ratingChange, opponentInfo)
      : await this.runService.recordLoss(runId, req.player.id, 2, battleId, ratingChange, opponentInfo);

    return {
      battleId,
      result: isWin ? 'win' : 'lose',
      goldEarned: isWin ? goldEarned : 2,
      newGold: updatedRun.gold,
      wins: updatedRun.wins,
      losses: updatedRun.losses,
      ratingChange,
      newRating: updatedRun.rating,
      runComplete: updatedRun.status !== 'active',
      runStatus: updatedRun.status,
    };
  }

  /**
   * Maps opponent data to DTO.
   *
   * @param opponent - Opponent snapshot or bot
   * @param isBot - Whether opponent is a bot
   * @returns Opponent DTO
   * @private
   */
  private mapToOpponentDto(
    opponent: RoguelikeSnapshotEntity | BotOpponent,
    isBot: boolean,
  ): OpponentSnapshotDto {
    if (isBot) {
      const bot = opponent as BotOpponent;
      return {
        id: bot.id,
        playerId: bot.id,
        wins: 0,
        rating: 1000,
        faction: bot.faction,
        leaderId: bot.leaderId,
        isBot: true,
      };
    }

    const snapshot = opponent as RoguelikeSnapshotEntity;
    return {
      id: snapshot.id,
      playerId: snapshot.playerId,
      wins: snapshot.wins,
      rating: snapshot.rating,
      faction: snapshot.faction,
      leaderId: snapshot.leaderId,
      isBot: false,
    };
  }
}
