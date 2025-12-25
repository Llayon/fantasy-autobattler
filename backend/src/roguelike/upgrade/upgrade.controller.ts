/**
 * Upgrade Controller for Roguelike Mode
 *
 * HTTP endpoints for upgrade shop operations.
 * All endpoints require guest authentication.
 *
 * @module roguelike/upgrade/controller
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
import { UpgradeService, ShopState, UpgradeResult, UpgradeCostInfo } from './upgrade.service';
import { GuestGuard } from '../../auth/guest.guard';
import {
  ShopStateDto,
  UpgradeUnitDto,
  UpgradeResultDto,
  UpgradeCostDto,
} from '../dto/upgrade.dto';
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
 * Controller for roguelike upgrade shop operations.
 *
 * Provides endpoints for viewing shop state and upgrading units.
 * All endpoints require guest authentication via x-guest-token header.
 *
 * @example
 * // Get shop state
 * GET /api/runs/:id/shop
 *
 * @example
 * // Upgrade a unit
 * POST /api/runs/:id/shop/upgrade
 * { "cardInstanceId": "footman-1" }
 */
@ApiTags('roguelike')
@ApiSecurity('guest-token')
@Controller('runs/:id/shop')
@UseGuards(GuestGuard)
export class UpgradeController {
  constructor(private readonly upgradeService: UpgradeService) {}

  /**
   * Gets the current shop state with upgrade options.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @returns Shop state with hand and upgrade costs
   */
  @Get()
  @ApiOperation({
    summary: 'Get shop state',
    description:
      'Returns the current hand with upgrade costs for each card. ' +
      'Only cards below max tier (T3) can be upgraded.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Shop state retrieved successfully',
    type: ShopStateDto,
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
  async getShopState(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
  ): Promise<ShopStateDto> {
    const state = await this.upgradeService.getShopState(params.id, req.player.id);
    return this.mapToShopStateDto(state);
  }

  /**
   * Upgrades a unit to the next tier.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @param upgradeUnitDto - Upgrade request
   * @returns Upgrade result with updated card and gold
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upgrade a unit',
    description:
      'Upgrades the specified unit to the next tier. ' +
      'Deducts gold based on the unit\'s base cost. ' +
      'T1→T2: 100% of base cost, T2→T3: 150% of base cost.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpgradeUnitDto,
    description: 'Upgrade request',
  })
  @ApiResponse({
    status: 200,
    description: 'Unit upgraded successfully',
    type: UpgradeResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid upgrade (card not found, at max tier, or insufficient gold)',
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
  async upgradeUnit(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
    @Body() upgradeUnitDto: UpgradeUnitDto,
  ): Promise<UpgradeResultDto> {
    const result = await this.upgradeService.upgradeUnit(
      params.id,
      req.player.id,
      upgradeUnitDto.cardInstanceId,
    );
    return this.mapToUpgradeResultDto(result);
  }

  /**
   * Gets upgrade options for a specific card.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @param cardInstanceId - Card instance ID
   * @returns Upgrade cost info or null
   */
  @Get('upgrade/:cardInstanceId')
  @ApiOperation({
    summary: 'Get upgrade options for a card',
    description: 'Returns upgrade cost information for a specific card.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'cardInstanceId',
    description: 'Card instance identifier',
    example: 'footman-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Upgrade options retrieved (or null if not upgradeable)',
    type: UpgradeCostDto,
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
  async getUpgradeOptions(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
    @Param('cardInstanceId') cardInstanceId: string,
  ): Promise<UpgradeCostDto | null> {
    const options = await this.upgradeService.getUpgradeOptions(
      params.id,
      req.player.id,
      cardInstanceId,
    );
    return options ? this.mapToUpgradeCostDto(options) : null;
  }

  /**
   * Checks if a card can be upgraded.
   *
   * @param req - Authenticated request with player info
   * @param params - Path parameters with run ID
   * @param cardInstanceId - Card instance ID
   * @returns Upgrade availability status
   */
  @Get('can-upgrade/:cardInstanceId')
  @ApiOperation({
    summary: 'Check if card can be upgraded',
    description: 'Returns whether the card can be upgraded and why not if applicable.',
  })
  @ApiParam({
    name: 'id',
    description: 'Run identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'cardInstanceId',
    description: 'Card instance identifier',
    example: 'footman-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Upgrade check completed',
  })
  async canUpgrade(
    @Req() req: AuthenticatedRequest,
    @Param() params: RunIdParamDto,
    @Param('cardInstanceId') cardInstanceId: string,
  ): Promise<{ canUpgrade: boolean; reason?: string }> {
    return this.upgradeService.canUpgrade(params.id, req.player.id, cardInstanceId);
  }

  /**
   * Maps shop state to DTO.
   *
   * @param state - Shop state from service
   * @returns Shop state DTO
   * @private
   */
  private mapToShopStateDto(state: ShopState): ShopStateDto {
    return {
      hand: state.hand.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      gold: state.gold,
      upgradeCosts: state.upgradeCosts.map((cost) => this.mapToUpgradeCostDto(cost)),
    };
  }

  /**
   * Maps upgrade cost info to DTO.
   *
   * @param cost - Upgrade cost info from service
   * @returns Upgrade cost DTO
   * @private
   */
  private mapToUpgradeCostDto(cost: UpgradeCostInfo): UpgradeCostDto {
    return {
      instanceId: cost.instanceId,
      currentTier: cost.currentTier,
      targetTier: cost.targetTier,
      cost: cost.cost,
      canAfford: cost.canAfford,
    };
  }

  /**
   * Maps upgrade result to DTO.
   *
   * @param result - Upgrade result from service
   * @returns Upgrade result DTO
   * @private
   */
  private mapToUpgradeResultDto(result: UpgradeResult): UpgradeResultDto {
    return {
      upgradedCard: {
        unitId: result.upgradedCard.unitId,
        tier: result.upgradedCard.tier,
        instanceId: result.upgradedCard.instanceId,
      },
      hand: result.hand.map((card) => ({
        unitId: card.unitId,
        tier: card.tier,
        instanceId: card.instanceId,
      })),
      gold: result.gold,
      goldSpent: result.goldSpent,
    };
  }
}
