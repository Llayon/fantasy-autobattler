/**
 * Drag and Drop Provider for Fantasy Autobattler Team Builder.
 * Uses @dnd-kit/core for advanced drag-and-drop functionality.
 * 
 * @fileoverview Enhanced drag-and-drop with touch support and visual feedback.
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { UnitTemplate, Position } from '@/types/game';
import { UnitCard } from './UnitCard';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Drag data for unit items.
 */
interface UnitDragData {
  /** Type of draggable item */
  type: 'unit';
  /** Unit template being dragged */
  unit: UnitTemplate;
  /** Source of the drag (list or grid) */
  source: 'list' | 'grid';
  /** Original position if dragging from grid */
  originalPosition?: Position;
  /** Original index if dragging from list */
  originalIndex?: number;
}

/**
 * Drop zone data for grid cells.
 */
interface GridDropData {
  /** Type of drop zone */
  type: 'grid-cell';
  /** Position on the grid */
  position: Position;
  /** Whether this cell is in a valid drop zone */
  isValidZone: boolean;
}

/**
 * Drop zone data for unit list.
 */
interface ListDropData {
  /** Type of drop zone */
  type: 'unit-list';
}

/**
 * All possible drop data types.
 */
type DropData = GridDropData | ListDropData;

/**
 * Drag and drop event handlers.
 */
interface DragDropHandlers {
  /** Called when unit is dropped on grid */
  onUnitDropOnGrid?: (unit: UnitTemplate, position: Position) => void;
  /** Called when unit is dropped back to list (removal) */
  onUnitDropOnList?: (unit: UnitTemplate, originalPosition?: Position) => void;
  /** Called when drag starts for visual feedback */
  onDragStart?: (unit: UnitTemplate, source: 'list' | 'grid') => void;
  /** Called when drag ends */
  onDragEnd?: () => void;
  /** Called during drag over for highlighting */
  onDragOver?: (position?: Position | null) => void;
}

/**
 * DragDropProvider props.
 */
interface DragDropProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Event handlers */
  handlers: DragDropHandlers;
  /** Whether drag and drop is enabled */
  enabled?: boolean;
}

// =============================================================================
// COLLISION DETECTION NOTE
// =============================================================================
// Using closestCenter directly as collision detection strategy.
// closestCenter finds the droppable whose center is closest to the pointer,
// which works well for grid-based layouts.

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DragDropProvider component for Team Builder drag-and-drop functionality.
 * Provides enhanced drag-and-drop with touch support and visual feedback.
 * 
 * @param props - Component props
 * @returns Drag and drop provider component
 * @example
 * <DragDropProvider handlers={dragHandlers}>
 *   <TeamBuilderContent />
 * </DragDropProvider>
 */
export function DragDropProvider({ children, handlers, enabled = true }: DragDropProviderProps) {
  const [activeUnit, setActiveUnit] = useState<UnitTemplate | null>(null);
  
  // Configure sensors for both mouse and touch
  // PointerSensor handles mouse/trackpad with small distance threshold
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // Reduced distance for quicker drag start
    },
  });
  
  // TouchSensor handles touch devices with delay to distinguish from tap
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150, // Short delay to distinguish tap from drag
      tolerance: 8, // Tolerance for finger movement during delay
    },
  });
  
  const sensors = useSensors(pointerSensor, touchSensor);
  
  /**
   * Handle drag start event.
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!enabled) return;
    
    const { active } = event;
    const dragData = active.data.current as UnitDragData;
    
    if (dragData?.type === 'unit') {
      setActiveUnit(dragData.unit);
      handlers.onDragStart?.(dragData.unit, dragData.source);
    }
  }, [enabled, handlers]);
  
  /**
   * Handle drag over event for visual feedback.
   */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!enabled) return;
    
    const { over } = event;
    
    if (over) {
      const dropData = over.data.current as DropData;
      
      if (dropData?.type === 'grid-cell') {
        handlers.onDragOver?.(dropData.position);
      } else {
        handlers.onDragOver?.();
      }
    } else {
      handlers.onDragOver?.();
    }
  }, [enabled, handlers]);
  
  /**
   * Handle drag end event.
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!enabled) return;
    
    const { active, over } = event;
    const dragData = active.data.current as UnitDragData;
    
    if (dragData?.type === 'unit' && over) {
      const dropData = over.data.current as DropData;
      
      if (dropData?.type === 'grid-cell' && dropData.isValidZone) {
        // Drop on grid cell
        handlers.onUnitDropOnGrid?.(
          dragData.unit, 
          dropData.position
        );
      } else if (dropData?.type === 'unit-list') {
        // Drop back to list (removal)
        handlers.onUnitDropOnList?.(
          dragData.unit, 
          dragData.originalPosition
        );
      }
    }
    
    // Reset drag state
    setActiveUnit(null);
    handlers.onDragEnd?.();
    handlers.onDragOver?.();
  }, [enabled, handlers]);
  
  if (!enabled) {
    return <>{children}</>;
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      {/* Drag Overlay for visual feedback */}
      <DragOverlay>
        {activeUnit && (
          <div className="transform rotate-3 scale-105 opacity-90 animate-bounce-in max-w-[120px]">
            <UnitCard
              unit={activeUnit}
              variant="compact"
              className="shadow-2xl border-2 border-yellow-400 animate-pulse-glow w-full"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { 
  UnitDragData, 
  GridDropData, 
  ListDropData, 
  DropData, 
  DragDropHandlers 
};