/**
 * Dynamic Battle page for Fantasy Autobattler.
 * Displays specific battle by ID with full replay functionality.
 * 
 * @fileoverview Battle replay page with BattleReplay component integration.
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { ErrorMessage, NetworkError } from '@/components/ErrorStates';
import { useBattleStore } from '@/store/battleStore';
import { useMatchmakingStore } from '@/store/matchmakingStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRunStore, BattleResultData } from '@/store/runStore';

// Lazy import BattleReplay to avoid build issues
import dynamic from 'next/dynamic';

const BattleReplay = dynamic(() => import('@/components/BattleReplay').then(mod => ({ default: mod.BattleReplay })), {
  loading: () => <FullPageLoader message="Загрузка компонента боя..." icon="⚔️" />,
  ssr: false
});

/**
 * Battle page props from Next.js routing.
 */
interface BattlePageProps {
  /** Battle ID from URL params */
  params: {
    id: string;
  };
}

/**
 * Dynamic Battle page component for specific battle ID.
 * Loads battle data and displays full replay with BattleReplay component.
 * For roguelike mode, shows result screen after replay ends.
 * 
 * @param props - Page props with battle ID
 * @returns Battle replay page
 * @example
 * // Accessed via /battle/battle-123
 * <BattlePage params={{ id: 'battle-123' }} />
 */
export default function BattlePage({ params }: BattlePageProps) {
  const router = useRouter();
  const urlParams = useParams();
  const searchParams = useSearchParams();
  const battleId = params?.id || urlParams?.id as string;
  
  // Check if this replay was accessed from roguelike mode
  // URL format: /battle/{id}?from=roguelike&runId={runId}
  const fromRoguelike = searchParams?.get('from') === 'roguelike';
  const runId = searchParams?.get('runId');
  
  // Get battle result from Zustand store (secure, not URL params)
  const lastBattleResult = useRunStore(state => state.lastBattleResult);
  const clearLastBattleResult = useRunStore(state => state.clearLastBattleResult);
  
  // Validate that the stored result matches this battle
  const roguelikeResult: BattleResultData | null = 
    fromRoguelike && lastBattleResult && lastBattleResult.battleId === battleId
      ? lastBattleResult
      : null;
  
  // State for showing result screen after replay ends
  const [showResultScreen, setShowResultScreen] = useState(false);
  
  // Refs to prevent infinite loops
  const loadedBattleIdRef = useRef<string | null>(null);
  const matchmakingResetRef = useRef(false);
  
  // Store state and actions - use selectors to prevent unnecessary re-renders
  const currentBattle = useBattleStore(state => state.currentBattle);
  const storeLoading = useBattleStore(state => state.loading);
  const storeError = useBattleStore(state => state.error);
  const loadBattle = useBattleStore(state => state.loadBattle);
  const resetMatchmaking = useMatchmakingStore(state => state.reset);
  const player = usePlayerStore(state => state.player);

  // Derive battle from store if it matches the current battleId
  const battle = currentBattle?.id === battleId ? currentBattle : null;
  
  // Derive loading state - loading if store is loading or if we haven't loaded this battle yet
  const loading = storeLoading || (loadedBattleIdRef.current !== battleId && !battle);
  
  // Derive error state from store
  const error = storeError && loadedBattleIdRef.current === battleId ? storeError : null;

  /**
   * Handle navigation back from replay.
   * For roguelike mode: show result screen first, then navigate to draft/shop.
   * For regular mode: navigate to battle history.
   */
  const handleBack = useCallback(() => {
    if (fromRoguelike && runId && roguelikeResult) {
      // Show result screen for roguelike mode
      setShowResultScreen(true);
    } else {
      // Navigate to battle history for regular mode
      router.push('/history');
    }
  }, [fromRoguelike, runId, roguelikeResult, router]);

  /**
   * Handle continue after viewing result screen.
   * Navigates to shop (if run active) or result page (if run complete).
   * Clears the stored battle result after navigation.
   */
  const handleContinue = useCallback(() => {
    if (!runId || !roguelikeResult) return;
    
    // Clear the stored result before navigating
    clearLastBattleResult();
    
    if (roguelikeResult.runStatus === 'active') {
      router.push(`/run/${runId}/shop`);
    } else {
      router.push(`/run/${runId}/result`);
    }
  }, [runId, roguelikeResult, router, clearLastBattleResult]);

  /**
   * Load battle data from API - only once per battleId.
   */
  useEffect(() => {
    // Skip if no battleId
    if (!battleId) {
      return;
    }
    
    // Skip if already loaded this battle successfully
    if (loadedBattleIdRef.current === battleId && battle) {
      return;
    }
    
    // Skip if currently loading
    if (storeLoading) {
      return;
    }

    const fetchBattle = async () => {
      loadedBattleIdRef.current = battleId;
      await loadBattle(battleId);
    };

    fetchBattle();
  }, [battleId, loadBattle, battle, storeLoading]);
  
  /**
   * Clear matchmaking state when viewing battle replay to prevent redirect loops.
   * Only run once on mount.
   */
  useEffect(() => {
    if (!matchmakingResetRef.current) {
      matchmakingResetRef.current = true;
      resetMatchmaking();
    }
  }, [resetMatchmaking]);

  /**
   * Navigate back to battle history.
   */
  const handleBackToHistory = () => {
    router.push('/history');
  };

  /**
   * Retry loading battle data.
   */
  const handleRetry = useCallback(() => {
    // Reset the loaded ref to allow re-fetching
    loadedBattleIdRef.current = null;
    
    // Clear store error and trigger reload
    useBattleStore.getState().clearError();
    
    const fetchBattle = async () => {
      loadedBattleIdRef.current = battleId;
      await loadBattle(battleId);
    };

    fetchBattle();
  }, [battleId, loadBattle]);

  // Loading state
  if (loading) {
    return <FullPageLoader message="Загрузка боя..." icon="⚔️" />;
  }

  // Error state - for roguelike mode, show result screen instead of error
  if (error) {
    // If we have roguelike result data, show result screen instead of error
    if (fromRoguelike && roguelikeResult) {
      return (
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          
          <NavigationWrapper>
            <div className="max-w-2xl mx-auto p-6 text-center">
              <div className="text-8xl mb-4">
                {roguelikeResult.result === 'win' ? '🏆' : '💀'}
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${
                roguelikeResult.result === 'win' ? 'text-green-400' : 'text-red-400'
              }`}>
                {roguelikeResult.result === 'win' ? 'Победа!' : 'Поражение'}
              </h2>
              
              <p className="text-gray-500 text-sm mb-4">
                (Реплей недоступен)
              </p>

              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Золото заработано:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    +{roguelikeResult.goldEarned} 🪙
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Всего золота:</span>
                  <span className="text-xl font-bold text-yellow-300">
                    {roguelikeResult.newGold} 🪙
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Рейтинг:</span>
                  <span className={`text-lg font-bold ${
                    roguelikeResult.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {roguelikeResult.ratingChange >= 0 ? '+' : ''}{roguelikeResult.ratingChange} ({roguelikeResult.newRating})
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400">Счёт:</span>
                  <span className="text-lg font-bold">
                    <span className="text-green-400">{roguelikeResult.wins}</span>
                    {' / '}
                    <span className="text-red-400">{roguelikeResult.losses}</span>
                  </span>
                </div>
              </div>

              {roguelikeResult.runComplete && (
                <div className={`mb-6 p-4 rounded-lg ${
                  roguelikeResult.runStatus === 'won' 
                    ? 'bg-green-900/30 border border-green-500' 
                    : 'bg-red-900/30 border border-red-500'
                }`}>
                  <div className="text-2xl mb-2">
                    {roguelikeResult.runStatus === 'won' ? '🎉' : '😢'}
                  </div>
                  <div className="font-bold">
                    {roguelikeResult.runStatus === 'won' 
                      ? 'Забег завершён победой!' 
                      : 'Забег завершён'}
                  </div>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-lg"
              >
                {roguelikeResult.runComplete 
                  ? 'Посмотреть результаты' 
                  : 'Продолжить →'}
              </button>
            </div>
          </NavigationWrapper>
        </div>
      );
    }
    
    // Regular error display for non-roguelike mode
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        
        <NavigationWrapper>
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">⚔️ Бой #{battleId}</h1>
              <p className="text-gray-400">Ошибка загрузки боя</p>
            </div>
            
            {/* Error display */}
            <div className="mb-6">
              {error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch') ? (
                <NetworkError
                  message={error}
                  showRetry
                  onRetry={handleRetry}
                />
              ) : (
                <ErrorMessage
                  message={error}
                  severity="error"
                  showRetry
                  onRetry={handleRetry}
                />
              )}
            </div>
            
            {/* Back button */}
            <div className="text-center">
              <button
                onClick={handleBackToHistory}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                ← Назад к истории боев
              </button>
            </div>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Battle not found - for roguelike mode, show result screen instead
  if (!battle) {
    // If we have roguelike result data, show result screen
    if (fromRoguelike && roguelikeResult) {
      return (
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          
          <NavigationWrapper>
            <div className="max-w-2xl mx-auto p-6 text-center">
              <div className="text-8xl mb-4">
                {roguelikeResult.result === 'win' ? '🏆' : '💀'}
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${
                roguelikeResult.result === 'win' ? 'text-green-400' : 'text-red-400'
              }`}>
                {roguelikeResult.result === 'win' ? 'Победа!' : 'Поражение'}
              </h2>
              
              <p className="text-gray-500 text-sm mb-4">
                (Реплей недоступен)
              </p>

              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Золото заработано:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    +{roguelikeResult.goldEarned} 🪙
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Всего золота:</span>
                  <span className="text-xl font-bold text-yellow-300">
                    {roguelikeResult.newGold} 🪙
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Рейтинг:</span>
                  <span className={`text-lg font-bold ${
                    roguelikeResult.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {roguelikeResult.ratingChange >= 0 ? '+' : ''}{roguelikeResult.ratingChange} ({roguelikeResult.newRating})
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400">Счёт:</span>
                  <span className="text-lg font-bold">
                    <span className="text-green-400">{roguelikeResult.wins}</span>
                    {' / '}
                    <span className="text-red-400">{roguelikeResult.losses}</span>
                  </span>
                </div>
              </div>

              {roguelikeResult.runComplete && (
                <div className={`mb-6 p-4 rounded-lg ${
                  roguelikeResult.runStatus === 'won' 
                    ? 'bg-green-900/30 border border-green-500' 
                    : 'bg-red-900/30 border border-red-500'
                }`}>
                  <div className="text-2xl mb-2">
                    {roguelikeResult.runStatus === 'won' ? '🎉' : '😢'}
                  </div>
                  <div className="font-bold">
                    {roguelikeResult.runStatus === 'won' 
                      ? 'Забег завершён победой!' 
                      : 'Забег завершён'}
                  </div>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-lg"
              >
                {roguelikeResult.runComplete 
                  ? 'Посмотреть результаты' 
                  : 'Продолжить →'}
              </button>
            </div>
          </NavigationWrapper>
        </div>
      );
    }
    
    // Regular "not found" display for non-roguelike mode
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        
        <NavigationWrapper>
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">⚔️ Бой #{battleId}</h1>
              <p className="text-gray-400">Бой не найден</p>
            </div>
            
            <div className="text-center py-16">
              <div className="text-8xl mb-4">❓</div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">
                Бой не найден
              </h3>
              <p className="text-gray-500 mb-8">
                Возможно, бой был удален или ID указан неверно
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleBackToHistory}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  ← Назад к истории боев
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  🔄 Попробовать снова
                </button>
              </div>
            </div>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Roguelike result screen (shown after replay ends)
  if (showResultScreen && roguelikeResult) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center">
            <div className="text-8xl mb-4">
              {roguelikeResult.result === 'win' ? '🏆' : '💀'}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${
              roguelikeResult.result === 'win' ? 'text-green-400' : 'text-red-400'
            }`}>
              {roguelikeResult.result === 'win' ? 'Победа!' : 'Поражение'}
            </h2>

            <div className="bg-gray-800/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
              <div className="flex items-center justify-between py-3 border-b border-gray-700">
                <span className="text-gray-400">Золото заработано:</span>
                <span className="text-2xl font-bold text-yellow-400">
                  +{roguelikeResult.goldEarned} 🪙
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700">
                <span className="text-gray-400">Всего золота:</span>
                <span className="text-xl font-bold text-yellow-300">
                  {roguelikeResult.newGold} 🪙
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700">
                <span className="text-gray-400">Рейтинг:</span>
                <span className={`text-lg font-bold ${
                  roguelikeResult.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {roguelikeResult.ratingChange >= 0 ? '+' : ''}{roguelikeResult.ratingChange} ({roguelikeResult.newRating})
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400">Счёт:</span>
                <span className="text-lg font-bold">
                  <span className="text-green-400">{roguelikeResult.wins}</span>
                  {' / '}
                  <span className="text-red-400">{roguelikeResult.losses}</span>
                </span>
              </div>
            </div>

            {roguelikeResult.runComplete && (
              <div className={`mb-6 p-4 rounded-lg ${
                roguelikeResult.runStatus === 'won' 
                  ? 'bg-green-900/30 border border-green-500' 
                  : 'bg-red-900/30 border border-red-500'
              }`}>
                <div className="text-2xl mb-2">
                  {roguelikeResult.runStatus === 'won' ? '🎉' : '😢'}
                </div>
                <div className="font-bold">
                  {roguelikeResult.runStatus === 'won' 
                    ? 'Забег завершён победой!' 
                    : 'Забег завершён'}
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-lg"
            >
              {roguelikeResult.runComplete 
                ? 'Посмотреть результаты' 
                : 'Продолжить →'}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Success state - show battle replay
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <NavigationWrapper>
        {/* Battle Replay Component - no wrapper, full width */}
        <BattleReplay battle={battle} playerId={player?.id} onBack={handleBack} />
      </NavigationWrapper>
    </div>
  );
}