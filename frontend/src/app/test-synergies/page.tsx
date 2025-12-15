/**
 * Test page for Synergy System verification.
 * Tests synergy detection, display, and UI integration.
 */

'use client';

import { useState } from 'react';
import { UnitTemplate, UnitId } from '@/types/game';
import { SynergyDisplay } from '@/components/SynergyDisplay';
import { TeamSummary } from '@/components/TeamSummary';

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_UNITS: UnitTemplate[] = [
  // Tanks
  {
    id: 'knight' as UnitId,
    name: 'Рыцарь',
    role: 'tank',
    cost: 5,
    stats: { hp: 120, atk: 15, armor: 8, speed: 2, initiative: 10, dodge: 5, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'guardian' as UnitId,
    name: 'Страж',
    role: 'tank',
    cost: 6,
    stats: { hp: 140, atk: 12, armor: 10, speed: 1, initiative: 8, dodge: 3, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'berserker' as UnitId,
    name: 'Берсерк',
    role: 'tank',
    cost: 5,
    stats: { hp: 100, atk: 20, armor: 5, speed: 3, initiative: 12, dodge: 8, atkCount: 1 },
    abilities: [],
  },
  // Mages
  {
    id: 'mage' as UnitId,
    name: 'Маг',
    role: 'mage',
    cost: 4,
    stats: { hp: 60, atk: 25, armor: 2, speed: 2, initiative: 15, dodge: 10, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'warlock' as UnitId,
    name: 'Чернокнижник',
    role: 'mage',
    cost: 5,
    stats: { hp: 70, atk: 30, armor: 1, speed: 2, initiative: 14, dodge: 8, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'elementalist' as UnitId,
    name: 'Элементалист',
    role: 'mage',
    cost: 6,
    stats: { hp: 65, atk: 28, armor: 3, speed: 3, initiative: 16, dodge: 12, atkCount: 1 },
    abilities: [],
  },
  // Melee DPS
  {
    id: 'rogue' as UnitId,
    name: 'Разбойник',
    role: 'melee_dps',
    cost: 4,
    stats: { hp: 80, atk: 22, armor: 3, speed: 4, initiative: 18, dodge: 20, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'duelist' as UnitId,
    name: 'Дуэлянт',
    role: 'melee_dps',
    cost: 5,
    stats: { hp: 85, atk: 24, armor: 4, speed: 3, initiative: 17, dodge: 18, atkCount: 1 },
    abilities: [],
  },
  // Ranged DPS
  {
    id: 'archer' as UnitId,
    name: 'Лучник',
    role: 'ranged_dps',
    cost: 3,
    stats: { hp: 70, atk: 20, armor: 2, speed: 3, initiative: 14, dodge: 15, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'crossbowman' as UnitId,
    name: 'Арбалетчик',
    role: 'ranged_dps',
    cost: 4,
    stats: { hp: 75, atk: 24, armor: 3, speed: 2, initiative: 13, dodge: 12, atkCount: 1 },
    abilities: [],
  },
  // Support
  {
    id: 'priest' as UnitId,
    name: 'Жрец',
    role: 'support',
    cost: 4,
    stats: { hp: 65, atk: 12, armor: 4, speed: 2, initiative: 12, dodge: 8, atkCount: 1 },
    abilities: [],
  },
  {
    id: 'bard' as UnitId,
    name: 'Бард',
    role: 'support',
    cost: 3,
    stats: { hp: 55, atk: 10, armor: 2, speed: 3, initiative: 16, dodge: 12, atkCount: 1 },
    abilities: [],
  },
  // Control
  {
    id: 'enchanter' as UnitId,
    name: 'Чародей',
    role: 'control',
    cost: 5,
    stats: { hp: 50, atk: 18, armor: 1, speed: 2, initiative: 20, dodge: 15, atkCount: 1 },
    abilities: [],
  },
];

// =============================================================================
// TEST SCENARIOS
// =============================================================================

interface TestScenario {
  name: string;
  description: string;
  units: Array<{ unitId: UnitId; position: { x: number; y: number } }>;
  expectedSynergies: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Передовая линия',
    description: '2+ танков для активации синергии Frontline (+10% HP)',
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 } },
      { unitId: 'guardian', position: { x: 1, y: 0 } },
    ],
    expectedSynergies: ['frontline'],
  },
  {
    name: 'Магический круг',
    description: '2+ магов для активации синергии Magic Circle (+15% ATK)',
    units: [
      { unitId: 'mage', position: { x: 0, y: 0 } },
      { unitId: 'warlock', position: { x: 1, y: 0 } },
    ],
    expectedSynergies: ['magic_circle'],
  },
  {
    name: 'Баланс',
    description: 'Танк + ближний боец + саппорт для синергии Balanced (+5% all)',
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 } },
      { unitId: 'rogue', position: { x: 1, y: 0 } },
      { unitId: 'priest', position: { x: 2, y: 0 } },
    ],
    expectedSynergies: ['balanced'],
  },
  {
    name: 'Стеклянная пушка',
    description: '3+ магов БЕЗ танков для синергии Glass Cannon (+25% ATK)',
    units: [
      { unitId: 'mage', position: { x: 0, y: 0 } },
      { unitId: 'warlock', position: { x: 1, y: 0 } },
      { unitId: 'elementalist', position: { x: 2, y: 0 } },
    ],
    expectedSynergies: ['glass_cannon', 'magic_circle'],
  },
  {
    name: 'Множественные синергии',
    description: 'Команда с несколькими активными синергиями',
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 } },    // Tank for Frontline + Balanced
      { unitId: 'guardian', position: { x: 1, y: 0 } },  // Tank for Frontline
      { unitId: 'rogue', position: { x: 2, y: 0 } },     // Melee DPS for Balanced
      { unitId: 'duelist', position: { x: 3, y: 0 } },   // Melee DPS for Assassin Guild
      { unitId: 'priest', position: { x: 4, y: 0 } },    // Support for Balanced
      { unitId: 'bard', position: { x: 5, y: 0 } },      // Support for Healing Aura
    ],
    expectedSynergies: ['frontline', 'balanced', 'assassin_guild', 'healing_aura'],
  },
  {
    name: 'Железная стена',
    description: '3+ танков для максимальной защиты (+20% Armor)',
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 } },
      { unitId: 'guardian', position: { x: 1, y: 0 } },
      { unitId: 'berserker', position: { x: 2, y: 0 } },
    ],
    expectedSynergies: ['frontline', 'iron_wall'],
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TestSynergiesPage() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(TEST_SCENARIOS[0]!);
  const [customUnits, setCustomUnits] = useState<Array<{ unitId: UnitId; position: { x: number; y: number } }>>([]);

  /**
   * Handle scenario selection.
   */
  const handleScenarioSelect = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setCustomUnits([]);
  };

  /**
   * Handle adding unit to custom team.
   */
  const handleAddUnit = (unitId: UnitId) => {
    const newPosition = { x: customUnits.length, y: 0 };
    setCustomUnits(prev => [...prev, { unitId, position: newPosition }]);
  };

  /**
   * Handle removing unit from custom team.
   */
  const handleRemoveUnit = (index: number) => {
    setCustomUnits(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Clear custom team.
   */
  const handleClearCustom = () => {
    setCustomUnits([]);
  };

  // Current team for display
  const currentTeam = customUnits.length > 0 ? customUnits : selectedScenario.units;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            🧪 Synergy System Test
          </h1>
          <p className="text-gray-400">
            Тестирование системы синергий: обнаружение, отображение и интеграция в UI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Test Scenarios */}
          <div className="space-y-6">
            {/* Scenario Selection */}
            <div>
              <h2 className="text-xl font-semibold text-blue-400 mb-4">
                📋 Тестовые сценарии
              </h2>
              <div className="space-y-2">
                {TEST_SCENARIOS.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => handleScenarioSelect(scenario)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedScenario === scenario
                        ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {scenario.description}
                    </div>
                    <div className="text-xs text-purple-400 mt-1">
                      Ожидаемые синергии: {scenario.expectedSynergies.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Team Builder */}
            <div>
              <h2 className="text-xl font-semibold text-green-400 mb-4">
                🛠️ Конструктор команды
              </h2>
              
              {/* Unit Selection */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Добавить юнита:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MOCK_UNITS.map(unit => (
                    <button
                      key={unit.id}
                      onClick={() => handleAddUnit(unit.id)}
                      className="text-left p-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    >
                      <div className="text-sm font-medium">{unit.name}</div>
                      <div className="text-xs text-gray-400">{unit.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Custom Team */}
              {customUnits.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-300">Текущая команда:</h3>
                    <button
                      onClick={handleClearCustom}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Очистить
                    </button>
                  </div>
                  <div className="space-y-1">
                    {customUnits.map((unit, index) => {
                      const template = MOCK_UNITS.find(u => u.id === unit.unitId);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-800 border border-gray-600 rounded"
                        >
                          <span className="text-sm">{template?.name}</span>
                          <button
                            onClick={() => handleRemoveUnit(index)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {/* Current Team Display */}
            <div>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">
                👥 Текущая команда
              </h2>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                {currentTeam.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    Команда пуста
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentTeam.map((unit, index) => {
                      const template = MOCK_UNITS.find(u => u.id === unit.unitId);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        >
                          <span className="font-medium">{template?.name}</span>
                          <span className="text-sm text-gray-400">{template?.role}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Synergy Display - Standalone */}
            <div>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">
                ⚡ Синергии (отдельный компонент)
              </h2>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <SynergyDisplay
                  units={currentTeam}
                  unitTemplates={MOCK_UNITS}
                  variant="full"
                />
              </div>
            </div>

            {/* Team Summary with Synergies */}
            <div>
              <h2 className="text-xl font-semibold text-blue-400 mb-4">
                📊 Сводка команды (с синергиями)
              </h2>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <TeamSummary
                  units={currentTeam}
                  unitTemplates={MOCK_UNITS}
                  variant="full"
                />
              </div>
            </div>

            {/* Compact Variants */}
            <div>
              <h2 className="text-xl font-semibold text-orange-400 mb-4">
                📱 Компактные варианты
              </h2>
              <div className="space-y-4">
                {/* Compact Synergy Display */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Синергии (компактно):</h3>
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                    <SynergyDisplay
                      units={currentTeam}
                      unitTemplates={MOCK_UNITS}
                      variant="compact"
                    />
                  </div>
                </div>

                {/* Compact Team Summary */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Сводка команды (компактно):</h3>
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                    <TeamSummary
                      units={currentTeam}
                      unitTemplates={MOCK_UNITS}
                      variant="compact"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">
            ✅ Проверочный список
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-400 mb-1">Синергии определяются корректно:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Frontline: 2+ танков</li>
                <li>• Magic Circle: 2+ магов</li>
                <li>• Glass Cannon: 3+ магов БЕЗ танков</li>
                <li>• Balanced: танк + ближний + саппорт</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-400 mb-1">UI отображается правильно:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Иконки и названия синергий</li>
                <li>• Описания бонусов</li>
                <li>• Компактный и полный варианты</li>
                <li>• Интеграция в TeamSummary</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}