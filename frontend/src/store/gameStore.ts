import { create } from 'zustand';
import { Player, UnitType } from '@/types/game';
import { api } from '@/lib/api';

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

export const useGameStore = create<GameState>((set, get) => ({
  player: null,
  loading: false,
  error: null,
  selectedTeam: ['Warrior', 'Mage', 'Healer'],

  initPlayer: async () => {
    set({ loading: true, error: null });
    try {
      if (!api.hasToken()) {
        await api.createGuest();
      }
      const player = await api.getPlayer();
      set({ player, selectedTeam: player.team, loading: false });
    } catch (err) {
      // Token might be invalid, create new guest
      try {
        await api.createGuest();
        const player = await api.getPlayer();
        set({ player, selectedTeam: player.team, loading: false });
      } catch {
        set({ error: 'Failed to connect to server', loading: false });
      }
    }
  },

  setSelectedTeam: (team) => set({ selectedTeam: team }),

  saveTeam: async () => {
    const { selectedTeam } = get();
    set({ loading: true });
    try {
      const player = await api.updateTeam(selectedTeam);
      set({ player, loading: false });
    } catch {
      set({ error: 'Failed to save team', loading: false });
    }
  },

  startBattle: async () => {
    const { selectedTeam, player } = get();
    set({ loading: true });
    try {
      // Save team first if changed
      if (JSON.stringify(selectedTeam) !== JSON.stringify(player?.team)) {
        await api.updateTeam(selectedTeam);
      }
      const { battleId } = await api.startBattle();
      set({ loading: false });
      return battleId;
    } catch {
      set({ error: 'Failed to start battle', loading: false });
      throw new Error('Battle failed');
    }
  },
}));
