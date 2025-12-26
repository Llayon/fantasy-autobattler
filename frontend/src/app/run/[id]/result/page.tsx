/**
 * Result page for Roguelike mode.
 * Displays run completion screen with stats and actions.
 *
 * @fileoverview Run end screen with victory/defeat display.
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { RunEndScreen } from '@/components/roguelike';
import type { RunResult, RunStats, RatingChange, EndScreenLeader } from '@/components/roguelike';
import { useRunStore } from '@/store/runStore';
import { usePlayerStore } from '@/store/playerStore';

// =============================================================================
// CONSTANTS
// =============================================================================

const LABELS = {
  en: {
    loading: 'Loading results...',
    runNotFound: 'Run not found',
    runNotFoundDesc: 'The run you are looking for does not exist.',
    backToMenu: 'Back to Menu',
    runActive: 'Run is still active',
    runActiveDesc: 'This run has not ended yet.',
    continueBattle: 'Continue Battle',
  },
  ru: {
    loading: 'Загрузка результатов...',
    runNotFound: 'Забег не найден',
    runNotFoundDesc: 'Запрашиваемый забег не существует.',
    backToMenu: 'В главное меню',
    runActive: 'Забег ещё активен',
    runActiveDesc: 'Этот забег ещё не завершён.',
    continueBattle: 'Продолжить бой',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Result page component.
 * Displays run completion with stats and navigation options.
 */
export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const runId = params?.id as string;
  const [useRussian] = useState(true);

  const labels = useRussian ? LABELS.ru : LABELS.en;

  // Store state - use runLoaded to know when data is fresh
  const { currentRun, loading: runLoading, loadRun, runLoaded } = useRunStore();
  const { initPlayer } = usePlayerStore();

  // Initialize - force reload to get fresh status
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      if (runId) {
        // Force reload to get fresh run status (important for result page)
        await loadRun(runId, true);
      }
    };
    init();
  }, [runId, initPlayer, loadRun]);

  // Navigation handlers
  const handleNewRun = useCallback(() => {
    router.push('/run/new');
  }, [router]);

  const handleMainMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleContinueBattle = useCallback(() => {
    router.push(`/run/${runId}/battle`);
  }, [runId, router]);

  // Loading state - wait for data to be loaded
  if (runLoading || !runLoaded) {
    return <FullPageLoader message={labels.loading} icon="🏆" />;
  }

  // Run not found
  if (!currentRun && !runLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">❓</div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">{labels.runNotFound}</h1>
            <p className="text-gray-400 mb-6">{labels.runNotFoundDesc}</p>
            <button
              onClick={handleMainMenu}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {labels.backToMenu}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Run still active
  if (currentRun && currentRun.status === 'active') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">⚔️</div>
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">{labels.runActive}</h1>
            <p className="text-gray-400 mb-6">{labels.runActiveDesc}</p>
            <button
              onClick={handleContinueBattle}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {labels.continueBattle}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Calculate stats from run
  const result: RunResult = currentRun?.status === 'won' ? 'victory' : 'defeat';

  // Calculate total gold earned from battle history
  // Handle both old format (string[]) and new format (BattleHistoryEntry[])
  const calculateTotalGold = (): number => {
    if (!currentRun?.battleHistory || currentRun.battleHistory.length === 0) {
      return 0;
    }
    // Check if first entry is an object (new format) or string (old format)
    const firstEntry = currentRun.battleHistory[0];
    if (typeof firstEntry === 'string') {
      // Old format - can't calculate, return current gold minus starting gold
      return Math.max(0, (currentRun?.gold ?? 0) - 10);
    }
    // New format - sum goldEarned from all entries
    return currentRun.battleHistory.reduce((sum, b) => sum + (b.goldEarned ?? 0), 0);
  };

  const stats: RunStats = {
    wins: currentRun?.wins ?? 0,
    losses: currentRun?.losses ?? 0,
    totalGoldEarned: calculateTotalGold(),
    totalGoldSpent: 0, // TODO: Track gold spent on upgrades
    finalGold: currentRun?.gold ?? 0,
    unitsUpgraded: 0, // TODO: Track upgrades
    longestStreak: currentRun?.consecutiveWins ?? 0,
    battleHistory:
      currentRun?.battleHistory
        ?.filter((b): b is typeof b & { battleId: string } => typeof b !== 'string')
        ?.map(b => ({
          battleId: b.battleId,
          won: b.result === 'win',
          goldEarned: b.goldEarned ?? 0,
          opponentName: b.opponent?.name,
        })) ?? [],
  };

  // Rating change (if available)
  const ratingChange: RatingChange | undefined = currentRun?.rating
    ? {
        previousRating: 1000, // TODO: Track previous rating
        newRating: currentRun.rating,
        change: currentRun.rating - 1000,
      }
    : undefined;

  // Leader info
  const leader: EndScreenLeader = {
    id: currentRun?.leaderId ?? '',
    name: currentRun?.leaderId ?? '',
    portrait: `leader-${currentRun?.leaderId}`,
    faction: currentRun?.faction ?? '',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      <NavigationWrapper>
        <div className="max-w-4xl mx-auto p-6">
          <RunEndScreen
            result={result}
            stats={stats}
            ratingChange={ratingChange}
            leader={leader}
            onNewRun={handleNewRun}
            onMainMenu={handleMainMenu}
            useRussian={useRussian}
          />
        </div>
      </NavigationWrapper>
    </div>
  );
}
