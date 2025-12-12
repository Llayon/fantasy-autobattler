/**
 * Battle store for Fantasy Autobattler.
 * Manages battle history, current battle, and battle operations.
 * 
 * @fileoverview Zustand store for battle-related state management.
 */

import { create } from 'zustand';
import { BattleLog } from '@/types/game';
import { api, ApiError } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Battle store state interface.
 */
interface BattleState {
  /** Current battle being viewed/replayed */
  currentBattle: BattleLog | null;
  /** Player's battle history */
  battles: BattleLog[];
  /** Loading state for battle operations */
  loading: boolean;
  /** Error message for battle operations */
  error: string | null;
  /** Whether battles have been loaded */
  battlesLoaded: boolean;
  /** Battle replay state */
  replayState: {
    /** Whether replay is playing */
    isPlaying: boolean;
    /** Current event index in replay */
    currentEventIndex: number;
    /** Replay speed multiplier */
    speed: number;
  };
}

/**
 * Battle store actions interface.
 */
interface BattleActions {
  /** Start new battle against bot */
  startBattle: (difficulty?: string, teamId?: string) => Promise<string | null>;
  /** Load battle by ID */
  loadBattle: (battleId: string) => Promise<void>;
  /** Load player's battle history */
  loadBattles: () => Promise<void>;
  /** Clear current battle */
  clearCurrentBattle: () => void;
  /** Start battle replay */
  startReplay: () => void;
  /** Pause battle replay */
  pauseReplay: () => void;
  /** Stop battle replay */
  stopReplay: () => void;
  /** Go to specific event in replay */
  goToEvent: (eventIndex: number) => void;
  /** Set replay speed */
  setReplaySpeed: (speed: number) => void;
  /** Go to next event in replay */
  nextEvent: () => void;
  /** Go to previous event in replay */
  previousEvent: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Complete battle store interface.
 */
type BattleStore = BattleState & BattleActions;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default replay state */
const DEFAULT_REPLAY_STATE = {
  isPlaying: false,
  currentEventIndex: 0,
  speed: 1,
};

/** Available replay speeds */
export const REPLAY_SPEEDS = [0.5, 1, 1.5, 2, 3];

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Battle store for battle management and replay.
 * Handles battle operations, history, and replay functionality.
 * 
 * @example
 * const { startBattle, loadBattle, currentBattle } = useBattleStore();
 * 
 * // Start new battle
 * const battleId = await startBattle('medium');
 * 
 * // Load battle for replay
 * await loadBattle(battleId);
 */
export const useBattleStore = create<BattleStore>((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  currentBattle: null,
  battles: [],
  loading: false,
  error: null,
  battlesLoaded: false,
  replayState: { ...DEFAULT_REPLAY_STATE },

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Start new battle against bot opponent.
   * 
   * @param difficulty - Battle difficulty (easy, medium, hard)
   * @param teamId - Team ID to use (optional, uses active team)
   * @returns Battle ID if successful, null if failed
   * @throws ApiError if battle cannot be started
   * @example
   * const battleId = await startBattle('medium', 'team-123');
   */
  startBattle: async (difficulty?: string, teamId?: string) => {
    set({ loading: true, error: null });
    
    try {
      const battleResult = await api.startBattle(difficulty, teamId);
      
      // Refresh battles list to include new battle
      if (get().battlesLoaded) {
        await get().loadBattles();
      }
      
      set({ loading: false });
      return battleResult.battleId;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось начать бой';
      
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  /**
   * Load battle by ID for viewing/replay.
   * 
   * @param battleId - Battle identifier
   * @throws ApiError if battle cannot be loaded
   * @example
   * await loadBattle('battle-123');
   */
  loadBattle: async (battleId: string) => {
    set({ loading: true, error: null });
    
    try {
      const battle = await api.getBattle(battleId);
      
      set({ 
        currentBattle: battle,
        replayState: { ...DEFAULT_REPLAY_STATE },
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить бой';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Load player's battle history.
   * 
   * @throws ApiError if battles cannot be loaded
   * @example
   * await loadBattles();
   */
  loadBattles: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.getBattles();
      
      set({ 
        battles: response.battles,
        battlesLoaded: true,
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить историю боев';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Clear current battle from state.
   * 
   * @example
   * clearCurrentBattle();
   */
  clearCurrentBattle: () => {
    set({ 
      currentBattle: null,
      replayState: { ...DEFAULT_REPLAY_STATE },
      error: null 
    });
  },

  /**
   * Start battle replay playback.
   * 
   * @example
   * startReplay();
   */
  startReplay: () => {
    const { currentBattle } = get();
    
    if (!currentBattle) {
      set({ error: 'Нет боя для воспроизведения' });
      return;
    }

    set(state => ({
      replayState: {
        ...state.replayState,
        isPlaying: true,
      },
      error: null,
    }));
  },

  /**
   * Pause battle replay playback.
   * 
   * @example
   * pauseReplay();
   */
  pauseReplay: () => {
    set(state => ({
      replayState: {
        ...state.replayState,
        isPlaying: false,
      },
    }));
  },

  /**
   * Stop battle replay and reset to beginning.
   * 
   * @example
   * stopReplay();
   */
  stopReplay: () => {
    set(state => ({
      replayState: {
        ...state.replayState,
        isPlaying: false,
        currentEventIndex: 0,
      },
    }));
  },

  /**
   * Go to specific event in battle replay.
   * 
   * @param eventIndex - Event index to jump to
   * @example
   * goToEvent(10);
   */
  goToEvent: (eventIndex: number) => {
    const { currentBattle } = get();
    
    if (!currentBattle) {
      set({ error: 'Нет боя для воспроизведения' });
      return;
    }

    const maxIndex = currentBattle.events.length - 1;
    const clampedIndex = Math.max(0, Math.min(eventIndex, maxIndex));
    
    set(state => ({
      replayState: {
        ...state.replayState,
        currentEventIndex: clampedIndex,
      },
      error: null,
    }));
  },

  /**
   * Set battle replay speed.
   * 
   * @param speed - Replay speed multiplier
   * @example
   * setReplaySpeed(2); // 2x speed
   */
  setReplaySpeed: (speed: number) => {
    if (!REPLAY_SPEEDS.includes(speed)) {
      set({ error: 'Неверная скорость воспроизведения' });
      return;
    }

    set(state => ({
      replayState: {
        ...state.replayState,
        speed,
      },
      error: null,
    }));
  },

  /**
   * Go to next event in battle replay.
   * 
   * @example
   * nextEvent();
   */
  nextEvent: () => {
    const { currentBattle, replayState } = get();
    
    if (!currentBattle) {
      set({ error: 'Нет боя для воспроизведения' });
      return;
    }

    const nextIndex = replayState.currentEventIndex + 1;
    const maxIndex = currentBattle.events.length - 1;
    
    if (nextIndex <= maxIndex) {
      set(state => ({
        replayState: {
          ...state.replayState,
          currentEventIndex: nextIndex,
        },
        error: null,
      }));
    } else {
      // Reached end of replay
      set(state => ({
        replayState: {
          ...state.replayState,
          isPlaying: false,
        },
      }));
    }
  },

  /**
   * Go to previous event in battle replay.
   * 
   * @example
   * previousEvent();
   */
  previousEvent: () => {
    const { currentBattle, replayState } = get();
    
    if (!currentBattle) {
      set({ error: 'Нет боя для воспроизведения' });
      return;
    }

    const prevIndex = replayState.currentEventIndex - 1;
    
    if (prevIndex >= 0) {
      set(state => ({
        replayState: {
          ...state.replayState,
          currentEventIndex: prevIndex,
        },
        error: null,
      }));
    }
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
}));

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector for current battle.
 * 
 * @returns Current battle or null
 * @example
 * const battle = useBattleStore(selectCurrentBattle);
 */
export const selectCurrentBattle = (state: BattleStore) => state.currentBattle;

/**
 * Selector for battle history.
 * 
 * @returns Array of battle logs
 * @example
 * const battles = useBattleStore(selectBattles);
 */
export const selectBattles = (state: BattleStore) => state.battles;

/**
 * Selector for battle loading state.
 * 
 * @returns True if any battle operation is loading
 * @example
 * const isLoading = useBattleStore(selectBattleLoading);
 */
export const selectBattleLoading = (state: BattleStore) => state.loading;

/**
 * Selector for battle error state.
 * 
 * @returns Error message or null
 * @example
 * const error = useBattleStore(selectBattleError);
 */
export const selectBattleError = (state: BattleStore) => state.error;

/**
 * Selector for replay state.
 * 
 * @returns Current replay state
 * @example
 * const replayState = useBattleStore(selectReplayState);
 */
export const selectReplayState = (state: BattleStore) => state.replayState;

/**
 * Selector for current replay event.
 * 
 * @returns Current event or null
 * @example
 * const currentEvent = useBattleStore(selectCurrentReplayEvent);
 */
export const selectCurrentReplayEvent = (state: BattleStore) => {
  if (!state.currentBattle) return null;
  
  const { currentEventIndex } = state.replayState;
  return state.currentBattle.events[currentEventIndex] || null;
};