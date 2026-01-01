/**
 * Core Mechanics 2.0 - Helper Utilities
 *
 * Immutable state update helpers for mechanics processors.
 * These functions ensure battle state is never mutated directly,
 * maintaining functional programming principles for deterministic behavior.
 *
 * @module core/mechanics
 */

import type { BattleState, BattleUnit } from '../types';

/**
 * Updates a single unit in the battle state immutably.
 * Creates a new state object with the updated unit, leaving the original unchanged.
 *
 * @param state - Current battle state (not modified)
 * @param updatedUnit - Unit with updated properties (must have same id as existing unit)
 * @returns New battle state with the updated unit
 * @throws No explicit throw, but unit must exist in state for update to take effect
 *
 * @example
 * // Update unit's HP after taking damage
 * const damagedUnit = { ...unit, currentHp: unit.currentHp - damage };
 * const newState = updateUnit(state, damagedUnit);
 *
 * @example
 * // Update unit's facing direction
 * const rotatedUnit = { ...unit, facing: 'N' as FacingDirection };
 * const newState = updateUnit(state, rotatedUnit);
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
 * More efficient than calling updateUnit multiple times.
 *
 * @param state - Current battle state (not modified)
 * @param updatedUnits - Array of units with updated properties
 * @returns New battle state with all updated units
 *
 * @example
 * // Update both attacker and defender after combat
 * const newState = updateUnits(state, [
 *   { ...attacker, currentHp: attacker.currentHp - counterDamage },
 *   { ...defender, currentHp: defender.currentHp - attackDamage },
 * ]);
 *
 * @example
 * // Update multiple units' engagement status
 * const engagedUnits = unitsInZoC.map(u => ({ ...u, engaged: true }));
 * const newState = updateUnits(state, engagedUnits);
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
 * Useful for looking up units by their instance ID during mechanics processing.
 *
 * @param state - Current battle state to search
 * @param unitId - ID of the unit to find (matches unit.id property)
 * @returns The unit if found, undefined otherwise
 *
 * @example
 * // Find target unit by ID
 * const target = findUnit(state, targetId);
 * if (target && target.alive) {
 *   // Process target
 * }
 *
 * @example
 * // Check if unit still exists after AoO
 * const unit = findUnit(newState, movingUnit.id);
 * if (!unit?.alive) {
 *   // Unit died during movement
 *   return newState;
 * }
 */
export function findUnit(
  state: BattleState,
  unitId: string,
): BattleUnit | undefined {
  return state.units.find((u) => u.id === unitId);
}
