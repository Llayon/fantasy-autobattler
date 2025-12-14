/**
 * Responsive TeamBuilder component for Fantasy Autobattler.
 * Implements adaptive layout for mobile, tablet, and desktop viewports.
 * 
 * @fileoverview Complete responsive team building interface with optimized layouts.
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, UnitTemplate, UnitId, UNIT_INFO } from '@/types/game';
import { UnitList } from '@/components/UnitList';
import { EnhancedBattleGrid } from '@/components/EnhancedBattleGrid';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { ButtonLoader } from '@/components/LoadingStates';
import { TeamSummary } from '@/components/TeamSummary';
import { DraftIndicator } from '@/components/DraftIndicator';

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Breakpoint type for responsive layouts.
 */
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Hook to detect current breakpoint based on window width.
 * Returns 'mobile' for < 768px, 'tablet' for 768-1023px, 'desktop' for >= 1024px.
 * 
 * @returns Current breakpoint
 */
function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  
  useEffect(() => {
    /**
     * Update breakpoint based on window width.
     */
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };
    
    // Set initial value
    updateBreakpoint();
    
    // Listen for resize events
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Team actions configuration.
 */
interface TeamActions {
  onSave: () => void;
  onClear: () => void;
  onStartBattle: () => void;
  onShowTeams: () => void;
  canSave: boolean;
  canBattle: boolean;
  loading: boolean;
  teamCount: number;
}

/**
 * ResponsiveTeamBuilder component props.
 */
interface ResponsiveTeamBuilderProps {
  /** Available unit templates */
  units: UnitTemplate[];
  /** Current team configuration */
  currentTeam: {
    units: Array<{ unitId: UnitId; position: Position }>;
    totalCost: number;
    isValid: boolean;
    errors: string[];
  };
  /** Currently selected unit */
  selectedUnit: UnitTemplate | null;
  /** Units disabled for selection */
  disabledUnits: UnitId[];
  /** Grid units for display */
  gridUnits: Array<{
    unit: UnitTemplate;
    position: Position;
    team: 'player' | 'bot';
    alive: boolean;
  }>;
  /** Highlighted grid cells */
  highlightedCells: Array<{
    position: Position;
    type: 'valid' | 'invalid' | 'selected';
  }>;
  /** Team actions configuration */
  teamActions: TeamActions;
  /** Unit selection handler */
  onUnitSelect: (unit: UnitTemplate | null) => void;
  /** Unit long press handler */
  onUnitLongPress: (unit: UnitTemplate) => void;
  /** Grid cell click handler */
  onGridCellClick: (position: Position) => void;
  /** Mobile sheet state */
  isMobileSheetOpen: boolean;
  /** Mobile sheet toggle */
  onMobileSheetToggle: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum team budget */
const MAX_BUDGET = 30;

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Mobile header component with budget and primary action.
 */
interface MobileHeaderProps {
  currentCost: number;
  teamActions: TeamActions;
  units: UnitTemplate[];
  currentTeam: {
    units: Array<{ unitId: UnitId; position: Position }>;
    totalCost: number;
    isValid: boolean;
    errors: string[];
  };
}

function MobileHeader({ currentCost, teamActions, units, currentTeam }: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-3 md:hidden safe-area-inset-top">
      {/* Top row with budget and battle button */}
      <div className="flex items-center justify-between gap-3 h-12">
        {/* Budget indicator */}
        <div className="flex-1 min-w-0">
          <BudgetIndicator 
            current={currentCost} 
            max={MAX_BUDGET}
            variant="compact"
          />
        </div>
        
        {/* Primary action */}
        <ButtonLoader
          loading={teamActions.loading}
          onClick={teamActions.onStartBattle}
          disabled={!teamActions.canBattle}
          variant="primary"
          size="sm"
          loadingText="Запуск..."
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 active:from-yellow-600 active:to-orange-600 min-w-[88px] min-h-[48px] touch-manipulation flex-shrink-0 text-base font-medium active:scale-95 transform transition-transform animate-pulse-glow"
        >
          ⚔️ Бой!
        </ButtonLoader>
      </div>
      
      {/* Team summary row (compact) */}
      {currentTeam.units.length > 0 && (
        <div className="pb-2 border-t border-gray-700/50 pt-2">
          <TeamSummary
            units={currentTeam.units}
            unitTemplates={units}
            variant="compact"
          />
        </div>
      )}
    </div>
  );
}
/**
 * Mobile footer with action buttons.
 */
interface MobileFooterProps {
  teamActions: TeamActions;
  selectedUnit: UnitTemplate | null;
  onMobileSheetToggle: () => void;
}

function MobileFooter({ teamActions, selectedUnit, onMobileSheetToggle }: MobileFooterProps) {
  return (
    <div className="sticky bottom-0 z-30 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Unit selection button */}
        <button
          onClick={onMobileSheetToggle}
          className="col-span-2 min-h-[52px] py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-lg transition-all text-base touch-manipulation active:scale-95 transform"
        >
          📋 Выбрать юниты ({selectedUnit ? selectedUnit.name : 'не выбран'})
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {/* Clear */}
        <ButtonLoader
          loading={teamActions.loading}
          onClick={teamActions.onClear}
          variant="secondary"
          size="sm"
          loadingText="..."
          className="min-w-[48px] min-h-[48px] text-sm touch-manipulation active:scale-95 transform transition-all"
        >
          🗑️
        </ButtonLoader>
        
        {/* My Teams */}
        <div className="relative">
          <ButtonLoader
            loading={teamActions.loading}
            onClick={teamActions.onShowTeams}
            variant="secondary"
            size="sm"
            loadingText="..."
            className="w-full min-w-[48px] min-h-[48px] bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-sm touch-manipulation active:scale-95 transform transition-all"
          >
            📋
          </ButtonLoader>
          {teamActions.teamCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] pointer-events-none">
              {teamActions.teamCount}
            </span>
          )}
        </div>
        
        {/* Save */}
        <ButtonLoader
          loading={teamActions.loading}
          onClick={teamActions.onSave}
          disabled={!teamActions.canSave}
          variant="primary"
          size="sm"
          loadingText="..."
          className="min-w-[48px] min-h-[48px] text-sm touch-manipulation active:scale-95 transform transition-all disabled:active:scale-100"
        >
          💾
        </ButtonLoader>
        
        {/* Battle (duplicate for easy access) */}
        <ButtonLoader
          loading={teamActions.loading}
          onClick={teamActions.onStartBattle}
          disabled={!teamActions.canBattle}
          variant="primary"
          size="sm"
          loadingText="..."
          className="min-w-[48px] min-h-[48px] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 active:from-yellow-600 active:to-orange-600 text-sm touch-manipulation active:scale-95 transform transition-all disabled:active:scale-100"
        >
          ⚔️
        </ButtonLoader>
      </div>
    </div>
  );
}

/**
 * Desktop sidebar with selected unit details and team stats.
 * Unit list moved below the grid to avoid duplicate filters.
 */
interface DesktopSidebarProps {
  units: UnitTemplate[];
  selectedUnit: UnitTemplate | null;
  currentTeam?: {
    units: Array<{ unitId: UnitId; position: Position }>;
    totalCost: number;
    isValid: boolean;
    errors: string[];
  };
}

/**
 * Desktop sidebar component showing selected unit and team statistics.
 * 
 * @param props - Component props
 * @returns Desktop sidebar component
 */
function DesktopSidebar({ 
  units, 
  selectedUnit, 
  currentTeam,
}: DesktopSidebarProps) {
  return (
    <div className="hidden lg:flex lg:flex-col w-64 xl:w-72 flex-shrink-0 bg-gray-800/30 rounded-lg p-4">
      {/* Selected Unit Details */}
      {selectedUnit ? (
        <div className="p-3 bg-gray-700/50 rounded-lg border border-blue-500/50">
          <h3 className="text-xs font-medium text-gray-400 mb-2">Выбранный юнит</h3>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{UNIT_INFO[selectedUnit.id]?.emoji || '❓'}</div>
            <div className="flex-1">
              <div className="font-bold text-white">{selectedUnit.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                ❤️{selectedUnit.stats.hp} ⚔️{selectedUnit.stats.atk} 🛡️{selectedUnit.stats.armor}
              </div>
              <div className="text-xs text-gray-400">
                🏃{selectedUnit.stats.speed} 🎯{selectedUnit.stats.atkCount}x ⚡{selectedUnit.stats.initiative}
              </div>
            </div>
            <div className="bg-yellow-500 text-black text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
              {selectedUnit.cost}
            </div>
          </div>
          {selectedUnit.abilities.length > 0 && (
            <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs">
              <span className="text-purple-400 font-medium">Способности:</span>
              <span className="text-gray-400 ml-1">{selectedUnit.abilities.join(', ')}</span>
            </div>
          )}
          <p className="text-xs text-blue-400 mt-3">
            💡 Кликните на клетку сетки для размещения
          </p>
        </div>
      ) : (
        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 text-center">
          <div className="text-gray-500 text-sm">Юнит не выбран</div>
          <p className="text-xs text-gray-600 mt-1">
            Выберите юнита из списка ниже
          </p>
        </div>
      )}

      {/* Draft Indicator */}
      <div className="mt-4">
        <DraftIndicator variant="full" />
      </div>

      {/* Team Statistics */}
      {currentTeam && (
        <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Статистика команды</h3>
          
          {/* Budget indicator with progress bar */}
          <div className="mb-3">
            <BudgetIndicator 
              current={currentTeam.totalCost} 
              max={MAX_BUDGET}
              variant="bar"
            />
          </div>
          
          {/* Team Summary with comprehensive stats */}
          <TeamSummary
            units={currentTeam.units}
            unitTemplates={units}
            variant="full"
          />
          
          {/* Validation status */}
          <div className="mt-3 pt-3 border-t border-gray-600">
            {currentTeam.isValid ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span>✓</span>
                <span>Команда готова к бою</span>
              </div>
            ) : (
              <div className="text-red-400 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Команда не готова</span>
                </div>
                {currentTeam.errors.length > 0 && (
                  <p className="text-xs mt-1 text-red-300">{currentTeam.errors[0]}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tablet layout component.
 */
interface TabletLayoutProps {
  units: UnitTemplate[];
  selectedUnit: UnitTemplate | null;
  disabledUnits: UnitId[];
  gridUnits: ResponsiveTeamBuilderProps['gridUnits'];
  highlightedCells: ResponsiveTeamBuilderProps['highlightedCells'];
  onUnitSelect: (unit: UnitTemplate) => void;
  onUnitLongPress: (unit: UnitTemplate) => void;
  onGridCellClick: (position: Position) => void;
}

function TabletLayout({
  units,
  selectedUnit,
  disabledUnits,
  gridUnits,
  highlightedCells,
  onUnitSelect,
  onUnitLongPress,
  onGridCellClick,
}: TabletLayoutProps) {
  return (
    <div className="hidden md:grid lg:hidden grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">
      {/* Unit list - Left side (1/3) */}
      <div className="col-span-1 bg-gray-800/30 rounded-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Юниты</h3>
        <UnitList
          units={units}
          onUnitSelect={onUnitSelect}
          onUnitLongPress={onUnitLongPress}
          disabledUnits={disabledUnits}
          selectedUnit={selectedUnit}
          compact={true}
          enableDragDrop={true}
        />
      </div>
      
      {/* Battle grid - Right side (2/3) */}
      <div className="col-span-2 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <EnhancedBattleGrid
            units={gridUnits}
            onCellClick={onGridCellClick}
            highlightedCells={highlightedCells}
            selectedUnit={selectedUnit ? {
              unit: selectedUnit,
              position: { x: -1, y: -1 },
              team: 'player',
              alive: true,
            } : null}
            mode="team-builder"
            interactive
            gridId="tablet"
          />
        </div>
      </div>
    </div>
  );
}
/**
 * Mobile unit selection bottom sheet.
 */
interface MobileUnitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitTemplate[];
  selectedUnit: UnitTemplate | null;
  disabledUnits: UnitId[];
  onUnitSelect: (unit: UnitTemplate) => void;
  onUnitLongPress: (unit: UnitTemplate) => void;
}

function MobileUnitSheet({
  isOpen,
  onClose,
  units,
  selectedUnit,
  disabledUnits,
  onUnitSelect,
  onUnitLongPress,
}: MobileUnitSheetProps) {
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
        max-h-[85vh] overflow-hidden
        safe-area-inset-bottom
        touch-manipulation
        overscroll-contain
      `}>
        {/* Handle */}
        <div 
          className="flex justify-center py-4 cursor-pointer touch-manipulation active:bg-gray-800 transition-colors" 
          onClick={onClose}
        >
          <div className="w-12 h-2 bg-gray-600 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="font-bold text-white text-lg">Выбор юнитов</h3>
          <button
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-400 hover:text-white transition-all rounded-lg hover:bg-gray-700 active:bg-gray-600 touch-manipulation active:scale-95 transform"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto overscroll-contain max-h-[calc(85vh-120px)] p-4 pb-8 touch-pan-y">
          <UnitList
            units={units}
            onUnitSelect={onUnitSelect}
            onUnitLongPress={onUnitLongPress}
            disabledUnits={disabledUnits}
            selectedUnit={selectedUnit}
            compact={true}
          />
        </div>
      </div>
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ResponsiveTeamBuilder component with adaptive layouts.
 * Provides optimized interfaces for mobile, tablet, and desktop viewports.
 * 
 * @param props - Component props
 * @returns Responsive team builder component
 * @example
 * <ResponsiveTeamBuilder
 *   units={units}
 *   currentTeam={currentTeam}
 *   selectedUnit={selectedUnit}
 *   // ... other props
 * />
 */
export function ResponsiveTeamBuilder({
  units,
  currentTeam,
  selectedUnit,
  disabledUnits,
  gridUnits,
  highlightedCells,
  teamActions,
  onUnitSelect,
  onUnitLongPress,
  onGridCellClick,
  isMobileSheetOpen,
  onMobileSheetToggle,
}: ResponsiveTeamBuilderProps) {
  // Detect current breakpoint to render only one grid
  // This prevents duplicate droppable IDs from interfering with drag & drop
  const breakpoint = useBreakpoint();
  
  /**
   * Handle unit selection and close mobile sheet.
   */
  const handleUnitSelect = useCallback((unit: UnitTemplate) => {
    onUnitSelect(unit);
    if (isMobileSheetOpen) {
      onMobileSheetToggle();
    }
  }, [onUnitSelect, isMobileSheetOpen, onMobileSheetToggle]);

  /**
   * Handle clearing selected unit on mobile.
   */
  const handleClearSelection = useCallback(() => {
    onUnitSelect(null);
  }, [onUnitSelect]);

  return (
    <div className="min-h-screen bg-gray-900 text-white touch-manipulation overscroll-contain">
      {/* Mobile Header */}
      <MobileHeader 
        currentCost={currentTeam.totalCost}
        teamActions={teamActions}
        units={units}
        currentTeam={currentTeam}
      />
      
      {/* Main Content Area */}
      <div className="relative">
        {/* Desktop Layout (>= 1024px) */}
        {/* Only render when breakpoint is desktop to avoid duplicate droppables */}
        {breakpoint === 'desktop' && (
        <div className="hidden lg:flex gap-6 p-6">
          {/* Sidebar with selected unit details and team stats */}
          <DesktopSidebar
            units={units}
            selectedUnit={selectedUnit}
            currentTeam={currentTeam}
          />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Compact grid showing only player zone (8×2) */}
            <EnhancedBattleGrid
              units={gridUnits}
              onCellClick={onGridCellClick}
              highlightedCells={highlightedCells}
              selectedUnit={selectedUnit ? {
                unit: selectedUnit,
                position: { x: -1, y: -1 },
                team: 'player',
                alive: true,
              } : null}
              mode="team-builder"
              interactive
              compactMode={true}
              gridId="desktop"
            />
            
            {/* Desktop Actions */}
            <div className="mt-4 flex justify-between items-center">
              {/* Left side actions */}
              <div className="flex gap-3">
                <ButtonLoader
                  loading={teamActions.loading}
                  onClick={teamActions.onClear}
                  variant="secondary"
                  size="md"
                  loadingText="Очистка..."
                  className="w-[120px] h-[40px] text-base font-medium"
                >
                  🗑️ Clear
                </ButtonLoader>
                
                <div className="relative">
                  <ButtonLoader
                    loading={teamActions.loading}
                    onClick={teamActions.onShowTeams}
                    variant="secondary"
                    size="md"
                    loadingText="Загрузка..."
                    className="bg-purple-600 hover:bg-purple-500 w-[120px] h-[40px] text-base font-medium"
                  >
                    📁 My Teams
                  </ButtonLoader>
                  {teamActions.teamCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {teamActions.teamCount}
                    </span>
                  )}
                </div>
                
                <ButtonLoader
                  loading={teamActions.loading}
                  onClick={teamActions.onSave}
                  disabled={!teamActions.canSave}
                  variant="primary"
                  size="md"
                  loadingText="Сохранение..."
                  className="w-[120px] h-[40px] text-base font-bold"
                >
                  💾 Save
                </ButtonLoader>
              </div>
              
              {/* Right side - main action */}
              <ButtonLoader
                loading={teamActions.loading}
                onClick={teamActions.onStartBattle}
                disabled={!teamActions.canBattle}
                variant="primary"
                size="lg"
                loadingText="Запуск..."
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 w-[160px] h-[40px] text-base font-bold"
              >
                ⚔️ Find Match!
              </ButtonLoader>
            </div>
            
            {/* Unit List Section - Below Grid */}
            <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
              <div className="mb-3 text-center text-xs text-gray-500">
                💡 Перетащите юнита на поле или выберите и кликните • Удерживайте для деталей
              </div>
              <UnitList
                units={units}
                onUnitSelect={onUnitSelect}
                onUnitLongPress={onUnitLongPress}
                disabledUnits={disabledUnits}
                selectedUnit={selectedUnit}
                compact={true}
                enableDragDrop={true}
              />
            </div>
          </div>
        </div>
        )}
        
        {/* Tablet Layout (768px - 1023px) */}
        {/* Only render when breakpoint is tablet to avoid duplicate droppables */}
        {breakpoint === 'tablet' && (
        <div className="p-4">
          <TabletLayout
            units={units}
            selectedUnit={selectedUnit}
            disabledUnits={disabledUnits}
            gridUnits={gridUnits}
            highlightedCells={highlightedCells}
            onUnitSelect={onUnitSelect}
            onUnitLongPress={onUnitLongPress}
            onGridCellClick={onGridCellClick}
          />
        </div>
        )}
        
        {/* Mobile Layout (< 768px) */}
        {/* Only render when breakpoint is mobile to avoid duplicate droppables */}
        {breakpoint === 'mobile' && (
        <div className="md:hidden p-3 pb-20">
          {/* Battle Grid */}
          <div className="bg-gray-800/30 rounded-lg p-3 mb-4 overflow-hidden">
            <div className="touch-pan-x touch-pan-y overscroll-contain">
              <EnhancedBattleGrid
                units={gridUnits}
                onCellClick={onGridCellClick}
                highlightedCells={highlightedCells}
                selectedUnit={selectedUnit ? {
                  unit: selectedUnit,
                  position: { x: -1, y: -1 },
                  team: 'player',
                  alive: true,
                } : null}
                mode="team-builder"
                interactive
                disableZoom={false}
                gridId="mobile"
              />
            </div>
          </div>
          
          {/* Selected Unit Indicator */}
          {selectedUnit && (
            <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3 mb-4 touch-manipulation">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{UNIT_INFO[selectedUnit.id]?.emoji || '❓'}</div>
                <div className="flex-1">
                  <div className="font-medium text-white">{selectedUnit.name}</div>
                  <div className="text-sm text-blue-300">Выбран • Коснитесь синей зоны для размещения</div>
                </div>
                <button
                  onClick={handleClearSelection}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700 active:bg-gray-600 touch-manipulation active:scale-95 transform"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* Mobile Instructions */}
          <div className="text-center text-sm text-gray-400 space-y-2 px-2 mb-4 select-none">
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
              <p className="font-medium text-gray-300">💡 Как играть:</p>
              <p className="text-xs">1. Нажмите "Выбрать юниты" внизу</p>
              <p className="text-xs">2. Выберите юнита из списка</p>
              <p className="text-xs">3. Коснитесь синей з��ны для размещения</p>
              <p className="text-xs">4. Удерживайте юнита для деталей</p>
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter
        teamActions={teamActions}
        selectedUnit={selectedUnit}
        onMobileSheetToggle={onMobileSheetToggle}
      />
      
      {/* Mobile Unit Sheet */}
      <MobileUnitSheet
        isOpen={isMobileSheetOpen}
        onClose={onMobileSheetToggle}
        units={units}
        selectedUnit={selectedUnit}
        disabledUnits={disabledUnits}
        onUnitSelect={handleUnitSelect}
        onUnitLongPress={onUnitLongPress}
      />
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ResponsiveTeamBuilderProps, TeamActions };