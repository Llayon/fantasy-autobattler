/**
 * Battle page for Roguelike mode.
 * Team placement → Spell timing selection → Find opponent → Battle.
 *
 * @fileoverview Battle preparation and execution screen.
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { ErrorMessage } from '@/components/ErrorStates';
import { RunStatusBar, SpellTimingPanel } from '@/components/roguelike';
import type { SpellTimingConfig, SpellTiming, SpellTimingInfo } from '@/components/roguelike';
import { useRunStore } from '@/store/runStore';
import { usePlayerStore } from '@/store/playerStore';
import { api, RoguelikeOpponent, RoguelikePlacedUnit, RoguelikeSpellTiming } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

type BattleStep = 'placement' | 'spells' | 'finding' | 'battle' | 'result';

interface PlacedUnit {
  instanceId: string;
  unitId: string;
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LABELS = {
  en: {
    loading: 'Loading...',
    loadingRun: 'Loading run...',
    findingOpponent: 'Finding opponent...',
    runNotFound: 'Run not found',
    runNotFoundDesc: 'The run you are looking for does not exist.',
    backToMenu: 'Back to Menu',
    placement: 'Place Your Units',
    placementDesc: 'Drag units to the grid to position them for battle.',
    spells: 'Set Spell Timings',
    spellsDesc: 'Choose when your spells will activate during battle.',
    findOpponent: 'Find Opponent',
    startBattle: 'Start Battle',
    back: 'Back',
    noUnits: 'No units in hand',
    noUnitsDesc: 'Complete a draft first to get units.',
    goToDraft: 'Go to Draft',
    runComplete: 'Run Complete',
    runCompleteDesc: 'This run has ended.',
    viewResults: 'View Results',
  },
  ru: {
    loading: 'Загрузка...',
    loadingRun: 'Загрузка забега...',
    findingOpponent: 'Поиск противника...',
    runNotFound: 'Забег не найден',
    runNotFoundDesc: 'Запрашиваемый забег не существует.',
    backToMenu: 'В главное меню',
    placement: 'Расставьте юнитов',
    placementDesc: 'Перетащите юнитов на поле для расстановки.',
    spells: 'Настройте заклинания',
    spellsDesc: 'Выберите, когда заклинания активируются в бою.',
    findOpponent: 'Найти противника',
    startBattle: 'Начать бой',
    back: 'Назад',
    noUnits: 'Нет юнитов в руке',
    noUnitsDesc: 'Сначала пройдите драфт.',
    goToDraft: 'Перейти к драфту',
    runComplete: 'Забег завершён',
    runCompleteDesc: 'Этот забег уже закончился.',
    viewResults: 'Посмотреть результаты',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Battle page component.
 * Handles unit placement, spell timing, and battle execution.
 */
export default function BattlePage() {
  const router = useRouter();
  const params = useParams();
  const runId = params?.id as string;
  const [useRussian] = useState(true);

  const labels = useRussian ? LABELS.ru : LABELS.en;

  // Local state
  const [step, setStep] = useState<BattleStep>('placement');
  const [placedUnits, setPlacedUnits] = useState<PlacedUnit[]>([]);
  const [spellInfos, setSpellInfos] = useState<SpellTimingInfo[]>([]);
  const [spellTimings, setSpellTimings] = useState<SpellTimingConfig[]>([]);
  const [opponent, setOpponent] = useState<RoguelikeOpponent | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleError, setBattleError] = useState<string | null>(null);

  // Store state
  const { currentRun, loading: runLoading, error: runError, loadRun, updateSpellTiming } = useRunStore();
  const { initPlayer } = usePlayerStore();

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      if (runId) {
        await loadRun(runId);
      }
    };
    init();
  }, [runId, initPlayer, loadRun]);

  // Initialize spell timings from run
  useEffect(() => {
    if (currentRun?.spells) {
      // Create spell info for display
      setSpellInfos(
        currentRun.spells.map(s => ({
          id: s.spellId,
          name: s.spellId, // TODO: Get spell name from data
          nameRu: s.spellId,
          description: '',
          descriptionRu: '',
          recommendedTiming: (s.timing || 'mid') as SpellTiming,
        }))
      );
      // Create timing config
      setSpellTimings(
        currentRun.spells.map(s => ({
          spellId: s.spellId,
          timing: (s.timing || 'mid') as SpellTiming,
        }))
      );
    }
  }, [currentRun?.spells]);

  // Auto-place units for now (simplified)
  useEffect(() => {
    if (currentRun?.hand && placedUnits.length === 0) {
      const placed: PlacedUnit[] = currentRun.hand.slice(0, 8).map((card, index) => ({
        instanceId: card.instanceId,
        unitId: card.unitId,
        tier: card.tier,
        position: { x: index % 8, y: Math.floor(index / 8) },
      }));
      setPlacedUnits(placed);
    }
  }, [currentRun?.hand, placedUnits.length]);

  // Handle spell timing change
  const handleSpellTimingChange = useCallback(
    (spellId: string, timing: SpellTiming) => {
      setSpellTimings(prev =>
        prev.map(s => (s.spellId === spellId ? { ...s, timing } : s))
      );
      updateSpellTiming(spellId, timing);
    },
    [updateSpellTiming]
  );

  // Handle find opponent
  const handleFindOpponent = useCallback(async () => {
    setStep('finding');
    setBattleError(null);

    try {
      const opp = await api.findRoguelikeOpponent(runId);
      setOpponent(opp);
      setStep('battle');
    } catch (err) {
      setBattleError('Не удалось найти противника');
      setStep('spells');
    }
  }, [runId]);

  // Handle start battle
  const handleStartBattle = useCallback(async () => {
    if (!opponent) return;

    setBattleLoading(true);
    setBattleError(null);

    try {
      const team: RoguelikePlacedUnit[] = placedUnits.map(u => ({
        instanceId: u.instanceId,
        unitId: u.unitId,
        tier: u.tier,
        position: u.position,
      }));

      const timings: RoguelikeSpellTiming[] = spellTimings.map(s => ({
        spellId: s.spellId,
        timing: s.timing,
      }));

      const result = await api.submitRoguelikeBattle(runId, team, timings);

      // Navigate based on result
      if (result.runStatus === 'active') {
        // Continue run - go to shop or draft
        router.push(`/run/${runId}/shop`);
      } else {
        // Run ended - go to results
        router.push(`/run/${runId}/result`);
      }
    } catch (err) {
      setBattleError('Не удалось провести бой');
    } finally {
      setBattleLoading(false);
    }
  }, [runId, opponent, placedUnits, spellTimings, router]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (step === 'spells') {
      setStep('placement');
    } else if (step === 'battle') {
      setStep('spells');
      setOpponent(null);
    }
  }, [step]);

  const handleGoToDraft = useCallback(() => {
    router.push(`/run/${runId}/draft`);
  }, [runId, router]);

  const handleViewResults = useCallback(() => {
    router.push(`/run/${runId}/result`);
  }, [runId, router]);

  const handleBackToMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  // Loading state
  if (runLoading) {
    return <FullPageLoader message={labels.loadingRun} icon="⚔️" />;
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

  // No units in hand
  if (currentRun && (!currentRun.hand || currentRun.hand.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-400 mb-2">{labels.noUnits}</h1>
            <p className="text-gray-500 mb-6">{labels.noUnitsDesc}</p>
            <button
              onClick={handleGoToDraft}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {labels.goToDraft}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Finding opponent
  if (step === 'finding') {
    return <FullPageLoader message={labels.findingOpponent} icon="🔍" />;
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
          {(runError || battleError) && (
            <div className="mb-6">
              <ErrorMessage message={runError || battleError || ''} severity="error" />
            </div>
          )}

          {/* Step: Placement */}
          {step === 'placement' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-2">{labels.placement}</h2>
              <p className="text-gray-400 text-center mb-6">{labels.placementDesc}</p>

              {/* Simplified grid display */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const x = i % 8;
                    const y = Math.floor(i / 8);
                    const unit = placedUnits.find(u => u.position.x === x && u.position.y === y);

                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded border ${
                          unit
                            ? 'bg-blue-900/50 border-blue-500'
                            : 'bg-gray-700/30 border-gray-600'
                        } flex items-center justify-center text-xs`}
                      >
                        {unit && (
                          <span className="truncate px-1">
                            {unit.unitId.slice(0, 3)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-gray-500 text-sm mt-2">
                  {placedUnits.length} юнитов расставлено
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep('spells')}
                  disabled={placedUnits.length === 0}
                  className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                    placedUnits.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-yellow-500 text-black hover:bg-yellow-400'
                  }`}
                >
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* Step: Spell Timings */}
          {step === 'spells' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-2">{labels.spells}</h2>
              <p className="text-gray-400 text-center mb-6">{labels.spellsDesc}</p>

              <SpellTimingPanel
                spells={spellInfos}
                timings={spellTimings}
                onTimingChange={handleSpellTimingChange}
                useRussian={useRussian}
                className="mb-6"
              />

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← {labels.back}
                </button>
                <button
                  onClick={handleFindOpponent}
                  className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  {labels.findOpponent}
                </button>
              </div>
            </div>
          )}

          {/* Step: Battle */}
          {step === 'battle' && opponent && (
            <div>
              <h2 className="text-xl font-bold text-center mb-6">Противник найден!</h2>

              {/* Opponent info */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-center">
                <div className="text-4xl mb-2">⚔️</div>
                <div className="text-lg font-bold">{opponent.playerName}</div>
                <div className="text-gray-400">
                  {opponent.faction} • {opponent.wins} побед • Рейтинг: {opponent.rating}
                </div>
                {opponent.isBot && (
                  <div className="text-yellow-500 text-sm mt-2">🤖 Бот</div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← {labels.back}
                </button>
                <button
                  onClick={handleStartBattle}
                  disabled={battleLoading}
                  className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                    battleLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-400'
                  }`}
                >
                  {battleLoading ? 'Бой...' : labels.startBattle}
                </button>
              </div>
            </div>
          )}
        </div>
      </NavigationWrapper>
    </div>
  );
}
