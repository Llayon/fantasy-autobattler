/**
 * Tier 2: Aura Processor
 *
 * Implements the aura system which allows units to project area effects
 * that influence nearby allies or enemies. Auras can provide stat buffs,
 * debuffs, healing, damage, or status effects.
 *
 * Aura is an independent mechanic (no dependencies required).
 *
 * Key mechanics:
 * - Static auras: Always active while unit is alive
 * - Pulse auras: Apply effect once per turn to units in range
 * - Relic auras: Item-based auras with special properties
 * - Aura stacking: Multiple auras can stack (configurable)
 *
 * @module core/mechanics/tier2/aura
 */

import type { BattleState, BattleUnit } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import { updateUnit, findUnit } from '../../helpers';
import { manhattanDistance } from '../../../grid/grid';
import type {
  Aura,
  AuraBuff,
  AuraProcessor,
  AuraProcessorOptions,
  AuraStat,
  UnitWithAura,
} from './aura.types';
import {
  MAX_AURA_RANGE,
  DEFAULT_PULSE_INTERVAL,
} from './aura.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Gets the base stat value for a unit.
 *
 * @param unit - Unit to get stat from
 * @param stat - Stat to retrieve
 * @returns Base stat value
 */
function getBaseStat(unit: BattleUnit, stat: AuraStat): number {
  switch (stat) {
    case 'atk':
      return unit.stats?.atk ?? 0;
    case 'armor':
      return unit.stats?.armor ?? 0;
    case 'speed':
      return unit.stats?.speed ?? 0;
    case 'initiative':
      return unit.stats?.initiative ?? 0;
    case 'dodge':
      return unit.stats?.dodge ?? 0;
    case 'hp':
      return unit.maxHp ?? unit.stats?.hp ?? 0;
    case 'resolve':
      return (unit as BattleUnit & { resolve?: number }).resolve ?? 100;
    default:
      return 0;
  }
}

/**
 * Checks if a unit is a valid aura target based on aura target type.
 *
 * @param source - Unit projecting the aura
 * @param target - Potential target unit
 * @param aura - Aura definition
 * @returns True if target is valid for this aura
 */
function isValidAuraTarget(
  source: BattleUnit,
  target: BattleUnit,
  aura: Aura,
): boolean {
  // Dead units cannot receive aura effects
  if (!target.alive || target.currentHp <= 0) {
    return false;
  }

  switch (aura.target) {
    case 'self':
      return source.id === target.id;
    case 'allies':
      return source.team === target.team && source.id !== target.id;
    case 'enemies':
      return source.team !== target.team;
    case 'all':
      return source.id !== target.id;
    default:
      return false;
  }
}

/**
 * Checks if a unit is within aura range.
 *
 * @param source - Unit projecting the aura
 * @param target - Target unit
 * @param range - Aura range
 * @returns True if target is within range
 */
function isInAuraRange(
  source: BattleUnit,
  target: BattleUnit,
  range: number,
): boolean {
  return manhattanDistance(source.position, target.position) <= range;
}

/**
 * Creates an aura buff from an aura effect.
 *
 * @param aura - Aura definition
 * @param sourceId - Source unit ID
 * @param stacks - Number of stacks
 * @returns AuraBuff or undefined if effect doesn't create a buff
 */
function createAuraBuff(
  aura: Aura,
  sourceId: string,
  stacks: number,
): AuraBuff | undefined {
  const effect = aura.effect;

  // Only buff_stat and debuff_stat create persistent buffs
  if (effect.type !== 'buff_stat' && effect.type !== 'debuff_stat') {
    return undefined;
  }

  if (!effect.stat) {
    return undefined;
  }

  return {
    auraId: aura.id,
    sourceId,
    stat: effect.stat,
    value: effect.type === 'debuff_stat' ? -effect.value : effect.value,
    isPercentage: effect.isPercentage,
    stacks,
  };
}

/**
 * Calculates the effective value of an aura buff.
 *
 * @param buff - Aura buff
 * @param baseStat - Base stat value
 * @returns Effective buff value
 */
function calculateBuffValue(buff: AuraBuff, baseStat: number): number {
  const stackMultiplier = buff.stacks;

  if (buff.isPercentage) {
    return Math.floor(baseStat * buff.value * stackMultiplier);
  }

  return buff.value * stackMultiplier;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an aura processor instance.
 *
 * The aura processor handles:
 * - Finding units within aura range
 * - Applying static aura effects (stat buffs/debuffs)
 * - Triggering pulse aura effects (heal/damage per turn)
 * - Removing aura effects when source dies or target moves out of range
 * - Recalculating auras after state changes
 *
 * @param options - Optional processor configuration
 * @returns AuraProcessor instance
 *
 * @example
 * const processor = createAuraProcessor();
 *
 * // Find units in aura range
 * const unitsInRange = processor.getUnitsInRange(leader, leadershipAura, state);
 *
 * // Apply static aura effects
 * const newState = processor.applyStaticAuras(state);
 *
 * // Trigger pulse auras
 * const newState = processor.triggerPulseAuras(state, seed);
 */
export function createAuraProcessor(
  options?: AuraProcessorOptions,
): AuraProcessor {
  const maxRange = options?.maxRange ?? MAX_AURA_RANGE;
  const allowStacking = options?.allowStacking ?? true;

  return {
    /**
     * Gets all units within an aura's range that match target criteria.
     *
     * @param source - Unit projecting the aura
     * @param aura - Aura definition
     * @param state - Current battle state
     * @returns Array of units in range
     */
    getUnitsInRange(
      source: BattleUnit & UnitWithAura,
      aura: Aura,
      state: BattleState,
    ): BattleUnit[] {
      // Validate source is alive
      if (!source.alive || source.currentHp <= 0) {
        return [];
      }

      // Clamp aura range to maximum
      const effectiveRange = Math.min(aura.range, maxRange);

      // Find all valid targets
      return state.units.filter((unit) => {
        // Check if unit is a valid target type
        if (!isValidAuraTarget(source, unit, aura)) {
          return false;
        }

        // Check if unit is within range
        return isInAuraRange(source, unit, effectiveRange);
      });
    },

    /**
     * Calculates the effective stat value after aura modifications.
     *
     * @param unit - Unit to calculate stats for
     * @param stat - Stat to calculate
     * @param state - Current battle state
     * @returns Effective stat value
     */
    getEffectiveStat(
      unit: BattleUnit & UnitWithAura,
      stat: AuraStat,
      _state: BattleState,
    ): number {
      const baseStat = getBaseStat(unit, stat);
      const buffs = unit.activeAuraBuffs ?? [];

      // Sum all buff values for this stat
      let totalModifier = 0;
      for (const buff of buffs) {
        if (buff.stat === stat) {
          totalModifier += calculateBuffValue(buff, baseStat);
        }
      }

      // Return modified stat (minimum 0)
      return Math.max(0, baseStat + totalModifier);
    },

    /**
     * Applies all static aura effects to units in range.
     * Called when aura state changes (unit moves, dies, etc.).
     *
     * @param state - Current battle state
     * @returns Updated battle state with aura effects applied
     */
    applyStaticAuras(state: BattleState): BattleState {
      // First, clear all existing aura buffs
      let updatedUnits = state.units.map((unit) => {
        const unitWithAura = unit as BattleUnit & UnitWithAura;
        return {
          ...unitWithAura,
          activeAuraBuffs: [],
          auraImmunities: [],
        } as BattleUnit & UnitWithAura;
      });

      // Then, apply all active auras
      for (const unit of state.units) {
        const unitWithAura = unit as BattleUnit & UnitWithAura;

        // Skip dead units
        if (!unit.alive || unit.currentHp <= 0) {
          continue;
        }

        // Skip units without auras
        const auras = unitWithAura.auras ?? [];
        if (auras.length === 0) {
          continue;
        }

        // Process each aura
        for (const aura of auras) {
          // Only process static auras here
          if (aura.type !== 'static') {
            continue;
          }

          // Find units in range
          const targets = this.getUnitsInRange(
            unitWithAura,
            aura,
            { ...state, units: updatedUnits },
          );

          // Apply aura effect to each target
          for (const target of targets) {
            const targetWithAura = target as BattleUnit & UnitWithAura;
            const existingBuffs = targetWithAura.activeAuraBuffs ?? [];

            // Check for existing buff from same aura and source
            const existingBuff = existingBuffs.find(
              (b) => b.auraId === aura.id && b.sourceId === unit.id,
            );

            if (existingBuff) {
              // Handle stacking
              if (aura.stackable && allowStacking) {
                const maxStacks = aura.maxStacks ?? 5;
                if (existingBuff.stacks < maxStacks) {
                  existingBuff.stacks += 1;
                }
              }
              // Non-stackable aura already applied, skip
              continue;
            }

            // Create new buff
            const newBuff = createAuraBuff(aura, unit.id, 1);
            if (newBuff) {
              // Update target with new buff
              const targetIndex = updatedUnits.findIndex(
                (u) => u.id === target.id,
              );
              if (targetIndex !== -1) {
                const currentTarget = updatedUnits[targetIndex] as BattleUnit &
                  UnitWithAura;
                updatedUnits[targetIndex] = {
                  ...currentTarget,
                  activeAuraBuffs: [
                    ...(currentTarget.activeAuraBuffs ?? []),
                    newBuff,
                  ],
                };
              }
            }

            // Handle status immunity auras
            if (
              aura.effect.type === 'status_immunity' &&
              aura.effect.immunities
            ) {
              const targetIndex = updatedUnits.findIndex(
                (u) => u.id === target.id,
              );
              if (targetIndex !== -1) {
                const currentTarget = updatedUnits[targetIndex] as BattleUnit &
                  UnitWithAura;
                const existingImmunities = currentTarget.auraImmunities ?? [];
                const newImmunities = aura.effect.immunities.filter(
                  (i) => !existingImmunities.includes(i),
                );
                updatedUnits[targetIndex] = {
                  ...currentTarget,
                  auraImmunities: [...existingImmunities, ...newImmunities],
                };
              }
            }
          }
        }
      }

      return { ...state, units: updatedUnits };
    },

    /**
     * Triggers all pulse auras for the current turn.
     * Called at turn_start phase.
     *
     * @param state - Current battle state
     * @param seed - Random seed for determinism
     * @returns Updated battle state with pulse effects applied
     */
    triggerPulseAuras(state: BattleState, _seed: number): BattleState {
      let currentState = state;
      const currentRound = state.round ?? 1;

      for (const unit of state.units) {
        const unitWithAura = unit as BattleUnit & UnitWithAura;

        // Skip dead units
        if (!unit.alive || unit.currentHp <= 0) {
          continue;
        }

        // Skip units without auras
        const auras = unitWithAura.auras ?? [];
        if (auras.length === 0) {
          continue;
        }

        // Process each pulse aura
        for (const aura of auras) {
          if (aura.type !== 'pulse') {
            continue;
          }

          // Check pulse interval
          const pulseInterval = aura.pulseInterval ?? DEFAULT_PULSE_INTERVAL;
          if (currentRound % pulseInterval !== 0) {
            continue;
          }

          // Find units in range
          const targets = this.getUnitsInRange(unitWithAura, aura, currentState);

          // Apply pulse effect to each target
          for (const target of targets) {
            currentState = applyPulseEffect(
              currentState,
              unitWithAura,
              target,
              aura,
            );
          }
        }
      }

      return currentState;
    },

    /**
     * Removes aura effects from a unit.
     * Called when unit moves out of range or aura source dies.
     *
     * @param unit - Unit to remove effects from
     * @param auraId - Aura ID to remove
     * @param sourceId - Source unit ID
     * @returns Updated unit without the aura effect
     */
    removeAuraEffect(
      unit: BattleUnit & UnitWithAura,
      auraId: string,
      sourceId: string,
    ): BattleUnit & UnitWithAura {
      const existingBuffs = unit.activeAuraBuffs ?? [];

      // Filter out the specified aura buff
      const newBuffs = existingBuffs.filter(
        (b) => !(b.auraId === auraId && b.sourceId === sourceId),
      );

      return {
        ...unit,
        activeAuraBuffs: newBuffs,
      };
    },

    /**
     * Handles aura cleanup when a unit dies.
     * Removes all auras projected by the dead unit.
     *
     * @param state - Current battle state
     * @param deadUnitId - Instance ID of the dead unit
     * @returns Updated battle state with auras removed
     */
    handleUnitDeath(state: BattleState, deadUnitId: string): BattleState {
      // Remove all aura buffs from the dead unit's auras
      const updatedUnits = state.units.map((unit) => {
        const unitWithAura = unit as BattleUnit & UnitWithAura;
        const existingBuffs = unitWithAura.activeAuraBuffs ?? [];

        // Filter out buffs from the dead unit
        const newBuffs = existingBuffs.filter(
          (b) => b.sourceId !== deadUnitId,
        );

        if (newBuffs.length !== existingBuffs.length) {
          return {
            ...unitWithAura,
            activeAuraBuffs: newBuffs,
          };
        }

        return unit;
      });

      return { ...state, units: updatedUnits };
    },

    /**
     * Recalculates all aura effects after state changes.
     * Should be called after movement or unit death.
     *
     * @param state - Current battle state
     * @returns Updated battle state with recalculated auras
     */
    recalculateAuras(state: BattleState): BattleState {
      // Simply reapply all static auras
      // This handles both additions and removals
      return this.applyStaticAuras(state);
    },

    /**
     * Apply aura logic for a battle phase.
     *
     * Phase behaviors:
     * - turn_start: Trigger pulse auras, recalculate static auras
     * - movement: Recalculate auras after unit moves
     * - post_attack: Recalculate auras if unit died
     * - turn_end: Decay temporary auras
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
      // Handle turn start: trigger pulse auras
      if (phase === 'turn_start') {
        let newState = this.triggerPulseAuras(state, context.seed);
        // Recalculate static auras in case positions changed
        newState = this.recalculateAuras(newState);
        return newState;
      }

      // Handle movement: recalculate auras after unit moves
      if (phase === 'movement') {
        return this.recalculateAuras(state);
      }

      // Handle post-attack: check for unit deaths
      if (phase === 'post_attack') {
        // Check if target died
        if (context.target) {
          const target = findUnit(state, context.target.id);
          if (target && (!target.alive || target.currentHp <= 0)) {
            let newState = this.handleUnitDeath(state, target.id);
            newState = this.recalculateAuras(newState);
            return newState;
          }
        }
        return state;
      }

      // Handle turn end: decay temporary auras (placeholder for future)
      if (phase === 'turn_end') {
        // Currently no decay logic implemented
        // This is where relic auras with duration would be handled
        return state;
      }

      return state;
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// PULSE EFFECT APPLICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Applies a pulse aura effect to a target unit.
 *
 * @param state - Current battle state
 * @param source - Unit projecting the aura
 * @param target - Target unit
 * @param aura - Aura definition
 * @returns Updated battle state
 */
function applyPulseEffect(
  state: BattleState,
  _source: BattleUnit & UnitWithAura,
  target: BattleUnit,
  aura: Aura,
): BattleState {
  const effect = aura.effect;

  switch (effect.type) {
    case 'heal': {
      // Apply healing
      const healAmount = effect.isPercentage
        ? Math.floor((target.maxHp ?? target.stats?.hp ?? 0) * effect.value)
        : effect.value;

      const newHp = Math.min(
        target.maxHp ?? target.stats?.hp ?? 0,
        target.currentHp + healAmount,
      );

      const updatedTarget = {
        ...target,
        currentHp: newHp,
      };

      return updateUnit(state, updatedTarget);
    }

    case 'damage': {
      // Apply damage
      const damageAmount = effect.isPercentage
        ? Math.floor((target.maxHp ?? target.stats?.hp ?? 0) * effect.value)
        : effect.value;

      const newHp = Math.max(0, target.currentHp - damageAmount);
      const alive = newHp > 0;

      const updatedTarget = {
        ...target,
        currentHp: newHp,
        alive,
      };

      return updateUnit(state, updatedTarget);
    }

    case 'resolve_boost': {
      // Apply resolve boost
      const targetWithResolve = target as BattleUnit & { resolve?: number };
      const currentResolve = targetWithResolve.resolve ?? 100;
      const maxResolve = 100;

      const boostAmount = effect.isPercentage
        ? Math.floor(maxResolve * effect.value)
        : effect.value;

      const newResolve = Math.min(maxResolve, currentResolve + boostAmount);

      const updatedTarget = {
        ...target,
        resolve: newResolve,
      };

      return updateUnit(state, updatedTarget);
    }

    case 'resolve_drain': {
      // Apply resolve drain
      const targetWithResolve = target as BattleUnit & { resolve?: number };
      const currentResolve = targetWithResolve.resolve ?? 100;

      const drainAmount = effect.isPercentage
        ? Math.floor(100 * effect.value)
        : effect.value;

      const newResolve = Math.max(0, currentResolve - drainAmount);

      const updatedTarget = {
        ...target,
        resolve: newResolve,
      };

      return updateUnit(state, updatedTarget);
    }

    default:
      // Other effect types (buff_stat, debuff_stat) are handled by static auras
      return state;
  }
}

/**
 * Default export for convenience.
 */
export default createAuraProcessor;
