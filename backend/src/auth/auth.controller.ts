import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ErrorResponseDto } from '../common/dto/api-response.dto';

/**
 * Authentication controller for Fantasy Autobattler.
 * Handles guest player creation and authentication.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Create a new guest player account.
   * Returns a guest token for authentication.
   * 
   * @returns Guest player with authentication token
   * @example
   * POST /auth/guest
   * Response: { "id": "uuid", "guestToken": "token", "createdAt": "2025-12-11T14:30:00.000Z" }
   */
  @Post('guest')
  @ApiOperation({
    summary: 'Create guest player',
    description: 'Creates a new guest player account and returns authentication token',
  })
  @ApiResponse({
    status: 201,
    description: 'Guest player created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Player unique identifier',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        guestToken: {
          type: 'string',
          description: 'Authentication token for API requests',
          example: 'guest_abc123def456',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Account creation timestamp',
          example: '2025-12-11T14:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during player creation',
    type: ErrorResponseDto,
  })
  async createGuest() {
    return this.authService.createGuestPlayer();
  }
}
