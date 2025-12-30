/**
 * Core Mechanics 2.0 - Public API
 *
 * Modular battle mechanics with feature flags for the autobattler engine.
 * All mechanics are optional and can be enabled/disabled independently.
 *
 * @module core/mechanics
 * @example
 * // MVP mode (all mechanics disabled, identical to Core 1.0)
 * import { createMechanicsProcessor, MVP_PRESET } from '@core/mechanics';
 * const processor = createMechanicsProcessor(MVP_PRESET);
 *
 * @example
 * // Roguelike mode (all mechanics enabled)
 * import { createMechanicsProcessor, ROGUELIKE_PRESET } from '@core/mechanics';
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 *
 * @example
 * // Custom configuration (dependencies auto-resolved)
 * import { createMechanicsProcessor } from '@core/mechanics';
 * const processor = createMechanicsProcessor({
 *   facing: true,
 *   flanking: true,
 *   riposte: { initiativeBased: true },
 * });
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  MechanicsConfig,
  ResolveConfig,
  EngagementConfig,
  RiposteConfig,
  InterceptConfig,
  ChargeConfig,
  PhalanxConfig,
  LoSConfig,
  AmmoConfig,
  ContagionConfig,
  ShredConfig,
} from './config/mechanics.types';

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

export {
  DEFAULT_RESOLVE_CONFIG,
  DEFAULT_ENGAGEMENT_CONFIG,
  DEFAULT_RIPOSTE_CONFIG,
  DEFAULT_INTERCEPT_CONFIG,
  DEFAULT_CHARGE_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_LOS_CONFIG,
  DEFAULT_AMMO_CONFIG,
  DEFAULT_CONTAGION_CONFIG,
  DEFAULT_SHRED_CONFIG,
} from './config/defaults';

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

export { MVP_PRESET } from './config/presets/mvp';
export { ROGUELIKE_PRESET } from './config/presets/roguelike';
export { TACTICAL_PRESET } from './config/presets/tactical';

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY RESOLUTION
// ═══════════════════════════════════════════════════════════════

export {
  MECHANIC_DEPENDENCIES,
  resolveDependencies,
  getDefaultConfig,
} from './config/dependencies';

// ═══════════════════════════════════════════════════════════════
// CONFIG VALIDATION
// ═══════════════════════════════════════════════════════════════

export { validateMechanicsConfig } from './config/validator';
export type { ValidationResult } from './config/validator';

// ═══════════════════════════════════════════════════════════════
// MECHANICS PROCESSOR
// ═══════════════════════════════════════════════════════════════

export {
  createMechanicsProcessor,
  applyMechanics,
  buildProcessors,
  PHASE_MECHANICS,
} from './processor';

export type {
  MechanicsProcessor,
  MechanicProcessorMap,
  MechanicProcessor,
  BattlePhase,
  PhaseContext,
  BattleAction,
  BattleActionType,
} from './processor';

// ═══════════════════════════════════════════════════════════════
// TIER 0: BASE MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createFacingProcessor } from './tier0/facing/facing.processor';
export type {
  FacingProcessor,
  FacingDirection,
  AttackArc,
} from './tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// TIER 1: CORE COMBAT MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createResolveProcessor } from './tier1/resolve/resolve.processor';
export type { ResolveProcessor, MechanicsResolveState } from './tier1/resolve/resolve.types';

export { createEngagementProcessor } from './tier1/engagement/engagement.processor';
export type { EngagementProcessor } from './tier1/engagement/engagement.types';

export { createFlankingProcessor } from './tier1/flanking/flanking.processor';
export type { FlankingProcessor } from './tier1/flanking/flanking.types';

// ═══════════════════════════════════════════════════════════════
// TIER 2: ADVANCED MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createRiposteProcessor } from './tier2/riposte/riposte.processor';
export type { RiposteProcessor } from './tier2/riposte/riposte.types';

export { createInterceptProcessor } from './tier2/intercept/intercept.processor';
export type { InterceptProcessor, InterceptType } from './tier2/intercept/intercept.types';

export { createAuraProcessor } from './tier2/aura/aura.processor';
export type { AuraProcessor, Aura, AuraType } from './tier2/aura/aura.types';

// ═══════════════════════════════════════════════════════════════
// TIER 3: SPECIALIZED MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createChargeProcessor } from './tier3/charge/charge.processor';
export type { ChargeProcessor } from './tier3/charge/charge.types';

export { createOverwatchProcessor } from './tier3/overwatch/overwatch.processor';
export type { OverwatchProcessor } from './tier3/overwatch/overwatch.types';

export { createPhalanxProcessor } from './tier3/phalanx/phalanx.processor';
export type { PhalanxProcessor } from './tier3/phalanx/phalanx.types';

export { createLoSProcessor } from './tier3/los/los.processor';
export type { LoSProcessor, FireType } from './tier3/los/los.types';

export { createAmmoProcessor } from './tier3/ammunition/ammunition.processor';
export type { AmmoProcessor } from './tier3/ammunition/ammunition.types';

// ═══════════════════════════════════════════════════════════════
// TIER 4: COUNTER-MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createContagionProcessor } from './tier4/contagion/contagion.processor';
export type { ContagionProcessor, ContagionType } from './tier4/contagion/contagion.types';

export { createShredProcessor } from './tier4/armor-shred/armor-shred.processor';
export type { ArmorShredProcessor } from './tier4/armor-shred/armor-shred.types';

// ═══════════════════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════

export { updateUnit, updateUnits, findUnit } from './helpers';
