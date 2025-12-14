import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { UnitType, UNIT_TEMPLATES } from '../unit/unit.data';

/**
 * Service handling player-related operations.
 * Manages player profiles, teams, and statistics.
 */
@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  async getPlayer(playerId: string) {
    return this.playerRepo.findOne({ where: { id: playerId } });
  }

  async updateTeam(playerId: string, team: UnitType[]) {
    if (team.length !== 3) {
      throw new BadRequestException('Team must have exactly 3 units');
    }

    const validTypes = Object.keys(UNIT_TEMPLATES);
    for (const unit of team) {
      if (!validTypes.includes(unit)) {
        throw new BadRequestException(`Invalid unit type: ${unit}`);
      }
    }

    await this.playerRepo.update(playerId, { team });
    return this.playerRepo.findOne({ where: { id: playerId } });
  }

  /**
   * Update player's display name with validation.
   * Validates name length and content before updating.
   * 
   * @param playerId - ID of the player to update
   * @param newName - New display name for the player
   * @returns Updated player entity
   * @throws NotFoundException when player is not found
   * @throws BadRequestException when name is invalid
   * @example
   * const player = await playerService.updatePlayerName('player-123', 'Epic Warrior');
   */
  async updatePlayerName(playerId: string, newName: string): Promise<Player> {
    this.logger.log(`Updating player name`, { playerId, newName });

    // Validate name
    if (!newName || typeof newName !== 'string') {
      throw new BadRequestException('Name is required and must be a string');
    }

    const trimmedName = newName.trim();
    
    if (trimmedName.length === 0) {
      throw new BadRequestException('Name cannot be empty');
    }

    if (trimmedName.length > 20) {
      throw new BadRequestException('Name cannot be longer than 20 characters');
    }

    // Check for invalid characters (allow letters, numbers, spaces, and common symbols)
    const validNameRegex = /^[a-zA-Zа-яА-Я0-9\s\-_\.]+$/;
    if (!validNameRegex.test(trimmedName)) {
      throw new BadRequestException('Name contains invalid characters');
    }

    // Check if player exists
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      this.logger.warn(`Player name update failed: Player ${playerId} not found`);
      throw new NotFoundException('Player not found');
    }

    // Update player name
    await this.playerRepo.update(playerId, { name: trimmedName });
    
    const updatedPlayer = await this.playerRepo.findOne({ where: { id: playerId } });
    
    this.logger.log(`Player name updated successfully`, {
      playerId,
      oldName: player.name,
      newName: trimmedName,
    });

    if (!updatedPlayer) {
      throw new Error('Failed to update player name');
    }
    return updatedPlayer;
  }
}
