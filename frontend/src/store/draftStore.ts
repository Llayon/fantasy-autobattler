/**
 * Draft store for Roguelike mode.
 * Manages draft state, card selection, and draft submission.
 * 
 * @fileoverview Zustand store for roguelike draft state management.
 */

import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';
import { DeckCard } from './runStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Draft card option with unit details.
 */
export interface DraftOption {
  /** Unique instance ID */
  instanceId: string;
  /** Unit template ID */
  unitId: string;
  /** Unit name */
  name: string;
  /** Unit role */
  role: string;
  /** Unit tier */
  tier: 1 | 2 | 3;
  /** Unit cost */
  cost: number;
  /** Unit stats */
  stats: {
    hp: number;
    atk: number;
    armor: number;
    speed: number;
    initiative: number;
    range: number;
    attackCount: number;
    dodge: number;
  };
  /** Unit ability (if any) */
  ability?: {
    id: string;
    name: string;
    description: string;
  };
}

/**
 * Draft result after submission.
 */
export interface DraftResult {
  /** Updated hand */
  hand: DeckCard[];
  /** Updated remaining deck */
  remainingDeck: DeckCard[];
  /** Hand size after draft */
  handSize: number;
  /** Remaining deck size */
  remainingDeckSize: number;
}

/**
 * Draft store state interface.
 */
interface DraftState {
  /** Available draft options */
  options: DraftOption[];
  /** Selected card instance IDs */
  selected: string[];
  /** Whether this is the initial draft (pick 3) or post-battle (pick 1) */
  isInitial: boolean;
  /** Required number of picks */
  requiredPicks: number;
  /** Remaining cards in deck */
  remainingInDeck: number;
  /** Loading state for draft operations */
  loading: boolean;
  /** Error message for draft operations */
  error: string | null;
  /** Whether draft is available */
  isDraftAvailable: boolean;
}

/**
 * Draft store actions interface.
 */
interface DraftActions {
  /** Load draft options for a run */
  loadDraft: (runId: string) => Promise<void>;
  /** Load initial draft options */
  loadInitialDraft: (runId: string) => Promise<void>;
  /** Load post-battle draft options */
  loadPostBattleDraft: (runId: string) => Promise<void>;
  /** Select a card for drafting */
  selectCard: (instanceId: string) => void;
  /** Deselect a card */
  deselectCard: (instanceId: string) => void;
  /** Toggle card selection */
  toggleCardSelection: (instanceId: string) => void;
  /** Submit draft picks */
  submitDraft: (runId: string) => Promise<DraftResult | null>;
  /** Check if draft is available */
  checkDraftAvailable: (runId: string) => Promise<void>;
  /** Clear draft state */
  clearDraft: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Complete draft store interface.
 */
type DraftStore = DraftState & DraftActions;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Initial draft: pick 3 from 5 */
const INITIAL_DRAFT_PICKS = 3;

/** Post-battle draft: pick 1 from 3 */
const POST_BATTLE_DRAFT_PICKS = 1;

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Draft store for roguelike draft management.
 * Handles draft loading, card selection, and submission.
 * 
 * @example
 * const { options, selected, selectCard, submitDraft } = useDraftStore();
 * 
 * // Load draft
 * await loadDraft('run-123');
 * 
 * // Select cards
 * selectCard('card-1');
 * selectCard('card-2');
 * 
 * // Submit draft
 * await submitDraft('run-123');
 */
export const useDraftStore = create<DraftStore>((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  options: [],
  selected: [],
  isInitial: true,
  requiredPicks: INITIAL_DRAFT_PICKS,
  remainingInDeck: 0,
  loading: false,
  error: null,
  isDraftAvailable: false,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Load draft options for a run.
   * Automatically determines if initial or post-battle draft.
   * 
   * @param runId - Run identifier
   * @throws ApiError if draft cannot be loaded
   * @example
   * await loadDraft('run-123');
   */
  loadDraft: async (runId: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.getRoguelikeDraft(runId);
      
      set({ 
        options: response.cards,
        isInitial: response.isInitial,
        requiredPicks: response.requiredPicks,
        remainingInDeck: response.remainingInDeck,
        selected: [],
        loading: false,
        isDraftAvailable: true,
        error: null 
      });
    } catch (error) {
      // 404 means no draft available (deck empty or draft already done)
      if (error instanceof ApiError && error.status === 404) {
        set({ 
          options: [],
          selected: [],
          loading: false,
          isDraftAvailable: false,
          error: null 
        });
        return;
      }
      
      // Network errors or other issues - show error but don't redirect
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error
          ? `Ошибка сети: ${error.message}`
          : 'Не удалось загрузить драфт';
      
      set({ 
        error: errorMessage, 
        loading: false,
        // Keep isDraftAvailable as undefined/previous state on network errors
        // so we don't incorrectly redirect
      });
    }
  },

  /**
   * Load initial draft options (pick 3 from 5).
   * 
   * @param runId - Run identifier
   * @throws ApiError if draft cannot be loaded
   * @example
   * await loadInitialDraft('run-123');
   */
  loadInitialDraft: async (runId: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.getRoguelikeInitialDraft(runId);
      
      set({ 
        options: response.cards,
        isInitial: true,
        requiredPicks: INITIAL_DRAFT_PICKS,
        remainingInDeck: response.remainingInDeck,
        selected: [],
        loading: false,
        isDraftAvailable: true,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить начальный драфт';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Load post-battle draft options (pick 1 from 3).
   * 
   * @param runId - Run identifier
   * @throws ApiError if draft cannot be loaded
   * @example
   * await loadPostBattleDraft('run-123');
   */
  loadPostBattleDraft: async (runId: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.getRoguelikePostBattleDraft(runId);
      
      set({ 
        options: response.cards,
        isInitial: false,
        requiredPicks: POST_BATTLE_DRAFT_PICKS,
        remainingInDeck: response.remainingInDeck,
        selected: [],
        loading: false,
        isDraftAvailable: true,
        error: null 
      });
    } catch (error) {
      // 404 means deck is empty, no more drafts
      if (error instanceof ApiError && error.status === 404) {
        set({ 
          options: [],
          selected: [],
          loading: false,
          isDraftAvailable: false,
          error: null 
        });
        return;
      }
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить драфт после боя';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Select a card for drafting.
   * Respects the required picks limit.
   * 
   * @param instanceId - Card instance ID to select
   * @example
   * selectCard('card-123');
   */
  selectCard: (instanceId: string) => {
    const { selected, requiredPicks, options } = get();
    
    // Check if card exists in options
    const cardExists = options.some(opt => opt.instanceId === instanceId);
    if (!cardExists) {
      set({ error: 'Карта не найдена в опциях драфта' });
      return;
    }
    
    // Check if already selected
    if (selected.includes(instanceId)) {
      return;
    }
    
    // Check if at max selections
    if (selected.length >= requiredPicks) {
      set({ error: `Можно выбрать только ${requiredPicks} карт(ы)` });
      return;
    }
    
    set({ 
      selected: [...selected, instanceId],
      error: null 
    });
  },

  /**
   * Deselect a card.
   * 
   * @param instanceId - Card instance ID to deselect
   * @example
   * deselectCard('card-123');
   */
  deselectCard: (instanceId: string) => {
    const { selected } = get();
    
    set({ 
      selected: selected.filter(id => id !== instanceId),
      error: null 
    });
  },

  /**
   * Toggle card selection.
   * 
   * @param instanceId - Card instance ID to toggle
   * @example
   * toggleCardSelection('card-123');
   */
  toggleCardSelection: (instanceId: string) => {
    const { selected } = get();
    
    if (selected.includes(instanceId)) {
      get().deselectCard(instanceId);
    } else {
      get().selectCard(instanceId);
    }
  },

  /**
   * Submit draft picks.
   * 
   * @param runId - Run identifier
   * @returns Draft result or null if failed
   * @throws ApiError if draft cannot be submitted
   * @example
   * const result = await submitDraft('run-123');
   */
  submitDraft: async (runId: string) => {
    const { selected, requiredPicks } = get();
    
    // Validate selection count
    if (selected.length !== requiredPicks) {
      set({ error: `Необходимо выбрать ${requiredPicks} карт(ы)` });
      return null;
    }
    
    set({ loading: true, error: null });
    
    try {
      const result = await api.submitRoguelikeDraft(runId, selected);
      
      // Clear draft state after successful submission
      set({ 
        options: [],
        selected: [],
        loading: false,
        isDraftAvailable: false,
        error: null 
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось отправить драфт';
      
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  /**
   * Check if draft is available for a run.
   * 
   * @param runId - Run identifier
   * @example
   * await checkDraftAvailable('run-123');
   */
  checkDraftAvailable: async (runId: string) => {
    try {
      const response = await api.getRoguelikeDraftStatus(runId);
      set({ isDraftAvailable: response.available });
    } catch (error) {
      set({ isDraftAvailable: false });
    }
  },

  /**
   * Clear draft state and prepare for new load.
   * Sets loading to true to show loader while new data loads.
   * 
   * @example
   * clearDraft();
   */
  clearDraft: () => {
    set({ 
      options: [],
      selected: [],
      isInitial: true,
      requiredPicks: INITIAL_DRAFT_PICKS,
      remainingInDeck: 0,
      loading: true, // Keep loading true to show loader until new data loads
      error: null,
      isDraftAvailable: false,
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
 * Selector for draft options.
 * 
 * @returns Draft options array
 * @example
 * const options = useDraftStore(selectDraftOptions);
 */
export const selectDraftOptions = (state: DraftStore) => state.options;

/**
 * Selector for selected cards.
 * 
 * @returns Selected card IDs
 * @example
 * const selected = useDraftStore(selectSelectedCards);
 */
export const selectSelectedCards = (state: DraftStore) => state.selected;

/**
 * Selector for draft loading state.
 * 
 * @returns True if draft operation is loading
 * @example
 * const isLoading = useDraftStore(selectDraftLoading);
 */
export const selectDraftLoading = (state: DraftStore) => state.loading;

/**
 * Selector for draft error state.
 * 
 * @returns Error message or null
 * @example
 * const error = useDraftStore(selectDraftError);
 */
export const selectDraftError = (state: DraftStore) => state.error;

/**
 * Selector for whether draft is complete (all picks made).
 * 
 * @returns True if required picks are selected
 * @example
 * const isComplete = useDraftStore(selectIsDraftComplete);
 */
export const selectIsDraftComplete = (state: DraftStore) => 
  state.selected.length === state.requiredPicks;

/**
 * Selector for remaining picks needed.
 * 
 * @returns Number of picks still needed
 * @example
 * const remaining = useDraftStore(selectRemainingPicks);
 */
export const selectRemainingPicks = (state: DraftStore) => 
  state.requiredPicks - state.selected.length;

/**
 * Selector for draft type info.
 * 
 * @returns Draft type information
 * @example
 * const draftInfo = useDraftStore(selectDraftInfo);
 */
export const selectDraftInfo = (state: DraftStore) => ({
  isInitial: state.isInitial,
  requiredPicks: state.requiredPicks,
  optionsCount: state.options.length,
  remainingInDeck: state.remainingInDeck,
  isDraftAvailable: state.isDraftAvailable,
});
