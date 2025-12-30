/**
 * Core Mechanics 2.0 - Helper Utilities
 *
 * Immutable state update helpers for mechanics processors.
 *
 * @module core/mechanics
 */

import type { BattleState, BattleUnit } from '../types';

/**
 * Updates a single unit in the battle state immutably.
 *
 * @param state - Current battle state
 * @param updatedUnit - Unit with updated properties
 * @returns New battle state with updated unit
 *
 * @example
 * const updated = updateUnit(state, { ...unit, currentHp: 50 });
 */
export function updateUnit(
  state: BattleState,
  updatedUnit: BattleUnit,
): BattleState {
  return {
    ...state,
    units: state.units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)),
  };
}

/**
 * Updates multiple units in the battle state immutably.
 *
 * @param state - Current battle state
 * @param updatedUnits - Array of units with updated properties
 * @returns New battle state with updated units
 *
 * @example
 * const updated = updateUnits(state, [
 *   { ...attacker, currentHp: 80 },
 *   { ...defender, currentHp: 50 },
 * ]);
 */
export function updateUnits(
  state: BattleState,
  updatedUnits: BattleUnit[],
): BattleState {
  const updatedMap = new Map(updatedUnits.map((u) => [u.id, u]));

  return {
    ...state,
    units: state.units.map((u) => updatedMap.get(u.id) ?? u),
  };
}

/**
 * Finds a unit by ID in the battle state.
 *
 * @param state - Current battle state
 * @param unitId - ID of the unit to find
 * @returns The unit if found, undefined otherwise
 *
 * @example
 * const target = findUnit(state, targetId);
 * if (target) {
 *   // Process target
 * }
 */
export function findUnit(
  state: BattleState,
  unitId: string,
): BattleUnit | undefined {
  return state.units.find((u) => u.id === unitId);
}
