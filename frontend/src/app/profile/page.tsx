/**
 * Player Profile page for Fantasy Autobattler.
 * Displays player information, statistics, teams, and settings.
 * 
 * @fileoverview Complete player profile page with editable name, stats, and team management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';
import { TeamResponse, Player } from '@/types/game';
import { api, ApiError } from '@/lib/api';
import { Navigation, NavigationWrapper } from '@/components/Navigation';

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
  BRONZE: 800,
  SILVER: 1000,
  GOLD: 1200,
  PLATINUM: 1400,
  DIAMOND: 1600,
  MASTER: 1800,
  GRANDMASTER: 2000,
} as const;

/** Rank display information */
const RANK_INFO = {
  BRONZE: { name: 'Бронза', emoji: '🥉', color: 'text-amber-600' },
  SILVER: { name: 'Серебро', emoji: '🥈', color: 'text-gray-400' },
  GOLD: { name: 'Золото', emoji: '🥇', color: 'text-yellow-500' },
  PLATINUM: { name: 'Платина', emoji: '💎', color: 'text-cyan-400' },
  DIAMOND: { name: 'Алмаз', emoji: '💠', color: 'text-blue-400' },
  MASTER: { name: 'Мастер', emoji: '👑', color: 'text-purple-400' },
  GRANDMASTER: { name: 'Гроссмейстер', emoji: '🏆', color: 'text-red-400' },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get player rank based on rating.
 * 
 * @param rating - Player rating
 * @returns Rank information
 * @example
 * const rank = getRankFromRating(1250);
 * console.log(rank.name); // 'Золото'
 */
function getRankFromRating(rating: number): { name: string; emoji: string; color: string } {
  if (rating >= RANK_THRESHOLDS.GRANDMASTER) return RANK_INFO.GRANDMASTER;
  if (rating >= RANK_THRESHOLDS.MASTER) return RANK_INFO.MASTER;
  if (rating >= RANK_THRESHOLDS.DIAMOND) return RANK_INFO.DIAMOND;
  if (rating >= RANK_THRESHOLDS.PLATINUM) return RANK_INFO.PLATINUM;
  if (rating >= RANK_THRESHOLDS.GOLD) return RANK_INFO.GOLD;
  if (rating >= RANK_THRESHOLDS.SILVER) return RANK_INFO.SILVER;
  return RANK_INFO.BRONZE;
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
  return `${window.location.origin}/profile/${playerId}`;
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
        <button
          onClick={handleSave}
          disabled={saving || !editName.trim()}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded transition-colors"
        >
          {saving ? '💾' : '✅'}
        </button>
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
  const rank = getRankFromRating(stats.rating);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📊 Статистика
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rating & Rank */}
        <div className="text-center">
          <div className="text-2xl mb-1">{rank.emoji}</div>
          <div className={`font-bold ${rank.color}`}>{rank.name}</div>
          <div className="text-2xl font-bold text-white">{stats.rating}</div>
          <div className="text-sm text-gray-400">Рейтинг</div>
        </div>

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
 * Player teams list component.
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
  if (teams.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          ⚔️ Команды
        </h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏗️</div>
          <p className="text-gray-400 mb-4">У вас пока нет команд</p>
          <button
            onClick={onCreateTeam}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            Создать команду
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        ⚔️ Команды ({teams.length})
      </h2>
      
      <div className="space-y-3">
        {teams.map(team => (
          <div
            key={team.id}
            onClick={() => onTeamClick(team.id)}
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
                <div className="text-sm text-gray-400">
                  {team.units.length} юнитов • {team.totalCost}/30 очков
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Player Profile page component.
 * Displays comprehensive player information including stats, teams, and settings.
 * 
 * @returns Player profile page
 * @example
 * <ProfilePage />
 */
export default function ProfilePage() {
  const router = useRouter();
  const { player, refreshPlayer, loading: playerLoading } = usePlayerStore();
  
  // State
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [battles, setBattles] = useState<RecentBattleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Не удалось обновить имя';
      setError(errorMessage);
      throw err; // Re-throw to handle in component
    }
  }, [refreshPlayer]);

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
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Не удалось скопировать ссылку');
    }
  }, [player]);

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
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl text-gray-400">Загрузка профиля...</div>
        </div>
      </div>
    );
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
          <div>
            <EditablePlayerName 
              name={player.name} 
              onSave={handleNameUpdate}
            />
            <p className="text-gray-400 mt-2">
              Игрок с {new Date(player.createdAt).toLocaleDateString('ru-RU')}
            </p>
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
            <WinRateChart battles={battles} />
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            <TeamsCard 
              teams={teams} 
              onTeamClick={handleTeamClick}
              onCreateTeam={() => router.push('/')}
            />
          </div>
        </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}