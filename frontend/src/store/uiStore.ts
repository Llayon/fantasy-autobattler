/**
 * UI settings store for Fantasy Autobattler.
 * Manages user interface preferences and debug settings.
 * 
 * @fileoverview Global UI state management with Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI settings state interface.
 */
interface UIState {
  /** Show debug information (coordinates on grid cells) */
  showDebugInfo: boolean;
  /** Show advanced statistics */
  showAdvancedStats: boolean;
  /** Animation speed multiplier */
  animationSpeed: number;
}

/**
 * UI settings actions interface.
 */
interface UIActions {
  /** Toggle debug information display */
  toggleDebugInfo: () => void;
  /** Set debug info state */
  setDebugInfo: (show: boolean) => void;
  /** Toggle advanced statistics */
  toggleAdvancedStats: () => void;
  /** Set animation speed */
  setAnimationSpeed: (speed: number) => void;
  /** Reset all settings to defaults */
  resetSettings: () => void;
}

/**
 * UI settings store type.
 */
type UIStore = UIState & UIActions;

/**
 * Default UI settings.
 */
const defaultSettings: UIState = {
  showDebugInfo: false,
  showAdvancedStats: false,
  animationSpeed: 1,
};

/**
 * UI settings store with persistence.
 * Settings are saved to localStorage and restored on page load.
 * 
 * @example
 * // Toggle debug mode
 * const { showDebugInfo, toggleDebugInfo } = useUIStore();
 * 
 * // Use in component
 * {showDebugInfo && <div>Debug info</div>}
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // State
      ...defaultSettings,

      // Actions
      toggleDebugInfo: () => {
        set((state) => ({ showDebugInfo: !state.showDebugInfo }));
      },

      setDebugInfo: (show: boolean) => {
        set({ showDebugInfo: show });
      },

      toggleAdvancedStats: () => {
        set((state) => ({ showAdvancedStats: !state.showAdvancedStats }));
      },

      setAnimationSpeed: (speed: number) => {
        set({ animationSpeed: Math.max(0.25, Math.min(4, speed)) });
      },

      resetSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'autobattler-ui-settings',
    }
  )
);

/**
 * Selectors for UI store.
 */
export const selectShowDebugInfo = (state: UIStore) => state.showDebugInfo;
export const selectShowAdvancedStats = (state: UIStore) => state.showAdvancedStats;
export const selectAnimationSpeed = (state: UIStore) => state.animationSpeed;
