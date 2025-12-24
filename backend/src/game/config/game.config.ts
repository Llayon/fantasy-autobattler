/**
 * Game-specific configuration for Fantasy Autobattler.
 * Extends core configurations with game-specific values.
 *
 * @module game/config
 */

import { GridConfig, BattleConfig } from '../../core/types/config.types';

/**
 * Fantasy Autobattler grid configuration.
 * 8×10 battlefield with 2-row deployment zones.
 */
export const FANTASY_AUTOBATTLER_GRID: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};

/**
 * Fantasy Autobattler battle configuration.
 */
export const FANTASY_AUTOBATTLER_BATTLE: BattleConfig = {
  maxRounds: 100,
  minDamage: 1,
  dodgeCapPercent: 50,
};

/**
 * Team budget for team building.
 */
export const TEAM_BUDGET = 30;

/**
 * Unit cost range.
 */
export const UNIT_COST_RANGE = {
  min: 3,
  max: 8,
} as const;
