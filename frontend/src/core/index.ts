/**
 * Core module exports.
 * @fileoverview Generic types and hooks for grid-based games.
 */

// Types
export type {
  Position,
  GridConfig,
  CellState,
  GridCell,
} from './types';

export { DEFAULT_GRID_CONFIG } from './types';

// Hooks
export {
  useGridNavigation,
} from './hooks';

export type {
  UseGridNavigationOptions,
  UseGridNavigationReturn,
} from './hooks';
