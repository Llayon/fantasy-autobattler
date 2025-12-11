import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BattleLog, BattleStatus } from '../entities/battle-log.entity';
import { Player } from '../entities/player.entity';
import { Team } from '../entities/team.entity';
import { simulateBattle, TeamSetup } from './battle.simulator';
import { generateRandomTeam, getUnitTemplate, UnitId } from '../unit/unit.data';
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
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
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
    const legacyPlayerTeam = player.team as string[];
    const playerTeamSetup = this.convertLegacyTeamToSetup(legacyPlayerTeam, 'player');
    
    // Generate bot team using new system
    const botUnitIds = generateRandomTeam(TEAM_LIMITS.BUDGET);
    const botTeamSetup = this.createTeamSetup(botUnitIds, 'bot');

    this.logger.debug(`Battle teams - Player: ${legacyPlayerTeam.join(', ')}, Bot: ${botUnitIds.join(', ')}`);

    // Generate deterministic seed for battle
    const seed = this.generateBattleSeed(playerId, legacyPlayerTeam, botUnitIds);
    
    const result = simulateBattle(playerTeamSetup, botTeamSetup, seed);

    // Map winner from simulation result to new format
    let winner: 'player1' | 'player2' | 'draw' | undefined;
    if (result.winner === 'player') {
      winner = 'player1';
    } else if (result.winner === 'bot') {
      winner = 'player2';
    } else if (result.winner === 'draw') {
      winner = 'draw';
    }

    // Update player stats
    if (result.winner === 'player') {
      await this.playerRepo.increment({ id: playerId }, 'wins', 1);
    } else if (result.winner === 'bot') {
      await this.playerRepo.increment({ id: playerId }, 'losses', 1);
    }

    // Store battle with new PvP format
    const battleLog = this.battleRepo.create({
      player1Id: playerId,
      player2Id: 'bot', // For now, bot battles use 'bot' as player2Id
      player1TeamSnapshot: playerTeamSetup,
      player2TeamSnapshot: botTeamSetup,
      seed,
      events: result.events,
      ...(winner && { winner }),
      rounds: result.metadata.totalRounds,
      status: BattleStatus.SIMULATED,
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
   * Start a new PvP battle between two players.
   * Loads active teams for both players, simulates the battle and stores the result.
   * 
   * @param player1Id - ID of the first player
   * @param player2Id - ID of the second player
   * @returns Battle log entity with complete battle data
   * @throws NotFoundException when either player is not found
   * @throws BadRequestException when either player doesn't have an active team
   * @example
   * const battle = await battleService.startPvPBattle('player-123', 'player-456');
   * console.log(battle.id); // 'battle-789'
   */
  async startPvPBattle(player1Id: string, player2Id: string): Promise<BattleLog> {
    this.logger.log(`Starting PvP battle between ${player1Id} and ${player2Id}`);

    // Fetch both players and their active teams
    const [player1, player2, player1Team, player2Team] = await Promise.all([
      this.playerRepo.findOne({ where: { id: player1Id } }),
      this.playerRepo.findOne({ where: { id: player2Id } }),
      this.teamRepo.findOne({ where: { playerId: player1Id, isActive: true } }),
      this.teamRepo.findOne({ where: { playerId: player2Id, isActive: true } })
    ]);

    if (!player1) {
      this.logger.warn(`PvP battle start failed: Player1 ${player1Id} not found`);
      throw new NotFoundException('Player1 not found');
    }

    if (!player2) {
      this.logger.warn(`PvP battle start failed: Player2 ${player2Id} not found`);
      throw new NotFoundException('Player2 not found');
    }

    if (!player1Team) {
      this.logger.warn(`PvP battle start failed: Player1 ${player1Id} has no active team`);
      throw new BadRequestException('Player1 has no active team');
    }

    if (!player2Team) {
      this.logger.warn(`PvP battle start failed: Player2 ${player2Id} has no active team`);
      throw new BadRequestException('Player2 has no active team');
    }

    // Convert team entities to TeamSetup format
    const player1TeamSetup = this.convertTeamToSetup(player1Team);
    const player2TeamSetup = this.convertTeamToSetup(player2Team);

    this.logger.debug(`PvP battle teams - Player1: ${player1Team.name}, Player2: ${player2Team.name}`);

    // Generate deterministic seed for battle
    const seed = this.generateBattleSeed(`${player1Id}-${player2Id}`, 
      player1Team.units.map(u => u.unitId), 
      player2Team.units.map(u => u.unitId));
    
    const result = simulateBattle(player1TeamSetup, player2TeamSetup, seed);

    // Map winner from simulation result to new format
    let winner: 'player1' | 'player2' | 'draw' | undefined;
    if (result.winner === 'player') {
      winner = 'player1';
    } else if (result.winner === 'bot') {
      winner = 'player2';
    } else if (result.winner === 'draw') {
      winner = 'draw';
    }

    // Update player stats
    if (result.winner === 'player') {
      await this.playerRepo.increment({ id: player1Id }, 'wins', 1);
      await this.playerRepo.increment({ id: player2Id }, 'losses', 1);
    } else if (result.winner === 'bot') {
      await this.playerRepo.increment({ id: player1Id }, 'losses', 1);
      await this.playerRepo.increment({ id: player2Id }, 'wins', 1);
    }

    // Store PvP battle
    const battleLog = this.battleRepo.create({
      player1Id,
      player2Id,
      player1TeamSnapshot: player1TeamSetup,
      player2TeamSnapshot: player2TeamSetup,
      seed,
      events: result.events,
      ...(winner && { winner }),
      rounds: result.metadata.totalRounds,
      status: BattleStatus.SIMULATED,
    });
    await this.battleRepo.save(battleLog);

    this.logger.log(`PvP battle completed`, {
      battleId: battleLog.id,
      player1Id,
      player2Id,
      winner: result.winner,
      rounds: result.metadata.totalRounds,
      durationMs: result.metadata.durationMs,
    });

    return battleLog;
  }

  /**
   * Start a new PvE battle between player and bot with specified difficulty.
   * Generates bot team based on difficulty level and simulates the battle.
   * 
   * @param playerId - ID of the player starting the battle
   * @param botDifficulty - Bot difficulty level affecting team strength
   * @returns Battle log entity with complete battle data
   * @throws NotFoundException when player is not found
   * @throws BadRequestException when player doesn't have an active team
   * @example
   * const battle = await battleService.startPvEBattle('player-123', 'hard');
   * console.log(battle.id); // 'battle-456'
   */
  async startPvEBattle(playerId: string, botDifficulty: 'easy' | 'medium' | 'hard'): Promise<BattleLog> {
    this.logger.log(`Starting PvE battle for player ${playerId} vs ${botDifficulty} bot`);

    // Fetch player and their active team
    const [player, playerTeam] = await Promise.all([
      this.playerRepo.findOne({ where: { id: playerId } }),
      this.teamRepo.findOne({ where: { playerId, isActive: true } })
    ]);

    if (!player) {
      this.logger.warn(`PvE battle start failed: Player ${playerId} not found`);
      throw new NotFoundException('Player not found');
    }

    if (!playerTeam) {
      this.logger.warn(`PvE battle start failed: Player ${playerId} has no active team`);
      throw new BadRequestException('Player has no active team');
    }

    // Convert player team to TeamSetup format
    const playerTeamSetup = this.convertTeamToSetup(playerTeam);
    
    // Generate bot team based on difficulty
    const botTeamSetup = this.generateBotTeam(botDifficulty);

    this.logger.debug(`PvE battle - Player: ${playerTeam.name}, Bot: ${botDifficulty}`);

    // Generate deterministic seed for battle
    const seed = this.generateBattleSeed(`${playerId}-bot-${botDifficulty}`, 
      playerTeam.units.map(u => u.unitId), 
      botTeamSetup.units.map(u => u.id));
    
    const result = simulateBattle(playerTeamSetup, botTeamSetup, seed);

    // Map winner from simulation result to new format
    let winner: 'player1' | 'player2' | 'draw' | undefined;
    if (result.winner === 'player') {
      winner = 'player1';
    } else if (result.winner === 'bot') {
      winner = 'player2';
    } else if (result.winner === 'draw') {
      winner = 'draw';
    }

    // Update player stats
    if (result.winner === 'player') {
      await this.playerRepo.increment({ id: playerId }, 'wins', 1);
    } else if (result.winner === 'bot') {
      await this.playerRepo.increment({ id: playerId }, 'losses', 1);
    }

    // Store PvE battle (bot as player2Id)
    const battleLog = this.battleRepo.create({
      player1Id: playerId,
      player2Id: `bot-${botDifficulty}`,
      player1TeamSnapshot: playerTeamSetup,
      player2TeamSnapshot: botTeamSetup,
      seed,
      events: result.events,
      ...(winner && { winner }),
      rounds: result.metadata.totalRounds,
      status: BattleStatus.SIMULATED,
    });
    await this.battleRepo.save(battleLog);

    this.logger.log(`PvE battle completed`, {
      battleId: battleLog.id,
      playerId,
      botDifficulty,
      winner: result.winner,
      rounds: result.metadata.totalRounds,
      durationMs: result.metadata.durationMs,
    });

    return battleLog;
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
   * const battles = await battleService.getBattlesForPlayer('player-123');
   */
  async getBattlesForPlayer(playerId: string): Promise<BattleLog[]> {
    this.logger.debug(`Retrieving battle history for player ${playerId}`);
    
    return this.battleRepo.find({
      where: [
        { player1Id: playerId },
        { player2Id: playerId }
      ],
      order: { createdAt: 'DESC' },
      take: GAMEPLAY_VALUES.BATTLE_HISTORY_LIMIT,
    });
  }

  /**
   * Mark a battle as viewed by a player.
   * Updates the viewed status for the specific player.
   * 
   * @param battleId - ID of the battle
   * @param playerId - ID of the player who viewed the battle
   * @throws NotFoundException when battle is not found or player is not a participant
   * @example
   * await battleService.markAsViewed('battle-123', 'player-456');
   */
  async markAsViewed(battleId: string, playerId: string): Promise<void> {
    const battle = await this.battleRepo.findOne({ where: { id: battleId } });

    if (!battle) {
      this.logger.warn(`Mark viewed failed: Battle ${battleId} not found`);
      throw new NotFoundException('Battle not found');
    }

    if (!battle.isParticipant(playerId)) {
      this.logger.warn(`Mark viewed failed: Player ${playerId} is not a participant in battle ${battleId}`);
      throw new NotFoundException('Player is not a participant in this battle');
    }

    battle.markAsViewed(playerId);
    await this.battleRepo.save(battle);

    this.logger.debug(`Battle ${battleId} marked as viewed by player ${playerId}`);
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Convert Team entity to TeamSetup format for battle simulation.
   * Maps team units with their positions to battle simulator format.
   * 
   * @param team - Team entity with units and positions
   * @returns TeamSetup with units and positions for battle simulation
   * @example
   * const setup = this.convertTeamToSetup(playerTeam);
   */
  private convertTeamToSetup(team: Team): TeamSetup {
    const units = team.units.map(teamUnit => {
      const template = getUnitTemplate(teamUnit.unitId as UnitId);
      if (!template) {
        throw new Error(`Unit template not found for unit ID: ${teamUnit.unitId}`);
      }
      return template;
    });

    // Use positions from team configuration
    const positions = team.units.map(teamUnit => teamUnit.position);

    return { units, positions };
  }

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
  private convertLegacyTeamToSetup(legacyTeam: string[], teamType: 'player' | 'bot'): TeamSetup {
    const unitMapping: Record<string, UnitId> = {
      'Warrior': 'knight',
      'Mage': 'mage', 
      'Healer': 'priest',
    };

    const units = legacyTeam.map(legacyType => {
      const unitId = unitMapping[legacyType];
      if (!unitId) {
        throw new Error(`Unknown legacy unit type: ${legacyType}`);
      }
      const template = getUnitTemplate(unitId);
      if (!template) {
        throw new Error(`Unit template not found for unit ID: ${unitId}`);
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
   * Generate bot team based on difficulty level.
   * Creates balanced teams with varying strength based on difficulty.
   * 
   * @param difficulty - Bot difficulty level
   * @returns TeamSetup with bot units and positions
   * @example
   * const botTeam = this.generateBotTeam('hard');
   */
  private generateBotTeam(difficulty: 'easy' | 'medium' | 'hard'): TeamSetup {
    // Adjust budget based on difficulty
    const budgetMultipliers = {
      easy: 0.7,    // 21 points (70% of player budget)
      medium: 0.85, // 25.5 points (85% of player budget)
      hard: 1.0,    // 30 points (100% of player budget)
    };

    const botBudget = Math.floor(TEAM_LIMITS.BUDGET * budgetMultipliers[difficulty]);
    
    // Generate random team within budget
    const botUnitIds = generateRandomTeam(botBudget);
    
    this.logger.debug(`Generated ${difficulty} bot team with ${botBudget} budget: ${botUnitIds.join(', ')}`);
    
    return this.createTeamSetup(botUnitIds, 'bot');
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
  private generateBattleSeed(playerId: string, playerTeam: (string | UnitId)[], botTeam: (string | UnitId)[]): number {
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
