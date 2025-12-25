/**
 * Starter Decks Data for Roguelike Mode
 *
 * Pre-built balanced decks for each faction.
 * Each deck contains 12 T1 units.
 *
 * @module roguelike/data/starter-decks
 */

import { Faction } from '../types/faction.types';
import { StarterDeck, DeckCard } from '../types/unit.types';

/**
 * Humans starter deck composition.
 * Balanced mix of tanks, DPS, mages, and support.
 *
 * @example
 * const deck = HUMANS_STARTER_DECK;
 * console.log(deck.units.length); // 12 entries
 */
export const HUMANS_STARTER_DECK: StarterDeck = {
  faction: 'humans',
  units: [
    { unitId: 'footman', count: 2 },
    { unitId: 'swordsman', count: 2 },
    { unitId: 'archer', count: 2 },
    { unitId: 'apprentice', count: 1 },
    { unitId: 'knight', count: 1 },
    { unitId: 'crusader', count: 1 },
    { unitId: 'crossbowman', count: 1 },
    { unitId: 'battle_mage', count: 1 },
    { unitId: 'priest', count: 1 },
  ],
};

/**
 * Undead starter deck composition.
 * Aggressive mix with high damage potential.
 *
 * @example
 * const deck = UNDEAD_STARTER_DECK;
 * console.log(deck.units.length); // 12 entries
 */
export const UNDEAD_STARTER_DECK: StarterDeck = {
  faction: 'undead',
  units: [
    { unitId: 'zombie', count: 2 },
    { unitId: 'skeleton_warrior', count: 2 },
    { unitId: 'skeleton_archer', count: 2 },
    { unitId: 'necromancer', count: 1 },
    { unitId: 'abomination', count: 1 },
    { unitId: 'ghoul', count: 1 },
    { unitId: 'banshee', count: 1 },
    { unitId: 'dark_sorcerer', count: 1 },
    { unitId: 'vampire', count: 1 },
  ],
};

/**
 * All starter decks indexed by faction.
 */
export const STARTER_DECKS: Record<Faction, StarterDeck> = {
  humans: HUMANS_STARTER_DECK,
  undead: UNDEAD_STARTER_DECK,
};

/**
 * Get starter deck for a faction.
 *
 * @param faction - The faction identifier
 * @returns Starter deck or undefined if not found
 * @example
 * const deck = getStarterDeck('humans');
 * console.log(deck?.units.length); // 9 entries (12 units total with counts)
 */
export function getStarterDeck(faction: Faction): StarterDeck | undefined {
  return STARTER_DECKS[faction];
}

/**
 * Get total unit count in a starter deck.
 *
 * @param deck - The starter deck
 * @returns Total number of units
 * @example
 * const count = getStarterDeckUnitCount(HUMANS_STARTER_DECK);
 * console.log(count); // 12
 */
export function getStarterDeckUnitCount(deck: StarterDeck): number {
  return deck.units.reduce((sum, entry) => sum + entry.count, 0);
}

/**
 * Expand starter deck entries into individual deck cards.
 * Creates unique instance IDs for each card.
 *
 * @param deck - The starter deck
 * @returns Array of deck cards with unique instance IDs
 * @example
 * const cards = expandStarterDeck(HUMANS_STARTER_DECK);
 * console.log(cards.length); // 12
 * console.log(cards[0].instanceId); // 'footman-1'
 */
export function expandStarterDeck(deck: StarterDeck): DeckCard[] {
  const cards: DeckCard[] = [];
  const instanceCounts: Record<string, number> = {};

  for (const entry of deck.units) {
    for (let i = 0; i < entry.count; i++) {
      const count = (instanceCounts[entry.unitId] || 0) + 1;
      instanceCounts[entry.unitId] = count;

      cards.push({
        unitId: entry.unitId,
        tier: 1,
        instanceId: `${entry.unitId}-${count}`,
      });
    }
  }

  return cards;
}

/**
 * Validate starter deck has correct number of units.
 *
 * @param deck - The starter deck to validate
 * @returns True if deck has exactly 12 units
 * @example
 * isValidStarterDeck(HUMANS_STARTER_DECK); // true
 */
export function isValidStarterDeck(deck: StarterDeck): boolean {
  return getStarterDeckUnitCount(deck) === 12;
}

/**
 * Get unit distribution by role in a starter deck.
 *
 * @param deck - The starter deck
 * @param unitData - Map of unit IDs to their roles
 * @returns Count of units per role
 * @example
 * const distribution = getStarterDeckRoleDistribution(deck, unitRoleMap);
 * console.log(distribution.tank); // 3
 */
export function getStarterDeckRoleDistribution(
  deck: StarterDeck,
  unitData: Record<string, { role: string }>,
): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const entry of deck.units) {
    const unit = unitData[entry.unitId];
    if (unit) {
      distribution[unit.role] = (distribution[unit.role] || 0) + entry.count;
    }
  }

  return distribution;
}
