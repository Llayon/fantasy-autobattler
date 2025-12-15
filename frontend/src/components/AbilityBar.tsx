/**
 * AbilityBar Component for Fantasy Autobattler.
 * Displays a list of unit abilities in a horizontal bar layout.
 * 
 * @fileoverview Ability bar component for showing unit abilities when selected.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AbilityIcon, AbilityData, AbilityIconSkeleton, AbilityIconPlaceholder } from './AbilityIcon';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Unit data for ability display.
 */
export interface UnitAbilityData {
  /** Unit identifier */
  unitId: string;
  /** Unit display name */
  unitName: string;
  /** Unit abilities */
  abilities: AbilityData[];
  /** Whether unit is selected */
  isSelected?: boolean;
  /** Whether unit is alive */
  isAlive?: boolean;
}

/**
 * AbilityBar component props.
 */
export interface AbilityBarProps {
  /** Unit data with abilities */
  unit?: UnitAbilityData;
  /** Size variant for ability icons */
  iconSize?: 'sm' | 'md' | 'lg';
  /** Maximum number of abilities to display */
  maxAbilities?: number;
  /** Whether to show unit name */
  showUnitName?: boolean;
  /** Whether to show ability tooltips */
  showTooltips?: boolean;
  /** Whether to show cooldown indicators */
  showCooldowns?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Click handler for ability activation */
  onAbilityClick?: (ability: AbilityData, unit: UnitAbilityData) => void;
  /** Additional CSS classes */
  className?: string;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get container classes based on orientation and state.
 * 
 * @param orientation - Layout orientation
 * @param isAlive - Whether unit is alive
 * @returns CSS class string
 * @example
 * const classes = getContainerClasses('horizontal', true);
 */
function getContainerClasses(orientation: 'horizontal' | 'vertical', isAlive: boolean): string {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg shadow-sm p-3 transition-all duration-200';
  const orientationClasses = orientation === 'horizontal' ? 'flex flex-row' : 'flex flex-col';
  const stateClasses = isAlive ? 'border-blue-200' : 'border-gray-300 opacity-75';
  
  return cn(baseClasses, orientationClasses, stateClasses);
}

/**
 * Get ability list classes based on orientation.
 * 
 * @param orientation - Layout orientation
 * @returns CSS class string
 * @example
 * const classes = getAbilityListClasses('horizontal');
 */
function getAbilityListClasses(orientation: 'horizontal' | 'vertical'): string {
  const baseClasses = 'flex gap-2';
  const orientationClasses = orientation === 'horizontal' ? 'flex-row' : 'flex-col';
  
  return cn(baseClasses, orientationClasses);
}

/**
 * Get unit name classes based on state.
 * 
 * @param isAlive - Whether unit is alive
 * @param isSelected - Whether unit is selected
 * @returns CSS class string
 * @example
 * const classes = getUnitNameClasses(true, true);
 */
function getUnitNameClasses(isAlive: boolean, isSelected: boolean): string {
  const baseClasses = 'text-sm font-medium truncate';
  
  if (!isAlive) {
    return cn(baseClasses, 'text-gray-500');
  }
  
  if (isSelected) {
    return cn(baseClasses, 'text-blue-700');
  }
  
  return cn(baseClasses, 'text-gray-700');
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Unit name display component.
 * 
 * @param props - Component props
 * @returns JSX element
 */
function UnitNameDisplay({
  unitName,
  isAlive = true,
  isSelected = false,
  orientation,
}: {
  unitName: string;
  isAlive?: boolean;
  isSelected?: boolean;
  orientation: 'horizontal' | 'vertical';
}): JSX.Element {
  return (
    <div className={cn(
      'flex items-center',
      orientation === 'horizontal' ? 'mr-3 min-w-0' : 'mb-2'
    )}>
      <h3 className={getUnitNameClasses(isAlive, isSelected)}>
        {unitName}
        {!isAlive && ' (Мертв)'}
      </h3>
      
      {isSelected && (
        <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

/**
 * Loading state component.
 * 
 * @param props - Component props
 * @returns JSX element
 */
function AbilityBarSkeleton({
  iconSize,
  maxAbilities,
  orientation,
  showUnitName,
}: {
  iconSize: 'sm' | 'md' | 'lg';
  maxAbilities: number;
  orientation: 'horizontal' | 'vertical';
  showUnitName: boolean;
}): JSX.Element {
  return (
    <div className={getContainerClasses(orientation, true)}>
      {showUnitName && (
        <div className={cn(
          'animate-pulse',
          orientation === 'horizontal' ? 'mr-3' : 'mb-2'
        )}>
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      )}
      
      <div className={getAbilityListClasses(orientation)}>
        {Array.from({ length: maxAbilities }, (_, index) => (
          <AbilityIconSkeleton key={index} size={iconSize} />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state component.
 * 
 * @param props - Component props
 * @returns JSX element
 */
function EmptyAbilityBar({
  iconSize,
  maxAbilities,
  orientation,
  showUnitName,
}: {
  iconSize: 'sm' | 'md' | 'lg';
  maxAbilities: number;
  orientation: 'horizontal' | 'vertical';
  showUnitName: boolean;
}): JSX.Element {
  return (
    <div className={cn(
      getContainerClasses(orientation, true),
      'border-dashed border-gray-300 bg-gray-50'
    )}>
      {showUnitName && (
        <div className={cn(
          'text-sm text-gray-500',
          orientation === 'horizontal' ? 'mr-3' : 'mb-2'
        )}>
          Выберите юнита
        </div>
      )}
      
      <div className={getAbilityListClasses(orientation)}>
        {Array.from({ length: maxAbilities }, (_, index) => (
          <AbilityIconPlaceholder key={index} size={iconSize} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AbilityBar component for displaying unit abilities.
 * Shows abilities in a horizontal or vertical layout with optional unit name.
 * 
 * @param props - Component props
 * @returns JSX element
 * @example
 * <AbilityBar
 *   unit={selectedUnit}
 *   iconSize="md"
 *   showUnitName={true}
 *   showTooltips={true}
 *   onAbilityClick={handleAbilityClick}
 * />
 */
export function AbilityBar({
  unit,
  iconSize = 'md',
  maxAbilities = 4,
  showUnitName = true,
  showTooltips = true,
  showCooldowns = true,
  isLoading = false,
  onAbilityClick,
  className,
  orientation = 'horizontal',
}: AbilityBarProps): JSX.Element {
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <AbilityBarSkeleton
          iconSize={iconSize}
          maxAbilities={maxAbilities}
          orientation={orientation}
          showUnitName={showUnitName}
        />
      </div>
    );
  }
  
  // Empty state
  if (!unit) {
    return (
      <div className={className}>
        <EmptyAbilityBar
          iconSize={iconSize}
          maxAbilities={maxAbilities}
          orientation={orientation}
          showUnitName={showUnitName}
        />
      </div>
    );
  }
  
  const isAlive = unit.isAlive ?? true;
  const isSelected = unit.isSelected ?? false;
  
  /**
   * Handle ability click.
   * 
   * @param ability - Clicked ability
   */
  const handleAbilityClick = (ability: AbilityData): void => {
    if (onAbilityClick && isAlive) {
      onAbilityClick(ability, unit);
    }
  };
  
  // Pad abilities to maxAbilities with placeholders
  const displayAbilities = [...unit.abilities];
  while (displayAbilities.length < maxAbilities) {
    displayAbilities.push({
      id: `placeholder-${displayAbilities.length}`,
      name: 'Нет способности',
      description: 'Слот для способности пуст',
      type: 'active' as const,
      icon: 'default',
      isDisabled: true,
    });
  }
  
  return (
    <div className={cn(className)}>
      <div className={getContainerClasses(orientation, isAlive)}>
        {/* Unit Name */}
        {showUnitName && (
          <UnitNameDisplay
            unitName={unit.unitName}
            isAlive={isAlive}
            isSelected={isSelected}
            orientation={orientation}
          />
        )}
        
        {/* Abilities List */}
        <div className={getAbilityListClasses(orientation)}>
          {displayAbilities.slice(0, maxAbilities).map((ability) => {
            const isPlaceholder = ability.id.startsWith('placeholder-');
            
            if (isPlaceholder) {
              return (
                <AbilityIconPlaceholder
                  key={ability.id}
                  size={iconSize}
                />
              );
            }
            
            return (
              <AbilityIcon
                key={ability.id}
                ability={{
                  ...ability,
                  isDisabled: ability.isDisabled || !isAlive,
                }}
                size={iconSize}
                showTooltip={showTooltips}
                showCooldown={showCooldowns}
                onClick={handleAbilityClick}
                interactive={isAlive && !ability.isDisabled}
              />
            );
          })}
        </div>
        
        {/* Status Indicators */}
        {!isAlive && (
          <div className={cn(
            'text-xs text-red-500 font-medium',
            orientation === 'horizontal' ? 'ml-3' : 'mt-2'
          )}>
            Юнит мертв
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Compact AbilityBar for small spaces.
 * 
 * @param props - Component props
 * @returns JSX element
 * @example
 * <CompactAbilityBar unit={unit} onAbilityClick={handleClick} />
 */
export function CompactAbilityBar({
  unit,
  onAbilityClick,
  className,
}: {
  unit?: UnitAbilityData;
  onAbilityClick?: (ability: AbilityData, unit: UnitAbilityData) => void;
  className?: string;
}): JSX.Element {
  return (
    <AbilityBar
      unit={unit}
      iconSize="sm"
      maxAbilities={2}
      showUnitName={false}
      showTooltips={true}
      showCooldowns={true}
      onAbilityClick={onAbilityClick}
      className={className}
      orientation="horizontal"
    />
  );
}

/**
 * Vertical AbilityBar for sidebar layouts.
 * 
 * @param props - Component props
 * @returns JSX element
 * @example
 * <VerticalAbilityBar unit={unit} onAbilityClick={handleClick} />
 */
export function VerticalAbilityBar({
  unit,
  onAbilityClick,
  className,
}: {
  unit?: UnitAbilityData;
  onAbilityClick?: (ability: AbilityData, unit: UnitAbilityData) => void;
  className?: string;
}): JSX.Element {
  return (
    <AbilityBar
      unit={unit}
      iconSize="md"
      maxAbilities={4}
      showUnitName={true}
      showTooltips={true}
      showCooldowns={true}
      onAbilityClick={onAbilityClick}
      className={className}
      orientation="vertical"
    />
  );
}

export default AbilityBar;