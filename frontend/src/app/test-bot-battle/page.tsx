/**
 * Test page for Bot Battle functionality.
 * Diagnoses issues with bot battle creation and redirection.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { useMatchmakingStore } from '@/store/matchmakingStore';
import { useTeamStore } from '@/store/teamStore';
import { api } from '@/lib/api';

/**
 * Test page component for Bot Battle diagnostics.
 */
export default function TestBotBattlePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [testTeamId, setTestTeamId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Store state
  const { startBotBattle, match, loading, error, status } = useMatchmakingStore();
  const { activeTeam, teams, loadTeams } = useTeamStore();

  /**
   * Add log entry with timestamp.
   */
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  /**
   * Clear all logs.
   */
  const clearLogs = () => {
    setLogs([]);
  };

  /**
   * Test direct API call.
   */
  const testDirectAPI = async () => {
    try {
      addLog('🔄 Testing direct API call...');
      const teamId = testTeamId || activeTeam?.id;
      
      if (!teamId) {
        addLog('❌ No team ID available');
        return;
      }
      
      addLog(`📤 Calling api.startBattle(${selectedDifficulty}, ${teamId})`);
      const result = await api.startBattle(selectedDifficulty, teamId);
      addLog(`✅ API Response: ${JSON.stringify(result)}`);
      
      if (result.battleId) {
        addLog(`🎯 Battle created with ID: ${result.battleId}`);
        addLog(`🔗 Redirect URL: /battle/${result.battleId}`);
      }
    } catch (error) {
      addLog(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Test store function.
   */
  const testStoreFunction = async () => {
    try {
      addLog('🔄 Testing store function...');
      const teamId = testTeamId || activeTeam?.id;
      
      if (!teamId) {
        addLog('❌ No team ID available');
        return;
      }
      
      addLog(`📤 Calling startBotBattle(${teamId}, ${selectedDifficulty})`);
      await startBotBattle(teamId, selectedDifficulty);
      addLog('✅ Store function completed');
      
      // Check state after call
      setTimeout(() => {
        const currentState = useMatchmakingStore.getState();
        addLog(`📊 Store state: status=${currentState.status}, match=${JSON.stringify(currentState.match)}`);
      }, 200);
    } catch (error) {
      addLog(`❌ Store Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Manual redirect to battle.
   */
  const manualRedirect = () => {
    if (match?.battleId) {
      addLog(`🚀 Manual redirect to /battle/${match.battleId}`);
      router.push(`/battle/${match.battleId}`);
    } else {
      addLog('❌ No battle ID available for redirect');
    }
  };

  // Load teams on mount
  useEffect(() => {
    loadTeams();
    addLog('🔄 Loading teams...');
  }, [loadTeams]);

  // Monitor state changes
  useEffect(() => {
    if (match) {
      addLog(`🎯 Match found: ${JSON.stringify(match)}`);
    }
  }, [match]);

  useEffect(() => {
    if (status) {
      addLog(`📊 Status changed: ${status}`);
    }
  }, [status]);

  useEffect(() => {
    if (error) {
      addLog(`❌ Error: ${error}`);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <NavigationWrapper>
        <div className="container mx-auto p-6">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🧪 Bot Battle Diagnostics
            </h1>
            <p className="text-gray-300 mb-4">
              Testing bot battle creation and redirection flow
            </p>
            
            <Link 
              href="/battle"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              → Go to Battle Page
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-6">
              {/* Team Selection */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">🎮 Team Selection</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Active Team:</label>
                    <div className="p-3 bg-gray-700 rounded">
                      {activeTeam ? (
                        <div>
                          <div className="font-medium">{activeTeam.name}</div>
                          <div className="text-sm text-gray-400">ID: {activeTeam.id}</div>
                          <div className="text-sm text-gray-400">Cost: {activeTeam.totalCost}/30</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">No active team</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Manual Team ID:</label>
                    <input
                      type="text"
                      value={testTeamId}
                      onChange={(e) => setTestTeamId(e.target.value)}
                      placeholder="Override team ID (optional)"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Available Teams:</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {teams.map(team => (
                        <div key={team.id} className="text-sm p-2 bg-gray-700 rounded">
                          <span className="font-medium">{team.name}</span>
                          <span className="text-gray-400 ml-2">({team.id})</span>
                          <button
                            onClick={() => setTestTeamId(team.id)}
                            className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Controls */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">🔧 Test Controls</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty:</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={testDirectAPI}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      🔗 Test Direct API
                    </button>
                    
                    <button
                      onClick={testStoreFunction}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      🏪 Test Store Function
                    </button>
                    
                    <button
                      onClick={manualRedirect}
                      disabled={!match?.battleId}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      🚀 Manual Redirect
                    </button>
                    
                    <button
                      onClick={clearLogs}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    >
                      🗑️ Clear Logs
                    </button>
                  </div>
                </div>
              </div>

              {/* Current State */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">📊 Current State</h2>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-400">Status:</span>
                    <span className="ml-2">{status || 'idle'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Loading:</span>
                    <span className={`ml-2 ${loading ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {loading ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-400">Match:</span>
                    <span className="ml-2">{match ? JSON.stringify(match) : 'None'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Error:</span>
                    <span className={`ml-2 ${error ? 'text-red-400' : 'text-gray-400'}`}>
                      {error || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">📝 Debug Logs</h2>
                <span className="text-sm text-gray-400">{logs.length} entries</span>
              </div>
              
              <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-gray-500">No logs yet. Run a test to see debug output.</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}