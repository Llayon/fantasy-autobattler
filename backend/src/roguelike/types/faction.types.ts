/**
 * Faction Types for Roguelike Mode
 *
 * Defines faction-related types and interfaces for the roguelike run mode.
 * Phase 1 includes 2 factions: Humans and Undead.
 *
 * @module roguelike/types/faction
 */

/**
 * Available factions in Phase 1.
 * Future phases will add: 'order', 'chaos', 'nature', 'shadow', 'arcane', 'machine'
 *
 * @example
 * const faction: Faction = 'humans';
 */
export type Faction = 'humans' | 'undead';

/**
 * Stat types that can receive faction bonuses.
 *
 * @example
 * const stat: FactionBonusStat = 'hp'; // +10% HP for Humans
 */
export type FactionBonusStat = 'hp' | 'atk' | 'armor' | 'dodge' | 'speed' | 'regen';

/**
 * Faction bonus configuration.
 * Each faction provides a percentage bonus to a specific stat.
 *
 * @example
 * const humanBonus: FactionBonus = { stat: 'hp', value: 0.1 }; // +10% HP
 */
export interface FactionBonus {
  /** The stat that receives the bonus */
  stat: FactionBonusStat;
  /** Bonus value as decimal (0.1 = 10%) */
  value: number;
}

/**
 * Complete faction data definition.
 * Contains all information needed to display and apply faction effects.
 *
 * @example
 * const humans: FactionData = {
 *   id: 'humans',
 *   name: 'Humans',
 *   nameRu: 'Люди',
 *   description: 'Balanced, defensive, organized military',
 *   descriptionRu: 'Сбалансированные, оборонительные, организованная армия',
 *   bonus: { stat: 'hp', value: 0.1 },
 *   icon: 'faction-humans',
 * };
 */
export interface FactionData {
  /** Unique faction identifier */
  id: Faction;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Faction description (English) */
  description: string;
  /** Faction description (Russian) */
  descriptionRu: string;
  /** Faction bonus applied to all units */
  bonus: FactionBonus;
  /** Icon identifier for UI */
  icon: string;
}

/**
 * Broken state behavior for faction units.
 * Determines what happens when a unit's resolve reaches 0.
 *
 * - 'retreating': Unit flees toward edge, can Rally at 25+ Resolve (Humans)
 * - 'crumbling': Unit stays in place, loses 15% HP/turn, -50% ATK/Armor (Undead)
 */
export type BrokenStateBehavior = 'retreating' | 'crumbling';

/**
 * Extended faction data with resolve mechanics.
 * Used for battle simulation with morale system.
 *
 * @example
 * const undeadFaction: FactionDataWithResolve = {
 *   ...undeadBase,
 *   brokenBehavior: 'crumbling',
 *   baseResolveRegen: 0,
 *   canSelfRecover: false,
 * };
 */
export interface FactionDataWithResolve extends FactionData {
  /** Behavior when unit resolve reaches 0 */
  brokenBehavior: BrokenStateBehavior;
  /** Base resolve regeneration per turn (0 for Undead) */
  baseResolveRegen: number;
  /** Whether units can recover resolve without external help */
  canSelfRecover: boolean;
}
