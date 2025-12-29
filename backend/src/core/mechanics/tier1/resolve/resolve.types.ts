/**
 * Resolve mechanic types
 *
 * Defines types for the morale/resolve system.
 * Units have resolve that decreases when taking damage.
 * Low resolve causes wavering/routing behavior.
 */

import { ResolveState } from '../../config/mechanics.types';

export { ResolveState };

/**
 * Unit faction for resolve behavior
 */
export type Faction = 'human' | 'undead' | 'demon' | 'beast' | 'elemental';

/**
 * Unit with resolve information
 */
export interface ResolveUnit {
  id: string;
  resolve: number;
  maxResolve: number;
  faction?: Faction;
}

/**
 * Result of resolve state check
 */
export interface ResolveStateResult {
  state: ResolveState;
  shouldRetreat: boolean;
  shouldCrumble: boolean;
  retreatChance: number;
}

/**
 * Result of resolve damage application
 */
export interface ResolveDamageResult {
  previousResolve: number;
  newResolve: number;
  damage: number;
  stateChanged: boolean;
  previousState: ResolveState;
  newState: ResolveState;
}

/**
 * Default resolve configuration values
 */
export const DEFAULT_RESOLVE_VALUES = {
  maxResolve: 100,
  recoveryPerTurn: 10,
  wavering: 50,
  routing: 0,
  humanRetreatChance: 0.3,
  undeadCrumbleChance: 0.5,
};
