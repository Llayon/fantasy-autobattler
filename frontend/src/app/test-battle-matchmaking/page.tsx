/**
 * Test page for Battle/Matchmaking functionality.
 * Tests active team display, PvP matchmaking, bot battles, and all states.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation, NavigationWrapper } from '@/components/Navigation';

/**
 * Mock team data for testing.
 */
const mockTeam = {
  id: 'team-1',
  name: 'Элитная команда',
  totalCost: 28,
  units: [
    { id: 'knight', name: 'Knight', role: 'tank', cost: 5 },
    { id: 'archer', name: 'Archer', role: 'ranged_dps', cost: 4 },
    { id: 'mage', name: 'Mage', role: 'mage', cost: 6 },
    { id: 'priest', name: 'Priest', role: 'support', cost: 4 },
    { id: 'rogue', name: 'Rogue', role: 'melee_dps', cost: 5 },
    { id: 'guardian', name: 'Guardian', role: 'tank', cost: 4 },
  ],
};

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
function generateTeamPreview(team: typeof mockTeam): string {
  return team.units
    .slice(0, 6)
    .map(unit => getRoleIcon(unit.role))
    .join('');
}

/**
 * Test page component for Battle/Matchmaking functionality.
 */
export default function TestBattleMatchmakingPage() {
  const [hasActiveTeam, setHasActiveTeam] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  const teamPreview = generateTeamPreview(mockTeam);

  const startSearch = () => {
    setIsSearching(true);
    setSearchTime(0);
    
    // Simulate search timer
    const interval = setInterval(() => {
      setSearchTime(prev => {
        const newTime = prev + 1;
        
        // Simulate match found after 15 seconds
        if (newTime >= 15) {
          clearInterval(interval);
          setIsSearching(false);
          setMatchFound(true);
          
          // Reset after showing match found
          setTimeout(() => {
            setMatchFound(false);
            setSearchTime(0);
          }, 3000);
        }
        
        return newTime;
      });
    }, 1000);
  };

  const cancelSearch = () => {
    setIsSearching(false);
    setSearchTime(0);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <NavigationWrapper>
        <div className="container mx-auto p-6">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🧪 Battle/Matchmaking Test
            </h1>
            <p className="text-gray-300 mb-4">
              Testing active team display, PvP matchmaking, bot battles, and all states
            </p>
            
            <Link 
              href="/battle"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              → Go to Battle Page
            </Link>
          </div>

          {/* Test Controls */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">🎮 Test Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Team State</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setHasActiveTeam(true)}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      hasActiveTeam ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Has Active Team
                  </button>
                  <button
                    onClick={() => setHasActiveTeam(false)}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      !hasActiveTeam ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    No Active Team
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Search State</h3>
                <div className="space-y-2">
                  <button
                    onClick={startSearch}
                    disabled={isSearching || !hasActiveTeam}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    Start PvP Search
                  </button>
                  <button
                    onClick={cancelSearch}
                    disabled={!isSearching}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    Cancel Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Battle Page Preview */}
            <div className="space-y-6">
              {/* Active Team Header */}
              {hasActiveTeam ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        ⚔️ Активная команда
                      </h2>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium text-blue-400">{mockTeam.name}</span>
                          <span className="text-sm text-gray-400">
                            {mockTeam.totalCost}/30 очков
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Состав:</span>
                          <span className="text-xl">{teamPreview}</span>
                          <span className="text-sm text-gray-400">
                            ({mockTeam.units.length} юнитов)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
                      Изменить команду
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">⚠️</div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-yellow-300 mb-2">
                        Выберите команду
                      </h2>
                      <p className="text-yellow-200 mb-4">
                        Для участия в боях необходимо создать и активировать команду.
                      </p>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors font-medium">
                        🛠️ Создать команду
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Found */}
              {matchFound && (
                <div className="bg-green-900/30 border border-green-500 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <h2 className="text-2xl font-bold text-green-300 mb-2">
                      Матч найден!
                    </h2>
                    <p className="text-green-200 mb-4">
                      Переход к бою...
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 text-sm">Загрузка боя</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PvP Section */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">👥</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">PvP Матчмейкинг</h2>
                    <p className="text-gray-400 text-sm">
                      Сражайтесь с другими игроками за рейтинг
                    </p>
                  </div>
                </div>
                
                {/* Rating estimate */}
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Изменение рейтинга:</span>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400">Победа: +15-25</span>
                      <span className="text-red-400">Поражение: -25--15</span>
                    </div>
                  </div>
                </div>
                
                {/* Search status */}
                {isSearching && (
                  <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-blue-400 rounded-full animate-spin border-2 border-blue-400 border-t-transparent"></div>
                        <span className="text-blue-300 font-medium">Поиск противника...</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        {formatTime(searchTime)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="text-blue-300">
                          Команда: <span className="font-medium">{mockTeam.name}</span>
                        </div>
                        <div className="text-blue-300">
                          Рейтинг: <span className="font-medium">1250</span>
                        </div>
                        <div className="text-blue-400 text-xs mt-2">
                          {searchTime < 10 ? '🔍 Поиск подходящего противника...' :
                           searchTime < 30 ? '⏳ Расширяем диапазон поиска...' :
                           '🌐 Поиск по всем рейтингам...'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action button */}
                {!isSearching ? (
                  <button
                    onClick={startSearch}
                    disabled={!hasActiveTeam}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    🎯 Найти противника
                  </button>
                ) : (
                  <button
                    onClick={cancelSearch}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                  >
                    ❌ Отменить поиск
                  </button>
                )}
              </div>
            </div>

            {/* Bot Section & Features */}
            <div className="space-y-6">
              {/* Bot Section */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🤖</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Бои с ботами</h2>
                    <p className="text-gray-400 text-sm">
                      Тренировочные бои без изменения рейтинга
                    </p>
                  </div>
                </div>
                
                {/* No rating change notice */}
                <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>ℹ️</span>
                    <span>Без изменения рейтинга</span>
                  </div>
                </div>
                
                {/* Bot difficulty buttons */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'easy', name: 'Лёгкий', icon: '🟢', desc: 'Простая тактика, базовые юниты', color: 'border-green-500' },
                    { id: 'medium', name: 'Средний', icon: '🟡', desc: 'Сбалансированная команда, умная тактика', color: 'border-yellow-500' },
                    { id: 'hard', name: 'Сложный', icon: '🔴', desc: 'Оптимальная команда, продвинутая тактика', color: 'border-red-500' },
                  ].map((bot) => (
                    <div
                      key={bot.id}
                      className={`border-2 rounded-lg p-4 transition-all cursor-pointer hover:scale-105 ${
                        hasActiveTeam 
                          ? `${bot.color} hover:bg-gray-700/50` 
                          : 'border-gray-600 bg-gray-700/50 cursor-not-allowed opacity-50'
                      } ${selectedBot === bot.id ? 'bg-gray-700/50' : ''}`}
                      onClick={() => hasActiveTeam && setSelectedBot(bot.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{bot.icon}</div>
                          <div>
                            <h3 className="font-bold text-white">{bot.name}</h3>
                            <p className="text-sm text-gray-300">{bot.desc}</p>
                          </div>
                        </div>
                        <button
                          disabled={!hasActiveTeam}
                          className="px-3 py-1 bg-transparent border border-gray-500 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                        >
                          Начать бой
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">✅ Feature Checklist</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Active team display with name, cost, composition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>No team warning with link to Team Builder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>PvP "Find Opponent" button</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Search animation with timer and cancel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Rating change estimates (±15-25)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>3 bot difficulty levels with descriptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>"No rating change" notice for bots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Match found state with redirect simulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Loading states and error handling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Responsive design for mobile/desktop</span>
                  </div>
                </div>
              </div>

              {/* Current State */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">📊 Current State</h2>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-400">Has Active Team:</span>
                    <span className={`ml-2 ${hasActiveTeam ? 'text-green-400' : 'text-red-400'}`}>
                      {hasActiveTeam ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-400">Search Status:</span>
                    <span className={`ml-2 ${isSearching ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {isSearching ? 'Searching' : 'Idle'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-400">Search Time:</span>
                    <span className="ml-2">{formatTime(searchTime)}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Match Found:</span>
                    <span className={`ml-2 ${matchFound ? 'text-green-400' : 'text-gray-400'}`}>
                      {matchFound ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-400">Selected Bot:</span>
                    <span className="ml-2">{selectedBot || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}