/**
 * DTOs for Placement Operations
 *
 * Data transfer objects for unit placement endpoints.
 *
 * @module roguelike/dto/placement
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Position on the deployment grid.
 */
export class PositionDto {
  @ApiProperty({
    description: 'X coordinate (column)',
    minimum: 0,
    maximum: 7,
    example: 0,
  })
  @IsInt()
  @Min(0)
  @Max(7)
  x!: number;

  @ApiProperty({
    description: 'Y coordinate (row)',
    minimum: 0,
    maximum: 1,
    example: 0,
  })
  @IsInt()
  @Min(0)
  @Max(1)
  y!: number;
}

/**
 * DTO for placing a unit from hand to field.
 */
export class PlaceUnitDto {
  @ApiProperty({
    description: 'Instance ID of the card in hand',
    example: 'card-instance-uuid',
  })
  @IsString()
  @IsNotEmpty()
  instanceId!: string;

  @ApiProperty({
    description: 'Target position on the deployment grid',
    type: PositionDto,
  })
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
}

/**
 * DTO for repositioning a unit on the field.
 */
export class RepositionUnitDto {
  @ApiProperty({
    description: 'Instance ID of the unit on field',
    example: 'card-instance-uuid',
  })
  @IsString()
  @IsNotEmpty()
  instanceId!: string;

  @ApiProperty({
    description: 'New position on the deployment grid',
    type: PositionDto,
  })
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
}
