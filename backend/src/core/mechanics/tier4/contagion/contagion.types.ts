/**
 * Contagion mechanic types
 *
 * Defines types for status effect spreading system.
 * - Effects can spread to adjacent units
 * - Phalanx formations increase spread chance
 * - Different effects have different spread rates
 */

import { Position } from '../../tier0/facing';

export { Position };

/**
 * Status effect that can spread
 */
export interface SpreadableEffect {
  id: string;
  type: EffectType;
  duration: number;
  stacks?: number;
  sourceId?: string;
}

/**
 * Types of spreadable effects
 */
export type EffectType = 'fire' | 'poison' | 'disease' | 'fear' | 'curse';

/**
 * Unit with contagion-relevant information
 */
export interface ContagionUnit {
  id: string;
  position: Position;
  team: string;
  isAlive: boolean;
  effects?: SpreadableEffect[];
  inPhalanx?: boolean;
}

/**
 * Result of spread calculation
 */
export interface SpreadResult {
  sourceId: string;
  targetId: string;
  effect: SpreadableEffect;
  spreadChance: number;
  didSpread: boolean;
}

/**
 * Result of contagion phase
 */
export interface ContagionPhaseResult {
  spreads: SpreadResult[];
  totalSpreads: number;
  affectedUnits: string[];
}

/**
 * Default spread chances by effect type
 */
export const DEFAULT_SPREAD_CHANCES: Record<EffectType, number> = {
  fire: 0.3,      // 30% base spread
  poison: 0.2,   // 20% base spread
  disease: 0.4,  // 40% base spread
  fear: 0.25,    // 25% base spread
  curse: 0.15,   // 15% base spread
};

/**
 * Default contagion configuration values
 */
export const DEFAULT_CONTAGION_VALUES = {
  phalanxSpreadBonus: 0.2,  // +20% spread chance in phalanx
  maxStacks: 3,             // Maximum stacks per effect
  spreadToEnemies: false,   // Whether effects spread to enemies
  spreadRange: 1,           // Manhattan distance for spread
};
