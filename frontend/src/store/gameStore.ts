/**
 * Legacy game store for Fantasy Autobattler.
 * 
 * @deprecated This store has been refactored into separate stores.
 * Use the new modular stores instead:
 * - usePlayerStore for player authentication and profile
 * - useTeamStore for team building and management
 * - useBattleStore for battle operations and replay
 * - useMatchmakingStore for matchmaking functionality
 * 
 * @fileoverview Legacy store maintained for backward compatibility.
 */

import { create } from 'zustand';
import { Player, UnitType } from '@/types/game';
import { api } from '@/lib/api';

// Import new stores for delegation
import { usePlayerStore } from './playerStore';
import { useBattleStore } from './battleStore';

interface GameState {
  player: Player | null;
  loading: boolean;
  error: string | null;
  selectedTeam: UnitType[];
  
  initPlayer: () => Promise<void>;
  setSelectedTeam: (team: UnitType[]) => void;
  saveTeam: () => Promise<void>;
  startBattle: () => Promise<string>;
}

/**
 * Legacy game store.
 * @deprecated Use individual stores (usePlayerStore, useTeamStore, etc.) instead.
 */
export const useGameStore = create<GameState>((set, get) => ({
  player: null,
  loading: false,
  error: null,
  selectedTeam: ['Warrior', 'Mage', 'Healer'],

  /**
   * Initialize player session.
   * @deprecated Use usePlayerStore.initPlayer() instead.
   */
  initPlayer: async () => {
    // Delegate to new player store
    await usePlayerStore.getState().initPlayer();
    
    // Sync state for backward compatibility
    const playerState = usePlayerStore.getState();
    set({ 
      player: playerState.player,
      loading: playerState.loading,
      error: playerState.error,
    });
  },

  /**
   * Set selected team.
   * @deprecated Use useTeamStore for team management instead.
   */
  setSelectedTeam: (team) => set({ selectedTeam: team }),

  /**
   * Save team.
   * @deprecated Use useTeamStore.saveTeam() instead.
   */
  saveTeam: async () => {
    const { selectedTeam } = get();
    set({ loading: true });
    try {
      const player = await api.updatePlayerTeam(selectedTeam);
      set({ player, loading: false });
    } catch {
      set({ error: 'Failed to save team', loading: false });
    }
  },

  /**
   * Start battle.
   * @deprecated Use useBattleStore.startBattle() instead.
   */
  startBattle: async () => {
    const { selectedTeam, player } = get();
    set({ loading: true });
    try {
      // Save team first if changed
      if (JSON.stringify(selectedTeam) !== JSON.stringify(player?.team)) {
        await api.updatePlayerTeam(selectedTeam);
      }
      
      // Delegate to battle store
      const battleId = await useBattleStore.getState().startBattle();
      
      set({ loading: false });
      return battleId || '';
    } catch {
      set({ error: 'Failed to start battle', loading: false });
      throw new Error('Battle failed');
    }
  },
}));
