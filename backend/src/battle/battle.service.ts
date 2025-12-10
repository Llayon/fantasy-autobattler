import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BattleLog } from '../entities/battle-log.entity';
import { Player } from '../entities/player.entity';
import { simulateBattle } from './battle.simulator';
import { getRandomTeam, UnitType } from '../unit/unit.data';

@Injectable()
export class BattleService {
  constructor(
    @InjectRepository(BattleLog)
    private battleRepo: Repository<BattleLog>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  async startBattle(playerId: string) {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const playerTeam = player.team as UnitType[];
    const botTeam = getRandomTeam();

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

    return { battleId: battleLog.id };
  }

  async getBattle(battleId: string) {
    const battle = await this.battleRepo.findOne({ where: { id: battleId } });

    if (!battle) {
      throw new NotFoundException('Battle not found');
    }

    return battle;
  }

  async getPlayerBattles(playerId: string) {
    return this.battleRepo.find({
      where: { playerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}
