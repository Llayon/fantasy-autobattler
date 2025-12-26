/**
 * Draft page for Roguelike mode.
 * Initial draft (pick 3 from 5) or post-battle draft (pick 1 from 3).
 *
 * @fileoverview Draft screen with card selection and submission.
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { ErrorMessage } from '@/components/ErrorStates';
import { DraftScreen, RunStatusBar } from '@/components/roguelike';
import type { DraftCardData } from '@/components/roguelike';
import { useRunStore } from '@/store/runStore';
import { useDraftStore } from '@/store/draftStore';
import { usePlayerStore } from '@/store/playerStore';

// =============================================================================
// CONSTANTS
// =============================================================================

const LABELS = {
  en: {
    loading: 'Loading draft...',
    loadingRun: 'Loading run...',
    runNotFound: 'Run not found',
    runNotFoundDesc: 'The run you are looking for does not exist.',
    backToMenu: 'Back to Menu',
  },
  ru: {
    loading: 'Загрузка драфта...',
    loadingRun: 'Загрузка забега...',
    runNotFound: 'Забег не найден',
    runNotFoundDesc: 'Запрашиваемый забег не существует.',
    backToMenu: 'В главное меню',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Draft page component.
 * Displays draft options and handles card selection.
 */
export default function DraftPage() {
  const router = useRouter();
  const params = useParams();
  const runId = params?.id as string;
  const [useRussian] = useState(true);

  const labels = useRussian ? LABELS.ru : LABELS.en;

  // Store state
  const { currentRun, loading: runLoading, error: runError, loadRun } = useRunStore();
  const {
    options,
    selected,
    isInitial,
    requiredPicks,
    remainingInDeck,
    loading: draftLoading,
    error: draftError,
    isDraftAvailable,
    loadDraft,
    toggleCardSelection,
    submitDraft,
    clearDraft,
  } = useDraftStore();
  const { initPlayer } = usePlayerStore();

  // Track if initial load completed
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Track if we should redirect
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      if (runId) {
        await loadRun(runId);
        await loadDraft(runId);
        setInitialLoadDone(true);
      }
    };
    init();

    return () => {
      clearDraft();
    };
  }, [runId, initPlayer, loadRun, loadDraft, clearDraft]);

  // Handle redirect when no draft available (must be in useEffect, not during render)
  // Only redirect if we got a definitive "no draft" response (404), not on network errors
  useEffect(() => {
    // Wait for initial load to complete
    if (!initialLoadDone) {
      return;
    }
    // Don't redirect if there's an error - show error instead
    if (draftError) {
      return;
    }
    // Only redirect if draft explicitly not available and we have a run loaded
    if (!isDraftAvailable && !draftLoading && currentRun && !runLoading && options.length === 0) {
      setShouldRedirect(true);
    }
  }, [initialLoadDone, isDraftAvailable, draftLoading, currentRun, runLoading, draftError, options.length]);

  // Perform redirect in separate effect
  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`/run/${runId}/battle`);
    }
  }, [shouldRedirect, router, runId]);

  // Convert draft options to DraftCardData
  const draftCards: DraftCardData[] = options.map(opt => ({
    instanceId: opt.instanceId,
    unitId: opt.unitId,
    name: opt.name,
    nameRu: opt.name, // TODO: Add Russian names
    tier: opt.tier,
    cost: opt.cost,
    role: opt.role as 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support',
    stats: opt.stats,
    ability: opt.ability
      ? {
          id: opt.ability.id,
          name: opt.ability.name,
          nameRu: opt.ability.name,
          description: opt.ability.description,
          descriptionRu: opt.ability.description,
        }
      : undefined,
  }));

  // Handle card selection
  const handleCardSelect = useCallback(
    (instanceId: string) => {
      toggleCardSelection(instanceId);
    },
    [toggleCardSelection]
  );

  // Handle draft submission
  const handleSubmit = useCallback(async () => {
    const result = await submitDraft(runId);
    if (result) {
      // Reload run to get updated state
      await loadRun(runId);
      // Navigate to battle
      router.push(`/run/${runId}/battle`);
    }
  }, [runId, submitDraft, loadRun, router]);

  const handleBackToMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  // Loading state
  if (runLoading || draftLoading) {
    return <FullPageLoader message={runLoading ? labels.loadingRun : labels.loading} icon="🎴" />;
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
              onClick={handleBackToMenu}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {labels.backToMenu}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // No draft available - show loader while redirecting (only after initial load)
  if (shouldRedirect || (initialLoadDone && !isDraftAvailable && !draftLoading && currentRun && !draftError && options.length === 0)) {
    return <FullPageLoader message={labels.loading} icon="⚔️" />;
  }

  // Show error state if draft failed to load (network error, etc.)
  if (draftError && options.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Ошибка загрузки драфта</h1>
            <p className="text-gray-400 mb-6">{draftError}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => loadDraft(runId)}
                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Повторить
              </button>
              <button
                onClick={handleBackToMenu}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {labels.backToMenu}
              </button>
            </div>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      <NavigationWrapper>
        <div className="max-w-4xl mx-auto p-6">
          {/* Run status bar */}
          {currentRun && (
            <RunStatusBar
              wins={currentRun.wins}
              losses={currentRun.losses}
              gold={currentRun.gold}
              leader={{
                id: currentRun.leaderId,
                name: currentRun.leaderId,
                portrait: `leader-${currentRun.leaderId}`,
                faction: currentRun.faction,
              }}
              consecutiveWins={currentRun.consecutiveWins}
              useRussian={useRussian}
              className="mb-6"
            />
          )}

          {/* Error display */}
          {(runError || draftError) && (
            <div className="mb-6">
              <ErrorMessage message={runError || draftError || ''} severity="error" />
            </div>
          )}

          {/* Draft screen */}
          <DraftScreen
            options={draftCards}
            selected={selected}
            requiredPicks={requiredPicks}
            isInitial={isInitial}
            remainingInDeck={remainingInDeck}
            onSelectionChange={handleCardSelect}
            onSubmit={handleSubmit}
            disabled={draftLoading}
            useRussian={useRussian}
          />
        </div>
      </NavigationWrapper>
    </div>
  );
}
