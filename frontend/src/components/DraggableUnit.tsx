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
  className = '',
  showAbilities = false,
}: DraggableUnitProps) {
  // Set up draggable functionality
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
  
  // Apply transform styles
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
        transition-all duration-200
        ${className}
      `}
      {...listeners}
      {...attributes}
    >
      <UnitCard
        unit={unit}
        size={size}
        selected={selected}
        disabled={disabled}
        onClick={onClick}
        showAbilities={showAbilities}
        className={`
          ${isDragging ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
          ${!disabled ? 'hover:shadow-md hover:scale-105' : ''}
          transition-all duration-200
        `}
      />
      
      {/* Drag indicator */}
      {!disabled && (
        <div className="absolute top-1 right-1 text-gray-400 text-xs opacity-70">
          ⋮⋮
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { DraggableUnitProps };