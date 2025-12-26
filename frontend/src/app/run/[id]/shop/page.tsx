/**
 * Shop page for Roguelike mode.
 * Upgrade units between battles.
 *
 * @fileoverview Upgrade shop with unit cards and gold management.
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { ErrorMessage } from '@/components/ErrorStates';
import { RunStatusBar, UpgradeShop } from '@/components/roguelike';
import type { UpgradeCardData } from '@/components/roguelike';
import { useRunStore } from '@/store/runStore';
import { usePlayerStore } from '@/store/playerStore';
import { api, RoguelikeShopState } from '@/lib/api';

// =============================================================================
// CONSTANTS
// =============================================================================

const LABELS = {
  en: {
    loading: 'Loading shop...',
    loadingRun: 'Loading run...',
    runNotFound: 'Run not found',
    runNotFoundDesc: 'The run you are looking for does not exist.',
    backToMenu: 'Back to Menu',
    runComplete: 'Run Complete',
    runCompleteDesc: 'This run has ended.',
    viewResults: 'View Results',
    continueToBattle: 'Continue to Battle',
    continueToNextBattle: 'Next Battle',
    skipUpgrades: 'Skip Upgrades',
  },
  ru: {
    loading: 'Загрузка магазина...',
    loadingRun: 'Загрузка забега...',
    runNotFound: 'Забег не найден',
    runNotFoundDesc: 'Запрашиваемый забег не существует.',
    backToMenu: 'В главное меню',
    runComplete: 'Забег завершён',
    runCompleteDesc: 'Этот забег уже закончился.',
    viewResults: 'Посмотреть результаты',
    continueToBattle: 'Продолжить к бою',
    continueToNextBattle: 'Следующий бой',
    skipUpgrades: 'Пропустить улучшения',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Shop page component.
 * Displays upgrade options for units in hand.
 */
export default function ShopPage() {
  const router = useRouter();
  const params = useParams();
  const runId = params?.id as string;
  const [useRussian] = useState(true);

  const labels = useRussian ? LABELS.ru : LABELS.en;

  // Local state
  const [shopState, setShopState] = useState<RoguelikeShopState | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Store state
  const { currentRun, loading: runLoading, error: runError, loadRun } = useRunStore();
  const { initPlayer } = usePlayerStore();

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      if (runId) {
        await loadRun(runId);
        await loadShop();
      }
    };
    init();
  }, [runId, initPlayer, loadRun]);

  // Load shop state
  const loadShop = useCallback(async () => {
    try {
      setShopLoading(true);
      setShopError(null);
      const state = await api.getRoguelikeShop(runId);
      setShopState(state);
    } catch (err) {
      setShopError('Не удалось загрузить магазин');
    } finally {
      setShopLoading(false);
    }
  }, [runId]);

  // Handle upgrade
  const handleUpgrade = useCallback(
    async (instanceId: string) => {
      setUpgrading(instanceId);
      setShopError(null);

      try {
        const result = await api.upgradeRoguelikeUnit(runId, instanceId);
        // Update shop state with new values (now uses field instead of hand)
        setShopState(prev =>
          prev
            ? {
                ...prev,
                field: result.field,
                gold: result.gold,
                upgradeCosts: prev.upgradeCosts.map(c =>
                  c.instanceId === instanceId
                    ? {
                        ...c,
                        currentTier: result.upgradedUnit.tier as 1 | 2,
                        targetTier: (result.upgradedUnit.tier + 1) as 2 | 3,
                        canAfford: result.gold >= c.cost,
                      }
                    : { ...c, canAfford: result.gold >= c.cost }
                ),
              }
            : null
        );
        // Reload run to sync state
        await loadRun(runId);
      } catch (err) {
        setShopError('Не удалось улучшить юнита');
      } finally {
        setUpgrading(null);
      }
    },
    [runId, loadRun]
  );

  // Navigation handlers
  const handleContinueToBattle = useCallback(() => {
    router.push(`/run/${runId}/draft`);
  }, [runId, router]);

  const handleViewResults = useCallback(() => {
    router.push(`/run/${runId}/result`);
  }, [runId, router]);

  const handleBackToMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  // Convert shop state to UpgradeCardData (now uses field instead of hand)
  const upgradeCards: UpgradeCardData[] =
    shopState?.field.map(unit => {
      const upgradeCost = shopState.upgradeCosts.find(c => c.instanceId === unit.instanceId);
      return {
        instanceId: unit.instanceId,
        unitId: unit.unitId,
        name: unit.unitId, // TODO: Get unit name from data
        nameRu: unit.unitId,
        tier: unit.tier,
        cost: 0, // Base cost not needed for display
        role: 'tank' as const, // TODO: Get role from data
        stats: {
          hp: 100,
          atk: 10,
          armor: 5,
          speed: 3,
          initiative: 10,
          range: 1,
          attackCount: 1,
          dodge: 0,
        },
        upgradeCost: upgradeCost?.cost,
        canUpgrade: (upgradeCost?.canAfford ?? false) && unit.tier < 3,
        maxTier: unit.tier >= 3,
      };
    }) ?? [];

  // Loading state
  if (runLoading || shopLoading) {
    return <FullPageLoader message={runLoading ? labels.loadingRun : labels.loading} icon="🛒" />;
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

  // Run complete
  if (currentRun && currentRun.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">{labels.runComplete}</h1>
            <p className="text-gray-400 mb-6">{labels.runCompleteDesc}</p>
            <button
              onClick={handleViewResults}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {labels.viewResults}
            </button>
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
          {(runError || shopError) && (
            <div className="mb-6">
              <ErrorMessage message={runError || shopError || ''} severity="error" />
            </div>
          )}

          {/* Upgrade shop */}
          <UpgradeShop
            hand={upgradeCards}
            gold={shopState?.gold ?? currentRun?.gold ?? 0}
            onUpgrade={handleUpgrade}
            onProceed={handleContinueToBattle}
            upgradingId={upgrading}
            useRussian={useRussian}
            className="mb-6"
          />

          {/* UpgradeShop already has proceed button, no need for extra buttons */}
        </div>
      </NavigationWrapper>
    </div>
  );
}
