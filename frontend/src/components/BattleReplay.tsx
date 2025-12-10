'use client';

import { useState, useEffect } from 'react';
import { BattleLog, BattleEvent, UnitStats, UNIT_INFO } from '@/types/game';

interface BattleReplayProps {
  battle: BattleLog;
}

interface UnitState extends UnitStats {
  id: string;
  team: 'player' | 'bot';
  currentHp: number;
  alive: boolean;
}

function createInitialState(battle: BattleLog): UnitState[] {
  const units: UnitState[] = [];
  
  battle.playerTeam.forEach((unit, i) => {
    units.push({
      ...unit,
      id: `player-${unit.type}-${i}`,
      team: 'player',
      currentHp: unit.hp,
      alive: true,
    });
  });
  
  battle.botTeam.forEach((unit, i) => {
    units.push({
      ...unit,
      id: `bot-${unit.type}-${i}`,
      team: 'bot',
      currentHp: unit.hp,
      alive: true,
    });
  });
  
  return units;
}

function applyEvent(units: UnitState[], event: BattleEvent): UnitState[] {
  const newUnits = units.map(u => ({ ...u }));
  
  if (event.action === 'heal' && event.target && event.value) {
    const target = newUnits.find(u => u.id === event.target);
    if (target) {
      target.currentHp = Math.min(target.maxHp, target.currentHp + event.value);
    }
  }
  
  if (event.action === 'attack' && event.target && event.damage) {
    const target = newUnits.find(u => u.id === event.target);
    if (target) {
      target.currentHp -= event.damage;
      if (target.currentHp <= 0) target.alive = false;
    }
  }
  
  if (event.action === 'splash' && event.targets && event.damages) {
    event.targets.forEach((targetId, i) => {
      const target = newUnits.find(u => u.id === targetId);
      if (target && event.damages) {
        target.currentHp -= event.damages[i];
        if (target.currentHp <= 0) target.alive = false;
      }
    });
  }
  
  return newUnits;
}

function UnitDisplay({ unit, isActive }: { unit: UnitState; isActive: boolean }) {
  const info = UNIT_INFO[unit.type];
  const hpPercent = Math.max(0, (unit.currentHp / unit.maxHp) * 100);
  
  return (
    <div className={`
      p-3 rounded-lg ${info.color} bg-opacity-80 text-center
      ${!unit.alive ? 'opacity-30 grayscale' : ''}
      ${isActive ? 'ring-2 ring-yellow-400 scale-105' : ''}
      transition-all duration-300
    `}>
      <div className="text-2xl">{info.emoji}</div>
      <div className="text-sm font-bold">{unit.type}</div>
      <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="text-xs mt-1">{Math.max(0, unit.currentHp)}/{unit.maxHp}</div>
    </div>
  );
}

export function BattleReplay({ battle }: BattleReplayProps) {
  const [eventIndex, setEventIndex] = useState(-1);
  const [units, setUnits] = useState<UnitState[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<BattleEvent | null>(null);

  useEffect(() => {
    setUnits(createInitialState(battle));
  }, [battle]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setTimeout(() => {
      if (eventIndex < battle.events.length - 1) {
        const nextIndex = eventIndex + 1;
        setEventIndex(nextIndex);
        setCurrentEvent(battle.events[nextIndex]);
        setUnits(prev => applyEvent(prev, battle.events[nextIndex]));
      } else {
        setIsPlaying(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [isPlaying, eventIndex, battle.events]);

  const handlePlay = () => {
    if (eventIndex >= battle.events.length - 1) {
      // Reset
      setEventIndex(-1);
      setUnits(createInitialState(battle));
      setCurrentEvent(null);
    }
    setIsPlaying(true);
  };

  const handleStep = () => {
    if (eventIndex < battle.events.length - 1) {
      const nextIndex = eventIndex + 1;
      setEventIndex(nextIndex);
      setCurrentEvent(battle.events[nextIndex]);
      setUnits(prev => applyEvent(prev, battle.events[nextIndex]));
    }
  };

  const handleReset = () => {
    setEventIndex(-1);
    setUnits(createInitialState(battle));
    setCurrentEvent(null);
    setIsPlaying(false);
  };

  const playerUnits = units.filter(u => u.team === 'player');
  const botUnits = units.filter(u => u.team === 'bot');
  const finished = eventIndex >= battle.events.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">⚔️ Battle Replay</h1>
      
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h2 className="text-lg font-bold text-blue-400 mb-3 text-center">Your Team</h2>
          <div className="grid grid-cols-3 gap-2">
            {playerUnits.map(unit => (
              <UnitDisplay 
                key={unit.id} 
                unit={unit} 
                isActive={currentEvent?.actor === unit.id}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-red-400 mb-3 text-center">Enemy Team</h2>
          <div className="grid grid-cols-3 gap-2">
            {botUnits.map(unit => (
              <UnitDisplay 
                key={unit.id} 
                unit={unit}
                isActive={currentEvent?.actor === unit.id}
              />
            ))}
          </div>
        </div>
      </div>

      {currentEvent && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-center">
          <span className="text-yellow-400">Round {currentEvent.round}:</span>{' '}
          <span className="text-white">{currentEvent.actor}</span>{' '}
          <span className="text-gray-300">
            {currentEvent.action === 'heal' && `heals ${currentEvent.target} for ${currentEvent.value} HP`}
            {currentEvent.action === 'attack' && `attacks ${currentEvent.target} for ${currentEvent.damage} damage`}
            {currentEvent.action === 'splash' && `hits ${currentEvent.targets?.join(', ')} for ${currentEvent.damages?.join(', ')} damage`}
          </span>
          {currentEvent.killed && currentEvent.killed.length > 0 && (
            <span className="text-red-400"> 💀 {currentEvent.killed.join(', ')} defeated!</span>
          )}
        </div>
      )}

      {finished && (
        <div className={`text-center text-2xl font-bold mb-4 ${
          battle.winner === 'player' ? 'text-green-400' : 
          battle.winner === 'bot' ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {battle.winner === 'player' && '🎉 Victory!'}
          {battle.winner === 'bot' && '💀 Defeat!'}
          {battle.winner === 'draw' && '🤝 Draw!'}
        </div>
      )}

      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50"
        >
          {finished ? '🔄 Replay' : isPlaying ? '▶️ Playing...' : '▶️ Play'}
        </button>
        <button
          onClick={handleStep}
          disabled={isPlaying || finished}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
        >
          ⏭️ Step
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
        >
          ⏮️ Reset
        </button>
      </div>

      <div className="text-center text-gray-400 text-sm mb-4">
        Event {eventIndex + 1} / {battle.events.length}
      </div>

      <div className="text-center">
        <a href="/" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Team Builder
        </a>
      </div>
    </div>
  );
}
