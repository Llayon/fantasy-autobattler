/**
 * Riposte mechanic types
 *
 * Defines types for the counter-attack system.
 * Units can riposte when attacked from the front.
 * Riposte chance is based on Initiative comparison.
 */

import { AttackArc } from '../../config/mechanics.types';
import { Position, FacingDirection } from '../../tier0/facing';

export { AttackArc };

/**
 * Unit with riposte-relevant information
 */
export interface RiposteUnit {
  id: string;
  position: Position;
  facing?: FacingDirection;
  initiative: number;
  atk: number;
  attackCount?: number;
  riposteCharges?: number;
  canRiposte?: boolean;
}

/**
 * Result of riposte check
 */
export interface RiposteCheckResult {
  canRiposte: boolean;
  reason?: string;
  chance: number;
  chargesRemaining: number;
}

/**
 * Result of riposte execution
 */
export interface RiposteResult {
  triggered: boolean;
  damage: number;
  defenderChargesRemaining: number;
}

/**
 * Default riposte configuration values
 */
export const DEFAULT_RIPOSTE_VALUES = {
  baseChance: 0.5,
  initiativeBonus: 0.05,
  chargeLimit: 1,
  riposteDamageMultiplier: 0.5,
  guaranteedThreshold: 10,
};
