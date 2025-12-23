/**
 * BattleResult component for Fantasy Autobattler.
 * Displays battle outcome with statistics and action buttons.
 * 
 * @fileoverview Complete battle result screen with victory/defeat display and detailed statistics.
 */

'use client';

import { useState, useEffect } from 'react';
import { BattleLog } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Battle statistics calculated from events.
 */
interface BattleStatistics {
  /** Total damage dealt by player */
  playerDamageDealt: number;
  /** Total damage received by player */
  playerDamageReceived: number;
  /** Number of player units lost */
  playerUnitsLost: number;
  /** Total damage dealt by opponent */
  opponentDamageDealt: number;
  /** Total damage received by opponent */
  opponentDamageReceived: number;
  /** Number of opponent units lost */
  opponentUnitsLost: number;
  /** Total battle rounds */
  totalRounds: number;
  /** Battle duration estimate */
  battleDuration: string;
}

/**
 * Rating change information.
 */
interface RatingChange {
  /** Previous rating */
  oldRating: number;
  /** New rating after battle */
  newRating: number;
  /** Rating change amount (can be negative) */
  change: number;
}

/**
 * BattleResult component props.
 */
interface BattleResultProps {
  /** Battle log data */
  battle: BattleLog;
  /** Current player ID */
  playerId: string;
  /** Rating change information */
  ratingChange?: RatingChange;
  /** Callback when user wants to watch replay */
  onWatchReplay: () => void;
  /** Callback when user wants to start new battle */
  onNewBattle: () => void;
  /** Callback when user wants to edit team */
  onEditTeam: () => void;
  /** Whether to show the result (for animation) */
  show?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================



/** Default rating change if not provided */
const DEFAULT_RATING_CHANGE: RatingChange = {
  oldRating: 1200,
  newRating: 1200,
  change: 0,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate battle statistics from battle events.
 * Uses Sets to track unique deaths and avoid double-counting.
 * 
 * @param battle - Battle log data
 * @param playerId - Current player ID
 * @returns Calculated battle statistics
 * @example
 * const stats = calculateBattleStatistics(battleLog, 'player-123');
 */
function calculateBattleStatistics(battle: BattleLog, playerId: string): BattleStatistics {
  const events = battle.events || [];
  
  // Determine if current player is player1 or player2
  // If playerId doesn't match either, default to player1 perspective
  const isPlayer1 = battle.player1Id === playerId || battle.player2Id !== playerId;
  
  // Debug: Log player identification
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[BattleResult] Player identification:', {
      playerId,
      player1Id: battle.player1Id,
      player2Id: battle.player2Id,
      isPlayer1,
      matchesPlayer1: battle.player1Id === playerId,
      matchesPlayer2: battle.player2Id === playerId,
    });
  }
  
  let playerDamageDealt = 0;
  let playerDamageReceived = 0;
  let playerUnitsLost = 0;
  let opponentDamageDealt = 0;
  let opponentDamageReceived = 0;
  let opponentUnitsLost = 0;
  let maxRound = 0;
  
  // Get unit team mappings based on instanceId patterns from battle simulator
  // Backend generates: player_${unitId}_${index} for player1, bot_${unitId}_${index} for player2
  const playerUnits = new Set<string>();
  const opponentUnits = new Set<string>();
  
  // Map player1 team units (always have 'player_' prefix in instanceId)
  if (battle.player1TeamSnapshot?.units) {
    // Debug: Log team snapshot structure
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[BattleResult] player1TeamSnapshot:', {
        units: battle.player1TeamSnapshot.units.map((u, i) => ({
          index: i,
          id: u.id,
          name: u.name,
          generatedInstanceId: `player_${u.id}_${i}`,
        })),
      });
    }
    
    battle.player1TeamSnapshot.units.forEach((unit, index) => {
      const instanceId = `player_${unit.id}_${index}`;
      if (isPlayer1) {
        playerUnits.add(instanceId);
      } else {
        opponentUnits.add(instanceId);
      }
    });
  }
  
  // Map player2 team units (always have 'bot_' prefix in instanceId)
  if (battle.player2TeamSnapshot?.units) {
    battle.player2TeamSnapshot.units.forEach((unit, index) => {
      const instanceId = `bot_${unit.id}_${index}`;
      if (isPlayer1) {
        opponentUnits.add(instanceId);
      } else {
        playerUnits.add(instanceId);
      }
    });
  }
  
  // Use Sets to track unique deaths (avoid double counting from death + ability events)
  const playerDeaths = new Set<string>();
  const opponentDeaths = new Set<string>();
  
  // Debug: Log unit mappings
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[BattleResult] Unit mappings:', {
      playerUnits: Array.from(playerUnits),
      opponentUnits: Array.from(opponentUnits),
    });
  }
  
  // Process events to calculate statistics
  events.forEach(event => {
    maxRound = Math.max(maxRound, event.round);
    
    // Count damage from regular attacks
    if (event.type === 'damage' && event.damage && event.targetId) {
      if (playerUnits.has(event.targetId)) {
        playerDamageReceived += event.damage;
        opponentDamageDealt += event.damage;
      } else if (opponentUnits.has(event.targetId)) {
        opponentDamageReceived += event.damage;
        playerDamageDealt += event.damage;
      }
    }
    
    // Count damage from abilities
    if (event.type === 'ability' && event.totalDamage) {
      // Determine who cast the ability based on actorId
      const isPlayerAbility = playerUnits.has(event.actorId);
      if (isPlayerAbility) {
        playerDamageDealt += event.totalDamage;
        opponentDamageReceived += event.totalDamage;
      } else {
        opponentDamageDealt += event.totalDamage;
        playerDamageReceived += event.totalDamage;
      }
    }
    
    // Count deaths ONLY from death events (not from ability events)
    // Death events are the authoritative source for unit deaths
    // Ability events may also have killedUnits but those deaths will have
    // corresponding death events, so we only count from death events
    if (event.type === 'death') {
      // Death events have killedUnits array with the dead unit's instanceId
      // Fallback to actorId if killedUnits is empty (for backward compatibility)
      const killedIds = (event.killedUnits && event.killedUnits.length > 0) 
        ? event.killedUnits 
        : (event.actorId ? [event.actorId] : []);
      
      // Debug: Log death event
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[BattleResult] Death event:', {
          killedIds,
          actorId: event.actorId,
          killedUnits: event.killedUnits,
          isPlayerUnit: killedIds.map(id => playerUnits.has(id)),
          isOpponentUnit: killedIds.map(id => opponentUnits.has(id)),
        });
      }
      
      killedIds.forEach(killedId => {
        if (playerUnits.has(killedId)) {
          playerDeaths.add(killedId);
        } else if (opponentUnits.has(killedId)) {
          opponentDeaths.add(killedId);
        } else if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          // Debug: Log unmatched death
          // eslint-disable-next-line no-console
          console.warn('[BattleResult] Death event for unknown unit:', {
            killedId,
            playerUnitsArray: Array.from(playerUnits),
            opponentUnitsArray: Array.from(opponentUnits),
          });
        }
      });
    }
    
    // Also count deaths from ability events (abilities can kill units)
    // Using Set ensures no double-counting if both death and ability events exist
    if (event.type === 'ability' && event.killedUnits && event.killedUnits.length > 0) {
      event.killedUnits.forEach(killedId => {
        if (playerUnits.has(killedId)) {
          playerDeaths.add(killedId);
        } else if (opponentUnits.has(killedId)) {
          opponentDeaths.add(killedId);
        }
      });
    }
  });
  
  // Get final death counts from Sets
  playerUnitsLost = playerDeaths.size;
  opponentUnitsLost = opponentDeaths.size;
  
  // Debug: Log final death counts
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[BattleResult] Final death counts:', {
      playerDeaths: Array.from(playerDeaths),
      opponentDeaths: Array.from(opponentDeaths),
      playerUnitsLost,
      opponentUnitsLost,
    });
  }
  
  // Estimate battle duration (assuming 3 seconds per round)
  const estimatedSeconds = maxRound * 3;
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;
  const battleDuration = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
  
  return {
    playerDamageDealt,
    playerDamageReceived,
    playerUnitsLost,
    opponentDamageDealt,
    opponentDamageReceived,
    opponentUnitsLost,
    totalRounds: maxRound,
    battleDuration,
  };
}

/**
 * Determine battle outcome for the player.
 * 
 * @param battle - Battle log data
 * @param playerId - Current player ID
 * @returns Battle outcome from player perspective
 * @example
 * const outcome = getBattleOutcome(battleLog, 'player-123');
 */
function getBattleOutcome(battle: BattleLog, playerId: string): 'victory' | 'defeat' | 'draw' {
  if (!battle.winner) return 'draw';
  
  const isPlayer1 = battle.player1Id === playerId;
  
  if (battle.winner === 'draw') return 'draw';
  if (battle.winner === 'player1' && isPlayer1) return 'victory';
  if (battle.winner === 'player2' && !isPlayer1) return 'victory';
  
  return 'defeat';
}

/**
 * Get outcome display configuration.
 * 
 * @param outcome - Battle outcome
 * @returns Display configuration for the outcome
 * @example
 * const config = getOutcomeConfig('victory');
 */
function getOutcomeConfig(outcome: 'victory' | 'defeat' | 'draw'): {
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
} {
  switch (outcome) {
    case 'victory':
      return {
        title: 'Победа!',
        emoji: '🏆',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-400',
        glowColor: 'shadow-green-400/50',
      };
    case 'defeat':
      return {
        title: 'Поражение',
        emoji: '💀',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-400',
        glowColor: 'shadow-red-400/50',
      };
    case 'draw':
      return {
        title: 'Ничья',
        emoji: '🤝',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-400',
        glowColor: 'shadow-yellow-400/50',
      };
    default:
      return {
        title: 'Неизвестно',
        emoji: '❓',
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/20',
        borderColor: 'border-gray-400',
        glowColor: 'shadow-gray-400/50',
      };
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Statistics display component.
 */
function StatisticsPanel({ stats }: { stats: BattleStatistics }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        📊 Статистика боя
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Stats */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-blue-400 border-b border-blue-400/30 pb-1">
            Ваши показатели
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">⚔️ Урон нанесён:</span>
              <span className="text-orange-400 font-bold">{stats.playerDamageDealt}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🛡️ Урон получен:</span>
              <span className="text-red-400 font-bold">{stats.playerDamageReceived}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">💀 Юнитов потеряно:</span>
              <span className="text-red-400 font-bold">{stats.playerUnitsLost}</span>
            </div>
          </div>
        </div>
        
        {/* Opponent Stats */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-red-400 border-b border-red-400/30 pb-1">
            Противник
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">⚔️ Урон нанесён:</span>
              <span className="text-orange-400 font-bold">{stats.opponentDamageDealt}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🛡️ Урон получен:</span>
              <span className="text-red-400 font-bold">{stats.opponentDamageReceived}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">💀 Юнитов потеряно:</span>
              <span className="text-red-400 font-bold">{stats.opponentUnitsLost}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Battle Info */}
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">{stats.totalRounds}</div>
            <div className="text-sm text-gray-400">Раундов</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{stats.battleDuration}</div>
            <div className="text-sm text-gray-400">Длительность</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Rating change display component.
 */
function RatingPanel({ ratingChange }: { ratingChange: RatingChange }) {
  const isPositive = ratingChange.change > 0;
  const isNeutral = ratingChange.change === 0;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        🏅 Изменение рейтинга
      </h3>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{ratingChange.oldRating}</div>
            <div className="text-sm text-gray-500">Было</div>
          </div>
          
          <div className="text-3xl text-gray-500">→</div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{ratingChange.newRating}</div>
            <div className="text-sm text-gray-500">Стало</div>
          </div>
        </div>
        
        <div className={`
          text-3xl font-bold px-4 py-2 rounded-lg border-2
          ${isPositive 
            ? 'text-green-400 bg-green-900/20 border-green-400' 
            : isNeutral 
            ? 'text-gray-400 bg-gray-900/20 border-gray-400'
            : 'text-red-400 bg-red-900/20 border-red-400'
          }
        `}>
          {isPositive ? '+' : ''}{ratingChange.change}
        </div>
      </div>
    </div>
  );
}

/**
 * Action buttons component.
 */
function ActionButtons({ 
  onWatchReplay, 
  onNewBattle, 
  onEditTeam 
}: {
  onWatchReplay: () => void;
  onNewBattle: () => void;
  onEditTeam: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={onWatchReplay}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 justify-center"
      >
        🎬 Посмотреть повтор
      </button>
      
      <button
        onClick={onNewBattle}
        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 justify-center"
      >
        ⚔️ Новый бой
      </button>
      
      <button
        onClick={onEditTeam}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 justify-center"
      >
        ✏️ Изменить команду
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * BattleResult component for displaying battle outcome and statistics.
 * Shows victory/defeat status, detailed statistics, rating changes, and action buttons.
 * 
 * @param props - Component props
 * @returns Battle result component
 * @example
 * <BattleResult 
 *   battle={battleLog} 
 *   playerId="player-123"
 *   ratingChange={{ oldRating: 1200, newRating: 1215, change: 15 }}
 *   onWatchReplay={() => router.push(`/battle/${battleId}`)}
 *   onNewBattle={() => router.push('/matchmaking')}
 *   onEditTeam={() => router.push('/')}
 * />
 */
export function BattleResult({
  battle,
  playerId,
  ratingChange = DEFAULT_RATING_CHANGE,
  onWatchReplay,
  onNewBattle,
  onEditTeam,
  show = true,
}: BattleResultProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'hidden' | 'entering' | 'visible'>('hidden');
  
  // Calculate battle statistics and outcome
  const statistics = calculateBattleStatistics(battle, playerId);
  const outcome = getBattleOutcome(battle, playerId);
  const outcomeConfig = getOutcomeConfig(outcome);
  
  // Handle animation entrance
  useEffect(() => {
    if (show) {
      setAnimationPhase('entering');
      const timer = setTimeout(() => {
        setIsVisible(true);
        setAnimationPhase('visible');
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setAnimationPhase('hidden');
      return undefined;
    }
  }, [show]);
  
  if (!show && animationPhase === 'hidden') {
    return null;
  }
  
  return (
    <div className={`
      fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50
      transition-opacity duration-500
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className={`
        max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl border-2 p-8
        transition-all duration-800 ease-out
        ${outcomeConfig.borderColor} ${outcomeConfig.glowColor}
        ${animationPhase === 'entering' 
          ? 'scale-75 opacity-0 translate-y-8' 
          : 'scale-100 opacity-100 translate-y-0'
        }
        shadow-2xl
      `}>
        {/* Header with outcome */}
        <div className={`
          text-center mb-8 p-6 rounded-lg border-2
          ${outcomeConfig.bgColor} ${outcomeConfig.borderColor}
        `}>
          <div className="text-8xl mb-4 animate-bounce">
            {outcomeConfig.emoji}
          </div>
          <h1 className={`text-5xl font-bold mb-2 ${outcomeConfig.color}`}>
            {outcomeConfig.title}
          </h1>
          <p className="text-gray-300 text-lg">
            Бой завершён за {statistics.totalRounds} {statistics.totalRounds === 1 ? 'раунд' : 'раундов'}
          </p>
        </div>
        
        {/* Statistics and Rating */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <StatisticsPanel stats={statistics} />
          </div>
          <div>
            <RatingPanel ratingChange={ratingChange} />
          </div>
        </div>
        
        {/* Action Buttons */}
        <ActionButtons 
          onWatchReplay={onWatchReplay}
          onNewBattle={onNewBattle}
          onEditTeam={onEditTeam}
        />
      </div>
    </div>
  );
}