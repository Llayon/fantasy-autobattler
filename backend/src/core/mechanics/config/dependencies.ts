/**
 * Mechanic dependency resolution
 *
 * Defines which mechanics depend on other mechanics.
 * When a mechanic is enabled, its dependencies are automatically enabled.
 *
 * Dependency graph:
 * - flanking → facing
 * - riposte → flanking → facing
 * - intercept → engagement
 * - charge → facing
 * - overwatch → ammunition
 * - phalanx → engagement
 * - lineOfSight → facing
 * - contagion → (no dependencies)
 */

import { MechanicDependency, MechanicsConfig, NormalizedMechanicsConfig } from './mechanics.types';
import { getDefaultConfig } from './defaults';

/**
 * Mechanic dependency definitions
 */
export const MECHANIC_DEPENDENCIES: Record<string, MechanicDependency> = {
  facing: {
    name: 'facing',
    dependencies: [],
    tier: 0,
  },
  armorShred: {
    name: 'armorShred',
    dependencies: [],
    tier: 0,
  },
  resolve: {
    name: 'resolve',
    dependencies: [],
    tier: 1,
  },
  engagement: {
    name: 'engagement',
    dependencies: [],
    tier: 1,
  },
  flanking: {
    name: 'flanking',
    dependencies: ['facing'],
    tier: 1,
  },
  riposte: {
    name: 'riposte',
    dependencies: ['flanking', 'facing'],
    tier: 2,
  },
  intercept: {
    name: 'intercept',
    dependencies: ['engagement'],
    tier: 2,
  },
  aura: {
    name: 'aura',
    dependencies: [],
    tier: 2,
  },
  charge: {
    name: 'charge',
    dependencies: ['facing'],
    tier: 3,
  },
  overwatch: {
    name: 'overwatch',
    dependencies: ['ammunition'],
    tier: 3,
  },
  phalanx: {
    name: 'phalanx',
    dependencies: ['engagement'],
    tier: 3,
  },
  lineOfSight: {
    name: 'lineOfSight',
    dependencies: ['facing'],
    tier: 3,
  },
  ammunition: {
    name: 'ammunition',
    dependencies: [],
    tier: 3,
  },
  contagion: {
    name: 'contagion',
    dependencies: [],
    tier: 4,
  },
};

/**
 * Resolve dependencies for a mechanic
 *
 * Recursively enables all dependencies of a mechanic.
 * Uses depth-first search to handle transitive dependencies.
 *
 * @param mechanicName - Name of the mechanic
 * @param config - Current configuration
 * @param visited - Set of already visited mechanics (for cycle detection)
 * @returns Updated configuration with dependencies enabled
 *
 * @example
 * let config = { riposte: true };
 * config = resolveDependencies('riposte', config);
 * // Result: { riposte: true, flanking: true, facing: true }
 */
export function resolveDependencies(
  mechanicName: string,
  config: MechanicsConfig,
  visited: Set<string> = new Set(),
): MechanicsConfig {
  // Prevent infinite loops
  if (visited.has(mechanicName)) {
    return config;
  }
  visited.add(mechanicName);

  const dependency = MECHANIC_DEPENDENCIES[mechanicName];
  if (!dependency) {
    throw new Error(`Unknown mechanic: ${mechanicName}`);
  }

  // Recursively resolve dependencies
  for (const depName of dependency.dependencies) {
    if (!config[depName as keyof MechanicsConfig]) {
      config = {
        ...config,
        [depName]: true,
      };
      config = resolveDependencies(depName, config, visited);
    }
  }

  return config;
}

/**
 * Resolve all dependencies in a configuration
 *
 * Processes all enabled mechanics and ensures their dependencies are enabled.
 *
 * @param config - Input configuration
 * @returns Configuration with all dependencies resolved
 *
 * @example
 * const config = { riposte: true, contagion: true };
 * const resolved = resolveAllDependencies(config);
 * // Result: { riposte: true, flanking: true, facing: true, contagion: true }
 */
export function resolveAllDependencies(config: MechanicsConfig): MechanicsConfig {
  let result = { ...config };
  const visited = new Set<string>();

  // Process all mechanics
  for (const mechanicName of Object.keys(MECHANIC_DEPENDENCIES)) {
    if (config[mechanicName as keyof MechanicsConfig]) {
      result = resolveDependencies(mechanicName, result, visited);
    }
  }

  return result;
}

/**
 * Normalize configuration to explicit objects
 *
 * Converts boolean values to default configuration objects.
 * Resolves all dependencies.
 *
 * @param config - Input configuration
 * @returns Normalized configuration with all values as objects or false
 *
 * @example
 * const config = { flanking: true, resolve: false };
 * const normalized = normalizeConfig(config);
 * // Result: {
 * //   flanking: { enabled: true, ... },
 * //   facing: { enabled: true, ... },
 * //   resolve: false,
 * //   ...
 * // }
 */
export function normalizeConfig(config: MechanicsConfig): NormalizedMechanicsConfig {
  // First resolve dependencies
  const resolved = resolveAllDependencies(config);

  // Then normalize to objects
  const normalized: any = {};

  for (const mechanicName of Object.keys(MECHANIC_DEPENDENCIES)) {
    const value = resolved[mechanicName as keyof MechanicsConfig];

    if (value === false || value === undefined) {
      normalized[mechanicName] = false;
    } else if (value === true) {
      normalized[mechanicName] = getDefaultConfig(mechanicName);
    } else {
      // Merge with defaults
      const defaults = getDefaultConfig(mechanicName);
      normalized[mechanicName] = {
        ...defaults,
        ...value,
      };
    }
  }

  return normalized as NormalizedMechanicsConfig;
}

/**
 * Get all mechanics that a mechanic depends on (transitively)
 *
 * @param mechanicName - Name of the mechanic
 * @returns Set of all transitive dependencies
 *
 * @example
 * const deps = getTransitiveDependencies('riposte');
 * // Result: Set { 'flanking', 'facing' }
 */
export function getTransitiveDependencies(mechanicName: string): Set<string> {
  const result = new Set<string>();
  const visited = new Set<string>();

  function visit(name: string) {
    if (visited.has(name)) {
      return;
    }
    visited.add(name);

    const dependency = MECHANIC_DEPENDENCIES[name];
    if (!dependency) {
      throw new Error(`Unknown mechanic: ${name}`);
    }

    for (const depName of dependency.dependencies) {
      result.add(depName);
      visit(depName);
    }
  }

  visit(mechanicName);
  return result;
}

/**
 * Check if a mechanic is enabled in a configuration
 *
 * @param mechanicName - Name of the mechanic
 * @param config - Normalized configuration
 * @returns true if mechanic is enabled
 *
 * @example
 * const config = normalizeConfig({ flanking: true });
 * isMechanicEnabled('facing', config); // true
 * isMechanicEnabled('resolve', config); // false
 */
export function isMechanicEnabled(mechanicName: string, config: NormalizedMechanicsConfig): boolean {
  const value = config[mechanicName as keyof NormalizedMechanicsConfig];
  return value !== false;
}

/**
 * Get all enabled mechanics in a configuration
 *
 * @param config - Normalized configuration
 * @returns Array of enabled mechanic names
 *
 * @example
 * const config = normalizeConfig({ flanking: true, resolve: false });
 * getEnabledMechanics(config);
 * // Result: ['flanking', 'facing', ...]
 */
export function getEnabledMechanics(config: NormalizedMechanicsConfig): string[] {
  return Object.keys(MECHANIC_DEPENDENCIES).filter((name) =>
    isMechanicEnabled(name, config),
  );
}
