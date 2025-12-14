/**
 * Droppable Grid Cell component for Fantasy Autobattler Team Builder.
 * Grid cell that can accept dropped units with visual feedback.
 * 
 * @fileoverview Droppable wrapper for grid cells with highlight effects.
 */

'use client';

import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Position, UnitTemplate, UnitId, UNIT_INFO } from '@/types/game';
import { GridDropData } from './DragDropProvider';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Grid unit for display.
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
 * DroppableGridCell component props.
 */
interface DroppableGridCellProps {
  /** Cell position on grid */
  position: Position;
  /** Unit currently in this cell */
  unit?: GridUnit;
  /** Cell highlight information */
  highlight?: HighlightedCell;
  /** Whether cell is selected */
  isSelected: boolean;
  /** Whether cell is interactive */
  interactive: boolean;
  /** Grid mode */
  mode: 'team-builder' | 'battle' | 'replay';
  /** Whether to show coordinates */
  showCoordinates: boolean;
  /** Whether this is a valid drop zone */
  isValidDropZone: boolean;
  /** Click handler */
  onCellClick: (position: Position) => void;
  /** Hover handler */
  onCellHover: (position: Position | null) => void;
  /** Unique grid ID prefix for droppable IDs */
  gridId: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

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
  'drop-target': 'bg-yellow-400/30 border-yellow-400 border-2 animate-pulse',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get zone type for a row.
 */
function getZoneType(row: number): 'player' | 'enemy' | 'neutral' {
  if (PLAYER_ROWS.includes(row)) return 'player';
  if (ENEMY_ROWS.includes(row)) return 'enemy';
  return 'neutral';
}

/**
 * Get base cell styling based on zone.
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DroppableGridCell component for accepting dropped units.
 * Provides visual feedback during drag operations.
 * 
 * @param props - Component props
 * @returns Droppable grid cell component
 * @example
 * <DroppableGridCell
 *   position={{ x: 0, y: 0 }}
 *   isValidDropZone={true}
 *   onCellClick={handleCellClick}
 * />
 */
const DroppableGridCell = memo(function DroppableGridCell({
  position,
  unit,
  highlight,
  isSelected,
  interactive,
  mode,
  showCoordinates,
  isValidDropZone,
  onCellClick,
  onCellHover,
  gridId,
}: DroppableGridCellProps) {
  // Set up droppable functionality
  // Each cell gets a unique ID based on grid ID and position to avoid duplicates
  const droppableId = `grid-cell-${gridId}-${position.x}-${position.y}`;
  
  const {
    isOver,
    setNodeRef,
    active,
  } = useDroppable({
    id: droppableId,
    // Only disable if not interactive or not in team-builder mode
    disabled: !interactive || mode !== 'team-builder',
    data: {
      type: 'grid-cell',
      position,
      isValidZone: isValidDropZone,
    } as GridDropData,
  });
  
  // Check if there's an active drag happening
  const isDragActive = active !== null;
  
  // Determine cell styling
  const baseStyle = getBaseCellStyle(position.y);
  const highlightStyle = highlight ? HIGHLIGHT_STYLES[highlight.type] : '';
  const dropTargetStyle = isOver && isValidDropZone ? HIGHLIGHT_STYLES['drop-target'] : '';
  const invalidDropStyle = isOver && !isValidDropZone ? 'bg-red-500/30 border-red-500' : '';
  // Show subtle highlight on valid zones when dragging
  const dragActiveStyle = isDragActive && isValidDropZone && !isOver ? 'border-green-500/50 bg-green-900/10' : '';
  
  const handleClick = () => {
    if (interactive) {
      onCellClick(position);
    }
  };
  
  const handleMouseEnter = () => {
    if (interactive) {
      onCellHover(position);
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive) {
      onCellHover(null);
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-rowindex={position.y + 1}
      aria-colindex={position.x + 1}
      aria-label={`Grid cell ${position.x + 1}, ${position.y + 1}${unit ? ` - ${unit.unit.name}` : ''}${isValidDropZone ? ' - Valid drop zone' : ''}`}
      aria-selected={isSelected}
      aria-dropeffect={isDragActive && isValidDropZone ? 'move' : 'none'}
      tabIndex={interactive ? 0 : -1}
      data-droppable-id={droppableId}
      data-position={`${position.x},${position.y}`}
      data-valid-zone={isValidDropZone}
      data-is-over={isOver}
      data-drag-active={isDragActive}
      className={`
        relative aspect-square border transition-all duration-200
        min-h-[40px] min-w-[40px] sm:min-h-[48px] sm:min-w-[48px] md:min-h-[56px] md:min-w-[56px]
        ${baseStyle}
        ${highlightStyle}
        ${dropTargetStyle}
        ${invalidDropStyle}
        ${dragActiveStyle}
        ${interactive ? 'cursor-pointer hover:bg-white/5 active:bg-white/10 touch-manipulation focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1' : ''}
        ${unit ? 'p-0' : ''}
        ${isOver ? 'scale-105 z-10' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Unit display - simple compact display for grid cells */}
      {unit && (
        <div className="animate-unit-place absolute inset-0">
          <GridUnitDisplay 
            unit={unit} 
            isSelected={isSelected}
            mode={mode}
          />
        </div>
      )}
      
      {/* Drop zone indicator - pointer-events-none to not block drops */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-lg
            ${isValidDropZone 
              ? 'bg-green-500/80 text-white' 
              : 'bg-red-500/80 text-white'
            }
          `}>
            {isValidDropZone ? '✓' : '✗'}
          </div>
        </div>
      )}
      
      {/* Coordinates display - pointer-events-none to not block drops */}
      {showCoordinates && !unit && (
        <div className="absolute top-0 left-0 text-xs text-gray-500 leading-none pointer-events-none">
          {position.x},{position.y}
        </div>
      )}
      
      {/* Zone labels - pointer-events-none to not block drops */}
      {position.x === 0 && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-xs text-gray-400 pointer-events-none select-none">
          {getZoneType(position.y) === 'player' && 'Player'}
          {getZoneType(position.y) === 'enemy' && 'Enemy'}
        </span>
      )}
    </div>
  );
});

/**
 * Props for GridUnitDisplay component.
 */
interface GridUnitDisplayProps {
  /** Unit to display */
  unit: GridUnit;
  /** Whether unit is selected */
  isSelected: boolean;
  /** Grid mode */
  mode: 'team-builder' | 'battle' | 'replay';
}

/**
 * Compact unit display for grid cells.
 * Shows only essential info: emoji, cost badge, and HP bar.
 */
function GridUnitDisplay({ unit, isSelected, mode }: GridUnitDisplayProps) {
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
      rounded border-2 transition-all duration-200 pointer-events-none
      ${teamStyle}
      ${isSelected ? 'ring-2 ring-yellow-400' : ''}
      ${!isAlive ? 'opacity-30 grayscale' : ''}
      ${unitInfo?.color || 'bg-gray-600'} bg-opacity-90
      min-h-full min-w-full
    `}>
      {/* Unit emoji - larger size to fill cell */}
      <div className="text-lg sm:text-xl md:text-2xl leading-none flex-1 flex items-center justify-center">
        {unitInfo?.emoji || '❓'}
      </div>
      
      {/* Unit cost badge (team-builder mode) */}
      {mode === 'team-builder' && (
        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs sm:text-sm rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold leading-none">
          {unit.unit.cost}
        </div>
      )}
      
      {/* HP bar - always show in compact form */}
      <div className="absolute bottom-0 left-0 right-0 px-1">
        <div className="bg-gray-900/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>
      
      {/* Death indicator */}
      {!isAlive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
          <span className="text-red-500 text-sm">💀</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DroppableGridCell };
export type { DroppableGridCellProps, GridUnit, CellHighlight, HighlightedCell };