/**
 * Bot Team Compositions for Roguelike Mode
 *
 * Predefined team compositions for each round (1-12) and faction.
 * 3 variants per faction per round = 72 total teams.
 *
 * Budget progression:
 * - Rounds 1-2: ~10g budget
 * - Rounds 3-4: ~20g budget
 * - Rounds 5-6: ~35g budget
 * - Rounds 7-8: ~50g budget
 * - Rounds 9-12: ~65g budget
 *
 * Unit costs (Humans):
 * - footman(3), knight(5), paladin(7)
 * - swordsman(3), crusader(5), champion(8)
 * - archer(4), crossbowman(6), marksman(8)
 * - apprentice(4), battle_mage(6), priest(5)
 *
 * Unit costs (Undead):
 * - zombie(3), abomination(5), bone_golem(7)
 * - skeleton_warrior(3), ghoul(5), death_knight(8)
 * - skeleton_archer(4), banshee(6), lich(8)
 * - necromancer(4), dark_sorcerer(6), vampire(5)
 *
 * @module roguelike/data/bot-teams
 */

import { PlacedUnit } from '../entities/snapshot.entity';
import { Faction } from '../types/faction.types';

/**
 * Budget limits per round range.
 */
export const ROUND_BUDGETS: Record<number, number> = {
  1: 10, 2: 10,
  3: 20, 4: 20,
  5: 35, 6: 35,
  7: 50, 8: 50,
  9: 65, 10: 65, 11: 65, 12: 65,
};

/**
 * Get budget for a specific round.
 * @param round - Round number (1-12)
 * @returns Budget in gold
 */
export function getBudgetForRound(round: number): number {
  if (round <= 0) return ROUND_BUDGETS[1] ?? 10;
  if (round > 12) return ROUND_BUDGETS[12] ?? 65;
  return ROUND_BUDGETS[round] ?? 65;
}


/**
 * Bot team composition with variant support.
 */
export interface BotTeamComposition {
  /** Round number (1-12) */
  round: number;
  /** Variant number (1-3) */
  variant: 1 | 2 | 3;
  /** Faction */
  faction: Faction;
  /** Team units with positions */
  units: PlacedUnit[];
  /** Total cost of the team */
  totalCost: number;
}

// =============================================================================
// HUMANS BOT TEAMS - 3 variants per round
// =============================================================================

export const HUMANS_BOT_TEAMS: BotTeamComposition[] = [
  // -------------------------------------------------------------------------
  // Round 1: Budget 10g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 1, variant: 1, faction: 'humans', totalCost: 10,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 1, variant: 2, faction: 'humans', totalCost: 10,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'footman', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'apprentice', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 1, variant: 3, faction: 'humans', totalCost: 10,
    units: [
      { unitId: 'swordsman', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 2: Budget 10g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 2, variant: 1, faction: 'humans', totalCost: 10,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 2, variant: 2, faction: 'humans', totalCost: 9,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'footman', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 5, y: 0 } },
    ],
  },
  {
    round: 2, variant: 3, faction: 'humans', totalCost: 10,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 3: Budget 20g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 3, variant: 1, faction: 'humans', totalCost: 20,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 3, variant: 2, faction: 'humans', totalCost: 20,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'footman', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'apprentice', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'footman', tier: 1, position: { x: 4, y: 0 } },
    ],
  },
  {
    round: 3, variant: 3, faction: 'humans', totalCost: 19,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'archer', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'footman', tier: 1, position: { x: 1, y: 0 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 4: Budget 20g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 4, variant: 1, faction: 'humans', totalCost: 20,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 5, y: 1 } },
    ],
  },
  {
    round: 4, variant: 2, faction: 'humans', totalCost: 19,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 4, variant: 3, faction: 'humans', totalCost: 20,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'footman', tier: 1, position: { x: 5, y: 0 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 5: Budget 35g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 5, variant: 1, faction: 'humans', totalCost: 34,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'apprentice', tier: 1, position: { x: 2, y: 1 } },
    ],
  },
  {
    round: 5, variant: 2, faction: 'humans', totalCost: 35,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 5, variant: 3, faction: 'humans', totalCost: 35,
    units: [
      { unitId: 'footman', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'footman', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 6: Budget 35g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 6, variant: 1, faction: 'humans', totalCost: 35,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 6, variant: 2, faction: 'humans', totalCost: 35,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'archer', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 6, variant: 3, faction: 'humans', totalCost: 34,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'apprentice', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'swordsman', tier: 1, position: { x: 4, y: 0 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 7: Budget 50g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 7, variant: 1, faction: 'humans', totalCost: 49,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 7, variant: 2, faction: 'humans', totalCost: 50,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'archer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'archer', tier: 1, position: { x: 5, y: 1 } },
    ],
  },
  {
    round: 7, variant: 3, faction: 'humans', totalCost: 50,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 8: Budget 50g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 8, variant: 1, faction: 'humans', totalCost: 50,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 5, y: 1 } },
    ],
  },
  {
    round: 8, variant: 2, faction: 'humans', totalCost: 49,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 8, variant: 3, faction: 'humans', totalCost: 50,
    units: [
      { unitId: 'knight', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'apprentice', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'apprentice', tier: 1, position: { x: 5, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 9: Budget 65g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 9, variant: 1, faction: 'humans', totalCost: 64,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 0, y: 1 } },
    ],
  },
  {
    round: 9, variant: 2, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 9, variant: 3, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 5, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 10: Budget 65g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 10, variant: 1, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 10, variant: 2, faction: 'humans', totalCost: 64,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 0, y: 1 } },
    ],
  },
  {
    round: 10, variant: 3, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'swordsman', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 11: Budget 65g with T2 units (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 11, variant: 1, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 11, variant: 2, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'paladin', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'crusader', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'crossbowman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 11, variant: 3, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'knight', tier: 2, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 2, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 12: Budget 65g with T2 units (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 12, variant: 1, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 2, position: { x: 2, y: 0 } },
      { unitId: 'paladin', tier: 2, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 2, y: 1 } },
    ],
  },
  {
    round: 12, variant: 2, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'paladin', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'knight', tier: 2, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 2, position: { x: 5, y: 0 } },
      { unitId: 'champion', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 12, variant: 3, faction: 'humans', totalCost: 65,
    units: [
      { unitId: 'champion', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'champion', tier: 2, position: { x: 4, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'marksman', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'marksman', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'battle_mage', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'priest', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
];


// =============================================================================
// UNDEAD BOT TEAMS - 3 variants per round
// =============================================================================

export const UNDEAD_BOT_TEAMS: BotTeamComposition[] = [
  // -------------------------------------------------------------------------
  // Round 1: Budget 10g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 1, variant: 1, faction: 'undead', totalCost: 10,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 1, variant: 2, faction: 'undead', totalCost: 10,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'zombie', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'necromancer', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 1, variant: 3, faction: 'undead', totalCost: 10,
    units: [
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 2: Budget 10g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 2, variant: 1, faction: 'undead', totalCost: 10,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 2, variant: 2, faction: 'undead', totalCost: 9,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'zombie', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 5, y: 0 } },
    ],
  },
  {
    round: 2, variant: 3, faction: 'undead', totalCost: 10,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 3: Budget 20g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 3, variant: 1, faction: 'undead', totalCost: 20,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 3, variant: 2, faction: 'undead', totalCost: 20,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'zombie', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'necromancer', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'zombie', tier: 1, position: { x: 4, y: 0 } },
    ],
  },
  {
    round: 3, variant: 3, faction: 'undead', totalCost: 19,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'zombie', tier: 1, position: { x: 1, y: 0 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 4: Budget 20g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 4, variant: 1, faction: 'undead', totalCost: 20,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 5, y: 1 } },
    ],
  },
  {
    round: 4, variant: 2, faction: 'undead', totalCost: 19,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 4, variant: 3, faction: 'undead', totalCost: 20,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'zombie', tier: 1, position: { x: 5, y: 0 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 5: Budget 35g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 5, variant: 1, faction: 'undead', totalCost: 34,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'banshee', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'necromancer', tier: 1, position: { x: 2, y: 1 } },
    ],
  },
  {
    round: 5, variant: 2, faction: 'undead', totalCost: 35,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 5, variant: 3, faction: 'undead', totalCost: 35,
    units: [
      { unitId: 'zombie', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'zombie', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'banshee', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 6: Budget 35g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 6, variant: 1, faction: 'undead', totalCost: 35,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'banshee', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 6, variant: 2, faction: 'undead', totalCost: 35,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 6, variant: 3, faction: 'undead', totalCost: 34,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'necromancer', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 4, y: 0 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 7: Budget 50g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 7, variant: 1, faction: 'undead', totalCost: 49,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'banshee', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 7, variant: 2, faction: 'undead', totalCost: 50,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'skeleton_archer', tier: 1, position: { x: 5, y: 1 } },
    ],
  },
  {
    round: 7, variant: 3, faction: 'undead', totalCost: 50,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'banshee', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 8: Budget 50g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 8, variant: 1, faction: 'undead', totalCost: 50,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 5, y: 1 } },
    ],
  },
  {
    round: 8, variant: 2, faction: 'undead', totalCost: 49,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 8, variant: 3, faction: 'undead', totalCost: 50,
    units: [
      { unitId: 'abomination', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'banshee', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'necromancer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'necromancer', tier: 1, position: { x: 5, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 9: Budget 65g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 9, variant: 1, faction: 'undead', totalCost: 64,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 0, y: 1 } },
    ],
  },
  {
    round: 9, variant: 2, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 9, variant: 3, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 5, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 10: Budget 65g (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 10, variant: 1, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 10, variant: 2, faction: 'undead', totalCost: 64,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 0, y: 1 } },
    ],
  },
  {
    round: 10, variant: 3, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 1, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 6, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'skeleton_warrior', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 11: Budget 65g with T2 units (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 11, variant: 1, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 11, variant: 2, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'bone_golem', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'ghoul', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'banshee', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
  {
    round: 11, variant: 3, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'abomination', tier: 2, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 2, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },

  // -------------------------------------------------------------------------
  // Round 12: Budget 65g with T2 units (3 variants)
  // -------------------------------------------------------------------------
  {
    round: 12, variant: 1, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 2, position: { x: 2, y: 0 } },
      { unitId: 'bone_golem', tier: 2, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 3, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 4, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 2, y: 1 } },
    ],
  },
  {
    round: 12, variant: 2, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'bone_golem', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'abomination', tier: 2, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 2, position: { x: 5, y: 0 } },
      { unitId: 'death_knight', tier: 1, position: { x: 4, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 2, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 5, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 3, y: 1 } },
    ],
  },
  {
    round: 12, variant: 3, faction: 'undead', totalCost: 65,
    units: [
      { unitId: 'death_knight', tier: 2, position: { x: 3, y: 0 } },
      { unitId: 'death_knight', tier: 2, position: { x: 4, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 2, y: 0 } },
      { unitId: 'abomination', tier: 1, position: { x: 5, y: 0 } },
      { unitId: 'lich', tier: 1, position: { x: 1, y: 1 } },
      { unitId: 'lich', tier: 1, position: { x: 6, y: 1 } },
      { unitId: 'dark_sorcerer', tier: 1, position: { x: 3, y: 1 } },
      { unitId: 'vampire', tier: 1, position: { x: 4, y: 1 } },
    ],
  },
];


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Number of variants per round per faction */
export const VARIANTS_PER_ROUND = 3;

/**
 * Gets all bot team variants for a specific round and faction.
 *
 * @param round - Round number (1-12)
 * @param faction - Faction ('humans' or 'undead')
 * @returns Array of bot team compositions (up to 3 variants)
 *
 * @example
 * const variants = getBotTeamVariants(5, 'humans');
 * // Returns 3 team compositions for round 5
 */
export function getBotTeamVariants(
  round: number,
  faction: Faction,
): BotTeamComposition[] {
  const teams = faction === 'humans' ? HUMANS_BOT_TEAMS : UNDEAD_BOT_TEAMS;
  const clampedRound = Math.max(1, Math.min(12, round));
  return teams.filter((t) => t.round === clampedRound);
}

/**
 * Gets a random bot team for a specific round and faction.
 *
 * Uses seeded random for deterministic selection.
 *
 * @param round - Round number (1-12)
 * @param faction - Faction ('humans' or 'undead')
 * @param randomValue - Random value (0-1) for variant selection
 * @returns Bot team composition or undefined if not found
 *
 * @example
 * const team = getBotTeamForRound(5, 'humans', 0.7);
 * // Returns one of 3 variants based on random value
 */
export function getBotTeamForRound(
  round: number,
  faction: Faction,
  randomValue?: number,
): BotTeamComposition | undefined {
  const variants = getBotTeamVariants(round, faction);
  
  if (variants.length === 0) {
    return undefined;
  }
  
  // Select variant based on random value (0-1)
  const rand = randomValue ?? Math.random();
  const index = Math.floor(rand * variants.length);
  return variants[index];
}

/**
 * Gets all bot teams for a faction.
 *
 * @param faction - Faction ('humans' or 'undead')
 * @returns Array of all bot team compositions (36 teams)
 *
 * @example
 * const allTeams = getBotTeamsForFaction('undead');
 */
export function getBotTeamsForFaction(faction: Faction): BotTeamComposition[] {
  return faction === 'humans' ? HUMANS_BOT_TEAMS : UNDEAD_BOT_TEAMS;
}
