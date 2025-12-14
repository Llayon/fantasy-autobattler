/**
 * Core type definitions for Fantasy Autobattler game.
 * Contains all interfaces and types used throughout the application.
 * 
 * @fileoverview Centralized type definitions for game entities,
 * battle system, units, and gameplay mechanics.
 */

import { UNIT_ROLES } from '../config/game.constants';

// =============================================================================
// BASIC TYPES
// =============================================================================

/**
 * 2D position on the battlefield grid.
 * Uses zero-based indexing (0,0) to (7,9) for 8×10 grid.
 */
export interface Position {
  /** X coordinate (0-7) */
  x: number;
  /** Y coordinate (0-9) */
  y: number;
}

/**
 * Unit role enumeration derived from constants.
 * Determines unit behavior, stats distribution, and team composition.
 */
export type UnitRole = typeof UNIT_ROLES[keyof typeof UNIT_ROLES];

/**
 * Team identifier for battle participants.
 */
export type TeamType = 'player' | 'bot';

/**
 * Battle outcome possibilities.
 */
export type BattleWinner = 'player' | 'bot' | 'draw';

// =============================================================================
// UNIT SYSTEM TYPES
// =============================================================================

/**
 * Core unit statistics interface.
 * Contains all combat-relevant attributes for units.
 */
export interface UnitStats {
  /** Hit points - unit dies when reaching 0 */
  hp: number;
  /** Attack damage per hit */
  atk: number;
  /** Number of attacks per turn */
  atkCount: number;
  /** Armor - reduces incoming physical damage */
  armor: number;
  /** Movement speed - cells per turn */
  speed: number;
  /** Initiative - determines turn order (higher = first) */
  initiative: number;
  /** Dodge chance percentage (0-100) */
  dodge: number;
}

/**
 * Unit template definition from game data.
 * Immutable blueprint for creating unit instances.
 */
export interface UnitTemplate {
  /** Unique unit identifier */
  id: string;
  /** Display name */
  name: string;
  /** Unit role classification */
  role: UnitRole;
  /** Team budget cost (3-8 points) */
  cost: number;
  /** Base statistics */
  stats: UnitStats;
  /** Attack range in cells */
  range: number;
  /** Available ability IDs */
  abilities: string[];
}

/**
 * Active unit instance in battle.
 * Extends template with runtime state and positioning.
 */
export interface BattleUnit extends UnitTemplate {
  /** Current position on battlefield */
  position: Position;
  /** Current hit points (can be less than stats.hp) */
  currentHp: number;
  /** Maximum hit points (equals stats.hp) */
  maxHp: number;
  /** Team affiliation */
  team: TeamType;
  /** Whether unit is alive and can act */
  alive: boolean;
  /** Unique instance identifier for battle */
  instanceId: string;
}

// =============================================================================
// ABILITY SYSTEM TYPES
// =============================================================================

/**
 * Ability activation type.
 */
export type AbilityType = 'active' | 'passive';

/**
 * Ability targeting classification.
 */
export type AbilityTargetType = 'self' | 'ally' | 'enemy' | 'area';

/**
 * Ability effect classification.
 */
export type AbilityEffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'summon' | 'teleport' | 'stun';

/**
 * Ability effect definition.
 */
export interface AbilityEffect {
  /** Type of effect */
  type: AbilityEffectType;
  /** Numeric value (damage, heal amount, etc.) */
  value: number;
  /** Effect duration in turns (for buffs/debuffs) */
  duration?: number;
  /** Area of effect radius in cells */
  areaSize?: number;
}

/**
 * Complete ability definition.
 */
export interface Ability {
  /** Unique ability identifier */
  id: string;
  /** Display name */
  name: string;
  /** Activation type */
  type: AbilityType;
  /** Targeting type */
  targetType: AbilityTargetType;
  /** Cooldown in turns */
  cooldown: number;
  /** Range in cells */
  range: number;
  /** Ability effects */
  effect: AbilityEffect;
}

// =============================================================================
// BATTLE EVENT TYPES
// =============================================================================

/**
 * Battle event type classification.
 */
export type BattleEventType = 
  | 'move' 
  | 'attack' 
  | 'heal' 
  | 'ability' 
  | 'ability_used'
  | 'damage' 
  | 'death' 
  | 'buff' 
  | 'debuff'
  | 'status_applied'
  | 'status_tick'
  | 'status_removed'
  | 'round_start'
  | 'battle_end';

/**
 * Individual battle event record.
 * Represents a single action or state change during battle.
 */
export interface BattleEvent {
  /** Battle round number (1-based) */
  round: number;
  /** Event type classification */
  type: BattleEventType;
  /** ID of the acting unit */
  actorId: string;
  /** ID of the target unit (if applicable) */
  targetId?: string;
  /** Multiple target IDs (for AoE abilities) */
  targetIds?: string[];
  /** Damage dealt */
  damage?: number;
  /** Multiple damage values (for multi-target) */
  damages?: number[];
  /** Healing amount */
  healing?: number;
  /** Movement from position */
  fromPosition?: Position;
  /** Movement to position */
  toPosition?: Position;
  /** Ability used */
  abilityId?: string;
  /** Units killed by this event */
  killedUnits?: string[];
  /** Status effect applied/removed/ticked */
  statusEffect?: {
    type: string;
    duration?: number;
    value?: number;
  };
  /** Source of damage (attack, ability, status) */
  source?: 'attack' | 'ability' | 'status';
  /** Additional event metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// BATTLE RESULT TYPES
// =============================================================================

/**
 * Final unit state after battle completion.
 */
export interface FinalUnitState {
  /** Unit instance ID */
  instanceId: string;
  /** Final hit points */
  currentHp: number;
  /** Final position */
  position: Position;
  /** Survival status */
  alive: boolean;
}

/**
 * Complete battle simulation result.
 * Contains all information needed for replay and analysis.
 */
export interface BattleResult {
  /** Chronological list of all battle events */
  events: BattleEvent[];
  /** Battle outcome */
  winner: BattleWinner;
  /** Final state of all units */
  finalState: {
    /** Player team final states */
    playerUnits: FinalUnitState[];
    /** Bot team final states */
    botUnits: FinalUnitState[];
  };
  /** Battle metadata */
  metadata: {
    /** Total rounds fought */
    totalRounds: number;
    /** Battle duration in milliseconds */
    durationMs: number;
    /** Random seed used (for deterministic replay) */
    seed?: number;
  };
}

// =============================================================================
// TEAM COMPOSITION TYPES
// =============================================================================

/**
 * Team composition for battle.
 */
export interface TeamComposition {
  /** Array of unit templates */
  units: UnitTemplate[];
  /** Total team cost */
  totalCost: number;
  /** Team formation positions */
  formation: Position[];
}

/**
 * Team validation result.
 */
export interface TeamValidationResult {
  /** Whether team is valid */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Total team cost */
  totalCost: number;
  /** Budget remaining */
  budgetRemaining: number;
}

// =============================================================================
// GRID AND PATHFINDING TYPES
// =============================================================================

/**
 * Grid cell state.
 */
export type CellType = 'empty' | 'occupied' | 'blocked';

/**
 * Grid cell information.
 */
export interface GridCell {
  /** Cell position */
  position: Position;
  /** Cell state */
  type: CellType;
  /** Unit occupying this cell (if any) */
  unitId?: string;
}

/**
 * Pathfinding node for A* algorithm.
 */
export interface PathNode {
  /** Node position */
  position: Position;
  /** Cost from start */
  gCost: number;
  /** Heuristic cost to goal */
  hCost: number;
  /** Total cost (g + h) */
  fCost: number;
  /** Parent node for path reconstruction */
  parent?: PathNode;
}

/**
 * Pathfinding result.
 */
export interface PathfindingResult {
  /** Path as array of positions */
  path: Position[];
  /** Whether path was found */
  found: boolean;
  /** Path length in cells */
  length: number;
  /** Movement cost */
  cost: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic result wrapper for operations that can fail.
 */
export interface Result<T, E = string> {
  /** Whether operation succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: E;
}

/**
 * Pagination parameters.
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number;
  /** Items per page */
  limit: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  /** Response data */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page */
    page: number;
    /** Items per page */
    limit: number;
    /** Total items */
    total: number;
    /** Total pages */
    pages: number;
    /** Has next page */
    hasNext: boolean;
    /** Has previous page */
    hasPrev: boolean;
  };
}