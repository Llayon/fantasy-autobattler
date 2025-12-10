export type UnitType = 'Warrior' | 'Mage' | 'Healer';

export interface UnitStats {
  type: UnitType;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export const UNIT_TEMPLATES: Record<UnitType, Omit<UnitStats, 'maxHp'>> = {
  Warrior: { type: 'Warrior', hp: 100, atk: 15, def: 10, spd: 5 },
  Mage: { type: 'Mage', hp: 60, atk: 25, def: 3, spd: 8 },
  Healer: { type: 'Healer', hp: 70, atk: 8, def: 5, spd: 10 },
};

export function createUnit(type: UnitType): UnitStats {
  const template = UNIT_TEMPLATES[type];
  return { ...template, maxHp: template.hp };
}

export function getRandomTeam(): UnitType[] {
  const types: UnitType[] = ['Warrior', 'Mage', 'Healer'];
  const team: UnitType[] = [];
  for (let i = 0; i < 3; i++) {
    team.push(types[Math.floor(Math.random() * types.length)]);
  }
  return team;
}
