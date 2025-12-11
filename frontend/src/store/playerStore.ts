/**
 * Player store for Fantasy Autobattler.
 * Manages player authentication, profile, and session state.
 * 
 * @fileoverview Zustand store for player-related state management.
 */

import { create } from 'zustand';
import { Player } from '@/types/game';
import { api, ApiError } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Player store state interface.
 */
interface PlayerState {
  /** Current player profile */
  player: Player | null;
  /** Loading state for player operations */
  loading: boolean;
  /** Error message for player operations */
  error: string | null;
  /** Whether player is authenticated */
  isAuthenticated: boolean;
}

/**
 * Player store actions interface.
 */
interface PlayerActions {
  /** Initialize player session (login or create guest) */
  initPlayer: () => Promise<void>;
  /** Refresh player profile data */
  refreshPlayer: () => Promise<void>;
  /** Logout and clear player data */
  logout: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

/**
 * Complete player store interface.
 */
type PlayerStore = PlayerState & PlayerActions;

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Player store for authentication and profile management.
 * Handles guest account creation, login, and profile data.
 * 
 * @example
 * const { player, initPlayer, logout } = usePlayerStore();
 * 
 * // Initialize player session
 * await initPlayer();
 * 
 * // Logout
 * logout();
 */
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  player: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Initialize player session with authentication.
   * Creates guest account if no token exists or token is invalid.
   * 
   * @throws Never throws - handles all errors internally
   * @example
   * await initPlayer();
   */
  initPlayer: async () => {
    set({ loading: true, error: null });
    
    try {
      // Check if we have a token
      if (!api.hasToken()) {
        // No token, create new guest account
        await api.createGuest();
      }
      
      // Try to get player profile
      const player = await api.getPlayer();
      set({ 
        player, 
        loading: false, 
        isAuthenticated: true,
        error: null 
      });
    } catch (error) {
      // Token might be invalid, try creating new guest
      try {
        await api.createGuest();
        const player = await api.getPlayer();
        set({ 
          player, 
          loading: false, 
          isAuthenticated: true,
          error: null 
        });
      } catch (retryError) {
        // Complete failure - likely network issue
        const errorMessage = retryError instanceof ApiError 
          ? retryError.message 
          : 'Не удалось подключиться к серверу';
        
        set({ 
          error: errorMessage, 
          loading: false, 
          isAuthenticated: false,
          player: null 
        });
      }
    }
  },

  /**
   * Refresh player profile data from server.
   * Updates current player information without changing authentication.
   * 
   * @throws ApiError if player data cannot be retrieved
   * @example
   * await refreshPlayer();
   */
  refreshPlayer: async () => {
    const { isAuthenticated } = get();
    
    if (!isAuthenticated) {
      set({ error: 'Пользователь не авторизован' });
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const player = await api.getPlayer();
      set({ player, loading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось обновить данные игрока';
      
      set({ error: errorMessage, loading: false });
      
      // If unauthorized, clear authentication
      if (error instanceof ApiError && error.status === 401) {
        set({ isAuthenticated: false, player: null });
      }
    }
  },

  /**
   * Logout player and clear all session data.
   * Removes authentication token and resets store state.
   * 
   * @example
   * logout();
   */
  logout: () => {
    api.logout();
    set({
      player: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  /**
   * Clear error state.
   * 
   * @example
   * clearError();
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Set loading state manually.
   * 
   * @param loading - Loading state
   * @example
   * setLoading(true);
   */
  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector for player authentication status.
 * 
 * @returns True if player is authenticated
 * @example
 * const isLoggedIn = usePlayerStore(selectIsAuthenticated);
 */
export const selectIsAuthenticated = (state: PlayerStore) => state.isAuthenticated;

/**
 * Selector for player profile data.
 * 
 * @returns Player profile or null
 * @example
 * const player = usePlayerStore(selectPlayer);
 */
export const selectPlayer = (state: PlayerStore) => state.player;

/**
 * Selector for player loading state.
 * 
 * @returns True if any player operation is loading
 * @example
 * const isLoading = usePlayerStore(selectPlayerLoading);
 */
export const selectPlayerLoading = (state: PlayerStore) => state.loading;

/**
 * Selector for player error state.
 * 
 * @returns Error message or null
 * @example
 * const error = usePlayerStore(selectPlayerError);
 */
export const selectPlayerError = (state: PlayerStore) => state.error;