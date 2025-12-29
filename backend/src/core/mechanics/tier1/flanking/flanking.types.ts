/**
 * Flanking mechanic types
 *
 * Defines types for the flanking damage system.
 * Attacks from different arcs deal different damage.
 */

import { AttackArc } from '../../config/mechanics.types';
import { Position, FacingDirection } from '../../tier0/facing';

export { AttackArc };

/**
 * Unit with flanking-relevant information
 */
export interface FlankingUnit {
  id: string;
  position: Position;
  facing?: FacingDirection;
  atk?: number;
}

/**
 * Result of flanking damage calculation
 */
export interface FlankingDamageResult {
  arc: AttackArc;
  baseDamage: number;
  damageModifier: number;
  finalDamage: number;
  resolveDamage: number;
  disablesRiposte: boolean;
}

/**
 * Default flanking configuration values
 */
export const DEFAULT_FLANKING_VALUES = {
  frontDamageModifier: 1.0,
  flankDamageModifier: 1.3,
  rearDamageModifier: 1.5,
  resolveDamageModifier: 0.25,
};
