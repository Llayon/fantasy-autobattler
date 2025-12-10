import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BattleLog } from '../entities/battle-log.entity';
import { Player } from '../entities/player.entity';
import { simulateBattle, TeamSetup } from './battle.simulator';
import { UnitType, generateRandomTeam, getUnitTemplate, UnitId } from '../unit/unit.data';
import { GAMEPLAY_VALUES, DEPLOYMENT_ZONES, GRID_DIMENSIONS, TEAM_LIMITS } from '../config/game.constants';
import { Position } from '../types/game.types';

/**
 * Service handling battle simulation and storage.
 * Manages battle lifecycle from initiation to result storage.
 */
@Injectable()
export class BattleService {
  private readonly logger = new Logger(BattleService.name);

  constructor(
    @InjectRepository(BattleLog)
    private battleRepo: Repository<BattleLog>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  /**
   * Start a new battle between player and bot.
   * Simulates the battle and stores the result.
   * 
   * @param playerId - ID of the player starting the battle
   * @returns Object containing the battle ID
   * @throws NotFoundException when player is not found
   * @example
   * const result = await battleService.startBattle('player-123');
   * console.log(result.battleId); // 'battle-456'
   */
  async startBattle(playerId: string) {
    this.logger.log(`Starting battle for player ${playerId}`);

    const player = await this.playerRepo.findOne({ where: { id: playerId } });

    if (!player) {
      this.logger.warn(`Battle start failed: Player ${playerId} not found`);
      throw new NotFoundException('Player not found');
    }

    // Convert legacy player team to new format
    const legacyPlayerTeam = player.team as UnitType[];
    const playerTeamSetup = this.convertLegacyTeamToSetup(legacyPlayerTeam, 'player');
    
    // Generate bot team using new system
    const botUnitIds = generateRandomTeam(TEAM_LIMITS.BUDGET);
    const botTeamSetup = this.createTeamSetup(botUnitIds, 'bot');

    this.logger.debug(`Battle teams - Player: ${legacyPlayerTeam.join(', ')}, Bot: ${botUnitIds.join(', ')}`);

    // Generate deterministic seed for battle
    const seed = this.generateBattleSeed(playerId, legacyPlayerTeam, botUnitIds);
    
    const result = simulateBattle(playerTeamSetup, botTeamSetup, seed);

    // Update player stats
    if (result.winner === 'player') {
      await this.playerRepo.increment({ id: playerId }, 'wins', 1);
    } else if (result.winner === 'bot') {
      await this.playerRepo.increment({ id: playerId }, 'losses', 1);
    }

    // Store battle with legacy format for compatibility
    const battleLog = this.battleRepo.create({
      playerId,
      playerTeam: legacyPlayerTeam,
      botTeam: botUnitIds,
      events: result.events,
      winner: result.winner,
    });
    await this.battleRepo.save(battleLog);

    this.logger.log(`Battle completed`, {
      battleId: battleLog.id,
      playerId,
      winner: result.winner,
      rounds: result.metadata.totalRounds,
      durationMs: result.metadata.durationMs,
    });

    return { battleId: battleLog.id };
  }

  /**
   * Get battle details by ID.
   * 
   * @param battleId - ID of the battle to retrieve
   * @returns Battle log with events and metadata
   * @throws NotFoundException when battle is not found
   * @example
   * const battle = await battleService.getBattle('battle-123');
   */
  async getBattle(battleId: string) {
    const battle = await this.battleRepo.findOne({ where: { id: battleId } });

    if (!battle) {
      this.logger.warn(`Battle retrieval failed: Battle ${battleId} not found`);
      throw new NotFoundException('Battle not found');
    }

    this.logger.debug(`Retrieved battle ${battleId} for replay`);
    return battle;
  }

  /**
   * Get recent battles for a player.
   * Returns battles in descending order by creation date.
   * 
   * @param playerId - ID of the player
   * @returns Array of recent battle logs (limited to 10)
   * @example
   * const battles = await battleService.getPlayerBattles('player-123');
   */
  async getPlayerBattles(playerId: string) {
    this.logger.debug(`Retrieving battle history for player ${playerId}`);
    
    return this.battleRepo.find({
      where: { playerId },
      order: { createdAt: 'DESC' },
      take: GAMEPLAY_VALUES.BATTLE_HISTORY_LIMIT,
    });
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Convert legacy unit type array to new TeamSetup format.
   * Maps old MVP units to new unit system with default positions.
   * 
   * @param legacyTeam - Array of legacy unit types
   * @param teamType - Team type for position calculation
   * @returns TeamSetup with converted units and positions
   * @example
   * const setup = this.convertLegacyTeamToSetup(['Warrior', 'Mage'], 'player');
   */
  private convertLegacyTeamToSetup(legacyTeam: UnitType[], teamType: 'player' | 'bot'): TeamSetup {
    const unitMapping: Record<UnitType, UnitId> = {
      'Warrior': 'knight',
      'Mage': 'mage', 
      'Healer': 'priest',
    };

    const units = legacyTeam.map(legacyType => {
      const unitId = unitMapping[legacyType];
      const template = getUnitTemplate(unitId);
      if (!template) {
        throw new Error(`Unknown legacy unit type: ${legacyType}`);
      }
      return template;
    });

    const positions = this.generateDefaultPositions(units.length, teamType);

    return { units, positions };
  }

  /**
   * Create TeamSetup from unit IDs with default positions.
   * 
   * @param unitIds - Array of unit IDs
   * @param teamType - Team type for position calculation
   * @returns TeamSetup with units and positions
   * @example
   * const setup = this.createTeamSetup(['knight', 'mage'], 'bot');
   */
  private createTeamSetup(unitIds: UnitId[], teamType: 'player' | 'bot'): TeamSetup {
    const units = unitIds.map(unitId => {
      const template = getUnitTemplate(unitId);
      if (!template) {
        throw new Error(`Unknown unit ID: ${unitId}`);
      }
      return template;
    });

    const positions = this.generateDefaultPositions(units.length, teamType);

    return { units, positions };
  }

  /**
   * Generate default deployment positions for a team.
   * Places units in valid deployment zones with simple left-to-right arrangement.
   * 
   * @param unitCount - Number of units to position
   * @param teamType - Team type for zone selection
   * @returns Array of positions for the units
   * @example
   * const positions = this.generateDefaultPositions(3, 'player');
   * // [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
   */
  private generateDefaultPositions(unitCount: number, teamType: 'player' | 'bot'): Position[] {
    const positions: Position[] = [];
    const deploymentRows = teamType === 'player' ? DEPLOYMENT_ZONES.PLAYER_ROWS : DEPLOYMENT_ZONES.ENEMY_ROWS;
    
    let currentRow = 0;
    let currentCol = 0;
    
    for (let i = 0; i < unitCount; i++) {
      // Ensure we don't exceed grid width
      if (currentCol >= GRID_DIMENSIONS.WIDTH) {
        currentCol = 0;
        currentRow++;
      }
      
      // Ensure we don't exceed available deployment rows
      if (currentRow >= deploymentRows.length) {
        this.logger.warn(`Too many units (${unitCount}) for available deployment rows`);
        break;
      }
      
      positions.push({
        x: currentCol,
        y: deploymentRows[currentRow] as number,
      });
      
      currentCol++;
    }
    
    return positions;
  }

  /**
   * Generate a deterministic seed for battle simulation.
   * Creates a reproducible seed based on player ID and team compositions.
   * 
   * @param playerId - Player identifier
   * @param playerTeam - Player team composition
   * @param botTeam - Bot team composition
   * @returns Deterministic seed number
   * @example
   * const seed = this.generateBattleSeed('player-123', ['Warrior'], ['knight']);
   */
  private generateBattleSeed(playerId: string, playerTeam: (UnitType | UnitId)[], botTeam: (UnitType | UnitId)[]): number {
    // Create a hash from player ID and team compositions
    let hash = 0;
    const input = `${playerId}-${playerTeam.join(',')}-${botTeam.join(',')}-${Date.now()}`;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
}
