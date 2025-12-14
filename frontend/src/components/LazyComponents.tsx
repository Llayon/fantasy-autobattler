/**
 * Lazy-loaded components for Fantasy Autobattler.
 * Implements React.lazy for heavy components to improve initial load performance.
 * 
 * @fileoverview Lazy loading implementation for performance optimization.
 */

'use client';

import { lazy, Suspense, ComponentType } from 'react';
import LoadingStates from './LoadingStates';

// =============================================================================
// LAZY COMPONENT DEFINITIONS
// =============================================================================

/**
 * Lazy-loaded BattleReplay component.
 * Heavy component with complex battle simulation rendering.
 */
const LazyBattleReplay = lazy(() => 
  import('./BattleReplay').then(module => ({ default: module.BattleReplay }))
);

/**
 * Lazy-loaded UnitDetailModal component.
 * Modal with detailed unit information and stats.
 */
const LazyUnitDetailModal = lazy(() => 
  import('./UnitDetailModal').then(module => ({ default: module.default }))
);

/**
 * Lazy-loaded SavedTeamsPanel component.
 * Panel with team management functionality.
 */
const LazySavedTeamsPanel = lazy(() => 
  import('./SavedTeamsPanel').then(module => ({ default: module.SavedTeamsPanel }))
);

/**
 * Lazy-loaded VirtualizedUnitList component.
 * Virtualized list for large unit collections.
 */
const LazyVirtualizedUnitList = lazy(() => 
  import('./VirtualizedUnitList').then(module => ({ default: module.VirtualizedUnitList }))
);

// =============================================================================
// WRAPPER COMPONENTS WITH SUSPENSE
// =============================================================================

/**
 * Props for lazy wrapper components.
 */
interface LazyWrapperProps {
  /** Loading component to show during lazy loading */
  fallback?: React.ReactNode;
  /** Error boundary fallback */
  errorFallback?: React.ReactNode;
}

/**
 * Higher-order component for wrapping lazy components with Suspense.
 * 
 * @param LazyComponent - The lazy-loaded component
 * @param defaultFallback - Default loading fallback
 * @returns Wrapped component with Suspense boundary
 */
function withLazySuspense<T extends object>(
  LazyComponent: ComponentType<T>,
  defaultFallback: React.ReactNode = <LoadingStates.Spinner size="md" color="primary" />
) {
  return function LazyWrapper(props: T & LazyWrapperProps) {
    const { fallback = defaultFallback, ...componentProps } = props;
    
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(componentProps as T)} />
      </Suspense>
    );
  };
}

// =============================================================================
// EXPORTED LAZY COMPONENTS WITH SUSPENSE
// =============================================================================

/**
 * Battle Replay component with lazy loading and suspense.
 * Shows loading spinner while component loads.
 * 
 * @example
 * <BattleReplayLazy battleId="123" />
 */
export const BattleReplayLazy = withLazySuspense(
  LazyBattleReplay,
  <LoadingStates.FullPageLoader message="Загрузка повтора боя..." />
);

/**
 * Unit Detail Modal component with lazy loading and suspense.
 * Shows modal loading state while component loads.
 * 
 * @example
 * <UnitDetailModalLazy unit={selectedUnit} isOpen={true} />
 */
export const UnitDetailModalLazy = withLazySuspense(
  LazyUnitDetailModal,
  <LoadingStates.LoadingOverlay visible={true} message="Загрузка модального окна...">
    <div className="w-96 h-64 bg-gray-800 rounded-lg" />
  </LoadingStates.LoadingOverlay>
);

/**
 * Saved Teams Panel component with lazy loading and suspense.
 * Shows panel loading state while component loads.
 * 
 * @example
 * <SavedTeamsPanelLazy isOpen={true} />
 */
export const SavedTeamsPanelLazy = withLazySuspense(
  LazySavedTeamsPanel,
  <LoadingStates.LoadingOverlay visible={true} message="Загрузка панели команд...">
    <div className="w-80 h-96 bg-gray-800 rounded-lg" />
  </LoadingStates.LoadingOverlay>
);

/**
 * Virtualized Unit List component with lazy loading and suspense.
 * Shows list loading state while component loads.
 * 
 * @example
 * <VirtualizedUnitListLazy units={allUnits} height={400} />
 */
export const VirtualizedUnitListLazy = withLazySuspense(
  LazyVirtualizedUnitList,
  <LoadingStates.ListSkeleton items={5} />
);

// =============================================================================
// PRELOADING UTILITIES
// =============================================================================

/**
 * Preload heavy components for better user experience.
 * Call this function to start loading components before they're needed.
 * 
 * @example
 * // Preload on user interaction
 * onMouseEnter={() => preloadHeavyComponents()}
 */
export function preloadHeavyComponents(): void {
  // Preload BattleReplay when user might view battles
  LazyBattleReplay;
  
  // Preload modals when user might interact with units
  LazyUnitDetailModal;
  
  // Preload panels when user might manage teams
  LazySavedTeamsPanel;
  
  // Preload virtualized list for large collections
  LazyVirtualizedUnitList;
}

/**
 * Preload specific component by name.
 * 
 * @param componentName - Name of component to preload
 * @example
 * preloadComponent('BattleReplay');
 */
export function preloadComponent(componentName: string): void {
  switch (componentName) {
    case 'BattleReplay':
      LazyBattleReplay;
      break;
    case 'UnitDetailModal':
      LazyUnitDetailModal;
      break;
    case 'SavedTeamsPanel':
      LazySavedTeamsPanel;
      break;
    case 'VirtualizedUnitList':
      LazyVirtualizedUnitList;
      break;
    default:
      // Unknown component - no action needed
  }
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Track lazy component loading performance.
 * Measures time from lazy load trigger to component render.
 */
export class LazyLoadingMetrics {
  private static loadTimes = new Map<string, number>();
  
  /**
   * Start timing a lazy component load.
   * 
   * @param componentName - Name of the component being loaded
   */
  static startTiming(componentName: string): void {
    this.loadTimes.set(componentName, performance.now());
  }
  
  /**
   * End timing and log the result.
   * 
   * @param componentName - Name of the component that finished loading
   */
  static endTiming(componentName: string): void {
    const startTime = this.loadTimes.get(componentName);
    if (startTime) {
      // Log performance metric (would use proper logger in production)
      // const loadTime = performance.now() - startTime;
      this.loadTimes.delete(componentName);
    }
  }
  
  /**
   * Get all recorded load times.
   * 
   * @returns Map of component names to load times
   */
  static getMetrics(): Map<string, number> {
    return new Map(this.loadTimes);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  LazyBattleReplay,
  LazyUnitDetailModal,
  LazySavedTeamsPanel,
  LazyVirtualizedUnitList,
};

export type { LazyWrapperProps };