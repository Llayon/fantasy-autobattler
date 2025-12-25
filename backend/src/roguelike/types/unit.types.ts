/**
 * Unit Types for Roguelike Mode
 *
 * Defines unit-related types and interfaces for the roguelike run mode.
 * Phase 1 includes 12 T1 units per faction with T2/T3 upgrade paths.
 *
 * @module roguelike/types/unit
 */

import { Faction } from './faction.types';

/**
 * Unit tier levels.
 * T1 = Common (purchasable), T2 = Rare (upgrade only), T3 = Epic (upgrade only).
 *
 * @example
 * const tier: UnitTier = 1; // T1 common unit
 */
export type UnitTier = 1 | 2 | 3;

/**
 * Unit role types.
 * Determines AI behavior and synergy bonuses.
 *
 * @example
 * const role: UnitRole = 'tank'; // Frontline defender
 */
export type UnitRole = 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support';

/**
 * Resolve trait types for morale system.
 * Special traits that modify resolve behavior.
 *
 * - 'steadfast': +20% resolve resistance
 * - 'stubborn': Cannot be broken below 10 resolve
 * - 'cold_blooded': Immune to fear effects
 * - 'fearless': +50% resolve, no broken state
 * - 'inspiring': Nearby allies gain +5 resolve/turn
 */
export type ResolveTrait = 'steadfast' | 'stubborn' | 'cold_blooded' | 'fearless' | 'inspiring';

/**
 * Base unit stats interface.
 * All stats are for T1 tier; T2/T3 apply multipliers.
 *
 * @example
 * const stats: UnitStats = {
 *   hp: 100,
 *   atk: 12,
 *   armor: 20,
 *   speed: 2,
 *   initiative: 8,
 *   range: 1,
 *   attackCount: 1,
 *   dodge: 5,
 * };
 */
export interface UnitStats {
  /** Hit points */
  hp: number;
  /** Attack damage */
  atk: number;
  /** Physical damage reduction */
  armor: number;
  /** Movement cells per turn */
  speed: number;
  /** Turn order priority (higher = first) */
  initiative: number;
  /** Attack range in cells */
  range: number;
  /** Number of attacks per turn */
  attackCount: number;
  /** Dodge chance percentage (0-100) */
  dodge: number;
}

/**
 * Resolve stats for morale system.
 *
 * @example
 * const resolve: ResolveStats = {
 *   resolve: 80,
 *   resolveResist: 10,
 *   resolveTrait: 'steadfast',
 * };
 */
export interface ResolveStats {
  /** Base max resolve (40-100) */
  resolve: number;
  /** Resistance to resolve damage percentage (0-50) */
  resolveResist: number;
  /** Special resolve trait (optional) */
  resolveTrait?: ResolveTrait;
}

/**
 * Complete roguelike unit definition.
 * Includes all stats, metadata, and upgrade information.
 *
 * @example
 * const footman: RoguelikeUnit = {
 *   id: 'footman',
 *   name: 'Footman',
 *   nameRu: 'Пехотинец',
 *   faction: 'humans',
 *   role: 'tank',
 *   tier: 1,
 *   cost: 3,
 *   purchasable: true,
 *   hp: 100,
 *   atk: 12,
 *   armor: 20,
 *   speed: 2,
 *   initiative: 8,
 *   range: 1,
 *   attackCount: 1,
 *   dodge: 5,
 *   resolve: 80,
 *   resolveResist: 0,
 *   description: 'Basic infantry unit',
 *   descriptionRu: 'Базовый пехотный юнит',
 * };
 */
export interface RoguelikeUnit extends UnitStats, ResolveStats {
  /** Unique unit identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Faction this unit belongs to */
  faction: Faction;
  /** Unit role for AI and synergies */
  role: UnitRole;
  /** Unit tier (1, 2, or 3) */
  tier: UnitTier;
  /** Gold cost (T1 purchase cost) */
  cost: number;
  /** Whether unit can be purchased (only T1) */
  purchasable: boolean;
  /** Upgrade cost to reach this tier (undefined for T1) */
  upgradeCost?: number;
  /** Ability ID (T3 units only) */
  abilityId?: string;
  /** Unit description (English) */
  description?: string;
  /** Unit description (Russian) */
  descriptionRu?: string;
  /** Icon/sprite identifier */
  icon?: string;
  /** Base unit ID for upgrade chain (e.g., 'footman' for all footman tiers) */
  baseUnitId?: string;
}

/**
 * Unit upgrade line definition.
 * Defines the T1 → T2 → T3 upgrade path for a unit.
 *
 * @example
 * const footmanLine: UnitUpgradeLine = {
 *   baseId: 'footman',
 *   t1: footmanT1,
 *   t2: footmanT2,
 *   t3: footmanT3,
 * };
 */
export interface UnitUpgradeLine {
  /** Base unit identifier */
  baseId: string;
  /** T1 unit definition */
  t1: RoguelikeUnit;
  /** T2 unit definition */
  t2: RoguelikeUnit;
  /** T3 unit definition */
  t3: RoguelikeUnit;
}

/**
 * Deck card representation.
 * Used in run state to track units in deck/hand.
 *
 * @example
 * const card: DeckCard = {
 *   unitId: 'footman',
 *   tier: 1,
 *   instanceId: 'footman-1',
 * };
 */
export interface DeckCard {
  /** Base unit ID */
  unitId: string;
  /** Current tier of this card */
  tier: UnitTier;
  /** Unique instance ID for this card in the deck */
  instanceId: string;
}

/**
 * Starter deck definition.
 * Pre-built balanced deck for a faction.
 *
 * @example
 * const humansDeck: StarterDeck = {
 *   faction: 'humans',
 *   units: [
 *     { unitId: 'footman', count: 2 },
 *     { unitId: 'swordsman', count: 2 },
 *     // ... 12 units total
 *   ],
 * };
 */
export interface StarterDeck {
  /** Faction this deck belongs to */
  faction: Faction;
  /** Units in the deck with counts */
  units: StarterDeckEntry[];
}

/**
 * Entry in a starter deck.
 *
 * @example
 * const entry: StarterDeckEntry = { unitId: 'footman', count: 2 };
 */
export interface StarterDeckEntry {
  /** Unit ID */
  unitId: string;
  /** Number of copies in deck */
  count: number;
}

/**
 * Tier stat multipliers.
 * Applied to base T1 stats for T2/T3 units.
 */
export const TIER_STAT_MULTIPLIERS: Record<UnitTier, number> = {
  1: 1.0, // Base stats
  2: 1.5, // +50% stats
  3: 2.0, // +100% stats
};

/**
 * Tier resolve bonuses.
 * Additional resolve stats per tier.
 */
export const TIER_RESOLVE_BONUSES: Record<UnitTier, { maxResolve: number; resist: number }> = {
  1: { maxResolve: 0, resist: 0 },
  2: { maxResolve: 15, resist: 10 },
  3: { maxResolve: 15, resist: 10 }, // Cumulative with T2
};

/**
 * Calculate upgrade cost for a tier.
 * T1→T2: 100% of T1 cost, T2→T3: 150% of T1 cost (rounded).
 *
 * @param t1Cost - The T1 purchase cost
 * @param targetTier - The tier to upgrade to (2 or 3)
 * @returns Upgrade cost in gold
 * @example
 * calculateUpgradeCost(3, 2); // 3 (100% of 3)
 * calculateUpgradeCost(3, 3); // 5 (150% of 3, rounded)
 */
export function calculateUpgradeCost(t1Cost: number, targetTier: UnitTier): number {
  if (targetTier === 1) return 0;
  if (targetTier === 2) return t1Cost;
  return Math.round(t1Cost * 1.5);
}

/**
 * Calculate total cost to reach a tier from T1.
 *
 * @param t1Cost - The T1 purchase cost
 * @param targetTier - The target tier
 * @returns Total gold cost (purchase + all upgrades)
 * @example
 * calculateTotalCost(3, 3); // 11 (3 + 3 + 5)
 */
export function calculateTotalCost(t1Cost: number, targetTier: UnitTier): number {
  let total = t1Cost;
  if (targetTier >= 2) total += calculateUpgradeCost(t1Cost, 2);
  if (targetTier >= 3) total += calculateUpgradeCost(t1Cost, 3);
  return total;
}
