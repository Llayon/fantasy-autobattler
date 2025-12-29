/**
 * Aura mechanic types
 *
 * Defines types for the territorial effect system.
 * - Static auras: Always active while unit is alive
 * - Pulse auras: Apply effect once per turn
 */

import { AuraType } from '../../config/mechanics.types';
import { Position } from '../../tier0/facing';

export { Position };

export { AuraType };

/**
 * Aura definition
 */
export interface Aura {
  id: string;
  name: string;
  type: AuraType;
  range: number;
  effect: AuraEffect;
  affectsAllies: boolean;
  affectsEnemies: boolean;
  stackable: boolean;
}

/**
 * Aura effect definition
 */
export interface AuraEffect {
  stat?: string;
  modifier?: number;
  isPercentage?: boolean;
  statusEffect?: string;
  damage?: number;
  heal?: number;
}

/**
 * Unit with aura-relevant information
 */
export interface AuraUnit {
  id: string;
  position: Position;
  team: 'player' | 'enemy';
  auras?: Aura[];
  activeAuraEffects?: AppliedAuraEffect[];
}

/**
 * Applied aura effect on a unit
 */
export interface AppliedAuraEffect {
  auraId: string;
  sourceUnitId: string;
  effect: AuraEffect;
  remainingDuration?: number;
}

/**
 * Result of aura application
 */
export interface AuraApplicationResult {
  affectedUnits: string[];
  appliedEffects: AppliedAuraEffect[];
}

/**
 * Result of aura range check
 */
export interface AuraRangeResult {
  inRange: boolean;
  distance: number;
}

/**
 * Default aura configuration values
 */
export const DEFAULT_AURA_VALUES = {
  maxRange: 3,
  stackingLimit: 3,
  defaultRange: 2,
};
