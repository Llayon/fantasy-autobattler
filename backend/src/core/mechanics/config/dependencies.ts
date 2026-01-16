/**
 * Core Mechanics 2.0 - Dependency Resolution
 *
 * Handles automatic resolution of mechanic dependencies.
 * When a mechanic is enabled, all its dependencies are automatically enabled.
 *
 * @module core/mechanics/config
 */

import type { MechanicsConfig } from './mechanics.types';
import {
  DEFAULT_RESOLVE_CONFIG,
  DEFAULT_ENGAGEMENT_CONFIG,
  DEFAULT_RIPOSTE_CONFIG,
  DEFAULT_INTERCEPT_CONFIG,
  DEFAULT_CHARGE_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_LOS_CONFIG,
  DEFAULT_AMMO_CONFIG,
  DEFAULT_CONTAGION_CONFIG,
  DEFAULT_SHRED_CONFIG,
} from './defaults';
import { MVP_PRESET } from './presets/mvp';

/**
 * Dependency graph for mechanics.
 * Key: mechanic name
 * Value: array of required mechanics
 *
 * @example
 * // riposte requires flanking, which requires facing
 * MECHANIC_DEPENDENCIES.riposte // ['flanking']
 * MECHANIC_DEPENDENCIES.flanking // ['facing']
 */
export const MECHANIC_DEPENDENCIES: Record<
  keyof MechanicsConfig,
  (keyof MechanicsConfig)[]
> = {
  // Tier 0 (independent)
  facing: [],
  armorShred: [], // Fully independent!

  // Tier 1
  resolve: [],
  engagement: [],
  flanking: ['facing'],
  ammunition: [],

  // Tier 2
  riposte: ['flanking'], // flanking → facing
  intercept: ['engagement'],
  aura: [],

  // Tier 3
  charge: ['intercept'], // intercept → engagement
  overwatch: ['intercept', 'ammunition'],
  phalanx: ['facing'],
  lineOfSight: ['facing'],

  // Tier 4
  contagion: [], // Independent, but designed to counter phalanx
};

/**
 * Returns default configuration for a mechanic.
 *
 * @param mechanic - Mechanic name
 * @returns Default config (true for boolean, object for configurable)
 *
 * @example
 * getDefaultConfig('facing') // true
 * getDefaultConfig('resolve') // { maxResolve: 100, ... }
 */
export function getDefaultConfig(
  mechanic: keyof MechanicsConfig,
): boolean | object {
  const defaults: Record<keyof MechanicsConfig, boolean | object> = {
    facing: true,
    resolve: DEFAULT_RESOLVE_CONFIG,
    engagement: DEFAULT_ENGAGEMENT_CONFIG,
    flanking: true,
    riposte: DEFAULT_RIPOSTE_CONFIG,
    intercept: DEFAULT_INTERCEPT_CONFIG,
    aura: true,
    charge: DEFAULT_CHARGE_CONFIG,
    overwatch: true,
    phalanx: DEFAULT_PHALANX_CONFIG,
    lineOfSight: DEFAULT_LOS_CONFIG,
    ammunition: DEFAULT_AMMO_CONFIG,
    contagion: DEFAULT_CONTAGION_CONFIG,
    armorShred: DEFAULT_SHRED_CONFIG,
  };

  return defaults[mechanic] ?? true;
}

/**
 * Resolves mechanic dependencies recursively.
 * Enabling a mechanic auto-enables all its dependencies.
 *
 * @param config - User-provided mechanics configuration (partial)
 * @returns Resolved configuration with all dependencies enabled
 *
 * @example
 * // User enables riposte only
 * const input = { riposte: true };
 * const resolved = resolveDependencies(input);
 * // resolved.flanking = true (dependency)
 * // resolved.facing = true (transitive dependency)
 *
 * @example
 * // User enables overwatch
 * const input = { overwatch: true };
 * const resolved = resolveDependencies(input);
 * // resolved.intercept = { ... } (dependency)
 * // resolved.engagement = { ... } (transitive)
 * // resolved.ammunition = { ... } (dependency)
 */
export function resolveDependencies(
  config: Partial<MechanicsConfig>,
): MechanicsConfig {
  const resolved: MechanicsConfig = { ...MVP_PRESET, ...config };

  // Iterate until no changes (handles transitive deps)
  let changed = true;
  while (changed) {
    changed = false;

    for (const [mechanic, deps] of Object.entries(MECHANIC_DEPENDENCIES)) {
      const key = mechanic as keyof MechanicsConfig;

      // If mechanic is enabled, enable all its dependencies
      if (resolved[key]) {
        for (const dep of deps) {
          if (!resolved[dep]) {
            // Use type assertion since we know the structure
            (resolved as Record<keyof MechanicsConfig, unknown>)[dep] =
              getDefaultConfig(dep);
            changed = true;
          }
        }
      }
    }
  }

  return resolved;
}
