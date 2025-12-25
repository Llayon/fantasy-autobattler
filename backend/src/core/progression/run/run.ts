/**
 * Run System Operations
 *
 * Pure functions for managing roguelike run progression with win/loss tracking,
 * phase cycling, and streak management.
 * All operations are immutable.
 *
 * @module core/progression/run
 */

import { Run, RunConfig, RunPhase, RunStatus, RunEvent, RunStats } from './run.types';

/**
 * Generates a unique ID for runs.
 * Uses timestamp + random suffix for uniqueness.
 *
 * @returns Unique run ID
 */
function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `run_${timestamp}_${random}`;
}

/**
 * Creates a new run with initial state.
 *
 * @param config - Run configuration
 * @param initialState - Game-specific initial state
 * @returns New run instance
 *
 * @example
 * const run = createRun(ROGUELIKE_RUN_CONFIG, { deck: myDeck });
 */
export function createRun<TState>(
  config: RunConfig,
  initialState: TState,
): Run<TState> {
  if (config.winsToComplete < 1) {
    throw new Error('winsToComplete must be at least 1');
  }
  if (config.maxLosses < 1) {
    throw new Error('maxLosses must be at least 1');
  }
  if (config.phases.length === 0) {
    throw new Error('phases must not be empty');
  }

  return {
    id: generateRunId(),
    config,
    wins: 0,
    losses: 0,
    currentPhaseIndex: 0,
    winStreak: 0,
    loseStreak: 0,
    status: 'active',
    state: initialState,
    history: [],
  };
}

/**
 * Records a win and updates streaks.
 * Sets status to 'won' if winsToComplete is reached.
 *
 * @param run - Current run
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns Updated run (immutable)
 * @throws Error if run is already complete
 *
 * @example
 * const updatedRun = recordWin(run);
 */
export function recordWin<TState>(
  run: Run<TState>,
  timestamp?: number,
): Run<TState> {
  if (run.status !== 'active') {
    throw new Error(`Cannot record win: run is ${run.status}`);
  }

  const newWins = run.wins + 1;
  const newWinStreak = run.winStreak + 1;
  const status: RunStatus = newWins >= run.config.winsToComplete ? 'won' : 'active';

  const event: RunEvent = {
    type: 'win',
    timestamp: timestamp ?? Date.now(),
  };

  return {
    ...run,
    wins: newWins,
    winStreak: newWinStreak,
    loseStreak: 0,
    status,
    history: [...run.history, event],
  };
}

/**
 * Records a loss and updates streaks.
 * Sets status to 'lost' if maxLosses is reached.
 *
 * @param run - Current run
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns Updated run (immutable)
 * @throws Error if run is already complete
 *
 * @example
 * const updatedRun = recordLoss(run);
 */
export function recordLoss<TState>(
  run: Run<TState>,
  timestamp?: number,
): Run<TState> {
  if (run.status !== 'active') {
    throw new Error(`Cannot record loss: run is ${run.status}`);
  }

  const newLosses = run.losses + 1;
  const newLoseStreak = run.loseStreak + 1;
  const status: RunStatus = newLosses >= run.config.maxLosses ? 'lost' : 'active';

  const event: RunEvent = {
    type: 'loss',
    timestamp: timestamp ?? Date.now(),
  };

  return {
    ...run,
    losses: newLosses,
    loseStreak: newLoseStreak,
    winStreak: 0,
    status,
    history: [...run.history, event],
  };
}

/**
 * Advances to the next phase in the cycle.
 * Cycles back to first phase after last phase.
 *
 * @param run - Current run
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns Updated run (immutable)
 * @throws Error if run is complete
 *
 * @example
 * const updatedRun = advancePhase(run);
 * // draft -> battle -> shop -> draft -> ...
 */
export function advancePhase<TState>(
  run: Run<TState>,
  timestamp?: number,
): Run<TState> {
  if (run.status !== 'active') {
    throw new Error(`Cannot advance phase: run is ${run.status}`);
  }

  const nextIndex = (run.currentPhaseIndex + 1) % run.config.phases.length;
  const nextPhase = run.config.phases[nextIndex];

  const event: RunEvent = {
    type: 'phase_change',
    timestamp: timestamp ?? Date.now(),
    data: { phase: nextPhase },
  };

  return {
    ...run,
    currentPhaseIndex: nextIndex,
    history: [...run.history, event],
  };
}

/**
 * Gets the current phase of the run.
 *
 * @param run - Current run
 * @returns Current phase
 *
 * @example
 * const phase = getCurrentPhase(run); // 'battle'
 */
export function getCurrentPhase<TState>(run: Run<TState>): RunPhase {
  return run.config.phases[run.currentPhaseIndex] ?? 'battle';
}

/**
 * Checks if the run is complete (won or lost).
 *
 * @param run - Run to check
 * @returns True if run is complete
 *
 * @example
 * if (isRunComplete(run)) {
 *   showResults(run);
 * }
 */
export function isRunComplete<TState>(run: Run<TState>): boolean {
  return run.status !== 'active';
}

/**
 * Gets the run result (status).
 *
 * @param run - Run to check
 * @returns Run status ('active', 'won', or 'lost')
 *
 * @example
 * const result = getRunResult(run);
 * if (result === 'won') celebrate();
 */
export function getRunResult<TState>(run: Run<TState>): RunStatus {
  return run.status;
}

/**
 * Calculates run statistics including win rate and longest streak.
 *
 * @param run - Run to analyze
 * @returns Run statistics
 *
 * @example
 * const stats = getRunStats(run);
 * console.log(`Win rate: ${(stats.winRate * 100).toFixed(1)}%`);
 */
export function getRunStats<TState>(run: Run<TState>): RunStats {
  const totalGames = run.wins + run.losses;

  // Calculate longest win streak from history
  let longestStreak = 0;
  let currentStreak = 0;

  for (const event of run.history) {
    if (event.type === 'win') {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else if (event.type === 'loss') {
      currentStreak = 0;
    }
  }

  return {
    wins: run.wins,
    losses: run.losses,
    winRate: totalGames > 0 ? run.wins / totalGames : 0,
    longestWinStreak: longestStreak,
  };
}

/**
 * Updates the game-specific state of the run.
 *
 * @param run - Current run
 * @param newState - New state or updater function
 * @returns Updated run (immutable)
 *
 * @example
 * const updatedRun = updateRunState(run, { ...run.state, gold: 100 });
 */
export function updateRunState<TState>(
  run: Run<TState>,
  newState: TState | ((prev: TState) => TState),
): Run<TState> {
  const state = typeof newState === 'function'
    ? (newState as (prev: TState) => TState)(run.state)
    : newState;

  return {
    ...run,
    state,
  };
}

