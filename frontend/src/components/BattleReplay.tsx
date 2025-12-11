/**
 * BattleReplay component for Fantasy Autobattler.
 * Displays battle replay with step-by-step visualization.
 * 
 * @fileoverview Placeholder component for battle replay functionality.
 * TODO: Implement full battle replay with new type system.
 */

'use client';

import { BattleLog } from '@/types/game';

/**
 * BattleReplay component props.
 */
interface BattleReplayProps {
  /** Battle log data for replay */
  battle: BattleLog;
}

/**
 * BattleReplay component for displaying battle replays.
 * Currently a placeholder implementation.
 * 
 * @param props - Component props
 * @returns Battle replay component
 * @example
 * <BattleReplay battle={battleLog} />
 */
export function BattleReplay({ battle }: BattleReplayProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">🚧 Battle Replay</h2>
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 mb-6">
          <div className="text-yellow-300 mb-2">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-yellow-300 mb-2">
            Feature Under Development
          </h3>
          <p className="text-yellow-200 text-sm">
            Battle replay functionality is currently being updated to work with the new battle system.
            This feature will be available in a future update.
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Battle Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Battle ID:</span>
              <div className="font-mono">{battle.id}</div>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <div className="capitalize">{battle.status}</div>
            </div>
            <div>
              <span className="text-gray-400">Player 1:</span>
              <div>{battle.player1Id}</div>
            </div>
            <div>
              <span className="text-gray-400">Player 2:</span>
              <div>{battle.player2Id}</div>
            </div>
            <div>
              <span className="text-gray-400">Winner:</span>
              <div>{battle.winnerId || 'TBD'}</div>
            </div>
            <div>
              <span className="text-gray-400">Seed:</span>
              <div className="font-mono">{battle.seed}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            ← Back to Team Builder
          </button>
        </div>
      </div>
    </div>
  );
}