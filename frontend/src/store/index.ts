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
  const { usePlayerStore } = await import('./playerStore');
  const { useTeamStore } = await import('./teamStore');
  
  // Initialize player first
  await usePlayerStore.getState().initPlayer();
  
  // Then load teams and units if player is authenticated
  const isAuthenticated = usePlayerStore.getState().isAuthenticated;
  if (isAuthenticated) {
    await Promise.all([
      useTeamStore.getState().loadUnits(),
      useTeamStore.getState().loadTeams(),
    ]);
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
  const { usePlayerStore } = require('./playerStore');
  const { useTeamStore } = require('./teamStore');
  const { useBattleStore } = require('./battleStore');
  const { useMatchmakingStore } = require('./matchmakingStore');
  
  // Reset all stores
  usePlayerStore.getState().logout();
  useMatchmakingStore.getState().reset();
  
  // Clear other store states
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
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Note: Types are defined internally in each store file
// Components should import stores directly if they need specific types