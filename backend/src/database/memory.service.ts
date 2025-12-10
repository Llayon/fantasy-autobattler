import { Injectable } from '@nestjs/common';
import { UnitType } from '../unit/unit.data';

export interface Player {
  id: string;
  guestId: string;
  name: string;
  team: UnitType[];
  wins: number;
  losses: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleLog {
  id: string;
  playerId: string;
  playerTeam: any;
  botTeam: any;
  events: any;
  winner: string;
  createdAt: Date;
}

@Injectable()
export class MemoryService {
  private players: Map<string, Player> = new Map();
  private battles: Map<string, BattleLog> = new Map();

  // Player methods
  async createPlayer(data: Omit<Player, 'createdAt' | 'updatedAt'>): Promise<Player> {
    const player: Player = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.players.set(player.id, player);
    return player;
  }

  async findPlayerById(id: string): Promise<Player | null> {
    return this.players.get(id) || null;
  }

  async findPlayerByGuestId(guestId: string): Promise<Player | null> {
    for (const player of this.players.values()) {
      if (player.guestId === guestId) return player;
    }
    return null;
  }

  async updatePlayer(id: string, data: Partial<Player>): Promise<Player | null> {
    const player = this.players.get(id);
    if (!player) return null;
    
    const updated = { ...player, ...data, updatedAt: new Date() };
    this.players.set(id, updated);
    return updated;
  }

  // Battle methods
  async createBattle(data: Omit<BattleLog, 'createdAt'>): Promise<BattleLog> {
    const battle: BattleLog = {
      ...data,
      createdAt: new Date(),
    };
    this.battles.set(battle.id, battle);
    return battle;
  }

  async findBattleById(id: string): Promise<BattleLog | null> {
    return this.battles.get(id) || null;
  }

  async findBattlesByPlayerId(playerId: string): Promise<BattleLog[]> {
    return Array.from(this.battles.values())
      .filter(battle => battle.playerId === playerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }
}