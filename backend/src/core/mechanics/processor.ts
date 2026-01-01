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
import { createFacingProcessor } from './tier0/facing/facing.processor';
import { createResolveProcessor } from './tier1/resolve/resolve.processor';
import { createEngagementProcessor } from './tier1/engagement/engagement.processor';
import { createFlankingProcessor } from './tier1/flanking/flanking.processor';
import { createRiposteProcessor } from './tier2/riposte/riposte.processor';
import { createInterceptProcessor } from './tier2/intercept/intercept.processor';
import { createAuraProcessor } from './tier2/aura/aura.processor';

/**
 * Battle action types for mechanics processing.
 *
 * - move: Unit movement across the grid
 * - attack: Basic attack against a target
 * - ability: Special ability usage
 * - wait: Skip turn without action
 *
 * @example
 * const actionType: BattleActionType = 'attack';
 */
export type BattleActionType = 'move' | 'attack' | 'ability' | 'wait';

/**
 * Battle action for mechanics context.
 * Describes the action being performed by the active unit.
 *
 * @example
 * // Move action
 * const moveAction: BattleAction = {
 *   type: 'move',
 *   path: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
 * };
 *
 * @example
 * // Attack action
 * const attackAction: BattleAction = {
 *   type: 'attack',
 *   targetId: 'enemy_1',
 * };
 */
export interface BattleAction {
  /** Action type being performed */
  type: BattleActionType;

  /** Target unit ID (required for attack/ability actions) */
  targetId?: string;

  /** Movement path as array of positions (required for move actions) */
  path?: Position[];

  /** Ability ID being used (required for ability actions) */
  abilityId?: string;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Battle phases where mechanics can be applied.
 * Mechanics are triggered at specific phases during combat resolution.
 *
 * Phase order during a unit's turn:
 * 1. turn_start - Beginning of unit's turn (resolve regen, aura pulses)
 * 2. movement - Unit movement phase (engagement checks, intercepts)
 * 3. pre_attack - Before attack resolution (facing, flanking calculation)
 * 4. attack - During attack (armor shred, riposte triggers)
 * 5. post_attack - After attack (resolve damage, formation updates)
 * 6. turn_end - End of unit's turn (effect spreading, state resets)
 *
 * @example
 * const phase: BattlePhase = 'pre_attack';
 * const newState = processor.process(phase, state, context);
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
 * Contains all information needed for mechanics to make decisions.
 *
 * @example
 * const context: PhaseContext = {
 *   activeUnit: currentUnit,
 *   target: targetUnit,
 *   action: { type: 'attack', targetId: targetUnit.instanceId },
 *   seed: 12345,
 * };
 */
export interface PhaseContext {
  /** The unit currently taking its turn */
  activeUnit: BattleUnit;

  /** Target unit for attack/ability actions (undefined for movement/wait) */
  target?: BattleUnit;

  /** Current action being performed by the active unit */
  action?: BattleAction;

  /** Random seed for deterministic behavior (ensures reproducible results) */
  seed: number;
}

/**
 * Individual mechanic processor interface.
 * Each mechanic implements this interface to integrate with the phase system.
 *
 * @example
 * const facingProcessor: MechanicProcessor = {
 *   apply: (phase, state, context) => {
 *     if (phase === 'pre_attack') {
 *       // Auto-face target before attack
 *     }
 *     return state;
 *   },
 * };
 */
export interface MechanicProcessor {
  /**
   * Apply this mechanic for the given phase.
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action info
   * @returns Updated battle state (may be unchanged if mechanic doesn't apply)
   */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}

/**
 * Map of mechanic names to their processors.
 * Only contains processors for enabled mechanics.
 *
 * @example
 * const processors: MechanicProcessorMap = {
 *   facing: createFacingProcessor(),
 *   flanking: createFlankingProcessor(),
 * };
 */
export type MechanicProcessorMap = Partial<
  Record<keyof MechanicsConfig, MechanicProcessor>
>;

/**
 * Main mechanics processor interface.
 * Orchestrates all enabled mechanics and applies them during battle phases.
 *
 * @example
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 *
 * // Process a phase
 * const newState = processor.process('pre_attack', state, {
 *   activeUnit: attacker,
 *   target: defender,
 *   action: { type: 'attack', targetId: defender.instanceId },
 *   seed: 12345,
 * });
 */
export interface MechanicsProcessor {
  /** Resolved configuration with all dependencies enabled */
  readonly config: MechanicsConfig;

  /** Individual mechanic processors for enabled mechanics */
  readonly processors: MechanicProcessorMap;

  /**
   * Apply all enabled mechanics for a given phase.
   * Mechanics are applied in tier order (Tier 0 → Tier 4).
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action info
   * @returns Updated battle state with all mechanics applied
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
 *
 * Phase-to-mechanic mapping:
 * - turn_start: resolve (regen), ammunition (reload), aura (pulse), phalanx (recalc)
 * - movement: engagement (ZoC), intercept (blocking), overwatch (trigger), charge (momentum)
 * - pre_attack: engagement (penalty), facing (auto-face), flanking (arc), charge (bonus), los (check), ammunition (consume)
 * - attack: armorShred (apply), riposte (trigger), contagion (apply)
 * - post_attack: resolve (damage), phalanx (recalc)
 * - turn_end: contagion (spread), aura (decay), overwatch (reset)
 *
 * @example
 * const mechanicsToApply = PHASE_MECHANICS['pre_attack'];
 * // ['engagement', 'facing', 'flanking', 'charge', 'lineOfSight', 'ammunition']
 */
export const PHASE_MECHANICS: Record<BattlePhase, (keyof MechanicsConfig)[]> = {
  turn_start: ['resolve', 'ammunition', 'aura', 'phalanx'],
  movement: ['engagement', 'intercept', 'overwatch', 'charge'],
  pre_attack: ['engagement', 'facing', 'flanking', 'charge', 'lineOfSight', 'ammunition'],
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
 * @param config - Resolved mechanics configuration with all dependencies enabled
 * @returns Map of mechanic processors keyed by mechanic name
 *
 * @example
 * const config = resolveDependencies({ flanking: true });
 * const processors = buildProcessors(config);
 * // processors.facing exists (dependency of flanking)
 * // processors.flanking exists
 */
export function buildProcessors(config: MechanicsConfig): MechanicProcessorMap {
  const processors: MechanicProcessorMap = {};

  // Tier 0
  if (config.facing) {
    processors.facing = createFacingProcessor();
  }

  // Tier 1
  if (config.resolve) {
    const resolveConfig =
      typeof config.resolve === 'object' ? config.resolve : undefined;
    if (resolveConfig) {
      processors.resolve = createResolveProcessor(resolveConfig);
    }
  }
  if (config.engagement) {
    const engagementConfig =
      typeof config.engagement === 'object' ? config.engagement : undefined;
    if (engagementConfig) {
      processors.engagement = createEngagementProcessor(engagementConfig);
    }
  }
  if (config.flanking) {
    processors.flanking = createFlankingProcessor();
  }

  // Tier 2
  if (config.riposte) {
    const riposteConfig =
      typeof config.riposte === 'object' ? config.riposte : undefined;
    if (riposteConfig) {
      processors.riposte = createRiposteProcessor(riposteConfig);
    }
  }
  if (config.intercept) {
    const interceptConfig =
      typeof config.intercept === 'object' ? config.intercept : undefined;
    if (interceptConfig) {
      processors.intercept = createInterceptProcessor(interceptConfig);
    }
  }
  if (config.aura) {
    processors.aura = createAuraProcessor();
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
