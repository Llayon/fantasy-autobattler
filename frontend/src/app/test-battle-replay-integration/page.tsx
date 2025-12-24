/**
 * Test page for Battle Replay integration.
 * Tests the full flow: API → Store → BattleReplay component.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { BattleReplay } from '@/components/BattleReplay';
import { useBattleStore } from '@/store/battleStore';
import { api } from '@/lib/api';
import { BattleLog } from '@/types/game';

/**
 * Mock battle data for testing when API is not available.
 */
const mockBattleLog: BattleLog = {
  id: 'test-battle-123',
  player1Id: 'player-1',
  player2Id: 'player-2',
  player1Name: 'Тестовый игрок',
  player2Name: 'Бот (Средний)',
  winnerId: 'player-1',
  winner: 'player1',
  rounds: 15,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'completed',
  seed: 12345,
  player1TeamSnapshot: {
    units: [
      {
        id: 'knight',
        name: 'Knight',
        role: 'tank',
        cost: 5,
        stats: {
          hp: 25,
          atk: 8,
          atkCount: 1,
          armor: 5,
          speed: 2,
          initiative: 3,
          dodge: 10,
        },
        range: 1,
        abilities: [],
      },
    ],
    positions: [{ x: 2, y: 0 }],
  },
  player2TeamSnapshot: {
    units: [
      {
        id: 'archer',
        name: 'Archer',
        role: 'ranged_dps',
        cost: 4,
        stats: {
          hp: 15,
          atk: 6,
          atkCount: 1,
          armor: 2,
          speed: 3,
          initiative: 5,
          dodge: 15,
        },
        range: 4,
        abilities: [],
      },
    ],
    positions: [{ x: 3, y: 8 }],
  },
  events: [
    {
      round: 1,
      type: 'move',
      actorId: 'knight-1',
      fromPosition: { x: 2, y: 0 },
      toPosition: { x: 2, y: 2 },
    },
    {
      round: 1,
      type: 'attack',
      actorId: 'knight-1',
      targetId: 'archer-2',
      damage: 8,
    },
    {
      round: 2,
      type: 'move',
      actorId: 'archer-2',
      fromPosition: { x: 3, y: 8 },
      toPosition: { x: 3, y: 6 },
    },
  ],
};

/**
 * Test page component for Battle Replay integration.
 */
export default function TestBattleReplayIntegrationPage() {
  const [testBattleId, setTestBattleId] = useState('test-battle-123');

  const [battle, setBattle] = useState<BattleLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');

  // Store state
  const { loadBattle, currentBattle, loading: storeLoading, error: storeError } = useBattleStore();

  /**
   * Test API availability.
   */
  const testAPIAvailability = async () => {
    try {
      setLoading(true);
      // Try to fetch a battle to test API
      await api.getBattles();
      setApiStatus('available');
    } catch (error) {
      setApiStatus('unavailable');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load battle using real API.
   */
  const loadRealBattle = async () => {
    if (!testBattleId.trim()) {
      setError('Введите ID боя');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await loadBattle(testBattleId);
      
      if (currentBattle) {
        setBattle(currentBattle);
      } else if (storeError) {
        setError(storeError);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки боя';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load mock battle data.
   */
  const loadMockBattle = () => {
    setBattle(mockBattleLog);
    setError(null);
  };

  /**
   * Clear battle data.
   */
  const clearBattle = () => {
    setBattle(null);
    setError(null);
  };

  // Test API on mount
  useEffect(() => {
    testAPIAvailability();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <NavigationWrapper>
        <div className="container mx-auto p-6">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🧪 Battle Replay Integration Test
            </h1>
            <p className="text-gray-300 mb-4">
              Testing full integration: API → Store → BattleReplay component
            </p>
            
            <Link 
              href="/battle/test-battle-123"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              → Test Real Battle Page
            </Link>
          </div>

          {/* Test Controls */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">🎮 Test Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Status */}
              <div>
                <h3 className="font-semibold mb-3">API Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Backend API:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      apiStatus === 'available' ? 'bg-green-600' :
                      apiStatus === 'unavailable' ? 'bg-red-600' :
                      'bg-yellow-600'
                    }`}>
                      {apiStatus === 'available' ? '✅ Available' :
                       apiStatus === 'unavailable' ? '❌ Unavailable' :
                       '⏳ Testing...'}
                    </span>
                  </div>
                  <button
                    onClick={testAPIAvailability}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm transition-colors"
                  >
                    🔄 Test API
                  </button>
                </div>
              </div>
              
              {/* Battle Loading */}
              <div>
                <h3 className="font-semibold mb-3">Battle Loading</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testBattleId}
                      onChange={(e) => setTestBattleId(e.target.value)}
                      placeholder="Battle ID"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={loadRealBattle}
                      disabled={loading || apiStatus !== 'available'}
                      className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded text-sm transition-colors"
                    >
                      {loading ? '⏳ Loading...' : '🌐 Load from API'}
                    </button>
                    <button
                      onClick={loadMockBattle}
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm transition-colors"
                    >
                      🎭 Load Mock Data
                    </button>
                    <button
                      onClick={clearBattle}
                      className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Display */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">📊 Current Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-400">API Status:</span>
                <span className="ml-2">{apiStatus}</span>
              </div>
              <div>
                <span className="text-blue-400">Battle Loaded:</span>
                <span className={`ml-2 ${battle ? 'text-green-400' : 'text-red-400'}`}>
                  {battle ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-blue-400">Store Loading:</span>
                <span className={`ml-2 ${storeLoading ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {storeLoading ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded">
                <div className="text-red-300 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
            
            {storeError && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded">
                <div className="text-red-300 text-sm">
                  <strong>Store Error:</strong> {storeError}
                </div>
              </div>
            )}
            
            {battle && (
              <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded">
                <div className="text-green-300 text-sm">
                  <strong>Battle Info:</strong> {battle.id} - {battle.player1Name} vs {battle.player2Name} ({battle.events.length} events)
                </div>
              </div>
            )}
          </div>

          {/* Battle Replay */}
          {battle ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">⚔️ Battle Replay</h2>
              <BattleReplay battle={battle} />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">
                No Battle Loaded
              </h3>
              <p className="text-gray-500">
                Load a battle using the controls above to see the replay
              </p>
            </div>
          )}
        </div>
      </NavigationWrapper>
    </div>
  );
}