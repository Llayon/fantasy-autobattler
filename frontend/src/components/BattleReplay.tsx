/**
 * BattleReplay component for Fantasy Autobattler.
 * Displays battle replay with step-by-step visualization on 8×10 grid.
 * 
 * @fileoverview Complete battle replay system with animations, controls, and event log.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BattleLog, BattleEvent, Position, UnitTemplate, UNIT_INFO, UnitId } from '@/types/game';

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
 * Extract initial unit states from battle log.
 * 
 * @param battle - Battle log data
 * @returns Array of initial unit states
 */
function extractInitialUnits(battle: BattleLog): ReplayUnit[] {
  const units: ReplayUnit[] = [];
  
  // Extract player1 team
  if (battle.player1Team && typeof battle.player1Team === 'object') {
    const team1 = battle.player1Team as any;
    if (team1.units && Array.isArray(team1.units)) {
      team1.units.forEach((unit: any, index: number) => {
        if (unit.unitId && unit.position) {
          // Create mock unit template - in real implementation, fetch from unit data
          const template: UnitTemplate = {
            id: unit.unitId as UnitId,
            name: unit.unitId,
            role: 'tank', // Default role
            cost: 5, // Default cost
            stats: {
              hp: 100,
              atk: 20,
              atkCount: 1,
              armor: 5,
              speed: 2,
              initiative: 10,
              dodge: 0,
            },
            range: 1,
            abilities: [],
          };
          
          units.push({
            instanceId: `p1_${index}`,
            template,
            position: unit.position,
            currentHp: template.stats.hp,
            maxHp: template.stats.hp,
            team: 'player1',
            alive: true,
          });
        }
      });
    }
  }
  
  // Extract player2 team
  if (battle.player2Team && typeof battle.player2Team === 'object') {
    const team2 = battle.player2Team as any;
    if (team2.units && Array.isArray(team2.units)) {
      team2.units.forEach((unit: any, index: number) => {
        if (unit.unitId && unit.position) {
          // Create mock unit template
          const template: UnitTemplate = {
            id: unit.unitId as UnitId,
            name: unit.unitId,
            role: 'tank',
            cost: 5,
            stats: {
              hp: 100,
              atk: 20,
              atkCount: 1,
              armor: 5,
              speed: 2,
              initiative: 10,
              dodge: 0,
            },
            range: 1,
            abilities: [],
          };
          
          units.push({
            instanceId: `p2_${index}`,
            template,
            position: unit.position,
            currentHp: template.stats.hp,
            maxHp: template.stats.hp,
            team: 'player2',
            alive: true,
          });
        }
      });
    }
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
 * Grid cell component for battle replay.
 */
function ReplayGridCell({ 
  position, 
  unit, 
  onClick 
}: { 
  position: Position; 
  unit?: ReplayUnit; 
  onClick?: () => void;
}) {
  const isPlayerZone = position.y <= 1;
  const isEnemyZone = position.y >= 8;
  
  const cellClasses = [
    'relative w-12 h-12 border border-gray-600 transition-all duration-300',
    isPlayerZone ? 'bg-blue-900/20' : isEnemyZone ? 'bg-red-900/20' : 'bg-gray-800/50',
    onClick ? 'cursor-pointer hover:bg-white/10' : '',
  ].join(' ');
  
  return (
    <div className={cellClasses} onClick={onClick}>
      {/* Grid coordinates */}
      <div className="absolute top-0 left-0 text-xs text-gray-500 leading-none">
        {position.x},{position.y}
      </div>
      
      {/* Unit display */}
      {unit && (
        <div className={`
          absolute inset-1 rounded flex items-center justify-center text-lg font-bold
          ${unit.team === 'player1' ? 'bg-blue-600' : 'bg-red-600'}
          ${!unit.alive ? 'opacity-30 grayscale' : ''}
          ${unit.animation?.type === 'damage' ? 'animate-pulse bg-red-400' : ''}
          ${unit.animation?.type === 'death' ? 'animate-bounce' : ''}
        `}>
          {UNIT_INFO[unit.template.id]?.emoji || '❓'}
          
          {/* HP bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(unit.currentHp / unit.maxHp) * 100}%` }}
            />
          </div>
          
          {/* Damage indicator */}
          {unit.animation?.type === 'damage' && unit.animation.damage && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-red-400 font-bold animate-bounce">
              -{unit.animation.damage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Turn order bar component.
 */
function TurnOrderBar({ units, currentRound }: { units: ReplayUnit[]; currentRound: number }) {
  const aliveUnits = units.filter(unit => unit.alive);
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Раунд {currentRound}</h3>
        <div className="text-sm text-gray-400">
          Живых юнитов: {aliveUnits.length}
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto">
        {aliveUnits
          .sort((a, b) => b.template.stats.initiative - a.template.stats.initiative)
          .map(unit => (
            <div
              key={unit.instanceId}
              className={`
                flex-shrink-0 w-12 h-12 rounded border-2 flex items-center justify-center
                ${unit.team === 'player1' ? 'border-blue-400 bg-blue-600/20' : 'border-red-400 bg-red-600/20'}
              `}
            >
              <span className="text-lg">{UNIT_INFO[unit.template.id]?.emoji || '❓'}</span>
            </div>
          ))}
      </div>
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
  onSpeedChange,
  onSeek,
  onSkipToEnd,
}: {
  replayState: ReplayState;
  totalEvents: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSeek: (eventIndex: number) => void;
  onSkipToEnd: () => void;
}) {
  const progress = totalEvents > 0 ? (replayState.currentEventIndex / totalEvents) * 100 : 0;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        {/* Play/Pause */}
        <button
          onClick={replayState.isPlaying ? onPause : onPlay}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          {replayState.isPlaying ? '⏸️ Пауза' : '▶️ Играть'}
        </button>
        
        {/* Step */}
        <button
          onClick={onStep}
          disabled={replayState.currentEventIndex >= totalEvents}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          ⏭️ Шаг
        </button>
        
        {/* Speed control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Скорость:</span>
          {[0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed as PlaybackSpeed)}
              className={`
                px-3 py-1 rounded text-sm transition-colors
                ${replayState.speed === speed 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {speed}x
            </button>
          ))}
        </div>
        
        {/* Skip to end */}
        <button
          onClick={onSkipToEnd}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          ⏭️ В конец
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Событие {replayState.currentEventIndex} из {totalEvents}</span>
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
          min="0"
          max={totalEvents}
          value={replayState.currentEventIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full mt-2 opacity-0 absolute"
        />
      </div>
    </div>
  );
}

/**
 * Event log component.
 */
function EventLog({ 
  events, 
  currentEventIndex 
}: { 
  events: BattleEvent[]; 
  currentEventIndex: number;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
      <h3 className="text-lg font-medium mb-3">Журнал событий</h3>
      
      <div className="space-y-2">
        {events.slice(0, currentEventIndex + 1).map((event, index) => (
          <div
            key={index}
            className={`
              text-sm p-2 rounded border-l-4
              ${index === currentEventIndex 
                ? 'bg-blue-900/30 border-blue-400' 
                : 'bg-gray-700/30 border-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400">R{event.round}</span>
              <span>{EVENT_TYPE_NAMES[event.type] || event.type}</span>
            </div>
            
            {event.damage && (
              <div className="text-red-400 text-xs">
                Урон: {event.damage}
              </div>
            )}
            
            {event.fromPosition && event.toPosition && (
              <div className="text-blue-400 text-xs">
                Движение: ({event.fromPosition.x},{event.fromPosition.y}) → ({event.toPosition.x},{event.toPosition.y})
              </div>
            )}
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
  // Initialize units from battle log
  const initialUnits = useMemo(() => extractInitialUnits(battle), [battle]);
  
  // Replay state
  const [replayState, setReplayState] = useState<ReplayState>({
    currentEventIndex: -1,
    isPlaying: false,
    speed: 1,
    currentRound: 1,
  });
  
  // Current unit states
  const [units, setUnits] = useState<ReplayUnit[]>(initialUnits);
  
  // Battle events
  const events = battle.events || [];
  
  /**
   * Apply events up to specified index.
   */
  const applyEventsUpTo = useCallback((eventIndex: number) => {
    let currentUnits = [...initialUnits];
    let currentRound = 1;
    
    for (let i = 0; i <= eventIndex && i < events.length; i++) {
      const event = events[i];
      if (!event) continue;
      
      currentUnits = applyEventToUnits(currentUnits, event);
      
      if (event.type === 'round_start') {
        currentRound = event.round;
      }
    }
    
    setUnits(currentUnits);
    setReplayState(prev => ({ ...prev, currentRound }));
  }, [initialUnits, events]);
  
  /**
   * Step to next event.
   */
  const stepForward = useCallback(() => {
    const nextIndex = Math.min(replayState.currentEventIndex + 1, events.length - 1);
    setReplayState(prev => ({ ...prev, currentEventIndex: nextIndex }));
    applyEventsUpTo(nextIndex);
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
  }, [events.length, applyEventsUpTo]);
  
  // Auto-play effect
  useEffect(() => {
    if (!replayState.isPlaying) return;
    
    const interval = setInterval(() => {
      if (replayState.currentEventIndex >= events.length - 1) {
        setReplayState(prev => ({ ...prev, isPlaying: false }));
        return;
      }
      
      stepForward();
    }, BASE_ANIMATION_DURATION / replayState.speed);
    
    return () => clearInterval(interval);
  }, [replayState.isPlaying, replayState.speed, replayState.currentEventIndex, events.length, stepForward]);
  
  // Create grid with units
  const grid = useMemo(() => {
    const cells: JSX.Element[] = [];
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const position = { x, y };
        const unit = units.find(u => u.position.x === x && u.position.y === y);
        
        cells.push(
          <ReplayGridCell
            key={`${x}-${y}`}
            position={position}
            unit={unit}
          />
        );
      }
    }
    
    return cells;
  }, [units]);
  
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
            <div className="font-medium">{battle.player1Id}</div>
          </div>
          <div>
            <span className="text-gray-400">Игрок 2:</span>
            <div className="font-medium">{battle.player2Id}</div>
          </div>
          <div>
            <span className="text-gray-400">Победитель:</span>
            <div className="font-medium">{battle.winnerId || 'Неизвестно'}</div>
          </div>
          <div>
            <span className="text-gray-400">Статус:</span>
            <div className="font-medium capitalize">{battle.status}</div>
          </div>
        </div>
      </div>
      
      {/* Turn order bar */}
      <TurnOrderBar units={units} currentRound={replayState.currentRound} />
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battle grid */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Поле боя (8×10)</h3>
            <div 
              className="grid gap-1 mx-auto"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
                maxWidth: `${GRID_WIDTH * 3.5}rem`
              }}
            >
              {grid}
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
              onSpeedChange={handleSpeedChange}
              onSeek={handleSeek}
              onSkipToEnd={handleSkipToEnd}
            />
          </div>
        </div>
        
        {/* Event log */}
        <div>
          <EventLog 
            events={events} 
            currentEventIndex={replayState.currentEventIndex}
          />
        </div>
      </div>
    </div>
  );
}