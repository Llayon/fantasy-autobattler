/**
 * Phalanx processor
 *
 * Implements formation system.
 * - Adjacent allies provide armor and resolve bonuses
 * - +1 armor per adjacent ally (max +5)
 * - +5 resolve per adjacent ally (max +25)
 * - Formation recalculates after casualties
 */

import { PhalanxConfig } from '../../config/mechanics.types';
import { Position } from '../../tier0/facing';
import {
  PhalanxUnit,
  PhalanxBonus,
  PhalanxResult,
  FormationInfo,
  DEFAULT_PHALANX_VALUES,
} from './phalanx.types';

/**
 * Calculate Manhattan distance between two positions
 *
 * @param a - First position
 * @param b - Second position
 * @returns Manhattan distance
 */
export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if two positions are adjacent (Manhattan distance = 1)
 *
 * @param a - First position
 * @param b - Second position
 * @returns true if positions are adjacent
 */
export function isAdjacent(a: Position, b: Position): boolean {
  return getDistance(a, b) === 1;
}

/**
 * Get all adjacent positions
 *
 * @param position - Center position
 * @returns Array of adjacent positions
 */
export function getAdjacentPositions(position: Position): Position[] {
  return [
    { x: position.x - 1, y: position.y },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y - 1 },
    { x: position.x, y: position.y + 1 },
  ];
}

/**
 * Find adjacent allies for a unit
 *
 * @param unit - Unit to check
 * @param allUnits - All units on the battlefield
 * @returns Array of adjacent ally units
 */
export function findAdjacentAllies(
  unit: PhalanxUnit,
  allUnits: PhalanxUnit[],
): PhalanxUnit[] {
  return allUnits.filter((other) => {
    if (other.id === unit.id) return false;
    if (other.team !== unit.team) return false;
    if (other.isAlive === false) return false;
    return isAdjacent(unit.position, other.position);
  });
}

/**
 * Calculate phalanx bonus for a unit
 *
 * @param unit - Unit to calculate bonus for
 * @param allUnits - All units on the battlefield
 * @param config - Optional phalanx configuration
 * @returns Phalanx result
 *
 * @example
 * const result = calculatePhalanxBonus(unit, allUnits);
 * if (result.inPhalanx) {
 *   // Apply armor and resolve bonuses
 * }
 */
export function calculatePhalanxBonus(
  unit: PhalanxUnit,
  allUnits: PhalanxUnit[],
  config?: Partial<PhalanxConfig>,
): PhalanxResult {
  const minSize = config?.minFormationSize ?? DEFAULT_PHALANX_VALUES.minFormationSize;
  const armorPerAlly = config?.armorBonus ?? DEFAULT_PHALANX_VALUES.armorPerAlly;
  const resolvePerAlly = config?.resolveBonus ?? DEFAULT_PHALANX_VALUES.resolvePerAlly;
  const maxArmor = DEFAULT_PHALANX_VALUES.maxArmorBonus;
  const maxResolve = DEFAULT_PHALANX_VALUES.maxResolveBonus;

  const adjacentAllies = findAdjacentAllies(unit, allUnits);
  const allyCount = adjacentAllies.length;

  // Need minimum allies to form phalanx
  if (allyCount < minSize - 1) {
    return {
      inPhalanx: false,
      adjacentAllies: [],
      armorBonus: 0,
      resolveBonus: 0,
    };
  }

  const armorBonus = Math.min(maxArmor, allyCount * armorPerAlly);
  const resolveBonus = Math.min(maxResolve, allyCount * resolvePerAlly);

  return {
    inPhalanx: true,
    adjacentAllies: adjacentAllies.map((a) => a.id),
    armorBonus,
    resolveBonus,
  };
}

/**
 * Update phalanx status for a unit
 *
 * @param unit - Unit to update
 * @param allUnits - All units on the battlefield
 * @param config - Optional phalanx configuration
 * @returns Updated unit with phalanx status
 */
export function updatePhalanxStatus<T extends PhalanxUnit>(
  unit: T,
  allUnits: PhalanxUnit[],
  config?: Partial<PhalanxConfig>,
): T {
  const result = calculatePhalanxBonus(unit, allUnits, config);

  return {
    ...unit,
    inPhalanx: result.inPhalanx,
    phalanxBonus: result.inPhalanx
      ? {
          armorBonus: result.armorBonus,
          resolveBonus: result.resolveBonus,
          adjacentAllies: result.adjacentAllies.length,
        }
      : undefined,
  };
}

/**
 * Recalculate phalanx for all units
 *
 * Call this after casualties to update formation bonuses.
 *
 * @param allUnits - All units on the battlefield
 * @param config - Optional phalanx configuration
 * @returns Updated units with phalanx status
 */
export function recalculateAllPhalanx<T extends PhalanxUnit>(
  allUnits: T[],
  config?: Partial<PhalanxConfig>,
): T[] {
  return allUnits.map((unit) => updatePhalanxStatus(unit, allUnits, config));
}

/**
 * Get effective armor including phalanx bonus
 *
 * @param baseArmor - Base armor value
 * @param phalanxBonus - Phalanx bonus (if any)
 * @returns Effective armor
 */
export function getEffectiveArmor(
  baseArmor: number,
  phalanxBonus?: PhalanxBonus,
): number {
  const bonus = phalanxBonus?.armorBonus ?? 0;
  return baseArmor + bonus;
}

/**
 * Get effective resolve including phalanx bonus
 *
 * @param baseResolve - Base resolve value
 * @param phalanxBonus - Phalanx bonus (if any)
 * @returns Effective resolve
 */
export function getEffectiveResolve(
  baseResolve: number,
  phalanxBonus?: PhalanxBonus,
): number {
  const bonus = phalanxBonus?.resolveBonus ?? 0;
  return baseResolve + bonus;
}

/**
 * Get formation info for a team
 *
 * @param team - Team to check ('player' or 'enemy')
 * @param allUnits - All units on the battlefield
 * @param config - Optional phalanx configuration
 * @returns Formation info
 */
export function getFormationInfo(
  team: 'player' | 'enemy',
  allUnits: PhalanxUnit[],
  config?: Partial<PhalanxConfig>,
): FormationInfo {
  const teamUnits = allUnits.filter((u) => u.team === team && u.isAlive !== false);
  const unitsInPhalanx: string[] = [];
  let totalArmorBonus = 0;
  let totalResolveBonus = 0;

  for (const unit of teamUnits) {
    const result = calculatePhalanxBonus(unit, allUnits, config);
    if (result.inPhalanx) {
      unitsInPhalanx.push(unit.id);
      totalArmorBonus += result.armorBonus;
      totalResolveBonus += result.resolveBonus;
    }
  }

  const count = unitsInPhalanx.length;

  return {
    units: unitsInPhalanx,
    totalArmorBonus,
    totalResolveBonus,
    averageBonus: count > 0 ? totalArmorBonus / count : 0,
  };
}

/**
 * Check if removing a unit would break formation
 *
 * @param unitId - ID of unit to check
 * @param allUnits - All units on the battlefield
 * @param config - Optional phalanx configuration
 * @returns Array of unit IDs that would lose phalanx
 */
export function checkFormationBreak(
  unitId: string,
  allUnits: PhalanxUnit[],
  config?: Partial<PhalanxConfig>,
): string[] {
  // Simulate removing the unit
  const remainingUnits = allUnits.filter((u) => u.id !== unitId);
  const affectedUnits: string[] = [];

  for (const unit of remainingUnits) {
    const beforeResult = calculatePhalanxBonus(unit, allUnits, config);
    const afterResult = calculatePhalanxBonus(unit, remainingUnits, config);

    if (beforeResult.inPhalanx && !afterResult.inPhalanx) {
      affectedUnits.push(unit.id);
    }
  }

  return affectedUnits;
}

/**
 * Count units in phalanx for a team
 *
 * @param team - Team to check
 * @param allUnits - All units on the battlefield
 * @param config - Optional phalanx configuration
 * @returns Number of units in phalanx
 */
export function countUnitsInPhalanx(
  team: 'player' | 'enemy',
  allUnits: PhalanxUnit[],
  config?: Partial<PhalanxConfig>,
): number {
  const teamUnits = allUnits.filter((u) => u.team === team && u.isAlive !== false);
  let count = 0;

  for (const unit of teamUnits) {
    const result = calculatePhalanxBonus(unit, allUnits, config);
    if (result.inPhalanx) {
      count++;
    }
  }

  return count;
}
