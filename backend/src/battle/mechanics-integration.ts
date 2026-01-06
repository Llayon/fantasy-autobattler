/**
 * Mechanics Integration for Battle Simulator.
 * Bridges Core 2.0 mechanics with damage calculation system.
 *
 * This module provides functions to:
 * - Calculate damage modifiers from enabled mechanics
 * - Generate mechanic events for battle log
 * - Apply mechanic effects to combat resolution
 *
 * @fileoverview Integration layer between MechanicsProcessor and damage system.
 * @module battle/mechanics-integration
 */

import type { BattleUnit, Position } from '../types/game.types';
import type { BattleEvent } from '../core/types/event.types';
import type { MechanicsProcessor } from '../core/mechanics';
import { createFacingProcessor } from '../core/mechanics/tier0/facing/facing.processor';
import { createFlankingProcessor } from '../core/mechanics/tier1/flanking/flanking.processor';
import { createChargeProcessor } from '../core/mechanics/tier3/charge/charge.processor';
import type { AttackArc } from '../core/mechanics/tier0/facing/facing.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Combat modifiers calculated from enabled mechanics.
 * These modifiers are applied during damage calculation.
 */
export interface CombatModifiers {
  /** Flanking damage multiplier (1.0 = no bonus, 1.15 = flank, 1.3 = rear) */
  flankingModifier: number;
  /** Charge momentum bonus (0.0 = no charge, up to 1.0 = max momentum) */
  momentumBonus: number;
  /** Attack arc for this attack */
  attackArc: AttackArc;
  /** Whether riposte is disabled for this attack */
  disablesRiposte: boolean;
  /** Resolve damage to apply to target */
  resolveDamage: number;
}

/**
 * Result of calculating combat modifiers.
 * Includes modifiers and any events generated.
 */
export interface CombatModifiersResult {
  /** Calculated combat modifiers */
  modifiers: CombatModifiers;
  /** Events generated during modifier calculation */
  events: BattleEvent[];
}

/**
 * Context for combat modifier calculation.
 */
export interface CombatContext {
  /** Attacking unit */
  attacker: BattleUnit;
  /** Target unit */
  target: BattleUnit;
  /** Distance moved this turn (for charge calculation) */
  distanceMoved: number;
  /** Current battle round */
  round: number;
  /** Random seed for deterministic behavior */
  seed: number;
}

// =============================================================================
// DEFAULT MODIFIERS
// =============================================================================

/**
 * Default combat modifiers when no mechanics are enabled.
 * Represents Core 1.0 (MVP) behavior.
 */
export const DEFAULT_COMBAT_MODIFIERS: CombatModifiers = {
  flankingModifier: 1.0,
  momentumBonus: 0,
  attackArc: 'front',
  disablesRiposte: false,
  resolveDamage: 0,
};

// =============================================================================
// MODIFIER CALCULATION
// =============================================================================

/**
 * Calculate combat modifiers from enabled mechanics.
 * Returns modifiers that should be applied to damage calculation.
 *
 * @param processor - Mechanics processor with enabled mechanics
 * @param context - Combat context with attacker, target, and movement info
 * @returns Combat modifiers and generated events
 *
 * @example
 * const result = calculateCombatModifiers(processor, {
 *   attacker: knight,
 *   target: enemy,
 *   distanceMoved: 3,
 *   round: 5,
 *   seed: 12345,
 * });
 * // result.modifiers.flankingModifier = 1.3 (rear attack)
 * // result.modifiers.momentumBonus = 0.6 (3 cells moved)
 */
export function calculateCombatModifiers(
  processor: MechanicsProcessor | undefined,
  context: CombatContext,
): CombatModifiersResult {
  // If no processor, return default modifiers (Core 1.0 behavior)
  if (!processor) {
    return {
      modifiers: { ...DEFAULT_COMBAT_MODIFIERS },
      events: [],
    };
  }

  const { attacker, target, distanceMoved, round } = context;
  const events: BattleEvent[] = [];
  const config = processor.config;

  let flankingModifier = 1.0;
  let momentumBonus = 0;
  let attackArc: AttackArc = 'front';
  let disablesRiposte = false;
  let resolveDamage = 0;

  // ─────────────────────────────────────────────────────────────
  // FACING & FLANKING (Tier 0-1)
  // ─────────────────────────────────────────────────────────────
  if (config.facing) {
    const facingProcessor = createFacingProcessor();

    // Calculate attack arc based on positions and target facing
    attackArc = facingProcessor.getAttackArc(attacker, target);

    // Apply flanking modifiers if flanking is enabled
    // IMPORTANT: Only melee units (range <= 1) can benefit from flanking
    const isMeleeAttacker = attacker.range <= 1;
    if (config.flanking && isMeleeAttacker) {
      const flankingProcessor = createFlankingProcessor();
      const resolveConfig = typeof config.resolve === 'object' ? config.resolve : undefined;

      flankingModifier = flankingProcessor.getDamageModifier(attackArc);
      disablesRiposte = flankingProcessor.disablesRiposte(attackArc);
      resolveDamage = flankingProcessor.getResolveDamage(attackArc, resolveConfig);

      // Generate flanking event if not front attack
      if (attackArc !== 'front') {
        events.push({
          type: 'mechanic_flanking',
          round,
          actorId: attacker.instanceId,
          targetId: target.instanceId,
          metadata: {
            arc: attackArc,
            damageModifier: flankingModifier,
            resolveDamage,
            disablesRiposte,
          },
        } as BattleEvent);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CHARGE (Tier 3)
  // ─────────────────────────────────────────────────────────────
  if (config.charge && distanceMoved > 0) {
    const chargeConfig = typeof config.charge === 'object' ? config.charge : undefined;

    if (chargeConfig) {
      const chargeProcessor = createChargeProcessor(chargeConfig);

      // Check if unit can charge (has charge tag or is cavalry)
      const canCharge = hasChargeCapability(attacker);

      if (canCharge) {
        momentumBonus = chargeProcessor.calculateMomentum(distanceMoved, chargeConfig);

        // Generate charge event if momentum > 0
        if (momentumBonus > 0) {
          events.push({
            type: 'mechanic_charge',
            round,
            actorId: attacker.instanceId,
            targetId: target.instanceId,
            metadata: {
              distanceMoved,
              momentumBonus,
              damageMultiplier: 1 + momentumBonus,
            },
          } as BattleEvent);
        }
      }
    }
  }

  return {
    modifiers: {
      flankingModifier,
      momentumBonus,
      attackArc,
      disablesRiposte,
      resolveDamage,
    },
    events,
  };
}

/**
 * Check if a unit has charge capability.
 * Units with 'charge' or 'cavalry' tags can perform charge attacks.
 *
 * @param unit - Unit to check
 * @returns True if unit can charge
 */
function hasChargeCapability(unit: BattleUnit): boolean {
  const tags = (unit as BattleUnit & { tags?: string[] }).tags ?? [];
  return tags.includes('charge') || tags.includes('cavalry');
}

/**
 * Calculate distance between two positions (Manhattan distance).
 *
 * @param from - Starting position
 * @param to - Ending position
 * @returns Manhattan distance
 */
export function calculateDistance(from: Position, to: Position): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

// =============================================================================
// ARMOR SHRED INTEGRATION
// =============================================================================

/**
 * Get effective armor for a unit, accounting for armor shred.
 * This is used by damage calculation to apply shred effects.
 *
 * @param unit - Unit to get effective armor for
 * @returns Effective armor value (base armor - shred, minimum 0)
 *
 * @example
 * const knight = { stats: { armor: 10 }, armorShred: 3 };
 * const effectiveArmor = getEffectiveArmor(knight);
 * // Returns: 7 (10 - 3)
 */
export function getEffectiveArmor(unit: BattleUnit): number {
  const baseArmor = unit.stats.armor;
  const shred = (unit as BattleUnit & { armorShred?: number }).armorShred ?? 0;
  return Math.max(0, baseArmor - shred);
}

// =============================================================================
// RESOLVE INTEGRATION
// =============================================================================

/**
 * Apply resolve damage to a unit.
 * Resolve represents morale/fighting spirit.
 *
 * @param unit - Unit to apply resolve damage to
 * @param damage - Amount of resolve damage
 * @returns Updated unit with reduced resolve
 */
export function applyResolveDamage(
  unit: BattleUnit,
  damage: number,
): BattleUnit {
  const currentResolve = (unit as BattleUnit & { resolve?: number }).resolve ?? 100;
  const newResolve = Math.max(0, currentResolve - damage);

  return {
    ...unit,
    resolve: newResolve,
  } as BattleUnit;
}

/**
 * Check if unit is broken (resolve depleted).
 * Broken units may flee or have reduced effectiveness.
 *
 * @param unit - Unit to check
 * @returns True if unit's resolve is 0
 */
export function isUnitBroken(unit: BattleUnit): boolean {
  const resolve = (unit as BattleUnit & { resolve?: number }).resolve;
  return resolve !== undefined && resolve <= 0;
}
