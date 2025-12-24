/**
 * Test page for StatusEffects component.
 * Demonstrates all component variants and states.
 * 
 * @fileoverview Comprehensive test page for status effect indicators.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { StatusEffects, StatusEffectData, CompactStatusEffects, StatusEffectsSkeleton } from '@/components/StatusEffects';

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Sample status effect data for testing.
 */
const SAMPLE_EFFECTS: StatusEffectData[] = [
  {
    id: 'buff_1',
    type: 'buff',
    name: 'Усиление атаки',
    description: '+50% к атаке на 3 хода',
    remainingDuration: 3,
    stacks: 1,
    isPositive: true,
    sourceAbility: 'Вдохновение',
    sourceUnit: 'Бард',
  },
  {
    id: 'shield_1',
    type: 'shield',
    name: 'Магический щит',
    description: 'Поглощает 25 урона',
    remainingDuration: 2,
    stacks: 1,
    isPositive: true,
    sourceAbility: 'Стена щитов',
    sourceUnit: 'Рыцарь',
  },
  {
    id: 'debuff_1',
    type: 'debuff',
    name: 'Ослабление брони',
    description: '-30% к броне на 2 хода',
    remainingDuration: 2,
    stacks: 2,
    isPositive: false,
    sourceAbility: 'Пробивающий выстрел',
    sourceUnit: 'Арбалетчик',
  },
  {
    id: 'dot_1',
    type: 'dot',
    name: 'Горение',
    description: '5 урона огнем каждый ход',
    remainingDuration: 4,
    stacks: 1,
    isPositive: false,
    sourceAbility: 'Огненный шар',
    sourceUnit: 'Маг',
  },
  {
    id: 'hot_1',
    type: 'hot',
    name: 'Регенерация',
    description: '+8 HP каждый ход',
    remainingDuration: 3,
    stacks: 1,
    isPositive: true,
    sourceAbility: 'Исцеление',
    sourceUnit: 'Жрец',
  },
  {
    id: 'stun_1',
    type: 'stun',
    name: 'Оглушение',
    description: 'Пропускает следующий ход',
    remainingDuration: 1,
    stacks: 1,
    isPositive: false,
    sourceAbility: 'Оглушение',
    sourceUnit: 'Чародей',
  },
];

/**
 * Different effect combinations for testing.
 */
const EXTRA_EFFECTS: StatusEffectData[] = [
  {
    id: 'extra_1',
    type: 'taunt',
    name: 'Провокация',
    description: 'Враги атакуют только этого юнита',
    remainingDuration: 2,
    stacks: 1,
    isPositive: true,
    sourceAbility: 'Провокация',
    sourceUnit: 'Страж',
  },
  {
    id: 'extra_2',
    type: 'cleanse',
    name: 'Очищение',
    description: 'Снимает все дебаффы',
    remainingDuration: 0,
    stacks: 1,
    isPositive: true,
    sourceAbility: 'Очищение',
    sourceUnit: 'Жрец',
  },
];

const EFFECT_COMBINATIONS = {
  buffs: SAMPLE_EFFECTS.filter(e => e.isPositive),
  debuffs: SAMPLE_EFFECTS.filter(e => !e.isPositive),
  mixed: SAMPLE_EFFECTS,
  single: [SAMPLE_EFFECTS[0]].filter((e): e is StatusEffectData => e !== undefined),
  many: [...SAMPLE_EFFECTS, ...EXTRA_EFFECTS],
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Test page for status effects components.
 * 
 * @returns JSX element
 */
export default function TestStatusEffectsPage(): JSX.Element {
  const [selectedCombination, setSelectedCombination] = useState<keyof typeof EFFECT_COMBINATIONS>('mixed');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltips, setShowTooltips] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showStacks, setShowStacks] = useState(true);
  
  const currentEffects = EFFECT_COMBINATIONS[selectedCombination];
  
  /**
   * Toggle loading state.
   */
  const toggleLoading = (): void => {
    setIsLoading(!isLoading);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Status Effects Test
          </h1>
          <p className="text-gray-600">
            Тестирование компонента StatusEffects
          </p>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Управление</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Набор эффектов
              </label>
              <select
                value={selectedCombination}
                onChange={(e) => setSelectedCombination(e.target.value as keyof typeof EFFECT_COMBINATIONS)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="mixed">Смешанные (6 эффектов)</option>
                <option value="buffs">Только баффы (3 эффекта)</option>
                <option value="debuffs">Только дебаффы (3 эффекта)</option>
                <option value="single">Один эффект</option>
                <option value="many">Много эффектов (8 эффектов)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTooltips}
                  onChange={(e) => setShowTooltips(e.target.checked)}
                  className="mr-2"
                />
                Показывать tooltips
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showDuration}
                  onChange={(e) => setShowDuration(e.target.checked)}
                  className="mr-2"
                />
                Показывать длительность
              </label>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showStacks}
                  onChange={(e) => setShowStacks(e.target.checked)}
                  className="mr-2"
                />
                Показывать стаки
              </label>
              <button
                onClick={toggleLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isLoading ? 'Отключить загрузку' : 'Включить загрузку'}
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Текущий набор:</strong></p>
              <p>Эффектов: {currentEffects.length}</p>
              <p>Баффов: {currentEffects.filter(e => e.isPositive).length}</p>
              <p>Дебаффов: {currentEffects.filter(e => !e.isPositive).length}</p>
            </div>
          </div>
        </div>
        
        {/* Size Variants */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Размеры</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Small (24px)</h3>
              {isLoading ? (
                <StatusEffectsSkeleton size="sm" count={3} />
              ) : (
                <StatusEffects
                  effects={currentEffects}
                  size="sm"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Medium (32px)</h3>
              {isLoading ? (
                <StatusEffectsSkeleton size="md" count={3} />
              ) : (
                <StatusEffects
                  effects={currentEffects}
                  size="md"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Large (40px)</h3>
              {isLoading ? (
                <StatusEffectsSkeleton size="lg" count={3} />
              ) : (
                <StatusEffects
                  effects={currentEffects}
                  size="lg"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Orientations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ориентация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Горизонтальная</h3>
              <StatusEffects
                effects={currentEffects}
                orientation="horizontal"
                showTooltips={showTooltips}
                showDuration={showDuration}
                showStacks={showStacks}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Вертикальная</h3>
              <StatusEffects
                effects={currentEffects}
                orientation="vertical"
                showTooltips={showTooltips}
                showDuration={showDuration}
                showStacks={showStacks}
              />
            </div>
          </div>
        </div>
        
        {/* Positions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Позиции относительно юнита</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <h3 className="text-sm font-medium mb-2">Сверху</h3>
              <div className="relative inline-block">
                <StatusEffects
                  effects={currentEffects.slice(0, 3)}
                  position="above"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
                <div className="w-16 h-16 bg-blue-200 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                  🛡️
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-sm font-medium mb-2">Снизу</h3>
              <div className="relative inline-block">
                <div className="w-16 h-16 bg-blue-200 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                  🛡️
                </div>
                <StatusEffects
                  effects={currentEffects.slice(0, 3)}
                  position="below"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-sm font-medium mb-2">Слева</h3>
              <div className="relative inline-flex items-center">
                <StatusEffects
                  effects={currentEffects.slice(0, 2)}
                  position="left"
                  orientation="vertical"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
                <div className="w-16 h-16 bg-blue-200 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                  🛡️
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-sm font-medium mb-2">Справа</h3>
              <div className="relative inline-flex items-center">
                <div className="w-16 h-16 bg-blue-200 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                  🛡️
                </div>
                <StatusEffects
                  effects={currentEffects.slice(0, 2)}
                  position="right"
                  orientation="vertical"
                  showTooltips={showTooltips}
                  showDuration={showDuration}
                  showStacks={showStacks}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Variant */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Компактный вариант</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">CompactStatusEffects</h3>
              <p className="text-sm text-gray-600 mb-2">
                Максимум 3 эффекта, маленький размер, без стаков
              </p>
              <CompactStatusEffects effects={currentEffects} />
            </div>
          </div>
        </div>
        
        {/* Effect Types Demo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Типы эффектов</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_EFFECTS.map((effect) => (
              <div key={effect.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <StatusEffects
                    effects={[effect]}
                    showTooltips={false}
                    showDuration={true}
                    showStacks={true}
                  />
                  <div>
                    <h4 className="font-medium">{effect.name}</h4>
                    <p className="text-sm text-gray-600">{effect.type}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{effect.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <span className={effect.isPositive ? 'text-green-600' : 'text-red-600'}>
                    {effect.isPositive ? 'Бафф' : 'Дебафф'}
                  </span>
                  {effect.stacks > 1 && ` • ${effect.stacks} стаков`}
                  {effect.remainingDuration > 0 && ` • ${effect.remainingDuration} ходов`}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Component Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Информация о компоненте</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">StatusEffects</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Отображает иконки баффов/дебаффов</li>
                <li>• Цветовая кодировка: зелёный (баффы), красный (дебаффы)</li>
                <li>• Счетчик оставшихся ходов</li>
                <li>• Tooltip с описанием эффекта</li>
                <li>• Поддержка стаков эффектов</li>
                <li>• Мобильная поддержка с долгим нажатием</li>
                <li>• Автоматическая сортировка (баффы первыми)</li>
                <li>• Индикатор переполнения (+N)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Использование</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>BattleGrid:</strong> над юнитами в бою</li>
                <li>• <strong>BattleReplay:</strong> показ эффектов в реплее</li>
                <li>• <strong>UnitCard:</strong> текущие эффекты юнита</li>
                <li>• <strong>Размеры:</strong> sm (24px), md (32px), lg (40px)</li>
                <li>• <strong>Позиции:</strong> above, below, left, right</li>
                <li>• <strong>Ориентация:</strong> horizontal, vertical</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Mobile Testing Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">📱 Мобильное тестирование</h2>
          <div className="space-y-3 text-blue-700">
            <div>
              <h3 className="font-medium">Tooltip на мобильных:</h3>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Долгое нажатие (500мс) на иконку эффекта</li>
                <li>• Кнопка закрытия (×) в углу tooltip</li>
                <li>• Движение пальца отменяет показ tooltip</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Проверить:</h3>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Читаемость счетчиков на маленьких иконках</li>
                <li>• Позиционирование tooltip на краях экрана</li>
                <li>• Различимость цветов баффов/дебаффов</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}