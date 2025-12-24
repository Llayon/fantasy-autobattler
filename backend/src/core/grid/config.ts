/**
 * Default grid configuration for the core battle engine.
 *
 * @module core/grid/config
 */

import { GridConfig } from '../types/config.types';

/**
 * Default grid configuration.
 * Standard 8×10 battlefield with 2-row deployment zones.
 *
 * @example
 * import { DEFAULT_GRID_CONFIG } from '@core/grid/config';
 * const myConfig = { ...DEFAULT_GRID_CONFIG, width: 6 };
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};
