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
    noDraft: 'No draft available',
    noDraftDesc: 'Draft is not available at this time.',
    goToBattle: 'Go to Battle',
    goToShop: 'Go to Shop',
    runNotFound: 'Run not found',
    runNotFoundDesc: 'The run you are looking for does not exist.',
    backToMenu: 'Back to Menu',
  },
  ru: {
    loading: 'Загрузка драфта...',
    loadingRun: 'Загрузка забега...',
    noDraft: 'Драфт недоступен',
    noDraftDesc: 'Драфт сейчас недоступен.',
    goToBattle: 'Перейти к бою',
    goToShop: 'Перейти в магазин',
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
    loading: draftLoading,
    error: draftError,
    isDraftAvailable,
    loadDraft,
    toggleCardSelection,
    submitDraft,
    clearDraft,
  } = useDraftStore();
  const { initPlayer } = usePlayerStore();

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      if (runId) {
        await loadRun(runId);
        await loadDraft(runId);
      }
    };
    init();

    return () => {
      clearDraft();
    };
  }, [runId, initPlayer, loadRun, loadDraft, clearDraft]);

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
      // Navigate to battle or shop based on run state
      router.push(`/run/${runId}/battle`);
    }
  }, [runId, submitDraft, loadRun, router]);

  // Handle navigation
  const handleGoToBattle = useCallback(() => {
    router.push(`/run/${runId}/battle`);
  }, [runId, router]);

  const handleGoToShop = useCallback(() => {
    router.push(`/run/${runId}/shop`);
  }, [runId, router]);

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

  // No draft available
  if (!isDraftAvailable && !draftLoading && currentRun) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-4xl mx-auto p-6">
            {/* Run status bar */}
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

            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h1 className="text-2xl font-bold text-gray-400 mb-2">{labels.noDraft}</h1>
              <p className="text-gray-500 mb-6">{labels.noDraftDesc}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleGoToBattle}
                  className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  {labels.goToBattle}
                </button>
                <button
                  onClick={handleGoToShop}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {labels.goToShop}
                </button>
              </div>
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
            remainingInDeck={options.length}
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
