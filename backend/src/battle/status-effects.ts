/**
 * Status Effects System for Fantasy Autobattler.
 * Handles buffs, debuffs, and their application to battle units.
 * 
 * @fileoverview Implements the buff/debuff system with stat modifications,
 * duration tracking, and effect stacking. All functions are pure and deterministic.
 */

import { BattleUnit, UnitStats } from '../types/game.types';
import { 
  StatusEffect, 
  AbilityEffect, 
  BuffEffect, 
  DebuffEffect,
  ModifiableStat,
  isBuffEffect,
  isDebuffEffect,
} from '../types/ability.types';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// STATUS EFFECT TYPES
// =============================================================================

/**
 * Extended battle unit with status effects tracking.
 * Adds status effect arrays to the base BattleUnit interface.
 */
export interface BattleUnitWithEffects extends BattleUnit {
  /** Active status effects on this unit */
  statusEffects: StatusEffect[];
  /** Whether unit is currently stunned */
  isStunned: boolean;
  /** Whether unit has taunt active */
  hasTaunt: boolean;
}

/**
 * Result of applying a status effect.
 */
export interface ApplyEffectResult {
  /** Updated unit with effect applied */
  unit: BattleUnitWithEffects;
  /** Whether effect was successfully applied */
  applied: boolean;
  /** Message describing the result */
  message: string;
}

/**
 * Result of ticking status effects at turn end.
 */
export interface TickEffectsResult {
  /** Updated unit after tick */
  unit: BattleUnitWithEffects;
  /** Effects that expired this tick */
  expiredEffects: StatusEffect[];
  /** Damage dealt by DoT effects */
  dotDamage: number;
  /** Healing from HoT effects */
  hotHealing: number;
}

/**
 * Modified stats after applying all active effects.
 */
export interface ModifiedStatsResult {
  /** Final modified stats */
  stats: UnitStats;
  /** Breakdown of modifications by stat */
  modifications: Record<ModifiableStat, { flat: number; percentage: number }>;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique ID for a status effect instance.
 * 
 * @returns Unique status effect ID
 * @example
 * const effectId = generateEffectId(); // "effect_abc123..."
 */
function generateEffectId(): string {
  return `effect_${uuidv4().slice(0, 8)}`;
}



// =============================================================================
// CORE STATUS EFFECT FUNCTIONS
// =============================================================================

/**
 * Create a status effect instance from an ability effect.
 * 
 * @param effect - Ability effect to create status from
 * @param sourceAbilityId - ID of the ability that created this effect
 * @param sourceUnitId - ID of the unit that applied this effect
 * @param duration - Duration in turns (overrides effect duration if provided)
 * @returns New status effect instance
 * @example
 * const statusEffect = createStatusEffect(buffEffect, 'shield_wall', 'player_knight_0', 3);
 */
export function createStatusEffect(
  effect: AbilityEffect,
  sourceAbilityId: string,
  sourceUnitId: string,
  duration?: number
): StatusEffect {
  const effectDuration = duration ?? effect.duration ?? 1;
  
  return {
    id: generateEffectId(),
    sourceAbilityId,
    sourceUnitId,
    effect,
    remainingDuration: effectDuration,
    stacks: 1,
  };
}

/**
 * Apply a status effect to a battle unit.
 * Handles stacking, duration refresh, and effect limits.
 * 
 * @param unit - Unit to apply effect to
 * @param effect - Status effect to apply
 * @returns Result with updated unit and application status
 * @example
 * const result = applyStatusEffect(knight, armorBuff);
 * if (result.applied) {
 *   console.log(`Applied: ${result.message}`);
 * }
 */
export function applyStatusEffect(
  unit: BattleUnitWithEffects,
  effect: StatusEffect
): ApplyEffectResult {
  // Check if unit is alive
  if (!unit.alive) {
    return {
      unit,
      applied: false,
      message: 'Cannot apply effect to dead unit',
    };
  }
  
  // Check for existing effect from same source
  const existingEffectIndex = unit.statusEffects.findIndex(
    e => e.sourceAbilityId === effect.sourceAbilityId && e.effect.type === effect.effect.type
  );
  
  let newStatusEffects: StatusEffect[];
  let message: string;
  
  if (existingEffectIndex >= 0) {
    // Effect already exists - check if stackable
    const existingEffect = unit.statusEffects[existingEffectIndex];
    
    if (!existingEffect) {
      return {
        unit,
        applied: false,
        message: 'Existing effect not found',
      };
    }
    
    const abilityEffect = effect.effect as BuffEffect | DebuffEffect;
    const isStackable = 'stackable' in abilityEffect && abilityEffect.stackable;
    const maxStacks = 'maxStacks' in abilityEffect ? abilityEffect.maxStacks ?? 5 : 5;
    
    if (isStackable && existingEffect.stacks < maxStacks) {
      // Add stack
      const updatedEffect: StatusEffect = {
        ...existingEffect,
        stacks: existingEffect.stacks + 1,
        remainingDuration: Math.max(existingEffect.remainingDuration, effect.remainingDuration),
      };
      
      newStatusEffects = [
        ...unit.statusEffects.slice(0, existingEffectIndex),
        updatedEffect,
        ...unit.statusEffects.slice(existingEffectIndex + 1),
      ];
      message = `Stacked effect (${updatedEffect.stacks}/${maxStacks})`;
    } else {
      // Refresh duration
      const updatedEffect: StatusEffect = {
        ...existingEffect,
        remainingDuration: Math.max(existingEffect.remainingDuration, effect.remainingDuration),
      };
      
      newStatusEffects = [
        ...unit.statusEffects.slice(0, existingEffectIndex),
        updatedEffect,
        ...unit.statusEffects.slice(existingEffectIndex + 1),
      ];
      message = 'Refreshed effect duration';
    }
  } else {
    // New effect
    newStatusEffects = [...unit.statusEffects, effect];
    message = 'Applied new effect';
  }
  
  // Update stun and taunt flags
  const isStunned = newStatusEffects.some(e => e.effect.type === 'stun' && e.remainingDuration > 0);
  const hasTaunt = newStatusEffects.some(e => e.effect.type === 'taunt' && e.remainingDuration > 0);
  
  return {
    unit: {
      ...unit,
      statusEffects: newStatusEffects,
      isStunned,
      hasTaunt,
    },
    applied: true,
    message,
  };
}

/**
 * Remove a specific status effect from a unit.
 * 
 * @param unit - Unit to remove effect from
 * @param effectId - ID of effect to remove
 * @returns Updated unit without the effect
 * @example
 * const updatedUnit = removeStatusEffect(knight, 'effect_abc123');
 */
export function removeStatusEffect(
  unit: BattleUnitWithEffects,
  effectId: string
): BattleUnitWithEffects {
  const newStatusEffects = unit.statusEffects.filter(e => e.id !== effectId);
  
  // Update stun and taunt flags
  const isStunned = newStatusEffects.some(e => e.effect.type === 'stun' && e.remainingDuration > 0);
  const hasTaunt = newStatusEffects.some(e => e.effect.type === 'taunt' && e.remainingDuration > 0);
  
  return {
    ...unit,
    statusEffects: newStatusEffects,
    isStunned,
    hasTaunt,
  };
}

/**
 * Tick all status effects on a unit, reducing durations and processing DoT/HoT.
 * Called at the end of each unit's turn.
 * 
 * @param unit - Unit to tick effects for
 * @returns Result with updated unit and expired effects
 * @example
 * const result = tickStatusEffects(knight);
 * console.log(`Expired: ${result.expiredEffects.length} effects`);
 */
export function tickStatusEffects(unit: BattleUnitWithEffects): TickEffectsResult {
  const expiredEffects: StatusEffect[] = [];
  let dotDamage = 0;
  let hotHealing = 0;
  
  // Process each effect
  const updatedEffects: StatusEffect[] = [];
  
  for (const effect of unit.statusEffects) {
    // Process DoT damage
    if (effect.effect.type === 'dot') {
      const dotEffect = effect.effect;
      dotDamage += dotEffect.value * effect.stacks;
    }
    
    // Process HoT healing
    if (effect.effect.type === 'hot') {
      const hotEffect = effect.effect;
      hotHealing += hotEffect.value * effect.stacks;
    }
    
    // Reduce duration
    const newDuration = effect.remainingDuration - 1;
    
    if (newDuration <= 0) {
      expiredEffects.push(effect);
    } else {
      updatedEffects.push({
        ...effect,
        remainingDuration: newDuration,
      });
    }
  }
  
  // Apply DoT damage and HoT healing
  let newHp = unit.currentHp;
  
  if (dotDamage > 0) {
    newHp = Math.max(0, newHp - dotDamage);
  }
  
  if (hotHealing > 0) {
    newHp = Math.min(unit.maxHp, newHp + hotHealing);
  }
  
  // Update stun and taunt flags
  const isStunned = updatedEffects.some(e => e.effect.type === 'stun');
  const hasTaunt = updatedEffects.some(e => e.effect.type === 'taunt');
  
  return {
    unit: {
      ...unit,
      currentHp: newHp,
      alive: newHp > 0,
      statusEffects: updatedEffects,
      isStunned,
      hasTaunt,
    },
    expiredEffects,
    dotDamage,
    hotHealing,
  };
}

/**
 * Get modified stats for a unit after applying all active buff/debuff effects.
 * Does not modify the unit, only calculates final stats.
 * 
 * @param unit - Unit to calculate modified stats for
 * @returns Modified stats and breakdown of modifications
 * @example
 * const { stats, modifications } = getModifiedStats(knight);
 * console.log(`Modified ATK: ${stats.atk}`);
 */
export function getModifiedStats(unit: BattleUnitWithEffects): ModifiedStatsResult {
  // Start with base stats
  const baseStats = { ...unit.stats };
  
  // Track modifications for each stat
  const modifications: Record<ModifiableStat, { flat: number; percentage: number }> = {
    attack: { flat: 0, percentage: 0 },
    armor: { flat: 0, percentage: 0 },
    speed: { flat: 0, percentage: 0 },
    initiative: { flat: 0, percentage: 0 },
    dodge: { flat: 0, percentage: 0 },
    attackCount: { flat: 0, percentage: 0 },
    range: { flat: 0, percentage: 0 },
  };
  
  // Process all buff and debuff effects
  for (const statusEffect of unit.statusEffects) {
    const effect = statusEffect.effect;
    
    if (isBuffEffect(effect)) {
      const stat = effect.stat;
      const stacks = statusEffect.stacks;
      
      if (effect.value !== undefined) {
        modifications[stat].flat += effect.value * stacks;
      }
      if (effect.percentage !== undefined) {
        modifications[stat].percentage += effect.percentage * stacks;
      }
    }
    
    if (isDebuffEffect(effect)) {
      const stat = effect.stat;
      const stacks = statusEffect.stacks;
      
      if (effect.value !== undefined) {
        modifications[stat].flat -= effect.value * stacks;
      }
      if (effect.percentage !== undefined) {
        modifications[stat].percentage -= effect.percentage * stacks;
      }
    }
  }
  
  // Apply modifications to stats
  const modifiedStats: UnitStats = {
    hp: baseStats.hp, // HP is not modified by buffs/debuffs
    atk: Math.max(1, Math.round(
      (baseStats.atk + modifications.attack.flat) * (1 + modifications.attack.percentage)
    )),
    atkCount: Math.max(1, Math.round(
      (baseStats.atkCount + modifications.attackCount.flat) * (1 + modifications.attackCount.percentage)
    )),
    armor: Math.max(0, Math.round(
      (baseStats.armor + modifications.armor.flat) * (1 + modifications.armor.percentage)
    )),
    speed: Math.max(1, Math.round(
      (baseStats.speed + modifications.speed.flat) * (1 + modifications.speed.percentage)
    )),
    initiative: Math.max(0, Math.round(
      (baseStats.initiative + modifications.initiative.flat) * (1 + modifications.initiative.percentage)
    )),
    dodge: Math.min(100, Math.max(0, Math.round(
      (baseStats.dodge + modifications.dodge.flat) * (1 + modifications.dodge.percentage)
    ))),
  };
  
  return {
    stats: modifiedStats,
    modifications,
  };
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Initialize a battle unit with empty status effects.
 * Converts a regular BattleUnit to BattleUnitWithEffects.
 * 
 * @param unit - Base battle unit
 * @returns Unit with status effects initialized
 * @example
 * const unitWithEffects = initializeUnitEffects(knight);
 */
export function initializeUnitEffects(unit: BattleUnit): BattleUnitWithEffects {
  return {
    ...unit,
    statusEffects: [],
    isStunned: false,
    hasTaunt: false,
  };
}

/**
 * Remove all status effects from a unit (cleanse).
 * 
 * @param unit - Unit to cleanse
 * @param effectTypes - Optional array of effect types to remove (removes all if not specified)
 * @returns Cleansed unit
 * @example
 * const cleansedUnit = clearAllEffects(knight, ['debuff', 'dot']);
 */
export function clearAllEffects(
  unit: BattleUnitWithEffects,
  effectTypes?: string[]
): BattleUnitWithEffects {
  let newStatusEffects: StatusEffect[];
  
  if (effectTypes && effectTypes.length > 0) {
    newStatusEffects = unit.statusEffects.filter(
      e => !effectTypes.includes(e.effect.type)
    );
  } else {
    newStatusEffects = [];
  }
  
  return {
    ...unit,
    statusEffects: newStatusEffects,
    isStunned: newStatusEffects.some(e => e.effect.type === 'stun'),
    hasTaunt: newStatusEffects.some(e => e.effect.type === 'taunt'),
  };
}

/**
 * Check if a unit has a specific type of status effect active.
 * 
 * @param unit - Unit to check
 * @param effectType - Type of effect to check for
 * @returns True if unit has the effect type active
 * @example
 * if (hasEffectType(knight, 'stun')) {
 *   console.log('Knight is stunned!');
 * }
 */
export function hasEffectType(
  unit: BattleUnitWithEffects,
  effectType: string
): boolean {
  return unit.statusEffects.some(e => e.effect.type === effectType);
}

/**
 * Get all effects of a specific type on a unit.
 * 
 * @param unit - Unit to check
 * @param effectType - Type of effects to get
 * @returns Array of matching status effects
 * @example
 * const buffs = getEffectsByType(knight, 'buff');
 */
export function getEffectsByType(
  unit: BattleUnitWithEffects,
  effectType: string
): StatusEffect[] {
  return unit.statusEffects.filter(e => e.effect.type === effectType);
}

/**
 * Calculate total buff/debuff value for a specific stat.
 * 
 * @param unit - Unit to calculate for
 * @param stat - Stat to calculate modifier for
 * @returns Total modifier value (positive for buffs, negative for debuffs)
 * @example
 * const armorMod = getStatModifier(knight, 'armor');
 * console.log(`Armor modifier: ${armorMod > 0 ? '+' : ''}${armorMod}`);
 */
export function getStatModifier(
  unit: BattleUnitWithEffects,
  stat: ModifiableStat
): number {
  let totalModifier = 0;
  
  for (const statusEffect of unit.statusEffects) {
    const effect = statusEffect.effect;
    
    if (isBuffEffect(effect) && effect.stat === stat) {
      if (effect.value !== undefined) {
        totalModifier += effect.value * statusEffect.stacks;
      }
    }
    
    if (isDebuffEffect(effect) && effect.stat === stat) {
      if (effect.value !== undefined) {
        totalModifier -= effect.value * statusEffect.stacks;
      }
    }
  }
  
  return totalModifier;
}
