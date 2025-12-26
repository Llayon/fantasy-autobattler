/**
 * RunStatusBar component for Roguelike Mode.
 * Displays run progress with wins/losses, gold balance, and leader portrait.
 *
 * @fileoverview Run status bar with visual win/loss tracking.
 */

'use client';

import { memo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Leader info for status bar display.
 */
export interface StatusBarLeader {
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
 * RunStatusBar component props.
 */
interface RunStatusBarProps {
  /** Current wins (0-9) */
  wins: number;
  /** Current losses (0-4) */
  losses: number;
  /** Current gold balance */
  gold: number;
  /** Leader info */
  leader: StatusBarLeader;
  /** Current consecutive wins for streak display */
  consecutiveWins?: number;
  /** Use Russian language */
  useRussian?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum wins to complete run */
const MAX_WINS = 9;

/** Maximum losses before run ends */
const MAX_LOSSES = 4;

/**
 * Leader portrait mapping (emoji placeholders).
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
    wins: 'Wins',
    losses: 'Losses',
    gold: 'Gold',
    streak: 'Streak',
  },
  ru: {
    wins: 'Победы',
    losses: 'Поражения',
    gold: 'Золото',
    streak: 'Серия',
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

// =============================================================================
// WIN/LOSS SLOT COMPONENT
// =============================================================================

interface SlotProps {
  filled: boolean;
  type: 'win' | 'loss';
  index: number;
}

const Slot = memo(function Slot({ filled, type, index }: SlotProps) {
  const isWin = type === 'win';
  const baseClasses = 'w-6 h-6 rounded-full border-2 transition-all duration-300';

  if (filled) {
    return (
      <div
        className={`${baseClasses} ${
          isWin
            ? 'bg-green-500 border-green-400 shadow-sm shadow-green-400/50'
            : 'bg-red-500 border-red-400 shadow-sm shadow-red-400/50'
        }`}
        aria-label={`${type} ${index + 1}`}
      >
        <span className="sr-only">{isWin ? 'Win' : 'Loss'}</span>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${
        isWin ? 'border-green-900/50 bg-green-900/20' : 'border-red-900/50 bg-red-900/20'
      }`}
      aria-label={`Empty ${type} slot ${index + 1}`}
    >
      <span className="sr-only">Empty</span>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * RunStatusBar component for displaying run progress.
 * Shows wins/losses as visual slots, gold balance, and leader portrait.
 *
 * @example
 * <RunStatusBar
 *   wins={3}
 *   losses={1}
 *   gold={25}
 *   leader={currentLeader}
 * />
 */
const RunStatusBar = memo(function RunStatusBar({
  wins,
  losses,
  gold,
  leader,
  consecutiveWins = 0,
  useRussian = false,
  className = '',
}: RunStatusBarProps) {
  const labels = getLabels(useRussian);
  const factionColors = getFactionColors(leader.faction);
  const portrait = getLeaderPortrait(leader.portrait);
  const leaderName = useRussian && leader.nameRu ? leader.nameRu : leader.name;

  // Create arrays for win/loss slots
  const winSlots = Array.from({ length: MAX_WINS }, (_, i) => i < wins);
  const lossSlots = Array.from({ length: MAX_LOSSES }, (_, i) => i < losses);

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700 ${className}`}
      role="status"
      aria-label={`Run status: ${wins} wins, ${losses} losses, ${gold} gold`}
    >
      {/* Leader Portrait */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full ${factionColors.bg} ${factionColors.border} border-2 flex items-center justify-center text-2xl`}
          aria-label={leaderName}
        >
          {portrait}
        </div>
      </div>

      {/* Win Slots */}
      <div className="flex-1">
        <div className="text-xs text-gray-400 mb-1">{labels.wins}</div>
        <div className="flex gap-1" role="group" aria-label={`${labels.wins}: ${wins}/${MAX_WINS}`}>
          {winSlots.map((filled, i) => (
            <Slot key={`win-${i}`} filled={filled} type="win" index={i} />
          ))}
        </div>
      </div>

      {/* Loss Slots */}
      <div className="flex-shrink-0">
        <div className="text-xs text-gray-400 mb-1">{labels.losses}</div>
        <div
          className="flex gap-1"
          role="group"
          aria-label={`${labels.losses}: ${losses}/${MAX_LOSSES}`}
        >
          {lossSlots.map((filled, i) => (
            <Slot key={`loss-${i}`} filled={filled} type="loss" index={i} />
          ))}
        </div>
      </div>

      {/* Gold Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
        <span className="text-xl" aria-hidden="true">
          💰
        </span>
        <div>
          <div className="text-xs text-yellow-600">{labels.gold}</div>
          <div className="text-lg font-bold text-yellow-400">{gold}</div>
        </div>
      </div>

      {/* Streak Display (if > 0) */}
      {consecutiveWins > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-900/20 rounded-lg border border-orange-700/50">
          <span className="text-lg" aria-hidden="true">
            🔥
          </span>
          <div>
            <div className="text-xs text-orange-600">{labels.streak}</div>
            <div className="text-lg font-bold text-orange-400">{consecutiveWins}</div>
          </div>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { RunStatusBar };
export type { RunStatusBarProps };
