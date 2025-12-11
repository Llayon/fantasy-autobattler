/**
 * BattleGrid component for Fantasy Autobattler.
 * Displays 8×10 battlefield grid with units and interactive features.
 * 
 * @fileoverview Interactive battlefield grid component with responsive design.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Position, UnitTemplate, UnitId, UNIT_INFO } from '@/types/game';

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
type CellHighlight = 'movement' | 'attack' | 'selected' | 'valid' | 'invalid' | 'hover';

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
 * BattleGrid component props.
 */
interface BattleGridProps {
  /** Units to display on grid */
  units?: GridUnit[];
  /** Callback when cell is clicked */
  onCellClick?: (position: Position) => void;
  /** Callback when unit is dropped on cell */
  onUnitDrop?: (unit: UnitTemplate, position: Position) => void;
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

/** Cell highlight styles */
const HIGHLIGHT_STYLES: Record<CellHighlight, string> = {
  movement: 'bg-blue-400/30 border-blue-400',
  attack: 'bg-red-400/30 border-red-400',
  selected: 'bg-yellow-400/40 border-yellow-400 border-2',
  valid: 'bg-green-400/20 border-green-400',
  invalid: 'bg-red-400/20 border-red-400',
  hover: 'bg-white/10 border-white/30',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get zone type for a row.
 * 
 * @param row - Grid row (0-9)
 * @returns Zone type
 */
function getZoneType(row: number): 'player' | 'enemy' | 'neutral' {
  if (PLAYER_ROWS.includes(row)) return 'player';
  if (ENEMY_ROWS.includes(row)) return 'enemy';
  return 'neutral';
}

/**
 * Get base cell styling based on zone.
 * 
 * @param row - Grid row
 * @returns CSS classes
 */
function getBaseCellStyle(row: number): string {
  const zone = getZoneType(row);
  
  switch (zone) {
    case 'player':
      return 'bg-blue-900/20 border-blue-600/30';
    case 'enemy':
      return 'bg-red-900/20 border-red-600/30';
    default:
      return 'bg-gray-800/20 border-gray-600/30';
  }
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
// COMPONENTS
// =============================================================================

/**
 * Individual unit display on grid.
 */
interface UnitDisplayProps {
  unit: GridUnit;
  isSelected: boolean;
  mode: 'team-builder' | 'battle' | 'replay';
}

function UnitDisplay({ unit, isSelected, mode }: UnitDisplayProps) {
  const unitInfo = UNIT_INFO[unit.unit.id as UnitId];
  const maxHp = unit.unit.stats.hp;
  const currentHp = unit.currentHp ?? maxHp;
  const hpPercent = Math.max(0, (currentHp / maxHp) * 100);
  const isAlive = unit.alive ?? true;
  
  // Team-based styling
  const teamStyle = unit.team === 'player' 
    ? 'border-blue-400' 
    : unit.team === 'bot' 
    ? 'border-red-400' 
    : 'border-gray-400';
  
  return (
    <div className={`
      relative w-full h-full flex flex-col items-center justify-center
      rounded-lg border-2 transition-all duration-200
      ${teamStyle}
      ${isSelected ? 'ring-2 ring-yellow-400 scale-105' : ''}
      ${!isAlive ? 'opacity-30 grayscale' : ''}
      ${unitInfo?.color || 'bg-gray-600'} bg-opacity-80
    `}>
      {/* Unit emoji */}
      <div className="text-lg sm:text-xl md:text-2xl">
        {unitInfo?.emoji || '❓'}
      </div>
      
      {/* Unit cost (team-builder mode) */}
      {mode === 'team-builder' && (
        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
          {unit.unit.cost}
        </div>
      )}
      
      {/* HP bar (battle/replay mode) */}
      {(mode === 'battle' || mode === 'replay') && (
        <div className="absolute -bottom-1 left-0 right-0 mx-1">
          <div className="bg-gray-900 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Death indicator */}
      {!isAlive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-500 text-xl">💀</span>
        </div>
      )}
    </div>
  );
}

/**
 * Individual grid cell component.
 */
interface GridCellProps {
  position: Position;
  unit?: GridUnit;
  highlight?: HighlightedCell;
  isSelected: boolean;
  interactive: boolean;
  mode: 'team-builder' | 'battle' | 'replay';
  showCoordinates: boolean;
  onCellClick: (position: Position) => void;
  onCellHover: (position: Position | null) => void;
  onUnitDrop?: (unit: UnitTemplate, position: Position) => void;
}

function GridCell({
  position,
  unit,
  highlight,
  isSelected,
  interactive,
  mode,
  showCoordinates,
  onCellClick,
  onCellHover,
  onUnitDrop,
}: GridCellProps) {
  const baseStyle = getBaseCellStyle(position.y);
  const highlightStyle = highlight ? HIGHLIGHT_STYLES[highlight.type] : '';
  
  const handleClick = useCallback(() => {
    if (interactive) {
      onCellClick(position);
    }
  }, [interactive, onCellClick, position]);
  
  const handleMouseEnter = useCallback(() => {
    if (interactive) {
      onCellHover(position);
    }
  }, [interactive, onCellHover, position]);
  
  const handleMouseLeave = useCallback(() => {
    if (interactive) {
      onCellHover(null);
    }
  }, [interactive, onCellHover]);
  
  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (interactive && onUnitDrop && mode === 'team-builder') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [interactive, onUnitDrop, mode]);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (interactive && onUnitDrop && mode === 'team-builder') {
      e.preventDefault();
    }
  }, [interactive, onUnitDrop, mode]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!interactive || !onUnitDrop || mode !== 'team-builder') {
      return;
    }
    
    e.preventDefault();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (dragData.type === 'unit' && dragData.unit) {
        onUnitDrop(dragData.unit, position);
      }
    } catch (error) {
      // Invalid drag data, ignore silently
    }
  }, [interactive, onUnitDrop, mode, position]);
  
  return (
    <div
      className={`
        relative aspect-square border transition-all duration-150
        ${baseStyle}
        ${highlightStyle}
        ${interactive ? 'cursor-pointer hover:bg-white/5' : ''}
        ${unit ? 'p-1' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
    >
      {/* Unit display */}
      {unit && (
        <UnitDisplay 
          unit={unit} 
          isSelected={isSelected}
          mode={mode}
        />
      )}
      
      {/* Coordinates display */}
      {showCoordinates && !unit && (
        <div className="absolute top-0 left-0 text-xs text-gray-500 leading-none">
          {position.x},{position.y}
        </div>
      )}
      
      {/* Zone labels */}
      {position.x === 0 && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-xs text-gray-400">
          {getZoneType(position.y) === 'player' && 'Player'}
          {getZoneType(position.y) === 'enemy' && 'Enemy'}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * BattleGrid component for displaying 8×10 battlefield.
 * Supports team building, battle display, and replay modes.
 * 
 * @example
 * <BattleGrid
 *   units={teamUnits}
 *   onCellClick={handleCellClick}
 *   highlightedCells={validPositions}
 *   selectedUnit={selectedUnit}
 *   mode="team-builder"
 *   interactive
 * />
 */
export function BattleGrid({
  units = [],
  onCellClick,
  onUnitDrop,
  highlightedCells = [],
  selectedUnit,
  interactive = true,
  mode = 'team-builder',
  className = '',
  showCoordinates = false,
  disableZoom = false,
}: BattleGridProps) {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  
  // Create grid cells
  const gridCells = useMemo(() => {
    const cells: Array<{
      position: Position;
      unit?: GridUnit;
      highlight?: HighlightedCell;
      isSelected: boolean;
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
        
        cells.push({
          position,
          unit,
          highlight: finalHighlight,
          isSelected,
        });
      }
    }
    
    return cells;
  }, [units, highlightedCells, selectedUnit, hoveredCell]);
  
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
        {gridCells.map(({ position, unit, highlight, isSelected }) => (
          <GridCell
            key={`${position.x}-${position.y}`}
            position={position}
            unit={unit}
            highlight={highlight}
            isSelected={isSelected}
            interactive={interactive}
            mode={mode}
            showCoordinates={showCoordinates}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            onUnitDrop={onUnitDrop}
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

export type { BattleGridProps, GridUnit, HighlightedCell, CellHighlight };
export { GRID_WIDTH, GRID_HEIGHT, PLAYER_ROWS, ENEMY_ROWS };