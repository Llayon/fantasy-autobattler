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
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { PlacementService } from './placement.service';
import { PlaceUnitDto, RepositionUnitDto } from '../dto/placement.dto';

/**
 * Controller for unit placement operations.
 *
 * Provides endpoints for:
 * - Placing units from hand to field
 * - Repositioning units on field
 * - Removing units from field
 */
@ApiTags('Roguelike Placement')
@Controller('roguelike/runs/:runId/placement')
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  /**
   * Places a unit from hand onto the deployment field.
   *
   * @param runId - Run ID from URL
   * @param guestToken - Player's guest token
   * @param dto - Placement details
   * @returns Updated run state
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Place unit from hand to field',
    description: 'Places a unit from hand onto the deployment field. Costs gold equal to unit cost.',
  })
  @ApiHeader({
    name: 'x-guest-token',
    description: 'Guest authentication token',
    required: true,
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
    @Headers('x-guest-token') guestToken: string,
    @Body() dto: PlaceUnitDto,
  ) {
    const run = await this.placementService.placeUnit(
      runId,
      guestToken,
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
   * @param guestToken - Player's guest token
   * @param dto - Reposition details
   * @returns Updated run state
   */
  @Post('reposition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reposition unit on field',
    description: 'Moves a unit to a new position on the field. Free (no gold cost).',
  })
  @ApiHeader({
    name: 'x-guest-token',
    description: 'Guest authentication token',
    required: true,
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
    @Headers('x-guest-token') guestToken: string,
    @Body() dto: RepositionUnitDto,
  ) {
    const run = await this.placementService.repositionUnit(
      runId,
      guestToken,
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
   * @param guestToken - Player's guest token
   * @returns Updated run state
   */
  @Delete(':instanceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove unit from field',
    description: 'Removes a unit from the field back to hand. Refunds gold.',
  })
  @ApiHeader({
    name: 'x-guest-token',
    description: 'Guest authentication token',
    required: true,
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
    @Headers('x-guest-token') guestToken: string,
  ) {
    const run = await this.placementService.removeFromField(
      runId,
      guestToken,
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
