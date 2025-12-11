/**
 * Battle DTOs for Fantasy Autobattler API.
 * Swagger documentation for battle-related endpoints and responses.
 * 
 * @fileoverview DTO classes for battle data with comprehensive API documentation.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Battle result DTO for battle simulation responses.
 */
export class BattleResultDto {
  @ApiProperty({
    description: 'Unique battle identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Battle winner (player or bot)',
    example: 'player',
    enum: ['player', 'bot', 'draw'],
  })
  winner!: string;

  @ApiProperty({
    description: 'Number of rounds the battle lasted',
    example: 15,
    minimum: 1,
    maximum: 100,
  })
  rounds!: number;

  @ApiProperty({
    description: 'Battle events for replay',
    example: [
      {
        type: 'move',
        unitId: 'knight-1',
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
        round: 1
      }
    ],
    type: 'array',
    items: { type: 'object' },
  })
  events!: object[];

  @ApiProperty({
    description: 'Player team composition',
    example: ['knight', 'mage', 'priest'],
    type: [String],
  })
  playerTeam!: string[];

  @ApiProperty({
    description: 'Bot team composition',
    example: ['berserker', 'archer', 'warlock'],
    type: [String],
  })
  botTeam!: string[];

  @ApiProperty({
    description: 'Battle creation timestamp',
    example: '2025-12-11T14:30:00.000Z',
  })
  createdAt!: string;
}

/**
 * Battle log DTO for battle history responses.
 */
export class BattleLogDto {
  @ApiProperty({
    description: 'Unique battle identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Player 1 identifier',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  player1Id!: string;

  @ApiProperty({
    description: 'Player 2 identifier (or bot)',
    example: 'bot',
  })
  player2Id!: string;

  @ApiProperty({
    description: 'Battle winner identifier',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  winnerId!: string;

  @ApiProperty({
    description: 'Player 1 team snapshot',
    example: {
      units: ['knight', 'mage', 'priest'],
      positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
    },
    type: 'object',
  })
  player1Team!: object;

  @ApiProperty({
    description: 'Player 2 team snapshot',
    example: {
      units: ['berserker', 'archer', 'warlock'],
      positions: [{ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }]
    },
    type: 'object',
  })
  player2Team!: object;

  @ApiProperty({
    description: 'Complete battle events for replay',
    type: 'array',
    items: { type: 'object' },
  })
  events!: object[];

  @ApiProperty({
    description: 'Random seed used for battle simulation',
    example: 1234567890,
  })
  seed!: number;

  @ApiProperty({
    description: 'Battle status',
    example: 'completed',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
  status!: string;

  @ApiProperty({
    description: 'Battle creation timestamp',
    example: '2025-12-11T14:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Battle completion timestamp',
    example: '2025-12-11T14:35:00.000Z',
  })
  updatedAt!: string;
}

/**
 * Battle list response DTO.
 */
export class BattleListResponseDto {
  @ApiProperty({
    description: 'Array of battle logs',
    type: [BattleLogDto],
  })
  battles!: BattleLogDto[];

  @ApiProperty({
    description: 'Total number of battles',
    example: 25,
  })
  total!: number;
}

/**
 * Path parameter DTO for battle ID.
 */
export class BattleIdParamDto {
  @ApiProperty({
    description: 'Battle identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;
}