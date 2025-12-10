export type UnitType = 'Warrior' | 'Mage' | 'Healer';

export interface UnitStats {
  type: UnitType;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Player {
  id: string;
  guestId: string;
  name: string;
  team: UnitType[];
  wins: number;
  losses: number;
}

export interface BattleEvent {
  round: number;
  actor: string;
  action: 'attack' | 'heal' | 'splash';
  target?: string;
  targets?: string[];
  damage?: number;
  damages?: number[];
  value?: number;
  killed?: string[];
}

export interface BattleLog {
  id: string;
  playerId: string;
  playerTeam: UnitStats[];
  botTeam: UnitStats[];
  events: BattleEvent[];
  winner: 'player' | 'bot' | 'draw';
  createdAt: string;
}

export const UNIT_INFO: Record<UnitType, { emoji: string; color: string; description: string }> = {
  Warrior: { emoji: '⚔️', color: 'bg-red-600', description: 'High HP & DEF. Taunts enemies.' },
  Mage: { emoji: '🔮', color: 'bg-purple-600', description: 'High ATK. Hits 2 enemies.' },
  Healer: { emoji: '💚', color: 'bg-green-600', description: 'Heals lowest HP ally.' },
};
