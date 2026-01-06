/**
 * Battle/Matchmaking page for Fantasy Autobattler.
 * Complete battle interface with PvP matchmaking and bot battles.
 * 
 * @fileoverview Full-featured battle page with team display, matchmaking, and bot battles.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { ButtonLoader, Spinner } from '@/components/LoadingStates';
import { ErrorMessage, NetworkError, useToast } from '@/components/ErrorStates';
import { 
  useMatchmakingStore, 
  selectQueueEntry,
  selectMatch,
  selectMatchmakingLoading,
  selectMatchmakingError,
  selectIsInQueue,
  selectHasMatch
} from '@/store/matchmakingStore';
import { 
  useTeamStore, 
  selectActiveTeam,
  selectTeams
} from '@/store/teamStore';
import { useUIStore } from '@/store/uiStore';
import { TeamResponse } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Bot difficulty configuration.
 */
interface BotDifficulty {
  /** Difficulty identifier */
  id: 'easy' | 'medium' | 'hard';
  /** Display name */
  name: string;
  /** Difficulty description */
  description: string;
  /** Difficulty icon */
  icon: string;
  /** Button color classes */
  colorClasses: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Bot difficulty configurations */
const BOT_DIFFICULTIES: BotDifficulty[] = [
  {
    id: 'easy',
    name: 'Лёгкий',
    description: 'Простая тактика, базовые юниты',
    icon: '🟢',
    colorClasses: 'bg-green-600 hover:bg-green-500 border-green-500',
  },
  {
    id: 'medium',
    name: 'Средний',
    description: 'Сбалансированная команда, умная тактика',
    icon: '🟡',
    colorClasses: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500',
  },
  {
    id: 'hard',
    name: 'Сложный',
    description: 'Оптимальная команда, продвинутая тактика',
    icon: '🔴',
    colorClasses: 'bg-red-600 hover:bg-red-500 border-red-500',
  },
];

/** PvP rating change estimates */
const PVP_RATING_ESTIMATES = {
  win: { min: 15, max: 25 },
  loss: { min: -25, max: -15 },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get role icon for unit role.
 * 
 * @param role - Unit role
 * @returns Role icon emoji
 * @example
 * const icon = getRoleIcon('tank'); // '🛡️'
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
 * Generate team composition preview with role icons.
 * 
 * @param team - Team data
 * @returns Team composition string
 * @example
 * const preview = generateTeamPreview(team); // "🛡️⚔️🏹🔮"
 */
function generateTeamPreview(team: { units?: Array<{ role: string }> }): string {
  if (!team?.units || !Array.isArray(team.units)) {
    return '';
  }
  
  return team.units
    .slice(0, 6) // Show max 6 units
    .map((unit) => getRoleIcon(unit.role))
    .join('');
}

/**
 * Format wait time in MM:SS format.
 * 
 * @param seconds - Wait time in seconds
 * @returns Formatted time string
 * @example
 * const time = formatWaitTime(125); // "2:05"
 */
function formatWaitTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Active team header component.
 */
function ActiveTeamHeader({ team }: { team: { name: string; totalCost: number; units?: Array<{ role: string }> } }) {
  const teamPreview = generateTeamPreview(team);
  
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            ⚔️ Активная команда
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-blue-400">{team.name}</span>
              <span className="text-sm text-gray-400">
                {team.totalCost}/30 очков
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Состав:</span>
              <span className="text-xl">{teamPreview}</span>
              <span className="text-sm text-gray-400">
                ({team.units?.length || 0} юнитов)
              </span>
            </div>
          </div>
        </div>
        
        <Link
          href="/"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          Изменить команду
        </Link>
      </div>
    </div>
  );
}

/**
 * No team warning component.
 */
function NoTeamWarning() {
  return (
    <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="text-4xl">⚠️</div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-yellow-300 mb-2">
            Выберите команду
          </h2>
          <p className="text-yellow-200 mb-4">
            Для участия в боях необходимо создать и активировать команду.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors font-medium"
          >
            🛠️ Создать команду
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * PvP matchmaking section component.
 */
function PvPSection({ 
  activeTeam,
  isInQueue,
  queueEntry,
  loading,
  onJoinQueue,
  onLeaveQueue,
  waitTime
}: {
  activeTeam: { name: string; totalCost: number; units?: Array<{ role: string }> } | null;
  isInQueue: boolean;
  queueEntry: { teamId: string; joinedAt: Date; rating?: number } | null;
  loading: boolean;
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
  waitTime: number;
}) {
  const canJoinQueue = !loading && !isInQueue && !!activeTeam;
  
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
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
            <span className="text-green-400">
              Победа: +{PVP_RATING_ESTIMATES.win.min}-{PVP_RATING_ESTIMATES.win.max}
            </span>
            <span className="text-red-400">
              Поражение: {PVP_RATING_ESTIMATES.loss.max}-{PVP_RATING_ESTIMATES.loss.min}
            </span>
          </div>
        </div>
      </div>
      
      {/* Queue status */}
      {isInQueue && queueEntry && (
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Spinner size="sm" color="primary" />
              <span className="text-blue-300 font-medium">Поиск противника...</span>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {formatWaitTime(waitTime)}
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-blue-300">
                Команда: <span className="font-medium">{activeTeam?.name}</span>
              </div>
              {queueEntry.rating && (
                <div className="text-blue-300">
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
      
      {/* Action button */}
      {!isInQueue ? (
        <ButtonLoader
          loading={loading}
          onClick={onJoinQueue}
          disabled={!canJoinQueue}
          variant="primary"
          size="lg"
          loadingText="Подключение..."
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
        >
          🎯 Найти противника
        </ButtonLoader>
      ) : (
        <ButtonLoader
          loading={loading}
          onClick={onLeaveQueue}
          variant="danger"
          size="lg"
          loadingText="Отмена..."
          className="w-full"
        >
          ❌ Отменить поиск
        </ButtonLoader>
      )}
    </div>
  );
}

/**
 * Bot battles section component.
 */
function BotSection({ 
  activeTeam,
  loading,
  onStartBotBattle
}: {
  activeTeam: TeamResponse | null;
  loading: boolean;
  onStartBotBattle: (difficulty: 'easy' | 'medium' | 'hard') => void;
}) {
  const canStartBattle = !loading && !!activeTeam;
  
  return (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BOT_DIFFICULTIES.map((difficulty) => (
          <div
            key={difficulty.id}
            className={`border-2 rounded-lg p-4 transition-all ${
              canStartBattle 
                ? `${difficulty.colorClasses} hover:scale-105 cursor-pointer` 
                : 'border-gray-600 bg-gray-700/50 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="text-center mb-3">
              <div className="text-2xl mb-2">{difficulty.icon}</div>
              <h3 className="font-bold text-white">{difficulty.name}</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4 text-center">
              {difficulty.description}
            </p>
            <ButtonLoader
              loading={loading}
              onClick={() => onStartBotBattle(difficulty.id)}
              disabled={!canStartBattle}
              variant="secondary"
              size="sm"
              loadingText="..."
              className="w-full bg-transparent border-0 text-white hover:bg-white/10"
            >
              Начать бой
            </ButtonLoader>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Match found component.
 */
function MatchFound() {
  return (
    <div className="bg-green-900/30 border border-green-500 rounded-lg p-6 mb-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-green-300 mb-2">
          Матч найден!
        </h2>
        <p className="text-green-200 mb-4">
          Переход к бою...
        </p>
        <div className="flex items-center justify-center gap-2">
          <Spinner size="sm" color="primary" />
          <span className="text-green-300 text-sm">Загрузка боя</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Battle/Matchmaking page component.
 * Complete battle interface with team display, PvP matchmaking, and bot battles.
 * 
 * @returns Battle page component
 * @example
 * <BattlePage />
 */
export default function BattlePage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [waitTime, setWaitTime] = useState(0);
  
  // Ref to track if battle was started on this page (not from navigation)
  const battleStartedOnPageRef = useRef(false);
  // Ref to track if initial cleanup was done
  const initialCleanupDoneRef = useRef(false);
  
  // Store state
  const activeTeam = useTeamStore(selectActiveTeam);
  const teams = useTeamStore(selectTeams);
  
  const queueEntry = useMatchmakingStore(selectQueueEntry);
  const match = useMatchmakingStore(selectMatch);
  const loading = useMatchmakingStore(selectMatchmakingLoading);
  const error = useMatchmakingStore(selectMatchmakingError);
  const isInQueue = useMatchmakingStore(selectIsInQueue);
  const hasMatch = useMatchmakingStore(selectHasMatch);
  
  // Store actions
  const { joinQueue, leaveQueue, startBotBattle, clearError } = useMatchmakingStore();
  const { loadTeams } = useTeamStore();
  
  // Update wait time every second when in queue
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isInQueue && queueEntry?.joinedAt) {
      interval = setInterval(() => {
        const now = new Date();
        const joinedAt = new Date(queueEntry.joinedAt);
        
        if (isNaN(now.getTime()) || isNaN(joinedAt.getTime())) {
          setWaitTime(0);
          return;
        }
        
        const elapsed = Math.floor((now.getTime() - joinedAt.getTime()) / 1000);
        setWaitTime(Math.max(0, elapsed));
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
  // Only redirect if battle was started on this page (not stale state from navigation)
  useEffect(() => {
    if (hasMatch && match && battleStartedOnPageRef.current) {
      const timer = setTimeout(() => {
        // Clear match state before redirect to prevent loops
        useMatchmakingStore.getState().reset();
        router.push(`/battle/${match.battleId}`);
      }, 2000); // 2 second delay to show match found message
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [hasMatch, match, router]);
  
  // Load teams on mount and clear stale match state from previous sessions
  useEffect(() => {
    // Only run cleanup once on initial mount
    if (!initialCleanupDoneRef.current) {
      initialCleanupDoneRef.current = true;
      
      // Clear any stale match state from previous sessions
      // This prevents redirect loops when navigating to /battle page via navigation
      const { status, match: staleMatch } = useMatchmakingStore.getState();
      if (status === 'matched' && staleMatch) {
        useMatchmakingStore.getState().reset();
      }
    }
    
    loadTeams();
  }, [loadTeams]);
  
  /**
   * Handle joining PvP queue.
   */
  const handleJoinQueue = useCallback(async () => {
    // Prevent multiple clicks while joining queue
    if (loading) {
      return;
    }
    
    if (!activeTeam) {
      showError('Выберите активную команду для участия в PvP');
      return;
    }
    
    try {
      // Mark that battle was started on this page (for redirect logic)
      battleStartedOnPageRef.current = true;
      await joinQueue(activeTeam.id);
      showSuccess('Поиск противника начат!');
    } catch (error) {
      battleStartedOnPageRef.current = false;
      showError('Не удалось присоединиться к очереди');
    }
  }, [activeTeam, joinQueue, showSuccess, showError, loading]);

  /**
   * Handle leaving PvP queue.
   */
  const handleLeaveQueue = useCallback(async () => {
    try {
      await leaveQueue();
      setWaitTime(0);
      battleStartedOnPageRef.current = false;
      showSuccess('Поиск отменён');
    } catch (error) {
      showError('Не удалось отменить поиск');
    }
  }, [leaveQueue, showSuccess, showError]);

  /**
   * Handle starting bot battle.
   */
  const handleStartBotBattle = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    // Prevent multiple clicks while battle is being created
    if (loading) {
      return;
    }
    
    if (!activeTeam) {
      showError('Выберите активную команду для боя с ботом');
      return;
    }
    
    try {
      const difficultyNames = {
        easy: 'лёгким',
        medium: 'средним',
        hard: 'сложным'
      };
      
      // Get mechanics settings from UI store
      const { mechanics, getMechanicsToggles } = useUIStore.getState();
      const mechanicsToggles = mechanics.preset === 'custom' ? getMechanicsToggles() : undefined;
      
      // Mark that battle was started on this page (for redirect logic)
      battleStartedOnPageRef.current = true;
      await startBotBattle(activeTeam.id, difficulty, mechanics.preset, mechanicsToggles);
      showSuccess(`Бой с ${difficultyNames[difficulty]} ботом создан!`);
    } catch (error) {
      battleStartedOnPageRef.current = false;
      showError('Не удалось начать бой с ботом');
    }
  }, [activeTeam, startBotBattle, showSuccess, showError, loading]);
  
  /**
   * Handle clearing error state.
   */
  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <NavigationWrapper>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">🎮 Бой</h1>
            <p className="text-gray-400">
              Сражайтесь с игроками или тренируйтесь против ботов
            </p>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mb-6">
              {error.includes('fetch') || error.includes('network') ? (
                <NetworkError
                  message={error}
                  showRetry
                  onRetry={() => {
                    handleClearError();
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
                  onRetry={handleClearError}
                  onDismiss={handleClearError}
                />
              )}
            </div>
          )}
          
          {/* Match found status */}
          {hasMatch && match && (
            <MatchFound />
          )}
          
          {/* Active team or no team warning */}
          {activeTeam ? (
            <ActiveTeamHeader team={activeTeam} />
          ) : (
            <NoTeamWarning />
          )}
          
          {/* PvP Section */}
          <PvPSection
            activeTeam={activeTeam}
            isInQueue={isInQueue}
            queueEntry={queueEntry}
            loading={loading}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={handleLeaveQueue}
            waitTime={waitTime}
          />
          
          {/* Bot Section */}
          <BotSection
            activeTeam={activeTeam}
            loading={loading}
            onStartBotBattle={handleStartBotBattle}
          />
          
          {/* Additional info */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>💡 Совет: Создайте несколько команд для разных стратегий</p>
            <p className="mt-1">
              У вас {teams.length} {teams.length === 1 ? 'команда' : teams.length < 5 ? 'команды' : 'команд'}
            </p>
          </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}