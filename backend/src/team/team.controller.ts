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
import { TeamService, UpdateTeamRequest } from './team.service';
import { CreateTeamRequest } from './team.validator';
import { GuestGuard } from '../auth/guest.guard';

interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller handling team-related HTTP endpoints.
 * All endpoints require guest authentication.
 */
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
  async activateTeam(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.teamService.activateTeam(id, req.player.id);
  }
}