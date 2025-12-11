/**
 * Team controller for Fantasy Autobattler.
 * Handles HTTP endpoints for team management operations.
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { TeamService, UpdateTeamRequest } from './team.service';
import { CreateTeamRequest } from './team.validator';
import { GuestGuard } from '../auth/guest.guard';
import { 
  CreateTeamRequestDto, 
  UpdateTeamRequestDto, 
  TeamResponseDto, 
  TeamListResponseDto
} from './dto/team.dto';
import { ErrorResponseDto } from '../common/dto/api-response.dto';

interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller handling team-related HTTP endpoints.
 * All endpoints require guest authentication.
 */
@ApiTags('teams')
@ApiSecurity('guest-token')
@Controller('team')
@UseGuards(GuestGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  /**
   * Create a new team for the authenticated player.
   * 
   * @param req - Authenticated request containing player information
   * @param teamData - Team configuration data
   * @returns Created team with enriched unit information
   * @example
   * POST /team
   * {
   *   "name": "My Team",
   *   "units": [
   *     { "unitId": "knight", "position": { "x": 0, "y": 0 } }
   *   ]
   * }
   */
  @Post()
  @ApiOperation({
    summary: 'Create new team',
    description: 'Creates a new team with unit composition and positions within budget constraints',
  })
  @ApiBody({
    type: CreateTeamRequestDto,
    description: 'Team configuration data',
  })
  @ApiResponse({
    status: 201,
    description: 'Team created successfully',
    type: TeamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid team data - budget exceeded or invalid positions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async createTeam(
    @Req() req: AuthenticatedRequest,
    @Body() teamData: CreateTeamRequest,
  ) {
    return this.teamService.createTeam(req.player.id, teamData);
  }

  /**
   * Get all teams for the authenticated player.
   * Returns teams ordered by creation date (newest first).
   * 
   * @param req - Authenticated request containing player information
   * @returns Array of player's teams
   * @example
   * GET /team
   */
  @Get()
  @ApiOperation({
    summary: 'Get player teams',
    description: 'Returns all teams for the authenticated player ordered by creation date',
  })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
    type: TeamListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getPlayerTeams(@Req() req: AuthenticatedRequest) {
    return this.teamService.getPlayerTeams(req.player.id);
  }

  /**
   * Get a specific team by ID.
   * Verifies team belongs to the authenticated player.
   * 
   * @param req - Authenticated request containing player information
   * @param id - Team ID
   * @returns Team with enriched unit information
   * @example
   * GET /team/team-123
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get team by ID',
    description: 'Returns specific team with enriched unit information if owned by player',
  })
  @ApiParam({
    name: 'id',
    description: 'Team identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Team retrieved successfully',
    type: TeamResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found or not owned by player',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async getTeam(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.teamService.getTeam(id, req.player.id);
  }

  /**
   * Update an existing team.
   * Validates changes and ensures team ownership.
   * 
   * @param req - Authenticated request containing player information
   * @param id - Team ID
   * @param updateData - Updated team data
   * @returns Updated team with enriched information
   * @example
   * PUT /team/team-123
   * {
   *   "name": "Updated Team Name",
   *   "units": [
   *     { "unitId": "mage", "position": { "x": 1, "y": 0 } }
   *   ]
   * }
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update team',
    description: 'Updates existing team with new configuration, validates ownership and constraints',
  })
  @ApiParam({
    name: 'id',
    description: 'Team identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateTeamRequestDto,
    description: 'Updated team data',
  })
  @ApiResponse({
    status: 200,
    description: 'Team updated successfully',
    type: TeamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data - budget exceeded or invalid positions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found or not owned by player',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async updateTeam(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateData: UpdateTeamRequest,
  ) {
    return this.teamService.updateTeam(id, req.player.id, updateData);
  }

  /**
   * Delete a team.
   * Verifies team ownership and prevents deletion of active teams.
   * 
   * @param req - Authenticated request containing player information
   * @param id - Team ID
   * @example
   * DELETE /team/team-123
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete team',
    description: 'Deletes team if owned by player and not currently active',
  })
  @ApiParam({
    name: 'id',
    description: 'Team identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Team deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete active team',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found or not owned by player',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async deleteTeam(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.teamService.deleteTeam(id, req.player.id);
  }

  /**
   * Activate a team for matchmaking.
   * Deactivates all other teams for the player.
   * 
   * @param req - Authenticated request containing player information
   * @param id - Team ID
   * @returns Activated team with enriched information
   * @example
   * POST /team/team-123/activate
   */
  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate team',
    description: 'Activates team for matchmaking and deactivates all other player teams',
  })
  @ApiParam({
    name: 'id',
    description: 'Team identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Team activated successfully',
    type: TeamResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found or not owned by player',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid guest token',
    type: ErrorResponseDto,
  })
  async activateTeam(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.teamService.activateTeam(id, req.player.id);
  }
}