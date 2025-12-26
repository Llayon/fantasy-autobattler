/**
 * Draft DTOs for Roguelike Mode API
 *
 * Request/Response DTOs for draft endpoints.
 * Includes validation decorators and Swagger documentation.
 *
 * @module roguelike/dto/draft
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { DeckCardDto } from './run.dto';

/**
 * Unit stats for draft card display.
 */
export class DraftUnitStatsDto {
  @ApiProperty({ description: 'Hit points', example: 100 })
  hp!: number;

  @ApiProperty({ description: 'Attack damage', example: 15 })
  atk!: number;

  @ApiProperty({ description: 'Armor value', example: 10 })
  armor!: number;

  @ApiProperty({ description: 'Movement speed', example: 2 })
  speed!: number;

  @ApiProperty({ description: 'Turn order priority', example: 10 })
  initiative!: number;

  @ApiProperty({ description: 'Attack range', example: 1 })
  range!: number;

  @ApiProperty({ description: 'Number of attacks per turn', example: 1 })
  attackCount!: number;

  @ApiProperty({ description: 'Dodge chance percentage', example: 5 })
  dodge!: number;
}

/**
 * Enriched draft card with full unit data.
 */
export class EnrichedDraftCardDto extends DeckCardDto {
  @ApiProperty({ description: 'Unit name', example: 'Footman' })
  name!: string;

  @ApiProperty({ description: 'Unit name in Russian', example: 'Пехотинец' })
  nameRu!: string;

  @ApiProperty({ description: 'Unit role', example: 'tank' })
  role!: string;

  @ApiProperty({ description: 'Unit cost', example: 3 })
  cost!: number;

  @ApiProperty({ description: 'Unit stats', type: DraftUnitStatsDto })
  stats!: DraftUnitStatsDto;

  @ApiProperty({ description: 'Ability ID if unit has one', example: 'shield_wall', required: false })
  abilityId?: string | undefined;
}

/**
 * DTO for draft options response.
 * Returns available cards for player to pick from.
 *
 * @example
 * const response: DraftOptionsDto = {
 *   cards: [...],
 *   isInitial: true,
 *   requiredPicks: 3,
 *   remainingInDeck: 9,
 * };
 */
export class DraftOptionsDto {
  @ApiProperty({
    description: 'Cards available for selection with full unit data',
    type: [EnrichedDraftCardDto],
  })
  cards!: EnrichedDraftCardDto[];

  @ApiProperty({
    description: 'Whether this is the initial draft (3 picks) or post-battle (1 pick)',
    example: true,
  })
  isInitial!: boolean;

  @ApiProperty({
    description: 'Number of cards player must pick',
    example: 3,
    minimum: 1,
    maximum: 3,
  })
  requiredPicks!: number;

  @ApiProperty({
    description: 'Cards remaining in deck after this draft',
    example: 9,
  })
  remainingInDeck!: number;
}

/**
 * DTO for submitting draft picks.
 *
 * @example
 * const dto: SubmitDraftDto = {
 *   picks: ['footman-1', 'archer-1', 'priest-1'],
 * };
 */
export class SubmitDraftDto {
  @ApiProperty({
    description: 'Instance IDs of selected cards',
    example: ['footman-1', 'archer-1', 'priest-1'],
    type: [String],
    minItems: 1,
    maxItems: 3,
  })
  @IsArray({ message: 'Picks must be an array' })
  @IsString({ each: true, message: 'Each pick must be a string' })
  @ArrayMinSize(1, { message: 'Must pick at least 1 card' })
  @ArrayMaxSize(3, { message: 'Cannot pick more than 3 cards' })
  picks!: string[];
}

/**
 * DTO for draft result response.
 * Returns updated hand after draft completion.
 *
 * @example
 * const response: DraftResultDto = {
 *   hand: [...],
 *   remainingDeck: [...],
 *   handSize: 6,
 *   deckRemaining: 6,
 * };
 */
export class DraftResultDto {
  @ApiProperty({
    description: 'Updated hand after draft',
    type: [DeckCardDto],
  })
  hand!: DeckCardDto[];

  @ApiProperty({
    description: 'Remaining cards in deck',
    type: [DeckCardDto],
  })
  remainingDeck!: DeckCardDto[];

  @ApiProperty({
    description: 'Current hand size',
    example: 6,
  })
  handSize!: number;

  @ApiProperty({
    description: 'Cards remaining in deck',
    example: 6,
  })
  deckRemaining!: number;
}

