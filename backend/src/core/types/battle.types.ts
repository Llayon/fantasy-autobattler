/**
 * Battle-related type definitions for the core battle engine.
 * These types are game-agnostic and can be used across different projects.
 *
 * @module core/types/battle
 */

import { Position } from './grid.types';

/**
 * Team identifier for battle participants.
 */
export type TeamType = 'player' | 'bot';

/**
 * Battle outcome possibilities.
 */
export type BattleWinner = 'player' | 'bot' | 'draw';

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
 * Active unit instance in battle.
 * Generic interface that can be extended with game-specific fields.
 */
export interface BattleUnit {
  /** Unique unit type identifier */
  id: string;
  /** Display name */
  name: string;
  /** Unit role classification */
  role: string;
  /** Team budget cost */
  cost: number;
  /** Base statistics */
  stats: UnitStats;
  /** Attack range in cells */
  range: number;
  /** Available ability IDs */
  abilities: string[];
  /** Current position on battlefield */
  position: Position;
  /** Current hit points */
  currentHp: number;
  /** Maximum hit points */
  maxHp: number;
  /** Team affiliation */
  team: TeamType;
  /** Whether unit is alive and can act */
  alive: boolean;
  /** Unique instance identifier for battle */
  instanceId: string;
}

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
 *
 * @typeParam TEvent - Type of battle events (can be extended)
 */
export interface BattleResult<TEvent = unknown> {
  /** Chronological list of all battle events */
  events: TEvent[];
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

/**
 * Battle state during simulation.
 * Used by action execution and ability systems.
 * 
 * @typeParam TUnit - Type of battle units (can be extended with game-specific fields)
 */
export interface BattleState<TUnit = BattleUnit> {
  /** All units in battle */
  units: TUnit[];
  /** Current round number */
  round: number;
  /** Battle events log */
  events: unknown[];
}

// Note: TargetStrategy and TargetSelectionResult are defined in core/battle/targeting.ts
// to keep targeting logic self-contained with its own types
