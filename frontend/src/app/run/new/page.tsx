/**
 * New Run page for Roguelike mode.
 * Faction selection → Leader selection → Start run flow.
 *
 * @fileoverview Run creation wizard with faction and leader selection.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { ErrorMessage } from '@/components/ErrorStates';
import { FactionSelect, LeaderSelect } from '@/components/roguelike';
import type { FactionData, LeaderData } from '@/components/roguelike';
import { useRunStore } from '@/store/runStore';
import { usePlayerStore } from '@/store/playerStore';
import { api } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

type Step = 'faction' | 'leader' | 'confirm';

// =============================================================================
// CONSTANTS
// =============================================================================

const LABELS = {
  en: {
    title: 'New Roguelike Run',
    selectFaction: 'Select Faction',
    selectLeader: 'Select Leader',
    confirmStart: 'Confirm & Start',
    back: 'Back',
    startRun: 'Start Run',
    loading: 'Creating run...',
    loadingFactions: 'Loading factions...',
    loadingLeaders: 'Loading leaders...',
    errorFactions: 'Failed to load factions',
    errorLeaders: 'Failed to load leaders',
    activeRunWarning: 'You have an active run. Abandon it first to start a new one.',
    goToActiveRun: 'Go to Active Run',
  },
  ru: {
    title: 'Новый забег',
    selectFaction: 'Выберите фракцию',
    selectLeader: 'Выберите лидера',
    confirmStart: 'Подтвердить и начать',
    back: 'Назад',
    startRun: 'Начать забег',
    loading: 'Создание забега...',
    loadingFactions: 'Загрузка фракций...',
    loadingLeaders: 'Загрузка лидеров...',
    errorFactions: 'Не удалось загрузить фракции',
    errorLeaders: 'Не удалось загрузить лидеров',
    activeRunWarning: 'У вас есть активный забег. Сначала завершите его.',
    goToActiveRun: 'Перейти к забегу',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * New Run page component.
 * Multi-step wizard for creating a new roguelike run.
 */
export default function NewRunPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('faction');
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [factions, setFactions] = useState<FactionData[]>([]);
  const [leaders, setLeaders] = useState<LeaderData[]>([]);
  const [loadingFactions, setLoadingFactions] = useState(true);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRussian] = useState(true);
  // Track if we're in the process of creating a run (to avoid showing active run warning)
  const [isCreating, setIsCreating] = useState(false);

  const labels = useRussian ? LABELS.ru : LABELS.en;

  // Store state
  const { currentRun, loading: runLoading, createRun, loadActiveRun, clearError, runLoaded } = useRunStore();
  const { initPlayer } = usePlayerStore();

  // Initialize player and check for active run
  useEffect(() => {
    const init = async () => {
      // Clear any previous errors before checking for active run
      clearError();
      await initPlayer();
      await loadActiveRun();
    };
    init();
  }, [initPlayer, loadActiveRun, clearError]);

  // Load factions on mount
  useEffect(() => {
    const loadFactions = async () => {
      try {
        setLoadingFactions(true);
        const data = await api.getRoguelikeFactions();
        setFactions(data.map(f => ({
          id: f.id,
          name: f.name,
          nameRu: f.name, // TODO: Add Russian names to backend
          description: f.description,
          descriptionRu: f.description,
          bonus: f.bonus,
          icon: f.icon,
        })));
        setError(null);
      } catch (err) {
        setError(labels.errorFactions);
      } finally {
        setLoadingFactions(false);
      }
    };
    loadFactions();
  }, [labels.errorFactions]);

  // Load leaders when faction is selected
  useEffect(() => {
    if (!selectedFaction) {
      setLeaders([]);
      return;
    }

    const loadLeaders = async () => {
      try {
        setLoadingLeaders(true);
        const data = await api.getRoguelikeLeaders(selectedFaction);
        setLeaders(data.map(l => ({
          id: l.id,
          name: l.name,
          nameRu: l.name, // TODO: Add Russian names to backend
          description: l.passive.description,
          descriptionRu: l.passive.description,
          faction: l.faction,
          passive: {
            id: l.passive.id,
            name: l.passive.name,
            nameRu: l.passive.name,
            description: l.passive.description,
            descriptionRu: l.passive.description,
          },
          spells: l.spells.map(s => ({
            id: s.id,
            name: s.name,
            nameRu: s.name,
            description: s.description,
            descriptionRu: s.description,
            icon: '✨',
            recommendedTiming: 'mid' as const,
          })),
          portrait: l.portrait,
        })));
        setError(null);
      } catch (err) {
        setError(labels.errorLeaders);
      } finally {
        setLoadingLeaders(false);
      }
    };
    loadLeaders();
  }, [selectedFaction, labels.errorLeaders]);

  // Handle faction selection
  const handleFactionSelect = useCallback((factionId: string) => {
    setSelectedFaction(factionId);
    setSelectedLeader(null);
    setStep('leader');
  }, []);

  // Handle leader selection
  const handleLeaderSelect = useCallback((leaderId: string) => {
    setSelectedLeader(leaderId);
    setStep('confirm');
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === 'leader') {
      setStep('faction');
      setSelectedFaction(null);
    } else if (step === 'confirm') {
      setStep('leader');
      setSelectedLeader(null);
    }
  }, [step]);

  // Handle run creation
  const handleStartRun = useCallback(async () => {
    if (!selectedFaction || !selectedLeader) return;

    setIsCreating(true);
    const run = await createRun(selectedFaction, selectedLeader);
    if (run) {
      router.push(`/run/${run.id}/draft`);
    } else {
      setIsCreating(false);
    }
  }, [selectedFaction, selectedLeader, createRun, router]);

  // Handle navigation to active run - determine correct page based on run state
  const handleGoToActiveRun = useCallback(async () => {
    if (!currentRun) return;
    
    // Check if draft is available
    try {
      const draftStatus = await api.getRoguelikeDraftStatus(currentRun.id);
      if (draftStatus.available) {
        router.push(`/run/${currentRun.id}/draft`);
      } else {
        // No draft available - go to battle
        router.push(`/run/${currentRun.id}/battle`);
      }
    } catch {
      // If draft status check fails, default to battle
      router.push(`/run/${currentRun.id}/battle`);
    }
  }, [currentRun, router]);

  // Loading state - only wait for factions, not run check
  // Run check happens in background and will show warning if needed
  if (loadingFactions) {
    return <FullPageLoader message={labels.loadingFactions} icon="🎮" />;
  }

  // Active run warning (only show if we've checked and found one, and we're not creating a new run)
  if (runLoaded && currentRun && currentRun.status === 'active' && !isCreating) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6">
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-yellow-400 mb-4">
                {labels.activeRunWarning}
              </h1>
              <button
                onClick={handleGoToActiveRun}
                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                {labels.goToActiveRun}
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              🎮 {labels.title}
            </h1>
            <div className="flex justify-center gap-2 mt-4">
              {['faction', 'leader', 'confirm'].map((s, i) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full ${
                    step === s
                      ? 'bg-yellow-400'
                      : i < ['faction', 'leader', 'confirm'].indexOf(step)
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error display - only show local errors, not runError 
              (missing active run is normal on this page) */}
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} severity="error" />
            </div>
          )}

          {/* Step content */}
          {step === 'faction' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-6">{labels.selectFaction}</h2>
              <FactionSelect
                factions={factions}
                selectedFactionId={selectedFaction}
                onSelect={handleFactionSelect}
                useRussian={useRussian}
              />
            </div>
          )}

          {step === 'leader' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-6">{labels.selectLeader}</h2>
              {loadingLeaders ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-400">{labels.loadingLeaders}</p>
                </div>
              ) : (
                <LeaderSelect
                  leaders={leaders}
                  selectedLeaderId={selectedLeader}
                  onSelect={handleLeaderSelect}
                  useRussian={useRussian}
                />
              )}
              <div className="mt-6 text-center">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ← {labels.back}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-6">{labels.confirmStart}</h2>
              
              {/* Selected faction and leader summary */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <div className="mb-4">
                  <div className="text-gray-400 text-sm mb-1">Фракция</div>
                  <div className="text-lg font-bold">
                    {factions.find(f => f.id === selectedFaction)?.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Лидер</div>
                  <div className="text-lg font-bold">
                    {leaders.find(l => l.id === selectedLeader)?.name}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← {labels.back}
                </button>
                <button
                  onClick={handleStartRun}
                  disabled={runLoading}
                  className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                    runLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-yellow-500 text-black hover:bg-yellow-400'
                  }`}
                >
                  {runLoading ? labels.loading : labels.startRun}
                </button>
              </div>
            </div>
          )}
        </div>
      </NavigationWrapper>
    </div>
  );
}
