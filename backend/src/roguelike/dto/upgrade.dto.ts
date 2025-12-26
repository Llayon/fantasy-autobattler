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
import { UnitTier } from '../types/unit.types';

/**
 * DTO for a unit on the deployment field.
 */
export class FieldUnitDto {
  @ApiProperty({
    description: 'Unit template ID',
    example: 'footman',
  })
  unitId!: string;

  @ApiProperty({
    description: 'Unit tier (1-3)',
    example: 1,
    enum: [1, 2, 3],
  })
  tier!: UnitTier;

  @ApiProperty({
    description: 'Unique instance ID',
    example: 'footman-1',
  })
  instanceId!: string;

  @ApiProperty({
    description: 'Position on deployment grid',
    example: { x: 0, y: 0 },
  })
  position!: { x: number; y: number };

  @ApiProperty({
    description: 'Whether unit has participated in battle',
    example: false,
  })
  hasBattled!: boolean;
}

/**
 * DTO for upgrade cost information.
 */
export class UpgradeCostDto {
  @ApiProperty({
    description: 'Unit instance ID',
    example: 'footman-1',
  })
  instanceId!: string;

  @ApiProperty({
    description: 'Current tier of the unit',
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
 * Returns current field units with upgrade options.
 * Only units on the field can be upgraded.
 *
 * @example
 * const response: ShopStateDto = {
 *   field: [...],
 *   gold: 25,
 *   upgradeCosts: [...],
 * };
 */
export class ShopStateDto {
  @ApiProperty({
    description: 'Current units on deployment field',
    type: [FieldUnitDto],
  })
  field!: FieldUnitDto[];

  @ApiProperty({
    description: 'Current gold balance',
    example: 25,
  })
  gold!: number;

  @ApiProperty({
    description: 'Upgrade costs for each upgradeable unit on field',
    type: [UpgradeCostDto],
  })
  upgradeCosts!: UpgradeCostDto[];
}

/**
 * DTO for upgrading a unit on the field.
 *
 * @example
 * const dto: UpgradeUnitDto = {
 *   cardInstanceId: 'footman-1',
 * };
 */
export class UpgradeUnitDto {
  @ApiProperty({
    description: 'Instance ID of the unit on field to upgrade',
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
 *   upgradedUnit: { unitId: 'footman', tier: 2, instanceId: 'footman-1', position: { x: 0, y: 0 }, hasBattled: false },
 *   field: [...],
 *   gold: 22,
 *   goldSpent: 3,
 * };
 */
export class UpgradeResultDto {
  @ApiProperty({
    description: 'The upgraded unit',
    type: FieldUnitDto,
  })
  upgradedUnit!: FieldUnitDto;

  @ApiProperty({
    description: 'Updated field after upgrade',
    type: [FieldUnitDto],
  })
  field!: FieldUnitDto[];

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

