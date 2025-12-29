/**
 * Facing mechanic types
 *
 * Defines types for the directional combat system.
 * Units face one of four cardinal directions (N/S/E/W).
 */

import { FacingDirection, AttackArc } from '../../config/mechanics.types';

export { FacingDirection, AttackArc };

/**
 * Position on the grid
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Unit with facing information
 */
export interface FacingUnit {
  id: string;
  position: Position;
  facing: FacingDirection;
}

/**
 * Result of facing calculation
 */
export interface FacingResult {
  attacker: FacingUnit;
  target: FacingUnit;
  arc: AttackArc;
  attackerFacingTarget: boolean;
}

/**
 * Direction vectors for each facing direction
 */
export const DIRECTION_VECTORS: Record<FacingDirection, Position> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
};

/**
 * Opposite directions
 */
export const OPPOSITE_DIRECTIONS: Record<FacingDirection, FacingDirection> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

/**
 * Adjacent directions (for flank detection)
 */
export const ADJACENT_DIRECTIONS: Record<FacingDirection, [FacingDirection, FacingDirection]> = {
  N: ['E', 'W'],
  S: ['E', 'W'],
  E: ['N', 'S'],
  W: ['N', 'S'],
};
