/**
 * Core Mechanics 2.0 - Configuration Types
 *
 * Defines all configuration interfaces for the modular mechanics system.
 * Each mechanic can be disabled (false), enabled with defaults (true),
 * or enabled with custom configuration (object).
 *
 * @module core/mechanics/config
 */

// ═══════════════════════════════════════════════════════════════
// TIER 1: RESOLVE (MORALE) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve (Morale) system configuration.
 * Controls unit morale, retreat, and crumble mechanics.
 */
export interface ResolveConfig {
  /** Maximum resolve value. Default: 100 */
  maxResolve: number;

  /** Resolve regeneration per turn. Default: 5 */
  baseRegeneration: number;

  /** Human units retreat when resolve = 0. Default: true */
  humanRetreat: boolean;

  /** Undead units crumble when resolve = 0. Default: true */
  undeadCrumble: boolean;

  /** Resolve damage from flanking attacks. Default: 12 */
  flankingResolveDamage: number;

  /** Resolve damage from rear attacks. Default: 20 */
  rearResolveDamage: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 1: ENGAGEMENT (ZONE OF CONTROL) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Engagement (Zone of Control) configuration.
 * Controls ZoC, attack of opportunity, and archer penalties.
 */
export interface EngagementConfig {
  /** Enable Attack of Opportunity. Default: true */
  attackOfOpportunity: boolean;

  /** Archers suffer penalty when engaged. Default: true */
  archerPenalty: boolean;

  /** Penalty percentage for engaged archers. Default: 0.5 (50%) */
  archerPenaltyPercent: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 2: RIPOSTE (COUNTER-ATTACK) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Riposte (Counter-attack) configuration.
 * Requires: flanking mechanic.
 */
export interface RiposteConfig {
  /** Use Initiative comparison for riposte chance. Default: true */
  initiativeBased: boolean;

  /** Riposte charges per round. 'attackCount' uses unit's attack count. */
  chargesPerRound: number | 'attackCount';

  /** Base riposte chance when Initiative equal. Default: 0.5 (50%) */
  baseChance: number;

  /** Initiative difference for guaranteed riposte. Default: 10 */
  guaranteedThreshold: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 2: INTERCEPT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Intercept configuration.
 * Requires: engagement mechanic.
 */
export interface InterceptConfig {
  /** Hard Intercept: Spearmen stop cavalry. Default: true */
  hardIntercept: boolean;

  /** Soft Intercept: Infantry engages passing units. Default: true */
  softIntercept: boolean;

  /** Movement cost to disengage. Default: 2 cells */
  disengageCost: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 3: CHARGE (CAVALRY MOMENTUM) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Charge (Cavalry momentum) configuration.
 * Requires: intercept mechanic.
 */
export interface ChargeConfig {
  /** Damage bonus per cell moved. Default: 0.2 (20%) */
  momentumPerCell: number;

  /** Maximum momentum bonus. Default: 1.0 (100%) */
  maxMomentum: number;

  /** Resolve damage on charge impact. Default: 10 */
  shockResolveDamage: number;

  /** Minimum cells for charge bonus. Default: 3 */
  minChargeDistance: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 3: PHALANX (FORMATION) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Phalanx (Formation) configuration.
 * Requires: facing mechanic.
 */
export interface PhalanxConfig {
  /** Maximum armor bonus from formation depth. Default: 5 */
  maxArmorBonus: number;

  /** Maximum resolve bonus from formation. Default: 25 */
  maxResolveBonus: number;

  /** Armor bonus per adjacent ally. Default: 1 */
  armorPerAlly: number;

  /** Resolve bonus per adjacent ally. Default: 5 */
  resolvePerAlly: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 3: LINE OF SIGHT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Line of Sight configuration.
 * Requires: facing mechanic.
 */
export interface LoSConfig {
  /** Enable direct fire (blocked by units). Default: true */
  directFire: boolean;

  /** Enable arc fire (ignores obstacles). Default: true */
  arcFire: boolean;

  /** Arc fire accuracy penalty. Default: 0.2 (20%) */
  arcFirePenalty: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 3: AMMUNITION & COOLDOWN CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Ammunition & Cooldown configuration.
 */
export interface AmmoConfig {
  /** Enable ammunition for ranged units. Default: true */
  enabled: boolean;

  /** Use cooldowns for mages instead of ammo. Default: true */
  mageCooldowns: boolean;

  /** Default ammo count for ranged. Default: 6 */
  defaultAmmo: number;

  /** Default cooldown for mage abilities. Default: 3 */
  defaultCooldown: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 4: CONTAGION (EFFECT SPREADING) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Contagion (Effect spreading) configuration.
 * Counters: phalanx (dense formations = high spread risk).
 */
export interface ContagionConfig {
  /** Fire spread chance to adjacent units. Default: 0.5 (50%) */
  fireSpread: number;

  /** Poison spread chance. Default: 0.3 (30%) */
  poisonSpread: number;

  /** Curse spread chance. Default: 0.25 (25%) */
  curseSpread: number;

  /** Frost spread chance. Default: 0.2 (20%) */
  frostSpread: number;

  /** Plague spread chance. Default: 0.6 (60%) */
  plagueSpread: number;

  /** Phalanx spread bonus. Default: 0.15 (+15%) */
  phalanxSpreadBonus: number;
}

// ═══════════════════════════════════════════════════════════════
// TIER 4: ARMOR SHRED CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Armor Shred configuration.
 */
export interface ShredConfig {
  /** Armor shred per physical attack. Default: 1 */
  shredPerAttack: number;

  /** Maximum armor reduction percentage. Default: 0.4 (40%) */
  maxShredPercent: number;

  /** Shred decay per turn. Default: 0 (no decay) */
  decayPerTurn: number;
}

// ═══════════════════════════════════════════════════════════════
// MAIN MECHANICS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Complete mechanics configuration.
 * Each mechanic can be:
 * - false: disabled
 * - true: enabled with defaults
 * - object: enabled with custom config
 *
 * @example
 * // Minimal config (dependencies auto-resolved)
 * const config: Partial<MechanicsConfig> = {
 *   riposte: true, // Auto-enables flanking → facing
 * };
 *
 * @example
 * // Full config with custom values
 * const config: MechanicsConfig = {
 *   facing: true,
 *   resolve: { maxResolve: 100, baseRegeneration: 5, ... },
 *   // ... other mechanics
 * };
 */
export interface MechanicsConfig {
  // Tier 0: Base
  /** Enable facing/direction system. Default: false */
  facing: boolean;

  // Tier 1: Core Combat
  /** Resolve (morale) system. Default: false */
  resolve: ResolveConfig | false;

  /** Engagement (Zone of Control) system. Default: false */
  engagement: EngagementConfig | false;

  /** Flanking damage modifiers. Requires: facing. Default: false */
  flanking: boolean;

  // Tier 2: Advanced
  /** Riposte (counter-attack) system. Requires: flanking. Default: false */
  riposte: RiposteConfig | false;

  /** Intercept system. Requires: engagement. Default: false */
  intercept: InterceptConfig | false;

  /** Aura effects system. Default: false */
  aura: boolean;

  // Tier 3: Specialized
  /** Charge (cavalry momentum) system. Requires: intercept. Default: false */
  charge: ChargeConfig | false;

  /** Overwatch (ranged reaction) system. Requires: intercept, ammunition. Default: false */
  overwatch: boolean;

  /** Phalanx (formation) system. Requires: facing. Default: false */
  phalanx: PhalanxConfig | false;

  /** Line of Sight system. Requires: facing. Default: false */
  lineOfSight: LoSConfig | false;

  /** Ammunition & cooldown system. Default: false */
  ammunition: AmmoConfig | false;

  // Tier 4: Counter-mechanics
  /** Contagion (effect spreading) system. Default: false */
  contagion: ContagionConfig | false;

  /** Armor shred system. Default: false */
  armorShred: ShredConfig | false;
}
