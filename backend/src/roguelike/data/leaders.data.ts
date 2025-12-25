/**
 * Leader Data for Roguelike Mode
 *
 * Static data definitions for all leaders in Phase 1.
 * Phase 1 includes: Commander Aldric (Humans) and Lich King Malachar (Undead).
 *
 * @module roguelike/data/leaders
 */

import { Faction } from '../types/faction.types';
import { Leader, PassiveAbility, Spell } from '../types/leader.types';

// ============================================================================
// PASSIVE ABILITIES
// ============================================================================

/**
 * Commander Aldric's passive: Formation.
 * Adjacent allies gain +5 armor.
 */
export const PASSIVE_FORMATION: PassiveAbility = {
  id: 'formation',
  name: 'Formation',
  nameRu: 'Построение',
  description: 'Adjacent allies gain +5 armor',
  descriptionRu: 'Соседние союзники получают +5 брони',
  effectType: 'aura',
  effectValue: 5,
  effectStat: 'armor',
  range: 1,
};

/**
 * Lich King Malachar's passive: Life Drain.
 * Units heal 10% of damage dealt.
 */
export const PASSIVE_LIFE_DRAIN: PassiveAbility = {
  id: 'life_drain',
  name: 'Life Drain',
  nameRu: 'Похищение жизни',
  description: 'Units heal 10% of damage dealt',
  descriptionRu: 'Юниты исцеляются на 10% от нанесённого урона',
  effectType: 'on_damage',
  effectValue: 0.1,
};

// ============================================================================
// SPELLS
// ============================================================================

/**
 * Holy Light spell (Humans).
 * Heals lowest HP ally for 30 HP.
 */
export const SPELL_HOLY_LIGHT: Spell = {
  id: 'holy_light',
  name: 'Holy Light',
  nameRu: 'Святой свет',
  description: 'Heal lowest HP ally for 30 HP',
  descriptionRu: 'Исцеляет союзника с наименьшим HP на 30',
  faction: 'humans',
  targetType: 'ally_lowest_hp',
  effectType: 'heal',
  effectValue: 30,
  recommendedTiming: 'mid',
  icon: 'spell-holy-light',
};

/**
 * Rally spell (Humans).
 * All allies gain +15% ATK for 3 rounds.
 */
export const SPELL_RALLY: Spell = {
  id: 'rally',
  name: 'Rally',
  nameRu: 'Воодушевление',
  description: 'All allies gain +15% ATK for 3 rounds',
  descriptionRu: 'Все союзники получают +15% ATK на 3 раунда',
  faction: 'humans',
  targetType: 'all_allies',
  effectType: 'buff',
  effectValue: 0.15,
  duration: 3,
  recommendedTiming: 'early',
  icon: 'spell-rally',
};

/**
 * Death Coil spell (Undead).
 * Deal 40 damage to enemy, heal caster for 20.
 */
export const SPELL_DEATH_COIL: Spell = {
  id: 'death_coil',
  name: 'Death Coil',
  nameRu: 'Кольцо смерти',
  description: 'Deal 40 damage to enemy, heal caster for 20',
  descriptionRu: 'Наносит 40 урона врагу, исцеляет заклинателя на 20',
  faction: 'undead',
  targetType: 'enemy_highest_hp',
  effectType: 'damage',
  effectValue: 40,
  recommendedTiming: 'mid',
  icon: 'spell-death-coil',
};

/**
 * Raise Dead spell (Undead).
 * Summon 2 Skeleton Warriors (T1).
 */
export const SPELL_RAISE_DEAD: Spell = {
  id: 'raise_dead',
  name: 'Raise Dead',
  nameRu: 'Воскрешение мёртвых',
  description: 'Summon 2 Skeleton Warriors (T1)',
  descriptionRu: 'Призывает 2 Скелетов-воинов (T1)',
  faction: 'undead',
  targetType: 'summon',
  effectType: 'summon',
  effectValue: 2,
  recommendedTiming: 'late',
  icon: 'spell-raise-dead',
};

// ============================================================================
// SPELLS DATA
// ============================================================================

/**
 * All spells indexed by spell ID.
 *
 * @example
 * const holyLight = SPELLS_DATA['holy_light'];
 */
export const SPELLS_DATA: Record<string, Spell> = {
  holy_light: SPELL_HOLY_LIGHT,
  rally: SPELL_RALLY,
  death_coil: SPELL_DEATH_COIL,
  raise_dead: SPELL_RAISE_DEAD,
};

/**
 * Get spell by ID.
 *
 * @param spellId - The spell identifier
 * @returns Spell data or undefined if not found
 * @example
 * const spell = getSpell('holy_light');
 * console.log(spell?.effectValue); // 30
 */
export function getSpell(spellId: string): Spell | undefined {
  return SPELLS_DATA[spellId];
}

/**
 * Get all spells for a faction.
 *
 * @param faction - The faction identifier
 * @returns Array of spells belonging to the faction
 * @example
 * const humanSpells = getSpellsByFaction('humans');
 * console.log(humanSpells.length); // 2
 */
export function getSpellsByFaction(faction: Faction): Spell[] {
  return Object.values(SPELLS_DATA).filter((spell) => spell.faction === faction);
}

// ============================================================================
// LEADERS
// ============================================================================

/**
 * Commander Aldric - Humans leader.
 * A veteran commander who inspires his troops through formation tactics.
 */
export const LEADER_COMMANDER_ALDRIC: Leader = {
  id: 'commander_aldric',
  name: 'Commander Aldric',
  nameRu: 'Командир Алдрик',
  faction: 'humans',
  passive: PASSIVE_FORMATION,
  spellIds: ['holy_light', 'rally'],
  portrait: 'leader-aldric',
  description: 'A veteran commander who inspires his troops through formation tactics.',
  descriptionRu: 'Опытный командир, вдохновляющий войска тактикой построения.',
};

/**
 * Lich King Malachar - Undead leader.
 * An ancient lich who drains life from his enemies to sustain his undead army.
 */
export const LEADER_LICH_KING_MALACHAR: Leader = {
  id: 'lich_king_malachar',
  name: 'Lich King Malachar',
  nameRu: 'Король-лич Малахар',
  faction: 'undead',
  passive: PASSIVE_LIFE_DRAIN,
  spellIds: ['death_coil', 'raise_dead'],
  portrait: 'leader-malachar',
  description: 'An ancient lich who drains life from his enemies to sustain his undead army.',
  descriptionRu: 'Древний лич, похищающий жизнь врагов для поддержания своей армии нежити.',
};

// ============================================================================
// LEADERS DATA
// ============================================================================

/**
 * All leaders indexed by leader ID.
 *
 * @example
 * const aldric = LEADERS_DATA['commander_aldric'];
 */
export const LEADERS_DATA: Record<string, Leader> = {
  commander_aldric: LEADER_COMMANDER_ALDRIC,
  lich_king_malachar: LEADER_LICH_KING_MALACHAR,
};

/**
 * Get leader by ID.
 *
 * @param leaderId - The leader identifier
 * @returns Leader data or undefined if not found
 * @example
 * const leader = getLeader('commander_aldric');
 * console.log(leader?.name); // 'Commander Aldric'
 */
export function getLeader(leaderId: string): Leader | undefined {
  return LEADERS_DATA[leaderId];
}

/**
 * Get all leaders for a faction.
 *
 * @param faction - The faction identifier
 * @returns Array of leaders belonging to the faction
 * @example
 * const humanLeaders = getLeadersByFaction('humans');
 * console.log(humanLeaders.length); // 1 (Phase 1)
 */
export function getLeadersByFaction(faction: Faction): Leader[] {
  return Object.values(LEADERS_DATA).filter((leader) => leader.faction === faction);
}

/**
 * Check if a leader ID is valid.
 *
 * @param leaderId - The leader identifier to validate
 * @returns True if the leader exists
 * @example
 * isValidLeader('commander_aldric'); // true
 * isValidLeader('unknown'); // false
 */
export function isValidLeader(leaderId: string): boolean {
  return leaderId in LEADERS_DATA;
}

/**
 * Get leader with resolved spell data.
 * Returns leader with full spell objects instead of just IDs.
 *
 * @param leaderId - The leader identifier
 * @returns Leader with spells array or undefined if not found
 * @example
 * const leader = getLeaderWithSpells('commander_aldric');
 * console.log(leader?.spells[0].name); // 'Holy Light'
 */
export function getLeaderWithSpells(
  leaderId: string,
): (Omit<Leader, 'spellIds'> & { spells: Spell[] }) | undefined {
  const leader = LEADERS_DATA[leaderId];
  if (!leader) return undefined;

  const { spellIds, ...rest } = leader;
  const spells = spellIds
    .map((id) => SPELLS_DATA[id])
    .filter((spell): spell is Spell => spell !== undefined);

  return { ...rest, spells };
}
