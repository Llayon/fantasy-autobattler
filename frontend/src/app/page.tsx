/**
 * Team Builder page for Fantasy Autobattler.
 * Main page for building teams with drag-and-drop interface.
 * 
 * @fileoverview Complete team building interface with unit selection and grid placement.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Position, UnitTemplate, UnitId, TeamResponse } from '@/types/game';
import { UnitList } from '@/components/UnitList';
import { EnhancedBattleGrid } from '@/components/EnhancedBattleGrid';
import { DragDropProvider, DragDropHandlers } from '@/components/DragDropProvider';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { SavedTeamsModal } from '@/components/SavedTeamsModal';
import { MatchmakingPanel } from '@/components/MatchmakingPanel';
import { 
  usePlayerStore, 
  useTeamStore, 
  selectPlayer, 
  selectPlayerLoading, 
  selectPlayerError,
  selectUnits,
  selectCurrentTeam,
  selectTeamLoading,
  selectTeamError,
  selectTeams,
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



/**
 * Team actions component.
 */
interface TeamActionsProps {
  onSave: () => void;
  onClear: () => void;
  onStartBattle: () => void;
  onShowTeams: () => void;
  onShowHistory: () => void;
  canSave: boolean;
  canBattle: boolean;
  loading: boolean;
  teamCount: number;
}

function TeamActions({ 
  onSave, 
  onClear, 
  onStartBattle, 
  onShowTeams, 
  onShowHistory,
  canSave, 
  canBattle, 
  loading,
  teamCount 
}: TeamActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onClear}
        disabled={loading}
        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
      >
        🗑️ Очистить
      </button>
      
      <button
        onClick={onShowTeams}
        disabled={loading}
        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors relative"
      >
        📋 Мои команды
        {teamCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {teamCount}
          </span>
        )}
      </button>
      
      <button
        onClick={onShowHistory}
        disabled={loading}
        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
      >
        📚 История боёв
      </button>
      
      <button
        onClick={onSave}
        disabled={!canSave || loading}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
      >
        💾 Сохранить
      </button>
      
      <button
        onClick={onStartBattle}
        disabled={!canBattle || loading}
        className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-all transform hover:scale-105"
      >
        ⚔️ В бой!
      </button>
    </div>
  );
}

/**
 * Mobile unit list bottom sheet.
 */
interface MobileUnitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MobileUnitSheet({ isOpen, onClose, children }: MobileUnitSheetProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Bottom sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 md:hidden
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        max-h-[80vh] overflow-hidden
      `}>
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <h3 className="font-bold text-white">Выбор юнитов</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
          {children}
        </div>
      </div>
    </>
  );
}

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
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [showSavedTeamsModal, setShowSavedTeamsModal] = useState(false);
  
  // Store selectors
  const player = usePlayerStore(selectPlayer);
  const playerLoading = usePlayerStore(selectPlayerLoading);
  const playerError = usePlayerStore(selectPlayerError);
  
  const units = useTeamStore(selectUnits);
  const currentTeam = useTeamStore(selectCurrentTeam);
  const teamLoading = useTeamStore(selectTeamLoading);
  const teamError = useTeamStore(selectTeamError);
  const teams = useTeamStore(selectTeams);
  
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
  
  // Initialize stores on mount
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      await initializeStores();
    };
    init();
  }, [initPlayer]);
  
  // Create new team on mount
  useEffect(() => {
    if (units.length > 0 && currentTeam.units.length === 0) {
      createNewTeam('Новая команда');
    }
  }, [units.length, currentTeam.units.length, createNewTeam]);
  
  // Handle unit selection from list
  const handleUnitSelect = useCallback((unit: UnitTemplate) => {
    setSelectedUnit(unit);
    setIsMobileSheetOpen(false); // Close mobile sheet on selection
  }, []);
  
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
  
  const handleStartBattle = useCallback(() => {
    // TODO: Implement battle start logic
    // Battle will be started with current team
  }, []);

  const handleShowTeams = useCallback(() => {
    setShowSavedTeamsModal(true);
  }, []);

  const handleLoadTeam = useCallback((team: TeamResponse) => {
    loadTeamToDraft(team);
    setSelectedUnit(null);
  }, [loadTeamToDraft]);
  
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl text-yellow-400">Загрузка...</div>
        </div>
      </div>
    );
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
  
  return (
    <DragDropProvider handlers={dragDropHandlers} enabled={true}>
      <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title and player info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">
                ⚔️ Конструктор команды
              </h1>
              {player && (
                <p className="text-gray-300 text-sm">
                  {player.name} | Побед: {player.stats?.wins || 0} | Поражений: {player.stats?.losses || 0}
                </p>
              )}
            </div>
            
            {/* Budget and actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <BudgetIndicator 
                current={currentTeam.totalCost} 
                max={MAX_BUDGET}
                showDetails
              />
              
              <TeamActions
                onSave={handleSaveTeam}
                onClear={handleClearTeam}
                onStartBattle={handleStartBattle}
                onShowTeams={handleShowTeams}
                onShowHistory={() => window.location.href = '/history'}
                canSave={currentTeam.isValid && currentTeam.units.length > 0}
                canBattle={currentTeam.isValid && currentTeam.units.length > 0}
                loading={teamLoading}
                teamCount={teams.length}
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
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Desktop layout */}
        <div className="hidden md:grid md:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Unit list - Left side */}
          <div className="col-span-4 overflow-y-auto">
            <UnitList
              units={units}
              onUnitSelect={handleUnitSelect}
              disabledUnits={disabledUnits}
              selectedUnit={selectedUnit}
              compact
              enableDragDrop
            />
          </div>
          
          {/* Battle grid - Right side */}
          <div className="col-span-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <EnhancedBattleGrid
                units={gridUnits}
                onCellClick={handleGridCellClick}
                highlightedCells={highlightedCells}
                selectedUnit={selectedUnit ? {
                  unit: selectedUnit,
                  position: { x: -1, y: -1 }, // Invalid position for selected unit
                  team: 'player',
                  alive: true,
                } : null}
                mode="team-builder"
                interactive
              />
              
              {/* Instructions */}
              <div className="mt-4 text-center text-sm text-gray-400">
                <p>💡 Перетащите юниты или выберите юнита и кликните на поле</p>
                <p>🎯 Размещение доступно только в синих зонах (ряды 0-1)</p>
                <p>🗑️ Кликните на размещенного юнита для удаления</p>
              </div>
              
              {/* Matchmaking Panel */}
              <MatchmakingPanel className="mt-6" />
            </div>
          </div>
        </div>
        
        {/* Mobile layout */}
        <div className="md:hidden space-y-4">
          {/* Battle grid */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <EnhancedBattleGrid
              units={gridUnits}
              onCellClick={handleGridCellClick}
              highlightedCells={highlightedCells}
              selectedUnit={selectedUnit ? {
                unit: selectedUnit,
                position: { x: -1, y: -1 },
                team: 'player',
                alive: true,
              } : null}
              mode="team-builder"
              interactive
            />
          </div>
          
          {/* Mobile unit selection button */}
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            📋 Выбрать юниты ({selectedUnit ? selectedUnit.name : 'не выбран'})
          </button>
          
          {/* Instructions */}
          <div className="text-center text-sm text-gray-400 space-y-1">
            <p>💡 Выберите юнита и коснитесь поля для размещения</p>
            <p>🎯 Размещение только в синих зонах</p>
          </div>
          
          {/* Matchmaking Panel */}
          <MatchmakingPanel />
        </div>
        
        {/* Mobile unit sheet */}
        <MobileUnitSheet
          isOpen={isMobileSheetOpen}
          onClose={() => setIsMobileSheetOpen(false)}
        >
          <UnitList
            units={units}
            onUnitSelect={handleUnitSelect}
            disabledUnits={disabledUnits}
            selectedUnit={selectedUnit}
            compact
          />
        </MobileUnitSheet>
        
        {/* Team error display */}
        {teamError && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <div className="text-red-300">
              <div className="font-medium mb-1">Ошибка:</div>
              <p>{teamError}</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Saved Teams Modal */}
      <SavedTeamsModal
        isOpen={showSavedTeamsModal}
        onClose={() => setShowSavedTeamsModal(false)}
        onLoadTeam={handleLoadTeam}
      />
      </div>
    </DragDropProvider>
  );
}
