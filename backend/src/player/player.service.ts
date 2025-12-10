import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { UnitType, UNIT_TEMPLATES } from '../unit/unit.data';

@Injectable()
export class PlayerService {
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
}
