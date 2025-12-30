/**
 * Overwatch mechanic types
 *
 * Defines types for the vigilance system.
 * - Ranged units can enter overwatch mode
 * - Triggers attack when enemy moves in range
 * - Consumes ammo on trigger
 */

import { Position } from '../../tier0/facing';

export { Position };

/**
 * Unit with overwatch-relevant information
 */
export interface OverwatchUnit {
  id: string;
  position: Position;
  isRanged?: boolean;
  vigilance?: boolean;
  overwatchRange?: number;
  ammo?: number;
}

/**
 * Result of overwatch trigger check
 */
export interface OverwatchTriggerResult {
  triggered: boolean;
  attackerId?: string;
  targetId?: string;
  damage?: number;
}

/**
 * Result of overwatch state change
 */
export interface OverwatchStateResult {
  entered: boolean;
  exited: boolean;
  reason?: string;
}

/**
 * Default overwatch configuration values
 */
export const DEFAULT_OVERWATCH_VALUES = {
  ammoConsumption: 1,
  triggerRange: 5,
  overwatchDamageMultiplier: 0.75,
};
