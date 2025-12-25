/**
 * Leader Types for Roguelike Mode
 *
 * Defines leader-related types and interfaces for the roguelike run mode.
 * Phase 1 includes 2 leaders: Commander Aldric (Humans) and Lich King Malachar (Undead).
 *
 * @module roguelike/types/leader
 */

import { Faction } from './faction.types';

/**
 * Passive ability effect types.
 * Determines how the passive ability modifies units or gameplay.
 *
 * - 'stat_bonus': Adds percentage bonus to a stat
 * - 'on_damage': Triggers when dealing damage (e.g., life steal)
 * - 'aura': Affects adjacent units
 */
export type PassiveEffectType = 'stat_bonus' | 'on_damage' | 'aura';

/**
 * Passive ability configuration.
 * Each leader has one passive ability that is always active.
 *
 * @example
 * const formation: PassiveAbility = {
 *   id: 'formation',
 *   name: 'Formation',
 *   nameRu: 'Построение',
 *   description: 'Adjacent allies gain +5 armor',
 *   descriptionRu: 'Соседние союзники получают +5 брони',
 *   effectType: 'aura',
 *   effectValue: 5,
 *   effectStat: 'armor',
 *   range: 1,
 * };
 */
export interface PassiveAbility {
  /** Unique passive ability identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Effect description (English) */
  description: string;
  /** Effect description (Russian) */
  descriptionRu: string;
  /** Type of effect */
  effectType: PassiveEffectType;
  /** Numeric value of the effect (percentage or flat) */
  effectValue: number;
  /** Stat affected (for stat_bonus and aura types) */
  effectStat?: string;
  /** Range in cells (for aura type) */
  range?: number;
}

/**
 * Spell timing options.
 * Player selects when each spell should trigger during battle.
 *
 * - 'early': Triggers at battle start (100% team HP)
 * - 'mid': Triggers when any ally drops below 70% HP
 * - 'late': Triggers when any ally drops below 40% HP
 *
 * @example
 * const timing: SpellTiming = 'mid'; // Trigger at 70% HP threshold
 */
export type SpellTiming = 'early' | 'mid' | 'late';

/**
 * Spell target types.
 * Determines what the spell can target.
 *
 * - 'ally_lowest_hp': Targets ally with lowest HP
 * - 'all_allies': Affects all friendly units
 * - 'enemy_highest_hp': Targets enemy with highest HP
 * - 'all_enemies': Affects all enemy units
 * - 'summon': Creates new units
 */
export type SpellTargetType =
  | 'ally_lowest_hp'
  | 'all_allies'
  | 'enemy_highest_hp'
  | 'all_enemies'
  | 'summon';

/**
 * Spell effect types.
 * Determines the primary effect of the spell.
 *
 * - 'heal': Restore HP
 * - 'damage': Deal damage
 * - 'buff': Apply positive status effect
 * - 'debuff': Apply negative status effect
 * - 'summon': Create units
 */
export type SpellEffectType = 'heal' | 'damage' | 'buff' | 'debuff' | 'summon';

/**
 * Spell definition.
 * Each leader has 2 spells available during battle.
 *
 * @example
 * const holyLight: Spell = {
 *   id: 'holy_light',
 *   name: 'Holy Light',
 *   nameRu: 'Святой свет',
 *   description: 'Heal lowest HP ally for 30 HP',
 *   descriptionRu: 'Исцеляет союзника с наименьшим HP на 30',
 *   faction: 'humans',
 *   targetType: 'ally_lowest_hp',
 *   effectType: 'heal',
 *   effectValue: 30,
 *   recommendedTiming: 'mid',
 * };
 */
export interface Spell {
  /** Unique spell identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Effect description (English) */
  description: string;
  /** Effect description (Russian) */
  descriptionRu: string;
  /** Faction this spell belongs to */
  faction: Faction;
  /** What the spell targets */
  targetType: SpellTargetType;
  /** Primary effect type */
  effectType: SpellEffectType;
  /** Numeric value of the effect */
  effectValue: number;
  /** Duration in rounds (for buffs/debuffs) */
  duration?: number;
  /** Recommended timing for this spell */
  recommendedTiming: SpellTiming;
  /** Icon identifier for UI */
  icon?: string;
}

/**
 * Leader definition.
 * Each faction has leaders with unique passives and spell options.
 *
 * @example
 * const aldric: Leader = {
 *   id: 'commander_aldric',
 *   name: 'Commander Aldric',
 *   nameRu: 'Командир Алдрик',
 *   faction: 'humans',
 *   passive: formation,
 *   spellIds: ['holy_light', 'rally'],
 *   portrait: 'leader-aldric',
 *   description: 'A veteran commander who inspires his troops through formation tactics.',
 *   descriptionRu: 'Опытный командир, вдохновляющий войска тактикой построения.',
 * };
 */
export interface Leader {
  /** Unique leader identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Russian) */
  nameRu: string;
  /** Faction this leader belongs to */
  faction: Faction;
  /** Leader's passive ability */
  passive: PassiveAbility;
  /** IDs of available spells (2 spells per leader) */
  spellIds: [string, string];
  /** Portrait image identifier */
  portrait: string;
  /** Leader backstory/description (English) */
  description: string;
  /** Leader backstory/description (Russian) */
  descriptionRu: string;
}

/**
 * Spell execution state during battle.
 * Tracks whether a spell has been triggered.
 *
 * @example
 * const execution: SpellExecution = {
 *   spellId: 'holy_light',
 *   timing: 'mid',
 *   triggered: false,
 * };
 */
export interface SpellExecution {
  /** ID of the spell to execute */
  spellId: string;
  /** Player-selected timing */
  timing: SpellTiming;
  /** Whether the spell has already triggered */
  triggered: boolean;
}

/**
 * HP thresholds for spell timing triggers.
 * Used to determine when spells should activate based on team HP.
 *
 * @example
 * // Check if mid-timing spell should trigger
 * if (allyHpPercent < SPELL_TIMING_THRESHOLDS.mid) {
 *   triggerSpell(spell);
 * }
 */
export const SPELL_TIMING_THRESHOLDS: Record<SpellTiming, number> = {
  early: 1.0, // Triggers immediately at battle start
  mid: 0.7, // Triggers when any ally drops below 70% HP
  late: 0.4, // Triggers when any ally drops below 40% HP
};
