/**
 * Core Mechanics 2.0 - Type definitions
 *
 * Defines all configuration types for the modular mechanics system.
 * Each mechanic can be:
 * - false: disabled
 * - true: enabled with defaults
 * - object: enabled with custom configuration
 */

/**
 * Facing direction for units (N/S/E/W)
 */
export type FacingDirection = 'N' | 'S' | 'E' | 'W';

/**
 * Resolve state for units (morale system)
 */
export enum ResolveState {
  STEADY = 'steady',
  WAVERING = 'wavering',
  ROUTING = 'routing',
}

/**
 * Attack arc for flanking calculations
 */
export enum AttackArc {
  FRONT = 'front',
  FLANK = 'flank',
  REAR = 'rear',
}

/**
 * Aura type for territorial effects
 */
export enum AuraType {
  STATIC = 'static',
  PULSE = 'pulse',
}

/**
 * Intercept type for movement blocking
 */
export enum InterceptType {
  HARD = 'hard',
  SOFT = 'soft',
}

/**
 * Configuration for Facing mechanic (Tier 0)
 */
export interface FacingConfig {
  enabled?: boolean;
}

/**
 * Configuration for ArmorShred mechanic (Tier 0)
 */
export interface ArmorShredConfig {
  enabled?: boolean;
  shredPerHit?: number;
  maxShred?: number;
  decayPerTurn?: number;
  percentBased?: boolean;
}

/**
 * Configuration for Resolve mechanic (Tier 1)
 */
export interface ResolveConfig {
  enabled?: boolean;
  maxResolve?: number;
  recoveryPerTurn?: number;
  wavering?: number;
  routing?: number;
  humanRetreatChance?: number;
  undeadCrumbleChance?: number;
}

/**
 * Configuration for Engagement mechanic (Tier 1)
 */
export interface EngagementConfig {
  enabled?: boolean;
  zoneOfControlRange?: number;
  archerPenalty?: number;
}

/**
 * Configuration for Flanking mechanic (Tier 1)
 */
export interface FlankingConfig {
  enabled?: boolean;
  frontDamageModifier?: number;
  flankDamageModifier?: number;
  rearDamageModifier?: number;
  resolveDamageModifier?: number;
}

/**
 * Configuration for Riposte mechanic (Tier 2)
 */
export interface RiposteConfig {
  enabled?: boolean;
  baseChance?: number;
  initiativeBonus?: number;
  chargeLimit?: number;
}

/**
 * Configuration for Intercept mechanic (Tier 2)
 */
export interface InterceptConfig {
  enabled?: boolean;
  hardInterceptTypes?: string[];
  softInterceptTypes?: string[];
  disengageCost?: number;
}

/**
 * Configuration for Aura mechanic (Tier 2)
 */
export interface AuraConfig {
  enabled?: boolean;
  maxRange?: number;
  stackingLimit?: number;
}

/**
 * Configuration for Charge mechanic (Tier 3)
 */
export interface ChargeConfig {
  enabled?: boolean;
  momentumPerCell?: number;
  maxMomentum?: number;
  damageModifier?: number;
  spearWallCounterChance?: number;
}

/**
 * Configuration for Overwatch mechanic (Tier 3)
 */
export interface OverwatchConfig {
  enabled?: boolean;
  ammoConsumption?: number;
  triggerRange?: number;
}

/**
 * Configuration for Phalanx mechanic (Tier 3)
 */
export interface PhalanxConfig {
  enabled?: boolean;
  minFormationSize?: number;
  armorBonus?: number;
  resolveBonus?: number;
}

/**
 * Configuration for LineOfSight mechanic (Tier 3)
 */
export interface LineOfSightConfig {
  enabled?: boolean;
  directFireBlocked?: boolean;
  arcFirePenalty?: number;
}

/**
 * Configuration for Ammunition mechanic (Tier 3)
 */
export interface AmmunitionConfig {
  enabled?: boolean;
  maxAmmo?: number;
  reloadPerTurn?: number;
}

/**
 * Configuration for Contagion mechanic (Tier 4)
 */
export interface ContagionConfig {
  enabled?: boolean;
  spreadChance?: number;
  spreadChances?: Record<string, number>;
  phalanxSpreadBonus?: number;
  phalanxBonusChance?: number;
  spreadRange?: number;
  spreadToEnemies?: boolean;
  maxStacks?: number;
}

/**
 * Complete mechanics configuration
 *
 * Each mechanic can be:
 * - false: disabled
 * - true: enabled with defaults
 * - object: enabled with custom config
 */
export interface MechanicsConfig {
  // Tier 0
  facing?: boolean | FacingConfig;
  armorShred?: boolean | ArmorShredConfig;

  // Tier 1
  resolve?: boolean | ResolveConfig;
  engagement?: boolean | EngagementConfig;
  flanking?: boolean | FlankingConfig;

  // Tier 2
  riposte?: boolean | RiposteConfig;
  intercept?: boolean | InterceptConfig;
  aura?: boolean | AuraConfig;

  // Tier 3
  charge?: boolean | ChargeConfig;
  overwatch?: boolean | OverwatchConfig;
  phalanx?: boolean | PhalanxConfig;
  lineOfSight?: boolean | LineOfSightConfig;
  ammunition?: boolean | AmmunitionConfig;

  // Tier 4
  contagion?: boolean | ContagionConfig;
}

/**
 * Normalized mechanics configuration (all values are objects or false)
 */
export interface NormalizedMechanicsConfig {
  facing: FacingConfig | false;
  armorShred: ArmorShredConfig | false;
  resolve: ResolveConfig | false;
  engagement: EngagementConfig | false;
  flanking: FlankingConfig | false;
  riposte: RiposteConfig | false;
  intercept: InterceptConfig | false;
  aura: AuraConfig | false;
  charge: ChargeConfig | false;
  overwatch: OverwatchConfig | false;
  phalanx: PhalanxConfig | false;
  lineOfSight: LineOfSightConfig | false;
  ammunition: AmmunitionConfig | false;
  contagion: ContagionConfig | false;
}

/**
 * Mechanic dependency information
 */
export interface MechanicDependency {
  name: string;
  dependencies: string[];
  tier: number;
}

/**
 * Mechanic processor interface
 */
export interface MechanicProcessor {
  name: string;
  apply(state: any, config: any): any;
}
