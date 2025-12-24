/**
 * Team Builder page for Fantasy Autobattler.
 * Main page for building teams with drag-and-drop interface.
 * 
 * @fileoverview Complete team building interface with unit selection and grid placement.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Position, UnitTemplate, UnitId, TeamResponse } from '@/types/game';
import { DragDropProvider, DragDropHandlers } from '@/components/DragDropProvider';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { SavedTeamsPanel } from '@/components/SavedTeamsPanel';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import UnitDetailModal from '@/components/UnitDetailModal';
import { ResponsiveTeamBuilder, TeamActions } from '@/components/ResponsiveTeamBuilder';
import { UndoRedoControls } from '@/components/UndoRedoControls';
import { 
  usePlayerStore, 
  useTeamStore, 
  useMatchmakingStore,
  selectPlayer, 
  selectPlayerLoading, 
  selectPlayerError,
  selectUnits,
  selectCurrentTeam,
  selectTeamLoading,
  selectTeamError,
  selectTeams,
  selectMatchmakingStatus,
  selectMatch,
  selectMatchmakingError,
  selectMatchmakingLoading,
  initializeStores
} from '@/store';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum team budget */
const MAX_BUDGET = 30;

/** Player deployment zone rows */
const PLAYER_ROWS = [0, 1];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if position is in player deployment zone.
 * 
 * @param position - Grid position to check
 * @returns True if position is in player zone (rows 0-1)
 */
function isPlayerZone(position: Position): boolean {
  return PLAYER_ROWS.includes(position.y);
}

/**
 * Convert team units to grid units for BattleGrid.
 * 
 * @param units - Available unit templates
 * @param teamUnits - Current team unit selections
 * @returns Grid units array
 */
function teamToGridUnits(units: UnitTemplate[], teamUnits: Array<{ unitId: UnitId; position: Position }>) {
  return teamUnits.map(teamUnit => {
    const unitTemplate = units.find(u => u.id === teamUnit.unitId);
    if (!unitTemplate) return null;
    
    return {
      unit: unitTemplate,
      position: teamUnit.position,
      team: 'player' as const,
      alive: true,
    };
  }).filter((unit): unit is NonNullable<typeof unit> => unit !== null);
}

// =============================================================================
// COMPONENTS
// =============================================================================





// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Team Builder page component.
 * Complete team building interface with unit selection and grid placement.
 * 
 * @example
 * // Used as main page
 * export default function Home() {
 *   return <TeamBuilderPage />;
 * }
 */
export default function TeamBuilderPage() {
  const router = useRouter();
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [showSavedTeamsModal, setShowSavedTeamsModal] = useState(false);
  const [unitDetailModal, setUnitDetailModal] = useState<{
    isOpen: boolean;
    unit: UnitTemplate | null;
  }>({ isOpen: false, unit: null });
  
  // Ref to track if battle was started on this page
  const battleStartedOnPageRef = useRef(false);
  // Ref to track if initial cleanup was done
  const initialCleanupDoneRef = useRef(false);
  
  // Store selectors
  const player = usePlayerStore(selectPlayer);
  const playerLoading = usePlayerStore(selectPlayerLoading);
  const playerError = usePlayerStore(selectPlayerError);
  
  const units = useTeamStore(selectUnits);
  const currentTeam = useTeamStore(selectCurrentTeam);
  const teamLoading = useTeamStore(selectTeamLoading);
  const teamError = useTeamStore(selectTeamError);
  const teams = useTeamStore(selectTeams);
  
  // Matchmaking selectors
  const matchmakingStatus = useMatchmakingStore(selectMatchmakingStatus);
  const match = useMatchmakingStore(selectMatch);
  const matchmakingError = useMatchmakingStore(selectMatchmakingError);
  const matchmakingLoading = useMatchmakingStore(selectMatchmakingLoading);
  
  // Store actions
  const { initPlayer } = usePlayerStore();
  const { 
    addUnitToTeam, 
    removeUnitFromTeam, 
    createNewTeam, 
    saveTeam, 
    validateTeam,
    loadTeams,
    loadTeamToDraft
  } = useTeamStore();
  
  // Initialize stores on mount and clear stale matchmaking state
  useEffect(() => {
    const init = async () => {
      // Clear stale matchmaking state on mount (prevents redirect loops)
      if (!initialCleanupDoneRef.current) {
        initialCleanupDoneRef.current = true;
        const { status, match: staleMatch } = useMatchmakingStore.getState();
        if (status === 'matched' && staleMatch) {
          useMatchmakingStore.getState().reset();
        }
      }
      
      await initPlayer();
      await initializeStores();
      
      // Load draft from localStorage if available
      const { loadDraftFromStorage } = useTeamStore.getState();
      loadDraftFromStorage();
    };
    init();
  }, [initPlayer]);
  
  // Create new team on mount
  useEffect(() => {
    if (units.length > 0 && currentTeam.units.length === 0) {
      createNewTeam('Новая команда');
    }
  }, [units.length, currentTeam.units.length, createNewTeam]);

  // Navigate to battle when match is found (only if battle was started on this page)
  useEffect(() => {
    if (matchmakingStatus === 'matched' && match?.battleId && battleStartedOnPageRef.current) {
      router.push(`/battle/${match.battleId}`);
    }
  }, [matchmakingStatus, match?.battleId, router]);
  
  // Handle unit selection from list
  const handleUnitSelect = useCallback((unit: UnitTemplate | null) => {
    setSelectedUnit(unit);
    setIsMobileSheetOpen(false); // Close mobile sheet on selection
  }, []);

  /**
   * Handle opening unit detail modal.
   * 
   * @param unit - Unit to show details for
   */
  const handleUnitDetail = useCallback((unit: UnitTemplate) => {

    setUnitDetailModal({ isOpen: true, unit });
  }, []);

  /**
   * Handle closing unit detail modal.
   */
  const handleCloseUnitDetail = useCallback(() => {
    setUnitDetailModal({ isOpen: false, unit: null });
  }, []);

  /**
   * Handle adding unit to team from detail modal.
   * Finds first available position in player deployment zone.
   * 
   * @param unit - Unit to add to team
   */
  const handleAddUnitFromModal = useCallback((unit: UnitTemplate) => {
    // Find first available position in player zone
    for (const y of PLAYER_ROWS) {
      for (let x = 0; x < 8; x++) {
        const position = { x, y };
        const isOccupied = currentTeam.units.some(
          teamUnit => teamUnit.position.x === x && teamUnit.position.y === y
        );
        if (!isOccupied) {
          addUnitToTeam(unit.id, position);
          return;
        }
      }
    }
    // If no free position found, show error (this should be handled by canAdd logic)
  }, [currentTeam.units, addUnitToTeam]);
  
  // Handle grid cell click for unit placement
  const handleGridCellClick = useCallback((position: Position) => {
    // Check if position is in player zone
    if (!isPlayerZone(position)) {
      return; // Only allow placement in player zone
    }
    
    // Check if there's a unit at this position
    const existingUnitIndex = currentTeam.units.findIndex(
      unit => unit.position.x === position.x && unit.position.y === position.y
    );
    
    if (existingUnitIndex >= 0) {
      // Remove existing unit
      removeUnitFromTeam(existingUnitIndex);
    } else if (selectedUnit) {
      // Add selected unit to position
      addUnitToTeam(selectedUnit.id, position);
      setSelectedUnit(null); // Clear selection after placement
    }
  }, [selectedUnit, currentTeam.units, addUnitToTeam, removeUnitFromTeam]);
  
  // Enhanced drag and drop handlers
  const dragDropHandlers: DragDropHandlers = {
    onUnitDropOnGrid: useCallback((unit: UnitTemplate, position: Position) => {
      // Check if position is in player zone
      if (!isPlayerZone(position)) {
        return; // Only allow drops in player zone
      }
      
      // Check if there's a unit at this position
      const existingUnitIndex = currentTeam.units.findIndex(
        teamUnit => teamUnit.position.x === position.x && teamUnit.position.y === position.y
      );
      
      if (existingUnitIndex >= 0) {
        // Remove existing unit first, then add new unit
        removeUnitFromTeam(existingUnitIndex);
      }
      
      // Add the dropped unit
      addUnitToTeam(unit.id, position);
    }, [currentTeam.units, addUnitToTeam, removeUnitFromTeam]),
    
    onUnitDropOnList: useCallback((_unit: UnitTemplate, originalPosition?: Position) => {
      // Remove unit from team when dropped back to list
      if (originalPosition) {
        const unitIndex = currentTeam.units.findIndex(
          teamUnit => teamUnit.position.x === originalPosition.x && teamUnit.position.y === originalPosition.y
        );
        if (unitIndex >= 0) {
          removeUnitFromTeam(unitIndex);
        }
      }
    }, [currentTeam.units, removeUnitFromTeam]),
    
    onDragStart: useCallback((unit: UnitTemplate, source: 'list' | 'grid') => {
      // Visual feedback on drag start
      if (source === 'list') {
        setSelectedUnit(unit);
      }
    }, []),
    
    onDragEnd: useCallback(() => {
      // Clear selection on drag end
      setSelectedUnit(null);
    }, []),
    
    onDragOver: useCallback(() => {
      // Could add hover effects here if needed
    }, []),
  };
  
  // Handle team actions
  const handleSaveTeam = useCallback(async () => {
    validateTeam();
    if (currentTeam.isValid) {
      const savedTeam = await saveTeam();
      if (savedTeam) {
        // Refresh teams list after successful save
        await loadTeams();
      }
    }
  }, [validateTeam, currentTeam.isValid, saveTeam, loadTeams]);
  
  const handleClearTeam = useCallback(() => {
    createNewTeam('Новая команда');
    setSelectedUnit(null);
  }, [createNewTeam]);
  
  const handleStartBattle = useCallback(async () => {
    // Prevent multiple clicks while battle is being created
    const { loading: isMatchmakingLoading } = useMatchmakingStore.getState();
    if (isMatchmakingLoading) {
      return;
    }
    
    if (!currentTeam.isValid || currentTeam.units.length === 0) {
      return;
    }

    // Save the team first to get an ID
    const savedTeam = await saveTeam();
    if (!savedTeam) {
      return; // Save failed
    }

    // Mark that battle was started on this page (for redirect logic)
    battleStartedOnPageRef.current = true;
    
    // Start bot battle for now (can be changed to PvP later)
    const { startBotBattle } = useMatchmakingStore.getState();
    try {
      await startBotBattle(savedTeam.id, 'medium');
    } catch (error) {
      battleStartedOnPageRef.current = false;
    }
  }, [currentTeam.isValid, currentTeam.units.length, saveTeam]);

  const handleShowTeams = useCallback(() => {
    setShowSavedTeamsModal(true);
  }, []);

  const handleLoadTeam = useCallback((team: TeamResponse) => {
    loadTeamToDraft(team);
    setSelectedUnit(null);
  }, [loadTeamToDraft]);

  /**
   * Check if unit can be added to current team.
   * 
   * @param unit - Unit to check
   * @returns True if unit can be added
   */
  const getCanAddUnit = useCallback((unit: UnitTemplate | null): boolean => {
    if (!unit) return false;
    
    // Check if unit is already in team
    const isAlreadyInTeam = currentTeam.units.some(teamUnit => teamUnit.unitId === unit.id);
    if (isAlreadyInTeam) return false;
    
    // Check if adding unit would exceed budget
    const newTotalCost = currentTeam.totalCost + unit.cost;
    if (newTotalCost > MAX_BUDGET) return false;
    
    // Check if there's space on the grid
    const occupiedPositions = currentTeam.units.length;
    const maxPositions = PLAYER_ROWS.length * 8; // 2 rows × 8 columns = 16 positions
    if (occupiedPositions >= maxPositions) return false;
    
    return true;
  }, [currentTeam.units, currentTeam.totalCost]);

  /**
   * Get reason why unit cannot be added to team.
   * 
   * @param unit - Unit to check
   * @returns Reason string or undefined if unit can be added
   */
  const getCannotAddReason = useCallback((unit: UnitTemplate | null): string | undefined => {
    if (!unit) return undefined;
    
    // Check if unit is already in team
    const isAlreadyInTeam = currentTeam.units.some(teamUnit => teamUnit.unitId === unit.id);
    if (isAlreadyInTeam) return 'Юнит уже в команде';
    
    // Check if adding unit would exceed budget
    const newTotalCost = currentTeam.totalCost + unit.cost;
    if (newTotalCost > MAX_BUDGET) {
      const exceededBy = newTotalCost - MAX_BUDGET;
      return `Превышен бюджет на ${exceededBy} очков`;
    }
    
    // Check if there's space on the grid
    const occupiedPositions = currentTeam.units.length;
    const maxPositions = PLAYER_ROWS.length * 8; // 2 rows × 8 columns = 16 positions
    if (occupiedPositions >= maxPositions) return 'Нет свободных позиций на поле';
    
    return undefined;
  }, [currentTeam.units, currentTeam.totalCost]);
  
  // Get disabled units (already in team)
  const disabledUnits = currentTeam.units.map(unit => unit.unitId);
  
  // Convert team to grid units
  const gridUnits = teamToGridUnits(units, currentTeam.units);
  
  // Create highlighted cells for valid placement zones
  const highlightedCells = PLAYER_ROWS.flatMap(y => 
    Array.from({ length: 8 }, (_, x) => ({
      position: { x, y },
      type: 'valid' as const,
    }))
  );
  
  // Loading state
  if (playerLoading && !player) {
    return <FullPageLoader message="Загрузка игрока..." icon="👤" />;
  }
  
  // Error state
  if (playerError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl text-red-400 mb-2">{playerError}</div>
          <p className="text-gray-400">Убедитесь, что backend запущен на localhost:3001</p>
        </div>
      </div>
    );
  }
  
  // Prepare team actions for ResponsiveTeamBuilder
  const teamActions: TeamActions = {
    onSave: handleSaveTeam,
    onClear: handleClearTeam,
    onStartBattle: handleStartBattle,
    onShowTeams: handleShowTeams,
    canSave: currentTeam.isValid && currentTeam.units.length > 0,
    canBattle: currentTeam.isValid && currentTeam.units.length > 0 && !matchmakingLoading,
    loading: teamLoading || matchmakingLoading,
    teamCount: teams.length,
  };

  return (
    <DragDropProvider handlers={dragDropHandlers} enabled={true}>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Desktop Header */}
        <header className="hidden lg:block bg-gray-800/50 border-b border-gray-700 h-16">
          <div className="max-w-7xl mx-auto h-full px-4">
            <div className="flex items-center justify-between h-full">
              {/* Title and Navigation */}
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-lg font-semibold text-yellow-400">
                    🎮 Team Builder
                  </h1>
                  {player && (
                    <p className="text-gray-300 text-xs">
                      {player.name} | W: {player.stats?.wins || 0} | L: {player.stats?.losses || 0}
                    </p>
                  )}
                </div>
                
                <Navigation />
              </div>
              
              {/* Center - Undo/Redo Controls */}
              <div className="flex items-center">
                <UndoRedoControls variant="compact" showShortcuts />
              </div>
              
              {/* Budget indicator - compact for header */}
              <div className="flex items-center flex-shrink-0">
                <BudgetIndicator 
                  current={currentTeam.totalCost} 
                  max={MAX_BUDGET}
                  variant="compact"
                />
              </div>
            </div>
            
            {/* Team validation errors */}
            {currentTeam.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
                <div className="text-red-300 text-sm">
                  <div className="font-medium mb-1">Ошибки команды:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {currentTeam.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </header>
        
        {/* Responsive Team Builder */}
        <NavigationWrapper>
          <ResponsiveTeamBuilder
            units={units}
            currentTeam={currentTeam}
            selectedUnit={selectedUnit}
            disabledUnits={disabledUnits}
            gridUnits={gridUnits}
            highlightedCells={highlightedCells}
            teamActions={teamActions}
            onUnitSelect={handleUnitSelect}
            onUnitLongPress={handleUnitDetail}
            onGridCellClick={handleGridCellClick}
            isMobileSheetOpen={isMobileSheetOpen}
            onMobileSheetToggle={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
          />
        </NavigationWrapper>
        
        {/* Team error display */}
        {teamError && (
          <div className="fixed bottom-4 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto md:mt-4 p-4 bg-red-900/30 border border-red-500 rounded-lg z-20">
            <div className="text-red-300">
              <div className="font-medium mb-1">Ошибка команды:</div>
              <p>{teamError}</p>
            </div>
          </div>
        )}

        {/* Matchmaking error display */}
        {matchmakingError && (
          <div className="fixed bottom-4 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto md:mt-4 p-4 bg-red-900/30 border border-red-500 rounded-lg z-20">
            <div className="text-red-300">
              <div className="font-medium mb-1">Ошибка поиска боя:</div>
              <p>{matchmakingError}</p>
            </div>
          </div>
        )}
        
        {/* Modals */}
        <SavedTeamsPanel
          variant="modal"
          isOpen={showSavedTeamsModal}
          onClose={() => setShowSavedTeamsModal(false)}
          onLoadTeam={handleLoadTeam}
        />

        <UnitDetailModal
          unit={unitDetailModal.unit}
          isOpen={unitDetailModal.isOpen}
          onClose={handleCloseUnitDetail}
          onAddToTeam={handleAddUnitFromModal}
          canAdd={getCanAddUnit(unitDetailModal.unit)}
          cannotAddReason={getCannotAddReason(unitDetailModal.unit)}
        />
        
        {/* MatchmakingPanel removed - functionality integrated into action buttons */}
      </div>
    </DragDropProvider>
  );
}
