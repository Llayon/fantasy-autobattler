/**
 * Desktop Layout Test Page for Fantasy Autobattler.
 * Demonstrates the enhanced desktop interface with filters, statistics, and enemy preview.
 */

'use client';

import { useState } from 'react';
import { ResponsiveTeamBuilder, TeamActions } from '@/components/ResponsiveTeamBuilder';
import { UnitTemplate, UnitId, Position } from '@/types/game';

// Mock data for testing
const mockUnits: UnitTemplate[] = [
  {
    id: 'knight',
    name: 'Рыцарь',
    role: 'tank',
    cost: 5,
    stats: { hp: 150, atk: 25, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 5 },
    range: 1,
    abilities: ['Защитная стойка', 'Провокация'],
  },
  {
    id: 'rogue',
    name: 'Разбойник',
    role: 'melee_dps',
    cost: 4,
    stats: { hp: 80, atk: 35, atkCount: 1, armor: 2, speed: 4, initiative: 6, dodge: 15 },
    range: 1,
    abilities: ['Скрытность', 'Удар в спину'],
  },
  {
    id: 'archer',
    name: 'Лучник',
    role: 'ranged_dps',
    cost: 3,
    stats: { hp: 65, atk: 28, atkCount: 1, armor: 1, speed: 3, initiative: 5, dodge: 8 },
    range: 4,
    abilities: ['Точный выстрел'],
  },
  {
    id: 'mage',
    name: 'Маг',
    role: 'mage',
    cost: 6,
    stats: { hp: 55, atk: 40, atkCount: 1, armor: 0, speed: 2, initiative: 4, dodge: 3 },
    range: 3,
    abilities: ['Огненный шар', 'Щит маны'],
  },
  {
    id: 'priest',
    name: 'Жрец',
    role: 'support',
    cost: 4,
    stats: { hp: 70, atk: 15, atkCount: 1, armor: 3, speed: 2, initiative: 4, dodge: 5 },
    range: 2,
    abilities: ['Исцеление', 'Благословение'],
  },
  {
    id: 'guardian',
    name: 'Страж',
    role: 'tank',
    cost: 7,
    stats: { hp: 180, atk: 20, atkCount: 1, armor: 12, speed: 1, initiative: 2, dodge: 3 },
    range: 1,
    abilities: ['Неприступная защита', 'Отражение'],
  },
];

const mockCurrentTeam = {
  units: [
    { unitId: 'knight' as UnitId, position: { x: 1, y: 0 } },
    { unitId: 'rogue' as UnitId, position: { x: 3, y: 1 } },
    { unitId: 'archer' as UnitId, position: { x: 5, y: 0 } },
  ],
  totalCost: 12,
  isValid: true,
  errors: [],
};

const mockGridUnits = mockUnits.slice(0, 3).map((unit, index) => ({
  unit,
  position: index === 0 ? { x: 1, y: 0 } : index === 1 ? { x: 3, y: 1 } : { x: 5, y: 0 },
  team: 'player' as const,
  alive: true,
}));

const mockHighlightedCells = Array.from({ length: 16 }, (_, i) => ({
  position: { x: i % 8, y: Math.floor(i / 8) },
  type: 'valid' as const,
}));

export default function TestDesktopLayoutPage() {
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const teamActions: TeamActions = {
    onSave: () => console.log('Save team'),
    onClear: () => console.log('Clear team'),
    onStartBattle: () => console.log('Start battle'),
    onShowTeams: () => console.log('Show teams'),
    canSave: true,
    canBattle: true,
    loading: false,
    teamCount: 5,
  };

  const handleUnitSelect = (unit: UnitTemplate | null) => {
    setSelectedUnit(unit);
  };

  const handleUnitLongPress = (unit: UnitTemplate) => {
    console.log('Long press:', unit.name);
  };

  const handleGridCellClick = (position: Position) => {
    console.log('Grid cell clicked:', position);
  };

  const handleMobileSheetToggle = () => {
    setIsMobileSheetOpen(!isMobileSheetOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-1">
                🎮 Team Builder - Desktop Layout Test
              </h1>
              <p className="text-gray-300 text-sm">
                Enhanced desktop interface with filters, statistics, and enemy preview
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-yellow-400 font-bold">💰 12/30</div>
                <div className="text-xs text-gray-400">Budget</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ResponsiveTeamBuilder
        units={mockUnits}
        currentTeam={mockCurrentTeam}
        selectedUnit={selectedUnit}
        disabledUnits={['knight', 'rogue', 'archer']}
        gridUnits={mockGridUnits}
        highlightedCells={mockHighlightedCells}
        teamActions={teamActions}
        onUnitSelect={handleUnitSelect}
        onUnitLongPress={handleUnitLongPress}
        onGridCellClick={handleGridCellClick}
        isMobileSheetOpen={isMobileSheetOpen}
        onMobileSheetToggle={handleMobileSheetToggle}
      />

      {/* Feature Highlights */}
      <div className="fixed bottom-4 right-4 bg-blue-900/90 text-white p-4 rounded-lg max-w-sm z-50">
        <div className="font-bold mb-2">🎯 Desktop Features:</div>
        <div className="text-sm space-y-1">
          <div>✓ Search & filters in sidebar</div>
          <div>✓ Team statistics display</div>
          <div>✓ Enemy zone preview</div>
          <div>✓ Enhanced action layout</div>
          <div>✓ Responsive grid system</div>
        </div>
      </div>
    </div>
  );
}