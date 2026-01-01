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
 *
 * Resolve represents unit morale. When it reaches 0:
 * - Human units route (flee the battlefield)
 * - Undead units crumble (destroyed)
 */
export const DEFAULT_RESOLVE_CONFIG: ResolveConfig = {
  // Maximum morale value - full morale at battle start
  maxResolve: 100,

  // Morale regeneration per turn
  // Formula: newResolve = min(maxResolve, currentResolve + baseRegeneration)
  baseRegeneration: 5,

  // Faction-specific behavior when resolve = 0
  humanRetreat: true,
  undeadCrumble: true,

  // Resolve damage from flanking attacks
  // Applied in addition to HP damage when attacked from flank/rear
  flankingResolveDamage: 12,
  rearResolveDamage: 20,
};

/**
 * Default Engagement (Zone of Control) configuration.
 *
 * Engagement controls how units interact in close proximity.
 * Melee units project a Zone of Control to adjacent cells.
 */
export const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  // Enable Attack of Opportunity when enemies leave ZoC
  // AoO damage formula: max(1, floor((ATK - armor) * 0.5))
  attackOfOpportunity: true,

  // Ranged units suffer accuracy penalty when engaged in melee
  archerPenalty: true,

  // Archer penalty formula: damageMultiplier = 1.0 - archerPenaltyPercent
  // 0.5 = 50% damage reduction when engaged
  archerPenaltyPercent: 0.5,
};

/**
 * Default Riposte (Counter-attack) configuration.
 *
 * Riposte allows defenders to counter-attack when hit from the front.
 * Requires flanking mechanic to determine attack arc.
 */
export const DEFAULT_RIPOSTE_CONFIG: RiposteConfig = {
  // Use Initiative stat to determine riposte chance
  initiativeBased: true,

  // Number of riposte charges per round
  // 'attackCount' means unit can riposte as many times as it can attack
  chargesPerRound: 'attackCount',

  // Base riposte chance when Initiative is equal
  // Formula: chance = baseChance + (initDiff / guaranteedThreshold) * 0.5
  baseChance: 0.5,

  // Initiative difference for guaranteed riposte (100% chance)
  // If defender.initiative - attacker.initiative >= 10, always riposte
  guaranteedThreshold: 10,
};

/**
 * Default Intercept configuration.
 *
 * Intercept allows units to block or engage passing enemies.
 * Requires engagement mechanic.
 */
export const DEFAULT_INTERCEPT_CONFIG: InterceptConfig = {
  // Hard Intercept: Spearmen completely stop cavalry charges
  hardIntercept: true,

  // Soft Intercept: Infantry engages passing units (triggers ZoC)
  softIntercept: true,

  // Movement cost to disengage from ZoC
  // Unit must spend this many movement points to leave engagement
  disengageCost: 2,
};

/**
 * Default Charge (Cavalry momentum) configuration.
 *
 * Charge provides damage bonus based on distance moved before attack.
 * Requires intercept mechanic.
 */
export const DEFAULT_CHARGE_CONFIG: ChargeConfig = {
  // Damage bonus per cell moved
  // Formula: momentumBonus = min(maxMomentum, distance * momentumPerCell)
  // 0.2 = +20% damage per cell moved
  momentumPerCell: 0.2,

  // Maximum momentum bonus cap
  // 1.0 = +100% damage maximum (at 5 cells with default momentumPerCell)
  maxMomentum: 1.0,

  // Resolve damage on charge impact (in addition to HP damage)
  shockResolveDamage: 10,

  // Minimum cells moved to qualify for charge bonus
  minChargeDistance: 3,
};

/**
 * Default Phalanx (Formation) configuration.
 *
 * Phalanx provides bonuses for units in tight formation.
 * Requires facing mechanic.
 */
export const DEFAULT_PHALANX_CONFIG: PhalanxConfig = {
  // Maximum armor bonus from formation
  // Formula: armorBonus = min(maxArmorBonus, adjacentAllies * armorPerAlly)
  maxArmorBonus: 5,

  // Maximum resolve bonus from formation
  // Formula: resolveBonus = min(maxResolveBonus, adjacentAllies * resolvePerAlly)
  maxResolveBonus: 25,

  // Bonus per adjacent ally facing same direction
  armorPerAlly: 1,
  resolvePerAlly: 5,
};

/**
 * Default Line of Sight configuration.
 *
 * Line of Sight controls ranged attack validity.
 * Requires facing mechanic.
 */
export const DEFAULT_LOS_CONFIG: LoSConfig = {
  // Direct fire: blocked by units in the path
  directFire: true,

  // Arc fire: ignores obstacles but has accuracy penalty
  arcFire: true,

  // Arc fire accuracy penalty
  // Formula: hitChance = baseHitChance * (1 - arcFirePenalty)
  // 0.2 = 20% accuracy reduction for arc fire
  arcFirePenalty: 0.2,
};

/**
 * Default Ammunition & Cooldown configuration.
 *
 * Ammunition limits ranged attacks, cooldowns limit mage abilities.
 */
export const DEFAULT_AMMO_CONFIG: AmmoConfig = {
  // Enable ammunition tracking for ranged units
  enabled: true,

  // Use cooldowns for mages instead of ammo
  mageCooldowns: true,

  // Default ammo count for ranged units
  defaultAmmo: 6,

  // Default cooldown turns for mage abilities
  defaultCooldown: 3,
};

/**
 * Default Contagion (Effect spreading) configuration.
 *
 * Contagion allows status effects to spread to adjacent units.
 * Counters phalanx (dense formations = high spread risk).
 */
export const DEFAULT_CONTAGION_CONFIG: ContagionConfig = {
  // Spread chance per effect type (checked at turn end)
  // Formula: spreadChance = baseSpread + (inPhalanx ? phalanxSpreadBonus : 0)
  fireSpread: 0.5,     // 50% base spread chance
  poisonSpread: 0.3,   // 30% base spread chance
  curseSpread: 0.25,   // 25% base spread chance
  frostSpread: 0.2,    // 20% base spread chance
  plagueSpread: 0.6,   // 60% base spread chance (most contagious)

  // Additional spread chance when target is in phalanx formation
  // Represents increased risk of disease in tight formations
  phalanxSpreadBonus: 0.15,
};

/**
 * Default Armor Shred configuration.
 *
 * Armor shred reduces target's effective armor over time.
 */
export const DEFAULT_SHRED_CONFIG: ShredConfig = {
  // Armor shred per physical attack
  // Formula: newShred = min(maxShred, currentShred + shredPerAttack)
  shredPerAttack: 1,

  // Maximum armor reduction as percentage of base armor
  // Formula: maxShred = floor(baseArmor * maxShredPercent)
  // 0.4 = can reduce armor by up to 40%
  maxShredPercent: 0.4,

  // Shred decay per turn (0 = permanent until battle ends)
  decayPerTurn: 0,
};
