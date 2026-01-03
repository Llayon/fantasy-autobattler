/**
 * Tier 4: Contagion (Effect Spreading) - Type Definitions
 *
 * Defines types for the contagion system which allows status effects
 * to spread from infected units to adjacent units. Contagion is designed
 * as a counter-mechanic to phalanx formations - dense formations have
 * increased spread risk.
 *
 * Contagion is independent (no dependencies) but interacts with:
 * - Phalanx: Units in phalanx formation have increased spread chance
 * - Status Effects: Spreads existing status effects to adjacent units
 *
 * Key mechanics:
 * - Different effect types have different spread chances
 * - Spread occurs at turn end
 * - Adjacent units (Manhattan distance = 1) can be infected
 * - Phalanx formation increases spread chance (counter-synergy)
 * - Units already affected by an effect cannot be re-infected with same type
 *
 * @module core/mechanics/tier4/contagion
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import type { ContagionConfig } from '../../config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// CONTAGION CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default fire spread chance.
 * Fire spreads quickly due to its nature.
 */
export const DEFAULT_FIRE_SPREAD = 0.5;

/**
 * Default poison spread chance.
 * Poison spreads moderately through contact.
 */
export const DEFAULT_POISON_SPREAD = 0.3;

/**
 * Default curse spread chance.
 * Curses spread slowly as magical effects.
 */
export const DEFAULT_CURSE_SPREAD = 0.25;

/**
 * Default frost spread chance.
 * Frost spreads slowly, requiring sustained cold.
 */
export const DEFAULT_FROST_SPREAD = 0.2;

/**
 * Default plague spread chance.
 * Plague is the most contagious effect type.
 */
export const DEFAULT_PLAGUE_SPREAD = 0.6;

/**
 * Default phalanx spread bonus.
 * Additional spread chance when target is in phalanx formation.
 * Represents increased disease risk in tight formations.
 */
export const DEFAULT_PHALANX_SPREAD_BONUS = 0.15;

/**
 * Manhattan distance for adjacency check.
 * Units must be exactly this distance apart for spread.
 */
export const ADJACENCY_DISTANCE = 1;

// ═══════════════════════════════════════════════════════════════
// CONTAGION TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Types of contagious effects that can spread between units.
 *
 * Each type has a different base spread chance:
 * - fire: 50% - Burns spread quickly
 * - poison: 30% - Toxins spread through contact
 * - curse: 25% - Magical afflictions spread slowly
 * - frost: 20% - Cold effects spread slowly
 * - plague: 60% - Disease spreads rapidly
 */
export type ContagionType = 'fire' | 'poison' | 'curse' | 'frost' | 'plague';

/**
 * Array of all contagion types for iteration.
 */
export const CONTAGION_TYPES: ContagionType[] = [
  'fire',
  'poison',
  'curse',
  'frost',
  'plague',
];

/**
 * Mapping of contagion types to their config property names.
 */
export const CONTAGION_CONFIG_KEYS: Record<
  ContagionType,
  keyof ContagionConfig
> = {
  fire: 'fireSpread',
  poison: 'poisonSpread',
  curse: 'curseSpread',
  frost: 'frostSpread',
  plague: 'plagueSpread',
};

// ═══════════════════════════════════════════════════════════════
// STATUS EFFECT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Status effect structure for contagion tracking.
 * Represents an active effect on a unit that can potentially spread.
 */
export interface ContagiousEffect {
  /** Effect type (must be a contagion type) */
  type: ContagionType;

  /** Remaining duration in turns */
  duration: number;

  /** Source unit ID that originally applied the effect */
  sourceId?: string;

  /** Turn number when effect was applied */
  appliedOnTurn?: number;

  /** Whether this effect was spread from another unit (vs direct application) */
  isSpread?: boolean;

  /** ID of unit this effect spread from (if isSpread is true) */
  spreadFromId?: string;
}

/**
 * Generic status effect interface for compatibility with existing systems.
 */
export interface StatusEffect {
  /** Effect type identifier */
  type: string;

  /** Remaining duration in turns */
  duration: number;

  /** Optional effect-specific data */
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the contagion system.
 * These properties are used when contagion mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithContagion {}
 *
 * const infectedUnit: MyBattleUnit = {
 *   ...baseUnit,
 *   statusEffects: [{ type: 'plague', duration: 3 }],
 *   inPhalanx: true,
 *   contagionImmunities: ['poison'],
 * };
 */
export interface UnitWithContagion {
  /**
   * Active status effects on the unit.
   * Contagion system checks for contagious effect types.
   */
  statusEffects?: StatusEffect[];

  /**
   * Whether unit is currently in phalanx formation.
   * Increases spread chance when true (phalanx counter-synergy).
   */
  inPhalanx?: boolean;

  /**
   * Effect types this unit is immune to.
   * Immune units cannot be infected by these effect types.
   */
  contagionImmunities?: ContagionType[];

  /**
   * Unit's current position on the grid.
   * Used for adjacency calculations.
   */
  position: Position;

  /**
   * Unit's current HP.
   * Dead units (HP <= 0) cannot spread or receive effects.
   */
  currentHp: number;

  /**
   * Unit's unique identifier.
   */
  id: string;

  /**
   * Unit's faction (for faction-specific immunity rules).
   */
  faction?: string;
}

// ═══════════════════════════════════════════════════════════════
// SPREAD RESULT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of checking spread eligibility for a single target.
 */
export interface SpreadEligibility {
  /** Whether the target can be infected */
  canSpread: boolean;

  /** Reason if spread is not possible */
  reason?: SpreadBlockReason;

  /** Calculated spread chance (0.0 to 1.0) */
  spreadChance: number;

  /** Whether phalanx bonus was applied */
  phalanxBonusApplied: boolean;
}

/**
 * Reasons why spread might be blocked.
 *
 * - already_infected: Target already has this effect type
 * - immune: Target is immune to this effect type
 * - dead: Target unit is dead (HP <= 0)
 * - same_unit: Cannot spread to self
 * - not_adjacent: Target is not adjacent (distance > 1)
 * - friendly_fire: Effect cannot spread to allies (if configured)
 */
export type SpreadBlockReason =
  | 'already_infected'
  | 'immune'
  | 'dead'
  | 'same_unit'
  | 'not_adjacent'
  | 'friendly_fire';

/**
 * Result of a single spread attempt.
 */
export interface SpreadAttemptResult {
  /** Whether the spread was successful */
  success: boolean;

  /** Source unit ID */
  sourceId: string;

  /** Target unit ID */
  targetId: string;

  /** Effect type that was spread (or attempted) */
  effectType: ContagionType;

  /** Random roll value (0.0 to 1.0) */
  roll: number;

  /** Spread chance that was checked against */
  spreadChance: number;

  /** Whether phalanx bonus was applied */
  phalanxBonusApplied: boolean;

  /** Block reason if spread failed */
  blockReason?: SpreadBlockReason;
}

/**
 * Result of spreading effects from a single source unit.
 */
export interface UnitSpreadResult {
  /** Source unit ID */
  sourceId: string;

  /** Effects that were checked for spreading */
  effectsChecked: ContagionType[];

  /** Individual spread attempt results */
  attempts: SpreadAttemptResult[];

  /** Number of successful spreads */
  successfulSpreads: number;

  /** Target IDs that were newly infected */
  newlyInfectedIds: string[];
}

/**
 * Result of the full spread phase (all units processed).
 */
export interface SpreadPhaseResult {
  /** Results for each source unit */
  unitResults: UnitSpreadResult[];

  /** Total number of spread attempts */
  totalAttempts: number;

  /** Total number of successful spreads */
  totalSuccessful: number;

  /** All newly infected unit IDs */
  allNewlyInfectedIds: string[];

  /** Updated battle state */
  state: BattleState;
}

/**
 * Result of finding spread targets for a source unit.
 */
export interface SpreadTargetsResult {
  /** Source unit */
  source: BattleUnit & UnitWithContagion;

  /** Valid adjacent targets */
  targets: Array<BattleUnit & UnitWithContagion>;

  /** Units that were excluded and why */
  excluded: Array<{
    unit: BattleUnit & UnitWithContagion;
    reason: SpreadBlockReason;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Effect spread event for battle log.
 * Emitted when an effect successfully spreads to a new unit.
 *
 * @example
 * const event: EffectSpreadEvent = {
 *   type: 'effect_spread',
 *   sourceId: 'unit_1',
 *   targetId: 'unit_2',
 *   effectType: 'plague',
 *   spreadChance: 0.75,
 *   roll: 0.42,
 *   phalanxBonus: true,
 * };
 */
export interface EffectSpreadEvent {
  /** Event type identifier */
  type: 'effect_spread';

  /** Unit that spread the effect */
  sourceId: string;

  /** Unit that received the effect */
  targetId: string;

  /** Type of effect that spread */
  effectType: ContagionType;

  /** Spread chance that was used */
  spreadChance: number;

  /** Random roll that determined success */
  roll: number;

  /** Whether phalanx bonus was applied */
  phalanxBonus: boolean;

  /** Effect duration on the new target */
  duration: number;
}

/**
 * Effect spread failed event for battle log.
 * Emitted when a spread attempt fails (roll too high).
 *
 * @example
 * const event: EffectSpreadFailedEvent = {
 *   type: 'effect_spread_failed',
 *   sourceId: 'unit_1',
 *   targetId: 'unit_2',
 *   effectType: 'fire',
 *   spreadChance: 0.5,
 *   roll: 0.73,
 * };
 */
export interface EffectSpreadFailedEvent {
  /** Event type identifier */
  type: 'effect_spread_failed';

  /** Unit that attempted to spread the effect */
  sourceId: string;

  /** Unit that resisted the effect */
  targetId: string;

  /** Type of effect that failed to spread */
  effectType: ContagionType;

  /** Spread chance that was used */
  spreadChance: number;

  /** Random roll that caused failure */
  roll: number;
}

/**
 * Effect spread blocked event for battle log.
 * Emitted when spread is blocked (immunity, already infected, etc.).
 *
 * @example
 * const event: EffectSpreadBlockedEvent = {
 *   type: 'effect_spread_blocked',
 *   sourceId: 'unit_1',
 *   targetId: 'unit_2',
 *   effectType: 'poison',
 *   reason: 'immune',
 * };
 */
export interface EffectSpreadBlockedEvent {
  /** Event type identifier */
  type: 'effect_spread_blocked';

  /** Unit that attempted to spread the effect */
  sourceId: string;

  /** Unit that blocked the effect */
  targetId: string;

  /** Type of effect that was blocked */
  effectType: ContagionType;

  /** Reason the spread was blocked */
  reason: SpreadBlockReason;
}

/**
 * Contagion phase started event for battle log.
 * Emitted at the start of the contagion spread phase.
 *
 * @example
 * const event: ContagionPhaseStartedEvent = {
 *   type: 'contagion_phase_started',
 *   infectedUnitCount: 3,
 *   potentialTargetCount: 5,
 * };
 */
export interface ContagionPhaseStartedEvent {
  /** Event type identifier */
  type: 'contagion_phase_started';

  /** Number of units with contagious effects */
  infectedUnitCount: number;

  /** Number of potential spread targets */
  potentialTargetCount: number;
}

/**
 * Contagion phase ended event for battle log.
 * Emitted at the end of the contagion spread phase.
 *
 * @example
 * const event: ContagionPhaseEndedEvent = {
 *   type: 'contagion_phase_ended',
 *   totalAttempts: 8,
 *   successfulSpreads: 2,
 *   newlyInfectedIds: ['unit_3', 'unit_5'],
 * };
 */
export interface ContagionPhaseEndedEvent {
  /** Event type identifier */
  type: 'contagion_phase_ended';

  /** Total spread attempts made */
  totalAttempts: number;

  /** Number of successful spreads */
  successfulSpreads: number;

  /** IDs of newly infected units */
  newlyInfectedIds: string[];
}

/**
 * Union type for all contagion-related events.
 */
export type ContagionEvent =
  | EffectSpreadEvent
  | EffectSpreadFailedEvent
  | EffectSpreadBlockedEvent
  | ContagionPhaseStartedEvent
  | ContagionPhaseEndedEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Contagion processor interface.
 * Handles all contagion-related mechanics including spread chance
 * calculation, target finding, and effect spreading.
 *
 * Independent mechanic (no dependencies), but interacts with:
 * - Phalanx: Increases spread chance for units in formation
 * - Status Effects: Spreads existing effects to adjacent units
 *
 * @example
 * const processor = createContagionProcessor(config);
 *
 * // Get spread chance for fire effect
 * const chance = processor.getSpreadChance('fire', config);
 *
 * // Find adjacent units that can be infected
 * const targets = processor.findSpreadTargets(infectedUnit, allUnits);
 *
 * // Spread effects at turn end
 * const newState = processor.spreadEffects(state, seed);
 */
export interface ContagionProcessor {
  /**
   * Gets the base spread chance for an effect type.
   *
   * @param effectType - Type of contagious effect
   * @param config - Contagion configuration
   * @returns Base spread chance (0.0 to 1.0)
   *
   * @example
   * processor.getSpreadChance('plague', config); // 0.6
   * processor.getSpreadChance('frost', config);  // 0.2
   */
  getSpreadChance(effectType: ContagionType, config: ContagionConfig): number;

  /**
   * Calculates the effective spread chance including phalanx bonus.
   *
   * Formula: effectiveChance = baseChance + (inPhalanx ? phalanxSpreadBonus : 0)
   *
   * @param effectType - Type of contagious effect
   * @param target - Target unit (checked for phalanx status)
   * @param config - Contagion configuration
   * @returns Effective spread chance (0.0 to 1.0, may exceed 1.0 with bonus)
   *
   * @example
   * // Target in phalanx with plague (0.6 + 0.15 = 0.75)
   * processor.getEffectiveSpreadChance('plague', phalanxUnit, config); // 0.75
   */
  getEffectiveSpreadChance(
    effectType: ContagionType,
    target: BattleUnit & UnitWithContagion,
    config: ContagionConfig,
  ): number;

  /**
   * Finds adjacent units that can potentially be infected.
   * Filters out dead units, self, and non-adjacent units.
   *
   * @param source - Unit with contagious effects
   * @param units - All units in battle
   * @returns Array of valid spread targets
   *
   * @example
   * const targets = processor.findSpreadTargets(infectedUnit, state.units);
   * // Returns units with Manhattan distance = 1 and HP > 0
   */
  findSpreadTargets(
    source: BattleUnit & UnitWithContagion,
    units: Array<BattleUnit & UnitWithContagion>,
  ): Array<BattleUnit & UnitWithContagion>;

  /**
   * Checks if a specific effect can spread to a target.
   *
   * @param effectType - Type of effect to spread
   * @param source - Unit spreading the effect
   * @param target - Potential target unit
   * @param config - Contagion configuration
   * @returns Spread eligibility result
   *
   * @example
   * const eligibility = processor.canSpreadTo('poison', source, target, config);
   * if (eligibility.canSpread) {
   *   // Attempt spread with eligibility.spreadChance
   * }
   */
  canSpreadTo(
    effectType: ContagionType,
    source: BattleUnit & UnitWithContagion,
    target: BattleUnit & UnitWithContagion,
    config: ContagionConfig,
  ): SpreadEligibility;

  /**
   * Gets all contagious effects from a unit's status effects.
   *
   * @param unit - Unit to check for contagious effects
   * @returns Array of contagious effects
   *
   * @example
   * const effects = processor.getContagiousEffects(unit);
   * // Returns effects with type in ['fire', 'poison', 'curse', 'frost', 'plague']
   */
  getContagiousEffects(
    unit: BattleUnit & UnitWithContagion,
  ): ContagiousEffect[];

  /**
   * Applies a contagious effect to a target unit.
   *
   * @param target - Unit to infect
   * @param effect - Effect to apply
   * @param sourceId - ID of unit spreading the effect
   * @returns Updated unit with new effect
   *
   * @example
   * const infectedUnit = processor.applyEffect(target, plagueEffect, source.id);
   */
  applyEffect(
    target: BattleUnit & UnitWithContagion,
    effect: ContagiousEffect,
    sourceId: string,
  ): BattleUnit & UnitWithContagion;

  /**
   * Spreads all contagious effects at turn end.
   * Processes all infected units and attempts to spread their effects
   * to adjacent units.
   *
   * @param state - Current battle state
   * @param seed - Random seed for deterministic spread
   * @returns Updated battle state with spread effects
   *
   * @example
   * const newState = processor.spreadEffects(state, seed);
   */
  spreadEffects(state: BattleState, seed: number): BattleState;

  /**
   * Spreads effects with detailed result tracking.
   * Same as spreadEffects but returns detailed results for logging.
   *
   * @param state - Current battle state
   * @param seed - Random seed for deterministic spread
   * @param config - Contagion configuration
   * @returns Spread phase result with details
   *
   * @example
   * const result = processor.spreadEffectsWithDetails(state, seed, config);
   * console.log(`${result.totalSuccessful} effects spread`);
   */
  spreadEffectsWithDetails(
    state: BattleState,
    seed: number,
    config: ContagionConfig,
  ): SpreadPhaseResult;

  /**
   * Apply contagion logic for a battle phase.
   *
   * Phase behaviors:
   * - turn_end: Spread effects to adjacent units
   * - attack: Apply contagious effects from attacks (if applicable)
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and seed
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('turn_end', state, {
   *   activeUnit: currentUnit,
   *   seed: 12345,
   * });
   */
  apply(
    phase: BattlePhase,
    state: BattleState,
    context: PhaseContext,
  ): BattleState;
}

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Options for creating a contagion processor with custom settings.
 *
 * @example
 * const options: ContagionProcessorOptions = {
 *   allowFriendlyFire: false, // Effects don't spread to allies
 * };
 */
export interface ContagionProcessorOptions {
  /** Whether effects can spread to allied units. Default: true */
  allowFriendlyFire?: boolean;

  /** Custom adjacency distance (default: 1 for Manhattan distance) */
  adjacencyDistance?: number;

  /** Maximum spread chance cap (default: 1.0) */
  maxSpreadChance?: number;
}

/**
 * Context for contagion spread calculation.
 * Contains all information needed to determine spread outcome.
 */
export interface ContagionContext {
  /** Unit spreading the effect */
  source: BattleUnit & UnitWithContagion;

  /** Unit potentially receiving the effect */
  target: BattleUnit & UnitWithContagion;

  /** Effect being spread */
  effect: ContagiousEffect;

  /** Contagion configuration */
  config: ContagionConfig;

  /** Random seed for deterministic calculations */
  seed: number;
}

/**
 * Full contagion check result with all details.
 * Used for detailed logging and debugging.
 */
export interface ContagionFullResult {
  /** Phase result with all spread attempts */
  phaseResult: SpreadPhaseResult;

  /** Events generated during spread phase */
  events: ContagionEvent[];

  /** Final battle state after spread */
  finalState: BattleState;
}

/**
 * Infected unit summary for UI display.
 */
export interface InfectedUnitSummary {
  /** Unit ID */
  unitId: string;

  /** Unit name (for display) */
  unitName?: string;

  /** Active contagious effects */
  effects: ContagiousEffect[];

  /** Number of adjacent potential targets */
  adjacentTargetCount: number;

  /** Whether unit is in phalanx (increased spread risk) */
  inPhalanx: boolean;
}

/**
 * Contagion state summary for UI display.
 */
export interface ContagionStateSummary {
  /** Total infected units */
  infectedCount: number;

  /** Infected unit summaries */
  infectedUnits: InfectedUnitSummary[];

  /** Effect type counts */
  effectCounts: Record<ContagionType, number>;

  /** Units at risk (adjacent to infected) */
  atRiskCount: number;

  /** Units in phalanx (higher spread risk) */
  phalanxCount: number;
}

