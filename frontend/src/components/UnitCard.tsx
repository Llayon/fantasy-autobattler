'use client';

import { UnitType, UNIT_INFO } from '@/types/game';

interface UnitCardProps {
  type: UnitType;
  selected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
}

const STATS: Record<UnitType, { hp: number; atk: number; def: number; spd: number }> = {
  Warrior: { hp: 100, atk: 15, def: 10, spd: 5 },
  Mage: { hp: 60, atk: 25, def: 3, spd: 8 },
  Healer: { hp: 70, atk: 8, def: 5, spd: 10 },
};

export function UnitCard({ type, selected, onClick, showStats = true }: UnitCardProps) {
  const info = UNIT_INFO[type];
  const stats = STATS[type];

  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-all duration-200
        ${info.color} bg-opacity-80
        ${selected ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/30' : 'border-gray-600'}
        ${onClick ? 'hover:scale-105 hover:border-yellow-300 cursor-pointer' : ''}
      `}
    >
      <div className="text-4xl mb-2">{info.emoji}</div>
      <div className="font-bold text-lg">{type}</div>
      <div className="text-xs text-gray-200 mt-1">{info.description}</div>
      
      {showStats && (
        <div className="mt-3 text-xs grid grid-cols-2 gap-1">
          <div>❤️ {stats.hp}</div>
          <div>⚔️ {stats.atk}</div>
          <div>🛡️ {stats.def}</div>
          <div>💨 {stats.spd}</div>
        </div>
      )}
    </button>
  );
}
