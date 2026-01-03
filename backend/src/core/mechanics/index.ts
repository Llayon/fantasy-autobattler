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
export type {
  ResolveProcessor,
  MechanicsResolveState,
  ResolveFaction,
  UnitWithResolve,
  ResolveDamageSource,
  ResolveDamageEvent,
  ResolveBreakEvent,
  ResolveRegenEvent,
  ResolveBreakResult,
  ResolveDamageOptions,
} from './tier1/resolve/resolve.types';

export { createEngagementProcessor } from './tier1/engagement/engagement.processor';
export type {
  EngagementProcessor,
  EngagementStatus,
  UnitWithEngagement,
  ZoneOfControl,
  ZoCCheckResult,
  AoOTrigger,
  AoOResult,
  EngagementEvent,
  DisengagementEvent,
  AttackOfOpportunityEvent,
  ArcherPenaltyEvent,
  EngagementOptions,
  EngagementUpdateResult,
} from './tier1/engagement/engagement.types';

export { createFlankingProcessor } from './tier1/flanking/flanking.processor';
export type {
  FlankingProcessor,
  FlankingResult,
  FlankingAttackEvent,
  RiposteDisabledEvent,
  FlankingProcessorOptions,
  FlankingContext,
} from './tier1/flanking/flanking.types';
export {
  FLANKING_DAMAGE_MODIFIERS,
  DEFAULT_FLANKING_RESOLVE_DAMAGE,
} from './tier1/flanking/flanking.types';

// ═══════════════════════════════════════════════════════════════
// TIER 2: ADVANCED MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createRiposteProcessor } from './tier2/riposte/riposte.processor';
export type {
  RiposteProcessor,
  UnitWithRiposte,
  RiposteEligibility,
  RiposteBlockReason,
  RiposteChanceResult,
  RiposteExecutionResult,
  RiposteTriggeredEvent,
  RiposteFailedEvent,
  RiposteBlockedEvent,
  RiposteChargesResetEvent,
  RiposteEvent,
  RiposteProcessorOptions,
  RiposteContext,
  RiposteCheckResult,
} from './tier2/riposte/riposte.types';
export {
  RIPOSTE_DAMAGE_MULTIPLIER,
  MIN_RIPOSTE_CHANCE,
  MAX_RIPOSTE_CHANCE,
} from './tier2/riposte/riposte.types';

export { createInterceptProcessor } from './tier2/intercept/intercept.processor';
export type {
  InterceptProcessor,
  InterceptType,
  InterceptResult,
  UnitWithIntercept,
  InterceptOpportunity,
  InterceptBlockReason,
  InterceptCheckResult,
  InterceptExecutionResult,
  DisengageResult,
  DisengageFailReason,
  HardInterceptEvent,
  SoftInterceptEvent,
  InterceptBlockedEvent,
  DisengageEvent,
  InterceptChargesResetEvent,
  InterceptEvent,
  InterceptProcessorOptions,
  InterceptContext,
  InterceptFullResult,
} from './tier2/intercept/intercept.types';
export {
  HARD_INTERCEPT_DAMAGE_MULTIPLIER,
  DEFAULT_DISENGAGE_COST,
  HARD_INTERCEPT_TAG,
  CAVALRY_TAG,
} from './tier2/intercept/intercept.types';

export { createAuraProcessor } from './tier2/aura/aura.processor';
export type {
  AuraProcessor,
  Aura,
  AuraType,
  AuraTarget,
  AuraEffectType,
  AuraStat,
  AuraEffect,
  ActiveAura,
  AuraBuff,
  UnitWithAura,
  AuraRangeCheck,
  AuraApplicationResult,
  AuraBlockReason,
  AuraActivatedEvent,
  AuraDeactivatedEvent,
  AuraEffectAppliedEvent,
  AuraEffectRemovedEvent,
  AuraPulseEvent,
  AuraEvent,
  AuraProcessorOptions,
  AuraContext,
  AuraFullResult,
} from './tier2/aura/aura.types';
export {
  DEFAULT_AURA_RANGE,
  MAX_AURA_RANGE,
  DEFAULT_PULSE_INTERVAL,
} from './tier2/aura/aura.types';

// ═══════════════════════════════════════════════════════════════
// TIER 3: SPECIALIZED MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createChargeProcessor } from './tier3/charge/charge.processor';
export type {
  ChargeProcessor,
  UnitWithCharge,
  MomentumResult,
  ChargeEligibility,
  ChargeBlockReason,
  ChargeDamageResult,
  SpearWallCounterResult,
  ChargeExecutionResult,
  ChargeStartedEvent,
  ChargeImpactEvent,
  ChargeCounteredEvent,
  ChargeFailedEvent,
  MomentumResetEvent,
  ChargeEvent,
  ChargeProcessorOptions,
  ChargeContext,
  ChargeFullResult,
  MoveAction as ChargeMoveAction,
  AttackAction as ChargeAttackAction,
  ChargeRelevantAction,
} from './tier3/charge/charge.types';
export {
  DEFAULT_MOMENTUM_PER_CELL,
  DEFAULT_MAX_MOMENTUM,
  DEFAULT_MIN_CHARGE_DISTANCE,
  DEFAULT_SHOCK_RESOLVE_DAMAGE,
  SPEAR_WALL_COUNTER_MULTIPLIER,
  SPEAR_WALL_TAG,
  CAVALRY_TAG as CHARGE_CAVALRY_TAG,
  CHARGE_TAG,
} from './tier3/charge/charge.types';

export { createOverwatchProcessor } from './tier3/overwatch/overwatch.processor';
export type {
  OverwatchProcessor,
  UnitWithOverwatch,
  OverwatchVigilanceState,
  OverwatchOpportunity,
  OverwatchCheckResult,
  OverwatchShotResult,
  EnterVigilanceResult,
  ExitVigilanceResult,
  ToggleVigilanceResult,
  OverwatchBlockReason,
  VigilanceBlockReason,
  VigilanceExitBlockReason,
  OverwatchResetResult,
  OverwatchProcessorOptions,
  OverwatchEvent,
  VigilanceEnteredEvent,
  OverwatchTriggeredEvent,
  OverwatchShotEvent,
  OverwatchBlockedEvent,
  OverwatchExhaustedEvent,
  OverwatchResetEvent,
  OverwatchContext,
  OverwatchFullResult,
  MoveAction as OverwatchMoveAction,
  VigilanceAction,
  OverwatchRelevantAction,
} from './tier3/overwatch/overwatch.types';
export {
  DEFAULT_OVERWATCH_DAMAGE_MODIFIER,
  DEFAULT_MAX_OVERWATCH_SHOTS,
  DEFAULT_OVERWATCH_ACCURACY_PENALTY,
  OVERWATCH_TAG,
  ENHANCED_OVERWATCH_TAG,
  OVERWATCH_IMMUNE_TAG,
} from './tier3/overwatch/overwatch.types';

export { createPhalanxProcessor } from './tier3/phalanx/phalanx.processor';
export type {
  PhalanxProcessor,
  PhalanxFormationState,
  UnitWithPhalanx,
  AdjacentAlly,
  FormationDetectionResult,
  PhalanxBonusResult,
  PhalanxEligibility,
  PhalanxBlockReason,
  PhalanxRecalculationResult,
  RecalculationTrigger,
  PhalanxFormedEvent,
  PhalanxBrokenEvent,
  PhalanxBreakReason,
  PhalanxUpdatedEvent,
  PhalanxRecalculatedEvent,
  PhalanxEvent,
  PhalanxProcessorOptions,
  PhalanxContext,
  PhalanxFullResult,
  PositionOffset,
} from './tier3/phalanx/phalanx.types';
export {
  DEFAULT_MAX_ARMOR_BONUS,
  DEFAULT_MAX_RESOLVE_BONUS,
  DEFAULT_ARMOR_PER_ALLY,
  DEFAULT_RESOLVE_PER_ALLY,
  MAX_ADJACENT_ALLIES,
  PHALANX_TAG,
  ELITE_PHALANX_TAG,
  PHALANX_IMMUNE_TAG,
  ORTHOGONAL_OFFSETS,
  ALL_NEIGHBOR_OFFSETS,
} from './tier3/phalanx/phalanx.types';

export { createLoSProcessor } from './tier3/los/los.processor';
export type {
  LoSProcessor,
  FireMode,
  FireModeResult,
  UnitWithLoS,
  LoSLine,
  LoSCell,
  LoSObstacle,
  LoSObstacleType,
  LoSCheckResult,
  LoSValidationResult,
  FiringArcResult,
  LoSBlockReason,
  LoSEvent,
  LoSCheckEvent,
  LoSBlockedEvent,
  ArcFireUsedEvent,
  FiringArcViolationEvent,
  LoSProcessorOptions,
  LoSContext,
  LoSFullResult,
  RangedAttackAction as LoSRangedAttackAction,
} from './tier3/los/los.types';
export {
  DEFAULT_ARC_FIRE_PENALTY,
  DEFAULT_FIRING_ARC_ANGLE,
  ARC_FIRE_TAG,
  WIDE_ARC_TAG,
  LOS_BLOCKING_TAG,
  LOS_TRANSPARENT_TAG,
  ENHANCED_LOS_TAG,
} from './tier3/los/los.types';

export { createAmmunitionProcessor, createAmmunitionProcessor as createAmmoProcessor } from './tier3/ammunition/ammunition.processor';
export type {
  AmmunitionProcessor,
  AmmoProcessor,
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
  AmmunitionEvent,
  AmmoBlockReason,
  CooldownBlockReason,
  ReloadBlockReason,
  AmmoConsumedEvent,
  AmmoDepletedEvent,
  ReloadStartedEvent,
  ReloadCompletedEvent,
  CooldownTriggeredEvent,
  CooldownReadyEvent,
  CooldownReducedEvent,
  AttackBlockedNoAmmoEvent,
  AbilityBlockedCooldownEvent,
  AmmunitionContext,
  AmmunitionFullResult,
  RangedAttackAction as AmmoRangedAttackAction,
  AbilityAction,
  AmmunitionRelevantAction,
} from './tier3/ammunition/ammunition.types';
export {
  DEFAULT_AMMO_COUNT,
  DEFAULT_COOLDOWN_DURATION,
  DEFAULT_RELOAD_AMOUNT,
  RANGED_TAG,
  MAGE_TAG,
  UNLIMITED_AMMO_TAG,
  QUICK_COOLDOWN_TAG,
  QUICK_RELOAD_TAG,
} from './tier3/ammunition/ammunition.types';

// ═══════════════════════════════════════════════════════════════
// TIER 4: COUNTER-MECHANICS
// ═══════════════════════════════════════════════════════════════

export { createContagionProcessor } from './tier4/contagion/contagion.processor';
export type {
  ContagionProcessor,
  ContagionType,
  ContagiousEffect,
  UnitWithContagion,
  SpreadEligibility,
  SpreadBlockReason,
  SpreadAttemptResult,
  UnitSpreadResult,
  SpreadPhaseResult,
  SpreadTargetsResult,
  EffectSpreadEvent,
  EffectSpreadFailedEvent,
  EffectSpreadBlockedEvent,
  ContagionPhaseStartedEvent,
  ContagionPhaseEndedEvent,
  ContagionEvent,
  ContagionProcessorOptions,
  ContagionContext,
  ContagionFullResult,
  InfectedUnitSummary,
  ContagionStateSummary,
  StatusEffect as ContagionStatusEffect,
} from './tier4/contagion/contagion.types';
export {
  CONTAGION_TYPES,
  CONTAGION_CONFIG_KEYS,
  ADJACENCY_DISTANCE,
  DEFAULT_FIRE_SPREAD,
  DEFAULT_POISON_SPREAD,
  DEFAULT_CURSE_SPREAD,
  DEFAULT_FROST_SPREAD,
  DEFAULT_PLAGUE_SPREAD,
  DEFAULT_PHALANX_SPREAD_BONUS,
} from './tier4/contagion/contagion.types';

export { createShredProcessor } from './tier4/armor-shred/armor-shred.processor';
export type {
  ArmorShredProcessor,
  UnitWithArmorShred,
  EffectiveArmorResult,
  ApplyShredResult,
  DecayShredResult,
  ArmorShredAppliedEvent,
  ArmorShredCappedEvent,
  ArmorShredDecayedEvent,
  ArmorShredEvent,
  ArmorShredProcessorOptions,
  ArmorShredContext,
  ShredStateSummary,
  BattleShredSummary,
} from './tier4/armor-shred/armor-shred.types';
export {
  DEFAULT_SHRED_PER_ATTACK,
  DEFAULT_MAX_SHRED_PERCENT,
  DEFAULT_DECAY_PER_TURN,
  MIN_EFFECTIVE_ARMOR,
} from './tier4/armor-shred/armor-shred.types';

// ═══════════════════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════

export { updateUnit, updateUnits, findUnit } from './helpers';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

export {
  // Unit factory functions
  createTestUnit,
  createUnitFromTemplate,
  // Battle state factory functions
  createTestBattleState,
  // Team setup factory functions
  createTeamSetup,
  createCustomTeamSetup,
  // Constants
  TEST_SEEDS,
  PLAYER_POSITIONS,
  ENEMY_POSITIONS,
  // Predefined scenarios
  BATTLE_SCENARIOS,
  MECHANICS_FIXTURES,
  EDGE_CASE_FIXTURES,
  // Helper functions
  getAllBattleScenarios,
  getAllEdgeCaseFixtures,
  createBattleStateFromScenario,
  generateRandomPositions,
  createRandomTeamSetup,
} from './test-fixtures';
