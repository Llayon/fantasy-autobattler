/**
 * Virtualized Unit List component for Fantasy Autobattler.
 * Optimized for large unit lists using react-window for performance.
 * 
 * @fileoverview High-performance unit list with virtualization for 20+ units.
 */

'use client';

import { memo, useMemo, useCallback } from 'react';
import { List } from 'react-window';
import { UnitTemplate } from '@/types/game';
import { UnitCard } from './UnitCard';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum number of units to enable virtualization */
const VIRTUALIZATION_THRESHOLD = 20;

/** Height of each unit item in pixels */
const ITEM_HEIGHT = 120;

/** Number of items to render outside visible area */
const OVERSCAN_COUNT = 5;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for virtualized unit list.
 */
interface VirtualizedUnitListProps {
  /** Array of units to display */
  units: UnitTemplate[];
  /** Height of the container */
  height: number;
  /** Unit selection handler */
  onUnitSelect?: (unit: UnitTemplate) => void;
  /** Unit long press handler */
  onUnitLongPress?: (unit: UnitTemplate) => void;
  /** Selected unit */
  selectedUnit?: UnitTemplate | null;
  /** Disabled units */
  disabledUnits?: string[];
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for individual unit item.
 */
interface UnitItemProps {
  /** Item index */
  index: number;
  /** Item style from react-window */
  style: React.CSSProperties;
  /** Item data */
  data: {
    units: UnitTemplate[];
    onUnitSelect?: (unit: UnitTemplate) => void;
    onUnitLongPress?: (unit: UnitTemplate) => void;
    selectedUnit?: UnitTemplate | null;
    disabledUnits?: string[];
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Individual unit item component for virtualized list.
 * Memoized to prevent unnecessary re-renders.
 */
const UnitItem = memo(function UnitItem({ index, style, data }: UnitItemProps) {
  const { units, onUnitSelect, onUnitLongPress, selectedUnit, disabledUnits } = data;
  const unit = units[index];
  
  const isSelected = selectedUnit?.id === unit?.id;
  const isDisabled = disabledUnits?.includes(unit?.id || '') || false;
  
  const handleClick = useCallback(() => {
    if (unit && !isDisabled && onUnitSelect) {
      onUnitSelect(unit);
    }
  }, [unit, isDisabled, onUnitSelect]);
  
  const handleLongPress = useCallback(() => {
    if (unit && onUnitLongPress) {
      onUnitLongPress(unit);
    }
  }, [unit, onUnitLongPress]);
  
  if (!unit) {
    return null;
  }
  
  return (
    <div style={style} className="px-2">
      <UnitCard
        unit={unit}
        variant="list"
        selected={isSelected}
        disabled={isDisabled}
        onClick={handleClick}
        onLongPress={handleLongPress}
        className="h-full"
      />
    </div>
  );
});

/**
 * Virtualized unit list component.
 * Uses react-window for optimal performance with large lists.
 * 
 * @param props - Component props
 * @returns Virtualized unit list or regular list for small datasets
 * @example
 * <VirtualizedUnitList
 *   units={allUnits}
 *   height={400}
 *   onUnitSelect={handleUnitSelect}
 *   selectedUnit={selectedUnit}
 * />
 */
const VirtualizedUnitList = memo(function VirtualizedUnitList({
  units,
  height,
  onUnitSelect,
  onUnitLongPress,
  selectedUnit,
  disabledUnits,
  className = '',
}: VirtualizedUnitListProps) {
  
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    units,
    onUnitSelect,
    onUnitLongPress,
    selectedUnit,
    disabledUnits,
  }), [units, onUnitSelect, onUnitLongPress, selectedUnit, disabledUnits]);
  
  // Use virtualization only for large lists
  const shouldVirtualize = units.length >= VIRTUALIZATION_THRESHOLD;
  
  if (!shouldVirtualize) {
    // Render regular list for small datasets
    return (
      <div className={`space-y-2 ${className}`} style={{ height }}>
        {units.map((unit, index) => (
          <UnitItem
            key={unit.id}
            index={index}
            style={{ height: ITEM_HEIGHT }}
            data={itemData}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <List
        height={height}
        itemCount={units.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        overscanCount={OVERSCAN_COUNT}
        className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {UnitItem}
      </List>
    </div>
  );
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate optimal height for virtualized list based on available space.
 * 
 * @param containerHeight - Available container height
 * @param itemCount - Number of items
 * @param maxItems - Maximum items to show without scrolling
 * @returns Optimal height for the list
 * @example
 * const height = calculateOptimalHeight(600, 50, 5);
 */
export function calculateOptimalHeight(
  containerHeight: number,
  itemCount: number,
  maxItems: number = 5
): number {
  const maxHeight = maxItems * ITEM_HEIGHT;
  const requiredHeight = Math.min(itemCount * ITEM_HEIGHT, containerHeight);
  
  return Math.min(requiredHeight, maxHeight);
}

/**
 * Check if virtualization should be enabled for given unit count.
 * 
 * @param unitCount - Number of units
 * @returns Whether to use virtualization
 * @example
 * const shouldVirtualize = shouldUseVirtualization(25); // true
 */
export function shouldUseVirtualization(unitCount: number): boolean {
  return unitCount >= VIRTUALIZATION_THRESHOLD;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { VirtualizedUnitList };
export type { VirtualizedUnitListProps };
export { VIRTUALIZATION_THRESHOLD, ITEM_HEIGHT };