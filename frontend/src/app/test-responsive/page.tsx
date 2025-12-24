/**
 * Test page for ResponsiveTeamBuilder component.
 * Tests adaptive layouts across different viewport sizes.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

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
    stats: { hp: 120, atk: 25, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 5 },
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
];

const mockCurrentTeam = {
  units: [
    { unitId: 'knight' as UnitId, position: { x: 1, y: 0 } },
    { unitId: 'rogue' as UnitId, position: { x: 3, y: 1 } },
  ],
  totalCost: 9,
  isValid: true,
  errors: [],
};

const mockGridUnits = mockUnits.slice(0, 2).map((unit, index) => ({
  unit,
  position: index === 0 ? { x: 1, y: 0 } : { x: 3, y: 1 },
  team: 'player' as const,
  alive: true,
}));

const mockHighlightedCells = [
  { position: { x: 0, y: 0 }, type: 'valid' as const },
  { position: { x: 1, y: 0 }, type: 'valid' as const },
  { position: { x: 2, y: 0 }, type: 'valid' as const },
  { position: { x: 3, y: 0 }, type: 'valid' as const },
  { position: { x: 4, y: 0 }, type: 'valid' as const },
  { position: { x: 5, y: 0 }, type: 'valid' as const },
  { position: { x: 6, y: 0 }, type: 'valid' as const },
  { position: { x: 7, y: 0 }, type: 'valid' as const },
  { position: { x: 0, y: 1 }, type: 'valid' as const },
  { position: { x: 1, y: 1 }, type: 'valid' as const },
  { position: { x: 2, y: 1 }, type: 'valid' as const },
  { position: { x: 3, y: 1 }, type: 'valid' as const },
  { position: { x: 4, y: 1 }, type: 'valid' as const },
  { position: { x: 5, y: 1 }, type: 'valid' as const },
  { position: { x: 6, y: 1 }, type: 'valid' as const },
  { position: { x: 7, y: 1 }, type: 'valid' as const },
];

export default function TestResponsivePage() {
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const teamActions: TeamActions = {
    onSave: () => alert('Команда сохранена!'),
    onClear: () => alert('Команда очищена!'),
    onStartBattle: () => alert('Начинаем бой!'),
    onShowTeams: () => alert('Показать команды!'),
    canSave: true,
    canBattle: true,
    loading: false,
    teamCount: 3,
  };

  const handleUnitSelect = (unit: UnitTemplate | null) => {
    setSelectedUnit(unit);
  };

  const handleUnitLongPress = (unit: UnitTemplate) => {
    alert(`Детали юнита: ${unit.name}`);
  };

  const handleGridCellClick = (position: Position) => {
    console.log('Grid cell clicked:', position);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Viewport size indicator */}
      <div className="fixed top-4 left-4 z-50 bg-black/80 text-white px-3 py-1 rounded text-sm">
        <span className="block sm:hidden">📱 Mobile (&lt;640px)</span>
        <span className="hidden sm:block md:hidden">📟 Small (640-768px)</span>
        <span className="hidden md:block lg:hidden">💻 Tablet (768-1024px)</span>
        <span className="hidden lg:block xl:hidden">🖥️ Desktop (1024-1280px)</span>
        <span className="hidden xl:block">🖥️ Large (&gt;1280px)</span>
      </div>

      <ResponsiveTeamBuilder
        units={mockUnits}
        currentTeam={mockCurrentTeam}
        selectedUnit={selectedUnit}
        disabledUnits={['knight', 'rogue']}
        gridUnits={mockGridUnits}
        highlightedCells={mockHighlightedCells}
        teamActions={teamActions}
        onUnitSelect={handleUnitSelect}
        onUnitLongPress={handleUnitLongPress}
        onGridCellClick={handleGridCellClick}
        isMobileSheetOpen={isMobileSheetOpen}
        onMobileSheetToggle={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
      />
    </div>
  );
}