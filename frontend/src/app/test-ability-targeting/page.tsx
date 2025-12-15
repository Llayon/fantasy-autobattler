/**
 * Test page for AbilityTargetingPreview component.
 * Demonstrates ability range and AoE preview functionality.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  AbilityTargetingPreview, 
  AbilityTargetingLegend,
  AbilityPreviewData,
  PreviewUnit 
} from '@/components/AbilityTargetingPreview';
import { Position, UnitTemplate, UnitStats } from '@/types/game';

// =============================================================================
// MOCK DATA
// =============================================================================

/** Mock unit stats */
const mockStats: UnitStats = {
  hp: 100,
  atk: 25,
  atkCount: 1,
  armor: 5,
  speed: 3,
  initiative: 10,
  dodge: 10,
};

/** Mock caster unit */
const mockCasterUnit: UnitTemplate = {
  id: 'mage',
  name: 'Маг',
  role: 'mage',
  cost: 6,
  stats: mockStats,
  range: 3,
  abilities: ['fireball'],
};

/** Sample abilities for testing */
const sampleAbilities: AbilityPreviewData[] = [
  {
    id: 'fireball',
    name: 'Огненный шар',
    description: 'Наносит 30 магического урона в радиусе 1 клетки',
    type: 'active',
    targetType: 'area',
    cooldown: 2,
    range: 3,
    areaSize: 1,
    effects: [
      { type: 'damage', value: 30, damageType: 'magical', attackScaling: 0.6 },
    ],
    icon: 'fireball',
  },
  {
    id: 'volley',
    name: 'Залп',
    description: 'Наносит урон всем врагам в радиусе 2 клеток',
    type: 'active',
    targetType: 'area',
    cooldown: 3,
    range: 4,
    areaSize: 2,
    effects: [
      { type: 'damage', value: 12, damageType: 'physical', attackScaling: 0.5 },
    ],
    icon: 'arrows',
  },
  {
    id: 'heal',
    name: 'Исцеление',
    description: 'Восстанавливает 25 HP союзнику',
    type: 'active',
    targetType: 'ally',
    cooldown: 2,
    range: 4,
    effects: [
      { type: 'heal', value: 25, attackScaling: 0.4 },
    ],
    icon: 'heal',
  },
  {
    id: 'piercing_shot',
    name: 'Пробивающий выстрел',
    description: 'Игнорирует 50% брони цели',
    type: 'active',
    targetType: 'enemy',
    cooldown: 2,
    range: 5,
    effects: [
      { type: 'damage', value: 25, damageType: 'physical', attackScaling: 0.8 },
    ],
    icon: 'crossbow',
  },
  {
    id: 'shield_wall',
    name: 'Стена щитов',
    description: 'Увеличивает броню на 50% на 2 хода',
    type: 'active',
    targetType: 'self',
    cooldown: 3,
    range: 0,
    effects: [
      { type: 'buff', stat: 'armor', percentage: 0.5, duration: 2 },
    ],
    icon: 'shield',
  },
  {
    id: 'rage',
    name: 'Ярость',
    description: '+50% к атаке при HP ниже 50%',
    type: 'passive',
    targetType: 'self',
    range: 0,
    effects: [
      { type: 'buff', stat: 'attack', percentage: 0.5, duration: 999 },
    ],
    icon: 'rage',
  },
];

/** Mock enemy units */
const mockEnemyUnits: PreviewUnit[] = [
  { id: 'enemy1', position: { x: 2, y: 7 }, stats: { ...mockStats, armor: 8 }, team: 'enemy', currentHp: 80, maxHp: 100 },
  { id: 'enemy2', position: { x: 3, y: 8 }, stats: { ...mockStats, armor: 3 }, team: 'enemy', currentHp: 100, maxHp: 100 },
  { id: 'enemy3', position: { x: 4, y: 7 }, stats: { ...mockStats, armor: 5 }, team: 'enemy', currentHp: 60, maxHp: 100 },
  { id: 'enemy4', position: { x: 5, y: 9 }, stats: { ...mockStats, armor: 10 }, team: 'enemy', currentHp: 120, maxHp: 120 },
];

/** Mock ally units */
const mockAllyUnits: PreviewUnit[] = [
  { id: 'ally1', position: { x: 1, y: 1 }, stats: mockStats, team: 'player', currentHp: 50, maxHp: 100 },
  { id: 'ally2', position: { x: 3, y: 0 }, stats: mockStats, team: 'player', currentHp: 80, maxHp: 100 },
];

// =============================================================================
// GRID COMPONENT
// =============================================================================

interface GridCellProps {
  position: Position;
  unit?: PreviewUnit;
  isCaster: boolean;
  isHovered: boolean;
  onHover: (pos: Position | null) => void;
}

function GridCell({ position, unit, isCaster, isHovered, onHover }: GridCellProps): JSX.Element {
  const isPlayerZone = position.y <= 1;
  const isEnemyZone = position.y >= 8;
  
  return (
    <div
      className={`
        relative w-12 h-12 border border-gray-600 transition-all duration-150
        ${isPlayerZone ? 'bg-blue-900/20' : isEnemyZone ? 'bg-red-900/20' : 'bg-gray-800/50'}
        ${isHovered ? 'ring-2 ring-yellow-400' : ''}
        cursor-crosshair
      `}
      onMouseEnter={() => onHover(position)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Coordinates */}
      <div className="absolute top-0 left-0 text-xs text-gray-500 leading-none">
        {position.x},{position.y}
      </div>
      
      {/* Unit display */}
      {unit && (
        <div className={`
          absolute inset-1 rounded flex items-center justify-center text-lg font-bold
          ${unit.team === 'player' ? 'bg-blue-600' : 'bg-red-600'}
          ${isCaster ? 'ring-2 ring-purple-400' : ''}
        `}>
          {unit.team === 'player' ? '🧙' : '👹'}
          
          {/* HP bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b">
            <div 
              className="h-full bg-green-500 rounded-b"
              style={{ width: `${(unit.currentHp / unit.maxHp) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function TestAbilityTargetingPage(): JSX.Element {
  const [selectedAbility, setSelectedAbility] = useState<AbilityPreviewData | null>(sampleAbilities[0] ?? null);
  const [casterPosition, setCasterPosition] = useState<Position>({ x: 2, y: 2 });
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  
  // Combine all units
  const allUnits = useMemo(() => {
    const casterUnit: PreviewUnit = {
      id: 'caster',
      position: casterPosition,
      stats: mockStats,
      team: 'player',
      currentHp: 100,
      maxHp: 100,
    };
    return [casterUnit, ...mockAllyUnits, ...mockEnemyUnits];
  }, [casterPosition]);
  
  // Find unit at position
  const getUnitAtPosition = (pos: Position): PreviewUnit | undefined => {
    return allUnits.find(u => u.position.x === pos.x && u.position.y === pos.y);
  };
  
  // Generate grid
  const grid = useMemo(() => {
    const cells: JSX.Element[] = [];
    
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 8; x++) {
        const position = { x, y };
        const unit = getUnitAtPosition(position);
        const isCaster = position.x === casterPosition.x && position.y === casterPosition.y;
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        
        cells.push(
          <GridCell
            key={`${x}-${y}`}
            position={position}
            unit={unit}
            isCaster={isCaster}
            isHovered={isHovered}
            onHover={setHoveredCell}
          />
        );
      }
    }
    
    return cells;
  }, [allUnits, casterPosition, hoveredCell]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🎯 Ability Targeting Preview Test</h1>
        <p className="text-gray-400 mb-6">
          Тестирование превью зоны действия способностей. Наведите на клетку для просмотра AoE.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Выбор способности</h2>
              <div className="space-y-2">
                {sampleAbilities.map(ability => (
                  <button
                    key={ability.id}
                    onClick={() => setSelectedAbility(ability)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-colors
                      ${selectedAbility?.id === ability.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}
                    `}
                  >
                    <div className="font-medium">{ability.name}</div>
                    <div className="text-xs text-gray-400">
                      {ability.type === 'passive' ? 'Пассивная' : `Range: ${ability.range}, CD: ${ability.cooldown}`}
                      {ability.areaSize && ` | AoE: ${ability.areaSize}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Позиция кастера</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-400">X:</label>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={casterPosition.x}
                    onChange={(e) => setCasterPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-gray-700 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Y:</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={casterPosition.y}
                    onChange={(e) => setCasterPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-gray-700 rounded text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Показать превью</span>
              </label>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Легенда</h2>
              <AbilityTargetingLegend />
            </div>
          </div>
          
          {/* Grid */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Поле боя (8×10)</h2>
              
              <div className="relative inline-block">
                <div 
                  className="grid gap-1"
                  style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
                >
                  {grid}
                </div>
                
                {/* Targeting Preview Overlay */}
                <AbilityTargetingPreview
                  ability={selectedAbility}
                  casterUnit={mockCasterUnit}
                  casterPosition={casterPosition}
                  units={allUnits}
                  hoveredCell={hoveredCell}
                  onCellHover={setHoveredCell}
                  isActive={showPreview}
                />
              </div>
              
              {/* Hovered cell info */}
              <div className="mt-4 text-sm text-gray-400">
                {hoveredCell ? (
                  <span>Наведено на: ({hoveredCell.x}, {hoveredCell.y})</span>
                ) : (
                  <span>Наведите на клетку для просмотра AoE</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Инструкции</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Выберите способность слева для просмотра её зоны действия</li>
            <li>• Синие клетки показывают дальность способности</li>
            <li>• Оранжевые клетки показывают область AoE при наведении</li>
            <li>• Красные клетки показывают врагов, которые будут задеты</li>
            <li>• Числа показывают предварительный расчёт урона</li>
            <li>• Измените позицию кастера для тестирования разных сценариев</li>
          </ul>
        </div>
        
        {/* Integration note */}
        <div className="mt-4 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-blue-300">📋 Интеграция в Team Builder</h2>
          <p className="text-sm text-gray-300 mb-2">
            Превью зоны действия способности теперь доступно в модальном окне просмотра юнита:
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Откройте Team Builder (главная страница)</li>
            <li>• Дважды кликните на юнита или долгое нажатие для открытия деталей</li>
            <li>• В секции &quot;Способности&quot; нажмите &quot;Показать превью зоны действия&quot;</li>
            <li>• Наведите на клетки мини-сетки для просмотра AoE</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
