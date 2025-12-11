/**
 * Common API Response DTOs for Fantasy Autobattler.
 * Provides standardized response interfaces with Swagger documentation.
 * 
 * @fileoverview Shared DTO classes for consistent API responses across all endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response DTO for API endpoints.
 * Used for consistent error formatting across all controllers.
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: 'Unit with ID \'invalid_unit\' not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Not Found',
  })
  error!: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2025-12-11T14:30:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'API endpoint path where the error occurred',
    example: '/units/invalid_unit',
  })
  path!: string;
}

/**
 * Standard success response wrapper for API endpoints.
 * Provides consistent response structure with metadata.
 */
export class SuccessResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response data payload',
  })
  data!: T;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-12-11T14:30:00.000Z',
  })
  timestamp!: string;
}