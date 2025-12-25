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
    description: 'Cards available for selection',
    type: [DeckCardDto],
  })
  cards!: DeckCardDto[];

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

