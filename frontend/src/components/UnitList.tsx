/**
 * UnitList component for Fantasy Autobattler.
 * Provides filtering, sorting, and selection interface for all available units.
 * 
 * @fileoverview Comprehensive unit browsing component with drag-and-drop support.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { UnitTemplate, UnitRole, UnitId } from '@/types/game';
import { UnitCard, ROLE_NAMES } from './UnitCard';

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
  { value: 'tank', label: ROLE_NAMES.tank },
  { value: 'melee_dps', label: ROLE_NAMES.melee_dps },
  { value: 'ranged_dps', label: ROLE_NAMES.ranged_dps },
  { value: 'mage', label: ROLE_NAMES.mage },
  { value: 'support', label: ROLE_NAMES.support },
  { value: 'control', label: ROLE_NAMES.control },
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
      const roleMatch = ROLE_NAMES[unit.role].toLowerCase().includes(searchLower);
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
 * Filter controls component.
 */
interface FilterControlsProps {
  filter: UnitFilter;
  onFilterChange: (filter: UnitFilter) => void;
  unitCount: number;
  totalCount: number;
}

function FilterControls({ filter, onFilterChange, unitCount, totalCount }: FilterControlsProps) {
  const handleRoleChange = useCallback((role: UnitRole | 'all') => {
    onFilterChange({ ...filter, role });
  }, [filter, onFilterChange]);
  
  const handleSearchChange = useCallback((search: string) => {
    onFilterChange({ ...filter, search });
  }, [filter, onFilterChange]);
  
  const handleCostRangeChange = useCallback((minCost?: number, maxCost?: number) => {
    onFilterChange({ ...filter, minCost, maxCost });
  }, [filter, onFilterChange]);
  
  const clearFilters = useCallback(() => {
    onFilterChange({ role: 'all', search: '', minCost: undefined, maxCost: undefined });
  }, [onFilterChange]);
  
  return (
    <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Поиск по имени
        </label>
        <input
          type="text"
          value={filter.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Введите имя юнита..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Role filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Роль
        </label>
        <select
          value={filter.role || 'all'}
          onChange={(e) => handleRoleChange(e.target.value as UnitRole | 'all')}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ROLE_FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Cost range */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Стоимость
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCostRangeChange(undefined, undefined)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              !filter.minCost && !filter.maxCost
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Все
          </button>
          {COST_RANGES.map(range => (
            <button
              key={`${range.min}-${range.max}`}
              onClick={() => handleCostRangeChange(range.min, range.max)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter.minCost === range.min && filter.maxCost === range.max
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Results count and clear */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-600">
        <span className="text-sm text-gray-400">
          Показано: {unitCount} из {totalCount}
        </span>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}

/**
 * Sort controls component.
 */
interface SortControlsProps {
  sortBy: SortOption;
  direction: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
}

function SortControls({ sortBy, direction, onSortChange }: SortControlsProps) {
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    const newDirection = sortBy === newSortBy && direction === 'asc' ? 'desc' : 'asc';
    onSortChange(newSortBy, newDirection);
  }, [sortBy, direction, onSortChange]);
  
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
      <span className="text-sm font-medium text-gray-300">Сортировка:</span>
      <div className="flex flex-wrap gap-2">
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleSortChange(key as SortOption)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
              sortBy === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {label}
            {sortBy === key && (
              <span className="text-xs">
                {direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
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
  disabledUnits = [],
  selectedUnit,
  compact = false,
  className = '',
  enableDragDrop = false,
  maxUnits,
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
  
  const handleDragStart = useCallback((e: React.DragEvent, unit: UnitTemplate) => {
    if (!enableDragDrop || isUnitDisabled(unit, disabledUnits)) {
      e.preventDefault();
      return;
    }
    
    // Set drag data for drop handling
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'unit',
      unit: unit,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, [enableDragDrop, disabledUnits]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter controls */}
      <FilterControls
        filter={currentFilter}
        onFilterChange={setCurrentFilter}
        unitCount={processedUnits.length}
        totalCount={units.length}
      />
      
      {/* Sort controls */}
      <SortControls
        sortBy={sortBy}
        direction={sortDirection}
        onSortChange={handleSortChange}
      />
      
      {/* Units grid */}
      <div className={`
        grid gap-4
        ${compact 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }
      `}>
        {processedUnits.map(unit => {
          const disabled = isUnitDisabled(unit, disabledUnits);
          const selected = selectedUnit?.id === unit.id;
          
          return (
            <div
              key={unit.id}
              draggable={enableDragDrop && !disabled}
              onDragStart={(e) => handleDragStart(e, unit)}
              className={`
                ${enableDragDrop && !disabled ? 'cursor-grab active:cursor-grabbing' : ''}
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              <UnitCard
                unit={unit}
                size={compact ? 'compact' : 'full'}
                selected={selected}
                disabled={disabled}
                onClick={() => handleUnitClick(unit)}
                showAbilities={!compact}
              />
              
              {/* Disabled overlay */}
              {disabled && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
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
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { UnitListProps, UnitFilter, SortOption, SortDirection };
export { SORT_OPTIONS, ROLE_FILTER_OPTIONS, COST_RANGES };