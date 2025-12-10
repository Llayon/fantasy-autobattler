import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  async createGuestPlayer() {
    const guestId = uuidv4();
    const player = this.playerRepo.create({
      guestId,
      name: `Guest_${guestId.slice(0, 6)}`,
      team: ['Warrior', 'Mage', 'Healer'],
    });
    await this.playerRepo.save(player);
    return { playerId: player.id, token: guestId };
  }

  async validateGuestToken(token: string) {
    return this.playerRepo.findOne({ where: { guestId: token } });
  }
}
