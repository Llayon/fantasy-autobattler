/**
 * Run System Types
 * 
 * @module core/progression/run/types
 */

/**
 * Run phase types.
 */
export type RunPhase = 'draft' | 'battle' | 'shop' | 'event' | 'boss' | 'rest';

/**
 * Run status.
 */
export type RunStatus = 'active' | 'won' | 'lost';

/**
 * Configuration for run behavior.
 */
export interface RunConfig {
  /** Wins needed to complete run */
  winsToComplete: number;
  
  /** Losses allowed before run ends */
  maxLosses: number;
  
  /** Run phases */
  phases: RunPhase[];
  
  /** Enable streak tracking */
  trackStreaks: boolean;
  
  /** Enable rating system */
  enableRating: boolean;
}

/**
 * Run event for history tracking.
 */
export interface RunEvent {
  /** Event type */
  type: 'win' | 'loss' | 'phase_change' | 'draft' | 'shop';
  
  /** Event timestamp */
  timestamp: number;
  
  /** Optional event data */
  data?: unknown;
}

/**
 * Run state containing progress and history.
 */
export interface Run<TState> {
  /** Unique run identifier */
  id: string;
  
  /** Run configuration */
  config: RunConfig;
  
  /** Current wins */
  wins: number;
  
  /** Current losses */
  losses: number;
  
  /** Current phase index */
  currentPhaseIndex: number;
  
  /** Current win streak */
  winStreak: number;
  
  /** Current lose streak */
  loseStreak: number;
  
  /** Run status */
  status: RunStatus;
  
  /** Game-specific state */
  state: TState;
  
  /** Event history */
  history: RunEvent[];
}

/**
 * Run statistics.
 */
export interface RunStats {
  /** Total wins */
  wins: number;
  
  /** Total losses */
  losses: number;
  
  /** Win rate (0-1) */
  winRate: number;
  
  /** Longest win streak */
  longestWinStreak: number;
}
