/**
 * Test page for AbilityIcon and AbilityBar components.
 * Demonstrates all component variants and states.
 * 
 * @fileoverview Comprehensive test page for ability UI components.
 */

'use client';

import React, { useState } from 'react';
import { AbilityIcon, AbilityData } from '@/components/AbilityIcon';
import { AbilityBar, UnitAbilityData, CompactAbilityBar, VerticalAbilityBar } from '@/components/AbilityBar';

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Sample ability data for testing.
 */
const FIREBALL_ABILITY: AbilityData = {
  id: 'fireball',
  name: 'Огненный шар',
  description: 'Наносит 30 магического урона в радиусе 1 клетки',
  type: 'active',
  icon: 'fireball',
  cooldown: 2,
  currentCooldown: 0,
  isReady: true,
};

const SHIELD_ABILITY: AbilityData = {
  id: 'shield_wall',
  name: 'Стена щитов',
  description: 'Увеличивает броню на 50% на 2 хода',
  type: 'active',
  icon: 'shield',
  cooldown: 3,
  currentCooldown: 2,
  isReady: false,
};

const BACKSTAB_ABILITY: AbilityData = {
  id: 'backstab',
  name: 'Удар в спину',
  description: '+100% урона при атаке сзади',
  type: 'passive',
  icon: 'dagger',
};

const HEAL_ABILITY: AbilityData = {
  id: 'heal',
  name: 'Исцеление',
  description: 'Восстанавливает 25 HP союзнику',
  type: 'active',
  icon: 'heal',
  cooldown: 2,
  currentCooldown: 1,
  isReady: false,
};

const SAMPLE_ABILITIES: AbilityData[] = [
  FIREBALL_ABILITY,
  SHIELD_ABILITY,
  BACKSTAB_ABILITY,
  HEAL_ABILITY,
];

/**
 * Sample unit data for testing.
 */
const SAMPLE_UNITS: UnitAbilityData[] = [
  {
    unitId: 'mage',
    unitName: 'Маг',
    abilities: [FIREBALL_ABILITY],
    isSelected: true,
    isAlive: true,
  },
  {
    unitId: 'knight',
    unitName: 'Рыцарь',
    abilities: [SHIELD_ABILITY],
    isSelected: false,
    isAlive: true,
  },
  {
    unitId: 'rogue',
    unitName: 'Разбойник',
    abilities: [BACKSTAB_ABILITY],
    isSelected: false,
    isAlive: true,
  },
  {
    unitId: 'priest',
    unitName: 'Жрец (Мертв)',
    abilities: [HEAL_ABILITY],
    isSelected: false,
    isAlive: false,
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Test page for ability components.
 * 
 * @returns JSX element
 */
export default function TestAbilityComponentsPage(): JSX.Element {
  const [selectedUnit, setSelectedUnit] = useState<UnitAbilityData | undefined>(SAMPLE_UNITS[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Handle ability click.
   * 
   * @param ability - Clicked ability
   * @param unit - Unit that owns the ability
   */
  const handleAbilityClick = (ability: AbilityData, unit: UnitAbilityData): void => {
    console.log('Ability clicked:', ability.name, 'from unit:', unit.unitName);
    alert(`Использована способность: ${ability.name}\nОт юнита: ${unit.unitName}`);
  };
  
  /**
   * Toggle loading state.
   */
  const toggleLoading = (): void => {
    setIsLoading(!isLoading);
  };
  
  /**
   * Select unit for ability bar.
   * 
   * @param unit - Unit to select
   */
  const selectUnit = (unit: UnitAbilityData): void => {
    setSelectedUnit(unit);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ability Components Test
          </h1>
          <p className="text-gray-600">
            Тестирование компонентов AbilityIcon и AbilityBar
          </p>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Управление</h2>
          <div className="flex gap-4">
            <button
              onClick={toggleLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isLoading ? 'Отключить загрузку' : 'Включить загрузку'}
            </button>
            
            <select
              value={selectedUnit?.unitId || ''}
              onChange={(e) => {
                const unit = SAMPLE_UNITS.find(u => u.unitId === e.target.value);
                setSelectedUnit(unit);
              }}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Нет выбранного юнита</option>
              {SAMPLE_UNITS.map(unit => (
                <option key={unit.unitId} value={unit.unitId}>
                  {unit.unitName}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* AbilityIcon Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AbilityIcon Компонент</h2>
          
          {/* Size Variants */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Размеры</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <AbilityIcon ability={FIREBALL_ABILITY} size="sm" />
                <p className="text-sm text-gray-600 mt-1">Small</p>
              </div>
              <div className="text-center">
                <AbilityIcon ability={FIREBALL_ABILITY} size="md" />
                <p className="text-sm text-gray-600 mt-1">Medium</p>
              </div>
              <div className="text-center">
                <AbilityIcon ability={FIREBALL_ABILITY} size="lg" />
                <p className="text-sm text-gray-600 mt-1">Large</p>
              </div>
            </div>
          </div>
          
          {/* State Variants */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Состояния</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <AbilityIcon 
                  ability={FIREBALL_ABILITY} 
                  onClick={(ability) => console.log('Ready ability:', ability.name)}
                />
                <p className="text-sm text-gray-600 mt-1">Готова</p>
              </div>
              <div className="text-center">
                <AbilityIcon ability={SHIELD_ABILITY} />
                <p className="text-sm text-gray-600 mt-1">Перезарядка</p>
              </div>
              <div className="text-center">
                <AbilityIcon ability={BACKSTAB_ABILITY} />
                <p className="text-sm text-gray-600 mt-1">Пассивная</p>
              </div>
              <div className="text-center">
                <AbilityIcon 
                  ability={{...FIREBALL_ABILITY, isDisabled: true}} 
                />
                <p className="text-sm text-gray-600 mt-1">Отключена</p>
              </div>
            </div>
          </div>
          
          {/* All Abilities */}
          <div>
            <h3 className="text-lg font-medium mb-3">Все способности</h3>
            <div className="flex items-center gap-3">
              {SAMPLE_ABILITIES.map(ability => (
                <AbilityIcon
                  key={ability.id}
                  ability={ability}
                  onClick={(ability) => console.log('Clicked:', ability.name)}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* AbilityBar Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AbilityBar Компонент</h2>
          
          {/* Standard AbilityBar */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Стандартная панель</h3>
            <AbilityBar
              unit={selectedUnit}
              isLoading={isLoading}
              onAbilityClick={handleAbilityClick}
            />
          </div>
          
          {/* Compact AbilityBar */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Компактная панель</h3>
            <CompactAbilityBar
              unit={selectedUnit}
              onAbilityClick={handleAbilityClick}
            />
          </div>
          
          {/* Vertical AbilityBar */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Вертикальная панель</h3>
            <div className="max-w-xs">
              <VerticalAbilityBar
                unit={selectedUnit}
                onAbilityClick={handleAbilityClick}
              />
            </div>
          </div>
        </div>
        
        {/* Unit Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Выбор юнита</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_UNITS.map(unit => (
              <div
                key={unit.unitId}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUnit?.unitId === unit.unitId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectUnit(unit)}
              >
                <AbilityBar
                  unit={unit}
                  onAbilityClick={handleAbilityClick}
                  showUnitName={true}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Component Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Информация о компонентах</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">AbilityIcon</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Отображает иконку способности</li>
                <li>• Показывает tooltip с описанием</li>
                <li>• Индикатор cooldown (затемнение + число)</li>
                <li>• Подсветка когда готова к использованию</li>
                <li>• Поддержка пассивных способностей</li>
                <li>• Три размера: sm, md, lg</li>
                <li>• <strong>Мобильная поддержка:</strong> долгое нажатие (500мс) для tooltip</li>
                <li>• Кнопка закрытия tooltip на мобильных</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">AbilityBar</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Список способностей юнита</li>
                <li>• Отображается при выборе юнита</li>
                <li>• Горизонтальная и вертикальная ориентация</li>
                <li>• Состояния загрузки и пустого списка</li>
                <li>• Компактный и полный варианты</li>
                <li>• Поддержка мертвых юнитов</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Mobile Testing Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">📱 Инструкции для тестирования на мобильных</h2>
          <div className="space-y-3 text-blue-700">
            <div>
              <h3 className="font-medium">Tooltip на мобильных устройствах:</h3>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Долгое нажатие</strong> (500мс) на иконку способности для показа tooltip</li>
                <li>• Tooltip появляется с кнопкой закрытия (×) в правом верхнем углу</li>
                <li>• Нажмите кнопку × или коснитесь вне tooltip для закрытия</li>
                <li>• Движение пальца во время долгого нажатия отменяет показ tooltip</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Тестирование функциональности:</h3>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Проверьте различимость иконок на маленьком экране</li>
                <li>• Убедитесь, что cooldown числа читаемы</li>
                <li>• Проверьте, что tooltip не выходит за границы экрана</li>
                <li>• Тестируйте на разных размерах экрана (sm, md, lg иконки)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}