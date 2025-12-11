/**
 * Matchmaking DTOs for Fantasy Autobattler API.
 * Provides request/response interfaces for matchmaking endpoints with validation.
 * 
 * @fileoverview DTO classes for matchmaking operations with comprehensive validation.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

/**
 * DTO for joining matchmaking queue.
 * Used in POST /matchmaking/join endpoint.
 */
export class JoinQueueDto {
  @ApiProperty({
    description: 'Team ID to use for matchmaking',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString({ message: 'Team ID must be a string' })
  @IsUUID(4, { message: 'Team ID must be a valid UUID' })
  teamId!: string;
}

/**
 * DTO for matchmaking queue response.
 */
export class QueueResponseDto {
  @ApiProperty({
    description: 'Queue entry unique identifier',
    example: '987fcdeb-51a2-43d1-9f6e-123456789abc',
  })
  id!: string;

  @ApiProperty({
    description: 'Player identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  playerId!: string;

  @ApiProperty({
    description: 'Team identifier',
    example: '456789ab-cdef-1234-5678-9abcdef01234',
  })
  teamId!: string;

  @ApiProperty({
    description: 'Player ELO rating',
    example: 1200,
  })
  rating!: number;

  @ApiProperty({
    description: 'Queue join timestamp',
    example: '2025-12-11T14:30:00.000Z',
  })
  joinedAt!: Date;
}