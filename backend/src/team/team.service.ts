/**
 * Team service for Fantasy Autobattler.
 * Handles team CRUD operations, validation, and business logic.
 */

import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';
import { TeamValidator, CreateTeamRequest } from './team.validator';
import { getUnitTemplate, UnitId } from '../unit/unit.data';

/**
 * Interface for team update requests.
 */
export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  /** Whether to make this team active */
  isActive?: boolean;
}

/**
 * Interface for team response data.
 */
export interface TeamResponse {
  id: string;
  name: string;
  units: Array<{
    unitId: string;
    unitName: string;
    position: { x: number; y: number };
    cost: number;
  }>;
  totalCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service responsible for team management operations.
 * Handles team creation, updates, validation, and activation.
 */
@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    private teamValidator: TeamValidator,
  ) {}

  /**
   * Create a new team for a player.
   * Validates team configuration and ensures budget constraints.
   * 
   * @param playerId - ID of the player creating the team
   * @param teamData - Team configuration data
   * @returns Created team with enriched unit information
   * @throws NotFoundException if player is not found
   * @throws BadRequestException if team validation fails
   * @example
   * const team = await teamService.createTeam('player-123', {
   *   name: 'My Team',
   *   units: [{ unitId: 'knight', position: { x: 0, y: 0 } }]
   * });
   */
  async createTeam(playerId: string, teamData: CreateTeamRequest): Promise<TeamResponse> {
    this.logger.log(`Creating team for player ${playerId}`, { teamName: teamData.name });

    // Verify player exists
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      this.logger.warn(`Team creation failed: Player ${playerId} not found`);
      throw new NotFoundException('Player not found');
    }

    // Validate team configuration
    const validation = this.teamValidator.validateTeam(teamData);
    if (!validation.isValid) {
      this.logger.warn(`Team validation failed for player ${playerId}`, {
        errors: validation.errors,
        teamName: teamData.name,
      });
      throw new BadRequestException(`Team validation failed: ${validation.errors.join(', ')}`);
    }

    // Create team entity
    const team = this.teamRepo.create({
      playerId,
      name: teamData.name.trim(),
      units: teamData.units,
      totalCost: validation.totalCost,
      isActive: false, // New teams start inactive
    });

    // Save team
    const savedTeam = await this.teamRepo.save(team);

    this.logger.log(`Team created successfully`, {
      teamId: savedTeam.id,
      playerId,
      teamName: savedTeam.name,
      unitCount: validation.unitCount,
      totalCost: validation.totalCost,
    });

    return this.enrichTeamResponse(savedTeam);
  }

  /**
   * Get all teams for a player.
   * Returns teams ordered by creation date (newest first).
   * 
   * @param playerId - ID of the player
   * @returns Array of player's teams with enriched data
   * @example
   * const teams = await teamService.getPlayerTeams('player-123');
   */
  async getPlayerTeams(playerId: string): Promise<TeamResponse[]> {
    this.logger.debug(`Retrieving teams for player ${playerId}`);

    const teams = await this.teamRepo.find({
      where: { playerId },
      order: { createdAt: 'DESC' },
    });

    return teams.map(team => this.enrichTeamResponse(team));
  }

  /**
   * Get a specific team by ID.
   * Verifies team belongs to the requesting player.
   * 
   * @param teamId - ID of the team to retrieve
   * @param playerId - ID of the requesting player
   * @returns Team with enriched unit information
   * @throws NotFoundException if team is not found or doesn't belong to player
   * @example
   * const team = await teamService.getTeam('team-123', 'player-123');
   */
  async getTeam(teamId: string, playerId: string): Promise<TeamResponse> {
    this.logger.debug(`Retrieving team ${teamId} for player ${playerId}`);

    const team = await this.teamRepo.findOne({
      where: { id: teamId, playerId },
    });

    if (!team) {
      this.logger.warn(`Team retrieval failed: Team ${teamId} not found for player ${playerId}`);
      throw new NotFoundException('Team not found');
    }

    return this.enrichTeamResponse(team);
  }

  /**
   * Update an existing team.
   * Validates changes and ensures team ownership.
   * 
   * @param teamId - ID of the team to update
   * @param playerId - ID of the requesting player
   * @param updateData - Updated team data
   * @returns Updated team with enriched information
   * @throws NotFoundException if team is not found or doesn't belong to player
   * @throws BadRequestException if validation fails
   * @example
   * const team = await teamService.updateTeam('team-123', 'player-123', {
   *   name: 'Updated Team Name'
   * });
   */
  async updateTeam(teamId: string, playerId: string, updateData: UpdateTeamRequest): Promise<TeamResponse> {
    this.logger.log(`Updating team ${teamId} for player ${playerId}`);

    // Find existing team
    const team = await this.teamRepo.findOne({
      where: { id: teamId, playerId },
    });

    if (!team) {
      this.logger.warn(`Team update failed: Team ${teamId} not found for player ${playerId}`);
      throw new NotFoundException('Team not found');
    }

    // Prepare update data
    const updatedTeamData: CreateTeamRequest = {
      name: updateData.name ?? team.name,
      units: updateData.units ?? team.units,
    };

    // Validate if units or name changed
    if (updateData.name || updateData.units) {
      const validation = this.teamValidator.validateTeam(updatedTeamData);
      if (!validation.isValid) {
        this.logger.warn(`Team update validation failed for team ${teamId}`, {
          errors: validation.errors,
        });
        throw new BadRequestException(`Team validation failed: ${validation.errors.join(', ')}`);
      }
      team.totalCost = validation.totalCost;
    }

    // Apply updates
    if (updateData.name) {
      team.name = updateData.name.trim();
    }
    if (updateData.units) {
      team.units = updateData.units;
    }
    if (updateData.isActive !== undefined) {
      team.isActive = updateData.isActive;
    }

    // Save changes
    const savedTeam = await this.teamRepo.save(team);

    this.logger.log(`Team updated successfully`, {
      teamId: savedTeam.id,
      playerId,
      changes: Object.keys(updateData),
    });

    return this.enrichTeamResponse(savedTeam);
  }

  /**
   * Delete a team.
   * Verifies team ownership before deletion.
   * 
   * @param teamId - ID of the team to delete
   * @param playerId - ID of the requesting player
   * @throws NotFoundException if team is not found or doesn't belong to player
   * @throws ConflictException if trying to delete the active team
   * @example
   * await teamService.deleteTeam('team-123', 'player-123');
   */
  async deleteTeam(teamId: string, playerId: string): Promise<void> {
    this.logger.log(`Deleting team ${teamId} for player ${playerId}`);

    // Find existing team
    const team = await this.teamRepo.findOne({
      where: { id: teamId, playerId },
    });

    if (!team) {
      this.logger.warn(`Team deletion failed: Team ${teamId} not found for player ${playerId}`);
      throw new NotFoundException('Team not found');
    }

    // Prevent deletion of active team
    if (team.isActive) {
      this.logger.warn(`Team deletion failed: Cannot delete active team ${teamId}`);
      throw new ConflictException('Cannot delete active team. Deactivate it first.');
    }

    // Delete team
    await this.teamRepo.remove(team);

    this.logger.log(`Team deleted successfully`, {
      teamId,
      playerId,
      teamName: team.name,
    });
  }

  /**
   * Activate a team for matchmaking.
   * Deactivates all other teams for the player.
   * 
   * @param teamId - ID of the team to activate
   * @param playerId - ID of the requesting player
   * @returns Activated team with enriched information
   * @throws NotFoundException if team is not found or doesn't belong to player
   * @throws BadRequestException if team is not valid for battle
   * @example
   * const activeTeam = await teamService.activateTeam('team-123', 'player-123');
   */
  async activateTeam(teamId: string, playerId: string): Promise<TeamResponse> {
    this.logger.log(`Activating team ${teamId} for player ${playerId}`);

    // Find team to activate
    const team = await this.teamRepo.findOne({
      where: { id: teamId, playerId },
    });

    if (!team) {
      this.logger.warn(`Team activation failed: Team ${teamId} not found for player ${playerId}`);
      throw new NotFoundException('Team not found');
    }

    // Validate team is ready for battle
    if (!this.teamValidator.validateForBattle(team)) {
      this.logger.warn(`Team activation failed: Team ${teamId} is not valid for battle`);
      throw new BadRequestException('Team is not valid for battle. Check unit configuration and budget.');
    }

    // Deactivate all other teams for this player
    await this.teamRepo.update(
      { playerId, isActive: true },
      { isActive: false }
    );

    // Activate the selected team
    team.isActive = true;
    const savedTeam = await this.teamRepo.save(team);

    this.logger.log(`Team activated successfully`, {
      teamId: savedTeam.id,
      playerId,
      teamName: savedTeam.name,
    });

    return this.enrichTeamResponse(savedTeam);
  }

  /**
   * Get the active team for a player.
   * 
   * @param playerId - ID of the player
   * @returns Active team or null if no team is active
   * @example
   * const activeTeam = await teamService.getActiveTeam('player-123');
   */
  async getActiveTeam(playerId: string): Promise<TeamResponse | null> {
    this.logger.debug(`Retrieving active team for player ${playerId}`);

    const team = await this.teamRepo.findOne({
      where: { playerId, isActive: true },
    });

    return team ? this.enrichTeamResponse(team) : null;
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Enrich team response with unit details.
   * Adds unit names and costs from templates.
   * 
   * @param team - Team entity to enrich
   * @returns Enriched team response
   * @private
   */
  private enrichTeamResponse(team: Team): TeamResponse {
    const enrichedUnits = team.units.map(unit => {
      const template = getUnitTemplate(unit.unitId as UnitId);
      return {
        unitId: unit.unitId,
        unitName: template?.name ?? 'Unknown Unit',
        position: unit.position,
        cost: template?.cost ?? 0,
      };
    });

    return {
      id: team.id,
      name: team.name,
      units: enrichedUnits,
      totalCost: team.totalCost,
      isActive: team.isActive,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}