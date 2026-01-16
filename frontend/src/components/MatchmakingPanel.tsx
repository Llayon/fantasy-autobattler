/**
 * Matchmaking Panel component for Fantasy Autobattler.
 * Provides interface for finding matches and managing queue status.
 * 
 * @fileoverview Complete matchmaking interface with queue management and status updates.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonLoader, Spinner } from '@/components/LoadingStates';
import { ErrorMessage, NetworkError, useToast } from '@/components/ErrorStates';
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
import { useUIStore } from '@/store/uiStore';

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
  return <Spinner size="sm" color="primary" />;
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
  const { showSuccess, showError } = useToast();
  
  // Store state
  const status = useMatchmakingStore(selectMatchmakingStatus);
  const queueEntry = useMatchmakingStore(selectQueueEntry);
  const match = useMatchmakingStore(selectMatch);
  const loading = useMatchmakingStore(selectMatchmakingLoading);
  const error = useMatchmakingStore(selectMatchmakingError);
  const isInQueue = useMatchmakingStore(selectIsInQueue);
  const hasMatch = useMatchmakingStore(selectHasMatch);
  
  const activeTeam = useTeamStore(selectActiveTeam);
  
  // UI Store for mechanics settings
  const { mechanics, getMechanicsToggles } = useUIStore();
  
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
      showSuccess('Поиск противника начат!');
    } catch (error) {
      // Error is handled by the store
      showError('Не удалось присоединиться к очереди');
    }
  }, [activeTeam, joinQueue, showSuccess, showError]);

  /**
   * Handle starting bot battle.
   */
  const handleBotBattle = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!activeTeam) {
      return; // Should not happen due to button disabled state
    }
    
    try {
      // Get mechanics settings from UI store
      const mechanicsToggles = mechanics.preset === 'custom' ? getMechanicsToggles() : undefined;
      
      await startBotBattle(activeTeam.id, difficulty, mechanics.preset, mechanicsToggles);
      showSuccess(`Бой с ${difficulty === 'easy' ? 'легким' : difficulty === 'medium' ? 'средним' : 'сложным'} ботом начат!`);
    } catch (error) {
      // Error is handled by the store
      showError('Не удалось начать бой с ботом');
    }
  }, [activeTeam, startBotBattle, showSuccess, showError, mechanics.preset, getMechanicsToggles]);
  
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
        <div className="mb-4">
          {error.includes('fetch') || error.includes('network') ? (
            <NetworkError
              message={error}
              showRetry
              onRetry={() => {
                handleClearError();
                // Retry last action based on current state
                if (isInQueue) {
                  handleLeaveQueue();
                } else {
                  handleJoinQueue();
                }
              }}
            />
          ) : (
            <ErrorMessage
              message={error}
              severity="error"
              showRetry
              onRetry={() => {
                handleClearError();
                showError('Попробуйте выполнить действие снова');
              }}
              onDismiss={handleClearError}
            />
          )}
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
            <ButtonLoader
              loading={loading}
              onClick={handleJoinQueue}
              disabled={!canFindMatch}
              variant="primary"
              size="lg"
              loadingText="Подключение..."
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              🎯 Найти игрока (PvP)
            </ButtonLoader>

            {/* Bot Battle Options */}
            <div className="grid grid-cols-3 gap-2">
              <ButtonLoader
                loading={loading}
                onClick={() => handleBotBattle('easy')}
                disabled={!canFindMatch}
                variant="success"
                size="sm"
                loadingText="..."
              >
                🤖 Легкий бот
              </ButtonLoader>
              <ButtonLoader
                loading={loading}
                onClick={() => handleBotBattle('medium')}
                disabled={!canFindMatch}
                variant="secondary"
                size="sm"
                loadingText="..."
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                🤖 Средний бот
              </ButtonLoader>
              <ButtonLoader
                loading={loading}
                onClick={() => handleBotBattle('hard')}
                disabled={!canFindMatch}
                variant="danger"
                size="sm"
                loadingText="..."
              >
                🤖 Сложный бот
              </ButtonLoader>
            </div>
          </>
        ) : (
          <ButtonLoader
            loading={loading}
            onClick={handleLeaveQueue}
            variant="danger"
            size="lg"
            loadingText="Отмена..."
            className="w-full"
          >
            ❌ Отменить поиск
          </ButtonLoader>
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