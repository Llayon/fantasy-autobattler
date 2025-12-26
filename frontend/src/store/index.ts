/**
 * Store exports for Fantasy Autobattler.
 * Centralized exports for all Zustand stores.
 * 
 * @fileoverview Main store exports and utilities.
 */

// =============================================================================
// STORE EXPORTS
// =============================================================================

// Player store
export { 
  usePlayerStore,
  selectIsAuthenticated,
  selectPlayer,
  selectPlayerLoading,
  selectPlayerError,
} from './playerStore';

// Team store
export { 
  useTeamStore,
  selectUnits,
  selectTeams,
  selectActiveTeam,
  selectCurrentTeam,
  selectTeamLoading,
  selectTeamError,
} from './teamStore';

// Battle store
export { 
  useBattleStore,
  selectCurrentBattle,
  selectBattles,
  selectBattleLoading,
  selectBattleError,
  selectReplayState,
  selectCurrentReplayEvent,
  REPLAY_SPEEDS,
} from './battleStore';

// Matchmaking store
export { 
  useMatchmakingStore,
  selectMatchmakingStatus,
  selectQueueEntry,
  selectMatch,
  selectMatchmakingLoading,
  selectMatchmakingError,
  selectIsInQueue,
  selectHasMatch,
} from './matchmakingStore';

// Roguelike run store
export {
  useRunStore,
  selectCurrentRun,
  selectRunLoading,
  selectRunError,
  selectHasActiveRun,
  selectRunProgress,
  selectRunHand,
  selectRunSpells,
} from './runStore';

// Roguelike draft store
export {
  useDraftStore,
  selectDraftOptions,
  selectSelectedCards,
  selectDraftLoading,
  selectDraftError,
  selectIsDraftComplete,
  selectRemainingPicks,
  selectDraftInfo,
} from './draftStore';

// Import stores for utilities
import { usePlayerStore } from './playerStore';
import { useTeamStore } from './teamStore';
import { useMatchmakingStore } from './matchmakingStore';
import { useBattleStore } from './battleStore';
import { useRunStore } from './runStore';
import { useDraftStore } from './draftStore';

// =============================================================================
// STORE UTILITIES
// =============================================================================

/**
 * Initialize all stores with required data.
 * Call this on app startup after authentication.
 * 
 * @example
 * await initializeStores();
 */
export async function initializeStores(): Promise<void> {
  // Load units first (they're static data)
  await useTeamStore.getState().loadUnits();
  
  // Then load teams if player is authenticated
  const isAuthenticated = usePlayerStore.getState().isAuthenticated;
  if (isAuthenticated) {
    await useTeamStore.getState().loadTeams();
  }
}

/**
 * Reset all stores to initial state.
 * Call this on logout or when switching accounts.
 * 
 * @example
 * resetAllStores();
 */
export function resetAllStores(): void {
  // Reset all stores
  usePlayerStore.getState().logout();
  useMatchmakingStore.getState().reset();
  
  // Reset team store
  useTeamStore.setState({
    units: [],
    teams: [],
    activeTeam: null,
    currentTeam: {
      name: '',
      units: [],
      totalCost: 0,
      isValid: false,
      errors: [],
    },
    loading: false,
    error: null,
    unitsLoaded: false,
  });
  
  // Reset battle store
  useBattleStore.setState({
    currentBattle: null,
    battles: [],
    loading: false,
    error: null,
    battlesLoaded: false,
    replayState: {
      isPlaying: false,
      currentEventIndex: 0,
      speed: 1,
    },
  });

  // Reset roguelike run store
  useRunStore.getState().clearCurrentRun();
  useRunStore.setState({
    runHistory: [],
    loading: false,
    error: null,
  });

  // Reset roguelike draft store
  useDraftStore.getState().clearDraft();
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Note: Types are defined internally in each store file
// Components should import stores directly if they need specific types