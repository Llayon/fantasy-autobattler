/**
 * Mechanics Processor - Main entry point for applying mechanics
 *
 * Creates and manages mechanics processors based on configuration.
 * Handles phase-based mechanic application during battle simulation.
 *
 * @module core/mechanics/processor
 */

import {
  MechanicsConfig,
  NormalizedMechanicsConfig,
} from './config/mechanics.types';
import { normalizeConfig, getEnabledMechanics } from './config/dependencies';

// Import tier processors
import * as facing from './tier0/facing';
import * as armorShred from './tier4/armor-shred';
import * as resolve from './tier1/resolve';
import * as engagement from './tier1/engagement';
import * as flanking from './tier1/flanking';
import * as riposte from './tier2/riposte';
import * as intercept from './tier2/intercept';
import * as aura from './tier2/aura';
import * as charge from './tier3/charge';
import * as overwatch from './tier3/overwatch';
import * as phalanx from './tier3/phalanx';
import * as los from './tier3/los';
import * as ammunition from './tier3/ammunition';
import * as contagion from './tier4/contagion';

/**
 * Battle phases where mechanics can be applied
 */
export type BattlePhase =
  | 'turn_start'
  | 'movement'
  | 'pre_attack'
  | 'attack'
  | 'post_attack'
  | 'turn_end';

/**
 * Context provided to mechanics during phase processing
 */
export interface PhaseContext {
  /** Unit currently taking their turn */
  activeUnit: any;
  /** Target of the current action (if applicable) */
  target?: any;
  /** Current action being performed */
  action?: BattleAction;
  /** Random seed for deterministic behavior */
  seed: number;
}


/**
 * Battle action types
 */
export interface BattleAction {
  /** Type of action */
  type: 'move' | 'attack' | 'ability' | 'wait';
  /** Target unit ID (for attacks/abilities) */
  targetId?: string;
  /** Path for movement */
  path?: { x: number; y: number }[];
  /** Ability ID (for ability actions) */
  abilityId?: string;
}

/**
 * Individual mechanic processor interface
 */
export interface IndividualMechanicProcessor {
  /** Name of the mechanic */
  name: string;
  /** Apply mechanic for a specific phase */
  apply(phase: BattlePhase, state: any, context: PhaseContext): any;
}

/**
 * Map of mechanic names to their processors
 */
export type MechanicProcessorMap = Partial<Record<string, IndividualMechanicProcessor>>;

/**
 * Main mechanics processor interface
 *
 * Provides a unified interface for applying all enabled mechanics
 * to battle state during different phases.
 */
export interface MechanicsProcessor {
  /** Resolved and normalized configuration */
  readonly config: NormalizedMechanicsConfig;
  /** Individual mechanic processors */
  readonly processors: MechanicProcessorMap;
  /** List of enabled mechanic names */
  readonly enabledMechanics: string[];
  /**
   * Apply all enabled mechanics for a given phase
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit, target, etc.
   * @returns Updated battle state
   */
  process(phase: BattlePhase, state: any, context: PhaseContext): any;
}


/**
 * Mapping of phases to mechanics (in execution order)
 *
 * Mechanics are applied in tier order within each phase:
 * Tier 0 → Tier 1 → Tier 2 → Tier 3 → Tier 4
 */
export const PHASE_MECHANICS: Record<BattlePhase, string[]> = {
  turn_start: ['resolve', 'ammunition', 'aura', 'phalanx'],
  movement: ['engagement', 'intercept', 'overwatch', 'charge'],
  pre_attack: ['facing', 'flanking', 'charge', 'lineOfSight', 'ammunition'],
  attack: ['armorShred', 'riposte', 'contagion'],
  post_attack: ['resolve', 'phalanx'],
  turn_end: ['contagion', 'aura', 'overwatch', 'armorShred'],
};

/**
 * Build individual processors for enabled mechanics
 *
 * Creates processor instances for each enabled mechanic based on
 * the normalized configuration.
 *
 * @param config - Normalized mechanics configuration
 * @returns Map of mechanic names to their processors
 *
 * @example
 * const processors = buildProcessors(normalizedConfig);
 * // processors.facing, processors.flanking, etc.
 */
export function buildProcessors(config: NormalizedMechanicsConfig): MechanicProcessorMap {
  const processors: MechanicProcessorMap = {};

  // Tier 0
  if (config['facing']) {
    processors['facing'] = createFacingProcessor(config['facing']);
  }
  if (config['armorShred']) {
    processors['armorShred'] = createArmorShredProcessor(config['armorShred']);
  }

  // Tier 1
  if (config['resolve']) {
    processors['resolve'] = createResolveProcessor(config['resolve']);
  }
  if (config['engagement']) {
    processors['engagement'] = createEngagementProcessor(config['engagement']);
  }
  if (config['flanking']) {
    processors['flanking'] = createFlankingProcessor(config['flanking']);
  }

  // Tier 2
  if (config['riposte']) {
    processors['riposte'] = createRiposteProcessor(config['riposte']);
  }
  if (config['intercept']) {
    processors['intercept'] = createInterceptProcessor(config['intercept']);
  }
  if (config['aura']) {
    processors['aura'] = createAuraProcessor(config['aura']);
  }

  // Tier 3
  if (config['charge']) {
    processors['charge'] = createChargeProcessor(config['charge']);
  }
  if (config['overwatch']) {
    processors['overwatch'] = createOverwatchProcessor(config['overwatch']);
  }
  if (config['phalanx']) {
    processors['phalanx'] = createPhalanxProcessor(config['phalanx']);
  }
  if (config['lineOfSight']) {
    processors['lineOfSight'] = createLoSProcessor(config['lineOfSight']);
  }
  if (config['ammunition']) {
    processors['ammunition'] = createAmmunitionProcessor(config['ammunition']);
  }

  // Tier 4
  if (config['contagion']) {
    processors['contagion'] = createContagionProcessor(config['contagion']);
  }

  return processors;
}


/**
 * Apply all enabled mechanics for a given phase
 *
 * Mechanics are applied in the order defined in PHASE_MECHANICS.
 * Only enabled mechanics are applied.
 *
 * @param phase - Current battle phase
 * @param state - Current battle state
 * @param context - Phase context
 * @param processors - Map of mechanic processors
 * @returns Updated battle state
 */
export function applyMechanics(
  phase: BattlePhase,
  state: any,
  context: PhaseContext,
  processors: MechanicProcessorMap,
): any {
  let result = state;

  // Get mechanics to apply for this phase (in order)
  const mechanicsForPhase = PHASE_MECHANICS[phase];

  for (const mechanicName of mechanicsForPhase) {
    const processor = processors[mechanicName];
    if (processor) {
      result = processor.apply(phase, result, context);
    }
  }

  return result;
}

/**
 * Create a facing mechanic processor
 *
 * @param _config - Facing configuration (unused, facing has no config options)
 * @returns Individual mechanic processor
 */
function createFacingProcessor(_config: any): IndividualMechanicProcessor {
  return {
    name: 'facing',
    apply: (phase, state, context) => {
      // Facing is primarily used by other mechanics (flanking, riposte)
      // Direct application happens in pre_attack phase
      if (phase === 'pre_attack' && context.target) {
        // Auto-face target before attack
        const updatedUnit = facing.faceTarget(context.activeUnit, context.target.position);
        return updateUnit(state, updatedUnit);
      }
      return state;
    },
  };
}


/**
 * Create an armor shred mechanic processor
 *
 * @param config - Armor shred configuration
 * @returns Individual mechanic processor
 */
function createArmorShredProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'armorShred',
    apply: (phase, state, context) => {
      if (phase === 'attack' && context.target && context.action?.type === 'attack') {
        // Apply shred on physical attack
        const result = armorShred.applyShred(context.target, config.shredPerHit, config);
        const updatedTarget = { ...context.target, armorShred: result.totalShred };
        return updateUnit(state, updatedTarget);
      }

      if (phase === 'turn_end' && config.decayPerTurn > 0) {
        // Decay shred at turn end
        const updatedUnits = state.units.map((u: any) => armorShred.applyDecay(u, config));
        return { ...state, units: updatedUnits };
      }

      return state;
    },
  };
}

/**
 * Create a resolve mechanic processor
 *
 * @param config - Resolve configuration
 * @returns Individual mechanic processor
 */
function createResolveProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'resolve',
    apply: (phase, state, context) => {
      if (phase === 'turn_start') {
        // Regenerate resolve for active unit
        const newResolve = resolve.regenerate(context.activeUnit, config);
        const updatedUnit = resolve.updateResolve(context.activeUnit, newResolve);
        return updateUnit(state, updatedUnit);
      }

      if (phase === 'post_attack' && context.target) {
        // Check for rout/crumble after damage
        const stateResult = resolve.checkState(context.target, config);
        if (stateResult.shouldRetreat || stateResult.shouldCrumble) {
          return handleResolveBreak(state, context.target, stateResult);
        }
      }

      return state;
    },
  };
}


/**
 * Create an engagement mechanic processor
 *
 * @param config - Engagement configuration
 * @returns Individual mechanic processor
 */
function createEngagementProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'engagement',
    apply: (phase, state, context) => {
      if (phase === 'movement') {
        // Check engagement status during movement
        const enemies = state.units.filter((u: any) => u.team !== context.activeUnit.team);
        const engagementResult = engagement.checkEngagement(
          context.activeUnit,
          enemies,
          config,
        );
        if (engagementResult.isEngaged) {
          const updatedUnit = { ...context.activeUnit, engaged: true, engagedWith: engagementResult.engagedWith };
          return updateUnit(state, updatedUnit);
        }
      }
      return state;
    },
  };
}

/**
 * Create a flanking mechanic processor
 *
 * @param config - Flanking configuration
 * @returns Individual mechanic processor
 */
function createFlankingProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'flanking',
    apply: (phase, state, context) => {
      // Flanking modifiers are applied during damage calculation
      // This processor primarily provides the arc information
      if (phase === 'pre_attack' && context.target) {
        const arc = facing.getAttackArc(context.activeUnit.position, context.target);
        const modifier = flanking.getDamageModifier(arc, config);
        // Store modifier in context for damage calculation
        return {
          ...state,
          _flankingModifier: modifier,
          _attackArc: arc,
        };
      }
      return state;
    },
  };
}


/**
 * Create a riposte mechanic processor
 *
 * @param config - Riposte configuration
 * @returns Individual mechanic processor
 */
function createRiposteProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'riposte',
    apply: (phase, state, context) => {
      if (phase === 'attack' && context.target) {
        const arc = state._attackArc ?? facing.getAttackArc(context.activeUnit.position, context.target);
        const checkResult = riposte.canRiposte(context.target, context.activeUnit, arc, config);

        if (checkResult.canRiposte) {
          const roll = seededRandom(context.seed);
          const result = riposte.executeRiposte(context.target, context.activeUnit, roll, config);

          if (result.triggered) {
            // Apply riposte damage to attacker
            const updatedAttacker = {
              ...context.activeUnit,
              currentHp: Math.max(0, context.activeUnit.currentHp - result.damage),
            };
            const updatedDefender = riposte.consumeRiposteCharge(context.target);
            return updateUnits(state, [updatedAttacker, updatedDefender]);
          }
        }
      }
      return state;
    },
  };
}

/**
 * Create an intercept mechanic processor
 *
 * @param config - Intercept configuration
 * @returns Individual mechanic processor
 */
function createInterceptProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'intercept',
    apply: (phase, state, context) => {
      if (phase === 'movement' && context.action?.path) {
        // Check for intercept during movement
        const enemies = state.units.filter((u: any) => u.team !== context.activeUnit.team);
        const result = intercept.checkInterceptAlongPath(
          context.activeUnit,
          enemies,
          context.action.path,
          config,
        );
        if (result.intercepted) {
          // Stop movement at intercept point
          return {
            ...state,
            _interceptResult: result,
          };
        }
      }
      return state;
    },
  };
}


/**
 * Create an aura mechanic processor
 *
 * @param config - Aura configuration
 * @returns Individual mechanic processor
 */
function createAuraProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'aura',
    apply: (phase, state, context) => {
      if (phase === 'turn_start') {
        // Apply all auras from active unit at turn start
        const result = aura.applyAllAuras(context.activeUnit, state.units, config);
        // Note: The actual effect application would need to be handled
        // by the battle simulator based on the result
        return {
          ...state,
          _auraResult: result,
        };
      }
      if (phase === 'turn_end') {
        // Decay pulse aura effects
        const updatedUnits = state.units.map((u: any) => aura.decayPulseEffects(u));
        return { ...state, units: updatedUnits };
      }
      return state;
    },
  };
}

/**
 * Create a charge mechanic processor
 *
 * @param config - Charge configuration
 * @returns Individual mechanic processor
 */
function createChargeProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'charge',
    apply: (phase, state, context) => {
      if (phase === 'movement' && context.action?.path) {
        // Track distance moved for momentum
        const distance = context.action.path.length;
        const momentumResult = charge.calculateMomentum(distance, config);

        if (momentumResult.momentum > 0) {
          const updated = charge.updateMomentum(context.activeUnit, distance, config);
          return updateUnit(state, updated);
        }
      }

      if (phase === 'pre_attack' && context.target) {
        // Check for Spear Wall counter
        const spearWallResult = charge.checkSpearWallCounter(
          context.activeUnit,
          context.target,
          config,
        );
        if (spearWallResult.countered) {
          // Charge is stopped, attacker takes damage
          const updatedAttacker = {
            ...context.activeUnit,
            currentHp: Math.max(0, context.activeUnit.currentHp - spearWallResult.counterDamage),
            momentum: 0,
            isCharging: false,
          };
          return updateUnit(state, updatedAttacker);
        }
      }

      return state;
    },
  };
}


/**
 * Create an overwatch mechanic processor
 *
 * @param config - Overwatch configuration
 * @returns Individual mechanic processor
 */
function createOverwatchProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'overwatch',
    apply: (phase, state, context) => {
      if (phase === 'movement') {
        // Check for overwatch triggers during enemy movement
        const overwatchers = state.units.filter((u: any) =>
          u.team !== context.activeUnit.team && u.vigilance,
        );
        const results = overwatch.checkAllOverwatchers(
          context.activeUnit,
          context.activeUnit.position,
          overwatchers,
          (u: any) => u.atk ?? 10,
          config,
        );
        if (results.length > 0) {
          return {
            ...state,
            _overwatchResults: results,
          };
        }
      }
      if (phase === 'turn_end') {
        // Reset vigilance state at turn end
        const updatedUnits = state.units.map((u: any) => overwatch.resetOverwatch(u));
        return { ...state, units: updatedUnits };
      }
      return state;
    },
  };
}

/**
 * Create a phalanx mechanic processor
 *
 * @param config - Phalanx configuration
 * @returns Individual mechanic processor
 */
function createPhalanxProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'phalanx',
    apply: (phase, state, _context) => {
      if (phase === 'turn_start' || phase === 'post_attack') {
        // Recalculate phalanx bonuses
        const result = phalanx.recalculateAllPhalanx(state.units, config);
        return { ...state, units: result };
      }
      return state;
    },
  };
}


/**
 * Create a line of sight mechanic processor
 *
 * @param config - Line of sight configuration
 * @returns Individual mechanic processor
 */
function createLoSProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'lineOfSight',
    apply: (phase, state, context) => {
      if (phase === 'pre_attack' && context.target && context.activeUnit.range > 1) {
        // Validate LoS for ranged attacks
        const losResult = los.checkLineOfSight(
          context.activeUnit,
          context.target,
          state.units,
          config,
        );
        return {
          ...state,
          _losResult: losResult,
        };
      }
      return state;
    },
  };
}

/**
 * Create an ammunition mechanic processor
 *
 * @param config - Ammunition configuration
 * @returns Individual mechanic processor
 */
function createAmmunitionProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'ammunition',
    apply: (phase, state, context) => {
      if (phase === 'turn_start') {
        // Reload ammo at turn start (if applicable)
        const updated = ammunition.applyReload(context.activeUnit, config);
        return updateUnit(state, updated);
      }
      if (phase === 'pre_attack' && context.activeUnit.range > 1) {
        // Check if unit can attack (has ammo)
        if (!ammunition.canAttack(context.activeUnit)) {
          return {
            ...state,
            _outOfAmmo: true,
          };
        }
        // Consume ammo on ranged attack
        const updated = ammunition.updateAmmo(context.activeUnit, 1, config);
        return updateUnit(state, updated);
      }
      return state;
    },
  };
}


/**
 * Create a contagion mechanic processor
 *
 * @param config - Contagion configuration
 * @returns Individual mechanic processor
 */
function createContagionProcessor(config: any): IndividualMechanicProcessor {
  return {
    name: 'contagion',
    apply: (phase, state, context) => {
      if (phase === 'turn_end') {
        // Spread effects at turn end
        let seedOffset = 0;
        const result = contagion.processContagion(
          state.units,
          () => seededRandom(context.seed + seedOffset++),
          config,
        );
        const updatedUnits = contagion.applySpreads(state.units, result.spreads, config);
        return { ...state, units: updatedUnits };
      }
      return state;
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Update a single unit in the state
 *
 * @param state - Current battle state
 * @param unit - Updated unit
 * @returns Updated state with the unit replaced
 */
function updateUnit(state: any, unit: any): any {
  if (!state.units) return state;

  const units = state.units.map((u: any) => (u.id === unit.id ? unit : u));
  return { ...state, units };
}

/**
 * Update multiple units in the state
 *
 * @param state - Current battle state
 * @param units - Array of updated units
 * @returns Updated state with units replaced
 */
function updateUnits(state: any, updatedUnits: any[]): any {
  if (!state.units) return state;

  const unitMap = new Map(updatedUnits.map((u) => [u.id, u]));
  const units = state.units.map((u: any) => unitMap.get(u.id) ?? u);
  return { ...state, units };
}


/**
 * Handle resolve break (routing/crumbling)
 *
 * @param state - Current battle state
 * @param unit - Unit that broke
 * @param stateResult - Resolve state result
 * @returns Updated state
 */
function handleResolveBreak(state: any, unit: any, stateResult: any): any {
  if (stateResult.shouldCrumble) {
    // Undead crumble - remove from battle
    const updatedUnit = { ...unit, currentHp: 0, crumbled: true };
    return updateUnit(state, updatedUnit);
  }
  if (stateResult.shouldRetreat) {
    // Human retreat - mark as routing
    const updatedUnit = { ...unit, routing: true };
    return updateUnit(state, updatedUnit);
  }
  return state;
}

/**
 * Simple seeded random number generator
 *
 * @param seed - Random seed
 * @returns Random number between 0 and 1
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ============================================================================
// Main Factory Function
// ============================================================================

/**
 * Create a mechanics processor from configuration
 *
 * This is the main entry point for creating a mechanics processor.
 * It normalizes the configuration, resolves dependencies, and builds
 * individual processors for each enabled mechanic.
 *
 * @param config - Mechanics configuration (partial, dependencies auto-resolved)
 * @returns Configured mechanics processor
 *
 * @example
 * // Create processor with roguelike preset
 * import { ROGUELIKE_PRESET } from './config/presets';
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 *
 * @example
 * // Create processor with custom config
 * const processor = createMechanicsProcessor({
 *   facing: true,
 *   flanking: true,
 *   riposte: { baseChance: 0.4 },
 * });
 * // Dependencies auto-resolved: facing enabled for flanking
 *
 * @example
 * // Use processor in battle simulation
 * let state = initialState;
 * state = processor.process('turn_start', state, { activeUnit, seed: 123 });
 * state = processor.process('movement', state, { activeUnit, action, seed: 124 });
 */
export function createMechanicsProcessor(config: MechanicsConfig): MechanicsProcessor {
  // 1. Normalize and resolve dependencies
  const normalizedConfig = normalizeConfig(config);

  // 2. Build individual processors for enabled mechanics
  const processors = buildProcessors(normalizedConfig);

  // 3. Get list of enabled mechanics
  const enabledMechanics = getEnabledMechanics(normalizedConfig);

  // 4. Return processor interface
  return {
    config: normalizedConfig,
    processors,
    enabledMechanics,
    process: (phase, state, context) => applyMechanics(phase, state, context, processors),
  };
}
