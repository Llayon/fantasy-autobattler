/**
 * Test page for Battle History improvements.
 * Tests enhanced battle cards, pagination, filtering, and sorting.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BattleLog } from '@/types/game';

/**
 * Mock battle data for testing battle history improvements.
 * Guaranteed to have at least one battle for testing.
 */
const mockBattles: readonly [BattleLog, ...BattleLog[]] = [
  {
    id: 'battle-1',
    player1Id: 'current-player',
    player2Id: 'opponent-1',
    player1Name: 'Вы',
    player2Name: 'Алексей Воин',
    winner: 'player1',
    rounds: 15,
    status: 'completed',
    seed: 12345,
    createdAt: '2024-12-14T10:00:00Z',
    updatedAt: '2024-12-14T10:05:00Z',
    player1TeamSnapshot: {
      units: [
        { id: 'knight', name: 'Knight', role: 'tank', cost: 5, range: 1, abilities: [], stats: { hp: 120, atk: 25, atkCount: 1, armor: 8, speed: 2, initiative: 5, dodge: 10 } },
        { id: 'archer', name: 'Archer', role: 'ranged_dps', cost: 4, range: 4, abilities: [], stats: { hp: 80, atk: 35, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 15 } },
        { id: 'mage', name: 'Mage', role: 'mage', cost: 6, range: 3, abilities: [], stats: { hp: 60, atk: 45, atkCount: 1, armor: 1, speed: 2, initiative: 8, dodge: 5 } },
      ],
      positions: [{ x: 1, y: 0 }, { x: 3, y: 1 }, { x: 5, y: 0 }],
    },
    player2TeamSnapshot: {
      units: [
        { id: 'berserker', name: 'Berserker', role: 'tank', cost: 6, range: 1, abilities: [], stats: { hp: 100, atk: 40, atkCount: 2, armor: 4, speed: 3, initiative: 6, dodge: 5 } },
        { id: 'rogue', name: 'Rogue', role: 'melee_dps', cost: 5, range: 1, abilities: [], stats: { hp: 70, atk: 50, atkCount: 1, armor: 3, speed: 4, initiative: 9, dodge: 25 } },
      ],
      positions: [{ x: 2, y: 9 }, { x: 4, y: 8 }],
    },
    events: [],
  },
  {
    id: 'battle-2',
    player1Id: 'current-player',
    player2Id: 'bot-123',
    player1Name: 'Вы',
    winner: 'player2',
    rounds: 8,
    status: 'completed',
    seed: 12346,
    createdAt: '2024-12-13T15:30:00Z',
    updatedAt: '2024-12-13T15:35:00Z',
    player1TeamSnapshot: {
      units: [
        { id: 'priest', name: 'Priest', role: 'support', cost: 4, range: 2, abilities: [], stats: { hp: 70, atk: 20, atkCount: 1, armor: 3, speed: 2, initiative: 6, dodge: 10 } },
        { id: 'guardian', name: 'Guardian', role: 'tank', cost: 7, range: 1, abilities: [], stats: { hp: 150, atk: 20, atkCount: 1, armor: 12, speed: 1, initiative: 3, dodge: 5 } },
      ],
      positions: [{ x: 0, y: 1 }, { x: 2, y: 0 }],
    },
    player2TeamSnapshot: {
      units: [
        { id: 'warlock', name: 'Warlock', role: 'mage', cost: 6, range: 3, abilities: [], stats: { hp: 65, atk: 50, atkCount: 1, armor: 1, speed: 2, initiative: 7, dodge: 8 } },
        { id: 'crossbowman', name: 'Crossbowman', role: 'ranged_dps', cost: 5, range: 5, abilities: [], stats: { hp: 75, atk: 40, atkCount: 1, armor: 3, speed: 2, initiative: 6, dodge: 12 } },
        { id: 'assassin', name: 'Assassin', role: 'melee_dps', cost: 6, range: 1, abilities: [], stats: { hp: 60, atk: 60, atkCount: 1, armor: 2, speed: 5, initiative: 10, dodge: 30 } },
      ],
      positions: [{ x: 3, y: 9 }, { x: 5, y: 8 }, { x: 1, y: 9 }],
    },
    events: [],
  },
  {
    id: 'battle-3',
    player1Id: 'current-player',
    player2Id: 'opponent-2',
    player1Name: 'Вы',
    player2Name: 'Мария Стратег',
    winner: 'draw',
    rounds: 100,
    status: 'completed',
    seed: 12347,
    createdAt: '2024-12-12T20:15:00Z',
    updatedAt: '2024-12-12T21:45:00Z',
    player1TeamSnapshot: {
      units: [
        { id: 'enchanter', name: 'Enchanter', role: 'control', cost: 5, range: 2, abilities: [], stats: { hp: 55, atk: 30, atkCount: 1, armor: 2, speed: 3, initiative: 8, dodge: 15 } },
        { id: 'bard', name: 'Bard', role: 'support', cost: 4, range: 2, abilities: [], stats: { hp: 65, atk: 25, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 12 } },
      ],
      positions: [{ x: 1, y: 1 }, { x: 4, y: 0 }],
    },
    player2TeamSnapshot: {
      units: [
        { id: 'duelist', name: 'Duelist', role: 'melee_dps', cost: 5, range: 1, abilities: [], stats: { hp: 80, atk: 45, atkCount: 1, armor: 4, speed: 4, initiative: 8, dodge: 20 } },
        { id: 'hunter', name: 'Hunter', role: 'ranged_dps', cost: 4, range: 4, abilities: [], stats: { hp: 70, atk: 38, atkCount: 1, armor: 3, speed: 3, initiative: 7, dodge: 18 } },
      ],
      positions: [{ x: 2, y: 8 }, { x: 6, y: 9 }],
    },
    events: [],
  },
];

/**
 * Get role icon for unit role.
 */
function getRoleIcon(role: string): string {
  const roleIcons: Record<string, string> = {
    tank: '🛡️',
    melee_dps: '⚔️',
    ranged_dps: '🏹',
    mage: '🔮',
    support: '💚',
    control: '✨',
  };
  return roleIcons[role] || '❓';
}

/**
 * Generate team preview string.
 */
function generateTeamPreview(teamSetup: any): string {
  if (!teamSetup?.units || !Array.isArray(teamSetup.units)) {
    return '❓❓❓';
  }
  
  return teamSetup.units
    .slice(0, 4)
    .map((unit: any) => getRoleIcon(unit.role))
    .join('');
}

/**
 * Get battle type icon.
 */
function getBattleTypeIcon(battle: BattleLog): string {
  const opponentId = battle.player2Id;
  return opponentId === 'bot' || opponentId.startsWith('bot-') ? '🤖' : '👥';
}

/**
 * Test page component for Battle History improvements.
 */
export default function TestBattleHistoryPage() {
  const [selectedBattle, setSelectedBattle] = useState<BattleLog>(mockBattles[0]);
  
  // Ensure selectedBattle is never undefined
  const battle: BattleLog = selectedBattle;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 Battle History Test Page
          </h1>
          <p className="text-gray-300 mb-4">
            Testing enhanced battle cards, team previews, and filtering
          </p>
          
          <Link 
            href="/history"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            → Go to Battle History
          </Link>
        </div>

        {/* Battle Selector */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Select Test Battle:</h2>
          <div className="flex gap-2 flex-wrap">
            {mockBattles.map((battle) => (
              <button
                key={battle.id}
                onClick={() => setSelectedBattle(battle)}
                className={`
                  px-3 py-2 rounded-lg text-sm transition-colors
                  ${selectedBattle.id === battle.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }
                `}
              >
                {battle.winner === 'player1' ? '🏆 Victory' : 
                 battle.winner === 'draw' ? '🤝 Draw' : '💀 Defeat'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Battle Card Preview */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">📋 Enhanced Battle Card</h2>
              
              {/* Mock Battle Card */}
              <div className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg
                ${battle.winner === 'player1' 
                  ? 'bg-green-900/20 border-green-400/30' 
                  : battle.winner === 'draw'
                  ? 'bg-yellow-900/20 border-yellow-400/30'
                  : 'bg-red-900/20 border-red-400/30'
                }
                bg-gray-800 border-gray-600 hover:border-gray-500
              `}>
                <div className="flex items-center justify-between">
                  {/* Battle info */}
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {battle.winner === 'player1' ? '🏆' : 
                       battle.winner === 'draw' ? '🤝' : '💀'}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-bold ${
                          battle.winner === 'player1' ? 'text-green-400' : 
                          battle.winner === 'draw' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {battle.winner === 'player1' ? 'Победа' : 
                           battle.winner === 'draw' ? 'Ничья' : 'Поражение'}
                        </span>
                        <span className="text-gray-400">против</span>
                        <span className="text-white font-medium flex items-center gap-1">
                          {getBattleTypeIcon(battle)} {battle.player2Name || 'Бот'}
                        </span>
                        {battle.winner === 'draw' && (
                          <span 
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded cursor-help"
                            title="100 раундов = ничья"
                          >
                            100 раундов
                          </span>
                        )}
                      </div>
                      
                      {/* Team previews */}
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="text-blue-400">Вы:</span>
                        <span className="text-lg">{generateTeamPreview(battle.player1TeamSnapshot)}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-lg">{generateTeamPreview(battle.player2TeamSnapshot)}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>📅 {new Date(battle.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>⏱️ {Math.floor((battle.rounds || 1) * 3 / 60)}:{((battle.rounds || 1) * 3 % 60).toString().padStart(2, '0')}</span>
                        <span>🔄 {battle.rounds || 1} раундов</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions and rating */}
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className={`
                      text-lg font-bold px-3 py-1 rounded
                      ${battle.winner === 'player1' 
                        ? 'text-green-400 bg-green-900/30' 
                        : battle.winner === 'draw'
                        ? 'text-gray-400 bg-gray-900/30'
                        : 'text-red-400 bg-red-900/30'
                      }
                    `}>
                      {battle.winner === 'player1' ? '+15' : 
                       battle.winner === 'draw' ? '0' : '-12'}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Рейтинг</div>
                    
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors flex items-center gap-1">
                      ▶️ Смотреть повтор
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Composition Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">⚔️ Team Composition</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-blue-400 mb-2">Ваша команда</h3>
                  <div className="space-y-2">
                    {battle.player1TeamSnapshot?.units?.map((unit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{getRoleIcon(unit.role)}</span>
                        <span>{unit.name}</span>
                        <span className="text-gray-400">({unit.cost} очков)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-red-400 mb-2">Команда противника</h3>
                  <div className="space-y-2">
                    {battle.player2TeamSnapshot?.units?.map((unit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{getRoleIcon(unit.role)}</span>
                        <span>{unit.name}</span>
                        <span className="text-gray-400">({unit.cost} очков)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">✅ Feature Checklist</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Opponent nicknames instead of "Игрок 2715"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Team previews: "🛡️🛡️⚔️💚 vs 🏹🏹🔮✨"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Explicit "▶️ Смотреть повтор" button</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Battle type icons (👥 PvP / 🤖 Bot)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Infinite scroll / "Загрузить ещё" pagination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Draws filter tab with tooltip</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Sorting by date and rating change</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Enhanced empty state with "Найти бой" button</span>
                </div>
              </div>
            </div>

            {/* Filter and Sort Preview */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">🔍 Filters & Sorting</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Filter Tabs:</h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
                      ⚔️ Все бои <span className="bg-black/20 px-1 rounded">3</span>
                    </div>
                    <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm flex items-center gap-1">
                      🏆 Победы <span className="bg-black/20 px-1 rounded">1</span>
                    </div>
                    <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm flex items-center gap-1">
                      💀 Поражения <span className="bg-black/20 px-1 rounded">1</span>
                    </div>
                    <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm flex items-center gap-1 relative">
                      🤝 Ничьи <span className="bg-black/20 px-1 rounded">1</span>
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sort Options:</h3>
                  <select className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                    <option>Новые первые</option>
                    <option>Старые первые</option>
                    <option>Больше рейтинга</option>
                    <option>Меньше рейтинга</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Empty State Preview */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">📭 Empty State</h2>
              
              <div className="text-center py-8 bg-gray-700/30 rounded">
                <div className="text-4xl mb-2">⚔️</div>
                <h3 className="text-lg font-bold text-gray-400 mb-2">
                  Нет боёв
                </h3>
                <p className="text-gray-500 mb-4 text-sm">
                  Начните свой первый бой!
                </p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
                  🎯 Найти бой
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}