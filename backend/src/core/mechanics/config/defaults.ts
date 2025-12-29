/**
 * Default configurations for all mechanics
 *
 * These defaults are used when a mechanic is enabled with `true`
 * instead of a custom configuration object.
 */

import {
  FacingConfig,
  ArmorShredConfig,
  ResolveConfig,
  EngagementConfig,
  FlankingConfig,
  RiposteConfig,
  InterceptConfig,
  AuraConfig,
  ChargeConfig,
  OverwatchConfig,
  PhalanxConfig,
  LineOfSightConfig,
  AmmunitionConfig,
  ContagionConfig,
} from './mechanics.types';

/**
 * Default Facing configuration (Tier 0)
 * Enables directional combat system
 */
export const DEFAULT_FACING_CONFIG: FacingConfig = {
  enabled: true,
};

/**
 * Default ArmorShred configuration (Tier 0)
 * Enables armor reduction mechanic
 */
export const DEFAULT_ARMOR_SHRED_CONFIG: ArmorShredConfig = {
  enabled: true,
  maxShred: 50,
  decayPerTurn: 5,
};

/**
 * Default Resolve configuration (Tier 1)
 * Enables morale system with faction-specific behavior
 */
export const DEFAULT_RESOLVE_CONFIG: ResolveConfig = {
  enabled: true,
  maxResolve: 100,
  recoveryPerTurn: 10,
  wavering: 50,
  routing: 0,
  humanRetreatChance: 0.3,
  undeadCrumbleChance: 0.5,
};

/**
 * Default Engagement configuration (Tier 1)
 * Enables zone of control and attack of opportunity
 */
export const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  enabled: true,
  zoneOfControlRange: 1,
  archerPenalty: 0.5,
};

/**
 * Default Flanking configuration (Tier 1)
 * Enables attack arc damage modifiers
 */
export const DEFAULT_FLANKING_CONFIG: FlankingConfig = {
  enabled: true,
  frontDamageModifier: 1.0,
  flankDamageModifier: 1.3,
  rearDamageModifier: 1.5,
  resolveDamageModifier: 0.25,
};

/**
 * Default Riposte configuration (Tier 2)
 * Enables counter-attack mechanic
 */
export const DEFAULT_RIPOSTE_CONFIG: RiposteConfig = {
  enabled: true,
  baseChance: 0.3,
  initiativeBonus: 0.01,
  chargeLimit: 3,
};

/**
 * Default Intercept configuration (Tier 2)
 * Enables movement blocking mechanic
 */
export const DEFAULT_INTERCEPT_CONFIG: InterceptConfig = {
  enabled: true,
  hardInterceptTypes: ['spearman', 'pikeman'],
  softInterceptTypes: ['infantry', 'knight'],
  disengageCost: 2,
};

/**
 * Default Aura configuration (Tier 2)
 * Enables territorial effects
 */
export const DEFAULT_AURA_CONFIG: AuraConfig = {
  enabled: true,
  maxRange: 3,
  stackingLimit: 3,
};

/**
 * Default Charge configuration (Tier 3)
 * Enables cavalry momentum mechanic
 */
export const DEFAULT_CHARGE_CONFIG: ChargeConfig = {
  enabled: true,
  momentumPerCell: 5,
  maxMomentum: 50,
  damageModifier: 0.5,
  spearWallCounterChance: 0.5,
};

/**
 * Default Overwatch configuration (Tier 3)
 * Enables reaction fire mechanic
 */
export const DEFAULT_OVERWATCH_CONFIG: OverwatchConfig = {
  enabled: true,
  ammoConsumption: 1,
  triggerRange: 5,
};

/**
 * Default Phalanx configuration (Tier 3)
 * Enables formation bonuses
 */
export const DEFAULT_PHALANX_CONFIG: PhalanxConfig = {
  enabled: true,
  minFormationSize: 3,
  armorBonus: 0.2,
  resolveBonus: 0.15,
};

/**
 * Default LineOfSight configuration (Tier 3)
 * Enables line of sight mechanics
 */
export const DEFAULT_LOS_CONFIG: LineOfSightConfig = {
  enabled: true,
  directFireBlocked: true,
  arcFirePenalty: 0.3,
};

/**
 * Default Ammunition configuration (Tier 3)
 * Enables ammo/cooldown tracking
 */
export const DEFAULT_AMMUNITION_CONFIG: AmmunitionConfig = {
  enabled: true,
  maxAmmo: 20,
  reloadPerTurn: 5,
};

/**
 * Default Contagion configuration (Tier 4)
 * Enables effect spreading mechanic
 */
export const DEFAULT_CONTAGION_CONFIG: ContagionConfig = {
  enabled: true,
  spreadChance: 0.3,
  phalanxBonusChance: 0.5,
  spreadRange: 1,
};

/**
 * Get default configuration for a specific mechanic
 *
 * @param mechanicName - Name of the mechanic
 * @returns Default configuration object
 * @throws Error if mechanic name is unknown
 *
 * @example
 * const config = getDefaultConfig('flanking');
 * // Returns DEFAULT_FLANKING_CONFIG
 */
export function getDefaultConfig(mechanicName: string): any {
  const defaults: Record<string, any> = {
    facing: DEFAULT_FACING_CONFIG,
    armorShred: DEFAULT_ARMOR_SHRED_CONFIG,
    resolve: DEFAULT_RESOLVE_CONFIG,
    engagement: DEFAULT_ENGAGEMENT_CONFIG,
    flanking: DEFAULT_FLANKING_CONFIG,
    riposte: DEFAULT_RIPOSTE_CONFIG,
    intercept: DEFAULT_INTERCEPT_CONFIG,
    aura: DEFAULT_AURA_CONFIG,
    charge: DEFAULT_CHARGE_CONFIG,
    overwatch: DEFAULT_OVERWATCH_CONFIG,
    phalanx: DEFAULT_PHALANX_CONFIG,
    lineOfSight: DEFAULT_LOS_CONFIG,
    ammunition: DEFAULT_AMMUNITION_CONFIG,
    contagion: DEFAULT_CONTAGION_CONFIG,
  };

  if (!(mechanicName in defaults)) {
    throw new Error(`Unknown mechanic: ${mechanicName}`);
  }

  return defaults[mechanicName];
}
