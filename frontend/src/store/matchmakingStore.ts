/**
 * Matchmaking store for Fantasy Autobattler.
 * Manages matchmaking queue, status, and match finding.
 * 
 * @fileoverview Zustand store for matchmaking-related state management.
 */

import { create } from 'zustand';
import { MatchmakingStatus } from '@/types/game';
import { api, ApiError } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Queue entry information.
 */
interface QueueEntry {
  /** Queue entry ID */
  id: string;
  /** Team ID used for matchmaking */
  teamId: string;
  /** Player ELO rating */
  rating: number;
  /** Time spent waiting in seconds */
  waitTime: number;
  /** Queue join timestamp */
  joinedAt: Date;
}

/**
 * Match information when found.
 */
interface MatchInfo {
  /** Battle ID for the match */
  battleId: string;
  /** Opponent player ID */
  opponentId: string;
  /** ELO rating difference */
  ratingDifference: number;
}

/**
 * Matchmaking store state interface.
 */
interface MatchmakingState {
  /** Current matchmaking status */
  status: MatchmakingStatus;
  /** Queue entry details if in queue */
  queueEntry: QueueEntry | null;
  /** Match details if matched */
  match: MatchInfo | null;
  /** Loading state for matchmaking operations */
  loading: boolean;
  /** Error message for matchmaking operations */
  error: string | null;
  /** Polling interval ID for status updates */
  pollingInterval: NodeJS.Timeout | null;
}

/**
 * Matchmaking store actions interface.
 */
interface MatchmakingActions {
  /** Join matchmaking queue with team */
  joinQueue: (teamId: string) => Promise<void>;
  /** Leave matchmaking queue */
  leaveQueue: () => Promise<void>;
  /** Get current matchmaking status */
  getStatus: () => Promise<void>;
  /** Start polling for match updates */
  startPolling: () => void;
  /** Stop polling for match updates */
  stopPolling: () => void;
  /** Find match (manual polling) */
  findMatch: () => Promise<void>;
  /** Clear match result */
  clearMatch: () => void;
  /** Reset matchmaking state */
  reset: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Complete matchmaking store interface.
 */
type MatchmakingStore = MatchmakingState & MatchmakingActions;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Polling interval for status updates (in milliseconds) */
const POLLING_INTERVAL = 2000; // 2 seconds

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Matchmaking store for queue management and match finding.
 * Handles joining/leaving queue, status polling, and match notifications.
 * 
 * @example
 * const { joinQueue, leaveQueue, status, match } = useMatchmakingStore();
 * 
 * // Join queue
 * await joinQueue('team-123');
 * 
 * // Start polling for matches
 * startPolling();
 * 
 * // Leave queue
 * await leaveQueue();
 */
export const useMatchmakingStore = create<MatchmakingStore>((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  status: 'not_in_queue',
  queueEntry: null,
  match: null,
  loading: false,
  error: null,
  pollingInterval: null,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Join matchmaking queue with selected team.
   * 
   * @param teamId - Team ID to use for matchmaking
   * @throws ApiError if cannot join queue
   * @example
   * await joinQueue('team-123');
   */
  joinQueue: async (teamId: string) => {
    set({ loading: true, error: null });
    
    try {
      const queueEntry = await api.joinMatchmaking(teamId);
      
      set({ 
        status: 'queued',
        queueEntry: {
          id: queueEntry.playerId,
          teamId,
          rating: 1200, // Default rating, will be updated from status
          waitTime: 0,
          joinedAt: new Date(queueEntry.queuedAt),
        },
        loading: false 
      });
      
      // Start polling for status updates
      get().startPolling();
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось присоединиться к очереди';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Leave matchmaking queue.
   * 
   * @throws ApiError if cannot leave queue
   * @example
   * await leaveQueue();
   */
  leaveQueue: async () => {
    set({ loading: true, error: null });
    
    try {
      await api.leaveMatchmaking();
      
      // Stop polling
      get().stopPolling();
      
      set({ 
        status: 'not_in_queue',
        queueEntry: null,
        match: null,
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось покинуть очередь';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Get current matchmaking status from server.
   * 
   * @throws ApiError if cannot get status
   * @example
   * await getStatus();
   */
  getStatus: async () => {
    try {
      const statusResponse = await api.getMatchmakingStatus();
      
      set({ 
        status: statusResponse.status,
        queueEntry: statusResponse.queueEntry || null,
        match: statusResponse.match || null,
        error: null 
      });
      
      // If matched, stop polling
      if (statusResponse.status === 'matched') {
        get().stopPolling();
      }
    } catch (error) {
      // Don't show error for status checks - they happen frequently
      // Just log it silently and assume not in queue
      set({ 
        status: 'not_in_queue',
        queueEntry: null,
        match: null 
      });
    }
  },

  /**
   * Start polling for matchmaking status updates.
   * 
   * @example
   * startPolling();
   */
  startPolling: () => {
    const { pollingInterval } = get();
    
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Start new polling interval
    const newInterval = setInterval(() => {
      const { status } = get();
      
      // Only poll if we're queued
      if (status === 'queued') {
        // Use findMatch instead of getStatus for active matchmaking
        get().findMatch();
      } else {
        // Stop polling if not searching
        get().stopPolling();
      }
    }, POLLING_INTERVAL);
    
    set({ pollingInterval: newInterval });
  },

  /**
   * Stop polling for matchmaking status updates.
   * 
   * @example
   * stopPolling();
   */
  stopPolling: () => {
    const { pollingInterval } = get();
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  /**
   * Manually find match (alternative to polling).
   * 
   * @throws ApiError if cannot find match
   * @example
   * await findMatch();
   */
  findMatch: async () => {
    const { status } = get();
    
    if (status !== 'queued') {
      set({ error: 'Не в очереди поиска матча' });
      return;
    }

    try {
      const result = await api.findMatch();
      
      if (result.found && result.match) {
        set({ 
          status: 'matched',
          match: result.match,
          error: null 
        });
        
        // Stop polling since match is found
        get().stopPolling();
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Ошибка поиска матча';
      
      set({ error: errorMessage });
    }
  },

  /**
   * Clear match result and return to not in queue state.
   * 
   * @example
   * clearMatch();
   */
  clearMatch: () => {
    get().stopPolling();
    
    set({ 
      status: 'not_in_queue',
      queueEntry: null,
      match: null,
      error: null 
    });
  },

  /**
   * Reset all matchmaking state.
   * 
   * @example
   * reset();
   */
  reset: () => {
    get().stopPolling();
    
    set({ 
      status: 'not_in_queue',
      queueEntry: null,
      match: null,
      loading: false,
      error: null,
      pollingInterval: null 
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
}));

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector for matchmaking status.
 * 
 * @returns Current matchmaking status
 * @example
 * const status = useMatchmakingStore(selectMatchmakingStatus);
 */
export const selectMatchmakingStatus = (state: MatchmakingStore) => state.status;

/**
 * Selector for queue entry.
 * 
 * @returns Queue entry or null
 * @example
 * const queueEntry = useMatchmakingStore(selectQueueEntry);
 */
export const selectQueueEntry = (state: MatchmakingStore) => state.queueEntry;

/**
 * Selector for match information.
 * 
 * @returns Match info or null
 * @example
 * const match = useMatchmakingStore(selectMatch);
 */
export const selectMatch = (state: MatchmakingStore) => state.match;

/**
 * Selector for matchmaking loading state.
 * 
 * @returns True if any matchmaking operation is loading
 * @example
 * const isLoading = useMatchmakingStore(selectMatchmakingLoading);
 */
export const selectMatchmakingLoading = (state: MatchmakingStore) => state.loading;

/**
 * Selector for matchmaking error state.
 * 
 * @returns Error message or null
 * @example
 * const error = useMatchmakingStore(selectMatchmakingError);
 */
export const selectMatchmakingError = (state: MatchmakingStore) => state.error;

/**
 * Selector for whether player is in queue.
 * 
 * @returns True if player is searching for match
 * @example
 * const isInQueue = useMatchmakingStore(selectIsInQueue);
 */
export const selectIsInQueue = (state: MatchmakingStore) => state.status === 'queued';

/**
 * Selector for whether match is found.
 * 
 * @returns True if match has been found
 * @example
 * const hasMatch = useMatchmakingStore(selectHasMatch);
 */
export const selectHasMatch = (state: MatchmakingStore) => state.status === 'matched' && !!state.match;