/**
 * Tier 2: Riposte (Counter-attack) - Type Definitions
 *
 * Defines types for the riposte system which allows defenders to
 * counter-attack when hit from the front arc. Riposte is disabled
 * when attacked from flank or rear.
 *
 * Riposte requires the flanking mechanic (Tier 1) to be enabled,
 * which in turn requires facing (Tier 0).
 *
 * Key mechanics:
 * - Only front attacks allow riposte (flank/rear disable it)
 * - Riposte chance is based on Initiative comparison
 * - Units have limited riposte charges per round
 * - Riposte deals reduced damage (50% of normal)
 *
 * @module core/mechanics/tier2/riposte
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import type { AttackArc } from '../../tier0/facing/facing.types';
import type { RiposteConfig } from '../../config/mechanics.types';

// Re-export AttackArc for convenience
export type { AttackArc } from '../../tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// RIPOSTE CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Damage multiplier for riposte attacks.
 * Riposte deals reduced damage compared to normal attacks.
 *
 * @example
 * const riposteDamage = Math.floor(defender.atk * RIPOSTE_DAMAGE_MULTIPLIER);
 */
export const RIPOSTE_DAMAGE_MULTIPLIER = 0.5;

/**
 * Minimum riposte chance (0% when attacker has much higher Initiative).
 */
export const MIN_RIPOSTE_CHANCE = 0.0;

/**
 * Maximum riposte chance (100% when defender has much higher Initiative).
 */
export const MAX_RIPOSTE_CHANCE = 1.0;

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the riposte system.
 * These properties are added to BattleUnit when riposte mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithRiposte {}
 *
 * const unit: MyBattleUnit = {
 *   ...baseUnit,
 *   riposteCharges: 2,
 *   maxRiposteCharges: 2,
 *   canRiposte: true,
 *   lastChargeResetRound: 1,
 * };
 */
export interface UnitWithRiposte {
  /**
   * Current riposte charges remaining this round.
   * Decremented each time unit performs a riposte.
   * Reset at the start of each round.
   */
  riposteCharges?: number;

  /**
   * Maximum riposte charges per round.
   * Determined by config.chargesPerRound or unit's attackCount.
   */
  maxRiposteCharges?: number;

  /**
   * Whether unit is capable of riposting (has the ability).
   * Some units may not be able to riposte at all.
   */
  canRiposte?: boolean;

  /**
   * Unit's Initiative stat for riposte chance calculation.
   * Higher Initiative = higher riposte chance.
   */
  initiative?: number;

  /**
   * Unit's attack count (used when chargesPerRound = 'attackCount').
   */
  attackCount?: number;

  /**
   * The round number when riposte charges were last reset.
   * Used to track per-round charge resets - charges are only reset
   * once per round, not once per turn.
   *
   * When state.round > lastChargeResetRound, charges are reset.
   * This ensures all units get their charges reset at round start,
   * not at the start of each individual unit's turn.
   *
   * @example
   * // Round 1: Unit has 2 charges, uses 1
   * // Round 2 starts: lastChargeResetRound (1) < round (2), so reset charges
   * // Unit now has 2 charges again, lastChargeResetRound = 2
   */
  lastChargeResetRound?: number;
}

// ═══════════════════════════════════════════════════════════════
// RIPOSTE RESULT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of a riposte eligibility check.
 * Contains information about whether riposte is possible and why.
 *
 * @example
 * const check: RiposteEligibility = {
 *   canRiposte: false,
 *   reason: 'flanked',
 *   arc: 'flank',
 * };
 */
export interface RiposteEligibility {
  /** Whether the defender can riposte */
  canRiposte: boolean;

  /** Reason if riposte is not possible */
  reason?: RiposteBlockReason;

  /** Attack arc that was checked */
  arc: AttackArc;

  /** Remaining riposte charges (if applicable) */
  chargesRemaining?: number;
}

/**
 * Reasons why a riposte might be blocked.
 *
 * - flanked: Attack came from flank arc
 * - rear: Attack came from rear arc
 * - no_charges: No riposte charges remaining
 * - disabled: Unit cannot riposte (ability disabled)
 * - dead: Defender is dead
 * - stunned: Defender is stunned/incapacitated
 */
export type RiposteBlockReason =
  | 'flanked'
  | 'rear'
  | 'no_charges'
  | 'disabled'
  | 'dead'
  | 'stunned';

/**
 * Result of a riposte chance calculation.
 * Contains the calculated chance and factors that influenced it.
 *
 * @example
 * const result: RiposteChanceResult = {
 *   chance: 0.75,
 *   defenderInitiative: 15,
 *   attackerInitiative: 10,
 *   initiativeDiff: 5,
 *   isGuaranteed: false,
 * };
 */
export interface RiposteChanceResult {
  /** Final riposte chance (0.0 to 1.0) */
  chance: number;

  /** Defender's Initiative stat */
  defenderInitiative: number;

  /** Attacker's Initiative stat */
  attackerInitiative: number;

  /** Initiative difference (defender - attacker) */
  initiativeDiff: number;

  /** Whether riposte is guaranteed (100% chance) */
  isGuaranteed: boolean;

  /** Whether riposte is impossible (0% chance) */
  isImpossible: boolean;
}

/**
 * Result of executing a riposte.
 * Contains damage dealt and updated state.
 *
 * @example
 * const result: RiposteExecutionResult = {
 *   success: true,
 *   damage: 15,
 *   attackerNewHp: 35,
 *   defenderChargesRemaining: 1,
 *   state: updatedState,
 * };
 */
export interface RiposteExecutionResult {
  /** Whether riposte was executed successfully */
  success: boolean;

  /** Damage dealt by riposte */
  damage: number;

  /** Attacker's HP after riposte */
  attackerNewHp: number;

  /** Defender's remaining riposte charges */
  defenderChargesRemaining: number;

  /** Updated battle state */
  state: BattleState;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Riposte triggered event for battle log.
 * Emitted when a defender successfully ripostes.
 *
 * @example
 * const event: RiposteTriggeredEvent = {
 *   type: 'riposte_triggered',
 *   defenderId: 'unit_1',
 *   attackerId: 'unit_2',
 *   damage: 15,
 *   riposteChance: 0.75,
 *   roll: 0.42,
 * };
 */
export interface RiposteTriggeredEvent {
  /** Event type identifier */
  type: 'riposte_triggered';

  /** Defender unit instance ID (who riposted) */
  defenderId: string;

  /** Attacker unit instance ID (who received riposte damage) */
  attackerId: string;

  /** Damage dealt by riposte */
  damage: number;

  /** Riposte chance that was calculated */
  riposteChance: number;

  /** Random roll that determined success */
  roll: number;
}

/**
 * Riposte failed event for battle log.
 * Emitted when a riposte check fails (roll > chance).
 *
 * @example
 * const event: RiposteFailedEvent = {
 *   type: 'riposte_failed',
 *   defenderId: 'unit_1',
 *   attackerId: 'unit_2',
 *   riposteChance: 0.3,
 *   roll: 0.65,
 * };
 */
export interface RiposteFailedEvent {
  /** Event type identifier */
  type: 'riposte_failed';

  /** Defender unit instance ID */
  defenderId: string;

  /** Attacker unit instance ID */
  attackerId: string;

  /** Riposte chance that was calculated */
  riposteChance: number;

  /** Random roll that caused failure */
  roll: number;
}

/**
 * Riposte blocked event for battle log.
 * Emitted when riposte is blocked due to flanking, no charges, etc.
 *
 * @example
 * const event: RiposteBlockedEvent = {
 *   type: 'riposte_blocked',
 *   defenderId: 'unit_1',
 *   attackerId: 'unit_2',
 *   reason: 'flanked',
 *   arc: 'flank',
 * };
 */
export interface RiposteBlockedEvent {
  /** Event type identifier */
  type: 'riposte_blocked';

  /** Defender unit instance ID */
  defenderId: string;

  /** Attacker unit instance ID */
  attackerId: string;

  /** Reason riposte was blocked */
  reason: RiposteBlockReason;

  /** Attack arc (if blocked due to flanking/rear) */
  arc?: AttackArc;
}

/**
 * Riposte charges reset event for battle log.
 * Emitted at the start of each round when charges are restored.
 *
 * @example
 * const event: RiposteChargesResetEvent = {
 *   type: 'riposte_charges_reset',
 *   unitId: 'unit_1',
 *   charges: 2,
 * };
 */
export interface RiposteChargesResetEvent {
  /** Event type identifier */
  type: 'riposte_charges_reset';

  /** Unit instance ID */
  unitId: string;

  /** Number of charges restored */
  charges: number;
}

/**
 * Union type for all riposte-related events.
 */
export type RiposteEvent =
  | RiposteTriggeredEvent
  | RiposteFailedEvent
  | RiposteBlockedEvent
  | RiposteChargesResetEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Riposte processor interface.
 * Handles all riposte-related mechanics including eligibility checks,
 * chance calculation, and counter-attack execution.
 *
 * Requires: flanking (Tier 1) - uses AttackArc to determine if riposte is allowed
 *
 * @example
 * const processor = createRiposteProcessor(config);
 *
 * // Check if defender can riposte
 * const canRiposte = processor.canRiposte(defender, attacker, 'front');
 *
 * // Calculate riposte chance
 * const chance = processor.getRiposteChance(defender, attacker, config);
 *
 * // Execute riposte
 * const newState = processor.executeRiposte(defender, attacker, state);
 */
export interface RiposteProcessor {
  /**
   * Checks if defender can riposte against the attacker.
   * Riposte is only allowed from front arc and requires charges.
   *
   * Conditions for riposte:
   * 1. Attack must be from front arc (not flank or rear)
   * 2. Defender must have riposte charges remaining
   * 3. Defender must be alive and not incapacitated
   *
   * @param defender - Unit being attacked (potential riposte source)
   * @param attacker - Unit performing the attack
   * @param arc - Attack arc relative to defender's facing
   * @returns True if defender can riposte
   *
   * @example
   * if (processor.canRiposte(defender, attacker, 'front')) {
   *   // Proceed with riposte chance roll
   * }
   */
  canRiposte(
    defender: BattleUnit & UnitWithRiposte,
    attacker: BattleUnit,
    arc: AttackArc,
  ): boolean;

  /**
   * Calculates riposte chance based on Initiative comparison.
   * Higher defender Initiative = higher riposte chance.
   *
   * Formula (when initiativeBased = true):
   * - initDiff = defender.initiative - attacker.initiative
   * - If initDiff >= guaranteedThreshold: chance = 1.0 (guaranteed)
   * - If initDiff <= -guaranteedThreshold: chance = 0.0 (impossible)
   * - Otherwise: chance = baseChance + (initDiff / guaranteedThreshold) * 0.5
   *
   * @param defender - Unit being attacked
   * @param attacker - Unit performing the attack
   * @param config - Riposte configuration
   * @returns Riposte chance (0.0 to 1.0)
   *
   * @example
   * const chance = processor.getRiposteChance(defender, attacker, config);
   * if (seededRandom(seed) < chance) {
   *   // Riposte succeeds
   * }
   */
  getRiposteChance(
    defender: BattleUnit & UnitWithRiposte,
    attacker: BattleUnit,
    config: RiposteConfig,
  ): number;

  /**
   * Executes a riposte counter-attack.
   * Deals 50% of defender's normal damage to attacker.
   * Consumes one riposte charge.
   *
   * Riposte damage formula:
   * damage = floor(defender.atk * RIPOSTE_DAMAGE_MULTIPLIER)
   *
   * @param defender - Unit performing the riposte
   * @param attacker - Unit receiving riposte damage
   * @param state - Current battle state
   * @returns Updated battle state with damage applied
   *
   * @example
   * const newState = processor.executeRiposte(defender, attacker, state);
   */
  executeRiposte(
    defender: BattleUnit & UnitWithRiposte,
    attacker: BattleUnit,
    state: BattleState,
  ): BattleState;

  /**
   * Apply riposte logic for a battle phase.
   * Riposte is checked during the 'attack' phase after damage is dealt.
   *
   * Phase behaviors:
   * - attack: Check for riposte opportunity after attacker deals damage
   * - turn_start: Reset riposte charges for the active unit (round start)
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and target
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('attack', state, {
   *   activeUnit: attacker,
   *   target: defender,
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
 * Options for creating a riposte processor with custom settings.
 *
 * @example
 * const options: RiposteProcessorOptions = {
 *   damageMultiplier: 0.6, // 60% damage instead of 50%
 * };
 */
export interface RiposteProcessorOptions {
  /** Custom damage multiplier for riposte (default: 0.5) */
  damageMultiplier?: number;
}

/**
 * Context for riposte calculation.
 * Contains all information needed to determine riposte outcome.
 */
export interface RiposteContext {
  /** Defender unit (potential riposte source) */
  defender: BattleUnit & UnitWithRiposte;

  /** Attacker unit */
  attacker: BattleUnit;

  /** Attack arc relative to defender's facing */
  arc: AttackArc;

  /** Riposte configuration */
  config: RiposteConfig;

  /** Random seed for deterministic riposte roll */
  seed: number;
}

/**
 * Full riposte check result with all details.
 * Used for detailed logging and debugging.
 */
export interface RiposteCheckResult {
  /** Eligibility check result */
  eligibility: RiposteEligibility;

  /** Chance calculation result (if eligible) */
  chanceResult?: RiposteChanceResult;

  /** Random roll value (if chance was calculated) */
  roll?: number;

  /** Whether riposte was triggered */
  triggered: boolean;

  /** Execution result (if triggered) */
  executionResult?: RiposteExecutionResult;

  /** Event generated by this check */
  event: RiposteEvent;
}
