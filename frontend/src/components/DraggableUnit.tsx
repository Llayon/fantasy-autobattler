/**
 * Draggable Unit component for Fantasy Autobattler Team Builder.
 * Wraps UnitCard with drag-and-drop functionality.
 * 
 * @fileoverview Draggable wrapper for unit cards with visual feedback.
 */

'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { UnitTemplate, Position } from '@/types/game';
import { UnitCard } from './UnitCard';
import { UnitDragData } from './DragDropProvider';

// =============================================================================
// TYPES
// =============================================================================

/**
 * DraggableUnit component props.
 */
interface DraggableUnitProps {
  /** Unit template data */
  unit: UnitTemplate;
  /** Unique identifier for drag system */
  id: string;
  /** Source of the draggable (list or grid) */
  source: 'list' | 'grid';
  /** Original position if from grid */
  originalPosition?: Position;
  /** Original index if from list */
  originalIndex?: number;
  /** Whether unit is selected */
  selected?: boolean;
  /** Whether unit is disabled */
  disabled?: boolean;
  /** Card display size */
  size?: 'compact' | 'full';
  /** Click handler */
  onClick?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Custom CSS classes */
  className?: string;
  /** Show ability icons */
  showAbilities?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DraggableUnit component for drag-and-drop unit cards.
 * Provides visual feedback during drag operations.
 * Disables long press during drag to prevent modal from opening.
 * 
 * @param props - Component props
 * @returns Draggable unit card component
 * @example
 * <DraggableUnit
 *   unit={unitTemplate}
 *   id="unit-knight-0"
 *   source="list"
 *   originalIndex={0}
 *   size="compact"
 * />
 */
export function DraggableUnit({
  unit,
  id,
  source,
  originalPosition,
  originalIndex,
  selected = false,
  disabled = false,
  size = 'compact',
  onClick,
  onLongPress,
  className = '',
}: DraggableUnitProps) {
  // Set up draggable functionality with unique ID and unit data
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    disabled,
    data: {
      type: 'unit',
      unit,
      source,
      originalPosition,
      originalIndex,
    } as UnitDragData,
  });
  
  // Prevent text selection during drag
  const preventSelection = isDragging ? 'select-none' : '';
  
  // Apply transform styles
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? 'opacity-50 scale-95 z-50' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing touch-manipulation'}
        ${preventSelection}
        transition-all duration-200
        ${className}
      `}
      {...listeners}
      {...attributes}
    >
      {/* 
        IMPORTANT: Don't pass onLongPress to UnitCard when dragging is possible.
        The drag gesture conflicts with long press detection.
        Instead, use double-click for details (handled by UnitCard internally).
      */}
      <UnitCard
        unit={unit}
        variant={size === 'compact' ? 'compact' : 'list'}
        selected={selected}
        disabled={disabled}
        onClick={isDragging ? undefined : onClick}
        onLongPress={undefined}
        className={`
          ${isDragging ? 'ring-2 ring-yellow-400 shadow-lg pointer-events-none' : ''}
          ${!disabled ? 'hover:shadow-md' : ''}
          transition-all duration-200
        `}
      />
      
      {/* Double-click hint for details */}
      {!disabled && onLongPress && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLongPress();
          }}
          className="absolute top-1 right-1 text-gray-400 hover:text-white text-xs opacity-70 hover:opacity-100 p-1 rounded hover:bg-gray-700/50 transition-all"
          title="Подробнее"
        >
          ℹ️
        </button>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { DraggableUnitProps };