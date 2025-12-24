/**
 * Test page for autosave functionality validation.
 * Tests localStorage autosave, draft restoration, and clearing.
 * 
 * @fileoverview Comprehensive test page for autosave system.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTeamStore } from '@/store/teamStore';
import { DraftIndicator } from '@/components/DraftIndicator';
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
 * Test page for autosave functionality.
 * 
 * @returns Test page component
 */
export default function TestAutosavePage() {
  const [localStorageContent, setLocalStorageContent] = useState<string>('');
  const [testLog, setTestLog] = useState<string[]>([]);
  
  // Team store selectors
  const units = useTeamStore(state => state.units);
  const currentTeam = useTeamStore(state => state.currentTeam);
  const draftRestored = useTeamStore(state => state.draftRestored);
  const loading = useTeamStore(state => state.loading);
  
  // Team store actions
  const { 
    loadUnits, 
    createNewTeam, 
    addUnitToTeam, 
    removeUnitFromTeam, 
    updateTeamName,
    loadDraftFromStorage,
    clearDraft
  } = useTeamStore();

  /**
   * Add message to test log.
   */
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  /**
   * Check localStorage content.
   */
  const checkLocalStorage = () => {
    try {
      const saved = localStorage.getItem('autobattler_draft_team');
      setLocalStorageContent(saved || 'No draft saved');
      addLog(`localStorage checked: ${saved ? 'Draft found' : 'No draft'}`);
    } catch (error) {
      setLocalStorageContent('Error reading localStorage');
      addLog(`localStorage error: ${error}`);
    }
  };

  /**
   * Clear localStorage manually.
   */
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('autobattler_draft_team');
      setLocalStorageContent('Cleared');
      addLog('localStorage cleared manually');
    } catch (error) {
      addLog(`Error clearing localStorage: ${error}`);
    }
  };

  /**
   * Simulate page reload by calling loadDraftFromStorage.
   */
  const simulateReload = () => {
    loadDraftFromStorage();
    addLog('Simulated page reload - called loadDraftFromStorage()');
  };

  // Initialize units on mount
  useEffect(() => {
    const init = async () => {
      await loadUnits();
      createNewTeam('Test Team');
      addLog('Initialized units and created test team');
    };
    init();
  }, [loadUnits, createNewTeam]);

  // Check localStorage on mount and when currentTeam changes
  useEffect(() => {
    checkLocalStorage();
  }, [currentTeam]);

  // Test units (first 3 available units)
  const testUnits = units.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">
            🧪 Autosave Test Page
          </h1>
          <p className="text-gray-400">
            Test localStorage autosave functionality with 1-second debounce
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Draft Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Draft Status</h2>
              <DraftIndicator variant="full" />
              
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-400">Draft Restored:</span>
                  <span className={`ml-2 ${draftRestored ? 'text-green-400' : 'text-red-400'}`}>
                    {draftRestored ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Units Count:</span>
                  <span className="ml-2 text-blue-400">{currentTeam.units.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="ml-2 text-yellow-400">{currentTeam.totalCost}/{MAX_BUDGET}</span>
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

            {/* Team Name */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Team Name</h2>
              <input
                type="text"
                value={currentTeam.name}
                onChange={(e) => {
                  updateTeamName(e.target.value);
                  addLog(`Team name updated: "${e.target.value}"`);
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Enter team name..."
              />
            </div>

            {/* Test Units */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Test Units</h2>
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
                        addLog(`Added ${unit.name} to team`);
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
              <h2 className="text-lg font-semibold mb-3">Current Team</h2>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Debug Info */}
          <div className="space-y-6">
            {/* localStorage Content */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">localStorage Content</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={checkLocalStorage}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={clearLocalStorage}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
                  >
                    Clear localStorage
                  </button>
                </div>
                <div className="bg-gray-900 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                  <pre className="whitespace-pre-wrap text-green-400">
                    {localStorageContent}
                  </pre>
                </div>
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Test Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={simulateReload}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
                >
                  🔄 Simulate Page Reload
                </button>
                <button
                  onClick={() => {
                    clearDraft();
                    addLog('Draft cleared via clearDraft()');
                  }}
                  className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors"
                >
                  🗑️ Clear Draft
                </button>
                <button
                  onClick={() => {
                    createNewTeam('Fresh Team');
                    addLog('Created new team');
                  }}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                >
                  ➕ Create New Team
                </button>
              </div>
            </div>

            {/* Test Log */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Test Log</h2>
                <button
                  onClick={() => setTestLog([])}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="bg-gray-900 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
                {testLog.length === 0 ? (
                  <p className="text-gray-500">No actions yet...</p>
                ) : (
                  testLog.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
          <h3 className="font-semibold text-blue-300 mb-2">🧪 Test Instructions</h3>
          <div className="text-sm text-blue-200 space-y-1">
            <p><strong>1. Autosave Test:</strong> Add units to team, change team name. Check localStorage updates after 1 second.</p>
            <p><strong>2. Draft Restoration:</strong> Add units, refresh localStorage, click "Simulate Page Reload" to test restoration.</p>
            <p><strong>3. Clear Draft:</strong> Test clearing draft via button and verify localStorage is cleared.</p>
            <p><strong>4. Age Limit:</strong> Manually edit localStorage timestamp to test 24-hour age limit.</p>
            <p><strong>5. Debounce:</strong> Make rapid changes and verify only final state is saved after 1 second delay.</p>
          </div>
        </div>
      </div>
    </div>
  );
}