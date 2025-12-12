/**
 * Battle History page for Fantasy Autobattler.
 * Displays player's battle history with filtering and pagination.
 * 
 * @fileoverview Complete battle history page with filters, pagination, and navigation.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BattleLog } from '@/types/game';
import { api, ApiError } from '@/lib/api';
import { Navigation, NavigationWrapper } from '@/components/Navigation';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Battle filter options.
 */
type BattleFilter = 'all' | 'victories' | 'defeats';

/**
 * Battle history item with computed properties.
 */
interface BattleHistoryItem {
  /** Battle log data */
  battle: BattleLog;
  /** Opponent name or ID */
  opponent: string;
  /** Battle outcome from player perspective */
  outcome: 'victory' | 'defeat' | 'draw';
  /** Formatted battle date */
  date: string;
  /** Estimated rating change */
  ratingChange: number;
  /** Battle duration estimate */
  duration: string;
}

/**
 * Pagination state.
 */
interface PaginationState {
  /** Current page (0-based) */
  currentPage: number;
  /** Items per page */
  itemsPerPage: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Items per page for pagination */
const ITEMS_PER_PAGE = 10;

/** Filter display names */
const FILTER_NAMES: Record<BattleFilter, string> = {
  all: 'Все бои',
  victories: 'Победы',
  defeats: 'Поражения',
};

/** Filter emojis */
const FILTER_EMOJIS: Record<BattleFilter, string> = {
  all: '⚔️',
  victories: '🏆',
  defeats: '💀',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert battle log to history item with computed properties.
 * 
 * @param battle - Battle log data
 * @param playerId - Current player ID
 * @returns Battle history item
 * @example
 * const item = toBattleHistoryItem(battleLog, 'player-123');
 */
function toBattleHistoryItem(battle: BattleLog, playerId: string): BattleHistoryItem {
  const isPlayer1 = battle.player1Id === playerId;
  
  // Determine opponent
  const opponentId = isPlayer1 ? battle.player2Id : battle.player1Id;
  const opponent = opponentId === 'bot' || opponentId.startsWith('bot-') 
    ? 'Бот' 
    : `Игрок ${opponentId.slice(-4)}`;
  
  // Determine outcome
  let outcome: 'victory' | 'defeat' | 'draw' = 'draw';
  if (battle.winner === 'draw') {
    outcome = 'draw';
  } else if (battle.winner === 'player1' && isPlayer1) {
    outcome = 'victory';
  } else if (battle.winner === 'player2' && !isPlayer1) {
    outcome = 'victory';
  } else {
    outcome = 'defeat';
  }
  
  // Format date
  const battleDate = new Date(battle.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - battleDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let date: string;
  if (diffDays === 0) {
    date = 'Сегодня';
  } else if (diffDays === 1) {
    date = 'Вчера';
  } else if (diffDays < 7) {
    date = `${diffDays} дн. назад`;
  } else {
    date = battleDate.toLocaleDateString('ru-RU');
  }
  
  // Estimate rating change
  const ratingChange = outcome === 'victory' ? 15 : outcome === 'defeat' ? -12 : 0;
  
  // Estimate duration
  const rounds = battle.rounds || 1;
  const estimatedSeconds = rounds * 3;
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;
  const duration = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
  
  return {
    battle,
    opponent,
    outcome,
    date,
    ratingChange,
    duration,
  };
}

/**
 * Filter battles based on outcome.
 * 
 * @param battles - Array of battle history items
 * @param filter - Filter to apply
 * @returns Filtered battles
 * @example
 * const victories = filterBattles(battles, 'victories');
 */
function filterBattles(battles: BattleHistoryItem[], filter: BattleFilter): BattleHistoryItem[] {
  switch (filter) {
    case 'victories':
      return battles.filter(item => item.outcome === 'victory');
    case 'defeats':
      return battles.filter(item => item.outcome === 'defeat');
    case 'all':
    default:
      return battles;
  }
}

/**
 * Paginate battles array.
 * 
 * @param battles - Array of battle history items
 * @param page - Current page (0-based)
 * @param itemsPerPage - Items per page
 * @returns Paginated battles
 * @example
 * const page1 = paginateBattles(battles, 0, 10);
 */
function paginateBattles(
  battles: BattleHistoryItem[], 
  page: number, 
  itemsPerPage: number
): BattleHistoryItem[] {
  const startIndex = page * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return battles.slice(startIndex, endIndex);
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Battle history item component.
 */
function BattleHistoryItemComponent({ 
  item, 
  onClick 
}: { 
  item: BattleHistoryItem; 
  onClick: () => void;
}) {
  const outcomeConfig = {
    victory: {
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-400/30',
      emoji: '🏆',
      text: 'Победа',
    },
    defeat: {
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-400/30',
      emoji: '💀',
      text: 'Поражение',
    },
    draw: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-400/30',
      emoji: '🤝',
      text: 'Ничья',
    },
  };
  
  const config = outcomeConfig[item.outcome];
  
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        hover:scale-[1.02] hover:shadow-lg
        ${config.bgColor} ${config.borderColor}
        bg-gray-800 border-gray-600 hover:border-gray-500
      `}
    >
      <div className="flex items-center justify-between">
        {/* Battle info */}
        <div className="flex items-center gap-4">
          <div className="text-3xl">{config.emoji}</div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold ${config.color}`}>
                {config.text}
              </span>
              <span className="text-gray-400">против</span>
              <span className="text-white font-medium">{item.opponent}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>📅 {item.date}</span>
              <span>⏱️ {item.duration}</span>
              <span>🔄 {item.battle.rounds || 1} раундов</span>
            </div>
          </div>
        </div>
        
        {/* Rating change */}
        <div className="text-right">
          <div className={`
            text-lg font-bold px-3 py-1 rounded
            ${item.ratingChange > 0 
              ? 'text-green-400 bg-green-900/30' 
              : item.ratingChange < 0 
              ? 'text-red-400 bg-red-900/30'
              : 'text-gray-400 bg-gray-900/30'
            }
          `}>
            {item.ratingChange > 0 ? '+' : ''}{item.ratingChange}
          </div>
          <div className="text-xs text-gray-500 mt-1">Рейтинг</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter buttons component.
 */
function FilterButtons({ 
  currentFilter, 
  onFilterChange,
  battleCounts
}: { 
  currentFilter: BattleFilter;
  onFilterChange: (filter: BattleFilter) => void;
  battleCounts: Record<BattleFilter, number>;
}) {
  return (
    <div className="flex gap-2 mb-6">
      {(Object.keys(FILTER_NAMES) as BattleFilter[]).map(filter => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
            ${currentFilter === filter
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          <span>{FILTER_EMOJIS[filter]}</span>
          <span>{FILTER_NAMES[filter]}</span>
          <span className="bg-black/20 px-2 py-1 rounded text-sm">
            {battleCounts[filter]}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Pagination component.
 */
function Pagination({ 
  pagination, 
  onPageChange 
}: { 
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i);
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 0}
        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        ← Назад
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            px-3 py-2 rounded-lg transition-colors
            ${page === pagination.currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }
          `}
        >
          {page + 1}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage >= pagination.totalPages - 1}
        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        Вперёд →
      </button>
    </div>
  );
}

/**
 * Empty state component.
 */
function EmptyState({ filter }: { filter: BattleFilter }) {
  const messages = {
    all: 'У вас пока нет боёв',
    victories: 'У вас пока нет побед',
    defeats: 'У вас пока нет поражений',
  };
  
  const emojis = {
    all: '⚔️',
    victories: '🏆',
    defeats: '💀',
  };
  
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-4">{emojis[filter]}</div>
      <h3 className="text-2xl font-bold text-gray-400 mb-2">
        {messages[filter]}
      </h3>
      <p className="text-gray-500 mb-8">
        {filter === 'all' 
          ? 'Создайте команду и начните сражаться!'
          : 'Продолжайте сражаться, чтобы увидеть результаты здесь.'
        }
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
      >
        {filter === 'all' ? 'Создать команду' : 'Новый бой'}
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Battle History page component.
 * Displays player's battle history with filtering, pagination, and navigation.
 * 
 * @returns Battle history page
 * @example
 * <BattleHistoryPage />
 */
export default function BattleHistoryPage() {
  const router = useRouter();
  
  // State
  const [battles, setBattles] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BattleFilter>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
  });
  
  // Computed values
  const filteredBattles = filterBattles(battles, filter);
  const paginatedBattles = paginateBattles(filteredBattles, pagination.currentPage, pagination.itemsPerPage);
  
  const battleCounts: Record<BattleFilter, number> = {
    all: battles.length,
    victories: battles.filter(b => b.outcome === 'victory').length,
    defeats: battles.filter(b => b.outcome === 'defeat').length,
  };
  
  /**
   * Load battle history from API.
   */
  const loadBattles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getBattles();
      const playerId = 'current-player'; // TODO: Get from auth context
      
      const historyItems = response.battles.map(battle => 
        toBattleHistoryItem(battle, playerId)
      );
      
      setBattles(historyItems);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Не удалось загрузить историю боёв';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Handle filter change.
   */
  const handleFilterChange = useCallback((newFilter: BattleFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  }, []);
  
  /**
   * Handle page change.
   */
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);
  
  /**
   * Handle battle click - navigate to replay.
   */
  const handleBattleClick = useCallback((battleId: string) => {
    router.push(`/battle/${battleId}`);
  }, [router]);
  
  // Update pagination when filtered battles change
  useEffect(() => {
    const totalPages = Math.ceil(filteredBattles.length / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalItems: filteredBattles.length,
      totalPages,
      currentPage: Math.min(prev.currentPage, Math.max(0, totalPages - 1)),
    }));
  }, [filteredBattles.length, pagination.itemsPerPage]);
  
  // Load battles on mount
  useEffect(() => {
    loadBattles();
  }, [loadBattles]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <div className="p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Navigation />
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
      
      <NavigationWrapper>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">📚 История боёв</h1>
            <p className="text-gray-400">
              Просмотрите свои прошлые сражения и анализируйте результаты
            </p>
          </div>
        
        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-xl text-gray-400">Загрузка истории боёв...</div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <div className="text-xl text-red-400 mb-4">{error}</div>
            <button
              onClick={loadBattles}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
        
        {/* Content */}
        {!loading && !error && (
          <>
            {battles.length === 0 ? (
              <EmptyState filter="all" />
            ) : (
              <>
                {/* Filters */}
                <FilterButtons
                  currentFilter={filter}
                  onFilterChange={handleFilterChange}
                  battleCounts={battleCounts}
                />
                
                {/* Battle list */}
                {filteredBattles.length === 0 ? (
                  <EmptyState filter={filter} />
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedBattles.map(item => (
                        <BattleHistoryItemComponent
                          key={item.battle.id}
                          item={item}
                          onClick={() => handleBattleClick(item.battle.id)}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    <Pagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
        </div>
      </NavigationWrapper>
    </div>
  );
}