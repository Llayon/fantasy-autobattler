/**
 * Faction Data for Roguelike Mode
 *
 * Static data definitions for all factions in Phase 1.
 * Phase 1 includes: Humans and Undead.
 *
 * @module roguelike/data/factions
 */

import {
  Faction,
  FactionData,
  FactionDataWithResolve,
} from '../types/faction.types';

/**
 * Humans faction data.
 * Balanced, defensive faction with +10% HP bonus.
 *
 * @example
 * const humans = FACTIONS_DATA.humans;
 * console.log(humans.bonus); // { stat: 'hp', value: 0.1 }
 */
export const HUMANS_FACTION: FactionDataWithResolve = {
  id: 'humans',
  name: 'Humans',
  nameRu: 'Люди',
  description: 'Balanced, defensive, organized military',
  descriptionRu: 'Сбалансированные, оборонительные, организованная армия',
  bonus: { stat: 'hp', value: 0.1 },
  icon: 'faction-humans',
  brokenBehavior: 'retreating',
  baseResolveRegen: 5,
  canSelfRecover: true,
};

/**
 * Undead faction data.
 * Aggressive faction with +15% ATK bonus.
 *
 * @example
 * const undead = FACTIONS_DATA.undead;
 * console.log(undead.bonus); // { stat: 'atk', value: 0.15 }
 */
export const UNDEAD_FACTION: FactionDataWithResolve = {
  id: 'undead',
  name: 'Undead',
  nameRu: 'Нежить',
  description: 'Aggressive, high damage, life steal, swarm',
  descriptionRu: 'Агрессивные, высокий урон, вампиризм, орда',
  bonus: { stat: 'atk', value: 0.15 },
  icon: 'faction-undead',
  brokenBehavior: 'crumbling',
  baseResolveRegen: 0,
  canSelfRecover: false,
};

/**
 * All factions data indexed by faction ID.
 *
 * @example
 * const faction = FACTIONS_DATA['humans'];
 * console.log(faction.name); // 'Humans'
 */
export const FACTIONS_DATA: Record<Faction, FactionDataWithResolve> = {
  humans: HUMANS_FACTION,
  undead: UNDEAD_FACTION,
};

/**
 * List of all available factions.
 *
 * @example
 * FACTION_LIST.forEach(faction => console.log(faction.name));
 */
export const FACTION_LIST: FactionDataWithResolve[] = Object.values(FACTIONS_DATA);

/**
 * Get faction data by ID.
 *
 * @param factionId - The faction identifier
 * @returns Faction data or undefined if not found
 * @example
 * const humans = getFaction('humans');
 * if (humans) {
 *   console.log(humans.bonus.stat); // 'hp'
 * }
 */
export function getFaction(factionId: Faction): FactionDataWithResolve | undefined {
  return FACTIONS_DATA[factionId];
}

/**
 * Get basic faction data without resolve mechanics.
 * Useful for UI display where resolve details aren't needed.
 *
 * @param factionId - The faction identifier
 * @returns Basic faction data or undefined if not found
 * @example
 * const factionInfo = getFactionBasic('undead');
 * console.log(factionInfo?.name); // 'Undead'
 */
export function getFactionBasic(factionId: Faction): FactionData | undefined {
  const faction = FACTIONS_DATA[factionId];
  if (!faction) return undefined;

  // Return only basic FactionData fields
  const { brokenBehavior, baseResolveRegen, canSelfRecover, ...basicData } = faction;
  return basicData;
}

/**
 * Check if a faction ID is valid.
 *
 * @param factionId - The faction identifier to validate
 * @returns True if the faction exists
 * @example
 * isValidFaction('humans'); // true
 * isValidFaction('elves'); // false
 */
export function isValidFaction(factionId: string): factionId is Faction {
  return factionId in FACTIONS_DATA;
}

/**
 * Apply faction bonus to a stat value.
 *
 * @param baseValue - The base stat value
 * @param faction - The faction data
 * @param statName - The stat to check for bonus
 * @returns Modified stat value with faction bonus applied
 * @example
 * const baseHp = 100;
 * const modifiedHp = applyFactionBonus(baseHp, HUMANS_FACTION, 'hp');
 * console.log(modifiedHp); // 110 (100 + 10%)
 */
export function applyFactionBonus(
  baseValue: number,
  faction: FactionData,
  statName: string,
): number {
  if (faction.bonus.stat === statName) {
    return Math.round(baseValue * (1 + faction.bonus.value));
  }
  return baseValue;
}
