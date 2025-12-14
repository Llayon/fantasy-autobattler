/**
 * UnitList component for Fantasy Autobattler.
 * Provides filtering, sorting, and selection interface for all available units.
 * 
 * @fileoverview Comprehensive unit browsing component with drag-and-drop support.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { UnitTemplate, UnitRole, UnitId } from '@/types/game';
import { UnitCard } from './UnitCard';
import { getRoleName } from '@/lib/roleColors';
import { DraggableUnit } from './DraggableUnit';
import { DroppableUnitList } from './DroppableUnitList';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Sort options for unit list.
 */
type SortOption = 'name' | 'cost' | 'role' | 'hp' | 'atk';

/**
 * Sort direction.
 */
type SortDirection = 'asc' | 'desc';

/**
 * Filter configuration for units.
 */
interface UnitFilter {
  /** Filter by unit role */
  role?: UnitRole | 'all';
  /** Search query for unit name */
  search?: string;
  /** Minimum cost filter */
  minCost?: number;
  /** Maximum cost filter */
  maxCost?: number;
}

/**
 * UnitList component props.
 */
interface UnitListProps {
  /** Array of available units */
  units: UnitTemplate[];
  /** Current filter configuration */
  filter?: UnitFilter;
  /** Callback when unit is selected */
  onUnitSelect?: (unit: UnitTemplate) => void;
  /** Callback when unit is long pressed (for detail modal) */
  onUnitLongPress?: (unit: UnitTemplate) => void;
  /** Units that should be disabled (already in team) */
  disabledUnits?: UnitId[];
  /** Currently selected unit */
  selectedUnit?: UnitTemplate | null;
  /** Whether to show units in compact mode */
  compact?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Whether drag-and-drop is enabled */
  enableDragDrop?: boolean;
  /** Maximum number of units to display */
  maxUnits?: number;
  /** Whether to hide filter and sort controls */
  hideFilters?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Available sort options with labels.
 */
const SORT_OPTIONS: Record<SortOption, string> = {
  name: 'По имени',
  cost: 'По стоимости',
  role: 'По роли',
  hp: 'По здоровью',
  atk: 'По атаке',
};

/**
 * Role filter options.
 */
const ROLE_FILTER_OPTIONS: Array<{ value: UnitRole | 'all'; label: string }> = [
  { value: 'all', label: 'Все роли' },
  { value: 'tank', label: getRoleName('tank') },
  { value: 'melee_dps', label: getRoleName('melee_dps') },
  { value: 'ranged_dps', label: getRoleName('ranged_dps') },
  { value: 'mage', label: getRoleName('mage') },
  { value: 'support', label: getRoleName('support') },
  { value: 'control', label: getRoleName('control') },
];

/**
 * Cost range options.
 */
const COST_RANGES = [
  { min: 3, max: 4, label: '3-4 очка' },
  { min: 5, max: 6, label: '5-6 очков' },
  { min: 7, max: 8, label: '7-8 очков' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Filter units based on filter configuration.
 * 
 * @param units - Array of units to filter
 * @param filter - Filter configuration
 * @returns Filtered units array
 */
function filterUnits(units: UnitTemplate[], filter: UnitFilter): UnitTemplate[] {
  return units.filter(unit => {
    // Role filter
    if (filter.role && filter.role !== 'all' && unit.role !== filter.role) {
      return false;
    }
    
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const nameMatch = unit.name.toLowerCase().includes(searchLower);
      const roleMatch = getRoleName(unit.role).toLowerCase().includes(searchLower);
      if (!nameMatch && !roleMatch) {
        return false;
      }
    }
    
    // Cost range filter
    if (filter.minCost !== undefined && unit.cost < filter.minCost) {
      return false;
    }
    if (filter.maxCost !== undefined && unit.cost > filter.maxCost) {
      return false;
    }
    
    return true;
  });
}

/**
 * Sort units based on sort option and direction.
 * 
 * @param units - Array of units to sort
 * @param sortBy - Sort field
 * @param direction - Sort direction
 * @returns Sorted units array
 */
function sortUnits(
  units: UnitTemplate[], 
  sortBy: SortOption, 
  direction: SortDirection
): UnitTemplate[] {
  const sorted = [...units].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'cost':
        comparison = a.cost - b.cost;
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'hp':
        comparison = a.stats.hp - b.stats.hp;
        break;
      case 'atk':
        comparison = a.stats.atk - b.stats.atk;
        break;
      default:
        return 0;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

/**
 * Check if unit is disabled.
 * 
 * @param unit - Unit to check
 * @param disabledUnits - Array of disabled unit IDs
 * @returns True if unit is disabled
 */
function isUnitDisabled(unit: UnitTemplate, disabledUnits: UnitId[]): boolean {
  return disabledUnits.includes(unit.id);
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Cost filter options for dropdown.
 */
const COST_FILTER_OPTIONS: Array<{ value: string; label: string; min?: number; max?: number }> = [
  { value: 'all', label: 'Все' },
  { value: 'low', label: '3-4', min: 3, max: 4 },
  { value: 'medium', label: '5-6', min: 5, max: 6 },
  { value: 'high', label: '7-8', min: 7, max: 8 },
];

/**
 * Compact filter bar props.
 */
interface CompactFilterBarProps {
  /** Current filter configuration */
  filter: UnitFilter;
  /** Filter change handler */
  onFilterChange: (filter: UnitFilter) => void;
  /** Current sort field */
  sortBy: SortOption;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Sort change handler */
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
  /** Number of filtered units */
  unitCount: number;
  /** Total number of units */
  totalCount: number;
}

/**
 * Compact filter bar with Role, Cost, and Sort dropdowns in a single row.
 * 
 * @param props - Component props
 * @returns Compact filter bar component
 */
function CompactFilterBar({
  filter,
  onFilterChange,
  sortBy,
  sortDirection,
  onSortChange,
  unitCount,
  totalCount,
}: CompactFilterBarProps) {
  /**
   * Handle role filter change.
   */
  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, role: e.target.value as UnitRole | 'all' });
  }, [filter, onFilterChange]);

  /**
   * Handle cost filter change.
   */
  const handleCostChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = COST_FILTER_OPTIONS.find(opt => opt.value === e.target.value);
    onFilterChange({
      ...filter,
      minCost: option?.min,
      maxCost: option?.max,
    });
  }, [filter, onFilterChange]);

  /**
   * Handle sort change with direction toggle.
   */
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value as SortOption;
    // Toggle direction if same field selected, otherwise default to ascending
    const newDirection = sortBy === newSortBy 
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : 'asc';
    onSortChange(newSortBy, newDirection);
  }, [sortBy, sortDirection, onSortChange]);

  /**
   * Get current cost filter value for dropdown.
   */
  const getCurrentCostValue = (): string => {
    if (!filter.minCost && !filter.maxCost) return 'all';
    const option = COST_FILTER_OPTIONS.find(
      opt => opt.min === filter.minCost && opt.max === filter.maxCost
    );
    return option?.value || 'all';
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Role filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 whitespace-nowrap">Роль:</label>
        <select
          value={filter.role || 'all'}
          onChange={handleRoleChange}
          className="min-h-[36px] px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {ROLE_FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cost filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 whitespace-nowrap">Цена:</label>
        <select
          value={getCurrentCostValue()}
          onChange={handleCostChange}
          className="min-h-[36px] px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {COST_FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 whitespace-nowrap">Сорт:</label>
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="min-h-[36px] px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Object.entries(SORT_OPTIONS).map(([key, label]) => (
            <option key={key} value={key}>
              {label} {sortBy === key ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="ml-auto text-xs text-gray-500">
        {unitCount}/{totalCount}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UnitList component for browsing and selecting units.
 * Provides comprehensive filtering, sorting, and selection interface.
 * 
 * @example
 * <UnitList
 *   units={availableUnits}
 *   filter={{ role: 'tank', search: 'knight' }}
 *   onUnitSelect={handleUnitSelect}
 *   disabledUnits={teamUnitIds}
 *   selectedUnit={selectedUnit}
 *   compact
 * />
 */
export function UnitList({
  units,
  filter = { role: 'all' },
  onUnitSelect,
  onUnitLongPress,
  disabledUnits = [],
  selectedUnit,
  compact = false,
  className = '',
  enableDragDrop = false,
  maxUnits,
  hideFilters = false,
}: UnitListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentFilter, setCurrentFilter] = useState<UnitFilter>(filter);
  
  // Process units: filter, sort, and limit
  const processedUnits = useMemo(() => {
    let result = filterUnits(units, currentFilter);
    result = sortUnits(result, sortBy, sortDirection);
    
    if (maxUnits && result.length > maxUnits) {
      result = result.slice(0, maxUnits);
    }
    
    return result;
  }, [units, currentFilter, sortBy, sortDirection, maxUnits]);
  
  const handleSortChange = useCallback((newSortBy: SortOption, newDirection: SortDirection) => {
    setSortBy(newSortBy);
    setSortDirection(newDirection);
  }, []);
  
  const handleUnitClick = useCallback((unit: UnitTemplate) => {
    if (!isUnitDisabled(unit, disabledUnits) && onUnitSelect) {
      onUnitSelect(unit);
    }
  }, [disabledUnits, onUnitSelect]);

  /**
   * Handle unit long press to show detail modal.
   * 
   * @param unit - Unit that was long pressed
   */
  const handleUnitLongPress = useCallback((unit: UnitTemplate) => {
    if (onUnitLongPress) {
      onUnitLongPress(unit);
    }
  }, [onUnitLongPress]);
  

  
  return (
    <DroppableUnitList enabled={enableDragDrop} className={`space-y-3 ${className}`}>
      {/* Compact filter bar - only show if not hidden */}
      {!hideFilters && (
        <CompactFilterBar
          filter={currentFilter}
          onFilterChange={setCurrentFilter}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          unitCount={processedUnits.length}
          totalCount={units.length}
        />
      )}
      
      {/* Units grid */}
      <div className={`
        grid gap-2 sm:gap-3 md:gap-4 animate-fade-in-scale
        ${compact 
          ? 'grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }
      `}>
        {processedUnits.map((unit, index) => {
          const disabled = isUnitDisabled(unit, disabledUnits);
          const selected = selectedUnit?.id === unit.id;
          
          return enableDragDrop && !disabled ? (
            <div 
              key={unit.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <DraggableUnit
                unit={unit}
                id={`unit-list-${unit.id}-${index}`}
                source="list"
                originalIndex={index}
                selected={selected}
                disabled={disabled}
                size={compact ? 'compact' : 'full'}
                onClick={() => handleUnitClick(unit)}
                onLongPress={() => handleUnitLongPress(unit)}
                showAbilities={!compact}
                className="relative"
              />
            </div>
          ) : (
            <div
              key={unit.id}
              className={`relative animate-slide-up ${disabled ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <UnitCard
                unit={unit}
                variant={compact ? 'compact' : 'list'}
                selected={selected}
                disabled={disabled}
                onClick={() => handleUnitClick(unit)}
                onLongPress={() => handleUnitLongPress(unit)}
              />
              
              {/* Disabled overlay */}
              {disabled && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center animate-fade-in-scale">
                  <span className="text-sm font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded">
                    В команде
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {processedUnits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Юниты не найдены</div>
          <div className="text-gray-500 text-sm">
            Попробуйте изменить фильтры или поисковый запрос
          </div>
        </div>
      )}
      
      {/* Drag hint */}
      {enableDragDrop && processedUnits.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          💡 Перетащите юнита на поле боя для добавления в команду
        </div>
      )}
    </DroppableUnitList>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { UnitListProps, UnitFilter, SortOption, SortDirection };
export { SORT_OPTIONS, ROLE_FILTER_OPTIONS, COST_RANGES };