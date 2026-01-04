/**
 * Tier 4: Armor Shred - Type Definitions
 *
 * Defines types for the armor shred system which reduces target armor
 * on physical attacks. Armor shred is a fully independent mechanic
 * (no dependencies) that works with any configuration.
 *
 * Key mechanics:
 * - Physical attacks apply armor shred to targets
 * - Shred accumulates up to a maximum percentage of base armor
 * - Effective armor = base armor - accumulated shred
 * - Optional decay reduces shred at turn end
 *
 * @module core/mechanics/tier4/armor-shred
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit } from '../../../types';
import type { ShredConfig } from '../../config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// ARMOR SHRED CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default armor shred per physical attack.
 * Each physical attack reduces target armor by this amount.
 */
export const DEFAULT_SHRED_PER_ATTACK = 1;

/**
 * Default maximum armor reduction percentage.
 * Shred cannot reduce armor below (1 - maxShredPercent) * baseArmor.
 * Default 0.4 means armor can be reduced by up to 40%.
 */
export const DEFAULT_MAX_SHRED_PERCENT = 0.4;

/**
 * Default shred decay per turn.
 * 0 means no decay (shred is permanent until battle ends).
 */
export const DEFAULT_DECAY_PER_TURN = 0;

/**
 * Minimum effective armor after shred.
 * Armor cannot be reduced below this value.
 */
export const MIN_EFFECTIVE_ARMOR = 0;

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the armor shred system.
 * These properties are used when armor shred mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithArmorShred {}
 *
 * const shreddedUnit: MyBattleUnit = {
 *   ...baseUnit,
 *   armor: 10,
 *   armorShred: 3, // Effective armor = 10 - 3 = 7
 * };
 */
export interface UnitWithArmorShred {
  /**
   * Unit's base armor value.
   * Used to calculate maximum shred cap.
   */
  armor: number;

  /**
   * Accumulated armor shred on this unit.
   * Reduces effective armor by this amount.
   * Capped at maxShredPercent * armor.
   */
  armorShred?: number;

  /**
   * Unit's unique identifier.
   */
  id: string;

  /**
   * Unit's current HP.
   * Dead units (HP <= 0) don't receive shred.
   */
  currentHp: number;
}

// ═══════════════════════════════════════════════════════════════
// SHRED CALCULATION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of calculating effective armor after shred.
 */
export interface EffectiveArmorResult {
  /** Original base armor value */
  baseArmor: number;

  /** Current accumulated shred */
  currentShred: number;

  /** Effective armor after shred (baseArmor - currentShred) */
  effectiveArmor: number;

  /** Maximum possible shred for this unit */
  maxShred: number;

  /** Percentage of armor currently shredded */
  shredPercent: number;
}

/**
 * Result of applying shred to a target.
 */
export interface ApplyShredResult {
  /** Updated target unit with new shred value */
  target: BattleUnit & UnitWithArmorShred;

  /** Amount of shred actually applied (may be less if capped) */
  shredApplied: number;

  /** Whether shred was capped at maximum */
  wasCapped: boolean;

  /** New total shred on target */
  newTotalShred: number;

  /** Maximum shred for this target */
  maxShred: number;
}

/**
 * Result of decaying shred at turn end.
 */
export interface DecayShredResult {
  /** Updated unit with decayed shred */
  unit: BattleUnit & UnitWithArmorShred;

  /** Amount of shred that decayed */
  decayAmount: number;

  /** Shred before decay */
  previousShred: number;

  /** Shred after decay */
  newShred: number;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Armor shred applied event for battle log.
 * Emitted when a physical attack applies armor shred.
 *
 * @example
 * const event: ArmorShredAppliedEvent = {
 *   type: 'armor_shred_applied',
 *   attackerId: 'unit_1',
 *   targetId: 'unit_2',
 *   shredAmount: 1,
 *   newTotalShred: 3,
 *   effectiveArmor: 7,
 *   wasCapped: false,
 * };
 */
export interface ArmorShredAppliedEvent {
  /** Event type identifier */
  type: 'armor_shred_applied';

  /** Unit that dealt the physical attack */
  attackerId: string;

  /** Unit that received armor shred */
  targetId: string;

  /** Amount of shred applied */
  shredAmount: number;

  /** New total shred on target */
  newTotalShred: number;

  /** Target's effective armor after shred */
  effectiveArmor: number;

  /** Whether shred was capped at maximum */
  wasCapped: boolean;
}

/**
 * Armor shred capped event for battle log.
 * Emitted when shred application is limited by max cap.
 *
 * @example
 * const event: ArmorShredCappedEvent = {
 *   type: 'armor_shred_capped',
 *   targetId: 'unit_2',
 *   attemptedShred: 1,
 *   actualShred: 0,
 *   currentShred: 4,
 *   maxShred: 4,
 * };
 */
export interface ArmorShredCappedEvent {
  /** Event type identifier */
  type: 'armor_shred_capped';

  /** Unit that hit the shred cap */
  targetId: string;

  /** Shred that was attempted to apply */
  attemptedShred: number;

  /** Shred that was actually applied (may be 0) */
  actualShred: number;

  /** Current shred before this attack */
  currentShred: number;

  /** Maximum shred for this unit */
  maxShred: number;
}

/**
 * Armor shred decayed event for battle log.
 * Emitted when shred decays at turn end.
 *
 * @example
 * const event: ArmorShredDecayedEvent = {
 *   type: 'armor_shred_decayed',
 *   unitId: 'unit_2',
 *   decayAmount: 1,
 *   previousShred: 3,
 *   newShred: 2,
 * };
 */
export interface ArmorShredDecayedEvent {
  /** Event type identifier */
  type: 'armor_shred_decayed';

  /** Unit whose shred decayed */
  unitId: string;

  /** Amount of shred that decayed */
  decayAmount: number;

  /** Shred before decay */
  previousShred: number;

  /** Shred after decay */
  newShred: number;
}

/**
 * Union type for all armor shred-related events.
 */
export type ArmorShredEvent =
  | ArmorShredAppliedEvent
  | ArmorShredCappedEvent
  | ArmorShredDecayedEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Armor shred processor interface.
 * Handles all armor shred-related mechanics including application,
 * effective armor calculation, and decay.
 *
 * Independent mechanic (no dependencies), works with any config.
 *
 * @example
 * const processor = createArmorShredProcessor(config);
 *
 * // Apply shred on physical attack
 * const shreddedTarget = processor.applyShred(target, config);
 *
 * // Get effective armor for damage calculation
 * const effectiveArmor = processor.getEffectiveArmor(unit);
 *
 * // Decay shred at turn end
 * const decayedUnit = processor.decayShred(unit, config);
 */
export interface ArmorShredProcessor {
  /**
   * Applies armor shred on physical attack.
   * Shred is capped at maxShredPercent * baseArmor.
   *
   * @param target - Unit receiving the physical attack
   * @param config - Shred configuration
   * @returns Updated unit with new shred value
   *
   * @example
   * // Unit with 10 armor, 40% max shred = max 4 shred
   * const result = processor.applyShred(target, config);
   * // result.armorShred increased by shredPerAttack (capped at 4)
   */
  applyShred(
    target: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): BattleUnit & UnitWithArmorShred;

  /**
   * Applies shred with detailed result tracking.
   *
   * @param target - Unit receiving the physical attack
   * @param config - Shred configuration
   * @returns Detailed result with shred application info
   */
  applyShredWithDetails(
    target: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): ApplyShredResult;

  /**
   * Gets effective armor after shred.
   * Formula: max(0, baseArmor - armorShred)
   *
   * @param unit - Unit to calculate effective armor for
   * @returns Effective armor value (minimum 0)
   *
   * @example
   * // Unit with 10 armor and 3 shred
   * processor.getEffectiveArmor(unit); // 7
   */
  getEffectiveArmor(unit: BattleUnit & UnitWithArmorShred): number;

  /**
   * Gets detailed effective armor calculation.
   *
   * @param unit - Unit to calculate effective armor for
   * @param config - Shred configuration (for max shred calculation)
   * @returns Detailed effective armor result
   */
  getEffectiveArmorDetails(
    unit: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): EffectiveArmorResult;

  /**
   * Calculates maximum shred for a unit.
   * Formula: floor(baseArmor * maxShredPercent)
   *
   * @param unit - Unit to calculate max shred for
   * @param config - Shred configuration
   * @returns Maximum shred value
   *
   * @example
   * // Unit with 10 armor, 40% max shred
   * processor.getMaxShred(unit, config); // 4
   */
  getMaxShred(
    unit: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): number;

  /**
   * Decays shred at turn end (if configured).
   * Only applies if config.decayPerTurn > 0.
   *
   * @param unit - Unit to decay shred for
   * @param config - Shred configuration
   * @returns Updated unit with decayed shred
   *
   * @example
   * // Unit with 3 shred, decay of 1 per turn
   * const result = processor.decayShred(unit, config);
   * // result.armorShred = 2
   */
  decayShred(
    unit: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): BattleUnit & UnitWithArmorShred;

  /**
   * Decays shred with detailed result tracking.
   *
   * @param unit - Unit to decay shred for
   * @param config - Shred configuration
   * @returns Detailed decay result
   */
  decayShredWithDetails(
    unit: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): DecayShredResult;

  /**
   * Checks if a unit has any armor shred.
   *
   * @param unit - Unit to check
   * @returns True if unit has shred > 0
   */
  hasShred(unit: BattleUnit & UnitWithArmorShred): boolean;

  /**
   * Checks if a unit is at maximum shred.
   *
   * @param unit - Unit to check
   * @param config - Shred configuration
   * @returns True if unit's shred equals max shred
   */
  isAtMaxShred(
    unit: BattleUnit & UnitWithArmorShred,
    config: ShredConfig,
  ): boolean;

  /**
   * Resets shred on a unit to zero.
   * Useful for effects that cleanse debuffs.
   *
   * @param unit - Unit to reset shred for
   * @returns Updated unit with zero shred
   */
  resetShred(
    unit: BattleUnit & UnitWithArmorShred,
  ): BattleUnit & UnitWithArmorShred;

  /**
   * Apply armor shred logic for a battle phase.
   *
   * Phase behaviors:
   * - attack: Apply shred on physical attacks
   * - turn_end: Decay shred (if configured)
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action info
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('attack', state, {
   *   activeUnit: attacker,
   *   target: defender,
   *   action: { type: 'attack', targetId: defender.id },
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
 * Options for creating an armor shred processor with custom settings.
 *
 * @example
 * const options: ArmorShredProcessorOptions = {
 *   applyToMagicAttacks: false, // Only physical attacks apply shred
 * };
 */
export interface ArmorShredProcessorOptions {
  /**
   * Whether magic attacks also apply armor shred.
   * Default: false (only physical attacks apply shred)
   */
  applyToMagicAttacks?: boolean;

  /**
   * Minimum armor required for shred to apply.
   * Units with armor below this value don't receive shred.
   * Default: 0 (all units can receive shred)
   */
  minArmorForShred?: number;
}

/**
 * Context for armor shred calculation.
 * Contains all information needed to determine shred outcome.
 */
export interface ArmorShredContext {
  /** Unit dealing the attack */
  attacker: BattleUnit;

  /** Unit receiving the attack */
  target: BattleUnit & UnitWithArmorShred;

  /** Shred configuration */
  config: ShredConfig;

  /** Whether this is a physical attack */
  isPhysicalAttack: boolean;
}

/**
 * Shred state summary for UI display.
 */
export interface ShredStateSummary {
  /** Unit ID */
  unitId: string;

  /** Unit name (for display) */
  unitName?: string;

  /** Base armor value */
  baseArmor: number;

  /** Current shred amount */
  currentShred: number;

  /** Effective armor after shred */
  effectiveArmor: number;

  /** Maximum possible shred */
  maxShred: number;

  /** Percentage of armor shredded (0-100) */
  shredPercentage: number;

  /** Whether at max shred */
  isMaxShred: boolean;
}

/**
 * Battle-wide shred summary for UI display.
 */
export interface BattleShredSummary {
  /** Total units with shred */
  unitsWithShred: number;

  /** Individual unit summaries */
  unitSummaries: ShredStateSummary[];

  /** Total shred applied this battle */
  totalShredApplied: number;

  /** Units at max shred */
  unitsAtMaxShred: number;
}
