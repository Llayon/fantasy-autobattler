/**
 * Tier 1: Flanking Processor
 *
 * Implements the flanking system which provides damage bonuses
 * and resolve damage based on attack angle relative to target's facing.
 *
 * Flanking requires the facing mechanic (Tier 0) to be enabled.
 *
 * Attack arcs and their effects:
 * - Front (0°-45°): No bonus, riposte allowed
 * - Flank (45°-135°): +15% damage, resolve damage, disables riposte
 * - Rear (135°-180°): +30% damage, higher resolve damage, disables riposte
 *
 * @module core/mechanics/tier1/flanking
 */

import type { BattleState } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { ResolveConfig } from '../../config/mechanics.types';
import type {
  AttackArc,
  FlankingProcessor,
  FlankingProcessorOptions,
  FlankingResult,
} from './flanking.types';
import {
  FLANKING_DAMAGE_MODIFIERS,
  DEFAULT_FLANKING_RESOLVE_DAMAGE,
} from './flanking.types';

/**
 * Creates a flanking processor instance.
 *
 * The flanking processor handles:
 * - Damage modifiers based on attack arc (front/flank/rear)
 * - Resolve damage calculation for flanking attacks
 * - Riposte disabling for non-front attacks
 *
 * @param options - Optional custom configuration for damage modifiers
 * @returns FlankingProcessor instance
 *
 * @example
 * const processor = createFlankingProcessor();
 *
 * // Get damage modifier for a flank attack
 * const modifier = processor.getDamageModifier('flank'); // 1.15
 *
 * // Calculate resolve damage
 * const resolveDmg = processor.getResolveDamage('rear', resolveConfig); // 20
 *
 * // Check if riposte is disabled
 * const noRiposte = processor.disablesRiposte('flank'); // true
 */
export function createFlankingProcessor(
  options?: FlankingProcessorOptions,
): FlankingProcessor {
  // Merge custom modifiers with defaults
  const damageModifiers: Record<AttackArc, number> = {
    ...FLANKING_DAMAGE_MODIFIERS,
    ...options?.damageModifiers,
  };

  const defaultResolveDamage: Record<AttackArc, number> = {
    ...DEFAULT_FLANKING_RESOLVE_DAMAGE,
    ...options?.defaultResolveDamage,
  };

  return {
    /**
     * Calculates damage modifier based on attack arc.
     * Returns a multiplier to apply to base damage.
     *
     * Modifiers:
     * - front: 1.0 (no bonus)
     * - flank: 1.15 (+15% damage)
     * - rear: 1.3 (+30% damage)
     *
     * @param arc - Attack arc relative to target's facing ('front', 'flank', or 'rear')
     * @returns Damage multiplier (1.0 to 1.3)
     * @example
     * const modifier = processor.getDamageModifier('rear');
     * const finalDamage = Math.floor(baseDamage * modifier); // +30% damage
     */
    getDamageModifier(arc: AttackArc): number {
      // Flanking damage formula: finalDamage = baseDamage * modifier
      // - Front (0°-45° from facing): modifier = 1.0 (no bonus)
      // - Flank (45°-135° from facing): modifier = 1.15 (+15% bonus)
      // - Rear (135°-180° from facing): modifier = 1.3 (+30% bonus)
      return damageModifiers[arc];
    },

    /**
     * Calculates resolve damage based on attack arc.
     * Uses values from ResolveConfig if provided, otherwise defaults.
     *
     * Default values:
     * - front: 0 (no resolve damage)
     * - flank: 12 (from config.flankingResolveDamage)
     * - rear: 20 (from config.rearResolveDamage)
     *
     * @param arc - Attack arc relative to target's facing
     * @param config - Optional resolve configuration for custom values
     * @returns Resolve damage amount (0 for front attacks)
     * @example
     * const resolveDmg = processor.getResolveDamage('flank', resolveConfig);
     * // Apply to target's resolve: target.resolve -= resolveDmg;
     */
    getResolveDamage(arc: AttackArc, config?: ResolveConfig): number {
      // Resolve damage formula: resolveDamage = arcValue
      // - Front attacks: 0 (no morale impact from expected direction)
      // - Flank attacks: 12 (moderate morale shock from unexpected angle)
      // - Rear attacks: 20 (severe morale shock from behind)
      // These values represent psychological impact of being attacked from vulnerable angles

      // Front attacks never deal resolve damage
      if (arc === 'front') {
        return 0;
      }

      // Use config values if provided
      if (config) {
        if (arc === 'flank') {
          return config.flankingResolveDamage;
        }
        if (arc === 'rear') {
          return config.rearResolveDamage;
        }
      }

      // Fall back to defaults
      return defaultResolveDamage[arc];
    },

    /**
     * Checks if the attack arc disables riposte.
     * Only front attacks allow the defender to riposte.
     *
     * @param arc - Attack arc relative to target's facing
     * @returns True if riposte is disabled (flank or rear attacks)
     * @example
     * if (processor.disablesRiposte(arc)) {
     *   // Skip riposte check for defender
     * }
     */
    disablesRiposte(arc: AttackArc): boolean {
      return arc !== 'front';
    },

    /**
     * Calculates all flanking effects for an attack.
     * Convenience method that returns all modifiers at once.
     *
     * @param arc - Attack arc relative to target's facing
     * @param config - Optional resolve configuration for resolve damage
     * @returns Complete flanking result with damageModifier, resolveDamage, and disablesRiposte
     * @example
     * const result = processor.calculateFlankingEffects('rear', resolveConfig);
     * // result.damageModifier === 1.3
     * // result.resolveDamage === 20
     * // result.disablesRiposte === true
     */
    calculateFlankingEffects(arc: AttackArc, config?: ResolveConfig): FlankingResult {
      return {
        arc,
        damageModifier: this.getDamageModifier(arc),
        resolveDamage: this.getResolveDamage(arc, config),
        disablesRiposte: this.disablesRiposte(arc),
      };
    },

    /**
     * Apply flanking logic for a battle phase.
     * Flanking modifiers are typically applied during damage calculation
     * in the pre_attack phase, but the actual state modification happens
     * in the damage calculation code, not here.
     *
     * This method returns the state unchanged because:
     * 1. Flanking modifiers are applied during damage calculation
     * 2. The facing processor handles auto-facing
     * 3. Resolve damage is applied by the resolve processor
     *
     * @param _phase - Current battle phase (unused, modifiers applied elsewhere)
     * @param state - Current battle state
     * @param _context - Phase context (unused, modifiers applied elsewhere)
     * @returns Battle state (unchanged - modifiers applied during damage calculation)
     * @example
     * // Flanking is typically used via getDamageModifier during damage calculation:
     * const arc = facingProcessor.getAttackArc(attacker, target);
     * const modifier = flankingProcessor.getDamageModifier(arc);
     * const finalDamage = Math.floor(baseDamage * modifier);
     */
    apply(
      _phase: BattlePhase,
      state: BattleState,
      _context: PhaseContext,
    ): BattleState {
      // Flanking modifiers are applied during damage calculation,
      // not as a state transformation. The processor provides
      // calculation methods that are used by the damage system.
      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createFlankingProcessor;
