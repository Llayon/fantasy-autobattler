/**
 * Test page for undo/redo functionality validation.
 * Tests history management, keyboard shortcuts, and UI integration.
 * 
 * @fileoverview Comprehensive test page for undo/redo system.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTeamStore } from '@/store/teamStore';
import { UndoRedoControls } from '@/components/UndoRedoControls';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { UnitCard } from '@/components/UnitCard';
import { UNIT_INFO } from '@/types/game';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_BUDGET = 30;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Test page for undo/redo functionality.
 * 
 * @returns Test page component
 */
export default function TestUndoRedoPage() {
  const [actionLog, setActionLog] = useState<string[]>([]);
  
  // Team store selectors
  const units = useTeamStore(state => state.units);
  const currentTeam = useTeamStore(state => state.currentTeam);
  const past = useTeamStore(state => state.past);
  const future = useTeamStore(state => state.future);
  const canUndo = useTeamStore(state => state.canUndo);
  const canRedo = useTeamStore(state => state.canRedo);
  const loading = useTeamStore(state => state.loading);
  
  // Team store actions
  const { 
    loadUnits, 
    createNewTeam, 
    addUnitToTeam, 
    removeUnitFromTeam, 
    updateUnitPosition,
    undo,
    redo
  } = useTeamStore();

  /**
   * Add message to action log.
   */
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  /**
   * Clear action log.
   */
  const clearLog = () => {
    setActionLog([]);
  };

  // Initialize units on mount
  useEffect(() => {
    const init = async () => {
      await loadUnits();
      createNewTeam('Undo/Redo Test Team');
      addLog('Initialized units and created test team');
    };
    init();
  }, [loadUnits, createNewTeam]);

  // Test units (first 5 available units)
  const testUnits = units.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">
            🔄 Undo/Redo Test Page
          </h1>
          <p className="text-gray-400">
            Test undo/redo functionality with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="xl:col-span-2 space-y-6">
            {/* Undo/Redo Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Undo/Redo Controls</h2>
              
              <div className="space-y-4">
                {/* Button variants */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Button Variant</h3>
                  <UndoRedoControls variant="buttons" showShortcuts />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Compact Variant</h3>
                  <UndoRedoControls variant="compact" showShortcuts />
                </div>
                
                {/* Status */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-700 rounded">
                  <div className="text-sm">
                    <span className="text-gray-400">Can Undo:</span>
                    <span className={`ml-2 ${canUndo ? 'text-green-400' : 'text-red-400'}`}>
                      {canUndo ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Can Redo:</span>
                    <span className={`ml-2 ${canRedo ? 'text-green-400' : 'text-red-400'}`}>
                      {canRedo ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">History Size:</span>
                    <span className="ml-2 text-blue-400">{past.length}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Future Size:</span>
                    <span className="ml-2 text-purple-400">{future.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Indicator */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Budget</h2>
              <BudgetIndicator 
                current={currentTeam.totalCost} 
                max={MAX_BUDGET}
                variant="bar"
              />
            </div>

            {/* Test Actions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Manual undo/redo */}
                <button
                  onClick={() => {
                    undo();
                    addLog('Manual undo triggered');
                  }}
                  disabled={!canUndo}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  Manual Undo
                </button>
                
                <button
                  onClick={() => {
                    redo();
                    addLog('Manual redo triggered');
                  }}
                  disabled={!canRedo}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  Manual Redo
                </button>
                
                {/* Bulk actions */}
                <button
                  onClick={() => {
                    // Add multiple units quickly
                    testUnits.slice(0, 3).forEach((unit, index) => {
                      addUnitToTeam(unit.id, { x: index, y: 0 });
                    });
                    addLog('Added 3 units in sequence');
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  Add 3 Units
                </button>
                
                <button
                  onClick={() => {
                    // Clear all units
                    while (currentTeam.units.length > 0) {
                      removeUnitFromTeam(0);
                    }
                    addLog('Removed all units');
                  }}
                  disabled={loading || currentTeam.units.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Test Units */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Test Units</h2>
              <div className="grid grid-cols-1 gap-3">
                {testUnits.map((unit, index) => (
                  <div key={unit.id} className="flex items-center gap-3">
                    <UnitCard
                      unit={unit}
                      variant="compact"
                      className="flex-1"
                    />
                    <button
                      onClick={() => {
                        addUnitToTeam(unit.id, { x: index, y: 0 });
                        addLog(`Added ${unit.name} to position (${index}, 0)`);
                      }}
                      disabled={loading || currentTeam.units.some(u => u.unitId === unit.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Team */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Current Team</h2>
              {currentTeam.units.length === 0 ? (
                <p className="text-gray-400 text-sm">No units in team</p>
              ) : (
                <div className="space-y-2">
                  {currentTeam.units.map((teamUnit, index) => {
                    const unit = units.find(u => u.id === teamUnit.unitId);
                    if (!unit) return null;
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                        <div className="text-lg">{UNIT_INFO[unit.id]?.emoji || '❓'}</div>
                        <div className="flex-1">
                          <div className="font-medium">{unit.name}</div>
                          <div className="text-xs text-gray-400">
                            Position: ({teamUnit.position.x}, {teamUnit.position.y}) • Cost: {unit.cost}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            removeUnitFromTeam(index);
                            addLog(`Removed ${unit.name} from team`);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => {
                            const newX = (teamUnit.position.x + 1) % 8;
                            updateUnitPosition(index, { x: newX, y: teamUnit.position.y });
                            addLog(`Moved ${unit.name} to (${newX}, ${teamUnit.position.y})`);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                        >
                          Move
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Debug Info */}
          <div className="space-y-6">
            {/* History Stack */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">History Stack</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Past States ({past.length}/20)</h3>
                  <div className="bg-gray-900 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    {past.length === 0 ? (
                      <p className="text-gray-500">No past states</p>
                    ) : (
                      past.map((state, index) => (
                        <div key={index} className="text-green-400 mb-1">
                          {index + 1}: {state.length} units
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Future States ({future.length})</h3>
                  <div className="bg-gray-900 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    {future.length === 0 ? (
                      <p className="text-gray-500">No future states</p>
                    ) : (
                      future.map((state, index) => (
                        <div key={index} className="text-purple-400 mb-1">
                          {index + 1}: {state.length} units
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Log */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Action Log</h2>
                <button
                  onClick={clearLog}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="bg-gray-900 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
                {actionLog.length === 0 ? (
                  <p className="text-gray-500">No actions yet...</p>
                ) : (
                  actionLog.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Undo:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Redo:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Shift+Z</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
          <h3 className="font-semibold text-blue-300 mb-2">🧪 Test Instructions</h3>
          <div className="text-sm text-blue-200 space-y-1">
            <p><strong>1. Basic Operations:</strong> Add/remove units and test undo/redo buttons.</p>
            <p><strong>2. Keyboard Shortcuts:</strong> Use Ctrl+Z (undo) and Ctrl+Shift+Z (redo).</p>
            <p><strong>3. History Limits:</strong> Add 25+ units to test 20-state history limit.</p>
            <p><strong>4. Future Clearing:</strong> Undo, then make new action - future should clear.</p>
            <p><strong>5. Position Updates:</strong> Move units and test undo/redo of position changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}