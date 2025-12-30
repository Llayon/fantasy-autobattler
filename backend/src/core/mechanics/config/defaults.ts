/**
 * Core Mechanics 2.0 - Default Configurations
 *
 * Default values for all mechanic configurations.
 * These are used when a mechanic is enabled with `true` instead of a config object.
 *
 * @module core/mechanics/config
 */

import type {
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
} from './mechanics.types';

/**
 * Default Resolve (Morale) configuration.
 */
export const DEFAULT_RESOLVE_CONFIG: ResolveConfig = {
  maxResolve: 100,
  baseRegeneration: 5,
  humanRetreat: true,
  undeadCrumble: true,
  flankingResolveDamage: 12,
  rearResolveDamage: 20,
};

/**
 * Default Engagement (Zone of Control) configuration.
 */
export const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  attackOfOpportunity: true,
  archerPenalty: true,
  archerPenaltyPercent: 0.5,
};

/**
 * Default Riposte (Counter-attack) configuration.
 */
export const DEFAULT_RIPOSTE_CONFIG: RiposteConfig = {
  initiativeBased: true,
  chargesPerRound: 'attackCount',
  baseChance: 0.5,
  guaranteedThreshold: 10,
};

/**
 * Default Intercept configuration.
 */
export const DEFAULT_INTERCEPT_CONFIG: InterceptConfig = {
  hardIntercept: true,
  softIntercept: true,
  disengageCost: 2,
};

/**
 * Default Charge (Cavalry momentum) configuration.
 */
export const DEFAULT_CHARGE_CONFIG: ChargeConfig = {
  momentumPerCell: 0.2,
  maxMomentum: 1.0,
  shockResolveDamage: 10,
  minChargeDistance: 3,
};

/**
 * Default Phalanx (Formation) configuration.
 */
export const DEFAULT_PHALANX_CONFIG: PhalanxConfig = {
  maxArmorBonus: 5,
  maxResolveBonus: 25,
  armorPerAlly: 1,
  resolvePerAlly: 5,
};

/**
 * Default Line of Sight configuration.
 */
export const DEFAULT_LOS_CONFIG: LoSConfig = {
  directFire: true,
  arcFire: true,
  arcFirePenalty: 0.2,
};

/**
 * Default Ammunition & Cooldown configuration.
 */
export const DEFAULT_AMMO_CONFIG: AmmoConfig = {
  enabled: true,
  mageCooldowns: true,
  defaultAmmo: 6,
  defaultCooldown: 3,
};

/**
 * Default Contagion (Effect spreading) configuration.
 */
export const DEFAULT_CONTAGION_CONFIG: ContagionConfig = {
  fireSpread: 0.5,
  poisonSpread: 0.3,
  curseSpread: 0.25,
  frostSpread: 0.2,
  plagueSpread: 0.6,
  phalanxSpreadBonus: 0.15,
};

/**
 * Default Armor Shred configuration.
 */
export const DEFAULT_SHRED_CONFIG: ShredConfig = {
  shredPerAttack: 1,
  maxShredPercent: 0.4,
  decayPerTurn: 0,
};
