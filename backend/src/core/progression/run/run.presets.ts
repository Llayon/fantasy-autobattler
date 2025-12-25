/**
 * Run System Presets
 *
 * Pre-configured run settings for different game modes.
 *
 * @module core/progression/run/presets
 */

import { RunConfig } from './run.types';

/**
 * Standard roguelike run configuration.
 * 9 wins to complete, 4 losses allowed.
 * Phases: draft -> battle -> shop (cycling)
 *
 * @example
 * const run = createRun(ROGUELIKE_RUN_CONFIG, initialState);
 */
export const ROGUELIKE_RUN_CONFIG: RunConfig = {
  winsToComplete: 9,
  maxLosses: 4,
  phases: ['draft', 'battle', 'shop'],
  trackStreaks: true,
  enableRating: true,
};

/**
 * Boss rush run configuration.
 * 5 wins to complete (5 bosses), only 1 loss allowed.
 * Phases: battle -> rest (cycling)
 *
 * @example
 * const run = createRun(BOSS_RUSH_RUN_CONFIG, initialState);
 */
export const BOSS_RUSH_RUN_CONFIG: RunConfig = {
  winsToComplete: 5,
  maxLosses: 1,
  phases: ['battle', 'rest'],
  trackStreaks: true,
  enableRating: true,
};

/**
 * Endless run configuration.
 * No win limit (999 wins), 3 losses allowed.
 * Phases: battle -> shop -> event (cycling)
 *
 * @example
 * const run = createRun(ENDLESS_RUN_CONFIG, initialState);
 */
export const ENDLESS_RUN_CONFIG: RunConfig = {
  winsToComplete: 999,
  maxLosses: 3,
  phases: ['battle', 'shop', 'event'],
  trackStreaks: true,
  enableRating: false,
};

/**
 * Arena run configuration.
 * 12 wins to complete, 3 losses allowed.
 * Phases: draft -> battle (cycling)
 *
 * @example
 * const run = createRun(ARENA_RUN_CONFIG, initialState);
 */
export const ARENA_RUN_CONFIG: RunConfig = {
  winsToComplete: 12,
  maxLosses: 3,
  phases: ['draft', 'battle'],
  trackStreaks: true,
  enableRating: true,
};

/**
 * Tutorial run configuration.
 * 3 wins to complete, 5 losses allowed (forgiving).
 * Phases: battle only
 *
 * @example
 * const run = createRun(TUTORIAL_RUN_CONFIG, initialState);
 */
export const TUTORIAL_RUN_CONFIG: RunConfig = {
  winsToComplete: 3,
  maxLosses: 5,
  phases: ['battle'],
  trackStreaks: false,
  enableRating: false,
};

