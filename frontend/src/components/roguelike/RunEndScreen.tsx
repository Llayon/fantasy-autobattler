/**
 * RunEndScreen component for Roguelike Mode.
 * Displays victory or defeat screen with stats and actions.
 *
 * @fileoverview Run end screen with rewards and retry options.
 */

'use client';

import { memo, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Run result type.
 */
export type RunResult = 'victory' | 'defeat';

/**
 * Battle history entry for stats display.
 */
export interface BattleHistoryEntry {
  /** Battle ID */
  battleId: string;
  /** Whether player won */
  won: boolean;
  /** Gold earned */
  goldEarned: number;
  /** Opponent name or type */
  opponentName?: string;
}

/**
 * Run statistics for end screen.
 */
export interface RunStats {
  /** Total wins */
  wins: number;
  /** Total losses */
  losses: number;
  /** Total gold earned */
  totalGoldEarned: number;
  /** Total gold spent on upgrades */
  totalGoldSpent: number;
  /** Final gold balance */
  finalGold: number;
  /** Number of units upgraded */
  unitsUpgraded: number;
  /** Longest win streak */
  longestStreak: number;
  /** Battle history */
  battleHistory: BattleHistoryEntry[];
}

/**
 * Rating change info.
 */
export interface RatingChange {
  /** Previous rating */
  previousRating: number;
  /** New rating */
  newRating: number;
  /** Rating change amount */
  change: number;
}

/**
 * Leader info for display.
 */
export interface EndScreenLeader {
  /** Leader ID */
  id: string;
  /** Leader name */
  name: string;
  /** Leader name (Russian) */
  nameRu?: string;
  /** Portrait identifier */
  portrait: string;
  /** Faction ID */
  faction: string;
}

/**
 * RunEndScreen component props.
 */
interface RunEndScreenProps {
  /** Run result (victory or defeat) */
  result: RunResult;
  /** Run statistics */
  stats: RunStats;
  /** Rating change (if applicable) */
  ratingChange?: RatingChange;
  /** Leader info */
  leader: EndScreenLeader;
  /** Callback for starting new run */
  onNewRun: () => void;
  /** Callback for returning to main menu */
  onMainMenu: () => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Use Russian language */
  useRussian?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Leader portrait mapping.
 */
const LEADER_PORTRAITS: Record<string, string> = {
  'leader-aldric': '👨‍✈️',
  'leader-malachar': '💀',
  default: '👤',
};

/**
 * Faction color mapping.
 */
const FACTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  humans: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  undead: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500',
    text: 'text-purple-400',
  },
};

/** Default faction colors */
const DEFAULT_FACTION_COLORS = {
  bg: 'bg-gray-900/30',
  border: 'border-gray-500',
  text: 'text-gray-400',
};

const LABELS = {
  en: {
    victory: 'Victory!',
    defeat: 'Defeat',
    victorySubtitle: 'You completed the run with 9 wins!',
    defeatSubtitle: 'Better luck next time...',
    stats: 'Run Statistics',
    wins: 'Wins',
    losses: 'Losses',
    goldEarned: 'Gold Earned',
    goldSpent: 'Gold Spent',
    finalGold: 'Final Gold',
    unitsUpgraded: 'Units Upgraded',
    longestStreak: 'Longest Streak',
    rating: 'Rating',
    ratingChange: 'Rating Change',
    newRun: 'Start New Run',
    mainMenu: 'Main Menu',
    battleHistory: 'Battle History',
  },
  ru: {
    victory: 'Победа!',
    defeat: 'Поражение',
    victorySubtitle: 'Вы завершили забег с 9 победами!',
    defeatSubtitle: 'Повезёт в следующий раз...',
    stats: 'Статистика забега',
    wins: 'Победы',
    losses: 'Поражения',
    goldEarned: 'Золота заработано',
    goldSpent: 'Золота потрачено',
    finalGold: 'Итоговое золото',
    unitsUpgraded: 'Юнитов улучшено',
    longestStreak: 'Макс. серия',
    rating: 'Рейтинг',
    ratingChange: 'Изменение рейтинга',
    newRun: 'Новый забег',
    mainMenu: 'Главное меню',
    battleHistory: 'История боёв',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get leader portrait emoji.
 */
function getLeaderPortrait(portrait: string): string {
  return LEADER_PORTRAITS[portrait] ?? LEADER_PORTRAITS.default ?? '👤';
}

/**
 * Get faction colors.
 */
function getFactionColors(faction: string): { bg: string; border: string; text: string } {
  return FACTION_COLORS[faction] ?? DEFAULT_FACTION_COLORS;
}

/**
 * Get localized labels.
 */
function getLabels(useRussian: boolean) {
  return useRussian ? LABELS.ru : LABELS.en;
}

/**
 * Format rating change with sign.
 */
function formatRatingChange(change: number): string {
  if (change > 0) return `+${change}`;
  return String(change);
}

// =============================================================================
// STAT ROW COMPONENT
// =============================================================================

interface StatRowProps {
  label: string;
  value: string | number;
  icon?: string;
  highlight?: boolean;
}

const StatRow = memo(function StatRow({ label, value, icon, highlight = false }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-lg" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="text-gray-400">{label}</span>
      </div>
      <span className={`font-bold ${highlight ? 'text-yellow-400 text-lg' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * RunEndScreen component for displaying run completion.
 * Shows victory/defeat screen with stats and action buttons.
 *
 * @example
 * <RunEndScreen
 *   result="victory"
 *   stats={runStats}
 *   leader={currentLeader}
 *   onNewRun={() => startNewRun()}
 *   onMainMenu={() => goToMainMenu()}
 * />
 */
const RunEndScreen = memo(function RunEndScreen({
  result,
  stats,
  ratingChange,
  leader,
  onNewRun,
  onMainMenu,
  disabled = false,
  useRussian = false,
  className = '',
}: RunEndScreenProps) {
  const labels = getLabels(useRussian);
  const isVictory = result === 'victory';
  const factionColors = getFactionColors(leader.faction);
  const portrait = getLeaderPortrait(leader.portrait);
  const leaderName = useRussian && leader.nameRu ? leader.nameRu : leader.name;

  const handleNewRun = useCallback(() => {
    if (!disabled) {
      onNewRun();
    }
  }, [disabled, onNewRun]);

  const handleMainMenu = useCallback(() => {
    if (!disabled) {
      onMainMenu();
    }
  }, [disabled, onMainMenu]);

  return (
    <div
      className={`max-w-2xl mx-auto p-6 rounded-2xl ${
        isVictory ? 'bg-gradient-to-b from-yellow-900/20 to-gray-900' : 'bg-gray-900'
      } border ${isVictory ? 'border-yellow-600/50' : 'border-gray-700'} ${className}`}
      role="region"
      aria-label={isVictory ? labels.victory : labels.defeat}
    >
      {/* Header */}
      <div className="text-center mb-8">
        {/* Result Icon */}
        <div className="text-6xl mb-4" aria-hidden="true">
          {isVictory ? '🏆' : '💔'}
        </div>

        {/* Result Title */}
        <h1
          className={`text-4xl font-bold mb-2 ${
            isVictory ? 'text-yellow-400' : 'text-red-400'
          }`}
        >
          {isVictory ? labels.victory : labels.defeat}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400">
          {isVictory ? labels.victorySubtitle : labels.defeatSubtitle}
        </p>
      </div>

      {/* Leader Info */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div
          className={`w-16 h-16 rounded-full ${factionColors.bg} ${factionColors.border} border-2 flex items-center justify-center text-3xl`}
        >
          {portrait}
        </div>
        <div>
          <div className={`text-lg font-bold ${factionColors.text}`}>{leaderName}</div>
          <div className="text-sm text-gray-500">
            {stats.wins}W - {stats.losses}L
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">{labels.stats}</h2>

        <StatRow label={labels.wins} value={stats.wins} icon="✅" />
        <StatRow label={labels.losses} value={stats.losses} icon="❌" />
        <StatRow label={labels.goldEarned} value={stats.totalGoldEarned} icon="💰" />
        <StatRow label={labels.goldSpent} value={stats.totalGoldSpent} icon="🛒" />
        <StatRow label={labels.finalGold} value={stats.finalGold} icon="💎" highlight />
        <StatRow label={labels.unitsUpgraded} value={stats.unitsUpgraded} icon="⬆️" />
        <StatRow label={labels.longestStreak} value={stats.longestStreak} icon="🔥" />

        {/* Rating Change */}
        {ratingChange && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{labels.rating}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{ratingChange.previousRating}</span>
                <span className="text-gray-500">→</span>
                <span className="text-white font-bold">{ratingChange.newRating}</span>
                <span
                  className={`text-sm font-bold ${
                    ratingChange.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  ({formatRatingChange(ratingChange.change)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleNewRun}
          disabled={disabled}
          className={`
            flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200
            ${!disabled
              ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {labels.newRun}
        </button>

        <button
          type="button"
          onClick={handleMainMenu}
          disabled={disabled}
          className={`
            flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200
            ${!disabled
              ? 'bg-gray-700 text-white hover:bg-gray-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {labels.mainMenu}
        </button>
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { RunEndScreen };
export type { RunEndScreenProps };
