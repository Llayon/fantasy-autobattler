/**
 * Debug page to test what's happening with the application.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { usePlayerStore, useTeamStore } from '@/store';

export default function TestDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const player = usePlayerStore((state) => state.player);
  const playerLoading = usePlayerStore((state) => state.loading);
  const playerError = usePlayerStore((state) => state.error);
  
  const units = useTeamStore((state) => state.units);
  const currentTeam = useTeamStore((state) => state.currentTeam);
  
  useEffect(() => {
    setDebugInfo({
      player,
      playerLoading,
      playerError,
      units: units?.length || 0,
      currentTeam,
      timestamp: new Date().toISOString(),
    });
  }, [player, playerLoading, playerError, units, currentTeam]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Player State</h2>
          <div className="space-y-2">
            <div>Loading: {playerLoading ? '✅ Yes' : '❌ No'}</div>
            <div>Error: {playerError || '❌ None'}</div>
            <div>Player: {player ? `✅ ${player.name}` : '❌ Not loaded'}</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Units State</h2>
          <div className="space-y-2">
            <div>Units Count: {units?.length || 0}</div>
            <div>Current Team Units: {currentTeam?.units?.length || 0}</div>
            <div>Team Valid: {currentTeam?.isValid ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Raw Debug Data</h2>
          <pre className="text-xs overflow-auto bg-gray-900 p-4 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Test API Connection</h2>
          <button 
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:3003/health');
                const data = await response.json();
                alert(`API Response: ${JSON.stringify(data)}`);
              } catch (error) {
                alert(`API Error: ${error}`);
              }
            }}
          >
            Test Backend Connection
          </button>
        </div>
      </div>
    </div>
  );
}