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
 * Uses instanceId for matching (unique battle instance identifier) with fallback
 * to id (unit type) for backward compatibility with tests.
 *
 * @param state - Current battle state (not modified)
 * @param updatedUnit - Unit with updated properties (must have same instanceId as existing unit)
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
    // Match by instanceId (unique battle instance) with fallback to id (unit type)
    // instanceId is used in actual battles, id is used in some unit tests
    units: state.units.map((u) => {
      // Primary match: instanceId (unique per battle instance)
      if (updatedUnit.instanceId && u.instanceId === updatedUnit.instanceId) {
        return updatedUnit;
      }
      // Fallback match: id (unit type, for backward compatibility with tests)
      if (!updatedUnit.instanceId && u.id === updatedUnit.id) {
        return updatedUnit;
      }
      return u;
    }),
  };
}

/**
 * Updates multiple units in the battle state immutably.
 * More efficient than calling updateUnit multiple times.
 *
 * Uses instanceId for matching (unique battle instance identifier) with fallback
 * to id (unit type) for backward compatibility with tests.
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
  // Create maps for both instanceId and id lookups
  const updatedByInstanceId = new Map(
    updatedUnits
      .filter((u) => u.instanceId)
      .map((u) => [u.instanceId, u]),
  );
  const updatedById = new Map(
    updatedUnits
      .filter((u) => !u.instanceId)
      .map((u) => [u.id, u]),
  );

  return {
    ...state,
    // Match by instanceId (unique battle instance) with fallback to id (unit type)
    units: state.units.map((u) => {
      // Primary match: instanceId (unique per battle instance)
      if (u.instanceId && updatedByInstanceId.has(u.instanceId)) {
        return updatedByInstanceId.get(u.instanceId) ?? u;
      }
      // Fallback match: id (unit type, for backward compatibility with tests)
      if (updatedById.has(u.id)) {
        return updatedById.get(u.id) ?? u;
      }
      return u;
    }),
  };
}

/**
 * Finds a unit by ID in the battle state.
 * Useful for looking up units by their instance ID during mechanics processing.
 *
 * Searches by instanceId first (unique battle instance), then falls back to id (unit type).
 *
 * @param state - Current battle state to search
 * @param unitId - ID of the unit to find (matches instanceId or id property)
 * @returns The unit if found, undefined otherwise
 *
 * @example
 * // Find target unit by instanceId
 * const target = findUnit(state, 'player_knight_0');
 * if (target && target.alive) {
 *   // Process target
 * }
 *
 * @example
 * // Check if unit still exists after AoO
 * const unit = findUnit(newState, movingUnit.instanceId);
 * if (!unit?.alive) {
 *   // Unit died during movement
 *   return newState;
 * }
 */
export function findUnit(
  state: BattleState,
  unitId: string,
): BattleUnit | undefined {
  // Primary search: by instanceId (unique per battle instance)
  const byInstanceId = state.units.find((u) => u.instanceId === unitId);
  if (byInstanceId) {
    return byInstanceId;
  }
  // Fallback search: by id (unit type, for backward compatibility with tests)
  return state.units.find((u) => u.id === unitId);
}
