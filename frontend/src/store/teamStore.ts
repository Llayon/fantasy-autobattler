/**
 * Team store for Fantasy Autobattler.
 * Manages team creation, editing, and validation.
 * 
 * @fileoverview Zustand store for team-related state management.
 */

import { create } from 'zustand';
import { produce } from 'immer';
import { 
  UnitTemplate, 
  TeamResponse, 
  CreateTeamDto, 
  UnitSelection, 
  Position,
  UnitId 
} from '@/types/game';
import { api, ApiError } from '@/lib/api';

// =============================================================================
// AUTOSAVE UTILITIES
// =============================================================================

/** localStorage key for draft team autosave */
const DRAFT_TEAM_KEY = 'autobattler_draft_team';

/** Debounce delay for autosave (1 second) */
const AUTOSAVE_DELAY = 1000;

/**
 * Debounce function for autosave operations.
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Save team draft to localStorage.
 * 
 * @param draft - Team draft to save
 */
function saveDraftToLocalStorage(draft: TeamDraft): void {
  try {
    if (typeof window !== 'undefined') {
      const draftData = {
        ...draft,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_TEAM_KEY, JSON.stringify(draftData));
    }
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

/**
 * Load team draft from localStorage.
 * 
 * @returns Saved draft or null if not found
 */
function loadDraftFromLocalStorage(): (TeamDraft & { timestamp: number }) | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DRAFT_TEAM_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if draft is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
        if (Date.now() - parsed.timestamp < maxAge) {
          return parsed;
        } else {
          // Remove old draft
          localStorage.removeItem(DRAFT_TEAM_KEY);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
  }
  return null;
}

/**
 * Clear team draft from localStorage.
 */
function clearDraftFromLocalStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_TEAM_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
}

/**
 * Show toast notification for draft restoration.
 * 
 * @param message - Toast message
 */
function showDraftToast(message: string): void {
  // Simple toast implementation - can be enhanced with a proper toast library
  if (typeof window !== 'undefined') {
    // TODO: Integrate with proper toast system when available
    // For now, we'll skip logging to avoid console.log in production
    void message; // Acknowledge the parameter to avoid unused variable warning
  }
}

// =============================================================================
// UNDO/REDO UTILITIES
// =============================================================================

/**
 * Add current state to history stack for undo functionality.
 * Maintains maximum history size and clears future stack.
 * 
 * @param past - Current past states array
 * @param currentUnits - Current team units to save
 * @returns Updated past array with new state
 */
function addToHistory(past: UnitSelection[][], currentUnits: UnitSelection[]): UnitSelection[][] {
  const newPast = [...past, [...currentUnits]];
  
  // Maintain maximum history size
  if (newPast.length > MAX_HISTORY_SIZE) {
    return newPast.slice(1);
  }
  
  return newPast;
}

/**
 * Calculate total cost for a set of units.
 * 
 * @param units - Available unit templates
 * @param teamUnits - Team unit selections
 * @returns Total cost of all units
 */
function calculateTotalCost(units: UnitTemplate[], teamUnits: UnitSelection[]): number {
  return teamUnits.reduce((total, teamUnit) => {
    const unitTemplate = units.find(u => u.id === teamUnit.unitId);
    return total + (unitTemplate?.cost || 0);
  }, 0);
}

/**
 * Update computed properties for undo/redo state.
 * 
 * @param state - Current team state
 */
function updateComputedProperties(state: TeamState): void {
  state.canUndo = state.past.length > 0;
  state.canRedo = state.future.length > 0;
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Team draft for editing before saving.
 */
interface TeamDraft {
  /** Team name */
  name: string;
  /** Selected units with positions */
  units: UnitSelection[];
  /** Total team cost */
  totalCost: number;
  /** Whether team is valid (within budget and rules) */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
}

/**
 * Team store state interface.
 */
interface TeamState {
  /** All available units from API */
  units: UnitTemplate[];
  /** Player's saved teams */
  teams: TeamResponse[];
  /** Currently active team for matchmaking */
  activeTeam: TeamResponse | null;
  /** Current team being edited */
  currentTeam: TeamDraft;
  /** Loading state for team operations */
  loading: boolean;
  /** Error message for team operations */
  error: string | null;
  /** Whether units have been loaded */
  unitsLoaded: boolean;
  /** Whether draft was restored from localStorage */
  draftRestored: boolean;
  /** History stack for undo functionality (max 20 states) */
  past: UnitSelection[][];
  /** Future stack for redo functionality */
  future: UnitSelection[][];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Team store actions interface.
 */
interface TeamActions {
  /** Load all available units */
  loadUnits: () => Promise<void>;
  /** Load player's teams */
  loadTeams: () => Promise<void>;
  /** Create new team draft */
  createNewTeam: (name?: string) => void;
  /** Load existing team into draft */
  loadTeamToDraft: (team: TeamResponse) => void;
  /** Add unit to current team draft */
  addUnitToTeam: (unitId: UnitId, position: Position) => void;
  /** Remove unit from current team draft */
  removeUnitFromTeam: (index: number) => void;
  /** Update unit position in team draft */
  updateUnitPosition: (index: number, position: Position) => void;
  /** Update team name */
  updateTeamName: (name: string) => void;
  /** Validate current team draft */
  validateTeam: () => void;
  /** Save current team draft */
  saveTeam: () => Promise<TeamResponse | null>;
  /** Update existing team */
  updateTeam: (teamId: string) => Promise<TeamResponse | null>;
  /** Delete team */
  deleteTeam: (teamId: string) => Promise<void>;
  /** Activate team for matchmaking */
  activateTeam: (teamId: string) => Promise<void>;
  /** Update saved team name */
  updateSavedTeamName: (teamId: string, newName: string) => Promise<void>;
  /** Load draft from localStorage on app start */
  loadDraftFromStorage: () => void;
  /** Clear current draft and localStorage */
  clearDraft: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Undo last team modification */
  undo: () => void;
  /** Redo last undone modification */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Complete team store interface.
 */
type TeamStore = TeamState & TeamActions;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum team budget */
const MAX_BUDGET = 30;

/** Maximum units per team */
const MAX_UNITS = 10;

/** Maximum history states for undo/redo */
const MAX_HISTORY_SIZE = 20;

/** Default team draft */
const DEFAULT_TEAM_DRAFT: TeamDraft = {
  name: '',
  units: [],
  totalCost: 0,
  isValid: false,
  errors: [],
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Team store for team building and management.
 * Handles unit selection, team validation, and CRUD operations.
 * 
 * @example
 * const { units, currentTeam, addUnitToTeam, saveTeam } = useTeamStore();
 * 
 * // Load units
 * await loadUnits();
 * 
 * // Create new team
 * createNewTeam('My Team');
 * addUnitToTeam('knight', { x: 0, y: 0 });
 * await saveTeam();
 */
export const useTeamStore = create<TeamStore>((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  units: [],
  teams: [],
  activeTeam: null,
  currentTeam: { ...DEFAULT_TEAM_DRAFT },
  loading: false,
  error: null,
  unitsLoaded: false,
  draftRestored: false,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Load all available units from API.
   * 
   * @throws ApiError if units cannot be loaded
   * @example
   * await loadUnits();
   */
  loadUnits: async () => {
    const { unitsLoaded } = get();
    
    if (unitsLoaded) return;

    set({ loading: true, error: null });
    
    try {
      const response = await api.getUnits();
      set({ 
        units: response.units, 
        unitsLoaded: true, 
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить юниты';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Load player's teams from API.
   * 
   * @throws ApiError if teams cannot be loaded
   * @example
   * await loadTeams();
   */
  loadTeams: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.getTeams();
      const activeTeam = response.teams.find(team => team.isActive) || null;
      
      set({ 
        teams: response.teams, 
        activeTeam,
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось загрузить команды';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Create new team draft for editing.
   * 
   * @param name - Optional team name
   * @example
   * createNewTeam('My New Team');
   */
  createNewTeam: (name = 'Новая команда') => {
    set(produce((state: TeamState) => {
      state.currentTeam = {
        ...DEFAULT_TEAM_DRAFT,
        name,
      };
      state.error = null;
      state.past = [];
      state.future = [];
      updateComputedProperties(state);
    }));
  },

  /**
   * Load existing team into draft for editing.
   * 
   * @param team - Team to load into draft
   * @example
   * loadTeamToDraft(existingTeam);
   */
  loadTeamToDraft: (team: TeamResponse) => {
    const currentTeam: TeamDraft = {
      name: team.name,
      units: team.units.map(unit => ({
        unitId: unit.unitId,
        position: unit.position,
      })),
      totalCost: team.totalCost,
      isValid: true,
      errors: [],
    };
    
    set({ currentTeam, error: null });
  },

  /**
   * Add unit to current team draft.
   * 
   * @param unitId - Unit identifier to add
   * @param position - Position on battlefield
   * @example
   * addUnitToTeam('knight', { x: 0, y: 0 });
   */
  addUnitToTeam: (unitId: UnitId, position: Position) => {
    const { currentTeam, units, past } = get();
    
    // Find unit template
    const unitTemplate = units.find(u => u.id === unitId);
    if (!unitTemplate) {
      set({ error: 'Юнит не найден' });
      return;
    }

    // Check budget before adding unit
    const newTotalCost = currentTeam.totalCost + unitTemplate.cost;
    if (newTotalCost > MAX_BUDGET) {
      set({ error: `Превышен бюджет: ${newTotalCost}/${MAX_BUDGET}. Нельзя добавить юнита стоимостью ${unitTemplate.cost}.` });
      return;
    }

    // Check if position is already occupied
    const positionOccupied = currentTeam.units.some(
      unit => unit.position.x === position.x && unit.position.y === position.y
    );
    
    if (positionOccupied) {
      set({ error: 'Позиция уже занята' });
      return;
    }

    // Check max units limit
    if (currentTeam.units.length >= MAX_UNITS) {
      set({ error: `Максимум ${MAX_UNITS} юнитов в команде` });
      return;
    }

    // Save current state to history before making changes
    const newPast = addToHistory(past, currentTeam.units);

    // Add unit to team
    const newUnits = [...currentTeam.units, { unitId, position }];
    
    const updatedTeam: TeamDraft = {
      ...currentTeam,
      units: newUnits,
      totalCost: newTotalCost,
      isValid: newTotalCost <= MAX_BUDGET && newUnits.length > 0,
      errors: [],
    };
    
    // Update state with history and clear future (redo stack)
    set(produce((state: TeamState) => {
      state.currentTeam = updatedTeam;
      state.error = null;
      state.past = newPast;
      state.future = []; // Clear redo stack when new action is performed
      updateComputedProperties(state);
    }));
  },

  /**
   * Remove unit from current team draft.
   * 
   * @param index - Index of unit to remove
   * @example
   * removeUnitFromTeam(0);
   */
  removeUnitFromTeam: (index: number) => {
    const { currentTeam, units, past } = get();
    
    if (index < 0 || index >= currentTeam.units.length) {
      set({ error: 'Неверный индекс юнита' });
      return;
    }

    const unitToRemove = currentTeam.units[index];
    if (!unitToRemove) {
      set({ error: 'Юнит не найден по индексу' });
      return;
    }

    const unitTemplate = units.find(u => u.id === unitToRemove.unitId);
    
    if (!unitTemplate) {
      set({ error: 'Юнит не найден' });
      return;
    }

    // Save current state to history before making changes
    const newPast = addToHistory(past, currentTeam.units);

    const newUnits = currentTeam.units.filter((_, i) => i !== index);
    const newTotalCost = currentTeam.totalCost - unitTemplate.cost;
    
    const updatedTeam: TeamDraft = {
      ...currentTeam,
      units: newUnits,
      totalCost: newTotalCost,
      isValid: newTotalCost <= MAX_BUDGET && newUnits.length > 0,
      errors: newUnits.length === 0 ? ['Команда не может быть пустой'] : [],
    };
    
    // Update state with history and clear future (redo stack)
    set(produce((state: TeamState) => {
      state.currentTeam = updatedTeam;
      state.error = null;
      state.past = newPast;
      state.future = []; // Clear redo stack when new action is performed
      updateComputedProperties(state);
    }));
  },

  /**
   * Update unit position in team draft.
   * 
   * @param index - Index of unit to update
   * @param position - New position
   * @example
   * updateUnitPosition(0, { x: 1, y: 0 });
   */
  updateUnitPosition: (index: number, position: Position) => {
    const { currentTeam, past } = get();
    
    if (index < 0 || index >= currentTeam.units.length) {
      set({ error: 'Неверный индекс юнита' });
      return;
    }

    // Check if new position is occupied by another unit
    const positionOccupied = currentTeam.units.some(
      (unit, i) => i !== index && unit.position.x === position.x && unit.position.y === position.y
    );
    
    if (positionOccupied) {
      set({ error: 'Позиция уже занята' });
      return;
    }

    // Save current state to history before making changes
    const newPast = addToHistory(past, currentTeam.units);

    const newUnits = [...currentTeam.units];
    const unitToUpdate = newUnits[index];
    if (!unitToUpdate) {
      set({ error: 'Юнит не найден по индексу' });
      return;
    }
    
    newUnits[index] = { 
      unitId: unitToUpdate.unitId, 
      position 
    };
    
    const updatedTeam: TeamDraft = {
      ...currentTeam,
      units: newUnits,
    };
    
    // Update state with history and clear future (redo stack)
    set(produce((state: TeamState) => {
      state.currentTeam = updatedTeam;
      state.error = null;
      state.past = newPast;
      state.future = []; // Clear redo stack when new action is performed
      updateComputedProperties(state);
    }));
  },

  /**
   * Update team name.
   * 
   * @param name - New team name
   * @example
   * updateTeamName('Updated Team Name');
   */
  updateTeamName: (name: string) => {
    const { currentTeam } = get();
    
    const updatedTeam: TeamDraft = {
      ...currentTeam,
      name: name.trim(),
    };
    
    set({ currentTeam: updatedTeam });
  },

  /**
   * Validate current team draft.
   * Updates validation state and errors.
   * 
   * @example
   * validateTeam();
   */
  validateTeam: () => {
    const { currentTeam } = get();
    const errors: string[] = [];
    
    // Check team name
    if (!currentTeam.name.trim()) {
      errors.push('Название команды не может быть пустым');
    }
    
    // Check units count
    if (currentTeam.units.length === 0) {
      errors.push('Команда не может быть пустой');
    }
    
    // Check budget
    if (currentTeam.totalCost > MAX_BUDGET) {
      errors.push(`Превышен бюджет: ${currentTeam.totalCost}/${MAX_BUDGET}`);
    }
    
    // Check position conflicts
    const positions = new Set<string>();
    for (const unit of currentTeam.units) {
      const posKey = `${unit.position.x},${unit.position.y}`;
      if (positions.has(posKey)) {
        errors.push('Обнаружены конфликты позиций');
        break;
      }
      positions.add(posKey);
    }
    
    // Check deployment zone (rows 0-1)
    const invalidPositions = currentTeam.units.filter(
      unit => unit.position.y < 0 || unit.position.y > 1
    );
    if (invalidPositions.length > 0) {
      errors.push('Юниты должны быть размещены в зоне развертывания (ряды 0-1)');
    }
    
    const updatedTeam: TeamDraft = {
      ...currentTeam,
      isValid: errors.length === 0,
      errors,
    };
    
    set({ currentTeam: updatedTeam });
  },

  /**
   * Save current team draft as new team.
   * 
   * @returns Created team or null if failed
   * @throws ApiError if team cannot be saved
   * @example
   * const team = await saveTeam();
   */
  saveTeam: async () => {
    const { currentTeam } = get();
    
    // Validate before saving
    get().validateTeam();
    
    if (!get().currentTeam.isValid) {
      set({ error: 'Команда содержит ошибки и не может быть сохранена' });
      return null;
    }

    set({ loading: true, error: null });
    
    try {
      const teamData: CreateTeamDto = {
        name: currentTeam.name,
        units: currentTeam.units,
      };
      
      const savedTeam = await api.createTeam(teamData);
      
      // Auto-activate the saved team for better UX
      try {
        const activatedTeam = await api.activateTeam(savedTeam.id);
        
        // Refresh teams list to get updated data from server
        await get().loadTeams();
        
        // Update active team
        set({
          activeTeam: activatedTeam,
          loading: false,
        });
        
        return activatedTeam;
      } catch (activateError) {
        // If activation fails, still refresh teams list
        await get().loadTeams();
        set({ loading: false });
        return savedTeam;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось сохранить команду';
      
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  /**
   * Update existing team with current draft.
   * 
   * @param teamId - ID of team to update
   * @returns Updated team or null if failed
   * @throws ApiError if team cannot be updated
   * @example
   * const team = await updateTeam('team-123');
   */
  updateTeam: async (teamId: string) => {
    const { currentTeam } = get();
    
    // Validate before updating
    get().validateTeam();
    
    if (!get().currentTeam.isValid) {
      set({ error: 'Команда содержит ошибки и не может быть обновлена' });
      return null;
    }

    set({ loading: true, error: null });
    
    try {
      const teamData: Partial<CreateTeamDto> = {
        name: currentTeam.name,
        units: currentTeam.units,
      };
      
      const updatedTeam = await api.updateTeam(teamId, teamData);
      
      // Refresh teams list
      await get().loadTeams();
      
      set({ loading: false });
      return updatedTeam;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось обновить команду';
      
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  /**
   * Delete team by ID.
   * 
   * @param teamId - ID of team to delete
   * @throws ApiError if team cannot be deleted
   * @example
   * await deleteTeam('team-123');
   */
  deleteTeam: async (teamId: string) => {
    set({ loading: true, error: null });
    
    try {
      await api.deleteTeam(teamId);
      
      // Refresh teams list
      await get().loadTeams();
      
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось удалить команду';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Activate team for matchmaking.
   * 
   * @param teamId - ID of team to activate
   * @throws ApiError if team cannot be activated
   * @example
   * await activateTeam('team-123');
   */
  activateTeam: async (teamId: string) => {
    set({ loading: true, error: null });
    
    try {
      const activatedTeam = await api.activateTeam(teamId);
      
      // Update active team in state
      set(state => ({
        activeTeam: activatedTeam,
        teams: state.teams.map(team => ({
          ...team,
          isActive: team.id === teamId,
        })),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось активировать команду';
      
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Update saved team name only.
   * 
   * @param teamId - ID of team to update
   * @param newName - New team name
   * @throws ApiError if team cannot be updated
   * @example
   * await updateSavedTeamName('team-123', 'New Team Name');
   */
  updateSavedTeamName: async (teamId: string, newName: string) => {
    set({ loading: true, error: null });
    
    try {
      const updatedTeam = await api.updateTeam(teamId, { name: newName });
      
      // Update team in state
      set(state => ({
        teams: state.teams.map(team => 
          team.id === teamId ? updatedTeam : team
        ),
        activeTeam: state.activeTeam?.id === teamId ? updatedTeam : state.activeTeam,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Не удалось обновить название команды';
      
      set({ error: errorMessage, loading: false });
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

  /**
   * Undo last team modification.
   * Restores previous state from history stack.
   * 
   * @example
   * undo();
   */
  undo: () => {
    const { past, currentTeam, future, units } = get();
    
    if (past.length === 0) {
      return; // Nothing to undo
    }
    
    // Get the last state from past
    const previousUnits = past[past.length - 1];
    if (!previousUnits) {
      return; // Safety check - should not happen
    }
    
    const newPast = past.slice(0, -1);
    
    // Add current state to future for redo
    const newFuture = [currentTeam.units, ...future];
    
    // Calculate new total cost
    const newTotalCost = calculateTotalCost(units, previousUnits);
    
    // Update state with previous units
    set(produce((state: TeamState) => {
      state.past = newPast;
      state.future = newFuture;
      state.currentTeam.units = previousUnits;
      state.currentTeam.totalCost = newTotalCost;
      state.currentTeam.isValid = newTotalCost <= MAX_BUDGET && previousUnits.length > 0;
      state.currentTeam.errors = newTotalCost > MAX_BUDGET ? [`Превышен бюджет: ${newTotalCost}/${MAX_BUDGET}`] : [];
      updateComputedProperties(state);
    }));
  },

  /**
   * Redo last undone modification.
   * Restores next state from future stack.
   * 
   * @example
   * redo();
   */
  redo: () => {
    const { past, currentTeam, future, units } = get();
    
    if (future.length === 0) {
      return; // Nothing to redo
    }
    
    // Get the next state from future
    const nextUnits = future[0];
    if (!nextUnits) {
      return; // Safety check - should not happen
    }
    
    const newFuture = future.slice(1);
    
    // Add current state to past
    const newPast = addToHistory(past, currentTeam.units);
    
    // Calculate new total cost
    const newTotalCost = calculateTotalCost(units, nextUnits);
    
    // Update state with next units
    set(produce((state: TeamState) => {
      state.past = newPast;
      state.future = newFuture;
      state.currentTeam.units = nextUnits;
      state.currentTeam.totalCost = newTotalCost;
      state.currentTeam.isValid = newTotalCost <= MAX_BUDGET && nextUnits.length > 0;
      state.currentTeam.errors = newTotalCost > MAX_BUDGET ? [`Превышен бюджет: ${newTotalCost}/${MAX_BUDGET}`] : [];
      updateComputedProperties(state);
    }));
  },

  /**
   * Load draft from localStorage on app start.
   * Restores previously saved team draft if available.
   * 
   * @example
   * loadDraftFromStorage();
   */
  loadDraftFromStorage: () => {
    const savedDraft = loadDraftFromLocalStorage();
    if (savedDraft) {
      const { timestamp, ...draft } = savedDraft;
      // timestamp is used for age validation but not needed here
      void timestamp;
      set({ 
        currentTeam: draft,
        draftRestored: true,
      });
      showDraftToast('Restored draft team from previous session');
    }
  },

  /**
   * Clear current draft and localStorage.
   * Resets team to default state and removes autosave.
   * 
   * @example
   * clearDraft();
   */
  clearDraft: () => {
    clearDraftFromLocalStorage();
    set({ 
      currentTeam: { ...DEFAULT_TEAM_DRAFT },
      draftRestored: false,
    });
  },
}));

// =============================================================================
// AUTOSAVE INTEGRATION
// =============================================================================

// Create debounced autosave function
const debouncedAutosave = debounce((draft: TeamDraft) => {
  // Only autosave if team has units (don't save empty teams)
  if (draft.units.length > 0) {
    saveDraftToLocalStorage(draft);
  }
}, AUTOSAVE_DELAY);

// Enhance store with autosave functionality
const originalStore = useTeamStore.getState();
const originalAddUnitToTeam = originalStore.addUnitToTeam;
const originalRemoveUnitFromTeam = originalStore.removeUnitFromTeam;
const originalUpdateUnitPosition = originalStore.updateUnitPosition;
const originalUpdateTeamName = originalStore.updateTeamName;
const originalSaveTeam = originalStore.saveTeam;

// Override methods to include autosave
useTeamStore.setState({
  addUnitToTeam: (unitId: UnitId, position: Position) => {
    originalAddUnitToTeam(unitId, position);
    const { currentTeam } = useTeamStore.getState();
    debouncedAutosave(currentTeam);
  },

  removeUnitFromTeam: (index: number) => {
    originalRemoveUnitFromTeam(index);
    const { currentTeam } = useTeamStore.getState();
    debouncedAutosave(currentTeam);
  },

  updateUnitPosition: (index: number, position: Position) => {
    originalUpdateUnitPosition(index, position);
    const { currentTeam } = useTeamStore.getState();
    debouncedAutosave(currentTeam);
  },

  updateTeamName: (name: string) => {
    originalUpdateTeamName(name);
    const { currentTeam } = useTeamStore.getState();
    debouncedAutosave(currentTeam);
  },

  saveTeam: async () => {
    const result = await originalSaveTeam();
    if (result) {
      // Clear draft from localStorage after successful save
      clearDraftFromLocalStorage();
      useTeamStore.setState({ draftRestored: false });
    }
    return result;
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector for available units.
 * 
 * @returns Array of unit templates
 * @example
 * const units = useTeamStore(selectUnits);
 */
export const selectUnits = (state: TeamStore) => state.units;

/**
 * Selector for player's teams.
 * 
 * @returns Array of saved teams
 * @example
 * const teams = useTeamStore(selectTeams);
 */
export const selectTeams = (state: TeamStore) => state.teams;

/**
 * Selector for active team.
 * 
 * @returns Active team or null
 * @example
 * const activeTeam = useTeamStore(selectActiveTeam);
 */
export const selectActiveTeam = (state: TeamStore) => state.activeTeam;

/**
 * Selector for current team draft.
 * 
 * @returns Current team being edited
 * @example
 * const currentTeam = useTeamStore(selectCurrentTeam);
 */
export const selectCurrentTeam = (state: TeamStore) => state.currentTeam;

/**
 * Selector for team loading state.
 * 
 * @returns True if any team operation is loading
 * @example
 * const isLoading = useTeamStore(selectTeamLoading);
 */
export const selectTeamLoading = (state: TeamStore) => state.loading;

/**
 * Selector for team error state.
 * 
 * @returns Error message or null
 * @example
 * const error = useTeamStore(selectTeamError);
 */
export const selectTeamError = (state: TeamStore) => state.error;