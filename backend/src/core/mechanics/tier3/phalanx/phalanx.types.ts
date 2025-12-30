/**
 * Phalanx mechanic types
 *
 * Defines types for the formation system.
 * - Adjacent allies provide armor and resolve bonuses
 * - Formation breaks when allies die
 */

import { Position, FacingDirection } from '../../tier0/facing';

export { Position, FacingDirection };

/**
 * Unit with phalanx-relevant information
 */
export interface PhalanxUnit {
  id: string;
  position: Position;
  facing?: FacingDirection;
  team: 'player' | 'enemy';
  inPhalanx?: boolean;
  phalanxBonus?: PhalanxBonus;
  isAlive?: boolean;
}

/**
 * Phalanx bonus applied to a unit
 */
export interface PhalanxBonus {
  armorBonus: number;
  resolveBonus: number;
  adjacentAllies: number;
}

/**
 * Result of phalanx calculation
 */
export interface PhalanxResult {
  inPhalanx: boolean;
  adjacentAllies: string[];
  armorBonus: number;
  resolveBonus: number;
}

/**
 * Formation info for a group of units
 */
export interface FormationInfo {
  units: string[];
  totalArmorBonus: number;
  totalResolveBonus: number;
  averageBonus: number;
}

/**
 * Default phalanx configuration values
 */
export const DEFAULT_PHALANX_VALUES = {
  minFormationSize: 2,
  armorPerAlly: 1,
  resolvePerAlly: 5,
  maxArmorBonus: 5,
  maxResolveBonus: 25,
};
