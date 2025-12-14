/**
 * Example usage of BattleResult component.
 * Demonstrates how to integrate the battle result screen.
 * 
 * @fileoverview Usage examples for BattleResult component integration.
 */

'use client';

import { useState } from 'react';
import { BattleResult } from './BattleResult';
import { BattleLog } from '@/types/game';

// Example battle log data
const exampleBattleLog: BattleLog = {
  id: 'battle-123',
  player1Id: 'player-456',
  player2Id: 'bot-789',
  winnerId: 'player-456',
  winner: 'player1',
  rounds: 8,
  status: 'completed',
  seed: 12345,
  createdAt: '2025-12-12T10:00:00Z',
  updatedAt: '2025-12-12T10:02:30Z',
  player1TeamSnapshot: {
    units: [
      {
        id: 'knight',
        name: 'Knight',
        role: 'tank',
        cost: 5,
        stats: { hp: 120, atk: 15, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 5 },
        range: 1,
        abilities: []
      }
    ],
    positions: [{ x: 1, y: 0 }]
  },
  player2TeamSnapshot: {
    units: [
      {
        id: 'mage',
        name: 'Mage',
        role: 'mage',
        cost: 4,
        stats: { hp: 80, atk: 25, atkCount: 1, armor: 2, speed: 3, initiative: 6, dodge: 10 },
        range: 4,
        abilities: []
      }
    ],
    positions: [{ x: 1, y: 9 }]
  },
  events: [
    {
      round: 1,
      type: 'round_start',
      actorId: 'system'
    },
    {
      round: 1,
      type: 'move',
      actorId: 'player_knight_0',
      fromPosition: { x: 1, y: 0 },
      toPosition: { x: 1, y: 2 }
    },
    {
      round: 2,
      type: 'attack',
      actorId: 'bot_mage_0',
      targetId: 'player_knight_0'
    },
    {
      round: 2,
      type: 'damage',
      actorId: 'bot_mage_0',
      targetId: 'player_knight_0',
      damage: 17
    },
    {
      round: 8,
      type: 'death',
      actorId: 'player_knight_0',
      targetId: 'bot_mage_0',
      killedUnits: ['bot_mage_0']
    },
    {
      round: 8,
      type: 'battle_end',
      actorId: 'system'
    }
  ]
};

/**
 * Example component showing BattleResult integration.
 * 
 * @returns Example component
 * @example
 * <BattleResultExample />
 */
export function BattleResultExample() {
  const [showResult, setShowResult] = useState(false);
  
  const handleWatchReplay = () => {
    // Navigate to battle replay
    // In real app: router.push(`/battle/${battleLog.id}`);
  };
  
  const handleNewBattle = () => {
    // Start new battle
    setShowResult(false);
    // In real app: router.push('/matchmaking');
  };
  
  const handleEditTeam = () => {
    // Edit team
    setShowResult(false);
    // In real app: router.push('/');
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-8">
          Battle Result Component Example
        </h1>
        
        <button
          onClick={() => setShowResult(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Show Victory Result
        </button>
        
        <button
          onClick={() => setShowResult(false)}
          className="ml-4 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
        >
          Hide Result
        </button>
      </div>
      
      <BattleResult
        battle={exampleBattleLog}
        playerId="player-456"
        ratingChange={{
          oldRating: 1200,
          newRating: 1215,
          change: 15
        }}
        onWatchReplay={handleWatchReplay}
        onNewBattle={handleNewBattle}
        onEditTeam={handleEditTeam}
        show={showResult}
      />
    </div>
  );
}