/**
 * Core types for grid-based games.
 * @fileoverview Generic types that can be reused across different games.
 */

/**
 * 2D position on a grid.
 */
export interface Position {
  /** X coordinate (column) */
  x: number;
  /** Y coordinate (row) */
  y: number;
}

/**
 * Grid configuration for customizable grid dimensions.
 */
export interface GridConfig {
  /** Grid width in cells */
  width: number;
  /** Grid height in cells */
  height: number;
  /** Player deployment rows (0-indexed from bottom) */
  playerRows: number[];
  /** Enemy deployment rows (0-indexed from top) */
  enemyRows: number[];
}

/**
 * Default grid configuration for 8x10 autobattler grid.
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};

/**
 * Cell state in a grid.
 */
export type CellState = 'empty' | 'occupied' | 'blocked' | 'highlighted';

/**
 * Grid cell with position and state.
 */
export interface GridCell {
  /** Cell position */
  position: Position;
  /** Current cell state */
  state: CellState;
  /** Optional unit ID occupying the cell */
  unitId?: string;
}
