/**
 * Resolve processor
 *
 * Implements morale/resolve system.
 * - Units start with max resolve (100)
 * - Taking damage reduces resolve
 * - Low resolve causes wavering (reduced effectiveness)
 * - Zero resolve causes routing (humans retreat, undead crumble)
 */

import { ResolveState, ResolveConfig } from '../../config/mechanics.types';
import {
  ResolveUnit,
  ResolveStateResult,
  ResolveDamageResult,
  Faction,
  DEFAULT_RESOLVE_VALUES,
} from './resolve.types';

/**
 * Get the resolve state based on current resolve value
 *
 * @param resolve - Current resolve value
 * @param config - Optional resolve configuration
 * @returns Resolve state (STEADY, WAVERING, or ROUTING)
 *
 * @example
 * const state = getResolveState(30);
 * // Returns ResolveState.WAVERING
 */
export function getResolveState(
  resolve: number,
  config?: Partial<ResolveConfig>,
): ResolveState {
  const wavering = config?.wavering ?? DEFAULT_RESOLVE_VALUES.wavering;
  const routing = config?.routing ?? DEFAULT_RESOLVE_VALUES.routing;

  if (resolve <= routing) {
    return ResolveState.ROUTING;
  }
  if (resolve <= wavering) {
    return ResolveState.WAVERING;
  }
  return ResolveState.STEADY;
}

/**
 * Check resolve state and determine behavior
 *
 * @param unit - Unit to check
 * @param config - Optional resolve configuration
 * @returns Resolve state result with behavior flags
 *
 * @example
 * const result = checkState(unit);
 * if (result.shouldRetreat) { ... }
 */
export function checkState(
  unit: ResolveUnit,
  config?: Partial<ResolveConfig>,
): ResolveStateResult {
  const state = getResolveState(unit.resolve, config);
  const humanRetreatChance = config?.humanRetreatChance ?? DEFAULT_RESOLVE_VALUES.humanRetreatChance;
  const undeadCrumbleChance = config?.undeadCrumbleChance ?? DEFAULT_RESOLVE_VALUES.undeadCrumbleChance;

  let shouldRetreat = false;
  let shouldCrumble = false;
  let retreatChance = 0;

  if (state === ResolveState.ROUTING) {
    if (unit.faction === 'undead') {
      shouldCrumble = true;
      retreatChance = undeadCrumbleChance;
    } else {
      shouldRetreat = true;
      retreatChance = humanRetreatChance;
    }
  }

  return {
    state,
    shouldRetreat,
    shouldCrumble,
    retreatChance,
  };
}

/**
 * Apply resolve damage to a unit
 *
 * @param unit - Unit to damage
 * @param damage - Amount of resolve damage
 * @param config - Optional resolve configuration
 * @returns Result with new resolve value and state changes
 *
 * @example
 * const result = applyDamage(unit, 20);
 * // result.newResolve === 80
 */
export function applyDamage(
  unit: ResolveUnit,
  damage: number,
  config?: Partial<ResolveConfig>,
): ResolveDamageResult {
  const previousResolve = unit.resolve;
  const previousState = getResolveState(previousResolve, config);

  const newResolve = Math.max(0, previousResolve - damage);
  const newState = getResolveState(newResolve, config);

  return {
    previousResolve,
    newResolve,
    damage,
    stateChanged: previousState !== newState,
    previousState,
    newState,
  };
}

/**
 * Regenerate resolve at turn start
 *
 * @param unit - Unit to regenerate
 * @param config - Optional resolve configuration
 * @returns New resolve value
 *
 * @example
 * const newResolve = regenerate(unit);
 */
export function regenerate(
  unit: ResolveUnit,
  config?: Partial<ResolveConfig>,
): number {
  const recoveryPerTurn = config?.recoveryPerTurn ?? DEFAULT_RESOLVE_VALUES.recoveryPerTurn;
  const state = getResolveState(unit.resolve, config);

  // Routing units don't regenerate
  if (state === ResolveState.ROUTING) {
    return unit.resolve;
  }

  return Math.min(unit.maxResolve, unit.resolve + recoveryPerTurn);
}

/**
 * Create a unit with resolve
 *
 * @param id - Unit ID
 * @param faction - Unit faction
 * @param config - Optional resolve configuration
 * @returns Unit with resolve initialized
 */
export function createResolveUnit(
  id: string,
  faction?: Faction,
  config?: Partial<ResolveConfig>,
): ResolveUnit {
  const maxResolve = config?.maxResolve ?? DEFAULT_RESOLVE_VALUES.maxResolve;

  const unit: ResolveUnit = {
    id,
    resolve: maxResolve,
    maxResolve,
  };

  if (faction) {
    unit.faction = faction;
  }

  return unit;
}

/**
 * Update unit with new resolve value
 *
 * @param unit - Unit to update
 * @param newResolve - New resolve value
 * @returns Updated unit
 */
export function updateResolve<T extends ResolveUnit>(
  unit: T,
  newResolve: number,
): T {
  return {
    ...unit,
    resolve: Math.max(0, Math.min(unit.maxResolve, newResolve)),
  };
}

/**
 * Check if unit is steady (full effectiveness)
 *
 * @param unit - Unit to check
 * @param config - Optional resolve configuration
 * @returns true if unit is steady
 */
export function isSteady(
  unit: ResolveUnit,
  config?: Partial<ResolveConfig>,
): boolean {
  return getResolveState(unit.resolve, config) === ResolveState.STEADY;
}

/**
 * Check if unit is wavering (reduced effectiveness)
 *
 * @param unit - Unit to check
 * @param config - Optional resolve configuration
 * @returns true if unit is wavering
 */
export function isWavering(
  unit: ResolveUnit,
  config?: Partial<ResolveConfig>,
): boolean {
  return getResolveState(unit.resolve, config) === ResolveState.WAVERING;
}

/**
 * Check if unit is routing (broken morale)
 *
 * @param unit - Unit to check
 * @param config - Optional resolve configuration
 * @returns true if unit is routing
 */
export function isRouting(
  unit: ResolveUnit,
  config?: Partial<ResolveConfig>,
): boolean {
  return getResolveState(unit.resolve, config) === ResolveState.ROUTING;
}

/**
 * Get resolve percentage
 *
 * @param unit - Unit to check
 * @returns Resolve as percentage (0-100)
 */
export function getResolvePercentage(unit: ResolveUnit): number {
  return Math.round((unit.resolve / unit.maxResolve) * 100);
}
