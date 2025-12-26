/**
 * Run store for Roguelike mode.
 * Manages run state, progression, and lifecycle.
 * 
 * @fileoverview Zustand store for roguelike run state management.
 */

import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Deck card in a roguelike run.
 */
export interface DeckCard {
  /** Unique instance ID for this card */
  instanceId: string;
  /** Unit template ID */
  unitId: string;
  /** Current tier (1, 2, or 3) */
  tier: 1 | 2 | 3;
}

/**
 * Spell card in a roguelike run.
 */
export interface SpellCard {
  /** Spell ID */
  spellId: string;
  /** Selected timing for battle */
  timing?: 'early' | 'mid' | 'late';
}

/**
 * Battle history entry.
 */
export interface BattleHistoryEntry {
  /** Battle ID */
  battleId: string;
  /** Result of the battle */
  result: 'win' | 'loss';
  /** Gold earned */
  goldEarned: number;
  /** Opponent info */
  opponent: {
    name: string;
    faction: string;
    rating: number;
  };
  /** Timestamp (ISO string) */
  timestamp: string;
}

/**
 * Roguelike run entity.
 */
export interface Run {
  /** Run ID */
  id: string;
  /** Player ID */
  playerId: string;
  /** Selected faction */
  faction: string;
  /** Selected leader ID */
  leaderId: string;
  /** Full deck (12 units + 2 spells) */
  deck: DeckCard[];
  /** Cards not yet drafted to hand */
  remainingDeck: DeckCard[];
  /** Units available for placement (3-12) */
  hand: DeckCard[];
  /** Units placed on deployment field (8×2 grid) */
  field: FieldUnit[];
  /** 2 spells (always available) */
  spells: SpellCard[];
  /** Current wins (0-9) */
  wins: number;
  /** Current losses (0-4) */
  losses: number;
  /** Consecutive wins for streak bonus */
  consecutiveWins: number;
  /** Current gold */
  gold: number;
  /** Battle history */
  battleHistory: BattleHistoryEntry[];
  /** Run status */
  status: 'active' | 'won' | 'lost';
  /** Run rating for matchmaking */
  rating: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Unit placed on the deployment field.
 */
export interface FieldUnit {
  /** Card instance ID */
  instanceId: string;
  /** Unit template ID */
  unitId: string;
  /** Current tier */
  tier: 1 | 2 | 3;
  /** Position on field (x: 0-7, y: 0-1) */
  position: { x: number; y: number };
  /** Whether unit has participated in battle (cannot be returned to hand if true) */
  hasBattled: boolean;
}

/**
 * Run store state interface.
 */
interface RunState {
  /** Current active run */
  currentRun: Run | null;
  /** Run history for the player */
  runHistory: Run[];
  /** Loading state for run operations */
  loading: boolean;
  /** Error message for run operations */
  error: string | null;
  /** Whether run data has been loaded */
  runLoaded: boolean;
}

/**
 * Run store actions interface.
 */
interface RunActions {
  /** Create a new roguelike run */
  createRun: (faction: string, leaderId: string) => Promise<Run | null>;
  /** Load run by ID */
  loadRun: (runId: string) => Promise<void>;
  /** Load active run for current player */
  loadActiveRun: () => Promise<void>;
  /** Abandon current run */
  abandonRun: (runId: string) => Promise<void>;
  /** Load run history */
  loadRunHistory: () => Promise<void>;
  /** Update run state after battle */
  updateRunAfterBattle: (result: 'win' | 'loss', goldEarned: number) => void;
  /** Update spell timing */
  updateSpellTiming: (spellId: string, timing: 'early' | 'mid' | 'late') => void;
  /** Place unit from hand to field */
  placeUnit: (instanceId: string, position: { x: number; y: number }) => Promise<boolean>;
  /** Reposition unit on field */
  repositionUnit: (instanceId: string, position: { x: number; y: number }) => Promise<boolean>;
  /** Remove unit from field back to hand */
  removeFromField: (instanceId: string) => Promise<boolean>;
  /** Clear current run */
  clearCurrentRun: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

/**
 * Complete run store interface.
 */
type RunStore = RunState & RunActions;

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Run store for roguelike mode management.
 * Handles run creation, loading, and state updates.
 * 
 * @example
 * const { currentRun, createRun, loadActiveRun } = useRunStore();
 * 
 * // Create new run
 * await createRun('humans', 'commander-aldric');
 * 
 * // Load active run
 * await loadActiveRun();
 */
export const useRunStore = create<RunStore>((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  currentRun: null,
  runHistory: [],
  loading: false,
  error: null,
  runLoaded: false,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Create a new roguelike run with selected faction and leader.
   * 
   * @param faction - Selected faction ID
   * @param leaderId - Selected leader ID
   * @returns Created run or null if failed
   * @throws ApiError if run cannot be created
   * @example
   * const run = await createRun('humans', 'commander-aldric');
   */
  createRun: async (faction: string, leaderId: string) => {
    set({ loading: true, error: null });
    
    try {
      const run = await api.createRoguelikeRun(faction, leaderId);
      set({ 
        currentRun: run, 
        loading: false, 
        runLoaded: true,
        error: null 
      });
      return run;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось создать забег';
      
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  /**
   * Load run by ID.
   * 
   * @param runId - Run identifier
   * @throws ApiError if run cannot be loaded
   * @example
   * await loadRun('run-123');
   */
  loadRun: async (runId: string) => {
    set({ loading: true, error: null });
    
    try {
      const run = await api.getRoguelikeRun(runId);
      set({ 
        currentRun: run, 
        loading: false, 
        runLoaded: true,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить забег';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Load active run for current player.
   * Sets currentRun to null if no active run exists.
   * 
   * @throws ApiError if request fails
   * @example
   * await loadActiveRun();
   */
  loadActiveRun: async () => {
    set({ loading: true, error: null });
    
    try {
      const run = await api.getActiveRoguelikeRun();
      
      // Backend returns null if no active run
      if (!run) {
        set({ 
          currentRun: null, 
          loading: false, 
          runLoaded: true,
          error: null 
        });
        return;
      }
      
      set({ 
        currentRun: run, 
        loading: false, 
        runLoaded: true,
        error: null 
      });
    } catch (error) {
      // 404 means no active run - this is not an error
      // 401 means unauthorized (new user) - also not an error for this check
      if (error instanceof ApiError && (error.status === 404 || error.status === 401)) {
        set({ 
          currentRun: null, 
          loading: false, 
          runLoaded: true,
          error: null 
        });
        return;
      }
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить активный забег';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Abandon current run.
   * 
   * @param runId - Run identifier to abandon
   * @throws ApiError if run cannot be abandoned
   * @example
   * await abandonRun('run-123');
   */
  abandonRun: async (runId: string) => {
    set({ loading: true, error: null });
    
    try {
      await api.abandonRoguelikeRun(runId);
      set({ 
        currentRun: null, 
        loading: false,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось отменить забег';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Load run history for current player.
   * 
   * @throws ApiError if history cannot be loaded
   * @example
   * await loadRunHistory();
   */
  loadRunHistory: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.getRoguelikeRunHistory();
      set({ 
        runHistory: response.runs, 
        loading: false,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить историю забегов';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Update run state after battle completion.
   * Updates wins/losses, gold, and consecutive wins locally.
   * 
   * @param result - Battle result
   * @param goldEarned - Gold earned from battle
   * @example
   * updateRunAfterBattle('win', 7);
   */
  updateRunAfterBattle: (result: 'win' | 'loss', goldEarned: number) => {
    const { currentRun } = get();
    
    if (!currentRun) {
      set({ error: 'Нет активного забега' });
      return;
    }

    const updatedRun: Run = {
      ...currentRun,
      wins: result === 'win' ? currentRun.wins + 1 : currentRun.wins,
      losses: result === 'loss' ? currentRun.losses + 1 : currentRun.losses,
      consecutiveWins: result === 'win' ? currentRun.consecutiveWins + 1 : 0,
      gold: currentRun.gold + goldEarned,
      updatedAt: new Date(),
    };

    // Check for run end conditions
    if (updatedRun.wins >= 9) {
      updatedRun.status = 'won';
    } else if (updatedRun.losses >= 4) {
      updatedRun.status = 'lost';
    }

    set({ currentRun: updatedRun });
  },

  /**
   * Update spell timing for battle.
   * 
   * @param spellId - Spell identifier
   * @param timing - Selected timing
   * @example
   * updateSpellTiming('holy-light', 'mid');
   */
  updateSpellTiming: (spellId: string, timing: 'early' | 'mid' | 'late') => {
    const { currentRun } = get();
    
    if (!currentRun) {
      set({ error: 'Нет активного забега' });
      return;
    }

    const updatedSpells = currentRun.spells.map(spell => 
      spell.spellId === spellId ? { ...spell, timing } : spell
    );

    set({ 
      currentRun: { 
        ...currentRun, 
        spells: updatedSpells 
      } 
    });
  },

  /**
   * Place a unit from hand onto the deployment field.
   * Costs gold equal to the unit's cost.
   * 
   * @param instanceId - Card instance ID from hand
   * @param position - Target position on field
   * @returns True if placement succeeded
   * @example
   * const success = await placeUnit('card-1', { x: 0, y: 0 });
   */
  placeUnit: async (instanceId: string, position: { x: number; y: number }) => {
    const { currentRun } = get();
    
    if (!currentRun) {
      set({ error: 'Нет активного забега' });
      return false;
    }

    set({ loading: true, error: null });

    try {
      const result = await api.placeUnit(currentRun.id, instanceId, position);
      
      set({
        currentRun: {
          ...currentRun,
          hand: result.hand,
          field: result.field,
          gold: result.gold,
        },
        loading: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось разместить юнита';
      
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  /**
   * Reposition a unit on the deployment field.
   * Free (no gold cost).
   * 
   * @param instanceId - Unit instance ID on field
   * @param position - New position on field
   * @returns True if reposition succeeded
   * @example
   * const success = await repositionUnit('card-1', { x: 1, y: 0 });
   */
  repositionUnit: async (instanceId: string, position: { x: number; y: number }) => {
    const { currentRun } = get();
    
    if (!currentRun) {
      set({ error: 'Нет активного забега' });
      return false;
    }

    set({ loading: true, error: null });

    try {
      const result = await api.repositionUnit(currentRun.id, instanceId, position);
      
      set({
        currentRun: {
          ...currentRun,
          field: result.field,
        },
        loading: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось переместить юнита';
      
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  /**
   * Remove a unit from the field back to hand.
   * Refunds the unit's gold cost.
   * 
   * @param instanceId - Unit instance ID on field
   * @returns True if removal succeeded
   * @example
   * const success = await removeFromField('card-1');
   */
  removeFromField: async (instanceId: string) => {
    const { currentRun } = get();
    
    if (!currentRun) {
      set({ error: 'Нет активного забега' });
      return false;
    }

    set({ loading: true, error: null });

    try {
      const result = await api.removeFromField(currentRun.id, instanceId);
      
      set({
        currentRun: {
          ...currentRun,
          hand: result.hand,
          field: result.field,
          gold: result.gold,
        },
        loading: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось убрать юнита с поля';
      
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  /**
   * Clear current run from state.
   * 
   * @example
   * clearCurrentRun();
   */
  clearCurrentRun: () => {
    set({ 
      currentRun: null, 
      runLoaded: false,
      error: null 
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
 * Selector for current run.
 * 
 * @returns Current run or null
 * @example
 * const run = useRunStore(selectCurrentRun);
 */
export const selectCurrentRun = (state: RunStore) => state.currentRun;

/**
 * Selector for run loading state.
 * 
 * @returns True if any run operation is loading
 * @example
 * const isLoading = useRunStore(selectRunLoading);
 */
export const selectRunLoading = (state: RunStore) => state.loading;

/**
 * Selector for run error state.
 * 
 * @returns Error message or null
 * @example
 * const error = useRunStore(selectRunError);
 */
export const selectRunError = (state: RunStore) => state.error;

/**
 * Selector for whether run is active.
 * 
 * @returns True if there's an active run
 * @example
 * const hasActiveRun = useRunStore(selectHasActiveRun);
 */
export const selectHasActiveRun = (state: RunStore) => 
  state.currentRun !== null && state.currentRun.status === 'active';

/**
 * Selector for run progress (wins/losses).
 * 
 * @returns Progress object or null
 * @example
 * const progress = useRunStore(selectRunProgress);
 */
export const selectRunProgress = (state: RunStore) => {
  if (!state.currentRun) return null;
  
  return {
    wins: state.currentRun.wins,
    losses: state.currentRun.losses,
    gold: state.currentRun.gold,
    consecutiveWins: state.currentRun.consecutiveWins,
    status: state.currentRun.status,
  };
};

/**
 * Selector for run hand (available units).
 * 
 * @returns Hand cards or empty array
 * @example
 * const hand = useRunStore(selectRunHand);
 */
export const selectRunHand = (state: RunStore) => 
  state.currentRun?.hand ?? [];

/**
 * Selector for run field (placed units).
 * 
 * @returns Field units or empty array
 * @example
 * const field = useRunStore(selectRunField);
 */
export const selectRunField = (state: RunStore) => 
  state.currentRun?.field ?? [];

/**
 * Selector for run spells.
 * 
 * @returns Spell cards or empty array
 * @example
 * const spells = useRunStore(selectRunSpells);
 */
export const selectRunSpells = (state: RunStore) => 
  state.currentRun?.spells ?? [];
