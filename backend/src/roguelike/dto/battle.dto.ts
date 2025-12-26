/**
 * Battle DTOs for Roguelike Mode API
 *
 * Request/Response DTOs for roguelike battle endpoints.
 * Includes validation decorators and Swagger documentation.
 *
 * @module roguelike/dto/battle
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsInt,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpellTiming } from '../types/leader.types';
import { Faction } from '../types/faction.types';

/**
 * DTO for unit position on the grid.
 */
export class PositionDto {
  @ApiProperty({
    description: 'X coordinate (0-7)',
    example: 3,
    minimum: 0,
    maximum: 7,
  })
  @IsInt({ message: 'X must be an integer' })
  @Min(0, { message: 'X must be at least 0' })
  @Max(7, { message: 'X must be at most 7' })
  x!: number;

  @ApiProperty({
    description: 'Y coordinate (0-1 for deployment)',
    example: 0,
    minimum: 0,
    maximum: 1,
  })
  @IsInt({ message: 'Y must be an integer' })
  @Min(0, { message: 'Y must be at least 0' })
  @Max(1, { message: 'Y must be at most 1' })
  y!: number;
}

/**
 * DTO for placed unit in battle submission.
 */
export class PlacedUnitDto {
  @ApiProperty({
    description: 'Card instance ID from hand',
    example: 'footman-1',
  })
  @IsString({ message: 'Instance ID must be a string' })
  instanceId!: string;

  @ApiPropertyOptional({
    description: 'Unit ID (optional, resolved from hand)',
    example: 'footman',
  })
  @IsOptional()
  @IsString({ message: 'Unit ID must be a string' })
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Unit tier (optional, resolved from hand)',
    example: 1,
    enum: [1, 2, 3],
  })
  @IsOptional()
  @IsInt({ message: 'Tier must be an integer' })
  @Min(1, { message: 'Tier must be at least 1' })
  @Max(3, { message: 'Tier must be at most 3' })
  tier?: 1 | 2 | 3;

  @ApiProperty({
    description: 'Position on deployment grid',
    type: PositionDto,
  })
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
}

/**
 * DTO for spell timing selection.
 */
export class SpellTimingDto {
  @ApiProperty({
    description: 'Spell identifier',
    example: 'holy_light',
  })
  @IsString({ message: 'Spell ID must be a string' })
  spellId!: string;

  @ApiProperty({
    description: 'Selected timing for spell trigger',
    example: 'mid',
    enum: ['early', 'mid', 'late'],
  })
  @IsEnum(['early', 'mid', 'late'], { message: 'Timing must be early, mid, or late' })
  timing!: SpellTiming;
}

/**
 * DTO for opponent snapshot in matchmaking response.
 */
export class OpponentSnapshotDto {
  @ApiProperty({
    description: 'Snapshot identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Opponent player ID',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  playerId!: string;

  @ApiProperty({
    description: 'Opponent wins at time of snapshot',
    example: 3,
  })
  wins!: number;

  @ApiProperty({
    description: 'Opponent rating at time of snapshot',
    example: 1050,
  })
  rating!: number;

  @ApiProperty({
    description: 'Opponent faction',
    example: 'undead',
    enum: ['humans', 'undead'],
  })
  faction!: Faction;

  @ApiProperty({
    description: 'Opponent leader ID',
    example: 'lich_king_malachar',
  })
  leaderId!: string;

  @ApiProperty({
    description: 'Whether opponent is a bot',
    example: false,
  })
  isBot!: boolean;
}

/**
 * DTO for finding opponent response.
 */
export class FindOpponentResponseDto {
  @ApiProperty({
    description: 'Opponent snapshot data',
    type: OpponentSnapshotDto,
  })
  opponent!: OpponentSnapshotDto;

  @ApiProperty({
    description: 'Estimated battle difficulty',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty!: 'easy' | 'medium' | 'hard';
}

/**
 * DTO for submitting battle.
 *
 * @example
 * const dto: SubmitBattleDto = {
 *   team: [
 *     { instanceId: 'footman-1', position: { x: 0, y: 0 } },
 *     { instanceId: 'archer-1', position: { x: 1, y: 1 } },
 *   ],
 *   spellTimings: [
 *     { spellId: 'holy_light', timing: 'mid' },
 *     { spellId: 'rally', timing: 'early' },
 *   ],
 * };
 */
export class SubmitBattleDto {
  @ApiProperty({
    description: 'Units placed on deployment grid',
    type: [PlacedUnitDto],
    minItems: 1,
    maxItems: 12,
  })
  @IsArray({ message: 'Team must be an array' })
  @ArrayMinSize(1, { message: 'Must place at least 1 unit' })
  @ArrayMaxSize(12, { message: 'Cannot place more than 12 units' })
  @ValidateNested({ each: true })
  @Type(() => PlacedUnitDto)
  team!: PlacedUnitDto[];

  @ApiProperty({
    description: 'Spell timing selections',
    type: [SpellTimingDto],
  })
  @IsArray({ message: 'Spell timings must be an array' })
  @ArrayMinSize(0, { message: 'Spell timings array is required' })
  @ValidateNested({ each: true })
  @Type(() => SpellTimingDto)
  spellTimings!: SpellTimingDto[];
}

/**
 * DTO for battle result response.
 */
export class BattleResultDto {
  @ApiProperty({
    description: 'Battle log identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  battleId!: string;

  @ApiProperty({
    description: 'Battle result',
    example: 'win',
    enum: ['win', 'lose'],
  })
  result!: 'win' | 'lose';

  @ApiProperty({
    description: 'Gold earned from battle',
    example: 7,
  })
  goldEarned!: number;

  @ApiProperty({
    description: 'New gold balance',
    example: 32,
  })
  newGold!: number;

  @ApiProperty({
    description: 'Updated win count',
    example: 4,
  })
  wins!: number;

  @ApiProperty({
    description: 'Updated loss count',
    example: 1,
  })
  losses!: number;

  @ApiProperty({
    description: 'Rating change from battle',
    example: 15,
  })
  ratingChange!: number;

  @ApiProperty({
    description: 'New rating',
    example: 1065,
  })
  newRating!: number;

  @ApiProperty({
    description: 'Whether run is now complete',
    example: false,
  })
  runComplete!: boolean;

  @ApiProperty({
    description: 'Run status after battle',
    example: 'active',
    enum: ['active', 'won', 'lost'],
  })
  runStatus!: 'active' | 'won' | 'lost';
}

