/**
 * BattleReplay component for Fantasy Autobattler.
 * Displays battle replay with step-by-step visualization on 8×10 grid.
 * 
 * @fileoverview Complete battle replay system with animations, controls, and event log.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BattleLog, BattleEvent, Position, UnitTemplate, UNIT_INFO, UnitId } from '@/types/game';
import { 
  MoveAnimation, 
  AttackAnimation, 
  DamageNumber, 
  DeathAnimation, 
  HealAnimation 
} from './BattleAnimations';
import { BattleResult } from './BattleResult';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Battle unit state for replay visualization.
 */
interface ReplayUnit {
  /** Unit instance ID */
  instanceId: string;
  /** Unit template data */
  template: UnitTemplate;
  /** Current position */
  position: Position;
  /** Current HP */
  currentHp: number;
  /** Maximum HP */
  maxHp: number;
  /** Team affiliation */
  team: 'player1' | 'player2';
  /** Whether unit is alive */
  alive: boolean;
  /** Animation state */
  animation?: {
    type: 'move' | 'attack' | 'damage' | 'death';
    fromPosition?: Position;
    toPosition?: Position;
    targetId?: string;
    damage?: number;
  };
}

/**
 * Replay playback speed options.
 */
type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/**
 * Replay control state.
 */
interface ReplayState {
  /** Current event index */
  currentEventIndex: number;
  /** Whether replay is playing */
  isPlaying: boolean;
  /** Playback speed multiplier */
  speed: PlaybackSpeed;
  /** Current round number */
  currentRound: number;
}

/**
 * BattleReplay component props.
 */
interface BattleReplayProps {
  /** Battle log data for replay */
  battle: BattleLog;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Grid dimensions */
const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;

/** Base animation duration in milliseconds */
const BASE_ANIMATION_DURATION = 1000;

/** Event type display names */
const EVENT_TYPE_NAMES: Record<string, string> = {
  move: '🚶 Движение',
  attack: '⚔️ Атака',
  damage: '💥 Урон',
  death: '💀 Смерть',
  heal: '💚 Лечение',
  ability: '✨ Способность',
  round_start: '🔄 Начало раунда',
  battle_end: '🏁 Конец боя',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get player display name from battle log.
 * Uses player1Name/player2Name if available, otherwise falls back to generic names.
 * 
 * @param battle - Battle log data
 * @param player - Player identifier ('player1' or 'player2')
 * @returns Display name for the player
 */
function getPlayerName(battle: BattleLog, player: 'player1' | 'player2'): string {
  if (player === 'player1') {
    return (battle as BattleLog & { player1Name?: string }).player1Name || 'Игрок 1';
  } else {
    return (battle as BattleLog & { player2Name?: string }).player2Name || 'Игрок 2';
  }
}

/**
 * Get winner display name from battle log.
 * 
 * @param battle - Battle log data
 * @returns Winner display name or 'Ничья'
 */
function getWinnerName(battle: BattleLog): string {
  if (!battle.winner) return 'Неизвестно';
  
  if (battle.winner === 'draw') return 'Ничья';
  
  if (battle.winner === 'player1') {
    return getPlayerName(battle, 'player1');
  } else {
    return getPlayerName(battle, 'player2');
  }
}

/**
 * Get unit display name from instanceId.
 * Converts instanceId like "player_knight_0" to "Knight".
 * 
 * @param instanceId - Unit instance identifier
 * @param units - Available unit templates
 * @returns Human-readable unit name
 */
function getUnitDisplayName(instanceId: string, units: ReplayUnit[]): string {
  const unit = units.find(u => u.instanceId === instanceId);
  if (unit) {
    return unit.template.name;
  }
  
  // Fallback: extract unit type from instanceId
  const parts = instanceId.split('_');
  if (parts.length >= 2) {
    const unitId = parts[1] as UnitId;
    const unitInfo = UNIT_INFO[unitId];
    if (unitInfo && unitId) {
      return unitId.charAt(0).toUpperCase() + unitId.slice(1);
    }
  }
  
  return instanceId;
}

/**
 * Extract initial unit states from battle log.
 * Handles TeamSetup structure from backend with UnitTemplate[] and Position[].
 * 
 * @param battle - Battle log data
 * @returns Array of initial unit states
 */
function extractInitialUnits(battle: BattleLog): ReplayUnit[] {
  const units: ReplayUnit[] = [];
  
  try {
    // Extract player1 team (TeamSetup structure: { units: UnitTemplate[], positions: Position[] })
    if (battle.player1TeamSnapshot?.units && battle.player1TeamSnapshot?.positions) {
      const team1 = battle.player1TeamSnapshot;
      
      // Ensure arrays have same length
      const unitCount = Math.min(team1.units.length, team1.positions.length);
      
      for (let i = 0; i < unitCount; i++) {
        const unitTemplate = team1.units[i];
        const position = team1.positions[i];
        
        if (unitTemplate?.id && position) {
          // Generate instanceId that matches battle events: ${teamType}_${unitTemplate.id}_${index}
          const instanceId = `player_${unitTemplate.id}_${i}`;
          
          units.push({
            instanceId,
            template: unitTemplate,
            position: position,
            currentHp: unitTemplate.stats.hp,
            maxHp: unitTemplate.stats.hp,
            team: 'player1',
            alive: true,
          });
        }
      }
    }
    
    // Extract player2 team (TeamSetup structure: { units: UnitTemplate[], positions: Position[] })
    if (battle.player2TeamSnapshot?.units && battle.player2TeamSnapshot?.positions) {
      const team2 = battle.player2TeamSnapshot;
      
      // Ensure arrays have same length
      const unitCount = Math.min(team2.units.length, team2.positions.length);
      
      for (let i = 0; i < unitCount; i++) {
        const unitTemplate = team2.units[i];
        const position = team2.positions[i];
        
        if (unitTemplate?.id && position) {
          // Generate instanceId that matches battle events: ${teamType}_${unitTemplate.id}_${index}
          const instanceId = `bot_${unitTemplate.id}_${i}`;
          
          units.push({
            instanceId,
            template: unitTemplate,
            position: position,
            currentHp: unitTemplate.stats.hp,
            maxHp: unitTemplate.stats.hp,
            team: 'player2',
            alive: true,
          });
        }
      }
    }
  } catch (error) {
    // Error will be visible in debug panel below
  }
  
  return units;
}

/**
 * Apply battle event to unit states.
 * 
 * @param units - Current unit states
 * @param event - Battle event to apply
 * @returns Updated unit states
 */
function applyEventToUnits(units: ReplayUnit[], event: BattleEvent): ReplayUnit[] {
  return units.map(unit => {
    const updatedUnit = { ...unit };
    
    // Clear previous animations
    delete updatedUnit.animation;
    
    // Apply event effects
    switch (event.type) {
      case 'move':
        if (event.actorId === unit.instanceId && event.toPosition) {
          updatedUnit.animation = {
            type: 'move',
            fromPosition: unit.position,
            toPosition: event.toPosition,
          };
          updatedUnit.position = event.toPosition;
        }
        break;
        
      case 'attack':
        if (event.actorId === unit.instanceId && event.targetId) {
          updatedUnit.animation = {
            type: 'attack',
            targetId: event.targetId,
          };
        }
        break;
        
      case 'damage':
        if (event.targetId === unit.instanceId && event.damage) {
          updatedUnit.currentHp = Math.max(0, unit.currentHp - event.damage);
          updatedUnit.animation = {
            type: 'damage',
            damage: event.damage,
          };
        }
        break;
        
      case 'death':
        if (event.targetId === unit.instanceId || event.killedUnits?.includes(unit.instanceId)) {
          updatedUnit.alive = false;
          updatedUnit.currentHp = 0;
          updatedUnit.animation = {
            type: 'death',
          };
        }
        break;
    }
    
    return updatedUnit;
  });
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Grid cell component for battle replay with unit interaction.
 */
function ReplayGridCell({ 
  position, 
  unit, 
  onClick,
  onUnitClick,
  isMovementSource = false,
  isMovementTarget = false,
  movementPath = []
}: { 
  position: Position; 
  unit?: ReplayUnit; 
  onClick?: () => void;
  onUnitClick?: (unit: ReplayUnit, event: React.MouseEvent) => void;
  isMovementSource?: boolean;
  isMovementTarget?: boolean;
  movementPath?: Position[];
}) {
  const isPlayerZone = position.y <= 1;
  const isEnemyZone = position.y >= 8;
  const isOnMovementPath = movementPath.some(p => p.x === position.x && p.y === position.y);
  
  const cellClasses = [
    'relative w-12 h-12 border border-gray-600 transition-all duration-300',
    isPlayerZone ? 'bg-blue-900/20' : isEnemyZone ? 'bg-red-900/20' : 'bg-gray-800/50',
    onClick ? 'cursor-pointer hover:bg-white/10' : '',
    isMovementSource ? 'bg-yellow-500/30 border-yellow-400' : '',
    isMovementTarget ? 'bg-green-500/30 border-green-400' : '',
    isOnMovementPath ? 'bg-yellow-400/20 border-yellow-300' : '',
  ].join(' ');

  /**
   * Handle cell click - prioritize unit click over cell click.
   */
  const handleCellClick = (event: React.MouseEvent) => {
    if (unit && onUnitClick) {
      event.stopPropagation();
      onUnitClick(unit, event);
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <div className={cellClasses} onClick={handleCellClick}>
      {/* Grid coordinates */}
      <div className="absolute top-0 left-0 text-xs text-gray-500 leading-none">
        {position.x},{position.y}
      </div>
      
      {/* Movement indicators */}
      {isMovementSource && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-yellow-400 text-2xl animate-pulse">📍</div>
        </div>
      )}
      
      {isMovementTarget && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-green-400 text-2xl animate-bounce">🎯</div>
        </div>
      )}
      
      {/* Unit display */}
      {unit && (
        <div className={`
          absolute inset-1 rounded flex items-center justify-center text-lg font-bold cursor-pointer
          ${unit.team === 'player1' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'}
          ${!unit.alive ? 'opacity-30 grayscale' : ''}
          ${unit.animation?.type === 'damage' ? 'animate-pulse bg-red-400' : ''}
          ${unit.animation?.type === 'death' ? 'animate-bounce opacity-50' : ''}
          ${unit.animation?.type === 'move' ? 'ring-2 ring-yellow-400 ring-opacity-75 animate-pulse scale-110' : ''}
          ${unit.animation?.type === 'attack' ? 'animate-ping bg-orange-500' : ''}
          transition-all duration-300 hover:scale-110
        `}
        title={`${unit.template.name} - Click for details`}
        >
          {UNIT_INFO[unit.template.id]?.emoji || '❓'}
          
          {/* HP bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-b transition-all duration-500"
              style={{ width: `${(unit.currentHp / unit.maxHp) * 100}%` }}
            />
          </div>
          
          {/* Damage indicator */}
          {unit.animation?.type === 'damage' && unit.animation.damage && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-red-400 font-bold text-sm animate-bounce bg-black/50 px-1 rounded">
              -{unit.animation.damage}
            </div>
          )}
          
          {/* Movement indicator */}
          {unit.animation?.type === 'move' && unit.animation.fromPosition && unit.animation.toPosition && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-xs animate-pulse bg-black/50 px-1 rounded">
              ({unit.animation.fromPosition.x},{unit.animation.fromPosition.y}) → ({unit.animation.toPosition.x},{unit.animation.toPosition.y})
            </div>
          )}
          
          {/* Attack indicator */}
          {unit.animation?.type === 'attack' && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-orange-400 font-bold animate-bounce">
              ⚔️
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Turn order bar component with enhanced unit display.
 */
function TurnOrderBar({ 
  units, 
  currentRound, 
  currentEventIndex, 
  events,
  battle
}: { 
  units: ReplayUnit[]; 
  currentRound: number;
  currentEventIndex: number;
  events: BattleEvent[];
  battle: BattleLog;
}) {
  const [selectedUnit, setSelectedUnit] = useState<ReplayUnit | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  
  const aliveUnits = units.filter(unit => unit.alive);
  
  // Determine current active unit based on current event
  const currentEvent = events[currentEventIndex];
  const activeUnitId = currentEvent?.actorId;
  
  /**
   * Handle unit click to show tooltip with stats.
   */
  const handleUnitClick = useCallback((unit: ReplayUnit, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedUnit(unit);
  }, []);
  
  /**
   * Close tooltip when clicking outside.
   */
  const handleCloseTooltip = useCallback(() => {
    setSelectedUnit(null);
    setTooltipPosition(null);
  }, []);
  
  // Close tooltip on outside click
  useEffect(() => {
    const handleClickOutside = () => handleCloseTooltip();
    if (selectedUnit) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [selectedUnit, handleCloseTooltip]);
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Раунд {currentRound}</h3>
        <div className="text-sm text-gray-400">
          Живых юнитов: {aliveUnits.length}
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {aliveUnits
          .sort((a, b) => b.template.stats.initiative - a.template.stats.initiative)
          .map(unit => {
            const isActive = unit.instanceId === activeUnitId;
            const hpPercent = (unit.currentHp / unit.maxHp) * 100;
            
            return (
              <div
                key={unit.instanceId}
                className={`
                  flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105
                  ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnitClick(unit, e);
                }}
                title={`${unit.template.name} - Click for stats`}
              >
                {/* Unit icon - increased to 48x48px */}
                <div
                  className={`
                    w-12 h-12 rounded-lg border-2 flex items-center justify-center relative
                    ${unit.team === 'player1' ? 'border-blue-400 bg-blue-600/20' : 'border-red-400 bg-red-600/20'}
                    ${isActive ? 'animate-pulse' : ''}
                  `}
                >
                  <span className="text-xl">{UNIT_INFO[unit.template.id]?.emoji || '❓'}</span>
                  
                  {/* Initiative indicator */}
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unit.template.stats.initiative}
                  </div>
                </div>
                
                {/* HP bar - 4px height */}
                <div className="w-12 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
                
                {/* HP text */}
                <div className="text-xs text-center text-gray-400 mt-1">
                  {unit.currentHp}/{unit.maxHp}
                </div>
              </div>
            );
          })}
      </div>
      
      {/* Unit stats tooltip */}
      {selectedUnit && tooltipPosition && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-sm">
            <div className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-lg">{UNIT_INFO[selectedUnit.template.id]?.emoji}</span>
              {selectedUnit.template.name}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">HP:</span>
                <span className="text-red-400 font-medium ml-1">
                  {selectedUnit.currentHp}/{selectedUnit.maxHp}
                </span>
              </div>
              <div>
                <span className="text-gray-400">ATK:</span>
                <span className="text-orange-400 font-medium ml-1">
                  {selectedUnit.template.stats.atk}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Armor:</span>
                <span className="text-blue-400 font-medium ml-1">
                  {selectedUnit.template.stats.armor}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Speed:</span>
                <span className="text-green-400 font-medium ml-1">
                  {selectedUnit.template.stats.speed}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Initiative:</span>
                <span className="text-yellow-400 font-medium ml-1">
                  {selectedUnit.template.stats.initiative}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Dodge:</span>
                <span className="text-purple-400 font-medium ml-1">
                  {selectedUnit.template.stats.dodge}%
                </span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                Team: <span className={selectedUnit.team === 'player1' ? 'text-blue-400' : 'text-red-400'}>
                  {selectedUnit.team === 'player1' ? getPlayerName(battle, 'player1') : getPlayerName(battle, 'player2')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Replay controls component.
 */
function ReplayControls({
  replayState,
  totalEvents,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onSpeedChange,
  onSeek,
  onSkipToStart,
  onSkipToEnd,
}: {
  replayState: ReplayState;
  totalEvents: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSeek: (eventIndex: number) => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
}) {
  const progress = totalEvents > 0 ? (Math.max(0, replayState.currentEventIndex + 1) / totalEvents) * 100 : 0;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {/* Skip to start */}
        <button
          onClick={onSkipToStart}
          disabled={replayState.currentEventIndex <= -1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="В начало (Home)"
        >
          ⏮️
        </button>

        {/* Step back */}
        <button
          onClick={onStepBack}
          disabled={replayState.currentEventIndex <= -1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="Шаг назад (←)"
        >
          ⏪
        </button>
        
        {/* Play/Pause */}
        <button
          onClick={replayState.isPlaying ? onPause : onPlay}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          title={replayState.isPlaying ? "Пауза (Пробел)" : "Играть (Пробел)"}
        >
          {replayState.isPlaying ? '⏸️ Пауза' : '▶️ Играть'}
        </button>
        
        {/* Step forward */}
        <button
          onClick={onStep}
          disabled={replayState.currentEventIndex >= totalEvents - 1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="Шаг вперед (→)"
        >
          ⏩
        </button>

        {/* Skip to end */}
        <button
          onClick={onSkipToEnd}
          disabled={replayState.currentEventIndex >= totalEvents - 1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="В конец (End)"
        >
          ⏭️
        </button>
        
        {/* Speed control */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-400">Скорость:</span>
          {[0.5, 1, 2, 4].map((speed, index) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed as PlaybackSpeed)}
              className={`
                px-3 py-1 rounded text-sm transition-colors relative
                ${replayState.speed === speed 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
              title={`Скорость ${speed}x (клавиша ${index + 1})`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Keyboard shortcuts help */}
        <div className="flex items-center gap-2 ml-4">
          <button
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
            title="Горячие клавиши: Пробел (играть/пауза), ← → (шаги), Home/End (начало/конец), 1-4 (скорость)"
          >
            ⌨️ Клавиши
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>
            Событие {Math.max(0, replayState.currentEventIndex + 1)} из {totalEvents}
            {replayState.currentEventIndex === -1 && (
              <span className="text-blue-400 ml-2">🏁 Начало</span>
            )}
            {replayState.currentEventIndex === totalEvents - 1 && totalEvents > 0 && (
              <span className="text-green-400 ml-2">🏁 Конец</span>
            )}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min="-1"
          max={totalEvents - 1}
          value={replayState.currentEventIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full mt-2 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider hover:h-4 transition-all duration-200"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`
          }}
          title={`Событие ${Math.max(0, replayState.currentEventIndex + 1)} из ${totalEvents}`}
        />
      </div>
    </div>
  );
}

/**
 * Enhanced event log component with color coding and readable names.
 */
function EventLog({ 
  events, 
  currentEventIndex,
  units
}: { 
  events: BattleEvent[]; 
  currentEventIndex: number;
  units: ReplayUnit[];
}) {
  /**
   * Get event color based on type.
   */
  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case 'damage':
        return 'text-red-400';
      case 'move':
        return 'text-blue-400';
      case 'heal':
        return 'text-green-400';
      case 'attack':
        return 'text-orange-400';
      case 'death':
        return 'text-purple-400';
      case 'ability':
        return 'text-yellow-400';
      case 'round_start':
        return 'text-cyan-400';
      case 'battle_end':
        return 'text-pink-400';
      default:
        return 'text-gray-400';
    }
  };

  /**
   * Get event border color based on type.
   */
  const getEventBorderColor = (eventType: string): string => {
    switch (eventType) {
      case 'damage':
        return 'border-red-500';
      case 'move':
        return 'border-blue-500';
      case 'heal':
        return 'border-green-500';
      case 'attack':
        return 'border-orange-500';
      case 'death':
        return 'border-purple-500';
      case 'ability':
        return 'border-yellow-500';
      case 'round_start':
        return 'border-cyan-500';
      case 'battle_end':
        return 'border-pink-500';
      default:
        return 'border-gray-500';
    }
  };

  /**
   * Format event description with unit names instead of IDs.
   */
  const formatEventDescription = (event: BattleEvent): string => {
    const actorName = event.actorId ? getUnitDisplayName(event.actorId, units) : '';
    const targetName = event.targetId ? getUnitDisplayName(event.targetId, units) : '';

    switch (event.type) {
      case 'attack':
        return `${actorName} атакует ${targetName}`;
      case 'damage':
        return `${targetName} получает ${event.damage} урона`;
      case 'heal':
        return `${targetName} восстанавливает ${event.healing} HP`;
      case 'move':
        return `${actorName} перемещается`;
      case 'death':
        return `${targetName} погибает`;
      case 'ability':
        return `${actorName} использует способность`;
      case 'round_start':
        return `Начинается раунд ${event.round}`;
      case 'battle_end':
        return 'Бой завершен';
      default:
        return EVENT_TYPE_NAMES[event.type] || event.type;
    }
  };

  // Group events by rounds
  const eventsByRound = events.slice(0, currentEventIndex + 1).reduce((acc, event, index) => {
    const round = event.round || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push({ event, index });
    return acc;
  }, {} as Record<number, Array<{ event: BattleEvent; index: number }>>);

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
      <h3 className="text-lg font-medium mb-3">Журнал событий</h3>
      
      <div className="space-y-3">
        {Object.entries(eventsByRound).map(([round, roundEvents]) => (
          <div key={round}>
            {/* Round separator */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-gray-600 flex-1" />
              <span className="text-xs text-gray-400 bg-gray-800 px-2">
                Раунд {round}
              </span>
              <div className="h-px bg-gray-600 flex-1" />
            </div>
            
            {/* Round events */}
            <div className="space-y-1 ml-2">
              {roundEvents.map(({ event, index }) => (
                <div
                  key={index}
                  className={`
                    text-sm p-2 rounded border-l-4 transition-all duration-200
                    ${index === currentEventIndex 
                      ? 'bg-blue-900/30 border-blue-400 ring-1 ring-blue-400/50' 
                      : `bg-gray-700/20 ${getEventBorderColor(event.type)}`
                    }
                  `}
                >
                  <div className={`font-medium ${getEventColor(event.type)}`}>
                    {formatEventDescription(event)}
                  </div>
                  
                  {/* Additional event details */}
                  <div className="mt-1 space-y-1">
                    {event.damage && (
                      <div className="text-red-300 text-xs">
                        💥 -{event.damage} HP
                      </div>
                    )}
                    
                    {event.healing && (
                      <div className="text-green-300 text-xs">
                        💚 +{event.healing} HP
                      </div>
                    )}
                    
                    {event.fromPosition && event.toPosition && (
                      <div className="text-blue-300 text-xs">
                        🚶 ({event.fromPosition.x},{event.fromPosition.y}) → ({event.toPosition.x},{event.toPosition.y})
                      </div>
                    )}
                    
                    {event.killedUnits && event.killedUnits.length > 0 && (
                      <div className="text-purple-300 text-xs">
                        💀 Погибли: {event.killedUnits.map(id => getUnitDisplayName(id, units)).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * BattleReplay component for displaying battle replays with full visualization.
 * Features 8×10 grid, step-by-step event playback, animations, and controls.
 * 
 * @param props - Component props
 * @returns Battle replay component
 * @example
 * <BattleReplay battle={battleLog} />
 */
export function BattleReplay({ battle }: BattleReplayProps) {
  // Safety check for required battle data - moved to top to avoid conditional hooks
  const isValidBattle = battle && battle.id;
  
  // Initialize units from battle log
  const initialUnits = useMemo(() => {
    if (!isValidBattle) return [];
    try {
      return extractInitialUnits(battle);
    } catch (error) {
      // Error will be visible in battle validation below
      return [];
    }
  }, [battle, isValidBattle]);
  
  // Replay state
  const [replayState, setReplayState] = useState<ReplayState>({
    currentEventIndex: -1,
    isPlaying: false,
    speed: 1,
    currentRound: 1,
  });
  
  // Battle result display state
  const [showBattleResult, setShowBattleResult] = useState(false);
  
  // Current unit states
  const [units, setUnits] = useState<ReplayUnit[]>(initialUnits);
  
  // Unit popup state
  const [selectedGridUnit, setSelectedGridUnit] = useState<{
    unit: ReplayUnit;
    position: { x: number; y: number };
  } | null>(null);
  
  // Active animations state
  const [activeAnimations, setActiveAnimations] = useState<{
    moves: Array<{ id: string; fromPosition: Position; toPosition: Position }>;
    attacks: Array<{ id: string; attackerPosition: Position; targetPosition: Position }>;
    damages: Array<{ id: string; damage: number; position: Position }>;
    deaths: Array<{ id: string; position: Position }>;
    heals: Array<{ id: string; healing: number; position: Position }>;
  }>({
    moves: [],
    attacks: [],
    damages: [],
    deaths: [],
    heals: [],
  });
  
  // Battle events - memoized to prevent dependency issues
  const events = useMemo(() => battle?.events || [], [battle?.events]);
  
  /**
   * Apply events up to specified index and trigger animations for current event.
   */
  const applyEventsUpTo = useCallback((eventIndex: number) => {
    let currentUnits = [...initialUnits];
    let currentRound = 1;
    
    // Clear previous animations
    setActiveAnimations({
      moves: [],
      attacks: [],
      damages: [],
      deaths: [],
      heals: [],
    });
    
    for (let i = 0; i <= eventIndex && i < events.length; i++) {
      const event = events[i];
      if (!event) continue;
      
      currentUnits = applyEventToUnits(currentUnits, event);
      
      if (event.type === 'round_start') {
        currentRound = event.round;
      }
      
      // Trigger animations for the current event (last one being processed)
      if (i === eventIndex) {
        triggerEventAnimation(event, currentUnits);
      }
    }
    
    setUnits(currentUnits);
    setReplayState(prev => ({ ...prev, currentRound }));
  }, [initialUnits, events, triggerEventAnimation]);

  /**
   * Trigger animation for a specific battle event.
   * 
   * @param event - Battle event to animate
   * @param currentUnits - Current unit states
   */
  const triggerEventAnimation = useCallback((event: BattleEvent, currentUnits: ReplayUnit[]) => {
    const animationId = `${event.type}-${Date.now()}-${Math.random()}`;
    
    switch (event.type) {
      case 'move':
        if (event.fromPosition && event.toPosition) {
          setActiveAnimations(prev => ({
            ...prev,
            moves: [...prev.moves, {
              id: animationId,
              fromPosition: event.fromPosition,
              toPosition: event.toPosition,
            }],
          }));
        }
        break;
        
      case 'attack':
        if (event.actorId && event.targetId) {
          const attacker = currentUnits.find(u => u.instanceId === event.actorId);
          const target = currentUnits.find(u => u.instanceId === event.targetId);
          
          if (attacker && target) {
            setActiveAnimations(prev => ({
              ...prev,
              attacks: [...prev.attacks, {
                id: animationId,
                attackerPosition: attacker.position,
                targetPosition: target.position,
              }],
            }));
          }
        }
        break;
        
      case 'damage':
        if (event.targetId && event.damage) {
          const target = currentUnits.find(u => u.instanceId === event.targetId);
          
          if (target) {
            setActiveAnimations(prev => ({
              ...prev,
              damages: [...prev.damages, {
                id: animationId,
                damage: event.damage,
                position: target.position,
              }],
            }));
          }
        }
        break;
        
      case 'death':
        if (event.targetId || event.killedUnits) {
          const killedIds = event.killedUnits || (event.targetId ? [event.targetId] : []);
          
          killedIds.forEach((killedId, index) => {
            const killedUnit = currentUnits.find(u => u.instanceId === killedId);
            
            if (killedUnit) {
              setActiveAnimations(prev => ({
                ...prev,
                deaths: [...prev.deaths, {
                  id: `${animationId}-${index}`,
                  position: killedUnit.position,
                }],
              }));
            }
          });
        }
        break;
        
      case 'heal':
        if (event.targetId && event.healing) {
          const target = currentUnits.find(u => u.instanceId === event.targetId);
          
          if (target) {
            setActiveAnimations(prev => ({
              ...prev,
              heals: [...prev.heals, {
                id: animationId,
                healing: event.healing,
                position: target.position,
              }],
            }));
          }
        }
        break;
    }
  }, []);

  /**
   * Handle animation completion by removing it from active animations.
   * 
   * @param animationType - Type of animation that completed
   * @param animationId - ID of the completed animation
   */
  const handleAnimationComplete = useCallback((
    animationType: 'moves' | 'attacks' | 'damages' | 'deaths' | 'heals',
    animationId: string
  ) => {
    setActiveAnimations(prev => ({
      ...prev,
      [animationType]: prev[animationType].filter(anim => anim.id !== animationId),
    }));
  }, []);
  
  /**
   * Step to next event.
   */
  const stepForward = useCallback(() => {
    const nextIndex = replayState.currentEventIndex + 1;
    if (nextIndex < events.length) {
      setReplayState(prev => ({ ...prev, currentEventIndex: nextIndex }));
      applyEventsUpTo(nextIndex);
    } else if (nextIndex === events.length) {
      // Reached the end, stop playing
      setReplayState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [replayState.currentEventIndex, events.length, applyEventsUpTo]);
  
  /**
   * Play/pause controls.
   */
  const handlePlay = useCallback(() => {
    setReplayState(prev => ({ ...prev, isPlaying: true }));
  }, []);
  
  const handlePause = useCallback(() => {
    setReplayState(prev => ({ ...prev, isPlaying: false }));
  }, []);
  
  const handleStep = useCallback(() => {
    stepForward();
  }, [stepForward]);
  
  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setReplayState(prev => ({ ...prev, speed }));
  }, []);
  
  const handleSeek = useCallback((eventIndex: number) => {
    setReplayState(prev => ({ ...prev, currentEventIndex: eventIndex, isPlaying: false }));
    applyEventsUpTo(eventIndex);
  }, [applyEventsUpTo]);
  
  const handleSkipToEnd = useCallback(() => {
    const lastIndex = events.length - 1;
    setReplayState(prev => ({ ...prev, currentEventIndex: lastIndex, isPlaying: false }));
    applyEventsUpTo(lastIndex);
    // Show battle result immediately when skipping to end
    setTimeout(() => {
      setShowBattleResult(true);
    }, 500);
  }, [events.length, applyEventsUpTo]);

  /**
   * Handle battle result actions.
   */
  const handleWatchReplay = useCallback(() => {
    setShowBattleResult(false);
    setReplayState(prev => ({ ...prev, currentEventIndex: -1, isPlaying: false }));
    applyEventsUpTo(-1);
  }, [applyEventsUpTo]);

  const handleNewBattle = useCallback(() => {
    setShowBattleResult(false);
    // In real app: navigate to matchmaking
    window.history.back();
  }, []);

  const handleEditTeam = useCallback(() => {
    setShowBattleResult(false);
    // In real app: navigate to team builder
    window.history.back();
  }, []);

  /**
   * Step to previous event.
   */
  const handleStepBack = useCallback(() => {
    const prevIndex = replayState.currentEventIndex - 1;
    if (prevIndex >= -1) {
      setReplayState(prev => ({ ...prev, currentEventIndex: prevIndex, isPlaying: false }));
      applyEventsUpTo(prevIndex);
    }
  }, [replayState.currentEventIndex, applyEventsUpTo]);

  /**
   * Skip to beginning of battle.
   */
  const handleSkipToStart = useCallback(() => {
    setReplayState(prev => ({ ...prev, currentEventIndex: -1, isPlaying: false }));
    applyEventsUpTo(-1);
  }, [applyEventsUpTo]);
  
  // Auto-play effect
  useEffect(() => {
    if (!replayState.isPlaying) return;
    
    const interval = setInterval(() => {
      // Check if we've reached the end of events (allow processing of the last event)
      if (replayState.currentEventIndex >= events.length - 1) {
        setReplayState(prev => ({ ...prev, isPlaying: false }));
        // Show battle result after a short delay
        setTimeout(() => {
          setShowBattleResult(true);
        }, 1500);
        return;
      }
      
      stepForward();
    }, BASE_ANIMATION_DURATION / replayState.speed);
    
    return () => clearInterval(interval);
  }, [replayState.isPlaying, replayState.speed, replayState.currentEventIndex, events.length, stepForward]);

  // Keyboard shortcuts effect
  useEffect(() => {
    /**
     * Handle keyboard shortcuts for battle replay navigation.
     * 
     * @param event - Keyboard event
     */
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ': // Spacebar - Play/Pause
          event.preventDefault();
          if (replayState.isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'ArrowLeft': // Left arrow - Step back
          event.preventDefault();
          handleStepBack();
          break;
        case 'ArrowRight': // Right arrow - Step forward
          event.preventDefault();
          handleStep();
          break;
        case 'Home': // Home - Skip to start
          event.preventDefault();
          handleSkipToStart();
          break;
        case 'End': // End - Skip to end
          event.preventDefault();
          handleSkipToEnd();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          // Speed shortcuts
          event.preventDefault();
          const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4];
          const speedIndex = parseInt(event.key) - 1;
          if (speedIndex >= 0 && speedIndex < speeds.length) {
            const selectedSpeed = speeds[speedIndex];
            if (selectedSpeed) {
              handleSpeedChange(selectedSpeed);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [replayState.isPlaying, handlePlay, handlePause, handleStep, handleStepBack, handleSkipToStart, handleSkipToEnd, handleSpeedChange]);
  
  /**
   * Handle unit click on grid to show popup with stats.
   */
  const handleGridUnitClick = useCallback((unit: ReplayUnit, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedGridUnit({
      unit,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      },
    });
  }, []);

  /**
   * Close unit popup.
   */
  const handleCloseUnitPopup = useCallback(() => {
    setSelectedGridUnit(null);
  }, []);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = () => handleCloseUnitPopup();
    if (selectedGridUnit) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [selectedGridUnit, handleCloseUnitPopup]);

  // Create grid with units and movement indicators
  const grid = useMemo(() => {
    const cells: JSX.Element[] = [];
    
    // Get current event for movement indicators and path
    const currentEvent = events[replayState.currentEventIndex];
    let movementPath: Position[] = [];
    
    // Build movement path if current event is movement
    if (currentEvent?.type === 'move' && currentEvent.fromPosition && currentEvent.toPosition) {
      // Simple path - just from and to positions for now
      // In a more advanced implementation, this could show the actual pathfinding route
      movementPath = [currentEvent.fromPosition, currentEvent.toPosition];
    }
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const position = { x, y };
        const unit = units.find(u => u.position.x === x && u.position.y === y);
        
        // Check if this position is involved in current movement
        let isMovementSource = false;
        let isMovementTarget = false;
        
        if (currentEvent?.type === 'move') {
          isMovementSource = currentEvent.fromPosition?.x === x && currentEvent.fromPosition?.y === y;
          isMovementTarget = currentEvent.toPosition?.x === x && currentEvent.toPosition?.y === y;
        }
        
        cells.push(
          <ReplayGridCell
            key={`${x}-${y}`}
            position={position}
            unit={unit}
            onUnitClick={handleGridUnitClick}
            isMovementSource={isMovementSource}
            isMovementTarget={isMovementTarget}
            movementPath={movementPath}
          />
        );
      }
    }
    
    return cells;
  }, [units, events, replayState.currentEventIndex, handleGridUnitClick]);
  
  // Early return after all hooks are defined
  if (!isValidBattle) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-4">❌ Invalid Battle Data</h1>
          <p className="text-gray-300 mb-4">The battle data is missing or corrupted.</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">⚔️ Повтор боя</h1>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            ← Назад
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Игрок 1:</span>
            <div className="font-medium">{getPlayerName(battle, 'player1')}</div>
          </div>
          <div>
            <span className="text-gray-400">Игрок 2:</span>
            <div className="font-medium">{getPlayerName(battle, 'player2')}</div>
          </div>
          <div>
            <span className="text-gray-400">Победитель:</span>
            <div className="font-medium">{getWinnerName(battle)}</div>
          </div>
          <div>
            <span className="text-gray-400">Статус:</span>
            <div className="font-medium capitalize">{battle.status}</div>
          </div>
        </div>
      </div>
      


      {/* Turn order bar */}
      <TurnOrderBar 
        units={units} 
        currentRound={replayState.currentRound}
        currentEventIndex={replayState.currentEventIndex}
        events={events}
        battle={battle}
      />
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battle grid */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Поле боя (8×10)</h3>
            <div className="relative">
              <div 
                className="grid gap-1 mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
                  maxWidth: `${GRID_WIDTH * 3.5}rem`
                }}
              >
                {grid}
              </div>
              
              {/* Animation Overlay */}
              <div 
                className="absolute top-0 left-0 pointer-events-none"
                style={{ 
                  width: `${GRID_WIDTH * 3.5}rem`,
                  height: `${GRID_HEIGHT * 3.5}rem`,
                  margin: '0 auto',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Move Animations */}
                {activeAnimations.moves.map(moveAnim => (
                  <MoveAnimation
                    key={moveAnim.id}
                    fromPosition={moveAnim.fromPosition}
                    toPosition={moveAnim.toPosition}
                    onComplete={() => handleAnimationComplete('moves', moveAnim.id)}
                  />
                ))}
                
                {/* Attack Animations */}
                {activeAnimations.attacks.map(attackAnim => (
                  <AttackAnimation
                    key={attackAnim.id}
                    attackerPosition={attackAnim.attackerPosition}
                    targetPosition={attackAnim.targetPosition}
                    onComplete={() => handleAnimationComplete('attacks', attackAnim.id)}
                  />
                ))}
                
                {/* Damage Numbers */}
                {activeAnimations.damages.map(damageAnim => (
                  <DamageNumber
                    key={damageAnim.id}
                    damage={damageAnim.damage}
                    position={damageAnim.position}
                    onComplete={() => handleAnimationComplete('damages', damageAnim.id)}
                  />
                ))}
                
                {/* Death Animations */}
                {activeAnimations.deaths.map(deathAnim => (
                  <DeathAnimation
                    key={deathAnim.id}
                    position={deathAnim.position}
                    onComplete={() => handleAnimationComplete('deaths', deathAnim.id)}
                  />
                ))}
                
                {/* Heal Animations */}
                {activeAnimations.heals.map(healAnim => (
                  <HealAnimation
                    key={healAnim.id}
                    healing={healAnim.healing}
                    position={healAnim.position}
                    onComplete={() => handleAnimationComplete('heals', healAnim.id)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-4">
            <ReplayControls
              replayState={replayState}
              totalEvents={events.length}
              onPlay={handlePlay}
              onPause={handlePause}
              onStep={handleStep}
              onStepBack={handleStepBack}
              onSpeedChange={handleSpeedChange}
              onSeek={handleSeek}
              onSkipToStart={handleSkipToStart}
              onSkipToEnd={handleSkipToEnd}
            />
          </div>
        </div>
        
        {/* Event log */}
        <div>
          <EventLog 
            events={events} 
            currentEventIndex={replayState.currentEventIndex}
            units={units}
          />
        </div>
      </div>
      
      {/* Unit Stats Popup */}
      {selectedGridUnit && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-xl"
          style={{
            left: selectedGridUnit.position.x,
            top: selectedGridUnit.position.y,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm">
            <div className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">{UNIT_INFO[selectedGridUnit.unit.template.id]?.emoji}</span>
              <div>
                <div>{selectedGridUnit.unit.template.name}</div>
                <div className="text-xs text-gray-400">
                  {selectedGridUnit.unit.team === 'player1' ? getPlayerName(battle, 'player1') : getPlayerName(battle, 'player2')}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <span className="text-gray-400">HP:</span>
                <div className={`font-medium ml-1 ${
                  selectedGridUnit.unit.currentHp > selectedGridUnit.unit.maxHp * 0.6 
                    ? 'text-green-400' 
                    : selectedGridUnit.unit.currentHp > selectedGridUnit.unit.maxHp * 0.3 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
                }`}>
                  {selectedGridUnit.unit.currentHp}/{selectedGridUnit.unit.maxHp}
                </div>
              </div>
              <div>
                <span className="text-gray-400">ATK:</span>
                <span className="text-orange-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.atk}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Armor:</span>
                <span className="text-blue-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.armor}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Speed:</span>
                <span className="text-green-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.speed}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Initiative:</span>
                <span className="text-yellow-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.initiative}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Dodge:</span>
                <span className="text-purple-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.dodge}%
                </span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">
                Position: <span className="text-white">({selectedGridUnit.unit.position.x}, {selectedGridUnit.unit.position.y})</span>
              </div>
              <div className="text-xs text-gray-400">
                Status: <span className={selectedGridUnit.unit.alive ? 'text-green-400' : 'text-red-400'}>
                  {selectedGridUnit.unit.alive ? 'Alive' : 'Dead'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleCloseUnitPopup}
              className="mt-3 w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Battle Result Screen */}
      <BattleResult
        battle={battle}
        playerId={battle.player1Id} // TODO: Get actual current player ID
        ratingChange={{
          oldRating: 1200,
          newRating: battle.winner === 'player1' ? 1215 : 1185,
          change: battle.winner === 'player1' ? 15 : -15,
        }}
        onWatchReplay={handleWatchReplay}
        onNewBattle={handleNewBattle}
        onEditTeam={handleEditTeam}
        show={showBattleResult}
      />
    </div>
  );
}