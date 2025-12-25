/**
 * Run DTOs for Roguelike Mode API
 *
 * Request/Response DTOs for run management endpoints.
 * Includes validation decorators and Swagger documentation.
 *
 * @module roguelike/dto/run
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID } from 'class-validator';
import { Faction } from '../types/faction.types';
import { SpellTiming } from '../types/leader.types';
import { UnitTier } from '../types/unit.types';

/**
 * DTO for creating a new roguelike run.
 *
 * @example
 * const dto: CreateRunDto = {
 *   faction: 'humans',
 *   leaderId: 'commander_aldric',
 * };
 */
export class CreateRunDto {
  @ApiProperty({
    description: 'Selected faction for the run',
    example: 'humans',
    enum: ['humans', 'undead'],
  })
  @IsString({ message: 'Faction must be a string' })
  @IsEnum(['humans', 'undead'], { message: 'Faction must be humans or undead' })
  faction!: Faction;

  @ApiProperty({
    description: 'Selected leader ID for the run',
    example: 'commander_aldric',
  })
  @IsString({ message: 'Leader ID must be a string' })
  leaderId!: string;
}

/**
 * DTO for deck card in responses.
 */
export class DeckCardDto {
  @ApiProperty({
    description: 'Base unit ID',
    example: 'footman',
  })
  unitId!: string;

  @ApiProperty({
    description: 'Current tier of the card',
    example: 1,
    enum: [1, 2, 3],
  })
  tier!: UnitTier;

  @ApiProperty({
    description: 'Unique instance ID for this card',
    example: 'footman-1',
  })
  instanceId!: string;
}

/**
 * DTO for spell card in responses.
 */
export class SpellCardDto {
  @ApiProperty({
    description: 'Spell identifier',
    example: 'holy_light',
  })
  spellId!: string;

  @ApiPropertyOptional({
    description: 'Player-selected timing for this spell',
    example: 'mid',
    enum: ['early', 'mid', 'late'],
  })
  timing?: SpellTiming;
}

/**
 * DTO for run response.
 */
export class RunResponseDto {
  @ApiProperty({
    description: 'Unique run identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Player ID who owns this run',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  playerId!: string;

  @ApiProperty({
    description: 'Selected faction',
    example: 'humans',
    enum: ['humans', 'undead'],
  })
  faction!: Faction;

  @ApiProperty({
    description: 'Selected leader ID',
    example: 'commander_aldric',
  })
  leaderId!: string;

  @ApiProperty({
    description: 'Full deck of cards (12 units)',
    type: [DeckCardDto],
  })
  deck!: DeckCardDto[];

  @ApiProperty({
    description: 'Cards not yet drafted to hand',
    type: [DeckCardDto],
  })
  remainingDeck!: DeckCardDto[];

  @ApiProperty({
    description: 'Cards currently in hand',
    type: [DeckCardDto],
  })
  hand!: DeckCardDto[];

  @ApiProperty({
    description: 'Available spells (2 spells)',
    type: [SpellCardDto],
  })
  spells!: SpellCardDto[];

  @ApiProperty({
    description: 'Number of wins (0-9)',
    example: 3,
    minimum: 0,
    maximum: 9,
  })
  wins!: number;

  @ApiProperty({
    description: 'Number of losses (0-4)',
    example: 1,
    minimum: 0,
    maximum: 4,
  })
  losses!: number;

  @ApiProperty({
    description: 'Consecutive wins for streak bonus',
    example: 2,
  })
  consecutiveWins!: number;

  @ApiProperty({
    description: 'Current gold balance',
    example: 25,
  })
  gold!: number;

  @ApiProperty({
    description: 'Battle log IDs for history',
    type: [String],
  })
  battleHistory!: string[];

  @ApiProperty({
    description: 'Current run status',
    example: 'active',
    enum: ['active', 'won', 'lost'],
  })
  status!: 'active' | 'won' | 'lost';

  @ApiProperty({
    description: 'Run rating for matchmaking',
    example: 1050,
  })
  rating!: number;

  @ApiProperty({
    description: 'Run creation timestamp',
    example: '2025-12-26T10:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Run last update timestamp',
    example: '2025-12-26T10:30:00.000Z',
  })
  updatedAt!: string;
}

/**
 * DTO for run summary (list view).
 */
export class RunSummaryDto {
  @ApiProperty({
    description: 'Unique run identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Selected faction',
    example: 'humans',
    enum: ['humans', 'undead'],
  })
  faction!: Faction;

  @ApiProperty({
    description: 'Number of wins',
    example: 3,
  })
  wins!: number;

  @ApiProperty({
    description: 'Number of losses',
    example: 1,
  })
  losses!: number;

  @ApiProperty({
    description: 'Current gold balance',
    example: 25,
  })
  gold!: number;

  @ApiProperty({
    description: 'Current run status',
    example: 'active',
    enum: ['active', 'won', 'lost'],
  })
  status!: 'active' | 'won' | 'lost';

  @ApiProperty({
    description: 'Number of cards in hand',
    example: 5,
  })
  handSize!: number;

  @ApiProperty({
    description: 'Number of cards remaining in deck',
    example: 7,
  })
  deckRemaining!: number;
}

/**
 * DTO for run ID path parameter.
 */
export class RunIdParamDto {
  @ApiProperty({
    description: 'Run identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Run ID must be a valid UUID' })
  id!: string;
}

