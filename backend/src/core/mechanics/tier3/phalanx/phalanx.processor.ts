/**
 * Tier 3: Phalanx Processor
 *
 * Implements the phalanx (formation) system which provides defensive bonuses
 * to units in tight formations. Units gain armor and resolve bonuses
 * based on the number of adjacent allies facing the same direction.
 *
 * Phalanx requires the facing mechanic (Tier 0) to be enabled,
 * as formation alignment depends on unit facing direction.
 *
 * Key mechanics:
 * - Formation detection: Units with adjacent allies facing same direction
 * - Armor bonus: Increased defense based on formation depth
 * - Resolve bonus: Increased morale from formation cohesion
 * - Recalculation: Bonuses update after casualties
 * - Contagion vulnerability: Dense formations spread effects faster
 *
 * @module core/mechanics/tier3/phalanx
 */

import type { BattleState, BattleUnit, Position } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { PhalanxConfig } from '../../config/mechanics.types';
import { updateUnits, findUnit } from '../../helpers';
import type {
  PhalanxProcessor,
  UnitWithPhalanx,
  PhalanxEligibility,
  FormationDetectionResult,
  PhalanxBonusResult,
  PhalanxRecalculationResult,
  PhalanxFormationState,
  RecalculationTrigger,
  AdjacentAlly,
} from './phalanx.types';
import {
  PHALANX_TAG,
  PHALANX_IMMUNE_TAG,
  ORTHOGONAL_OFFSETS,
  DEFAULT_MAX_ARMOR_BONUS,
  DEFAULT_MAX_RESOLVE_BONUS,
  DEFAULT_ARMOR_PER_ALLY,
  DEFAULT_RESOLVE_PER_ALLY,
  MAX_ADJACENT_ALLIES,
} from './phalanx.types';
import type { FacingDirection } from '../../tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit has the phalanx tag.
 *
 * @param unit - Unit to check
 * @returns True if unit has phalanx tag
 */
function hasPhalanxTag(unit: BattleUnit): boolean {
  return unit.tags?.includes(PHALANX_TAG) ?? false;
}

/**
 * Checks if a unit has the phalanx immunity tag.
 *
 * @param unit - Unit to check
 * @returns True if unit is immune to phalanx
 */
function hasImmunityTag(unit: BattleUnit): boolean {
  return unit.tags?.includes(PHALANX_IMMUNE_TAG) ?? false;
}

/**
 * Checks if a unit is alive.
 *
 * @param unit - Unit to check
 * @returns True if unit is alive
 */
function isUnitAlive(unit: BattleUnit): boolean {
  return (unit.currentHp ?? 0) > 0 && unit.alive !== false;
}

/**
 * Gets the unit's facing direction.
 *
 * @param unit - Unit to get facing from
 * @returns Facing direction or undefined if not set
 */
function getUnitFacing(unit: BattleUnit): FacingDirection | undefined {
  return unit.facing;
}

/**
 * Gets the unit's position.
 *
 * @param unit - Unit to get position from
 * @returns Position or undefined if not set
 */
function getUnitPosition(unit: BattleUnit): Position | undefined {
  return unit.position;
}

/**
 * Gets the unit's team.
 *
 * @param unit - Unit to get team from
 * @returns Team identifier as string
 */
function getUnitTeam(unit: BattleUnit): string {
  return String(unit.team ?? '');
}

/**
 * Gets the unit's base armor value.
 *
 * @param unit - Unit to get armor from
 * @returns Base armor value
 */
function getBaseArmor(unit: BattleUnit): number {
  // Check for phalanx-specific baseArmor first
  const phalanxProps = unit as unknown as UnitWithPhalanx;
  if (phalanxProps.baseArmor !== undefined) {
    return phalanxProps.baseArmor;
  }
  // Check for armor property
  if (phalanxProps.armor !== undefined) {
    return phalanxProps.armor;
  }
  return unit.stats?.armor ?? 0;
}

/**
 * Gets the unit's base resolve value.
 *
 * @param unit - Unit to get resolve from
 * @param defaultResolve - Default resolve value if not set
 * @returns Base resolve value
 */
function getBaseResolve(unit: BattleUnit, defaultResolve = 100): number {
  // Check for phalanx-specific baseResolve first
  const phalanxProps = unit as unknown as UnitWithPhalanx;
  if (phalanxProps.baseResolve !== undefined) {
    return phalanxProps.baseResolve;
  }
  // Check for resolve property
  if (phalanxProps.resolve !== undefined) {
    return phalanxProps.resolve;
  }
  return defaultResolve;
}

/**
 * Determines formation state based on adjacent ally count.
 *
 * @param adjacentCount - Number of adjacent allies
 * @returns Formation state
 */
function determineFormationState(adjacentCount: number): PhalanxFormationState {
  if (adjacentCount === 0) return 'none';
  if (adjacentCount >= MAX_ADJACENT_ALLIES) return 'full';
  return 'partial';
}

/**
 * Checks if two units are on the same team.
 *
 * @param unit1 - First unit
 * @param unit2 - Second unit
 * @returns True if units are on the same team
 */
function isSameTeam(unit1: BattleUnit, unit2: BattleUnit): boolean {
  return getUnitTeam(unit1) === getUnitTeam(unit2);
}

/**
 * Gets the unit's unique identifier.
 *
 * @param unit - Unit to get ID from
 * @returns Unit ID (instanceId or id)
 */
function getUnitId(unit: BattleUnit): string {
  return unit.instanceId ?? unit.id;
}

/**
 * Gets phalanx-specific properties from a unit.
 *
 * @param unit - Unit to get phalanx properties from
 * @returns Phalanx properties
 */
function getPhalanxProps(unit: BattleUnit): Partial<UnitWithPhalanx> {
  return unit as unknown as Partial<UnitWithPhalanx>;
}

/**
 * Creates an updated unit with phalanx properties.
 *
 * @param unit - Original unit
 * @param phalanxProps - Phalanx properties to add
 * @returns Updated unit with phalanx properties
 */
function withPhalanxProps(
  unit: BattleUnit,
  phalanxProps: Partial<UnitWithPhalanx>,
): BattleUnit & UnitWithPhalanx {
  return { ...unit, ...phalanxProps } as BattleUnit & UnitWithPhalanx;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a phalanx processor instance.
 *
 * The phalanx processor handles:
 * - Checking if units can join phalanx formations
 * - Detecting adjacent allies for formation
 * - Calculating armor and resolve bonuses
 * - Recalculating bonuses after state changes
 * - Applying phalanx logic during battle phases
 *
 * @param config - Phalanx configuration with bonus settings
 * @returns PhalanxProcessor instance
 *
 * @example
 * const processor = createPhalanxProcessor({
 *   maxArmorBonus: 5,
 *   maxResolveBonus: 25,
 *   armorPerAlly: 1,
 *   resolvePerAlly: 5,
 * });
 *
 * // Check if unit can join phalanx
 * const eligibility = processor.canJoinPhalanx(spearman);
 *
 * // Detect formation for a unit
 * const detection = processor.detectFormation(spearman, state);
 *
 * // Calculate bonuses
 * const bonuses = processor.calculateBonuses(2, config);
 */
export function createPhalanxProcessor(config: PhalanxConfig): PhalanxProcessor {
  // Use config values or defaults
  const maxArmorBonus = config.maxArmorBonus ?? DEFAULT_MAX_ARMOR_BONUS;
  const maxResolveBonus = config.maxResolveBonus ?? DEFAULT_MAX_RESOLVE_BONUS;
  const armorPerAlly = config.armorPerAlly ?? DEFAULT_ARMOR_PER_ALLY;
  const resolvePerAlly = config.resolvePerAlly ?? DEFAULT_RESOLVE_PER_ALLY;

  return {
    /**
     * Checks if a unit can join a phalanx formation.
     *
     * Conditions for joining phalanx:
     * 1. Unit must have 'phalanx' tag
     * 2. Unit must not have 'no_phalanx' tag
     * 3. Unit must be alive
     * 4. Unit must have facing direction set
     *
     * @param unit - Unit to check
     * @returns Phalanx eligibility result
     */
    canJoinPhalanx(unit: BattleUnit & UnitWithPhalanx): PhalanxEligibility {
      const baseUnit = unit as BattleUnit;

      // Check if unit is alive
      if (!isUnitAlive(baseUnit)) {
        return {
          canJoinPhalanx: false,
          reason: 'dead',
          hasTag: hasPhalanxTag(baseUnit),
          isAlive: false,
        };
      }

      // Check for immunity tag
      if (hasImmunityTag(baseUnit)) {
        return {
          canJoinPhalanx: false,
          reason: 'immune_tag',
          hasTag: hasPhalanxTag(baseUnit),
          isAlive: true,
        };
      }

      // Check for phalanx tag
      if (!hasPhalanxTag(baseUnit)) {
        return {
          canJoinPhalanx: false,
          reason: 'no_phalanx_tag',
          hasTag: false,
          isAlive: true,
        };
      }

      // Check for facing direction
      if (!getUnitFacing(baseUnit)) {
        return {
          canJoinPhalanx: false,
          reason: 'no_facing',
          hasTag: true,
          isAlive: true,
        };
      }

      return {
        canJoinPhalanx: true,
        hasTag: true,
        isAlive: true,
      };
    },

    /**
     * Detects adjacent allies for formation.
     * Finds all adjacent allies and checks facing alignment.
     *
     * @param unit - Unit to check formation for
     * @param state - Current battle state
     * @returns Formation detection result
     */
    detectFormation(
      unit: BattleUnit & UnitWithPhalanx,
      state: BattleState,
    ): FormationDetectionResult {
      const baseUnit = unit as BattleUnit;
      const position = getUnitPosition(baseUnit);
      const facing = getUnitFacing(baseUnit);

      // If unit has no position or facing, cannot form phalanx
      if (!position || !facing) {
        return {
          adjacentAllies: [],
          alignedAllies: [],
          totalAdjacent: 0,
          alignedCount: 0,
          canFormPhalanx: false,
        };
      }

      const adjacentAllies: AdjacentAlly[] = [];
      const alignedAllies: AdjacentAlly[] = [];

      // Check all orthogonal neighbors
      for (const offset of ORTHOGONAL_OFFSETS) {
        const neighborPos: Position = {
          x: position.x + offset.dx,
          y: position.y + offset.dy,
        };

        // Find unit at this position
        const neighbor = state.units.find(
          (u) =>
            u.position &&
            u.position.x === neighborPos.x &&
            u.position.y === neighborPos.y,
        );

        // Check if neighbor is a valid ally for phalanx
        if (
          neighbor &&
          isUnitAlive(neighbor) &&
          isSameTeam(baseUnit, neighbor) &&
          getUnitId(neighbor) !== getUnitId(baseUnit)
        ) {
          const neighborFacing = getUnitFacing(neighbor);
          const facingAligned = neighborFacing === facing;

          const allyInfo: AdjacentAlly = {
            unit: neighbor as BattleUnit & UnitWithPhalanx,
            position: neighborPos,
            direction: offset.direction,
            facingAligned,
          };

          adjacentAllies.push(allyInfo);

          // Only count aligned allies for phalanx bonus
          if (facingAligned && hasPhalanxTag(neighbor)) {
            alignedAllies.push(allyInfo);
          }
        }
      }

      return {
        adjacentAllies,
        alignedAllies,
        totalAdjacent: adjacentAllies.length,
        alignedCount: alignedAllies.length,
        canFormPhalanx: alignedAllies.length > 0,
      };
    },

    /**
     * Calculates phalanx bonuses based on adjacent ally count.
     *
     * ═══════════════════════════════════════════════════════════════
     * PHALANX BONUS FORMULAS
     * ═══════════════════════════════════════════════════════════════
     *
     * Armor Bonus:
     *   rawArmorBonus = adjacentCount * armorPerAlly
     *   armorBonus = min(maxArmorBonus, rawArmorBonus)
     *
     * Resolve Bonus:
     *   rawResolveBonus = adjacentCount * resolvePerAlly
     *   resolveBonus = min(maxResolveBonus, rawResolveBonus)
     *
     * Example calculations (with defaults: 1 armor/ally, 5 resolve/ally):
     *   - adjacentCount = 0: armor = 0, resolve = 0
     *   - adjacentCount = 1: armor = 1, resolve = 5
     *   - adjacentCount = 2: armor = 2, resolve = 10
     *   - adjacentCount = 3: armor = 3, resolve = 15
     *   - adjacentCount = 4: armor = 4, resolve = 20
     *   - adjacentCount = 5: armor = 5 (capped), resolve = 25 (capped)
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param adjacentCount - Number of adjacent allies in formation
     * @param phalanxConfig - Phalanx configuration
     * @returns Calculated bonuses
     */
    calculateBonuses(
      adjacentCount: number,
      phalanxConfig: PhalanxConfig,
    ): PhalanxBonusResult {
      const cfgMaxArmor = phalanxConfig.maxArmorBonus ?? maxArmorBonus;
      const cfgMaxResolve = phalanxConfig.maxResolveBonus ?? maxResolveBonus;
      const cfgArmorPerAlly = phalanxConfig.armorPerAlly ?? armorPerAlly;
      const cfgResolvePerAlly = phalanxConfig.resolvePerAlly ?? resolvePerAlly;

      // Calculate raw bonuses
      const rawArmorBonus = adjacentCount * cfgArmorPerAlly;
      const rawResolveBonus = adjacentCount * cfgResolvePerAlly;

      // Apply caps
      const armorBonusCapped = Math.min(cfgMaxArmor, rawArmorBonus);
      const resolveBonusCapped = Math.min(cfgMaxResolve, rawResolveBonus);

      return {
        armorBonus: armorBonusCapped,
        resolveBonus: resolveBonusCapped,
        adjacentCount,
        formationState: determineFormationState(adjacentCount),
        cappedArmor: rawArmorBonus > cfgMaxArmor,
        cappedResolve: rawResolveBonus > cfgMaxResolve,
        rawArmorBonus,
        rawResolveBonus,
      };
    },

    /**
     * Gets the effective armor for a unit including phalanx bonus.
     *
     * @param unit - Unit to get effective armor for
     * @returns Effective armor value
     */
    getEffectiveArmor(unit: BattleUnit & UnitWithPhalanx): number {
      const baseUnit = unit as BattleUnit;
      const phalanxProps = getPhalanxProps(baseUnit);
      const base = getBaseArmor(baseUnit);
      const bonus = phalanxProps.phalanxArmorBonus ?? 0;
      return base + bonus;
    },

    /**
     * Gets the effective resolve for a unit including phalanx bonus.
     *
     * @param unit - Unit to get effective resolve for
     * @returns Effective resolve value
     */
    getEffectiveResolve(unit: BattleUnit & UnitWithPhalanx): number {
      const baseUnit = unit as BattleUnit;
      const phalanxProps = getPhalanxProps(baseUnit);
      const base = getBaseResolve(baseUnit);
      const bonus = phalanxProps.phalanxResolveBonus ?? 0;
      return base + bonus;
    },

    /**
     * Updates phalanx state for a single unit.
     * Detects formation and applies bonuses.
     *
     * @param unit - Unit to update
     * @param state - Current battle state
     * @param phalanxConfig - Phalanx configuration
     * @returns Updated unit with phalanx state
     */
    updateUnitPhalanx(
      unit: BattleUnit & UnitWithPhalanx,
      state: BattleState,
      phalanxConfig: PhalanxConfig,
    ): BattleUnit & UnitWithPhalanx {
      const baseUnit = unit as BattleUnit;

      // Check eligibility
      const eligibility = this.canJoinPhalanx(unit);

      if (!eligibility.canJoinPhalanx) {
        // Clear phalanx state if not eligible
        return this.clearPhalanx(unit);
      }

      // Detect formation
      const detection = this.detectFormation(unit, state);

      if (!detection.canFormPhalanx) {
        // No aligned allies, clear phalanx state
        return this.clearPhalanx(unit);
      }

      // Calculate bonuses
      const bonuses = this.calculateBonuses(detection.alignedCount, phalanxConfig);

      // Store base values if not already stored
      const phalanxProps = getPhalanxProps(baseUnit);
      const baseArmor = phalanxProps.baseArmor ?? getBaseArmor(baseUnit);
      const baseResolve = phalanxProps.baseResolve ?? getBaseResolve(baseUnit);

      // Update unit with phalanx state
      return withPhalanxProps(baseUnit, {
        canFormPhalanx: true,
        inPhalanx: true,
        phalanxState: bonuses.formationState,
        adjacentAlliesCount: detection.alignedCount,
        adjacentAllyIds: detection.alignedAllies.map((a) => getUnitId(a.unit as BattleUnit)),
        phalanxArmorBonus: bonuses.armorBonus,
        phalanxResolveBonus: bonuses.resolveBonus,
        baseArmor,
        baseResolve,
      });
    },

    /**
     * Recalculates phalanx bonuses for all units.
     * Called after casualties or movement to update formations.
     *
     * @param state - Current battle state
     * @param _trigger - What triggered the recalculation (unused but kept for API consistency)
     * @returns Recalculation result with updated state
     */
    recalculate(
      state: BattleState,
      _trigger: RecalculationTrigger,
    ): PhalanxRecalculationResult {
      const unitsUpdated: string[] = [];
      let formationsChanged = 0;
      let totalArmorBonusChange = 0;
      let totalResolveBonusChange = 0;

      const updatedUnits: BattleUnit[] = [];

      for (const unit of state.units) {
        const phalanxProps = getPhalanxProps(unit);
        const previousArmorBonus = phalanxProps.phalanxArmorBonus ?? 0;
        const previousResolveBonus = phalanxProps.phalanxResolveBonus ?? 0;
        const wasInPhalanx = phalanxProps.inPhalanx ?? false;

        // Update phalanx state for this unit
        const updatedUnit = this.updateUnitPhalanx(
          unit as BattleUnit & UnitWithPhalanx,
          state,
          config,
        );

        const updatedPhalanxProps = getPhalanxProps(updatedUnit);
        const newArmorBonus = updatedPhalanxProps.phalanxArmorBonus ?? 0;
        const newResolveBonus = updatedPhalanxProps.phalanxResolveBonus ?? 0;
        const isInPhalanx = updatedPhalanxProps.inPhalanx ?? false;

        // Track changes
        if (
          previousArmorBonus !== newArmorBonus ||
          previousResolveBonus !== newResolveBonus
        ) {
          unitsUpdated.push(getUnitId(updatedUnit));
          totalArmorBonusChange += newArmorBonus - previousArmorBonus;
          totalResolveBonusChange += newResolveBonus - previousResolveBonus;
        }

        // Track formation changes
        if (wasInPhalanx !== isInPhalanx) {
          formationsChanged++;
        }

        updatedUnits.push(updatedUnit);
      }

      // Create updated state
      const updatedState = updateUnits(state, updatedUnits);

      return {
        unitsUpdated,
        formationsChanged,
        totalArmorBonusChange,
        totalResolveBonusChange,
        state: updatedState,
      };
    },

    /**
     * Clears phalanx state for a unit.
     * Called when unit dies or leaves formation.
     *
     * @param unit - Unit to clear phalanx state for
     * @returns Updated unit with cleared phalanx state
     */
    clearPhalanx(
      unit: BattleUnit & UnitWithPhalanx,
    ): BattleUnit & UnitWithPhalanx {
      const baseUnit = unit as BattleUnit;
      const phalanxProps = getPhalanxProps(baseUnit);

      // Restore base armor and resolve if they were stored
      const baseArmor = phalanxProps.baseArmor ?? getBaseArmor(baseUnit);
      const baseResolve = phalanxProps.baseResolve ?? getBaseResolve(baseUnit);

      return withPhalanxProps(baseUnit, {
        inPhalanx: false,
        phalanxState: 'none',
        adjacentAlliesCount: 0,
        adjacentAllyIds: [],
        phalanxArmorBonus: 0,
        phalanxResolveBonus: 0,
        baseArmor,
        baseResolve,
      });
    },

    /**
     * Checks if a unit is currently in a phalanx formation.
     *
     * @param unit - Unit to check
     * @returns True if unit is in phalanx
     */
    isInPhalanx(unit: BattleUnit & UnitWithPhalanx): boolean {
      const phalanxProps = getPhalanxProps(unit as BattleUnit);
      return phalanxProps.inPhalanx === true && (phalanxProps.adjacentAlliesCount ?? 0) > 0;
    },

    /**
     * Apply phalanx logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_start: Recalculate all phalanx bonuses
     * - movement: Recalculate after unit moves
     * - post_attack: Recalculate after casualties
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
      // ─────────────────────────────────────────────────────────────
      // TURN_START: Recalculate all phalanx bonuses
      // ─────────────────────────────────────────────────────────────
      if (phase === 'turn_start') {
        const result = this.recalculate(state, 'turn_start');
        return result.state;
      }

      // ─────────────────────────────────────────────────────────────
      // MOVEMENT: Recalculation is handled by the movement processor
      // which calls recalculate after updating positions.
      // ─────────────────────────────────────────────────────────────

      // ─────────────────────────────────────────────────────────────
      // POST_ATTACK: Recalculate after casualties
      // Handles both target death and attacker death (e.g., from riposte)
      // ─────────────────────────────────────────────────────────────
      if (phase === 'post_attack') {
        let needsRecalculation = false;

        // Check if target died
        if (context.target) {
          const target = findUnit(state, context.target.id);
          if (target && !isUnitAlive(target)) {
            needsRecalculation = true;
          }
        }

        // Check if attacker died (e.g., from riposte counter-attack)
        if (context.activeUnit) {
          const attacker = findUnit(state, context.activeUnit.id);
          if (attacker && !isUnitAlive(attacker)) {
            needsRecalculation = true;
          }
        }

        // Recalculate formations if any unit died
        if (needsRecalculation) {
          const result = this.recalculate(state, 'unit_death');
          return result.state;
        }
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createPhalanxProcessor;
