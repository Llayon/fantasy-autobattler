/**
 * Humans Faction Units Data
 *
 * 12 T1 units with T2/T3 upgrade paths for the Humans faction.
 * Faction bonus: +10% HP to all units.
 *
 * @module roguelike/data/humans.units
 */

import {
  RoguelikeUnit,
  UnitUpgradeLine,
  calculateUpgradeCost,
  TIER_STAT_MULTIPLIERS,
} from '../types/unit.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create T2 unit from T1 base.
 * Applies +50% stat multiplier and upgrade cost.
 */
function createT2(t1: RoguelikeUnit, name: string, nameRu: string): RoguelikeUnit {
  const mult = TIER_STAT_MULTIPLIERS[2];
  return {
    ...t1,
    id: `${t1.id}_t2`,
    name,
    nameRu,
    tier: 2,
    purchasable: false,
    upgradeCost: calculateUpgradeCost(t1.cost, 2),
    baseUnitId: t1.id,
    hp: Math.round(t1.hp * mult),
    atk: Math.round(t1.atk * mult),
    armor: Math.round(t1.armor * mult),
    resolve: t1.resolve + 15,
    resolveResist: t1.resolveResist + 10,
  };
}

/**
 * Create T3 unit from T1 base.
 * Applies +100% stat multiplier, upgrade cost, and ability.
 */
function createT3(
  t1: RoguelikeUnit,
  name: string,
  nameRu: string,
  abilityId: string,
  extraStats?: Partial<RoguelikeUnit>,
): RoguelikeUnit {
  const mult = TIER_STAT_MULTIPLIERS[3];
  return {
    ...t1,
    id: `${t1.id}_t3`,
    name,
    nameRu,
    tier: 3,
    purchasable: false,
    upgradeCost: calculateUpgradeCost(t1.cost, 3),
    baseUnitId: t1.id,
    abilityId,
    hp: Math.round(t1.hp * mult),
    atk: Math.round(t1.atk * mult),
    armor: Math.round(t1.armor * mult),
    resolve: Math.min(100, t1.resolve + 30),
    resolveResist: Math.min(50, t1.resolveResist + 20),
    ...extraStats,
  };
}

// ============================================================================
// TANKS (3 lines)
// ============================================================================

/** Footman T1 - Basic tank */
export const FOOTMAN_T1: RoguelikeUnit = {
  id: 'footman',
  name: 'Footman',
  nameRu: 'Пехотинец',
  faction: 'humans',
  role: 'tank',
  tier: 1,
  cost: 3,
  purchasable: true,
  hp: 100,
  atk: 12,
  armor: 20,
  speed: 2,
  initiative: 8,
  range: 1,
  attackCount: 1,
  dodge: 5,
  resolve: 80,
  resolveResist: 0,
  description: 'Basic infantry unit with shield',
  descriptionRu: 'Базовый пехотный юнит со щитом',
};

export const FOOTMAN_T2 = createT2(FOOTMAN_T1, 'Veteran Footman', 'Ветеран-пехотинец');
export const FOOTMAN_T3 = createT3(FOOTMAN_T1, 'Shield Master', 'Мастер щита', 'shield_wall');

export const FOOTMAN_LINE: UnitUpgradeLine = {
  baseId: 'footman',
  t1: FOOTMAN_T1,
  t2: FOOTMAN_T2,
  t3: FOOTMAN_T3,
};

/** Knight T1 - Heavy tank */
export const KNIGHT_T1: RoguelikeUnit = {
  id: 'knight',
  name: 'Knight',
  nameRu: 'Рыцарь',
  faction: 'humans',
  role: 'tank',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 140,
  atk: 16,
  armor: 28,
  speed: 2,
  initiative: 10,
  range: 1,
  attackCount: 1,
  dodge: 8,
  resolve: 85,
  resolveResist: 0,
  description: 'Armored knight with high defense',
  descriptionRu: 'Бронированный рыцарь с высокой защитой',
};

export const KNIGHT_T2 = createT2(KNIGHT_T1, 'Veteran Knight', 'Ветеран-рыцарь');
export const KNIGHT_T3 = createT3(KNIGHT_T1, 'Royal Guard', 'Королевский страж', 'taunt');

export const KNIGHT_LINE: UnitUpgradeLine = {
  baseId: 'knight',
  t1: KNIGHT_T1,
  t2: KNIGHT_T2,
  t3: KNIGHT_T3,
};

/** Paladin T1 - Elite tank */
export const PALADIN_T1: RoguelikeUnit = {
  id: 'paladin',
  name: 'Paladin',
  nameRu: 'Паладин',
  faction: 'humans',
  role: 'tank',
  tier: 1,
  cost: 7,
  purchasable: true,
  hp: 200,
  atk: 22,
  armor: 40,
  speed: 2,
  initiative: 12,
  range: 1,
  attackCount: 1,
  dodge: 10,
  resolve: 90,
  resolveResist: 0,
  description: 'Holy warrior with divine protection',
  descriptionRu: 'Святой воин с божественной защитой',
};

export const PALADIN_T2 = createT2(PALADIN_T1, 'Veteran Paladin', 'Ветеран-паладин');
export const PALADIN_T3 = createT3(PALADIN_T1, 'Grand Paladin', 'Великий паладин', 'divine_shield');

export const PALADIN_LINE: UnitUpgradeLine = {
  baseId: 'paladin',
  t1: PALADIN_T1,
  t2: PALADIN_T2,
  t3: PALADIN_T3,
};

// ============================================================================
// MELEE DPS (3 lines)
// ============================================================================

/** Swordsman T1 - Basic melee DPS */
export const SWORDSMAN_T1: RoguelikeUnit = {
  id: 'swordsman',
  name: 'Swordsman',
  nameRu: 'Мечник',
  faction: 'humans',
  role: 'melee_dps',
  tier: 1,
  cost: 3,
  purchasable: true,
  hp: 65,
  atk: 18,
  armor: 8,
  speed: 3,
  initiative: 12,
  range: 1,
  attackCount: 1,
  dodge: 10,
  resolve: 60,
  resolveResist: 0,
  description: 'Fast melee fighter',
  descriptionRu: 'Быстрый боец ближнего боя',
};

export const SWORDSMAN_T2 = createT2(SWORDSMAN_T1, 'Veteran Swordsman', 'Ветеран-мечник');
export const SWORDSMAN_T3 = createT3(SWORDSMAN_T1, 'Blade Master', 'Мастер клинка', 'cleave');

export const SWORDSMAN_LINE: UnitUpgradeLine = {
  baseId: 'swordsman',
  t1: SWORDSMAN_T1,
  t2: SWORDSMAN_T2,
  t3: SWORDSMAN_T3,
};

/** Crusader T1 - Heavy melee DPS */
export const CRUSADER_T1: RoguelikeUnit = {
  id: 'crusader',
  name: 'Crusader',
  nameRu: 'Крестоносец',
  faction: 'humans',
  role: 'melee_dps',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 85,
  atk: 26,
  armor: 12,
  speed: 3,
  initiative: 15,
  range: 1,
  attackCount: 1,
  dodge: 12,
  resolve: 75,
  resolveResist: 0,
  description: 'Zealous warrior with high damage',
  descriptionRu: 'Ревностный воин с высоким уроном',
};

export const CRUSADER_T2 = createT2(CRUSADER_T1, 'Veteran Crusader', 'Ветеран-крестоносец');
export const CRUSADER_T3 = createT3(CRUSADER_T1, 'Holy Crusader', 'Святой крестоносец', 'zealous_strike');

export const CRUSADER_LINE: UnitUpgradeLine = {
  baseId: 'crusader',
  t1: CRUSADER_T1,
  t2: CRUSADER_T2,
  t3: CRUSADER_T3,
};

/** Champion T1 - Elite melee DPS */
export const CHAMPION_T1: RoguelikeUnit = {
  id: 'champion',
  name: 'Champion',
  nameRu: 'Чемпион',
  faction: 'humans',
  role: 'melee_dps',
  tier: 1,
  cost: 8,
  purchasable: true,
  hp: 110,
  atk: 38,
  armor: 16,
  speed: 3,
  initiative: 18,
  range: 1,
  attackCount: 2,
  dodge: 15,
  resolve: 80,
  resolveResist: 0,
  description: 'Elite warrior with double attacks',
  descriptionRu: 'Элитный воин с двойными атаками',
};

export const CHAMPION_T2 = createT2(CHAMPION_T1, 'Veteran Champion', 'Ветеран-чемпион');
export const CHAMPION_T3 = createT3(CHAMPION_T1, 'Grand Champion', 'Великий чемпион', 'whirlwind');

export const CHAMPION_LINE: UnitUpgradeLine = {
  baseId: 'champion',
  t1: CHAMPION_T1,
  t2: CHAMPION_T2,
  t3: CHAMPION_T3,
};

// ============================================================================
// RANGED DPS (3 lines)
// ============================================================================

/** Archer T1 - Basic ranged DPS */
export const ARCHER_T1: RoguelikeUnit = {
  id: 'archer',
  name: 'Archer',
  nameRu: 'Лучник',
  faction: 'humans',
  role: 'ranged_dps',
  tier: 1,
  cost: 4,
  purchasable: true,
  hp: 50,
  atk: 16,
  armor: 4,
  speed: 2,
  initiative: 14,
  range: 4,
  attackCount: 1,
  dodge: 8,
  resolve: 55,
  resolveResist: 0,
  description: 'Basic ranged attacker',
  descriptionRu: 'Базовый стрелок',
};

export const ARCHER_T2 = createT2(ARCHER_T1, 'Veteran Archer', 'Ветеран-лучник');
export const ARCHER_T3 = createT3(ARCHER_T1, 'Longbowman', 'Длиннолучник', 'volley', { range: 5 });

export const ARCHER_LINE: UnitUpgradeLine = {
  baseId: 'archer',
  t1: ARCHER_T1,
  t2: ARCHER_T2,
  t3: ARCHER_T3,
};

/** Crossbowman T1 - Heavy ranged DPS */
export const CROSSBOWMAN_T1: RoguelikeUnit = {
  id: 'crossbowman',
  name: 'Crossbowman',
  nameRu: 'Арбалетчик',
  faction: 'humans',
  role: 'ranged_dps',
  tier: 1,
  cost: 6,
  purchasable: true,
  hp: 65,
  atk: 24,
  armor: 6,
  speed: 2,
  initiative: 16,
  range: 5,
  attackCount: 1,
  dodge: 10,
  resolve: 65,
  resolveResist: 0,
  description: 'Armor-piercing ranged attacker',
  descriptionRu: 'Стрелок с бронебойными болтами',
};

export const CROSSBOWMAN_T2 = createT2(CROSSBOWMAN_T1, 'Veteran Crossbowman', 'Ветеран-арбалетчик');
export const CROSSBOWMAN_T3 = createT3(
  CROSSBOWMAN_T1,
  'Siege Crossbowman',
  'Осадный арбалетчик',
  'piercing_shot',
  { range: 6 },
);

export const CROSSBOWMAN_LINE: UnitUpgradeLine = {
  baseId: 'crossbowman',
  t1: CROSSBOWMAN_T1,
  t2: CROSSBOWMAN_T2,
  t3: CROSSBOWMAN_T3,
};

/** Marksman T1 - Elite ranged DPS */
export const MARKSMAN_T1: RoguelikeUnit = {
  id: 'marksman',
  name: 'Marksman',
  nameRu: 'Стрелок',
  faction: 'humans',
  role: 'ranged_dps',
  tier: 1,
  cost: 8,
  purchasable: true,
  hp: 80,
  atk: 35,
  armor: 8,
  speed: 2,
  initiative: 20,
  range: 6,
  attackCount: 1,
  dodge: 12,
  resolve: 70,
  resolveResist: 0,
  description: 'Elite sniper with long range',
  descriptionRu: 'Элитный снайпер с большой дальностью',
};

export const MARKSMAN_T2 = createT2(MARKSMAN_T1, 'Veteran Marksman', 'Ветеран-стрелок');
export const MARKSMAN_T3 = createT3(MARKSMAN_T1, 'Sniper', 'Снайпер', 'headshot', { range: 7 });

export const MARKSMAN_LINE: UnitUpgradeLine = {
  baseId: 'marksman',
  t1: MARKSMAN_T1,
  t2: MARKSMAN_T2,
  t3: MARKSMAN_T3,
};

// ============================================================================
// MAGES (2 lines)
// ============================================================================

/** Apprentice T1 - Basic mage */
export const APPRENTICE_T1: RoguelikeUnit = {
  id: 'apprentice',
  name: 'Apprentice',
  nameRu: 'Ученик',
  faction: 'humans',
  role: 'mage',
  tier: 1,
  cost: 4,
  purchasable: true,
  hp: 45,
  atk: 20,
  armor: 2,
  speed: 2,
  initiative: 10,
  range: 3,
  attackCount: 1,
  dodge: 5,
  resolve: 50,
  resolveResist: 0,
  description: 'Novice magic user',
  descriptionRu: 'Начинающий маг',
};

export const APPRENTICE_T2 = createT2(APPRENTICE_T1, 'Mage', 'Маг');
export const APPRENTICE_T3 = createT3(APPRENTICE_T1, 'Archmage', 'Архимаг', 'fireball', { range: 4 });

export const APPRENTICE_LINE: UnitUpgradeLine = {
  baseId: 'apprentice',
  t1: APPRENTICE_T1,
  t2: APPRENTICE_T2,
  t3: APPRENTICE_T3,
};

/** Battle Mage T1 - Combat mage */
export const BATTLE_MAGE_T1: RoguelikeUnit = {
  id: 'battle_mage',
  name: 'Battle Mage',
  nameRu: 'Боевой маг',
  faction: 'humans',
  role: 'mage',
  tier: 1,
  cost: 6,
  purchasable: true,
  hp: 60,
  atk: 32,
  armor: 4,
  speed: 2,
  initiative: 13,
  range: 4,
  attackCount: 1,
  dodge: 8,
  resolve: 65,
  resolveResist: 0,
  description: 'Combat-trained spellcaster',
  descriptionRu: 'Заклинатель, обученный бою',
};

export const BATTLE_MAGE_T2 = createT2(BATTLE_MAGE_T1, 'War Mage', 'Военный маг');
export const BATTLE_MAGE_T3 = createT3(
  BATTLE_MAGE_T1,
  'Battlemage Lord',
  'Лорд боевых магов',
  'chain_lightning',
  { range: 5 },
);

export const BATTLE_MAGE_LINE: UnitUpgradeLine = {
  baseId: 'battle_mage',
  t1: BATTLE_MAGE_T1,
  t2: BATTLE_MAGE_T2,
  t3: BATTLE_MAGE_T3,
};

// ============================================================================
// SUPPORT (1 line)
// ============================================================================

/** Priest T1 - Healer with Support Aura */
export const PRIEST_T1: RoguelikeUnit = {
  id: 'priest',
  name: 'Priest',
  nameRu: 'Жрец',
  faction: 'humans',
  role: 'support',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 55,
  atk: 10,
  armor: 6,
  speed: 2,
  initiative: 6,
  range: 3,
  attackCount: 1,
  dodge: 5,
  resolve: 70,
  resolveResist: 0,
  resolveTrait: 'inspiring',
  description: 'Healer with Support Aura (+8 Resolve/turn to allies within 2 cells)',
  descriptionRu: 'Целитель с аурой поддержки (+8 Решимости/ход союзникам в 2 клетках)',
};

export const PRIEST_T2 = createT2(PRIEST_T1, 'High Priest', 'Верховный жрец');
export const PRIEST_T3 = createT3(PRIEST_T1, 'Archbishop', 'Архиепископ', 'mass_heal', { range: 4 });

export const PRIEST_LINE: UnitUpgradeLine = {
  baseId: 'priest',
  t1: PRIEST_T1,
  t2: PRIEST_T2,
  t3: PRIEST_T3,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All Humans T1 units (purchasable).
 */
export const HUMANS_T1_UNITS: RoguelikeUnit[] = [
  FOOTMAN_T1,
  KNIGHT_T1,
  PALADIN_T1,
  SWORDSMAN_T1,
  CRUSADER_T1,
  CHAMPION_T1,
  ARCHER_T1,
  CROSSBOWMAN_T1,
  MARKSMAN_T1,
  APPRENTICE_T1,
  BATTLE_MAGE_T1,
  PRIEST_T1,
];

/**
 * All Humans unit upgrade lines.
 */
export const HUMANS_UPGRADE_LINES: UnitUpgradeLine[] = [
  FOOTMAN_LINE,
  KNIGHT_LINE,
  PALADIN_LINE,
  SWORDSMAN_LINE,
  CRUSADER_LINE,
  CHAMPION_LINE,
  ARCHER_LINE,
  CROSSBOWMAN_LINE,
  MARKSMAN_LINE,
  APPRENTICE_LINE,
  BATTLE_MAGE_LINE,
  PRIEST_LINE,
];

/**
 * All Humans units (all tiers).
 */
export const HUMANS_ALL_UNITS: RoguelikeUnit[] = HUMANS_UPGRADE_LINES.flatMap((line) => [
  line.t1,
  line.t2,
  line.t3,
]);
