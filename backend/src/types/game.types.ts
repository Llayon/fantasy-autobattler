/**
 * Core type definitions for Fantasy Autobattler game.
 * Contains all interfaces and types used throughout the application.
 *
 * @fileoverview Centralized type definitions for game entities,
 * battle system, units, and gameplay mechanics.
 *
 * Re-exports core types from core/types for backward compatibility.
 */

import { UNIT_ROLES } from '../config/game.constants';

// =============================================================================
// RE-EXPORTS FROM CORE TYPES (for backward compatibility)
// =============================================================================

// Grid types
export type {
  Position,
  CellType,
  GridCell,
  Grid,
  PathNode,
  PathfindingResult,
} from '../core/types/grid.types';

// Battle types
export type {
  TeamType,
  BattleWinner,
  UnitStats,
  FinalUnitState,
  BattleState,
} from '../core/types/battle.types';

// Targeting types (from core/battle module)
export type { TargetStrategy, TargetSelectionResult } from '../core/battle/targeting';

// Event types
export type {
  BattleEventType,
  BattleEvent,
  MoveEvent,
  AttackEvent,
  AbilityEvent,
  EffectResult,
} from '../core/types/event.types';

// Import types for use in this file
import type { Position } from '../core/types/grid.types';
import type {
  TeamType,
  BattleWinner,
  UnitStats,
  FinalUnitState,
} from '../core/types/battle.types';
import type { BattleEvent } from '../core/types/event.types';

// =============================================================================
// GAME-SPECIFIC TYPES
// =============================================================================

/**
 * Unit role enumeration derived from constants.
 * Determines unit behavior, stats distribution, and team composition.
 */
export type UnitRole = (typeof UNIT_ROLES)[keyof typeof UNIT_ROLES];

// =============================================================================
// UNIT SYSTEM TYPES
// =============================================================================

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
// ABILITY SYSTEM TYPES (simplified, full types in ability.types.ts)
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
export type AbilityEffectType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'summon'
  | 'teleport'
  | 'stun';

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
// BATTLE RESULT TYPES
// =============================================================================

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
