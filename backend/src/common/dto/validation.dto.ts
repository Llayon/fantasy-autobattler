/**
 * Common validation DTOs for Fantasy Autobattler.
 * Provides reusable validation classes and decorators.
 * 
 * @fileoverview Shared DTO classes for consistent validation across all endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Max, IsInt } from 'class-validator';

/**
 * Position DTO for grid-based positioning.
 * Validates x,y coordinates within game grid bounds.
 */
export class PositionDto {
  @ApiProperty({
    description: 'X coordinate on the grid (0-7)',
    example: 2,
    minimum: 0,
    maximum: 7,
  })
  @IsNumber({}, { message: 'X coordinate must be a number' })
  @IsInt({ message: 'X coordinate must be an integer' })
  @Min(0, { message: 'X coordinate must be at least 0' })
  @Max(7, { message: 'X coordinate must be at most 7' })
  x!: number;

  @ApiProperty({
    description: 'Y coordinate on the grid (0-9)',
    example: 1,
    minimum: 0,
    maximum: 9,
  })
  @IsNumber({}, { message: 'Y coordinate must be a number' })
  @IsInt({ message: 'Y coordinate must be an integer' })
  @Min(0, { message: 'Y coordinate must be at least 0' })
  @Max(9, { message: 'Y coordinate must be at most 9' })
  y!: number;
}

/**
 * Unit selection DTO for team building.
 * Validates unit ID and position for team composition.
 */
export class UnitSelectionDto {
  @ApiProperty({
    description: 'Unit identifier from available units',
    example: 'knight',
    enum: [
      'knight', 'guardian', 'berserker',
      'rogue', 'duelist', 'assassin',
      'archer', 'crossbowman', 'hunter',
      'mage', 'warlock', 'elementalist',
      'priest', 'bard', 'enchanter'
    ],
  })
  @IsString({ message: 'Unit ID must be a string' })
  unitId!: string;

  @ApiProperty({
    description: 'Unit position on the battlefield',
    type: PositionDto,
  })
  position!: PositionDto;
}