/**
 * Droppable Unit List component for Fantasy Autobattler Team Builder.
 * Unit list that can accept dropped units for removal.
 * 
 * @fileoverview Droppable wrapper for unit list with removal functionality.
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ListDropData } from './DragDropProvider';

// =============================================================================
// TYPES
// =============================================================================

/**
 * DroppableUnitList component props.
 */
interface DroppableUnitListProps {
  /** Child components */
  children: React.ReactNode;
  /** Whether drop is enabled */
  enabled?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DroppableUnitList component for accepting dropped units for removal.
 * Provides visual feedback when units are dragged over for removal.
 * 
 * @param props - Component props
 * @returns Droppable unit list component
 * @example
 * <DroppableUnitList enabled={true}>
 *   <UnitList units={units} />
 * </DroppableUnitList>
 */
export function DroppableUnitList({ 
  children, 
  enabled = true, 
  className = '' 
}: DroppableUnitListProps) {
  // Set up droppable functionality
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: 'unit-list-drop-zone',
    disabled: !enabled,
    data: {
      type: 'unit-list',
    } as ListDropData,
  });
  
  return (
    <div
      ref={setNodeRef}
      className={`
        relative transition-all duration-200
        ${isOver ? 'bg-red-900/20 border-2 border-red-500 border-dashed rounded-lg' : ''}
        ${className}
      `}
    >
      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 bg-red-500/10 rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗑️</span>
              <span>Отпустите для удаления</span>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { DroppableUnitListProps };