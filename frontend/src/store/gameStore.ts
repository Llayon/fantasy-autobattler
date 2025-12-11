/**
 * Legacy game store for Fantasy Autobattler.
 * 
 * @fileoverview Legacy compatibility layer for the old game store.
 * The main functionality is now in modular stores (playerStore, teamStore, etc.).
 * @deprecated Use the new modular stores instead.
 */

import { create } from 'zustand';
import { Player, UnitTemplate } from '@/types/game';

/**
 * Legacy game state interface.
 * @deprecated Use the new modular stores instead.
 */
interface LegacyGameState {
  /** Current player */
  player: Player | null;
  /** Available units */
  units: UnitTemplate[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Legacy game actions interface.
 * @deprecated Use the new modular stores instead.
 */
interface LegacyGameActions {
  /** Initialize game */
  initGame: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

/**
 * Legacy game store type.
 * @deprecated Use the new modular stores instead.
 */
type LegacyGameStore = LegacyGameState & LegacyGameActions;

/**
 * Legacy game store for backward compatibility.
 * 
 * @deprecated Use the new modular stores:
 * - usePlayerStore for player data
 * - useTeamStore for team management
 * - useBattleStore for battle operations
 * - useMatchmakingStore for matchmaking
 * 
 * @example
 * // OLD (deprecated)
 * const { player, units } = useGameStore();
 * 
 * // NEW (recommended)
 * const player = usePlayerStore(selectPlayer);
 * const units = useTeamStore(selectUnits);
 */
export const useGameStore = create<LegacyGameStore>((set) => ({
  // State
  player: null,
  units: [],
  loading: false,
  error: null,

  // Actions
  initGame: async () => {
    set({ loading: true, error: null });
    
    try {
      // Legacy initialization - redirect to new stores
      // Note: useGameStore is deprecated. Use the new modular stores instead.
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Legacy selectors for backward compatibility.
 * @deprecated Use the new store selectors instead.
 */
export const selectPlayer = (state: LegacyGameStore) => state.player;
export const selectUnits = (state: LegacyGameStore) => state.units;
export const selectLoading = (state: LegacyGameStore) => state.loading;
export const selectError = (state: LegacyGameStore) => state.error;