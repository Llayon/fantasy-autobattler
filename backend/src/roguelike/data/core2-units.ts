/**
 * Core 2.0 Specialized Units
 *
 * Additional units designed to showcase Core 2.0 mechanics:
 * - Cavalry (Charge mechanic)
 * - Spearmen (Phalanx mechanic)
 * - Hunters (Ammunition mechanic)
 * - Plague units (Contagion mechanic)
 *
 * These units are added to existing factions to test tactical mechanics.
 *
 * @module roguelike/data/core2-units
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
// HUMANS - CAVALRY (Charge Mechanic)
// ============================================================================

/**
 * Light Cavalry T1 - Fast cavalry with Charge mechanic
 *
 * Core 2.0 Features:
 * - High speed (4 cells/turn) for momentum building
 * - Charge mechanic: +20% damage per cell moved (max +100%)
 * - Minimum 3 cells for charge bonus
 * - Shock damage: 10 resolve damage on charge
 */
export const LIGHT_CAVALRY_T1: RoguelikeUnit = {
  id: 'light_cavalry',
  name: 'Light Cavalry',
  nameRu: 'Лёгкая кавалерия',
  faction: 'humans',
  role: 'melee_dps',
  tier: 1,
  cost: 6,
  purchasable: true,
  hp: 75,
  atk: 24,
  armor: 10,
  speed: 4, // High speed for charge
  initiative: 16,
  range: 1,
  attackCount: 1,
  dodge: 15,
  resolve: 70,
  resolveResist: 0,
  tags: ['cavalry', 'charge'], // Enable Charge mechanic
  description: 'Fast cavalry with Charge mechanic (+20% damage per cell moved, max +100%)',
  descriptionRu: 'Быстрая кавалерия с механикой Charge (+20% урона за клетку движения, макс +100%)',
};

export const LIGHT_CAVALRY_T2 = createT2(LIGHT_CAVALRY_T1, 'Heavy Cavalry', 'Тяжёлая кавалерия');
export const LIGHT_CAVALRY_T3 = createT3(
  LIGHT_CAVALRY_T1,
  'Knight Commander',
  'Командир рыцарей',
  'cavalry_charge',
  { speed: 5 },
);

export const LIGHT_CAVALRY_LINE: UnitUpgradeLine = {
  baseId: 'light_cavalry',
  t1: LIGHT_CAVALRY_T1,
  t2: LIGHT_CAVALRY_T2,
  t3: LIGHT_CAVALRY_T3,
};

// ============================================================================
// HUMANS - SPEARMEN (Phalanx Mechanic)
// ============================================================================

/**
 * Spearman T1 - Infantry with Phalanx mechanic
 *
 * Core 2.0 Features:
 * - Phalanx mechanic: +1 armor per adjacent ally (max +5)
 * - Phalanx mechanic: +5 resolve per adjacent ally (max +25)
 * - Requires same facing direction
 * - Counter to cavalry charges
 */
export const SPEARMAN_T1: RoguelikeUnit = {
  id: 'spearman',
  name: 'Spearman',
  nameRu: 'Копейщик',
  faction: 'humans',
  role: 'tank',
  tier: 1,
  cost: 4,
  purchasable: true,
  hp: 90,
  atk: 14,
  armor: 15, // Base armor, gets bonus in phalanx
  speed: 2,
  initiative: 9,
  range: 1,
  attackCount: 1,
  dodge: 8,
  resolve: 75,
  resolveResist: 0,
  tags: ['spear_wall', 'phalanx'], // Enable Phalanx and counter to cavalry
  description: 'Infantry with Phalanx (+1 armor, +5 resolve per adjacent ally facing same direction)',
  descriptionRu: 'Пехота с Фалангой (+1 броня, +5 решимости за союзника рядом, смотрящего в ту же сторону)',
};

export const SPEARMAN_T2 = createT2(SPEARMAN_T1, 'Hoplite', 'Гоплит');
export const SPEARMAN_T3 = createT3(SPEARMAN_T1, 'Phalanx Captain', 'Капитан фаланги', 'spear_wall');

export const SPEARMAN_LINE: UnitUpgradeLine = {
  baseId: 'spearman',
  t1: SPEARMAN_T1,
  t2: SPEARMAN_T2,
  t3: SPEARMAN_T3,
};

// ============================================================================
// HUMANS - HUNTERS (Ammunition Mechanic)
// ============================================================================

/**
 * Hunter T1 - Ranged with Ammunition mechanic
 *
 * Core 2.0 Features:
 * - Ammunition: 6 arrows (default)
 * - Cannot attack when out of ammo
 * - No auto-reload (must use action)
 * - High damage to compensate
 */
export const HUNTER_T1: RoguelikeUnit = {
  id: 'hunter',
  name: 'Hunter',
  nameRu: 'Охотник',
  faction: 'humans',
  role: 'ranged_dps',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 55,
  atk: 22, // Higher than archer due to ammo limit
  armor: 5,
  speed: 3,
  initiative: 15,
  range: 5,
  attackCount: 1,
  dodge: 12,
  resolve: 60,
  resolveResist: 0,
  tags: ['ranged'], // Enable Ammunition mechanic detection
  ammunition: 6, // Enable Ammunition mechanic
  description: 'Ranged attacker with Ammunition (6 arrows, must reload)',
  descriptionRu: 'Стрелок с Боеприпасами (6 стрел, требует перезарядки)',
};

export const HUNTER_T2 = createT2(HUNTER_T1, 'Master Hunter', 'Мастер-охотник');
export const HUNTER_T3 = createT3(HUNTER_T1, 'Ranger', 'Рейнджер', 'trap', { range: 6 });

export const HUNTER_LINE: UnitUpgradeLine = {
  baseId: 'hunter',
  t1: HUNTER_T1,
  t2: HUNTER_T2,
  t3: HUNTER_T3,
};

// ============================================================================
// UNDEAD - PLAGUE BEARER (Contagion Mechanic)
// ============================================================================

/**
 * Plague Bearer T1 - Undead with Contagion mechanic
 *
 * Core 2.0 Features:
 * - Contagion: Plague spreads to adjacent enemies (60% chance)
 * - Plague: 5 damage/turn for 3 turns
 * - Phalanx bonus: +15% spread chance
 * - Slow but deadly
 */
export const PLAGUE_BEARER_T1: RoguelikeUnit = {
  id: 'plague_bearer',
  name: 'Plague Bearer',
  nameRu: 'Носитель чумы',
  faction: 'undead',
  role: 'tank',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 110,
  atk: 12,
  armor: 14,
  speed: 1, // Very slow
  initiative: 5,
  range: 1,
  attackCount: 1,
  dodge: 0,
  resolve: 100,
  resolveResist: 0,
  tags: ['plague', 'contagion'], // Enable Contagion mechanic
  description: 'Spreads Plague to adjacent enemies (60% chance, 5 dmg/turn for 3 turns)',
  descriptionRu: 'Распространяет Чуму на соседних врагов (60% шанс, 5 урона/ход 3 хода)',
};

export const PLAGUE_BEARER_T2 = createT2(PLAGUE_BEARER_T1, 'Plague Hulk', 'Чумной громила');
export const PLAGUE_BEARER_T3 = createT3(
  PLAGUE_BEARER_T1,
  'Plague Lord',
  'Лорд чумы',
  'plague_burst',
);

export const PLAGUE_BEARER_LINE: UnitUpgradeLine = {
  baseId: 'plague_bearer',
  t1: PLAGUE_BEARER_T1,
  t2: PLAGUE_BEARER_T2,
  t3: PLAGUE_BEARER_T3,
};

// ============================================================================
// UNDEAD - WRAITH (Flanking & Riposte)
// ============================================================================

/**
 * Wraith T1 - Fast flanker with Riposte
 *
 * Core 2.0 Features:
 * - Flanking: +50% damage from flank, +100% from rear
 * - Riposte: 30% chance to counter-attack (initiative-based)
 * - High speed for flanking maneuvers
 * - Low HP, high dodge
 */
export const WRAITH_T1: RoguelikeUnit = {
  id: 'wraith',
  name: 'Wraith',
  nameRu: 'Призрак',
  faction: 'undead',
  role: 'melee_dps',
  tier: 1,
  cost: 6,
  purchasable: true,
  hp: 60,
  atk: 26,
  armor: 6,
  speed: 4, // High speed for flanking
  initiative: 19, // High initiative for riposte
  range: 1,
  attackCount: 1,
  dodge: 25, // High dodge
  resolve: 100,
  resolveResist: 0,
  tags: ['flanker', 'riposte'], // Enable Flanking and Riposte mechanics
  description: 'Fast flanker with Riposte (30% counter, +50% flank dmg, +100% rear dmg)',
  descriptionRu: 'Быстрый фланкер с Рипостом (30% контратака, +50% урон с фланга, +100% сзади)',
};

export const WRAITH_T2 = createT2(WRAITH_T1, 'Shadow Wraith', 'Теневой призрак');
export const WRAITH_T3 = createT3(WRAITH_T1, 'Wraith Lord', 'Лорд призраков', 'phase_strike', {
  speed: 5,
});

export const WRAITH_LINE: UnitUpgradeLine = {
  baseId: 'wraith',
  t1: WRAITH_T1,
  t2: WRAITH_T2,
  t3: WRAITH_T3,
};

// ============================================================================
// UNDEAD - BONE ARCHER (Ammunition for Undead)
// ============================================================================

/**
 * Bone Archer T1 - Skeletal archer with Ammunition
 *
 * Core 2.0 Features:
 * - Ammunition: 6 bone arrows
 * - Higher damage than regular archers
 * - No auto-reload
 */
export const BONE_ARCHER_T1: RoguelikeUnit = {
  id: 'bone_archer',
  name: 'Bone Archer',
  nameRu: 'Костяной лучник',
  faction: 'undead',
  role: 'ranged_dps',
  tier: 1,
  cost: 5,
  purchasable: true,
  hp: 45,
  atk: 24, // Higher than skeleton archer
  armor: 3,
  speed: 2,
  initiative: 13,
  range: 5,
  attackCount: 1,
  dodge: 15,
  resolve: 100,
  resolveResist: 0,
  tags: ['ranged'], // Enable Ammunition mechanic detection
  ammunition: 6, // Enable Ammunition mechanic
  description: 'Skeletal archer with Ammunition (6 bone arrows, must reload)',
  descriptionRu: 'Скелет-лучник с Боеприпасами (6 костяных стрел, требует перезарядки)',
};

export const BONE_ARCHER_T2 = createT2(BONE_ARCHER_T1, 'Elite Bone Archer', 'Элитный костяной лучник');
export const BONE_ARCHER_T3 = createT3(
  BONE_ARCHER_T1,
  'Bone Sniper Lord',
  'Лорд костяных снайперов',
  'bone_volley',
  { range: 6 },
);

export const BONE_ARCHER_LINE: UnitUpgradeLine = {
  baseId: 'bone_archer',
  t1: BONE_ARCHER_T1,
  t2: BONE_ARCHER_T2,
  t3: BONE_ARCHER_T3,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All Core 2.0 T1 units (purchasable).
 */
export const CORE2_T1_UNITS: RoguelikeUnit[] = [
  // Humans
  LIGHT_CAVALRY_T1,
  SPEARMAN_T1,
  HUNTER_T1,
  // Undead
  PLAGUE_BEARER_T1,
  WRAITH_T1,
  BONE_ARCHER_T1,
];

/**
 * All Core 2.0 unit upgrade lines.
 */
export const CORE2_UPGRADE_LINES: UnitUpgradeLine[] = [
  LIGHT_CAVALRY_LINE,
  SPEARMAN_LINE,
  HUNTER_LINE,
  PLAGUE_BEARER_LINE,
  WRAITH_LINE,
  BONE_ARCHER_LINE,
];

/**
 * All Core 2.0 units (all tiers).
 */
export const CORE2_ALL_UNITS: RoguelikeUnit[] = CORE2_UPGRADE_LINES.flatMap((line) => [
  line.t1,
  line.t2,
  line.t3,
]);

/**
 * Core 2.0 Humans units only.
 */
export const CORE2_HUMANS_UNITS: RoguelikeUnit[] = [
  LIGHT_CAVALRY_T1,
  SPEARMAN_T1,
  HUNTER_T1,
];

/**
 * Core 2.0 Undead units only.
 */
export const CORE2_UNDEAD_UNITS: RoguelikeUnit[] = [
  PLAGUE_BEARER_T1,
  WRAITH_T1,
  BONE_ARCHER_T1,
];
