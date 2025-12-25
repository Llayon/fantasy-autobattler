/**
 * Upgrade DTOs for Roguelike Mode API
 *
 * Request/Response DTOs for upgrade shop endpoints.
 * Includes validation decorators and Swagger documentation.
 *
 * @module roguelike/dto/upgrade
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { DeckCardDto } from './run.dto';
import { UnitTier } from '../types/unit.types';

/**
 * DTO for upgrade cost information.
 */
export class UpgradeCostDto {
  @ApiProperty({
    description: 'Card instance ID',
    example: 'footman-1',
  })
  instanceId!: string;

  @ApiProperty({
    description: 'Current tier of the card',
    example: 1,
    enum: [1, 2, 3],
  })
  currentTier!: UnitTier;

  @ApiProperty({
    description: 'Target tier after upgrade',
    example: 2,
    enum: [2, 3],
  })
  targetTier!: UnitTier;

  @ApiProperty({
    description: 'Gold cost for upgrade',
    example: 3,
  })
  cost!: number;

  @ApiProperty({
    description: 'Whether player can afford this upgrade',
    example: true,
  })
  canAfford!: boolean;
}

/**
 * DTO for shop state response.
 * Returns current hand with upgrade options.
 *
 * @example
 * const response: ShopStateDto = {
 *   hand: [...],
 *   gold: 25,
 *   upgradeCosts: [...],
 * };
 */
export class ShopStateDto {
  @ApiProperty({
    description: 'Current hand of cards',
    type: [DeckCardDto],
  })
  hand!: DeckCardDto[];

  @ApiProperty({
    description: 'Current gold balance',
    example: 25,
  })
  gold!: number;

  @ApiProperty({
    description: 'Upgrade costs for each upgradeable card',
    type: [UpgradeCostDto],
  })
  upgradeCosts!: UpgradeCostDto[];
}

/**
 * DTO for upgrading a unit.
 *
 * @example
 * const dto: UpgradeUnitDto = {
 *   cardInstanceId: 'footman-1',
 * };
 */
export class UpgradeUnitDto {
  @ApiProperty({
    description: 'Instance ID of the card to upgrade',
    example: 'footman-1',
  })
  @IsString({ message: 'Card instance ID must be a string' })
  cardInstanceId!: string;
}

/**
 * DTO for upgrade result response.
 *
 * @example
 * const response: UpgradeResultDto = {
 *   upgradedCard: { unitId: 'footman', tier: 2, instanceId: 'footman-1' },
 *   hand: [...],
 *   gold: 22,
 *   goldSpent: 3,
 * };
 */
export class UpgradeResultDto {
  @ApiProperty({
    description: 'The upgraded card',
    type: DeckCardDto,
  })
  upgradedCard!: DeckCardDto;

  @ApiProperty({
    description: 'Updated hand after upgrade',
    type: [DeckCardDto],
  })
  hand!: DeckCardDto[];

  @ApiProperty({
    description: 'Remaining gold after upgrade',
    example: 22,
  })
  gold!: number;

  @ApiProperty({
    description: 'Gold spent on upgrade',
    example: 3,
  })
  goldSpent!: number;
}

