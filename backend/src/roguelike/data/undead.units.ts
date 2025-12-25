/**
 * Undead Faction Units Data
 *
 * 12 T1 units with T2/T3 upgrade paths for the Undead faction.
 * Faction bonus: +15% ATK to all units.
 * All undead have 100 resolve and cannot self-recover.
 *
 * @module roguelike/data/undead.units
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
 * Undead maintain 100 resolve at all tiers.
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
    resolve: 100, // Undead always have 100 resolve
    resolveResist: 0,
  };
}

/**
 * Create T3 unit from T1 base.
 * Applies +100% stat multiplier, upgrade cost, and ability.
 * Undead maintain 100 resolve at all tiers.
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
    resolve: 100, // Undead always have 100 resolve
    resolveResist: 0,
    ...extraStats,
  };
}

// ============================================================================
// TANKS (3 lines)
// ============================================================================

/** Zombie T1 - Basic tank, slow but durable */
export const ZOMBIE_T1: RoguelikeUnit = {
  id: 'zombie',
  name: 'Zombie',
  nameRu: 'Зомби',
  faction: 'undead',
  role: 'tank',
  tier: 1,
  cost: 3,
  purchasable: true,
  hp: 120,
  atk: 10,
  armor: 12,
  speed: 1,
  initiative: 4,
  range: 1,
  attackCount: 1,
  dodge: 0,
  resolve: 100,
  resolveResist: 0,
  description: 'Slow but durable undead',
  descriptionRu: 'Медленная, но прочная нежить',
};

export const ZOMBIE_T2 = createT2(ZOMBIE_T1, 'Bloated Zombie', 'Раздутый зомби');
export const ZOMBIE_T3 = createT3(ZOMBIE_T1, 'Plague Zombie', 'Чумной зомби', 'plague');

export const ZOMBIE_LINE: UnitUpgradeLine = {
  baseId: 'zombie',
  t1: ZOMBIE_T1,
  t2: ZOMBIE_T2,
  t3: ZOMBIE_T3,
};

/** Abomination T1 - Heavy tank */
export const ABOMINATION_T1: RoguelikeUnit = {
  id: 'abomination',
  name: 'Abomination',
  nameRu: 'Мерзость',
  faction: 'undead',
  role: 'tank',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 170,
  atk: 14,
  armor: 18,
  speed: 1,
  initiative: 5,
  range: 1,
  attackCount: 1,
  dodge: 0,
  resolve: 100,
  resolveResist: 0,
  description: 'Massive stitched horror',
  descriptionRu: 'Огромный сшитый ужас',
};

export const ABOMINATION_T2 = createT2(ABOMINATION_T1, 'Greater Abomination', 'Великая мерзость');
export const ABOMINATION_T3 = createT3(ABOMINATION_T1, 'Flesh Titan', 'Титан плоти', 'hook');

export const ABOMINATION_LINE: UnitUpgradeLine = {
  baseId: 'abomination',
  t1: ABOMINATION_T1,
  t2: ABOMINATION_T2,
  t3: ABOMINATION_T3,
};

/** Bone Golem T1 - Elite tank */
export const BONE_GOLEM_T1: RoguelikeUnit = {
  id: 'bone_golem',
  name: 'Bone Golem',
  nameRu: 'Костяной голем',
  faction: 'undead',
  role: 'tank',
  tier: 1,
  cost: 7,
  purchasable: true,
  hp: 240,
  atk: 20,
  armor: 25,
  speed: 1,
  initiative: 6,
  range: 1,
  attackCount: 1,
  dodge: 0,
  resolve: 100,
  resolveResist: 0,
  description: 'Construct of animated bones',
  descriptionRu: 'Конструкт из оживлённых костей',
};

export const BONE_GOLEM_T2 = createT2(BONE_GOLEM_T1, 'Greater Bone Golem', 'Великий костяной голем');
export const BONE_GOLEM_T3 = createT3(BONE_GOLEM_T1, 'Bone Colossus', 'Костяной колосс', 'bone_armor');

export const BONE_GOLEM_LINE: UnitUpgradeLine = {
  baseId: 'bone_golem',
  t1: BONE_GOLEM_T1,
  t2: BONE_GOLEM_T2,
  t3: BONE_GOLEM_T3,
};

// ============================================================================
// MELEE DPS (3 lines)
// ============================================================================

/** Skeleton Warrior T1 - Basic melee DPS */
export const SKELETON_WARRIOR_T1: RoguelikeUnit = {
  id: 'skeleton_warrior',
  name: 'Skeleton Warrior',
  nameRu: 'Скелет-воин',
  faction: 'undead',
  role: 'melee_dps',
  tier: 1,
  cost: 3,
  purchasable: true,
  hp: 50,
  atk: 20,
  armor: 5,
  speed: 3,
  initiative: 14,
  range: 1,
  attackCount: 1,
  dodge: 15,
  resolve: 100,
  resolveResist: 0,
  description: 'Fast skeletal fighter',
  descriptionRu: 'Быстрый скелет-боец',
};

export const SKELETON_WARRIOR_T2 = createT2(
  SKELETON_WARRIOR_T1,
  'Skeleton Champion',
  'Скелет-чемпион',
);
export const SKELETON_WARRIOR_T3 = createT3(
  SKELETON_WARRIOR_T1,
  'Bone Lord',
  'Костяной лорд',
  'bone_spear',
);

export const SKELETON_WARRIOR_LINE: UnitUpgradeLine = {
  baseId: 'skeleton_warrior',
  t1: SKELETON_WARRIOR_T1,
  t2: SKELETON_WARRIOR_T2,
  t3: SKELETON_WARRIOR_T3,
};

/** Ghoul T1 - Fast melee DPS with multiple attacks */
export const GHOUL_T1: RoguelikeUnit = {
  id: 'ghoul',
  name: 'Ghoul',
  nameRu: 'Упырь',
  faction: 'undead',
  role: 'melee_dps',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 70,
  atk: 30,
  armor: 8,
  speed: 4,
  initiative: 18,
  range: 1,
  attackCount: 2,
  dodge: 18,
  resolve: 100,
  resolveResist: 0,
  description: 'Ravenous undead with double attacks',
  descriptionRu: 'Прожорливая нежить с двойными атаками',
};

export const GHOUL_T2 = createT2(GHOUL_T1, 'Crypt Ghoul', 'Склепный упырь');
export const GHOUL_T3 = createT3(GHOUL_T1, 'Ghoul King', 'Король упырей', 'frenzy', {
  attackCount: 3,
});

export const GHOUL_LINE: UnitUpgradeLine = {
  baseId: 'ghoul',
  t1: GHOUL_T1,
  t2: GHOUL_T2,
  t3: GHOUL_T3,
};

/** Death Knight T1 - Elite melee DPS */
export const DEATH_KNIGHT_T1: RoguelikeUnit = {
  id: 'death_knight',
  name: 'Death Knight',
  nameRu: 'Рыцарь смерти',
  faction: 'undead',
  role: 'melee_dps',
  tier: 1,
  cost: 8,
  purchasable: true,
  hp: 95,
  atk: 45,
  armor: 14,
  speed: 3,
  initiative: 20,
  range: 1,
  attackCount: 2,
  dodge: 20,
  resolve: 100,
  resolveResist: 0,
  description: 'Fallen knight with devastating attacks',
  descriptionRu: 'Падший рыцарь с разрушительными атаками',
};

export const DEATH_KNIGHT_T2 = createT2(DEATH_KNIGHT_T1, 'Doom Knight', 'Рыцарь рока');
export const DEATH_KNIGHT_T3 = createT3(
  DEATH_KNIGHT_T1,
  'Horseman of Death',
  'Всадник смерти',
  'death_strike',
);

export const DEATH_KNIGHT_LINE: UnitUpgradeLine = {
  baseId: 'death_knight',
  t1: DEATH_KNIGHT_T1,
  t2: DEATH_KNIGHT_T2,
  t3: DEATH_KNIGHT_T3,
};

// ============================================================================
// RANGED DPS (3 lines)
// ============================================================================

/** Skeleton Archer T1 - Basic ranged DPS */
export const SKELETON_ARCHER_T1: RoguelikeUnit = {
  id: 'skeleton_archer',
  name: 'Skeleton Archer',
  nameRu: 'Скелет-лучник',
  faction: 'undead',
  role: 'ranged_dps',
  tier: 1,
  cost: 4,
  purchasable: true,
  hp: 40,
  atk: 18,
  armor: 2,
  speed: 2,
  initiative: 12,
  range: 4,
  attackCount: 1,
  dodge: 12,
  resolve: 100,
  resolveResist: 0,
  description: 'Skeletal ranged attacker',
  descriptionRu: 'Скелет-стрелок',
};

export const SKELETON_ARCHER_T2 = createT2(
  SKELETON_ARCHER_T1,
  'Skeleton Marksman',
  'Скелет-стрелок',
);
export const SKELETON_ARCHER_T3 = createT3(
  SKELETON_ARCHER_T1,
  'Bone Sniper',
  'Костяной снайпер',
  'poison_arrow',
  { range: 5 },
);

export const SKELETON_ARCHER_LINE: UnitUpgradeLine = {
  baseId: 'skeleton_archer',
  t1: SKELETON_ARCHER_T1,
  t2: SKELETON_ARCHER_T2,
  t3: SKELETON_ARCHER_T3,
};

/** Banshee T1 - Spectral ranged DPS */
export const BANSHEE_T1: RoguelikeUnit = {
  id: 'banshee',
  name: 'Banshee',
  nameRu: 'Банши',
  faction: 'undead',
  role: 'ranged_dps',
  tier: 1,
  cost: 6,
  purchasable: true,
  hp: 55,
  atk: 28,
  armor: 3,
  speed: 2,
  initiative: 15,
  range: 4,
  attackCount: 1,
  dodge: 20,
  resolve: 100,
  resolveResist: 0,
  description: 'Wailing spirit with piercing screams',
  descriptionRu: 'Воющий дух с пронзительными криками',
};

export const BANSHEE_T2 = createT2(BANSHEE_T1, 'Wailing Banshee', 'Воющая банши');
export const BANSHEE_T3 = createT3(BANSHEE_T1, 'Banshee Queen', 'Королева банши', 'wail_of_terror', {
  range: 5,
});

export const BANSHEE_LINE: UnitUpgradeLine = {
  baseId: 'banshee',
  t1: BANSHEE_T1,
  t2: BANSHEE_T2,
  t3: BANSHEE_T3,
};

/** Lich T1 - Elite ranged DPS */
export const LICH_T1: RoguelikeUnit = {
  id: 'lich',
  name: 'Lich',
  nameRu: 'Лич',
  faction: 'undead',
  role: 'ranged_dps',
  tier: 1,
  cost: 8,
  purchasable: true,
  hp: 70,
  atk: 42,
  armor: 5,
  speed: 2,
  initiative: 18,
  range: 5,
  attackCount: 1,
  dodge: 15,
  resolve: 100,
  resolveResist: 0,
  description: 'Powerful undead sorcerer',
  descriptionRu: 'Могущественный нежить-колдун',
};

export const LICH_T2 = createT2(LICH_T1, 'Elder Lich', 'Старший лич');
export const LICH_T3 = createT3(LICH_T1, 'Archlich', 'Архилич', 'frost_nova', { range: 6 });

export const LICH_LINE: UnitUpgradeLine = {
  baseId: 'lich',
  t1: LICH_T1,
  t2: LICH_T2,
  t3: LICH_T3,
};

// ============================================================================
// MAGES (2 lines)
// ============================================================================

/** Necromancer T1 - Support mage with aura */
export const NECROMANCER_T1: RoguelikeUnit = {
  id: 'necromancer',
  name: 'Necromancer',
  nameRu: 'Некромант',
  faction: 'undead',
  role: 'mage',
  tier: 1,
  cost: 4,
  purchasable: true,
  hp: 40,
  atk: 22,
  armor: 2,
  speed: 2,
  initiative: 8,
  range: 3,
  attackCount: 1,
  dodge: 8,
  resolve: 100,
  resolveResist: 0,
  resolveTrait: 'inspiring',
  description: 'Dark mage with Support Aura (+8 Resolve/turn to allies within 2 cells)',
  descriptionRu: 'Тёмный маг с аурой поддержки (+8 Решимости/ход союзникам в 2 клетках)',
};

export const NECROMANCER_T2 = createT2(NECROMANCER_T1, 'Dark Necromancer', 'Тёмный некромант');
export const NECROMANCER_T3 = createT3(
  NECROMANCER_T1,
  'Master Necromancer',
  'Мастер некромантии',
  'raise_skeleton',
  { range: 4 },
);

export const NECROMANCER_LINE: UnitUpgradeLine = {
  baseId: 'necromancer',
  t1: NECROMANCER_T1,
  t2: NECROMANCER_T2,
  t3: NECROMANCER_T3,
};

/** Dark Sorcerer T1 - Combat mage */
export const DARK_SORCERER_T1: RoguelikeUnit = {
  id: 'dark_sorcerer',
  name: 'Dark Sorcerer',
  nameRu: 'Тёмный колдун',
  faction: 'undead',
  role: 'mage',
  tier: 1,
  cost: 6,
  purchasable: true,
  hp: 55,
  atk: 36,
  armor: 3,
  speed: 2,
  initiative: 11,
  range: 4,
  attackCount: 1,
  dodge: 10,
  resolve: 100,
  resolveResist: 0,
  description: 'Powerful dark magic user',
  descriptionRu: 'Могущественный пользователь тёмной магии',
};

export const DARK_SORCERER_T2 = createT2(DARK_SORCERER_T1, 'Shadow Sorcerer', 'Теневой колдун');
export const DARK_SORCERER_T3 = createT3(
  DARK_SORCERER_T1,
  'Void Sorcerer',
  'Колдун пустоты',
  'soul_drain',
  { range: 5 },
);

export const DARK_SORCERER_LINE: UnitUpgradeLine = {
  baseId: 'dark_sorcerer',
  t1: DARK_SORCERER_T1,
  t2: DARK_SORCERER_T2,
  t3: DARK_SORCERER_T3,
};

// ============================================================================
// SUPPORT (1 line)
// ============================================================================

/** Vampire T1 - Melee support with life steal and aura */
export const VAMPIRE_T1: RoguelikeUnit = {
  id: 'vampire',
  name: 'Vampire',
  nameRu: 'Вампир',
  faction: 'undead',
  role: 'support',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 65,
  atk: 18,
  armor: 8,
  speed: 3,
  initiative: 16,
  range: 1,
  attackCount: 1,
  dodge: 25,
  resolve: 100,
  resolveResist: 0,
  resolveTrait: 'inspiring',
  description: 'Undead noble with Support Aura (+8 Resolve/turn to allies within 2 cells)',
  descriptionRu: 'Нежить-аристократ с аурой поддержки (+8 Решимости/ход союзникам в 2 клетках)',
};

export const VAMPIRE_T2 = createT2(VAMPIRE_T1, 'Vampire Lord', 'Лорд вампиров');
export const VAMPIRE_T3 = createT3(VAMPIRE_T1, 'Blood Prince', 'Кровавый принц', 'blood_feast');

export const VAMPIRE_LINE: UnitUpgradeLine = {
  baseId: 'vampire',
  t1: VAMPIRE_T1,
  t2: VAMPIRE_T2,
  t3: VAMPIRE_T3,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All Undead T1 units (purchasable).
 */
export const UNDEAD_T1_UNITS: RoguelikeUnit[] = [
  ZOMBIE_T1,
  ABOMINATION_T1,
  BONE_GOLEM_T1,
  SKELETON_WARRIOR_T1,
  GHOUL_T1,
  DEATH_KNIGHT_T1,
  SKELETON_ARCHER_T1,
  BANSHEE_T1,
  LICH_T1,
  NECROMANCER_T1,
  DARK_SORCERER_T1,
  VAMPIRE_T1,
];

/**
 * All Undead unit upgrade lines.
 */
export const UNDEAD_UPGRADE_LINES: UnitUpgradeLine[] = [
  ZOMBIE_LINE,
  ABOMINATION_LINE,
  BONE_GOLEM_LINE,
  SKELETON_WARRIOR_LINE,
  GHOUL_LINE,
  DEATH_KNIGHT_LINE,
  SKELETON_ARCHER_LINE,
  BANSHEE_LINE,
  LICH_LINE,
  NECROMANCER_LINE,
  DARK_SORCERER_LINE,
  VAMPIRE_LINE,
];

/**
 * All Undead units (all tiers).
 */
export const UNDEAD_ALL_UNITS: RoguelikeUnit[] = UNDEAD_UPGRADE_LINES.flatMap((line) => [
  line.t1,
  line.t2,
  line.t3,
]);
