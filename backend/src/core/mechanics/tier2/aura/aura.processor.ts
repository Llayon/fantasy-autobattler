/**
 * Aura processor
 *
 * Implements territorial effect system.
 * - Static auras: Always active while unit is alive
 * - Pulse auras: Apply effect once per turn
 * - Range-based effect application
 * - Stacking limits for multiple auras
 */

import { AuraType, AuraConfig } from '../../config/mechanics.types';
import { Position } from '../../tier0/facing';
import {
  Aura,
  AuraUnit,
  AppliedAuraEffect,
  AuraApplicationResult,
  AuraRangeResult,
  DEFAULT_AURA_VALUES,
} from './aura.types';

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
 * Check if a unit is within aura range
 *
 * @param source - Unit with the aura
 * @param target - Unit to check
 * @param aura - Aura to check range for
 * @returns Aura range result
 *
 * @example
 * const result = isInAuraRange(priest, warrior, healingAura);
 * if (result.inRange) { ... }
 */
export function isInAuraRange(
  source: AuraUnit,
  target: AuraUnit,
  aura: Aura,
): AuraRangeResult {
  const distance = getDistance(source.position, target.position);

  return {
    inRange: distance <= aura.range && distance > 0,
    distance,
  };
}

/**
 * Check if aura affects a target based on team
 *
 * @param source - Unit with the aura
 * @param target - Unit to check
 * @param aura - Aura to check
 * @returns true if aura affects the target
 */
export function auraAffectsTarget(
  source: AuraUnit,
  target: AuraUnit,
  aura: Aura,
): boolean {
  // Don't affect self
  if (source.id === target.id) {
    return false;
  }

  const sameTeam = source.team === target.team;

  if (sameTeam && aura.affectsAllies) {
    return true;
  }

  if (!sameTeam && aura.affectsEnemies) {
    return true;
  }

  return false;
}

/**
 * Get all units affected by an aura
 *
 * @param source - Unit with the aura
 * @param aura - Aura to check
 * @param allUnits - All units on the battlefield
 * @returns Array of affected units
 *
 * @example
 * const affected = getAffectedUnits(priest, healingAura, allUnits);
 */
export function getAffectedUnits(
  source: AuraUnit,
  aura: Aura,
  allUnits: AuraUnit[],
): AuraUnit[] {
  return allUnits.filter((unit) => {
    if (!auraAffectsTarget(source, unit, aura)) {
      return false;
    }

    const rangeResult = isInAuraRange(source, unit, aura);
    return rangeResult.inRange;
  });
}

/**
 * Apply a static aura to affected units
 *
 * Static auras are always active while the source unit is alive.
 *
 * @param source - Unit with the aura
 * @param aura - Aura to apply
 * @param allUnits - All units on the battlefield
 * @param config - Optional aura configuration
 * @returns Aura application result
 */
export function applyStaticAura(
  source: AuraUnit,
  aura: Aura,
  allUnits: AuraUnit[],
  _config?: Partial<AuraConfig>,
): AuraApplicationResult {
  if (aura.type !== AuraType.STATIC) {
    return { affectedUnits: [], appliedEffects: [] };
  }

  const affected = getAffectedUnits(source, aura, allUnits);
  const appliedEffects: AppliedAuraEffect[] = [];

  for (const _unit of affected) {
    const effect: AppliedAuraEffect = {
      auraId: aura.id,
      sourceUnitId: source.id,
      effect: aura.effect,
    };
    appliedEffects.push(effect);
  }

  return {
    affectedUnits: affected.map((u) => u.id),
    appliedEffects,
  };
}

/**
 * Apply a pulse aura effect (once per turn)
 *
 * Pulse auras apply their effect once at the start of each turn.
 *
 * @param source - Unit with the aura
 * @param aura - Aura to apply
 * @param allUnits - All units on the battlefield
 * @param config - Optional aura configuration
 * @returns Aura application result
 */
export function applyPulseAura(
  source: AuraUnit,
  aura: Aura,
  allUnits: AuraUnit[],
  _config?: Partial<AuraConfig>,
): AuraApplicationResult {
  if (aura.type !== AuraType.PULSE) {
    return { affectedUnits: [], appliedEffects: [] };
  }

  const affected = getAffectedUnits(source, aura, allUnits);
  const appliedEffects: AppliedAuraEffect[] = [];

  for (const _unit of affected) {
    const effect: AppliedAuraEffect = {
      auraId: aura.id,
      sourceUnitId: source.id,
      effect: aura.effect,
      remainingDuration: 1,
    };
    appliedEffects.push(effect);
  }

  return {
    affectedUnits: affected.map((u) => u.id),
    appliedEffects,
  };
}

/**
 * Apply all auras from a unit
 *
 * @param source - Unit with auras
 * @param allUnits - All units on the battlefield
 * @param config - Optional aura configuration
 * @returns Combined aura application result
 */
export function applyAllAuras(
  source: AuraUnit,
  allUnits: AuraUnit[],
  config?: Partial<AuraConfig>,
): AuraApplicationResult {
  if (!source.auras || source.auras.length === 0) {
    return { affectedUnits: [], appliedEffects: [] };
  }

  const allAffected: Set<string> = new Set();
  const allEffects: AppliedAuraEffect[] = [];

  for (const aura of source.auras) {
    let result: AuraApplicationResult;

    if (aura.type === AuraType.STATIC) {
      result = applyStaticAura(source, aura, allUnits, config);
    } else {
      result = applyPulseAura(source, aura, allUnits, config);
    }

    result.affectedUnits.forEach((id) => allAffected.add(id));
    allEffects.push(...result.appliedEffects);
  }

  return {
    affectedUnits: Array.from(allAffected),
    appliedEffects: allEffects,
  };
}

/**
 * Count stacked aura effects on a unit
 *
 * @param unit - Unit to check
 * @param auraId - Aura ID to count
 * @returns Number of stacked effects
 */
export function countStackedEffects(unit: AuraUnit, auraId: string): number {
  if (!unit.activeAuraEffects) {
    return 0;
  }

  return unit.activeAuraEffects.filter((e) => e.auraId === auraId).length;
}

/**
 * Check if aura can stack on a unit
 *
 * @param unit - Unit to check
 * @param aura - Aura to apply
 * @param config - Optional aura configuration
 * @returns true if aura can be applied
 */
export function canStackAura(
  unit: AuraUnit,
  aura: Aura,
  config?: Partial<AuraConfig>,
): boolean {
  if (!aura.stackable) {
    return countStackedEffects(unit, aura.id) === 0;
  }

  const limit = config?.stackingLimit ?? DEFAULT_AURA_VALUES.stackingLimit;
  return countStackedEffects(unit, aura.id) < limit;
}

/**
 * Add aura effect to a unit
 *
 * @param unit - Unit to add effect to
 * @param effect - Effect to add
 * @param aura - Source aura
 * @param config - Optional aura configuration
 * @returns Updated unit with new effect
 */
export function addAuraEffect<T extends AuraUnit>(
  unit: T,
  effect: AppliedAuraEffect,
  aura: Aura,
  config?: Partial<AuraConfig>,
): T {
  if (!canStackAura(unit, aura, config)) {
    return unit;
  }

  const currentEffects = unit.activeAuraEffects ?? [];

  return {
    ...unit,
    activeAuraEffects: [...currentEffects, effect],
  };
}

/**
 * Remove aura effects from a source unit
 *
 * Used when source unit dies or moves out of range.
 *
 * @param unit - Unit to remove effects from
 * @param sourceUnitId - ID of the source unit
 * @returns Updated unit without effects from source
 */
export function removeAuraEffectsFromSource<T extends AuraUnit>(
  unit: T,
  sourceUnitId: string,
): T {
  if (!unit.activeAuraEffects) {
    return unit;
  }

  const filteredEffects = unit.activeAuraEffects.filter(
    (e) => e.sourceUnitId !== sourceUnitId,
  );

  return {
    ...unit,
    activeAuraEffects: filteredEffects,
  };
}

/**
 * Decay pulse aura effects at turn end
 *
 * @param unit - Unit to decay effects on
 * @returns Updated unit with decayed effects
 */
export function decayPulseEffects<T extends AuraUnit>(unit: T): T {
  if (!unit.activeAuraEffects) {
    return unit;
  }

  const decayedEffects = unit.activeAuraEffects
    .map((effect) => {
      if (effect.remainingDuration === undefined) {
        return effect;
      }
      return {
        ...effect,
        remainingDuration: effect.remainingDuration - 1,
      };
    })
    .filter((effect) => {
      if (effect.remainingDuration === undefined) {
        return true;
      }
      return effect.remainingDuration > 0;
    });

  return {
    ...unit,
    activeAuraEffects: decayedEffects,
  };
}

/**
 * Calculate total stat modifier from aura effects
 *
 * @param unit - Unit to calculate for
 * @param stat - Stat to calculate modifier for
 * @returns Total modifier (additive)
 */
export function calculateAuraStatModifier(unit: AuraUnit, stat: string): number {
  if (!unit.activeAuraEffects) {
    return 0;
  }

  return unit.activeAuraEffects
    .filter((e) => e.effect.stat === stat && !e.effect.isPercentage)
    .reduce((sum, e) => sum + (e.effect.modifier ?? 0), 0);
}

/**
 * Calculate total percentage modifier from aura effects
 *
 * @param unit - Unit to calculate for
 * @param stat - Stat to calculate modifier for
 * @returns Total percentage modifier (multiplicative)
 */
export function calculateAuraPercentageModifier(unit: AuraUnit, stat: string): number {
  if (!unit.activeAuraEffects) {
    return 1.0;
  }

  const percentageEffects = unit.activeAuraEffects.filter(
    (e) => e.effect.stat === stat && e.effect.isPercentage,
  );

  if (percentageEffects.length === 0) {
    return 1.0;
  }

  // Multiplicative stacking
  return percentageEffects.reduce(
    (product, e) => product * (1 + (e.effect.modifier ?? 0)),
    1.0,
  );
}

/**
 * Create a simple buff aura
 *
 * @param id - Aura ID
 * @param name - Aura name
 * @param stat - Stat to buff
 * @param modifier - Modifier value
 * @param range - Aura range
 * @returns Aura definition
 */
export function createBuffAura(
  id: string,
  name: string,
  stat: string,
  modifier: number,
  range: number = DEFAULT_AURA_VALUES.defaultRange,
): Aura {
  return {
    id,
    name,
    type: AuraType.STATIC,
    range,
    effect: { stat, modifier },
    affectsAllies: true,
    affectsEnemies: false,
    stackable: false,
  };
}

/**
 * Create a damage pulse aura
 *
 * @param id - Aura ID
 * @param name - Aura name
 * @param damage - Damage per pulse
 * @param range - Aura range
 * @returns Aura definition
 */
export function createDamageAura(
  id: string,
  name: string,
  damage: number,
  range: number = DEFAULT_AURA_VALUES.defaultRange,
): Aura {
  return {
    id,
    name,
    type: AuraType.PULSE,
    range,
    effect: { damage },
    affectsAllies: false,
    affectsEnemies: true,
    stackable: true,
  };
}
