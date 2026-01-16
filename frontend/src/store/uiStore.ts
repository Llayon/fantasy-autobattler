/**
 * UI settings store for Fantasy Autobattler.
 * Manages user interface preferences and debug settings.
 * 
 * @fileoverview Global UI state management with Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// MECHANICS 2.0 TYPES
// =============================================================================

/**
 * Available mechanics preset names.
 * - mvp: All mechanics disabled (Core 1.0 behavior)
 * - tactical: Tier 0-2 mechanics (facing, flanking, riposte, etc.)
 * - roguelike: All 14 mechanics enabled
 * - custom: User-defined configuration
 */
export type MechanicsPreset = 'mvp' | 'tactical' | 'roguelike' | 'custom';

/**
 * Individual mechanic toggle state.
 * Each mechanic can be enabled or disabled independently in custom mode.
 * Index signature allows passing to API as Record<string, boolean>.
 */
export interface MechanicsToggles {
  [key: string]: boolean;
  // Tier 0
  facing: boolean;
  // Tier 1
  resolve: boolean;
  engagement: boolean;
  flanking: boolean;
  // Tier 2
  riposte: boolean;
  intercept: boolean;
  aura: boolean;
  // Tier 3
  charge: boolean;
  overwatch: boolean;
  phalanx: boolean;
  lineOfSight: boolean;
  ammunition: boolean;
  // Tier 4
  contagion: boolean;
  armorShred: boolean;
}

/**
 * Mechanics configuration for battle simulation.
 */
export interface MechanicsSettings {
  /** Selected preset */
  preset: MechanicsPreset;
  /** Custom toggles (used when preset is 'custom') */
  customToggles: MechanicsToggles;
}

/**
 * Default mechanics toggles (all disabled - MVP mode).
 */
export const DEFAULT_MECHANICS_TOGGLES: MechanicsToggles = {
  facing: false,
  resolve: false,
  engagement: false,
  flanking: false,
  riposte: false,
  intercept: false,
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};

/**
 * Tactical preset toggles (Tier 0-2 mechanics).
 */
export const TACTICAL_MECHANICS_TOGGLES: MechanicsToggles = {
  facing: true,
  resolve: true,
  engagement: true,
  flanking: true,
  riposte: true,
  intercept: true,
  aura: true,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};

/**
 * Roguelike preset toggles (all mechanics enabled).
 */
export const ROGUELIKE_MECHANICS_TOGGLES: MechanicsToggles = {
  facing: true,
  resolve: true,
  engagement: true,
  flanking: true,
  riposte: true,
  intercept: true,
  aura: true,
  charge: true,
  overwatch: true,
  phalanx: true,
  lineOfSight: true,
  ammunition: true,
  contagion: true,
  armorShred: true,
};

// =============================================================================
// UI STATE INTERFACE
// =============================================================================

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
  /** Mechanics 2.0 settings */
  mechanics: MechanicsSettings;
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
  /** Set mechanics preset */
  setMechanicsPreset: (preset: MechanicsPreset) => void;
  /** Toggle individual mechanic (switches to custom preset) */
  toggleMechanic: (mechanic: keyof MechanicsToggles) => void;
  /** Get current mechanics toggles based on preset */
  getMechanicsToggles: () => MechanicsToggles;
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
  mechanics: {
    preset: 'mvp',
    customToggles: { ...DEFAULT_MECHANICS_TOGGLES },
  },
};

/**
 * Get mechanics toggles for a given preset.
 * 
 * @param preset - The preset to get toggles for
 * @param customToggles - Custom toggles (used when preset is 'custom')
 * @returns Mechanics toggles for the preset
 */
function getTogglesForPreset(preset: MechanicsPreset, customToggles: MechanicsToggles): MechanicsToggles {
  switch (preset) {
    case 'tactical':
      return TACTICAL_MECHANICS_TOGGLES;
    case 'roguelike':
      return ROGUELIKE_MECHANICS_TOGGLES;
    case 'custom':
      return customToggles;
    case 'mvp':
    default:
      return DEFAULT_MECHANICS_TOGGLES;
  }
}

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
 * 
 * @example
 * // Change mechanics preset
 * const { mechanics, setMechanicsPreset } = useUIStore();
 * setMechanicsPreset('tactical');
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
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

      setMechanicsPreset: (preset: MechanicsPreset) => {
        set((state) => ({
          mechanics: {
            ...state.mechanics,
            preset,
            // When switching to custom, copy current effective toggles
            customToggles: preset === 'custom' 
              ? getTogglesForPreset(state.mechanics.preset, state.mechanics.customToggles)
              : state.mechanics.customToggles,
          },
        }));
      },

      toggleMechanic: (mechanic: keyof MechanicsToggles) => {
        set((state) => {
          // Get current effective toggles
          const currentToggles = getTogglesForPreset(state.mechanics.preset, state.mechanics.customToggles);
          
          // Create new custom toggles with the mechanic toggled
          const newCustomToggles = {
            ...currentToggles,
            [mechanic]: !currentToggles[mechanic],
          };

          return {
            mechanics: {
              preset: 'custom', // Switch to custom when toggling individual mechanics
              customToggles: newCustomToggles,
            },
          };
        });
      },

      getMechanicsToggles: () => {
        const state = get();
        return getTogglesForPreset(state.mechanics.preset, state.mechanics.customToggles);
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
export const selectMechanics = (state: UIStore) => state.mechanics;
export const selectMechanicsPreset = (state: UIStore) => state.mechanics.preset;
