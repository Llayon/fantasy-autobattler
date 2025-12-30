/**
 * Line of Sight mechanic types
 *
 * Defines types for the visibility system.
 * - Direct Fire: blocked by units
 * - Arc Fire: ignores obstacles but has accuracy penalty
 */

import { Position } from '../../tier0/facing';

export { Position };

/**
 * Unit with LoS-relevant information
 */
export interface LoSUnit {
  id: string;
  position: Position;
  isRanged?: boolean;
  canArcFire?: boolean;
}

/**
 * Fire type for ranged attacks
 */
export type FireType = 'direct' | 'arc';

/**
 * Result of LoS check
 */
export interface LoSResult {
  hasLineOfSight: boolean;
  blockedBy?: string[];
  fireType: FireType;
  accuracyPenalty: number;
}

/**
 * Result of Bresenham line calculation
 */
export interface LineResult {
  points: Position[];
  blocked: boolean;
  blockedAt?: Position | undefined;
}

/**
 * Default LoS configuration values
 */
export const DEFAULT_LOS_VALUES = {
  directFireBlocked: true,
  arcFirePenalty: 0.2,
  arcFireEnabled: true,
};
