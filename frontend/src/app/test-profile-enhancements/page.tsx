/**
 * Test page for Profile page enhancements.
 * Tests ranking system, avatars, achievements, and team previews.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Mock data for testing profile enhancements.
 */
const mockProfiles = [
  {
    id: 'bronze-player',
    name: 'Новичок Иван',
    rating: 850,
    wins: 2,
    losses: 8,
    teams: 1,
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'silver-player', 
    name: 'Серебряный Алекс',
    rating: 1250,
    wins: 15,
    losses: 10,
    teams: 3,
    createdAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 'gold-player',
    name: 'Золотой Максим',
    rating: 1750,
    wins: 25,
    losses: 15,
    teams: 7,
    createdAt: '2024-10-01T10:00:00Z',
  },
  {
    id: 'platinum-player',
    name: 'Платиновый Дмитрий',
    rating: 2200,
    wins: 45,
    losses: 20,
    teams: 12,
    createdAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'diamond-player',
    name: 'Алмазный Владимир',
    rating: 2800,
    wins: 80,
    losses: 25,
    teams: 20,
    createdAt: '2024-08-01T10:00:00Z',
  },
];

/**
 * Get rank info for display.
 */
function getRankInfo(rating: number) {
  if (rating >= 2500) return { name: 'Алмаз', emoji: '💠', color: 'text-blue-400', range: '2500+' };
  if (rating >= 2000) return { name: 'Платина', emoji: '💎', color: 'text-cyan-400', range: '2000-2499' };
  if (rating >= 1500) return { name: 'Золото', emoji: '🥇', color: 'text-yellow-500', range: '1500-1999' };
  if (rating >= 1000) return { name: 'Серебро', emoji: '🥈', color: 'text-gray-400', range: '1000-1499' };
  return { name: 'Бронза', emoji: '🥉', color: 'text-amber-600', range: '0-999' };
}

/**
 * Get achievements for player.
 */
function getAchievements(wins: number, gamesPlayed: number, teams: number) {
  const achievements = [];
  
  if (wins >= 1) achievements.push({ name: 'Первая победа', emoji: '🏆', earned: true });
  else achievements.push({ name: 'Первая победа', emoji: '🏆', earned: false });
  
  if (gamesPlayed >= 10) achievements.push({ name: 'Ветеран', emoji: '🎖️', earned: true });
  else achievements.push({ name: 'Ветеран', emoji: '🎖️', earned: false });
  
  if (wins >= 10) achievements.push({ name: 'Победитель', emoji: '👑', earned: true });
  else achievements.push({ name: 'Победитель', emoji: '👑', earned: false });
  
  if (teams >= 5) achievements.push({ name: 'Стратег', emoji: '🧠', earned: true });
  else achievements.push({ name: 'Стратег', emoji: '🧠', earned: false });
  
  return achievements;
}

/**
 * Generate avatar URL.
 */
function generateAvatarUrl(playerId: string, variant: string = 'beam'): string {
  return `https://source.boringavatars.com/${variant}/120/${encodeURIComponent(playerId)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

/**
 * Test page component for Profile enhancements.
 */
export default function TestProfileEnhancementsPage() {
  const [selectedProfile, setSelectedProfile] = useState(mockProfiles[1]);
  const [avatarVariant, setAvatarVariant] = useState('beam');
  const [showRankTooltip, setShowRankTooltip] = useState(false);

  // Ensure selectedProfile is never undefined
  if (!selectedProfile) {
    return <div>Loading...</div>;
  }
  const profile = selectedProfile;
  
  const rank = getRankInfo(profile.rating);
  const gamesPlayed = profile.wins + profile.losses;
  const winRate = gamesPlayed > 0 ? Math.round((profile.wins / gamesPlayed) * 100) : 0;
  const achievements = getAchievements(profile.wins, gamesPlayed, profile.teams);
  const earnedCount = achievements.filter(a => a.earned).length;

  // Calculate rank progress
  const getNextThreshold = (rating: number) => {
    if (rating < 1000) return 1000;
    if (rating < 1500) return 1500;
    if (rating < 2000) return 2000;
    if (rating < 2500) return 2500;
    return null;
  };

  const getCurrentThreshold = (rating: number) => {
    if (rating >= 2500) return 2000;
    if (rating >= 2000) return 1500;
    if (rating >= 1500) return 1000;
    if (rating >= 1000) return 0;
    return 0;
  };

  const nextThreshold = getNextThreshold(profile.rating);
  const currentThreshold = getCurrentThreshold(profile.rating);
  const progress = nextThreshold 
    ? Math.min(100, ((profile.rating - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  const avatarVariants = ['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus', 'geometric', 'abstract'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 Profile Enhancements Test
          </h1>
          <p className="text-gray-300 mb-4">
            Testing ranking system, avatars, achievements, and team previews
          </p>
          
          <Link 
            href="/profile"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            → Go to Real Profile Page
          </Link>
        </div>

        {/* Profile Selector */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Select Test Profile:</h2>
          <div className="flex gap-2 flex-wrap">
            {mockProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={`
                  px-3 py-2 rounded-lg text-sm transition-colors
                  ${selectedProfile?.id === profile.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }
                `}
              >
                {profile.name} ({getRankInfo(profile.rating).name})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile Display */}
          <div className="space-y-6">
            {/* Header with Avatar */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">👤 Player Header</h2>
              
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={generateAvatarUrl(profile.id, avatarVariant)}
                    alt="Player Avatar"
                    className="w-24 h-24 rounded-full border-4 border-gray-600"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    ✏️
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="text-gray-400 mt-2">
                    Игрок с {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking System with Tooltip */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">🏆 Ranking System</h2>
              
              <div className="grid grid-cols-4 gap-4">
                {/* Rank Display */}
                <div className="relative">
                  <div
                    className="text-center cursor-pointer"
                    onMouseEnter={() => setShowRankTooltip(true)}
                    onMouseLeave={() => setShowRankTooltip(false)}
                  >
                    <div className="text-3xl mb-1">{rank.emoji}</div>
                    <div className={`font-bold ${rank.color}`}>{rank.name}</div>
                    <div className="text-2xl font-bold text-white">{profile.rating}</div>
                    <div className="text-sm text-gray-400">Рейтинг</div>
                  </div>

                  {/* Tooltip */}
                  {showRankTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                      <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl min-w-48">
                        <div className="text-sm">
                          <div className="font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-lg">{rank.emoji}</span>
                            {rank.name}
                          </div>
                          
                          <div className="text-gray-300 mb-2">
                            Диапазон: {rank.range}
                          </div>
                          
                          {nextThreshold && (
                            <>
                              <div className="text-gray-300 mb-2">
                                До следующего: {nextThreshold - profile.rating} очков
                              </div>
                              
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Прогресс</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          
                          {progress === 100 && (
                            <div className="text-yellow-400 text-sm font-medium">
                              🏆 Максимальный ранг!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Stats */}
                <div className="text-center">
                  <div className="text-2xl mb-1">🎮</div>
                  <div className="text-2xl font-bold text-white">{gamesPlayed}</div>
                  <div className="text-sm text-gray-400">Игр</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-2xl font-bold text-green-400">{profile.wins}</div>
                  <div className="text-sm text-gray-400">Побед</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-1">💀</div>
                  <div className="text-2xl font-bold text-red-400">{profile.losses}</div>
                  <div className="text-sm text-gray-400">Поражений</div>
                </div>
              </div>

              {/* Win Rate Bar */}
              <div className="mt-6">
                <div className="text-sm text-gray-400 mb-2">Процент побед</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-green-400">{winRate}%</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">
                🏅 Достижения ({earnedCount}/{achievements.length})
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`
                      text-center p-3 rounded-lg border-2 transition-all
                      ${achievement.earned 
                        ? 'border-yellow-400/50 bg-yellow-900/20' 
                        : 'border-gray-600 bg-gray-700/30 opacity-60'
                      }
                    `}
                  >
                    <div className={`text-2xl mb-2 ${achievement.earned ? '' : 'grayscale'}`}>
                      {achievement.emoji}
                    </div>
                    <div className={`font-medium text-sm ${achievement.earned ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {achievement.name}
                    </div>
                    {achievement.earned && (
                      <div className="text-xs text-yellow-400 mt-1 font-medium">
                        ✅ Получено
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Avatar Selector */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">🎨 Avatar Variants</h2>
              
              <div className="grid grid-cols-4 gap-3 mb-4">
                {avatarVariants.map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setAvatarVariant(variant)}
                    className={`
                      relative rounded-full border-2 transition-all hover:scale-105
                      ${avatarVariant === variant 
                        ? 'border-blue-400 ring-2 ring-blue-400/50' 
                        : 'border-gray-600 hover:border-gray-500'
                      }
                    `}
                  >
                    <img
                      src={generateAvatarUrl(profile.id, variant)}
                      alt={variant}
                      className="w-12 h-12 rounded-full"
                    />
                  </button>
                ))}
              </div>
              
              <p className="text-sm text-gray-400">
                Current: <span className="text-white capitalize">{avatarVariant}</span>
              </p>
            </div>

            {/* Test Checklist */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">✅ Test Checklist</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Ranking system with 5 tiers (Bronze to Diamond)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Rank tooltip shows progress to next tier</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Avatar generation with 8+ variants</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>4 achievements with unlock conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Visual feedback for earned/unearned achievements</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⏳</span>
                  <span>Team hover previews (requires real teams)</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">📋 Test Instructions</h2>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <strong>1. Ranking System:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Hover over rank to see tooltip</li>
                    <li>• Progress bar shows advancement</li>
                    <li>• Try different profiles to see all ranks</li>
                  </ul>
                </div>
                
                <div>
                  <strong>2. Avatar System:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Click avatar variants to change style</li>
                    <li>• Each player gets consistent avatar per style</li>
                    <li>• 10 preset styles available</li>
                  </ul>
                </div>
                
                <div>
                  <strong>3. Achievements:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Earned achievements are highlighted</li>
                    <li>• Progress tracked automatically</li>
                    <li>• Visual feedback for completion</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}