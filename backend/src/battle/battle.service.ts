import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BattleLog } from '../entities/battle-log.entity';
import { Player } from '../entities/player.entity';
import { simulateBattle } from './battle.simulator';
import { getRandomTeam, UnitType } from '../unit/unit.data';
import { GAMEPLAY_VALUES } from '../config/game.constants';

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

    const playerTeam = player.team as UnitType[];
    const botTeam = getRandomTeam();

    this.logger.debug(`Battle teams - Player: ${playerTeam.join(', ')}, Bot: ${botTeam.join(', ')}`);

    const result = simulateBattle(playerTeam, botTeam);

    // Update player stats
    if (result.winner === 'player') {
      await this.playerRepo.increment({ id: playerId }, 'wins', 1);
    } else if (result.winner === 'bot') {
      await this.playerRepo.increment({ id: playerId }, 'losses', 1);
    }

    const battleLog = this.battleRepo.create({
      playerId,
      playerTeam: result.playerTeam,
      botTeam: result.botTeam,
      events: result.events,
      winner: result.winner,
    });
    await this.battleRepo.save(battleLog);

    this.logger.log(`Battle completed`, {
      battleId: battleLog.id,
      playerId,
      winner: result.winner,
      rounds: result.events.length > 0 ? Math.max(...result.events.map(e => e.round)) : 0,
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
}
