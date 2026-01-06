/**
 * Player Profile page content for Fantasy Autobattler.
 * Displays player information, statistics, teams, and settings.
 * 
 * @fileoverview Complete player profile page content with editable name, stats, and team management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { TeamResponse, Player, UNIT_INFO, UnitId } from '@/types/game';
import { api, ApiError } from '@/lib/api';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader, ButtonLoader } from '@/components/LoadingStates';
import { useToast } from '@/components/ErrorStates';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Player statistics with computed values.
 */
interface PlayerStats {
  /** Total games played */
  gamesPlayed: number;
  /** Total wins */
  wins: number;
  /** Total losses */
  losses: number;
  /** Win rate percentage */
  winRate: number;
  /** Current rating */
  rating: number;
  /** Player rank based on rating */
  rank: string;
}

/**
 * Recent battle summary for win rate chart.
 */
interface RecentBattleResult {
  /** Battle ID */
  id: string;
  /** Battle outcome */
  result: 'win' | 'loss' | 'draw';
  /** Battle date */
  date: Date;
  /** Opponent name */
  opponent: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Rating thresholds for ranks */
const RANK_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 1500,
  PLATINUM: 2000,
  DIAMOND: 2500,
} as const;

/** Rank display information */
const RANK_INFO = {
  BRONZE: { name: 'Бронза', emoji: '🥉', color: 'text-amber-600', range: '0-999' },
  SILVER: { name: 'Серебро', emoji: '🥈', color: 'text-gray-400', range: '1000-1499' },
  GOLD: { name: 'Золото', emoji: '🥇', color: 'text-yellow-500', range: '1500-1999' },
  PLATINUM: { name: 'Платина', emoji: '💎', color: 'text-cyan-400', range: '2000-2499' },
  DIAMOND: { name: 'Алмаз', emoji: '💠', color: 'text-blue-400', range: '2500+' },
} as const;

/** Achievement definitions */
const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: 'first_win',
    name: 'Первая победа',
    description: 'Выиграть 1 бой',
    emoji: '🏆',
    requirement: (stats: PlayerStats) => stats.wins >= 1,
  },
  VETERAN: {
    id: 'veteran',
    name: 'Ветеран',
    description: 'Сыграть 10 боёв',
    emoji: '🎖️',
    requirement: (stats: PlayerStats) => stats.gamesPlayed >= 10,
  },
  WINNER: {
    id: 'winner',
    name: 'Победитель',
    description: 'Выиграть 10 боёв',
    emoji: '👑',
    requirement: (stats: PlayerStats) => stats.wins >= 10,
  },
  STRATEGIST: {
    id: 'strategist',
    name: 'Стратег',
    description: 'Собрать 5 команд',
    emoji: '🧠',
    requirement: (_stats: PlayerStats, teamCount: number) => teamCount >= 5,
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get player rank based on rating.
 * 
 * @param rating - Player rating
 * @returns Rank information with progress to next rank
 * @example
 * const rank = getRankFromRating(1250);
 * console.log(rank.name); // 'Серебро'
 */
function getRankFromRating(rating: number): { 
  name: string; 
  emoji: string; 
  color: string; 
  range: string;
  progress: number;
  nextRank?: string;
  pointsToNext?: number;
} {
  let currentRank: typeof RANK_INFO[keyof typeof RANK_INFO] = RANK_INFO.BRONZE;
  let nextThreshold: number = RANK_THRESHOLDS.SILVER;
  let nextRankName = 'Серебро';

  if (rating >= RANK_THRESHOLDS.DIAMOND) {
    currentRank = RANK_INFO.DIAMOND;
    return { ...currentRank, progress: 100 }; // Max rank
  } else if (rating >= RANK_THRESHOLDS.PLATINUM) {
    currentRank = RANK_INFO.PLATINUM;
    nextThreshold = RANK_THRESHOLDS.DIAMOND;
    nextRankName = 'Алмаз';
  } else if (rating >= RANK_THRESHOLDS.GOLD) {
    currentRank = RANK_INFO.GOLD;
    nextThreshold = RANK_THRESHOLDS.PLATINUM;
    nextRankName = 'Платина';
  } else if (rating >= RANK_THRESHOLDS.SILVER) {
    currentRank = RANK_INFO.SILVER;
    nextThreshold = RANK_THRESHOLDS.GOLD;
    nextRankName = 'Золото';
  } else {
    currentRank = RANK_INFO.BRONZE;
    nextThreshold = RANK_THRESHOLDS.SILVER;
    nextRankName = 'Серебро';
  }

  const currentThreshold = rating >= RANK_THRESHOLDS.DIAMOND ? RANK_THRESHOLDS.PLATINUM :
                          rating >= RANK_THRESHOLDS.PLATINUM ? RANK_THRESHOLDS.GOLD :
                          rating >= RANK_THRESHOLDS.GOLD ? RANK_THRESHOLDS.SILVER :
                          rating >= RANK_THRESHOLDS.SILVER ? RANK_THRESHOLDS.BRONZE :
                          RANK_THRESHOLDS.BRONZE;

  const progress = Math.min(100, ((rating - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
  const pointsToNext = nextThreshold - rating;

  return {
    ...currentRank,
    progress,
    nextRank: nextRankName,
    pointsToNext: pointsToNext > 0 ? pointsToNext : undefined,
  };
}

/**
 * Generate avatar URL using Boring Avatars.
 * 
 * @param playerId - Player ID for consistent avatar generation
 * @param variant - Avatar style variant
 * @returns Avatar URL
 * @example
 * const avatarUrl = generateAvatarUrl('player-123', 'beam');
 */
function generateAvatarUrl(playerId: string, variant: string = 'beam'): string {
  const variants = ['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus'];
  const selectedVariant = variants.includes(variant) ? variant : 'beam';
  return `https://source.boringavatars.com/${selectedVariant}/120/${encodeURIComponent(playerId)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

/**
 * Get available preset avatars.
 * 
 * @returns Array of preset avatar options
 */
function getPresetAvatars(): Array<{ id: string; name: string; url: string }> {
  const variants = ['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus', 'geometric', 'abstract'];
  return variants.slice(0, 10).map((variant, index) => ({
    id: variant,
    name: `Стиль ${index + 1}`,
    url: generateAvatarUrl('preset', variant),
  }));
}

/**
 * Check which achievements player has earned.
 * 
 * @param stats - Player statistics
 * @param teamCount - Number of teams player has
 * @returns Array of earned achievements
 */
function getEarnedAchievements(stats: PlayerStats, teamCount: number) {
  return Object.values(ACHIEVEMENTS).filter(achievement => 
    achievement.requirement(stats, teamCount)
  );
}

/**
 * Calculate win rate percentage.
 * 
 * @param wins - Number of wins
 * @param losses - Number of losses
 * @returns Win rate percentage (0-100)
 * @example
 * const winRate = calculateWinRate(7, 3);
 * console.log(winRate); // 70
 */
function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
}

/**
 * Generate profile share URL.
 * 
 * @param playerId - Player ID
 * @returns Shareable profile URL
 * @example
 * const url = generateProfileUrl('player-123');
 */
function generateProfileUrl(playerId: string): string {
  // Only generate full URL on client side
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    try {
      return `${window.location.origin}/profile/${playerId}`;
    } catch (error) {
      // Fallback if window.location access fails
      return `/profile/${playerId}`;
    }
  }
  // Fallback for server-side rendering
  return `/profile/${playerId}`;
}

/**
 * Copy text to clipboard.
 * 
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 * @example
 * await copyToClipboard('Hello World');
 */
async function copyToClipboard(text: string): Promise<void> {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('Clipboard API not available during server-side rendering');
  }
  
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Player avatar component with selection modal.
 */
function PlayerAvatar({ 
  playerId, 
  currentVariant = 'beam',
  onVariantChange 
}: { 
  playerId: string;
  currentVariant?: string;
  onVariantChange?: (variant: string) => void;
}) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(currentVariant);
  const presetAvatars = getPresetAvatars();

  const handleSaveAvatar = () => {
    onVariantChange?.(selectedVariant);
    setShowAvatarModal(false);
  };

  return (
    <>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={generateAvatarUrl(playerId, currentVariant)}
          alt="Player Avatar"
          className="w-24 h-24 rounded-full border-4 border-gray-600 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => setShowAvatarModal(true)}
          title="Нажмите, чтобы изменить аватар"
        />
        <button
          onClick={() => setShowAvatarModal(true)}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-colors"
          title="Изменить аватар"
        >
          ✏️
        </button>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-xl font-bold mb-4">Выберите аватар</h3>
            
            <div className="grid grid-cols-5 gap-3 mb-6">
              {presetAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedVariant(avatar.id)}
                  className={`
                    relative rounded-full border-2 transition-all hover:scale-105
                    ${selectedVariant === avatar.id 
                      ? 'border-blue-400 ring-2 ring-blue-400/50' 
                      : 'border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generateAvatarUrl(playerId, avatar.id)}
                    alt={avatar.name}
                    className="w-12 h-12 rounded-full"
                  />
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSaveAvatar}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Rank display with tooltip showing progress to next rank.
 */
function RankDisplay({ rating }: { rating: number }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const rank = getRankFromRating(rating);

  return (
    <div className="relative">
      <div
        className="text-center cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="text-3xl mb-1">{rank.emoji}</div>
        <div className={`font-bold ${rank.color}`}>{rank.name}</div>
        <div className="text-2xl font-bold text-white">{rating}</div>
        <div className="text-sm text-gray-400">Рейтинг</div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
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
              
              {rank.nextRank && rank.pointsToNext && (
                <>
                  <div className="text-gray-300 mb-2">
                    До {rank.nextRank}: {rank.pointsToNext} очков
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Прогресс</span>
                      <span>{Math.round(rank.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${rank.progress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {rank.progress === 100 && (
                <div className="text-yellow-400 text-sm font-medium">
                  🏆 Максимальный ранг!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Achievements display component.
 */
function AchievementsCard({ 
  stats, 
  teamCount 
}: { 
  stats: PlayerStats;
  teamCount: number;
}) {
  const earnedAchievements = getEarnedAchievements(stats, teamCount);
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        🏅 Достижения ({earnedAchievements.length}/{totalAchievements})
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(ACHIEVEMENTS).map((achievement) => {
          const isEarned = earnedAchievements.some(earned => earned.id === achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`
                text-center p-3 rounded-lg border-2 transition-all
                ${isEarned 
                  ? 'border-yellow-400/50 bg-yellow-900/20' 
                  : 'border-gray-600 bg-gray-700/30 opacity-60'
                }
              `}
              title={achievement.description}
            >
              <div className={`text-2xl mb-2 ${isEarned ? '' : 'grayscale'}`}>
                {achievement.emoji}
              </div>
              <div className={`font-medium text-sm ${isEarned ? 'text-yellow-400' : 'text-gray-400'}`}>
                {achievement.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {achievement.description}
              </div>
              {isEarned && (
                <div className="text-xs text-yellow-400 mt-1 font-medium">
                  ✅ Получено
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Editable player name component.
 */
function EditablePlayerName({ 
  name, 
  onSave 
}: { 
  name: string; 
  onSave: (newName: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editName.trim() === name.trim()) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editName.trim());
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in parent component
      setEditName(name); // Reset to original name
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="text-3xl font-bold bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:border-blue-500"
          maxLength={20}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <ButtonLoader
          loading={saving}
          onClick={handleSave}
          disabled={!editName.trim()}
          variant="success"
          size="sm"
          loadingText="💾"
        >
          ✅
        </ButtonLoader>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded transition-colors"
        >
          ❌
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-3xl font-bold">{name}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        title="Редактировать имя"
      >
        ✏️
      </button>
    </div>
  );
}

/**
 * Player statistics card component.
 */
function StatsCard({ stats }: { stats: PlayerStats }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📊 Статистика
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rating & Rank with tooltip */}
        <RankDisplay rating={stats.rating} />

        {/* Games Played */}
        <div className="text-center">
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-2xl font-bold text-white">{stats.gamesPlayed}</div>
          <div className="text-sm text-gray-400">Игр сыграно</div>
        </div>

        {/* Wins */}
        <div className="text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          <div className="text-sm text-gray-400">Побед</div>
        </div>

        {/* Losses */}
        <div className="text-center">
          <div className="text-2xl mb-1">💀</div>
          <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          <div className="text-sm text-gray-400">Поражений</div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="mt-6 text-center">
        <div className="text-sm text-gray-400 mb-2">Процент побед</div>
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
          <span className="text-lg font-bold text-green-400">{stats.winRate}%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Get role icon for unit role.
 * 
 * @param role - Unit role
 * @returns Role icon emoji
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
 * Team preview tooltip component.
 */
function TeamPreview({ 
  team, 
  position 
}: { 
  team: TeamResponse;
  position: { x: number; y: number };
}) {
  return (
    <div
      className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl max-w-xs"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="text-sm">
        <div className="font-bold text-white mb-2">{team.name}</div>
        
        {/* Unit list with emojis */}
        <div className="flex flex-wrap gap-1 mb-2">
          {team.units.map((unit, index) => {
            const unitInfo = UNIT_INFO[unit.unitId as UnitId];
            return (
              <div 
                key={index} 
                className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded"
                title={`${unit.name} - ${unit.cost} очков`}
              >
                <span className="text-base">{unitInfo?.emoji || '❓'}</span>
                <span className="text-xs text-gray-300">{unit.name}</span>
              </div>
            );
          })}
        </div>
        
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
          {team.totalCost}/30 очков • {team.units.length} юнитов
        </div>
      </div>
    </div>
  );
}

/**
 * Player teams list component with hover previews.
 */
function TeamsCard({ 
  teams, 
  onTeamClick,
  onCreateTeam
}: { 
  teams: TeamResponse[];
  onTeamClick: (teamId: string) => void;
  onCreateTeam: () => void;
}) {
  const [hoveredTeam, setHoveredTeam] = useState<{
    team: TeamResponse;
    position: { x: number; y: number };
  } | null>(null);

  const handleTeamHover = (team: TeamResponse, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredTeam({
      team,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      },
    });
  };

  const handleTeamLeave = () => {
    setHoveredTeam(null);
  };

  if (teams.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          ⚔️ Команды
        </h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏗️</div>
          <p className="text-gray-400 mb-4">У вас пока нет команд</p>
          <ButtonLoader
            loading={false}
            onClick={onCreateTeam}
            variant="primary"
            size="lg"
          >
            Создать команду
          </ButtonLoader>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          ⚔️ Команды ({teams.length})
        </h2>
        
        <div className="space-y-3">
          {teams.map(team => (
            <div
              key={team.id}
              onClick={() => onTeamClick(team.id)}
              onMouseEnter={(e) => handleTeamHover(team, e)}
              onMouseLeave={handleTeamLeave}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg
                ${team.isActive 
                  ? 'bg-blue-900/30 border-blue-400/50 hover:border-blue-400' 
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {team.isActive && <span className="text-blue-400">⭐</span>}
                    <span className="font-bold text-white">{team.name}</span>
                    {team.isActive && (
                      <span className="px-2 py-1 bg-blue-600 text-xs rounded text-white">
                        Активная
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {team.units.length} юнитов • {team.totalCost}/30 очков
                  </div>
                  
                  {/* Unit emoji preview */}
                  <div className="flex gap-1">
                    {team.units.slice(0, 6).map((unit, index) => {
                      const unitInfo = UNIT_INFO[unit.unitId as UnitId];
                      return (
                        <span 
                          key={index} 
                          className="text-lg" 
                          title={`${unit.name} (${getRoleIcon(unit.role)})`}
                        >
                          {unitInfo?.emoji || '❓'}
                        </span>
                      );
                    })}
                    {team.units.length > 6 && (
                      <span className="text-xs text-gray-400">+{team.units.length - 6}</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {new Date(team.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={onCreateTeam}
          className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          + Создать новую команду
        </button>
      </div>

      {/* Team preview tooltip */}
      {hoveredTeam && (
        <TeamPreview 
          team={hoveredTeam.team} 
          position={hoveredTeam.position} 
        />
      )}
    </>
  );
}

/**
 * Win rate chart component (simplified version).
 */
function WinRateChart({ battles }: { battles: RecentBattleResult[] }) {
  if (battles.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📈 Последние игры
        </h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  // Take last 20 battles
  const recentBattles = battles.slice(-20);
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📈 Последние {recentBattles.length} игр
      </h2>
      
      <div className="flex items-end gap-1 h-20 mb-4">
        {recentBattles.map((battle) => (
          <div
            key={battle.id}
            className={`
              flex-1 rounded-t transition-all duration-200 hover:opacity-80
              ${battle.result === 'win' 
                ? 'bg-green-500' 
                : battle.result === 'loss' 
                ? 'bg-red-500' 
                : 'bg-yellow-500'
              }
            `}
            style={{ 
              height: battle.result === 'win' ? '100%' : battle.result === 'loss' ? '40%' : '70%' 
            }}
            title={`${battle.result === 'win' ? 'Победа' : battle.result === 'loss' ? 'Поражение' : 'Ничья'} против ${battle.opponent}`}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Старые</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Победы</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Поражения</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Ничьи</span>
          </div>
        </div>
        <span>Новые</span>
      </div>
    </div>
  );
}

/**
 * Settings card component with UI preferences.
 */
function SettingsCard() {
  const { 
    showDebugInfo, 
    toggleDebugInfo, 
    showAdvancedStats, 
    toggleAdvancedStats, 
    animationSpeed, 
    setAnimationSpeed,
    mechanics,
    setMechanicsPreset,
    toggleMechanic,
    getMechanicsToggles,
  } = useUIStore();

  const [showMechanicsDetails, setShowMechanicsDetails] = useState(false);
  const currentToggles = getMechanicsToggles();

  // Mechanics preset info
  const presetInfo = {
    mvp: { 
      name: 'MVP (Классика)', 
      description: 'Базовые механики без дополнительных систем',
      emoji: '🎮',
      color: 'text-gray-400',
    },
    tactical: { 
      name: 'Тактический', 
      description: 'Направление, фланги, рипост, перехват',
      emoji: '⚔️',
      color: 'text-blue-400',
    },
    roguelike: { 
      name: 'Roguelike', 
      description: 'Все 14 механик включены',
      emoji: '🎲',
      color: 'text-purple-400',
    },
    custom: { 
      name: 'Пользовательский', 
      description: 'Настройте механики вручную',
      emoji: '⚙️',
      color: 'text-yellow-400',
    },
  };

  // Mechanics categories for display
  const mechanicsCategories = [
    {
      tier: 'Tier 0',
      name: 'Базовые',
      mechanics: [
        { key: 'facing' as const, name: 'Направление', description: 'Юниты имеют направление взгляда' },
      ],
    },
    {
      tier: 'Tier 1',
      name: 'Основные',
      mechanics: [
        { key: 'resolve' as const, name: 'Мораль', description: 'Система морали и отступления' },
        { key: 'engagement' as const, name: 'Зона контроля', description: 'Ближний бой блокирует движение' },
        { key: 'flanking' as const, name: 'Фланги', description: 'Бонус урона с флангов и тыла' },
      ],
    },
    {
      tier: 'Tier 2',
      name: 'Продвинутые',
      mechanics: [
        { key: 'riposte' as const, name: 'Рипост', description: 'Контратака при атаке спереди' },
        { key: 'intercept' as const, name: 'Перехват', description: 'Блокировка проходящих врагов' },
        { key: 'aura' as const, name: 'Ауры', description: 'Эффекты области вокруг юнитов' },
      ],
    },
    {
      tier: 'Tier 3',
      name: 'Специализированные',
      mechanics: [
        { key: 'charge' as const, name: 'Заряд', description: 'Бонус урона от разбега' },
        { key: 'overwatch' as const, name: 'Дозор', description: 'Реакция на движение врагов' },
        { key: 'phalanx' as const, name: 'Фаланга', description: 'Бонусы от построения' },
        { key: 'lineOfSight' as const, name: 'Линия обзора', description: 'Блокировка стрельбы юнитами' },
        { key: 'ammunition' as const, name: 'Боеприпасы', description: 'Ограниченные выстрелы' },
      ],
    },
    {
      tier: 'Tier 4',
      name: 'Контр-механики',
      mechanics: [
        { key: 'contagion' as const, name: 'Заражение', description: 'Распространение эффектов' },
        { key: 'armorShred' as const, name: 'Пробитие брони', description: 'Накопительное снижение брони' },
      ],
    },
  ];

  const enabledCount = Object.values(currentToggles).filter(Boolean).length;
  const totalCount = Object.keys(currentToggles).length;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        ⚙️ Настройки
      </h2>
      
      <div className="space-y-4">
        {/* Debug Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div>
            <div className="font-medium text-white">Режим отладки</div>
            <div className="text-sm text-gray-400">Показывать координаты на сетке поля боя</div>
          </div>
          <button
            onClick={toggleDebugInfo}
            className={`
              relative w-14 h-7 rounded-full transition-colors duration-200
              ${showDebugInfo ? 'bg-blue-600' : 'bg-gray-600'}
            `}
            title={showDebugInfo ? 'Отключить режим отладки' : 'Включить режим отладки'}
          >
            <div
              className={`
                absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${showDebugInfo ? 'transform translate-x-7' : ''}
              `}
            />
          </button>
        </div>

        {/* Advanced Stats Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div>
            <div className="font-medium text-white">Расширенная статистика</div>
            <div className="text-sm text-gray-400">Показывать дополнительные параметры юнитов</div>
          </div>
          <button
            onClick={toggleAdvancedStats}
            className={`
              relative w-14 h-7 rounded-full transition-colors duration-200
              ${showAdvancedStats ? 'bg-blue-600' : 'bg-gray-600'}
            `}
            title={showAdvancedStats ? 'Отключить расширенную статистику' : 'Включить расширенную статистику'}
          >
            <div
              className={`
                absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${showAdvancedStats ? 'transform translate-x-7' : ''}
              `}
            />
          </button>
        </div>

        {/* Animation Speed Slider */}
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="mb-3">
            <div className="font-medium text-white">Скорость анимации</div>
            <div className="text-sm text-gray-400">Настройка скорости воспроизведения боя</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">0.25x</span>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-400">4x</span>
            <span className="text-white font-medium min-w-[3rem] text-right">{animationSpeed}x</span>
          </div>
        </div>

        {/* Mechanics 2.0 Settings */}
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="mb-3">
            <div className="font-medium text-white flex items-center gap-2">
              🎯 Механики боя 2.0
              <span className="text-xs px-2 py-0.5 bg-purple-600 rounded-full">
                {enabledCount}/{totalCount}
              </span>
            </div>
            <div className="text-sm text-gray-400">Выберите набор боевых механик</div>
          </div>

          {/* Preset Selection */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(Object.keys(presetInfo) as Array<keyof typeof presetInfo>).map((preset) => {
              const info = presetInfo[preset];
              const isSelected = mechanics.preset === preset;
              
              return (
                <button
                  key={preset}
                  onClick={() => setMechanicsPreset(preset)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${isSelected 
                      ? 'border-blue-400 bg-blue-900/30' 
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{info.emoji}</span>
                    <span className={`font-medium ${isSelected ? info.color : 'text-white'}`}>
                      {info.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{info.description}</div>
                </button>
              );
            })}
          </div>

          {/* Expand/Collapse Details */}
          <button
            onClick={() => setShowMechanicsDetails(!showMechanicsDetails)}
            className="w-full flex items-center justify-between p-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span>Детальные настройки</span>
            <span className={`transform transition-transform ${showMechanicsDetails ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Detailed Mechanics Toggles */}
          {showMechanicsDetails && (
            <div className="mt-3 space-y-4 border-t border-gray-600 pt-3">
              {mechanicsCategories.map((category) => (
                <div key={category.tier}>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    {category.tier}: {category.name}
                  </div>
                  <div className="space-y-2">
                    {category.mechanics.map((mechanic) => {
                      const isEnabled = currentToggles[mechanic.key];
                      
                      return (
                        <div 
                          key={mechanic.key}
                          className="flex items-center justify-between p-2 bg-gray-800 rounded"
                        >
                          <div>
                            <div className="text-sm text-white">{mechanic.name}</div>
                            <div className="text-xs text-gray-500">{mechanic.description}</div>
                          </div>
                          <button
                            onClick={() => toggleMechanic(mechanic.key)}
                            className={`
                              relative w-10 h-5 rounded-full transition-colors duration-200
                              ${isEnabled ? 'bg-green-600' : 'bg-gray-600'}
                            `}
                          >
                            <div
                              className={`
                                absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                                ${isEnabled ? 'transform translate-x-5' : ''}
                              `}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Player Profile page content component.
 * Displays comprehensive player information including stats, teams, and settings.
 * 
 * @returns Player profile page content
 * @example
 * <ProfilePageContent />
 */
export default function ProfilePageContent() {
  const router = useRouter();
  const { player, refreshPlayer, loading: playerLoading } = usePlayerStore();
  const { showSuccess, showError } = useToast();
  
  // State
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [battles, setBattles] = useState<RecentBattleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [avatarVariant, setAvatarVariant] = useState('beam');

  /**
   * Load player teams from API.
   */
  const loadTeams = useCallback(async () => {
    try {
      const response = await api.getTeams();
      setTeams(response.teams);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Не удалось загрузить команды';
      setError(errorMessage);
    }
  }, []);

  /**
   * Load recent battles for win rate chart.
   */
  const loadBattles = useCallback(async () => {
    try {
      const response = await api.getBattles();
      const playerId = player?.id || 'current-player';
      
      const recentBattles: RecentBattleResult[] = response.battles.map(battle => {
        const isPlayer1 = battle.player1Id === playerId;
        let result: 'win' | 'loss' | 'draw' = 'draw';
        
        if (battle.winner === 'draw') {
          result = 'draw';
        } else if (battle.winner === 'player1' && isPlayer1) {
          result = 'win';
        } else if (battle.winner === 'player2' && !isPlayer1) {
          result = 'win';
        } else {
          result = 'loss';
        }
        
        const opponentId = isPlayer1 ? battle.player2Id : battle.player1Id;
        const opponent = opponentId === 'bot' || opponentId.startsWith('bot-') 
          ? 'Бот' 
          : `Игрок ${opponentId.slice(-4)}`;
        
        return {
          id: battle.id,
          result,
          date: new Date(battle.createdAt),
          opponent,
        };
      });
      
      setBattles(recentBattles);
    } catch (err) {
      // Don't show error for battles - it's optional data
    }
  }, [player?.id]);

  /**
   * Handle player name update.
   */
  const handleNameUpdate = useCallback(async (newName: string) => {
    try {
      await api.updatePlayerName(newName);
      await refreshPlayer();
      showSuccess('Имя успешно обновлено!');
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Не удалось обновить имя';
      setError(errorMessage);
      showError(errorMessage);
      throw err; // Re-throw to handle in component
    }
  }, [refreshPlayer, showSuccess, showError]);

  /**
   * Handle team click - navigate to team builder.
   */
  const handleTeamClick = useCallback((teamId: string) => {
    router.push(`/?team=${teamId}`);
  }, [router]);

  /**
   * Handle copy profile link.
   */
  const handleCopyProfileLink = useCallback(async () => {
    if (!player) return;
    
    try {
      const profileUrl = generateProfileUrl(player.id);
      await copyToClipboard(profileUrl);
      setCopySuccess(true);
      showSuccess('Ссылка скопирована в буфер обмена!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const errorMessage = 'Не удалось скопировать ссылку';
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [player, showSuccess, showError]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadTeams(),
          loadBattles(),
        ]);
      } catch (err) {
        // Error handling is done in individual functions
      } finally {
        setLoading(false);
      }
    };

    if (player) {
      loadData();
    }
  }, [player, loadTeams, loadBattles]);

  // Redirect if not authenticated
  if (!playerLoading && !player) {
    router.push('/');
    return null;
  }

  // Loading state
  if (playerLoading || loading || !player) {
    return <FullPageLoader message="Загрузка профиля..." icon="👤" />;
  }

  // Calculate stats from player data (backend returns wins/losses/rating directly)
  const playerData = player as Player & { wins?: number; losses?: number; rating?: number };
  const playerWins = playerData.wins || 0;
  const playerLosses = playerData.losses || 0;
  const playerRating = playerData.rating || 1200;
  
  const stats: PlayerStats = {
    gamesPlayed: playerWins + playerLosses,
    wins: playerWins,
    losses: playerLosses,
    winRate: calculateWinRate(playerWins, playerLosses),
    rating: playerRating,
    rank: getRankFromRating(playerRating).name,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <div className="p-4 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <Navigation />
        </div>
      </div>
      
      <NavigationWrapper>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Player Avatar */}
            <PlayerAvatar 
              playerId={player.id}
              currentVariant={avatarVariant}
              onVariantChange={setAvatarVariant}
            />
            
            <div>
              <EditablePlayerName 
                name={player.name} 
                onSave={handleNameUpdate}
              />
              <p className="text-gray-400 mt-2">
                Игрок с {new Date(player.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopyProfileLink}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                ${copySuccess 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }
              `}
            >
              {copySuccess ? '✅ Скопировано!' : '🔗 Копировать ссылку'}
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ← Назад
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-400/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-400">❌</span>
              <span className="text-red-400">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <StatsCard stats={stats} />
            <AchievementsCard stats={stats} teamCount={teams.length} />
            <WinRateChart battles={battles} />
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            <TeamsCard 
              teams={teams} 
              onTeamClick={handleTeamClick}
              onCreateTeam={() => router.push('/')}
            />
            <SettingsCard />
          </div>
        </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}