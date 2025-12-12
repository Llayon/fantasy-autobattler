/**
 * Matchmaking Panel component for Fantasy Autobattler.
 * Provides interface for finding matches and managing queue status.
 * 
 * @fileoverview Complete matchmaking interface with queue management and status updates.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useMatchmakingStore, 
  selectMatchmakingStatus,
  selectQueueEntry,
  selectMatch,
  selectMatchmakingLoading,
  selectMatchmakingError,
  selectIsInQueue,
  selectHasMatch
} from '@/store/matchmakingStore';
import { 
  useTeamStore, 
  selectActiveTeam 
} from '@/store/teamStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * MatchmakingPanel component props.
 */
interface MatchmakingPanelProps {
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Search animation component with pulsing effect.
 */
function SearchAnimation() {
  return (
    <div className="flex items-center justify-center space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

/**
 * Match found celebration animation.
 */
function MatchFoundAnimation() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
      <span className="text-green-400 font-bold animate-pulse">🎉</span>
      <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
    </div>
  );
}

/**
 * Wait time formatter.
 * 
 * @param seconds - Wait time in seconds
 * @returns Formatted time string
 */
function formatWaitTime(seconds: number): string {
  // Handle NaN or invalid values
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0s';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${remainingSeconds}s`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * MatchmakingPanel component for finding matches and managing queue status.
 * Provides interface to join/leave queue, shows status updates, and handles match found scenarios.
 * 
 * Features:
 * - Queue joining with active team validation
 * - Real-time status updates with 2-second polling
 * - Wait time display and search animation
 * - Cancel functionality to leave queue
 * - Automatic redirect on match found
 * - Error handling and user feedback
 * 
 * @param props - Component props
 * @returns Matchmaking panel component
 * @example
 * <MatchmakingPanel className="mt-4" />
 */
export function MatchmakingPanel({ className = '' }: MatchmakingPanelProps) {
  const router = useRouter();
  const [waitTime, setWaitTime] = useState(0);
  
  // Store state
  const status = useMatchmakingStore(selectMatchmakingStatus);
  const queueEntry = useMatchmakingStore(selectQueueEntry);
  const match = useMatchmakingStore(selectMatch);
  const loading = useMatchmakingStore(selectMatchmakingLoading);
  const error = useMatchmakingStore(selectMatchmakingError);
  const isInQueue = useMatchmakingStore(selectIsInQueue);
  const hasMatch = useMatchmakingStore(selectHasMatch);
  
  const activeTeam = useTeamStore(selectActiveTeam);
  
  // Store actions
  const { joinQueue, leaveQueue, startBotBattle, clearError, clearMatch } = useMatchmakingStore();
  
  // Update wait time every second when in queue
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isInQueue && queueEntry?.joinedAt) {
      interval = setInterval(() => {
        const now = new Date();
        const joinedAt = new Date(queueEntry.joinedAt);
        
        // Validate dates to prevent NaN
        if (isNaN(now.getTime()) || isNaN(joinedAt.getTime())) {
          setWaitTime(0);
          return;
        }
        
        const elapsed = Math.floor((now.getTime() - joinedAt.getTime()) / 1000);
        setWaitTime(Math.max(0, elapsed)); // Ensure non-negative
      }, 1000);
    } else {
      setWaitTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isInQueue, queueEntry]);
  
  // Handle match found - redirect to battle
  useEffect(() => {
    if (hasMatch && match) {
      // Small delay to show "Match Found!" message before redirect
      const timer = setTimeout(() => {
        clearMatch();
        router.push(`/battle/${match.battleId}`);
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    }
    
    // Return empty cleanup function for other code paths
    return () => {};
  }, [hasMatch, match, status, clearMatch, router]);
  
  /**
   * Handle joining matchmaking queue.
   */
  const handleJoinQueue = useCallback(async () => {
    if (!activeTeam) {
      return; // Should not happen due to button disabled state
    }
    
    try {
      await joinQueue(activeTeam.id);
    } catch (error) {
      // Error is handled by the store
    }
  }, [activeTeam, joinQueue]);

  /**
   * Handle starting bot battle.
   */
  const handleBotBattle = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!activeTeam) {
      return; // Should not happen due to button disabled state
    }
    
    try {
      await startBotBattle(activeTeam.id, difficulty);
    } catch (error) {
      // Error is handled by the store
    }
  }, [activeTeam, startBotBattle]);
  
  /**
   * Handle leaving matchmaking queue.
   */
  const handleLeaveQueue = useCallback(async () => {
    try {
      await leaveQueue();
      setWaitTime(0);
    } catch (error) {
      // Error is handled by the store
    }
  }, [leaveQueue]);
  
  /**
   * Handle clearing error state.
   */
  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);
  
  // Determine if find match button should be enabled
  const canFindMatch = !loading && !isInQueue && !!activeTeam;
  
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">🎯 Поиск матча</h3>
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          {isInQueue && (
            <>
              <SearchAnimation />
              <span className="text-blue-400 text-sm font-medium">Поиск...</span>
            </>
          )}
          
          {status === 'matched' && (
            <div className="flex items-center space-x-2">
              <MatchFoundAnimation />
              <span className="text-green-400 text-sm font-medium">Матч найден!</span>
            </div>
          )}
          
          {status === 'not_in_queue' && !loading && (
            <span className="text-gray-400 text-sm">Готов к поиску</span>
          )}
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="text-red-300 text-sm">
              <div className="font-medium mb-1">Ошибка:</div>
              <p>{error}</p>
            </div>
            <button
              onClick={handleClearError}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Active team requirement */}
      {!activeTeam && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg">
          <div className="text-yellow-300 text-sm">
            <div className="font-medium mb-1">⚠️ Требуется активная команда</div>
            <p>Сохраните команду и активируйте её в разделе "Мои команды" для поиска матчей.</p>
          </div>
        </div>
      )}
      
      {/* Queue status */}
      {isInQueue && queueEntry && (
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <SearchAnimation />
              <div className="text-blue-300 font-medium">Поиск противника...</div>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {formatWaitTime(waitTime)}
            </div>
            <div className="space-y-1">
              <div className="text-blue-300 text-sm">
                Команда: <span className="font-medium">{activeTeam?.name}</span>
              </div>
              {queueEntry.rating && (
                <div className="text-blue-300 text-sm">
                  Рейтинг: <span className="font-medium">{queueEntry.rating}</span>
                </div>
              )}
              <div className="text-blue-400 text-xs mt-2">
                {waitTime < 30 ? '🔍 Поиск подходящего противника...' :
                 waitTime < 60 ? '⏳ Расширяем диапазон поиска...' :
                 '🌐 Поиск по всем рейтингам...'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Match found status */}
      {hasMatch && match && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <div className="text-center">
            <div className="text-green-300 font-medium mb-2">🎉 Матч найден!</div>
            <div className="text-green-300 text-sm">
              Переход к бою...
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="space-y-3">
        {!isInQueue ? (
          <>
            {/* PvP Matchmaking */}
            <button
              onClick={handleJoinQueue}
              disabled={!canFindMatch}
              className={`
                w-full px-4 py-3 font-medium rounded-lg transition-all transform
                ${canFindMatch
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Подключение...</span>
                </div>
              ) : (
                '🎯 Найти игрока (PvP)'
              )}
            </button>

            {/* Bot Battle Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleBotBattle('easy')}
                disabled={!canFindMatch}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${canFindMatch
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                🤖 Легкий бот
              </button>
              <button
                onClick={() => handleBotBattle('medium')}
                disabled={!canFindMatch}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${canFindMatch
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                🤖 Средний бот
              </button>
              <button
                onClick={() => handleBotBattle('hard')}
                disabled={!canFindMatch}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${canFindMatch
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                🤖 Сложный бот
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={handleLeaveQueue}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Отмена...</span>
              </div>
            ) : (
              '❌ Отменить поиск'
            )}
          </button>
        )}
      </div>
      
      {/* Help text */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {!activeTeam ? (
          <p>💡 Создайте и активируйте команду для начала боёв</p>
        ) : isInQueue ? (
          <p>⏱️ Поиск игрока... Среднее время: 30-60 секунд</p>
        ) : (
          <div className="space-y-1">
            <p>🎯 <strong>PvP</strong> - бой с живым игроком (рейтинговый)</p>
            <p>🤖 <strong>Боты</strong> - тренировка против ИИ</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { MatchmakingPanelProps };