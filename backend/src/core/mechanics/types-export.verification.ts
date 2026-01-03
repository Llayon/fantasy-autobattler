/**
 * Type Export Verification
 *
 * This file verifies that all types from the mechanics module are properly exported.
 * If this file compiles without errors, all types are correctly exported.
 *
 * @module core/mechanics
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════

import type {
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
} from './index';

// ═══════════════════════════════════════════════════════════════
// PROCESSOR TYPES
// ═══════════════════════════════════════════════════════════════

import type {
  MechanicsProcessor,
  MechanicProcessorMap,
  MechanicProcessor,
  BattlePhase,
  PhaseContext,
  BattleAction,
  BattleActionType,
} from './index';

// ═══════════════════════════════════════════════════════════════
// TIER 0: FACING TYPES
// ═══════════════════════════════════════════════════════════════

import type { FacingProcessor, FacingDirection, AttackArc } from './index';

// ═══════════════════════════════════════════════════════════════
// TIER 1: CORE COMBAT TYPES
// ═══════════════════════════════════════════════════════════════

import type { ResolveProcessor, MechanicsResolveState } from './index';
import type { EngagementProcessor } from './index';
import type { FlankingProcessor } from './index';

// ═══════════════════════════════════════════════════════════════
// TIER 2: ADVANCED TYPES
// ═══════════════════════════════════════════════════════════════

import type { RiposteProcessor } from './index';
import type { InterceptProcessor, InterceptType } from './index';
import type { AuraProcessor, Aura, AuraType } from './index';

// ═══════════════════════════════════════════════════════════════
// TIER 3: SPECIALIZED TYPES
// ═══════════════════════════════════════════════════════════════

import type { ChargeProcessor } from './index';
import type { OverwatchProcessor } from './index';
import type { PhalanxProcessor } from './index';
import type { LoSProcessor, FireMode } from './index';
import type { AmmoProcessor } from './index';

// ═══════════════════════════════════════════════════════════════
// TIER 4: COUNTER-MECHANICS TYPES
// ═══════════════════════════════════════════════════════════════

import type { ContagionProcessor, ContagionType } from './index';
import type { ArmorShredProcessor } from './index';

// ═══════════════════════════════════════════════════════════════
// VALIDATION TYPES
// ═══════════════════════════════════════════════════════════════

import type { ValidationResult } from './index';

// ═══════════════════════════════════════════════════════════════
// TYPE USAGE VERIFICATION
// ═══════════════════════════════════════════════════════════════

// Verify config types are usable
const _verifyMechanicsConfig: MechanicsConfig = {
  facing: true,
  resolve: false,
  engagement: false,
  flanking: false,
  riposte: false,
  intercept: false,
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};

const _verifyResolveConfig: ResolveConfig = {
  maxResolve: 100,
  baseRegeneration: 5,
  humanRetreat: true,
  undeadCrumble: true,
  flankingResolveDamage: 12,
  rearResolveDamage: 20,
};

const _verifyEngagementConfig: EngagementConfig = {
  attackOfOpportunity: true,
  archerPenalty: true,
  archerPenaltyPercent: 0.5,
};

const _verifyRiposteConfig: RiposteConfig = {
  initiativeBased: true,
  chargesPerRound: 'attackCount',
  baseChance: 0.5,
  guaranteedThreshold: 10,
};

const _verifyInterceptConfig: InterceptConfig = {
  hardIntercept: true,
  softIntercept: true,
  disengageCost: 2,
};

const _verifyChargeConfig: ChargeConfig = {
  momentumPerCell: 0.2,
  maxMomentum: 1.0,
  shockResolveDamage: 10,
  minChargeDistance: 3,
};

const _verifyPhalanxConfig: PhalanxConfig = {
  maxArmorBonus: 5,
  maxResolveBonus: 25,
  armorPerAlly: 1,
  resolvePerAlly: 5,
};

const _verifyLoSConfig: LoSConfig = {
  directFire: true,
  arcFire: true,
  arcFirePenalty: 0.2,
};

const _verifyAmmoConfig: AmmoConfig = {
  enabled: true,
  mageCooldowns: true,
  defaultAmmo: 6,
  defaultCooldown: 3,
};

const _verifyContagionConfig: ContagionConfig = {
  fireSpread: 0.5,
  poisonSpread: 0.3,
  curseSpread: 0.25,
  frostSpread: 0.2,
  plagueSpread: 0.6,
  phalanxSpreadBonus: 0.15,
};

const _verifyShredConfig: ShredConfig = {
  shredPerAttack: 1,
  maxShredPercent: 0.4,
  decayPerTurn: 0,
};

// Verify enum/union types
const _verifyBattlePhase: BattlePhase = 'turn_start';
const _verifyFacingDirection: FacingDirection = 'N';
const _verifyAttackArc: AttackArc = 'front';
const _verifyInterceptType: InterceptType = 'hard';
const _verifyAuraType: AuraType = 'static';
const _verifyFireMode: FireMode = 'direct';
const _verifyContagionType: ContagionType = 'fire';
const _verifyResolveState: MechanicsResolveState = 'active';
const _verifyBattleActionType: BattleActionType = 'attack';

// Verify BattleAction interface
const _verifyBattleAction: BattleAction = {
  type: 'attack',
  targetId: 'unit-1',
};

// Verify Aura interface
const _verifyAura: Aura = {
  id: 'test',
  name: 'Test Aura',
  type: 'static',
  target: 'allies',
  range: 2,
  effect: {
    type: 'buff_stat',
    stat: 'atk',
    value: 10,
    isPercentage: false,
  },
  stackable: false,
};

// Verify ValidationResult interface
const _verifyValidationResult: ValidationResult = {
  valid: true,
  errors: [],
  warnings: [],
};

// Verify processor types are defined by using them in a function signature
// This ensures the types are correctly exported and usable
function _verifyProcessorTypes(
  _facing: FacingProcessor,
  _resolve: ResolveProcessor,
  _engagement: EngagementProcessor,
  _flanking: FlankingProcessor,
  _riposte: RiposteProcessor,
  _intercept: InterceptProcessor,
  _aura: AuraProcessor,
  _charge: ChargeProcessor,
  _overwatch: OverwatchProcessor,
  _phalanx: PhalanxProcessor,
  _los: LoSProcessor,
  _ammo: AmmoProcessor,
  _contagion: ContagionProcessor,
  _armorShred: ArmorShredProcessor,
  _mechanics: MechanicsProcessor,
  _processorMap: MechanicProcessorMap,
  _processor: MechanicProcessor,
  _context: PhaseContext,
): void {
  // This function is never called, it just verifies types compile
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY FUNCTION EXPORTS VERIFICATION
// ═══════════════════════════════════════════════════════════════

import {
  // Processor factory
  createMechanicsProcessor,
  applyMechanics,
  buildProcessors,
  PHASE_MECHANICS,
  // Default configs
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
  // Presets
  MVP_PRESET,
  ROGUELIKE_PRESET,
  TACTICAL_PRESET,
  // Dependency resolution
  MECHANIC_DEPENDENCIES,
  resolveDependencies,
  getDefaultConfig,
  // Validation
  validateMechanicsConfig,
  // Tier 0 processors
  createFacingProcessor,
  // Tier 1 processors
  createResolveProcessor,
  createEngagementProcessor,
  createFlankingProcessor,
  // Tier 2 processors
  createRiposteProcessor,
  createInterceptProcessor,
  createAuraProcessor,
  // Tier 3 processors
  createChargeProcessor,
  createOverwatchProcessor,
  createPhalanxProcessor,
  createLoSProcessor,
  createAmmoProcessor,
  // Tier 4 processors
  createContagionProcessor,
  createShredProcessor,
  // Helpers
  updateUnit,
  updateUnits,
  findUnit,
} from './index';

// Verify processor factory functions are callable (type check only)
function _verifyProcessorFactoryExports(): void {
  // Main processor factory
  const _processor = createMechanicsProcessor(MVP_PRESET);
  void _processor;

  // Verify buildProcessors and applyMechanics are exported
  const _processors = buildProcessors(MVP_PRESET);
  void _processors;
  void applyMechanics;

  // Verify PHASE_MECHANICS constant
  const _phases = PHASE_MECHANICS.turn_start;
  void _phases;

  // Verify default configs are exported
  void DEFAULT_RESOLVE_CONFIG;
  void DEFAULT_ENGAGEMENT_CONFIG;
  void DEFAULT_RIPOSTE_CONFIG;
  void DEFAULT_INTERCEPT_CONFIG;
  void DEFAULT_CHARGE_CONFIG;
  void DEFAULT_PHALANX_CONFIG;
  void DEFAULT_LOS_CONFIG;
  void DEFAULT_AMMO_CONFIG;
  void DEFAULT_CONTAGION_CONFIG;
  void DEFAULT_SHRED_CONFIG;

  // Verify presets are exported
  void MVP_PRESET;
  void ROGUELIKE_PRESET;
  void TACTICAL_PRESET;

  // Verify dependency resolution exports
  void MECHANIC_DEPENDENCIES;
  void resolveDependencies;
  void getDefaultConfig;

  // Verify validation export
  void validateMechanicsConfig;

  // Verify individual processor factory functions are exported
  // (These will throw at runtime since they're placeholders, but types are verified)
  void createFacingProcessor;
  void createResolveProcessor;
  void createEngagementProcessor;
  void createFlankingProcessor;
  void createRiposteProcessor;
  void createInterceptProcessor;
  void createAuraProcessor;
  void createChargeProcessor;
  void createOverwatchProcessor;
  void createPhalanxProcessor;
  void createLoSProcessor;
  void createAmmoProcessor;
  void createContagionProcessor;
  void createShredProcessor;

  // Verify helper functions are exported
  void updateUnit;
  void updateUnits;
  void findUnit;
}

// Export to prevent unused variable warnings
export {
  _verifyMechanicsConfig,
  _verifyResolveConfig,
  _verifyEngagementConfig,
  _verifyRiposteConfig,
  _verifyInterceptConfig,
  _verifyChargeConfig,
  _verifyPhalanxConfig,
  _verifyLoSConfig,
  _verifyAmmoConfig,
  _verifyContagionConfig,
  _verifyShredConfig,
  _verifyBattlePhase,
  _verifyFacingDirection,
  _verifyAttackArc,
  _verifyInterceptType,
  _verifyAuraType,
  _verifyFireMode,
  _verifyContagionType,
  _verifyResolveState,
  _verifyBattleActionType,
  _verifyBattleAction,
  _verifyAura,
  _verifyValidationResult,
  _verifyProcessorTypes,
  _verifyProcessorFactoryExports,
};
