/**
 * Tier 3: Ammunition & Cooldown - Type Definitions
 *
 * Defines types for the ammunition and cooldown system which tracks
 * resource consumption for ranged units and ability cooldowns for mages.
 * This mechanic adds strategic depth by limiting ranged attacks and
 * requiring resource management.
 *
 * Ammunition is an independent mechanic (no dependencies) but is
 * required by the overwatch mechanic (Tier 3).
 *
 * Key mechanics:
 * - Ammo tracking: Ranged units have limited ammunition
 * - Cooldown tracking: Mages have ability cooldowns instead of ammo
 * - Consumption: Each ranged attack or ability use consumes resources
 * - Reload: Ammunition can be restored at turn start (if configured)
 * - Empty state: Units without ammo/off-cooldown cannot use ranged attacks
 *
 * @module core/mechanics/tier3/ammunition
 */

import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import type { AmmoConfig } from '../../config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// AMMUNITION CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Default ammunition count for ranged units.
 * Represents the number of ranged attacks a unit can perform.
 */
export const DEFAULT_AMMO_COUNT = 6;

/**
 * Default cooldown duration for mage abilities.
 * Number of turns before ability can be used again.
 */
export const DEFAULT_COOLDOWN_DURATION = 3;

/**
 * Default reload amount per turn.
 * 0 = no automatic reload (must use reload action).
 */
export const DEFAULT_RELOAD_AMOUNT = 0;

/**
 * Tag that identifies ranged units that use ammunition.
 */
export const RANGED_TAG = 'ranged';

/**
 * Tag that identifies mage units that use cooldowns.
 */
export const MAGE_TAG = 'mage';

/**
 * Tag that identifies units with unlimited ammunition.
 */
export const UNLIMITED_AMMO_TAG = 'unlimited_ammo';

/**
 * Tag that identifies units with reduced cooldowns.
 */
export const QUICK_COOLDOWN_TAG = 'quick_cooldown';

/**
 * Tag that identifies units that can reload as a free action.
 */
export const QUICK_RELOAD_TAG = 'quick_reload';

// ═══════════════════════════════════════════════════════════════
// RESOURCE TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Resource type used by a unit.
 *
 * - ammo: Physical ammunition (arrows, bolts, etc.)
 * - cooldown: Ability cooldowns (mana regeneration, spell preparation)
 * - none: Unit doesn't use resources (melee units)
 */
export type ResourceType = 'ammo' | 'cooldown' | 'none';

/**
 * State of a unit's ammunition.
 *
 * - full: Unit has maximum ammunition
 * - partial: Unit has some ammunition remaining
 * - empty: Unit has no ammunition (cannot use ranged attacks)
 * - reloading: Unit is in the process of reloading
 */
export type AmmoState = 'full' | 'partial' | 'empty' | 'reloading';

/**
 * State of an ability's cooldown.
 *
 * - ready: Ability is ready to use
 * - cooling: Ability is on cooldown
 * - reduced: Cooldown was reduced by an effect
 */
export type CooldownState = 'ready' | 'cooling' | 'reduced';

// ═══════════════════════════════════════════════════════════════
// UNIT EXTENSION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Extended unit properties for the ammunition system.
 * These properties are added to BattleUnit when ammunition mechanic is enabled.
 *
 * @example
 * interface MyBattleUnit extends BattleUnit, UnitWithAmmunition {}
 *
 * const archer: MyBattleUnit = {
 *   ...baseUnit,
 *   ammo: 6,
 *   maxAmmo: 6,
 *   ammoState: 'full',
 *   resourceType: 'ammo',
 *   tags: ['ranged'],
 * };
 *
 * const mage: MyBattleUnit = {
 *   ...baseUnit,
 *   cooldowns: { fireball: 0, frostbolt: 2 },
 *   resourceType: 'cooldown',
 *   tags: ['mage'],
 * };
 */
export interface UnitWithAmmunition {
  /**
   * Current ammunition count.
   * Decremented on each ranged attack.
   * Only used by units with resourceType 'ammo'.
   */
  ammo?: number;

  /**
   * Maximum ammunition capacity.
   * Used to calculate ammo state and reload limits.
   */
  maxAmmo?: number;

  /**
   * Current ammunition state.
   * Derived from ammo/maxAmmo ratio.
   */
  ammoState?: AmmoState;

  /**
   * Ability cooldowns map.
   * Key: ability ID, Value: turns remaining until ready.
   * Only used by units with resourceType 'cooldown'.
   */
  cooldowns?: Record<string, number>;

  /**
   * Default cooldown duration for abilities.
   * Used when ability doesn't specify its own cooldown.
   */
  defaultCooldown?: number;

  /**
   * Resource type this unit uses.
   * Determined by unit tags ('ranged' = ammo, 'mage' = cooldown).
   */
  resourceType?: ResourceType;

  /**
   * Whether unit has unlimited ammunition.
   * Derived from 'unlimited_ammo' tag.
   */
  hasUnlimitedAmmo?: boolean;

  /**
   * Whether unit has quick cooldown reduction.
   * Derived from 'quick_cooldown' tag.
   */
  hasQuickCooldown?: boolean;

  /**
   * Whether unit can reload as a free action.
   * Derived from 'quick_reload' tag.
   */
  hasQuickReload?: boolean;

  /**
   * Whether unit is currently reloading.
   * Set when unit uses reload action.
   */
  isReloading?: boolean;

  /**
   * Turns remaining until reload completes.
   * Only used when isReloading is true.
   */
  reloadTurnsRemaining?: number;

  /**
   * Unit tags for resource type determination.
   */
  tags?: string[];

  /**
   * Unit's current position on the grid.
   */
  position?: Position;

  /**
   * Unit's attack range in cells.
   */
  range?: number;
}

// ═══════════════════════════════════════════════════════════════
// AMMUNITION CHECK TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of checking if a unit can perform a ranged attack.
 *
 * @example
 * const check: AmmoCheckResult = {
 *   canAttack: true,
 *   hasAmmo: true,
 *   ammoRemaining: 5,
 *   ammoState: 'partial',
 * };
 */
export interface AmmoCheckResult {
  /** Whether the unit can perform a ranged attack */
  canAttack: boolean;

  /** Whether the unit has ammunition remaining */
  hasAmmo: boolean;

  /** Current ammunition count */
  ammoRemaining: number;

  /** Current ammunition state */
  ammoState: AmmoState;

  /** Reason if attack is blocked */
  reason?: AmmoBlockReason;
}

/**
 * Result of checking if an ability is ready to use.
 *
 * @example
 * const check: CooldownCheckResult = {
 *   canUse: true,
 *   isReady: true,
 *   turnsRemaining: 0,
 *   cooldownState: 'ready',
 * };
 */
export interface CooldownCheckResult {
  /** Whether the ability can be used */
  canUse: boolean;

  /** Whether the ability is off cooldown */
  isReady: boolean;

  /** Turns remaining until ready (0 if ready) */
  turnsRemaining: number;

  /** Current cooldown state */
  cooldownState: CooldownState;

  /** Reason if ability is blocked */
  reason?: CooldownBlockReason;
}

/**
 * Reasons why a ranged attack might be blocked.
 *
 * - no_ammo: Unit has no ammunition remaining
 * - reloading: Unit is currently reloading
 * - not_ranged: Unit is not a ranged unit
 * - disabled: Ammunition mechanic disabled for this unit
 */
export type AmmoBlockReason =
  | 'no_ammo'
  | 'reloading'
  | 'not_ranged'
  | 'disabled';

/**
 * Reasons why an ability might be blocked.
 *
 * - on_cooldown: Ability is still on cooldown
 * - not_mage: Unit is not a mage unit
 * - no_ability: Unit doesn't have this ability
 * - disabled: Cooldown mechanic disabled for this unit
 */
export type CooldownBlockReason =
  | 'on_cooldown'
  | 'not_mage'
  | 'no_ability'
  | 'disabled';

// ═══════════════════════════════════════════════════════════════
// CONSUMPTION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of consuming ammunition.
 *
 * @example
 * const result: AmmoConsumeResult = {
 *   success: true,
 *   ammoConsumed: 1,
 *   ammoRemaining: 4,
 *   newState: 'partial',
 *   unit: updatedUnit,
 * };
 */
export interface AmmoConsumeResult {
  /** Whether ammunition was consumed successfully */
  success: boolean;

  /** Amount of ammunition consumed */
  ammoConsumed: number;

  /** Ammunition remaining after consumption */
  ammoRemaining: number;

  /** New ammunition state */
  newState: AmmoState;

  /** Updated unit with new ammo count */
  unit: BattleUnit & UnitWithAmmunition;

  /** Reason if consumption failed */
  reason?: AmmoBlockReason;
}

/**
 * Result of triggering an ability cooldown.
 *
 * @example
 * const result: CooldownTriggerResult = {
 *   success: true,
 *   abilityId: 'fireball',
 *   cooldownDuration: 3,
 *   unit: updatedUnit,
 * };
 */
export interface CooldownTriggerResult {
  /** Whether cooldown was triggered successfully */
  success: boolean;

  /** Ability that was put on cooldown */
  abilityId: string;

  /** Duration of the cooldown in turns */
  cooldownDuration: number;

  /** Updated unit with new cooldown state */
  unit: BattleUnit & UnitWithAmmunition;

  /** Reason if trigger failed */
  reason?: CooldownBlockReason;
}

// ═══════════════════════════════════════════════════════════════
// RELOAD TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result of reloading ammunition.
 *
 * @example
 * const result: ReloadResult = {
 *   success: true,
 *   ammoRestored: 6,
 *   newAmmo: 6,
 *   newState: 'full',
 *   unit: updatedUnit,
 * };
 */
export interface ReloadResult {
  /** Whether reload was successful */
  success: boolean;

  /** Amount of ammunition restored */
  ammoRestored: number;

  /** New ammunition count */
  newAmmo: number;

  /** New ammunition state */
  newState: AmmoState;

  /** Updated unit with restored ammo */
  unit: BattleUnit & UnitWithAmmunition;

  /** Reason if reload failed */
  reason?: ReloadBlockReason;
}

/**
 * Reasons why a reload might fail.
 *
 * - already_full: Unit already has maximum ammunition
 * - already_reloading: Unit is already in the process of reloading
 * - not_ranged: Unit is not a ranged unit
 * - disabled: Reload mechanic disabled for this unit
 */
export type ReloadBlockReason =
  | 'already_full'
  | 'already_reloading'
  | 'not_ranged'
  | 'disabled';

/**
 * Result of reducing cooldowns at turn start.
 *
 * @example
 * const result: CooldownTickResult = {
 *   abilitiesReady: ['fireball'],
 *   abilitiesStillCooling: ['frostbolt'],
 *   cooldownsReduced: { fireball: 0, frostbolt: 1 },
 *   unit: updatedUnit,
 * };
 */
export interface CooldownTickResult {
  /** Abilities that became ready this turn */
  abilitiesReady: string[];

  /** Abilities still on cooldown */
  abilitiesStillCooling: string[];

  /** Updated cooldown values */
  cooldownsReduced: Record<string, number>;

  /** Updated unit with reduced cooldowns */
  unit: BattleUnit & UnitWithAmmunition;
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Ammunition consumed event for battle log.
 * Emitted when a ranged unit uses ammunition.
 *
 * @example
 * const event: AmmoConsumedEvent = {
 *   type: 'ammo_consumed',
 *   unitId: 'archer_1',
 *   ammoUsed: 1,
 *   ammoRemaining: 4,
 *   ammoState: 'partial',
 * };
 */
export interface AmmoConsumedEvent {
  /** Event type identifier */
  type: 'ammo_consumed';

  /** Unit instance ID that consumed ammo */
  unitId: string;

  /** Amount of ammunition used */
  ammoUsed: number;

  /** Ammunition remaining after use */
  ammoRemaining: number;

  /** New ammunition state */
  ammoState: AmmoState;
}

/**
 * Ammunition depleted event for battle log.
 * Emitted when a unit runs out of ammunition.
 *
 * @example
 * const event: AmmoDepletedEvent = {
 *   type: 'ammo_depleted',
 *   unitId: 'archer_1',
 *   totalShotsFired: 6,
 * };
 */
export interface AmmoDepletedEvent {
  /** Event type identifier */
  type: 'ammo_depleted';

  /** Unit instance ID that ran out of ammo */
  unitId: string;

  /** Total shots fired before depletion */
  totalShotsFired: number;
}

/**
 * Reload started event for battle log.
 * Emitted when a unit begins reloading.
 *
 * @example
 * const event: ReloadStartedEvent = {
 *   type: 'reload_started',
 *   unitId: 'archer_1',
 *   turnsToComplete: 1,
 * };
 */
export interface ReloadStartedEvent {
  /** Event type identifier */
  type: 'reload_started';

  /** Unit instance ID that started reloading */
  unitId: string;

  /** Turns until reload completes */
  turnsToComplete: number;
}

/**
 * Reload completed event for battle log.
 * Emitted when a unit finishes reloading.
 *
 * @example
 * const event: ReloadCompletedEvent = {
 *   type: 'reload_completed',
 *   unitId: 'archer_1',
 *   ammoRestored: 6,
 *   newAmmo: 6,
 * };
 */
export interface ReloadCompletedEvent {
  /** Event type identifier */
  type: 'reload_completed';

  /** Unit instance ID that completed reload */
  unitId: string;

  /** Amount of ammunition restored */
  ammoRestored: number;

  /** New ammunition count */
  newAmmo: number;
}

/**
 * Cooldown triggered event for battle log.
 * Emitted when an ability is put on cooldown.
 *
 * @example
 * const event: CooldownTriggeredEvent = {
 *   type: 'cooldown_triggered',
 *   unitId: 'mage_1',
 *   abilityId: 'fireball',
 *   cooldownDuration: 3,
 * };
 */
export interface CooldownTriggeredEvent {
  /** Event type identifier */
  type: 'cooldown_triggered';

  /** Unit instance ID */
  unitId: string;

  /** Ability that was put on cooldown */
  abilityId: string;

  /** Duration of the cooldown in turns */
  cooldownDuration: number;
}

/**
 * Cooldown ready event for battle log.
 * Emitted when an ability comes off cooldown.
 *
 * @example
 * const event: CooldownReadyEvent = {
 *   type: 'cooldown_ready',
 *   unitId: 'mage_1',
 *   abilityId: 'fireball',
 * };
 */
export interface CooldownReadyEvent {
  /** Event type identifier */
  type: 'cooldown_ready';

  /** Unit instance ID */
  unitId: string;

  /** Ability that is now ready */
  abilityId: string;
}

/**
 * Cooldown reduced event for battle log.
 * Emitted when cooldowns are reduced at turn start.
 *
 * @example
 * const event: CooldownReducedEvent = {
 *   type: 'cooldown_reduced',
 *   unitId: 'mage_1',
 *   cooldowns: { fireball: 2, frostbolt: 1 },
 * };
 */
export interface CooldownReducedEvent {
  /** Event type identifier */
  type: 'cooldown_reduced';

  /** Unit instance ID */
  unitId: string;

  /** Updated cooldown values */
  cooldowns: Record<string, number>;
}

/**
 * Attack blocked due to no ammo event for battle log.
 * Emitted when a ranged attack is blocked due to no ammunition.
 *
 * @example
 * const event: AttackBlockedNoAmmoEvent = {
 *   type: 'attack_blocked_no_ammo',
 *   unitId: 'archer_1',
 *   targetId: 'enemy_1',
 * };
 */
export interface AttackBlockedNoAmmoEvent {
  /** Event type identifier */
  type: 'attack_blocked_no_ammo';

  /** Unit that attempted the attack */
  unitId: string;

  /** Intended target */
  targetId: string;
}

/**
 * Ability blocked due to cooldown event for battle log.
 * Emitted when an ability is blocked due to being on cooldown.
 *
 * @example
 * const event: AbilityBlockedCooldownEvent = {
 *   type: 'ability_blocked_cooldown',
 *   unitId: 'mage_1',
 *   abilityId: 'fireball',
 *   turnsRemaining: 2,
 * };
 */
export interface AbilityBlockedCooldownEvent {
  /** Event type identifier */
  type: 'ability_blocked_cooldown';

  /** Unit that attempted to use the ability */
  unitId: string;

  /** Ability that was blocked */
  abilityId: string;

  /** Turns remaining until ability is ready */
  turnsRemaining: number;
}

/**
 * Union type for all ammunition-related events.
 */
export type AmmunitionEvent =
  | AmmoConsumedEvent
  | AmmoDepletedEvent
  | ReloadStartedEvent
  | ReloadCompletedEvent
  | CooldownTriggeredEvent
  | CooldownReadyEvent
  | CooldownReducedEvent
  | AttackBlockedNoAmmoEvent
  | AbilityBlockedCooldownEvent;

// ═══════════════════════════════════════════════════════════════
// PROCESSOR INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Ammunition processor interface.
 * Handles all ammunition and cooldown-related mechanics including
 * resource tracking, consumption, reload, and cooldown management.
 *
 * This mechanic is independent (no dependencies) but is required
 * by the overwatch mechanic (Tier 3).
 *
 * @example
 * const processor = createAmmunitionProcessor(config);
 *
 * // Check if unit can attack
 * const check = processor.checkAmmo(archer);
 *
 * // Consume ammunition on attack
 * const result = processor.consumeAmmo(archer, state);
 *
 * // Check ability cooldown
 * const cooldown = processor.checkCooldown(mage, 'fireball');
 */
export interface AmmunitionProcessor {
  /**
   * Determines the resource type for a unit based on tags.
   *
   * @param unit - Unit to check
   * @returns Resource type (ammo, cooldown, or none)
   *
   * @example
   * const type = processor.getResourceType(archer);
   * // Returns 'ammo' for units with 'ranged' tag
   */
  getResourceType(unit: BattleUnit & UnitWithAmmunition): ResourceType;

  /**
   * Checks if a unit can perform a ranged attack.
   *
   * @param unit - Unit to check
   * @returns Ammo check result
   *
   * @example
   * const check = processor.checkAmmo(archer);
   * if (check.canAttack) {
   *   // Proceed with ranged attack
   * }
   */
  checkAmmo(unit: BattleUnit & UnitWithAmmunition): AmmoCheckResult;

  /**
   * Checks if an ability is ready to use.
   *
   * @param unit - Unit to check
   * @param abilityId - Ability to check cooldown for
   * @returns Cooldown check result
   *
   * @example
   * const check = processor.checkCooldown(mage, 'fireball');
   * if (check.canUse) {
   *   // Proceed with ability use
   * }
   */
  checkCooldown(
    unit: BattleUnit & UnitWithAmmunition,
    abilityId: string,
  ): CooldownCheckResult;

  /**
   * Consumes ammunition for a ranged attack.
   *
   * @param unit - Unit consuming ammo
   * @param state - Current battle state
   * @param amount - Amount to consume (default: 1)
   * @returns Consumption result with updated unit
   *
   * @example
   * const result = processor.consumeAmmo(archer, state);
   * if (result.success) {
   *   // Attack proceeds, ammo decremented
   * }
   */
  consumeAmmo(
    unit: BattleUnit & UnitWithAmmunition,
    state: BattleState,
    amount?: number,
  ): AmmoConsumeResult;

  /**
   * Triggers cooldown for an ability.
   *
   * @param unit - Unit using the ability
   * @param abilityId - Ability to put on cooldown
   * @param state - Current battle state
   * @param duration - Cooldown duration (uses default if not specified)
   * @returns Cooldown trigger result with updated unit
   *
   * @example
   * const result = processor.triggerCooldown(mage, 'fireball', state);
   * if (result.success) {
   *   // Ability used, cooldown started
   * }
   */
  triggerCooldown(
    unit: BattleUnit & UnitWithAmmunition,
    abilityId: string,
    state: BattleState,
    duration?: number,
  ): CooldownTriggerResult;

  /**
   * Reloads ammunition for a unit.
   *
   * @param unit - Unit to reload
   * @param state - Current battle state
   * @param amount - Amount to reload (default: maxAmmo)
   * @returns Reload result with updated unit
   *
   * @example
   * const result = processor.reload(archer, state);
   * if (result.success) {
   *   // Ammunition restored
   * }
   */
  reload(
    unit: BattleUnit & UnitWithAmmunition,
    state: BattleState,
    amount?: number,
  ): ReloadResult;

  /**
   * Reduces all cooldowns by 1 at turn start.
   *
   * @param unit - Unit to tick cooldowns for
   * @returns Cooldown tick result with updated unit
   *
   * @example
   * const result = processor.tickCooldowns(mage);
   * // All cooldowns reduced by 1
   */
  tickCooldowns(
    unit: BattleUnit & UnitWithAmmunition,
  ): CooldownTickResult;

  /**
   * Gets the current ammunition state for a unit.
   *
   * @param unit - Unit to check
   * @returns Current ammo state
   *
   * @example
   * const state = processor.getAmmoState(archer);
   * // Returns 'full', 'partial', 'empty', or 'reloading'
   */
  getAmmoState(unit: BattleUnit & UnitWithAmmunition): AmmoState;

  /**
   * Gets the cooldown state for an ability.
   *
   * @param unit - Unit to check
   * @param abilityId - Ability to check
   * @returns Current cooldown state
   *
   * @example
   * const state = processor.getCooldownState(mage, 'fireball');
   * // Returns 'ready', 'cooling', or 'reduced'
   */
  getCooldownState(
    unit: BattleUnit & UnitWithAmmunition,
    abilityId: string,
  ): CooldownState;

  /**
   * Initializes ammunition/cooldown state for a unit.
   * Called at battle start to set up initial resource values.
   *
   * @param unit - Unit to initialize
   * @param config - Ammunition configuration
   * @returns Unit with initialized resource state
   *
   * @example
   * const initializedUnit = processor.initializeUnit(archer, config);
   */
  initializeUnit(
    unit: BattleUnit & UnitWithAmmunition,
    config: AmmoConfig,
  ): BattleUnit & UnitWithAmmunition;

  /**
   * Apply ammunition logic for a battle phase.
   *
   * Phase behaviors:
   * - turn_start: Tick cooldowns, process reload completion
   * - pre_attack: Validate ammo/cooldown availability
   * - attack: Consume ammo, trigger cooldowns
   *
   * @param phase - Current battle phase
   * @param state - Current battle state
   * @param context - Phase context with active unit and action
   * @returns Updated battle state
   *
   * @example
   * const newState = processor.apply('pre_attack', state, {
   *   activeUnit: archer,
   *   target: enemy,
   *   action: { type: 'attack', targetId: enemy.instanceId },
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
 * Options for creating an ammunition processor with custom settings.
 *
 * @example
 * const options: AmmunitionProcessorOptions = {
 *   defaultAmmo: 8,
 *   defaultCooldown: 2,
 *   autoReload: true,
 * };
 */
export interface AmmunitionProcessorOptions {
  /** Custom default ammunition count (default: 6) */
  defaultAmmo?: number;

  /** Custom default cooldown duration (default: 3) */
  defaultCooldown?: number;

  /** Whether to auto-reload at turn start (default: false) */
  autoReload?: boolean;

  /** Amount to auto-reload per turn (default: 0) */
  autoReloadAmount?: number;

  /** Custom tags for ranged units */
  rangedTags?: string[];

  /** Custom tags for mage units */
  mageTags?: string[];

  /** Custom tags for unlimited ammo */
  unlimitedAmmoTags?: string[];
}

/**
 * Context for ammunition calculation.
 * Contains all information needed to determine resource state.
 */
export interface AmmunitionContext {
  /** Unit to calculate resources for */
  unit: BattleUnit & UnitWithAmmunition;

  /** Ammunition configuration */
  config: AmmoConfig;

  /** Action being performed (if any) */
  action?: {
    type: 'attack' | 'ability';
    targetId?: string;
    abilityId?: string;
  };
}

/**
 * Full ammunition check result with all details.
 * Used for detailed logging and debugging.
 */
export interface AmmunitionFullResult {
  /** Resource type for the unit */
  resourceType: ResourceType;

  /** Ammo check result (if ranged unit) */
  ammoCheck?: AmmoCheckResult;

  /** Cooldown check result (if mage unit) */
  cooldownCheck?: CooldownCheckResult;

  /** Events generated by this check */
  events: AmmunitionEvent[];

  /** Updated unit with resource state */
  updatedUnit: BattleUnit & UnitWithAmmunition;
}

/**
 * Attack action for ammunition validation.
 */
export interface RangedAttackAction {
  /** Action type */
  type: 'attack';

  /** Target unit ID */
  targetId: string;

  /** Whether this is a ranged attack */
  isRanged: boolean;
}

/**
 * Ability action for cooldown validation.
 */
export interface AbilityAction {
  /** Action type */
  type: 'ability';

  /** Ability ID being used */
  abilityId: string;

  /** Target unit ID (if targeted ability) */
  targetId?: string;
}

/**
 * Union type for actions relevant to ammunition mechanic.
 */
export type AmmunitionRelevantAction = RangedAttackAction | AbilityAction;

// ═══════════════════════════════════════════════════════════════
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Alias for AmmunitionProcessor for backward compatibility.
 * @deprecated Use AmmunitionProcessor instead
 */
export type AmmoProcessor = AmmunitionProcessor;
