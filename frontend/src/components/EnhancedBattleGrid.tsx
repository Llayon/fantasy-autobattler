/**
 * Enhanced BattleGrid component for Fantasy Autobattler.
 * Displays 8×10 battlefield grid with advanced drag-and-drop functionality.
 * 
 * @fileoverview Interactive battlefield grid with @dnd-kit integration.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Position, UnitTemplate } from '@/types/game';
import { DroppableGridCell } from './DroppableGridCell';


// =============================================================================
// TYPES
// =============================================================================

/**
 * Unit positioned on the grid.
 */
interface GridUnit {
  /** Unit template data */
  unit: UnitTemplate;
  /** Position on grid */
  position: Position;
  /** Current HP for battle display */
  currentHp?: number;
  /** Whether unit is alive */
  alive?: boolean;
  /** Team affiliation */
  team?: 'player' | 'bot';
  /** Unique instance ID */
  instanceId?: string;
}

/**
 * Cell highlight types.
 */
type CellHighlight = 'movement' | 'attack' | 'selected' | 'valid' | 'invalid' | 'hover' | 'drop-target';

/**
 * Highlighted cell information.
 */
interface HighlightedCell {
  /** Cell position */
  position: Position;
  /** Highlight type */
  type: CellHighlight;
}

/**
 * EnhancedBattleGrid component props.
 */
interface EnhancedBattleGridProps {
  /** Units to display on grid */
  units?: GridUnit[];
  /** Callback when cell is clicked */
  onCellClick?: (position: Position) => void;
  /** Cells to highlight */
  highlightedCells?: HighlightedCell[];
  /** Currently selected unit */
  selectedUnit?: GridUnit | null;
  /** Whether grid is interactive */
  interactive?: boolean;
  /** Grid mode: team-builder or battle */
  mode?: 'team-builder' | 'battle' | 'replay';
  /** Custom CSS classes */
  className?: string;
  /** Show grid coordinates */
  showCoordinates?: boolean;
  /** Disable zoom on mobile */
  disableZoom?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Grid dimensions */
const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;

/** Player deployment zone rows */
const PLAYER_ROWS = [0, 1];

/** Enemy deployment zone rows */
const ENEMY_ROWS = [8, 9];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if position is in player deployment zone.
 * 
 * @param position - Grid position to check
 * @returns True if position is in player zone (rows 0-1)
 */
function isPlayerZone(position: Position): boolean {
  return PLAYER_ROWS.includes(position.y);
}

/**
 * Find unit at specific position.
 * 
 * @param units - Array of units
 * @param position - Position to check
 * @returns Unit at position or undefined
 */
function getUnitAtPosition(units: GridUnit[], position: Position): GridUnit | undefined {
  return units.find(unit => 
    unit.position.x === position.x && unit.position.y === position.y
  );
}

/**
 * Get highlight for specific cell.
 * 
 * @param highlightedCells - Array of highlighted cells
 * @param position - Position to check
 * @returns Highlight or undefined
 */
function getCellHighlight(
  highlightedCells: HighlightedCell[], 
  position: Position
): HighlightedCell | undefined {
  return highlightedCells.find(cell => 
    cell.position.x === position.x && cell.position.y === position.y
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * EnhancedBattleGrid component for displaying 8×10 battlefield with advanced drag-and-drop.
 * Supports team building, battle display, and replay modes with @dnd-kit integration.
 * 
 * @example
 * <EnhancedBattleGrid
 *   units={teamUnits}
 *   onCellClick={handleCellClick}
 *   highlightedCells={validPositions}
 *   selectedUnit={selectedUnit}
 *   mode="team-builder"
 *   interactive
 * />
 */
export function EnhancedBattleGrid({
  units = [],
  onCellClick,
  highlightedCells = [],
  selectedUnit,
  interactive = true,
  mode = 'team-builder',
  className = '',
  showCoordinates = false,
  disableZoom = false,
}: EnhancedBattleGridProps) {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  
  // Create grid cells with units
  const gridCells = useMemo(() => {
    const cells: Array<{
      position: Position;
      unit?: GridUnit;
      highlight?: HighlightedCell;
      isSelected: boolean;
      isValidDropZone: boolean;
    }> = [];
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const position = { x, y };
        const unit = getUnitAtPosition(units, position);
        const highlight = getCellHighlight(highlightedCells, position);
        const isSelected = selectedUnit ? 
          selectedUnit.position.x === x && selectedUnit.position.y === y : 
          false;
        
        // Add hover highlight if not already highlighted
        const finalHighlight = highlight || (
          hoveredCell && hoveredCell.x === x && hoveredCell.y === y
            ? { position, type: 'hover' as CellHighlight }
            : undefined
        );
        
        // Determine if this is a valid drop zone (player zone for team-builder)
        const isValidDropZone = mode === 'team-builder' && isPlayerZone(position);
        
        cells.push({
          position,
          unit,
          highlight: finalHighlight,
          isSelected,
          isValidDropZone,
        });
      }
    }
    
    return cells;
  }, [units, highlightedCells, selectedUnit, hoveredCell, mode]);
  
  const handleCellClick = useCallback((position: Position) => {
    onCellClick?.(position);
  }, [onCellClick]);
  
  const handleCellHover = useCallback((position: Position | null) => {
    setHoveredCell(position);
  }, []);
  
  return (
    <div className={`
      relative w-full max-w-4xl mx-auto
      ${!disableZoom ? 'touch-pan-x touch-pan-y' : ''}
      ${className}
    `}>
      {/* Grid container */}
      <div 
        className={`
          grid grid-cols-8 gap-1 p-4 bg-gray-900/50 rounded-lg border border-gray-700
          ${!disableZoom ? 'transform-gpu transition-transform' : ''}
        `}
        style={{
          aspectRatio: `${GRID_WIDTH} / ${GRID_HEIGHT}`,
        }}
      >
        {gridCells.map(({ position, unit, highlight, isSelected, isValidDropZone }) => (
          <DroppableGridCell
            key={`${position.x}-${position.y}`}
            position={position}
            unit={unit}
            highlight={highlight}
            isSelected={isSelected}
            interactive={interactive}
            mode={mode}
            showCoordinates={showCoordinates}
            isValidDropZone={isValidDropZone}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
          />
        ))}
        

      </div>
      
      {/* Zone legend */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-900/40 border border-blue-600/50 rounded"></div>
          <span>Player Zone (Rows 0-1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-900/40 border border-red-600/50 rounded"></div>
          <span>Enemy Zone (Rows 8-9)</span>
        </div>
      </div>
      
      {/* Mobile zoom hint */}
      {!disableZoom && (
        <div className="mt-2 text-center text-xs text-gray-500 sm:hidden">
          Pinch to zoom • Drag to pan
        </div>
      )}
    </div>
  );
}



// =============================================================================
// EXPORTS
// =============================================================================

export type { EnhancedBattleGridProps, GridUnit, HighlightedCell, CellHighlight };
export { GRID_WIDTH, GRID_HEIGHT, PLAYER_ROWS, ENEMY_ROWS };