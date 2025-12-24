/**
 * Test page specifically for BattleGrid variant='mini'.
 * Used to verify mobile functionality and touch targets.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { BattleGrid, GridUnit } from '@/components/BattleGrid';
import { Position } from '@/types/game';

// Mock units for testing mini grid
const mockUnits: GridUnit[] = [
  {
    unit: {
      id: 'knight',
      name: 'Knight',
      role: 'tank',
      cost: 5,
      stats: { hp: 150, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 0 },
      range: 1,
      abilities: [],
    },
    position: { x: 1, y: 0 },
    team: 'player',
  },
  {
    unit: {
      id: 'archer',
      name: 'Archer',
      role: 'ranged_dps',
      cost: 4,
      stats: { hp: 80, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 4, dodge: 10 },
      range: 3,
      abilities: [],
    },
    position: { x: 3, y: 1 },
    team: 'player',
  },
  {
    unit: {
      id: 'mage',
      name: 'Mage',
      role: 'mage',
      cost: 6,
      stats: { hp: 70, atk: 25, atkCount: 1, armor: 1, speed: 2, initiative: 5, dodge: 5 },
      range: 2,
      abilities: [],
    },
    position: { x: 5, y: 0 },
    team: 'player',
  },
  {
    unit: {
      id: 'rogue',
      name: 'Rogue',
      role: 'melee_dps',
      cost: 4,
      stats: { hp: 90, atk: 22, atkCount: 1, armor: 3, speed: 4, initiative: 6, dodge: 15 },
      range: 1,
      abilities: [],
    },
    position: { x: 7, y: 1 },
    team: 'player',
  },
];

/**
 * Test page for BattleGrid mini variant.
 */
export default function TestMiniGrid() {
  const [clickedCells, setClickedCells] = useState<Position[]>([]);
  const [lastClick, setLastClick] = useState<string>('');

  const handleCellClick = (position: Position) => {
    const clickInfo = `Clicked: (${position.x}, ${position.y})`;
    setLastClick(clickInfo);
    setClickedCells(prev => [...prev.slice(-4), position]);
    console.log(clickInfo);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🧪 Mini Grid Test</h1>
        <p className="text-gray-400 text-sm">
          Test BattleGrid variant='mini' for mobile compatibility
        </p>
      </div>

      {/* Test Info */}
      <div className="mb-6 bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">✅ Checklist</h2>
        <ul className="text-sm space-y-1 text-gray-300">
          <li>• Shows only 8×2 cells (rows 0-1)</li>
          <li>• Horizontal scroll works on mobile</li>
          <li>• Touch targets ≥ 44px (w-11 h-11 = 44px)</li>
          <li>• Pinch to zoom works</li>
          <li>• No TypeScript errors</li>
          <li>• Click feedback works</li>
        </ul>
      </div>

      {/* Click Feedback */}
      <div className="mb-4 bg-gray-800 rounded-lg p-3">
        <div className="text-sm">
          <strong>Last Click:</strong> {lastClick || 'None'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Recent: {clickedCells.map(pos => `(${pos.x},${pos.y})`).join(', ')}
        </div>
      </div>

      {/* Mini Grid Test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Mini Variant (8×2)</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <BattleGrid
            variant="mini"
            units={mockUnits}
            mode="team-builder"
            interactive={true}
            onCellClick={handleCellClick}
          />
        </div>
      </div>

      {/* Full Grid for Comparison */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Full Variant (8×10) - Comparison</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <BattleGrid
            variant="full"
            units={mockUnits}
            mode="team-builder"
            interactive={true}
            onCellClick={handleCellClick}
            showCoordinates={true}
          />
        </div>
      </div>

      {/* Battle Mode Test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Mini Battle Mode (with HP bars)</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <BattleGrid
            variant="mini"
            units={mockUnits.map(unit => ({ 
              ...unit, 
              currentHp: Math.floor(unit.unit.stats.hp * 0.6),
              alive: true
            }))}
            mode="battle"
            interactive={true}
            onCellClick={handleCellClick}
          />
        </div>
      </div>

      {/* Mobile Instructions */}
      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">📱 Mobile Testing</h3>
        <ol className="text-sm space-y-1 text-gray-300">
          <li>1. Open Chrome DevTools (F12)</li>
          <li>2. Click device toolbar icon (Ctrl+Shift+M)</li>
          <li>3. Select iPhone SE (375px) or similar</li>
          <li>4. Test horizontal scroll on mini grid</li>
          <li>5. Test pinch-to-zoom gesture</li>
          <li>6. Verify touch targets are large enough</li>
        </ol>
      </div>
    </div>
  );
}