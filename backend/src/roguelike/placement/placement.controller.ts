/**
 * Placement Controller for Roguelike Mode
 *
 * HTTP endpoints for unit placement operations.
 *
 * @module roguelike/placement/controller
 */

import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { PlacementService } from './placement.service';
import { PlaceUnitDto, RepositionUnitDto } from '../dto';
import { GuestGuard } from '../../auth/guest.guard';

/**
 * Authenticated request interface with player information.
 */
interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller for unit placement operations.
 *
 * Provides endpoints for:
 * - Placing units from hand to field
 * - Repositioning units on field
 * - Removing units from field
 */
@ApiTags('Roguelike Placement')
@ApiSecurity('guest-token')
@Controller('roguelike/runs/:runId/placement')
@UseGuards(GuestGuard)
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  /**
   * Places a unit from hand onto the deployment field.
   *
   * @param runId - Run ID from URL
   * @param req - Authenticated request with player info
   * @param dto - Placement details
   * @returns Updated run state
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Place unit from hand to field',
    description: 'Places a unit from hand onto the deployment field. Costs gold equal to unit cost.',
  })
  @ApiParam({
    name: 'runId',
    description: 'Run ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Unit placed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid placement (position occupied, not enough gold, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Run not found',
  })
  async placeUnit(
    @Param('runId') runId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: PlaceUnitDto,
  ) {
    const run = await this.placementService.placeUnit(
      runId,
      req.player.id,
      dto.instanceId,
      dto.position,
    );

    return {
      success: true,
      hand: run.hand,
      field: run.field,
      gold: run.gold,
    };
  }

  /**
   * Repositions a unit on the deployment field.
   *
   * @param runId - Run ID from URL
   * @param req - Authenticated request with player info
   * @param dto - Reposition details
   * @returns Updated run state
   */
  @Post('reposition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reposition unit on field',
    description: 'Moves a unit to a new position on the field. Free (no gold cost).',
  })
  @ApiParam({
    name: 'runId',
    description: 'Run ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Unit repositioned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid reposition (position occupied, unit not on field, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Run not found',
  })
  async repositionUnit(
    @Param('runId') runId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RepositionUnitDto,
  ) {
    const run = await this.placementService.repositionUnit(
      runId,
      req.player.id,
      dto.instanceId,
      dto.position,
    );

    return {
      success: true,
      field: run.field,
    };
  }

  /**
   * Removes a unit from the field back to hand.
   *
   * @param runId - Run ID from URL
   * @param instanceId - Unit instance ID from URL
   * @param req - Authenticated request with player info
   * @returns Updated run state
   */
  @Delete(':instanceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove unit from field',
    description: 'Removes a unit from the field back to hand. Refunds gold.',
  })
  @ApiParam({
    name: 'runId',
    description: 'Run ID',
    type: 'string',
  })
  @ApiParam({
    name: 'instanceId',
    description: 'Unit instance ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Unit removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Unit not on field',
  })
  @ApiResponse({
    status: 404,
    description: 'Run not found',
  })
  async removeFromField(
    @Param('runId') runId: string,
    @Param('instanceId') instanceId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const run = await this.placementService.removeFromField(
      runId,
      req.player.id,
      instanceId,
    );

    return {
      success: true,
      hand: run.hand,
      field: run.field,
      gold: run.gold,
    };
  }
}
