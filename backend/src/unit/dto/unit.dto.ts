/**
 * Unit DTOs for Fantasy Autobattler API.
 * Swagger documentation for unit-related endpoints and responses.
 * 
 * @fileoverview DTO classes for unit data with comprehensive API documentation.
 */

import { ApiProperty } from '@nestjs/swagger';
import { UnitRole } from '../../types/game.types';

/**
 * Unit statistics DTO with all combat attributes.
 */
export class UnitStatsDto {
  @ApiProperty({
    description: 'Hit points - unit dies when reaching 0',
    example: 120,
    minimum: 1,
    maximum: 200,
  })
  hp!: number;

  @ApiProperty({
    description: 'Base attack damage per hit',
    example: 12,
    minimum: 1,
    maximum: 50,
  })
  atk!: number;

  @ApiProperty({
    description: 'Number of attacks per turn',
    example: 1,
    minimum: 1,
    maximum: 3,
  })
  atkCount!: number;

  @ApiProperty({
    description: 'Armor value - reduces physical damage',
    example: 8,
    minimum: 0,
    maximum: 15,
  })
  armor!: number;

  @ApiProperty({
    description: 'Movement speed in cells per turn',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  speed!: number;

  @ApiProperty({
    description: 'Initiative - determines turn order (higher goes first)',
    example: 4,
    minimum: 1,
    maximum: 10,
  })
  initiative!: number;

  @ApiProperty({
    description: 'Dodge chance percentage (0-100)',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  dodge!: number;
}

/**
 * Complete unit template DTO with all unit information.
 */
export class UnitTemplateDto {
  @ApiProperty({
    description: 'Unique unit identifier',
    example: 'knight',
    enum: [
      'knight', 'guardian', 'berserker',
      'rogue', 'duelist', 'assassin',
      'archer', 'crossbowman', 'hunter',
      'mage', 'warlock', 'elementalist',
      'priest', 'bard', 'enchanter'
    ],
  })
  id!: string;

  @ApiProperty({
    description: 'Display name of the unit in Russian',
    example: 'Рыцарь',
  })
  name!: string;

  @ApiProperty({
    description: 'Unit role determining combat behavior',
    example: 'tank',
    enum: ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'],
  })
  role!: UnitRole;

  @ApiProperty({
    description: 'Team budget cost to include this unit',
    example: 5,
    minimum: 3,
    maximum: 8,
  })
  cost!: number;

  @ApiProperty({
    description: 'Complete unit combat statistics',
    type: UnitStatsDto,
  })
  stats!: UnitStatsDto;

  @ApiProperty({
    description: 'Attack range in grid cells',
    example: 1,
    minimum: 1,
    maximum: 5,
  })
  range!: number;

  @ApiProperty({
    description: 'List of special abilities this unit possesses',
    example: ['shield_wall'],
    type: [String],
  })
  abilities!: string[];
}

/**
 * Response DTO for GET /units endpoint.
 */
export class UnitsListResponseDto {
  @ApiProperty({
    description: 'Array of all available unit templates',
    type: [UnitTemplateDto],
  })
  units!: UnitTemplateDto[];

  @ApiProperty({
    description: 'Total number of units available',
    example: 15,
  })
  total!: number;

  @ApiProperty({
    description: 'Units grouped by role for easy filtering',
    example: {
      tank: ['knight', 'guardian', 'berserker'],
      mage: ['mage', 'warlock', 'elementalist'],
    },
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/UnitTemplateDto' },
    },
  })
  byRole!: Record<UnitRole, UnitTemplateDto[]>;
}

/**
 * Response DTO for GET /units/roles/:role endpoint.
 */
export class UnitsByRoleResponseDto {
  @ApiProperty({
    description: 'The requested unit role',
    example: 'tank',
    enum: ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'],
  })
  role!: UnitRole;

  @ApiProperty({
    description: 'Array of units with the specified role',
    type: [UnitTemplateDto],
  })
  units!: UnitTemplateDto[];

  @ApiProperty({
    description: 'Number of units in this role',
    example: 3,
  })
  count!: number;
}

/**
 * Path parameter DTO for unit ID.
 */
export class UnitIdParamDto {
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
  id!: string;
}

/**
 * Path parameter DTO for unit role.
 */
export class UnitRoleParamDto {
  @ApiProperty({
    description: 'Unit role for filtering',
    example: 'tank',
    enum: ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'],
  })
  role!: string;
}