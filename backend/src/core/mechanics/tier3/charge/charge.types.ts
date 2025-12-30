/**
 * Charge mechanic types
 *
 * Defines types for the cavalry momentum system.
 * - Momentum builds based on distance moved
 * - Charge bonus applies to damage
 * - Spear Wall can counter charges
 */

import { Position } from '../../tier0/facing';

export { Position };

/**
 * Unit with charge-relevant information
 */
export interface ChargeUnit {
  id: string;
  position: Position;
  tags?: string[];
  momentum?: number;
  isCharging?: boolean;
  atk: number;
}

/**
 * Result of momentum calculation
 */
export interface MomentumResult {
  momentum: number;
  distanceMoved: number;
  bonusMultiplier: number;
  meetsMinDistance: boolean;
}

/**
 * Result of charge damage calculation
 */
export interface ChargeDamageResult {
  baseDamage: number;
  momentumBonus: number;
  finalDamage: number;
  shockResolveDamage: number;
  wasCountered: boolean;
  counterDamage: number;
}

/**
 * Result of spear wall counter check
 */
export interface SpearWallResult {
  countered: boolean;
  counterDamage: number;
  chargeStops: boolean;
}

/**
 * Default charge configuration values
 */
export const DEFAULT_CHARGE_VALUES = {
  momentumPerCell: 0.2,
  maxMomentum: 1.0,
  shockResolveDamage: 10,
  minChargeDistance: 3,
  spearWallCounterDamage: 0.5,
  spearWallTypes: ['spearman', 'pikeman', 'halberdier'],
  cavalryTypes: ['cavalry', 'knight', 'lancer'],
};
