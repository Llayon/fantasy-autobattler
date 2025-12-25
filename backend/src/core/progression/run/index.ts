/**
 * Run System Exports
 *
 * @module core/progression/run
 */

// Types
export * from './run.types';

// Operations
export {
  createRun,
  recordWin,
  recordLoss,
  advancePhase,
  getCurrentPhase,
  isRunComplete,
  getRunResult,
  getRunStats,
  updateRunState,
} from './run';

// Presets
export {
  ROGUELIKE_RUN_CONFIG,
  BOSS_RUSH_RUN_CONFIG,
  ENDLESS_RUN_CONFIG,
  ARENA_RUN_CONFIG,
  TUTORIAL_RUN_CONFIG,
} from './run.presets';

