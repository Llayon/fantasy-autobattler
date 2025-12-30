/**
 * Contagion processor
 *
 * Implements status effect spreading system.
 * - Effects spread to adjacent units at turn end
 * - Phalanx formations increase spread chance
 * - Different effects have different spread rates
 */

import { ContagionConfig } from '../../config/mechanics.types';
import {
  Position,
  ContagionUnit,
  SpreadableEffect,
  EffectType,
  SpreadResult,
  ContagionPhaseResult,
  DEFAULT_SPREAD_CHANCES,
  DEFAULT_CONTAGION_VALUES,
} from './contagion.types';

/**
 * Calculate Manhattan distance between two positions
 *
 * @param a - First position
 * @param b - Second position
 * @returns Manhattan distance
 */
export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if two units are adjacent
 *
 * @param a - First position
 * @param b - Second position
 * @param range - Maximum distance (default 1)
 * @returns true if positions are within range
 */
export function isAdjacent(a: Position, b: Position, range = 1): boolean {
  return getDistance(a, b) <= range && getDistance(a, b) > 0;
}

/**
 * Get base spread chance for an effect type
 *
 * @param effectType - Type of effect
 * @param config - Optional contagion configuration
 * @returns Base spread chance (0.0 to 1.0)
 */
export function getBaseSpreadChance(
  effectType: EffectType,
  config?: Partial<ContagionConfig>,
): number {
  const customChances = config?.spreadChances;
  if (customChances && effectType in customChances) {
    return customChances[effectType] ?? DEFAULT_SPREAD_CHANCES[effectType];
  }
  return DEFAULT_SPREAD_CHANCES[effectType];
}

/**
 * Calculate spread chance with modifiers
 *
 * @param effectType - Type of effect
 * @param targetInPhalanx - Whether target is in phalanx formation
 * @param config - Optional contagion configuration
 * @returns Modified spread chance
 *
 * @example
 * const chance = getSpreadChance('fire', true);
 * // Returns 0.5 (0.3 base + 0.2 phalanx bonus)
 */
export function getSpreadChance(
  effectType: EffectType,
  targetInPhalanx: boolean,
  config?: Partial<ContagionConfig>,
): number {
  const baseChance = getBaseSpreadChance(effectType, config);
  const phalanxBonus = config?.phalanxSpreadBonus ?? DEFAULT_CONTAGION_VALUES.phalanxSpreadBonus;

  const totalChance = targetInPhalanx ? baseChance + phalanxBonus : baseChance;

  return Math.min(1.0, totalChance);
}

/**
 * Find adjacent units that can receive spread
 *
 * @param source - Unit with the effect
 * @param allUnits - All units on the battlefield
 * @param config - Optional contagion configuration
 * @returns Array of adjacent units that can receive spread
 */
export function findSpreadTargets(
  source: ContagionUnit,
  allUnits: ContagionUnit[],
  config?: Partial<ContagionConfig>,
): ContagionUnit[] {
  const spreadRange = config?.spreadRange ?? DEFAULT_CONTAGION_VALUES.spreadRange;
  const spreadToEnemies = config?.spreadToEnemies ?? DEFAULT_CONTAGION_VALUES.spreadToEnemies;

  return allUnits.filter((unit) => {
    // Skip self
    if (unit.id === source.id) return false;

    // Skip dead units
    if (!unit.isAlive) return false;

    // Check team restriction
    if (!spreadToEnemies && unit.team !== source.team) return false;

    // Check range
    return isAdjacent(source.position, unit.position, spreadRange);
  });
}

/**
 * Check if unit already has the effect
 *
 * @param unit - Unit to check
 * @param effectType - Type of effect
 * @returns true if unit has the effect
 */
export function hasEffect(unit: ContagionUnit, effectType: EffectType): boolean {
  return unit.effects?.some((e) => e.type === effectType) ?? false;
}

/**
 * Get current stacks of an effect
 *
 * @param unit - Unit to check
 * @param effectType - Type of effect
 * @returns Current stack count (0 if not present)
 */
export function getEffectStacks(unit: ContagionUnit, effectType: EffectType): number {
  const effect = unit.effects?.find((e) => e.type === effectType);
  return effect?.stacks ?? 0;
}

/**
 * Check if effect can be applied (not at max stacks)
 *
 * @param unit - Unit to check
 * @param effectType - Type of effect
 * @param config - Optional contagion configuration
 * @returns true if effect can be applied
 */
export function canApplyEffect(
  unit: ContagionUnit,
  effectType: EffectType,
  config?: Partial<ContagionConfig>,
): boolean {
  const maxStacks = config?.maxStacks ?? DEFAULT_CONTAGION_VALUES.maxStacks;
  const currentStacks = getEffectStacks(unit, effectType);
  return currentStacks < maxStacks;
}

/**
 * Try to spread an effect from source to target
 *
 * @param source - Unit with the effect
 * @param target - Potential target unit
 * @param effect - Effect to spread
 * @param roll - Random roll (0.0 to 1.0)
 * @param config - Optional contagion configuration
 * @returns Spread result
 */
export function trySpread(
  source: ContagionUnit,
  target: ContagionUnit,
  effect: SpreadableEffect,
  roll: number,
  config?: Partial<ContagionConfig>,
): SpreadResult {
  const spreadChance = getSpreadChance(effect.type, target.inPhalanx ?? false, config);
  const canApply = canApplyEffect(target, effect.type, config);
  const didSpread = canApply && roll < spreadChance;

  return {
    sourceId: source.id,
    targetId: target.id,
    effect: { ...effect, sourceId: source.id },
    spreadChance,
    didSpread,
  };
}

/**
 * Apply spread effect to unit
 *
 * @param unit - Unit to apply effect to
 * @param effect - Effect to apply
 * @param config - Optional contagion configuration
 * @returns Updated unit with new effect
 */
export function applySpreadEffect<T extends ContagionUnit>(
  unit: T,
  effect: SpreadableEffect,
  config?: Partial<ContagionConfig>,
): T {
  const maxStacks = config?.maxStacks ?? DEFAULT_CONTAGION_VALUES.maxStacks;
  const existingEffects = unit.effects ?? [];

  // Check if effect already exists
  const existingIndex = existingEffects.findIndex((e) => e.type === effect.type);

  if (existingIndex >= 0) {
    // Stack existing effect
    const existing = existingEffects[existingIndex];
    if (existing) {
      const currentStacks = existing.stacks ?? 1;
      if (currentStacks >= maxStacks) {
        return unit; // Already at max stacks
      }

      const updatedEffects = [...existingEffects];
      updatedEffects[existingIndex] = {
        ...existing,
        stacks: Math.min(maxStacks, currentStacks + 1),
        duration: Math.max(existing.duration, effect.duration),
      };

      return {
        ...unit,
        effects: updatedEffects,
      };
    }
  }

  // Add new effect
  return {
    ...unit,
    effects: [
      ...existingEffects,
      {
        ...effect,
        stacks: 1,
      },
    ],
  };
}

/**
 * Process contagion spread for all units
 *
 * @param units - All units on the battlefield
 * @param getRoll - Function to get random roll for each spread attempt
 * @param config - Optional contagion configuration
 * @returns Contagion phase result
 *
 * @example
 * const result = processContagion(units, () => Math.random());
 * for (const spread of result.spreads) {
 *   if (spread.didSpread) {
 *     // Apply effect to target
 *   }
 * }
 */
export function processContagion(
  units: ContagionUnit[],
  getRoll: () => number,
  config?: Partial<ContagionConfig>,
): ContagionPhaseResult {
  const spreads: SpreadResult[] = [];
  const affectedUnits = new Set<string>();

  // Find all units with spreadable effects
  const unitsWithEffects = units.filter(
    (u) => u.isAlive && u.effects && u.effects.length > 0,
  );

  for (const source of unitsWithEffects) {
    const targets = findSpreadTargets(source, units, config);

    for (const effect of source.effects ?? []) {
      for (const target of targets) {
        const roll = getRoll();
        const result = trySpread(source, target, effect, roll, config);
        spreads.push(result);

        if (result.didSpread) {
          affectedUnits.add(target.id);
        }
      }
    }
  }

  return {
    spreads,
    totalSpreads: spreads.filter((s) => s.didSpread).length,
    affectedUnits: Array.from(affectedUnits),
  };
}

/**
 * Apply all spreads to units
 *
 * @param units - All units on the battlefield
 * @param spreads - Spread results to apply
 * @param config - Optional contagion configuration
 * @returns Updated units array
 */
export function applySpreads<T extends ContagionUnit>(
  units: T[],
  spreads: SpreadResult[],
  config?: Partial<ContagionConfig>,
): T[] {
  const successfulSpreads = spreads.filter((s) => s.didSpread);

  if (successfulSpreads.length === 0) {
    return units;
  }

  return units.map((unit) => {
    const spreadsToUnit = successfulSpreads.filter((s) => s.targetId === unit.id);

    if (spreadsToUnit.length === 0) {
      return unit;
    }

    let updatedUnit = unit;
    for (const spread of spreadsToUnit) {
      updatedUnit = applySpreadEffect(updatedUnit, spread.effect, config);
    }

    return updatedUnit;
  });
}

/**
 * Tick effect durations and remove expired effects
 *
 * @param unit - Unit to update
 * @returns Updated unit with decremented durations
 */
export function tickEffects<T extends ContagionUnit>(unit: T): T {
  if (!unit.effects || unit.effects.length === 0) {
    return unit;
  }

  const updatedEffects = unit.effects
    .map((e) => ({ ...e, duration: e.duration - 1 }))
    .filter((e) => e.duration > 0);

  if (updatedEffects.length === 0) {
    return {
      ...unit,
      effects: undefined,
    };
  }

  return {
    ...unit,
    effects: updatedEffects,
  };
}

/**
 * Remove a specific effect from unit
 *
 * @param unit - Unit to update
 * @param effectType - Type of effect to remove
 * @returns Updated unit without the effect
 */
export function removeEffect<T extends ContagionUnit>(
  unit: T,
  effectType: EffectType,
): T {
  if (!unit.effects || unit.effects.length === 0) {
    return unit;
  }

  const updatedEffects = unit.effects.filter((e) => e.type !== effectType);

  if (updatedEffects.length === 0) {
    return {
      ...unit,
      effects: undefined,
    };
  }

  return {
    ...unit,
    effects: updatedEffects,
  };
}

/**
 * Get all units affected by a specific effect type
 *
 * @param units - All units
 * @param effectType - Type of effect to find
 * @returns Units with the specified effect
 */
export function getUnitsWithEffect(
  units: ContagionUnit[],
  effectType: EffectType,
): ContagionUnit[] {
  return units.filter((u) => hasEffect(u, effectType));
}

/**
 * Count total effect stacks across all units
 *
 * @param units - All units
 * @param effectType - Type of effect to count
 * @returns Total stack count
 */
export function countTotalStacks(
  units: ContagionUnit[],
  effectType: EffectType,
): number {
  return units.reduce((total, unit) => total + getEffectStacks(unit, effectType), 0);
}
