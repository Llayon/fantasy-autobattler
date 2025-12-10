/**
 * Game constants and configuration values for Fantasy Autobattler.
 * All magic numbers from the Game Design Document are centralized here.
 * 
 * @fileoverview Contains all game balance parameters, grid dimensions,
 * unit costs, stat ranges, and other configurable values.
 */

// =============================================================================
// GRID & BATTLEFIELD CONSTANTS
// =============================================================================

/**
 * Battlefield grid dimensions (8×10 cells).
 */
export const GRID_DIMENSIONS = {
  /** Grid width in cells */
  WIDTH: 8,
  /** Grid height in cells */
  HEIGHT: 10,
} as const;

/**
 * Player and enemy deployment zones.
 */
export const DEPLOYMENT_ZONES = {
  /** Player unit rows (0-1) */
  PLAYER_ROWS: [0, 1] as const,
  /** Enemy unit rows (8-9) */
  ENEMY_ROWS: [8, 9] as const,
  /** Neutral battlefield rows (2-7) */
  NEUTRAL_ROWS: [2, 3, 4, 5, 6, 7] as const,
} as const;

// =============================================================================
// TEAM BUILDING CONSTANTS
// =============================================================================

/**
 * Team composition limits and budget.
 */
export const TEAM_LIMITS = {
  /** Maximum team budget in points */
  BUDGET: 30,
  /** Minimum unit cost in points */
  MIN_UNIT_COST: 3,
  /** Maximum unit cost in points */
  MAX_UNIT_COST: 8,
  /** Maximum units per team (limited by budget only) */
  MAX_UNITS: 10, // Theoretical max with all 3-cost units
} as const;

// =============================================================================
// BATTLE SYSTEM CONSTANTS
// =============================================================================

/**
 * Battle simulation parameters.
 */
export const BATTLE_LIMITS = {
  /** Maximum battle rounds before draw */
  MAX_ROUNDS: 100,
  /** Minimum damage dealt (after armor reduction) */
  MIN_DAMAGE: 1,
  /** Battle simulation timeout in milliseconds */
  SIMULATION_TIMEOUT_MS: 5000,
} as const;

/**
 * Combat calculation constants.
 */
export const COMBAT_CONSTANTS = {
  /** Base dodge chance percentage */
  BASE_DODGE_CHANCE: 0,
  /** Maximum dodge chance percentage */
  MAX_DODGE_CHANCE: 50,
  /** Dodge only applies to physical attacks */
  DODGE_AFFECTS_MAGIC: false,
} as const;

// =============================================================================
// UNIT STAT RANGES
// =============================================================================

/**
 * Valid ranges for unit statistics.
 * Used for validation and balance calculations.
 */
export const UNIT_STAT_RANGES = {
  /** Health points range */
  HP: { MIN: 40, MAX: 150 },
  /** Attack damage range */
  ATK: { MIN: 8, MAX: 30 },
  /** Attack count range */
  ATK_COUNT: { MIN: 1, MAX: 3 },
  /** Armor (damage reduction) range */
  ARMOR: { MIN: 0, MAX: 12 },
  /** Movement speed (cells per turn) range */
  SPEED: { MIN: 1, MAX: 5 },
  /** Initiative (turn order) range */
  INITIATIVE: { MIN: 3, MAX: 10 },
  /** Dodge chance percentage range */
  DODGE: { MIN: 0, MAX: 25 },
  /** Attack range (cells) range */
  RANGE: { MIN: 1, MAX: 5 },
} as const;

// =============================================================================
// UNIT ROLES & DISTRIBUTION
// =============================================================================

/**
 * Unit role definitions and expected distribution.
 */
export const UNIT_ROLES = {
  TANK: 'tank',
  MELEE_DPS: 'melee_dps',
  RANGED_DPS: 'ranged_dps',
  MAGE: 'mage',
  SUPPORT: 'support',
  CONTROL: 'control',
} as const;

/**
 * Expected unit count per role (total 15 units).
 */
export const ROLE_DISTRIBUTION = {
  [UNIT_ROLES.TANK]: 3,
  [UNIT_ROLES.MELEE_DPS]: 3,
  [UNIT_ROLES.RANGED_DPS]: 3,
  [UNIT_ROLES.MAGE]: 3,
  [UNIT_ROLES.SUPPORT]: 2,
  [UNIT_ROLES.CONTROL]: 1,
} as const;

// =============================================================================
// ABILITY SYSTEM CONSTANTS
// =============================================================================

/**
 * Ability system parameters.
 */
export const ABILITY_CONSTANTS = {
  /** Maximum ability cooldown in turns */
  MAX_COOLDOWN: 5,
  /** Maximum ability range in cells */
  MAX_RANGE: 5,
  /** Maximum area of effect radius */
  MAX_AOE_RADIUS: 2,
  /** Default ability duration in turns */
  DEFAULT_DURATION: 3,
} as const;

/**
 * Ability effect value ranges.
 */
export const ABILITY_EFFECT_RANGES = {
  /** Damage ability value range */
  DAMAGE: { MIN: 15, MAX: 50 },
  /** Heal ability value range */
  HEAL: { MIN: 20, MAX: 40 },
  /** Buff/debuff percentage range */
  BUFF_PERCENT: { MIN: 10, MAX: 50 },
  /** Stun duration range in turns */
  STUN_DURATION: { MIN: 1, MAX: 2 },
} as const;

// =============================================================================
// PATHFINDING CONSTANTS
// =============================================================================

/**
 * A* pathfinding algorithm parameters.
 */
export const PATHFINDING_CONSTANTS = {
  /** Maximum pathfinding iterations to prevent infinite loops */
  MAX_ITERATIONS: 1000,
  /** Movement cost for adjacent cells */
  MOVEMENT_COST: 1,
  /** Diagonal movement multiplier (not used in Manhattan distance) */
  DIAGONAL_COST: 1.4,
} as const;

// =============================================================================
// BALANCE CALCULATION CONSTANTS
// =============================================================================

/**
 * Unit cost calculation weights.
 * Used in the unit cost formula from GDD.
 */
export const COST_CALCULATION_WEIGHTS = {
  /** HP contribution to cost (HP / 20) */
  HP_DIVISOR: 20,
  /** Attack contribution to cost (ATK * ATK_COUNT / 10) */
  ATK_DIVISOR: 10,
  /** Armor contribution to cost (ARMOR / 2) */
  ARMOR_DIVISOR: 2,
  /** Mobility contribution to cost ((SPEED + INITIATIVE) / 4) */
  MOBILITY_DIVISOR: 4,
  /** Dodge contribution to cost (DODGE / 5) */
  DODGE_DIVISOR: 5,
  /** Range bonus multiplier for ranged units */
  RANGE_MULTIPLIER: 0.5,
  /** Final cost normalization coefficient */
  NORMALIZATION_COEFFICIENT: 0.8,
} as const;

// =============================================================================
// PERFORMANCE CONSTANTS
// =============================================================================

/**
 * Performance and optimization parameters.
 */
export const PERFORMANCE_CONSTANTS = {
  /** Target battle simulation time in milliseconds */
  TARGET_SIMULATION_TIME_MS: 100,
  /** Maximum events per battle for replay */
  MAX_BATTLE_EVENTS: 1000,
  /** Database query timeout in milliseconds */
  DB_QUERY_TIMEOUT_MS: 5000,
} as const;

// =============================================================================
// MATCHMAKING CONSTANTS
// =============================================================================

/**
 * Matchmaking system parameters.
 */
export const MATCHMAKING_CONSTANTS = {
  /** Default ELO rating for new players */
  DEFAULT_ELO: 1200,
  /** Minimum ELO rating */
  MIN_ELO: 800,
  /** Maximum ELO rating */
  MAX_ELO: 2400,
  /** ELO K-factor for rating changes */
  ELO_K_FACTOR: 32,
  /** Maximum matchmaking queue wait time in seconds */
  MAX_QUEUE_TIME_SECONDS: 60,
} as const;

// =============================================================================
// GAMEPLAY VALUES
// =============================================================================

/**
 * Specific gameplay values used throughout the application.
 */
export const GAMEPLAY_VALUES = {
  /** Standard heal amount for support abilities */
  HEAL_AMOUNT: 15,
  /** MVP team size (will expand in future phases) */
  MVP_TEAM_SIZE: 3,
  /** Default number of battles to show in history */
  BATTLE_HISTORY_LIMIT: 10,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Unit role type derived from constants.
 */
export type UnitRole = typeof UNIT_ROLES[keyof typeof UNIT_ROLES];

/**
 * Ability type enumeration.
 */
export const ABILITY_TYPES = {
  ACTIVE: 'active',
  PASSIVE: 'passive',
} as const;

export type AbilityType = typeof ABILITY_TYPES[keyof typeof ABILITY_TYPES];

/**
 * Ability target type enumeration.
 */
export const ABILITY_TARGET_TYPES = {
  SELF: 'self',
  ALLY: 'ally',
  ENEMY: 'enemy',
  AREA: 'area',
} as const;

export type AbilityTargetType = typeof ABILITY_TARGET_TYPES[keyof typeof ABILITY_TARGET_TYPES];

/**
 * Ability effect type enumeration.
 */
export const ABILITY_EFFECT_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  SUMMON: 'summon',
  TELEPORT: 'teleport',
  STUN: 'stun',
} as const;

export type AbilityEffectType = typeof ABILITY_EFFECT_TYPES[keyof typeof ABILITY_EFFECT_TYPES];