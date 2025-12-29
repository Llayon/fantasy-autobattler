/**
 * Facing processor
 *
 * Implements directional combat system.
 * Units face one of four cardinal directions (N/S/E/W).
 * Attack arc is determined by attacker position relative to target facing.
 */

import { AttackArc } from '../../config/mechanics.types';
import {
  FacingDirection,
  FacingUnit,
  FacingResult,
  Position,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
} from './facing.types';

/**
 * Get the facing direction of a unit
 *
 * @param unit - Unit to get facing from
 * @returns Facing direction or default 'S' if not set
 *
 * @example
 * const facing = getFacing(unit);
 * // Returns 'N', 'S', 'E', or 'W'
 */
export function getFacing(unit: { facing?: FacingDirection }): FacingDirection {
  return unit.facing ?? 'S';
}

/**
 * Calculate direction from one position to another
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Primary direction from 'from' to 'to'
 *
 * @example
 * const dir = getDirectionTo({ x: 0, y: 0 }, { x: 1, y: 0 });
 * // Returns 'E'
 */
export function getDirectionTo(from: Position, to: Position): FacingDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Prioritize vertical movement if equal
  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy < 0 ? 'N' : 'S';
  }
  return dx > 0 ? 'E' : 'W';
}

/**
 * Face a unit towards a target position
 *
 * @param unit - Unit to rotate
 * @param targetPosition - Position to face towards
 * @returns New unit with updated facing
 *
 * @example
 * const rotated = faceTarget(unit, { x: 5, y: 5 });
 */
export function faceTarget<T extends { position: Position; facing?: FacingDirection }>(
  unit: T,
  targetPosition: Position,
): T & { facing: FacingDirection } {
  const newFacing = getDirectionTo(unit.position, targetPosition);
  return {
    ...unit,
    facing: newFacing,
  };
}

/**
 * Get the attack arc based on attacker position relative to target facing
 *
 * Attack arcs:
 * - FRONT: Attacker is in front of target (target is facing attacker)
 * - FLANK: Attacker is to the side of target
 * - REAR: Attacker is behind target (target is facing away)
 *
 * @param attackerPosition - Position of the attacker
 * @param target - Target unit with position and facing
 * @returns Attack arc (FRONT, FLANK, or REAR)
 *
 * @example
 * const arc = getAttackArc({ x: 0, y: 0 }, { position: { x: 0, y: 1 }, facing: 'N' });
 * // Returns AttackArc.FRONT (target is facing the attacker)
 */
export function getAttackArc(
  attackerPosition: Position,
  target: { position: Position; facing?: FacingDirection },
): AttackArc {
  const targetFacing = getFacing(target);

  // Direction from target to attacker
  const directionToAttacker = getDirectionTo(target.position, attackerPosition);

  // If target is facing the attacker, it's a front attack
  if (targetFacing === directionToAttacker) {
    return AttackArc.FRONT;
  }

  // If target is facing away from attacker, it's a rear attack
  if (OPPOSITE_DIRECTIONS[targetFacing] === directionToAttacker) {
    return AttackArc.REAR;
  }

  // Otherwise it's a flank attack
  return AttackArc.FLANK;
}

/**
 * Check if attacker is facing the target
 *
 * @param attacker - Attacking unit
 * @param targetPosition - Position of the target
 * @returns true if attacker is facing the target
 *
 * @example
 * const isFacing = isAttackerFacingTarget(attacker, target.position);
 */
export function isAttackerFacingTarget(
  attacker: { position: Position; facing?: FacingDirection },
  targetPosition: Position,
): boolean {
  const attackerFacing = getFacing(attacker);
  const directionToTarget = getDirectionTo(attacker.position, targetPosition);
  return attackerFacing === directionToTarget;
}

/**
 * Calculate full facing result for an attack
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @returns Complete facing result with arc and facing information
 *
 * @example
 * const result = calculateFacingResult(attacker, target);
 * // result.arc === AttackArc.REAR
 * // result.attackerFacingTarget === true
 */
export function calculateFacingResult(
  attacker: FacingUnit,
  target: FacingUnit,
): FacingResult {
  return {
    attacker,
    target,
    arc: getAttackArc(attacker.position, target),
    attackerFacingTarget: isAttackerFacingTarget(attacker, target.position),
  };
}

/**
 * Get all positions in front of a unit
 *
 * @param unit - Unit to check
 * @param range - How far to check (default 1)
 * @returns Array of positions in front of the unit
 *
 * @example
 * const frontPositions = getPositionsInFront(unit, 2);
 */
export function getPositionsInFront(
  unit: { position: Position; facing?: FacingDirection },
  range: number = 1,
): Position[] {
  const facing = getFacing(unit);
  const vector = DIRECTION_VECTORS[facing];
  const positions: Position[] = [];

  for (let i = 1; i <= range; i++) {
    positions.push({
      x: unit.position.x + vector.x * i,
      y: unit.position.y + vector.y * i,
    });
  }

  return positions;
}

/**
 * Get all positions behind a unit
 *
 * @param unit - Unit to check
 * @param range - How far to check (default 1)
 * @returns Array of positions behind the unit
 */
export function getPositionsBehind(
  unit: { position: Position; facing?: FacingDirection },
  range: number = 1,
): Position[] {
  const facing = getFacing(unit);
  const oppositeFacing = OPPOSITE_DIRECTIONS[facing];
  const vector = DIRECTION_VECTORS[oppositeFacing];
  const positions: Position[] = [];

  for (let i = 1; i <= range; i++) {
    positions.push({
      x: unit.position.x + vector.x * i,
      y: unit.position.y + vector.y * i,
    });
  }

  return positions;
}

/**
 * Rotate a unit by 90 degrees
 *
 * @param unit - Unit to rotate
 * @param clockwise - true for clockwise, false for counter-clockwise
 * @returns New unit with updated facing
 */
export function rotate90<T extends { facing?: FacingDirection }>(
  unit: T,
  clockwise: boolean = true,
): T & { facing: FacingDirection } {
  const currentFacing = getFacing(unit);
  const rotationOrder: FacingDirection[] = clockwise
    ? ['N', 'E', 'S', 'W']
    : ['N', 'W', 'S', 'E'];

  const currentIndex = rotationOrder.indexOf(currentFacing);
  const newIndex = (currentIndex + 1) % 4;
  const newFacing = rotationOrder[newIndex];

  return {
    ...unit,
    facing: newFacing,
  } as T & { facing: FacingDirection };
}

/**
 * Rotate a unit by 180 degrees (about face)
 *
 * @param unit - Unit to rotate
 * @returns New unit with opposite facing
 */
export function rotate180<T extends { facing?: FacingDirection }>(
  unit: T,
): T & { facing: FacingDirection } {
  const currentFacing = getFacing(unit);
  return {
    ...unit,
    facing: OPPOSITE_DIRECTIONS[currentFacing],
  };
}
