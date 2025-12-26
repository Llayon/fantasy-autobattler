/**
 * Battle History page for Fantasy Autobattler.
 * Displays player's battle history with filtering and pagination.
 * 
 * @fileoverview Complete battle history page with filters, pagination, and navigation.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BattleLog } from '@/types/game';
import { api, ApiError } from '@/lib/api';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { ButtonLoader, ListSkeleton } from '@/components/LoadingStates';
import { ErrorPage, NetworkError } from '@/components/ErrorStates';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Battle filter options.
 */
type BattleFilter = 'all' | 'victories' | 'defeats' | 'draws';

/**
 * Sort options for battles.
 */
type SortOption = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';

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
  draws: 'Ничьи',
};

/** Filter emojis */
const FILTER_EMOJIS: Record<BattleFilter, string> = {
  all: '⚔️',
  victories: '🏆',
  defeats: '💀',
  draws: '🤝',
};

/** Sort display names */
const SORT_NAMES: Record<SortOption, string> = {
  date_desc: 'Новые первые',
  date_asc: 'Старые первые',
  rating_desc: 'Больше рейтинга',
  rating_asc: 'Меньше рейтинга',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
 * Generate team preview string from team setup.
 * 
 * @param teamSetup - Team setup data
 * @returns Team preview string with role icons
 * @example
 * const preview = generateTeamPreview(teamSetup); // "🛡️🛡️⚔️💚"
 */
function generateTeamPreview(teamSetup: { units?: Array<{ role: string }> }): string {
  if (!teamSetup?.units || !Array.isArray(teamSetup.units)) {
    return '❓❓❓';
  }
  
  return teamSetup.units
    .slice(0, 4) // Show max 4 units
    .map((unit) => getRoleIcon(unit.role))
    .join('');
}

/**
 * Get opponent display name from battle log.
 * Uses player names if available, otherwise falls back to generic names.
 * 
 * @param battle - Battle log data
 * @param playerId - Current player ID
 * @returns Opponent display name
 */
function getOpponentName(battle: BattleLog & { player1Name?: string; player2Name?: string }, playerId: string): string {
  const isPlayer1 = battle.player1Id === playerId;
  const opponentId = isPlayer1 ? battle.player2Id : battle.player1Id;
  
  // Check if opponent is a bot
  if (opponentId === 'bot' || opponentId.startsWith('bot-')) {
    return 'Бот';
  }
  
  // Use player names if available
  if (isPlayer1 && battle.player2Name) {
    return battle.player2Name;
  } else if (!isPlayer1 && battle.player1Name) {
    return battle.player1Name;
  }
  
  // Fallback to generic name
  return `Игрок ${opponentId.slice(-4)}`;
}

/**
 * Get battle type icon (PvP or Bot).
 * 
 * @param battle - Battle log data
 * @param playerId - Current player ID
 * @returns Battle type icon
 */
function getBattleTypeIcon(battle: BattleLog, playerId: string): string {
  const isPlayer1 = battle.player1Id === playerId;
  const opponentId = isPlayer1 ? battle.player2Id : battle.player1Id;
  
  return opponentId === 'bot' || opponentId.startsWith('bot-') ? '🤖' : '👥';
}

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
  
  // Determine opponent with enhanced name resolution
  const opponent = getOpponentName(battle, playerId);
  
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
    case 'draws':
      return battles.filter(item => item.outcome === 'draw');
    case 'all':
    default:
      return battles;
  }
}

/**
 * Sort battles based on sort option.
 * 
 * @param battles - Array of battle history items
 * @param sortOption - Sort option to apply
 * @returns Sorted battles
 * @example
 * const sorted = sortBattles(battles, 'date_desc');
 */
function sortBattles(battles: BattleHistoryItem[], sortOption: SortOption): BattleHistoryItem[] {
  const sorted = [...battles];
  
  switch (sortOption) {
    case 'date_desc':
      return sorted.sort((a, b) => new Date(b.battle.createdAt).getTime() - new Date(a.battle.createdAt).getTime());
    case 'date_asc':
      return sorted.sort((a, b) => new Date(a.battle.createdAt).getTime() - new Date(b.battle.createdAt).getTime());
    case 'rating_desc':
      return sorted.sort((a, b) => b.ratingChange - a.ratingChange);
    case 'rating_asc':
      return sorted.sort((a, b) => a.ratingChange - b.ratingChange);
    default:
      return sorted;
  }
}



// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Enhanced battle history item component with team previews.
 */
function BattleHistoryItemComponent({ 
  item, 
  onClick,
  playerId
}: { 
  item: BattleHistoryItem; 
  onClick: () => void;
  playerId: string;
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
  const isPlayer1 = item.battle.player1Id === playerId;
  const battleTypeIcon = getBattleTypeIcon(item.battle, playerId);
  
  // Generate team previews
  const playerTeam = isPlayer1 ? item.battle.player1TeamSnapshot : item.battle.player2TeamSnapshot;
  const opponentTeam = isPlayer1 ? item.battle.player2TeamSnapshot : item.battle.player1TeamSnapshot;
  
  const playerPreview = generateTeamPreview(playerTeam);
  const opponentPreview = generateTeamPreview(opponentTeam);
  
  return (
    <div
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
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-bold ${config.color}`}>
                {config.text}
              </span>
              <span className="text-gray-400">против</span>
              <span className="text-white font-medium flex items-center gap-1">
                {battleTypeIcon} {item.opponent}
              </span>
              {item.outcome === 'draw' && (
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
              <span className="text-lg">{playerPreview}</span>
              <span className="text-gray-400">vs</span>
              <span className="text-lg">{opponentPreview}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>📅 {item.date}</span>
              <span>⏱️ {item.duration}</span>
              <span>🔄 {item.battle.rounds || 1} раундов</span>
            </div>
          </div>
        </div>
        
        {/* Actions and rating */}
        <div className="text-right flex flex-col items-end gap-2">
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
          <div className="text-xs text-gray-500 mb-2">Рейтинг</div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors flex items-center gap-1"
          >
            ▶️ Смотреть повтор
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter buttons component with draws support.
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
    <div className="flex flex-wrap gap-2 mb-6">
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
            ${filter === 'draws' ? 'relative' : ''}
          `}
          title={filter === 'draws' ? '100 раундов = ничья' : undefined}
        >
          <span>{FILTER_EMOJIS[filter]}</span>
          <span>{FILTER_NAMES[filter]}</span>
          <span className="bg-black/20 px-2 py-1 rounded text-sm">
            {battleCounts[filter]}
          </span>
          {filter === 'draws' && battleCounts[filter] > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Sort controls component.
 */
function SortControls({ 
  currentSort, 
  onSortChange 
}: { 
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm text-gray-400">Сортировка:</span>
      <select
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
      >
        {(Object.keys(SORT_NAMES) as SortOption[]).map(sort => (
          <option key={sort} value={sort}>
            {SORT_NAMES[sort]}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Load more button component for infinite scroll.
 */
function LoadMoreButton({ 
  hasMore,
  loading,
  onLoadMore 
}: { 
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  if (!hasMore) return null;
  
  return (
    <div className="flex justify-center mt-8">
      <ButtonLoader
        loading={loading}
        onClick={onLoadMore}
        variant="secondary"
        size="lg"
        loadingText="Загрузка..."
      >
        Загрузить ещё
      </ButtonLoader>
    </div>
  );
}



/**
 * Enhanced empty state component with matchmaking integration.
 */
function EmptyState({ filter }: { filter: BattleFilter }) {
  const messages = {
    all: 'Нет боёв',
    victories: 'У вас пока нет побед',
    defeats: 'У вас пока нет поражений',
    draws: 'У вас пока нет ничьих',
  };
  
  const emojis = {
    all: '⚔️',
    victories: '🏆',
    defeats: '💀',
    draws: '🤝',
  };
  
  const descriptions = {
    all: 'Начните свой первый бой!',
    victories: 'Продолжайте сражаться, чтобы одержать первую победу!',
    defeats: 'Пока что вы не проиграли ни одного боя. Отлично!',
    draws: 'Ничьи случаются редко - когда бой длится 100 раундов.',
  };
  
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-4">{emojis[filter]}</div>
      <h3 className="text-2xl font-bold text-gray-400 mb-2">
        {messages[filter]}
      </h3>
      <p className="text-gray-500 mb-8">
        {descriptions[filter]}
      </p>
      
      {filter === 'all' && (
        <div className="space-y-4">
          <ButtonLoader
            loading={false}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            variant="primary"
            size="lg"
          >
            🎯 Найти бой
          </ButtonLoader>
          <div className="text-sm text-gray-400">
            Создайте команду и начните сражаться с другими игроками!
          </div>
        </div>
      )}
      
      {filter !== 'all' && (
        <ButtonLoader
          loading={false}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          variant="secondary"
          size="lg"
        >
          Новый бой
        </ButtonLoader>
      )}
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
  const [displayedBattles, setDisplayedBattles] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BattleFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
  });
  
  // Computed values - memoized to prevent infinite loops in useEffect
  const filteredBattles = useMemo(
    () => filterBattles(battles, filter),
    [battles, filter]
  );
  const sortedBattles = useMemo(
    () => sortBattles(filteredBattles, sortOption),
    [filteredBattles, sortOption]
  );
  const hasMoreBattles = displayedBattles.length < sortedBattles.length;
  
  const battleCounts: Record<BattleFilter, number> = {
    all: battles.length,
    victories: battles.filter(b => b.outcome === 'victory').length,
    defeats: battles.filter(b => b.outcome === 'defeat').length,
    draws: battles.filter(b => b.outcome === 'draw').length,
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
   * Handle sort change.
   */
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortOption(newSort);
  }, []);
  
  /**
   * Handle load more battles.
   */
  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const currentCount = displayedBattles.length;
      const nextBatch = sortedBattles.slice(currentCount, currentCount + ITEMS_PER_PAGE);
      setDisplayedBattles(prev => [...prev, ...nextBatch]);
      setLoadingMore(false);
    }, 500);
  }, [displayedBattles.length, sortedBattles]);
  

  
  /**
   * Handle battle click - navigate to replay.
   */
  const handleBattleClick = useCallback((battleId: string) => {
    router.push(`/battle/${battleId}`);
  }, [router]);
  
  // Update displayed battles when filter or sort changes
  useEffect(() => {
    const initialBattles = sortedBattles.slice(0, ITEMS_PER_PAGE);
    setDisplayedBattles(initialBattles);
  }, [sortedBattles]); // sortedBattles is now memoized, safe to use as dependency
  
  // Update pagination when filtered battles change
  const filteredBattlesLength = filteredBattles.length;
  useEffect(() => {
    const totalPages = Math.ceil(filteredBattlesLength / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalItems: filteredBattlesLength,
      totalPages,
      currentPage: Math.min(prev.currentPage, Math.max(0, totalPages - 1)),
    }));
  }, [filteredBattlesLength, pagination.itemsPerPage]);
  
  // Load battles on mount
  useEffect(() => {
    loadBattles();
  }, [loadBattles]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation />
      
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
          <ListSkeleton items={5} />
        )}
        
        {/* Error state */}
        {error && (
          <div className="py-8">
            {error.includes('fetch') || error.includes('network') ? (
              <NetworkError
                message={error}
                showRetry
                onRetry={loadBattles}
              />
            ) : (
              <ErrorPage
                title="Ошибка загрузки истории"
                message={error}
                showRetry
                onRetry={loadBattles}
                showHome={false}
                icon="📚"
              />
            )}
          </div>
        )}
        
        {/* Content */}
        {!loading && !error && (
          <>
            {battles.length === 0 ? (
              <EmptyState filter="all" />
            ) : (
              <>
                {/* Filters and Sort */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <FilterButtons
                    currentFilter={filter}
                    onFilterChange={handleFilterChange}
                    battleCounts={battleCounts}
                  />
                  <SortControls
                    currentSort={sortOption}
                    onSortChange={handleSortChange}
                  />
                </div>
                
                {/* Battle list */}
                {displayedBattles.length === 0 ? (
                  <EmptyState filter={filter} />
                ) : (
                  <>
                    <div className="space-y-4">
                      {displayedBattles.map(item => (
                        <BattleHistoryItemComponent
                          key={item.battle.id}
                          item={item}
                          onClick={() => handleBattleClick(item.battle.id)}
                          playerId="current-player" // TODO: Get from auth context
                        />
                      ))}
                    </div>
                    
                    {/* Load More Button */}
                    <LoadMoreButton
                      hasMore={hasMoreBattles}
                      loading={loadingMore}
                      onLoadMore={handleLoadMore}
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