/**
 * Droppable Grid Cell component for Fantasy Autobattler Team Builder.
 * Grid cell that can accept dropped units with visual feedback.
 * 
 * @fileoverview Droppable wrapper for grid cells with highlight effects.
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Position, UnitTemplate, UnitId, UNIT_INFO } from '@/types/game';
import { GridDropData } from './DragDropProvider';
import { DraggableUnit } from './DraggableUnit';

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
export function DroppableGridCell({
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
}: DroppableGridCellProps) {
  // Set up droppable functionality
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: `grid-cell-${position.x}-${position.y}`,
    disabled: !interactive || mode !== 'team-builder',
    data: {
      type: 'grid-cell',
      position,
      isValidZone: isValidDropZone,
    } as GridDropData,
  });
  
  // Determine cell styling
  const baseStyle = getBaseCellStyle(position.y);
  const highlightStyle = highlight ? HIGHLIGHT_STYLES[highlight.type] : '';
  const dropTargetStyle = isOver && isValidDropZone ? HIGHLIGHT_STYLES['drop-target'] : '';
  const invalidDropStyle = isOver && !isValidDropZone ? 'bg-red-500/30 border-red-500' : '';
  
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
      className={`
        relative aspect-square border transition-all duration-200
        ${baseStyle}
        ${highlightStyle}
        ${dropTargetStyle}
        ${invalidDropStyle}
        ${interactive ? 'cursor-pointer hover:bg-white/5' : ''}
        ${unit ? 'p-1' : ''}
        ${isOver ? 'scale-105' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Unit display */}
      {unit && mode === 'team-builder' ? (
        <DraggableUnit
          unit={unit.unit}
          id={`grid-unit-${unit.unit.id}-${position.x}-${position.y}`}
          source="grid"
          originalPosition={position}
          size="compact"
          className="w-full h-full"
        />
      ) : unit ? (
        <UnitDisplay 
          unit={unit} 
          isSelected={isSelected}
          mode={mode}
        />
      ) : null}
      
      {/* Drop zone indicator */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center">
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

/**
 * Unit display component for grid cells.
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

// =============================================================================
// EXPORTS
// =============================================================================

export type { DroppableGridCellProps, GridUnit, CellHighlight, HighlightedCell };