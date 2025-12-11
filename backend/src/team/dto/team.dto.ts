/**
 * Team DTOs for Fantasy Autobattler API.
 * Swagger documentation for team-related endpoints and responses with validation.
 * 
 * @fileoverview DTO classes for team data with comprehensive API documentation and class-validator decorators.
 */

import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  MaxLength, 
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
  IsInt,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Position DTO for unit placement on the grid with validation.
 */
export class PositionDto {
  @ApiProperty({
    description: 'X coordinate on the 8×10 grid',
    example: 0,
    minimum: 0,
    maximum: 7,
  })
  @IsNumber({}, { message: 'X coordinate must be a number' })
  @IsInt({ message: 'X coordinate must be an integer' })
  @Min(0, { message: 'X coordinate must be at least 0' })
  @Max(7, { message: 'X coordinate must be at most 7' })
  x!: number;

  @ApiProperty({
    description: 'Y coordinate on the 8×10 grid (player deployment: rows 0-1)',
    example: 0,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber({}, { message: 'Y coordinate must be a number' })
  @IsInt({ message: 'Y coordinate must be an integer' })
  @Min(0, { message: 'Y coordinate must be at least 0' })
  @Max(1, { message: 'Y coordinate must be at most 1 (player deployment zone)' })
  y!: number;
}

/**
 * Unit selection DTO for team composition with validation.
 */
export class UnitSelectionDto {
  @ApiProperty({
    description: 'Unit identifier',
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
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
}

/**
 * Create team request DTO with comprehensive validation.
 */
export class CreateTeamDto {
  @ApiProperty({
    description: 'Team name for identification',
    example: 'My Balanced Team',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Team name must be a string' })
  @MinLength(1, { message: 'Team name cannot be empty' })
  @MaxLength(100, { message: 'Team name cannot exceed 100 characters' })
  name!: string;

  @ApiProperty({
    description: 'Array of units with their positions (1-10 units)',
    type: [UnitSelectionDto],
    minItems: 1,
    maxItems: 10,
  })
  @IsArray({ message: 'Units must be an array' })
  @ArrayMinSize(1, { message: 'Team must have at least 1 unit' })
  @ArrayMaxSize(10, { message: 'Team cannot have more than 10 units' })
  @ValidateNested({ each: true })
  @Type(() => UnitSelectionDto)
  units!: UnitSelectionDto[];
}

// Legacy alias for backward compatibility
export const CreateTeamRequestDto = CreateTeamDto;

/**
 * Update team request DTO with optional validation.
 */
export class UpdateTeamDto {
  @ApiProperty({
    description: 'Updated team name',
    example: 'My Updated Team',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Team name must be a string' })
  @MinLength(1, { message: 'Team name cannot be empty' })
  @MaxLength(100, { message: 'Team name cannot exceed 100 characters' })
  name?: string;

  @ApiProperty({
    description: 'Updated unit composition and positions (1-10 units)',
    type: [UnitSelectionDto],
    minItems: 1,
    maxItems: 10,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Units must be an array' })
  @ArrayMinSize(1, { message: 'Team must have at least 1 unit' })
  @ArrayMaxSize(10, { message: 'Team cannot have more than 10 units' })
  @ValidateNested({ each: true })
  @Type(() => UnitSelectionDto)
  units?: UnitSelectionDto[];
}

// Legacy alias for backward compatibility
export const UpdateTeamRequestDto = UpdateTeamDto;

/**
 * Enriched unit DTO with additional information.
 */
export class EnrichedUnitDto extends UnitSelectionDto {
  @ApiProperty({
    description: 'Unit display name',
    example: 'Рыцарь',
  })
  name!: string;

  @ApiProperty({
    description: 'Unit cost in team budget',
    example: 5,
  })
  cost!: number;

  @ApiProperty({
    description: 'Unit role',
    example: 'tank',
    enum: ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'],
  })
  role!: string;
}

/**
 * Team response DTO with enriched data.
 */
export class TeamResponseDto {
  @ApiProperty({
    description: 'Unique team identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Team name',
    example: 'My Balanced Team',
  })
  name!: string;

  @ApiProperty({
    description: 'Team units with enriched information',
    type: [EnrichedUnitDto],
  })
  units!: EnrichedUnitDto[];

  @ApiProperty({
    description: 'Total team cost within budget (max 30)',
    example: 18,
    maximum: 30,
  })
  totalCost!: number;

  @ApiProperty({
    description: 'Whether this team is active for matchmaking',
    example: false,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Team creation timestamp',
    example: '2025-12-11T14:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Team last update timestamp',
    example: '2025-12-11T14:35:00.000Z',
  })
  updatedAt!: string;
}

/**
 * Team list response DTO.
 */
export class TeamListResponseDto {
  @ApiProperty({
    description: 'Array of player teams',
    type: [TeamResponseDto],
  })
  teams!: TeamResponseDto[];

  @ApiProperty({
    description: 'Total number of teams',
    example: 5,
  })
  total!: number;
}

/**
 * Path parameter DTO for team ID.
 */
export class TeamIdParamDto {
  @ApiProperty({
    description: 'Team identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;
}