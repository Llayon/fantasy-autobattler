/**
 * Core Mechanics 2.0 - Mechanics Processor
 *
 * Main processor that applies enabled mechanics to battle state.
 * Handles phase integration and mechanic orchestration.
 *
 * @module core/mechanics
 */

import type { MechanicsConfig } from './config/mechanics.types';
import { resolveDependencies } from './config/dependencies';
import type { BattleState, BattleUnit, Position } from '../types';

/**
 * Battle action types for mechanics processing.
 */
export type BattleActionType = 'move' | 'attack' | 'ability' | 'wait';

/**
 * Battle action for mechanics context.
 */
export interface BattleAction {
  /** Action type */
  type: BattleActionType;
  /** Target unit ID (for attack/ability) */
  targetId?: string;
  /** Movement path (for move actions) */
  path?: Position[];
  /** Ability ID (for ability actions) */
  abilityId?: string;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Battle phases where mechanics can be applied.
 */
export type BattlePhase =
  | 'turn_start'
  | 'movement'
  | 'pre_attack'
  | 'attack'
  | 'post_attack'
  | 'turn_end';

/**
 * Context provided to mechanics during phase processing.
 */
export interface PhaseContext {
  /** The unit currently taking its turn */
  activeUnit: BattleUnit;
  /** Target unit (for attack phases) */
  target?: BattleUnit;
  /** Current action being performed */
  action?: BattleAction;
  /** Random seed for deterministic behavior */
  seed: number;
}

/**
 * Individual mechanic processor interface.
 */
export interface MechanicProcessor {
  /** Apply this mechanic for the given phase */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}

/**
 * Map of mechanic names to their processors.
 */
export type MechanicProcessorMap = Partial<
  Record<keyof MechanicsConfig, MechanicProcessor>
>;

/**
 * Main mechanics processor interface.
 */
export interface MechanicsProcessor {
  /** Resolved configuration */
  readonly config: MechanicsConfig;

  /** Individual mechanic processors */
  readonly processors: MechanicProcessorMap;

  /**
   * Apply all enabled mechanics for a given phase.
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context
   * @returns Updated battle state
   */
  process(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}

// ═══════════════════════════════════════════════════════════════
// PHASE-TO-MECHANIC MAPPING
// ═══════════════════════════════════════════════════════════════

/**
 * Mapping of phases to mechanics (in execution order).
 * Mechanics are applied in tier order within each phase.
 */
export const PHASE_MECHANICS: Record<BattlePhase, (keyof MechanicsConfig)[]> = {
  turn_start: ['resolve', 'ammunition', 'aura', 'phalanx'],
  movement: ['engagement', 'intercept', 'overwatch', 'charge'],
  pre_attack: ['facing', 'flanking', 'charge', 'lineOfSight', 'ammunition'],
  attack: ['armorShred', 'riposte', 'contagion'],
  post_attack: ['resolve', 'phalanx'],
  turn_end: ['contagion', 'aura', 'overwatch'],
};

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Builds processor map for enabled mechanics.
 * Only creates processors for mechanics that are enabled in config.
 *
 * @param config - Resolved mechanics configuration
 * @returns Map of mechanic processors
 */
export function buildProcessors(config: MechanicsConfig): MechanicProcessorMap {
  const processors: MechanicProcessorMap = {};

  // Tier 0
  if (config.facing) {
    // Processor will be imported when implemented
    // processors.facing = createFacingProcessor();
  }

  // Tier 1
  if (config.resolve) {
    // processors.resolve = createResolveProcessor(config.resolve);
  }
  if (config.engagement) {
    // processors.engagement = createEngagementProcessor(config.engagement);
  }
  if (config.flanking) {
    // processors.flanking = createFlankingProcessor();
  }

  // Tier 2
  if (config.riposte) {
    // processors.riposte = createRiposteProcessor(config.riposte);
  }
  if (config.intercept) {
    // processors.intercept = createInterceptProcessor(config.intercept);
  }
  if (config.aura) {
    // processors.aura = createAuraProcessor();
  }

  // Tier 3
  if (config.charge) {
    // processors.charge = createChargeProcessor(config.charge);
  }
  if (config.overwatch) {
    // processors.overwatch = createOverwatchProcessor();
  }
  if (config.phalanx) {
    // processors.phalanx = createPhalanxProcessor(config.phalanx);
  }
  if (config.lineOfSight) {
    // processors.lineOfSight = createLoSProcessor(config.lineOfSight);
  }
  if (config.ammunition) {
    // processors.ammunition = createAmmoProcessor(config.ammunition);
  }

  // Tier 4
  if (config.contagion) {
    // processors.contagion = createContagionProcessor(config.contagion);
  }
  if (config.armorShred) {
    // processors.armorShred = createShredProcessor(config.armorShred);
  }

  return processors;
}

/**
 * Applies all enabled mechanics for a given phase.
 * Mechanics are applied in dependency order (Tier 0 → Tier 4).
 *
 * @param phase - Current battle phase
 * @param state - Current battle state
 * @param context - Phase context (active unit, target, etc.)
 * @param config - Resolved mechanics config
 * @param processors - Built mechanic processors
 * @returns Updated battle state
 */
export function applyMechanics(
  phase: BattlePhase,
  state: BattleState,
  context: PhaseContext,
  _config: MechanicsConfig,
  processors: MechanicProcessorMap,
): BattleState {
  let result = state;

  // Get mechanics to apply for this phase (in tier order)
  const mechanicsForPhase = PHASE_MECHANICS[phase];

  for (const mechanic of mechanicsForPhase) {
    const processor = processors[mechanic];
    if (processor) {
      result = processor.apply(phase, result, context);
    }
  }

  return result;
}

/**
 * Creates a mechanics processor from configuration.
 * Dependencies are automatically resolved.
 *
 * @param config - Mechanics configuration (partial, dependencies auto-resolved)
 * @returns Configured mechanics processor
 *
 * @example
 * // Create processor with roguelike preset
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 *
 * @example
 * // Create processor with custom config
 * const processor = createMechanicsProcessor({
 *   facing: true,
 *   flanking: true,
 *   riposte: { initiativeBased: true },
 * });
 * // Dependencies auto-resolved: facing enabled automatically
 */
export function createMechanicsProcessor(
  config: Partial<MechanicsConfig>,
): MechanicsProcessor {
  // 1. Resolve dependencies
  const resolved = resolveDependencies(config);

  // 2. Build individual processors for enabled mechanics
  const processors = buildProcessors(resolved);

  // 3. Return processor interface
  return {
    config: resolved,
    processors,
    process: (phase, state, context) =>
      applyMechanics(phase, state, context, resolved, processors),
  };
}
