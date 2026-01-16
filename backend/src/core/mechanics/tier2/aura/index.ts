/**
 * Tier 2: Aura Module
 *
 * Exports the aura processor and related types for area-of-effect
 * buffs, debuffs, and periodic effects.
 *
 * Aura is an independent mechanic (no dependencies required).
 *
 * Key mechanics:
 * - Static auras: Always active while unit is alive
 * - Pulse auras: Apply effect once per turn to units in range
 * - Relic auras: Item-based auras with special properties
 *
 * @module core/mechanics/tier2/aura
 *
 * @example
 * import { createAuraProcessor } from './aura';
 *
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

export { createAuraProcessor, default } from './aura.processor';
export type {
  // Re-exported types from battle.types.ts
  AuraType,
  AuraTarget,
  AuraEffectType,
  AuraStat,
  AuraEffect,
  Aura,
  // Unit extensions
  ActiveAura,
  AuraBuff,
  UnitWithAura,
  // Check types
  AuraRangeCheck,
  AuraApplicationResult,
  AuraBlockReason,
  // Event types
  AuraActivatedEvent,
  AuraDeactivatedEvent,
  AuraEffectAppliedEvent,
  AuraEffectRemovedEvent,
  AuraPulseEvent,
  AuraEvent,
  // Processor interface
  AuraProcessor,
  // Helper types
  AuraProcessorOptions,
  AuraContext,
  AuraFullResult,
} from './aura.types';
export {
  // Constants
  DEFAULT_AURA_RANGE,
  MAX_AURA_RANGE,
  DEFAULT_PULSE_INTERVAL,
} from './aura.types';
