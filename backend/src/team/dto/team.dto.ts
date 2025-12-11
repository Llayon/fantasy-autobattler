/**
 * Team DTOs for Fantasy Autobattler API.
 * Swagger documentation for team-related endpoints and responses.
 * 
 * @fileoverview DTO classes for team data with comprehensive API documentation.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Position DTO for unit placement on the grid.
 */
export class PositionDto {
  @ApiProperty({
    description: 'X coordinate on the 8×10 grid',
    example: 0,
    minimum: 0,
    maximum: 7,
  })
  x!: number;

  @ApiProperty({
    description: 'Y coordinate on the 8×10 grid (player deployment: rows 0-1)',
    example: 0,
    minimum: 0,
    maximum: 1,
  })
  y!: number;
}

/**
 * Unit selection DTO for team composition.
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
  unitId!: string;

  @ApiProperty({
    description: 'Unit position on the battlefield',
    type: PositionDto,
  })
  position!: PositionDto;
}

/**
 * Create team request DTO.
 */
export class CreateTeamRequestDto {
  @ApiProperty({
    description: 'Team name for identification',
    example: 'My Balanced Team',
    maxLength: 100,
  })
  name!: string;

  @ApiProperty({
    description: 'Array of units with their positions',
    type: [UnitSelectionDto],
    minItems: 1,
    maxItems: 10,
  })
  units!: UnitSelectionDto[];
}

/**
 * Update team request DTO.
 */
export class UpdateTeamRequestDto {
  @ApiProperty({
    description: 'Updated team name',
    example: 'My Updated Team',
    maxLength: 100,
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Updated unit composition and positions',
    type: [UnitSelectionDto],
    minItems: 1,
    maxItems: 10,
    required: false,
  })
  units?: UnitSelectionDto[];
}

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