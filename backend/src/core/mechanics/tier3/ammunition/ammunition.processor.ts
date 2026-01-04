/**
 * Tier 3: Ammunition Processor
 *
 * Implements the ammunition and cooldown system which tracks resource
 * consumption for ranged units and ability cooldowns for mages.
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

import type { BattleState, BattleUnit } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { AmmoConfig } from '../../config/mechanics.types';
import { updateUnit, findUnit } from '../../helpers';
import type {
  AmmunitionProcessor,
  UnitWithAmmunition,
  ResourceType,
  AmmoState,
  CooldownState,
  AmmoCheckResult,
  CooldownCheckResult,
  AmmoConsumeResult,
  CooldownTriggerResult,
  ReloadResult,
  CooldownTickResult,
  AmmunitionProcessorOptions,
} from './ammunition.types';
import {
  DEFAULT_AMMO_COUNT,
  DEFAULT_COOLDOWN_DURATION,
  RANGED_TAG,
  MAGE_TAG,
  UNLIMITED_AMMO_TAG,
  QUICK_COOLDOWN_TAG,
} from './ammunition.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit has the ranged tag.
 *
 * @param unit - Unit to check
 * @param rangedTags - Custom tags for ranged units
 * @returns True if unit is ranged
 */
function isRangedUnit(
  unit: BattleUnit & UnitWithAmmunition,
  rangedTags: string[] = [RANGED_TAG],
): boolean {
  const tags = unit.tags ?? [];
  // Also check if unit has range > 1 as a fallback
  const hasRangedTag = rangedTags.some((tag) => tags.includes(tag));
  const hasRange = (unit.range ?? 1) > 1;
  return hasRangedTag || hasRange;
}

/**
 * Checks if a unit has the mage tag.
 *
 * @param unit - Unit to check
 * @param mageTags - Custom tags for mage units
 * @returns True if unit is a mage
 */
function isMageUnit(
  unit: BattleUnit & UnitWithAmmunition,
  mageTags: string[] = [MAGE_TAG],
): boolean {
  const tags = unit.tags ?? [];
  return mageTags.some((tag) => tags.includes(tag));
}

/**
 * Checks if a unit has unlimited ammunition.
 *
 * @param unit - Unit to check
 * @param unlimitedTags - Custom tags for unlimited ammo
 * @returns True if unit has unlimited ammo
 */
function hasUnlimitedAmmo(
  unit: BattleUnit & UnitWithAmmunition,
  unlimitedTags: string[] = [UNLIMITED_AMMO_TAG],
): boolean {
  if (unit.hasUnlimitedAmmo !== undefined) {
    return unit.hasUnlimitedAmmo;
  }
  const tags = unit.tags ?? [];
  return unlimitedTags.some((tag) => tags.includes(tag));
}

/**
 * Checks if a unit has quick cooldown reduction.
 *
 * @param unit - Unit to check
 * @returns True if unit has quick cooldown
 */
function hasQuickCooldownTag(unit: BattleUnit & UnitWithAmmunition): boolean {
  if (unit.hasQuickCooldown !== undefined) {
    return unit.hasQuickCooldown;
  }
  const tags = unit.tags ?? [];
  return tags.includes(QUICK_COOLDOWN_TAG);
}

/**
 * Calculates the ammo state based on current and max ammo.
 *
 * @param current - Current ammunition count
 * @param max - Maximum ammunition count
 * @param isReloading - Whether unit is currently reloading
 * @returns Ammo state
 */
function calculateAmmoState(
  current: number,
  max: number,
  isReloading: boolean = false,
): AmmoState {
  if (isReloading) return 'reloading';
  if (current <= 0) return 'empty';
  if (current >= max) return 'full';
  return 'partial';
}

/**
 * Calculates the cooldown state for an ability.
 *
 * @param turnsRemaining - Turns remaining on cooldown
 * @param wasReduced - Whether cooldown was recently reduced
 * @returns Cooldown state
 */
function calculateCooldownState(
  turnsRemaining: number,
  wasReduced: boolean = false,
): CooldownState {
  if (turnsRemaining <= 0) return 'ready';
  if (wasReduced) return 'reduced';
  return 'cooling';
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an ammunition processor instance.
 *
 * The ammunition processor handles:
 * - Determining resource type for units (ammo vs cooldown)
 * - Checking if units can perform ranged attacks
 * - Consuming ammunition on ranged attacks
 * - Triggering and tracking ability cooldowns
 * - Reloading ammunition at turn start
 * - Ticking cooldowns at turn start
 *
 * @param config - Ammunition configuration
 * @param options - Optional processor configuration
 * @returns AmmunitionProcessor instance
 *
 * @example
 * const processor = createAmmunitionProcessor({
 *   enabled: true,
 *   mageCooldowns: true,
 *   defaultAmmo: 6,
 *   defaultCooldown: 3,
 * });
 *
 * // Check if unit can attack
 * const check = processor.checkAmmo(archer);
 *
 * // Consume ammunition on attack
 * const result = processor.consumeAmmo(archer, state);
 */
export function createAmmunitionProcessor(
  config: AmmoConfig,
  options: AmmunitionProcessorOptions = {},
): AmmunitionProcessor {
  const defaultAmmo = options.defaultAmmo ?? config.defaultAmmo ?? DEFAULT_AMMO_COUNT;
  const defaultCooldown = options.defaultCooldown ?? config.defaultCooldown ?? DEFAULT_COOLDOWN_DURATION;
  const rangedTags = options.rangedTags ?? [RANGED_TAG];
  const mageTags = options.mageTags ?? [MAGE_TAG];
  const unlimitedAmmoTags = options.unlimitedAmmoTags ?? [UNLIMITED_AMMO_TAG];

  return {
    /**
     * Determines the resource type for a unit based on tags.
     *
     * @param unit - Unit to check
     * @returns Resource type (ammo, cooldown, or none)
     */
    getResourceType(unit: BattleUnit & UnitWithAmmunition): ResourceType {
      // If resource type is already set, use it
      if (unit.resourceType !== undefined) {
        return unit.resourceType;
      }

      // Mages use cooldowns (if mageCooldowns enabled)
      if (config.mageCooldowns && isMageUnit(unit, mageTags)) {
        return 'cooldown';
      }

      // Ranged units use ammo
      if (isRangedUnit(unit, rangedTags)) {
        return 'ammo';
      }

      // Melee units don't use resources
      return 'none';
    },

    /**
     * Checks if a unit can perform a ranged attack.
     *
     * @param unit - Unit to check
     * @returns Ammo check result
     */
    checkAmmo(unit: BattleUnit & UnitWithAmmunition): AmmoCheckResult {
      const resourceType = this.getResourceType(unit);

      // Non-ranged units always can attack (no ammo needed)
      if (resourceType !== 'ammo') {
        return {
          canAttack: true,
          hasAmmo: true,
          ammoRemaining: Infinity,
          ammoState: 'full',
        };
      }

      // Check for unlimited ammo
      if (hasUnlimitedAmmo(unit, unlimitedAmmoTags)) {
        return {
          canAttack: true,
          hasAmmo: true,
          ammoRemaining: Infinity,
          ammoState: 'full',
        };
      }

      // Check if reloading
      if (unit.isReloading) {
        return {
          canAttack: false,
          hasAmmo: false,
          ammoRemaining: 0,
          ammoState: 'reloading',
          reason: 'reloading',
        };
      }

      const currentAmmo = unit.ammo ?? defaultAmmo;
      const maxAmmo = unit.maxAmmo ?? defaultAmmo;
      const ammoState = calculateAmmoState(currentAmmo, maxAmmo, unit.isReloading);

      if (currentAmmo <= 0) {
        return {
          canAttack: false,
          hasAmmo: false,
          ammoRemaining: 0,
          ammoState: 'empty',
          reason: 'no_ammo',
        };
      }

      return {
        canAttack: true,
        hasAmmo: true,
        ammoRemaining: currentAmmo,
        ammoState,
      };
    },

    /**
     * Checks if an ability is ready to use.
     *
     * @param unit - Unit to check
     * @param abilityId - Ability to check cooldown for
     * @returns Cooldown check result
     */
    checkCooldown(
      unit: BattleUnit & UnitWithAmmunition,
      abilityId: string,
    ): CooldownCheckResult {
      const resourceType = this.getResourceType(unit);

      // Non-mage units don't use cooldowns
      if (resourceType !== 'cooldown') {
        return {
          canUse: true,
          isReady: true,
          turnsRemaining: 0,
          cooldownState: 'ready',
        };
      }

      const cooldowns = unit.cooldowns ?? {};
      const turnsRemaining = cooldowns[abilityId] ?? 0;
      const cooldownState = calculateCooldownState(turnsRemaining);

      if (turnsRemaining > 0) {
        return {
          canUse: false,
          isReady: false,
          turnsRemaining,
          cooldownState,
          reason: 'on_cooldown',
        };
      }

      return {
        canUse: true,
        isReady: true,
        turnsRemaining: 0,
        cooldownState: 'ready',
      };
    },

    /**
     * Consumes ammunition for a ranged attack.
     *
     * @param unit - Unit consuming ammo
     * @param state - Current battle state
     * @param amount - Amount to consume (default: 1)
     * @returns Consumption result with updated unit
     */
    consumeAmmo(
      unit: BattleUnit & UnitWithAmmunition,
      _state: BattleState,
      amount: number = 1,
    ): AmmoConsumeResult {
      const resourceType = this.getResourceType(unit);

      // Non-ranged units don't consume ammo
      if (resourceType !== 'ammo') {
        return {
          success: true,
          ammoConsumed: 0,
          ammoRemaining: Infinity,
          newState: 'full',
          unit,
        };
      }

      // Unlimited ammo units don't consume
      if (hasUnlimitedAmmo(unit, unlimitedAmmoTags)) {
        return {
          success: true,
          ammoConsumed: 0,
          ammoRemaining: Infinity,
          newState: 'full',
          unit,
        };
      }

      // Check if reloading
      if (unit.isReloading) {
        return {
          success: false,
          ammoConsumed: 0,
          ammoRemaining: 0,
          newState: 'reloading',
          unit,
          reason: 'reloading',
        };
      }

      const currentAmmo = unit.ammo ?? defaultAmmo;
      const maxAmmo = unit.maxAmmo ?? defaultAmmo;

      // Check if enough ammo
      if (currentAmmo < amount) {
        return {
          success: false,
          ammoConsumed: 0,
          ammoRemaining: currentAmmo,
          newState: calculateAmmoState(currentAmmo, maxAmmo),
          unit,
          reason: 'no_ammo',
        };
      }

      // Consume ammo
      const newAmmo = currentAmmo - amount;
      const newState = calculateAmmoState(newAmmo, maxAmmo);

      const updatedUnit: BattleUnit & UnitWithAmmunition = {
        ...unit,
        ammo: newAmmo,
        ammoState: newState,
      };

      return {
        success: true,
        ammoConsumed: amount,
        ammoRemaining: newAmmo,
        newState,
        unit: updatedUnit,
      };
    },

    /**
     * Triggers cooldown for an ability.
     *
     * @param unit - Unit using the ability
     * @param abilityId - Ability to put on cooldown
     * @param state - Current battle state
     * @param duration - Cooldown duration (uses default if not specified)
     * @returns Cooldown trigger result with updated unit
     */
    triggerCooldown(
      unit: BattleUnit & UnitWithAmmunition,
      abilityId: string,
      _state: BattleState,
      duration?: number,
    ): CooldownTriggerResult {
      const resourceType = this.getResourceType(unit);

      // Non-mage units don't use cooldowns
      if (resourceType !== 'cooldown') {
        return {
          success: true,
          abilityId,
          cooldownDuration: 0,
          unit,
        };
      }

      // Calculate cooldown duration
      let cooldownDuration = duration ?? unit.defaultCooldown ?? defaultCooldown;

      // Quick cooldown reduces duration by 1
      if (hasQuickCooldownTag(unit)) {
        cooldownDuration = Math.max(1, cooldownDuration - 1);
      }

      // Update cooldowns
      const currentCooldowns = unit.cooldowns ?? {};
      const newCooldowns = {
        ...currentCooldowns,
        [abilityId]: cooldownDuration,
      };

      const updatedUnit: BattleUnit & UnitWithAmmunition = {
        ...unit,
        cooldowns: newCooldowns,
      };

      return {
        success: true,
        abilityId,
        cooldownDuration,
        unit: updatedUnit,
      };
    },

    /**
     * Reloads ammunition for a unit.
     *
     * @param unit - Unit to reload
     * @param state - Current battle state
     * @param amount - Amount to reload (default: maxAmmo)
     * @returns Reload result with updated unit
     */
    reload(
      unit: BattleUnit & UnitWithAmmunition,
      _state: BattleState,
      amount?: number,
    ): ReloadResult {
      const resourceType = this.getResourceType(unit);

      // Non-ranged units can't reload
      if (resourceType !== 'ammo') {
        return {
          success: false,
          ammoRestored: 0,
          newAmmo: 0,
          newState: 'empty',
          unit,
          reason: 'not_ranged',
        };
      }

      // Unlimited ammo units don't need to reload
      if (hasUnlimitedAmmo(unit, unlimitedAmmoTags)) {
        return {
          success: true,
          ammoRestored: 0,
          newAmmo: Infinity,
          newState: 'full',
          unit,
        };
      }

      const currentAmmo = unit.ammo ?? 0;
      const maxAmmo = unit.maxAmmo ?? defaultAmmo;

      // Check if already full
      if (currentAmmo >= maxAmmo) {
        return {
          success: false,
          ammoRestored: 0,
          newAmmo: currentAmmo,
          newState: 'full',
          unit,
          reason: 'already_full',
        };
      }

      // Check if already reloading
      if (unit.isReloading) {
        return {
          success: false,
          ammoRestored: 0,
          newAmmo: currentAmmo,
          newState: 'reloading',
          unit,
          reason: 'already_reloading',
        };
      }

      // Calculate reload amount
      const reloadAmount = amount ?? maxAmmo;
      const newAmmo = Math.min(maxAmmo, currentAmmo + reloadAmount);
      const ammoRestored = newAmmo - currentAmmo;
      const newState = calculateAmmoState(newAmmo, maxAmmo);

      const updatedUnit: BattleUnit & UnitWithAmmunition = {
        ...unit,
        ammo: newAmmo,
        ammoState: newState,
        isReloading: false,
      };

      return {
        success: true,
        ammoRestored,
        newAmmo,
        newState,
        unit: updatedUnit,
      };
    },

    /**
     * Reduces all cooldowns by 1 at turn start.
     *
     * @param unit - Unit to tick cooldowns for
     * @returns Cooldown tick result with updated unit
     */
    tickCooldowns(unit: BattleUnit & UnitWithAmmunition): CooldownTickResult {
      const cooldowns = unit.cooldowns ?? {};
      const abilitiesReady: string[] = [];
      const abilitiesStillCooling: string[] = [];
      const cooldownsReduced: Record<string, number> = {};

      // Tick amount (quick cooldown reduces by 2 instead of 1)
      const tickAmount = hasQuickCooldownTag(unit) ? 2 : 1;

      // Reduce each cooldown
      for (const [abilityId, turnsRemaining] of Object.entries(cooldowns)) {
        const newTurns = Math.max(0, turnsRemaining - tickAmount);
        cooldownsReduced[abilityId] = newTurns;

        if (newTurns <= 0) {
          abilitiesReady.push(abilityId);
        } else {
          abilitiesStillCooling.push(abilityId);
        }
      }

      const updatedUnit: BattleUnit & UnitWithAmmunition = {
        ...unit,
        cooldowns: cooldownsReduced,
      };

      return {
        abilitiesReady,
        abilitiesStillCooling,
        cooldownsReduced,
        unit: updatedUnit,
      };
    },

    /**
     * Gets the current ammunition state for a unit.
     *
     * @param unit - Unit to check
     * @returns Current ammo state
     */
    getAmmoState(unit: BattleUnit & UnitWithAmmunition): AmmoState {
      if (unit.ammoState !== undefined) {
        return unit.ammoState;
      }

      const resourceType = this.getResourceType(unit);
      if (resourceType !== 'ammo') {
        return 'full';
      }

      if (hasUnlimitedAmmo(unit, unlimitedAmmoTags)) {
        return 'full';
      }

      const currentAmmo = unit.ammo ?? defaultAmmo;
      const maxAmmo = unit.maxAmmo ?? defaultAmmo;
      return calculateAmmoState(currentAmmo, maxAmmo, unit.isReloading);
    },

    /**
     * Gets the cooldown state for an ability.
     *
     * @param unit - Unit to check
     * @param abilityId - Ability to check
     * @returns Current cooldown state
     */
    getCooldownState(
      unit: BattleUnit & UnitWithAmmunition,
      abilityId: string,
    ): CooldownState {
      const resourceType = this.getResourceType(unit);
      if (resourceType !== 'cooldown') {
        return 'ready';
      }

      const cooldowns = unit.cooldowns ?? {};
      const turnsRemaining = cooldowns[abilityId] ?? 0;
      return calculateCooldownState(turnsRemaining);
    },

    /**
     * Initializes ammunition/cooldown state for a unit.
     * Called at battle start to set up initial resource values.
     *
     * @param unit - Unit to initialize
     * @param ammoConfig - Ammunition configuration
     * @returns Unit with initialized resource state
     */
    initializeUnit(
      unit: BattleUnit & UnitWithAmmunition,
      ammoConfig: AmmoConfig,
    ): BattleUnit & UnitWithAmmunition {
      const resourceType = this.getResourceType(unit);

      if (resourceType === 'ammo') {
        const maxAmmo = unit.maxAmmo ?? ammoConfig.defaultAmmo ?? defaultAmmo;
        return {
          ...unit,
          resourceType: 'ammo',
          ammo: maxAmmo,
          maxAmmo,
          ammoState: 'full',
          hasUnlimitedAmmo: hasUnlimitedAmmo(unit, unlimitedAmmoTags),
        };
      }

      if (resourceType === 'cooldown') {
        return {
          ...unit,
          resourceType: 'cooldown',
          cooldowns: unit.cooldowns ?? {},
          defaultCooldown: unit.defaultCooldown ?? ammoConfig.defaultCooldown ?? defaultCooldown,
          hasQuickCooldown: hasQuickCooldownTag(unit),
        };
      }

      return {
        ...unit,
        resourceType: 'none',
      };
    },

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
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // Skip if ammunition mechanic is disabled
      if (!config.enabled) {
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // TURN_START: Tick cooldowns for mages
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_start') {
        const unit = findUnit(state, context.activeUnit.id);
        if (unit) {
          const unitWithAmmo = unit as BattleUnit & UnitWithAmmunition;
          const resourceType = this.getResourceType(unitWithAmmo);

          // Tick cooldowns for mages
          if (resourceType === 'cooldown') {
            const tickResult = this.tickCooldowns(unitWithAmmo);
            return updateUnit(state, tickResult.unit);
          }
        }
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // PRE_ATTACK: Validate ammo/cooldown availability
      // This phase is for validation only - actual consumption happens in attack phase
      // ─────────────────────────────────────────────────────────────
      if (phase === 'pre_attack' && context.action?.type === 'attack') {
        // Validation is handled by checkAmmo/checkCooldown methods
        // The battle simulator should call these before allowing attacks
        return state;
      }

      // ─────────────────────────────────────────────────────────────
      // ATTACK: Consume ammo for ranged attacks, trigger cooldowns for abilities
      // ─────────────────────────────────────────────────────────────
      if (phase === 'attack') {
        const unit = findUnit(state, context.activeUnit.id);
        if (!unit) return state;

        const unitWithAmmo = unit as BattleUnit & UnitWithAmmunition;
        const resourceType = this.getResourceType(unitWithAmmo);

        // Handle ranged attack ammo consumption
        if (context.action?.type === 'attack' && resourceType === 'ammo') {
          const consumeResult = this.consumeAmmo(unitWithAmmo, state);
          if (consumeResult.success) {
            return updateUnit(state, consumeResult.unit);
          }
        }

        // Handle ability cooldown trigger
        if (context.action?.type === 'ability' && context.action.abilityId && resourceType === 'cooldown') {
          const triggerResult = this.triggerCooldown(
            unitWithAmmo,
            context.action.abilityId,
            state,
          );
          if (triggerResult.success) {
            return updateUnit(state, triggerResult.unit);
          }
        }

        return state;
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createAmmunitionProcessor;
